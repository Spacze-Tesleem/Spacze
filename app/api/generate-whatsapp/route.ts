import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import { SPACZE_VOICE } from '@/lib/ai-persona';

// ─────────────────────────────────────────────
// PROMPT
// ─────────────────────────────────────────────

function buildWhatsAppPrompt(lead: any): string {
  const weakPoints    = lead.weak_points         ? `- Weak Points: ${lead.weak_points}`                  : '';
  const aiOpportunity = lead.ai_opportunity      ? `- AI/Automation Opportunity: ${lead.ai_opportunity}` : '';
  const qualityScore  = lead.website_quality_score != null ? `- Website Quality Score: ${lead.website_quality_score}/10` : '';

  return `${SPACZE_VOICE}

Write a WhatsApp cold outreach message for the prospect below. It must read like a text from a real person — not a marketing message, not a run-on sentence, not a template with a name swapped in.

PROSPECT:
- Business Name: ${lead.business_name}
${lead.website  ? `- Website: ${lead.website}`   : ''}
${lead.industry ? `- Industry: ${lead.industry}` : ''}
${qualityScore}
${weakPoints}
${aiOpportunity}

STRUCTURE — write exactly 4 short sentences, each on its own line:
Line 1: Casual greeting — "Hi [Name]," — then one specific observation about their business drawn from the analysis. Name something concrete (e.g. "I noticed you're taking orders through DMs and WhatsApp" not "I noticed your ordering process"). End the sentence here.
Line 2: One sentence on the consequence or friction of that observation — what it costs them in time, missed sales, or effort. Do NOT mention Spacze yet.
Line 3: One sentence introducing what Spacze does — specific to their situation, not generic. No "streamline", no "leverage", no "automation and online stores" as a vague bundle.
Line 4: Soft question to invite a reply — "Would you be open to a quick chat?" or "Want me to show you what that could look like for [Business Name]?"

WRITING RULES:
- Each line is ONE sentence — no run-ons, no comma-spliced clauses
- No formal sign-offs, no "I hope this message finds you well"
- No emojis unless the industry is fashion or food and the tone is casual
- NEVER say the business is bad, broken, or weak
- Total length: 50–80 words — count before outputting
- Industry-specific detail: fashion → DM/WhatsApp ordering, missed orders, no payment confirmation; real estate → manual lead follow-up, slow response time; logistics → manual tracking, no client portal; food → no online ordering, repeat customer drop-off; services → no booking system, manual scheduling

EXAMPLE of correct tone and structure (do not copy — reference only):
---
Hi Dunnies Collections, I came across your page and noticed you're handling orders through DMs and WhatsApp.
That works when you're starting out, but it gets harder to track as order volume grows — things slip through.
At Spacze, we build simple online stores for fashion brands that handle orders, payments, and confirmations automatically.
Would you be open to a quick chat this week?
---

Output format (exactly):
MESSAGE:
[message here — 4 lines, one sentence each]`;
}

// ─────────────────────────────────────────────
// AI PROVIDERS (reuse same pattern as generate-email)
// ─────────────────────────────────────────────

async function generateWithOpenAI(prompt: string): Promise<string> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.75,
    max_tokens: 350,
  });
  return completion.choices[0].message.content || '';
}

async function generateWithGemini(prompt: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

async function generateWithGroq(prompt: string): Promise<string> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.75,
    max_tokens: 350,
  });
  return completion.choices[0].message.content || '';
}

async function generateWithFallback(prompt: string): Promise<{ raw: string; provider: string }> {
  const providers = [
    { name: 'openai', key: process.env.OPENAI_API_KEY, fn: () => generateWithOpenAI(prompt) },
    { name: 'gemini', key: process.env.GEMINI_API_KEY, fn: () => generateWithGemini(prompt) },
    { name: 'groq',   key: process.env.GROQ_API_KEY,   fn: () => generateWithGroq(prompt) },
  ];

  const configured = providers.filter(p => p.key);
  if (configured.length === 0) {
    throw new Error('No AI provider configured. Set at least one of: OPENAI_API_KEY, GEMINI_API_KEY, GROQ_API_KEY.');
  }

  let lastError: unknown = null;
  for (const provider of configured) {
    try {
      const raw = await provider.fn();
      return { raw, provider: provider.name };
    } catch (err: unknown) {
      console.warn(`${provider.name} failed, trying next:`, err instanceof Error ? err.message : err);
      lastError = err;
    }
  }
  throw lastError ?? new Error('All AI providers failed.');
}

function parseOutput(raw: string): string {
  const match = raw.match(/MESSAGE:\s*([\s\S]+)/i);
  return match ? match[1].trim() : raw.trim();
}

// ─────────────────────────────────────────────
// ROUTE HANDLER
// ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const lead = await req.json();
    const prompt = buildWhatsAppPrompt(lead);
    const { raw, provider } = await generateWithFallback(prompt);
    const message = parseOutput(raw);
    return NextResponse.json({ message, provider });
  } catch (err: unknown) {
    console.error('generate-whatsapp error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to generate message' }, { status: 500 });
  }
}
