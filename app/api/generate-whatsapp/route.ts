import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import { SPACZE_VOICE } from '@/lib/ai-persona';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

interface Lead {
  business_name: string;
  website?: string;
  industry?: string;
  weak_points?: string;
  ai_opportunity?: string;
  website_quality_score?: number;
}

// ─────────────────────────────────────────────
// NICHE INTELLIGENCE
// ─────────────────────────────────────────────

const INDUSTRY_INSIGHTS: Record<
  string,
  {
    compliment: string;
    friction: string;
    benefit: string;
    emoji: boolean;
  }
> = {
  fashion: {
    compliment: 'your page is really active',
    friction: 'back-and-forth DMs',
    benefit: 'make ordering smoother for customers',
    emoji: true,
  },

  food: {
    compliment: 'your food presentation looks great',
    friction: 'manual order handling',
    benefit: 'make reordering easier for customers',
    emoji: true,
  },

  logistics: {
    compliment: 'your operations look well organized',
    friction: 'manual customer updates',
    benefit: 'help customers track faster',
    emoji: false,
  },

  real_estate: {
    compliment: 'your listings look well presented',
    friction: 'slow response workflows',
    benefit: 'help clients get faster responses',
    emoji: false,
  },

  services: {
    compliment: 'your business presentation looks clean',
    friction: 'manual booking conversations',
    benefit: 'make booking easier for customers',
    emoji: false,
  },

  default: {
    compliment: 'your brand presentation looks solid',
    friction: 'manual customer conversations',
    benefit: 'improve customer experience',
    emoji: false,
  },
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function normalizeIndustry(industry?: string): string {
  if (!industry) return 'default';

  const value = industry.toLowerCase();

  if (value.includes('fashion')) return 'fashion';
  if (value.includes('food')) return 'food';
  if (value.includes('restaurant')) return 'food';
  if (value.includes('logistics')) return 'logistics';
  if (value.includes('delivery')) return 'logistics';
  if (value.includes('real estate')) return 'real_estate';
  if (value.includes('service')) return 'services';

  return 'default';
}

function parseOutput(raw: string): string {
  return raw
    .replace(/^MESSAGE:\s*/i, '')
    .replace(/^["']|["']$/g, '')
    .trim();
}

// ─────────────────────────────────────────────
// PROMPT BUILDER
// ─────────────────────────────────────────────

function buildWhatsAppPrompt(lead: Lead): string {
  const industryKey = normalizeIndustry(lead.industry);
  const insight = INDUSTRY_INSIGHTS[industryKey];

  const emoji = insight.emoji ? ' 🔥' : '';

  const weakPoints = lead.weak_points
    ? `- Weak Points: ${lead.weak_points}`
    : '';

  const aiOpportunity = lead.ai_opportunity
    ? `- AI Opportunity: ${lead.ai_opportunity}`
    : '';

  const qualityScore =
    lead.website_quality_score != null
      ? `- Website Quality Score: ${lead.website_quality_score}/10`
      : '';

  return `
${SPACZE_VOICE}

You are generating a WhatsApp cold outreach message.

The message MUST feel like:
- manually typed by a real person
- conversational
- situational
- natural on WhatsApp

NOT:
- an agency pitch
- a sales script
- a marketing template
- an AI-generated message

─────────────────────────────
PROSPECT
─────────────────────────────

- Business Name: ${lead.business_name}
${lead.website ? `- Website: ${lead.website}` : ''}
${lead.industry ? `- Industry: ${lead.industry}` : ''}
${qualityScore}
${weakPoints}
${aiOpportunity}

─────────────────────────────
NICHE CONTEXT
─────────────────────────────

- Compliment style: ${insight.compliment}
- Customer friction: ${insight.friction}
- Benefit angle: ${insight.benefit}

─────────────────────────────
STRUCTURE
─────────────────────────────

Write EXACTLY 5 short lines.

Each line must contain ONLY ONE sentence.

Line 1:
Natural context + observation.
Mention the business naturally.
Use this style:
- "Saw your page earlier..."
- "Your page popped up while browsing..."
- "I was checking out..."
- "Came across..."
DO NOT always start the same way.

Mention one REALISTIC observation.
Add${emoji ? ' a 🔥 emoji' : ' no emoji'}.

Line 2:
Introduce Tesleem + Spacze naturally.
Keep it lightweight.
No pitching.

Line 3:
Mention a customer experience improvement idea.
Frame it positively.
Never criticize the business.

Line 4:
Mention BOTH:
- customer benefit first
- business benefit second

Line 5:
Soft curiosity-driven CTA.
Low pressure.
Invite reply naturally.

─────────────────────────────
VERY IMPORTANT RULES
─────────────────────────────

- Sound like WhatsApp, not email
- Avoid polished corporate writing
- Slightly imperfect rhythm is acceptable
- No long explanations
- No buzzwords
- No formal sign-offs
- No emojis except allowed on line 1
- No repetition
- No run-on sentences
- Keep total output between 60–90 words
- Message must feel 1-to-1

─────────────────────────────
BANNED PHRASES
─────────────────────────────

DO NOT USE:
- "I hope you're doing well"
- "I wanted to reach out"
- "I noticed that"
- "We help businesses"
- "Increase sales"
- "Leverage"
- "Following up"
- "Touch base"
- "Just checking in"
- "I specialize in"
- "Synergy"

─────────────────────────────
OUTPUT FORMAT
─────────────────────────────

MESSAGE:
[5-line whatsapp message]
`;
}

// ─────────────────────────────────────────────
// AI PROVIDERS
// ─────────────────────────────────────────────

async function generateWithOpenAI(prompt: string): Promise<string> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.9,
    max_tokens: 300,
  });

  return completion.choices[0].message.content || '';
}

