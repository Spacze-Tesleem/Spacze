import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// Keys the Settings UI is allowed to read/write.
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

const MASK = '••••••••';

/**
 * Load all settings rows from Supabase and apply them to process.env.
 * Called on every GET so DB values stay live across restarts.
 */
async function loadFromDb(): Promise<Record<string, string>> {
  try {
    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from('settings')
      .select('key, value')
      .in('key', ALLOWED_KEYS);

    if (error) throw error;

    const result: Record<string, string> = {};
    for (const row of data ?? []) {
      if (row.value) {
        result[row.key] = row.value;
        process.env[row.key] = row.value;
      }
    }
    return result;
  } catch {
    // Supabase not yet configured — fall back to process.env silently
    return {};
  }
}

// GET /api/settings
// Returns masked indicators (set / unset) for each key.
// Also hydrates process.env from DB so values are live after a cold start.
export async function GET() {
  const dbValues = await loadFromDb();

  const result: Record<string, string> = {};
  for (const key of ALLOWED_KEYS) {
    const val = dbValues[key] || process.env[key];
    result[key] = val ? MASK : '';
  }

  return NextResponse.json(result);
}

// POST /api/settings
// Upserts values into Supabase AND applies them to process.env immediately.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const toUpsert: { key: string; value: string }[] = [];
    const applied: string[] = [];

    for (const [key, val] of Object.entries(body)) {
      if (!ALLOWED_KEYS.includes(key)) continue;
      if (typeof val !== 'string') continue;
      if (val === MASK) continue;
      if (!val.trim()) continue;

      toUpsert.push({ key, value: val.trim() });
      applied.push(key);
    }

    if (toUpsert.length > 0) {
      const db = getSupabaseAdmin();
      const { error } = await db
        .from('settings')
        .upsert(toUpsert, { onConflict: 'key' });

      if (error) throw new Error(`DB upsert failed: ${error.message}`);

      for (const { key, value } of toUpsert) {
        process.env[key] = value;
      }
    }

    return NextResponse.json({ success: true, applied });
  } catch (err: unknown) {
    console.error('[settings POST]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to save settings' },
      { status: 500 },
    );
  }
}

// DELETE /api/settings?key=SOME_KEY
// Removes a single key from Supabase and clears it from process.env.
export async function DELETE(req: NextRequest) {
  try {
    const key = new URL(req.url).searchParams.get('key');
    if (!key || !ALLOWED_KEYS.includes(key)) {
      return NextResponse.json({ error: 'Invalid or missing key' }, { status: 400 });
    }

    const db = getSupabaseAdmin();
    const { error } = await db.from('settings').delete().eq('key', key);
    if (error) throw new Error(error.message);

    delete process.env[key];

    return NextResponse.json({ success: true, deleted: key });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Delete failed' },
      { status: 500 },
    );
  }
}
