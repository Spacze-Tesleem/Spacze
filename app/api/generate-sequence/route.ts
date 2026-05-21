import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import { SPACZE_VOICE } from '@/lib/ai-persona';

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
  const weakPoints    = lead.weak_points         ? `- Weak Points Identified: ${lead.weak_points}`         : '';
  const improvements  = lead.possible_improvements ? `- Possible Improvements: ${lead.possible_improvements}` : '';
  const aiOpportunity = lead.ai_opportunity      ? `- AI/Automation Opportunity: ${lead.ai_opportunity}`   : '';
  const qualityScore  = lead.website_quality_score != null ? `- Website Quality Score: ${lead.website_quality_score}/10` : '';
  const mobileResp    = lead.mobile_responsiveness ? `- Mobile Responsiveness: ${lead.mobile_responsiveness}` : '';
  const seoQuality    = lead.seo_quality         ? `- SEO Quality: ${lead.seo_quality}`                    : '';

  return `${SPACZE_VOICE}

Generate a complete 4-step cold email sequence for the prospect below. Every email must feel written by a real person who genuinely researched this business — not a template. Each step must be distinct in angle, tone, and content.

PROSPECT:
- Business Name: ${lead.business_name}
${lead.website  ? `- Website: ${lead.website}`   : ''}
${lead.industry ? `- Industry: ${lead.industry}` : ''}
${qualityScore}
${mobileResp}
${seoQuality}
- Has Internal Dashboard/System: ${lead.has_dashboard ? 'Yes' : 'No'}
${aiOpportunity}
${weakPoints}
${improvements}

RULES FOR ALL STEPS:
- Every body starts with: "Hi [Business Name]," — no "Dear", no "Hi team"
- Every body ends with: "Tesleem" on one line, "Spacze" on the next
- No bullet points inside any email body
- No corporate filler: "I hope this finds you well", "synergy", "leverage", "touch base", "circle back"
- No spam trigger words
- Subject lines: specific, curiosity-driven, under 8 words — Steps 2–4 use "Re:" prefix to thread
- Each step must feel distinct — no repeated phrases across steps
- Tone: peer-to-peer, warm, confident, never pushy
- WORD COUNTS ARE STRICT — count words in each body before writing the JSON value

SEQUENCE:

Step 1 — Initial Outreach (Day 1) | body must be 140–175 words
Write four paragraphs:
P1 (30–40 words): Greeting + one specific observation about their business from the analysis — name the exact pain point (e.g. managing orders through DMs, no storefront, manual follow-up). Frame it as something that gets harder as they grow.
P2 (25–35 words): Expand on why that pain point matters — what does it cost them? Missed orders, slower response, lost customers, wasted hours. Make it feel real. Do not mention Spacze yet.
P3 (40–50 words): Introduce Spacze naturally. Say what we build and why it fits their situation. Include one concrete outcome (e.g. "helped a similar brand move from DM ordering to an automated store that handles payments and confirmations without the back-and-forth"). End with: "You can see some of our work at Spacze.vercel.app."
P4 (15–20 words): "Would you be open to a quick chat this week? Even 15 minutes would be enough." Then sign-off.

Step 2 — Follow-up #1 (Day 4–5, no reply) | body must be 100–130 words
Write three paragraphs:
P1 (30–40 words): Greeting + a fresh, specific industry insight the prospect would find useful on its own — NOT a repeat of Step 1. This should feel like a useful piece of information, not a sales opener.
P2 (30–40 words): Reference Step 1 in one clause ("I sent a note a few days ago about [topic]…") then connect this new insight to what Spacze does. One sentence on Spacze — natural, not salesy.
P3 (20–25 words): One low-friction closing question ("Is this something on your radar?" or "Worth a quick conversation?") then sign-off.

Step 3 — Follow-up #2 (Day 9–10, still no reply) | body must be 110–140 words
Write three paragraphs:
P1 (40–50 words): Greeting + a brief, credible result Spacze achieved for a similar business — referenced anonymously ("a recent project for a ${lead.industry || 'similar'} client…"). Include a specific metric: e.g. "cut order processing time by half", "reduced missed enquiries by 60%", "went from DM chaos to a clean automated store in 3 weeks". Two sentences max — specific and believable.
P2 (30–40 words): Connect that result to what it could mean for ${lead.business_name} specifically. Mention Spacze has limited project slots — frame as a heads-up, not pressure.
P3 (20–25 words): "Even a 10-minute call would be enough to see if there's a fit." Then sign-off.

Step 4 — Break-up Email (Day 14–16) | body must be 70–90 words
Write two paragraphs:
P1 (45–55 words): Greeting + acknowledge they've been busy (no blame, no guilt). Be direct: "I'll stop reaching out after this so I don't clog your inbox." Leave a genuine open invitation — if priorities change, Spacze is here. One optional memorable sentence — a useful thought, not a pitch.
P2 (15–20 words): Wish them well sincerely. Then sign-off.

Return ONLY valid JSON — no markdown fences, no explanation — in this exact shape:
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
    max_tokens: 4000, // 4 emails × ~175 words × ~1.4 tokens + JSON overhead
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
  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    console.error('generate-sequence: JSON parse failed. Raw output:', cleaned.slice(0, 500));
    throw new Error('AI returned invalid JSON — please retry');
  }
  const steps: EmailStep[] = Array.isArray(parsed.steps) ? parsed.steps : [];
  if (steps.length === 0) {
    console.error('generate-sequence: steps array empty. Parsed:', JSON.stringify(parsed).slice(0, 300));
    throw new Error('AI returned an empty sequence — please retry');
  }
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
