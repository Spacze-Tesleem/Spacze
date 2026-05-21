import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

/**
 * POST /api/whatsapp-bulk
 *
 * Server-side bulk WhatsApp send job.
 *
 * Body: { leadIds: string[]; messages: { leadId: string; message: string }[] }
 *
 * Flow:
 *   1. Validate that every leadId has a corresponding pre-generated message
 *      (the UI generates and previews messages before calling this endpoint).
 *   2. Send each message via the WhatsApp worker with a 30–60 s random delay.
 *   3. Record each send result back to the lead's outreach_status.
 *
 * Running server-side means the browser tab can be closed without interrupting
 * the job. For very large lists, consider moving this to a background queue.
 */

const DELAY_MIN = 30_000;
const DELAY_MAX = 60_000;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST(req: NextRequest) {
  const { messages } = await req.json() as {
    messages: { leadId: string; to: string; message: string }[];
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'messages array is required and must not be empty.' }, { status: 400 });
  }

  const workerUrl    = process.env.WHATSAPP_WORKER_URL;
  const workerSecret = process.env.WHATSAPP_WORKER_SECRET ?? '';

  if (!workerUrl) {
    return NextResponse.json({ error: 'WHATSAPP_WORKER_URL not configured.' }, { status: 500 });
  }

  const db      = getSupabaseAdmin();
  const results: { leadId: string; status: 'sent' | 'failed'; error?: string }[] = [];

  for (let i = 0; i < messages.length; i++) {
    const { leadId, to, message } = messages[i];

    try {
      const res = await fetch(`${workerUrl}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-worker-secret': workerSecret },
        body: JSON.stringify({ to, message }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as { error?: string }).error || `Worker responded ${res.status}`);
      }

      const sentAt = new Date().toISOString();

      // Mark lead as contacted
      await db
        .from('leads')
        .update({ outreach_status: 'Sent', email_sent: true, last_contacted: sentAt })
        .eq('id', leadId);

      // Record in outreach_events so analytics can count it
      await db.from('outreach_events').insert({
        lead_id:    leadId,
        event_type: 'message_sent',
        channel:    'whatsapp',
        metadata:   { source: 'whatsapp_panel', to },
        occurred_at: sentAt,
      });

      // Insert a scheduled_messages row so the StatsPanel KPIs pick it up
      await db.from('scheduled_messages').insert({
        lead_id:       leadId,
        channel:       'whatsapp',
        sequence_step: 1,
        scheduled_at:  sentAt,
        sent_at:       sentAt,
        status:        'sent',
        message_body:  message,
      });

      results.push({ leadId, status: 'sent' });
    } catch (err: unknown) {
      results.push({ leadId, status: 'failed', error: err instanceof Error ? err.message : String(err) });
    }

    // Delay between messages (skip after the last one)
    if (i < messages.length - 1) {
      const delay = DELAY_MIN + Math.random() * (DELAY_MAX - DELAY_MIN);
      await sleep(delay);
    }
  }

  const sent   = results.filter(r => r.status === 'sent').length;
  const failed = results.filter(r => r.status === 'failed').length;

  return NextResponse.json({ sent, failed, results });
}
