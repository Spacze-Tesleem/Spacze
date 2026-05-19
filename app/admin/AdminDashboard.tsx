'use client';

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, Sparkles, Megaphone, LogOut,
  ChevronLeft, ChevronRight, MessageCircle, Sun, Moon, Terminal,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CRMPanel from './CRMPanel';
import StatsPanel from './StatsPanel';
import WhatsAppPanel from './WhatsAppPanel';
import AICopyPanel from './AICopyPanel';
import CampaignsPanel from './CampaignsPanel';
import TerminalPanel from './TerminalPanel';

const navItems = [
  { id: 'dashboard', label: 'Dashboard',   icon: LayoutDashboard },
  { id: 'crm',       label: 'CRM',         icon: Users },
  { id: 'copy',      label: 'AI Copy',     icon: Sparkles },
  { id: 'campaigns', label: 'Campaigns',   icon: Megaphone },
  { id: 'whatsapp',  label: 'WhatsApp',    icon: MessageCircle },
  { id: 'terminal',  label: 'Settings',    icon: Terminal },
];

const pageInfo: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard',         subtitle: 'Overview & analytics' },
  crm:       { title: 'CRM Pipeline',      subtitle: 'Manage leads & outreach' },
  copy:      { title: 'AI Copy Generator', subtitle: 'Multi-platform content' },
  campaigns: { title: 'Campaigns',         subtitle: 'Sequences & scheduling' },
  whatsapp:  { title: 'WhatsApp Outreach', subtitle: 'Bulk messaging via Baileys' },
  terminal:  { title: 'Settings',          subtitle: 'API keys & configuration' },
};

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [active, setActive]       = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme]         = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('spacze-admin-theme') as 'dark' | 'light' | null;
    if (saved) setTheme(saved);
  }, []);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('spacze-admin-theme', next);
  }

  const sidebarW = collapsed ? 'w-[64px]' : 'w-[220px]';
  const mainML   = collapsed ? 'lg:ml-[64px]' : 'lg:ml-[220px]';
  const page     = pageInfo[active];

  return (
    <div className="min-h-screen flex admin-bg admin-text" data-theme={theme}>

      {/* ── Desktop Sidebar ── */}
      <aside className={`hidden lg:flex fixed inset-y-0 left-0 z-50 ${sidebarW} admin-sidebar border-r admin-border flex-col transition-all duration-300 overflow-hidden`}>

        {/* Logo row */}
        <div className={`flex items-center h-[60px] px-4 border-b admin-border flex-shrink-0 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 flex-shrink-0 rounded-lg bg-gradient-to-br from-[#00D67D] to-blue-500 flex items-center justify-center font-black text-black text-xs shadow-lg">
              S
            </div>
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.18 }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  <div className="font-bold text-[13px] admin-text leading-tight">Spacze</div>
                  <div className="text-[9px] admin-muted font-mono tracking-widest uppercase">Command Centre</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {!collapsed && (
            <button onClick={() => setCollapsed(true)} className="flex-shrink-0 p-1.5 rounded-lg admin-muted admin-hover transition-colors" title="Collapse">
              <ChevronLeft size={13} />
            </button>
          )}
        </div>

        {collapsed && (
          <div className="flex justify-center pt-2">
            <button onClick={() => setCollapsed(false)} className="p-1.5 rounded-lg admin-muted admin-hover transition-colors" title="Expand">
              <ChevronRight size={13} />
            </button>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
          {!collapsed && <p className="label-xs px-2 pb-2 pt-1">Navigation</p>}
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              title={collapsed ? label : undefined}
              className={`nav-item ${collapsed ? 'justify-center !px-0' : ''} ${active === id ? 'nav-item-active' : 'nav-item-inactive'}`}
            >
              <Icon size={15} className="flex-shrink-0" />
              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.18 }}
                    className="overflow-hidden whitespace-nowrap text-[13px]"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-2.5 py-3 border-t admin-border space-y-0.5 flex-shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-2 px-3 py-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D67D] pulse-dot flex-shrink-0" />
              <span className="text-[10px] font-mono admin-muted uppercase tracking-widest">System Online</span>
            </div>
          )}
          <button
            onClick={onLogout}
            title={collapsed ? 'Sign Out' : undefined}
            className={`nav-item nav-item-inactive hover:!text-red-400 hover:!bg-red-500/5 ${collapsed ? 'justify-center !px-0' : ''}`}
          >
            <LogOut size={15} className="flex-shrink-0" />
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.18 }}
                  className="overflow-hidden whitespace-nowrap text-[13px]"
                >
                  Sign Out
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className={`flex-1 ${mainML} flex flex-col min-h-screen pb-20 lg:pb-0 transition-all duration-300`}>

        {/* Topbar */}
        <header className="sticky top-0 z-30 admin-header backdrop-blur border-b admin-border px-5 lg:px-7 h-[60px] flex items-center justify-between flex-shrink-0">
          <div className="min-w-0">
            <h1 className="font-bold text-[14px] admin-text leading-tight truncate">{page.title}</h1>
            <p className="text-[10px] admin-muted font-mono truncate">{page.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl admin-hover border admin-border transition-colors"
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark'
                ? <Sun size={14} className="text-yellow-400" />
                : <Moon size={14} className="text-slate-500" />}
            </button>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border accent-bg accent-border">
              <span className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ background: 'var(--accent)' }} />
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider accent-text">Live</span>
            </div>
            <button onClick={onLogout} className="lg:hidden p-2 rounded-xl admin-muted hover:text-red-400 hover:bg-red-500/5 transition-colors" title="Sign out">
              <LogOut size={15} />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 xl:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              {active === 'dashboard' && <StatsPanel onNavigate={setActive} />}
              {active === 'crm'       && <CRMPanel />}
              {active === 'copy'      && <AICopyPanel />}
              {active === 'campaigns' && <CampaignsPanel />}
              {active === 'whatsapp'  && <WhatsAppPanel />}
              {active === 'terminal'  && <TerminalPanel />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 backdrop-blur border-t admin-border flex" style={{ backgroundColor: 'var(--admin-mob-nav)' }}>
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={`relative flex-1 flex flex-col items-center justify-center gap-1 py-3 text-[9px] font-mono uppercase tracking-wider transition-colors duration-200 ${active === id ? 'accent-text' : 'admin-muted'}`}
          >
            {active === id && (
              <motion.div layoutId="mob-nav-bar" className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-8 rounded-full" style={{ background: 'var(--accent)' }} />
            )}
            <Icon size={17} strokeWidth={active === id ? 2.5 : 1.5} />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
