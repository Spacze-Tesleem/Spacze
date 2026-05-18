import { NextRequest, NextResponse } from 'next/server';

// Proxy requests from the Next.js admin panel to the persistent Baileys worker.
// Supported actions: status, send, send-bulk, disconnect, reconnect

const WORKER_URL = process.env.WHATSAPP_WORKER_URL;
const WORKER_SECRET = process.env.WHATSAPP_WORKER_SECRET;

function workerHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-worker-secret': WORKER_SECRET || '',
  };
}

export async function GET(req: NextRequest) {
  if (!WORKER_URL) {
    return NextResponse.json({ error: 'WHATSAPP_WORKER_URL not configured.' }, { status: 500 });
  }

  try {
    const res = await fetch(`${WORKER_URL}/status`, { headers: workerHeaders() });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ error: 'Worker unreachable: ' + err.message }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  if (!WORKER_URL) {
    return NextResponse.json({ error: 'WHATSAPP_WORKER_URL not configured.' }, { status: 500 });
  }

  const body = await req.json();
  const { action, ...payload } = body;

  const validActions = ['send', 'send-bulk', 'disconnect', 'reconnect'];
  if (!action || !validActions.includes(action)) {
    return NextResponse.json({ error: `Invalid action. Must be one of: ${validActions.join(', ')}` }, { status: 400 });
  }

  try {
    const res = await fetch(`${WORKER_URL}/${action}`, {
      method: 'POST',
      headers: workerHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ error: 'Worker unreachable: ' + err.message }, { status: 503 });
  }
}
