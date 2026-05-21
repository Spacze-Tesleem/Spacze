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

WRITING RULES:
- Open with ONE specific observation about their business — drawn from the analysis above, not generic
- Frame everything as an opportunity: use "I noticed there may be room to…", "there's potential to…", "could help streamline…"
- NEVER say the website is bad, outdated, broken, or weak
- One short paragraph connecting the observation to what Spacze does
- Mention portfolio casually as a side note, not a pitch: "You can see some of our work at Spacze.vercel.app"
- Close with a single soft CTA: "Would you be open to a quick chat this week?"
- No bullet points in the email body
- No corporate filler: no "I hope this finds you well", "synergy", "leverage", "touch base"
- No spam trigger words
- Industry-specific pain points: if fashion → inventory/ordering flow; if real estate → lead capture/CRM; if logistics → tracking/automation; if food → ordering/booking; if services → client onboarding/scheduling
- Total length: 140–175 words

Goal: start a conversation, not close a sale.

Output format (exactly):
SUBJECT: [subject line — specific, curiosity-driven, under 8 words, no clickbait]
BODY:
[email body]`;
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

WRITING RULES:
- Do NOT open with "just following up", "circling back", "checking in", or any variation
- Open with a NEW, specific insight or industry observation the prospect would find genuinely useful — something not in the first email
- Reference the first email lightly and briefly: "I sent a note a few days ago…" — one clause, not a paragraph
- One sentence connecting the insight to Spacze — keep it natural, not salesy
- Close with a single low-friction question: "Is this something on your radar for this quarter?" or similar
- Tone: warm, peer-to-peer, zero pressure
- No bullet points in the body
- No corporate filler phrases
- Industry-specific angle: if fashion → seasonal demand/DM order volume; if real estate → lead follow-up speed; if logistics → manual tracking costs; if food → repeat customer retention
- Total length: 100–130 words

Output format (exactly):
SUBJECT: [use "Re:" prefix to thread, e.g. "Re: One idea for ${lead.business_name}"]
BODY:
[email body]`;
}

function buildStep3Prompt(lead: any): string {
  return `You are a B2B outreach copywriter for Spacze, a software development and AI automation agency based in Nigeria with global clients.

Write Follow-up #2 for the prospect below. This email is sent ~9–10 days after the initial outreach received no reply. Two emails have already been sent with no response.

PROSPECT:
- Business Name: ${lead.business_name}
- Website: ${lead.website || 'Not provided'}
- Industry: ${lead.industry || 'Not specified'}
- AI/Automation Opportunity: ${lead.ai_opportunity || 'Not assessed'}

WRITING RULES:
- Take a completely different angle from the previous two emails — do NOT repeat the website observation
- Open with a brief, credible result Spacze achieved for a similar business in their industry (reference anonymously: "a recent project for a ${lead.industry || 'similar'} client…")
- Keep the case study to 1–2 sentences — specific and believable, not vague
- One sentence connecting that result to what it could mean for ${lead.business_name}
- Mention Spacze has limited project availability — frame as a heads-up, not fake scarcity
- CTA: low-commitment offer — "Even a 10-minute call would be enough to see if there's a fit"
- Tone: confident, respectful, zero desperation
- No bullet points in the body
- No corporate filler
- Total length: 110–140 words

Output format (exactly):
SUBJECT: [use "Re:" prefix to keep threading]
BODY:
[email body]`;
}

function buildStep4Prompt(lead: any): string {
  return `You are a B2B outreach copywriter for Spacze, a software development and AI automation agency based in Nigeria with global clients.

Write the final "break-up" email for the prospect below. This is sent ~14–16 days after the initial outreach. Three emails have been sent with no reply. This is the last one.

PROSPECT:
- Business Name: ${lead.business_name}
- Industry: ${lead.industry || 'Not specified'}

WRITING RULES:
- Acknowledge they've likely been busy — no blame, no guilt, no passive aggression
- Be direct and honest: "I'll stop reaching out after this so I don't clog your inbox"
- Leave a genuine, warm open invitation: if priorities change, Spacze is here
- One optional sentence of value or curiosity — something memorable, not a pitch
- End warmly and sincerely — wish them well
- Tone: human, gracious, zero pressure — some prospects reply to break-up emails precisely because the pressure is gone
- No bullet points, no corporate filler
- Total length: 80–100 words (shorter is better here)

Output format (exactly):
SUBJECT: [use "Re:" prefix to keep threading]
BODY:
[email body]`;
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