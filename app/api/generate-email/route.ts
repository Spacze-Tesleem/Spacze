import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

function buildPrompt(lead: any): string {
  return `You are an expert B2B outreach copywriter for Spacze, a software development and AI automation agency.

Your task is to generate a highly personalized cold outreach email based on a company's website analysis.

The email must feel human, natural, conversational, and professional — not robotic, spammy, or overly sales-focused.

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
- Observations: ${lead.weak_points || 'Not specified'}
- Possible Improvements: ${lead.possible_improvements || 'Not specified'}

Tone & Framing Rules (follow strictly):
- NEVER say the website is bad, weak, outdated, poor, terrible, or lacking
- NEVER criticise or insult the business in any way
- Frame all observations as opportunities, not problems
- Sound consultative and strategic — like a trusted advisor, not a salesperson
- Use calm, professional language such as:
  "there may be opportunities to improve…"
  "I noticed a few areas that could enhance…"
  "there's potential to modernize…"
  "a more streamlined experience could help…"

Writing Instructions:
- Start with a warm, natural introduction that shows genuine familiarity with the business
- Reference 1–2 specific improvement opportunities observed from their website or industry
- Connect those opportunities to real business outcomes: better lead conversion, stronger brand positioning, operational efficiency, or improved customer experience
- Position Spacze as intelligent, modern, strategic, consultative, and trustworthy
- Explain how Spacze can help using: modern web development, premium UI/UX, dashboards, automation systems, or AI solutions
- The email must feel like genuine research was done — personalized, not templated
- Avoid generic marketing phrases, hype language, and mass-outreach tone
- Do NOT use spam-trigger words: guaranteed, increase revenue fast, limited offer, act now, boost sales instantly
- Keep total email length between 140–190 words
- Close with a soft, low-pressure CTA inviting a quick conversation or call
- Mention portfolio naturally: Spacze.vercel.app

The goal is to start a conversation, not close a sale.
The reader should feel: "This person actually looked at our business and has something valuable to say."

Output format (exactly):
SUBJECT: [subject line here]
BODY:
[email body here]`;
}

function parseOutput(raw: string) {
  const subjectMatch = raw.match(/SUBJECT:\s*(.+)/i);
  const bodyMatch = raw.match(/BODY:\s*([\s\S]+)/i);
  return {
    subject: subjectMatch ? subjectMatch[1].trim() : 'Quick thought about your website',
    body: bodyMatch ? bodyMatch[1].trim() : raw,
  };
}

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

// Try each provider in order, skipping those without a key configured.
// Returns { raw, provider } from the first one that succeeds.
async function generateWithFallback(prompt: string): Promise<{ raw: string; provider: string }> {
  const providers: Array<{ name: string; key: string | undefined; fn: () => Promise<string> }> = [
    { name: 'openai', key: process.env.OPENAI_API_KEY,  fn: () => generateWithOpenAI(prompt) },
    { name: 'gemini', key: process.env.GEMINI_API_KEY,  fn: () => generateWithGemini(prompt) },
    { name: 'groq',   key: process.env.GROQ_API_KEY,    fn: () => generateWithGroq(prompt) },
  ];

  const configured = providers.filter(p => p.key);
  if (configured.length === 0) {
    throw new Error(
      'No AI provider configured. Set at least one of: OPENAI_API_KEY, GEMINI_API_KEY, GROQ_API_KEY.'
    );
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

export async function POST(req: NextRequest) {
  try {
    const lead = await req.json();
    const prompt = buildPrompt(lead);
    const { raw, provider } = await generateWithFallback(prompt);
    const { subject, body } = parseOutput(raw);
    return NextResponse.json({ subject, body, provider });
  } catch (err: any) {
    console.error('generate-email error:', err);
    return NextResponse.json({ error: err.message || 'Failed to generate email' }, { status: 500 });
  }
}
