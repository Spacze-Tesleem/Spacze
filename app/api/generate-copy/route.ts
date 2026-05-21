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
  return `You are a social media copywriter for Spacze, a software development and AI automation agency based in Nigeria with global clients.

Write an Instagram caption for the following brief. Instagram captions are read while scrolling — the first line must stop the thumb.

BRIEF:
- Product/Service: ${b.productName || b.businessName || 'Not specified'}
- Target Audience: ${b.targetAudience || b.industry || 'General'}
- Tone: ${b.tone || 'Conversational'}
- Goal: ${b.goal || 'Awareness'}
- Key Message: ${b.keyMessage || b.aiOpportunity || 'Not specified'}
${b.weakPoints ? `- Pain point to address: ${b.weakPoints}` : ''}

STRUCTURE — the caption must follow this exact order:
1. Hook (1 line): bold, specific statement or relatable pain point — NOT a question starting with "Are you…"
   Examples: "Most businesses lose 40% of their leads before ever replying." / "Your DMs are full. Your sales system isn't."
2. Body (3–4 short lines): expand on the hook, build curiosity or empathy, introduce the solution naturally
3. CTA (1 line): clear, low-friction action — "DM us 'START'" / "Link in bio" / "Comment 'INFO' to learn more"
4. Line break, then hashtags on their own line

WRITING RULES:
- Each line should be 1–2 sentences max — Instagram readers skim
- No corporate filler, no "We are proud to announce", no "synergy"
- Tone must match the brief — if conversational, write like a person, not a brand
- Industry-specific angle: fashion → style/ordering; real estate → property/investment; logistics → speed/reliability; food → taste/convenience; services → time-saving/results
- Total caption body: 80–120 words (not counting hashtags)
- Hashtags: 5–8 relevant, mix of niche and broad — no spaces between hashtags

Output format (exactly):
CAPTION:
[caption here]
HASHTAGS:
[hashtags here]`;
}

function buildTwitterPrompt(b: CopyBrief): string {
  return `You are a social media copywriter for Spacze, a software development and AI automation agency based in Nigeria with global clients.

Write a Twitter/X promotional post for the following brief. Twitter/X posts are read in a fast-moving feed — every word must earn its place.

BRIEF:
- Product/Service: ${b.productName || b.businessName || 'Not specified'}
- Target Audience: ${b.targetAudience || b.industry || 'General'}
- Tone: ${b.tone || 'Bold'}
- Goal: ${b.goal || 'Clicks'}
- Key Message: ${b.keyMessage || b.aiOpportunity || 'Not specified'}

STRUCTURE — the post must follow this exact order:
1. Hook (first line, max 80 chars): punchy statement, bold claim, or relatable observation — this is what shows before "Show more"
2. Body (1–2 lines): expand briefly — a stat, a contrast, or a specific outcome
3. CTA (1 line): direct action — "DM us", "Link below", "Reply with your niche"
4. 1–2 hashtags inline or at the end (not more)

WRITING RULES:
- Hard limit: 280 characters total for the main tweet — count carefully
- No "Are you…" openers, no "We are excited to…", no corporate filler
- Tone: bold, direct, peer-level — not a brand announcement
- No excessive punctuation or emojis (max 1 emoji if it adds meaning)
- Optional thread reply: if the key message needs more space, write a follow-up reply tweet (max 220 chars) that adds one extra insight or proof point

Output format (exactly):
TWEET:
[tweet here — max 280 characters]
REPLY:
[follow-up reply tweet here — max 220 characters, or leave blank if not needed]`;
}

function buildGoogleAdsPrompt(b: CopyBrief): string {
  return `You are a Google Ads copywriter for Spacze, a software development and AI automation agency based in Nigeria with global clients.

Write Google Ads Responsive Search Ad copy for the following brief. Google Ads copy is read by people actively searching — every character must be intentional and benefit-driven.

BRIEF:
- Product/Service: ${b.productName || b.businessName || 'Not specified'}
- Target Audience: ${b.targetAudience || b.industry || 'General'}
- Tone: ${b.tone || 'Professional'}
- Goal: ${b.goal || 'Leads'}
- Key Message: ${b.keyMessage || b.aiOpportunity || 'Not specified'}
${b.possibleImprovements ? `- Key benefit to highlight: ${b.possibleImprovements}` : ''}

STRUCTURE:
- 3 Headlines: shown at the top of the ad, rotated by Google — each must work standalone AND in combination
- 2 Descriptions: shown below headlines — expand on the offer, include a CTA

WRITING RULES FOR HEADLINES (each max 30 characters — count spaces):
- Headline 1: lead with the primary keyword or service (e.g. "AI Automation for SMBs")
- Headline 2: lead with a specific benefit or outcome (e.g. "Save 10hrs/Week on Admin")
- Headline 3: trust signal or CTA (e.g. "Free 15-Min Consultation")
- No exclamation marks in headlines
- No ALL CAPS
- 30 is a hard limit including spaces — count carefully

WRITING RULES FOR DESCRIPTIONS (each max 90 characters — count spaces):
- Description 1: expand on the core benefit, include a keyword naturally
- Description 2: address a pain point and end with a soft CTA
- No ALL CAPS, no excessive punctuation

Output format (exactly — include character counts in brackets for verification):
HEADLINE_1: [text] ([X] chars)
HEADLINE_2: [text] ([X] chars)
HEADLINE_3: [text] ([X] chars)
DESCRIPTION_1: [text] ([X] chars)
DESCRIPTION_2: [text] ([X] chars)`;
}