async function generateWithGemini(prompt: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY!
  );

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
  });

  const result = await model.generateContent(prompt);

  return result.response.text();
}

async function generateWithGroq(prompt: string): Promise<string> {
  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.9,
    max_tokens: 300,
  });

  return completion.choices[0].message.content || '';
}

// ─────────────────────────────────────────────
// FALLBACK SYSTEM
// ─────────────────────────────────────────────

async function generateWithFallback(
  prompt: string
): Promise<{
  raw: string;
  provider: string;
}> {
  const providers = [
    {
      name: 'openai',
      key: process.env.OPENAI_API_KEY,
      fn: () => generateWithOpenAI(prompt),
    },

    {
      name: 'gemini',
      key: process.env.GEMINI_API_KEY,
      fn: () => generateWithGemini(prompt),
    },

    {
      name: 'groq',
      key: process.env.GROQ_API_KEY,
      fn: () => generateWithGroq(prompt),
    },
  ];

  const configured = providers.filter((p) => p.key);

  if (configured.length === 0) {
    throw new Error(
      'No AI provider configured.'
    );
  }

  let lastError: unknown = null;

  for (const provider of configured) {
    try {
      const raw = await provider.fn();

      return {
        raw,
        provider: provider.name,
      };
    } catch (err: unknown) {
      console.warn(
        `${provider.name} failed:`,
        err instanceof Error ? err.message : err
      );

      lastError = err;
    }
  }

  throw lastError ?? new Error('All providers failed.');
}

// ─────────────────────────────────────────────
// ROUTE HANDLER
// ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const lead: Lead = await req.json();

    if (!lead.business_name) {
      return NextResponse.json(
        {
          error: 'business_name is required',
        },
        {
          status: 400,
        }
      );
    }

    const prompt = buildWhatsAppPrompt(lead);

    const { raw, provider } =
      await generateWithFallback(prompt);

    const message = parseOutput(raw);

    return NextResponse.json({
      success: true,
      provider,
      message,
    });
  } catch (err: unknown) {
    console.error(
      'generate-whatsapp error:',
      err
    );

    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : 'Failed to generate WhatsApp message',
      },
      {
        status: 500,
      }
    );
  }
}