'use client';

import React, { useState } from 'react';
import { LayoutDashboard, Users, Zap, LogOut, ChevronLeft, ChevronRight, Menu, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CRMPanel from './CRMPanel';
import EmailGeneratorPanel from './EmailGeneratorPanel';
import StatsPanel from './StatsPanel';
import WhatsAppPanel from './WhatsAppPanel';

const navItems = [
  { id: 'dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { id: 'crm',       label: 'CRM',        icon: Users },
  { id: 'generator', label: 'AI Email',   icon: Zap },
  { id: 'whatsapp',  label: 'WhatsApp',   icon: MessageCircle },
];

const pageTitle: Record<string, string> = {
  dashboard: 'Dashboard',
  crm: 'CRM Pipeline',
  generator: 'AI Email Generator',
  whatsapp: 'WhatsApp Outreach',
};

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [active, setActive] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);

  const sidebarW = collapsed ? 'w-[68px]' : 'w-64';
  const mainML   = collapsed ? 'lg:ml-[68px]' : 'lg:ml-64';

  return (
    <div className="min-h-screen bg-[#020202] text-white flex">

      {/* ── Desktop sidebar ── */}
      <aside
        className={`hidden lg:flex fixed inset-y-0 left-0 z-50 ${sidebarW} bg-[#0A0A0A] border-r border-white/5 flex-col transition-all duration-300 overflow-hidden`}
      >
        {/* Logo row */}
        <div className={`flex items-center border-b border-white/5 h-[65px] px-4 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-gradient-to-br from-[#00D67D] to-blue-600 flex items-center justify-center font-bold text-black text-sm">
              S
            </div>
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  <div className="font-bold text-sm">Spacze Admin</div>
                  <div className="text-[10px] text-slate-500 font-mono">Outreach Engine</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Collapse toggle */}
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="flex-shrink-0 p-1.5 rounded-lg text-slate-600 hover:text-white hover:bg-white/5 transition-colors"
              title="Collapse sidebar"
            >
              <ChevronLeft size={15} />
            </button>
          )}
        </div>

        {/* Expand button when collapsed */}
        {collapsed && (
          <div className="flex justify-center pt-2 pb-1">
            <button
              onClick={() => setCollapsed(false)}
              className="p-1.5 rounded-lg text-slate-600 hover:text-white hover:bg-white/5 transition-colors"
              title="Expand sidebar"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              title={collapsed ? label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                collapsed ? 'justify-center' : ''
              } ${
                active === id
                  ? 'bg-[#00D67D]/10 text-[#00D67D] border border-[#00D67D]/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon size={16} className="flex-shrink-0" />
              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/5">
          <button
            onClick={onLogout}
            title={collapsed ? 'Sign Out' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200 ${collapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={16} className="flex-shrink-0" />
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  Sign Out
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className={`flex-1 ${mainML} flex flex-col min-h-screen pb-20 lg:pb-0 transition-all duration-300`}>

        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-[#020202]/90 backdrop-blur border-b border-white/5 px-4 lg:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-base">{pageTitle[active]}</h1>
            <p className="text-[10px] text-slate-500 font-mono">Spacze Outreach Engine</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00D67D]/10 border border-[#00D67D]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D67D] animate-pulse" />
              <span className="hidden sm:inline text-[10px] font-mono text-[#00D67D] uppercase tracking-wider">Online</span>
            </div>
            <button
              onClick={onLogout}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-colors"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {active === 'dashboard' && <StatsPanel onNavigate={setActive} />}
              {active === 'crm'       && <CRMPanel />}
              {active === 'generator' && <EmailGeneratorPanel />}
              {active === 'whatsapp'  && <WhatsAppPanel />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0A0A0A]/95 backdrop-blur border-t border-white/5 flex">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={`relative flex-1 flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-mono uppercase tracking-wider transition-colors duration-200 ${
              active === id ? 'text-[#00D67D]' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {active === id && (
              <motion.div
                layoutId="mobile-nav-indicator"
                className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 bg-[#00D67D] rounded-full"
              />
            )}
            <Icon size={18} strokeWidth={active === id ? 2.5 : 1.5} />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
