/**
 * POST /api/agent
 *
 * Spacze AI Agent — streaming orchestrator.
 *
 * Architecture:
 *   1. Receives a conversation history from the client.
 *   2. Passes it to the model with the full tool registry.
 *   3. The model reasons, calls tools, observes results, and loops until
 *      it has a final answer (maxSteps = 10 prevents infinite loops).
 *   4. Streams the response back using the Vercel AI SDK data stream protocol
 *      so the client can render text tokens and tool call events in real time.
 *
 * Provider fallback: OpenAI → Groq → Gemini (same order as other routes).
 */

import { streamText, stepCountIs, convertToModelMessages, APICallError } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';
import { NextRequest } from 'next/server';
import { agentTools } from '@/lib/agent-tools';
import { SPACZE_VOICE } from '@/lib/ai-persona';

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `${SPACZE_VOICE}

You are the Spacze AI Agent — an autonomous business operator for the Spacze Command Centre.

Your role is to help the Spacze team execute outreach, manage leads, run campaigns, and analyse performance. You have access to the following tools:

READ-ONLY (safe to call immediately):
- getLeads: fetch and filter leads from the CRM
- generateCopy: generate personalised outreach copy for any platform
- getCampaignStats: get performance stats for campaigns

WRITE — TWO-PHASE (always dry_run=true first, then confirm):
- analyzeLead: scrape and score a lead's website; updates the CRM
- sendEmail: send an outreach email to a lead
- sendWhatsApp: send a WhatsApp message to a lead
- updateLead: update a lead's CRM status or fields
- createCampaign [Phase 1]: create a campaign in DRAFT status — no messages scheduled yet
- scheduleCampaign [Phase 2]: activate a draft campaign and queue all messages
- processQueue: fire all scheduled messages that are due now

BEHAVIOUR RULES:
1. Act immediately. Do NOT narrate what you are about to do — just call the tool and then report the results.
2. For every write tool, call it with dry_run=true first. Show the predicted_impact to the user before proceeding.
3. Never call a write tool with dry_run=false unless the user has explicitly confirmed the dry-run preview in this conversation.
4. Campaign two-phase rule: always call createCampaign first (creates a draft), show the plan, wait for confirmation, then call scheduleCampaign. Never call scheduleCampaign without a prior createCampaign in the same conversation.
5. Before sending any message (sendEmail or sendWhatsApp), generate the copy with generateCopy first and include it in your response so the user can read it.
6. When acting on multiple leads, state: how many leads, which channels, total messages that will be sent.
7. After completing a multi-step task, summarise: leads contacted, channels used, any failures.
8. If a tool fails, explain the error and suggest a fix — never silently skip.
9. Keep responses concise. Use bullet points for lists of actions.
10. You are operating inside the Spacze admin — the user is the Spacze team, not a client.
11. NEVER respond with only text when a tool call is needed. If the user asks for data, call the tool first, then respond with the results.`;

// Providers whose keys have permanently failed auth in this process lifetime.
const invalidProviders = new Set<string>();

// ── Provider list (ordered: OpenAI → Groq → Gemini) ──────────────────────────

// Provider order: Gemini → OpenAI → Groq
// Gemini is listed first because it has a generous free tier and supports
// tool calling reliably. Groq is last due to strict rate limits.
function getModels() {
  const models = [];
  if (process.env.GEMINI_API_KEY) {
    const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
    models.push({ name: 'gemini', model: google('gemini-2.0-flash') });
  }
  if (process.env.OPENAI_API_KEY) {
    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    models.push({ name: 'openai', model: openai('gpt-4o') });
  }
  if (process.env.GROQ_API_KEY) {
    const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
    models.push({ name: 'groq', model: groq('llama-3.3-70b-versatile') });
  }
  return models;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  console.log('[agent] providers configured:', getModels().map(m => m.name));

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: 'messages array required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const providers = getModels();
  if (providers.length === 0) {
    return new Response(
      JSON.stringify({ error: 'No AI provider configured. Set OPENAI_API_KEY, GROQ_API_KEY, or GEMINI_API_KEY.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const modelMessages = await convertToModelMessages(messages as any);
  let lastError: unknown;

  for (const { name, model } of providers) {
    // Skip providers whose keys have already failed auth in this process.
    if (invalidProviders.has(name)) continue;

    try {
      const result = streamText({
        model,
        system: SYSTEM_PROMPT,
        messages: modelMessages,
        tools: agentTools,
        stopWhen: stepCountIs(10),
        temperature: 0.4,
        maxRetries: 0,
      });

      return result.toUIMessageStreamResponse();
    } catch (err) {
      lastError = err;

      if (err instanceof APICallError) {
        if (err.statusCode === 401 || err.statusCode === 403) {
          invalidProviders.add(name);
          console.warn(`[agent] ${name}: auth error (${err.statusCode}), blacklisting`);
        } else {
          // 429 rate limit, 400 invalid_request (bad tool schema for this model), 5xx — all fall through
          console.warn(`[agent] ${name}: API error (${err.statusCode}), trying next provider:`, err.message.slice(0, 120));
        }
      } else {
        console.warn(`[agent] ${name}: unexpected error, trying next provider:`, err instanceof Error ? err.message.slice(0, 120) : err);
      }
    }
  }

  const msg = lastError instanceof Error ? lastError.message : 'All AI providers failed';
  return new Response(JSON.stringify({ error: msg }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' },
  });
}
