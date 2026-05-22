/**
 * Spacze Agent Tool Registry
 *
 * Each tool wraps an existing API route. The AI SDK calls these during the
 * agent loop — the model decides which tool to invoke and with what arguments.
 *
 * Tools are server-side only (called from /api/agent). They use the internal
 * base URL so they go through the same auth middleware as the admin UI.
 *
 * Safety model
 * ────────────
 * Read-only tools (getLeads, generateCopy, getCampaignStats) execute immediately.
 *
 * Destructive tools (sendEmail, sendWhatsApp, updateLead, createCampaign,
 * scheduleCampaign, processQueue) accept a `dry_run` flag.
 * When dry_run=true the tool returns a predicted_impact summary without
 * touching the database or sending any messages. The agent must present
 * this summary and wait for explicit user confirmation before calling
 * the same tool with dry_run=false.
 *
 * Campaign two-phase commit
 * ─────────────────────────
 * createCampaign  → creates a DRAFT record only, returns a plan for review.
 * scheduleCampaign → activates the draft and bulk-inserts scheduled messages.
 * The agent must never call scheduleCampaign without user confirmation of the
 * createCampaign summary.
 */

import { tool } from 'ai';
import { z } from 'zod';
import { getSupabaseAdmin } from './supabase-admin';

// ── Helpers ───────────────────────────────────────────────────────────────────

function baseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

async function apiPost(path: string, body: unknown) {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `${path} failed (${res.status})`);
  return data;
}

