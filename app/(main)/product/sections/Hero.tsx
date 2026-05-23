'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Users, Mail, BarChart2, Bot, CheckCircle2 } from 'lucide-react';

const TICKER = ['Email Outreach', 'WhatsApp Sequences', 'AI Lead Scoring', 'Campaign Analytics', 'CRM Automation'];

const MOCK_LEADS = [
  { name: 'Konga Logistics', status: 'Meeting Booked', score: 9, channel: 'Email' },
  { name: 'Zara Fashion NG', status: 'Replied',        score: 7, channel: 'WhatsApp' },
  { name: 'PayStack Clone',  status: 'Sent',           score: 8, channel: 'Email' },
  { name: 'Jumia Vendor Co', status: 'Pending',        score: 6, channel: 'WhatsApp' },
];

const STATUS_COLOR: Record<string, string> = {
  'Meeting Booked': 'text-purple-400',
  'Replied':        'text-blue-400',
  'Sent':           'text-[#00D67D]',
  'Pending':        'text-amber-400',
};

function DashboardMockup() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive(p => (p + 1) % MOCK_LEADS.length), 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
      className="relative w-full max-w-[520px] mx-auto"
    >
      {/* Glow */}
      <div className="absolute -inset-4 bg-[#00D67D]/10 blur-[60px] rounded-3xl pointer-events-none" />

      {/* Main card */}
      <div className="relative bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {/* Topbar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-[#080808]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-[#00D67D] to-blue-500 flex items-center justify-center">
              <Zap size={10} className="text-black fill-black" />
            </div>
            <span className="text-white text-xs font-bold tracking-tight">Spacze Command</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D67D] animate-pulse" />
            <span className="text-[10px] font-mono text-[#00D67D]">LIVE</span>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-3 gap-px bg-white/5 border-b border-white/5">
          {[
            { icon: Users,    label: 'Leads',     value: '248' },
            { icon: Mail,     label: 'Sent',      value: '91'  },
            { icon: BarChart2,label: 'Replies',   value: '34'  },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-[#0A0A0A] px-4 py-3 flex flex-col gap-1">
              <Icon size={12} className="text-zinc-500" />
              <div className="text-lg font-bold text-white leading-none">{value}</div>
              <div className="text-[10px] text-zinc-600 uppercase tracking-wider">{label}</div>
            </div>
          ))}
        </div>

        {/* Lead rows */}
        <div className="divide-y divide-white/5">
          {MOCK_LEADS.map((lead, i) => (
            <motion.div
              key={lead.name}
              animate={{ backgroundColor: active === i ? 'rgba(0,214,125,0.04)' : 'transparent' }}
              className="flex items-center justify-between px-5 py-3 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                  {lead.name[0]}
                </div>
                <div>
                  <div className="text-xs font-medium text-white">{lead.name}</div>
                  <div className="text-[10px] text-zinc-600">{lead.channel}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-zinc-500">{lead.score}/10</span>
                <span className={`text-[10px] font-semibold ${STATUS_COLOR[lead.status]}`}>{lead.status}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Agent bar */}
        <div className="px-5 py-3 bg-[#080808] border-t border-white/5 flex items-center gap-3">
          <Bot size={13} className="text-indigo-400 flex-shrink-0" />
          <span className="text-[11px] text-zinc-500 font-mono">Agent: Generating outreach for 3 pending leads…</span>
          <div className="ml-auto flex gap-0.5">
            {[0,1,2].map(i => (
              <motion.div key={i} className="w-1 h-1 rounded-full bg-indigo-400"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
            ))}
          </div>
        </div>
      </div>

      {/* Floating badge */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-4 -right-4 bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2 shadow-xl flex items-center gap-2"
      >
        <CheckCircle2 size={13} className="text-[#00D67D]" />
        <span className="text-[11px] text-white font-medium">Meeting booked</span>
      </motion.div>
    </motion.div>
  );
}

export default function ProductHero() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(p => (p + 1) % TICKER.length), 2500);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative w-full min-h-screen flex items-center justify-center py-24 bg-[#020202] overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_60%,transparent_100%)]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#00D67D]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 w-full grid lg:grid-cols-2 gap-16 items-center relative z-10">

        {/* Left */}
        <div className="flex flex-col items-start">
          {/* Badge */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="mb-6 flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#00D67D]/20 bg-[#00D67D]/5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D67D] animate-pulse" />
            <span className="text-[11px] font-mono text-[#00D67D] uppercase tracking-widest">Powered by Spacze AI</span>
          </motion.div>

          {/* Headline */}
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-4">
            Turn cold leads into{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D67D] to-blue-400">
              paying clients.
            </span>
          </motion.h1>

          {/* Rotating sub */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="flex items-center gap-2 mb-5 h-7">
            <span className="text-slate-500 text-base">Automate your</span>
            <div className="overflow-hidden h-7 relative w-52">
              <motion.span
                key={tick}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="absolute text-base font-semibold text-white"
              >
                {TICKER[tick]}
              </motion.span>
            </div>
          </motion.div>

          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="text-slate-400 text-base leading-relaxed max-w-md mb-8">
            Spacze Command is an AI-powered outreach platform built for African businesses. Manage your CRM, run multi-channel campaigns, and let an autonomous agent do the follow-up — all in one place.
          </motion.p>

          {/* CTAs */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
            <a href="#pricing"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white text-black font-bold text-sm hover:bg-[#00D67D] transition-colors duration-200">
              Get Early Access <ArrowRight size={15} />
            </a>
            <a href="#features"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-white/10 text-slate-300 font-medium text-sm hover:border-white/30 hover:text-white transition-colors">
              See Features
            </a>
          </motion.div>

          {/* Social proof */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
            className="mt-8 pt-6 border-t border-white/5 flex flex-wrap gap-x-6 gap-y-2">
            {['CRM + Outreach in one', 'Email · WhatsApp · LinkedIn', 'AI agent included'].map(t => (
              <span key={t} className="flex items-center gap-1.5 text-[11px] text-slate-600 font-mono uppercase tracking-wider">
                <CheckCircle2 size={10} className="text-[#00D67D]" />{t}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Right */}
        <DashboardMockup />
      </div>
    </section>
  );
}
