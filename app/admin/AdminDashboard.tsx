'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, Users, LogOut,
  ChevronLeft, ChevronRight, MessageCircle, Sun, Moon, Terminal,
  Bell, Command, Megaphone, Sparkles, BrainCircuit, BarChart2, Bot,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StatsPanel from './StatsPanel';
import CRMPanel from './CRMPanel';
import CampaignsPanel from './CampaignsPanel';
import AIStudioPanel from './AIStudioPanel';
import WhatsAppPanel from './WhatsAppPanel';
import TerminalPanel from './TerminalPanel';
import SAIPanel from './SAIPanel';
import AgentPanel from './AgentPanel';
import { ToastStack, useToast } from '@/app/components/Toast';

const navItems = [
  { id: 'overview',   label: 'Overview',   icon: LayoutDashboard, group: 'main' },
  { id: 'audience',   label: 'Audience',   icon: Users,           group: 'main' },
  { id: 'campaigns',  label: 'Campaigns',  icon: Megaphone,       group: 'main' },
  { id: 'ai-studio',  label: 'AI Studio',  icon: Sparkles,        group: 'main' },
  { id: 'analytics',  label: 'Analytics',  icon: BarChart2,       group: 'main' },
  { id: 'whatsapp',   label: 'WhatsApp',   icon: MessageCircle,   group: 'main' },
  { id: 'sai',        label: 'SAI',        icon: BrainCircuit,    group: 'main' },
  { id: 'agent',      label: 'Agent',      icon: Bot,             group: 'main' },
  { id: 'settings',   label: 'Settings',   icon: Terminal,        group: 'system' },
];

const pageInfo: Record<string, { title: string; subtitle: string }> = {
  overview:    { title: 'Overview',    subtitle: 'KPIs & quick actions at a glance' },
  audience:    { title: 'Audience',    subtitle: 'Leads, segments & outreach status' },
  campaigns:   { title: 'Campaigns',   subtitle: 'Multi-channel sequences & scheduling' },
  'ai-studio': { title: 'AI Studio',   subtitle: 'Copy generator & email sequences' },
  analytics:   { title: 'Analytics',   subtitle: 'Charts, funnels & campaign performance' },
  whatsapp:    { title: 'WhatsApp',    subtitle: 'Bulk messaging via Baileys' },
  sai:         { title: 'Spacze AI',   subtitle: 'Client website intelligence & content hub' },
  agent:       { title: 'Agent',       subtitle: 'Autonomous AI operator — reason, plan, execute' },
  settings:    { title: 'Settings',    subtitle: 'API keys & configuration' },
};

function useKeyboardNav(setActive: (id: string) => void) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.altKey) {
        const map: Record<string, string> = { '1': 'overview', '2': 'audience', '3': 'campaigns', '4': 'ai-studio', '5': 'analytics', '6': 'whatsapp', '7': 'sai', '8': 'agent', '9': 'settings' };
        if (map[e.key]) { e.preventDefault(); setActive(map[e.key]); }
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setActive]);
}

