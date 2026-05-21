import { NextRequest, NextResponse } from 'next/server';

// Keys that the Settings UI is allowed to read/write.
const ALLOWED_KEYS = [
  'OPENAI_API_KEY',
  'GEMINI_API_KEY',
  'GROQ_API_KEY',
  'EMAIL_FROM',
  'EMAIL_PASSWORD',
  'WHATSAPP_WORKER_URL',
  'WHATSAPP_WORKER_SECRET',
  'LINKEDIN_ACCESS_TOKEN',
  'LINKEDIN_PERSON_URN',
  'TWITTER_API_KEY',
  'TWITTER_API_SECRET',
  'TWITTER_ACCESS_TOKEN',
  'TWITTER_ACCESS_TOKEN_SECRET',
  'TWITTER_BEARER_TOKEN',
  'FB_ACCESS_TOKEN',
  'FB_AD_ACCOUNT_ID',
  'FB_PAGE_ID',
  'GOOGLE_ADS_DEVELOPER_TOKEN',
  'GOOGLE_ADS_CLIENT_ID',
  'GOOGLE_ADS_CLIENT_SECRET',
  'GOOGLE_ADS_REFRESH_TOKEN',
  'GOOGLE_ADS_CUSTOMER_ID',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_APP_URL',
  'ADMIN_PASSWORD',
  'ADMIN_SESSION_SECRET',
];

// GET /api/settings — return masked indicators (set / unset) for each key.
// Raw values are never sent to the browser.
export async function GET() {
  const result: Record<string, string> = {};
  for (const key of ALLOWED_KEYS) {
    result[key] = process.env[key] ? '••••••••' : '';
  }
  return NextResponse.json(result);
}

// POST /api/settings — apply values to process.env for the current server
// process lifetime.
//
// ⚠️  This does NOT persist across restarts or deployments.
//     For permanent storage set env vars in your hosting platform
//     (Vercel → Project Settings → Environment Variables, Railway → Variables,
//     or a .env.local file that is NOT committed to version control).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const applied: string[] = [];
    for (const [key, val] of Object.entries(body)) {
      if (!ALLOWED_KEYS.includes(key)) continue;
      if (typeof val !== 'string') continue;
      // Skip the masked placeholder — don't overwrite a real value with '••••••••'
      if (val === '••••••••') continue;
      if (val.trim()) {
        process.env[key] = val;
        applied.push(key);
      }
    }

    return NextResponse.json({
      success: true,
      applied,
      note: 'Values are active for this server process only. Set them as platform environment variables for persistence across restarts.',
    });
  } catch (err: unknown) {
    console.error('settings error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to apply settings' }, { status: 500 });
  }
}
