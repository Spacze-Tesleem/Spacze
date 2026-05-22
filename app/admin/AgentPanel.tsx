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
  Terminal, Sliders, ChevronRight, Binary
} from 'lucide-react';
import { useChat } from '@ai-sdk/react';

// ── Configuration ─────────────────────────────────────────────────────────────

const STARTER_CODE = `'use client';
import { motion } from 'framer-motion';

export default function Component() {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-8 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl border border-cyan-500/20 bg-cyan-500/5 p-12 rounded-sm relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
        <div className="flex justify-between items-start mb-12">
          <div>
            <h2 className="text-cyan-500 font-mono text-xs tracking-[0.3em] mb-2">SYSTEM_ARCHITECT_VR</h2>
            <h1 className="text-4xl font-light text-white tracking-tighter">Nexus <span className="font-bold italic">Prime</span></h1>
          </div>
          <div className="text-right font-mono text-[10px] text-cyan-500/50">
            LOC: 40.7128° N<br/>REF: 00-X9
          </div>
        </div>
        <p className="text-zinc-400 text-lg font-light leading-relaxed mb-12">
          High-performance interface component initialized. Grid alignment verified. 
          Ready for structural deployment.
        </p>
        <div className="flex gap-4">
          <button className="px-8 py-3 bg-cyan-500 text-black text-xs font-bold tracking-widest hover:bg-cyan-400 transition-colors">
            EXECUTE_DEPLOY
          </button>
          <button className="px-8 py-3 border border-white/10 text-white text-xs font-bold tracking-widest hover:bg-white/5 transition-colors">
            VIEW_LOGS
          </button>
        </div>
      </motion.div>
    </div>
  );
}`;

// ── Components ────────────────────────────────────────────────────────────────

const StatusBit = ({ label, value, color = "text-zinc-500" }: any) => (
  <div className="flex flex-col gap-1">
    <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">{label}</span>
    <span className={`text-[11px] font-mono ${color}`}>{value}</span>
  </div>
);

// ── Mode 1: OPERATIONS (Telemetry Chat) ──────────────────────────────────────

function OperationsFeed({ messages, status }: any) {
  return (
    <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full pt-12">
      <div className="flex items-end justify-between mb-8 border-b border-white/5 pb-6">
        <div>
          <h2 className="text-xs font-mono text-cyan-500 tracking-[0.4em] mb-1">REALTIME_OPERATIONS</h2>
          <div className="text-2xl font-light text-white">System Event Log</div>
        </div>
        <div className="flex gap-8">
          <StatusBit label="Active Connections" value="128" color="text-white" />
          <StatusBit label="Traffic" value="4.2 GB/s" color="text-white" />
          <StatusBit label="Status" value="NOMINAL" color="text-emerald-500" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-4 custom-scrollbar">
        {messages.map((m: any) => (
          <motion.div 
            initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}
            key={m.id} 
            className={`group flex items-start gap-6 p-4 border-l-2 transition-colors ${
              m.role === 'user' ? 'border-zinc-700 bg-zinc-900/20' : 'border-cyan-500/50 bg-cyan-500/5'
            }`}
          >
            <div className="w-12 pt-1 font-mono text-[10px] text-zinc-600">
              {new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="w-16 pt-1 font-mono text-[10px] font-bold uppercase tracking-tighter">
              {m.role === 'user' ? 'USR_01' : 'AGN_PRM'}
            </div>
            <div className="flex-1 text-sm leading-relaxed text-zinc-300 font-light">
              {m.content.replace(/```[\s\S]*?```/g, '').trim()}
            </div>
          </motion.div>
        ))}
        {status === 'streaming' && (
          <div className="p-4 flex items-center gap-3 text-cyan-500 font-mono text-[10px] animate-pulse">
            <Loader2 size={12} className="animate-spin" /> RUNNING_HEURISTICS...
          </div>
        )}
      </div>
    </div>
  );
}

// ── ROOT APPLICATION ──────────────────────────────────────────────────────────

