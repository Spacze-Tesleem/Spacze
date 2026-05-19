import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

// ─────────────────────────────────────────────
// SEQUENCE PROMPTS
// ─────────────────────────────────────────────

function buildStep1Prompt(lead: any): string {
  return `You are an expert B2B outreach copywriter for Spacze, a software development and AI automation agency.

Your task is to write a highly personalised INITIAL cold outreach email based on a company's website analysis.

Business Information:
- Business Name: ${lead.business_name}
- Website: ${lead.website || 'Not provided'}
- Industry: ${lead.industry || 'Not specified'}

Website Analysis:
- Website Quality Score: ${lead.website_quality_score ?? 'N/A'}/10
- Mobile Responsiveness: ${lead.mobile_responsiveness || 'Unknown'}
- SEO Quality: ${lead.seo_quality || 'Unknown'}
- Has Dashboard/System: ${lead.has_dashboard ? 'Yes' : 'No'}
- AI Opportunity: ${lead.ai_opportunity || 'Not assessed'}
- Weak Points Observed: ${lead.weak_points || 'Not specified'}
- Possible Improvements: ${lead.possible_improvements || 'Not specified'}

Tone & Framing Rules:
- NEVER say the website is bad, weak, outdated, poor, or broken
- Frame all observations as opportunities, not problems
- Sound like a real person who genuinely spent time on their website
- Use language like: "I noticed there may be an opportunity to…", "a more streamlined experience could help…", "there's strong potential to…"
- One specific, natural observation from their website — no bullet lists
- Transition smoothly into how Spacze can help (one short paragraph)
- End with a soft, low-pressure CTA: "Would you be open to a quick chat this week?"
- Avoid corporate filler, AI-sounding phrases, and spam trigger words
- Total length: 140–175 words

Portfolio mention: "You can take a look at some of our work here: Spacze.vercel.app" — make this feel like a casual aside, not a pitch.

The reader should feel: "This person actually looked at our business and has something worth saying."
Goal: Start a conversation, not close a sale.

Output format (exactly):
SUBJECT: [subject line here]
BODY:
[email body here]`;
}

function buildStep2Prompt(lead: any): string {
  return `You are an expert B2B outreach copywriter for Spacze, a software development and AI automation agency.

Your task is to write a FOLLOW-UP email (Follow-up #1, sent ~3–4 days after the initial email received no reply).

Context:
- The prospect has already received one email from Spacze but has not replied
- Do NOT re-send or summarise the original email
- Do NOT say "just following up" or "circling back" — these are weak openers
- Instead, add NEW value: share a brief insight, observation, or relevant idea specific to their business

Business Information:
- Business Name: ${lead.business_name}
- Website: ${lead.website || 'Not provided'}
- Industry: ${lead.industry || 'Not specified'}
- AI Opportunity: ${lead.ai_opportunity || 'Not assessed'}
- Possible Improvements: ${lead.possible_improvements || 'Not specified'}

Instructions:
- Open with a new, specific observation or insight relevant to their industry or business — something they'd find genuinely useful
- Keep the connection to Spacze natural and brief — one sentence max
- Reference the previous email lightly: "I sent a note earlier this week…" or "I reached out a few days ago…"
- Ask a single low-friction question to invite a reply (e.g. "Is this something on your radar for [quarter/year]?")
- Tone: warm, peer-to-peer, never pushy
- Total length: 100–130 words

Output format (exactly):
SUBJECT: [subject line here — use "Re:" prefix to thread with first email, e.g. "Re: One idea for [Business Name]"]
BODY:
[email body here]`;
}

function buildStep3Prompt(lead: any): string {
  return `You are an expert B2B outreach copywriter for Spacze, a software development and AI automation agency.

Your task is to write a SECOND FOLLOW-UP email (Follow-up #2, sent ~7 days after the initial email received no reply).

Context:
- Two previous emails sent, no reply received
- This email should take a DIFFERENT angle — not repeating the website observation
- Shift focus to: results Spacze has delivered for a similar business, a quick win they could implement, or a question about their current priorities
- Create soft urgency around Spacze's availability, not fake scarcity

Business Information:
- Business Name: ${lead.business_name}
- Website: ${lead.website || 'Not provided'}
- Industry: ${lead.industry || 'Not specified'}
- AI Opportunity: ${lead.ai_opportunity || 'Not assessed'}

Instructions:
- Open with a reference to a result or project relevant to their industry (you can reference "a recent project for a [industry] client" without naming them)
- Pivot to what that result could mean for ${lead.business_name}
- Mention Spacze currently has a limited number of project slots — frame it as FYI, not pressure
- Single CTA: offer a specific, low-commitment option ("Even a 10-minute call would be enough to see if there's a fit")
- Tone: confident but respectful, zero desperation
- Total length: 110–140 words

Output format (exactly):
SUBJECT: [subject line — keep threading, use "Re:" prefix]
BODY:
[email body here]`;
}

function buildStep4Prompt(lead: any): string {
  return `You are an expert B2B outreach copywriter for Spacze, a software development and AI automation agency.

Your task is to write a FINAL "BREAKUP" email (Follow-up #3, sent ~14 days after the initial email — the last email in the sequence).

Context:
- Three previous emails sent, no reply received
- This is the last email in the sequence — after this, Spacze will not follow up
- The tone should be gracious, human, and completely pressure-free
- The goal is to leave the door open forever, not burn the bridge
- Some prospects reply to breakup emails precisely because the pressure is gone

Business Information:
- Business Name: ${lead.business_name}
- Industry: ${lead.industry || 'Not specified'}

Instructions:
- Open by acknowledging they've been busy — no blame, no guilt
- Be honest: "I'll stop reaching out after this so I don't clog your inbox"
- Leave a genuine open invitation: if their priorities change, Spacze is here
- You can add a single sentence of value or curiosity to make it memorable
- End warmly — wish them well, mean it
- Tone: human, gracious, completely low-pressure
- Total length: 80–110 words (shorter = better for this step)

Output format (exactly):
SUBJECT: [subject line — keep "Re:" threading]
BODY:
[email body here]`;
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

  let lastError: Error | null = null;
  for (const provider of configured) {
    try {
      const raw = await provider.fn();
      return { raw, provider: provider.name };
    } catch (err: any) {
      console.warn(`${provider.name} failed, trying next provider:`, err.message);
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
  } catch (err: any) {
    console.error('generate-email error:', err);
    return NextResponse.json({ error: err.message || 'Failed to generate email' }, { status: 500 });
  }
}