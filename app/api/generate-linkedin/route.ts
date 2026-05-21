import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import { SPACZE_VOICE } from '@/lib/ai-persona';

/**
 * POST /api/generate-linkedin
 * Generates a LinkedIn InMail subject + body for a lead.
 * Body: lead object (same shape as /api/generate-email)
 */

function buildPrompt(lead: any): string {
  const aiOpportunity = lead.ai_opportunity      ? `- AI/Automation Opportunity: ${lead.ai_opportunity}` : '';
  const weakPoints    = lead.weak_points         ? `- Weak Points: ${lead.weak_points}`                  : '';
  const improvements  = lead.possible_improvements ? `- Possible Improvements: ${lead.possible_improvements}` : '';

  return `${SPACZE_VOICE}

Write a LinkedIn InMail to the decision-maker at the business below. LinkedIn InMails are read on mobile — keep it tight, human, and skimmable.

PROSPECT:
- Business Name: ${lead.business_name}
${lead.website  ? `- Website: ${lead.website}`   : ''}
${lead.industry ? `- Industry: ${lead.industry}` : ''}
${aiOpportunity}
${weakPoints}
${improvements}

WRITING RULES:
- Subject line: under 8 words, curiosity-driven, no clickbait, no question marks
- Body: 60–90 words maximum — LinkedIn readers skim, shorter wins
- Open with ONE specific, genuine observation about their business — drawn from the analysis, not generic
- Frame it as an opportunity: "I noticed there may be room to…", "there's potential to…"
- NEVER say the website or business is bad, weak, or broken
- One sentence on what Spacze does and why it's relevant to them
- Soft CTA: "Would you be open to a quick chat?" or "Worth a 15-minute call?"
- No bullet points in the body
- No corporate filler: no "I hope this message finds you well", "synergy", "leverage", "touch base"
- Sound like a real person reaching out, not a sales bot
- Industry-specific angle: fashion → ordering/inventory; real estate → lead capture; logistics → process automation; food → customer retention; services → onboarding

Output format (exactly):
SUBJECT: [subject line]
BODY:
[message body]`;
}

async function generateWithOpenAI(prompt: string): Promise<string> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.85,
    max_tokens: 300,
  });
  return res.choices[0].message.content || '';
}

async function generateWithGemini(prompt: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

async function generateWithGroq(prompt: string): Promise<string> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const res = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.85,
    max_tokens: 300,
  });
  return res.choices[0].message.content || '';
}

async function generateWithFallback(prompt: string): Promise<{ raw: string; provider: string }> {
  const providers = [
    { name: 'openai', key: process.env.OPENAI_API_KEY, fn: () => generateWithOpenAI(prompt) },
    { name: 'groq',   key: process.env.GROQ_API_KEY,   fn: () => generateWithGroq(prompt) },
    { name: 'gemini', key: process.env.GEMINI_API_KEY, fn: () => generateWithGemini(prompt) },
  ];
  const configured = providers.filter(p => p.key);
  if (configured.length === 0) throw new Error('No AI provider configured.');
  let lastError: unknown = null;
  for (const p of configured) {
    try { return { raw: await p.fn(), provider: p.name }; }
    catch (e: unknown) { lastError = e; }
  }
  throw lastError ?? new Error('All AI providers failed.');
}

function parseOutput(raw: string) {
  const subjectMatch = raw.match(/SUBJECT:\s*(.+)/i);
  const bodyMatch    = raw.match(/BODY:\s*([\s\S]+)/i);
  return {
    subject: subjectMatch ? subjectMatch[1].trim() : 'Quick thought',
    body:    bodyMatch    ? bodyMatch[1].trim()    : raw,
  };
}

export async function POST(req: NextRequest) {
  try {
    const lead = await req.json();
    const prompt = buildPrompt(lead);
    const { raw, provider } = await generateWithFallback(prompt);
    const { subject, body } = parseOutput(raw);
    return NextResponse.json({ subject, body, provider });
  } catch (err: unknown) {
    console.error('generate-linkedin error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to generate LinkedIn message' }, { status: 500 });
  }
}
