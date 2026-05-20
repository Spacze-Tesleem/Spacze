'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, Users, LogOut,
  ChevronLeft, ChevronRight, MessageCircle, Sun, Moon, Terminal,
  Bell, Command, Megaphone, Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StatsPanel from './StatsPanel';
import CRMPanel from './CRMPanel';
import CampaignsPanel from './CampaignsPanel';
import AIStudioPanel from './AIStudioPanel';
import WhatsAppPanel from './WhatsAppPanel';
import TerminalPanel from './TerminalPanel';

const navItems = [
  { id: 'overview',   label: 'Overview',   icon: LayoutDashboard, group: 'main' },
  { id: 'audience',   label: 'Audience',   icon: Users,           group: 'main' },
  { id: 'campaigns',  label: 'Campaigns',  icon: Megaphone,       group: 'main' },
  { id: 'ai-studio',  label: 'AI Studio',  icon: Sparkles,        group: 'main' },
  { id: 'whatsapp',   label: 'WhatsApp',   icon: MessageCircle,   group: 'main' },
  { id: 'settings',   label: 'Settings',   icon: Terminal,        group: 'system' },
];

const pageInfo: Record<string, { title: string; subtitle: string }> = {
  overview:  { title: 'Overview',    subtitle: 'Analytics & performance at a glance' },
  audience:  { title: 'Audience',    subtitle: 'Leads, segments & outreach status' },
  campaigns: { title: 'Campaigns',   subtitle: 'Multi-channel sequences & scheduling' },
  'ai-studio': { title: 'AI Studio', subtitle: 'Copy generator & email sequences' },
  whatsapp:  { title: 'WhatsApp',    subtitle: 'Bulk messaging via Baileys' },
  settings:  { title: 'Settings',    subtitle: 'API keys & configuration' },
};

function useKeyboardNav(setActive: (id: string) => void) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.altKey) {
        const map: Record<string, string> = { '1': 'overview', '2': 'audience', '3': 'campaigns', '4': 'ai-studio', '5': 'whatsapp', '6': 'settings' };
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
    <div className="min-h-screen flex bg-zinc-950 text-zinc-200 selection:bg-[#00D67D]/30" data-theme={theme}>
      
      {/* Sidebar - Sleek & Modern */}
      <aside className={`hidden lg:flex fixed inset-y-0 left-0 z-50 ${sidebarW} bg-zinc-950/80 backdrop-blur-xl border-r border-white/5 flex-col transition-all duration-300 overflow-hidden`}>
        {/* Logo area */}
        <div className={`flex items-center h-20 px-4 flex-shrink-0 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#00D67D] to-emerald-900 flex items-center justify-center font-bold text-black text-sm shadow-[0_0_15px_rgba(0,214,125,0.2)]">
              S
            </div>
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="overflow-hidden whitespace-nowrap">
                  <div className="font-semibold text-sm tracking-tight text-white">Spacze</div>
                  <div className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">Admin</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {!collapsed && <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider px-3 pb-2">Menu</p>}
          {mainItems.map(({ id, label, icon: Icon }) => {
            const isActive = active === id;
            return (
              <button key={id} onClick={() => setActive(id)} title={collapsed ? label : undefined}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'}`}>
                {isActive && <motion.div layoutId="sidebar-active" className="absolute inset-0 bg-white/10 rounded-lg" />}
                <Icon size={16} className={`relative z-10 ${isActive ? 'text-[#00D67D]' : 'group-hover:text-zinc-300'}`} />
                {!collapsed && <span className="relative z-10">{label}</span>}
              </button>
            )
          })}
        </nav>

        {/* Footer actions */}
        <div className="p-3 border-t border-white/5">
           <button onClick={() => setCollapsed(!collapsed)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-all w-full mb-2">
             {collapsed ? <ChevronRight size={16}/> : <ChevronLeft size={16}/>}
             {!collapsed && <span>Collapse</span>}
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 min-w-0 ${mainML} flex flex-col min-h-screen transition-all duration-300 bg-[#050505]`}>
        
        {/* Floating Topbar */}
        <div className="p-4 lg:p-6 pb-0 sticky top-0 z-40">
          <header className="bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-2xl px-6 h-16 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <div className="min-w-0">
                <h1 className="font-semibold text-sm text-white tracking-tight">{page.title}</h1>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#00D67D]/10 border border-[#00D67D]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D67D] animate-pulse" />
                <span className="text-[10px] font-semibold text-[#00D67D] uppercase tracking-wider">Live System</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 border border-white/5 text-[11px] font-mono text-zinc-500">
                <Command size={12} /> K
              </div>
              <div className="h-4 w-px bg-white/10 mx-2 hidden sm:block"></div>
              <button className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"><Bell size={16} /></button>
              <button onClick={toggleTheme} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
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
              {active === 'overview'  && <StatsPanel onNavigate={setActive} />}
              {active === 'audience'  && <CRMPanel />}
              {active === 'campaigns' && <CampaignsPanel />}
              {active === 'ai-studio' && <AIStudioPanel />}
              {active === 'whatsapp'  && <WhatsAppPanel />}
              {active === 'settings'  && <TerminalPanel />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
