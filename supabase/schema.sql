-- ─────────────────────────────────────────────────────────────────────────────
-- Spacze schema
-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── leads ────────────────────────────────────────────────────────────────────
create table if not exists public.leads (
  id                      uuid primary key default gen_random_uuid(),
  business_name           text not null,
  website                 text,
  industry                text,
  contact_email           text,
  whatsapp_number         text,
  website_quality_score   numeric,
  mobile_responsiveness   text,
  whatsapp_integration    text,
  seo_quality             text,
  has_dashboard           boolean default false,
  ai_opportunity          text,
  weak_points             text,
  possible_improvements   text,
  last_contacted          timestamptz,
  follow_up_date          timestamptz,
  response_status         text default 'none',
  outreach_status         text default 'not_started',
  email_sent              boolean default false,
  reply_received          boolean default false,
  meeting_booked          boolean default false,
  linkedin_url            text,
  twitter_handle          text,
  generated_subject       text,
  generated_email         text,
  created_at              timestamptz default now()
);

-- ── campaigns ────────────────────────────────────────────────────────────────
create table if not exists public.campaigns (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  description    text default '',
  status         text not null default 'draft'
                   check (status in ('draft','active','paused','completed')),
  channels       text[] not null default '{}',
  lead_ids       uuid[] not null default '{}',
  auto_sequence  boolean default true,
  start_date     timestamptz,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- keep updated_at current automatically
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists campaigns_updated_at on public.campaigns;
create trigger campaigns_updated_at
  before update on public.campaigns
  for each row execute procedure public.set_updated_at();

-- ── scheduled_messages ───────────────────────────────────────────────────────
create table if not exists public.scheduled_messages (
  id             uuid primary key default gen_random_uuid(),
  campaign_id    uuid not null references public.campaigns(id) on delete cascade,
  lead_id        uuid not null references public.leads(id)     on delete cascade,
  channel        text not null check (channel in ('email','whatsapp','linkedin','twitter')),
  sequence_step  integer not null,
  scheduled_at   timestamptz not null,
  sent_at        timestamptz,
  status         text not null default 'pending'
                   check (status in ('pending','sent','failed','cancelled')),
  message_body   text,
  subject        text,
  created_at     timestamptz default now()
);

-- index for the common query pattern (fetch by campaign)
create index if not exists idx_scheduled_messages_campaign
  on public.scheduled_messages(campaign_id);

-- index for the process-queue query (pending messages due now)
create index if not exists idx_scheduled_messages_status_scheduled
  on public.scheduled_messages(status, scheduled_at);
