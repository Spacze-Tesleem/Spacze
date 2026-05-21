import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import { SPACZE_VOICE } from '@/lib/ai-persona';

// ─────────────────────────────────────────────
// SEQUENCE PROMPTS
// ─────────────────────────────────────────────

function buildStep1Prompt(lead: any): string {
  const weakPoints       = lead.weak_points        ? `- Weak Points Observed: ${lead.weak_points}`        : '';
  const improvements     = lead.possible_improvements ? `- Possible Improvements: ${lead.possible_improvements}` : '';
  const aiOpportunity    = lead.ai_opportunity     ? `- AI/Automation Opportunity: ${lead.ai_opportunity}` : '';
  const qualityScore     = lead.website_quality_score != null ? `- Website Quality Score: ${lead.website_quality_score}/10` : '';
  const mobileResp       = lead.mobile_responsiveness ? `- Mobile Responsiveness: ${lead.mobile_responsiveness}` : '';
  const seoQuality       = lead.seo_quality        ? `- SEO Quality: ${lead.seo_quality}`                 : '';

  return `${SPACZE_VOICE}

Write a personalised cold outreach email for the prospect below. The reader should feel that a real person looked at their business and has something genuinely worth saying — not that they received a template.

PROSPECT:
- Business Name: ${lead.business_name}
${lead.website ? `- Website: ${lead.website}` : ''}
${lead.industry ? `- Industry: ${lead.industry}` : ''}
${qualityScore}
${mobileResp}
${seoQuality}
- Has Internal Dashboard/System: ${lead.has_dashboard ? 'Yes' : 'No'}
${aiOpportunity}
${weakPoints}
${improvements}

STRUCTURE — write four distinct paragraphs in this exact order:

Paragraph 1 — GREETING + OBSERVATION (30–40 words):
Start with "Hi [Business Name]," then immediately write one specific, genuine observation about their business drawn from the analysis above. Name the exact pain point — e.g. managing orders through DMs, no online storefront, manual follow-up process. Frame it as something that gets harder as they grow, not as a flaw.

Paragraph 2 — CONSEQUENCE (25–35 words):
Expand on why that pain point matters. What does it cost them — missed orders, slower response times, lost customers, wasted hours? Make it feel real and specific to their industry. Do not mention Spacze yet.

Paragraph 3 — SPACZE + PROOF (40–50 words):
Introduce Spacze naturally. Say what we build and why it's relevant to their specific situation. Include one concrete outcome or example (e.g. "We helped a similar brand move from DM ordering to an automated store that handles payments and confirmations without the back-and-forth"). End with: "You can see some of our work at Spacze.vercel.app."

Paragraph 4 — CTA + SIGN-OFF (15–20 words):
"Would you be open to a quick chat this week? Even 15 minutes would be enough to see if there's something useful here."
Then on a new line: "Tesleem" and below that: "Spacze"

WRITING RULES:
- NEVER say the website is bad, outdated, broken, or weak
- No bullet points in the email body
- No corporate filler: no "I hope this finds you well", "synergy", "leverage", "touch base"
- No spam trigger words
- Industry-specific pain points: fashion → DM/WhatsApp ordering, no storefront, missed orders; real estate → manual lead follow-up, no CRM, slow response; logistics → manual tracking, no client portal; food → no online ordering or booking; services → no client onboarding or scheduling
- WORD COUNT: the body must be 140–175 words. Count every word before outputting. If you are under 140, expand paragraph 2 or 3.

EXAMPLE of the correct length, tone, and structure (do not copy this — use it as a reference only):
---
Hi Dunnies Collections,

I came across your Instagram page and noticed you're doing really well with engagement — your posts get solid interaction. One thing I imagine could help is having a proper storefront to handle orders, rather than managing everything through DMs and WhatsApp. That kind of manual process tends to get harder to keep up with as you grow.

At Spacze, we build e-commerce systems and automation tools for fashion brands that want to sell more without the back-and-forth. We've helped similar businesses move from DM ordering to a clean, automated store that handles payments, confirmations, and follow-ups automatically. You can see some of our work at Spacze.vercel.app.

Would you be open to a quick chat this week? Even 15 minutes would be enough to see if there's something useful here.

Tesleem
Spacze
---

Goal: start a conversation, not close a sale.

Output format (exactly):
SUBJECT: [subject line — specific, curiosity-driven, under 8 words, no clickbait]
BODY:
[email body — must include greeting, observation, body paragraphs, CTA, and sign-off]`;
}

