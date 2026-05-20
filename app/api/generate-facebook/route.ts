import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

/**
 * POST /api/generate-facebook
 * Generates a Facebook ad (primary text + headline + description + CTA suggestion)
 * for a lead/campaign brief.
 */

function buildPrompt(lead: any): string {
  return `You are an expert Facebook Ads copywriter for Spacze, an AI software agency.

Write a Facebook ad for the following business:
- Business: ${lead.business_name || 'Not specified'}
- Industry: ${lead.industry || 'Not specified'}
- AI Opportunity: ${lead.ai_opportunity || 'Not specified'}
- Weak Points: ${lead.weak_points || 'Not specified'}
- Tone: ${lead.tone || 'Professional'}
- Goal: ${lead.goal || 'Leads'}
- Key Message: ${lead.keyMessage || lead.possible_improvements || 'Not specified'}

Rules:
- Primary text: 80–125 words, hook in first line, pain-point aware, ends with CTA
- Headline: max 40 characters, benefit-driven
- Description: max 30 characters, reinforces headline
- CTA button: one of [Learn More, Sign Up, Get Quote, Contact Us, Book Now]
- No excessive punctuation or emojis (max 1)

Output format (exactly):
PRIMARY_TEXT:
[primary text here]
HEADLINE: [headline here]
DESCRIPTION: [description here]
CTA: [CTA button label]`;
}

async function generateWithOpenAI(prompt: string): Promise<string> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    max_tokens: 500,
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
    temperature: 0.8,
    max_tokens: 500,
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
  let lastError: Error | null = null;
  for (const p of configured) {
    try { return { raw: await p.fn(), provider: p.name }; }
    catch (e: any) { lastError = e; }
  }
  throw lastError ?? new Error('All AI providers failed.');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = buildPrompt(body);
    const { raw, provider } = await generateWithFallback(prompt);
    return NextResponse.json({ output: raw.trim(), provider });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to generate Facebook ad' }, { status: 500 });
  }
}
