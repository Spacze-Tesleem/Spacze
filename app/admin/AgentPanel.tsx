'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Bot, User, Loader2, RotateCcw, Copy, Check,
  Monitor, Smartphone, Tablet, FileCode2,
  RefreshCw, Download, MessageSquare,
  Layers, Command, Cpu, Zap, Activity,
  Wand2, ShieldCheck,
  ArrowUpRight, Search, Settings,
  ChevronRight, ChevronDown,
  X, Code2, Circle, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

// ── Types ─────────────────────────────────────────────────────────────────────
type ViewMode = 'ops' | 'arch';
type DeviceMode = 'desktop' | 'mobile';
type SourceView = 'preview' | 'code';

interface MsgPart {
  type: string;
  text?: string;
  toolName?: string;
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

// ── Helpers ───────────────────────────────────────────────────────────────────
function msgText(msg: UIMessage): string {
  if (msg.parts) {
    const t = msg.parts.filter(p => p.type === 'text').map(p => p.text ?? '').join('');
    if (t) return t;
  }
  return msg.content ?? '';
}

function extractTsx(text: string): string | null {
  const m = text.match(/```(?:tsx|jsx|typescript|javascript)\n([\s\S]*?)```/i);
  if (m) return m[1].trim();
  return null;
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
<script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<style>*{box-sizing:border-box}body{margin:0;background:#030303;color:white;font-family:sans-serif}</style>
</head><body><div id="root"></div>
<script type="text/babel">${noMotion}
const root=ReactDOM.createRoot(document.getElementById('root'));root.render(React.createElement(Page));
</script></body></html>`;
}

// ── CopyBtn ───────────────────────────────────────────────────────────────────
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="p-1.5 rounded-lg transition-colors text-zinc-500 hover:text-white"
      title="Copy"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}

// ── ToolCallRow ───────────────────────────────────────────────────────────────
function ToolCallRow({ part }: { part: MsgPart }) {
  const [open, setOpen] = useState(false);
  const isRunning = part.state === 'partial-call' || (part.state !== 'result' && part.result === undefined);
  const hasResult = part.result !== undefined;
  const argsStr   = part.args   ? JSON.stringify(part.args,   null, 2) : '';
  const resultStr = hasResult   ? JSON.stringify(part.result, null, 2) : '';
  return (
    <div className="mt-3 border-l-2 pl-3" style={{ borderColor: isRunning ? '#f59e0b40' : '#10b98140' }}>
      <button onClick={() => setOpen(v => !v)} className="flex items-center gap-2 text-left w-full">
        {isRunning
          ? <Loader2 size={10} className="animate-spin text-amber-500" />
          : hasResult ? <CheckCircle2 size={10} className="text-emerald-500" /> : <Circle size={10} className="text-zinc-600" />}
        <span className="font-mono text-[11px] text-amber-400">{part.toolName ?? 'tool'}</span>
        {part.args && <span className="font-mono text-[10px] text-zinc-600">({Object.keys(part.args).join(', ')})</span>}
        <span className="flex-1" />
        {(argsStr || resultStr) && (open ? <ChevronDown size={10} className="text-zinc-600" /> : <ChevronRight size={10} className="text-zinc-600" />)}
      </button>
      <AnimatePresence>
        {open && (argsStr || resultStr) && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
            {argsStr && <pre className="mt-2 p-2 rounded-lg bg-zinc-900 text-[10px] text-zinc-400 font-mono overflow-x-auto max-h-40">{argsStr}</pre>}
            {resultStr && <pre className="mt-1 p-2 rounded-lg bg-zinc-900 text-[10px] text-emerald-400/80 font-mono overflow-x-auto max-h-48">{resultStr.slice(0, 2000)}{resultStr.length > 2000 ? '\n…truncated' : ''}</pre>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── STARTER CODE ──────────────────────────────────────────────────────────────
const STARTER_CODE = `'use client';
import { motion } from 'framer-motion';

export default function Page() {
  return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative p-[1px] rounded-[40px] bg-gradient-to-br from-indigo-500/20 via-white/5 to-sky-500/20 shadow-2xl"
      >
        <div className="bg-zinc-950/90 backdrop-blur-3xl rounded-[39px] px-12 py-16 text-center">
          <span className="text-indigo-400 font-mono text-[10px] tracking-[0.5em] uppercase mb-6 block">Solaris Intelligence</span>
          <h1 className="text-6xl font-serif text-white mb-6 italic tracking-tight">
            Elegance in <span className="font-sans font-bold not-italic">Logic.</span>
          </h1>
          <p className="text-zinc-500 max-w-md mx-auto mb-10 text-lg leading-relaxed font-light">
            The workspace is synchronized. Every interaction is measured, every pixel is intentional.
          </p>
          <button className="px-8 py-3 rounded-full bg-white text-black font-semibold hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all">
            Initiate Project
          </button>
        </div>
      </motion.div>
    </div>
  );
}`;

const CHAT_SUGGESTIONS = [
  "Show me all leads that haven't been contacted yet",
  'Analyse the website for my top 3 pending leads',
  'Generate a WhatsApp message for a fashion brand lead',
  'Create a campaign targeting logistics leads on email',
  'What are the stats for my active campaigns?',
  'Write outreach copy for a real estate lead on LinkedIn',
];

const BUILDER_SUGGESTIONS = [
  'Build a SaaS landing page with hero, features, and pricing',
  'Create a dark portfolio with animated project cards',
  'Design a pricing section with 3 tiers and a toggle',
  'Build a testimonials section with glassmorphism cards',
];





// ── SolarisCard ───────────────────────────────────────────────────────────────
function SolarisCard({ children, className = '', active = false }: {
  children: React.ReactNode; className?: string; active?: boolean;
}) {
  return (
    <motion.div layout
      className={`relative rounded-[2rem] border transition-all duration-500 ${
        active ? 'bg-zinc-900/50 border-white/20 shadow-2xl' : 'bg-zinc-900/20 border-white/5 hover:border-white/10'
      } ${className}`}>
      {children}
    </motion.div>
  );
}

// ── OperationsView ────────────────────────────────────────────────────────────
function OperationsView({ messages, status, inputRef, input, setInput }: {
  messages: UIMessage[]; status: string;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  input: string; setInput: (v: string) => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const isEmpty   = messages.length === 0;
  const isLoading = status === 'streaming' || status === 'submitted';

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);

  return (
    <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full pt-8 min-h-0">
      <div className="flex items-center justify-between mb-10 flex-shrink-0">
        <div className="space-y-1">
          <h2 className="text-4xl font-serif italic text-white tracking-tight">Operations</h2>
          <p className="text-zinc-500 font-mono text-[10px] tracking-[0.2em] uppercase">CRM · Outreach · Campaigns · Analytics</p>
        </div>
        <SolarisCard className="px-4 py-2 flex items-center gap-3">
          <Activity size={13} className="text-emerald-400" />
          <span className="text-[11px] font-mono font-bold text-zinc-300">AGENT_ONLINE</span>
        </SolarisCard>
      </div>

      {isEmpty && (
        <div className="flex-1 flex flex-col items-center justify-center gap-8 pb-32">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto">
              <Zap size={28} className="text-indigo-400" />
            </div>
            <p className="text-white text-xl font-light">How can I assist today?</p>
            <p className="text-zinc-600 text-sm font-mono">Command the operations agent below</p>
          </div>
          <div className="grid grid-cols-2 gap-3 w-full max-w-2xl">
            {CHAT_SUGGESTIONS.map(s => (
              <button key={s} onClick={() => { setInput(s); inputRef.current?.focus(); }}
                className="text-left px-5 py-4 rounded-2xl border border-white/5 bg-zinc-900/30 hover:border-white/15 hover:bg-zinc-900/50 transition-all group">
                <div className="flex items-start gap-3">
                  <ChevronRight size={12} className="text-indigo-400 mt-0.5 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  <span className="text-[12px] text-zinc-400 group-hover:text-zinc-200 transition-colors leading-relaxed">{s}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {!isEmpty && (
        <div className="flex-1 overflow-y-auto space-y-6 pr-2 pb-32 min-h-0">
          {messages.map(m => {
            const text = msgText(m).replace(/```[\s\S]*?```/g, '').replace(/Current component[\s\S]*$/i, '').trim();
            const toolParts = (m.parts ?? []).filter(p =>
              p.type === 'tool-invocation' || p.type === 'tool-call' || p.type === 'tool-result'
            );
            const isUser = m.role === 'user';
            return (
              <motion.div key={m.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                className={`flex gap-5 ${isUser ? 'flex-row-reverse' : ''}`}>
                <div className={`w-11 h-11 rounded-2xl flex-shrink-0 flex items-center justify-center border ${
                  isUser ? 'bg-white border-white text-black shadow-lg' : 'bg-zinc-900 border-white/10 text-indigo-400'
                }`}>
                  {isUser ? <User size={18} /> : <Bot size={18} />}
                </div>
                <SolarisCard active={!isUser} className={`max-w-[75%] px-6 py-5 ${isUser ? 'rounded-tr-none' : 'rounded-tl-none'}`}>
                  {text && <p className="text-[14px] leading-relaxed text-zinc-300 font-light whitespace-pre-wrap">{text}</p>}
                  {toolParts.map((p, i) => <ToolCallRow key={i} part={p} />)}
                  {!isUser && (text || toolParts.length > 0) && (
                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                      <div className="flex gap-4">
                        <span className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-600"><Activity size={11} />PROCESS_COMPLETE</span>
                        <span className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-600"><ShieldCheck size={11} />VERIFIED</span>
                      </div>
                      <CopyBtn text={text} />
                    </div>
                  )}
                </SolarisCard>
              </motion.div>
            );
          })}
          {isLoading && (messages.length === 0 || messages[messages.length - 1]?.role === 'user') && (
            <div className="flex items-center gap-4 pl-16 py-4">
              <Loader2 size={15} className="animate-spin text-indigo-500" />
              <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest">Synthesizing response…</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}

// ── ArchitectView ─────────────────────────────────────────────────────────────
function ArchitectView({ code, setCode, messages, status, view, setView, device, setDevice, inputRef, input, setInput }: {
  code: string; setCode: (v: string) => void;
  messages: UIMessage[]; status: string;
  view: SourceView; setView: (v: SourceView) => void;
  device: DeviceMode; setDevice: (v: DeviceMode) => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  input: string; setInput: (v: string) => void;
}) {
  const iframeRef  = useRef<HTMLIFrameElement>(null);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const isLoading  = status === 'streaming' || status === 'submitted';
  const isEmpty    = messages.length === 0;

  const previewDoc = useMemo(() => buildPreviewDoc(code), [code, refreshKey]); // eslint-disable-line

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const d = iframe.contentDocument || iframe.contentWindow?.document;
    if (!d) return;
    d.open(); d.write(previewDoc); d.close();
  }, [previewDoc]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'page.tsx'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-full gap-6 pt-4 relative min-h-0">

      {/* Floating source editor */}
      <AnimatePresence>
        {view === 'code' && (
          <motion.div
            initial={{ x: -440, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -440, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute left-0 top-0 bottom-28 w-[480px] z-50 flex flex-col"
          >
            <div className="h-full bg-zinc-950/90 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <FileCode2 size={14} className="text-indigo-400" />
                  <span className="text-xs font-mono text-indigo-400 tracking-widest uppercase">Source Manifest</span>
                </div>
                <div className="flex items-center gap-2">
                  <CopyBtn text={code} />
                  <button onClick={() => setView('preview')} className="p-1.5 rounded-lg text-zinc-500 hover:text-white transition-colors"><X size={14} /></button>
                </div>
              </div>
              <textarea value={code} onChange={e => setCode(e.target.value)}
                className="flex-1 p-6 bg-transparent outline-none border-none font-mono text-[12px] text-zinc-300 resize-none leading-relaxed"
                spellCheck={false} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview stage */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 relative flex items-center justify-center overflow-hidden rounded-2xl"
          style={{ background: 'radial-gradient(#1a1a1a 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
          <div className="absolute inset-0 bg-indigo-500/5 blur-[120px] pointer-events-none" />
          <div className="relative transition-all duration-700 ease-in-out h-full w-full"
            style={{ maxWidth: device === 'mobile' ? '390px' : '100%', transform: view === 'code' ? 'translateX(200px) scale(0.88)' : 'scale(1)' }}>
            {/* Device bar */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-zinc-900/70 backdrop-blur-xl px-5 py-2 rounded-full border border-white/10 z-20 shadow-xl">
              <button onClick={() => setDevice('desktop')} className={`transition-colors ${device === 'desktop' ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}><Monitor size={14} /></button>
              <button onClick={() => setDevice('mobile')} className={`transition-colors ${device === 'mobile' ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}><Smartphone size={14} /></button>
              <div className="w-px h-3 bg-white/10" />
              <button onClick={() => setRefreshKey(k => k + 1)} className="text-zinc-600 hover:text-zinc-400 transition-colors"><RefreshCw size={12} /></button>
              <button onClick={handleDownload} className="text-zinc-600 hover:text-zinc-400 transition-colors"><Download size={12} /></button>
              <div className="w-px h-3 bg-white/10" />
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Live Preview</span>
            </div>
            <div className={`w-full h-full bg-black border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden ${device === 'mobile' ? 'rounded-[3rem]' : 'rounded-2xl'}`}>
              <iframe ref={iframeRef} title="preview" sandbox="allow-scripts allow-same-origin" className="w-full h-full border-0 block" />
            </div>
          </div>
        </div>
      </div>

      {/* Builder chat sidebar */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-3 pb-28 min-h-0">
        <div className="flex items-center gap-2 px-1">
          <Wand2 size={13} className="text-indigo-400" />
          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest">Builder Chat</span>
        </div>
        <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
          {isEmpty && (
            <div className="space-y-2 pt-1">
              {BUILDER_SUGGESTIONS.map(s => (
                <button key={s} onClick={() => { setInput(s); inputRef.current?.focus(); }}
                  className="w-full text-left px-4 py-3 rounded-2xl border border-white/5 bg-zinc-900/20 hover:border-white/15 hover:bg-zinc-900/40 transition-all group">
                  <div className="flex items-start gap-2">
                    <ChevronRight size={10} className="text-indigo-400 mt-0.5 flex-shrink-0" />
                    <span className="text-[11px] text-zinc-500 group-hover:text-zinc-300 transition-colors leading-relaxed">{s}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
          {messages.map(m => {
            const isUser = m.role === 'user';
            const text = msgText(m).replace(/```[\s\S]*?```/g, '').replace(/Current component[\s\S]*$/i, '').trim();
            const hasCode = extractTsx(msgText(m)) !== null;
            if (!text && !hasCode) return null;
            return (
              <div key={m.id} className={`px-4 py-3 rounded-2xl text-[12px] leading-relaxed ${
                isUser ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' : 'bg-zinc-900/40 text-zinc-400 border border-white/5'
              }`}>
                {text}
                {hasCode && !isUser && (
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] font-mono text-emerald-500">
                    <Code2 size={9} /> applied to canvas
                  </div>
                )}
              </div>
            );
          })}
          {isLoading && (messages.length === 0 || messages[messages.length - 1]?.role === 'user') && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-amber-500/20 bg-amber-500/5">
              <Loader2 size={10} className="animate-spin text-amber-500" />
              <span className="text-[11px] font-mono text-amber-500/70">generating…</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </motion.div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function AgentPanel() {
  const [mode, setMode]     = useState<ViewMode>('ops');
  const [input, setInput]   = useState('');
  const [code, setCode]     = useState(STARTER_CODE);
  const [device, setDevice] = useState<DeviceMode>('desktop');
  const [view, setView]     = useState<SourceView>('preview');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: '/api/agent', credentials: 'include' }),
  });

  const uiMessages = messages as unknown as UIMessage[];
  const isLoading  = status === 'streaming' || status === 'submitted';

  useEffect(() => {
    const last = [...uiMessages].reverse().find(m => m.role === 'assistant');
    if (!last) return;
    const extracted = extractTsx(msgText(last));
    if (extracted) {
      setCode(extracted);
      if (mode === 'ops') setMode('arch');
    }
  }, [uiMessages]); // eslint-disable-line

  const submit = useCallback(() => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    sendMessage({
      text: mode === 'arch'
        ? `${text}\n\nCurrent component:\n\`\`\`tsx\n${code.slice(0, 4000)}\n\`\`\``
        : text,
    });
  }, [input, isLoading, mode, code, sendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  }, [submit]);

  return (
    <div className="h-[calc(100vh-140px)] w-full bg-[#030303] text-zinc-400 overflow-hidden flex flex-col rounded-2xl border border-white/5 relative"
      style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* Cinematic background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#1e1b4b,transparent)] opacity-40 pointer-events-none rounded-2xl" />

      {/* Top navigation rail */}
      <header className="relative z-50 flex items-center justify-between px-8 py-5 flex-shrink-0 border-b border-white/5">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.25)]">
              <Zap size={18} className="text-black fill-black" />
            </div>
            <span className="text-white font-serif italic text-xl tracking-tight">Solaris</span>
          </div>
          <nav className="flex items-center gap-1 bg-zinc-900/60 p-1 rounded-full border border-white/5 backdrop-blur-md">
            {([
              { id: 'ops'  as ViewMode, label: 'Operations', icon: <MessageSquare size={13} /> },
              { id: 'arch' as ViewMode, label: 'Architect',  icon: <Layers size={13} /> },
            ]).map(t => (
              <button key={t.id} onClick={() => setMode(t.id)}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all ${
                  mode === t.id ? 'bg-white text-black shadow-sm' : 'text-zinc-500 hover:text-white'
                }`}>
                {t.icon}{t.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-5">
          <div className="text-right">
            <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Global Status</div>
            <div className={`text-xs font-bold tracking-tight font-mono ${isLoading ? 'text-amber-400' : 'text-emerald-500'}`}>
              {isLoading ? 'PROCESSING…' : 'SYSTEM_SYNCHRONIZED'}
            </div>
          </div>
          {!isLoading && uiMessages.length > 0 && (
            <button onClick={() => setMessages([])}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 text-zinc-500 hover:text-white hover:border-white/20 transition-all text-[11px] font-mono">
              <RotateCcw size={11} /> clear
            </button>
          )}
          <button className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all text-zinc-500 hover:text-white">
            <Settings size={16} />
          </button>
        </div>
      </header>

      {/* Main canvas */}
      <main className="flex-1 relative min-h-0 z-10 px-8">
        <AnimatePresence mode="wait">
          {mode === 'ops' ? (
            <motion.div key="ops" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="h-full flex flex-col">
              <OperationsView messages={uiMessages} status={status} inputRef={inputRef} input={input} setInput={setInput} />
            </motion.div>
          ) : (
            <motion.div key="arch" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="h-full flex flex-col">
              <ArchitectView
                code={code} setCode={setCode} messages={uiMessages} status={status}
                view={view} setView={setView} device={device} setDevice={setDevice}
                inputRef={inputRef} input={input} setInput={setInput}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating command bar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-3xl px-8 z-[100]">
        <div className="relative group">
          <div className="absolute -inset-3 bg-indigo-500/8 blur-3xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700 pointer-events-none" />
          <SolarisCard className="p-2 bg-zinc-950/85 backdrop-blur-3xl border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.6)]">
            <div className="flex items-end gap-3 px-3 py-1">
              <div className="pb-3 text-indigo-400 flex-shrink-0">
                {mode === 'ops' ? <Search size={18} /> : <Wand2 size={18} />}
              </div>
              <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={mode === 'ops' ? 'Command the operations agent…' : 'Direct the architect…'}
                rows={1} disabled={isLoading}
                className="flex-1 bg-transparent border-none outline-none py-3 text-sm text-white placeholder:text-zinc-600 font-light resize-none disabled:opacity-50"
                style={{ minHeight: 20, lineHeight: 1.6 }}
                onInput={e => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 120) + 'px'; }} />
              <div className="flex items-center gap-2 pb-2 flex-shrink-0">
                {mode === 'arch' && (
                  <button type="button" onClick={() => setView(view === 'code' ? 'preview' : 'code')}
                    className={`p-2.5 rounded-xl transition-all ${view === 'code' ? 'text-indigo-400 bg-indigo-500/10' : 'text-zinc-500 hover:text-white'}`}>
                    <Code2 size={18} />
                  </button>
                )}
                <button onClick={submit} disabled={!input.trim() || isLoading}
                  className="w-11 h-11 rounded-[1.2rem] bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-40 disabled:scale-100">
                  {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </div>
            </div>
          </SolarisCard>
          <div className="mt-3 flex justify-center gap-6 text-[9px] font-mono text-zinc-700 uppercase tracking-[0.2em]">
            <span className="flex items-center gap-1.5"><Command size={9} />K Search</span>
            <span className="flex items-center gap-1.5"><Command size={9} />J Architect</span>
            {mode === 'arch' && <span className="flex items-center gap-1.5"><Command size={9} />L Source</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
