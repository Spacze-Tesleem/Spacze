'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { ArrowUpRight, Github, ExternalLink, Zap, AlertCircle, Code2, ArrowLeft, ArrowRight, Terminal } from 'lucide-react';

// --- Sub-Component: Abstract Tech Interface (The Visual) ---
const TechInterface = ({ color, isHovered }: { color: string; isHovered: boolean }) => {
    const colorMap: Record<string, string> = {
        blue: 'bg-blue-500',
        green: 'bg-[#00D67D]',
        purple: 'bg-purple-500',
    };
    const activeColor = colorMap[color] || 'bg-white';

    return (
        <div className="relative w-full h-full min-h-[300px] bg-[#0F0F0F] flex flex-col overflow-hidden font-mono text-[10px] md:text-xs border-l border-white/5">
            {/* Window Header */}
            <div className="h-10 bg-[#1a1a1a] border-b border-white/5 flex items-center justify-between px-4">
                <div className="flex gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/30" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/30" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/30" />
                </div>
                <div className="text-slate-600">bash — v.2.0.4</div>
            </div>

            {/* Scrollable Content Simulation */}
            <motion.div
                animate={isHovered ? { y: -40 } : { y: 0 }}
                transition={{ duration: 4, ease: "linear" }}
                className="p-6 space-y-4 text-slate-400"
            >
                <div className="flex gap-3 text-slate-500">
                    <span>$</span>
                    <span className="text-white">init_sequence --verbose</span>
                </div>
                
                {/* Abstract Data Blocks */}
                <div className="space-y-2 opacity-80">
                    <div className="flex items-center gap-4">
                        <span className="text-blue-400">LOADING</span>
                        <div className="flex-1 h-1 bg-white/10 rounded overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }} 
                                whileInView={{ width: '100%' }} 
                                transition={{ duration: 1.5 }}
                                className={`h-full ${activeColor}`} 
                            />
                        </div>
                        <span className="text-white">100%</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="p-3 border border-white/5 rounded bg-white/[0.02]">
                            <div className="mb-2 text-slate-500">Latency</div>
                            <div className="text-xl font-bold text-white">24ms</div>
                        </div>
                        <div className="p-3 border border-white/5 rounded bg-white/[0.02]">
                            <div className="mb-2 text-slate-500">Requests</div>
                            <div className="text-xl font-bold text-white">1.2M</div>
                        </div>
                    </div>

                    <div className="mt-4 p-4 rounded bg-[#050505] border border-white/5 font-mono leading-relaxed">
                        <span className="text-purple-400">function</span> <span className="text-blue-400">optimize</span>() {'{'} <br/>
                        &nbsp;&nbsp;<span className="text-white">return</span> data.<span className="text-yellow-400">filter</span>(x =&gt; x.value &gt; 0); <br/>
                        {'}'}
                    </div>
                </div>
            </motion.div>
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] via-transparent to-transparent pointer-events-none" />
        </div>
    );
};

