import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Keys that are safe to read back to the client (masked, not raw values)
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
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_APP_URL',
  'ADMIN_PASSWORD',
];

const ENV_PATH = path.join(process.cwd(), '.env.local');

function readEnvFile(): Record<string, string> {
  if (!fs.existsSync(ENV_PATH)) return {};
  const content = fs.readFileSync(ENV_PATH, 'utf-8');
  const result: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    result[key] = val;
  }
  return result;
}

function writeEnvFile(vars: Record<string, string>) {
  const existing = readEnvFile();
  const merged = { ...existing, ...vars };
  const lines = Object.entries(merged)
    .filter(([, v]) => v !== '')
    .map(([k, v]) => `${k}=${v.includes(' ') ? `"${v}"` : v}`);
  fs.writeFileSync(ENV_PATH, lines.join('\n') + '\n', 'utf-8');
}

// GET /api/settings — return current env values (masked: show only whether set)
export async function GET() {
  const envVars = readEnvFile();
  // Also check process.env for values set at deploy time
  const result: Record<string, string> = {};
  for (const key of ALLOWED_KEYS) {
    const val = envVars[key] || process.env[key] || '';
    // Return a masked indicator: if set, return a placeholder so the UI shows "configured"
    result[key] = val ? '••••••••' : '';
  }
  return NextResponse.json(result);
}

// POST /api/settings — write provided keys to .env.local
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Only allow writing permitted keys
    const toWrite: Record<string, string> = {};
    for (const [key, val] of Object.entries(body)) {
      if (ALLOWED_KEYS.includes(key) && typeof val === 'string') {
        // Skip masked placeholder values — don't overwrite with "••••••••"
        if (val === '••••••••') continue;
        toWrite[key] = val;
      }
    }

    writeEnvFile(toWrite);

    // Apply to current process.env so they take effect without restart where possible
    for (const [key, val] of Object.entries(toWrite)) {
      if (val) process.env[key] = val;
    }

    return NextResponse.json({ success: true, written: Object.keys(toWrite) });
  } catch (err: any) {
    console.error('settings write error:', err);
    return NextResponse.json({ error: err.message || 'Failed to save settings' }, { status: 500 });
  }
}
