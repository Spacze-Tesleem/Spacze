'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Bot, User, Loader2, Sparkles, RotateCcw, Copy, Check,
  Code2, Eye, Monitor, Smartphone, Tablet, FileCode2,
  ChevronRight, ChevronDown, Globe, RefreshCw, Download,
  MessageSquare, Wrench, PanelLeftClose, PanelLeftOpen, X,
  Circle, CheckCircle2, AlertCircle, Terminal, Cpu, Zap,
  Play, Square,
} from 'lucide-react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

// ── Types ─────────────────────────────────────────────────────────────────────
interface MsgPart {
  type: string;
  text?: string;
  toolName?: string;
  toolCallId?: string;
  state?: string;
  args?: Record<string, unknown>;
  result?: unknown;
}
interface UIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  parts?: MsgPart[];
}
interface CodeFile { name: string; lang: 'tsx' | 'css'; content: string; }
type PreviewSize = 'desktop' | 'tablet' | 'mobile';
type RightPane  = 'code' | 'preview';
type TopTab     = 'chat' | 'builder';

// ── Design tokens (Gitpod-inspired) ──────────────────────────────────────────
const BG       = '#0f0f0f';
const BG2      = '#161616';
const BG3      = '#1c1c1c';
const BORDER   = '#262626';
const BORDER2  = '#2e2e2e';
const TEXT      = '#e8e8e8';
const TEXT2     = '#a0a0a0';
const TEXT3     = '#606060';
const ACCENT    = '#00D67D';
const AMBER     = '#f59e0b';
const RED       = '#ef4444';
const BLUE      = '#3b82f6';
const MONO      = "'JetBrains Mono','Fira Code','Cascadia Code',ui-monospace,monospace";

// ── Constants ─────────────────────────────────────────────────────────────────
const PREVIEW_SIZES: Record<PreviewSize, { w: string; icon: React.ReactNode; label: string }> = {
  desktop: { w: '100%',  icon: <Monitor size={12} />,    label: 'Desktop' },
  tablet:  { w: '768px', icon: <Tablet size={12} />,     label: 'Tablet'  },
  mobile:  { w: '390px', icon: <Smartphone size={12} />, label: 'Mobile'  },
};
const LANG_COLORS: Record<string, string> = { tsx: '#38bdf8', css: '#a78bfa', js: '#f59e0b', ts: '#38bdf8' };

const STARTER = `'use client';
import { motion } from 'framer-motion';
export default function Page() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-8">
      <div className="text-center max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="inline-block text-xs font-mono uppercase tracking-widest text-[#00D67D] mb-4 px-3 py-1 rounded-full border border-[#00D67D]/30 bg-[#00D67D]/10">Spacze Builder</span>
          <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-[#00D67D] via-sky-400 to-purple-400 bg-clip-text text-transparent">Build Something Great</h1>
          <p className="text-zinc-400 text-lg leading-relaxed mb-8">Describe what you want to build. The AI writes Next.js + Tailwind code and renders it live.</p>
          <button className="px-8 py-3 rounded-full bg-[#00D67D] text-black font-bold hover:opacity-90 transition-opacity">Get Started</button>
        </motion.div>
      </div>
    </main>
  );
}`;

const BUILDER_SUGGESTIONS = [
  'Build a SaaS landing page with hero, features, and pricing',
  'Create a dark portfolio page with animated project cards',
  'Design a pricing section with 3 tiers and a toggle',
  'Build a testimonials section with glassmorphism cards',
  'Create a contact form with floating labels and validation',
  'Add a sticky navbar with blur backdrop and mobile menu',
];

