'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mail, MapPin, ArrowUpRight, CheckCircle2, Copy, Send, Loader2,
} from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

const services = [
  'Web & App Development',
  'E-Commerce Platform',
  'SaaS / Dashboard',
  'Landing Page',
  'Maintenance & Support',
  'Other',
];

export default function ContactPage() {
  const [copied, setCopied] = useState(false);
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState('');

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('spaczehq@gmail.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('submitting');
    await new Promise((r) => setTimeout(r, 2000));
    setFormStatus('success');
  };

  const inputClass = (field: string) =>
    `w-full bg-[#0A0A0A] border rounded-xl px-4 py-3 text-white text-sm outline-none transition-all duration-300 placeholder:text-slate-600 ${
      focusedField === field
        ? 'border-[#00D67D] shadow-[0_0_0_3px_rgba(0,214,125,0.08)]'
        : 'border-white/10 hover:border-white/20'
    }`;

  return (
    <main className="bg-[#020202] text-white min-h-screen">

      {/* ── HERO ── */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden">
        <div className="absolute -top-[20%] -right-[10%] w-[700px] h-[700px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-[20%] -left-[10%] w-[600px] h-[600px] bg-[#00D67D]/5 blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div {...fadeUp} className="mb-4 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D67D] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00D67D]" />
            </span>
            <span className="text-[#00D67D] font-mono text-xs uppercase tracking-widest">Response time: &lt; 24 hours</span>
          </motion.div>

          <motion.h1
            {...fadeUp}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
          >
            Let's{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-[#00D67D]">
              collaborate.
            </span>
          </motion.h1>

          <motion.p
            {...fadeUp}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-slate-400 text-lg max-w-xl leading-relaxed"
          >
            Have a project in mind? We help ambitious brands build scalable, high-performance digital products.
          </motion.p>
        </div>
      </section>

      {/* ── MAIN CONTENT ── */}
      <section className="px-6 pb-32">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[1fr_1.4fr] gap-16 items-start">

          {/* Left: Contact details */}
          <div className="space-y-6 lg:sticky lg:top-32">

            {/* Email card */}
            <motion.div
              {...fadeUp}
              onClick={handleCopyEmail}
              className="group cursor-pointer p-6 rounded-2xl bg-[#0A0A0A] border border-white/10 hover:border-blue-500/30 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Direct Email</span>
                {copied
                  ? <CheckCircle2 size={16} className="text-[#00D67D]" />
                  : <Copy size={16} className="text-slate-600 group-hover:text-blue-400 transition-colors" />}
              </div>
              <div className="text-xl font-medium text-white group-hover:text-blue-400 transition-colors">
                spaczehq@gmail.com
              </div>
              <p className="text-xs text-slate-600 mt-1">{copied ? 'Copied!' : 'Click to copy'}</p>
            </motion.div>

            {/* Location */}
            <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="p-6 rounded-2xl bg-[#0A0A0A] border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <MapPin size={16} className="text-[#00D67D]" />
                <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Location</span>
              </div>
              <div className="text-white font-medium">Remote — Worldwide</div>
              <p className="text-xs text-slate-500 mt-1">We work with clients globally</p>
            </motion.div>

            {/* Availability */}
            <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="p-6 rounded-2xl bg-[#0A0A0A] border border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D67D] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00D67D]" />
                </span>
                <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Availability</span>
              </div>
              <div className="text-white font-medium">Currently accepting projects</div>
              <p className="text-xs text-slate-500 mt-1">Limited spots — book early</p>
            </motion.div>
          </div>

          {/* Right: Form */}
          <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
            {formStatus === 'success' ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-full bg-[#00D67D]/10 flex items-center justify-center mb-6">
                  <CheckCircle2 size={32} className="text-[#00D67D]" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Message sent!</h3>
                <p className="text-slate-400">We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="p-8 rounded-3xl bg-[#0A0A0A] border border-white/10 space-y-5"
              >
                <div>
                  <h2 className="text-xl font-bold mb-1">Send us a message</h2>
                  <p className="text-slate-500 text-sm">Tell us about your project and we'll be in touch.</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5 font-mono uppercase tracking-wider">Name</label>
                    <input
                      type="text"
                      required
                      placeholder="John Doe"
                      className={inputClass('name')}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5 font-mono uppercase tracking-wider">Email</label>
                    <input
                      type="email"
                      required
                      placeholder="you@company.com"
                      className={inputClass('email')}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-mono uppercase tracking-wider">Service</label>
                  <div className="flex flex-wrap gap-2">
                    {services.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSelectedService(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all duration-200 ${
                          selectedService === s
                            ? 'bg-[#00D67D]/10 border-[#00D67D]/40 text-[#00D67D]'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-mono uppercase tracking-wider">Budget Range</label>
                  <input
                    type="text"
                    placeholder="e.g. $2,000 – $5,000"
                    className={inputClass('budget')}
                    onFocus={() => setFocusedField('budget')}
                    onBlur={() => setFocusedField(null)}
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-mono uppercase tracking-wider">Message</label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Tell us about your project, goals, and timeline..."
                    className={`${inputClass('message')} resize-none`}
                    onFocus={() => setFocusedField('message')}
                    onBlur={() => setFocusedField(null)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={formStatus === 'submitting'}
                  className="w-full py-4 rounded-xl bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-[#00D67D] transition-colors duration-200 disabled:opacity-60"
                >
                  {formStatus === 'submitting' ? (
                    <><Loader2 size={16} className="animate-spin" /> Sending...</>
                  ) : (
                    <><Send size={16} /> Send Message</>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </section>

    </main>
  );
}