function NavButton({ id, label, Icon, active, collapsed, onClick }: {
  id: string; label: string; Icon: React.ElementType;
  active: string; collapsed: boolean; onClick: () => void;
}) {
  const isActive = active === id;
  return (
    <button onClick={onClick} title={collapsed ? label : undefined}
      className={`nav-item ${collapsed ? 'justify-center !px-0' : ''} ${isActive ? 'nav-item-active' : 'nav-item-inactive'} w-full`}>
      <Icon size={14} className="flex-shrink-0" />
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.15 }}
            className="overflow-hidden whitespace-nowrap text-[12px]">
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [active, setActive]       = useState('overview');
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme]         = useState<'dark' | 'light'>('dark');
  const { toasts, dismiss }       = useToast();

  useEffect(() => {
    const saved = localStorage.getItem('spacze-admin-theme') as 'dark' | 'light' | null;
    if (saved) setTheme(saved);
  }, []);

  const navigate = useCallback((id: string) => setActive(id), []);
  useKeyboardNav(navigate);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('spacze-admin-theme', next);
  }

  const sidebarW = collapsed ? 'w-[60px]' : 'w-[210px]';
  const mainML   = collapsed ? 'lg:ml-[60px]' : 'lg:ml-[210px]';
  const page     = pageInfo[active];
  const mainItems   = navItems.filter(n => n.group === 'main');
  const systemItems = navItems.filter(n => n.group === 'system');

  return (
    <div className="min-h-screen flex admin-bg admin-text selection:bg-[#00D67D]/30 pb-20 lg:pb-0" data-theme={theme}>

      {/* Global toast notifications — float over all panels */}
      <ToastStack toasts={toasts} onDismiss={dismiss} />

      {/* Sidebar */}
      <aside className={`hidden lg:flex fixed inset-y-0 left-0 z-50 ${sidebarW} admin-sidebar border-r admin-border flex-col transition-all duration-300 overflow-hidden`}>
        {/* Logo area */}
        <div className={`flex items-center h-20 px-4 flex-shrink-0 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Spacze flame icon — matches brand mark */}
            <div className="flex-shrink-0 w-8 h-8 drop-shadow-[0_0_8px_rgba(0,214,125,0.25)]">
              <svg viewBox="0 0 100 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <defs>
                  <linearGradient id="flame-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#00D67D" />
                    <stop offset="50%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#a78bfa" />
                  </linearGradient>
                </defs>
                {/* Upper flame lobe */}
                <path
                  d="M72 8 C90 28 88 58 62 68 C80 48 74 28 56 22 C64 36 58 54 42 60 C52 40 46 18 28 10 C44 30 38 56 18 72 C10 90 18 118 42 132 C28 112 34 88 54 78 C36 98 42 124 62 136 C78 148 96 138 96 118 C96 98 80 88 72 72 C88 60 92 36 72 8Z"
                  fill="url(#flame-grad)"
                  opacity="0.95"
                />
                {/* Inner shadow lobe for depth */}
                <path
                  d="M54 78 C36 98 42 124 62 136 C46 122 44 100 58 88 C50 104 54 122 66 130 C80 118 78 96 66 84 C74 96 72 114 62 122 C52 108 54 90 62 78 C58 82 54 78 54 78Z"
                  fill="rgba(0,0,0,0.25)"
                />
              </svg>
            </div>

            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  {/* Wordmark: SPA in cyan→green, CZE in silver */}
                  <div className="font-black text-[15px] tracking-tight leading-none">
                    <span className="bg-gradient-to-r from-[#38bdf8] via-[#00D67D] to-[#00D67D] bg-clip-text text-transparent">SPA</span>
                    <span className="bg-gradient-to-r from-[#c0c0c0] via-white to-[#a0a0a0] bg-clip-text text-transparent">CZE</span>
                  </div>
                  <div className="text-[9px] admin-muted font-mono tracking-[0.2em] uppercase mt-0.5">Command</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {!collapsed && <p className="label-xs px-3 pb-2">Menu</p>}
          {mainItems.map(({ id, label, icon: Icon }) => (
            <NavButton key={id} id={id} label={label} Icon={Icon} active={active} collapsed={collapsed} onClick={() => setActive(id)} />
          ))}
          {systemItems.length > 0 && (
            <>
              {!collapsed && <p className="label-xs px-3 pt-4 pb-2">System</p>}
              {collapsed && <div className="my-2 border-t admin-border" />}
              {systemItems.map(({ id, label, icon: Icon }) => (
                <NavButton key={id} id={id} label={label} Icon={Icon} active={active} collapsed={collapsed} onClick={() => setActive(id)} />
              ))}
            </>
          )}
        </nav>

        {/* Footer actions */}
        <div className="p-3 border-t admin-border">
           <button onClick={() => setCollapsed(!collapsed)} className="nav-item nav-item-inactive w-full mb-2">
             {collapsed ? <ChevronRight size={14}/> : <ChevronLeft size={14}/>}
             {!collapsed && <span className="text-[12px]">Collapse</span>}
           </button>
        </div>
      </aside>

      {/* Mobile bottom navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/90 backdrop-blur-2xl border-t border-white/10 flex items-center justify-around px-2 pt-2 pb-[env(safe-area-inset-bottom,8px)] h-16">
        {navItems.slice(0, 5).map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={`flex flex-col items-center gap-1 px-3 py-1 min-w-[52px] transition-colors ${
                isActive ? 'text-[#00D67D]' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon
                size={20}
                className={isActive ? 'drop-shadow-[0_0_8px_rgba(0,214,125,0.5)]' : ''}
              />
              <span className="text-[9px] font-medium tracking-wide leading-none">
                {label.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 min-w-0 ${mainML} flex flex-col min-h-screen transition-all duration-300 admin-bg`}>
        
        {/* Floating Topbar */}
        <div className="p-4 lg:p-6 pb-0 sticky top-0 z-40 bg-[var(--admin-bg)]">
          <header className="admin-header backdrop-blur-md border rounded-2xl px-6 h-16 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <div className="min-w-0">
                <h1 className="font-semibold text-sm admin-text tracking-tight">{page.title}</h1>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#00D67D]/10 border border-[#00D67D]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D67D] animate-pulse" />
                <span className="text-[10px] font-semibold text-[#00D67D] uppercase tracking-wider">Live System</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg admin-surface-2 border admin-border text-[11px] font-mono admin-muted">
                <Command size={12} /> K
              </div>
              <div className="h-4 w-px admin-border mx-2 hidden sm:block"></div>
              <button className="p-2 rounded-lg admin-muted hover:admin-text admin-hover transition-colors"><Bell size={16} /></button>
              <button onClick={toggleTheme} className="p-2 rounded-lg admin-muted hover:admin-text admin-hover transition-colors">
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button onClick={onLogout} className="p-2 rounded-lg text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors ml-1">
                <LogOut size={16} />
              </button>
            </div>
          </header>
        </div>

        {/* Dashboard Views */}
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }} transition={{ duration: 0.2 }}>
              {active === 'overview'   && <StatsPanel onNavigate={setActive} />}
              {active === 'audience'   && <CRMPanel />}
              {active === 'campaigns'  && <CampaignsPanel />}
              {active === 'ai-studio'  && <AIStudioPanel />}
              {active === 'analytics'  && <StatsPanel onNavigate={setActive} hideQuickActions />}
              {active === 'whatsapp'   && <WhatsAppPanel />}
              {active === 'sai'        && <SAIPanel />}
              {active === 'agent'      && <AgentPanel />}
              {active === 'settings'   && <TerminalPanel />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
