'use client';

import React, { useState } from 'react';
import { LayoutDashboard, Users, Zap, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CRMPanel from './CRMPanel';
import EmailGeneratorPanel from './EmailGeneratorPanel';
import StatsPanel from './StatsPanel';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'crm',       label: 'CRM',       icon: Users },
  { id: 'generator', label: 'AI Email',  icon: Zap },
];

const pageTitle: Record<string, string> = {
  dashboard: 'Dashboard',
  crm: 'CRM Pipeline',
  generator: 'AI Email Generator',
};

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [active, setActive] = useState('dashboard');

  return (
    <div className="min-h-screen bg-[#020202] text-white flex">

      {/* Desktop sidebar (lg+) */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-50 w-64 bg-[#0A0A0A] border-r border-white/5 flex-col">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00D67D] to-blue-600 flex items-center justify-center font-bold text-black text-sm">S</div>
            <div>
              <div className="font-bold text-sm">Spacze Admin</div>
              <div className="text-[10px] text-slate-500 font-mono">Outreach Engine</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                active === id
                  ? 'bg-[#00D67D]/10 text-[#00D67D] border border-[#00D67D]/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen pb-20 lg:pb-0">

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
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile bottom nav (< lg) */}
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
