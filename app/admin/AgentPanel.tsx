'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Bot, User, Loader2, Sparkles, RotateCcw, Copy, 
  Monitor, Smartphone, Tablet, FileCode2,
  RefreshCw, Download, MessageSquare, 
  Layers, Command, Cpu, Zap, Activity, 
  Box, Wand2, BarChart3, Globe, ShieldCheck, 
  ArrowUpRight, Search, Hash, LayoutGrid, Settings,
  Terminal, Sliders, ChevronRight, Binary, Fingerprint,
  Menu, X, MousePointer2, CreditCard
} from 'lucide-react';
import { useChat } from '@ai-sdk/react';

// ── Types & Configuration ─────────────────────────────────────────────────────

type ViewMode = 'ops' | 'arch';

const STARTER_CODE = `'use client';
import { motion } from 'framer-motion';

export default function SolarisComponent() {
  return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center p-8">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative group p-[1px] rounded-[40px] bg-gradient-to-br from-indigo-500/20 via-white/5 to-sky-500/20 shadow-2xl"
      >
        <div className="bg-zinc-950/90 backdrop-blur-3xl rounded-[39px] px-12 py-16 text-center">
          <span className="text-indigo-400 font-mono text-[10px] tracking-[0.5em] uppercase mb-6 block">Solaris Intelligence</span>
          <h1 className="text-6xl font-serif text-white mb-6 italic tracking-tight">Elegance in <span className="font-sans font-bold not-italic">Logic.</span></h1>
          <p className="text-zinc-500 max-w-md mx-auto mb-10 text-lg leading-relaxed font-light">
            The workspace is synchronized. Every interaction is measured, every pixel is intentional.
          </p>
          <div className="flex gap-4 justify-center">
            <button className="px-8 py-3 rounded-full bg-white text-black font-semibold hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all">
              Initiate Project
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}`;

// ── Shared UI Elements ────────────────────────────────────────────────────────

const SolarisCard = ({ children, className = "", active = false }: any) => (
  <motion.div 
    layout
    className={`relative rounded-[2rem] border transition-all duration-500 ${
      active ? 'bg-zinc-900/50 border-white/20 shadow-2xl' : 'bg-zinc-900/20 border-white/5 hover:border-white/10'
    } ${className}`}
  >
    {children}
  </motion.div>
);

// ── Mode 1: OPERATIONS (High-Fidelity Chat) ───────────────────────────────────

