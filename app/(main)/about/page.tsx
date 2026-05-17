'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Target, Zap, Users, Quote, ArrowRight, CheckCircle2, Code2, Globe, Cpu } from 'lucide-react';
import Link from 'next/link';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

const pillars = [
  {
    icon: <Shield className="text-[#00D67D]" size={22} />,
    title: 'Security First',
    desc: 'We build software that is secure by design — not as an afterthought. Every system is hardened before it ships.',
  },
  {
    icon: <Zap className="text-[#00D67D]" size={22} />,
    title: 'Modern Stack',
    desc: 'We use the latest proven technologies so your business stays ahead, not playing catch-up.',
  },
  {
    icon: <Target className="text-[#00D67D]" size={22} />,
    title: 'Growth Driven',
    desc: "We don't just write code — we build tools designed to increase your revenue and scale with you.",
  },
];

const stats = [
  { value: '20+', label: 'Projects Delivered' },
  { value: '100%', label: 'Client Satisfaction' },
  { value: '< 24h', label: 'Response Time' },
  { value: '3+', label: 'Years Building' },
];

const values = [
  { icon: <Code2 size={18} />, title: 'Clean Code', desc: 'Readable, maintainable, and documented.' },
  { icon: <Globe size={18} />, title: 'Global Standards', desc: 'Built to international best practices.' },
  { icon: <Cpu size={18} />, title: 'Performance', desc: 'Fast by default, optimised by design.' },
  { icon: <CheckCircle2 size={18} />, title: 'Reliability', desc: 'Systems that work when it matters most.' },
];

export default function AboutPage() {
  return (
    <main className="bg-[#020202] text-white min-h-screen">

      {/* ── HERO ── */}
      <section className="relative pt-40 pb-24 px-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#00D67D]/5 blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-900/10 blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div {...fadeUp} className="mb-4 flex items-center gap-2">
            <span className="w-6 h-[1px] bg-[#00D67D]" />
            <span className="text-[#00D67D] font-mono text-xs uppercase tracking-widest">Our Story</span>
          </motion.div>

          <motion.h1
            {...fadeUp}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6 max-w-3xl"
          >
            Built to make{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-[#00D67D]">
              technology work
            </span>{' '}
            for you.
          </motion.h1>

          <motion.p
            {...fadeUp}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-slate-400 text-lg max-w-2xl leading-relaxed"
          >
            Spacze was created to bridge the gap between visionary business goals and technical execution.
            We saw too many growing companies held back by outdated, insecure software — so we set out to fix that.
          </motion.p>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="px-6 pb-24">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              {...fadeUp}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 text-center"
            >
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">{s.value}</div>
              <div className="text-xs text-slate-500 uppercase tracking-widest font-mono">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── STORY + PILLARS ── */}
      <section className="px-6 pb-24">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-start">

          {/* Left: Story */}
          <motion.div {...fadeUp}>
            <h2 className="text-3xl md:text-4xl font-bold mb-8">
              About <span className="text-[#00D67D]">Spacze</span>
            </h2>
            <div className="space-y-5 text-slate-400 text-base leading-relaxed">
              <p>
                Spacze was created to bridge the gap between{' '}
                <span className="text-white font-medium">visionary business goals</span> and{' '}
                <span className="text-white font-medium">technical execution</span>. We saw too many growing
                companies struggling with outdated, insecure software that hindered their progress.
              </p>
              <p>
                Our mission is simple: help businesses grow using{' '}
                <span className="text-white font-medium">secure, modern software</span>. Great technology
                should be invisible — it should just work, letting you focus on running your business.
              </p>
            </div>

            {/* Who We Serve */}
            <div className="mt-10 p-7 rounded-2xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-3 mb-3">
                <Users className="text-[#00D67D]" size={20} />
                <h3 className="text-lg font-bold">Who We Serve</h3>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                We partner with <span className="text-white">ambitious startups</span> launching their first
                MVP and <span className="text-white">established businesses</span> modernising their
                infrastructure for the digital age.
              </p>
            </div>
          </motion.div>

          {/* Right: Pillars */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6">The Spacze Advantage</h3>
            {pillars.map((p, i) => (
              <motion.div
                key={i}
                {...fadeUp}
                transition={{ delay: i * 0.1 }}
                className="flex gap-5 p-6 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="mt-0.5 flex-shrink-0">{p.icon}</div>
                <div>
                  <h4 className="text-base font-bold mb-1">{p.title}</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">{p.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VALUES GRID ── */}
      <section className="px-6 pb-24 bg-[#050505]">
        <div className="max-w-7xl mx-auto pt-24">
          <motion.div {...fadeUp} className="mb-12 text-center">
            <span className="text-[#00D67D] font-mono text-xs uppercase tracking-widest">How We Work</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-3">Our core values</h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {values.map((v, i) => (
              <motion.div
                key={i}
                {...fadeUp}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-[#00D67D]/20 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#00D67D]/10 text-[#00D67D] flex items-center justify-center mb-4 group-hover:bg-[#00D67D]/20 transition-colors">
                  {v.icon}
                </div>
                <h4 className="font-bold mb-1">{v.title}</h4>
                <p className="text-slate-400 text-sm">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOUNDER QUOTE ── */}
      <section className="px-6 py-24">
        <div className="max-w-3xl mx-auto">
          <motion.div
            {...fadeUp}
            className="relative p-10 rounded-3xl bg-gradient-to-br from-[#121212] to-[#0A0A0A] border border-white/10"
          >
            <Quote className="absolute top-6 right-8 text-white/5" size={72} />
            <p className="text-slate-300 italic text-lg leading-relaxed mb-8 relative z-10">
              "At Spacze, we don't just deliver code — we deliver peace of mind. Every line of software we
              write is built on the foundation of your future success. We're not just your developers,
              we're your technical partners."
            </p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#00D67D] to-teal-500 flex items-center justify-center font-bold text-black text-lg">
                S
              </div>
              <div>
                <div className="font-bold text-white">The Spacze Team</div>
                <div className="text-xs text-[#00D67D] font-mono uppercase tracking-wider">Engineering Excellence</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 pb-32 text-center">
        <motion.div {...fadeUp} className="max-w-xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to build something?</h2>
          <p className="text-slate-400 mb-8">Let's turn your idea into a product that works.</p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-[#00D67D] transition-colors duration-200"
          >
            Start a Project <ArrowRight size={16} />
          </Link>
        </motion.div>
      </section>

    </main>
  );
}
