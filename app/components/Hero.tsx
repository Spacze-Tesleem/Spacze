'use client';

import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { ArrowRight, Search, Code2, Activity, ShieldCheck, Cpu } from 'lucide-react';

// --- Sub-Component: Minimalist Typewriter Input ---
const ProjectInput = () => {
    const [text, setText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [loopNum, setLoopNum] = useState(0);
    const [typingSpeed, setTypingSpeed] = useState(150);

    const phrases = [
        "Cloud Infrastructure...",
        "SaaS Platform...",
        "AI Dashboard...",
        "Fintech App..."
    ];

    useEffect(() => {
        const handleTyping = () => {
            const i = loopNum % phrases.length;
            const fullText = phrases[i];

            setText(isDeleting 
                ? fullText.substring(0, text.length - 1) 
                : fullText.substring(0, text.length + 1)
            );

            setTypingSpeed(isDeleting ? 30 : 100);

            if (!isDeleting && text === fullText) {
                setTimeout(() => setIsDeleting(true), 2000); // Longer pause at end
            } else if (isDeleting && text === '') {
                setIsDeleting(false);
                setLoopNum(loopNum + 1);
            }
        };

        const timer = setTimeout(handleTyping, typingSpeed);
        return () => clearTimeout(timer);
    }, [text, isDeleting, loopNum, typingSpeed, phrases]);

    return (
        <div className="w-full max-w-lg">
            <div className="mb-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">
                Launch Your Idea
            </div>
            
            {/* Input Container - Clean, No Shadow, Darker */}
            <div className="relative bg-[#080808] border border-white/10 rounded-xl p-1.5 flex items-center justify-between transition-colors focus-within:border-white/20">
                
                {/* Left: Icon & Typing Text */}
                <div className="flex items-center gap-3 flex-1 overflow-hidden px-3">
                    <Search className="text-slate-600" size={18} />
                    <div className="font-mono text-sm sm:text-base text-slate-300 whitespace-nowrap flex items-center">
                        <span className="opacity-50 mr-2">build_</span>
                        {text}
                        <span className="ml-1 w-1.5 h-4 bg-[#00D67D] animate-pulse" />
                    </div>
                </div>

                {/* Right: Flat Button (No Shadow) */}
                <button className="flex-shrink-0 bg-[#fff] text-black px-6 py-3 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-[#00c06e] transition-colors duration-200">
                    <span>Build With Us</span>
                    <ArrowRight size={16} />
                </button>
            </div>
        </div>
    );
};

// --- Sub-Component: Tech Card (Floating Element) ---
const TechCard = ({ icon: Icon, label, value, color, delay }: any) => (
    <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay, duration: 0.5 }}
        className="flex items-center gap-3 bg-[#0A0A0A]/80 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-xl w-fit"
    >
        <div className={`p-2 rounded-lg bg-white/5 ${color}`}>
            <Icon size={16} />
        </div>
        <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</div>
            <div className="text-xs font-bold text-white font-mono">{value}</div>
        </div>
    </motion.div>
);

