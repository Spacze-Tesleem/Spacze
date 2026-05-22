import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  try {
    const { business_name, industry, website, ai_opportunity, weak_points, possible_improvements } = await req.json();

    if (!business_name) return NextResponse.json({ error: 'business_name is required' }, { status: 400 });

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'No Gemini API key configured' }, { status: 500 });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are a senior web copywriter at Spacze, a Nigerian AI & web development agency.

Generate website copy for a client with these details:
- Business: ${business_name}
- Industry: ${industry || 'General'}
- Website: ${website || 'Not provided'}
- AI Opportunity: ${ai_opportunity || 'Unknown'}
- Current weak points: ${weak_points || 'None noted'}
- Suggested improvements: ${possible_improvements || 'None noted'}

Return ONLY valid JSON with exactly these four keys (no markdown, no code fences):
{
  "tagline": "A punchy 6-10 word tagline for ${business_name}",
  "hero": "2-3 sentence hero section copy that speaks to their target customers",
  "about": "3-4 sentence about section that builds trust and explains what they do",
  "cta": "A compelling call-to-action sentence (e.g. Get a free audit, Book a call)"
}

Rules:
- Be specific to ${business_name} and their ${industry || 'industry'} — no generic filler
- Tone: confident, clear, human — no corporate jargon
- Hero and about must be fully developed paragraphs, not one-liners`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();

    // Strip markdown code fences if present
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    let parsed: { tagline: string; hero: string; about: string; cta: string };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Fallback: extract JSON object from response
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('Could not parse AI response as JSON');
      parsed = JSON.parse(match[0]);
    }

    return NextResponse.json(parsed);
  } catch (e: unknown) {
    console.error('[generate-site-content]', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Generation failed' }, { status: 500 });
  }
}