async function apiGet(path: string) {
  const res = await fetch(`${baseUrl()}${path}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `${path} failed (${res.status})`);
  return data;
}

// ── Tool definitions ──────────────────────────────────────────────────────────

/**
 * Fetch leads from the CRM, optionally filtered by industry or outreach status.
 */
export const getLeads = tool({
  description:
    'Fetch leads from the CRM. Optionally filter by industry (e.g. "logistics", "fashion") or outreach status ("Pending", "Sent", "Replied", "Meeting Booked", "Not Interested"). Returns an array of lead objects.',
  inputSchema: z.object({
    industry: z
      .string()
      .optional()
      .describe('Filter leads by industry keyword (case-insensitive partial match)'),
    outreach_status: z
      .enum(['Pending', 'Sent', 'Replied', 'Meeting Booked', 'Not Interested'])
      .optional()
      .describe('Filter leads by outreach status'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .default(20)
      .describe('Maximum number of leads to return'),
  }),
  execute: async ({ industry, outreach_status, limit }) => {
    const db = getSupabaseAdmin();
    let query = db
      .from('leads')
      .select('id,business_name,industry,contact_email,whatsapp_number,outreach_status,website,ai_opportunity,weak_points,possible_improvements,website_quality_score')
      .order('created_at', { ascending: false })
      .limit(limit ?? 20);

    if (outreach_status) query = query.eq('outreach_status', outreach_status);
    if (industry) query = query.ilike('industry', `%${industry}%`);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return { leads: data ?? [], count: (data ?? []).length };
  },
});

/**
 * Analyse a lead's website — scrapes it and scores it with AI.
 */
export const analyzeLead = tool({
  description:
    "Analyse a lead's website. Scrapes the site and uses AI to score quality, detect weak points, and identify AI/automation opportunities. " +
    'Set dry_run=true to preview what will be analysed without updating the CRM. ' +
    "Set dry_run=false (default) to run the full analysis and update the lead record.",
  inputSchema: z.object({
    lead_id: z.string().describe('The UUID of the lead to analyse'),
    website: z.string().describe("The lead's website URL"),
    business_name: z.string().describe("The lead's business name"),
    industry: z.string().optional().describe("The lead's industry"),
    dry_run: z
      .boolean()
      .optional()
      .default(false)
      .describe('If true, preview what will be analysed without modifying the database.'),
  }),
  execute: async ({ lead_id, website, business_name, industry, dry_run }) => {
    if (dry_run) {
      return {
        dry_run: true,
        predicted_impact: {
          action: 'analyse_lead',
          lead_id,
          business_name,
          website,
          will_update_fields: [
            'website_quality_score',
            'mobile_responsiveness',
            'seo_quality',
            'has_dashboard',
            'ai_opportunity',
            'weak_points',
            'possible_improvements',
          ],
          note: 'Scrapes the website via Jina Reader then scores it with AI. No database changes until dry_run=false.',
        },
      };
    }
    const result = await apiPost('/api/analyze-lead', {
      leadId: lead_id,
      website,
      business_name,
      industry,
    });
    return result;
  },
});

/**
 * Generate outreach copy for a specific platform using a lead's CRM data.
 */
export const generateCopy = tool({
  description:
    'Generate AI outreach copy for a lead on a specific platform. Platforms: instagram, twitter, google_ads, email, whatsapp, linkedin. Uses the lead\'s CRM data (industry, weak points, AI opportunity) to personalise the copy.',
  inputSchema: z.object({
    lead_id: z.string().describe('UUID of the lead to generate copy for'),
    platform: z
      .enum(['instagram', 'twitter', 'google_ads', 'email', 'whatsapp', 'linkedin'])
      .describe('The platform to generate copy for'),
    tone: z
      .enum(['Professional', 'Friendly', 'Bold', 'Urgent'])
      .optional()
      .default('Professional')
      .describe('Tone of the copy'),
    goal: z
      .enum(['Awareness', 'Clicks', 'Leads', 'Sales'])
      .optional()
      .default('Leads')
      .describe('Goal of the copy'),
  }),
  execute: async ({ lead_id, platform, tone, goal }) => {
    // Fetch the lead first to get context
    const db = getSupabaseAdmin();
    const { data: lead, error } = await db
      .from('leads')
      .select('*')
      .eq('id', lead_id)
      .single();
    if (error || !lead) throw new Error(`Lead ${lead_id} not found`);

    const result = await apiPost('/api/generate-copy', {
      platform,
      tone,
      goal,
      businessName:         lead.business_name,
      industry:             lead.industry,
      aiOpportunity:        lead.ai_opportunity,
      weakPoints:           lead.weak_points,
      possibleImprovements: lead.possible_improvements,
      website:              lead.website,
    });
    return { lead: lead.business_name, platform, ...result };
  },
});

/**
 * Send an email to a lead.
 * dry_run=true returns a preview without delivering the email.
 */
export const sendEmail = tool({
  description:
    "Send an outreach email to a lead. Requires the lead's email address, a subject line, and the email body. Updates the lead's outreach status in the CRM. " +
    'ALWAYS call with dry_run=true first, show the preview to the user, and only call with dry_run=false after explicit confirmation.',
  inputSchema: z.object({
    lead_id: z.string().describe('UUID of the lead'),
    to: z.string().describe('Recipient email address'),
    subject: z.string().describe('Email subject line'),
    body: z.string().describe('Email body text'),
    dry_run: z
      .boolean()
      .optional()
      .default(false)
      .describe('If true, preview the email without sending it. Always use true first.'),
  }),
  execute: async ({ lead_id, to, subject, body, dry_run }) => {
    if (dry_run) {
      return {
        dry_run: true,
        predicted_impact: {
          action: 'send_email',
          lead_id,
          to,
          subject,
          body_preview: body.slice(0, 300) + (body.length > 300 ? '…' : ''),
          note: "Email will be delivered and the lead's outreach_status set to \"Sent\" when dry_run=false.",
        },
      };
    }
    const result = await apiPost('/api/send-email', { lead_id, to, subject, body });
    return result;
  },
});

/**
 * Send a WhatsApp message to a lead via the Baileys worker.
 * dry_run=true returns a preview without sending.
 */
export const sendWhatsApp = tool({
  description:
    'Send a WhatsApp message to a lead via the connected WhatsApp account. The number must include the country code (e.g. +2348012345678). ' +
    'ALWAYS call with dry_run=true first, show the preview to the user, and only call with dry_run=false after explicit confirmation.',
  inputSchema: z.object({
    to: z.string().describe('WhatsApp number with country code (e.g. +2348012345678)'),
    message: z.string().describe('The message to send'),
    dry_run: z
      .boolean()
      .optional()
      .default(false)
      .describe('If true, preview the message without sending it. Always use true first.'),
  }),
  execute: async ({ to, message, dry_run }) => {
    if (dry_run) {
      return {
        dry_run: true,
        predicted_impact: {
          action: 'send_whatsapp',
          to,
          message_preview: message.slice(0, 300) + (message.length > 300 ? '…' : ''),
          note: 'Message will be delivered via the connected WhatsApp account when dry_run=false.',
        },
      };
    }
    const result = await apiPost('/api/whatsapp-worker', {
      action: 'send',
      to,
      message,
    });
    return result;
  },
});

/**
 * Update a lead's CRM fields.
 * dry_run=true previews the change without writing to the database.
 */
export const updateLead = tool({
  description:
    'Update one or more fields on a lead record in the CRM. Use this to mark a lead as contacted, update outreach status, set follow-up dates, or record meeting bookings. ' +
    'Use dry_run=true to preview the update before committing.',
  inputSchema: z.object({
    lead_id: z.string().describe('UUID of the lead to update'),
    fields: z
      .object({
        outreach_status: z
          .enum(['Pending', 'Sent', 'Replied', 'Meeting Booked', 'Not Interested'])
          .optional(),
        response_status: z
          .enum(['None', 'Positive', 'Negative', 'No Reply', 'Bounced'])
          .optional(),
        follow_up_date: z.string().optional().describe('ISO date string for follow-up'),
        meeting_booked: z.boolean().optional(),
        reply_received: z.boolean().optional(),
        email_sent: z.boolean().optional(),
      })
      .describe('Fields to update on the lead'),
    dry_run: z
      .boolean()
      .optional()
      .default(false)
      .describe('If true, preview the update without writing to the database.'),
  }),
  execute: async ({ lead_id, fields, dry_run }) => {
    if (dry_run) {
      return {
        dry_run: true,
        predicted_impact: {
          action: 'update_lead',
          lead_id,
          fields_to_write: { ...fields, last_contacted: new Date().toISOString() },
          note: 'Lead record will be updated in the CRM when dry_run=false.',
        },
      };
    }
    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from('leads')
      .update({ ...fields, last_contacted: new Date().toISOString() })
      .eq('id', lead_id)
      .select('id,business_name,outreach_status')
      .single();
    if (error) throw new Error(error.message);
    return { updated: data };
  },
});

/**
 * Phase 1 — create a campaign record in DRAFT status.
 * Does NOT schedule any messages. Returns a plan summary for user review.
 * After showing the summary, ask the user to confirm before calling scheduleCampaign.
 */
export const createCampaign = tool({
  description:
    'Phase 1 of 2: Create a new outreach campaign in DRAFT status. ' +
    'This does NOT schedule or send any messages — it only creates the campaign record. ' +
    'After calling this, present the plan summary to the user and wait for explicit confirmation before calling scheduleCampaign.',
  inputSchema: z.object({
    name: z.string().describe('Campaign name'),
    description: z.string().optional().describe('Campaign description'),
    lead_ids: z.array(z.string()).describe('Array of lead UUIDs to target'),
    channels: z
      .array(z.enum(['email', 'whatsapp', 'linkedin', 'twitter']))
      .describe('Channels to use for outreach'),
  }),
  execute: async ({ name, description, lead_ids, channels }) => {
    const campaign = await apiPost('/api/campaigns', {
      name,
      description: description ?? '',
      status: 'draft',
      channels,
      lead_ids,
      auto_sequence: true,
      start_date: new Date().toISOString(),
    });

    const offsets = [0, 3, 7, 14];
    const totalMessages = lead_ids.length * channels.length * offsets.length;

    return {
      campaign_id:       campaign.id,
      name:              campaign.name,
      status:            'draft',
      leads_targeted:    lead_ids.length,
      channels,
      messages_to_queue: totalMessages,
      schedule_preview:  offsets.map((days) => {
        const d = new Date();
        d.setDate(d.getDate() + days);
        return {
          step:          offsets.indexOf(days) + 1,
          send_date:     d.toISOString().split('T')[0],
          days_from_now: days,
        };
      }),
      next_step:
        `Campaign saved as draft. Call scheduleCampaign with campaign_id="${campaign.id}" only after the user confirms they want to queue ${totalMessages} messages across ${channels.join(', ')}.`,
    };
  },
});

/**
 * Phase 2 — activate a draft campaign and bulk-insert all scheduled messages.
 * Only call this after the user has explicitly confirmed the createCampaign summary.
 * dry_run=true shows the full schedule without inserting any rows.
 */
export const scheduleCampaign = tool({
  description:
    'Phase 2 of 2: Activate a draft campaign and schedule all outreach messages. ' +
    'Only call this after the user has confirmed the plan from createCampaign. ' +
    'Use dry_run=true to show the exact schedule without inserting any messages.',
  inputSchema: z.object({
    campaign_id: z.string().describe('UUID of the draft campaign returned by createCampaign'),
    lead_ids: z.array(z.string()).describe('Same lead UUIDs passed to createCampaign'),
    channels: z
      .array(z.enum(['email', 'whatsapp', 'linkedin', 'twitter']))
      .describe('Same channels passed to createCampaign'),
    dry_run: z
      .boolean()
      .optional()
      .default(false)
      .describe('If true, return the full schedule preview without inserting any messages.'),
  }),
  execute: async ({ campaign_id, lead_ids, channels, dry_run }) => {
    const offsets = [0, 3, 7, 14];
    const rows = lead_ids.flatMap((lead_id) =>
      channels.flatMap((channel) =>
        offsets.map((days) => {
          const d = new Date();
          d.setDate(d.getDate() + days);
          return {
            campaign_id,
            lead_id,
            channel,
            sequence_step: offsets.indexOf(days) + 1,
            scheduled_at:  d.toISOString(),
            status:        'pending',
          };
        })
      )
    );

    if (dry_run) {
      return {
        dry_run: true,
        predicted_impact: {
          action:            'schedule_campaign',
          campaign_id,
          messages_to_queue: rows.length,
          channels,
          leads_count:       lead_ids.length,
          schedule:          offsets.map((days) => {
            const d = new Date();
            d.setDate(d.getDate() + days);
            return {
              step:          offsets.indexOf(days) + 1,
              send_date:     d.toISOString().split('T')[0],
              days_from_now: days,
            };
          }),
          note: `Will insert ${rows.length} scheduled_messages rows and set campaign status to "active" when dry_run=false.`,
        },
      };
    }

    await apiPost('/api/scheduled-messages', rows);

    const db = getSupabaseAdmin();
    await db.from('campaigns').update({ status: 'active' }).eq('id', campaign_id);

    return {
      campaign_id,
      status:          'active',
      messages_queued: rows.length,
      channels,
      leads_targeted:  lead_ids.length,
    };
  },
});

/**
 * Get campaign performance stats.
 */
export const getCampaignStats = tool({
  description:
    'Get performance statistics for all campaigns or a specific campaign. Returns sent/pending/failed message counts and lead reply/meeting rates.',
  inputSchema: z.object({
    campaign_id: z
      .string()
      .optional()
      .describe('UUID of a specific campaign, or omit for all campaigns'),
  }),
  execute: async ({ campaign_id }) => {
    const db = getSupabaseAdmin();

    const campQuery = db.from('campaigns').select('*').order('created_at', { ascending: false });
    const { data: campaigns } = campaign_id
      ? await campQuery.eq('id', campaign_id)
      : await campQuery;

    const { data: messages } = await db
      .from('scheduled_messages')
      .select('campaign_id,status,channel')
      .in('campaign_id', (campaigns ?? []).map((c: { id: string }) => c.id));

    return (campaigns ?? []).map((c: { id: string; name: string; status: string; lead_ids: string[] }) => {
      const msgs = (messages ?? []).filter((m: { campaign_id: string }) => m.campaign_id === c.id);
      return {
        id:       c.id,
        name:     c.name,
        status:   c.status,
        leads:    (c.lead_ids ?? []).length,
        sent:     msgs.filter((m: { status: string }) => m.status === 'sent').length,
        pending:  msgs.filter((m: { status: string }) => m.status === 'pending').length,
        failed:   msgs.filter((m: { status: string }) => m.status === 'failed').length,
      };
    });
  },
});

/**
 * Process the scheduled message queue — fires all due messages.
 * dry_run=true shows how many messages are due without sending them.
 */
export const processQueue = tool({
  description:
    'Process the outreach queue — sends all scheduled messages that are due now. Returns how many messages were sent and any failures. ' +
    'Use dry_run=true to preview how many messages are due before firing them.',
  inputSchema: z.object({
    dry_run: z
      .boolean()
      .optional()
      .default(false)
      .describe('If true, count due messages without sending them.'),
  }),
  execute: async ({ dry_run }) => {
    if (dry_run) {
      const db = getSupabaseAdmin();
      const { data, error } = await db
        .from('scheduled_messages')
        .select('id,channel,lead_id,scheduled_at')
        .eq('status', 'pending')
        .lte('scheduled_at', new Date().toISOString());

      if (error) throw new Error(error.message);
      const due = data ?? [];

      return {
        dry_run: true,
        predicted_impact: {
          action:       'process_queue',
          messages_due: due.length,
          by_channel:   due.reduce((acc: Record<string, number>, m: { channel: string }) => {
            acc[m.channel] = (acc[m.channel] ?? 0) + 1;
            return acc;
          }, {}),
          note: `Will send ${due.length} messages when dry_run=false.`,
        },
      };
    }
    const result = await apiPost('/api/scheduled-messages/process', {});
    return result;
  },
});

// ── Exported registry ─────────────────────────────────────────────────────────

export const agentTools = {
  getLeads,
  analyzeLead,
  generateCopy,
  sendEmail,
  sendWhatsApp,
  updateLead,
  createCampaign,
  scheduleCampaign,
  getCampaignStats,
  processQueue,
};
