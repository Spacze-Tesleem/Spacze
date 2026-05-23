'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Upload, Wand2, Rocket } from 'lucide-react';

const STEPS = [
  {
    num: '01',
    icon: Upload,
    color: '#00D67D',
    title: 'Add your leads',
    desc: 'Import a CSV or add leads manually. The AI immediately scores each one — website quality, industry fit, and automation opportunity — so you know who to contact first.',
  },
  {
    num: '02',
    icon: Wand2,
    color: '#60a5fa',
    title: 'Generate & send outreach',
    desc: 'Pick a lead, choose a channel (email or WhatsApp), and the AI writes a personalised message based on their business. Review it, tweak if needed, and send in one click.',
  },
  {
    num: '03',
    icon: Rocket,
    color: '#a78bfa',
    title: 'Run campaigns & track results',
    desc: 'Group leads into campaigns, schedule sequences, and let the agent fire messages automatically. Watch reply rates, meeting bookings, and pipeline value grow in real time.',
  },
];

export default function ProductHowItWorks() {
  return (
    <section className="relative w-full py-24 md:py-32 bg-[#030303] overflow-hidden">
      {/* Ambient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#00D67D]/4 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div initial={{ opacity: 0, y: -10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest">How it works</span>
          </motion.div>
          <motion.h2 initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Up and running{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-[#00D67D]">
              in minutes.
            </span>
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="text-slate-500 max-w-sm mx-auto text-sm">
            Three steps from zero to booked meetings.
          </motion.p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line — desktop only */}
          <div className="hidden md:block absolute top-[52px] left-[calc(16.66%+32px)] right-[calc(16.66%+32px)] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div key={step.num}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                  className="relative flex flex-col items-center text-center group"
                >
                  {/* Icon circle */}
                  <div className="relative mb-6">
                    <div className="absolute -inset-3 rounded-full blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500"
                      style={{ background: step.color }} />
                    <div className="relative w-16 h-16 rounded-2xl border border-white/10 bg-[#0A0A0A] flex items-center justify-center shadow-xl group-hover:border-white/20 transition-colors">
                      <Icon size={24} style={{ color: step.color }} />
                    </div>
                    {/* Step number */}
                    <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#020202] border border-white/10 flex items-center justify-center">
                      <span className="text-[9px] font-mono font-bold text-zinc-500">{step.num}</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Bottom quote */}
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-20 mx-auto max-w-2xl text-center p-8 rounded-2xl border border-white/5 bg-white/[0.02]">
          <p className="text-slate-300 text-lg font-light leading-relaxed italic">
            "We went from manually sending 10 emails a day to running 300-lead campaigns with one command."
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00D67D] to-blue-500 flex items-center justify-center text-xs font-bold text-black">S</div>
            <div className="text-left">
              <div className="text-sm font-semibold text-white">Spacze Team</div>
              <div className="text-xs text-zinc-600">Internal beta · Lagos, Nigeria</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
