'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  LayoutTemplate, 
  Terminal, 
  ShieldAlert, 
  Rocket,
  ArrowRight
} from 'lucide-react';

const ProcessAccordion = () => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      id: 0,
      title: "Discovery",
      subtitle: "Understanding your vision",
      description: "We dive deep into your business goals, user needs, and technical requirements. No code is written until we fully understand the problem.",
      icon: <Search className="text-white" size={24} />,
      outcome: "Clear Roadmap"
    },
    {
      id: 1,
      title: "Planning",
      subtitle: "Blueprints & Design",
      description: "We architect the database, map user flows, and design high-fidelity prototypes. You see exactly what the product will look like.",
      icon: <LayoutTemplate className="text-white" size={24} />,
      outcome: "Approved Designs"
    },
    {
      id: 2,
      title: "Development",
      subtitle: "Writing the code",
      description: "Our engineers build your solution using modern, scalable frameworks. We work in agile sprints with regular progress updates.",
      icon: <Terminal className="text-white" size={24} />,
      outcome: "Functional MVP"
    },
    {
      id: 3,
      title: "Testing",
      subtitle: "Security & QA",
      description: "Rigorous stress testing, security audits, and bug hunting to ensure your application is bulletproof before the public sees it.",
      icon: <ShieldAlert className="text-white" size={24} />,
      outcome: "Bug-Free Code"
    },
    {
      id: 4,
      title: "Launch",
      subtitle: "Deployment & Growth",
      description: "We manage the deployment to cloud servers, set up monitoring tools, and remain on standby for post-launch support.",
      icon: <Rocket className="text-white" size={24} />,
      outcome: "Live Product"
    },
  ];

  return (
    <section className="relative w-full py-24 bg-[#0A0A0A] text-white overflow-hidden">
      
      {/* Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#00D67D]/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            How We <span className="text-[#00D67D]">Work</span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-lg">
            A simple, transparent workflow designed to take you from concept to market leader without the headaches.
          </p>
        </div>

        {/* --- DESKTOP: Horizontal Accordion --- */}
        <div className="hidden lg:flex gap-4 h-[500px] w-full">
          {steps.map((step) => {
            const isActive = activeStep === step.id;
            
            return (
              <motion.div
                key={step.id}
                layout
                onClick={() => setActiveStep(step.id)}
                onHoverStart={() => setActiveStep(step.id)}
                className={`
                  relative h-full rounded-3xl overflow-hidden cursor-pointer border transition-colors duration-500 ease-out
                  ${isActive 
                    ? 'flex-[3] border-[#00D67D] bg-[#121212]' 
                    : 'flex-[1] border-white/5 bg-[#0F0F0F] hover:bg-[#161616]'}
                `}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                {/* Background Gradient for Active Card */}
                {isActive && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-gradient-to-br from-[#00D67D]/5 to-transparent pointer-events-none" 
                  />
                )}

                {/* Card Content Container */}
                <div className="absolute inset-0 flex flex-col p-8">
                  
                  {/* Top: Icon & Number */}
                  <div className="flex justify-between items-start mb-auto">
                    <div className={`p-3 rounded-full transition-colors duration-300 ${isActive ? 'bg-[#00D67D]' : 'bg-white/10'}`}>
                      {React.cloneElement(step.icon as React.ReactElement, { className: isActive ? 'text-black' : 'text-slate-400' })}
                    </div>
                    <span className={`text-4xl font-bold font-mono transition-colors duration-300 ${isActive ? 'text-white/20' : 'text-white/5'}`}>
                      0{step.id + 1}
                    </span>
                  </div>

                  {/* Middle: Vertical Text (Inactive) */}
                  {!isActive && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap">
                      <h3 className="text-xl font-bold text-slate-400 tracking-widest uppercase">
                        {step.title}
                      </h3>
                    </div>
                  )}

                  {/* Bottom: Expanded Content (Active) */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ delay: 0.1, duration: 0.3 }}
                      >
                        <h3 className="text-3xl font-bold mb-2">{step.title}</h3>
                        <div className="text-[#00D67D] font-medium mb-4">{step.subtitle}</div>
                        <p className="text-slate-400 leading-relaxed mb-8 max-w-md">
                          {step.description}
                        </p>
                        
                        <div className="inline-flex items-center gap-2 text-sm text-white font-semibold border-t border-white/10 pt-4 w-full">
                          <span className="text-slate-500 uppercase text-xs tracking-wider">Outcome:</span>
                          {step.outcome}
                          <ArrowRight size={14} className="ml-auto text-[#00D67D]" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* --- MOBILE: Vertical Stack --- */}
        <div className="flex flex-col gap-4 lg:hidden">
          {steps.map((step) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-[#121212] border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-[#00D67D]/10 rounded-lg text-[#00D67D]">
                     {step.icon}
                   </div>
                   <h3 className="text-xl font-bold">{step.title}</h3>
                 </div>
                 <span className="text-2xl font-bold text-white/10 font-mono">0{step.id + 1}</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                {step.description}
              </p>
              <div className="flex items-center justify-between text-xs font-medium border-t border-white/5 pt-3">
                <span className="text-slate-500 uppercase">Outcome</span>
                <span className="text-[#00D67D]">{step.outcome}</span>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default ProcessAccordion;