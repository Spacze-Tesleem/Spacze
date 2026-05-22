-- ─────────────────────────────────────────────────────────────────────────────
-- Spacze Settings Table
-- Run this once in your Supabase SQL Editor to enable the Settings page.
-- Dashboard → SQL Editor → New query → paste → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Trigger function (shared — safe to run even if it already exists)
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 2. Settings table
create table if not exists public.settings (
  key        text        primary key,
  value      text        not null default '',
  updated_at timestamptz not null default now()
);

-- 3. Auto-update updated_at on every write
drop trigger if exists settings_updated_at on public.settings;
create trigger settings_updated_at
  before update on public.settings
  for each row execute procedure public.set_updated_at();

-- 4. Lock it down — only the service role key can read or write
alter table public.settings enable row level security;
-- No policies = deny all for anon/authenticated roles.
-- The Next.js API uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS.

-- Done. The Settings page (/admin → Settings tab) will now persist
-- API keys to this table and reload them on every server start.
