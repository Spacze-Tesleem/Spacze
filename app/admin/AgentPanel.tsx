'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Bot, User, Loader2, Sparkles, RotateCcw, Copy, 
  Monitor, Smartphone, Tablet, FileCode2,
  RefreshCw, Download, MessageSquare, 
  Layers, Command, Cpu, Zap, Activity, 
  Box, Wand2, BarChart3, Globe, ShieldCheck, 
  ArrowUpRight, Search, Hash
} from 'lucide-react';
import { useChat } from '@ai-sdk/react';

// ── Types ─────────────────────────────────────────────────────────────────────
type AppMode = 'operations' | 'architect';

const STARTER_CODE = `'use client';
import { motion } from 'framer-motion';

export default function App() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 rounded-[32px] bg-zinc-900/50 border border-white/10 backdrop-blur-xl shadow-2xl"
      >
        <div className="w-12 h-12 rounded-2xl bg-violet-500/20 flex items-center justify-center mb-6">
          <Zap className="text-violet-400" size={24} />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">System Core</h1>
        <p className="text-zinc-400 leading-relaxed mb-8">Architect mode is active. Modify the source or describe changes to refine the interface.</p>
        <div className="space-y-3">
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div initial={{ x: '-100%' }} animate={{ x: '0%' }} transition={{ duration: 2 }} className="h-full w-2/3 bg-violet-500" />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-zinc-500">
            <span>UPLOADING_ASSETS</span>
            <span>67%</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}`;

// ── Shared Glass Components ───────────────────────────────────────────────────

const GlassContainer = ({ children, className = "" }: any) => (
  <div className={`backdrop-blur-3xl bg-zinc-900/40 border border-white/10 rounded-[2.5rem] overflow-hidden ${className}`}>
    {children}
  </div>
);

// ── MODE 1: OPERATIONS (Deep Chat & CRM) ──────────────────────────────────────

