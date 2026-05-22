-- Migration 0005: outreach_events table
-- Event-sourced outreach history for analytics.
-- Append-only — never update rows, only insert.
-- Depends on: 0001_leads.sql, 0002_campaigns.sql, 0003_scheduled_messages.sql

create table if not exists public.outreach_events (
  id                   uuid        primary key default gen_random_uuid(),
  lead_id              uuid        not null references public.leads(id) on delete cascade,
  campaign_id          uuid        references public.campaigns(id) on delete set null,
  scheduled_message_id uuid        references public.scheduled_messages(id) on delete set null,
  event_type           text        not null
                         check (event_type in (
                           'message_sent',
                           'message_failed',
                           'reply_received',
                           'meeting_booked'
                         )),
  channel              text
                         check (channel in ('email','whatsapp','linkedin','twitter','facebook','google_ads')),
  sequence_step        integer,
  metadata             jsonb       not null default '{}',
  occurred_at          timestamptz not null default now()
);

-- Analytics: all events for a lead in chronological order
create index if not exists idx_outreach_events_lead
  on public.outreach_events(lead_id, occurred_at desc);

-- Analytics: all events for a campaign
create index if not exists idx_outreach_events_campaign
  on public.outreach_events(campaign_id, occurred_at desc);

-- Analytics: filter by event type and channel (funnel queries)
create index if not exists idx_outreach_events_type_channel
  on public.outreach_events(event_type, channel, occurred_at desc);
