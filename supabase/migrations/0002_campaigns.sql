-- Migration 0002: campaigns table + updated_at trigger
-- Depends on: 0001_leads.sql

-- Shared trigger function used by all tables with updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.campaigns (
  id             uuid        primary key default gen_random_uuid(),
  name           text        not null,
  description    text        not null default '',
  status         text        not null default 'draft'
                   check (status in ('draft','active','paused','completed')),
  channels       text[]      not null default '{}',
  lead_ids       uuid[]      not null default '{}',
  auto_sequence  boolean     not null default true,
  start_date     timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

drop trigger if exists campaigns_updated_at on public.campaigns;
create trigger campaigns_updated_at
  before update on public.campaigns
  for each row execute procedure public.set_updated_at();

create index if not exists idx_campaigns_status
  on public.campaigns(status);

create index if not exists idx_campaigns_created_at
  on public.campaigns(created_at desc);