function OperationsView({ messages, status }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }} 
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      className="flex flex-col h-full max-w-5xl mx-auto w-full pt-8 pb-32"
    >
      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-4 mb-12">
        {[
          { label: 'Active Leads', val: '1,284', icon: User, color: 'text-blue-400' },
          { label: 'System Health', val: '99.9%', icon: ShieldCheck, color: 'text-emerald-400' },
          { label: 'AI Tokens', val: '42.1k', icon: Cpu, color: 'text-violet-400' }
        ].map((stat, i) => (
          <div key={i} className="p-6 rounded-[2rem] bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
            <stat.icon size={20} className={`${stat.color} mb-4`} />
            <div className="text-2xl font-bold text-white mb-1 tracking-tight">{stat.val}</div>
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-8 overflow-y-auto px-4 custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center py-20">
            <div className="w-20 h-20 rounded-[2.5rem] bg-gradient-to-b from-zinc-800 to-zinc-900 border border-white/10 flex items-center justify-center mb-8 shadow-2xl">
              <Command size={32} className="text-zinc-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">Command Center</h2>
            <p className="text-zinc-500 max-w-md mx-auto leading-relaxed">
              Analyze your leads, generate outreach campaigns, or request data visualizations. The agent is ready.
            </p>
          </div>
        )}
        {messages.map((m: any) => (
          <div key={m.id} className={`flex gap-6 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center border ${
              m.role === 'user' ? 'bg-white border-white text-black' : 'bg-zinc-900 border-white/10 text-violet-400'
            }`}>
              {m.role === 'user' ? <User size={18} /> : <Bot size={18} />}
            </div>
            <div className={`flex flex-col gap-3 max-w-2xl ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`px-6 py-4 rounded-[2rem] text-sm leading-relaxed ${
                m.role === 'user' 
                  ? 'bg-violet-600 text-white shadow-xl shadow-violet-500/10' 
                  : 'bg-zinc-900 border border-white/10 text-zinc-200'
              }`}>
                {m.content.replace(/```[\s\S]*?```/g, '').trim()}
              </div>
              {m.role === 'assistant' && (
                <div className="flex gap-2">
                  <button className="flex items-center gap-2 px-3 py-1 rounded-full border border-white/5 bg-white/5 text-[10px] text-zinc-500 hover:text-white transition-colors">
                    <Copy size={12} /> COPY
                  </button>
                  <button className="flex items-center gap-2 px-3 py-1 rounded-full border border-white/5 bg-white/5 text-[10px] text-zinc-500 hover:text-white transition-colors">
                    <ArrowUpRight size={12} /> ACTION
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {status === 'streaming' && (
          <div className="flex gap-4 items-center text-violet-400 animate-pulse font-mono text-[10px] tracking-widest pl-16">
            <Loader2 size={14} className="animate-spin" /> THINKING...
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── MODE 2: ARCHITECT (UI Workbench) ──────────────────────────────────────────

function ArchitectView({ code, setCode, messages, status, device, setDevice, view, setView }: any) {
  const previewDoc = useMemo(() => `
    <html>
      <head><script src="https://cdn.tailwindcss.com"></script></head>
      <body class="bg-black text-white m-0">
        <div id="root"></div>
        <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
        <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
        <script type="text/babel">
          ${code.replace(/import.*from.*/g, '').replace(/export default/g, 'const App =')}
          ReactDOM.createRoot(document.getElementById('root')).render(<App />);
        </script>
      </body>
    </html>
  `, [code]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="flex h-full gap-4 pt-4"
    >
      {/* Mini Sidebar Instructions */}
      <div className="w-80 shrink-0 flex flex-col gap-4 pb-28">
        <GlassContainer className="flex-1 flex flex-col">
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
            <span className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase">History</span>
            <Hash size={12} className="text-zinc-600" />
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.filter((m:any) => m.role === 'user').map((m:any, i:number) => (
              <div key={i} className="p-3 rounded-2xl bg-white/5 border border-white/5 text-[11px] leading-relaxed group hover:border-violet-500/50 transition-colors">
                <div className="text-violet-400 mb-1">Iteration {i+1}</div>
                {m.content.slice(0, 80)}...
              </div>
            ))}
          </div>
        </GlassContainer>
      </div>

      {/* Main Stage */}
      <div className="flex-1 flex flex-col gap-4 pb-28">
        <GlassContainer className="flex-1 relative flex flex-col">
          {/* Workbench Header */}
          <div className="h-14 flex items-center justify-between px-6 border-b border-white/5">
            <div className="flex bg-zinc-950 p-1 rounded-xl border border-white/10">
              <button onClick={() => setView('preview')} className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all ${view === 'preview' ? 'bg-white text-black' : 'text-zinc-500'}`}>PREVIEW</button>
              <button onClick={() => setView('code')} className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all ${view === 'code' ? 'bg-white text-black' : 'text-zinc-500'}`}>SOURCE</button>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-white/10">
                <button onClick={() => setDevice('desktop')} className={`p-2 rounded-lg ${device === 'desktop' ? 'text-white' : 'text-zinc-600'}`}><Monitor size={14}/></button>
                <button onClick={() => setDevice('mobile')} className={`p-2 rounded-lg ${device === 'mobile' ? 'text-white' : 'text-zinc-600'}`}><Smartphone size={14}/></button>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-[11px] font-bold rounded-xl shadow-lg shadow-violet-500/20">
                <Wand2 size={14} /> DEPLOY
              </button>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 relative overflow-hidden flex items-center justify-center p-8 bg-[radial-gradient(#222_1px,transparent_1px)] [background-size:32px_32px]">
            <AnimatePresence mode="wait">
              {view === 'preview' ? (
                <motion.div 
                  key="p" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="relative z-10 transition-all duration-700 shadow-[0_50px_100px_rgba(0,0,0,0.8)] border border-white/10"
                  style={{ width: device === 'desktop' ? '100%' : '375px', height: '100%', borderRadius: '2rem' }}
                >
                  <iframe srcDoc={previewDoc} className="w-full h-full rounded-[1.9rem] bg-black" />
                </motion.div>
              ) : (
                <motion.div key="c" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full h-full bg-zinc-950 rounded-3xl p-8 border border-white/5">
                  <textarea value={code} onChange={(e)=>setCode(e.target.value)} spellCheck={false} className="w-full h-full bg-transparent outline-none font-mono text-sm text-zinc-400 resize-none leading-relaxed" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </GlassContainer>
      </div>
    </motion.div>
  );
}

// ── ROOT APPLICATION ──────────────────────────────────────────────────────────

export default function LumiereOS() {
  const [mode, setMode] = useState<AppMode>('operations');
  const [input, setInput] = useState('');
  const [code, setCode] = useState(STARTER_CODE);
  const [device, setDevice] = useState('desktop');
  const [view, setView] = useState('preview');

  const { messages, sendMessage, status } = useChat({ api: '/api/agent' });

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.role === 'assistant') {
      const match = last.content.match(/```tsx\n([\s\S]*?)```/);
      if (match) {
        setCode(match[1]);
        if (mode === 'operations') setMode('architect');
      }
    }
  }, [messages, mode]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput('');
  };

  return (
    <div className="h-screen w-full bg-[#020204] text-zinc-400 font-sans selection:bg-violet-500/30 flex flex-col p-6 overflow-hidden">
      
      {/* Background Atmosphere */}
      <div className="fixed top-[-10%] left-[-10%] w-[60%] h-[60%] bg-violet-900/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[150px] rounded-full pointer-events-none" />

      {/* Global Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-6 py-2 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center">
            <Zap size={18} className="text-black fill-black" />
          </div>
          <span className="text-white font-bold tracking-tighter text-lg uppercase">Lumiere OS</span>
        </div>
        <div className="flex items-center gap-6 text-[10px] font-mono tracking-widest text-zinc-500">
          <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> SECURE_CONN</div>
          <div className="flex items-center gap-2"><Activity size={12} /> 1.2 GB/S</div>
        </div>
      </header>

      {/* Primary Workspace */}
      <main className="flex-1 min-h-0 relative">
        <AnimatePresence mode="wait">
          {mode === 'operations' ? (
            <OperationsView key="ops" messages={messages} status={status} />
          ) : (
            <ArchitectView 
              key="arch" 
              code={code} 
              setCode={setCode} 
              messages={messages} 
              status={status} 
              device={device}
              setDevice={setDevice}
              view={view}
              setView={setView}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Global Command Bar & Dock */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-4xl px-6 flex flex-col items-center gap-6">
        
        {/* Input Bar */}
        <div className="w-full relative group">
          <div className="absolute inset-0 bg-violet-600/10 blur-2xl group-focus-within:bg-violet-600/20 transition-all duration-700" />
          <div className="relative backdrop-blur-3xl bg-zinc-900/80 border border-white/10 rounded-[2rem] p-2 flex items-center shadow-2xl transition-all duration-500 group-focus-within:border-violet-500/50">
            <div className="px-4 text-zinc-500">
              {mode === 'operations' ? <Search size={20} /> : <Wand2 size={20} className="text-violet-400" />}
            </div>
            <form onSubmit={handleSend} className="flex-1 flex">
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={mode === 'operations' ? "Talk to the operations agent..." : "Tell architect what to build..."}
                className="w-full bg-transparent border-none outline-none py-4 text-sm text-white placeholder:text-zinc-600"
              />
              <button type="submit" className="w-12 h-12 bg-white rounded-[1.4rem] flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-all">
                <Send size={20} />
              </button>
            </form>
          </div>
        </div>

        {/* Navigation Dock */}
        <div className="p-2 bg-zinc-900/50 backdrop-blur-2xl border border-white/10 rounded-full flex items-center gap-1">
          <button 
            onClick={() => setMode('operations')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold transition-all ${mode === 'operations' ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-zinc-500 hover:text-white'}`}
          >
            <BarChart3 size={16} /> OPERATIONS
          </button>
          <button 
            onClick={() => setMode('architect')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold transition-all ${mode === 'architect' ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-zinc-500 hover:text-white'}`}
          >
            <Box size={16} /> ARCHITECT
          </button>
          <div className="w-px h-4 bg-white/10 mx-2" />
          <button className="p-2.5 text-zinc-600 hover:text-white transition-colors"><Globe size={18}/></button>
          <button className="p-2.5 text-zinc-600 hover:text-white transition-colors"><RefreshCw size={18}/></button>
        </div>
      </div>
    </div>
  );
}