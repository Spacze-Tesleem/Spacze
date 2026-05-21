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

STRUCTURE — write exactly 5 short sentences, each on its own line:
Line 1 — CONTEXT + GENUINE OBSERVATION: One sentence on how you found them and one specific thing you noticed — their page activity, product quality, or engagement. Be concrete and honest — e.g. "I came across [Business Name] and I like how active your page is 🔥" or "I came across [Business Name] while looking at [industry] brands and really liked what you're putting out." This line earns the right to continue. Do NOT skip this.
Line 2 — WARM INTRO: Introduce yourself and Spacze in one sentence — "My name is Tesleem, I run Spacze — we build simple web and automation systems for brands." No pitch yet.
Line 3 — CUSTOMER-FRAMED OBSERVATION: One concrete idea framed from the customer's perspective, not as a business flaw — e.g. "I had an idea that could help make your customers order more smoothly without needing back-and-forth DMs all the time."
Line 4 — DUAL BENEFIT: One sentence naming both the customer benefit and the business benefit — lead with the customer benefit first — e.g. "It could help you save time and make the buying process easier for customers."
Line 5 — CURIOSITY-DRIVEN SOFT ASK: A low-pressure question that invites a reply by offering to *show* something concrete — "Would you like me to show you what I mean?" or "Would it be okay if I showed you a quick example?"

WRITING RULES:
- Each line is ONE sentence — no run-ons, no comma-spliced clauses
- No formal sign-offs, no "I hope this message finds you well"
- Use a single 🔥 emoji on Line 1 for fashion and food industries only — nowhere else
- NEVER say the business is bad, broken, or weak — every observation is an opportunity
- The message must feel like it was sent by a real person with a genuine reason to reach out — not a cold blast
- Total length: 60–90 words — count before outputting
- Industry-specific framing: fashion → customers ordering smoothly without back-and-forth DMs; real estate → clients getting faster responses without chasing; logistics → customers tracking without calling in; food → customers reordering easily without messaging each time; services → customers booking without manual back-and-forth

EXAMPLE of correct tone and structure (do not copy — reference only):
---
I came across Dunnies Collections and I like how active your page is 🔥
My name is Tesleem, I run Spacze — we build simple web and automation systems for brands.
I had an idea that could help make your customers order more smoothly without needing back-and-forth DMs all the time.
It could help you save time and make the buying process easier for customers.
Would you like me to show you what I mean?
---

Output format (exactly):
MESSAGE:
[message here — 5 lines, one sentence each]`;
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
