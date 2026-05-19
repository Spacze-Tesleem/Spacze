import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// POST /api/scheduled-messages/process
// Finds all pending scheduled_messages with scheduled_at <= now and fires them.
// LinkedIn messages are marked sent immediately (copy-only, no API send).
export async function POST() {
  const db = getSupabaseAdmin();
  const now = new Date().toISOString();

  // Fetch due pending messages
  const { data: due, error: fetchError } = await db
    .from('scheduled_messages')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_at', now);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!due || due.length === 0) {
    return NextResponse.json({ processed: 0, message: 'No messages due.' });
  }

  const results: { id: string; channel: string; status: string; error?: string }[] = [];
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  for (const msg of due) {
    try {
      if (msg.channel === 'linkedin') {
        // LinkedIn is copy-only — mark as sent immediately
        await db
          .from('scheduled_messages')
          .update({ status: 'sent', sent_at: now })
          .eq('id', msg.id);
        results.push({ id: msg.id, channel: 'linkedin', status: 'sent' });
        continue;
      }

      if (msg.channel === 'email') {
        if (!msg.subject || !msg.message_body) {
          // Fetch lead to generate email on the fly
          const { data: lead } = await db.from('leads').select('*').eq('id', msg.lead_id).single();
          if (!lead) throw new Error('Lead not found');

          const genRes = await fetch(`${baseUrl}/api/generate-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...lead, sequenceStep: msg.sequence_step }),
          });
          const genData = await genRes.json();
          if (!genRes.ok) throw new Error(genData.error || 'Email generation failed');

          const sendRes = await fetch(`${baseUrl}/api/send-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: lead.contact_email, subject: genData.subject, body: genData.body }),
          });
          if (!sendRes.ok) {
            const sendData = await sendRes.json();
            throw new Error(sendData.error || 'Email send failed');
          }
        } else {
          // Use pre-generated content
          const { data: lead } = await db.from('leads').select('contact_email').eq('id', msg.lead_id).single();
          if (!lead) throw new Error('Lead not found');

          const sendRes = await fetch(`${baseUrl}/api/send-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: lead.contact_email, subject: msg.subject, body: msg.message_body }),
          });
          if (!sendRes.ok) {
            const sendData = await sendRes.json();
            throw new Error(sendData.error || 'Email send failed');
          }
        }

        await db
          .from('scheduled_messages')
          .update({ status: 'sent', sent_at: now })
          .eq('id', msg.id);
        results.push({ id: msg.id, channel: 'email', status: 'sent' });
      }

      if (msg.channel === 'whatsapp') {
        const { data: lead } = await db.from('leads').select('*').eq('id', msg.lead_id).single();
        if (!lead) throw new Error('Lead not found');

        const genRes = await fetch(`${baseUrl}/api/generate-whatsapp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lead),
        });
        const genData = await genRes.json();
        if (!genRes.ok) throw new Error(genData.error || 'WhatsApp generation failed');

        const sendRes = await fetch(`${baseUrl}/api/whatsapp-worker`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'send', to: lead.whatsapp_number, message: genData.message }),
        });
        if (!sendRes.ok) {
          const sendData = await sendRes.json();
          throw new Error(sendData.error || 'WhatsApp send failed');
        }

        await db
          .from('scheduled_messages')
          .update({ status: 'sent', sent_at: now })
          .eq('id', msg.id);
        results.push({ id: msg.id, channel: 'whatsapp', status: 'sent' });
      }
    } catch (err: any) {
      await db
        .from('scheduled_messages')
        .update({ status: 'failed' })
        .eq('id', msg.id);
      results.push({ id: msg.id, channel: msg.channel, status: 'failed', error: err.message });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
