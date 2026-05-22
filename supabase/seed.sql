-- Spacze seed data
-- Run after all migrations to populate the DB with sample leads and a campaign.
-- Safe to re-run — uses INSERT ... ON CONFLICT DO NOTHING.

-- ── Sample leads ──────────────────────────────────────────────────────────────

insert into public.leads (
  id, business_name, website, industry, contact_email, whatsapp_number,
  website_quality_score, ai_opportunity, weak_points, possible_improvements,
  outreach_status, response_status
) values
(
  'a1000000-0000-0000-0000-000000000001',
  'Vintologistics',
  'https://vintologistics.com',
  'Logistics',
  'hello@vintologistics.com',
  '+2348012345001',
  62,
  'AI-powered shipment tracking and automated customer status updates',
  'No real-time tracking, manual booking process, no WhatsApp integration',
  'Add live tracking dashboard, WhatsApp booking bot, automated delivery alerts',
  'Sent',
  'No Reply'
),
(
  'a1000000-0000-0000-0000-000000000002',
  'FreshMart Nigeria',
  'https://freshmartng.com',
  'E-Commerce',
  'info@freshmartng.com',
  '+2348012345002',
  45,
  'AI product recommendations and abandoned cart recovery via WhatsApp',
  'Slow site, no cart recovery, no personalisation',
  'Speed optimisation, WhatsApp cart recovery, AI upsell engine',
  'Pending',
  'None'
),
(
  'a1000000-0000-0000-0000-000000000003',
  'Apex Realty',
  'https://apexrealty.ng',
  'Real Estate',
  'contact@apexrealty.ng',
  '+2348012345003',
  71,
  'AI property matching and automated lead qualification chatbot',
  'No lead capture form, listings not mobile-optimised',
  'Add AI chatbot for property matching, mobile-first listing pages',
  'Replied',
  'Positive'
),
(
  'a1000000-0000-0000-0000-000000000004',
  'SwiftRide Lagos',
  'https://swiftride.ng',
  'Logistics',
  'ops@swiftride.ng',
  '+2348012345004',
  38,
  'Automated driver dispatch and real-time ride status via WhatsApp',
  'No online booking, no driver tracking, phone-only dispatch',
  'Build booking web app, integrate WhatsApp status updates, driver dashboard',
  'Pending',
  'None'
),
(
  'a1000000-0000-0000-0000-000000000005',
  'Lumina Fashion',
  'https://luminafashion.com',
  'Fashion',
  'hello@luminafashion.com',
  '+2348012345005',
  55,
  'AI outfit recommendations and WhatsApp order tracking',
  'No size guide, no order tracking, DM-only sales',
  'E-commerce storefront, AI size recommender, WhatsApp order bot',
  'Meeting Booked',
  'Positive'
)
on conflict (id) do nothing;

-- ── Sample campaign ───────────────────────────────────────────────────────────

insert into public.campaigns (
  id, name, description, status, channels, lead_ids, auto_sequence
) values (
  'b1000000-0000-0000-0000-000000000001',
  'Lagos Logistics Outreach',
  'Initial outreach to logistics companies in Lagos — email + WhatsApp sequence',
  'active',
  array['email', 'whatsapp'],
  array[
    'a1000000-0000-0000-0000-000000000001'::uuid,
    'a1000000-0000-0000-0000-000000000004'::uuid
  ],
  true
)
on conflict (id) do nothing;
