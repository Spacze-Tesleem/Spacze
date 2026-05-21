import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import { SPACZE_VOICE } from '@/lib/ai-persona';

// ─────────────────────────────────────────────
// PROMPT
// ─────────────────────────────────────────────

function buildWhatsAppPrompt(lead: any): string {
  const weakPoints    = lead.weak_points         ? `- Weak Points: ${lead.weak_points}`                  : '';
  const aiOpportunity = lead.ai_opportunity      ? `- AI/Automation Opportunity: ${lead.ai_opportunity}` : '';
  const qualityScore  = lead.website_quality_score != null ? `- Website Quality Score: ${lead.website_quality_score}/10` : '';

  return `${SPACZE_VOICE}

WhatsApp messages must feel personal and conversational — like a text from a real person, not a marketing blast.

PROSPECT:
- Business Name: ${lead.business_name}
${lead.website  ? `- Website: ${lead.website}`   : ''}
${lead.industry ? `- Industry: ${lead.industry}` : ''}
${qualityScore}
${weakPoints}
${aiOpportunity}

WRITING RULES:
- Start with a casual, warm greeting using their business name: "Hi [Name]," or "Hey [Business],"
- ONE specific, genuine observation about their business — framed as an opportunity, never a criticism
- NEVER say the website or business is bad, weak, or broken
- One sentence on how Spacze can help — keep it relevant and brief
- End with a single soft question to invite a reply: "Would you be open to a quick chat?" or similar
- No bullet points, no formal sign-offs, no "I hope this message finds you well"
- No emojis unless they feel completely natural for the industry (e.g. fashion)
- Sound like a real person texting, not a bot
- Industry-specific angle: fashion → DM ordering/store; real estate → lead follow-up; logistics → manual tracking; food → repeat orders; services → client booking
- Total length: 60–90 words maximum — WhatsApp readers don't read walls of text

Output format (exactly):
MESSAGE:
[message here]`;
}

// ─────────────────────────────────────────────
// AI PROVIDERS (reuse same pattern as generate-email)
// ─────────────────────────────────────────────

async function generateWithOpenAI(prompt: string): Promise<string> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.85,
    max_tokens: 200,
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
    max_tokens: 200,
  });
  return completion.choices[0].message.content || '';
}

async function generateWithFallback(prompt: string): Promise<{ raw: string; provider: string }> {
  const providers = [
    { name: 'openai', key: process.env.OPENAI_API_KEY, fn: () => generateWithOpenAI(prompt) },
    { name: 'gemini', key: process.env.GEMINI_API_KEY, fn: () => generateWithGemini(prompt) },
    { name: 'groq',   key: process.env.GROQ_API_KEY,   fn: () => generateWithGroq(prompt) },
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
      console.warn(`${provider.name} failed, trying next:`, err instanceof Error ? err.message : err);
      lastError = err;
    }
  }
  throw lastError ?? new Error('All AI providers failed.');
}

function parseOutput(raw: string): string {
  const match = raw.match(/MESSAGE:\s*([\s\S]+)/i);
  return match ? match[1].trim() : raw.trim();
}

// ─────────────────────────────────────────────
// ROUTE HANDLER
// ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const lead = await req.json();
    const prompt = buildWhatsAppPrompt(lead);
    const { raw, provider } = await generateWithFallback(prompt);
    const message = parseOutput(raw);
    return NextResponse.json({ message, provider });
  } catch (err: unknown) {
    console.error('generate-whatsapp error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to generate message' }, { status: 500 });
  }
}
