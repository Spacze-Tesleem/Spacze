import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/send-linkedin
 *
 * Sends a LinkedIn InMail via the LinkedIn Sales Navigator API.
 * Requires:
 *   LINKEDIN_ACCESS_TOKEN  — OAuth 2.0 bearer token (w/ w_member_social scope)
 *   LINKEDIN_PERSON_URN    — sender's LinkedIn person URN, e.g. "urn:li:person:ABC123"
 *
 * Body: { recipientProfileUrl: string; subject: string; body: string }
 *
 * LinkedIn InMail API reference:
 *   https://learn.microsoft.com/en-us/linkedin/shared/integrations/messaging/inmail
 */

const LINKEDIN_API = 'https://api.linkedin.com/v2';

export async function POST(req: NextRequest) {
  try {
    const { recipientProfileUrl, subject, body } = await req.json();

    if (!recipientProfileUrl || !subject || !body) {
      return NextResponse.json(
        { error: 'Missing required fields: recipientProfileUrl, subject, body' },
        { status: 400 },
      );
    }

    const token = process.env.LINKEDIN_ACCESS_TOKEN;
    const senderUrn = process.env.LINKEDIN_PERSON_URN;

    if (!token || !senderUrn) {
      return NextResponse.json(
        { error: 'LinkedIn not configured. Set LINKEDIN_ACCESS_TOKEN and LINKEDIN_PERSON_URN.' },
        { status: 500 },
      );
    }

    // Step 1 — resolve the public profile URL to a person URN
    const profileId = extractLinkedInId(recipientProfileUrl);
    if (!profileId) {
      return NextResponse.json(
        { error: 'Could not parse LinkedIn profile URL. Expected format: linkedin.com/in/username' },
        { status: 400 },
      );
    }

    // Lookup the member URN via the profile lookup endpoint
    const lookupRes = await fetch(
      `${LINKEDIN_API}/people/(profileId:${encodeURIComponent(profileId)})?projection=(id)`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'LinkedIn-Version': '202401',
        },
      },
    );

    if (!lookupRes.ok) {
      const err = await lookupRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: `LinkedIn profile lookup failed: ${(err as any).message || lookupRes.statusText}` },
        { status: 502 },
      );
    }

    const profile = await lookupRes.json();
    const recipientUrn = `urn:li:person:${profile.id}`;

    // Step 2 — send InMail via the messages API
    const payload = {
      recipients: [{ person: { '$URN': recipientUrn } }],
      subject,
      body,
      messageType: 'INMAIL',
    };

    const sendRes = await fetch(`${LINKEDIN_API}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'LinkedIn-Version': '202401',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(payload),
    });

    if (!sendRes.ok) {
      const err = await sendRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: `LinkedIn send failed: ${(err as any).message || sendRes.statusText}` },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true, recipientUrn });
  } catch (err: unknown) {
    console.error('send-linkedin error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'LinkedIn send failed' }, { status: 500 });
  }
}

/** Extract the vanity name / profile ID from a LinkedIn URL */
function extractLinkedInId(url: string): string | null {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    const parts = u.pathname.split('/').filter(Boolean);
    const inIdx = parts.indexOf('in');
    if (inIdx >= 0 && parts[inIdx + 1]) return parts[inIdx + 1];
    return null;
  } catch {
    return null;
  }
}
