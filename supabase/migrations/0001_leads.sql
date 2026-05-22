-- Migration 0001: leads table
-- Creates the core leads table used by the CRM panel.

create table if not exists public.leads (
  id                      uuid        primary key default gen_random_uuid(),
  business_name           text        not null,
  website                 text,
  industry                text,
  contact_email           text,
  whatsapp_number         text,
  website_quality_score   numeric,
  mobile_responsiveness   text,
  whatsapp_integration    text,
  seo_quality             text,
  has_dashboard           boolean     not null default false,
  ai_opportunity          text,
  weak_points             text,
  possible_improvements   text,
  last_contacted          timestamptz,
  follow_up_date          timestamptz,
  response_status         text        not null default 'None'
                            check (response_status in ('None','Positive','Negative','No Reply','Bounced')),
  outreach_status         text        not null default 'Pending'
                            check (outreach_status in ('Pending','Sent','Replied','Meeting Booked','Not Interested')),
  email_sent              boolean     not null default false,
  reply_received          boolean     not null default false,
  meeting_booked          boolean     not null default false,
  linkedin_url            text,
  twitter_handle          text,
  generated_subject       text,
  generated_email         text,
  created_at              timestamptz not null default now()
);

-- Full-text search index on business name and industry
create index if not exists idx_leads_business_name
  on public.leads using gin(to_tsvector('english', coalesce(business_name, '')));

create index if not exists idx_leads_outreach_status
  on public.leads(outreach_status);

create index if not exists idx_leads_industry
  on public.leads(industry);

create index if not exists idx_leads_created_at
  on public.leads(created_at desc);
