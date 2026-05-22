'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Bot, User, Loader2, Sparkles, RotateCcw, Copy, Check,
  Code2, Eye, Monitor, Smartphone, Tablet, FileCode2,
  ChevronRight, ChevronDown, Globe, RefreshCw, Download,
  MessageSquare, PanelLeftClose, PanelLeftOpen, X,
  Circle, CheckCircle2, AlertCircle, Terminal, Cpu, Zap,
  Play, Square, Layers, Command, Search, Settings2
} from 'lucide-react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

// ── Design Tokens ─────────────────────────────────────────────────────────────
const THEME = {
  bg: '#09090b',
  bgElevated: '#121217',
  bgSubtle: '#18181b',
  border: 'rgba(255,255,255,0.08)',
  borderBright: 'rgba(255,255,255,0.15)',
  accent: '#10b981', // Emerald 500
  accentMuted: 'rgba(16, 185, 129, 0.15)',
  textMain: '#fafafa',
  textSecondary: '#a1a1aa',
  textMuted: '#52525b',
  mono: "'JetBrains Mono', 'Fira Code', monospace",
  sans: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
};

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

// ── Constants & Helpers ───────────────────────────────────────────────────────
const STARTER_CODE = `'use client';
import { motion } from 'framer-motion';

export default function Page() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full"
      >
        <div className="h-px w-full bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent mb-8" />
        <h1 className="text-4xl font-light tracking-tight mb-4">
          Next Generation <span className="text-emerald-500 font-medium">Interfaces</span>
        </h1>
        <p className="text-neutral-400 text-lg font-light leading-relaxed mb-8">
          The builder is ready. Describe your vision and watch the code materialize in real-time.
        </p>
        <div className="flex gap-4">
          <button className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 transition-colors rounded-full text-sm font-medium">
            Deploy Component
          </button>
          <button className="px-6 py-2 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 transition-colors rounded-full text-sm font-medium">
            View Documentation
          </button>
        </div>
      </motion.div>
    </main>
  );
}`;

function extractTsx(text: string): string | null {
  const m = text.match(/```(?:tsx|jsx|typescript|javascript|js|ts)\n([\s\S]*?)```/i);
  if (m) return m[1].trim();
  if (text.includes('export default') && text.includes('return (')) return text.trim();
  return null;
}

// ── Reusable UI Components ────────────────────────────────────────────────────

const IconButton = ({ icon: Icon, onClick, active, title }: any) => (
  <button
    onClick={onClick}
    title={title}
    className={`p-1.5 rounded-md transition-all duration-200 ${
      active 
        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
        : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent'
    }`}
  >
    <Icon size={16} />
  </button>
);

const Badge = ({ children, variant = 'default' }: any) => {
  const styles = {
    default: 'bg-zinc-800 text-zinc-400 border-zinc-700',
    success: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${styles[variant as keyof typeof styles]}`}>
      {children}
    </span>
  );
};

// ── Chat Activity Row ────────────────────────────────────────────────────────
function ChatRow({ msg, isStreaming }: { msg: UIMessage; isStreaming?: boolean }) {
  const isUser = msg.role === 'user';
  const text = msg.content.replace(/```[\s\S]*?```/g, '').trim();

  return (
    <motion.div 
      initial={{ opacity: 0, x: isUser ? 10 : -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex flex-col mb-6 ${isUser ? 'items-end' : 'items-start'}`}
    >
      <div className={`flex items-center gap-2 mb-1.5 ${isUser ? 'flex-row-reverse' : ''}`}>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${
          isUser ? 'bg-zinc-100 border-white' : 'bg-emerald-500/10 border-emerald-500/30'
        }`}>
          {isUser ? <User size={12} className="text-black" /> : <Bot size={12} className="text-emerald-500" />}
        </div>
        <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
          {isUser ? 'Authorized User' : 'System Agent'}
        </span>
      </div>
      
      <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-[13px] leading-relaxed ${
        isUser 
          ? 'bg-zinc-100 text-black rounded-tr-none' 
          : 'bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-tl-none'
      }`}>
        {text}
        {isStreaming && (
          <span className="inline-block w-1.5 h-4 ml-1 bg-emerald-500 animate-pulse align-middle" />
        )}
      </div>

      {msg.parts?.filter(p => p.toolName).map((p, i) => (
        <div key={i} className="mt-2 ml-2 flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
          <Terminal size={12} className="text-emerald-500" />
          <span>executing: <span className="text-zinc-300">{p.toolName}</span></span>
          {p.state === 'result' ? <CheckCircle2 size={10} className="text-emerald-500" /> : <Loader2 size={10} className="animate-spin" />}
        </div>
      ))}
    </motion.div>
  );
}