const CHAT_SUGGESTIONS = [
  "Show me all leads that haven't been contacted yet",
  'Analyse the website for my top 3 pending leads',
  'Generate a WhatsApp message for a fashion brand lead',
  'Create a campaign targeting logistics leads on email',
  'What are the stats for my active campaigns?',
  'Write outreach copy for a real estate lead on LinkedIn',
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function extractTsx(text: string): string | null {
  const m = text.match(/```(?:tsx|jsx|typescript|javascript|js|ts)\n([\s\S]*?)```/i);
  if (m) return m[1].trim();
  if (text.includes('export default') && text.includes('return (')) {
    const start = text.indexOf("'use client'") !== -1 ? text.indexOf("'use client'") : text.indexOf('export default');
    return text.slice(start).trim();
  }
  return null;
}

function msgText(msg: UIMessage): string {
  let t = msg.content ?? '';
  if (!t && msg.parts) t = msg.parts.filter(p => p.type === 'text').map(p => p.text ?? '').join('');
  return t;
}

function fmtTime(d = new Date()) {
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function buildPreviewDoc(tsx: string): string {
  const stripped = tsx
    .replace(/'use client';\s*/g, '')
    .replace(/import\s+.*?from\s+['"]next\/.*?['"];?\s*/g, '')
    .replace(/import\s+\{[^}]*\}\s+from\s+['"]framer-motion['"];?\s*/g, '')
    .replace(/import\s+\{[^}]*\}\s+from\s+['"]lucide-react['"];?\s*/g, '')
    .replace(/:\s*\w+(\[\])?(\s*\|[^,)=\n]+)*/g, '')
    .replace(/interface\s+\w+\s*\{[^}]*\}/g, '')
    .replace(/type\s+\w+\s*=\s*[^;]+;/g, '')
    .replace(/<\w+(\[\])?>/g, '')
    .replace(/as\s+\w+/g, '');
  const noMotion = stripped
    .replace(/motion\./g, '').replace(/AnimatePresence/g, 'React.Fragment')
    .replace(/initial=\{[^}]*\}/g, '').replace(/animate=\{[^}]*\}/g, '')
    .replace(/exit=\{[^}]*\}/g, '').replace(/transition=\{[^}]*\}/g, '')
    .replace(/variants=\{[^}]*\}/g, '').replace(/whileHover=\{[^}]*\}/g, '')
    .replace(/whileTap=\{[^}]*\}/g, '');
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<script src="https://cdn.tailwindcss.com"></script>
<script>tailwind.config={theme:{extend:{colors:{accent:'#00D67D'}}}}</script>
<script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<style>*{box-sizing:border-box}body{margin:0;background:#09090b}</style>
</head><body><div id="root"></div>
<script type="text/babel">${noMotion}
const root=ReactDOM.createRoot(document.getElementById('root'));root.render(React.createElement(Page));
</script></body></html>`;
}

// ── CopyBtn ───────────────────────────────────────────────────────────────────
function CopyBtn({ text, size = 11 }: { text: string; size?: number }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="p-1 rounded transition-colors flex-shrink-0"
      style={{ color: copied ? ACCENT : TEXT3 }} title="Copy">
      {copied ? <Check size={size} /> : <Copy size={size} />}
    </button>
  );
}

// ── ToolCallRow — collapsible log entry for tool invocations ──────────────────
function ToolCallRow({ part }: { part: MsgPart }) {
  const [open, setOpen] = useState(false);
  const isDone    = part.state === 'result' || part.state === 'call';
  const isRunning = part.state === 'partial-call' || (!isDone && !part.result);
  const hasResult = part.result !== undefined;

  const statusColor = isRunning ? AMBER : hasResult ? ACCENT : TEXT3;
  const statusIcon  = isRunning
    ? <Loader2 size={10} className="animate-spin" style={{ color: AMBER }} />
    : hasResult
      ? <CheckCircle2 size={10} style={{ color: ACCENT }} />
      : <Circle size={10} style={{ color: TEXT3 }} />;

  const resultStr = hasResult
    ? JSON.stringify(part.result, null, 2)
    : '';
  const argsStr = part.args ? JSON.stringify(part.args, null, 2) : '';

  return (
    <div className="border-l-2 ml-6 pl-3 my-1" style={{ borderColor: statusColor + '40' }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 w-full text-left py-0.5 group"
      >
        {statusIcon}
        <span style={{ fontFamily: MONO, fontSize: 11, color: AMBER }}>
          {part.toolName ?? 'tool'}
        </span>
        {part.args && (
          <span style={{ fontFamily: MONO, fontSize: 10, color: TEXT3 }}>
            ({Object.keys(part.args).join(', ')})
          </span>
        )}
        <span className="flex-1" />
        {(argsStr || resultStr) && (
          <span style={{ color: TEXT3, fontSize: 10 }}>
            {open ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (argsStr || resultStr) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            {argsStr && (
              <div className="mt-1 mb-1">
                <div style={{ fontFamily: MONO, fontSize: 9, color: TEXT3, marginBottom: 2 }}>ARGS</div>
                <pre className="rounded p-2 overflow-x-auto text-[10px] leading-relaxed"
                  style={{ background: BG3, color: TEXT2, fontFamily: MONO, maxHeight: 160 }}>
                  {argsStr}
                </pre>
              </div>
            )}
            {resultStr && (
              <div className="mt-1">
                <div style={{ fontFamily: MONO, fontSize: 9, color: TEXT3, marginBottom: 2 }}>RESULT</div>
                <pre className="rounded p-2 overflow-x-auto text-[10px] leading-relaxed"
                  style={{ background: BG3, color: ACCENT + 'cc', fontFamily: MONO, maxHeight: 200 }}>
                  {resultStr.slice(0, 2000)}{resultStr.length > 2000 ? '\n… truncated' : ''}
                </pre>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── ChatRow — a single message rendered as a terminal log line ────────────────
function ChatRow({ msg, isStreaming, ts }: { msg: UIMessage; isStreaming?: boolean; ts: string }) {
  const isUser = msg.role === 'user';
  const raw    = msgText(msg);
  const display = raw.replace(/```[\s\S]*?```/g, '').replace(/Current component[\s\S]*$/i, '').trim();

  const toolParts = (msg.parts ?? []).filter(p =>
    p.type === 'tool-invocation' || p.type === 'tool-call' || p.type === 'tool-result'
  );

  return (
    <div className="group py-1.5 px-4 hover:bg-white/[0.02] transition-colors">
      {/* Gutter line */}
      <div className="flex items-start gap-3">
        {/* Timestamp + role gutter */}
        <div className="flex-shrink-0 flex items-center gap-2 pt-0.5" style={{ width: 120 }}>
          <span style={{ fontFamily: MONO, fontSize: 10, color: TEXT3 }}>{ts}</span>
          <span style={{
            fontFamily: MONO, fontSize: 10, fontWeight: 600,
            color: isUser ? BLUE : ACCENT,
          }}>
            {isUser ? 'user' : 'agent'}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {display && (
            <div className="relative">
              <p style={{
                fontFamily: isUser ? 'inherit' : MONO,
                fontSize: isUser ? 13 : 12,
                color: isUser ? TEXT : TEXT2,
                lineHeight: 1.65,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {display}
                {isStreaming && (
                  <span className="inline-block w-[7px] h-[13px] ml-0.5 align-middle animate-pulse rounded-sm"
                    style={{ background: ACCENT }} />
                )}
              </p>
              {!isUser && display && (
                <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <CopyBtn text={display} />
                </div>
              )}
            </div>
          )}

          {/* Tool call entries */}
          {toolParts.length > 0 && (
            <div className="mt-1 space-y-0.5">
              {toolParts.map((p, i) => <ToolCallRow key={i} part={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── CHAT TAB — Gitpod-style terminal interface ────────────────────────────────
function ChatTab() {
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);
  const [input, setInput]   = useState('');
  const [times]             = useState<Map<string, string>>(() => new Map());

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: '/api/agent', credentials: 'include' }),
  });

  const isLoading  = status === 'streaming' || status === 'submitted';
  const uiMessages = messages as unknown as UIMessage[];
  const isEmpty    = uiMessages.length === 0;

  // Stamp each message with the time it first appeared
  uiMessages.forEach(m => { if (!times.has(m.id)) times.set(m.id, fmtTime()); });

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);

  const submit = useCallback(() => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    sendMessage({ text });
  }, [input, isLoading, sendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  }, [submit]);

  return (
    <div className="flex flex-col h-full" style={{ background: BG, fontFamily: MONO }}>

      {/* ── Top bar ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 h-9 border-b"
        style={{ background: BG2, borderColor: BORDER }}>
        <div className="flex items-center gap-3">
          {/* Traffic-light dots */}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#ff5f57' }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#febc2e' }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#28c840' }} />
          </div>
          {/* Breadcrumb */}
          <div className="flex items-center gap-1" style={{ fontSize: 11, color: TEXT3 }}>
            <Terminal size={10} style={{ color: TEXT3 }} />
            <span>spacze</span>
            <ChevronRight size={9} style={{ color: TEXT3 }} />
            <span style={{ color: TEXT2 }}>agent</span>
            <ChevronRight size={9} style={{ color: TEXT3 }} />
            <span style={{ color: ACCENT }}>chat</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isLoading && (
            <div className="flex items-center gap-1.5" style={{ fontSize: 10, color: AMBER }}>
              <Loader2 size={9} className="animate-spin" />
              <span>running</span>
            </div>
          )}
          {!isLoading && !isEmpty && (
            <div className="flex items-center gap-1" style={{ fontSize: 10, color: ACCENT }}>
              <CheckCircle2 size={9} />
              <span>ready</span>
            </div>
          )}
          {!isEmpty && (
            <button onClick={() => setMessages([])}
              className="flex items-center gap-1 px-2 py-0.5 rounded border transition-colors"
              style={{ fontSize: 10, color: TEXT3, borderColor: BORDER }}
              onMouseEnter={e => (e.currentTarget.style.color = TEXT2)}
              onMouseLeave={e => (e.currentTarget.style.color = TEXT3)}
              title="Clear session">
              <RotateCcw size={9} /> clear
            </button>
          )}
        </div>
      </div>

      {/* ── Log area ── */}
      <div className="flex-1 overflow-y-auto" style={{ background: BG }}>

        {/* Empty state */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full gap-6 px-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-3"
                style={{ fontFamily: MONO, fontSize: 12, color: TEXT3 }}>
                <Cpu size={14} style={{ color: ACCENT }} />
                <span style={{ color: ACCENT }}>spacze-agent</span>
                <span>v1.0</span>
                <span style={{ color: ACCENT }}>●</span>
                <span>ready</span>
              </div>
              <p style={{ fontSize: 11, color: TEXT3, fontFamily: MONO }}>
                autonomous operator · crm · outreach · campaigns
              </p>
            </div>

            {/* Suggestion grid */}
            <div className="w-full max-w-xl grid grid-cols-1 gap-1">
              {CHAT_SUGGESTIONS.map(s => (
                <button key={s}
                  onClick={() => { setInput(s); inputRef.current?.focus(); }}
                  className="flex items-center gap-2 px-3 py-2 rounded border text-left transition-colors"
                  style={{ background: BG2, borderColor: BORDER, fontSize: 11, color: TEXT3, fontFamily: MONO }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT + '50'; e.currentTarget.style.color = TEXT2; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TEXT3; }}>
                  <ChevronRight size={10} style={{ color: ACCENT, flexShrink: 0 }} />
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {!isEmpty && (
          <div className="py-2">
            {/* Session header */}
            <div className="px-4 py-1.5 border-b mb-2" style={{ borderColor: BORDER }}>
              <span style={{ fontFamily: MONO, fontSize: 10, color: TEXT3 }}>
                session started · {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>

            {uiMessages.map(msg => (
              <ChatRow key={msg.id} msg={msg} ts={times.get(msg.id) ?? fmtTime()} />
            ))}

            {isLoading && (uiMessages.length === 0 || uiMessages[uiMessages.length - 1]?.role === 'user') && (
              <ChatRow
                msg={{ id: '__stream__', role: 'assistant', content: '' }}
                isStreaming
                ts={fmtTime()}
              />
            )}

            {error && (
              <div className="mx-4 my-2 flex items-start gap-2 px-3 py-2 rounded border"
                style={{ background: RED + '10', borderColor: RED + '40', fontSize: 11, color: RED, fontFamily: MONO }}>
                <AlertCircle size={11} className="flex-shrink-0 mt-0.5" />
                <span>{error.message}</span>
              </div>
            )}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ── */}
      <div className="flex-shrink-0 border-t" style={{ borderColor: BORDER, background: BG2 }}>
        <div className="flex items-end gap-0">
          {/* Prompt prefix */}
          <div className="flex-shrink-0 flex items-center px-4 pb-3 pt-3 self-end"
            style={{ fontFamily: MONO, fontSize: 13, color: ACCENT, userSelect: 'none' }}>
            &gt;
          </div>

          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="type a command…"
            rows={1}
            disabled={isLoading}
            className="flex-1 bg-transparent resize-none outline-none py-3 pr-3 disabled:opacity-40"
            style={{
              fontFamily: MONO, fontSize: 12, color: TEXT,
              minHeight: 20, caretColor: ACCENT,
              lineHeight: 1.6,
            }}
            onInput={e => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = Math.min(el.scrollHeight, 120) + 'px';
            }}
          />

          <div className="flex-shrink-0 flex items-center gap-2 px-3 pb-3 pt-3 self-end">
            {isLoading ? (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded border"
                style={{ borderColor: AMBER + '40', background: AMBER + '10', fontSize: 10, color: AMBER, fontFamily: MONO }}>
                <Square size={9} />
                <span>running</span>
              </div>
            ) : (
              <button onClick={submit} disabled={!input.trim()}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded border transition-all disabled:opacity-30"
                style={{ borderColor: ACCENT + '50', background: ACCENT + '15', fontSize: 10, color: ACCENT, fontFamily: MONO }}
                onMouseEnter={e => { if (input.trim()) e.currentTarget.style.background = ACCENT + '25'; }}
                onMouseLeave={e => { e.currentTarget.style.background = ACCENT + '15'; }}>
                <Play size={9} />
                <span>run</span>
              </button>
            )}
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between px-4 py-1 border-t"
          style={{ borderColor: BORDER, background: BG3 }}>
          <div className="flex items-center gap-3" style={{ fontSize: 10, color: TEXT3, fontFamily: MONO }}>
            <span style={{ color: ACCENT }}>● spacze-agent</span>
            <span>openai → groq → gemini</span>
          </div>
          <div className="flex items-center gap-3" style={{ fontSize: 10, color: TEXT3, fontFamily: MONO }}>
            <span>{uiMessages.length} messages</span>
            <span>Enter ↵ send · Shift+Enter newline</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Builder sub-components ────────────────────────────────────────────────────
function FileTab({ file, active, onClick }: { file: CodeFile; active: boolean; onClick: () => void }) {
  const color = LANG_COLORS[file.lang] ?? '#6b6b8a';
  return (
    <button onClick={onClick}
      className="flex items-center gap-1.5 px-4 h-full border-r text-[11px] whitespace-nowrap transition-all flex-shrink-0"
      style={{ fontFamily: MONO, borderColor: BORDER, background: active ? BG : 'transparent',
        color: active ? TEXT : TEXT3, borderBottom: active ? `2px solid ${color}` : '2px solid transparent' }}>
      <FileCode2 size={10} style={{ color }} />{file.name}
    </button>
  );
}

function CodePanel({ files, activeFile, onFileChange, onContentChange }: {
  files: CodeFile[]; activeFile: number;
  onFileChange: (i: number) => void; onContentChange: (i: number, val: string) => void;
}) {
  const file  = files[activeFile];
  const lines = file.content.split('\n');
  return (
    <div className="flex flex-col h-full" style={{ background: BG }}>
      <div className="flex items-center h-9 border-b flex-shrink-0 overflow-x-auto"
        style={{ background: BG2, borderColor: BORDER }}>
        {files.map((f, i) => <FileTab key={f.name} file={f} active={activeFile === i} onClick={() => onFileChange(i)} />)}
        <div className="flex-1" />
        <div className="px-3 flex-shrink-0"><CopyBtn text={file.content} size={10} /></div>
      </div>
      <div className="flex flex-1 overflow-hidden" style={{ fontFamily: MONO, fontSize: 12, lineHeight: '20px' }}>
        <div className="select-none text-right pt-3 pb-3 pr-3 overflow-hidden flex-shrink-0"
          style={{ width: 44, color: TEXT3, background: BG2, borderRight: `1px solid ${BORDER}` }}>
          {lines.map((_, i) => <div key={i} style={{ height: 20, lineHeight: '20px' }}>{i + 1}</div>)}
        </div>
        <textarea value={file.content} onChange={e => onContentChange(activeFile, e.target.value)}
          spellCheck={false} className="flex-1 resize-none outline-none p-3 overflow-auto"
          style={{ background: BG, color: TEXT, caretColor: ACCENT, tabSize: 2, fontFamily: MONO }} />
      </div>
    </div>
  );
}

function PreviewPane({ doc, size, refreshKey }: { doc: string; size: PreviewSize; refreshKey: number }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { w } = PREVIEW_SIZES[size];
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const d = iframe.contentDocument || iframe.contentWindow?.document;
    if (!d) return;
    d.open(); d.write(doc); d.close();
  }, [doc, refreshKey]);
  return (
    <div className="flex flex-col h-full overflow-auto items-start justify-start p-4" style={{ background: '#050508' }}>
      <div className="rounded-xl overflow-hidden border transition-all duration-300 mx-auto"
        style={{ width: w, minHeight: '100%', borderColor: BORDER, flexShrink: 0 }}>
        <iframe ref={iframeRef} title="preview" sandbox="allow-scripts allow-same-origin"
          className="w-full border-0 block" style={{ minHeight: 600, height: '100%' }} />
      </div>
    </div>
  );
}

// ── BUILDER TAB ───────────────────────────────────────────────────────────────
function BuilderTab() {
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);
  const [input, setInput]             = useState('');
  const [pane, setPane]               = useState<RightPane>('preview');
  const [previewSize, setPreviewSize] = useState<PreviewSize>('desktop');
  const [activeFile, setActiveFile]   = useState(0);
  const [chatOpen, setChatOpen]       = useState(true);
  const [refreshKey, setRefreshKey]   = useState(0);
  const [files, setFiles]             = useState<CodeFile[]>([
    { name: 'page.tsx',    lang: 'tsx', content: STARTER },
    { name: 'globals.css', lang: 'css', content: `/* Add custom CSS here */\n@tailwind base;\n@tailwind components;\n@tailwind utilities;\n` },
  ]);

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: '/api/build', credentials: 'include' }),
  });

  const isLoading  = status === 'streaming' || status === 'submitted';
  const uiMessages = messages as unknown as UIMessage[];
  const isEmpty    = uiMessages.length === 0;

  useEffect(() => {
    const last = [...uiMessages].reverse().find(m => m.role === 'assistant');
    if (!last) return;
    const code = extractTsx(msgText(last));
    if (!code) return;
    setFiles(prev => prev.map((f, i) => i === 0 ? { ...f, content: code } : f));
    setRefreshKey(k => k + 1);
    setPane('preview');
  }, [uiMessages]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);

  const submit = useCallback(() => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    const currentCode = files[0].content;
    const prompt = uiMessages.length > 0
      ? `${text}\n\nCurrent component:\n\`\`\`tsx\n${currentCode.slice(0, 4000)}\n\`\`\``
      : text;
    sendMessage({ text: prompt });
  }, [input, isLoading, sendMessage, files, uiMessages.length]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  }, [submit]);

  const previewDoc = useMemo(() => buildPreviewDoc(files[0].content), [files, refreshKey]); // eslint-disable-line

  const handleDownload = () => {
    const blob = new Blob([files[0].content], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'page.tsx'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full overflow-hidden" style={{ background: BG }}>

      {/* Chat sidebar */}
      <AnimatePresence initial={false}>
        {chatOpen && (
          <motion.div key="chat"
            initial={{ width: 0, opacity: 0 }} animate={{ width: 280, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="flex-shrink-0 flex flex-col border-r overflow-hidden" style={{ borderColor: BORDER }}>

            <div className="flex-shrink-0 flex items-center justify-between px-3 h-9 border-b"
              style={{ background: BG2, borderColor: BORDER }}>
              <div className="flex items-center gap-2" style={{ fontFamily: MONO, fontSize: 11, color: TEXT2 }}>
                <Sparkles size={10} style={{ color: ACCENT }} />
                <span>ai-builder</span>
              </div>
              <div className="flex items-center gap-1">
                {!isEmpty && (
                  <button onClick={() => { setMessages([]); setFiles(prev => prev.map((f, i) => i === 0 ? { ...f, content: STARTER } : f)); setRefreshKey(k => k + 1); }}
                    className="p-1 rounded transition-colors" style={{ color: TEXT3 }}
                    onMouseEnter={e => (e.currentTarget.style.color = TEXT2)}
                    onMouseLeave={e => (e.currentTarget.style.color = TEXT3)} title="Reset">
                    <RotateCcw size={10} />
                  </button>
                )}
                <button onClick={() => setChatOpen(false)}
                  className="p-1 rounded transition-colors" style={{ color: TEXT3 }}
                  onMouseEnter={e => (e.currentTarget.style.color = TEXT2)}
                  onMouseLeave={e => (e.currentTarget.style.color = TEXT3)}>
                  <X size={10} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ background: BG }}>
              {isEmpty && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 pt-2">
                  <p style={{ fontFamily: MONO, fontSize: 10, color: TEXT3, textAlign: 'center' }}>
                    describe what to build
                  </p>
                  {BUILDER_SUGGESTIONS.map(s => (
                    <button key={s} onClick={() => { setInput(s); inputRef.current?.focus(); }}
                      className="w-full text-left px-2.5 py-1.5 rounded border transition-colors"
                      style={{ fontFamily: MONO, fontSize: 10, color: TEXT3, borderColor: BORDER, background: BG2 }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT + '50'; e.currentTarget.style.color = TEXT2; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TEXT3; }}>
                      <ChevronRight size={9} style={{ color: ACCENT, display: 'inline', marginRight: 4 }} />{s}
                    </button>
                  ))}
                </motion.div>
              )}
              {uiMessages.map(msg => {
                const isUser = msg.role === 'user';
                const text   = msgText(msg).replace(/```[\s\S]*?```/g, '').replace(/Current component[\s\S]*$/i, '').trim();
                const hasCode = extractTsx(msgText(msg)) !== null;
                return (
                  <div key={msg.id} className={`flex gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
                    <div className="flex-1 min-w-0">
                      {text && (
                        <p style={{ fontFamily: MONO, fontSize: 11, color: isUser ? TEXT : TEXT2,
                          background: isUser ? BLUE + '15' : BG2, border: `1px solid ${isUser ? BLUE + '30' : BORDER}`,
                          borderRadius: 6, padding: '6px 10px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {text}
                        </p>
                      )}
                      {hasCode && !isUser && (
                        <div className="flex items-center gap-1 mt-1"
                          style={{ fontFamily: MONO, fontSize: 9, color: ACCENT }}>
                          <Code2 size={8} /> applied to editor
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {isLoading && (uiMessages.length === 0 || uiMessages[uiMessages.length - 1]?.role === 'user') && (
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded border"
                  style={{ fontFamily: MONO, fontSize: 10, color: AMBER, borderColor: AMBER + '30', background: AMBER + '08' }}>
                  <Loader2 size={9} className="animate-spin" /> generating…
                </div>
              )}
              {error && (
                <div className="px-2.5 py-1.5 rounded border"
                  style={{ fontFamily: MONO, fontSize: 10, color: RED, borderColor: RED + '30', background: RED + '08' }}>
                  {error.message}
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="flex-shrink-0 p-2 border-t" style={{ borderColor: BORDER, background: BG2 }}>
              <div className="flex items-end gap-1 rounded border px-2 py-1.5"
                style={{ background: BG, borderColor: BORDER }}>
                <span style={{ fontFamily: MONO, fontSize: 12, color: ACCENT, flexShrink: 0, paddingBottom: 1 }}>&gt;</span>
                <textarea ref={inputRef} value={input}
                  onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="describe…" rows={1} disabled={isLoading}
                  className="flex-1 bg-transparent resize-none outline-none disabled:opacity-40"
                  style={{ fontFamily: MONO, fontSize: 11, color: TEXT, minHeight: 18, caretColor: ACCENT }}
                  onInput={e => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 80) + 'px'; }} />
                <button onClick={submit} disabled={!input.trim() || isLoading}
                  className="flex-shrink-0 p-1 rounded transition-colors disabled:opacity-30"
                  style={{ color: ACCENT }}
                  onMouseEnter={e => (e.currentTarget.style.background = ACCENT + '20')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  {isLoading ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* IDE workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex-shrink-0 flex items-center justify-between px-3 h-9 border-b"
          style={{ background: BG2, borderColor: BORDER }}>
          <div className="flex items-center gap-2">
            <button onClick={() => setChatOpen(v => !v)}
              className="p-1 rounded border transition-colors"
              style={{ color: chatOpen ? ACCENT : TEXT3, borderColor: chatOpen ? ACCENT + '40' : BORDER, background: chatOpen ? ACCENT + '10' : 'transparent' }}
              title={chatOpen ? 'Hide panel' : 'Show panel'}>
              {chatOpen ? <PanelLeftClose size={12} /> : <PanelLeftOpen size={12} />}
            </button>
            <div className="flex items-center gap-1" style={{ fontFamily: MONO, fontSize: 10, color: TEXT3 }}>
              <Globe size={9} /><span>spacze/builder</span>
              <ChevronRight size={8} />
              <span style={{ color: TEXT2 }}>{files[activeFile]?.name}</span>
            </div>
            {isLoading && (
              <div className="flex items-center gap-1" style={{ fontFamily: MONO, fontSize: 10, color: AMBER }}>
                <Loader2 size={9} className="animate-spin" /><span>generating…</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <div className="flex items-center rounded border overflow-hidden" style={{ borderColor: BORDER }}>
              {(['code', 'preview'] as RightPane[]).map(p => (
                <button key={p} onClick={() => setPane(p)}
                  className="flex items-center gap-1.5 px-3 py-1 transition-colors"
                  style={{ fontFamily: MONO, fontSize: 10, background: pane === p ? BG3 : 'transparent', color: pane === p ? TEXT : TEXT3 }}>
                  {p === 'code' ? <Code2 size={10} /> : <Eye size={10} />}{p}
                </button>
              ))}
            </div>
            {pane === 'preview' && (
              <div className="flex items-center rounded border overflow-hidden" style={{ borderColor: BORDER }}>
                {(Object.entries(PREVIEW_SIZES) as [PreviewSize, typeof PREVIEW_SIZES[PreviewSize]][]).map(([key, val]) => (
                  <button key={key} onClick={() => setPreviewSize(key)}
                    className="flex items-center px-2 py-1 transition-colors"
                    style={{ background: previewSize === key ? BG3 : 'transparent', color: previewSize === key ? TEXT : TEXT3 }}
                    title={val.label}>{val.icon}
                  </button>
                ))}
              </div>
            )}
            {pane === 'preview' && (
              <button onClick={() => setRefreshKey(k => k + 1)}
                className="p-1 rounded border transition-colors"
                style={{ color: TEXT3, borderColor: BORDER }}
                onMouseEnter={e => (e.currentTarget.style.color = TEXT2)}
                onMouseLeave={e => (e.currentTarget.style.color = TEXT3)} title="Refresh">
                <RefreshCw size={11} />
              </button>
            )}
            <button onClick={handleDownload}
              className="p-1 rounded border transition-colors"
              style={{ color: TEXT3, borderColor: BORDER }}
              onMouseEnter={e => (e.currentTarget.style.color = TEXT2)}
              onMouseLeave={e => (e.currentTarget.style.color = TEXT3)} title="Download">
              <Download size={11} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {pane === 'code' ? (
            <CodePanel files={files} activeFile={activeFile} onFileChange={setActiveFile}
              onContentChange={(i, val) => setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, content: val } : f))} />
          ) : (
            <PreviewPane doc={previewDoc} size={previewSize} refreshKey={refreshKey} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── ROOT PANEL ────────────────────────────────────────────────────────────────
export default function AgentPanel() {
  const [tab, setTab] = useState<TopTab>('chat');

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] overflow-hidden rounded-xl border"
      style={{ background: BG, borderColor: BORDER }}>

      {/* Tab bar */}
      <div className="flex-shrink-0 flex items-center border-b px-2 gap-0"
        style={{ background: BG2, borderColor: BORDER, height: 36 }}>

        {([
          { id: 'chat'    as TopTab, label: 'chat',    icon: <Terminal size={11} /> },
          { id: 'builder' as TopTab, label: 'builder', icon: <Code2 size={11} />    },
        ]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-3 h-full border-b-2 transition-colors"
            style={{
              fontFamily: MONO, fontSize: 11,
              color:       tab === t.id ? TEXT  : TEXT3,
              borderColor: tab === t.id ? ACCENT : 'transparent',
              background:  'transparent',
            }}>
            {t.icon}{t.label}
          </button>
        ))}

        <div className="flex-1" />
        <div className="flex items-center gap-2 pr-3" style={{ fontFamily: MONO, fontSize: 10, color: TEXT3 }}>
          <Cpu size={9} style={{ color: ACCENT }} />
          <span>spacze-agent</span>
          <span style={{ color: BORDER2 }}>|</span>
          <span>{tab === 'chat' ? 'crm · outreach · campaigns' : 'next.js · react · tailwind'}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {tab === 'chat'    && <ChatTab />}
        {tab === 'builder' && <BuilderTab />}
      </div>
    </div>
  );
}