function buildStep2Prompt(lead: any): string {
  const aiOpportunity = lead.ai_opportunity      ? `- AI/Automation Opportunity: ${lead.ai_opportunity}` : '';
  const improvements  = lead.possible_improvements ? `- Possible Improvements: ${lead.possible_improvements}` : '';

  return `${SPACZE_VOICE}

Write Follow-up #1 for the prospect below. This email is sent ~3–4 days after the initial outreach received no reply.

PROSPECT:
- Business Name: ${lead.business_name}
${lead.website  ? `- Website: ${lead.website}`   : ''}
${lead.industry ? `- Industry: ${lead.industry}` : ''}
${aiOpportunity}
${improvements}

STRUCTURE — write three distinct paragraphs in this exact order:

Paragraph 1 — GREETING + NEW INSIGHT (30–40 words):
Start with "Hi [Business Name]," then share a fresh, specific industry insight or observation the prospect would find genuinely useful on its own — something NOT mentioned in the first email. This should feel like a useful piece of information, not a sales opener.

Paragraph 2 — LIGHT REFERENCE + SPACZE CONNECTION (30–40 words):
In one clause, reference the first email: "I sent a note a few days ago about [topic]…" then connect this new insight to what Spacze does. Keep the Spacze mention to one sentence — natural, not salesy.

Paragraph 3 — CLOSING QUESTION + SIGN-OFF (20–25 words):
Ask one low-friction question: "Is this something on your radar?" or "Worth a quick conversation?" Then on a new line: "Tesleem" and below that: "Spacze"

WRITING RULES:
- Do NOT open with "just following up", "circling back", "checking in", or any variation
- Industry-specific angle: fashion → seasonal demand/DM order volume; real estate → lead follow-up speed; logistics → manual tracking costs; food → repeat customer retention; services → client churn/onboarding drop-off
- No bullet points in the body, no corporate filler
- Sign off: "Tesleem / Spacze"
- WORD COUNT: the body must be 100–130 words. Count every word before outputting. If under 100, expand paragraphs 1 and 2.

Output format (exactly):
SUBJECT: [use "Re:" prefix to thread, e.g. "Re: One idea for ${lead.business_name}"]
BODY:
[email body — must include greeting, new insight, light reference, closing question, and sign-off]`;
}

function buildStep3Prompt(lead: any): string {
  const aiOpportunity = lead.ai_opportunity ? `- AI/Automation Opportunity: ${lead.ai_opportunity}` : '';

  return `${SPACZE_VOICE}

Write Follow-up #2 for the prospect below. This email is sent ~9–10 days after the initial outreach received no reply. Two emails have already been sent with no response.

PROSPECT:
- Business Name: ${lead.business_name}
${lead.website  ? `- Website: ${lead.website}`   : ''}
${lead.industry ? `- Industry: ${lead.industry}` : ''}
${aiOpportunity}

STRUCTURE — write three distinct paragraphs in this exact order:

Paragraph 1 — GREETING + CASE STUDY (40–50 words):
Start with "Hi [Business Name]," then open with a brief, credible result Spacze achieved for a similar business — referenced anonymously: "a recent project for a ${lead.industry || 'similar'} client…". Include a specific metric or outcome: e.g. "cut order processing time by half", "reduced missed enquiries by 60%", "went from DM chaos to a clean automated store in 3 weeks". Keep it to 2 sentences — specific and believable.

Paragraph 2 — CONNECTION + AVAILABILITY (30–40 words):
Connect that result to what it could mean for ${lead.business_name} specifically. Then mention Spacze currently has a limited number of project slots available — frame it as a heads-up, not pressure.

Paragraph 3 — CTA + SIGN-OFF (20–25 words):
"Even a 10-minute call would be enough to see if there's a fit." Then on a new line: "Tesleem" and below that: "Spacze"

WRITING RULES:
- Take a completely different angle from the previous two emails — do NOT repeat the website observation
- Tone: confident, respectful, zero desperation
- No bullet points in the body, no corporate filler
- Sign off: "Tesleem / Spacze"
- WORD COUNT: the body must be 110–140 words. Count every word before outputting. If under 110, expand paragraphs 1 and 2.

Output format (exactly):
SUBJECT: [use "Re:" prefix to keep threading]
BODY:
[email body — must include greeting, case study, connection, CTA, and sign-off]`;
}

function buildStep4Prompt(lead: any): string {
  return `${SPACZE_VOICE}

Write the final "break-up" email for the prospect below. This is sent ~14–16 days after the initial outreach. Three emails have been sent with no reply. This is the last one.

PROSPECT:
- Business Name: ${lead.business_name}
${lead.industry ? `- Industry: ${lead.industry}` : ''}

STRUCTURE — write two paragraphs in this exact order:

Paragraph 1 — GREETING + HONEST CLOSE (40–50 words):
Start with "Hi [Business Name]," then acknowledge they've likely been busy — no blame, no guilt. Be direct and honest: "I'll stop reaching out after this so I don't clog your inbox." Leave a genuine open invitation: if their priorities change, Spacze is here. Optionally add one memorable sentence — a useful thought, not a pitch.

Paragraph 2 — WARM SIGN-OFF (15–20 words):
Wish them well sincerely. Then on a new line: "Tesleem" and below that: "Spacze"

WRITING RULES:
- Tone: human, gracious, zero pressure — some prospects reply to break-up emails precisely because the pressure is gone
- No bullet points, no corporate filler, no passive aggression
- Sign off: "Tesleem / Spacze"
- WORD COUNT: the body must be 70–90 words. Do not pad — but do not cut below 70.

Output format (exactly):
SUBJECT: [use "Re:" prefix to keep threading]
BODY:
[email body — must include greeting, honest break-up message, open invitation, and warm sign-off]`;
}

