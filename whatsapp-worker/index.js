import express from 'express';
import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import pino from 'pino';
import { readFileSync, existsSync } from 'fs';
import 'dotenv/config';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;
const WORKER_SECRET = process.env.WORKER_SECRET || '';
const SESSION_DIR = './session';

// ─────────────────────────────────────────────
// State
// ─────────────────────────────────────────────
let sock = null;
let qrCodeData = null;       // base64 QR image
let connectionStatus = 'disconnected'; // disconnected | connecting | qr_ready | connected
let reconnectTimer = null;

// ─────────────────────────────────────────────
// Auth middleware
// ─────────────────────────────────────────────
function auth(req, res, next) {
  const secret = req.headers['x-worker-secret'];
  if (!WORKER_SECRET || secret !== WORKER_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// ─────────────────────────────────────────────
// Baileys connection
// ─────────────────────────────────────────────
async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  const { version } = await fetchLatestBaileysVersion();

  connectionStatus = 'connecting';
  qrCodeData = null;

  sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ['Spacze', 'Chrome', '1.0.0'],
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      // New QR code — convert to base64 image for the dashboard
      qrCodeData = await QRCode.toDataURL(qr);
      connectionStatus = 'qr_ready';
      console.log('[Spacze Worker] QR code ready — scan in admin panel');
    }

    if (connection === 'open') {
      connectionStatus = 'connected';
      qrCodeData = null;
      console.log('[Spacze Worker] WhatsApp connected ✓');
    }

    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const shouldReconnect = reason !== DisconnectReason.loggedOut;

      console.log(`[Spacze Worker] Connection closed. Reason: ${reason}. Reconnect: ${shouldReconnect}`);

      connectionStatus = 'disconnected';
      sock = null;

      if (shouldReconnect) {
        // Exponential backoff — wait 5s before reconnecting
        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(connectToWhatsApp, 5000);
      } else {
        // Logged out — clear session so QR is shown fresh
        console.log('[Spacze Worker] Logged out. Clear session to re-authenticate.');
      }
    }
  });
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

// Normalise phone number to WhatsApp JID format
function toJid(phone) {
  const digits = phone.replace(/\D/g, '');
  return `${digits}@s.whatsapp.net`;
}

// Random delay between min and max milliseconds
function randomDelay(minMs, maxMs) {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────

// Health check (no auth — Railway uses this)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', connection: connectionStatus });
});

// GET /status — connection state + QR if pending
app.get('/status', auth, (req, res) => {
  res.json({
    status: connectionStatus,
    qr: connectionStatus === 'qr_ready' ? qrCodeData : null,
  });
});

// POST /disconnect — log out and clear session
app.post('/disconnect', auth, async (req, res) => {
  try {
    if (sock) await sock.logout();
  } catch (_) {}
  sock = null;
  connectionStatus = 'disconnected';
  res.json({ success: true });
});

// POST /reconnect — force a fresh connection attempt
app.post('/reconnect', auth, async (req, res) => {
  clearTimeout(reconnectTimer);
  await connectToWhatsApp();
  res.json({ success: true, status: connectionStatus });
});

// POST /send — send a single message
// Body: { to: "+2348012345678", message: "Hello" }
app.post('/send', auth, async (req, res) => {
  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).json({ error: 'Missing required fields: to, message' });
  }

  if (connectionStatus !== 'connected' || !sock) {
    return res.status(503).json({ error: 'WhatsApp not connected. Scan QR first.' });
  }

  try {
    const jid = toJid(to);
    await sock.sendMessage(jid, { text: message });
    res.json({ success: true, to });
  } catch (err) {
    console.error('[Spacze Worker] Send error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /send-bulk — send to multiple leads with rate limiting
// Body: { messages: [{ to: "+234...", message: "..." }, ...], delayMin: 30000, delayMax: 60000 }
app.post('/send-bulk', auth, async (req, res) => {
  const { messages, delayMin = 30000, delayMax = 60000 } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages must be a non-empty array' });
  }

  if (connectionStatus !== 'connected' || !sock) {
    return res.status(503).json({ error: 'WhatsApp not connected. Scan QR first.' });
  }

  // Respond immediately — bulk send runs in background
  res.json({ success: true, total: messages.length, message: 'Bulk send started' });

  // Process in background with delays
  (async () => {
    const results = [];
    for (let i = 0; i < messages.length; i++) {
      const { to, message } = messages[i];
      try {
        const jid = toJid(to);
        await sock.sendMessage(jid, { text: message });
        results.push({ to, status: 'sent' });
        console.log(`[Spacze Worker] Sent ${i + 1}/${messages.length} → ${to}`);
      } catch (err) {
        results.push({ to, status: 'failed', error: err.message });
        console.error(`[Spacze Worker] Failed → ${to}:`, err.message);
      }

      // Delay between messages (skip after last one)
      if (i < messages.length - 1) {
        const delay = randomDelay(delayMin, delayMax);
        console.log(`[Spacze Worker] Waiting ${Math.round(delay / 1000)}s before next message...`);
        await delay;
      }
    }
    console.log('[Spacze Worker] Bulk send complete:', results);
  })();
});

// ─────────────────────────────────────────────
// Start
// ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[Spacze Worker] Running on port ${PORT}`);
  connectToWhatsApp();
});
