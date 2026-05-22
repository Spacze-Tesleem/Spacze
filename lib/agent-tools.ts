/**
 * Spacze Agent Tool Registry
 *
 * Each tool wraps an existing API route. The AI SDK calls these during the
 * agent loop — the model decides which tool to invoke and with what arguments.
 *
 * Tools are server-side only (called from /api/agent). They use the internal
 * base URL so they go through the same auth middleware as the admin UI.
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
  parameters: z.object({
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
    'Analyse a lead\'s website. Scrapes the site and uses AI to score quality, detect weak points, and identify AI/automation opportunities. Updates the lead record in the CRM. Use this before generating outreach for a lead that hasn\'t been analysed yet.',
  parameters: z.object({
    lead_id: z.string().describe('The UUID of the lead to analyse'),
    website: z.string().url().describe('The lead\'s website URL'),
    business_name: z.string().describe('The lead\'s business name'),
    industry: z.string().optional().describe('The lead\'s industry'),
  }),
  execute: async ({ lead_id, website, business_name, industry }) => {
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
  parameters: z.object({
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
 */
export const sendEmail = tool({
  description:
    'Send an outreach email to a lead. Requires the lead\'s email address, a subject line, and the email body. Updates the lead\'s outreach status in the CRM.',
  parameters: z.object({
    lead_id: z.string().describe('UUID of the lead'),
    to: z.string().email().describe('Recipient email address'),
    subject: z.string().describe('Email subject line'),
    body: z.string().describe('Email body text'),
  }),
  execute: async ({ lead_id, to, subject, body }) => {
    const result = await apiPost('/api/send-email', { lead_id, to, subject, body });
    return result;
  },
});

/**
 * Send a WhatsApp message to a lead via the Baileys worker.
 */
export const sendWhatsApp = tool({
  description:
    'Send a WhatsApp message to a lead via the connected WhatsApp account. The number must include the country code (e.g. +2348012345678).',
  parameters: z.object({
    to: z.string().describe('WhatsApp number with country code (e.g. +2348012345678)'),
    message: z.string().describe('The message to send'),
  }),
  execute: async ({ to, message }) => {
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
 */
export const updateLead = tool({
  description:
    'Update one or more fields on a lead record in the CRM. Use this to mark a lead as contacted, update outreach status, set follow-up dates, or record meeting bookings.',
  parameters: z.object({
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
  }),
  execute: async ({ lead_id, fields }) => {
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
 * Create a campaign and schedule outreach messages for a set of leads.
 */
export const createCampaign = tool({
  description:
    'Create a new outreach campaign targeting a list of leads across one or more channels. Automatically schedules messages at +0, +3, +7, +14 days from today. Returns the created campaign.',
  parameters: z.object({
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
      status: 'active',
      channels,
      lead_ids,
      auto_sequence: true,
      start_date: new Date().toISOString(),
    });

    // Schedule messages: 4 steps × each lead × each channel
    const offsets = [0, 3, 7, 14];
    const rows = lead_ids.flatMap((lead_id) =>
      channels.flatMap((channel) =>
        offsets.map((days) => {
          const d = new Date();
          d.setDate(d.getDate() + days);
          return {
            campaign_id:   campaign.id,
            lead_id,
            channel,
            sequence_step: offsets.indexOf(days) + 1,
            scheduled_at:  d.toISOString(),
            status:        'pending',
          };
        })
      )
    );

    await apiPost('/api/scheduled-messages', rows);
    return {
      campaign_id:      campaign.id,
      name:             campaign.name,
      leads_targeted:   lead_ids.length,
      channels,
      messages_queued:  rows.length,
    };
  },
});

/**
 * Get campaign performance stats.
 */
export const getCampaignStats = tool({
  description:
    'Get performance statistics for all campaigns or a specific campaign. Returns sent/pending/failed message counts and lead reply/meeting rates.',
  parameters: z.object({
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
 */
export const processQueue = tool({
  description:
    'Process the outreach queue — sends all scheduled messages that are due now. Returns how many messages were sent and any failures.',
  parameters: z.object({}),
  execute: async () => {
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
  getCampaignStats,
  processQueue,
};
