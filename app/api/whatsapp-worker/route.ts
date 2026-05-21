import { NextRequest, NextResponse } from 'next/server';

// Proxy requests from the Next.js admin panel to the persistent Baileys worker.
// Supported actions: status, send, send-bulk, disconnect, reconnect

// Read env vars inside functions, not at module load time, so that values
// written via /api/settings (process.env mutation) are always picked up.
function workerConfig() {
  return {
    url:    process.env.WHATSAPP_WORKER_URL,
    secret: process.env.WHATSAPP_WORKER_SECRET,
  };
}

function workerHeaders(secret: string) {
  return {
    'Content-Type': 'application/json',
    'x-worker-secret': secret,
  };
}

export async function GET(_req: NextRequest) {
  const { url, secret } = workerConfig();
  if (!url) {
    return NextResponse.json({ error: 'WHATSAPP_WORKER_URL not configured.' }, { status: 500 });
  }

  try {
    const res = await fetch(`${url}/status`, { headers: workerHeaders(secret ?? '') });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Worker unreachable: ' + (err instanceof Error ? err.message : String(err)) }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const { url, secret } = workerConfig();
  if (!url) {
    return NextResponse.json({ error: 'WHATSAPP_WORKER_URL not configured.' }, { status: 500 });
  }

  const body = await req.json();
  const { action, ...payload } = body;

  const validActions = ['send', 'send-bulk', 'disconnect', 'reconnect'];
  if (!action || !validActions.includes(action)) {
    return NextResponse.json({ error: `Invalid action. Must be one of: ${validActions.join(', ')}` }, { status: 400 });
  }

  try {
    const res = await fetch(`${url}/${action}`, {
      method: 'POST',
      headers: workerHeaders(secret ?? ''),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Worker unreachable: ' + (err instanceof Error ? err.message : String(err)) }, { status: 503 });
  }
}
