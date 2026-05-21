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
  return `You are a B2B outreach copywriter for Spacze, a software development and AI automation agency based in Nigeria with global clients.

Generate a complete 4-step cold email sequence for the prospect below. Every email must feel written by a real person who genuinely researched this business — not a template. Each step must be distinct in angle, tone, and content.

PROSPECT:
- Business Name: ${lead.business_name}
- Website: ${lead.website || 'Not provided'}
- Industry: ${lead.industry || 'Not specified'}
- Website Quality Score: ${lead.website_quality_score ?? 'N/A'}/10
- Mobile Responsiveness: ${lead.mobile_responsiveness || 'Unknown'}
- SEO Quality: ${lead.seo_quality || 'Unknown'}
- Has Internal Dashboard/System: ${lead.has_dashboard ? 'Yes' : 'No'}
- Weak Points Identified: ${lead.weak_points || 'Not assessed'}
- AI/Automation Opportunity: ${lead.ai_opportunity || 'Not assessed'}
- Possible Improvements: ${lead.possible_improvements || 'Not assessed'}

EMAIL STRUCTURE — every step must follow this structure:
- Greeting: "Hi [Business Name] team," or "Hi [Business Name],"
- Body paragraphs (no bullet points)
- Sign-off: "Tesleem / Spacze"

SEQUENCE:

Step 1 — Initial Outreach (Day 1) | 140–175 words
- Open with ONE specific observation drawn from the analysis above — framed as an opportunity, never a criticism
- Use language like: "I noticed there may be room to…", "there's potential to…", "could help streamline…"
- NEVER say the website is bad, outdated, broken, or weak
- One short paragraph on how Spacze can help — keep it relevant to the observation
- Mention portfolio as a casual aside: "You can see some of our work at Spacze.vercel.app"
- Soft CTA: "Would you be open to a quick chat this week?"
- Industry-specific pain points: fashion → DM/WhatsApp ordering, no storefront; real estate → manual lead follow-up, no CRM; logistics → manual tracking, no client portal; food → no online ordering/booking; services → no client onboarding/scheduling

Step 2 — Follow-up #1 (Day 4–5, no reply) | 100–130 words
- Do NOT open with "just following up", "circling back", or "checking in"
- Open with a NEW industry insight or observation not mentioned in Step 1
- Reference Step 1 lightly in one clause: "I sent a note a few days ago…"
- One sentence connecting the insight to Spacze — natural, not salesy
- Close with a single low-friction question to invite a reply
- Industry-specific angle: fashion → seasonal demand/DM volume; real estate → lead response speed; logistics → manual process costs; food → repeat customer retention

Step 3 — Follow-up #2 (Day 9–10, still no reply) | 110–140 words
- Take a completely different angle — do NOT repeat the website observation
- Open with a brief, credible result Spacze achieved for a similar business (anonymous: "a recent project for a ${lead.industry || 'similar'} client…")
- Include a specific metric or outcome in the case study (e.g. "cut order processing time by half", "reduced missed enquiries by 60%")
- Keep the case study to 1–2 sentences — specific and believable, not vague
- One sentence connecting that result to ${lead.business_name}
- Mention Spacze has limited project availability — frame as a heads-up, not fake scarcity
- CTA: low-commitment offer — "Even a 10-minute call would be enough to see if there's a fit"

Step 4 — Break-up Email (Day 14–16) | 80–100 words
- Acknowledge they've been busy — no blame, no guilt
- Be direct: "I'll stop reaching out after this so I don't clog your inbox"
- Leave a genuine open invitation: if priorities change, Spacze is here
- One optional memorable sentence — not a pitch
- End warmly and sincerely
- Tone: human, gracious, zero pressure — do not pad to hit word count, shorter is better here

RULES FOR ALL STEPS:
- Every email body must start with a greeting: "Hi [Business Name] team," or "Hi [Business Name],"
- Every email body must end with a sign-off: "Tesleem / Spacze"
- No bullet points inside any email body
- No corporate filler: "I hope this finds you well", "synergy", "leverage", "touch base", "circle back"
- No spam trigger words
- Subject lines: specific, curiosity-driven, under 8 words — Steps 2–4 use "Re:" prefix to thread
- Each step must feel distinct — no repeated phrases across steps
- Tone throughout: peer-to-peer, warm, confident, never pushy
- WORD COUNTS ARE STRICT — count words before outputting each step

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
