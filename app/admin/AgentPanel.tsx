'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import {
  Send, Bot, User, Loader2, Sparkles, RotateCcw, Copy, Check,
  Code2, Eye, Monitor, Smartphone, Tablet, FileCode2,
  ChevronRight, RefreshCw, Download, MessageSquare, 
  Layers, Command, Cpu, Zap, Activity, Grid, Sidebar,
  Square, Layout, Box, Wand2
} from 'lucide-react';
import { useChat } from '@ai-sdk/react';

// ── Design System ─────────────────────────────────────────────────────────────

const THEME = {
  canvas: '#050505',
  glass: 'rgba(15, 15, 20, 0.7)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  accent: '#8B5CF6', // Electric Violet
  accentGlow: 'rgba(139, 92, 246, 0.15)',
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#52525B',
};

// ── Shared UI Components ──────────────────────────────────────────────────────

const GlassPanel = ({ children, className = "", hover = false }: any) => (
  <motion.div 
    whileHover={hover ? { borderColor: 'rgba(255,255,255,0.15)' } : {}}
    className={`backdrop-blur-2xl bg-zinc-900/50 border border-white/5 rounded-[2rem] overflow-hidden ${className}`}
  >
    {children}
  </motion.div>
);

const DockIcon = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    onClick={onClick}
    className="relative group p-3 rounded-2xl transition-all duration-500"
  >
    {active && (
      <motion.div 
        layoutId="dock-active"
        className="absolute inset-0 bg-white/10 rounded-2xl border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
      />
    )}
    <Icon 
      size={20} 
      className={`relative z-10 transition-colors duration-300 ${active ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`} 
    />
    <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-zinc-800 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/5 whitespace-nowrap">
      {label}
    </span>
  </button>
);

// ── AI Reasoner (Timeline Style) ──────────────────────────────────────────────

function ReasonerLog({ messages, isStreaming }: any) {
  return (
    <div className="flex flex-col gap-8 p-6">
      {messages.map((m: any, idx: number) => (
        <div key={m.id} className="relative pl-8 group">
          {/* Timeline Line */}
          {idx !== messages.length - 1 && (
            <div className="absolute left-[11px] top-6 bottom-[-32px] w-[1px] bg-gradient-to-b from-white/10 to-transparent" />
          )}
          
          <div className={`absolute left-0 top-1 w-[22px] h-[22px] rounded-full border flex items-center justify-center bg-zinc-950 transition-colors duration-500 ${
            m.role === 'user' ? 'border-white/20' : 'border-violet-500/50 shadow-[0_0_10px_rgba(139,92,246,0.3)]'
          }`}>
            {m.role === 'user' ? <User size={10} /> : <Zap size={10} className="text-violet-400" />}
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
              {m.role === 'user' ? 'Input sequence' : 'Agent response'}
            </span>
            <p className="text-[13px] leading-relaxed text-zinc-300">
              {m.content.replace(/```[\s\S]*?```/g, '').trim()}
            </p>
          </div>
        </div>
      ))}
      {isStreaming && (
        <div className="flex items-center gap-3 pl-8 text-violet-400 animate-pulse">
          <Loader2 size={14} className="animate-spin" />
          <span className="text-[11px] font-mono tracking-tighter">ORCHESTRATING_CODE...</span>
        </div>
      )}
    </div>
  );
}

// ── MAIN WORKSPACE ────────────────────────────────────────────────────────────

