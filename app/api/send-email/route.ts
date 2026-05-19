import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

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
    const { to, subject, body } = await req.json();

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

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('send-email error:', err);
    return NextResponse.json({ error: err.message || 'Failed to send email' }, { status: 500 });
  }
}
