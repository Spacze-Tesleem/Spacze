import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

// ─────────────────────────────────────────────
// PLATFORM PROMPT BUILDERS
// ─────────────────────────────────────────────

type Platform = 'instagram' | 'twitter' | 'google_ads' | 'email' | 'whatsapp' | 'linkedin';

interface CopyBrief {
  platform: Platform;
  productName?: string;
  targetAudience?: string;
  tone?: string;
  goal?: string;
  keyMessage?: string;
  // Lead-linked fields
  businessName?: string;
  industry?: string;
  aiOpportunity?: string;
  weakPoints?: string;
  possibleImprovements?: string;
  website?: string;
}

function buildInstagramPrompt(b: CopyBrief): string {
  return `You are an expert social media copywriter for Spacze, an AI software agency.

Write an Instagram ad caption for the following:
- Product/Service: ${b.productName || b.businessName || 'Not specified'}
- Target Audience: ${b.targetAudience || b.industry || 'General'}
- Tone: ${b.tone || 'Professional'}
- Goal: ${b.goal || 'Awareness'}
- Key Message: ${b.keyMessage || b.aiOpportunity || 'Not specified'}

Rules:
- Hook in the first line (no "Are you..." openers)
- 3–5 short punchy lines
- End with a clear CTA
- 5–10 relevant hashtags on a new line
- Total: 80–120 words + hashtags

Output format (exactly):
CAPTION:
[caption here]
HASHTAGS:
[hashtags here]`;
}

function buildTwitterPrompt(b: CopyBrief): string {
  return `You are an expert social media copywriter for Spacze, an AI software agency.

Write a Twitter/X ad post for the following:
- Product/Service: ${b.productName || b.businessName || 'Not specified'}
- Target Audience: ${b.targetAudience || b.industry || 'General'}
- Tone: ${b.tone || 'Bold'}
- Goal: ${b.goal || 'Clicks'}
- Key Message: ${b.keyMessage || b.aiOpportunity || 'Not specified'}

Rules:
- Max 280 characters including CTA
- Punchy, direct, no filler
- Include 1–2 relevant hashtags inline
- Optional: one short follow-up reply tweet (max 200 chars)

Output format (exactly):
TWEET:
[tweet here]
REPLY (optional):
[reply tweet here or leave blank]`;
}

function buildGoogleAdsPrompt(b: CopyBrief): string {
  return `You are an expert Google Ads copywriter for Spacze, an AI software agency.

Write Google Ads copy for the following:
- Product/Service: ${b.productName || b.businessName || 'Not specified'}
- Target Audience: ${b.targetAudience || b.industry || 'General'}
- Tone: ${b.tone || 'Professional'}
- Goal: ${b.goal || 'Leads'}
- Key Message: ${b.keyMessage || b.aiOpportunity || 'Not specified'}

Rules:
- 3 headlines, each max 30 characters
- 2 descriptions, each max 90 characters
- Include keywords naturally
- Focus on benefit, not feature

Output format (exactly):
HEADLINE_1: [max 30 chars]
HEADLINE_2: [max 30 chars]
HEADLINE_3: [max 30 chars]
DESCRIPTION_1: [max 90 chars]
DESCRIPTION_2: [max 90 chars]`;
}

function buildEmailPrompt(b: CopyBrief): string {
  return `You are an expert email copywriter for Spacze, an AI software agency.

Write a marketing email for the following:
- Product/Service: ${b.productName || b.businessName || 'Not specified'}
- Target Audience: ${b.targetAudience || b.industry || 'General'}
- Tone: ${b.tone || 'Professional'}
- Goal: ${b.goal || 'Leads'}
- Key Message: ${b.keyMessage || b.aiOpportunity || 'Not specified'}
${b.weakPoints ? `- Pain points to address: ${b.weakPoints}` : ''}
${b.possibleImprovements ? `- Improvements to highlight: ${b.possibleImprovements}` : ''}

Rules:
- Subject line: curiosity-driven, max 50 chars
- Body: 150–200 words
- One clear CTA at the end
- No spam trigger words

Output format (exactly):
SUBJECT: [subject line]
BODY:
[email body]`;
}

function buildWhatsAppPrompt(b: CopyBrief): string {
  return `You are an expert WhatsApp marketing copywriter for Spacze, an AI software agency.

Write a WhatsApp marketing message for the following:
- Product/Service: ${b.productName || b.businessName || 'Not specified'}
- Target Audience: ${b.targetAudience || b.industry || 'General'}
- Tone: ${b.tone || 'Friendly'}
- Goal: ${b.goal || 'Leads'}
- Key Message: ${b.keyMessage || b.aiOpportunity || 'Not specified'}

Rules:
- Conversational, feels personal not broadcast
- 60–100 words max
- One soft CTA (question or link)
- No excessive emojis (max 2)
- Must not feel like spam

Output format (exactly):
MESSAGE:
[message here]`;
}

function buildLinkedInPrompt(b: CopyBrief): string {
  return `You are an expert LinkedIn copywriter for Spacze, an AI software agency.

Write LinkedIn outreach copy for the following:
- Product/Service: ${b.productName || b.businessName || 'Not specified'}
- Target Audience: ${b.targetAudience || b.industry || 'General'}
- Tone: ${b.tone || 'Professional'}
- Goal: ${b.goal || 'Leads'}
- Key Message: ${b.keyMessage || b.aiOpportunity || 'Not specified'}
${b.weakPoints ? `- Context: ${b.weakPoints}` : ''}

Rules:
- Connection request note: max 300 characters, warm and specific
- Follow-up message: 80–120 words, adds value, soft CTA
- Sound like a real person, not a sales bot

Output format (exactly):
CONNECTION_NOTE:
[connection note here]
FOLLOW_UP:
[follow-up message here]`;
}

function buildPrompt(brief: CopyBrief): string {
  switch (brief.platform) {
    case 'instagram': return buildInstagramPrompt(brief);
    case 'twitter':   return buildTwitterPrompt(brief);
    case 'google_ads': return buildGoogleAdsPrompt(brief);
    case 'email':     return buildEmailPrompt(brief);
    case 'whatsapp':  return buildWhatsAppPrompt(brief);
    case 'linkedin':  return buildLinkedInPrompt(brief);
    default:          return buildInstagramPrompt(brief);
  }
}

// ─────────────────────────────────────────────
// AI PROVIDERS (same fallback chain as generate-email)
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// ROUTE HANDLER
// ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const brief: CopyBrief = body;

    if (!brief.platform) {
      return NextResponse.json({ error: 'Missing required field: platform' }, { status: 400 });
    }

    const prompt = buildPrompt(brief);
    const { raw, provider } = await generateWithFallback(prompt);

    return NextResponse.json({ platform: brief.platform, output: raw.trim(), provider });
  } catch (err: any) {
    console.error('generate-copy error:', err);
    return NextResponse.json({ error: err.message || 'Failed to generate copy' }, { status: 500 });
  }
}