export default function LumiereStudio() {
  const [tab, setTab] = useState<'chat' | 'builder'>('chat');
  const [code, setCode] = useState('');
  const [input, setInput] = useState('');
  const [view, setView] = useState<'preview' | 'code'>('preview');
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');

  const { messages, sendMessage, status } = useChat({ api: '/api/agent' });

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.role === 'assistant') {
      const match = last.content.match(/```tsx\n([\s\S]*?)```/);
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
    <div className="h-screen w-full bg-[#050505] text-zinc-300 font-sans flex flex-col p-4 gap-4 overflow-hidden">
      
      {/* ── Top Info Bar ── */}
      <div className="flex items-center justify-between px-6 py-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_8px_#8B5CF6]" />
            <span className="text-[11px] font-mono tracking-[0.3em] text-white uppercase">Lumiere Agent v3</span>
          </div>
          <div className="h-3 w-px bg-white/10" />
          <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
            <Activity size={12} />
            <span>LATENCY: 12ms</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full border border-black bg-zinc-800" />)}
          </div>
          <button className="text-[11px] font-bold text-white bg-white/5 px-3 py-1 rounded-full border border-white/10 hover:bg-white/10 transition-colors">
            SHARE
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        
        {/* ── Left Sidebar (Controls/Thought) ── */}
        <GlassPanel className="w-[400px] flex flex-col shrink-0">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Sparkles size={16} className="text-violet-400" />
              Intelligence Stream
            </h3>
            <span className="text-[10px] text-zinc-500 font-mono">HISTORY_LOG</span>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <ReasonerLog messages={messages} isStreaming={status === 'streaming'} />
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="relative group">
              <div className="absolute inset-0 bg-violet-500/5 blur-xl group-focus-within:bg-violet-500/10 transition-all duration-500" />
              <div className="relative flex items-center gap-2 bg-zinc-950/80 border border-white/10 rounded-2xl p-2 transition-all group-focus-within:border-violet-500/50">
                <input 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Invoke intelligence..."
                  className="flex-1 bg-transparent border-none outline-none pl-3 text-sm text-white placeholder:text-zinc-600"
                />
                <button 
                  type="submit"
                  className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          </div>
        </GlassPanel>

        {/* ── Main Canvas (Workbench) ── */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          
          <GlassPanel className="flex-1 relative flex flex-col">
            {/* Workbench Toolbar */}
            <div className="h-14 flex items-center justify-between px-6 border-b border-white/5 bg-white/2">
              <div className="flex items-center gap-6">
                <div className="flex gap-4">
                  <button 
                    onClick={() => setView('preview')}
                    className={`text-xs font-bold tracking-widest transition-colors ${view === 'preview' ? 'text-violet-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    PREVIEW
                  </button>
                  <button 
                    onClick={() => setView('code')}
                    className={`text-xs font-bold tracking-widest transition-colors ${view === 'code' ? 'text-violet-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    SOURCE
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5 mr-4">
                  <button onClick={() => setDevice('desktop')} className={`p-1.5 rounded-lg transition-all ${device === 'desktop' ? 'bg-white/10 text-white' : 'text-zinc-600'}`}><Monitor size={14}/></button>
                  <button onClick={() => setDevice('mobile')} className={`p-1.5 rounded-lg transition-all ${device === 'mobile' ? 'bg-white/10 text-white' : 'text-zinc-600'}`}><Smartphone size={14}/></button>
                </div>
                <button className="p-2 text-zinc-500 hover:text-white transition-colors"><RefreshCw size={16}/></button>
                <button className="p-2 text-zinc-500 hover:text-white transition-colors"><Download size={16}/></button>
                <div className="w-px h-4 bg-white/10 mx-2" />
                <button className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-bold rounded-xl shadow-lg shadow-violet-500/20 transition-all">
                  <Wand2 size={14} />
                  PUBLISH
                </button>
              </div>
            </div>

            {/* Stage */}
            <div className="flex-1 relative bg-[radial-gradient(#1a1a1a_1.5px,transparent_1.5px)] [background-size:24px_24px] overflow-hidden flex items-center justify-center p-12">
              <AnimatePresence mode="wait">
                {view === 'preview' ? (
                  <motion.div 
                    key="preview"
                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.02, y: -10 }}
                    className="relative z-10 transition-all duration-700 shadow-[0_40px_100px_rgba(0,0,0,0.8)]"
                    style={{ 
                      width: device === 'desktop' ? '100%' : '375px',
                      height: '100%',
                      maxWidth: '1200px'
                    }}
                  >
                    {/* Glass Frame */}
                    <div className="absolute -inset-[1px] bg-gradient-to-b from-white/20 to-transparent rounded-[2.5rem] -z-10" />
                    <div className="w-full h-full bg-black rounded-[2.4rem] overflow-hidden border border-white/5">
                      <iframe srcDoc={previewDoc} className="w-full h-full border-0" />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="code"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="w-full h-full max-w-5xl bg-zinc-950 rounded-[2rem] border border-white/5 p-8 overflow-hidden flex flex-col"
                  >
                    <textarea 
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      spellCheck={false}
                      className="flex-1 bg-transparent border-none outline-none text-zinc-400 font-mono text-sm leading-relaxed resize-none"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Stage Lighting */}
              <div className="absolute top-0 left-1/4 w-1/2 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
              <div className="absolute bottom-0 left-1/4 w-1/2 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
            </div>
          </GlassPanel>

        </div>
      </div>

      {/* ── Global Floating Dock ── */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="flex items-center gap-2 p-2 bg-zinc-900/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-2xl"
        >
          <DockIcon active={tab === 'chat'} onClick={() => setTab('chat')} icon={MessageSquare} label="Intelligence" />
          <div className="w-px h-6 bg-white/10 mx-1" />
          <DockIcon active={tab === 'builder'} onClick={() => setTab('builder')} icon={Box} label="Architect" />
          <DockIcon active={false} onClick={() => {}} icon={Grid} label="Components" />
          <div className="w-px h-6 bg-white/10 mx-1" />
          <DockIcon active={false} onClick={() => {}} icon={Layout} label="Settings" />
        </motion.div>
      </div>

      {/* Background Ambience */}
      <div className="fixed top-[-10%] right-[-5%] w-[500px] h-[500px] bg-violet-600/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none" />
    </div>
  );
}