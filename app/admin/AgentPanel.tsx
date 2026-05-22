'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Bot, User, Loader2, Sparkles, RotateCcw,
  Copy, Check, Terminal, Play, Code2, Eye, EyeOff,
  ChevronRight, ChevronDown, Globe, Maximize2, Minimize2,
  FileCode2, Layers, Zap, RefreshCw, X, Plus,
  Monitor, Smartphone, Tablet, ExternalLink,
} from 'lucide-react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

// ── Types ─────────────────────────────────────────────────────────────────────
interface MsgPart {
  type: string;
  text?: string;
  toolCallId?: string;
  toolName?: string;
  args?: Record<string, unknown>;
  result?: unknown;
  state?: string;
}

interface UIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  parts?: MsgPart[];
}

interface CodeFile {
  name: string;
  lang: 'html' | 'css' | 'js';
  content: string;
}

type PreviewSize = 'desktop' | 'tablet' | 'mobile';

// ── Constants ─────────────────────────────────────────────────────────────────
const ACCENT = '#00D67D';

const PREVIEW_SIZES: Record<PreviewSize, { w: string; label: string; icon: React.ReactNode }> = {
  desktop: { w: '100%',  label: 'Desktop', icon: <Monitor size={11} /> },
  tablet:  { w: '768px', label: 'Tablet',  icon: <Tablet size={11} /> },
  mobile:  { w: '390px', label: 'Mobile',  icon: <Smartphone size={11} /> },
};

