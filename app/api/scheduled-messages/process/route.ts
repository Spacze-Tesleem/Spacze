import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST() {
  const db = getSupabaseAdmin();
  const now = new Date().toISOString();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const { data: due, error: fetchError } = await db
    .from('scheduled_messages')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_at', now);

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!due || due.length === 0) return NextResponse.json({ processed: 0, message: 'No messages due.' });

  const results: { id: string; channel: string; status: string; error?: string }[] = [];

  for (const msg of due) {
    try {
      const { data: lead } = await db.from('leads').select('*').eq('id', msg.lead_id).single();
      if (!lead) throw new Error('Lead not found');

      switch (msg.channel) {
        case 'email': {
          let subject = msg.subject;
          let body    = msg.message_body;
          if (!subject || !body) {
            const g = await fetch(`${baseUrl}/api/generate-email`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...lead, sequenceStep: msg.sequence_step }) });
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
            const g = await fetch(`${baseUrl}/api/generate-whatsapp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lead) });
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
            const g = await fetch(`${baseUrl}/api/generate-linkedin`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lead) });
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
            const g = await fetch(`${baseUrl}/api/generate-twitter`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lead) });
            const gd = await g.json();
            if (!g.ok) throw new Error(gd.error || 'Twitter generation failed');
            message = gd.message;
          }
          const s = await fetch(`${baseUrl}/api/send-twitter`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ twitterHandle: lead.twitter_handle, message }) });
          if (!s.ok) { const d = await s.json(); throw new Error(d.error || 'Twitter DM send failed'); }
          break;
        }
        default:
          throw new Error(`Unknown channel: ${msg.channel}`);
      }

      await db.from('scheduled_messages').update({ status: 'sent', sent_at: now }).eq('id', msg.id);
      results.push({ id: msg.id, channel: msg.channel, status: 'sent' });
    } catch (err: any) {
      await db.from('scheduled_messages').update({ status: 'failed' }).eq('id', msg.id);
      results.push({ id: msg.id, channel: msg.channel, status: 'failed', error: err.message });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
