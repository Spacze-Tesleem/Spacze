'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionTemplate, useMotionValue } from 'framer-motion';
import { ArrowRight, Copy, Check, Github, Linkedin, Twitter, Terminal, MessageSquare, Zap } from 'lucide-react';

const EnhancedCTA = () => {
    const [copied, setCopied] = useState(false);
    const email = "spaczehq@gmail.com";
    
    // Mouse tracking for spotlight effect
    const cardRef = useRef<HTMLDivElement>(null);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const { left, top } = cardRef.current.getBoundingClientRect();
        mouseX.set(e.clientX - left);
        mouseY.set(e.clientY - top);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(email);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const maskImage = useMotionTemplate`radial-gradient(600px circle at ${mouseX}px ${mouseY}px, white, transparent)`;

    return (
        <section className="relative w-full py-32 px-4 bg-[#020202] overflow-hidden flex items-center justify-center">
            
            {/* --- 1. Background Atmosphere --- */}
            <div className="absolute inset-0 w-full h-full bg-[#020202]">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[128px]" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#00D67D]/10 rounded-full blur-[128px]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />
            </div>

            {/* --- 2. The Main "Console" Card --- */}
            <div 
                ref={cardRef}
                onMouseMove={handleMouseMove}
                className="relative w-full max-w-5xl rounded-[2.5rem] bg-white/[0.01] border border-white/10 group"
            >
                {/* Spotlight Reveal Layer */}
                <motion.div 
                    className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2.5rem]"
                    style={{ maskImage, background: 'linear-gradient(to bottom right, rgba(0, 214, 125, 0.15), rgba(59, 130, 246, 0.15))' }}
                />

                <div className="relative z-10 flex flex-col md:flex-row gap-12 p-8 md:p-16 items-center md:items-start justify-between">
                    
                    {/* LEFT: The Pitch */}
                    <div className="flex-1 text-center md:text-left space-y-8">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-xs font-medium text-slate-300 mb-6">
                                <Zap size={12} className="text-[#00D67D] fill-[#00D67D]" />
                                <span>AVAILABLE FOR NEW PROJECTS</span>
                            </div>
                            
                            <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-[1] mb-6">
                                Let's ship <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-[#00D67D]">
                                    masterpieces.
                                </span>
                            </h2>
                            <p className="text-slate-400 text-lg max-w-lg mx-auto md:mx-0 leading-relaxed font-light">
                                You have the vision. I have the architecture. Let's bridge the gap between concept and scalable reality.
                            </p>
                        </div>

                        {/* Social Stack */}
                        <div className="flex items-center justify-center md:justify-start gap-4 pt-2">
                            {[
                                { icon: <Github size={20} />, label: "Code" },
                                { icon: <Linkedin size={20} />, label: "Connect" },
                                { icon: <Twitter size={20} />, label: "Follow" },
                            ].map((social, idx) => (
                                <a 
                                    key={idx} 
                                    href="#"
                                    className="group/icon relative flex items-center justify-center w-12 h-12 rounded-2xl bg-white/5 border border-white/5 hover:bg-white hover:border-white hover:scale-110 transition-all duration-300"
                                >
                                    <span className="text-slate-400 group-hover/icon:text-black transition-colors">{social.icon}</span>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT: The Interaction Zone */}
                    <div className="w-full md:w-[420px] bg-[#0A0A0A]/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-2xl shadow-black/50">
                        
                        {/* Terminal Header */}
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                            <div className="ml-auto text-[10px] font-mono text-slate-600">contact_form.tsx</div>
                        </div>

                        {/* Interactive Email Bar */}
                        <div className="group relative bg-black rounded-xl border border-white/10 p-1 pl-4 flex items-center gap-3 transition-colors hover:border-white/20">
                            <Terminal size={16} className="text-[#00D67D]" />
                            <div className="flex-1 font-mono text-xs md:text-sm text-slate-300 truncate">
                                <span className="text-[#00D67D] mr-2">➜</span>
                                {email}
                            </div>
                            <button 
                                onClick={handleCopy}
                                className="relative px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-all active:scale-95"
                            >
                                <AnimatePresence mode='wait'>
                                    {copied ? (
                                        <motion.div
                                            key="copied"
                                            initial={{ scale: 0.5, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0.5, opacity: 0 }}
                                        >
                                            <Check size={16} className="text-[#00D67D]" />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="copy"
                                            initial={{ scale: 0.5, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0.5, opacity: 0 }}
                                        >
                                            <Copy size={16} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </button>
                        </div>

                        {/* Primary Button */}
                        <a href="mailto:spaczehq@gmail.com" className="group relative w-full overflow-hidden rounded-xl">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-[#00D67D] transition-transform duration-300 group-hover:scale-105" />
                            <div className="relative w-full py-4 bg-transparent flex items-center justify-center gap-2 text-white font-bold text-base tracking-wide">
                                <span>Initialize Project</span>
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                            {/* Shine Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                        </a>

                        <div className="text-center">
                            <p className="text-[10px] text-slate-500 font-mono">
                                RESPONSE TIME: &lt; 24 HOURS
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default EnhancedCTA;