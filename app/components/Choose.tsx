'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  TrendingUp, 
  Server, 
  Cpu, 
  MessageSquare, 
  Clock,
  Lock
} from 'lucide-react';

// --- Sub-Component: Reusable Card Wrapper ---
const BentoCard = ({
  children,
  className = '',
  title,
  desc,
  icon: Icon,
}: {
  children?: React.ReactNode;
  className?: string;
  title: string;
  desc: string;
  icon: React.ElementType;
}) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      className={`group relative overflow-hidden rounded-3xl bg-[#121212] border border-white/10 p-6 flex flex-col justify-between hover:border-[#00D67D]/50 transition-colors duration-500 ${className}`}
    >
      {/* Hover Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#00D67D]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Content Top */}
      <div className="relative z-10 mb-8">
        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:bg-[#00D67D] group-hover:text-black transition-colors duration-300 text-white">
          <Icon size={20} />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
      </div>

      {/* Visual Slot (Bottom/Background) */}
      <div className="relative z-10 mt-auto min-h-[100px] flex items-center justify-center">
        {children}
      </div>
    </motion.div>
  );
};

// --- Main Component ---
const WhyChooseUs = () => {
  return (
    <section className="relative w-full py-24 bg-[#0A0A0A] text-white overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/[0.02] blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Header */}
        <div className="mb-16 max-w-2xl">
          <span className="text-[#00D67D] font-bold uppercase tracking-widest text-xs">The Spacze Advantage</span>
          <h2 className="text-4xl md:text-5xl font-bold mt-3 mb-6">
            Why visionary companies <br />
            <span className="text-slate-500">trust us with their code.</span>
          </h2>
          <p className="text-lg text-slate-400">
            We don't act like a vendor; we act like your internal CTO. 
            Here is the standard we hold ourselves to.
          </p>
        </div>

        {/* --- BENTO GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[300px]">
          
          {/* 1. SECURITY (Wide Card) */}
          <BentoCard
            className="md:col-span-2"
            title="Security-First Architecture"
            desc="We don't bolt security on at the end. It's baked into every line of code, every database schema, and every API endpoint from Day 1."
            icon={ShieldCheck}
          >
            <div className="w-full h-full flex items-center justify-center gap-8 relative">
              {/* Abstract Security Visual */}
              <div className="relative w-full max-w-[300px] h-12 bg-white/5 rounded-full overflow-hidden border border-white/10">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex gap-2">
                   <div className="w-2 h-2 rounded-full bg-red-500/50" />
                   <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                   <div className="w-2 h-2 rounded-full bg-green-500/50" />
                </div>
                {/* Scanning Animation */}
                <motion.div 
                  animate={{ x: [-100, 300] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute top-0 bottom-0 w-20 bg-gradient-to-r from-transparent via-[#00D67D]/30 to-transparent skew-x-12"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-[#00D67D] font-mono font-bold tracking-widest">
                  ENCRYPTED
                </div>
              </div>
            </div>
          </BentoCard>

          {/* 2. BUSINESS FOCUSED (Tall Card on mobile, square on desktop) */}
          <BentoCard
            className="md:col-span-1 bg-gradient-to-b from-[#121212] to-[#0d0d0d]"
            title="ROI-Driven Engineering"
            desc="We prioritize features that drive revenue and efficiency. If it doesn't help your business grow, we don't build it."
            icon={TrendingUp}
          >
             <div className="flex items-end justify-center gap-2 h-24 w-full px-8 pb-2">
               {[30, 45, 35, 60, 50, 80].map((h, i) => (
                 <motion.div
                   key={i}
                   initial={{ height: 0 }}
                   whileInView={{ height: `${h}%` }}
                   transition={{ duration: 1, delay: i * 0.1 }}
                   className="w-full bg-[#00D67D] opacity-20 group-hover:opacity-100 transition-opacity rounded-t-sm"
                 />
               ))}
             </div>
          </BentoCard>

          {/* 3. SCALABILITY (Square) */}
          <BentoCard
            className="md:col-span-1"
            title="Built for Scale"
            desc="Systems designed to handle 100 users today and 10 million tomorrow without crashing."
            icon={Server}
          >
            <div className="relative w-24 h-24 grid grid-cols-2 gap-2">
               {[1,2,3,4].map((i) => (
                 <div key={i} className="bg-white/5 rounded-md border border-white/10 group-hover:scale-90 transition-transform duration-300" />
               ))}
               <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-8 h-8 rounded-full bg-[#00D67D]/20 animate-ping absolute" />
                 <div className="w-8 h-8 rounded-full bg-[#00D67D]/80 relative z-10 flex items-center justify-center text-[10px] font-bold text-black">
                   10x
                 </div>
               </div>
            </div>
          </BentoCard>

          {/* 4. MODERN TECH (Square) */}
          <BentoCard
            className="md:col-span-1"
            title="Modern Tech Stack"
            desc="We use Next.js, React, Node, and Python to ensure your product is fast, SEO-friendly, and future-proof."
            icon={Cpu}
          >
            <div className="flex gap-3 opacity-50 group-hover:opacity-100 transition-opacity">
               <div className="px-3 py-1 rounded border border-white/10 text-xs font-mono">React</div>
               <div className="px-3 py-1 rounded border border-white/10 text-xs font-mono">Next</div>
               <div className="px-3 py-1 rounded border border-white/10 text-xs font-mono">AWS</div>
            </div>
          </BentoCard>

          {/* 5. TRANSPARENCY (Square) */}
          <BentoCard
            className="md:col-span-1"
            title="Radical Transparency"
            desc="No ghosting. No jargon. You get direct access to developers and weekly video updates."
            icon={MessageSquare}
          >
             <div className="space-y-2 w-full px-4">
               <div className="bg-white/5 p-2 rounded-lg rounded-tl-none w-3/4 text-[10px] text-slate-400">
                 Update posted: Deployment successful.
               </div>
               <div className="bg-[#00D67D]/20 p-2 rounded-lg rounded-tr-none w-3/4 ml-auto text-[10px] text-[#00D67D]">
                 Great work! The speed is amazing.
               </div>
             </div>
          </BentoCard>

          {/* 6. SUPPORT (Wide Card) */}
          <BentoCard
            className="md:col-span-3"
            title="Ongoing Support & Evolution"
            desc="Launch is just day one. We stay onboard to monitor performance, fix issues, and iterate based on user feedback."
            icon={Clock}
          >
             <div className="w-full flex items-center justify-between px-12 opacity-50 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-mono uppercase">System Healthy</span>
                </div>
                <div className="h-px bg-white/20 flex-grow mx-8" />
                <div className="text-xs font-mono uppercase">24/7 Monitoring Active</div>
             </div>
          </BentoCard>

        </div>

      </div>
    </section>
  );
};

export default WhyChooseUs;