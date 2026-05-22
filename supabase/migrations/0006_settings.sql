-- Migration 0006: settings table
-- Persistent key/value store for admin-configurable settings (API keys, etc.).
-- Protected by RLS — only the service role key can read or write.
-- The Next.js API route accesses this via getSupabaseAdmin() (service role).

create table if not exists public.settings (
  key        text        primary key,
  value      text        not null default '',
  updated_at timestamptz not null default now()
);

-- Only the service role can access this table.
-- No explicit policies = deny all for anon and authenticated roles.
alter table public.settings enable row level security;

drop trigger if exists settings_updated_at on public.settings;
create trigger settings_updated_at
  before update on public.settings
  for each row execute procedure public.set_updated_at();
