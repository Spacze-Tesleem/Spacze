import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

/**
 * POST /api/generate-twitter
 * Generates a Twitter/X DM for a lead.
 * Body: lead object
 */

function buildPrompt(lead: any): string {
  return `You are a B2B outreach copywriter for Spacze, a software development and AI automation agency based in Nigeria with global clients.

Write a Twitter/X Direct Message to the decision-maker at the business below.

PROSPECT:
- Business Name: ${lead.business_name}
- Website: ${lead.website || 'Not provided'}
- Industry: ${lead.industry || 'Not specified'}
- AI/Automation Opportunity: ${lead.ai_opportunity || 'Not assessed'}
- Possible Improvements: ${lead.possible_improvements || 'Not specified'}

WRITING RULES:
- Hard limit: 280 characters including spaces (Twitter DM limit — count carefully)
- Open with a genuine, specific observation about their business — not a generic compliment
- NEVER say the website or business is bad, weak, or broken — frame as opportunity
- One clause on what Spacze does and why it's relevant
- Soft CTA: "Worth a quick chat?" or "Open to connecting?"
- No hashtags, no emojis, no "Hey!" opener, no "I hope this finds you well"
- Sound like a real person reaching out, not a bot or marketing account
- Industry-specific angle: fashion → ordering/store; real estate → lead capture; logistics → automation; food → retention; services → onboarding

Output format (exactly):
MESSAGE: [the DM text — must be 280 characters or fewer]`;
}

async function generateWithOpenAI(prompt: string): Promise<string> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.85,
    max_tokens: 150,
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
    max_tokens: 150,
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

export async function POST(req: NextRequest) {
  try {
    const lead = await req.json();
    const prompt = buildPrompt(lead);
    const { raw, provider } = await generateWithFallback(prompt);
    const msgMatch = raw.match(/MESSAGE:\s*([\s\S]+)/i);
    const message = msgMatch ? msgMatch[1].trim().slice(0, 280) : raw.trim().slice(0, 280);
    return NextResponse.json({ message, provider });
  } catch (err: unknown) {
    console.error('generate-twitter error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to generate Twitter DM' }, { status: 500 });
  }
}