function OperationsView({ messages, status }: any) {
  return (
    <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full pt-12">
      {/* Dynamic Header */}
      <div className="flex items-center justify-between mb-12">
        <div className="space-y-1">
          <h2 className="text-4xl font-serif italic text-white tracking-tight">Fleet Dashboard</h2>
          <p className="text-zinc-500 font-mono text-[10px] tracking-[0.2em] uppercase">Intelligence Node: 0x82...f2</p>
        </div>
        <div className="flex gap-3">
          <SolarisCard className="px-4 py-2 flex items-center gap-3">
            <Fingerprint size={14} className="text-indigo-400" />
            <span className="text-[11px] font-bold text-zinc-300">ADMIN_SECURE</span>
          </SolarisCard>
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar pb-32">
        {messages.map((m: any) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            key={m.id}
            className={`flex gap-6 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center border transition-all ${
              m.role === 'user' 
                ? 'bg-white border-white text-black shadow-lg shadow-white/5' 
                : 'bg-zinc-900 border-white/10 text-indigo-400'
            }`}>
              {m.role === 'user' ? <User size={20} /> : <Bot size={20} />}
            </div>
            
            <SolarisCard active={m.role === 'assistant'} className={`max-w-[75%] px-6 py-5 ${m.role === 'user' ? 'rounded-tr-none' : 'rounded-tl-none'}`}>
              <p className="text-[15px] leading-relaxed text-zinc-300 font-light">
                {m.content.replace(/```[\s\S]*?```/g, '').trim()}
              </p>
              {m.role === 'assistant' && (
                <div className="mt-4 pt-4 border-t border-white/5 flex gap-4">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
                    <Activity size={12} /> PROCESS_COMPLETE
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
                    <ShieldCheck size={12} /> VERIFIED
                  </div>
                </div>
              )}
            </SolarisCard>
          </motion.div>
        ))}
        {status === 'streaming' && (
          <div className="flex items-center gap-4 pl-20 py-4">
            <Loader2 size={16} className="animate-spin text-indigo-500" />
            <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest">Synthesizing response...</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Mode 2: ARCHITECT (The Infinity Canvas) ──────────────────────────────────

function ArchitectView({ code, setCode, messages, view, setView, device, setDevice }: any) {
  const previewDoc = useMemo(() => `
    <html>
      <head><script src="https://cdn.tailwindcss.com"></script></head>
      <body class="bg-[#030303] text-white m-0 font-sans">
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-full gap-6 pt-4 relative">
      {/* Floating Source Editor (Glass) */}
      <AnimatePresence>
        {view === 'code' && (
          <motion.div 
            initial={{ x: -400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -400, opacity: 0 }}
            className="absolute left-0 top-4 bottom-28 w-[500px] z-50 p-6"
          >
            <div className="h-full bg-zinc-950/80 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <span className="text-xs font-mono text-indigo-400">SOURCE_MANIFEST</span>
                <button onClick={()=>setView('preview')} className="text-zinc-500 hover:text-white"><X size={16}/></button>
              </div>
              <textarea 
                value={code} onChange={(e)=>setCode(e.target.value)}
                className="flex-1 p-8 bg-transparent outline-none border-none font-mono text-[13px] text-zinc-300 resize-none leading-relaxed"
                spellCheck={false}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Preview Stage */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="h-full w-full relative flex items-center justify-center bg-[radial-gradient(#1a1a1a_1px,transparent_1px)] [background-size:40px_40px]">
          <div 
            className="relative transition-all duration-1000 ease-in-out"
            style={{ 
              width: device === 'desktop' ? '100%' : '390px', 
              height: '100%',
              maxHeight: '85vh',
              transform: view === 'code' ? 'translateX(200px) scale(0.9)' : 'scale(1)'
            }}
          >
            {/* Ambient Shadow/Glow */}
            <div className="absolute inset-0 bg-indigo-500/5 blur-[120px] rounded-[3rem] -z-10" />
            
            <div className="w-full h-full bg-black rounded-[3rem] border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden">
               {/* Preview Bar */}
               <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-zinc-900/50 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 z-20">
                  <button onClick={()=>setDevice('desktop')} className={device === 'desktop' ? 'text-white' : 'text-zinc-600'}><Monitor size={14}/></button>
                  <button onClick={()=>setDevice('mobile')} className={device === 'mobile' ? 'text-white' : 'text-zinc-600'}><Smartphone size={14}/></button>
                  <div className="w-px h-3 bg-white/10 mx-1" />
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">Live Preview</span>
               </div>
               <iframe srcDoc={previewDoc} className="w-full h-full" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── ROOT APPLICATION ──────────────────────────────────────────────────────────

export default function SolarisOS() {
  const [mode, setMode] = useState<ViewMode>('ops');
  const [input, setInput] = useState('');
  const [code, setCode] = useState(STARTER_CODE);
  const [device, setDevice] = useState('desktop');
  const [view, setView] = useState<'preview' | 'code'>('preview');

  const { messages, sendMessage, status } = useChat({ api: '/api/agent' });

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.role === 'assistant') {
      const match = last.content.match(/```tsx\n([\s\S]*?)```/);
      if (match) {
        setCode(match[1]);
        if (mode === 'ops') setMode('arch');
      }
    }
  }, [messages, mode]);

  return (
    <div className="h-screen w-full bg-[#030303] text-zinc-400 font-sans selection:bg-indigo-500/30 overflow-hidden flex flex-col p-8">
      
      {/* Cinematic Background */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_-20%,#1e1b4b,transparent)] opacity-40" />

      {/* Primary Rail (Top Navigation) */}
      <header className="relative z-50 flex items-center justify-between mb-8">
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)]">
              <Zap size={20} className="text-black fill-black" />
            </div>
            <span className="text-white font-serif italic text-2xl tracking-tight">Solaris</span>
          </div>
          
          <nav className="flex items-center gap-2 bg-zinc-900/50 p-1 rounded-full border border-white/5 backdrop-blur-md">
            <button 
              onClick={() => setMode('ops')}
              className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${mode === 'ops' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
            >
              OPERATIONS
            </button>
            <button 
              onClick={() => setMode('arch')}
              className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${mode === 'arch' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
            >
              ARCHITECT
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Global Status</div>
            <div className="text-xs text-emerald-500 font-bold tracking-tight">SYSTEM_SYNCHRONIZED</div>
          </div>
          <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all">
            <Settings size={18} />
          </div>
        </div>
      </header>

      {/* Main Canvas Area */}
      <main className="flex-1 relative min-h-0 z-10">
        <AnimatePresence mode="wait">
          {mode === 'ops' ? (
            <OperationsView key="ops" messages={messages} status={status} />
          ) : (
            <ArchitectView 
              key="arch" code={code} setCode={setCode} 
              messages={messages} view={view} setView={setView} 
              device={device} setDevice={setDevice}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Floating Command Bar (HUD) */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 w-full max-w-3xl px-6 z-[100]">
        <div className="relative group">
          {/* Spatial Shadow */}
          <div className="absolute -inset-2 bg-indigo-500/10 blur-3xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700" />
          
          <SolarisCard className="p-3 bg-zinc-950/80 backdrop-blur-3xl border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
            <form 
              onSubmit={(e)=>{e.preventDefault(); sendMessage({text: input}); setInput('')}}
              className="flex items-center gap-4"
            >
              <div className="pl-4 text-indigo-400">
                {mode === 'ops' ? <Search size={20} /> : <Wand2 size={20} />}
              </div>
              <input 
                value={input}
                onChange={(e)=>setInput(e.target.value)}
                placeholder={mode === 'ops' ? "Command the operations agent..." : "Direct the architect..."}
                className="flex-1 bg-transparent border-none outline-none py-4 text-sm text-white placeholder:text-zinc-600 font-light"
              />
              <div className="flex items-center gap-2">
                {mode === 'arch' && (
                  <button 
                    type="button" onClick={()=>setView(view === 'code' ? 'preview' : 'code')}
                    className="p-3 text-zinc-500 hover:text-white transition-colors"
                  >
                    <Code2 size={20} />
                  </button>
                )}
                <button 
                  type="submit"
                  className="w-12 h-12 rounded-[1.2rem] bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl"
                >
                  <Send size={20} />
                </button>
              </div>
            </form>
          </SolarisCard>
          
          {/* Shortcuts Info */}
          <div className="mt-4 flex justify-center gap-6 text-[9px] font-mono text-zinc-600 uppercase tracking-[0.2em]">
            <span className="flex items-center gap-2"><Command size={10}/>K Search</span>
            <span className="flex items-center gap-2"><Command size={10}/>J Architect</span>
            <span className="flex items-center gap-2"><Command size={10}/>L Source</span>
          </div>
        </div>
      </div>
    </div>
  );
}