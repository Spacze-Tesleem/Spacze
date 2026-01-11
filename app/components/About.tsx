'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Target, Zap, Users, Quote } from 'lucide-react';

const About = () => {
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
  };

  const pillars = [
    {
      icon: <Shield className="text-[#00D67D]" size={24} />,
      title: "Security First",
      desc: "In an era of data breaches, we build software that is secure by design, not as an afterthought."
    },
    {
      icon: <Zap className="text-[#00D67D]" size={24} />,
      title: "Modern Stack",
      desc: "We use the latest technologies to ensure your business stays ahead of the competition."
    },
    {
      icon: <Target className="text-[#00D67D]" size={24} />,
      title: "Growth Driven",
      desc: "We don't just write code; we build tools designed to increase your revenue and scale."
    }
  ];

  return (
    <section className="relative w-full py-24 bg-[#0A0A0A] text-white overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00D67D]/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          
          {/* LEFT COLUMN: The Story */}
          <motion.div {...fadeIn}>
            <div className="inline-block px-3 py-1 rounded-full bg-[#00D67D]/10 border border-[#00D67D]/20 mb-6">
              <span className="text-xs font-bold tracking-widest text-[#00D67D] uppercase">Our Story</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-8">
              About <span className="text-[#00D67D]">Spacze</span>
            </h2>

            <div className="space-y-6 text-slate-400 text-lg leading-relaxed">
              <p>
                Spacze was created to bridge the gap between <span className="text-white font-medium">visionary business goals</span> and 
                <span className="text-white font-medium"> technical execution</span>. We saw too many growing companies struggling with 
                outdated, insecure software that hindered their progress rather than helping it.
              </p>
              <p>
                Our mission is simple: to help businesses grow using <span className="text-white font-medium">secure, modern software</span>. 
                We believe that great technology should be invisible—it should just work, allowing you to focus on what you do best: 
                running your business.
              </p>
            </div>

            {/* Who We Serve */}
            <div className="mt-12 p-8 rounded-2xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-3 mb-4">
                <Users className="text-[#00D67D]" />
                <h3 className="text-xl font-bold">Who We Serve</h3>
              </div>
              <p className="text-slate-400">
                We partner with <span className="text-white">ambitious startups</span> looking to launch their first MVP and 
                <span className="text-white"> established enterprises</span> needing to modernize their infrastructure for the digital age.
              </p>
            </div>
          </motion.div>

          {/* RIGHT COLUMN: Pillars & Founder Note */}
          <div className="space-y-12">
            
            {/* What makes us different */}
            <div className="grid gap-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-2">The Spacze Advantage</h3>
              {pillars.map((pillar, idx) => (
                <motion.div 
                  key={idx}
                  {...fadeIn}
                  transition={{ delay: idx * 0.1 }}
                  className="flex gap-5 p-6 rounded-xl hover:bg-white/[0.02] transition-colors border border-transparent hover:border-white/5"
                >
                  <div className="mt-1">{pillar.icon}</div>
                  <div>
                    <h4 className="text-lg font-bold mb-1">{pillar.title}</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">{pillar.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Founder Note */}
            <motion.div 
              {...fadeIn}
              transition={{ delay: 0.4 }}
              className="relative p-8 rounded-2xl bg-gradient-to-br from-[#121212] to-[#0A0A0A] border border-white/10 shadow-2xl"
            >
              <Quote className="absolute top-4 right-6 text-white/5" size={60} />
              
              <p className="text-slate-300 italic mb-6 relative z-10 leading-relaxed">
                "At Spacze, we don't just deliver code; we deliver peace of mind. Every line of software we write is built on the 
                foundation of your future success. We're not just your developers—we're your technical partners."
              </p>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#00D67D] to-teal-500 flex items-center justify-center font-bold text-black text-lg">
                  S
                </div>
                <div>
                  <div className="font-bold text-white">The Spacze Team</div>
                  <div className="text-xs text-[#00D67D] font-mono uppercase tracking-tighter">Engineering Excellence</div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </div>

      {/* Subtle Bottom Divider */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </section>
  );
};

export default About;