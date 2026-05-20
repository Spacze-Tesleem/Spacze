import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

/**
 * POST /api/scheduled-messages/process
 *
 * Processes all pending scheduled messages that are due.
 *
 * Idempotency / duplicate-send protection:
 *   1. Each due message is atomically moved to status='processing' before any
 *      send attempt. A concurrent run will skip rows already in 'processing'.
 *   2. Supabase's .eq('status','pending') filter in the UPDATE acts as an
 *      optimistic lock — only one process can claim a row.
 *   3. Messages stuck in 'processing' for >10 minutes are reset to 'pending'
 *      at the start of each run so they are retried after a crash.
 */

const STUCK_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

export async function POST() {
  const db  = getSupabaseAdmin();
  const now = new Date().toISOString();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // 1. Reset messages stuck in 'processing' for >10 min (crash recovery)
  const stuckCutoff = new Date(Date.now() - STUCK_THRESHOLD_MS).toISOString();
  await db
    .from('scheduled_messages')
    .update({ status: 'pending' })
    .eq('status', 'processing')
    .lt('updated_at', stuckCutoff);

  // 2. Fetch due pending rows
  const { data: due, error: fetchError } = await db
    .from('scheduled_messages')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_at', now);

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!due || due.length === 0) return NextResponse.json({ processed: 0, message: 'No messages due.' });

  const ids = due.map((m: { id: string }) => m.id);

  // 3. Atomically claim — rows already claimed by another process are skipped
  const { data: claimed } = await db
    .from('scheduled_messages')
    .update({ status: 'processing', updated_at: now })
    .in('id', ids)
    .eq('status', 'pending')
    .select('id');

  const claimedIds = new Set((claimed ?? []).map((r: { id: string }) => r.id));
  const toProcess  = due.filter((m: { id: string }) => claimedIds.has(m.id));

  if (toProcess.length === 0) {
    return NextResponse.json({ processed: 0, message: 'All due messages already claimed by another process.' });
  }

  // 4. Process each claimed message
  const results: { id: string; channel: string; status: string; error?: string }[] = [];

  for (const msg of toProcess) {
    try {
      const { data: lead } = await db.from('leads').select('*').eq('id', msg.lead_id).single();
      if (!lead) throw new Error('Lead not found');

      switch (msg.channel) {
        case 'email': {
          let subject = msg.subject;
          let body    = msg.message_body;
          if (!subject || !body) {
            const g  = await fetch(`${baseUrl}/api/generate-email`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...lead, sequenceStep: msg.sequence_step }) });
            const gd = await g.json();
            if (!g.ok) throw new Error(gd.error || 'Email generation failed');
            subject = gd.subject; body = gd.body;
          }
          const s = await fetch(`${baseUrl}/api/send-email`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: lead.contact_email, subject, body }) });
          if (!s.ok) { const d = await s.json(); throw new Error(d.error || 'Email send failed'); }
          break;
        }
        case 'whatsapp': {
          let message = msg.message_body;
          if (!message) {
            const g  = await fetch(`${baseUrl}/api/generate-whatsapp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lead) });
            const gd = await g.json();
            if (!g.ok) throw new Error(gd.error || 'WhatsApp generation failed');
            message = gd.message;
          }
          const s = await fetch(`${baseUrl}/api/whatsapp-worker`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'send', to: lead.whatsapp_number, message }) });
          if (!s.ok) { const d = await s.json(); throw new Error(d.error || 'WhatsApp send failed'); }
          break;
        }
        case 'linkedin': {
          if (!lead.linkedin_url) throw new Error('Lead has no LinkedIn URL');
          let subject = msg.subject; let body = msg.message_body;
          if (!subject || !body) {
            const g  = await fetch(`${baseUrl}/api/generate-linkedin`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lead) });
            const gd = await g.json();
            if (!g.ok) throw new Error(gd.error || 'LinkedIn generation failed');
            subject = gd.subject; body = gd.body;
          }
          const s = await fetch(`${baseUrl}/api/send-linkedin`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recipientProfileUrl: lead.linkedin_url, subject, body }) });
          if (!s.ok) { const d = await s.json(); throw new Error(d.error || 'LinkedIn send failed'); }
          break;
        }
        case 'twitter': {
          if (!lead.twitter_handle) throw new Error('Lead has no Twitter handle');
          let message = msg.message_body;
          if (!message) {
            const g  = await fetch(`${baseUrl}/api/generate-twitter`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lead) });
            const gd = await g.json();
            if (!g.ok) throw new Error(gd.error || 'Twitter generation failed');
            message = gd.message;
          }
          const s = await fetch(`${baseUrl}/api/send-twitter`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ twitterHandle: lead.twitter_handle, message }) });
          if (!s.ok) { const d = await s.json(); throw new Error(d.error || 'Twitter DM send failed'); }
          break;
        }
        case 'facebook': {
          // Generate ad copy
          const g  = await fetch(`${baseUrl}/api/generate-facebook`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lead) });
          const gd = await g.json();
          if (!g.ok) throw new Error(gd.error || 'Facebook ad generation failed');

          // Parse structured output
          const lines = (gd.output || '').replace(/\\n/g, '\n').split('\n').map((l: string) => l.trim()).filter(Boolean);
          const extract = (re: RegExp) => { const l = lines.find((x: string) => re.test(x)); return l ? l.replace(re, '').trim() : ''; };
          const primaryTextLines: string[] = [];
          const ptStart = lines.findIndex((l: string) => /^primary_text\s*:?/i.test(l));
          const hlIdx   = lines.findIndex((l: string) => /^headline\s*:/i.test(l));
          if (ptStart >= 0) primaryTextLines.push(...lines.slice(ptStart + 1, hlIdx >= 0 ? hlIdx : undefined));

          const s = await fetch(`${baseUrl}/api/send-facebook`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              primaryText:  primaryTextLines.join('\n') || gd.output,
              headline:     extract(/^headline\s*:/i),
              description:  extract(/^description\s*:/i),
              cta:          extract(/^cta\s*:/i) || 'Learn More',
              campaignName: `Spacze — ${lead.business_name}`,
            }),
          });
          if (!s.ok) { const d = await s.json(); throw new Error(d.error || 'Facebook ad send failed'); }
          break;
        }
        case 'google_ads': {
          // Generate ad copy
          const g  = await fetch(`${baseUrl}/api/generate-google-ads`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lead) });
          const gd = await g.json();
          if (!g.ok) throw new Error(gd.error || 'Google Ads generation failed');

          // Parse headlines and descriptions
          const lines = (gd.output || '').replace(/\\n/g, '\n').split('\n').map((l: string) => l.trim()).filter(Boolean);
          const headlines: string[]    = [];
          const descriptions: string[] = [];
          lines.forEach((l: string) => {
            if (/^headline\s*\d+\s*:/i.test(l))     headlines.push(l.replace(/^headline\s*\d+\s*:/i, '').trim());
            if (/^description\s*\d+\s*:/i.test(l))  descriptions.push(l.replace(/^description\s*\d+\s*:/i, '').trim());
          });

          const s = await fetch(`${baseUrl}/api/send-google-ads`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              headlines:    headlines.length >= 3 ? headlines : ['AI Solutions', 'Grow Your Business', 'Spacze Agency'],
              descriptions: descriptions.length >= 2 ? descriptions : ['AI-powered software for your business.', 'Get a free consultation today.'],
              campaignName: `Spacze — ${lead.business_name}`,
            }),
          });
          if (!s.ok) { const d = await s.json(); throw new Error(d.error || 'Google Ads send failed'); }
          break;
        }
        default:
          throw new Error(`Unknown channel: ${msg.channel}`);
      }

      await db.from('scheduled_messages').update({ status: 'sent', sent_at: now, updated_at: now }).eq('id', msg.id);
      results.push({ id: msg.id, channel: msg.channel, status: 'sent' });
    } catch (err: any) {
      await db.from('scheduled_messages').update({ status: 'failed', updated_at: now }).eq('id', msg.id);
      results.push({ id: msg.id, channel: msg.channel, status: 'failed', error: err.message });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
