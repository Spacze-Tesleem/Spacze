import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/send-twitter
 *
 * Sends a Twitter/X Direct Message via the Twitter API v2.
 * Requires:
 *   TWITTER_BEARER_TOKEN        — App-only bearer token (for user lookup)
 *   TWITTER_ACCESS_TOKEN        — OAuth 1.0a access token (for DM send)
 *   TWITTER_ACCESS_TOKEN_SECRET — OAuth 1.0a access token secret
 *   TWITTER_API_KEY             — Consumer key
 *   TWITTER_API_SECRET          — Consumer secret
 *
 * Body: { twitterHandle: string; message: string }
 *
 * Twitter DM API reference:
 *   https://developer.twitter.com/en/docs/twitter-api/direct-messages/manage/api-reference/post-dm_conversations-with-participant_id-messages
 */

const TWITTER_API = 'https://api.twitter.com/2';

export async function POST(req: NextRequest) {
  try {
    const { twitterHandle, message } = await req.json();

    if (!twitterHandle || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: twitterHandle, message' },
        { status: 400 },
      );
    }

    const bearerToken   = process.env.TWITTER_BEARER_TOKEN;
    const apiKey        = process.env.TWITTER_API_KEY;
    const apiSecret     = process.env.TWITTER_API_SECRET;
    const accessToken   = process.env.TWITTER_ACCESS_TOKEN;
    const accessSecret  = process.env.TWITTER_ACCESS_TOKEN_SECRET;

    if (!bearerToken || !apiKey || !apiSecret || !accessToken || !accessSecret) {
      return NextResponse.json(
        { error: 'Twitter not configured. Set TWITTER_BEARER_TOKEN, TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET.' },
        { status: 500 },
      );
    }

    // Step 1 — resolve @handle to a numeric user ID
    const handle = twitterHandle.replace(/^@/, '');
    const lookupRes = await fetch(`${TWITTER_API}/users/by/username/${encodeURIComponent(handle)}`, {
      headers: { Authorization: `Bearer ${bearerToken}` },
    });

    if (!lookupRes.ok) {
      const err = await lookupRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: `Twitter user lookup failed: ${(err as any).detail || lookupRes.statusText}` },
        { status: 502 },
      );
    }

    const userData = await lookupRes.json();
    const recipientId: string = userData?.data?.id;
    if (!recipientId) {
      return NextResponse.json({ error: `Twitter user @${handle} not found` }, { status: 404 });
    }

    // Step 2 — send DM via POST /2/dm_conversations/with/:participant_id/messages
    // OAuth 1.0a signature required for user-context endpoints
    const url = `${TWITTER_API}/dm_conversations/with/${recipientId}/messages`;
    const body = JSON.stringify({ text: message });

    const authHeader = buildOAuth1Header('POST', url, apiKey, apiSecret, accessToken, accessSecret);

    const sendRes = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body,
    });

    if (!sendRes.ok) {
      const err = await sendRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: `Twitter DM send failed: ${(err as any).detail || sendRes.statusText}` },
        { status: 502 },
      );
    }

    const result = await sendRes.json();
    return NextResponse.json({ success: true, dmConversationId: result?.data?.dm_conversation_id });
  } catch (err: any) {
    console.error('send-twitter error:', err);
    return NextResponse.json({ error: err.message || 'Twitter DM send failed' }, { status: 500 });
  }
}

// ── OAuth 1.0a header builder (no external lib needed) ───────────────────────

function buildOAuth1Header(
  method: string,
  url: string,
  consumerKey: string,
  consumerSecret: string,
  accessToken: string,
  tokenSecret: string,
): string {
  const nonce = crypto.randomUUID().replace(/-/g, '');
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const params: Record<string, string> = {
    oauth_consumer_key:     consumerKey,
    oauth_nonce:            nonce,
    oauth_signature_method: 'HMAC-SHA256',
    oauth_timestamp:        timestamp,
    oauth_token:            accessToken,
    oauth_version:          '1.0',
  };

  // Build base string
  const sortedParams = Object.keys(params)
    .sort()
    .map(k => `${pct(k)}=${pct(params[k])}`)
    .join('&');

  const baseString = [method.toUpperCase(), pct(url), pct(sortedParams)].join('&');
  const signingKey = `${pct(consumerSecret)}&${pct(tokenSecret)}`;

  // HMAC-SHA256 via Web Crypto (available in Next.js edge/node runtime)
  // We compute synchronously using a sync-compatible approach via Buffer
  const signature = hmacSha256Base64Sync(signingKey, baseString);

  params['oauth_signature'] = signature;

  const headerValue = Object.keys(params)
    .filter(k => k.startsWith('oauth_'))
    .sort()
    .map(k => `${pct(k)}="${pct(params[k])}"`)
    .join(', ');

  return `OAuth ${headerValue}`;
}

function pct(s: string): string {
  return encodeURIComponent(s).replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

/** Synchronous HMAC-SHA256 using Node.js crypto (available in Next.js server runtime) */
function hmacSha256Base64Sync(key: string, data: string): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const nodeCrypto = require('crypto') as typeof import('crypto');
  return nodeCrypto.createHmac('sha256', key).update(data).digest('base64');
}
