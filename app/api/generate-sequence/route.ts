import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

/**
 * POST /api/generate-sequence
 *
 * Generates a personalised 4-step cold email sequence using the lead's
 * weak_points and ai_opportunity from the prior analysis step.
 *
 * Primary provider: Gemini (free tier, strong at long-form copy)
 * Fallback:         Groq Llama-3
 *
 * Body: Lead object (business_name, website, industry, weak_points,
 *       ai_opportunity, possible_improvements, website_quality_score)
 *
 * Returns: { steps: [{ step, subject, body }], provider }
 */

// ── Prompt ────────────────────────────────────────────────────────────────────

function buildSequencePrompt(lead: Record<string, unknown>): string {
  return `You are an expert B2B outreach copywriter for Spacze, a software development and AI automation agency based in Nigeria with global clients.

Generate a complete 4-step cold email sequence for the prospect below. Each email must feel like it was written by a real person who genuinely researched this business — not a template.

PROSPECT PROFILE:
- Business Name: ${lead.business_name}
- Website: ${lead.website || 'Not provided'}
- Industry: ${lead.industry || 'Not specified'}
- Website Quality Score: ${lead.website_quality_score ?? 'N/A'}/10
- Weak Points Identified: ${lead.weak_points || 'Not assessed'}
- AI/Automation Opportunity: ${lead.ai_opportunity || 'Not assessed'}
- Possible Improvements: ${lead.possible_improvements || 'Not assessed'}

SEQUENCE STRUCTURE:

Step 1 — Initial Outreach (Day 1)
- Open with ONE specific, genuine observation about their business (from weak_points/ai_opportunity)
- Frame it as an opportunity, never a criticism
- One short paragraph on how Spacze can help
- Soft CTA: "Would you be open to a quick chat this week?"
- Mention portfolio casually: "You can see some of our work at Spacze.vercel.app"
- Length: 140–175 words

Step 2 — Follow-up #1 (Day 4–5, no reply)
- Do NOT say "just following up" or "circling back"
- Add NEW value: a fresh insight or industry observation relevant to their business
- Reference the first email lightly: "I sent a note a few days ago…"
- Single low-friction question to invite reply
- Length: 100–130 words

Step 3 — Follow-up #2 (Day 9–10, still no reply)
- Lead with a brief case study or result Spacze achieved for a similar business
- Keep it specific and credible (e.g. "We helped a Lagos-based e-commerce store reduce cart abandonment by 34% with a simple AI chat widget")
- One sentence connecting it to their situation
- CTA: offer a free 15-minute audit or review
- Length: 90–120 words

Step 4 — Break-up Email (Day 14–16)
- Acknowledge they may not be interested right now — no hard feelings
- Leave the door open gracefully
- One final value statement (not a pitch)
- Tone: warm, human, zero pressure
- Length: 60–80 words

RULES FOR ALL STEPS:
- Never use bullet points inside the email body
- Never use corporate filler: "I hope this finds you well", "synergy", "leverage", "touch base"
- Subject lines must be specific, curiosity-driven, and under 8 words
- Each email must feel distinct — no repetition of phrases across steps
- Tone: peer-to-peer, warm, confident but never pushy

Return ONLY valid JSON — no markdown fences — in this exact shape:
{
  "steps": [
    { "step": 1, "subject": "...", "body": "..." },
    { "step": 2, "subject": "...", "body": "..." },
    { "step": 3, "subject": "...", "body": "..." },
    { "step": 4, "subject": "...", "body": "..." }
  ]
}`;
}

// ── Providers ─────────────────────────────────────────────────────────────────

async function generateWithGemini(prompt: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: { responseMimeType: 'application/json' },
  });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

async function generateWithGroq(prompt: string): Promise<string> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.75,
    max_tokens: 2500,
    response_format: { type: 'json_object' },
  });
  return completion.choices[0].message.content || '{}';
}

// ── Parse ─────────────────────────────────────────────────────────────────────

interface EmailStep {
  step: number;
  subject: string;
  body: string;
}

function parseSequence(raw: string): EmailStep[] {
  const cleaned = raw.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(cleaned);
  const steps: EmailStep[] = Array.isArray(parsed.steps) ? parsed.steps : [];
  return steps.map((s) => ({
    step:    Number(s.step),
    subject: String(s.subject || ''),
    body:    String(s.body || ''),
  }));
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const lead = await req.json();

    if (!lead.business_name) {
      return NextResponse.json({ error: 'business_name is required' }, { status: 400 });
    }

    const hasGemini = Boolean(process.env.GEMINI_API_KEY);
    const hasGroq   = Boolean(process.env.GROQ_API_KEY);

    if (!hasGemini && !hasGroq) {
      return NextResponse.json(
        { error: 'No AI provider configured. Set GEMINI_API_KEY or GROQ_API_KEY.' },
        { status: 503 },
      );
    }

    const prompt = buildSequencePrompt(lead);

    let raw = '';
    let provider = '';

    // Gemini first (better at long-form structured copy), Groq as fallback
    if (hasGemini) {
      try {
        raw = await generateWithGemini(prompt);
        provider = 'gemini';
      } catch (err: unknown) {
        console.warn('Gemini failed, falling back to Groq:', err instanceof Error ? err.message : err);
      }
    }

    if (!raw && hasGroq) {
      raw = await generateWithGroq(prompt);
      provider = 'groq';
    }

    const steps = parseSequence(raw);

    if (steps.length === 0) {
      throw new Error('AI returned an empty sequence — please retry');
    }

    return NextResponse.json({ steps, provider });
  } catch (err: unknown) {
    console.error('generate-sequence error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate sequence' },
      { status: 500 },
    );
  }
}
