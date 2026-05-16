import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

function buildPrompt(lead: any): string {
  return `You are an expert B2B sales copywriter for Spacze, a software and AI automation agency.

Your task is to write a highly personalized cold outreach email for a business based on their website analysis.

Business Details:
- Business Name: ${lead.business_name}
- Website: ${lead.website}
- Industry: ${lead.industry}

Website Analysis:
- Website quality: ${lead.website_quality_score ?? 'N/A'}/10
- Mobile responsiveness: ${lead.mobile_responsiveness || 'Unknown'}
- SEO quality: ${lead.seo_quality || 'Unknown'}
- Has dashboard/system: ${lead.has_dashboard ? 'Yes' : 'No'}
- AI opportunity: ${lead.ai_opportunity || 'Not assessed'}
- Weak points: ${lead.weak_points || 'Not specified'}
- Possible improvements: ${lead.possible_improvements || 'Not specified'}

Instructions:
- Mention 1–2 specific weak points noticed on their website or digital experience
- Explain how Spacze can improve those areas using modern web development, automation, dashboards, or AI solutions
- Keep the email natural and conversational
- Avoid robotic or overly sales-focused language
- Focus on business benefits: better customer experience, automation, improved lead generation, faster operations, modern branding
- Mention portfolio: https://spacze.vercel.app
- Include a clear CTA asking for a short discussion or quick call
- Keep email length between 180–220 words
- Write like a real human, not a marketing bot

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
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function POST(req: NextRequest) {
  try {
    const lead = await req.json();
    const prompt = buildPrompt(lead);

    let raw = '';
    let provider = '';

    if (process.env.OPENAI_API_KEY) {
      try {
        raw = await generateWithOpenAI(prompt);
        provider = 'openai';
      } catch (openaiErr: any) {
        console.warn('OpenAI failed, falling back to Gemini:', openaiErr.message);
        if (!process.env.GEMINI_API_KEY) {
          throw new Error('OpenAI failed and no GEMINI_API_KEY is set.');
        }
        raw = await generateWithGemini(prompt);
        provider = 'gemini';
      }
    } else if (process.env.GEMINI_API_KEY) {
      raw = await generateWithGemini(prompt);
      provider = 'gemini';
    } else {
      return NextResponse.json(
        { error: 'No AI provider configured. Set OPENAI_API_KEY or GEMINI_API_KEY in environment variables.' },
        { status: 500 }
      );
    }

    const { subject, body } = parseOutput(raw);
    return NextResponse.json({ subject, body, provider });
  } catch (err: any) {
    console.error('generate-email error:', err);
    return NextResponse.json({ error: err.message || 'Failed to generate email' }, { status: 500 });
  }
}
