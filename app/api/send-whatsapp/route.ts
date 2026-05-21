import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

export async function POST(req: NextRequest) {
  try {
    const { to, message } = await req.json();

    if (!to || !message) {
      return NextResponse.json({ error: 'Missing required fields: to, message' }, { status: 400 });
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_WHATSAPP_FROM; // e.g. "whatsapp:+14155238886" (sandbox)

    if (!accountSid || !authToken || !from) {
      return NextResponse.json(
        { error: 'Twilio not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_FROM.' },
        { status: 500 }
      );
    }

    const client = twilio(accountSid, authToken);

    // Both from and to must carry the whatsapp: prefix for the WhatsApp channel
    const fromFormatted = from.startsWith('whatsapp:') ? from : `whatsapp:${from}`;
    const toFormatted = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

    await client.messages.create({
      from: fromFormatted,
      to: toFormatted,
      body: message,
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('send-whatsapp error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to send WhatsApp message' }, { status: 500 });
  }
}
