import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

/**
 * Escape the five characters that have special meaning in HTML.
 * Must be applied to every untrusted string before interpolation into HTML.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export async function POST(req: NextRequest) {
  try {
    const { to, subject, body, lead_id } = await req.json();

    if (!to || !subject || !body) {
      return NextResponse.json({ error: 'Missing required fields: to, subject, body' }, { status: 400 });
    }

    if (!process.env.EMAIL_FROM || !process.env.EMAIL_PASSWORD) {
      return NextResponse.json(
        { error: 'Email not configured. Set EMAIL_FROM and EMAIL_PASSWORD in your environment variables.' },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Escape all caller-supplied values before embedding in HTML to prevent
    // XSS payloads being delivered to email recipients.
    const safeBody = escapeHtml(body);

    await transporter.sendMail({
      from: `"Spacze" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      text: body,
      html: `<div style="font-family: Arial, sans-serif; font-size: 15px; line-height: 1.7; color: #1a1a1a; max-width: 600px;">
        ${safeBody.split('\n').map((line: string) => `<p style="margin: 0 0 12px 0;">${line}</p>`).join('')}
      </div>`,
    });

    // Track the send in the DB if a lead_id was provided
    if (lead_id) {
      const db = getSupabaseAdmin();
      const sentAt = new Date().toISOString();

      await Promise.all([
        // Update lead
        db.from('leads').update({
          email_sent:      true,
          outreach_status: 'Sent',
          last_contacted:  sentAt,
        }).eq('id', lead_id),

        // outreach_events record
        db.from('outreach_events').insert({
          lead_id,
          event_type:  'message_sent',
          channel:     'email',
          metadata:    { source: 'ai_studio', subject },
          occurred_at: sentAt,
        }),

        // scheduled_messages row so StatsPanel KPIs count it
        db.from('scheduled_messages').insert({
          lead_id,
          channel:       'email',
          sequence_step: 1,
          scheduled_at:  sentAt,
          sent_at:       sentAt,
          status:        'sent',
          subject,
          message_body:  body,
        }),
      ]);
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('send-email error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to send email' }, { status: 500 });
  }
}
