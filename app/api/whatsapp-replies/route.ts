import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// ─────────────────────────────────────────────
// POST /api/whatsapp-replies
// Called by the Baileys worker whenever a contact replies.
// Body: { phone: "+234...", message: "...", received_at: "ISO string" }
// ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Verify the request came from our worker
  const secret = req.headers.get('x-spacze-secret');
  if (process.env.SPACZE_APP_SECRET && secret !== process.env.SPACZE_APP_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { phone, message, received_at } = await req.json();
  if (!phone || !message) {
    return NextResponse.json({ error: 'Missing phone or message' }, { status: 400 });
  }

  const db = getSupabaseAdmin();

  // Look up the lead by whatsapp_number — normalise both sides to digits only
  const digits = phone.replace(/\D/g, '');
  const { data: leads } = await db
    .from('leads')
    .select('id, whatsapp_number')
    .ilike('whatsapp_number', `%${digits.slice(-9)}`); // match last 9 digits to handle prefix variants

  const lead = leads?.[0] ?? null;

  // Insert the reply record
  const { data, error } = await db
    .from('whatsapp_replies')
    .insert({
      lead_id:     lead?.id ?? null,
      phone,
      message,
      received_at: received_at ?? new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    // Table may not exist yet — return 200 so the worker doesn't retry endlessly
    console.error('whatsapp-replies insert error:', error.message);
    return NextResponse.json({ warning: error.message }, { status: 200 });
  }

  // Mark the lead as having replied
  if (lead?.id) {
    await db
      .from('leads')
      .update({ reply_received: true, response_status: 'replied' })
      .eq('id', lead.id);

    // Cancel any remaining pending WhatsApp messages for this lead
    // so we don't keep sending after they've responded
    await db
      .from('scheduled_messages')
      .update({ status: 'cancelled' })
      .eq('lead_id', lead.id)
      .eq('channel', 'whatsapp')
      .eq('status', 'pending');

    // Record the reply event in outreach_events
    await db.from('outreach_events').insert({
      lead_id:    lead.id,
      event_type: 'reply_received',
      channel:    'whatsapp',
      metadata:   { phone, message: message.slice(0, 500) },
    });
  }

  return NextResponse.json({ received: true, lead_id: lead?.id ?? null }, { status: 201 });
}

// ─────────────────────────────────────────────
// GET /api/whatsapp-replies?lead_ids=uuid1,uuid2,...
// Fetches replies for a set of leads (used by DetailModal Replies tab)
// ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const leadIdsParam = req.nextUrl.searchParams.get('lead_ids');
  const db = getSupabaseAdmin();

  let query = db
    .from('whatsapp_replies')
    .select('*')
    .order('received_at', { ascending: false });

  if (leadIdsParam) {
    const ids = leadIdsParam.split(',').filter(Boolean);
    if (ids.length > 0) query = query.in('lead_id', ids);
  }

  const { data, error } = await query;

  if (error) {
    if (error.code === '42P01') return NextResponse.json([]); // table doesn't exist yet
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