const Hero = () => {
  return (
    <section className="relative w-full min-h-screen mt-10 bg-[#020202] text-white overflow-hidden flex items-center justify-center py-20 lg:py-0">
      
      {/* --- Background --- */}
      <div className="absolute inset-0 z-0 pointer-events-none">
          {/* Subtle Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />
          
          {/* Deep Ambient Glows (Blue & Green) */}
          <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] bg-blue-900/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#00D67D]/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-6 w-full grid lg:grid-cols-[1.1fr_0.9fr] gap-16 lg:gap-24 items-center relative z-10">
        
        {/* === LEFT COLUMN === */}
        <div className="flex flex-col items-start text-left z-20">
           
           {/* Technical Badge */}
           <motion.div 
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ duration: 0.5 }}
             className="mb-8 flex items-center gap-3 text-xs font-mono text-[#00D67D]"
           >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D67D] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00D67D]"></span>
              </span>
              <span className="tracking-widest opacity-80">SYSTEMS ONLINE v2.4</span>
           </motion.div>

           {/* Headline - REDUCED FONT SIZE */}
           <motion.h1 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.8, delay: 0.1 }}
             className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter leading-[1.1] mb-8"
           >
             Spacze builds <br />
             <span className="text-white relative inline-block">
                intelligent
                {/* Decorative underline */}
                <motion.span 
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ delay: 0.8, duration: 1 }}
                    className="absolute bottom-2 left-0 h-1 bg-blue-600/50 -z-10"
                />
             </span> <br/>
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-[#00D67D]">software systems </span> <br />
             <span className="text-slate-200">for modern businesses.</span>
           </motion.h1>

           {/* Subtext */}
           <motion.p 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.8, delay: 0.2 }}
             className="text-lg text-slate-400 max-w-lg mb-12 leading-relaxed font-light"
           >
             From <span className="text-blue-400 font-medium">secure platforms</span> to <span className="text-[#00D67D] font-medium">automated workflows</span>, we help teams design, build, and scale technology that works.
           </motion.p>

           {/* Input Component */}
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.8, delay: 0.3 }}
             className="w-full"
           >
              <ProjectInput />
           </motion.div>

           {/* Trust/Stack Line */}
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 0.6 }}
             className="mt-12 pt-8 border-t border-white/5 w-full max-w-lg flex items-center gap-6"
           >
              <span className="text-[10px] text-slate-600 uppercase tracking-widest">Built With</span>
              <div className="flex gap-4 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                  {/* Icons replaced with color blocks for demonstration */}
                  <div className="h-5 w-5 bg-white rounded-sm" title="Next.js" />
                  <div className="h-5 w-5 bg-blue-500 rounded-sm" title="React" />
                  <div className="h-5 w-5 bg-[#00D67D] rounded-sm" title="Node" />
                  <div className="h-5 w-5 bg-purple-500 rounded-sm" title="AWS" />
              </div>
           </motion.div>
        </div>

        {/* === RIGHT COLUMN: Layered Visuals === */}
        <div className="relative h-[600px] w-full hidden lg:flex items-center justify-center perspective-[2000px]">
            
            {/* 1. Base Layer: The "Platform" */}
            <motion.div 
                initial={{ opacity: 0, rotateX: 20, rotateY: -20 }}
                animate={{ opacity: 1, rotateX: 5, rotateY: -5 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="relative z-10 w-[450px] h-[550px] bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
            >
                {/* Image with subtle overlay */}
                <div className="absolute inset-0 bg-blue-900/10 z-10" />
                <img 
                    src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1000&auto=format&fit=crop" 
                    alt="Dashboard" 
                    className="w-full h-full object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-1000"
                />
                
                {/* Decorative Grid Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] z-20 pointer-events-none" />

                {/* Scanning Line */}
                <motion.div 
                    animate={{ top: ['0%', '100%'] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 w-full h-[2px] bg-[#00D67D]/50 shadow-[0_0_20px_#00D67D] z-30"
                />
            </motion.div>

            {/* 2. Floating Code Card (Top Left) */}
            <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-24 left-10 z-30"
            >
                <div className="bg-[#050505]/90 backdrop-blur border border-white/10 p-4 rounded-xl shadow-2xl min-w-[200px]">
                    <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
                        <Code2 size={14} className="text-blue-400" />
                        <span className="text-[10px] text-slate-500 font-mono">core.config.ts</span>
                    </div>
                    <div className="space-y-1 font-mono text-[10px] leading-relaxed">
                         <div className="text-purple-400">export const <span className="text-white">Config</span> = {'{'}</div>
                         <div className="pl-3 text-slate-400">security: <span className="text-[#00D67D]">'AES-256'</span>,</div>
                         <div className="pl-3 text-slate-400">mode: <span className="text-blue-400">'scale'</span>,</div>
                         <div className="text-purple-400">{'}'};</div>
                    </div>
                </div>
            </motion.div>

            {/* 3. Floating Stats (Bottom Right) */}
            <motion.div 
                animate={{ y: [0, 15, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute bottom-32 -right-4 z-40 space-y-3"
            >
                <TechCard icon={Activity} label="Latency" value="14ms" color="text-[#00D67D]" delay={0.8} />
                <TechCard icon={ShieldCheck} label="Status" value="Secure" color="text-blue-400" delay={1} />
            </motion.div>

            {/* Background Abstract Blur behind Image */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[600px] bg-blue-600/10 blur-[100px] rounded-full -z-10" />

        </div>
      </div>
    </section>
  );
};

export default Hero;