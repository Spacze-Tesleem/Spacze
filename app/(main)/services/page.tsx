'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useInView, useSpring, useMotionValue } from 'framer-motion';
import Image from 'next/image';
import { 
  ArrowRight, Code2, ShieldCheck, Bot, Server, 
  ShoppingCart, MessageSquare, Terminal, Zap, 
  Cpu, Activity, Globe, Lock, Search, Command, 
  CheckCircle2, Layers, GitBranch, Database, Wifi
} from 'lucide-react';

// --- DATA CONFIGURATION ---
const servicesData = [
  {
    id: "01",
    icon: <Code2 />,
    title: "Product Engineering",
    desc: "Next.js & React Native architectures built for SEO, speed, and massive scale.",
    features: ["Full-Stack", "Mobile Native", "PWA"],
    color: "#22d3ee", 
  },
  {
    id: "02",
    icon: <ShieldCheck />,
    title: "Security & Audit",
    desc: "Rigorous penetration testing and protocol hardening for zero-trust environments.",
    features: ["Pen Testing", "Threat Ops", "Compliance"],
    color: "#00D67D", 
  },
  {
    id: "03",
    icon: <Bot />,
    title: "AI Integration",
    desc: "Custom LLM agents and RAG pipelines that automate complex business workflows.",
    features: ["Auto-Agents", "Fine-tuning", "Data Ops"],
    color: "#c084fc", 
  },
  {
    id: "04",
    icon: <Server />,
    title: "Cloud Infrastructure",
    desc: "Serverless AWS/GCP backends designed to handle millions of requests.",
    features: ["Serverless", "Microservices", "DevOps"],
    color: "#fbbf24", 
  },
  {
    id: "05",
    icon: <ShoppingCart />,
    title: "Headless Commerce",
    desc: "Lightning-fast decoupled stores using Shopify Plus and modern edge caching.",
    features: ["Headless APIs", "Edge Caching", "Global CDN"],
    color: "#34d399", 
  },
  {
    id: "06",
    icon: <MessageSquare />,
    title: "Conversational Tech",
    desc: "WhatsApp & SMS API integrations for automated, human-like customer support.",
    features: ["WhatsApp API", "Chatbots", "Twilio"],
    color: "#60a5fa", 
  }
];

const processData = [
  { title: "Discovery & Audit", desc: "Mapping the terrain. We identify bottlenecks and define technical constraints." },
  { title: "Architecture Design", desc: "The blueprint phase. Schemas, topology, and high-fidelity prototyping." },
  { title: "Agile Development", desc: "Two-week sprints with continuous deployment. Watch the product evolve." },
  { title: "Rigorous QA", desc: "Automated testing pipelines and security sweeps before launch." },
  { title: "Global Deployment", desc: "Zero-downtime launch to edge networks with full observability." }
];

// --- SUB-COMPONENTS ---

const NoiseOverlay = () => (
  <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03] mix-blend-overlay" 
    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }} 
  />
);

