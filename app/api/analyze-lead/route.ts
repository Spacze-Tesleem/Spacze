import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

/**
 * POST /api/analyze-lead
 *
 * Pipeline:
 *   1. Jina Reader (free) scrapes the lead's website into clean markdown
 *   2. Groq Llama-3 scores the site and extracts weak_points / ai_opportunity
 *   3. Results are patched back onto the lead row in Supabase
 *
 * Body: { leadId: string; website: string; business_name: string; industry?: string }
 * Returns: the updated lead fields
 */

// ── 1. Jina scrape ────────────────────────────────────────────────────────────

async function scrapeWithJina(url: string): Promise<string> {
  // Jina Reader: prefix any URL with https://r.jina.ai/ to get clean markdown
  const jinaUrl = `https://r.jina.ai/${url.replace(/^https?:\/\//, '')}`;
  const res = await fetch(jinaUrl, {
    headers: {
      Accept: 'text/markdown',
      'X-Return-Format': 'markdown',
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`Jina scrape failed: ${res.status} ${res.statusText}`);
  const text = await res.text();
  // Trim to ~6 000 chars so we don't blow the Groq context window
  return text.slice(0, 6000);
}

// ── 2. Groq analysis ──────────────────────────────────────────────────────────

function buildAnalysisPrompt(
  businessName: string,
  industry: string,
  websiteContent: string,
): string {
  return `You are a senior web strategist and AI consultant at Spacze, a software development and AI automation agency.

Analyse the following website content for "${businessName}" (${industry || 'unknown industry'}) and return a structured JSON assessment.

WEBSITE CONTENT:
${websiteContent}

Return ONLY valid JSON — no markdown fences, no explanation — in this exact shape:
{
  "website_quality_score": <integer 1–10>,
  "mobile_responsiveness": "<Good | Average | Poor>",
  "seo_quality": "<Good | Average | Poor>",
  "has_dashboard": <true | false>,
  "ai_opportunity": "<1–2 sentence description of the single biggest AI/automation opportunity for this business>",
  "weak_points": "<2–3 specific, factual observations about what is missing or could be improved — framed neutrally, not negatively>",
  "possible_improvements": "<2–3 concrete improvements Spacze could deliver: e.g. AI chatbot, booking system, dashboard, SEO overhaul>"
}

Scoring guide for website_quality_score:
1–3: No website or completely broken
4–5: Basic static site, no interactivity, poor SEO
6–7: Functional but missing modern UX, automation, or mobile optimisation
8–9: Professional, fast, good UX — minor gaps
10: Enterprise-grade, fully optimised`;
}

async function analyseWithGroq(prompt: string): Promise<string> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3, // low temp for structured JSON
    max_tokens: 600,
    response_format: { type: 'json_object' },
  });
  return completion.choices[0].message.content || '{}';
}

// ── 3. Parse & validate ───────────────────────────────────────────────────────

interface AnalysisResult {
  website_quality_score: number | null;
  mobile_responsiveness: string;
  seo_quality: string;
  has_dashboard: boolean;
  ai_opportunity: string;
  weak_points: string;
  possible_improvements: string;
}

function parseAnalysis(raw: string): AnalysisResult {
  // Strip any accidental markdown fences
  const cleaned = raw.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(cleaned);

  return {
    website_quality_score: typeof parsed.website_quality_score === 'number'
      ? Math.min(10, Math.max(1, Math.round(parsed.website_quality_score)))
      : null,
    mobile_responsiveness: String(parsed.mobile_responsiveness || 'Unknown'),
    seo_quality:           String(parsed.seo_quality || 'Unknown'),
    has_dashboard:         Boolean(parsed.has_dashboard),
    ai_opportunity:        String(parsed.ai_opportunity || ''),
    weak_points:           String(parsed.weak_points || ''),
    possible_improvements: String(parsed.possible_improvements || ''),
  };
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { leadId, website, business_name, industry } = await req.json();

    if (!leadId) return NextResponse.json({ error: 'leadId is required' }, { status: 400 });
    if (!website) return NextResponse.json({ error: 'website is required' }, { status: 400 });
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'GROQ_API_KEY is not configured' }, { status: 503 });
    }

    // Step 1 — scrape
    let websiteContent: string;
    try {
      websiteContent = await scrapeWithJina(website);
    } catch (scrapeErr: unknown) {
      // Scrape failed — still run analysis with just the URL as context
      console.warn('Jina scrape failed, proceeding without content:', scrapeErr instanceof Error ? scrapeErr.message : scrapeErr);
      websiteContent = `Website URL: ${website}\n(Content could not be scraped — base analysis on URL and business name only)`;
    }

    // Step 2 — analyse
    const prompt = buildAnalysisPrompt(business_name || '', industry || '', websiteContent);
    const raw = await analyseWithGroq(prompt);
    const analysis = parseAnalysis(raw);

    // Step 3 — patch Supabase
    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from('leads')
      .update(analysis)
      .eq('id', leadId)
      .select()
      .single();

    if (error) throw new Error(`Supabase update failed: ${error.message}`);

    return NextResponse.json({ success: true, analysis, lead: data });
  } catch (err: unknown) {
    console.error('analyze-lead error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Analysis failed' },
      { status: 500 },
    );
  }
}