const STARTER_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My Site</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0a0a0a;
      color: #e0e0e0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .hero {
      text-align: center;
      padding: 4rem 2rem;
    }
    h1 {
      font-size: clamp(2rem, 6vw, 4rem);
      font-weight: 900;
      background: linear-gradient(135deg, #00D67D, #38bdf8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 1rem;
    }
    p {
      color: #6b7280;
      font-size: 1.1rem;
      max-width: 480px;
      margin: 0 auto 2rem;
      line-height: 1.6;
    }
    .cta {
      display: inline-block;
      padding: 0.75rem 2rem;
      background: #00D67D;
      color: #000;
      font-weight: 700;
      border-radius: 9999px;
      text-decoration: none;
      font-size: 0.95rem;
    }
  </style>
</head>
<body>
  <div class="hero">
    <h1>Build Something Great</h1>
    <p>Describe what you want and the AI will build it for you in real time.</p>
    <a href="#" class="cta">Get Started</a>
  </div>
</body>
</html>`;

const SUGGESTIONS = [
  'Build a dark landing page for a SaaS product',
  'Create a pricing section with 3 tiers',
  'Add a hero with animated gradient text',
  'Build a contact form with validation',
  'Create a features grid with icons',
  'Add a testimonials carousel',
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function extractCode(text: string): { html?: string; css?: string; js?: string } {
  const result: { html?: string; css?: string; js?: string } = {};
  const htmlMatch = text.match(/```(?:html)([\s\S]*?)```/i);
  const cssMatch  = text.match(/```(?:css)([\s\S]*?)```/i);
  const jsMatch   = text.match(/```(?:javascript|js)([\s\S]*?)```/i);
  if (htmlMatch) result.html = htmlMatch[1].trim();
  if (cssMatch)  result.css  = cssMatch[1].trim();
  if (jsMatch)   result.js   = jsMatch[1].trim();
  // If a full HTML doc is returned, treat the whole thing as html
  if (!result.html && text.includes('<!DOCTYPE') ) {
    const docMatch = text.match(/(<!DOCTYPE[\s\S]*?<\/html>)/i);
    if (docMatch) result.html = docMatch[1].trim();
  }
  return result;
}

function buildPreviewDoc(files: CodeFile[]): string {
  const html = files.find(f => f.lang === 'html')?.content ?? STARTER_HTML;
  const css  = files.find(f => f.lang === 'css')?.content  ?? '';
  const js   = files.find(f => f.lang === 'js')?.content   ?? '';
  if (!css && !js) return html;
  // Inject css/js into existing html
  let doc = html;
  if (css) doc = doc.replace('</head>', `<style>${css}</style></head>`);
  if (js)  doc = doc.replace('</body>', `<script>${js}</script></body>`);
  return doc;
}

// ── Copy Button ───────────────────────────────────────────────────────────────
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="p-1 rounded transition-colors flex-shrink-0"
      style={{ color: copied ? ACCENT : '#3a3a5a' }}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
    </button>
  );
}
// ── File Tab ──────────────────────────────────────────────────────────────────
const LANG_COLOR: Record<string, string> = { html: '#f97316', css: '#38bdf8', js: '#f59e0b' };

function FileTab({ file, active, onClick }: { file: CodeFile; active: boolean; onClick: () => void }) {
  const color = LANG_COLOR[file.lang] ?? '#6b6b8a';
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 h-full border-r text-[11px] font-mono transition-colors flex-shrink-0"
      style={{
        borderColor: '#1e1e2e',
        background: active ? '#0d0d18' : 'transparent',
        color: active ? '#c0c0d8' : '#3a3a5a',
        borderBottom: active ? `2px solid ${color}` : '2px solid transparent',
      }}
    >
      <FileCode2 size={10} style={{ color }} />
      {file.name}
    </button>
  );
}
// ── Code Panel ────────────────────────────────────────────────────────────────
function CodePanel({ files, activeFile, onFileChange, onContentChange }: {
  files: CodeFile[];
  activeFile: number;
  onFileChange: (i: number) => void;
  onContentChange: (i: number, val: string) => void;
}) {
  const file = files[activeFile];
  return (
    <div className="flex flex-col h-full" style={{ background: '#0d0d18' }}>
      {/* File tabs */}
      <div className="flex items-center h-9 border-b flex-shrink-0 overflow-x-auto" style={{ borderColor: '#1e1e2e', background: '#080810' }}>
        {files.map((f, i) => (
          <FileTab key={f.name} file={f} active={activeFile === i} onClick={() => onFileChange(i)} />
        ))}
      </div>

      {/* Line numbers + textarea */}
      <div className="flex flex-1 overflow-hidden font-mono text-[12px]">
        {/* Line numbers */}
        <div
          className="select-none text-right pr-3 pt-3 leading-5 overflow-hidden flex-shrink-0 w-10"
          style={{ color: '#2a2a4a', background: '#080810', borderRight: '1px solid #1e1e2e' }}
        >
          {file.content.split('\n').map((_, i) => (
            <div key={i} style={{ lineHeight: '20px' }}>{i + 1}</div>
          ))}
        </div>

        {/* Editor */}
        <textarea
          value={file.content}
          onChange={e => onContentChange(activeFile, e.target.value)}
          spellCheck={false}
          className="flex-1 resize-none outline-none p-3 leading-5 overflow-auto"
          style={{
            background: '#0d0d18',
            color: '#c0c0d8',
            caretColor: ACCENT,
            tabSize: 2,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
          }}
        />
      </div>
    </div>
  );
}

// ── Preview Pane ──────────────────────────────────────────────────────────────
function PreviewPane({ doc, size }: { doc: string; size: PreviewSize }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { w } = PREVIEW_SIZES[size];

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const iDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iDoc) return;
    iDoc.open();
    iDoc.write(doc);
    iDoc.close();
  }, [doc]);

  return (
    <div className="flex flex-col h-full" style={{ background: '#050508' }}>
      <div className="flex-1 overflow-auto flex items-start justify-center p-4">
        <div
          className="h-full transition-all duration-300 rounded-lg overflow-hidden border"
          style={{ width: w, minHeight: '100%', borderColor: '#1e1e2e', flexShrink: 0 }}
        >
          <iframe
            ref={iframeRef}
            title="preview"
            sandbox="allow-scripts allow-same-origin"
            className="w-full h-full border-0"
            style={{ minHeight: '500px' }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Chat Message ──────────────────────────────────────────────────────────────
function ChatMessage({ msg, isStreaming }: { msg: UIMessage; isStreaming?: boolean }) {
  const isUser = msg.role === 'user';
  let text = msg.content ?? '';
  if (!text && msg.parts) text = msg.parts.filter(p => p.type === 'text').map(p => p.text ?? '').join('');

  // Strip code blocks from display — they're applied to the editor
  const displayText = text.replace(/```[\s\S]*?```/g, '').replace(/<!DOCTYPE[\s\S]*?<\/html>/gi, '').trim();

  const hasCode = text !== displayText;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div
        className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border"
        style={isUser
          ? { background: '#1e3a5f', borderColor: '#2a4a7f' }
          : { background: `${ACCENT}18`, borderColor: `${ACCENT}30` }
        }
      >
        {isUser ? <User size={11} style={{ color: '#60a5fa' }} /> : <Bot size={11} style={{ color: ACCENT }} />}
      </div>

      <div className={`flex flex-col gap-1 max-w-[88%] ${isUser ? 'items-end' : 'items-start'}`}>
        {(displayText || isStreaming) && (
          <div
            className="relative group rounded-xl px-3 py-2.5 text-[12px] leading-relaxed"
            style={isUser
              ? { background: '#1a2a4a', border: '1px solid #2a3a6a', color: '#c8d8f0' }
              : { background: '#111118', border: '1px solid #1e1e2e', color: '#b0b0c8' }
            }
          >
            {displayText || null}
            {isStreaming && (
              <span className="inline-block w-1.5 h-3 ml-0.5 rounded-sm animate-pulse align-middle" style={{ background: ACCENT }} />
            )}
            {!isUser && displayText && (
              <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <CopyBtn text={displayText} />
              </div>
            )}
          </div>
        )}
        {hasCode && !isUser && (
          <div className="flex items-center gap-1.5 text-[10px] font-mono px-2 py-1 rounded-lg border"
            style={{ color: ACCENT, background: `${ACCENT}10`, borderColor: `${ACCENT}25` }}>
            <Code2 size={9} /> Code applied to editor
          </div>
        )}
      </div>
    </motion.div>
  );
}
// CHAT_MSG_PLACEHOLDER
// ── Main Panel ────────────────────────────────────────────────────────────────
export default function AgentPanel() {
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);
  const [input, setInput]           = useState('');
  const [rightPane, setRightPane]   = useState<'code' | 'preview'>('preview');
  const [previewSize, setPreviewSize] = useState<PreviewSize>('desktop');
  const [activeFile, setActiveFile] = useState(0);
  const [chatOpen, setChatOpen]     = useState(true);
  const [files, setFiles]           = useState<CodeFile[]>([
    { name: 'index.html', lang: 'html', content: STARTER_HTML },
    { name: 'style.css',  lang: 'css',  content: '' },
    { name: 'script.js',  lang: 'js',   content: '' },
  ]);

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: '/api/agent' }),
  });

  const isLoading  = status === 'streaming' || status === 'submitted';
  const uiMessages = messages as unknown as UIMessage[];
  const isEmpty    = uiMessages.length === 0;

  // Extract code from latest assistant message and apply to files
  useEffect(() => {
    const last = [...uiMessages].reverse().find(m => m.role === 'assistant');
    if (!last) return;
    let raw = last.content ?? '';
    if (!raw && last.parts) raw = last.parts.filter(p => p.type === 'text').map(p => p.text ?? '').join('');
    const extracted = extractCode(raw);
    if (!extracted.html && !extracted.css && !extracted.js) return;
    setFiles(prev => prev.map(f => {
      if (f.lang === 'html' && extracted.html) return { ...f, content: extracted.html };
      if (f.lang === 'css'  && extracted.css)  return { ...f, content: extracted.css };
      if (f.lang === 'js'   && extracted.js)   return { ...f, content: extracted.js };
      return f;
    }));
  }, [uiMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const submit = useCallback(() => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    // Include current HTML as context so the agent can modify it
    const htmlContext = files.find(f => f.lang === 'html')?.content ?? '';
    const prompt = htmlContext && uiMessages.length > 0
      ? `${text}\n\nCurrent HTML:\n\`\`\`html\n${htmlContext.slice(0, 3000)}\n\`\`\``
      : text;
    sendMessage({ text: prompt });
  }, [input, isLoading, sendMessage, files, uiMessages.length]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  }, [submit]);

  const previewDoc = useMemo(() => buildPreviewDoc(files), [files]);

  return (
    <div
      className="flex h-[calc(100vh-140px)] overflow-hidden rounded-2xl border"
      style={{ background: '#080810', borderColor: '#1a1a2e' }}
    >
      {/* ══ LEFT: CHAT PANEL ═════════════════════════════════════════════════ */}
      <AnimatePresence initial={false}>
        {chatOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 340, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 flex flex-col border-r overflow-hidden"
            style={{ borderColor: '#1a1a2e', background: '#080810' }}
          >
            {/* Chat header */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 h-10 border-b" style={{ background: '#0d0d18', borderColor: '#1a1a2e' }}>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: `${ACCENT}18` }}>
                  <Sparkles size={10} style={{ color: ACCENT }} />
                </div>
                <span className="text-[11px] font-mono" style={{ color: '#4a4a6a' }}>AI Builder</span>
              </div>
              <div className="flex items-center gap-1">
                {!isEmpty && (
                  <button onClick={() => setMessages([])}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: '#2a2a4a' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#6b6b8a')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#2a2a4a')}
                    title="Clear chat"
                  >
                    <RotateCcw size={10} />
                  </button>
                )}
                <button onClick={() => setChatOpen(false)}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: '#2a2a4a' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#6b6b8a')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#2a2a4a')}
                >
                  <X size={10} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isEmpty && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 pt-2">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 border"
                      style={{ background: `${ACCENT}12`, borderColor: `${ACCENT}25` }}>
                      <Terminal size={20} style={{ color: ACCENT }} />
                    </div>
                    <p className="text-[13px] font-bold mb-1" style={{ color: '#c0c0d8' }}>Website Builder</p>
                    <p className="text-[11px] leading-relaxed" style={{ color: '#3a3a5a' }}>
                      Describe what you want to build. The AI writes the code and updates the preview instantly.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    {SUGGESTIONS.map(s => (
                      <button key={s} onClick={() => { setInput(s); inputRef.current?.focus(); }}
                        className="w-full text-left px-3 py-2 rounded-xl border text-[11px] font-mono transition-all"
                        style={{ color: '#3a3a5a', borderColor: '#1a1a2e', background: '#0d0d18' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = `${ACCENT}35`; e.currentTarget.style.color = '#7a7a9a'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a1a2e'; e.currentTarget.style.color = '#3a3a5a'; }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {uiMessages.map(msg => <ChatMessage key={msg.id} msg={msg} />)}

              {isLoading && (uiMessages.length === 0 || uiMessages[uiMessages.length - 1]?.role === 'user') && (
                <ChatMessage msg={{ id: '__streaming__', role: 'assistant', content: '' }} isStreaming />
              )}

              {error && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl border text-[11px] text-red-400"
                  style={{ background: '#1a0808', borderColor: '#3a1010' }}>
                  <Zap size={11} className="flex-shrink-0 mt-0.5" />
                  {error.message}
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="flex-shrink-0 p-3 border-t" style={{ borderColor: '#1a1a2e' }}>
              <div className="flex items-end gap-2 rounded-xl border p-2.5 transition-colors"
                style={{ background: '#0d0d18', borderColor: '#1e1e2e' }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe what to build…"
                  rows={1}
                  disabled={isLoading}
                  className="flex-1 bg-transparent resize-none outline-none text-[12px] leading-relaxed max-h-28 overflow-y-auto disabled:opacity-40 font-mono"
                  style={{ color: '#c0c0d8', minHeight: '20px' }}
                  onInput={e => {
                    const el = e.currentTarget;
                    el.style.height = 'auto';
                    el.style.height = Math.min(el.scrollHeight, 112) + 'px';
                  }}
                />
                <button onClick={submit} disabled={!input.trim() || isLoading}
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30"
                  style={{ background: ACCENT }}>
                  {isLoading ? <Loader2 size={12} className="animate-spin text-black" /> : <Send size={11} className="text-black" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ RIGHT: IDE WORKSPACE ═════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* IDE top bar */}
        <div className="flex-shrink-0 flex items-center justify-between px-3 h-10 border-b"
          style={{ background: '#0d0d18', borderColor: '#1a1a2e' }}>

          <div className="flex items-center gap-2">
            {/* Toggle chat */}
            {!chatOpen && (
              <button onClick={() => setChatOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-mono transition-all"
                style={{ color: ACCENT, borderColor: `${ACCENT}30`, background: `${ACCENT}10` }}>
                <Sparkles size={9} /> AI
              </button>
            )}

            {/* Breadcrumb */}
            <div className="flex items-center gap-1 text-[11px] font-mono" style={{ color: '#2a2a4a' }}>
              <Globe size={10} />
              <span>spacze/</span>
              <span style={{ color: '#4a4a6a' }}>website-builder</span>
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1">
            {/* Code / Preview toggle */}
            <div className="flex items-center rounded-lg border overflow-hidden" style={{ borderColor: '#1e1e2e' }}>
              {(['code', 'preview'] as const).map(p => (
                <button key={p} onClick={() => setRightPane(p)}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono transition-colors"
                  style={{
                    background: rightPane === p ? '#1a1a2e' : 'transparent',
                    color: rightPane === p ? '#c0c0d8' : '#3a3a5a',
                  }}>
                  {p === 'code' ? <Code2 size={9} /> : <Eye size={9} />}
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>

            {/* Preview size (only when preview active) */}
            {rightPane === 'preview' && (
              <div className="flex items-center rounded-lg border overflow-hidden ml-1" style={{ borderColor: '#1e1e2e' }}>
                {(Object.entries(PREVIEW_SIZES) as [PreviewSize, typeof PREVIEW_SIZES[PreviewSize]][]).map(([key, val]) => (
                  <button key={key} onClick={() => setPreviewSize(key)}
                    className="flex items-center px-2 py-1 transition-colors"
                    style={{
                      background: previewSize === key ? '#1a1a2e' : 'transparent',
                      color: previewSize === key ? '#c0c0d8' : '#3a3a5a',
                    }}
                    title={val.label}
                  >
                    {val.icon}
                  </button>
                ))}
              </div>
            )}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ml-1"
                style={{ borderColor: `${ACCENT}25`, background: `${ACCENT}08` }}>
                <Loader2 size={9} className="animate-spin" style={{ color: ACCENT }} />
                <span className="text-[9px] font-mono" style={{ color: ACCENT }}>generating</span>
              </div>
            )}
          </div>
        </div>

        {/* Pane content */}
        <div className="flex-1 overflow-hidden">
          {rightPane === 'code' ? (
            <CodePanel
              files={files}
              activeFile={activeFile}
              onFileChange={setActiveFile}
              onContentChange={(i, val) => setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, content: val } : f))}
            />
          ) : (
            <PreviewPane doc={previewDoc} size={previewSize} />
          )}
        </div>
      </div>
    </div>
  );
}
