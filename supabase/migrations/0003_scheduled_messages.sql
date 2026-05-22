-- Migration 0003: scheduled_messages table
-- Depends on: 0001_leads.sql, 0002_campaigns.sql

create table if not exists public.scheduled_messages (
  id             uuid        primary key default gen_random_uuid(),
  campaign_id    uuid        references public.campaigns(id) on delete cascade,  -- nullable: direct sends have no campaign
  lead_id        uuid        not null references public.leads(id) on delete cascade,
  channel        text        not null
                   check (channel in ('email','whatsapp','linkedin','twitter','facebook','google_ads')),
  sequence_step  integer     not null,
  scheduled_at   timestamptz not null,
  sent_at        timestamptz,
  status         text        not null default 'pending'
                   check (status in ('pending','processing','sent','failed','cancelled')),
  message_body   text,
  subject        text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

drop trigger if exists scheduled_messages_updated_at on public.scheduled_messages;
create trigger scheduled_messages_updated_at
  before update on public.scheduled_messages
  for each row execute procedure public.set_updated_at();

-- Fetch by campaign
create index if not exists idx_scheduled_messages_campaign
  on public.scheduled_messages(campaign_id);

-- Process-queue query: pending messages due now
create index if not exists idx_scheduled_messages_status_scheduled
  on public.scheduled_messages(status, scheduled_at);

-- Fetch all messages for a lead
create index if not exists idx_scheduled_messages_lead
  on public.scheduled_messages(lead_id);
