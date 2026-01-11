'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Target, Zap, ArrowRight, Eye, CheckCircle2, Globe2 } from 'lucide-react';

const MissionVision = () => {
    // Animation variants for staggered text
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    return (
        <section className="relative w-full py-24 md:py-32 bg-[#050505] text-white overflow-hidden">
            
            {/* --- Background Elements --- */}
            <div className="absolute inset-0 z-0">
                {/* Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
                {/* Radial Fade for Grid */}
                <div className="absolute inset-0 bg-[#050505] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
            </div>

            {/* Ambient Animated Blobs */}
            <motion.div 
                animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3], 
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-0 left-1/4 w-96 h-96 bg-[#00D67D]/10 rounded-full blur-[128px] pointer-events-none" 
            />
            <motion.div 
                animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: [0.2, 0.4, 0.2], 
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px] pointer-events-none" 
            />

            <div className="max-w-7xl mx-auto px-6 relative z-10">

                {/* --- Section Header --- */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={containerVariants}
                    className="text-center mb-20"
                >
                    <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6">
                        <span className="w-2 h-2 rounded-full bg-[#00D67D] animate-pulse" />
                        <span className="text-xs font-medium text-slate-300 tracking-wide uppercase">Our Direction</span>
                    </motion.div>
                    
                    <motion.h2 variants={itemVariants} className="text-4xl md:text-6xl font-bold tracking-tight">
                        Defined by purpose. <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-400 to-slate-600">
                            Driven by the future.
                        </span>
                    </motion.h2>
                </motion.div>

                {/* --- Cards Container --- */}
                <div className="grid md:grid-cols-2 gap-6 lg:gap-12 items-stretch">

                    {/* === MISSION CARD === */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="group relative flex flex-col p-8 md:p-10 rounded-3xl bg-[#0A0A0A] border border-white/10 hover:border-[#00D67D]/50 overflow-hidden transition-all duration-500"
                    >
                        {/* Hover Gradient Shine */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#00D67D]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        <div className="relative z-10 flex flex-col h-full">
                            {/* Icon Header */}
                            <div className="flex items-center justify-between mb-8">
                                <div className="p-3.5 bg-white/5 border border-white/5 rounded-2xl text-[#00D67D] group-hover:bg-[#00D67D] group-hover:text-[#050505] group-hover:scale-110 transition-all duration-300">
                                    <Target size={28} />
                                </div>
                                <div className="px-3 py-1 rounded-full bg-[#00D67D]/10 border border-[#00D67D]/20">
                                    <span className="text-[10px] font-bold text-[#00D67D] uppercase tracking-widest">Mission</span>
                                </div>
                            </div>

                            <h3 className="text-3xl font-bold mb-4 text-white">
                                Engineering <span className="text-[#00D67D]">Trust</span>
                            </h3>

                            <p className="text-slate-400 text-lg leading-relaxed mb-8">
                                To build reliable, secure, and scalable digital solutions that empower businesses to operate with absolute confidence.
                            </p>

                            {/* Checklist */}
                            <div className="mt-auto space-y-3">
                                {[
                                    "Delivering zero-defect architecture",
                                    "Prioritizing data sovereignty",
                                    "Optimizing for massive scale"
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-default">
                                        <CheckCircle2 className="text-[#00D67D] w-5 h-5 flex-shrink-0" />
                                        <span className="text-sm text-slate-200 font-medium">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* === VISION CARD === */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="group relative flex flex-col p-8 md:p-10 rounded-3xl bg-[#0A0A0A] border border-white/10 hover:border-blue-500/50 overflow-hidden transition-all duration-500"
                    >
                         {/* Abstract Background Animation */}
                         <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                            className="absolute -right-24 -bottom-24 w-80 h-80 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-500 pointer-events-none"
                        >
                             <div className="w-full h-full border-[20px] border-dashed border-white rounded-full" />
                        </motion.div>
                        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="relative z-10 flex flex-col h-full">
                            {/* Icon Header */}
                            <div className="flex items-center justify-between mb-8">
                                <div className="p-3.5 bg-white/5 border border-white/5 rounded-2xl text-blue-400 group-hover:bg-blue-400 group-hover:text-[#050505] group-hover:scale-110 transition-all duration-300">
                                    <Eye size={28} />
                                </div>
                                <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Vision</span>
                                </div>
                            </div>

                            <h3 className="text-3xl font-bold mb-4 text-white">
                                Global <span className="text-blue-400">Benchmark</span>
                            </h3>

                            <p className="text-slate-400 text-lg leading-relaxed mb-8">
                                To become the definitive standard for technical innovation, creating a world where security and creativity merge seamlessly.
                            </p>

                            <div className="mt-auto">
                                <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/10 group-hover:border-blue-500/30 transition-colors">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Globe2 className="text-blue-400 w-4 h-4" />
                                        <span className="text-xs font-bold text-blue-400 uppercase">The 2030 Goal</span>
                                    </div>
                                    <p className="text-sm text-slate-300">
                                        Establishing presence in 50+ countries as the primary architect of the decentralized web.
                                    </p>
                                    <div className="mt-4 flex items-center gap-2 text-white text-sm font-medium group-hover:gap-3 transition-all">
                                        <span>View Roadmap</span>
                                        <ArrowRight size={16} className="text-blue-400" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                </div>

                {/* --- Center Connector (Visual Metaphor) --- */}
                <div className="hidden md:flex justify-center -mt-6 relative z-20">
                    <div className="backdrop-blur-md bg-[#050505]/80 p-1.5 rounded-full border border-white/10 shadow-2xl">
                        <div className="flex items-center gap-4 px-6 py-2 bg-[#1a1a1a] rounded-full border border-white/5">
                            <span className="text-xs font-semibold text-slate-400">Execution</span>
                            <div className="flex space-x-1">
                                <span className="w-1 h-1 bg-[#00D67D] rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                                <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                            </div>
                            <span className="text-xs font-semibold text-slate-400">Evolution</span>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
};

export default MissionVision;