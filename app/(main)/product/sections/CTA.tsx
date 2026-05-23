'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Zap } from 'lucide-react';

export default function ProductCTA() {
  return (
    <section className="relative w-full py-24 md:py-32 bg-[#030303] overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_60%,transparent_100%)]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#00D67D]/6 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00D67D] to-blue-500 items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(0,214,125,0.3)]">
          <Zap size={24} className="text-black fill-black" />
        </motion.div>

        <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-4xl md:text-5xl font-bold tracking-tight mb-5">
          Stop chasing leads.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D67D] to-blue-400">
            Start closing them.
          </span>
        </motion.h2>

        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
          className="text-slate-400 text-base leading-relaxed mb-10 max-w-xl mx-auto">
          Whether you want Spacze to run your outreach or you want the platform in your own hands — the pipeline starts today.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="#waitlist"
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-black font-bold text-sm hover:bg-[#00D67D] transition-colors duration-200">
            Join the Waitlist <ArrowRight size={15} />
          </a>
          <a href="/contact"
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-white/15 text-slate-300 font-medium text-sm hover:border-white/30 hover:text-white transition-colors">
            Book a Strategy Call
          </a>
        </motion.div>
      </div>
    </section>
  );
}
