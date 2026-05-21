import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import { SPACZE_VOICE } from '@/lib/ai-persona';

/**
 * POST /api/generate-facebook
 * Generates a Facebook ad (primary text + headline + description + CTA suggestion)
 * for a lead/campaign brief.
 */

function buildPrompt(lead: any): string {
  const aiOpportunity = lead.ai_opportunity ? `- AI/Automation Opportunity: ${lead.ai_opportunity}` : '';
  const weakPoints    = lead.weak_points    ? `- Weak Points: ${lead.weak_points}`                  : '';
  const keyMessage    = lead.keyMessage || lead.possible_improvements
    ? `- Key Message: ${lead.keyMessage || lead.possible_improvements}`
    : '';

  return `${SPACZE_VOICE}

Write a Facebook ad for the business below. Facebook ads interrupt a social feed — the first line of primary text must stop the scroll.

PROSPECT:
${lead.business_name ? `- Business: ${lead.business_name}` : ''}
${lead.industry      ? `- Industry: ${lead.industry}`      : ''}
${aiOpportunity}
${weakPoints}
- Tone: ${lead.tone || 'Conversational'}
- Goal: ${lead.goal || 'Leads'}
${keyMessage}

STRUCTURE:
- Primary Text: the main ad copy shown in the feed
- Headline: shown below the image/video
- Description: shown below the headline (reinforces headline)
- CTA Button: the button label

WRITING RULES FOR PRIMARY TEXT (80–125 words):
1. Hook (first line): bold statement or relatable pain point — this is what shows before "See more"
   Examples: "Most small businesses lose leads because they reply too slowly." / "Your Instagram is working. Your sales system isn't."
2. Body (3–4 sentences): expand on the pain point, introduce the solution, build credibility with one specific outcome or example
3. CTA (1 sentence): clear action — "Send us a message", "Click below to get started", "Book a free call today"
- No "Are you…" openers
- No excessive punctuation or emojis (max 1 emoji if it adds meaning)
- Frame everything as an opportunity, not a criticism

WRITING RULES FOR HEADLINE (max 40 characters — count spaces):
- Benefit-driven, not feature-driven
- No ALL CAPS, no exclamation marks

WRITING RULES FOR DESCRIPTION (max 30 characters — count spaces):
- Reinforces the headline with a secondary benefit or urgency signal

CTA BUTTON: choose one of [Learn More, Sign Up, Get Quote, Contact Us, Book Now, Send Message]

Output format (exactly — include character counts for headline and description):
PRIMARY_TEXT:
[primary text here]
HEADLINE: [text] ([X] chars)
DESCRIPTION: [text] ([X] chars)
CTA: [button label]`;
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
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to generate Facebook ad' }, { status: 500 });
  }
}
