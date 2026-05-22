# Supabase Setup

## Prerequisites

- A [Supabase](https://supabase.com) project
- Project URL and keys from **Project Settings → API**

## Environment variables

Add these to `.env.local` (local) or your hosting platform (Vercel / Railway):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Running migrations

Open the **SQL Editor** in your Supabase dashboard and run each file in order:

| File | What it creates |
|---|---|
| `migrations/0001_leads.sql` | `leads` table + indexes |
| `migrations/0002_campaigns.sql` | `campaigns` table + `set_updated_at` trigger function |
| `migrations/0003_scheduled_messages.sql` | `scheduled_messages` table |
| `migrations/0004_whatsapp_replies.sql` | `whatsapp_replies` table |
| `migrations/0005_outreach_events.sql` | `outreach_events` table |
| `migrations/0006_settings.sql` | `settings` table (RLS enabled, service-role only) |

Run them in order — later migrations reference tables created by earlier ones.

## Seed data (optional)

To populate the DB with sample leads and a campaign for testing:

```sql
-- Run seed.sql in the SQL Editor
```

Or paste the contents of `seed.sql` directly into the SQL Editor.

## Row Level Security

| Table | RLS | Access |
|---|---|---|
| `leads` | disabled | anon + service role |
| `campaigns` | disabled | anon + service role |
| `scheduled_messages` | disabled | anon + service role |
| `whatsapp_replies` | disabled | anon + service role |
| `outreach_events` | disabled | anon + service role |
| `settings` | **enabled** | service role only |

The `settings` table has RLS enabled with no policies — only the service role key
(used by `getSupabaseAdmin()` in API routes) can read or write it. The anon key
used by client components cannot access it.

## Schema overview

```
leads
  └── scheduled_messages (lead_id → leads.id)
  └── whatsapp_replies   (lead_id → leads.id)
  └── outreach_events    (lead_id → leads.id)

campaigns
  └── scheduled_messages (campaign_id → campaigns.id)
  └── outreach_events    (campaign_id → campaigns.id)

scheduled_messages
  └── outreach_events    (scheduled_message_id → scheduled_messages.id)

settings  (standalone key/value store)
```
