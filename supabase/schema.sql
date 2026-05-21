-- ─────────────────────────────────────────────────────────────────────────────
-- Spacze schema
-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Safe to re-run: all statements use IF NOT EXISTS / OR REPLACE.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Migration: add social columns to existing leads table ────────────────────
-- Skip if you are running schema.sql fresh (the CREATE TABLE below includes them).
-- Run these if you already have a leads table from a previous deployment:
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS linkedin_url   text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS twitter_handle text;

-- ── Migration: add twitter to scheduled_messages channel constraint ───────────
-- Drops and recreates the check constraint to include 'twitter'.
ALTER TABLE public.scheduled_messages
  DROP CONSTRAINT IF EXISTS scheduled_messages_channel_check;
ALTER TABLE public.scheduled_messages
  ADD CONSTRAINT scheduled_messages_channel_check
  CHECK (channel IN ('email','whatsapp','linkedin','twitter'));

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
  campaign_id    uuid references public.campaigns(id) on delete cascade, -- nullable for direct sends
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

-- ── Migration: add 'processing' to scheduled_messages status constraint ───────
-- Required by the idempotency lock in /api/scheduled-messages/process.
ALTER TABLE public.scheduled_messages
  DROP CONSTRAINT IF EXISTS scheduled_messages_status_check;
ALTER TABLE public.scheduled_messages
  ADD CONSTRAINT scheduled_messages_status_check
  CHECK (status IN ('pending','processing','sent','failed','cancelled'));

-- ── Migration: add updated_at to scheduled_messages ──────────────────────────
ALTER TABLE public.scheduled_messages ADD COLUMN IF NOT EXISTS updated_at timestamptz default now();

drop trigger if exists scheduled_messages_updated_at on public.scheduled_messages;
create trigger scheduled_messages_updated_at
  before update on public.scheduled_messages
  for each row execute procedure public.set_updated_at();

-- ── Migration: make campaign_id nullable on scheduled_messages ───────────────
-- Required so direct sends (WhatsApp panel, AI Studio) can insert rows
-- without belonging to a campaign.
ALTER TABLE public.scheduled_messages
  ALTER COLUMN campaign_id DROP NOT NULL;

-- ── whatsapp_replies ─────────────────────────────────────────────────────────
-- Stores inbound WhatsApp messages forwarded by the Baileys worker.
-- The worker calls POST /api/whatsapp-replies; that route inserts here and
-- cancels remaining pending WhatsApp messages for the lead.
create table if not exists public.whatsapp_replies (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid references public.leads(id) on delete set null,
  phone       text not null,
  message     text not null,
  direction   text not null default 'inbound' check (direction in ('inbound', 'outbound')),
  received_at timestamptz not null default now(),
  created_at  timestamptz default now()
);

-- Migration for existing deployments
ALTER TABLE public.whatsapp_replies ADD COLUMN IF NOT EXISTS direction text not null default 'inbound';

create index if not exists idx_whatsapp_replies_lead
  on public.whatsapp_replies(lead_id, received_at desc);

create index if not exists idx_whatsapp_replies_phone
  on public.whatsapp_replies(phone, received_at desc);

-- ── outreach_events ───────────────────────────────────────────────────────────
-- Event-sourced outreach history. Analytics should be built from this table
-- rather than from mutable flags on the leads row (email_sent, reply_received,
-- meeting_booked) which only reflect current state, not history.
--
-- Record an event whenever:
--   - A message is sent (event_type = 'message_sent')
--   - A message fails  (event_type = 'message_failed')
--   - A reply arrives  (event_type = 'reply_received')
--   - A meeting is booked (event_type = 'meeting_booked')
create table if not exists public.outreach_events (
  id                  uuid primary key default gen_random_uuid(),
  lead_id             uuid not null references public.leads(id) on delete cascade,
  campaign_id         uuid references public.campaigns(id) on delete set null,
  scheduled_message_id uuid references public.scheduled_messages(id) on delete set null,
  event_type          text not null
                        check (event_type in (
                          'message_sent','message_failed',
                          'reply_received','meeting_booked'
                        )),
  channel             text check (channel in ('email','whatsapp','linkedin','twitter')),
  sequence_step       integer,
  metadata            jsonb default '{}',
  occurred_at         timestamptz not null default now()
);

-- Indexes for the most common analytics queries
create index if not exists idx_outreach_events_lead
  on public.outreach_events(lead_id, occurred_at desc);

create index if not exists idx_outreach_events_campaign
  on public.outreach_events(campaign_id, occurred_at desc);

create index if not exists idx_outreach_events_type_channel
  on public.outreach_events(event_type, channel, occurred_at desc);
