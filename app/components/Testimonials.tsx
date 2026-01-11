'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Quote, Star, UserCheck, MessageSquare, Sparkles, Linkedin, Code2 } from 'lucide-react';

const Testimonials = () => {
    // SCENARIO: Early Stage
    const testimonials = [
        {
            id: 1,
            name: "Alex Rivera",
            role: "Senior Frontend Dev",
            company: "TechCollab",
            text: "The cleanest code I've reviewed in months. They don't just solve the problem; they architect a solution that scales. A rare find.",
            type: "collaborator", 
            initials: "AR"
        },
        {
            id: 2,
            name: "Sarah Jenks",
            role: "Product Manager",
            company: "Stealth Startup",
            text: "Delivered the MVP two days ahead of schedule. The attention to edge cases saved us during our investor demo.",
            type: "client",
            initials: "SJ"
        }
    ];

    return (
        <section className="relative w-full py-24 bg-[#050505] text-white overflow-hidden">
            
            {/* --- Brand Background Effects --- */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
            
            {/* Blue Glow (Left - Engineering side) */}
            <div className="absolute top-20 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
            
            {/* Green Glow (Right - Success side) */}
            <div className="absolute bottom-20 -right-40 w-96 h-96 bg-[#00D67D]/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-16 gap-6">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            <span className="w-2 h-2 rounded-full bg-[#00D67D]" />
                            <span className="text-slate-400 font-mono text-xs uppercase tracking-widest ml-2">Trust & Validation</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold">
                            Voices from <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-[#00D67D]">the network.</span>
                        </h2>
                    </motion.div>
                    
                    <motion.div 
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="hidden md:flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/5 backdrop-blur-sm"
                    >
                        <div className="flex -space-x-3">
                            {[1,2,3].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full bg-[#111] border border-[#222] flex items-center justify-center text-xs text-slate-500">
                                    <UserCheck size={14} />
                                </div>
                            ))}
                        </div>
                        <span className="text-xs text-slate-400 font-medium pl-1">Join our growing list of partners</span>
                    </motion.div>
                </div>

                {/* Grid Layout */}
                <div className="grid md:grid-cols-3 gap-6 auto-rows-fr">
                    
                    {testimonials.map((item, index) => {
                        const isClient = item.type === 'client';
                        const accentColor = isClient ? 'text-[#00D67D]' : 'text-blue-400';
                        const bgColor = isClient ? 'bg-[#00D67D]/10' : 'bg-blue-500/10';
                        const borderColor = isClient ? 'hover:border-[#00D67D]/30' : 'hover:border-blue-500/30';

                        return (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className={`group relative p-8 rounded-[2rem] bg-[#0A0A0A] border border-white/10 flex flex-col justify-between transition-all duration-300 ${borderColor}`}
                            >
                                <div>
                                    {/* Header Badge */}
                                    <div className="flex justify-between items-start mb-6">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${bgColor} ${accentColor} text-[10px] font-bold uppercase tracking-wider`}>
                                            {isClient ? <Star size={12} fill="currentColor" /> : <Code2 size={12} />}
                                            {isClient ? "Verified Client" : "Peer Review"}
                                        </span>
                                        <Quote size={24} className="text-slate-700 group-hover:text-slate-500 transition-colors" />
                                    </div>

                                    {/* Quote */}
                                    <p className="text-slate-300 leading-relaxed text-lg font-medium mb-8">
                                        "{item.text}"
                                    </p>
                                </div>

                                {/* Author Profile */}
                                <div className="flex items-center gap-4 pt-6 border-t border-white/5">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-gradient-to-br ${isClient ? 'from-[#00D67D] to-green-800 text-black' : 'from-blue-500 to-blue-800 text-white'}`}>
                                        {item.initials}
                                    </div>
                                    <div>
                                        <div className="text-white font-bold text-sm">{item.name}</div>
                                        <div className="text-slate-500 text-xs">{item.role}</div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}

                    {/* === CTA CARD (The Reserved Spot) === */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="group relative p-1 rounded-[2rem] bg-gradient-to-br from-blue-500/20 via-white/5 to-[#00D67D]/20"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-[#00D67D] opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />
                        
                        <div className="h-full w-full rounded-[1.8rem] bg-[#080808] p-8 flex flex-col items-center justify-center text-center relative z-10 overflow-hidden">
                            
                            {/* Animated Background Mesh inside card */}
                            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,white_1px,transparent_1px)] bg-[size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/10 to-[#00D67D]/10 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Sparkles size={24} className="text-white group-hover:text-[#00D67D] transition-colors" />
                            </div>
                            
                            <h3 className="text-xl font-bold text-white mb-2">
                                This space is reserved for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-[#00D67D]">you</span>.
                            </h3>
                            
                            <p className="text-slate-400 text-sm mb-8 max-w-[200px]">
                                Let's build something worthy of a 5-star review.
                            </p>
                            
                            <button className="group/btn relative inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-[#00D67D] transition-colors">
                                <span>Start a Project</span>
                                <MessageSquare size={12} className="group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
};

export default Testimonials;