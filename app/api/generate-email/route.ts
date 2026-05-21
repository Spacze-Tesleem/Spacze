import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

// ─────────────────────────────────────────────
// SEQUENCE PROMPTS
// ─────────────────────────────────────────────

function buildStep1Prompt(lead: any): string {
  return `You are a B2B outreach copywriter for Spacze, a software development and AI automation agency based in Nigeria with global clients.

Write a personalised cold outreach email for the prospect below. The reader should feel that a real person looked at their business and has something genuinely worth saying — not that they received a template.

PROSPECT:
- Business Name: ${lead.business_name}
- Website: ${lead.website || 'Not provided'}
- Industry: ${lead.industry || 'Not specified'}
- Website Quality Score: ${lead.website_quality_score ?? 'N/A'}/10
- Mobile Responsiveness: ${lead.mobile_responsiveness || 'Unknown'}
- SEO Quality: ${lead.seo_quality || 'Unknown'}
- Has Internal Dashboard/System: ${lead.has_dashboard ? 'Yes' : 'No'}
- AI/Automation Opportunity: ${lead.ai_opportunity || 'Not assessed'}
- Weak Points Observed: ${lead.weak_points || 'Not specified'}
- Possible Improvements: ${lead.possible_improvements || 'Not specified'}

STRUCTURE — the email must have all four of these parts:
1. Greeting: "Hi [Business Name] team," or "Hi [Business Name],"
2. Opening observation (1–2 sentences): ONE specific thing noticed about their business, framed as an opportunity
3. Body (2–3 sentences): what Spacze does, why it's relevant to them, casual portfolio mention
4. Closing (1–2 sentences): soft CTA + sign-off from "Tesleem at Spacze"

WRITING RULES:
- Frame everything as an opportunity: "I noticed there may be room to…", "there's potential to…", "could help streamline…"
- NEVER say the website is bad, outdated, broken, or weak
- Mention portfolio casually: "You can see some of our work at Spacze.vercel.app"
- Close with: "Would you be open to a quick chat this week?"
- Sign off: "Tesleem / Spacze"
- No bullet points in the email body
- No corporate filler: no "I hope this finds you well", "synergy", "leverage", "touch base"
- No spam trigger words
- Industry-specific pain points: fashion → DM/WhatsApp ordering flow, no storefront; real estate → manual lead follow-up, no CRM; logistics → manual tracking, no client portal; food → no online ordering or booking; services → no client onboarding or scheduling system
- WORD COUNT: the body must be 140–175 words. Count carefully before outputting.

EXAMPLE of the correct length, tone, and structure (do not copy this — use it as a reference only):
---
Hi Dunnies Collections,

I came across your Instagram page and noticed you're doing really well with engagement — your posts get solid interaction. One thing I imagine could help is having a proper storefront to handle orders, rather than managing everything through DMs and WhatsApp. That kind of manual process tends to get harder to keep up with as you grow.

At Spacze, we build e-commerce systems and automation tools for fashion brands that want to sell more without the back-and-forth. We've helped similar businesses move from DM ordering to a clean, automated store that handles payments, confirmations, and follow-ups automatically. You can see some of our work at Spacze.vercel.app.

Would you be open to a quick chat this week? Even 15 minutes would be enough to see if there's something useful here.

Tesleem
Spacze
---

Goal: start a conversation, not close a sale.

Output format (exactly):
SUBJECT: [subject line — specific, curiosity-driven, under 8 words, no clickbait]
BODY:
[email body — must include greeting, observation, body paragraphs, CTA, and sign-off]`;
}

function buildStep2Prompt(lead: any): string {
  return `You are a B2B outreach copywriter for Spacze, a software development and AI automation agency based in Nigeria with global clients.

Write Follow-up #1 for the prospect below. This email is sent ~3–4 days after the initial outreach received no reply.

PROSPECT:
- Business Name: ${lead.business_name}
- Website: ${lead.website || 'Not provided'}
- Industry: ${lead.industry || 'Not specified'}
- AI/Automation Opportunity: ${lead.ai_opportunity || 'Not assessed'}
- Possible Improvements: ${lead.possible_improvements || 'Not specified'}

STRUCTURE — the email must have all four of these parts:
1. Greeting: "Hi [Business Name] team," or "Hi [Business Name],"
2. New insight (1–2 sentences): a fresh, specific observation or industry fact — NOT a repeat of the first email
3. Light reference + connection (1–2 sentences): briefly mention the first email, one sentence on Spacze's relevance
4. Closing question + sign-off from "Tesleem at Spacze"

WRITING RULES:
- Do NOT open with "just following up", "circling back", "checking in", or any variation
- The new insight must be something the prospect would find genuinely useful on its own
- Reference the first email in one clause only: "I sent a note a few days ago…"
- Close with a low-friction question: "Is this something on your radar?" or "Worth a quick conversation?"
- Tone: warm, peer-to-peer, zero pressure
- No bullet points in the body
- No corporate filler
- Industry-specific angle: fashion → seasonal demand/DM order volume; real estate → lead follow-up speed; logistics → manual tracking costs; food → repeat customer retention; services → client churn/onboarding drop-off
- Sign off: "Tesleem / Spacze"
- WORD COUNT: the body must be 100–130 words. Count carefully before outputting.

Output format (exactly):
SUBJECT: [use "Re:" prefix to thread, e.g. "Re: One idea for ${lead.business_name}"]
BODY:
[email body — must include greeting, new insight, light reference, closing question, and sign-off]`;
}

