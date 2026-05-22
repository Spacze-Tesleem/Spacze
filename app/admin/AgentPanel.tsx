'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Loader2, RotateCcw, Copy, Check,
  Code2, Eye, Monitor, Smartphone, Tablet, FileCode2,
  ChevronRight, ChevronDown, Globe, RefreshCw, Download,
  MessageSquare, PanelLeftClose, PanelLeftOpen, X,
  Circle, CheckCircle2, AlertCircle, Terminal, Cpu, Zap,
  Square, Layers,
} from 'lucide-react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG      = '#09090b';
const BG2     = '#111115';
const BG3     = '#18181b';
const BORDER  = 'rgba(255,255,255,0.08)';
const BORDER2 = 'rgba(255,255,255,0.14)';
const TEXT    = '#fafafa';
const TEXT2   = '#a1a1aa';
const TEXT3   = '#52525b';
const ACCENT  = '#10b981';
const AMBER   = '#f59e0b';
const RED     = '#ef4444';
const BLUE    = '#3b82f6';
const MONO    = "'JetBrains Mono','Fira Code','Cascadia Code',ui-monospace,monospace";

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
  content?: string;
  parts?: MsgPart[];
}
interface CodeFile { name: string; lang: 'tsx' | 'css'; content: string; }
type PreviewSize = 'desktop' | 'tablet' | 'mobile';
type RightPane  = 'code' | 'preview';
type TopTab     = 'chat' | 'builder';

// ── Constants ─────────────────────────────────────────────────────────────────
const PREVIEW_SIZES: Record<PreviewSize, { w: string; icon: React.ReactNode; label: string }> = {
  desktop: { w: '100%',  icon: <Monitor size={12} />,    label: 'Desktop' },
  tablet:  { w: '768px', icon: <Tablet size={12} />,     label: 'Tablet'  },
  mobile:  { w: '390px', icon: <Smartphone size={12} />, label: 'Mobile'  },
};
const LANG_COLORS: Record<string, string> = { tsx: '#38bdf8', css: '#a78bfa' };

