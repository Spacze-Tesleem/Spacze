# Spacze Command Centre

An AI-powered outreach and campaign management platform built for Spacze — a web and automation studio. It handles multi-channel lead outreach (email, WhatsApp, LinkedIn, Twitter), AI copy generation, campaign scheduling, and real-time analytics from a single admin dashboard.

---

## What it does

**Public site** (`/`) — Marketing site for Spacze with services, portfolio, and contact form.

**Admin dashboard** (`/admin`) — The Command Centre. Six panels:

| Panel | Purpose |
|---|---|
| Overview | KPI cards, conversion funnel, channel mix chart, activity feed, campaign performance table |
| Audience (CRM) | Lead database — add, edit, analyse leads with AI-generated website audits |
| AI Studio | Generate personalised outreach copy per lead for any channel; send single emails or full multi-step sequences |
| Campaigns | Create multi-channel campaigns targeting groups of leads; auto-schedule follow-up sequences at +0/+3/+7/+14 days; process queue manually or automatically |
| WhatsApp | Connect via QR (Baileys), bulk send AI-generated messages, inbox with full conversation threads and reply from dashboard |
| Settings | Configure API keys (OpenAI, Gemini, Groq, email, WhatsApp worker) |

---

## Tech stack

- **Framework:** Next.js (App Router), React, TypeScript
- **Styling:** Tailwind CSS v4, Framer Motion, Lucide React
- **Database:** Supabase (PostgreSQL)
- **AI:** OpenAI `gpt-4o-mini` → Google Gemini `gemini-2.0-flash` → Groq `llama-3.3-70b` (fallback chain)
- **Email:** Nodemailer via Gmail
- **WhatsApp:** Baileys worker (Node.js, deployed on Railway), proxied via Next.js API routes
- **Charts:** Chart.js + react-chartjs-2
- **Data fetching:** SWR

---

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key (server-side only) |
| `ADMIN_PASSWORD` | ✅ | Password for `/admin` login |
| `OPENAI_API_KEY` | — | Primary AI provider |
| `GEMINI_API_KEY` | — | Fallback AI provider |
| `GROQ_API_KEY` | — | Fallback AI provider |
| `EMAIL_FROM` | — | Gmail address for outbound email |
| `EMAIL_PASSWORD` | — | Gmail app password |
| `WHATSAPP_WORKER_URL` | — | URL of the Baileys worker (e.g. Railway deployment) |
| `WHATSAPP_WORKER_SECRET` | — | Shared secret between Next.js app and Baileys worker |
| `SPACZE_APP_URL` | — | Public URL of this app (used by the worker to forward inbound replies) |
| `SPACZE_APP_SECRET` | — | Secret the worker sends when forwarding inbound replies |

At least one AI provider key is required for copy generation.

---

## Database setup

Run `supabase/schema.sql` in the Supabase SQL Editor. It is safe to re-run — all statements use `IF NOT EXISTS` or `OR REPLACE`.

Tables created:

| Table | Purpose |
|---|---|
| `leads` | CRM records with outreach status, AI analysis fields, and contact details |
| `campaigns` | Named multi-channel outreach efforts |
| `scheduled_messages` | Per-lead per-channel messages with scheduling and status tracking |
| `whatsapp_replies` | Inbound and outbound WhatsApp messages (powers the inbox) |
| `outreach_events` | Event log for every send, failure, reply, and meeting booked |

---

## WhatsApp worker

The Baileys worker lives in `whatsapp-worker/` and runs as a separate Node.js process (deployed on Railway). It:

- Maintains a persistent WhatsApp Web session
- Exposes `/send`, `/send-bulk`, `/status`, `/reconnect`, `/disconnect` endpoints
- Listens for inbound messages and forwards them to `POST /api/whatsapp-replies` on this app

Set `SPACZE_APP_URL` and `SPACZE_APP_SECRET` on the Railway worker to enable inbound reply forwarding.

---

## Project structure

```
app/
  (main)/           Public marketing site
  admin/            Admin dashboard panels
  api/
    analyze-lead/
    campaigns/
    generate-*/     AI copy generation (email, whatsapp, linkedin, twitter, facebook, google-ads)
    send-*/         Send routes (email, whatsapp, linkedin, twitter, facebook, google-ads)
    scheduled-messages/
    whatsapp-bulk/
    whatsapp-inbox/
    whatsapp-replies/
    whatsapp-worker/
lib/
  ai-persona.ts     Shared AI brand voice prompt
  hooks.ts          SWR data-fetching hooks
  supabase.ts       Supabase client + types
  supabase-admin.ts Supabase admin client (service role)
whatsapp-worker/    Baileys worker (separate Node.js service)
supabase/
  schema.sql        Full database schema + migrations
```