function buildEmailPrompt(b: CopyBrief): string {
  return `You are an email copywriter for Spacze, a software development and AI automation agency based in Nigeria with global clients.

Write a cold outreach or marketing email for the following brief. The reader should feel a real person wrote this specifically for them — not that they received a template.

BRIEF:
- Product/Service: ${b.productName || b.businessName || 'Not specified'}
- Target Audience: ${b.targetAudience || b.industry || 'General'}
- Tone: ${b.tone || 'Professional but conversational'}
- Goal: ${b.goal || 'Start a conversation'}
- Key Message: ${b.keyMessage || b.aiOpportunity || 'Not specified'}
${b.weakPoints ? `- Pain point to address: ${b.weakPoints}` : ''}
${b.possibleImprovements ? `- Solution to highlight: ${b.possibleImprovements}` : ''}

STRUCTURE — the email must have all four of these parts:
1. Greeting: "Hi [audience/name]," — not "Dear" or "To whom it may concern"
2. Opening observation (1–2 sentences): one specific, relevant hook — a pain point, industry insight, or opportunity
3. Body (2–3 sentences): what Spacze does, why it's relevant, one casual portfolio mention if appropriate: "You can see some of our work at Spacze.vercel.app"
4. CTA + sign-off: one soft CTA ("Would you be open to a quick chat?") then "Tesleem / Spacze"

WRITING RULES:
- Subject line: specific and curiosity-driven, under 8 words, no clickbait
- Body: 140–175 words — count carefully before outputting
- No bullet points in the email body
- No corporate filler: no "I hope this finds you well", "synergy", "leverage", "touch base"
- No spam trigger words
- Frame everything as an opportunity, never a criticism
- Industry-specific angle: fashion → DM ordering/no storefront; real estate → manual lead follow-up; logistics → tracking/manual process; food → repeat orders/booking; services → client onboarding/scheduling

Output format (exactly):
SUBJECT: [subject line — under 8 words]
BODY:
[email body — must include greeting, observation, body paragraphs, CTA, and sign-off]`;
}

function buildWhatsAppPrompt(b: CopyBrief): string {
  return `You are a WhatsApp copywriter for Spacze, a software development and AI automation agency based in Nigeria with global clients.

Write a WhatsApp outreach message for the following brief. WhatsApp is a personal channel — it must read like a text from a real person, not a broadcast blast.

BRIEF:
- Product/Service: ${b.productName || b.businessName || 'Not specified'}
- Target Audience: ${b.targetAudience || b.industry || 'General'}
- Tone: ${b.tone || 'Friendly'}
- Goal: ${b.goal || 'Start a conversation'}
- Key Message: ${b.keyMessage || b.aiOpportunity || 'Not specified'}
${b.weakPoints ? `- Pain point to address: ${b.weakPoints}` : ''}

STRUCTURE — the message must follow this exact order:
1. Greeting (1 line): casual and warm — "Hi [Name]," or "Hey [Business]," — no "Dear" or formal openers
2. Observation or hook (1–2 sentences): one specific, relevant thing about their business or situation — framed as an opportunity
3. Value sentence (1 sentence): what Spacze does and why it's relevant — brief, not salesy
4. Soft CTA (1 sentence): a question that invites a reply — "Would you be open to a quick chat?" or "Want me to send over a few ideas?"
— NO sign-off, NO "Regards", NO "Best wishes" — WhatsApp messages don't end with formal sign-offs

WRITING RULES:
- Total length: 60–90 words maximum — WhatsApp readers don't read walls of text
- No bullet points, no numbered lists
- No corporate filler: no "I hope this message finds you well", "synergy", "leverage"
- Emojis: only if the tone is casual/friendly AND the industry suits it (fashion, food) — max 1
- Must feel like a text, not a marketing email stripped of formatting
- Industry-specific angle: fashion → DM ordering/no storefront; real estate → manual lead follow-up; logistics → tracking/manual process; food → repeat orders/booking; services → client onboarding

Output format (exactly):
MESSAGE:
[message here — no sign-off]`;
}