// --- Sub-Component: Project Card ---
const ProjectCard = ({ project, index }: { project: any, index: number }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="relative flex-shrink-0 w-[85vw] md:w-[600px] lg:w-[800px] snap-center"
        >
            <div className="group relative grid md:grid-cols-[1.1fr_0.9fr] bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden hover:border-white/20 transition-all duration-500 h-full">
                
                {/* Ambient Glow */}
                <div className={`absolute top-0 right-0 w-[400px] h-[400px] rounded-full blur-[120px] opacity-0 group-hover:opacity-10 transition-opacity duration-700 pointer-events-none ${
                    project.color === 'green' ? 'bg-[#00D67D]' : 
                    project.color === 'blue' ? 'bg-blue-500' : 'bg-purple-500'
                }`} />

                {/* LEFT: Content */}
                <div className="relative p-8 md:p-10 flex flex-col h-full z-10">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <div className="flex flex-wrap gap-2">
                            {project.tags.map((tag: string, i: number) => (
                                <div key={i} className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-md border border-white/5 text-[10px] font-mono text-slate-400">
                                    {i === 0 && <Code2 size={12} />}
                                    {tag}
                                </div>
                            ))}
                        </div>
                    </div>

                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                        {project.title}
                    </h3>
                    <p className="text-slate-500 text-sm mb-6">{project.category}</p>

                    {/* Compact Problem/Solution for Slider */}
                    <div className="space-y-4 mb-8">
                        <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                            <h4 className="flex items-center gap-2 text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">
                                <AlertCircle size={12} /> Challenge
                            </h4>
                            <p className="text-slate-400 text-xs leading-relaxed">{project.problem}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-[#00D67D]/5 border border-[#00D67D]/10">
                            <h4 className="flex items-center gap-2 text-[10px] font-bold text-[#00D67D] uppercase tracking-widest mb-1">
                                <Zap size={12} /> Solution
                            </h4>
                            <p className="text-slate-300 text-xs leading-relaxed">{project.solution}</p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
                        <div>
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Result</span>
                            <div className="text-base font-bold text-white">{project.result}</div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-[#00D67D] group-hover:text-black transition-colors">
                            <ArrowUpRight size={16} />
                        </div>
                    </div>
                </div>

                {/* RIGHT: Visual Mockup (Hidden on small mobiles to save space, visible on tablet+) */}
                <div className="hidden md:block relative h-full bg-[#050505]">
                    <TechInterface color={project.color} isHovered={isHovered} />
                </div>
            </div>
        </motion.div>
    );
};

// --- Main Component ---
const PortfolioSlider = () => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [scrollProgress, setScrollProgress] = useState(0);

    const projects = [
        {
            title: "FinDash Analytics",
            category: "Fintech Data Visualization",
            tags: ["Next.js", "Python", "AWS Lambda"],
            problem: "Data fragmented across 4 disparate sources causing reporting delays.",
            solution: "Centralized dashboard aggregating real-time streams via serverless architecture.",
            result: "Saved 15+ hrs/week",
            color: "blue"
        },
        {
            title: "SecureMed Portal",
            category: "Healthcare Compliance",
            tags: ["React", "Node.js", "PostgreSQL"],
            problem: "HIPAA compliance risks due to unsecured email file transfers.",
            solution: "E2E encrypted document portal with 2FA and auto-expiring links.",
            result: "100% Compliance",
            color: "green"
        },
        {
            title: "Velocite E-Com",
            category: "High-Performance Commerce",
            tags: ["Shopify Hydrogen", "Redis", "Edge"],
            problem: "Legacy storefront crashing during high-traffic Black Friday spikes.",
            solution: "Headless architecture with Redis edge caching for 10x load.",
            result: "99.99% Uptime",
            color: "purple"
        },
        {
            title: "AeroStream IO",
            category: "Logistics Tracking",
            tags: ["Vue", "Go", "WebSockets"],
            problem: "Manual fleet tracking leading to 20% fuel inefficiency.",
            solution: "Real-time socket-based telemetry dashboard for 500+ vehicles.",
            result: "12% Cost Reduction",
            color: "blue"
        }
    ];

    // Handle Scroll Buttons
    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const scrollAmount = direction === 'left' ? -600 : 600;
            container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    // Update Progress Bar
    const handleScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            const maxScroll = scrollWidth - clientWidth;
            const progress = (scrollLeft / maxScroll) * 100;
            setScrollProgress(progress);
        }
    };

    return (
        <section className="relative w-full py-24 bg-[#050505] text-white overflow-hidden">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")' }} />
            
            <div className="max-w-[1400px] mx-auto relative z-10 px-6">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="w-8 h-[1px] bg-[#00D67D]" />
                            <span className="text-[#00D67D] font-mono text-xs uppercase tracking-widest">Selected Works</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                            Proof, not <br />
                            <span className="text-slate-600">promises.</span>
                        </h2>
                    </div>
                    
                    {/* Navigation Controls */}
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => scroll('left')}
                            className="p-3 rounded-full border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all active:scale-95"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <button 
                            onClick={() => scroll('right')}
                            className="p-3 rounded-full border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all active:scale-95"
                        >
                            <ArrowRight size={20} />
                        </button>
                    </div>
                </div>

                {/* Slider Container */}
                <div className="relative -mx-6 md:-mx-0">
                    <div 
                        ref={scrollContainerRef}
                        onScroll={handleScroll}
                        className="flex gap-6 overflow-x-auto pb-12 px-6 md:px-0 snap-x snap-mandatory scrollbar-hide"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {projects.map((project, index) => (
                            <ProjectCard key={index} project={project} index={index} />
                        ))}
                        
                        {/* CTA Card at the end of slider */}
                        <div className="relative flex-shrink-0 w-[85vw] md:w-[300px] snap-center flex items-center justify-center">
                            <a href="#" className="group flex flex-col items-center gap-4 text-slate-500 hover:text-[#00D67D] transition-colors p-8 rounded-3xl border border-white/5 hover:border-[#00D67D]/30 bg-[#0A0A0A] w-full h-full justify-center">
                                <div className="p-4 rounded-full bg-white/5 group-hover:bg-[#00D67D]/10 transition-colors">
                                    <Github size={32} />
                                </div>
                                <span className="text-sm font-bold uppercase tracking-widest">View All Projects</span>
                            </a>
                        </div>
                    </div>

                    {/* Gradient Fade for Edges (Desktop only) */}
                    <div className="hidden md:block absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-[#050505] to-transparent pointer-events-none" />
                </div>

                {/* Progress Bar */}
                <div className="w-full h-[1px] bg-white/10 mt-4 relative overflow-hidden">
                    <motion.div 
                        className="absolute left-0 top-0 h-full bg-[#00D67D]"
                        style={{ width: `${scrollProgress}%` }}
                        // Add a minimum width so it's visible at start
                        animate={{ width: `${Math.max(scrollProgress, 5)}%` }}
                    />
                </div>
                <div className="flex justify-between mt-2 text-[10px] font-mono text-slate-600 uppercase tracking-widest">
                    <span>01</span>
                    <span>0{projects.length}</span>
                </div>

            </div>
        </section>
    );
};

export default PortfolioSlider;