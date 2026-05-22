-- Migration 0004: whatsapp_replies table
-- Stores inbound and outbound WhatsApp messages.
-- Inbound: forwarded by the Baileys worker via POST /api/whatsapp-replies.
-- Outbound: recorded by the queue processor after a successful send.
-- Depends on: 0001_leads.sql

create table if not exists public.whatsapp_replies (
  id          uuid        primary key default gen_random_uuid(),
  lead_id     uuid        references public.leads(id) on delete set null,
  phone       text        not null,
  message     text        not null,
  direction   text        not null default 'inbound'
                check (direction in ('inbound','outbound')),
  received_at timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

-- Fetch conversation thread for a lead
create index if not exists idx_whatsapp_replies_lead
  on public.whatsapp_replies(lead_id, received_at desc);

-- Look up by phone number (for leads without a matched lead_id)
create index if not exists idx_whatsapp_replies_phone
  on public.whatsapp_replies(phone, received_at desc);
