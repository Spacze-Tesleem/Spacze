'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import {
  Send, Bot, User, Loader2, Sparkles, RotateCcw, Copy, Check,
  Code2, Eye, Monitor, Smartphone, Tablet, FileCode2,
  ChevronRight, Globe, RefreshCw, Download,
  MessageSquare, PanelLeftClose, PanelLeftOpen, X,
  Terminal, Cpu, Zap, Maximize2, Layers, Command, Search,
  Plus, Github, ExternalLink, Activity
} from 'lucide-react';
import { useChat } from '@ai-sdk/react';

// ── Configuration ─────────────────────────────────────────────────────────────

const STARTER_CODE = `'use client';
import { motion } from 'framer-motion';

export default function Component() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative group p-[1px] rounded-3xl bg-gradient-to-b from-indigo-500 to-cyan-500 shadow-2xl"
      >
        <div className="bg-zinc-950 rounded-[23px] px-8 py-12 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.15),transparent)]" />
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500 mb-4">
            Future is Here
          </h1>
          <p className="text-zinc-400 max-w-sm mx-auto mb-8 leading-relaxed">
            Every line of code is orchestrated by intelligence. Ready to deploy?
          </p>
          <button className="px-6 py-2.5 rounded-full bg-white text-black font-semibold hover:bg-zinc-200 transition-colors">
            Initialize Sequence
          </button>
        </div>
      </motion.div>
    </div>
  );
}`;

// ── UI Atomic Components ──────────────────────────────────────────────────────

const GlassCard = ({ children, className = "" }: any) => (
  <div className={`backdrop-blur-xl bg-zinc-900/40 border border-white/10 rounded-2xl ${className}`}>
    {children}
  </div>
);

