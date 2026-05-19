'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, Users, Zap, LogOut,
  ChevronLeft, ChevronRight, MessageCircle, Sun, Moon, Terminal,
  Bell, Command, Megaphone, Sparkles, Mail,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CRMPanel from './CRMPanel';
import StatsPanel from './StatsPanel';
import WhatsAppPanel from './WhatsAppPanel';
import OutreachPanel from './OutreachPanel';
import TerminalPanel from './TerminalPanel';
import EmailGeneratorPanel from './EmailGeneratorPanel';

const navItems = [
  { id: 'dashboard', label: 'Dashboard',  icon: LayoutDashboard, group: 'main' },
  { id: 'crm',       label: 'CRM',        icon: Users,           group: 'main' },
  { id: 'email',     label: 'Email',      icon: Mail,            group: 'main' },
  { id: 'copy',      label: 'AI Copy',    icon: Sparkles,        group: 'main' },
  { id: 'campaigns', label: 'Campaigns',  icon: Megaphone,       group: 'main' },
  { id: 'whatsapp',  label: 'WhatsApp',   icon: MessageCircle,   group: 'main' },
  { id: 'terminal',  label: 'Settings',   icon: Terminal,        group: 'system' },
];

const pageInfo: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard',        subtitle: 'Overview & analytics' },
  crm:       { title: 'CRM',              subtitle: 'Manage leads & outreach' },
  email:     { title: 'Email Outreach',   subtitle: '4-step AI email sequence per lead' },
  copy:      { title: 'AI Copy',          subtitle: 'Generate outreach copy per channel' },
  campaigns: { title: 'Campaigns',        subtitle: 'Sequences & scheduled messages' },
  whatsapp:  { title: 'WhatsApp',         subtitle: 'Bulk messaging via Baileys' },
  terminal:  { title: 'Settings',         subtitle: 'API keys & configuration' },
};

