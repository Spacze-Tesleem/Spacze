'use client';

import React, { useState } from 'react';
import { LayoutDashboard, Users, Mail, Send, LogOut, Menu, X, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CRMPanel from './CRMPanel';
import EmailGeneratorPanel from './EmailGeneratorPanel';
import StatsPanel from './StatsPanel';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'crm', label: 'CRM Pipeline', icon: Users },
  { id: 'generator', label: 'AI Email Generator', icon: Zap },
];

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [active, setActive] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#020202] text-white flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0A0A0A] border-r border-white/5 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        {/* Logo */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00D67D] to-blue-600 flex items-center justify-center font-bold text-black text-sm">S</div>
            <div>
              <div className="font-bold text-sm">Spacze Admin</div>
              <div className="text-[10px] text-slate-500 font-mono">Outreach Engine</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setActive(id); setSidebarOpen(false); }}
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

        {/* Logout */}
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

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-[#020202]/80 backdrop-blur border-b border-white/5 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-400 hover:text-white">
              <Menu size={20} />
            </button>
            <div>
              <h1 className="font-bold text-base capitalize">{active === 'dashboard' ? 'Dashboard' : active === 'crm' ? 'CRM Pipeline' : 'AI Email Generator'}</h1>
              <p className="text-xs text-slate-500">Spacze Outreach Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00D67D]/10 border border-[#00D67D]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D67D] animate-pulse" />
            <span className="text-[10px] font-mono text-[#00D67D] uppercase tracking-wider">System Online</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          {active === 'dashboard' && <StatsPanel onNavigate={setActive} />}
          {active === 'crm' && <CRMPanel />}
          {active === 'generator' && <EmailGeneratorPanel />}
        </main>
      </div>
    </div>
  );
}
