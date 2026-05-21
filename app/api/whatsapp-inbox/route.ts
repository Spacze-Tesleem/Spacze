import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// ─────────────────────────────────────────────
// GET /api/whatsapp-inbox
// Returns all WhatsApp messages (inbound + outbound) grouped into
// conversations keyed by phone number, newest conversation first.
//
// Response shape:
// [
//   {
//     phone: "+234...",
//     lead_id: "uuid" | null,
//     business_name: "Dunnies Collections" | null,
//     last_message: "...",
//     last_at: "ISO",
//     unread: number,          // inbound messages count
//     messages: [
//       { id, phone, message, direction, received_at }
//     ]
//   }
// ]
// ─────────────────────────────────────────────

export async function GET(_req: NextRequest) {
  const db = getSupabaseAdmin();

  // Fetch all messages ordered oldest→newest so threads render correctly
  const { data: rows, error } = await db
    .from('whatsapp_replies')
    .select('id, lead_id, phone, message, direction, received_at')
    .order('received_at', { ascending: true });

  if (error) {
    if (error.code === '42P01') return NextResponse.json([]); // table not yet created
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!rows || rows.length === 0) return NextResponse.json([]);

  // Fetch lead names for any lead_ids present
  const leadIds = [...new Set(rows.map((r: { lead_id: string | null }) => r.lead_id).filter(Boolean))] as string[];
  const leadMap: Record<string, string> = {};
  if (leadIds.length > 0) {
    const { data: leads } = await db
      .from('leads')
      .select('id, business_name')
      .in('id', leadIds);
    (leads ?? []).forEach((l: { id: string; business_name: string }) => {
      leadMap[l.id] = l.business_name;
    });
  }

  // Group by phone
  const convMap = new Map<string, {
    phone: string;
    lead_id: string | null;
    business_name: string | null;
    messages: typeof rows;
  }>();

  for (const row of rows) {
    if (!convMap.has(row.phone)) {
      convMap.set(row.phone, {
        phone: row.phone,
        lead_id: row.lead_id,
        business_name: row.lead_id ? (leadMap[row.lead_id] ?? null) : null,
        messages: [],
      });
    }
    convMap.get(row.phone)!.messages.push(row);
  }

  // Build response — sort conversations by most recent message
  const conversations = [...convMap.values()].map(conv => {
    const last = conv.messages[conv.messages.length - 1];
    const unread = conv.messages.filter((m: { direction: string }) => m.direction === 'inbound').length;
    return {
      phone:         conv.phone,
      lead_id:       conv.lead_id,
      business_name: conv.business_name,
      last_message:  last.message,
      last_at:       last.received_at,
      unread,
      messages:      conv.messages,
    };
  }).sort((a, b) => new Date(b.last_at).getTime() - new Date(a.last_at).getTime());

  return NextResponse.json(conversations);
}

// ─────────────────────────────────────────────
// POST /api/whatsapp-inbox
// Send a reply from the inbox UI. Forwards to the Baileys worker and
// records the outbound message in whatsapp_replies.
// Body: { phone: "+234...", message: "...", lead_id?: "uuid" }
// ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { phone, message, lead_id } = await req.json();
  if (!phone || !message) {
    return NextResponse.json({ error: 'Missing phone or message' }, { status: 400 });
  }

  const workerUrl    = process.env.WHATSAPP_WORKER_URL;
  const workerSecret = process.env.WHATSAPP_WORKER_SECRET ?? '';

  if (!workerUrl) {
    return NextResponse.json({ error: 'WHATSAPP_WORKER_URL not configured.' }, { status: 500 });
  }

  // Send via Baileys worker
  const res = await fetch(`${workerUrl}/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-worker-secret': workerSecret },
    body: JSON.stringify({ to: phone, message }),
  });

  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    return NextResponse.json({ error: (d as { error?: string }).error || 'Worker send failed' }, { status: 502 });
  }

  // Record outbound message
  const db = getSupabaseAdmin();
  const sentAt = new Date().toISOString();

  await db.from('whatsapp_replies').insert({
    lead_id:    lead_id ?? null,
    phone,
    message,
    direction:  'outbound',
    received_at: sentAt,
  });

  return NextResponse.json({ success: true });
}
