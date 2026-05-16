import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  try {
    const lead = await req.json();

    const prompt = `You are an expert B2B sales copywriter for Spacze, a software and AI automation agency.

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

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.85,
      max_tokens: 600,
    });

    const raw = completion.choices[0].message.content || '';

    // Parse subject and body
    const subjectMatch = raw.match(/SUBJECT:\s*(.+)/i);
    const bodyMatch = raw.match(/BODY:\s*([\s\S]+)/i);

    const subject = subjectMatch ? subjectMatch[1].trim() : 'Quick thought about your website';
    const body = bodyMatch ? bodyMatch[1].trim() : raw;

    return NextResponse.json({ subject, body });
  } catch (err: any) {
    console.error('generate-email error:', err);
    return NextResponse.json({ error: err.message || 'Failed to generate email' }, { status: 500 });
  }
}