// ── BUILDER: Code & Preview ───────────────────────────────────────────────────

function CodePanel({ code, onChange }: { code: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col h-full bg-[#0d0d0f]">
      <div className="flex items-center justify-between px-4 h-10 border-b border-white/5 bg-zinc-900/50">
        <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
          <FileCode2 size={14} className="text-blue-400" />
          <span>page.tsx</span>
        </div>
        <IconButton icon={Copy} onClick={() => navigator.clipboard.writeText(code)} />
      </div>
      <textarea
        value={code}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 p-6 bg-transparent outline-none resize-none text-[13px] leading-relaxed text-zinc-300 font-mono"
        spellCheck={false}
      />
    </div>
  );
}

// ── MAIN PANEL COMPONENT ──────────────────────────────────────────────────────

export default function ProfessionalAgentPanel() {
  const [activeTab, setActiveTab] = useState<TopTab>('chat');
  const [isBuilderSidebarOpen, setBuilderSidebarOpen] = useState(true);
  const [builderInput, setBuilderInput] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [code, setCode] = useState(STARTER_CODE);
  const [previewSize, setPreviewSize] = useState<PreviewSize>('desktop');
  const [previewKey, setPreviewKey] = useState(0);
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('preview');

  const { messages: chatMsgs, sendMessage: sendChatMessage, status: chatStatus } = useChat({
    api: '/api/agent',
  });

  const { messages: buildMsgs, sendMessage: sendBuildMessage, status: buildStatus } = useChat({
    api: '/api/build',
  });

  // Sync builder code
  useEffect(() => {
    const lastMsg = buildMsgs[buildMsgs.length - 1];
    if (lastMsg?.role === 'assistant') {
      const extracted = extractTsx(lastMsg.content);
      if (extracted) {
        setCode(extracted);
        setPreviewKey(k => k + 1);
      }
    }
  }, [buildMsgs]);

  const handleChatSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim()) return;
    sendChatMessage({ text: chatInput });
    setChatInput('');
  };

  const handleBuildSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!builderInput.trim()) return;
    const prompt = `Current code:\n${code}\n\nTask: ${builderInput}`;
    sendBuildMessage({ text: prompt });
    setBuilderInput('');
  };

  const previewDoc = useMemo(() => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <script src="https://cdn.tailwindcss.com"></script>
          <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
          <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
          <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
          <style>body { background: #000; margin: 0; color: white; font-family: sans-serif; }</style>
        </head>
        <body>
          <div id="root"></div>
          <script type="text/babel">
            const { useState, useEffect } = React;
            ${code.replace(/import.*from.*/g, '').replace(/export default/g, 'const Page =')}
            const root = ReactDOM.createRoot(document.getElementById('root'));
            root.render(<Page />);
          </script>
        </body>
      </html>
    `;
  }, [code]);

  return (
    <div className="flex flex-col h-[90vh] max-h-[900px] w-full max-w-6xl mx-auto rounded-3xl border border-white/10 bg-[#09090b] shadow-2xl overflow-hidden shadow-emerald-500/5">
      
      {/* ── Top Navigation ── */}
      <header className="flex items-center justify-between px-6 h-16 border-b border-white/5 bg-zinc-900/20 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Zap size={18} className="text-white fill-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight text-white">Spacze Agent</span>
              <span className="text-[10px] text-emerald-500/80 font-mono font-medium flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> 
                SYSTEM_ONLINE v2.4
              </span>
            </div>
          </div>
          
          <nav className="flex items-center ml-8 bg-zinc-800/40 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'chat' ? 'bg-zinc-100 text-black' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <MessageSquare size={16} /> Activity
            </button>
            <button
              onClick={() => setActiveTab('builder')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'builder' ? 'bg-zinc-100 text-black' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Layers size={16} /> UI Builder
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant={chatStatus === 'streaming' || buildStatus === 'streaming' ? 'warning' : 'success'}>
            {chatStatus === 'streaming' || buildStatus === 'streaming' ? 'Processing...' : 'Ready'}
          </Badge>
          <div className="w-px h-4 bg-white/10 mx-2" />
          <IconButton icon={Settings2} />
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeTab === 'chat' ? (
            <motion.div 
              key="chat-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col h-full bg-zinc-950/50"
            >
              <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
                {chatMsgs.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-3xl bg-zinc-900 flex items-center justify-center mb-6 border border-white/5">
                      <Command size={32} className="text-zinc-600" />
                    </div>
                    <h2 className="text-xl font-medium text-white mb-2">How can I assist today?</h2>
                    <p className="text-zinc-500 text-sm max-w-xs">Enter a command to analyze leads, manage campaigns, or generate outreach content.</p>
                  </div>
                )}
                {chatMsgs.map((m: any) => <ChatRow key={m.id} msg={m} />)}
                {chatStatus === 'streaming' && <ChatRow msg={{ id: 'stream', role: 'assistant', content: '' }} isStreaming />}
              </div>

              {/* Chat Input Bar */}
              <div className="p-6 bg-gradient-to-t from-zinc-950 to-transparent">
                <form 
                  onSubmit={handleChatSubmit}
                  className="max-w-3xl mx-auto relative group"
                >
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type a command or ask a question..."
                    className="w-full bg-zinc-900/80 border border-white/10 rounded-2xl py-4 pl-6 pr-16 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all backdrop-blur-xl"
                  />
                  <button 
                    type="submit"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-black hover:scale-105 transition-transform active:scale-95"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="builder-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex h-full"
            >
              {/* Builder Sidebar */}
              <AnimatePresence initial={false}>
                {isBuilderSidebarOpen && (
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: 320 }}
                    exit={{ width: 0 }}
                    className="border-r border-white/5 bg-zinc-900/30 flex flex-col"
                  >
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Builder Chat</span>
                      <IconButton icon={RotateCcw} onClick={() => setCode(STARTER_CODE)} />
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {buildMsgs.filter(m => m.content.replace(/```[\s\S]*?```/g, '').trim()).map((m: any) => (
                        <div key={m.id} className={`p-3 rounded-xl text-[12px] ${m.role === 'user' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800/50 text-zinc-300'}`}>
                          {m.content.replace(/```[\s\S]*?```/g, '').trim()}
                        </div>
                      ))}
                    </div>
                    <div className="p-4 border-t border-white/5">
                      <form onSubmit={handleBuildSubmit} className="relative">
                        <textarea
                          value={builderInput}
                          onChange={(e) => setBuilderInput(e.target.value)}
                          placeholder="Change colors, add a section..."
                          className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500/50 resize-none h-24"
                        />
                        <button className="absolute bottom-3 right-3 p-1.5 bg-emerald-500 rounded-lg text-black">
                          <Send size={14} />
                        </button>
                      </form>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Builder Canvas Area */}
              <div className="flex-1 flex flex-col bg-[#050505]">
                <div className="h-12 border-b border-white/5 flex items-center justify-between px-4 bg-zinc-900/20">
                  <div className="flex items-center gap-3">
                    <IconButton icon={isBuilderSidebarOpen ? PanelLeftClose : PanelLeftOpen} onClick={() => setBuilderSidebarOpen(!isBuilderSidebarOpen)} />
                    <div className="w-px h-4 bg-white/10" />
                    <div className="flex bg-zinc-800/50 p-1 rounded-lg border border-white/5">
                      <button onClick={() => setViewMode('preview')} className={`px-3 py-1 text-[11px] rounded-md transition-all ${viewMode === 'preview' ? 'bg-zinc-100 text-black' : 'text-zinc-400'}`}>Preview</button>
                      <button onClick={() => setViewMode('code')} className={`px-3 py-1 text-[11px] rounded-md transition-all ${viewMode === 'code' ? 'bg-zinc-100 text-black' : 'text-zinc-400'}`}>Code</button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {viewMode === 'preview' && (
                      <div className="flex items-center bg-zinc-800/50 rounded-lg border border-white/5 p-1 mr-2">
                        <IconButton icon={Monitor} active={previewSize === 'desktop'} onClick={() => setPreviewSize('desktop')} />
                        <IconButton icon={Tablet} active={previewSize === 'tablet'} onClick={() => setPreviewSize('tablet')} />
                        <IconButton icon={Smartphone} active={previewSize === 'mobile'} onClick={() => setPreviewSize('mobile')} />
                      </div>
                    )}
                    <IconButton icon={RefreshCw} onClick={() => setPreviewKey(k => k + 1)} />
                    <IconButton icon={Download} onClick={() => {}} />
                  </div>
                </div>

                <div className="flex-1 overflow-hidden relative">
                  {viewMode === 'code' ? (
                    <CodePanel code={code} onChange={setCode} />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center p-8 overflow-auto bg-[radial-gradient(#1a1a1a_1px,transparent_1px)] [background-size:20px_20px]">
                      <div 
                        className="bg-black shadow-2xl transition-all duration-500 border border-white/10 overflow-hidden"
                        style={{ 
                          width: previewSize === 'desktop' ? '100%' : previewSize === 'tablet' ? '768px' : '375px',
                          height: '100%',
                          borderRadius: previewSize === 'desktop' ? '0' : '24px'
                        }}
                      >
                        <iframe
                          key={previewKey}
                          srcDoc={previewDoc}
                          className="w-full h-full border-0"
                          title="UI Preview"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}