function buildLinkedInPrompt(b: CopyBrief): string {
  return `You are a LinkedIn copywriter for Spacze, a software development and AI automation agency based in Nigeria with global clients.

Write LinkedIn outreach copy for the following brief. LinkedIn has two distinct touchpoints — a connection request note and a follow-up message — each with a different job and format.

BRIEF:
- Product/Service: ${b.productName || b.businessName || 'Not specified'}
- Target Audience: ${b.targetAudience || b.industry || 'General'}
- Tone: ${b.tone || 'Professional but warm'}
- Goal: ${b.goal || 'Start a conversation'}
- Key Message: ${b.keyMessage || b.aiOpportunity || 'Not specified'}
${b.weakPoints ? `- Context/pain point: ${b.weakPoints}` : ''}
${b.possibleImprovements ? `- Relevant improvement: ${b.possibleImprovements}` : ''}

PART 1 — CONNECTION REQUEST NOTE (shown before they accept):
- Hard limit: 300 characters including spaces — count carefully
- Job: get them to accept the connection — not to pitch
- Structure: one specific reason for connecting + one sentence on shared relevance
- No "I came across your profile and…" — too generic
- No pitch, no portfolio link, no CTA — just a warm, specific reason to connect
- Example style: "Noticed you're building [X] in [industry] — we work with similar businesses on [relevant area]. Would love to connect."

PART 2 — FOLLOW-UP MESSAGE (sent after they accept):
- Length: 80–120 words
- Structure:
  1. Greeting: "Hi [Name]," — not "Dear" or "Hello [Full Name]"
  2. Thank them briefly for connecting (1 short sentence)
  3. One specific observation about their business or industry — framed as an opportunity
  4. One sentence on what Spacze does and why it's relevant
  5. Soft CTA: "Would you be open to a quick chat?" or "Worth a 15-minute call?"
  6. Sign-off: "Tesleem / Spacze"
- No bullet points in the message body
- No corporate filler: no "I hope this message finds you well", "synergy", "leverage"
- Tone: peer-to-peer, warm, confident — not a sales pitch
- Industry-specific angle: fashion → ordering/inventory; real estate → lead capture/CRM; logistics → process automation; food → customer retention; services → client onboarding

Output format (exactly):
CONNECTION_NOTE:
[connection note — max 300 characters, no sign-off]
FOLLOW_UP:
[follow-up message — includes greeting, body, CTA, and sign-off]`;
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
  // Order: OpenAI → Groq → Gemini (Gemini free tier exhausts quickly)
  const providers = [
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
      console.warn(`${provider.name} failed, trying next:`, err instanceof Error ? err.message : err);
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

    if (!body.platform) {
      return NextResponse.json({ error: 'Missing required field: platform' }, { status: 400 });
    }

    // Map snake_case lead fields → CopyBrief camelCase fields
    const brief: CopyBrief = {
      platform:            body.platform,
      tone:                body.tone,
      goal:                body.goal,
      keyMessage:          body.keyMessage,
      productName:         body.productName,
      targetAudience:      body.targetAudience,
      // Lead fields (snake_case from Supabase)
      businessName:        body.businessName        || body.business_name,
      industry:            body.industry,
      aiOpportunity:       body.aiOpportunity        || body.ai_opportunity,
      weakPoints:          body.weakPoints           || body.weak_points,
      possibleImprovements:body.possibleImprovements || body.possible_improvements,
      website:             body.website,
    };

    const prompt = buildPrompt(brief);
    const { raw, provider } = await generateWithFallback(prompt);

    // Strip any JSON wrapping the AI may have added (some models wrap output in ```json ... ```)
    let output = raw.trim();
    const jsonFenceMatch = output.match(/^```(?:json)?\s*([\s\S]*?)```$/);
    if (jsonFenceMatch) output = jsonFenceMatch[1].trim();

    // If the AI returned a JSON object, try to extract the output field
    if (output.startsWith('{')) {
      try {
        const parsed = JSON.parse(output);
        output = parsed.output || parsed.content || parsed.text || output;
      } catch { /* not valid JSON, use as-is */ }
    }

    return NextResponse.json({ platform: brief.platform, output, provider });
  } catch (err: unknown) {
    console.error('generate-copy error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to generate copy' }, { status: 500 });
  }
}
