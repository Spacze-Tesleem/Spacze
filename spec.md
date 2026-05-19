# Spacze AI Marketing Engine — Spec

## Problem Statement

The existing Spacze admin (`/admin`) is a functional but narrowly scoped outreach tool: CRM pipeline, AI email generator, and WhatsApp bulk sender. It lacks campaign management, multi-platform ad copy generation, scheduling automation, and analytics depth. The goal is to rebrand and extend this into a full **Spacze Command Centre** — a SaaS-style AI marketing platform that manages multi-channel campaigns, generates copy for all major platforms, tracks conversion analytics, and automates outreach sequences.

The public marketing site also needs a Services update to reflect this as a Spacze product offering.

---

## Tech Stack (existing, no changes)

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS v4, Framer Motion, Lucide React
- **Database:** Supabase (PostgreSQL)
- **AI providers:** OpenAI (gpt-4o-mini), Google Gemini (gemini-2.0-flash), Groq (llama-3.3-70b) — fallback chain
- **Email:** Nodemailer via Gmail
- **WhatsApp:** Baileys worker (Railway), proxied via Next.js API
- **Charts:** react-chartjs-2 + Chart.js (new dependency)
- **Brand:** `#00D67D` green, blue-600, `#020202` dark background

---

## Requirements

### 1. Rebrand: Spacze Command Centre

- Rename the admin product from "Spacze Admin / Outreach Engine" to **Spacze Command Centre** throughout the UI (sidebar header, page header subtitle, login page title/subtitle, mobile nav label).
- Update the login page shield icon area to reflect the new name.
- No route change — still lives at `/admin`.

### 2. Navigation Restructure

Replace the current 4-tab nav with 6 tabs:

| Tab | Icon | Panel |
|---|---|---|
| Dashboard | `LayoutDashboard` | Enhanced StatsPanel |
| CRM | `Users` | Existing CRMPanel (unchanged) |
| AI Copy | `Sparkles` | New AICopyPanel |
| Campaigns | `Megaphone` | New CampaignsPanel |
| Analytics | `BarChart2` | New AnalyticsPanel |
| WhatsApp | `MessageCircle` | Existing WhatsAppPanel (unchanged) |

### 3. AI Copy Panel (`AICopyPanel`)

A dual-mode copy generator.

**Mode A — Standalone Brief**
- Platform picker: Instagram/Facebook, Twitter/X, Google Ads, Email, WhatsApp, LinkedIn
- Form fields: Product/Service name, Target audience, Tone (Professional / Friendly / Bold / Urgent), Goal (Awareness / Clicks / Leads / Sales), Key message (textarea)
- Generate button → calls `/api/generate-copy` → displays formatted output with copy/regenerate actions
- Each platform renders its output in a platform-appropriate format:
  - Social: caption + hashtags
  - Google Ads: headline (max 30 chars) + description (max 90 chars)
  - Email: subject + body (reuses existing email generator logic)
  - WhatsApp: short message (reuses existing WhatsApp generator logic)
  - LinkedIn: connection message + follow-up note

**Mode B — Lead-Linked**
- Lead selector dropdown (fetches from `/api/leads`)
- Platform picker (same as above)
- AI pre-fills context from the selected lead's fields (business_name, industry, ai_opportunity, weak_points, possible_improvements)
- Same generate/copy/regenerate flow

**API:** New `POST /api/generate-copy` route. Accepts `{ mode, platform, brief?, leadData? }`. Uses the existing multi-provider fallback chain. Returns `{ platform, output, provider }`.

### 4. Campaigns Panel (`CampaignsPanel`)

A campaign is a named, multi-channel outreach effort targeting a group of leads.

**Campaign data model (new Supabase table: `campaigns`):**
```
id            uuid PK
name          text
description   text
status        text  -- 'draft' | 'active' | 'paused' | 'completed'
channels      text[]  -- ['email', 'whatsapp', 'linkedin']
lead_ids      uuid[]  -- array of lead IDs
auto_sequence boolean -- true = auto-fire follow-ups on schedule
created_at    timestamptz
updated_at    timestamptz
```

**Scheduled messages data model (new Supabase table: `scheduled_messages`):**
```
id            uuid PK
campaign_id   uuid FK → campaigns.id
lead_id       uuid FK → leads.id
channel       text  -- 'email' | 'whatsapp' | 'linkedin'
sequence_step integer  -- 1–4
scheduled_at  timestamptz
sent_at       timestamptz nullable
status        text  -- 'pending' | 'sent' | 'failed' | 'cancelled'
message_body  text nullable
subject       text nullable
created_at    timestamptz
```

**Panel UI:**
- Campaign list view: name, status badge, channel icons, lead count, created date, actions (Edit / Pause / Delete)
- Create Campaign modal/drawer:
  - Name + description
  - Channel selection (multi-select: Email, WhatsApp, LinkedIn)
  - Lead selection (multi-select from CRM leads)
  - Scheduling mode toggle:
    - **Auto-sequence:** set start date → system schedules step 1 immediately, step 2 at +3 days, step 3 at +7 days, step 4 at +14 days
    - **Manual:** date/time picker per step
  - Save as Draft or Activate
- Campaign detail view: list of scheduled messages per lead, status per step, ability to cancel individual messages

