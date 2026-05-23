'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Megaphone, Bot, BarChart2, MessageCircle, Mail, ArrowUpRight } from 'lucide-react';

const FEATURES = [
  {
    id: 'crm',
    icon: Users,
    color: 'from-blue-500 to-cyan-400',
    glow: 'bg-blue-500/10',
    title: 'Smart CRM',
    tagline: 'Every lead, scored and ready.',
    desc: 'Import leads, track outreach status, and let AI score each prospect based on their website quality, industry fit, and engagement signals. No spreadsheets.',
    bullets: ['AI website scoring (1–10)', 'Outreach status tracking', 'Bulk import & export', 'Filter by industry or status'],
    preview: (
      <div className="space-y-2 p-4">
        {[
          { name: 'Konga Logistics', score: 9, status: 'Meeting Booked', color: 'text-purple-400' },
          { name: 'Zara Fashion NG', score: 7, status: 'Replied',        color: 'text-blue-400'   },
          { name: 'PayStack Clone',  score: 8, status: 'Sent',           color: 'text-[#00D67D]'  },
        ].map(l => (
          <div key={l.name} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center text-[9px] font-bold text-zinc-400">{l.name[0]}</div>
              <span className="text-xs text-white">{l.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-zinc-500">{l.score}/10</span>
              <span className={`text-[10px] font-semibold ${l.color}`}>{l.status}</span>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'outreach',
    icon: Mail,
    color: 'from-[#00D67D] to-emerald-400',
    glow: 'bg-[#00D67D]/10',
    title: 'AI Outreach',
    tagline: 'Personalised copy at scale.',
    desc: 'Generate hyper-personalised email and WhatsApp messages for every lead — based on their business, website weaknesses, and your service offering. One click, zero templates.',
    bullets: ['Email + WhatsApp copy', 'Personalised per lead', 'Tone & channel control', 'One-click send'],
    preview: (
      <div className="p-4 space-y-3">
        <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider">Generated Email</div>
        <div className="bg-white/5 border border-white/5 rounded-lg p-3 space-y-1.5">
          <div className="text-[11px] text-zinc-400"><span className="text-zinc-600">To:</span> hello@kongalogistics.com</div>
          <div className="text-[11px] text-zinc-400"><span className="text-zinc-600">Subject:</span> One thing slowing down your delivery ops</div>
          <div className="text-[11px] text-zinc-500 leading-relaxed pt-1 border-t border-white/5">
            Hi Emeka, noticed your booking flow requires 4 manual steps that could be automated…
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 px-3 py-1.5 rounded-lg bg-white text-black text-[10px] font-bold text-center">Send Email</div>
          <div className="flex-1 px-3 py-1.5 rounded-lg bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] text-[10px] font-bold text-center">WhatsApp</div>
        </div>
      </div>
    ),
  },
  {
    id: 'campaigns',
    icon: Megaphone,
    color: 'from-orange-500 to-pink-500',
    glow: 'bg-orange-500/10',
    title: 'Campaigns',
    tagline: 'Multi-channel sequences, automated.',
    desc: 'Build outreach campaigns across email, WhatsApp, LinkedIn, and more. Schedule sequences, track delivery, and let the system fire messages automatically.',
    bullets: ['Email, WhatsApp, LinkedIn', 'Scheduled sequences', 'Draft → Activate flow', 'Delivery tracking'],
    preview: (
      <div className="p-4 space-y-2">
        {[
          { name: 'Q3 Logistics Push', status: 'Active',    leads: 42, sent: 38, color: 'text-[#00D67D]',  dot: '#00D67D' },
          { name: 'Fashion Brands NG', status: 'Paused',    leads: 28, sent: 14, color: 'text-yellow-400', dot: '#facc15' },
          { name: 'Fintech Outreach',  status: 'Draft',     leads: 15, sent: 0,  color: 'text-zinc-400',   dot: '#71717a' },
        ].map(c => (
          <div key={c.name} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/5 border border-white/5">
            <div>
              <div className="text-xs text-white font-medium">{c.name}</div>
              <div className="text-[10px] text-zinc-600">{c.leads} leads · {c.sent} sent</div>
            </div>
            <span className="flex items-center gap-1.5 text-[10px] font-semibold" style={{ color: c.dot }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.dot }} />{c.status}
            </span>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'agent',
    icon: Bot,
    color: 'from-indigo-500 to-purple-500',
    glow: 'bg-indigo-500/10',
    title: 'AI Agent',
    tagline: 'Your autonomous operator.',
    desc: 'Give the agent a plain-English command and it handles the rest — fetching leads, generating copy, sending messages, and reporting back. No clicking through menus.',
    bullets: ['Natural language commands', 'Multi-step task execution', 'Tool use: CRM, email, WhatsApp', 'Dry-run safety mode'],
    preview: (
      <div className="p-4 space-y-3">
        <div className="flex gap-2 justify-end">
          <div className="bg-white text-black text-[11px] font-medium px-3 py-2 rounded-2xl rounded-tr-none max-w-[80%]">
            Send outreach to all pending logistics leads
          </div>
        </div>
        <div className="flex gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
            <Bot size={12} className="text-indigo-400" />
          </div>
          <div className="bg-white/5 border border-white/5 text-[11px] text-zinc-300 px-3 py-2 rounded-2xl rounded-tl-none max-w-[80%] leading-relaxed">
            Found 12 pending logistics leads. Generated personalised emails for each. Sending now — 12 messages queued.
          </div>
        </div>
        <div className="flex items-center gap-1.5 pl-8">
          <span className="w-1 h-1 rounded-full bg-[#00D67D]" />
          <span className="text-[10px] font-mono text-[#00D67D]">12 emails sent · 0 failures</span>
        </div>
      </div>
    ),
  },
  {
    id: 'analytics',
    icon: BarChart2,
    color: 'from-sky-400 to-blue-600',
    glow: 'bg-sky-500/10',
    title: 'Analytics',
    tagline: 'Know what\'s working.',
    desc: 'Track reply rates, meeting bookings, campaign performance, and channel ROI in real time. Charts, funnels, and KPIs — all in one dashboard.',
    bullets: ['Reply & open rates', 'Campaign funnel view', 'Channel comparison', '7d / 30d / 90d ranges'],
    preview: (
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Leads',   value: '248', color: '#00D67D' },
            { label: 'Sent',    value: '91',  color: '#60a5fa' },
            { label: 'Replies', value: '34',  color: '#a78bfa' },
          ].map(k => (
            <div key={k.label} className="bg-white/5 border border-white/5 rounded-lg p-2.5 text-center">
              <div className="text-base font-bold" style={{ color: k.color }}>{k.value}</div>
              <div className="text-[9px] text-zinc-600 uppercase tracking-wider mt-0.5">{k.label}</div>
            </div>
          ))}
        </div>
        <div className="bg-white/5 border border-white/5 rounded-lg p-3">
          <div className="text-[10px] text-zinc-600 mb-2">Reply rate by channel</div>
          {[
            { ch: 'Email',     pct: 37, color: '#60a5fa' },
            { ch: 'WhatsApp',  pct: 62, color: '#25D366' },
          ].map(b => (
            <div key={b.ch} className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] text-zinc-500 w-16">{b.ch}</span>
              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} whileInView={{ width: `${b.pct}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full rounded-full" style={{ background: b.color }} />
              </div>
              <span className="text-[10px] font-mono text-zinc-500">{b.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'whatsapp',
    icon: MessageCircle,
    color: 'from-[#25D366] to-emerald-600',
    glow: 'bg-[#25D366]/10',
    title: 'WhatsApp Bulk',
    tagline: 'Reach leads where they actually respond.',
    desc: 'Send personalised WhatsApp messages to hundreds of leads at once via the Baileys API. Track delivery, replies, and follow-ups — all inside the dashboard.',
    bullets: ['Bulk personalised messages', 'Delivery tracking', 'Reply monitoring', 'No WhatsApp Business API fees'],
    preview: (
      <div className="p-4 space-y-2">
        <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider mb-3">Bulk Send Preview</div>
        {[
          { name: 'Emeka O.', msg: 'Hi Emeka, noticed your delivery…', status: 'Delivered' },
          { name: 'Amina K.', msg: 'Hi Amina, your store could benefit…', status: 'Read' },
          { name: 'Chidi N.', msg: 'Hi Chidi, one thing that could…', status: 'Pending' },
        ].map(m => (
          <div key={m.name} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/5">
            <div className="w-6 h-6 rounded-full bg-[#25D366]/20 flex items-center justify-center text-[9px] font-bold text-[#25D366] flex-shrink-0">{m.name[0]}</div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-medium text-white">{m.name}</div>
              <div className="text-[10px] text-zinc-600 truncate">{m.msg}</div>
            </div>
            <span className={`text-[9px] font-mono flex-shrink-0 ${m.status === 'Read' ? 'text-[#25D366]' : m.status === 'Delivered' ? 'text-blue-400' : 'text-zinc-600'}`}>{m.status}</span>
          </div>
        ))}
      </div>
    ),
  },
];

export default function ProductFeatures() {
  const [active, setActive] = useState('crm');
  const feat = FEATURES.find(f => f.id === active)!;

  return (
    <section id="features" className="relative w-full py-24 md:py-32 bg-[#020202] overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div initial={{ opacity: 0, y: -10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D67D]" />
            <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest">Everything you need</span>
          </motion.div>
          <motion.h2 initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            One platform.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D67D] to-blue-400">
              Full pipeline.
            </span>
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="text-slate-500 max-w-md mx-auto text-sm leading-relaxed">
            From finding leads to booking meetings — every step is handled inside Spacze Command.
          </motion.p>
        </div>

        {/* Tab selector */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {FEATURES.map(f => {
            const Icon = f.icon;
            const isActive = f.id === active;
            return (
              <button key={f.id} onClick={() => setActive(f.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
                  isActive
                    ? 'bg-white text-black border-white shadow-lg'
                    : 'border-white/10 text-zinc-500 hover:text-white hover:border-white/20 bg-transparent'
                }`}>
                <Icon size={13} />{f.title}
              </button>
            );
          })}
        </div>

        {/* Feature panel */}
        <AnimatePresence mode="wait">
          <motion.div key={active}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="grid lg:grid-cols-2 gap-8 items-center">

            {/* Left: text */}
            <div>
              <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${feat.color} bg-opacity-10 mb-6`}
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                <feat.icon size={28} className="text-white" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">{feat.title}</h3>
              <p className="text-[#00D67D] font-mono text-sm mb-4">{feat.tagline}</p>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">{feat.desc}</p>
              <ul className="space-y-2">
                {feat.bullets.map(b => (
                  <li key={b} className="flex items-center gap-2.5 text-sm text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00D67D] flex-shrink-0" />{b}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: preview card */}
            <div className="relative">
              <div className={`absolute -inset-4 ${feat.glow} blur-[50px] rounded-3xl pointer-events-none`} />
              <div className="relative bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/5 bg-[#080808]">
                  <div className={`w-4 h-4 rounded-md bg-gradient-to-br ${feat.color} flex items-center justify-center`}>
                    <feat.icon size={9} className="text-white" />
                  </div>
                  <span className="text-[11px] text-zinc-500 font-mono">{feat.title}</span>
                  <ArrowUpRight size={11} className="ml-auto text-zinc-700" />
                </div>
                {feat.preview}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
