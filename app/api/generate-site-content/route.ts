import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import Groq from 'groq-sdk';

function buildPrompt(business_name: string, industry: string, website: string, ai_opportunity: string, weak_points: string, possible_improvements: string): string {
  return `You are a senior web copywriter at Spacze, a Nigerian AI & web development agency.

Generate website copy for a client with these details:
- Business: ${business_name}
- Industry: ${industry || 'General'}
- Website: ${website || 'Not provided'}
- AI Opportunity: ${ai_opportunity || 'Unknown'}
- Current weak points: ${weak_points || 'None noted'}
- Suggested improvements: ${possible_improvements || 'None noted'}

Return ONLY valid JSON with exactly these four keys (no markdown, no code fences):
{
  "tagline": "A punchy 6-10 word tagline for ${business_name}",
  "hero": "2-3 sentence hero section copy that speaks to their target customers",
  "about": "3-4 sentence about section that builds trust and explains what they do",
  "cta": "A compelling call-to-action sentence (e.g. Get a free audit, Book a call)"
}

Rules:
- Be specific to ${business_name} and their ${industry || 'industry'} — no generic filler
- Tone: confident, clear, human — no corporate jargon
- Hero and about must be fully developed paragraphs, not one-liners`;
}

function parseResponse(raw: string): { tagline: string; hero: string; about: string; cta: string } {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Could not parse AI response as JSON');
    return JSON.parse(match[0]);
  }
}

async function generateWithGemini(prompt: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

async function generateWithOpenAI(prompt: string): Promise<string> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    max_tokens: 500,
    response_format: { type: 'json_object' },
  });
  return completion.choices[0].message.content || '{}';
}

async function generateWithGroq(prompt: string): Promise<string> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    max_tokens: 500,
    response_format: { type: 'json_object' },
  });
  return completion.choices[0].message.content || '{}';
}

async function generateWithFallback(prompt: string): Promise<string> {
  const providers = [
    { name: 'gemini', key: process.env.GEMINI_API_KEY,  fn: () => generateWithGemini(prompt) },
    { name: 'openai', key: process.env.OPENAI_API_KEY,  fn: () => generateWithOpenAI(prompt) },
    { name: 'groq',   key: process.env.GROQ_API_KEY,    fn: () => generateWithGroq(prompt) },
  ].filter(p => p.key);

  if (providers.length === 0) throw new Error('No AI provider configured. Set GEMINI_API_KEY, OPENAI_API_KEY, or GROQ_API_KEY.');

  let lastError: unknown;
  for (const { name, fn } of providers) {
    try {
      return await fn();
    } catch (err) {
      console.warn(`[generate-site-content] ${name} failed, trying next:`, err instanceof Error ? err.message : err);
      lastError = err;
    }
  }
  throw lastError ?? new Error('All AI providers failed.');
}

export async function POST(req: NextRequest) {
  try {
    const { business_name, industry, website, ai_opportunity, weak_points, possible_improvements } = await req.json();

    if (!business_name) return NextResponse.json({ error: 'business_name is required' }, { status: 400 });

    const prompt = buildPrompt(business_name, industry, website, ai_opportunity, weak_points, possible_improvements);
    const raw = await generateWithFallback(prompt);
    const parsed = parseResponse(raw);

    return NextResponse.json(parsed);
  } catch (e: unknown) {
    console.error('[generate-site-content]', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Generation failed' }, { status: 500 });
  }
}