**Scheduling logic:** On campaign activation, insert rows into `scheduled_messages` for each lead × channel × step combination, with `scheduled_at` computed from the start date + offset. A polling mechanism (or manual "Process Queue" button in the UI) checks for `scheduled_at <= now()` and `status = 'pending'` rows and fires them via the existing `/api/send-email` and `/api/send-whatsapp` routes. LinkedIn steps are marked `sent` immediately (copy-only, no API send).

### 5. Analytics Panel (`AnalyticsPanel`)

Uses **react-chartjs-2** (new dependency: `react-chartjs-2`, `chart.js`).

**Metrics tracked (derived from existing `leads` table + new `campaigns`/`scheduled_messages` tables):**

- **Overview cards:** Total leads, Emails sent, WhatsApp sent, Replies received, Meetings booked, Active campaigns
- **Conversion funnel chart (Bar):** Leads → Emails Sent → Replies → Meetings (per campaign or global)
- **Channel comparison chart (Doughnut/Pie):** Email vs WhatsApp message volume
- **Campaign performance table:** Per-campaign breakdown — name, leads targeted, messages sent, reply rate %, meeting rate %
- **Timeline chart (Line):** Messages sent over time (last 30 days), grouped by channel

**Filters:** Campaign selector (All / specific campaign), Date range picker (Last 7d / 30d / 90d / All time).

**Data sources:**
- Global stats: `/api/leads` (existing)
- Campaign stats: `/api/campaigns` (new) + `/api/scheduled-messages` (new)

**New API routes:**
- `GET /api/campaigns` — list all campaigns
- `POST /api/campaigns` — create campaign
- `PUT /api/campaigns?id=` — update campaign
- `DELETE /api/campaigns?id=` — delete campaign
- `GET /api/scheduled-messages?campaign_id=` — list scheduled messages for a campaign
- `POST /api/scheduled-messages/process` — process pending queue (fire due messages)

### 6. Enhanced Dashboard (StatsPanel)

- Add a "Active Campaigns" stat card (queries `campaigns` table, `status = 'active'`)
- Add a quick-action card for "Create Campaign" → navigates to Campaigns tab
- Add a quick-action card for "AI Copy Generator" → navigates to AI Copy tab
- Replace the existing "AI Email Generator" quick-action card with the new "AI Copy" card

### 7. Public Site — Services Update

In `app/components/Services.tsx`, add a new service card for the **AI Marketing Engine**:
- Title: "AI Marketing Engine"
- Description: Automated multi-channel outreach, AI-generated ad copy, campaign scheduling, and real-time analytics — all in one platform.
- Icon: `Megaphone` or `Sparkles` from Lucide
- Consistent with existing service card styling

---

## Acceptance Criteria

1. Admin login page displays "Spacze Command Centre" branding.
2. Sidebar and mobile nav show all 6 tabs with correct icons and labels.
3. AI Copy panel generates copy for all 6 platforms in both standalone and lead-linked modes.
4. Campaigns panel allows creating, activating, pausing, and deleting campaigns with multi-channel, multi-lead support.
5. Auto-sequence scheduling correctly computes `scheduled_at` offsets (+0, +3, +7, +14 days) and inserts rows into `scheduled_messages`.
6. Manual scheduling allows per-step date/time override.
7. Analytics panel renders all 4 chart types and the campaign performance table, with campaign and date range filters functional.
8. Dashboard shows 5 stat cards including "Active Campaigns" and updated quick-action cards.
9. Services section on the public site includes the AI Marketing Engine card.
10. All existing functionality (CRM, AI Email, WhatsApp) continues to work unchanged.
11. Dark/light theme tokens apply correctly to all new panels.
12. No TypeScript errors; all new components follow existing code conventions.

---

## Implementation Steps

1. **Install dependencies** — add `react-chartjs-2` and `chart.js` to `package.json`.

2. **Database schema** — create `campaigns` and `scheduled_messages` tables in Supabase. Add types to `lib/supabase.ts`.

3. **API routes**
   - `POST /api/generate-copy/route.ts` — multi-platform AI copy generation
   - `GET|POST|PUT|DELETE /api/campaigns/route.ts` — CRUD for campaigns
   - `GET /api/scheduled-messages/route.ts` — list scheduled messages
   - `POST /api/scheduled-messages/process/route.ts` — process due queue

4. **Rebrand** — update `AdminDashboard.tsx` and `page.tsx` (login) with "Spacze Command Centre" naming.

5. **Navigation restructure** — update `navItems` array and `pageTitle` map in `AdminDashboard.tsx` to 6 tabs.

6. **AICopyPanel** — new `app/admin/AICopyPanel.tsx` with dual-mode UI and platform-specific output rendering.

7. **CampaignsPanel** — new `app/admin/CampaignsPanel.tsx` with campaign list, create modal, scheduling logic, and detail view.

8. **AnalyticsPanel** — new `app/admin/AnalyticsPanel.tsx` with Chart.js charts, filters, and campaign performance table.

9. **StatsPanel update** — add Active Campaigns card and update quick-action cards.

10. **Services.tsx update** — add AI Marketing Engine service card to the public site.

11. **Wire new panels into AdminDashboard** — import and render new panels in the `active` switch.

12. **End-to-end verification** — confirm all 6 tabs render, existing CRM/WhatsApp panels unchanged, charts load, campaign creation and scheduling works.