function buildStep3Prompt(lead: any): string {
  return `You are a B2B outreach copywriter for Spacze, a software development and AI automation agency based in Nigeria with global clients.

Write Follow-up #2 for the prospect below. This email is sent ~9–10 days after the initial outreach received no reply. Two emails have already been sent with no response.

PROSPECT:
- Business Name: ${lead.business_name}
- Website: ${lead.website || 'Not provided'}
- Industry: ${lead.industry || 'Not specified'}
- AI/Automation Opportunity: ${lead.ai_opportunity || 'Not assessed'}

STRUCTURE — the email must have all four of these parts:
1. Greeting: "Hi [Business Name] team," or "Hi [Business Name],"
2. Case study (1–2 sentences): a specific, credible result Spacze achieved for a similar business — anonymous reference
3. Connection + availability note (1–2 sentences): link the result to this prospect, mention limited slots as a heads-up
4. Low-commitment CTA + sign-off from "Tesleem at Spacze"

WRITING RULES:
- Take a completely different angle from the previous two emails — do NOT repeat the website observation
- Case study must be specific and believable: include a metric or outcome (e.g. "cut order processing time by half", "reduced missed enquiries by 60%", "went from DM chaos to a clean automated store in 3 weeks")
- Reference anonymously: "a recent project for a ${lead.industry || 'similar'} client…"
- Mention Spacze has limited project slots — frame as a heads-up, not fake scarcity
- CTA: "Even a 10-minute call would be enough to see if there's a fit"
- Tone: confident, respectful, zero desperation
- No bullet points in the body
- No corporate filler
- Sign off: "Tesleem / Spacze"
- WORD COUNT: the body must be 110–140 words. Count carefully before outputting.

Output format (exactly):
SUBJECT: [use "Re:" prefix to keep threading]
BODY:
[email body — must include greeting, case study, connection, CTA, and sign-off]`;
}

function buildStep4Prompt(lead: any): string {
  return `You are a B2B outreach copywriter for Spacze, a software development and AI automation agency based in Nigeria with global clients.

Write the final "break-up" email for the prospect below. This is sent ~14–16 days after the initial outreach. Three emails have been sent with no reply. This is the last one.

PROSPECT:
- Business Name: ${lead.business_name}
- Industry: ${lead.industry || 'Not specified'}

STRUCTURE — the email must have all three of these parts:
1. Greeting: "Hi [Business Name] team," or "Hi [Business Name],"
2. Body (3–4 sentences): acknowledge they're busy, be honest this is the last email, leave the door open warmly, one optional memorable line
3. Warm sign-off from "Tesleem at Spacze"

WRITING RULES:
- Acknowledge they've likely been busy — no blame, no guilt, no passive aggression
- Be direct: "I'll stop reaching out after this so I don't clog your inbox"
- Leave a genuine open invitation: if priorities change, Spacze is here
- One optional sentence of curiosity or value — something memorable, not a pitch
- End warmly and sincerely — wish them well
- Tone: human, gracious, zero pressure — some prospects reply to break-up emails precisely because the pressure is gone
- No bullet points, no corporate filler
- Sign off: "Tesleem / Spacze"
- WORD COUNT: the body must be 80–100 words. Shorter is better here — do not pad.

Output format (exactly):
SUBJECT: [use "Re:" prefix to keep threading]
BODY:
[email body — must include greeting, honest break-up message, open invitation, and warm sign-off]`;
}

function buildPrompt(lead: any, step: number): string {
  switch (step) {
    case 1: return buildStep1Prompt(lead);
    case 2: return buildStep2Prompt(lead);
    case 3: return buildStep3Prompt(lead);
    case 4: return buildStep4Prompt(lead);
    default: return buildStep1Prompt(lead);
  }
}

// ─────────────────────────────────────────────
// OUTPUT PARSER
// ─────────────────────────────────────────────

function parseOutput(raw: string) {
  const subjectMatch = raw.match(/SUBJECT:\s*(.+)/i);
  const bodyMatch = raw.match(/BODY:\s*([\s\S]+)/i);
  return {
    subject: subjectMatch ? subjectMatch[1].trim() : 'Quick thought about your website',
    body: bodyMatch ? bodyMatch[1].trim() : raw,
  };
}

// ─────────────────────────────────────────────
// AI PROVIDERS
// ─────────────────────────────────────────────

async function generateWithOpenAI(prompt: string): Promise<string> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.85,
    max_tokens: 600,
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
    temperature: 0.85,
    max_tokens: 600,
  });
  return completion.choices[0].message.content || '';
}

async function generateWithFallback(prompt: string): Promise<{ raw: string; provider: string }> {
  // Order: OpenAI → Groq → Gemini (Gemini free tier exhausts quickly)
  const providers: Array<{ name: string; key: string | undefined; fn: () => Promise<string> }> = [
    { name: 'openai', key: process.env.OPENAI_API_KEY, fn: () => generateWithOpenAI(prompt) },
    { name: 'groq',   key: process.env.GROQ_API_KEY,   fn: () => generateWithGroq(prompt) },
    { name: 'gemini', key: process.env.GEMINI_API_KEY, fn: () => generateWithGemini(prompt) },
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
      console.warn(`${provider.name} failed, trying next provider:`, err instanceof Error ? err.message : err);
      lastError = err;
    }
  }

  throw lastError ?? new Error('All AI providers failed.');
}

// ─────────────────────────────────────────────
// ROUTE HANDLER
// ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // sequenceStep: 1 = initial, 2 = follow-up 1, 3 = follow-up 2, 4 = breakup
    const { sequenceStep = 1, ...lead } = body;
    const step = Number(sequenceStep);

    const prompt = buildPrompt(lead, step);
    const { raw, provider } = await generateWithFallback(prompt);
    const { subject, body: emailBody } = parseOutput(raw);

    return NextResponse.json({ subject, body: emailBody, provider, step });
  } catch (err: unknown) {
    console.error('generate-email error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to generate email' }, { status: 500 });
  }
}