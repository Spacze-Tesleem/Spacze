import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

/**
 * POST /api/generate-google-ads
 * Generates Google Ads responsive search ad copy (headlines + descriptions).
 */

function buildPrompt(lead: any): string {
  return `You are a Google Ads copywriter for Spacze, a software development and AI automation agency based in Nigeria with global clients.

Write Google Ads Responsive Search Ad copy for the business below. Google Ads copy is read by people actively searching — every character must be intentional and benefit-driven.

PROSPECT:
- Business: ${lead.business_name || 'Not specified'}
- Industry: ${lead.industry || 'Not specified'}
- AI/Automation Opportunity: ${lead.ai_opportunity || 'Not specified'}
- Tone: ${lead.tone || 'Professional'}
- Goal: ${lead.goal || 'Leads'}
- Key Message: ${lead.keyMessage || lead.possible_improvements || 'Not specified'}

STRUCTURE:
- 3 Headlines: shown at the top of the ad, rotated by Google — each must work standalone AND in combination with the others
- 2 Descriptions: shown below headlines — expand on the offer, include a CTA

WRITING RULES FOR HEADLINES (each max 30 characters — count spaces too):
- Headline 1: primary keyword or service (e.g. "AI Automation for SMBs")
- Headline 2: specific benefit or outcome (e.g. "Save 10hrs/Week on Admin")
- Headline 3: trust signal or CTA (e.g. "Free 15-Min Consultation")
- No exclamation marks in headlines
- No ALL CAPS
- 30 characters is a hard limit — include spaces in your count

WRITING RULES FOR DESCRIPTIONS (each max 90 characters — count spaces too):
- Description 1: expand on the core benefit, include a keyword naturally
- Description 2: address a pain point and end with a soft CTA
- No ALL CAPS, no excessive punctuation

Output format (exactly — include character counts in brackets for verification):
HEADLINE_1: [text] ([X] chars)
HEADLINE_2: [text] ([X] chars)
HEADLINE_3: [text] ([X] chars)
DESCRIPTION_1: [text] ([X] chars)
DESCRIPTION_2: [text] ([X] chars)`;
}

async function generateWithOpenAI(prompt: string): Promise<string> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
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
    temperature: 0.7,
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = buildPrompt(body);
    const { raw, provider } = await generateWithFallback(prompt);
    return NextResponse.json({ output: raw.trim(), provider });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to generate Google Ads copy' }, { status: 500 });
  }
}