// --- NEW 3D HERO VISUAL ---
const MindBlowingHeroVisual = () => {
  const ref = useRef<HTMLDivElement>(null);
  
  // Mouse movement logic
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 15 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseXFromCenter = e.clientX - rect.left - width / 2;
    const mouseYFromCenter = e.clientY - rect.top - height / 2;
    
    x.set(mouseXFromCenter / 15); // Adjust divisor for sensitivity
    y.set(mouseYFromCenter / 15);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div 
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-[600px] flex items-center justify-center perspective-1000 overflow-visible z-20"
      style={{ perspective: "1000px" }}
    >
      
      {/* 1. Background Reactor Core (Pulsing behind everything) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-500/20 rounded-full blur-[80px] animate-pulse pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-[#00D67D]/20 rounded-full blur-[60px] pointer-events-none" />

      {/* 2. Main 3D Container */}
      <motion.div
        style={{ 
          rotateX: useTransform(mouseY, (val) => -val), // Inverse tilt
          rotateY: mouseX,
          transformStyle: "preserve-3d" 
        }}
        className="relative w-[340px] md:w-[450px] aspect-[4/5]"
      >
        
        {/* LAYER 0: Back Grid (Furthest back) */}
        <motion.div 
          style={{ transform: "translateZ(-50px)" }}
          className="absolute inset-0 border border-white/5 bg-black/40 rounded-3xl backdrop-blur-sm"
        >
          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(#00D67D_1px,transparent_1px),linear-gradient(90deg,#00D67D_1px,transparent_1px)] bg-[size:20px_20px] rounded-3xl" />
        </motion.div>

        {/* LAYER 1: Main Interface Board */}
        <motion.div 
          style={{ transform: "translateZ(20px)" }}
          className="absolute inset-0 bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="h-10 border-b border-white/10 bg-[#0F0F0F] flex items-center justify-between px-4">
             <div className="flex gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50" />
             </div>
             <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                <Lock size={10} />
                <span>SECURE_SHELL</span>
             </div>
          </div>

          {/* Body */}
          <div className="p-6 flex-1 relative font-mono text-[10px] md:text-xs space-y-4 text-slate-400">
             {/* Abstract Code */}
             <div className="space-y-1">
                <div className="text-purple-400">import <span className="text-white">Future</span> from <span className="text-green-400">'@spacze/core'</span>;</div>
                <div className="text-blue-400">const <span className="text-yellow-200">System</span> = async () =&gt; {'{'}</div>
                <div className="pl-4 text-slate-500">// Initializing neural bridge</div>
                <div className="pl-4 text-white">await <span className="text-blue-300">Future.deploy</span>({'{'}</div>
                <div className="pl-8 text-slate-300">target: <span className="text-green-400">'global_edge'</span>,</div>
                <div className="pl-8 text-slate-300">latency: <span className="text-purple-400">0</span>,</div>
                <div className="pl-8 text-slate-300">security: <span className="text-blue-400">true</span></div>
                <div className="pl-4 text-white">{'}'});</div>
                <div className="text-blue-400">{'}'}</div>
             </div>

             {/* Graph Visual */}
             <div className="mt-8 pt-4 border-t border-white/5">
                <div className="flex justify-between items-center mb-2">
                   <span className="uppercase text-[9px] tracking-widest text-slate-500">Live Traffic</span>
                   <span className="text-[#00D67D] font-bold">4.2M/s</span>
                </div>
                <div className="flex items-end gap-1 h-16">
                   {[40, 65, 50, 80, 55, 90, 70, 95, 60, 85].map((h, i) => (
                      <motion.div 
                        key={i}
                        initial={{ height: '20%' }}
                        animate={{ height: `${h}%` }}
                        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", delay: i * 0.1 }}
                        className="flex-1 bg-gradient-to-t from-blue-900/50 to-blue-500/50 rounded-t-sm"
                      />
                   ))}
                </div>
             </div>
          </div>
          
          {/* Scan Line Overlay */}
          <motion.div 
             animate={{ top: ['-10%', '110%'] }}
             transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
             className="absolute left-0 w-full h-[10px] bg-gradient-to-b from-transparent via-[#00D67D]/20 to-transparent pointer-events-none z-10"
          />
        </motion.div>

        {/* LAYER 2: Floating Elements (Closest to viewer) */}
        
        {/* Top Right: Status */}
        <motion.div 
          style={{ transform: "translateZ(60px) translateX(20px) translateY(-20px)" }}
          className="absolute top-10 -right-8 bg-[#0F0F0F] border border-white/10 p-3 rounded-xl shadow-2xl flex items-center gap-3"
        >
           <div className="relative">
              <div className="w-2.5 h-2.5 bg-[#00D67D] rounded-full" />
              <div className="absolute inset-0 bg-[#00D67D] rounded-full animate-ping" />
           </div>
           <div>
              <div className="text-[9px] text-slate-500 uppercase font-bold">Status</div>
              <div className="text-xs text-white font-bold">100% Uptime</div>
           </div>
        </motion.div>

        {/* Bottom Left: Stack */}
        <motion.div 
          style={{ transform: "translateZ(80px) translateX(-20px) translateY(40px)" }}
          className="absolute bottom-20 -left-10 bg-[#0F0F0F]/90 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-2xl w-40"
        >
           <div className="flex items-center gap-2 mb-2 text-slate-400 text-[10px] uppercase font-bold">
              <GitBranch size={12} /> Connected
           </div>
           <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-[#333] flex items-center justify-center text-[10px] text-white">TS</div>
              <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-[#333] flex items-center justify-center text-[10px] text-white">AWS</div>
              <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-[#333] flex items-center justify-center text-[10px] text-white">AI</div>
           </div>
        </motion.div>

        {/* Center: Success Toast */}
        <motion.div 
          style={{ transform: "translateZ(100px)" }}
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-8 right-8 bg-[#00D67D] text-black p-3 rounded-lg shadow-[0_0_30px_rgba(0,214,125,0.4)] flex items-center gap-2 font-bold text-xs"
        >
           <CheckCircle2 size={16} />
           <span>Deploy Complete</span>
        </motion.div>

      </motion.div>
    </div>
  );
};


// --- MAIN PAGE ---
const ServicesPage = () => {
  return (
    <div className="relative w-full min-h-screen bg-[#020202] text-white selection:bg-[#00D67D] selection:text-black overflow-hidden font-sans">
      <NoiseOverlay />
      
      {/* 1. HERO SECTION (Updated Layout) */}
      <section className="relative min-h-screen flex items-center pt-24 pb-12 px-6">
        
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-20 items-center relative z-10">
          
          {/* LEFT COLUMN: Content */}
          <div className="order-1 flex flex-col items-start text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Status Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
                 <span className="relative flex h-2 w-2">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D67D] opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00D67D]"></span>
                 </span>
                 <span className="text-[10px] font-mono text-slate-300 uppercase tracking-widest">
                   Engineering Systems: Online
                 </span>
              </div>
              
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
                Build for <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-[#00D67D]">
                  Critical Velocity.
                </span>
              </h1>
              
              <p className="text-slate-400 text-lg md:text-xl max-w-xl leading-relaxed font-light mb-10">
                We bridge the gap between ambitious ideas and production-ready architecture. Secure, scalable, and engineered for impact.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                 <button className="group relative w-full sm:w-auto px-8 py-4 bg-[#00D67D] text-black font-bold text-sm tracking-widest rounded-lg overflow-hidden active:scale-95 transition-all">
                    <span className="relative z-10 flex items-center justify-center gap-2 uppercase">
                        Start Project <ArrowRight size={16} />
                    </span>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                 </button>

                 <button className="w-full sm:w-auto px-8 py-4 bg-transparent border border-white/10 text-white font-medium text-sm rounded-lg hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
                    <Command size={16} />
                    <span>SYSTEM AUDIT</span>
                 </button>
              </div>

              {/* Stats / Trust */}
              <div className="pt-12 mt-12 border-t border-white/5 w-full flex gap-12 text-xs font-mono text-slate-500">
                 <div className="flex items-center gap-2">
                    <Activity size={14} className="text-[#00D67D]" />
                    <span>100% Uptime</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <Lock size={14} className="text-blue-400" />
                    <span>End-to-End Encrypted</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <Globe size={14} className="text-purple-400" />
                    <span>Global CDN</span>
                 </div>
              </div>
            </motion.div>
          </div>

          {/* RIGHT COLUMN: The Mind-Blowing Visual */}
          <div className="order-2 hidden lg:block z-50">
             <MindBlowingHeroVisual />
          </div>
        </div>
      </section>

      {/* 2. SERVICES GRID */}
      <section className="py-32 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-4">
                <Cpu size={18} className="text-[#00D67D]" />
                <span className="text-xs font-mono text-[#00D67D] uppercase tracking-[0.3em]">Capabilities</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
                Systems that scale <br/> <span className="text-slate-500">as fast as you do.</span>
              </h2>
            </div>
            <p className="text-slate-500 max-w-sm text-sm">
              Comprehensive technical services designed to move your business from concept to market dominance.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servicesData.map((service, index) => (
              <ServiceCard key={index} data={service} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* 3. PROCESS */}
      <section className="py-32 px-6 bg-[#080808]/50 border-y border-white/5">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-start">
          <div className="lg:sticky lg:top-32">
            <div className="flex items-center gap-2 mb-6 text-blue-400 font-mono text-xs uppercase tracking-widest">
               <Layers size={16} />
               <span>Development Protocol</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8 text-white leading-tight">
              Precision <br/> over chaos.
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed max-w-md">
              A rigid, transparent development lifecycle ensures every commit contributes directly to your bottom line. No technical debt, no ghosting.
            </p>
          </div>

          <div className="space-y-12 relative pt-4">
            <div className="absolute left-6 top-0 bottom-0 w-[1px] bg-white/5 overflow-hidden">
               <motion.div 
                initial={{ height: 0 }}
                whileInView={{ height: '100%' }}
                transition={{ duration: 1.5 }}
                className="w-full bg-[#00D67D]" 
               />
            </div>
            {processData.map((step, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative pl-16 group"
              >
                <div className="absolute left-[20px] top-1.5 w-2.5 h-2.5 rounded-full bg-black border-2 border-white/20 group-hover:border-[#00D67D] transition-colors z-10" />
                <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2">Step 0{i+1}</div>
                <h4 className="text-xl font-bold text-white mb-2">{step.title}</h4>
                <p className="text-slate-500 text-sm leading-relaxed max-w-sm">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. FINAL CTA */}
      <section className="py-40 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,214,125,0.05),transparent_70%)] pointer-events-none" />
        <div className="max-w-3xl mx-auto relative z-10">
          <h2 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8">Ready to deploy?</h2>
          <p className="text-slate-500 text-lg mb-12">Stop settling for legacy performance. Let's architect a solution that defines the future of your industry.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button className="px-10 py-5 bg-white text-black font-bold text-sm tracking-widest rounded-full hover:bg-[#00D67D] transition-all hover:scale-105 active:scale-95 uppercase">
                Initialize Project
            </button>
            <button className="px-10 py-5 bg-transparent border border-white/10 text-white font-bold text-sm tracking-widest rounded-full hover:bg-white/5 transition-all uppercase">
                Schedule Discovery
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

// --- Sub-components (ServiceCard) ---
const ServiceCard = ({ data, index }: { data: typeof servicesData[0], index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="group relative h-full"
    >
      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-white/10 to-transparent group-hover:from-[var(--card-color)]/50 group-hover:to-transparent transition-all duration-500 opacity-50 group-hover:opacity-100" style={{ '--card-color': data.color } as React.CSSProperties} />
      <div className="relative h-full flex flex-col p-8 rounded-2xl bg-[#080808] border border-white/5 group-hover:border-transparent transition-all duration-300">
        <div className="w-12 h-12 mb-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:bg-[var(--card-color)] group-hover:text-black transition-all duration-300" style={{ '--card-color': data.color } as React.CSSProperties}>
          {data.icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[var(--card-color)] transition-colors" style={{ '--card-color': data.color } as React.CSSProperties}>
          {data.title}
        </h3>
        <p className="text-slate-500 text-sm leading-relaxed mb-8 flex-grow">
          {data.desc}
        </p>
        <div className="flex flex-wrap gap-2 pt-6 border-t border-white/5">
          {data.features.map((feat, i) => (
            <span key={i} className="text-[10px] font-mono uppercase px-2 py-1 rounded bg-white/5 text-slate-400 border border-white/5">
              {feat}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default ServicesPage;