function buildPrompt(lead: any, step: number): string {
  switch (step) {
    case 1: return buildStep1Prompt(lead);
    case 2: return buildStep2Prompt(lead);
    case 3: return buildStep3Prompt(lead);
    case 4: return buildStep4Prompt(lead);
    default: return buildStep1Prompt(lead);
  }
}

// ─────────────────────────────────────────────
// OUTPUT PARSER
// ─────────────────────────────────────────────

function parseOutput(raw: string) {
  // Quote-agnostic: handles SUBJECT: "text", SUBJECT: text, Subject: text
  const subjectMatch = raw.match(/SUBJECT:\s*["']?(.+?)["']?(?:\n|$)/i);
  const bodyMatch    = raw.match(/BODY:\s*([\s\S]+)/i);
  return {
    subject: subjectMatch ? subjectMatch[1].trim() : 'Re: Quick thought',
    body:    bodyMatch    ? bodyMatch[1].trim()    : raw.replace(/SUBJECT:.*(?:\n|$)/i, '').trim(),
  };
}

// ─────────────────────────────────────────────
// AI PROVIDERS
// ─────────────────────────────────────────────

async function generateWithOpenAI(prompt: string): Promise<string> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.6,
    max_tokens: 900, // 175 words × ~1.4 tokens/word + prompt overhead
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
    temperature: 0.6,
    max_tokens: 900,
  });
  return completion.choices[0].message.content || '';
}

async function generateWithFallback(prompt: string): Promise<{ raw: string; provider: string }> {
  // Order: OpenAI → Groq → Gemini (Gemini free tier exhausts quickly)
  const providers: Array<{ name: string; key: string | undefined; fn: () => Promise<string> }> = [
    { name: 'openai', key: process.env.OPENAI_API_KEY, fn: () => generateWithOpenAI(prompt) },
    { name: 'groq',   key: process.env.GROQ_API_KEY,   fn: () => generateWithGroq(prompt) },
    { name: 'gemini', key: process.env.GEMINI_API_KEY, fn: () => generateWithGemini(prompt) },
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
      console.warn(`${provider.name} failed, trying next provider:`, err instanceof Error ? err.message : err);
      lastError = err;
    }
  }

  throw lastError ?? new Error('All AI providers failed.');
}

// ─────────────────────────────────────────────
// WORD COUNT VALIDATION
// ─────────────────────────────────────────────

// Minimum word counts per step — if the body is shorter, retry once with an explicit nudge
const MIN_WORDS: Record<number, number> = { 1: 120, 2: 85, 3: 95, 4: 65 };

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function buildRetryPrompt(prompt: string, body: string, step: number): string {
  const min = MIN_WORDS[step] ?? 100;
  return `${prompt}

RETRY INSTRUCTION: Your previous output was too short (${countWords(body)} words). The minimum is ${min} words for the body. Expand the observation paragraph and the Spacze paragraph — add specific detail, a concrete example, or a second supporting sentence to each. Do not add filler. Output the full email again.`;
}

// ─────────────────────────────────────────────
// ROUTE HANDLER
// ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // sequenceStep: 1 = initial, 2 = follow-up 1, 3 = follow-up 2, 4 = breakup
    const { sequenceStep = 1, ...lead } = body;
    const step = Number(sequenceStep);

    const prompt = buildPrompt(lead, step);
    const { raw, provider } = await generateWithFallback(prompt);
    let { subject, body: emailBody } = parseOutput(raw);

    // Retry once if body is under the minimum word count for this step
    const minWords = MIN_WORDS[step] ?? 100;
    if (countWords(emailBody) < minWords) {
      console.warn(`generate-email step ${step}: body too short (${countWords(emailBody)} words), retrying…`);
      const retryPrompt = buildRetryPrompt(prompt, emailBody, step);
      const { raw: retryRaw } = await generateWithFallback(retryPrompt);
      const retried = parseOutput(retryRaw);
      // Only use retry if it's actually longer
      if (countWords(retried.body) > countWords(emailBody)) {
        subject   = retried.subject || subject;
        emailBody = retried.body;
      }
    }

    return NextResponse.json({ subject, body: emailBody, provider, step });
  } catch (err: unknown) {
    console.error('generate-email error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to generate email' }, { status: 500 });
  }
}