function useKeyboardNav(setActive: (id: string) => void) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.altKey) {
        const map: Record<string, string> = { '1': 'dashboard', '2': 'crm', '3': 'email', '4': 'copy', '5': 'campaigns', '6': 'whatsapp', '7': 'terminal' };
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
  const [active, setActive]       = useState('dashboard');
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
    <div className="min-h-screen flex admin-bg admin-text" data-theme={theme}>

      {/* Sidebar */}
      <aside className={`hidden lg:flex fixed inset-y-0 left-0 z-50 ${sidebarW} admin-sidebar border-r admin-border flex-col transition-all duration-200 overflow-hidden`}>
        {/* Logo row */}
        <div className={`flex items-center h-[56px] px-3 border-b admin-border flex-shrink-0 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 flex-shrink-0 rounded-lg bg-gradient-to-br from-[#00D67D] to-[#0066ff] flex items-center justify-center font-black text-white text-[11px] shadow-lg shadow-[#00D67D]/20">
              S
            </div>
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.15 }}
                  className="overflow-hidden whitespace-nowrap">
                  <div className="font-bold text-[13px] admin-text leading-tight tracking-tight">Spacze</div>
                  <div className="text-[9px] admin-muted font-mono tracking-widest uppercase opacity-60">Command Centre</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {!collapsed && (
            <button onClick={() => setCollapsed(true)} className="flex-shrink-0 p-1.5 rounded-lg admin-muted admin-hover transition-colors" title="Collapse">
              <ChevronLeft size={12} />
            </button>
          )}
        </div>

        {collapsed && (
          <div className="flex justify-center pt-2">
            <button onClick={() => setCollapsed(false)} className="p-1.5 rounded-lg admin-muted admin-hover transition-colors" title="Expand">
              <ChevronRight size={12} />
            </button>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5 overflow-y-auto">
          {!collapsed && <p className="text-[9px] font-mono admin-subtle uppercase tracking-widest px-2 pb-1.5">Menu</p>}
          {mainItems.map(({ id, label, icon: Icon }) => (
            <NavButton key={id} id={id} label={label} Icon={Icon} active={active} collapsed={collapsed} onClick={() => setActive(id)} />
          ))}
          <div className="flex-1 min-h-[16px]" />
          {!collapsed && <p className="text-[9px] font-mono admin-subtle uppercase tracking-widest px-2 pb-1.5">System</p>}
          {systemItems.map(({ id, label, icon: Icon }) => (
            <NavButton key={id} id={id} label={label} Icon={Icon} active={active} collapsed={collapsed} onClick={() => setActive(id)} />
          ))}
        </nav>

        {/* Footer */}
        <div className="px-2 py-3 border-t admin-border flex-shrink-0 space-y-0.5">
          {!collapsed && (
            <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D67D] pulse-dot flex-shrink-0" />
              <span className="text-[9px] font-mono admin-muted uppercase tracking-widest">System Online</span>
            </div>
          )}
          <button onClick={onLogout} title={collapsed ? 'Sign Out' : undefined}
            className={`nav-item nav-item-inactive hover:!text-red-400 hover:!bg-red-500/5 w-full ${collapsed ? 'justify-center !px-0' : ''}`}>
            <LogOut size={14} className="flex-shrink-0" />
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.15 }}
                  className="overflow-hidden whitespace-nowrap text-[12px]">
                  Sign Out
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className={`flex-1 ${mainML} flex flex-col min-h-screen pb-20 lg:pb-0 transition-all duration-200`}>

        {/* Topbar */}
        <header className="sticky top-0 z-30 admin-header backdrop-blur border-b admin-border px-5 lg:px-6 h-[56px] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="hidden lg:flex items-center gap-1 text-[10px] font-mono admin-subtle mr-1">
              <span>spacze</span><span className="opacity-40">/</span>
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-[13px] admin-text leading-tight truncate">{page.title}</h1>
              <p className="text-[10px] admin-muted font-mono truncate hidden sm:block">{page.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="hidden xl:flex items-center gap-1 px-2 py-1 rounded-lg border admin-border admin-muted text-[10px] font-mono opacity-40 select-none">
              <Command size={10} /> K
            </div>
            <button className="p-2 rounded-xl admin-hover border admin-border transition-colors admin-muted" title="Notifications">
              <Bell size={13} />
            </button>
            <button onClick={toggleTheme} className="p-2 rounded-xl admin-hover border admin-border transition-colors" title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
              {theme === 'dark' ? <Sun size={13} className="text-yellow-400" /> : <Moon size={13} className="text-slate-500" />}
            </button>
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border accent-bg accent-border">
              <span className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ background: 'var(--accent)' }} />
              <span className="text-[9px] font-mono font-semibold uppercase tracking-wider accent-text">Live</span>
            </div>
            <button onClick={onLogout} className="lg:hidden p-2 rounded-xl admin-muted hover:text-red-400 hover:bg-red-500/5 transition-colors" title="Sign out">
              <LogOut size={14} />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6">
          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}>
              {active === 'dashboard' && <StatsPanel onNavigate={setActive} />}
              {active === 'crm'       && <CRMPanel />}
              {active === 'email'     && <EmailGeneratorPanel />}
              {active === 'copy'      && <OutreachPanel defaultTab="copy" />}
              {active === 'campaigns' && <OutreachPanel defaultTab="campaigns" />}
              {active === 'whatsapp'  && <WhatsAppPanel />}
              {active === 'terminal'  && <TerminalPanel />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 backdrop-blur border-t admin-border flex" style={{ backgroundColor: 'var(--admin-mob-nav)' }}>
        {navItems.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActive(id)}
            className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 py-3 text-[8px] font-mono uppercase tracking-wider transition-colors duration-200 ${active === id ? 'accent-text' : 'admin-muted'}`}>
            {active === id && (
              <motion.div layoutId="mob-nav-bar" className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-6 rounded-full" style={{ background: 'var(--accent)' }} />
            )}
            <Icon size={16} strokeWidth={active === id ? 2.5 : 1.5} />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
