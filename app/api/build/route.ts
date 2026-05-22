/**
 * POST /api/build
 *
 * Spacze Website Builder — streaming code generation endpoint.
 * Focused exclusively on Next.js 14 App Router + React + Tailwind CSS output.
 * Returns a single self-contained React component per response.
 */

import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';
import { NextRequest } from 'next/server';

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert Next.js 14 / React / Tailwind CSS engineer and UI designer.
Your job is to generate beautiful, production-quality website components and pages on demand.

STACK RULES — always follow these exactly:
- Framework: Next.js 14 App Router ('use client' when needed, server components by default)
- Styling: Tailwind CSS utility classes only — no inline styles, no CSS modules, no styled-components
- Language: TypeScript (.tsx)
- Icons: lucide-react (import named icons only)
- Animations: framer-motion (motion.div, AnimatePresence, variants)
- Images: next/image with placeholder="blur" blurDataURL when needed
- Fonts: use next/font/google (Inter, Plus_Jakarta_Sans, or Geist)
- No external UI libraries (no shadcn, no MUI, no Chakra)

OUTPUT RULES — critical:
1. Always output ONE complete .tsx file wrapped in a single \`\`\`tsx code block
2. The component must be the default export
3. Use a dark-first design: bg-zinc-950, bg-zinc-900, text-zinc-100 as base
4. Accent color: #00D67D — use it as text-[#00D67D], bg-[#00D67D], border-[#00D67D]
5. Make it visually stunning: gradients, glassmorphism, subtle animations, micro-interactions
6. All components must be fully responsive (mobile-first)
7. Include realistic placeholder content — no "Lorem ipsum"
8. After the code block, write a SHORT 2-sentence description of what was built

COMPONENT PATTERNS to use:
- Glassmorphism: bg-white/5 backdrop-blur-xl border border-white/10
- Gradient text: bg-gradient-to-r from-[#00D67D] to-sky-400 bg-clip-text text-transparent
- Hover effects: group/hover: transitions, scale, translate
- Cards: rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-sm
- Buttons: rounded-full px-6 py-3 font-semibold with hover glow shadow

When modifying existing code:
- The user will provide the current component code
- Return the FULL updated component — never partial diffs
- Preserve the overall structure, only change what was asked`;

// ── Provider list ─────────────────────────────────────────────────────────────

function getModels() {
  const models = [];
  if (process.env.OPENAI_API_KEY) {
    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    models.push({ name: 'openai', model: openai('gpt-4o') });
  }
  if (process.env.GROQ_API_KEY) {
    const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
    models.push({ name: 'groq', model: groq('llama-3.3-70b-versatile') });
  }
  if (process.env.GEMINI_API_KEY) {
    const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
    models.push({ name: 'gemini', model: google('gemini-2.0-flash') });
  }
  return models;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: 'messages array required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const providers = getModels();
  if (providers.length === 0) {
    return new Response(
      JSON.stringify({ error: 'No AI provider configured.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  let lastError: unknown;
  for (const { name, model } of providers) {
    try {
      const result = streamText({
        model,
        system: SYSTEM_PROMPT,
        messages,
        temperature: 0.7,
        maxRetries: 0,
      });
      return result.toUIMessageStreamResponse();
    } catch (err) {
      console.warn(`[build] ${name} failed:`, err instanceof Error ? err.message : err);
      lastError = err;
    }
  }

  const msg = lastError instanceof Error ? lastError.message : 'All AI providers failed';
  return new Response(JSON.stringify({ error: msg }), {
    status: 500, headers: { 'Content-Type': 'application/json' },
  });
}
