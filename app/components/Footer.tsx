'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Twitter, 
  Linkedin, 
  Github, 
  Mail, 
  MapPin,
  ChevronRight,
  Layers
} from 'lucide-react';

// --- Sub-Component: Interactive Link ---
const FooterLink = ({ href, label }: { href: string, label: string }) => {
  return (
    <li>
      <a 
        href={href} 
        className="group flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors duration-300"
      >
        <span className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-[#00D67D]">
          <ChevronRight size={12} />
        </span>
        <span className="-translate-x-4 group-hover:translate-x-0 transition-transform duration-300">
          {label}
        </span>
      </a>
    </li>
  );
};

// --- Main Footer ---
const Footer = () => {
  const [email, setEmail] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  return (
    <footer className="relative w-full bg-[#020202] text-white pt-32 pb-12 overflow-hidden border-t border-white/5">
      
      {/* --- Background Ambience --- */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Giant Watermark Text */}
        <div className="absolute bottom-[-5%] left-1/2 -translate-x-1/2 text-[15vw] leading-none font-bold text-white/[0.02] select-none whitespace-nowrap z-0">
          SPACZE
        </div>
        
        {/* Gradient Mesh */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-900/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#00D67D]/5 blur-[150px] rounded-full" />
        
        {/* Grain Texture overlay */}
        <div className="absolute inset-0 opacity-[0.02] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 mb-24">
          
          {/* COLUMN 1: Brand (Span 4) */}
          <div className="lg:col-span-4 space-y-8">
            <div className="flex items-center gap-2">
               <div className="w-10 h-10 bg-gradient-to-br from-[#00D67D] to-blue-600 text-white flex items-center justify-center font-bold rounded-lg shadow-lg shadow-blue-900/20">
                 S
               </div>
               <span className="text-2xl font-bold tracking-tight">Spacze<span className="text-[#00D67D]">.</span></span>
            </div>
            
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              We build the invisible architecture that powers modern business. 
              Secure, scalable, and engineered for the future.
            </p>

            {/* Premium Status Indicator */}
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-white/5 bg-white/[0.03] backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D67D] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00D67D]"></span>
              </span>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-0.5">System Status</span>
                <span className="text-[10px] font-mono text-[#00D67D] font-medium leading-none">ALL SYSTEMS OPERATIONAL</span>
              </div>
            </div>
          </div>

          {/* COLUMN 2: Platform (Span 2) */}
          <div className="lg:col-span-2 lg:col-start-6">
            <h4 className="font-bold text-white mb-6 flex items-center gap-2 text-sm uppercase tracking-wider">
              Platform
            </h4>
            <ul className="space-y-3">
              <FooterLink href="#" label="Services" />
              <FooterLink href="#" label="Case Studies" />
              <FooterLink href="#" label="Process" />
              <FooterLink href="#" label="Pricing" />
            </ul>
          </div>

          {/* COLUMN 3: Company (Span 2) */}
          <div className="lg:col-span-2">
            <h4 className="font-bold text-white mb-6 flex items-center gap-2 text-sm uppercase tracking-wider">
              Company
            </h4>
            <ul className="space-y-3">
              <FooterLink href="#" label="About" />
              <FooterLink href="#" label="Careers" />
              <FooterLink href="#" label="Blog" />
              <FooterLink href="#" label="Contact" />
            </ul>
          </div>

          {/* COLUMN 4: Newsletter (Span 3) */}
          <div className="lg:col-span-3">
            <h4 className="font-bold text-white mb-6 text-sm uppercase tracking-wider">
              Weekly Intel
            </h4>
            
            {/* Terminal-Style Input */}
            <div 
              className={`
                group relative flex items-center bg-[#080808] border rounded-xl p-1.5 transition-all duration-300
                ${isFocused 
                  ? 'border-blue-500 shadow-[0_0_20px_-5px_rgba(59,130,246,0.3)]' 
                  : 'border-white/10 hover:border-white/20'}
              `}
            >
              <div className="pl-3 text-slate-600 font-mono text-xs select-none">{'>'}</div>
              <input 
                type="email" 
                placeholder="email@address.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="bg-transparent text-sm font-mono text-white px-3 py-2 w-full outline-none placeholder:text-slate-700"
              />
              <button className="bg-white hover:bg-[#00D67D] text-black p-2.5 rounded-lg transition-colors duration-200">
                <ArrowRight size={14} />
              </button>
            </div>
            
            <p className="text-[10px] text-slate-600 mt-3">
              Join 2,000+ founders. No spam, just tech.
            </p>

            {/* Social Icons */}
            <div className="flex gap-4 mt-8">
              {[Twitter, Linkedin, Github].map((Icon, i) => (
                <a key={i} href="#" className="p-2 rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white hover:scale-110 transition-all duration-300">
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

        </div>

        {/* --- Bottom Bar --- */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Copyright */}
          <div className="flex flex-col md:flex-row items-center gap-4 text-xs text-slate-600">
            <span>© {new Date().getFullYear()} Spacze Digital Inc.</span>
            <span className="hidden md:block w-1 h-1 bg-slate-800 rounded-full" />
            <div className="flex gap-4">
              <a href="#" className="hover:text-slate-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-slate-400 transition-colors">Terms</a>
            </div>
          </div>
          
          {/* Signature */}
          <div className="flex items-center gap-2 text-[10px] text-slate-700 font-mono uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity">
             <Layers size={12} />
             <span>Architected by Spacze</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;