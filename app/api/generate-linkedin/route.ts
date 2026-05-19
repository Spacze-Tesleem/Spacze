import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

/**
 * POST /api/generate-linkedin
 * Generates a LinkedIn InMail subject + body for a lead.
 * Body: lead object (same shape as /api/generate-email)
 */

function buildPrompt(lead: any): string {
  return `You are an expert B2B outreach copywriter for Spacze, a software development and AI automation agency.

Write a LinkedIn InMail to the decision-maker at the following business. LinkedIn InMails are read on mobile, so keep it tight and human.

Business Information:
- Business Name: ${lead.business_name}
- Website: ${lead.website || 'Not provided'}
- Industry: ${lead.industry || 'Not specified'}
- AI Opportunity: ${lead.ai_opportunity || 'Not assessed'}
- Weak Points: ${lead.weak_points || 'Not specified'}
- Possible Improvements: ${lead.possible_improvements || 'Not specified'}

Rules:
- Subject line: max 8 words, curiosity-driven, no clickbait
- Body: 60–90 words max — LinkedIn readers skim
- Open with ONE specific, genuine observation about their business
- One sentence on what Spacze does and how it's relevant
- Soft CTA: "Would you be open to a quick chat?" or similar
- No bullet points, no corporate jargon, no "I hope this message finds you well"
- Sound like a real person, not a sales bot

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
  let lastError: Error | null = null;
  for (const p of configured) {
    try { return { raw: await p.fn(), provider: p.name }; }
    catch (e: any) { lastError = e; }
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
  } catch (err: any) {
    console.error('generate-linkedin error:', err);
    return NextResponse.json({ error: err.message || 'Failed to generate LinkedIn message' }, { status: 500 });
  }
}
