'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { ArrowUpRight, Github, Zap, AlertCircle, Code2, ArrowLeft, ArrowRight } from 'lucide-react';

// --- Sub-Component: Project Card ---
const ProjectCard = ({ project, index }: { project: any, index: number }) => {
    return (
        <motion.div
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
                        <a
                            href={project.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-[#00D67D] group-hover:text-black transition-colors"
                        >
                            <ArrowUpRight size={16} />
                        </a>
                    </div>
                </div>

                {/* RIGHT: Project Screenshot (Hidden on small mobiles, visible on tablet+) */}
                {project.image && (
                    <div className="hidden md:flex flex-col justify-center items-center relative h-full bg-[#080808] p-5 border-l border-white/5">
                        {/* Browser chrome mockup */}
                        <div className="w-full rounded-xl overflow-hidden border border-white/10 shadow-2xl transition-transform duration-500 group-hover:scale-[1.03]">
                            {/* Browser bar */}
                            <div className="flex items-center gap-2 px-3 py-2 bg-[#1a1a1a] border-b border-white/5">
                                <div className="flex gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-red-500/50" />
                                    <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                                    <div className="w-2 h-2 rounded-full bg-green-500/50" />
                                </div>
                                <div className="flex-1 mx-2 px-2 py-0.5 rounded bg-white/5 text-[9px] font-mono text-slate-500 truncate">
                                    {project.url}
                                </div>
                            </div>
                            {/* Screenshot */}
                            <div className="relative w-full aspect-[16/10] overflow-hidden bg-[#111]">
                                <Image
                                    src={project.image}
                                    alt={`${project.title} screenshot`}
                                    fill
                                    className="object-cover object-top"
                                />
                            </div>
                        </div>
                        {/* Ambient glow behind mockup */}
                        <div className={`absolute inset-0 blur-[80px] opacity-5 pointer-events-none ${
                            project.color === 'green' ? 'bg-[#00D67D]' :
                            project.color === 'blue' ? 'bg-blue-500' : 'bg-purple-500'
                        }`} />
                    </div>
                )}
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
            title: "Jannah Vizora",
            category: "Real Estate Marketing Website",
            tags: ["Next.js", "Tailwind CSS", "Framer Motion"],
            problem: "No digital presence to showcase premium properties to high-intent buyers.",
            solution: "Conversion-focused marketing site with immersive property listings and lead capture.",
            result: "Live & Converting",
            color: "green",
            image: "/jannah-vizora.png",
            url: "https://jannah-vizora.vercel.app/"
        },
        {
            title: "Livana",
            category: "Property Management Platform",
            tags: ["React", "Node.js", "PostgreSQL"],
            problem: "Landlords managing tenants, payments, and maintenance across spreadsheets.",
            solution: "Full-stack web app centralising tenant records, rent tracking, and maintenance requests.",
            result: "End-to-End Automation",
            color: "blue",
            image: "/livana.png",
            url: "https://property-manager-property-manager.vercel.app/"
        },
        {
            title: "MoverSpadi",
            category: "Moving & Logistics Platform",
            tags: ["Next.js", "Tailwind CSS", "REST API"],
            problem: "Customers had no reliable way to book and track moving services online.",
            solution: "Booking platform with real-time job tracking and instant mover quotes.",
            result: "Seamless Bookings",
            color: "purple",
            image: "/moverspadi.png",
            url: "https://moverspadi.vercel.app/"
        },
        {
            title: "DMS",
            category: "Digital Marketing Website",
            tags: ["HTML", "CSS", "JavaScript"],
            problem: "Agency lacked a professional web presence to attract and convert clients.",
            solution: "Clean, fast marketing site communicating services and driving enquiries.",
            result: "Brand Established",
            color: "blue",
            image: "/dms.png",
            url: "https://dmsv1.netlify.app"
        },
        {
            title: "Mumtaazah",
            category: "E-Commerce & Brand Website",
            tags: ["Next.js", "Tailwind CSS", "Stripe"],
            problem: "Fashion brand selling exclusively via social DMs with no scalable storefront.",
            solution: "Branded e-commerce site with product catalogue, cart, and secure checkout.",
            result: "Store Live",
            color: "green",
            image: "/mumtaazah.png",
            url: "https://mumtaazah.vercel.app/"
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