export default function NexusPrime() {
  const [mode, setMode] = useState<'ops' | 'arch'>('ops');
  const [input, setInput] = useState('');
  const [code, setCode] = useState(STARTER_CODE);
  const [view, setView] = useState<'preview' | 'code'>('preview');
  const [device, setDevice] = useState('desktop');

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
    <div className="h-screen w-full bg-[#050505] text-zinc-400 font-sans selection:bg-cyan-500/30 flex overflow-hidden">
      
      {/* ── Monolith Sidebar ── */}
      <aside className="w-20 flex flex-col items-center py-8 border-r border-white/5 bg-[#080808] z-50">
        <div className="w-10 h-10 bg-cyan-500 flex items-center justify-center mb-12 shadow-[0_0_20px_rgba(34,211,238,0.4)]">
          <Binary size={20} className="text-black" />
        </div>
        
        <div className="flex flex-col gap-6 flex-1">
          <button onClick={() => setMode('ops')} className={`p-3 transition-all ${mode === 'ops' ? 'text-cyan-500 bg-cyan-500/10' : 'text-zinc-600 hover:text-white'}`}>
            <Terminal size={20} />
          </button>
          <button onClick={() => setMode('arch')} className={`p-3 transition-all ${mode === 'arch' ? 'text-cyan-500 bg-cyan-500/10' : 'text-zinc-600 hover:text-white'}`}>
            <Box size={20} />
          </button>
          <button className="p-3 text-zinc-600 hover:text-white"><BarChart3 size={20} /></button>
          <button className="p-3 text-zinc-600 hover:text-white"><Globe size={20} /></button>
        </div>

        <div className="flex flex-col gap-6">
          <button className="p-3 text-zinc-600 hover:text-white"><Sliders size={20} /></button>
          <button className="p-3 text-zinc-600 hover:text-white"><Settings size={20} /></button>
        </div>
      </aside>

      {/* ── Main Environment ── */}
      <main className="flex-1 flex flex-col relative min-w-0">
        
        {/* Global Action Center (Top) */}
        <div className="absolute top-0 left-0 w-full px-12 pt-8 z-40 pointer-events-none">
          <div className="max-w-4xl mx-auto pointer-events-auto">
            <div className="bg-zinc-900/80 border border-white/5 backdrop-blur-2xl p-2 flex items-center shadow-2xl transition-all focus-within:border-cyan-500/50">
              <div className="px-4 text-zinc-500"><Command size={16} /></div>
              <form onSubmit={(e)=>{e.preventDefault(); sendMessage({text: input}); setInput('')}} className="flex-1 flex">
                <input 
                  value={input}
                  onChange={(e)=>setInput(e.target.value)}
                  placeholder={mode === 'ops' ? "RUN_COMMAND..." : "REFINE_STRUCTURE..."}
                  className="w-full bg-transparent border-none outline-none py-3 text-xs font-mono text-white placeholder:text-zinc-700 tracking-widest"
                />
                <button type="submit" className="px-6 bg-cyan-500 text-black text-[10px] font-bold tracking-widest hover:bg-cyan-400 transition-all uppercase">
                  Execute
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden px-12 pt-28">
          <AnimatePresence mode="wait">
            {mode === 'ops' ? (
              <OperationsFeed key="ops" messages={messages} status={status} />
            ) : (
              <motion.div 
                key="arch" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="h-full flex flex-col pb-8"
              >
                {/* Workbench Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-6">
                    <div className="text-xl font-bold text-white italic tracking-tighter">Architect_Workbench</div>
                    <div className="flex gap-2 p-1 bg-zinc-900 border border-white/5">
                      <button onClick={()=>setView('preview')} className={`px-4 py-1 text-[10px] font-bold tracking-widest ${view === 'preview' ? 'bg-cyan-500 text-black' : 'text-zinc-500'}`}>VIEW</button>
                      <button onClick={()=>setView('code')} className={`px-4 py-1 text-[10px] font-bold tracking-widest ${view === 'code' ? 'bg-cyan-500 text-black' : 'text-zinc-500'}`}>CODE</button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex gap-1">
                      <button onClick={()=>setDevice('desktop')} className={`p-2 border border-white/5 ${device === 'desktop' ? 'text-cyan-500' : 'text-zinc-600'}`}><Monitor size={14}/></button>
                      <button onClick={()=>setDevice('mobile')} className={`p-2 border border-white/5 ${device === 'mobile' ? 'text-cyan-500' : 'text-zinc-600'}`}><Smartphone size={14}/></button>
                    </div>
                    <button className="px-6 py-2 bg-white text-black text-[10px] font-bold tracking-widest">DEPLOY_TO_PROD</button>
                  </div>
                </div>

                {/* Workspace Canvas */}
                <div className="flex-1 relative border border-white/5 bg-[#080808] overflow-hidden">
                  <AnimatePresence mode="wait">
                    {view === 'preview' ? (
                      <motion.div 
                        key="p" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="h-full w-full flex items-center justify-center p-12 bg-[dotted-grid]"
                        style={{ backgroundImage: 'radial-gradient(#1a1a1a 1px, transparent 0)', backgroundSize: '24px 24px' }}
                      >
                        <div 
                          className="relative shadow-[0_0_100px_rgba(34,211,238,0.1)] transition-all duration-500"
                          style={{ width: device === 'desktop' ? '100%' : '375px', height: '100%' }}
                        >
                          {/* HUD Corner Accents */}
                          <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-500/50" />
                          <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-500/50" />
                          <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-500/50" />
                          <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-500/50" />
                          
                          <iframe srcDoc={previewDoc} className="w-full h-full bg-black border border-white/10" />
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="c" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="h-full w-full bg-[#0d0d0f] p-8"
                      >
                        <div className="flex gap-8 h-full">
                          <div className="w-8 flex flex-col text-[10px] font-mono text-zinc-700 select-none">
                            {Array.from({length: 40}).map((_, i) => <div key={i} className="h-6 leading-6">{i+1}</div>)}
                          </div>
                          <textarea 
                            value={code} onChange={(e)=>setCode(e.target.value)} 
                            className="flex-1 bg-transparent border-none outline-none font-mono text-sm text-zinc-400 resize-none leading-6" 
                            spellCheck={false}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Global Footer Status */}
        <footer className="h-10 border-t border-white/5 px-12 flex items-center justify-between bg-black/40 text-[9px] font-mono tracking-[0.2em] text-zinc-600 uppercase">
          <div className="flex gap-8">
            <span className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-cyan-500 shadow-[0_0_5px_cyan]" /> Connection: Stable</span>
            <span>Kernel: Nexus_Core_v5.0</span>
          </div>
          <div className="flex gap-8">
            <span>Buffer: 100%</span>
            <span>Ref: {Math.random().toString(16).slice(2,8).toUpperCase()}</span>
          </div>
        </footer>
      </main>

      {/* Ambient Lighting */}
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
    </div>
  );
}