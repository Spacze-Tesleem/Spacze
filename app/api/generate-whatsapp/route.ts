import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

// ─────────────────────────────────────────────
// PROMPT
// ─────────────────────────────────────────────

function buildWhatsAppPrompt(lead: any): string {
  return `You are writing a WhatsApp cold outreach message for Spacze, a web development and AI automation agency.

WhatsApp messages must feel personal and conversational — NOT like a formal email.

Business Information:
- Business Name: ${lead.business_name}
- Website: ${lead.website || 'Not provided'}
- Industry: ${lead.industry || 'Not specified'}
- Website Quality Score: ${lead.website_quality_score ?? 'N/A'}/10
- Weak Points: ${lead.weak_points || 'Not specified'}
- AI Opportunity: ${lead.ai_opportunity || 'Not assessed'}

Rules:
- Start with a casual greeting using their business name (e.g. "Hi [Name]," or "Hey [Business],")
- One specific, genuine observation about their business or website — framed as an opportunity, never a criticism
- One sentence on how Spacze can help
- End with a single soft question to invite a reply (e.g. "Would you be open to a quick chat?")
- NO bullet points, NO formal sign-offs, NO "I hope this message finds you well"
- Sound like a real person texting, not a marketing bot
- Total length: 60–90 words maximum

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

  let lastError: Error | null = null;
  for (const provider of configured) {
    try {
      const raw = await provider.fn();
      return { raw, provider: provider.name };
    } catch (err: any) {
      console.warn(`${provider.name} failed, trying next:`, err.message);
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
  } catch (err: any) {
    console.error('generate-whatsapp error:', err);
    return NextResponse.json({ error: err.message || 'Failed to generate message' }, { status: 500 });
  }
}
