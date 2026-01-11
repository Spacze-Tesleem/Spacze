'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  LayoutTemplate,
  Terminal,
  ShieldAlert,
  Rocket,
  ArrowRight,
  Plus,
  Minus
} from 'lucide-react';

const ProcessAccordion = () => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      id: 0,
      title: "Discovery",
      subtitle: "Understanding your vision",
      description: "We dive deep into your business goals, user needs, and technical requirements. No code is written until we fully understand the problem.",
      icon: <Search size={24} />,
      outcome: "Clear Roadmap"
    },
    {
      id: 1,
      title: "Planning",
      subtitle: "Blueprints & Design",
      description: "We architect the database, map user flows, and design high-fidelity prototypes. You see exactly what the product will look like.",
      icon: <LayoutTemplate size={24} />,
      outcome: "Approved Designs"
    },
    {
      id: 2,
      title: "Development",
      subtitle: "Writing the code",
      description: "Our engineers build your solution using modern, scalable frameworks. We work in agile sprints with regular progress updates.",
      icon: <Terminal size={24} />,
      outcome: "Functional MVP"
    },
    {
      id: 3,
      title: "Testing",
      subtitle: "Security & QA",
      description: "Rigorous stress testing, security audits, and bug hunting to ensure your application is bulletproof before the public sees it.",
      icon: <ShieldAlert size={24} />,
      outcome: "Bug-Free Code"
    },
    {
      id: 4,
      title: "Launch",
      subtitle: "Deployment & Growth",
      description: "We manage the deployment to cloud servers, set up monitoring tools, and remain on standby for post-launch support.",
      icon: <Rocket size={24} />,
      outcome: "Live Product"
    },
  ];

  return (
    <section className="relative w-full py-24 bg-neutral-950 text-white overflow-hidden selection:bg-[#00D67D] selection:text-black">
      
      {/* Subtle Grid Background - No blurry blobs */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Header */}
        <div className="mb-20">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
            How We <span className="text-[#00D67D]">Work</span>
          </h2>
          <div className="h-1 w-20 bg-[#00D67D] mb-6" />
          <p className="text-neutral-400 max-w-xl text-lg font-light leading-relaxed">
            A precise, transparent workflow designed to take you from concept to market leader.
          </p>
        </div>

        {/* --- DESKTOP: Horizontal Accordion --- */}
        <div className="hidden lg:flex gap-2 h-[550px] w-full">
          {steps.map((step) => {
            const isActive = activeStep === step.id;
            
            return (
              <motion.div
                key={step.id}
                layout
                onClick={() => setActiveStep(step.id)}
                className={`
                  relative h-full rounded-sm overflow-hidden cursor-pointer 
                  border transition-colors duration-500 ease-out
                  ${isActive 
                    ? 'flex-[3] border-[#00D67D] bg-neutral-900' 
                    : 'flex-[1] border-white/5 bg-neutral-900/40 hover:bg-neutral-900 hover:border-white/10'}
                `}
                transition={{ type: "spring", stiffness: 200, damping: 24 }}
              >
                <div className="absolute inset-0 flex flex-col p-8">
                  
                  {/* Top: Icon & Number */}
                  <div className="flex justify-between items-start">
                    <div className={`
                      p-3 transition-colors duration-300 rounded-sm
                      ${isActive ? 'bg-[#00D67D] text-black' : 'bg-white/5 text-neutral-400'}
                    `}>
                      {step.icon}
                    </div>
                    <span className={`text-5xl font-bold font-mono transition-colors duration-300 ${isActive ? 'text-white/10' : 'text-transparent'}`}>
                      0{step.id + 1}
                    </span>
                  </div>

                  {/* Vertical Text (Inactive) */}
                  {!isActive && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-90deg] whitespace-nowrap origin-center">
                      <h3 className="text-lg font-bold text-neutral-500 tracking-widest uppercase">
                        {step.title}
                      </h3>
                    </div>
                  )}

                  {/* Expanded Content (Active) */}
                  <AnimatePresence mode="wait">
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                        className="mt-auto"
                      >
                        <h3 className="text-4xl font-bold mb-2 tracking-tight">{step.title}</h3>
                        <div className="text-[#00D67D] font-mono text-sm mb-6 tracking-wide uppercase">{step.subtitle}</div>
                        
                        <p className="text-neutral-400 leading-relaxed mb-10 max-w-lg text-lg">
                          {step.description}
                        </p>
                        
                        <div className="flex items-center gap-4 border-t border-white/10 pt-6">
                           <div className="px-3 py-1 border border-[#00D67D]/30 text-[#00D67D] text-xs font-mono uppercase tracking-wider rounded-full">
                              Outcome
                           </div>
                           <span className="text-white font-medium">{step.outcome}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* --- MOBILE: Vertical Accordion --- */}
        <div className="flex flex-col gap-3 lg:hidden">
          {steps.map((step) => {
            const isActive = activeStep === step.id;
            return (
              <div 
                key={step.id} 
                onClick={() => setActiveStep(isActive ? -1 : step.id)}
                className={`
                  border rounded-sm overflow-hidden transition-all duration-300
                  ${isActive ? 'bg-neutral-900 border-[#00D67D]' : 'bg-neutral-900/40 border-white/5'}
                `}
              >
                <div className="p-6 flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-4">
                    <span className={`font-mono text-lg ${isActive ? 'text-[#00D67D]' : 'text-neutral-600'}`}>0{step.id + 1}</span>
                    <h3 className={`text-xl font-bold ${isActive ? 'text-white' : 'text-neutral-400'}`}>{step.title}</h3>
                  </div>
                  <div className={isActive ? 'text-[#00D67D]' : 'text-neutral-500'}>
                    {isActive ? <Minus size={20} /> : <Plus size={20} />}
                  </div>
                </div>

                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 pt-0">
                        <p className="text-neutral-400 leading-relaxed mb-6 border-l-2 border-[#00D67D]/20 pl-4">
                          {step.description}
                        </p>
                        <div className="flex items-center justify-between text-sm bg-black/20 p-3 rounded-sm border border-white/5">
                          <span className="text-neutral-500 uppercase tracking-wider font-mono text-xs">Outcome</span>
                          <span className="text-[#00D67D] font-medium">{step.outcome}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default ProcessAccordion;