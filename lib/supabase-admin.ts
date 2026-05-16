import { createClient } from '@supabase/supabase-js';

// Server-only client — uses the service role key which bypasses RLS.
// Instantiated lazily so missing env vars don't crash the build.
// Never import this in client components or expose it to the browser.
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.'
    );
  }

  return createClient(url, key);
}