const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    onClick={onClick}
    className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
      active ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
    }`}
  >
    {active && (
      <motion.div 
        layoutId="active-tab"
        className="absolute inset-0 bg-white/5 border border-white/10 rounded-xl"
        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
      />
    )}
    <Icon size={16} className={active ? 'text-indigo-400' : ''} />
    <span className="relative z-10">{label}</span>
  </button>
);

// ── Agent Log Card ────────────────────────────────────────────────────────────

function ToolInvocation({ part }: { part: any }) {
  return (
    <div className="mt-3 p-3 rounded-xl bg-black/40 border border-white/5 font-mono text-[10px] space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-indigo-400">
          <Cpu size={12} />
          <span className="uppercase tracking-widest">{part.toolName}</span>
        </div>
        <div className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          {part.state === 'result' ? 'SUCCESS' : 'EXECUTING'}
        </div>
      </div>
      <div className="text-zinc-500 break-all leading-relaxed">
        {JSON.stringify(part.args)}
      </div>
    </div>
  );
}

function MessageBubble({ msg, isStreaming }: { msg: any; isStreaming?: boolean }) {
  const isUser = msg.role === 'user';
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-4 mb-8 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center border ${
        isUser ? 'bg-white border-white text-black' : 'bg-zinc-900 border-white/10 text-indigo-400'
      }`}>
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>
      
      <div className={`flex flex-col gap-2 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`px-5 py-3.5 rounded-2xl text-[14px] leading-relaxed ${
          isUser 
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
            : 'bg-zinc-900/80 border border-white/5 text-zinc-300'
        }`}>
          {msg.content.replace(/```[\s\S]*?```/g, '').trim()}
          {isStreaming && <span className="inline-block w-1 h-4 ml-1 bg-indigo-400 animate-pulse" />}
        </div>
        
        {msg.parts?.filter((p: any) => p.toolName).map((p: any, i: number) => (
          <ToolInvocation key={i} part={p} />
        ))}
      </div>
    </motion.div>
  );
}

// ── MAIN APPLICATION ──────────────────────────────────────────────────────────

export default function SpatialAgent() {
  const [activeTab, setActiveTab] = useState('chat');
  const [code, setCode] = useState(STARTER_CODE);
  const [input, setInput] = useState('');
  const [previewSize, setPreviewSize] = useState('desktop');
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');

  const { messages, sendMessage, status } = useChat({
    api: '/api/agent',
  });

  // Extract code from builder messages if needed
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === 'assistant') {
      const match = lastMsg.content.match(/```tsx\n([\s\S]*?)```/);
      if (match) setCode(match[1]);
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput('');
  };

  const previewDoc = useMemo(() => `
    <!DOCTYPE html>
    <html>
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
        <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
      </head>
      <body>
        <div id="root"></div>
        <script type="text/babel">
          ${code.replace(/import.*from.*/g, '').replace(/export default/g, 'const Component =')}
          ReactDOM.createRoot(document.getElementById('root')).render(<Component />);
        </script>
      </body>
    </html>
  `, [code]);

  return (
    <div className="h-screen w-full bg-[#020203] text-zinc-400 font-sans selection:bg-indigo-500/30 overflow-hidden flex flex-col">
      {/* ── Sub-pixel Noise Overlay ── */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* ── Header ── */}
      <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 relative z-10 bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-white flex items-center justify-center">
              <Zap size={14} className="text-black fill-black" />
            </div>
            <span className="text-white font-bold tracking-tighter text-lg">SPACZE</span>
          </div>
          
          <div className="h-4 w-px bg-white/10" />
          
          <div className="flex gap-1">
            <TabButton active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} icon={Activity} label="Operations" />
            <TabButton active={activeTab === 'builder'} onClick={() => setActiveTab('builder')} icon={Layers} label="Architect" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-white/5 text-[11px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            AGENT_ACTIVE
          </div>
          <button className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors">
            <Github size={16} />
          </button>
        </div>
      </header>

      {/* ── Main Canvas ── */}
      <main className="flex-1 relative flex overflow-hidden">
        
        {/* Tab 1: Chat / Operations */}
        <AnimatePresence mode="wait">
          {activeTab === 'chat' && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col relative"
            >
              <div className="flex-1 overflow-y-auto pt-12 pb-32 px-6">
                <div className="max-w-3xl mx-auto">
                  {messages.length === 0 && (
                    <div className="py-20 text-center">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        className="w-12 h-12 mx-auto mb-6 border-2 border-dashed border-indigo-500/50 rounded-full flex items-center justify-center"
                      >
                        <Command size={20} className="text-indigo-400" />
                      </motion.div>
                      <h2 className="text-2xl font-semibold text-white mb-2">System Initialized</h2>
                      <p className="text-zinc-500 max-w-sm mx-auto">Awaiting instructions for CRM automation, lead scoring, or campaign orchestration.</p>
                    </div>
                  )}
                  {messages.map((m: any) => <MessageBubble key={m.id} msg={m} />)}
                  {status === 'streaming' && <MessageBubble msg={{ role: 'assistant', content: '' }} isStreaming />}
                </div>
              </div>

              {/* Floating Command Bar */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6">
                <GlassCard className="p-2 shadow-2xl shadow-indigo-500/10 group focus-within:border-indigo-500/50 transition-all duration-500">
                  <form onSubmit={handleSubmit} className="flex items-center gap-2">
                    <div className="pl-3 text-zinc-500">
                      <Search size={18} />
                    </div>
                    <input 
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask the system anything..."
                      className="flex-1 bg-transparent border-none outline-none py-3 text-sm text-white placeholder:text-zinc-600"
                    />
                    <div className="flex gap-1 pr-1">
                      <div className="px-2 py-1 rounded bg-zinc-800 text-[10px] font-bold text-zinc-500 flex items-center gap-1 border border-white/5">
                        <Command size={10} /> K
                      </div>
                      <button 
                        type="submit"
                        className="bg-white text-black p-2 rounded-xl hover:scale-105 active:scale-95 transition-all"
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </form>
                </GlassCard>
              </div>
            </motion.div>
          )}

          {/* Tab 2: Architect / Builder */}
          {activeTab === 'builder' && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1 flex"
            >
              {/* Sidebar Architect Controls */}
              <aside className="w-80 border-r border-white/5 flex flex-col bg-black/40 backdrop-blur-sm">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">History</span>
                  <button className="p-1.5 hover:bg-white/5 rounded-md text-zinc-500"><Plus size={14}/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                   {messages.filter(m => m.role === 'user').map((m, i) => (
                     <div key={i} className="p-3 rounded-xl border border-white/5 bg-zinc-900/30 text-[12px] text-zinc-400 hover:border-indigo-500/30 cursor-pointer transition-colors group">
                       <div className="flex items-center gap-2 mb-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        <span className="text-zinc-500 text-[10px]">REVISION {i + 1}</span>
                       </div>
                       {m.content.slice(0, 60)}...
                     </div>
                   ))}
                </div>
              </aside>

              {/* Workbench */}
              <div className="flex-1 flex flex-col bg-[#050506]">
                <div className="h-14 border-b border-white/5 flex items-center justify-between px-6">
                  <div className="flex items-center gap-4">
                    <div className="flex p-1 bg-zinc-900 rounded-lg border border-white/5">
                      <button onClick={() => setViewMode('preview')} className={`px-4 py-1 text-xs rounded-md transition-all ${viewMode === 'preview' ? 'bg-white text-black shadow-lg' : 'text-zinc-500'}`}>Preview</button>
                      <button onClick={() => setViewMode('code')} className={`px-4 py-1 text-xs rounded-md transition-all ${viewMode === 'code' ? 'bg-white text-black shadow-lg' : 'text-zinc-500'}`}>Code</button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-white/5">
                      <button onClick={() => setPreviewSize('desktop')} className={`p-1.5 rounded-md ${previewSize === 'desktop' ? 'bg-zinc-800 text-white' : 'text-zinc-600'}`}><Monitor size={14}/></button>
                      <button onClick={() => setPreviewSize('tablet')} className={`p-1.5 rounded-md ${previewSize === 'tablet' ? 'bg-zinc-800 text-white' : 'text-zinc-600'}`}><Tablet size={14}/></button>
                      <button onClick={() => setPreviewSize('mobile')} className={`p-1.5 rounded-md ${previewSize === 'mobile' ? 'bg-zinc-800 text-white' : 'text-zinc-600'}`}><Smartphone size={14}/></button>
                    </div>
                    <div className="w-px h-4 bg-white/10" />
                    <button className="p-2 hover:bg-white/5 text-zinc-500 rounded-lg transition-colors"><Download size={16}/></button>
                    <button className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all">DEPLOY</button>
                  </div>
                </div>

                <div className="flex-1 relative overflow-hidden flex items-center justify-center p-12 bg-[radial-gradient(#161618_1px,transparent_1px)] [background-size:32px_32px]">
                  {viewMode === 'preview' ? (
                    <motion.div 
                      layout
                      className="relative z-10 shadow-[0_0_100px_rgba(99,102,241,0.1)] transition-all duration-700 ease-in-out border border-white/10"
                      style={{ 
                        width: previewSize === 'desktop' ? '100%' : previewSize === 'tablet' ? '768px' : '390px',
                        height: '100%',
                        maxHeight: '800px',
                        borderRadius: '24px'
                      }}
                    >
                      <div className="absolute -inset-4 bg-indigo-500/5 blur-3xl rounded-[40px] -z-10" />
                      <iframe 
                        srcDoc={previewDoc}
                        className="w-full h-full rounded-[23px] bg-black"
                        title="Architect Preview"
                      />
                    </motion.div>
                  ) : (
                    <div className="w-full h-full max-w-5xl mx-auto rounded-2xl border border-white/5 bg-[#0d0d0f] overflow-hidden flex flex-col">
                       <div className="flex items-center justify-between px-4 h-10 border-b border-white/5 bg-white/5">
                          <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase">page.tsx</span>
                          <button onClick={() => navigator.clipboard.writeText(code)} className="text-zinc-500 hover:text-white transition-colors"><Copy size={14}/></button>
                       </div>
                       <textarea 
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        spellCheck={false}
                        className="flex-1 p-8 bg-transparent outline-none text-zinc-300 font-mono text-sm leading-relaxed resize-none"
                       />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Visual Backdrop ── */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-indigo-600/10 blur-[120px] rounded-full -z-10 pointer-events-none" />
    </div>
  );
}