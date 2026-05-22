'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Bot, User, Loader2, Sparkles, RotateCcw, Copy, Check,
  Code2, Eye, Monitor, Smartphone, Tablet, FileCode2,
  ChevronRight, Zap, Globe, RefreshCw, Download,
  MessageSquare, Wrench, PanelLeftClose, PanelLeftOpen, X,
} from 'lucide-react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

// ── Types ─────────────────────────────────────────────────────────────────────
interface MsgPart { type: string; text?: string; }
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

const ACCENT = '#00D67D';


const PREVIEW_SIZES: Record<PreviewSize, { w: string; icon: React.ReactNode; label: string }> = {
  desktop: { w: '100%',  icon: <Monitor size={12} />,    label: 'Desktop' },
  tablet:  { w: '768px', icon: <Tablet size={12} />,     label: 'Tablet'  },
  mobile:  { w: '390px', icon: <Smartphone size={12} />, label: 'Mobile'  },
};

const LANG_COLORS: Record<string, string> = {
  tsx: '#38bdf8', css: '#a78bfa', js: '#f59e0b', ts: '#38bdf8',
};

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

const STARTER = `'use client';

import { motion } from 'framer-motion';

export default function Page() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-8">
      <div className="text-center max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="inline-block text-xs font-mono uppercase tracking-widest text-[#00D67D] mb-4 px-3 py-1 rounded-full border border-[#00D67D]/30 bg-[#00D67D]/10">
            Spacze Builder
          </span>
          <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-[#00D67D] via-sky-400 to-purple-400 bg-clip-text text-transparent">
            Build Something Great
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed mb-8">
            Describe what you want to build. The AI writes Next.js + Tailwind code and renders it live.
          </p>
          <button className="px-8 py-3 rounded-full bg-[#00D67D] text-black font-bold hover:opacity-90 transition-opacity">
            Get Started
          </button>
        </motion.div>
      </div>
    </main>
  );
}`;

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
const root=ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(Page));
</script></body></html>`;
}

// ── CopyBtn ───────────────────────────────────────────────────────────────────
function CopyBtn({ text, size = 11 }: { text: string; size?: number }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="p-1.5 rounded-lg transition-all flex-shrink-0"
      style={{ color: copied ? ACCENT : '#4a4a6a', background: copied ? `${ACCENT}15` : 'transparent' }} title="Copy">
      {copied ? <Check size={size} /> : <Copy size={size} />}
    </button>
  );
}

// ── ChatMessage (shared) ──────────────────────────────────────────────────────
function ChatMessage({ msg, isStreaming }: { msg: UIMessage; isStreaming?: boolean }) {
  const isUser = msg.role === 'user';
  const raw = msgText(msg);
  const display = raw.replace(/```[\s\S]*?```/g, '').replace(/Current component[\s\S]*$/i, '').trim();
  const hasCode = extractTsx(raw) !== null;
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}
      className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border"
        style={isUser ? { background: '#1e3a5f', borderColor: '#2a4a7f' } : { background: `${ACCENT}18`, borderColor: `${ACCENT}30` }}>
        {isUser ? <User size={11} style={{ color: '#60a5fa' }} /> : <Bot size={11} style={{ color: ACCENT }} />}
      </div>
      <div className={`flex flex-col gap-1.5 max-w-[88%] ${isUser ? 'items-end' : 'items-start'}`}>
        {(display || isStreaming) && (
          <div className="relative group rounded-xl px-3 py-2.5 text-[12px] leading-relaxed"
            style={isUser
              ? { background: '#1a2a4a', border: '1px solid #2a3a6a', color: '#c8d8f0' }
              : { background: '#111120', border: '1px solid #1e1e30', color: '#a8a8c8' }}>
            <span style={{ whiteSpace: 'pre-wrap' }}>{display || null}</span>
            {isStreaming && <span className="inline-block w-1.5 h-3 ml-0.5 rounded-sm animate-pulse align-middle" style={{ background: ACCENT }} />}
            {!isUser && display && (
              <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <CopyBtn text={display} />
              </div>
            )}
          </div>
        )}
        {hasCode && !isUser && (
          <div className="flex items-center gap-1.5 text-[10px] font-mono px-2 py-1 rounded-lg border"
            style={{ color: ACCENT, background: `${ACCENT}10`, borderColor: `${ACCENT}25` }}>
            <Code2 size={9} /> Applied to editor
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── CHAT TAB ──────────────────────────────────────────────────────────────────
function ChatTab() {
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState('');

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: '/api/agent', credentials: 'include' }),
  });

  const isLoading  = status === 'streaming' || status === 'submitted';
  const uiMessages = messages as unknown as UIMessage[];
  const isEmpty    = uiMessages.length === 0;

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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 h-10 border-b"
        style={{ background: '#0a0a18', borderColor: '#16162a' }}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md flex items-center justify-center border"
            style={{ background: `${ACCENT}15`, borderColor: `${ACCENT}30` }}>
            <Sparkles size={10} style={{ color: ACCENT }} />
          </div>
          <span className="text-[11px] font-bold" style={{ color: '#c0c0d8' }}>Spacze Agent</span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border"
            style={{ color: '#3a3a5a', borderColor: '#1e1e2e', background: '#0a0a14' }}>
            CRM · Outreach · Campaigns
          </span>
        </div>
        {!isEmpty && (
          <button onClick={() => setMessages([])}
            className="p-1.5 rounded-lg transition-colors" style={{ color: '#2a2a4a' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#6b6b8a')}
            onMouseLeave={e => (e.currentTarget.style.color = '#2a2a4a')}
            title="Clear conversation">
            <RotateCcw size={11} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ background: '#07070f' }}>
        {isEmpty && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg mx-auto pt-6 space-y-5">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 border"
                style={{ background: `${ACCENT}10`, borderColor: `${ACCENT}20` }}>
                <Bot size={24} style={{ color: ACCENT }} />
              </div>
              <p className="text-[14px] font-bold mb-1.5" style={{ color: '#c0c0d8' }}>Spacze Agent</p>
              <p className="text-[11px] leading-relaxed" style={{ color: '#3a3a5a' }}>
                Your autonomous outreach operator. Fetch leads, analyse sites, generate copy, send messages, and run campaigns — all from here.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {CHAT_SUGGESTIONS.map(s => (
                <button key={s} onClick={() => { setInput(s); inputRef.current?.focus(); }}
                  className="w-full text-left px-3 py-2 rounded-xl border text-[11px] transition-all leading-snug"
                  style={{ color: '#3a3a5a', borderColor: '#16162a', background: '#0a0a18' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = `${ACCENT}30`; e.currentTarget.style.color = '#7a7a9a'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#16162a'; e.currentTarget.style.color = '#3a3a5a'; }}>
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {uiMessages.map(msg => <ChatMessage key={msg.id} msg={msg} />)}

        {isLoading && (uiMessages.length === 0 || uiMessages[uiMessages.length - 1]?.role === 'user') && (
          <ChatMessage msg={{ id: '__stream__', role: 'assistant', content: '' }} isStreaming />
        )}

        {error && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl border text-[11px] text-red-400 max-w-lg mx-auto"
            style={{ background: '#1a0808', borderColor: '#3a1010' }}>
            <Zap size={11} className="flex-shrink-0 mt-0.5" />{error.message}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-4 border-t" style={{ borderColor: '#16162a', background: '#0a0a18' }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-end gap-2 rounded-xl border p-2.5 transition-all"
            style={{ background: '#07070f', borderColor: '#1e1e30' }}>
            <textarea ref={inputRef} value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask the agent anything — leads, outreach, campaigns…"
              rows={1} disabled={isLoading}
              className="flex-1 bg-transparent resize-none outline-none text-[12px] leading-relaxed max-h-28 overflow-y-auto disabled:opacity-40"
              style={{ color: '#c0c0d8', minHeight: '20px', fontFamily: 'inherit' }}
              onInput={e => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 112) + 'px'; }} />
            <button onClick={submit} disabled={!input.trim() || isLoading}
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30"
              style={{ background: ACCENT }}>
              {isLoading ? <Loader2 size={12} className="animate-spin text-black" /> : <Send size={11} className="text-black" />}
            </button>
          </div>
          <p className="text-[9px] font-mono text-center mt-2" style={{ color: '#1e1e30' }}>
            Enter to send · Shift+Enter for new line
          </p>
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
      className="flex items-center gap-1.5 px-4 h-full border-r text-[11px] font-mono whitespace-nowrap transition-all flex-shrink-0"
      style={{ borderColor: '#1e1e2e', background: active ? '#0f0f1a' : 'transparent',
        color: active ? '#d0d0e8' : '#3a3a5a',
        borderBottom: active ? `2px solid ${color}` : '2px solid transparent' }}>
      <FileCode2 size={10} style={{ color }} />{file.name}
    </button>
  );
}

function CodePanel({ files, activeFile, onFileChange, onContentChange }: {
  files: CodeFile[]; activeFile: number;
  onFileChange: (i: number) => void;
  onContentChange: (i: number, val: string) => void;
}) {
  const file  = files[activeFile];
  const lines = file.content.split('\n');
  return (
    <div className="flex flex-col h-full" style={{ background: '#0a0a14' }}>
      <div className="flex items-center h-9 border-b flex-shrink-0 overflow-x-auto"
        style={{ background: '#07070f', borderColor: '#1a1a2e' }}>
        {files.map((f, i) => <FileTab key={f.name} file={f} active={activeFile === i} onClick={() => onFileChange(i)} />)}
        <div className="flex-1" />
        <div className="px-3 flex-shrink-0"><CopyBtn text={file.content} size={10} /></div>
      </div>
      <div className="flex flex-1 overflow-hidden"
        style={{ fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: 12, lineHeight: '20px' }}>
        <div className="select-none text-right pt-3 pb-3 pr-3 overflow-hidden flex-shrink-0"
          style={{ width: 44, color: '#2a2a4a', background: '#07070f', borderRight: '1px solid #1a1a2e' }}>
          {lines.map((_, i) => <div key={i} style={{ height: 20, lineHeight: '20px' }}>{i + 1}</div>)}
        </div>
        <textarea value={file.content} onChange={e => onContentChange(activeFile, e.target.value)}
          spellCheck={false} className="flex-1 resize-none outline-none p-3 overflow-auto"
          style={{ background: '#0a0a14', color: '#c8c8e8', caretColor: ACCENT, tabSize: 2 }} />
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
        style={{ width: w, minHeight: '100%', borderColor: '#1e1e2e', flexShrink: 0 }}>
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
    { name: 'page.tsx',     lang: 'tsx', content: STARTER },
    { name: 'globals.css',  lang: 'css', content: `/* Add custom CSS here */\n@tailwind base;\n@tailwind components;\n@tailwind utilities;\n` },
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
    <div className="flex h-full overflow-hidden">

      {/* Chat sidebar */}
      <AnimatePresence initial={false}>
        {chatOpen && (
          <motion.div key="chat"
            initial={{ width: 0, opacity: 0 }} animate={{ width: 300, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="flex-shrink-0 flex flex-col border-r overflow-hidden" style={{ borderColor: '#16162a' }}>

            {/* Sidebar header */}
            <div className="flex-shrink-0 flex items-center justify-between px-3 h-10 border-b"
              style={{ background: '#0a0a18', borderColor: '#16162a' }}>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md flex items-center justify-center border"
                  style={{ background: `${ACCENT}15`, borderColor: `${ACCENT}30` }}>
                  <Sparkles size={10} style={{ color: ACCENT }} />
                </div>
                <span className="text-[11px] font-bold" style={{ color: '#c0c0d8' }}>AI Builder</span>
              </div>
              <div className="flex items-center gap-1">
                {!isEmpty && (
                  <button onClick={() => { setMessages([]); setFiles(prev => prev.map((f, i) => i === 0 ? { ...f, content: STARTER } : f)); setRefreshKey(k => k + 1); }}
                    className="p-1.5 rounded-lg transition-colors" style={{ color: '#2a2a4a' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#6b6b8a')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#2a2a4a')} title="Reset">
                    <RotateCcw size={11} />
                  </button>
                )}
                <button onClick={() => setChatOpen(false)}
                  className="p-1.5 rounded-lg transition-colors" style={{ color: '#2a2a4a' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#6b6b8a')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#2a2a4a')}>
                  <X size={11} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ background: '#07070f' }}>
              {isEmpty && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 pt-1">
                  <div className="text-center px-2">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2.5 border"
                      style={{ background: `${ACCENT}10`, borderColor: `${ACCENT}20` }}>
                      <Code2 size={18} style={{ color: ACCENT }} />
                    </div>
                    <p className="text-[12px] font-bold mb-1" style={{ color: '#c0c0d8' }}>Website Builder</p>
                    <p className="text-[10px] leading-relaxed" style={{ color: '#3a3a5a' }}>
                      Describe what to build. AI writes Next.js + Tailwind and renders it live.
                    </p>
                  </div>
                  <div className="space-y-1">
                    {BUILDER_SUGGESTIONS.map(s => (
                      <button key={s} onClick={() => { setInput(s); inputRef.current?.focus(); }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg border text-[10px] font-mono transition-all leading-snug"
                        style={{ color: '#3a3a5a', borderColor: '#16162a', background: '#0a0a18' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = `${ACCENT}30`; e.currentTarget.style.color = '#7a7a9a'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#16162a'; e.currentTarget.style.color = '#3a3a5a'; }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
              {uiMessages.map(msg => <ChatMessage key={msg.id} msg={msg} />)}
              {isLoading && (uiMessages.length === 0 || uiMessages[uiMessages.length - 1]?.role === 'user') && (
                <ChatMessage msg={{ id: '__stream__', role: 'assistant', content: '' }} isStreaming />
              )}
              {error && (
                <div className="flex items-start gap-2 px-2.5 py-2 rounded-lg border text-[10px] text-red-400"
                  style={{ background: '#1a0808', borderColor: '#3a1010' }}>
                  <Zap size={10} className="flex-shrink-0 mt-0.5" />{error.message}
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="flex-shrink-0 p-2.5 border-t" style={{ borderColor: '#16162a', background: '#0a0a18' }}>
              <div className="flex items-end gap-1.5 rounded-xl border p-2 transition-all"
                style={{ background: '#07070f', borderColor: '#1e1e30' }}>
                <textarea ref={inputRef} value={input}
                  onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="Describe what to build…" rows={1} disabled={isLoading}
                  className="flex-1 bg-transparent resize-none outline-none text-[11px] leading-relaxed max-h-24 overflow-y-auto disabled:opacity-40"
                  style={{ color: '#c0c0d8', minHeight: '18px', fontFamily: 'inherit' }}
                  onInput={e => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 96) + 'px'; }} />
                <button onClick={submit} disabled={!input.trim() || isLoading}
                  className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30"
                  style={{ background: ACCENT }}>
                  {isLoading ? <Loader2 size={11} className="animate-spin text-black" /> : <Send size={10} className="text-black" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* IDE workspace */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Toolbar */}
        <div className="flex-shrink-0 flex items-center justify-between px-3 h-10 border-b"
          style={{ background: '#0a0a18', borderColor: '#16162a' }}>

          <div className="flex items-center gap-2">
            <button onClick={() => setChatOpen(v => !v)}
              className="p-1.5 rounded-lg border transition-all"
              style={{ color: chatOpen ? ACCENT : '#3a3a5a', borderColor: chatOpen ? `${ACCENT}30` : '#1e1e2e', background: chatOpen ? `${ACCENT}10` : 'transparent' }}
              title={chatOpen ? 'Hide AI panel' : 'Show AI panel'}>
              {chatOpen ? <PanelLeftClose size={12} /> : <PanelLeftOpen size={12} />}
            </button>
            <div className="flex items-center gap-1 text-[10px] font-mono" style={{ color: '#2a2a4a' }}>
              <Globe size={9} /><span>spacze/</span>
              <span style={{ color: '#5a5a7a' }}>builder</span>
              <ChevronRight size={8} style={{ color: '#2a2a4a' }} />
              <span style={{ color: '#7a7a9a' }}>{files[activeFile]?.name}</span>
            </div>
            {isLoading && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg border ml-1"
                style={{ borderColor: `${ACCENT}25`, background: `${ACCENT}08` }}>
                <Loader2 size={8} className="animate-spin" style={{ color: ACCENT }} />
                <span className="text-[9px] font-mono" style={{ color: ACCENT }}>generating…</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Code / Preview toggle */}
            <div className="flex items-center rounded-xl border overflow-hidden" style={{ borderColor: '#1e1e2e' }}>
              {(['code', 'preview'] as RightPane[]).map(p => (
                <button key={p} onClick={() => setPane(p)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono transition-colors"
                  style={{ background: pane === p ? '#1a1a2e' : 'transparent', color: pane === p ? '#c0c0d8' : '#3a3a5a' }}>
                  {p === 'code' ? <Code2 size={10} /> : <Eye size={10} />}
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>

            {pane === 'preview' && (
              <div className="flex items-center rounded-xl border overflow-hidden" style={{ borderColor: '#1e1e2e' }}>
                {(Object.entries(PREVIEW_SIZES) as [PreviewSize, typeof PREVIEW_SIZES[PreviewSize]][]).map(([key, val]) => (
                  <button key={key} onClick={() => setPreviewSize(key)}
                    className="flex items-center px-2.5 py-1.5 transition-colors"
                    style={{ background: previewSize === key ? '#1a1a2e' : 'transparent', color: previewSize === key ? '#c0c0d8' : '#3a3a5a' }}
                    title={val.label}>{val.icon}
                  </button>
                ))}
              </div>
            )}

            {pane === 'preview' && (
              <button onClick={() => setRefreshKey(k => k + 1)}
                className="p-1.5 rounded-xl border transition-colors"
                style={{ color: '#3a3a5a', borderColor: '#1e1e2e' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#7a7a9a')}
                onMouseLeave={e => (e.currentTarget.style.color = '#3a3a5a')} title="Refresh preview">
                <RefreshCw size={11} />
              </button>
            )}

            <button onClick={handleDownload}
              className="p-1.5 rounded-xl border transition-colors"
              style={{ color: '#3a3a5a', borderColor: '#1e1e2e' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#7a7a9a')}
              onMouseLeave={e => (e.currentTarget.style.color = '#3a3a5a')} title="Download page.tsx">
              <Download size={11} />
            </button>
          </div>
        </div>

        {/* Workspace */}
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
    <div className="flex flex-col h-[calc(100vh-140px)] overflow-hidden rounded-2xl border"
      style={{ background: '#07070f', borderColor: '#16162a' }}>

      {/* Tab bar */}
      <div className="flex-shrink-0 flex items-center gap-1 px-3 border-b"
        style={{ background: '#0a0a18', borderColor: '#16162a', height: 44 }}>

        {([
          { id: 'chat' as TopTab,    label: 'Chat',    icon: <MessageSquare size={12} />, hint: 'CRM · Outreach · Campaigns' },
          { id: 'builder' as TopTab, label: 'Builder', icon: <Wrench size={12} />,        hint: 'Next.js · React · Tailwind'  },
        ]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono transition-all"
            style={{
              background:  tab === t.id ? `${ACCENT}15` : 'transparent',
              color:       tab === t.id ? ACCENT        : '#3a3a5a',
              border:      `1px solid ${tab === t.id ? `${ACCENT}30` : 'transparent'}`,
            }}>
            {t.icon}{t.label}
          </button>
        ))}

        <div className="flex-1" />
        <span className="text-[9px] font-mono" style={{ color: '#1e1e30' }}>
          {tab === 'chat' ? 'CRM · Outreach · Campaigns' : 'Next.js · React · Tailwind'}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {tab === 'chat'    && <ChatTab />}
        {tab === 'builder' && <BuilderTab />}
      </div>
    </div>
  );
}
