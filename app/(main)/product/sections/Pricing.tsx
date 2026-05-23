'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, Zap, Users, Building2 } from 'lucide-react';

const PLANS = [
  {
    id: 'managed',
    icon: Users,
    label: 'Managed Service',
    badge: null,
    price: '₦150k',
    period: '/ month',
    tagline: 'We run it for you.',
    desc: 'Spacze operates the platform on your behalf — we source leads, write copy, run campaigns, and report results. You just close the meetings.',
    cta: 'Book a Call',
    ctaHref: '/contact',
    ctaStyle: 'border border-white/20 text-white hover:bg-white/5',
    features: [
      'Up to 500 leads sourced monthly',
      'Email + WhatsApp outreach',
      'AI-generated personalised copy',
      'Weekly performance reports',
      'Dedicated Spacze account manager',
      'Campaign strategy included',
    ],
  },
  {
    id: 'saas',
    icon: Zap,
    label: 'Self-Serve',
    badge: 'Early Access',
    price: '₦45k',
    period: '/ month',
    tagline: 'You control the platform.',
    desc: 'Full access to Spacze Command — CRM, AI outreach, campaigns, analytics, and the AI agent. Run your own pipeline at a fraction of the cost.',
    cta: 'Join Waitlist',
    ctaHref: '#waitlist',
    ctaStyle: 'bg-white text-black hover:bg-[#00D67D]',
    features: [
      'Unlimited leads in CRM',
      'AI outreach copy generation',
      'Email + WhatsApp campaigns',
      'AI agent (natural language commands)',
      'Full analytics dashboard',
      'Early access pricing locked in',
    ],
  },
  {
    id: 'enterprise',
    icon: Building2,
    label: 'Enterprise',
    badge: null,
    price: 'Custom',
    period: '',
    tagline: 'Built around your team.',
    desc: 'Multi-user access, custom integrations, dedicated infrastructure, and a white-label option. For agencies and larger sales teams.',
    cta: 'Talk to Us',
    ctaHref: '/contact',
    ctaStyle: 'border border-white/20 text-white hover:bg-white/5',
    features: [
      'Multi-user team access',
      'White-label option',
      'Custom integrations (CRM, Slack, etc.)',
      'Dedicated infrastructure',
      'SLA + priority support',
      'Onboarding & training',
    ],
  },
];

function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  }

  return (
    <motion.div id="waitlist"
      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      className="mt-16 max-w-xl mx-auto text-center">
      <div className="p-[1px] rounded-2xl bg-gradient-to-r from-transparent via-[#00D67D]/30 to-transparent">
        <div className="bg-[#0A0A0A] rounded-2xl px-8 py-8">
          {submitted ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-3">
              <CheckCircle2 size={32} className="text-[#00D67D] mx-auto" />
              <p className="text-white font-semibold">You're on the list.</p>
              <p className="text-zinc-500 text-sm">We'll reach out when early access opens. Expect to hear from us soon.</p>
            </motion.div>
          ) : (
            <>
              <p className="text-white font-semibold mb-1">Join the early access waitlist</p>
              <p className="text-zinc-500 text-sm mb-5">Lock in the launch price. No spam — one email when we're ready.</p>
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-[#00D67D]/40 transition-colors"
                />
                <button type="submit"
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-[#00D67D] transition-colors whitespace-nowrap">
                  Join <ArrowRight size={14} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function ProductPricing() {
  return (
    <section id="pricing" className="relative w-full py-24 md:py-32 bg-[#020202] overflow-hidden">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-[#00D67D]/4 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-14">
          <motion.div initial={{ opacity: 0, y: -10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D67D]" />
            <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest">Pricing</span>
          </motion.div>
          <motion.h2 initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Pick your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D67D] to-blue-400">
              growth model.
            </span>
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="text-slate-500 max-w-md mx-auto text-sm leading-relaxed">
            Whether you want us to run it or you want full control — there's a plan for where you are right now.
          </motion.p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan, i) => {
            const Icon = plan.icon;
            const isHighlighted = plan.id === 'saas';
            return (
              <motion.div key={plan.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative flex flex-col rounded-2xl border p-7 ${
                  isHighlighted
                    ? 'border-[#00D67D]/30 bg-[#00D67D]/[0.03]'
                    : 'border-white/8 bg-[#0A0A0A]'
                }`}>

                {/* Highlight glow */}
                {isHighlighted && (
                  <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-[#00D67D]/20 to-transparent pointer-events-none" />
                )}

                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#00D67D] text-black text-[10px] font-bold uppercase tracking-wider">
                    {plan.badge}
                  </div>
                )}

                <div className="relative flex flex-col flex-1">
                  {/* Icon + label */}
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isHighlighted ? 'bg-[#00D67D]/15' : 'bg-white/5'}`}>
                      <Icon size={18} className={isHighlighted ? 'text-[#00D67D]' : 'text-zinc-400'} />
                    </div>
                    <span className="text-sm font-semibold text-white">{plan.label}</span>
                  </div>

                  {/* Price */}
                  <div className="mb-1 flex items-end gap-1">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    {plan.period && <span className="text-zinc-500 text-sm mb-1">{plan.period}</span>}
                  </div>
                  <p className="text-[#00D67D] text-xs font-mono mb-3">{plan.tagline}</p>
                  <p className="text-zinc-500 text-sm leading-relaxed mb-6">{plan.desc}</p>

                  {/* Features */}
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                        <CheckCircle2 size={14} className="text-[#00D67D] flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <a href={plan.ctaHref}
                    className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm transition-colors duration-200 ${plan.ctaStyle}`}>
                    {plan.cta} <ArrowRight size={14} />
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Waitlist form */}
        <WaitlistForm />
      </div>
    </section>
  );
}