const STARTER = `'use client';
import { motion } from 'framer-motion';
export default function Page() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-8">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-xl w-full">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent mb-8" />
        <h1 className="text-4xl font-light tracking-tight mb-4">Next Generation <span className="text-emerald-500 font-medium">Interfaces</span></h1>
        <p className="text-neutral-400 text-lg font-light leading-relaxed mb-8">Describe your vision and watch the code materialise in real-time.</p>
        <div className="flex gap-4">
          <button className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 transition-colors rounded-full text-sm font-medium">Get Started</button>
          <button className="px-6 py-2 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 transition-colors rounded-full text-sm font-medium">Learn More</button>
        </div>
      </motion.div>
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
function msgText(msg: UIMessage): string {
  if (msg.parts) {
    const t = msg.parts.filter(p => p.type === 'text').map(p => p.text ?? '').join('');
    if (t) return t;
  }
  return msg.content ?? '';
}

function extractTsx(text: string): string | null {
  const m = text.match(/```(?:tsx|jsx|typescript|javascript|js|ts)\n([\s\S]*?)```/i);
  if (m) return m[1].trim();
  if (text.includes('export default') && text.includes('return (')) {
    const start = text.indexOf("'use client'") !== -1 ? text.indexOf("'use client'") : text.indexOf('export default');
    return text.slice(start).trim();
  }
  return null;
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
<script>tailwind.config={theme:{extend:{colors:{accent:'#10b981'}}}}</script>
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
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="p-1 rounded transition-colors flex-shrink-0"
      style={{ color: copied ? ACCENT : TEXT3 }}
      title="Copy"
    >
      {copied ? <Check size={size} /> : <Copy size={size} />}
    </button>
  );
}

// ── IconBtn — typed icon button used in toolbars ──────────────────────────────
function IconBtn({
  icon: Icon, onClick, active = false, title, size = 11,
}: {
  icon: React.ElementType; onClick?: () => void; active?: boolean; title?: string; size?: number;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex items-center justify-center w-6 h-6 rounded-md border transition-all"
      style={{
        color: active ? ACCENT : TEXT3,
        borderColor: active ? ACCENT + '40' : BORDER,
        background: active ? ACCENT + '10' : 'transparent',
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.color = TEXT2; e.currentTarget.style.borderColor = BORDER2; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.color = TEXT3; e.currentTarget.style.borderColor = BORDER; } }}
    >
      <Icon size={size} />
    </button>
  );
}

// ── ToolCallRow — collapsible tool invocation log ────────────────────────────
function ToolCallRow({ part }: { part: MsgPart }) {
  const [open, setOpen] = useState(false);
  const isDone    = part.state === 'result' || part.state === 'call';
  const isRunning = part.state === 'partial-call' || (!isDone && part.result === undefined);
  const hasResult = part.result !== undefined;
  const statusColor = isRunning ? AMBER : hasResult ? ACCENT : TEXT3;
  const statusIcon  = isRunning
    ? <Loader2 size={10} className="animate-spin" style={{ color: AMBER }} />
    : hasResult
      ? <CheckCircle2 size={10} style={{ color: ACCENT }} />
      : <Circle size={10} style={{ color: TEXT3 }} />;
  const argsStr   = part.args   ? JSON.stringify(part.args,   null, 2) : '';
  const resultStr = hasResult   ? JSON.stringify(part.result, null, 2) : '';
  return (
    <div className="border-l-2 ml-6 pl-3 my-1" style={{ borderColor: statusColor + '40' }}>
      <button onClick={() => setOpen(v => !v)} className="flex items-center gap-2 w-full text-left py-0.5">
        {statusIcon}
        <span style={{ fontFamily: MONO, fontSize: 11, color: AMBER }}>{part.toolName ?? 'tool'}</span>
        {part.args && <span style={{ fontFamily: MONO, fontSize: 10, color: TEXT3 }}>({Object.keys(part.args).join(', ')})</span>}
        <span className="flex-1" />
        {(argsStr || resultStr) && <span style={{ color: TEXT3 }}>{open ? <ChevronDown size={10} /> : <ChevronRight size={10} />}</span>}
      </button>
      <AnimatePresence>
        {open && (argsStr || resultStr) && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
            {argsStr && (
              <div className="mt-1 mb-1">
                <div style={{ fontFamily: MONO, fontSize: 9, color: TEXT3, marginBottom: 2 }}>ARGS</div>
                <pre className="rounded p-2 overflow-x-auto text-[10px] leading-relaxed" style={{ background: BG3, color: TEXT2, fontFamily: MONO, maxHeight: 160 }}>{argsStr}</pre>
              </div>
            )}
            {resultStr && (
              <div className="mt-1">
                <div style={{ fontFamily: MONO, fontSize: 9, color: TEXT3, marginBottom: 2 }}>RESULT</div>
                <pre className="rounded p-2 overflow-x-auto text-[10px] leading-relaxed" style={{ background: BG3, color: ACCENT + 'cc', fontFamily: MONO, maxHeight: 200 }}>{resultStr.slice(0, 2000)}{resultStr.length > 2000 ? '\n… truncated' : ''}</pre>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── ChatRow ───────────────────────────────────────────────────────────────────
function ChatRow({ msg, isStreaming, ts }: { msg: UIMessage; isStreaming?: boolean; ts: string }) {
  const isUser = msg.role === 'user';
  const raw     = msgText(msg);
  const display = raw.replace(/```[\s\S]*?```/g, '').replace(/Current component[\s\S]*$/i, '').trim();
  const toolParts = (msg.parts ?? []).filter(p =>
    p.type === 'tool-invocation' || p.type === 'tool-call' || p.type === 'tool-result'
  );
  return (
    <div className="group py-1.5 px-4 hover:bg-white/[0.02] transition-colors">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 flex items-center gap-2 pt-0.5" style={{ width: 120 }}>
          <span style={{ fontFamily: MONO, fontSize: 10, color: TEXT3 }}>{ts}</span>
          <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, color: isUser ? BLUE : ACCENT }}>
            {isUser ? 'user' : 'agent'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          {display && (
            <div className="relative">
              <p style={{ fontFamily: isUser ? 'inherit' : MONO, fontSize: isUser ? 13 : 12, color: isUser ? TEXT : TEXT2, lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {display}
                {isStreaming && <span className="inline-block w-[7px] h-[13px] ml-0.5 align-middle animate-pulse rounded-sm" style={{ background: ACCENT }} />}
              </p>
              {!isUser && display && (
                <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <CopyBtn text={display} />
                </div>
              )}
            </div>
          )}
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
      <div className="flex items-center h-9 border-b flex-shrink-0 overflow-x-auto" style={{ background: BG2, borderColor: BORDER }}>
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
    <div className="flex flex-col h-full overflow-auto items-start justify-start p-4"
      style={{ background: '#050508', backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      <div className="rounded-xl overflow-hidden border transition-all duration-300 mx-auto"
        style={{ width: w, minHeight: '100%', borderColor: BORDER, flexShrink: 0, borderRadius: w === '100%' ? 0 : 16 }}>
        <iframe ref={iframeRef} title="preview" sandbox="allow-scripts allow-same-origin"
          className="w-full border-0 block" style={{ minHeight: 600, height: '100%' }} />
      </div>
    </div>
  );
}

// ── CHAT TAB ──────────────────────────────────────────────────────────────────
function ChatTab() {
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState('');
  const [times]           = useState<Map<string, string>>(() => new Map());

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: '/api/agent', credentials: 'include' }),
  });

  const isLoading  = status === 'streaming' || status === 'submitted';
  const uiMessages = messages as unknown as UIMessage[];
  const isEmpty    = uiMessages.length === 0;

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
    <div className="flex flex-col h-full" style={{ background: BG }}>

      {/* Session bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 h-8 border-b" style={{ background: BG2, borderColor: BORDER }}>
        <div className="flex items-center gap-2" style={{ fontFamily: MONO, fontSize: 10, color: TEXT3 }}>
          <Terminal size={9} style={{ color: TEXT3 }} />
          <span>session</span>
          <ChevronRight size={8} style={{ color: TEXT3 }} />
          <span style={{ color: TEXT2 }}>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ background: AMBER + '12', border: `1px solid ${AMBER}28`, fontSize: 10, color: AMBER, fontFamily: MONO }}>
              <Loader2 size={8} className="animate-spin" /><span>thinking</span>
            </div>
          )}
          {!isLoading && !isEmpty && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: ACCENT + '12', border: `1px solid ${ACCENT}28`, fontSize: 10, color: ACCENT, fontFamily: MONO }}>
              <CheckCircle2 size={8} /><span>ready</span>
            </div>
          )}
          {!isEmpty && (
            <button onClick={() => setMessages([])}
              className="flex items-center gap-1 px-2 py-0.5 rounded border transition-colors"
              style={{ fontSize: 10, color: TEXT3, borderColor: BORDER, fontFamily: MONO }}
              onMouseEnter={e => { e.currentTarget.style.color = TEXT2; e.currentTarget.style.borderColor = BORDER2; }}
              onMouseLeave={e => { e.currentTarget.style.color = TEXT3; e.currentTarget.style.borderColor = BORDER; }}>
              <RotateCcw size={8} /> clear
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto" style={{ background: BG }}>
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full gap-8 px-6 py-10">
            <div className="flex flex-col items-center gap-4">
              <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl" style={{ background: ACCENT + '10', border: `1px solid ${ACCENT}22` }}>
                <Zap size={28} style={{ color: ACCENT }} />
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 animate-pulse" style={{ background: ACCENT, borderColor: BG }} />
              </div>
              <div className="text-center">
                <p style={{ fontFamily: MONO, fontSize: 14, color: TEXT, fontWeight: 600, marginBottom: 4 }}>What can I help with?</p>
                <p style={{ fontFamily: MONO, fontSize: 11, color: TEXT3 }}>CRM · outreach · campaigns · analytics</p>
              </div>
            </div>
            <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CHAT_SUGGESTIONS.map(s => (
                <button key={s} onClick={() => { setInput(s); inputRef.current?.focus(); }}
                  className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl border text-left transition-all"
                  style={{ background: BG2, borderColor: BORDER, fontFamily: MONO }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT + '45'; e.currentTarget.style.background = ACCENT + '08'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.background = BG2; }}>
                  <ChevronRight size={10} style={{ color: ACCENT, flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 11, color: TEXT2, lineHeight: 1.5 }}>{s}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {!isEmpty && (
          <div className="py-2">
            {uiMessages.map(msg => (
              <ChatRow key={msg.id} msg={msg} ts={times.get(msg.id) ?? fmtTime()} />
            ))}
            {isLoading && (uiMessages.length === 0 || uiMessages[uiMessages.length - 1]?.role === 'user') && (
              <ChatRow msg={{ id: '__stream__', role: 'assistant' }} isStreaming ts={fmtTime()} />
            )}
            {error && (
              <div className="mx-4 my-2 flex items-start gap-2 px-3 py-2 rounded-lg border"
                style={{ background: RED + '10', borderColor: RED + '40', fontSize: 11, color: RED, fontFamily: MONO }}>
                <AlertCircle size={11} className="flex-shrink-0 mt-0.5" /><span>{error.message}</span>
              </div>
            )}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-3 border-t" style={{ borderColor: BORDER, background: BG2 }}>
        <div className="flex items-end gap-2 rounded-xl border px-3 py-2.5 transition-colors"
          style={{ background: BG, borderColor: BORDER }}
          onFocusCapture={e => (e.currentTarget.style.borderColor = ACCENT + '50')}
          onBlurCapture={e => (e.currentTarget.style.borderColor = BORDER)}>
          <span style={{ fontFamily: MONO, fontSize: 13, color: ACCENT, flexShrink: 0, paddingBottom: 1, userSelect: 'none' }}>›</span>
          <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown} placeholder="Ask the agent anything…" rows={1}
            disabled={isLoading} className="flex-1 bg-transparent resize-none outline-none disabled:opacity-40"
            style={{ fontFamily: MONO, fontSize: 12, color: TEXT, minHeight: 20, caretColor: ACCENT, lineHeight: 1.6 }}
            onInput={e => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 120) + 'px'; }} />
          <div className="flex-shrink-0 flex items-center gap-1.5 self-end pb-0.5">
            {isLoading ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                style={{ background: AMBER + '12', border: `1px solid ${AMBER}30`, fontSize: 10, color: AMBER, fontFamily: MONO }}>
                <Square size={9} /><span>stop</span>
              </div>
            ) : (
              <button onClick={submit} disabled={!input.trim()}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-30"
                style={{ background: ACCENT + '18', border: `1px solid ${ACCENT}35`, fontSize: 10, color: ACCENT, fontFamily: MONO }}
                onMouseEnter={e => { if (input.trim()) { e.currentTarget.style.background = ACCENT + '28'; e.currentTarget.style.borderColor = ACCENT + '55'; } }}
                onMouseLeave={e => { e.currentTarget.style.background = ACCENT + '18'; e.currentTarget.style.borderColor = ACCENT + '35'; }}>
                <Send size={10} /><span>send</span>
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between px-1 pt-1.5">
          <div className="flex items-center gap-3" style={{ fontFamily: MONO, fontSize: 9, color: TEXT3 }}>
            <span style={{ color: ACCENT + 'aa' }}>● spacze-agent</span>
            <span>openai · groq · gemini</span>
          </div>
          <span style={{ fontFamily: MONO, fontSize: 9, color: TEXT3 }}>
            ↵ send · ⇧↵ newline · {uiMessages.length} msg{uiMessages.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── MAIN PANEL COMPONENT ──────────────────────────────────────────────────────

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

  const { messages, sendMessage, status, setMessages } = useChat({
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

            {/* Sidebar header */}
            <div className="flex-shrink-0 flex items-center justify-between px-3 h-10 border-b" style={{ background: BG2, borderColor: BORDER }}>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-5 h-5 rounded-md" style={{ background: ACCENT + '18', border: `1px solid ${ACCENT}30` }}>
                  <Layers size={9} style={{ color: ACCENT }} />
                </div>
                <span style={{ fontFamily: MONO, fontSize: 11, color: TEXT2, fontWeight: 600 }}>ai-builder</span>
              </div>
              <div className="flex items-center gap-1">
                {!isEmpty && (
                  <IconBtn icon={RotateCcw} title="Reset"
                    onClick={() => { setMessages([]); setFiles(prev => prev.map((f, i) => i === 0 ? { ...f, content: STARTER } : f)); setRefreshKey(k => k + 1); }} />
                )}
                <IconBtn icon={X} onClick={() => setChatOpen(false)} />
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ background: BG }}>
              {isEmpty && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 pt-1">
                  <div className="flex items-center gap-1.5 pb-1" style={{ fontFamily: MONO, fontSize: 10, color: TEXT3 }}>
                    <Zap size={9} style={{ color: ACCENT }} /><span>describe what to build</span>
                  </div>
                  {BUILDER_SUGGESTIONS.map(s => (
                    <button key={s} onClick={() => { setInput(s); inputRef.current?.focus(); }}
                      className="w-full text-left px-2.5 py-2 rounded-lg border transition-all"
                      style={{ fontFamily: MONO, fontSize: 10, color: TEXT3, borderColor: BORDER, background: BG2, lineHeight: 1.4 }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT + '45'; e.currentTarget.style.color = TEXT2; e.currentTarget.style.background = ACCENT + '08'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TEXT3; e.currentTarget.style.background = BG2; }}>
                      <ChevronRight size={9} style={{ color: ACCENT, display: 'inline', marginRight: 4 }} />{s}
                    </button>
                  ))}
                </motion.div>
              )}
              {uiMessages.map(msg => {
                const isUser = msg.role === 'user';
                const text   = msgText(msg).replace(/```[\s\S]*?```/g, '').replace(/Current component[\s\S]*$/i, '').trim();
                const hasCode = extractTsx(msgText(msg)) !== null;
                if (!text && !hasCode) return null;
                return (
                  <div key={msg.id} className={`flex gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
                    <div className="flex-1 min-w-0">
                      {text && (
                        <p style={{ fontFamily: MONO, fontSize: 11, color: isUser ? TEXT : TEXT2,
                          background: isUser ? BLUE + '15' : BG2, border: `1px solid ${isUser ? BLUE + '30' : BORDER}`,
                          borderRadius: 8, padding: '6px 10px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {text}
                        </p>
                      )}
                      {hasCode && !isUser && (
                        <div className="flex items-center gap-1 mt-1" style={{ fontFamily: MONO, fontSize: 9, color: ACCENT }}>
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
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="flex-shrink-0 p-2.5 border-t" style={{ borderColor: BORDER, background: BG2 }}>
              <div className="flex items-end gap-1.5 rounded-xl border px-2.5 py-2 transition-colors"
                style={{ background: BG, borderColor: BORDER }}
                onFocusCapture={e => (e.currentTarget.style.borderColor = ACCENT + '50')}
                onBlurCapture={e => (e.currentTarget.style.borderColor = BORDER)}>
                <span style={{ fontFamily: MONO, fontSize: 13, color: ACCENT, flexShrink: 0, paddingBottom: 1, userSelect: 'none' }}>›</span>
                <textarea ref={inputRef} value={input}
                  onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="describe what to build…" rows={1} disabled={isLoading}
                  className="flex-1 bg-transparent resize-none outline-none disabled:opacity-40"
                  style={{ fontFamily: MONO, fontSize: 11, color: TEXT, minHeight: 18, caretColor: ACCENT, lineHeight: 1.5 }}
                  onInput={e => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 80) + 'px'; }} />
                <button onClick={submit} disabled={!input.trim() || isLoading}
                  className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-lg transition-all disabled:opacity-30"
                  style={{ background: ACCENT + '18', border: `1px solid ${ACCENT}30`, color: ACCENT }}
                  onMouseEnter={e => { if (!e.currentTarget.disabled) { e.currentTarget.style.background = ACCENT + '30'; } }}
                  onMouseLeave={e => { e.currentTarget.style.background = ACCENT + '18'; }}>
                  {isLoading ? <Loader2 size={10} className="animate-spin" /> : <Send size={10} />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* IDE workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex-shrink-0 flex items-center justify-between px-3 h-10 border-b" style={{ background: BG2, borderColor: BORDER }}>
          <div className="flex items-center gap-2">
            <IconBtn icon={chatOpen ? PanelLeftClose : PanelLeftOpen} active={chatOpen}
              onClick={() => setChatOpen(v => !v)} title={chatOpen ? 'Hide panel' : 'Show panel'} />
            <div className="w-px h-4" style={{ background: BORDER }} />
            <div className="flex items-center gap-1" style={{ fontFamily: MONO, fontSize: 10, color: TEXT3 }}>
              <Globe size={9} /><span>spacze/builder</span>
              <ChevronRight size={8} />
              <span style={{ color: TEXT2 }}>{files[activeFile]?.name}</span>
            </div>
            {isLoading && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full"
                style={{ background: AMBER + '12', border: `1px solid ${AMBER}28`, fontFamily: MONO, fontSize: 10, color: AMBER }}>
                <Loader2 size={8} className="animate-spin" /><span>generating</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center rounded-lg border overflow-hidden" style={{ borderColor: BORDER }}>
              {(['code', 'preview'] as RightPane[]).map(p => (
                <button key={p} onClick={() => setPane(p)}
                  className="flex items-center gap-1.5 px-3 py-1.5 transition-colors"
                  style={{ fontFamily: MONO, fontSize: 10, background: pane === p ? BG3 : 'transparent', color: pane === p ? TEXT : TEXT3 }}>
                  {p === 'code' ? <Code2 size={10} /> : <Eye size={10} />}{p}
                </button>
              ))}
            </div>
            {pane === 'preview' && (
              <div className="flex items-center rounded-lg border overflow-hidden" style={{ borderColor: BORDER }}>
                {(Object.entries(PREVIEW_SIZES) as [PreviewSize, typeof PREVIEW_SIZES[PreviewSize]][]).map(([key, val]) => (
                  <button key={key} onClick={() => setPreviewSize(key)}
                    className="flex items-center px-2 py-1.5 transition-colors"
                    style={{ background: previewSize === key ? BG3 : 'transparent', color: previewSize === key ? TEXT : TEXT3 }}
                    title={val.label}>{val.icon}
                  </button>
                ))}
              </div>
            )}
            {pane === 'preview' && <IconBtn icon={RefreshCw} onClick={() => setRefreshKey(k => k + 1)} title="Refresh" />}
            <IconBtn icon={Download} onClick={handleDownload} title="Download" />
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
const TABS: { id: TopTab; label: string; sublabel: string; icon: React.ReactNode; badge?: string }[] = [
  { id: 'chat',    label: 'Agent Chat', sublabel: 'CRM · Outreach · Campaigns', icon: <MessageSquare size={15} />, badge: 'Live' },
  { id: 'builder', label: 'UI Builder', sublabel: 'Next.js · React · Tailwind',  icon: <Layers size={15} /> },
];

export default function AgentPanel() {
  const [tab, setTab] = useState<TopTab>('chat');
  return (
    <div className="flex flex-col h-[calc(100vh-140px)] overflow-hidden rounded-2xl border" style={{ background: BG, borderColor: BORDER }}>

      {/* Identity + tab header */}
      <div className="flex-shrink-0 border-b" style={{ background: BG2, borderColor: BORDER }}>
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg" style={{ background: ACCENT + '18', border: `1px solid ${ACCENT}30` }}>
              <Cpu size={13} style={{ color: ACCENT }} />
            </div>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 12, color: TEXT, fontWeight: 600 }}>spacze-agent</div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: TEXT3 }}>autonomous operator · v1.0</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: ACCENT + '12', border: `1px solid ${ACCENT}28` }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: ACCENT }} />
            <span style={{ fontFamily: MONO, fontSize: 10, color: ACCENT, fontWeight: 600, letterSpacing: '0.08em' }}>ONLINE</span>
          </div>
        </div>

        <div className="flex items-end gap-1 px-4 pb-0">
          {TABS.map(t => {
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="relative flex items-center gap-2.5 px-4 py-2.5 rounded-t-xl transition-all duration-200"
                style={{ background: active ? BG : 'transparent', border: `1px solid ${active ? BORDER : 'transparent'}`, borderBottom: active ? `1px solid ${BG}` : '1px solid transparent', marginBottom: active ? -1 : 0 }}>
                {active && (
                  <motion.div layoutId="tab-accent" className="absolute top-0 left-4 right-4 h-[2px] rounded-b-full"
                    style={{ background: ACCENT }} transition={{ type: 'spring', stiffness: 500, damping: 40 }} />
                )}
                <span style={{ color: active ? ACCENT : TEXT3, transition: 'color 0.15s' }}>{t.icon}</span>
                <div className="text-left">
                  <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: active ? 600 : 400, color: active ? TEXT : TEXT3, letterSpacing: '0.01em' }}>{t.label}</div>
                  <div style={{ fontFamily: MONO, fontSize: 9, color: active ? TEXT3 : TEXT3 + '80' }}>{t.sublabel}</div>
                </div>
                {t.badge && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full" style={{ background: ACCENT + '18', border: `1px solid ${ACCENT}30` }}>
                    <span className="w-1 h-1 rounded-full" style={{ background: ACCENT }} />
                    <span style={{ fontFamily: MONO, fontSize: 8, color: ACCENT, fontWeight: 700, letterSpacing: '0.1em' }}>{t.badge}</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }} className="h-full">
            {tab === 'chat'    && <ChatTab />}
            {tab === 'builder' && <BuilderTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}