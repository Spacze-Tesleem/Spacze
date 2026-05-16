'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { 
  Mail, 
  MessageSquare, 
  MapPin, 
  ArrowUpRight, 
  Twitter, 
  Linkedin, 
  Github, 
  CheckCircle2, 
  Copy, 
  Send,
  Loader2,
  Globe2
} from 'lucide-react';

const ContactPage = () => {
  const [copied, setCopied] = useState(false);
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Email Copy Logic
  const handleCopyEmail = () => {
    navigator.clipboard.writeText('spaczehq@gmail.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simulated Form Logic
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('submitting');
    await new Promise(resolve => setTimeout(resolve, 2000));
    setFormStatus('success');
  };

  return (
    <section className="relative w-full min-h-screen bg-[#020202] text-white pt-32 pb-20 px-6 overflow-hidden flex items-center">
      
      {/* --- 1. Dynamic Background Atmosphere --- */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        <motion.div 
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-[20%] -right-[10%] w-[800px] h-[800px] bg-blue-600/10 blur-[150px] rounded-full" 
        />
        <motion.div 
            animate={{ scale: [1, 1.2, 1], rotate: [0, -5, 5, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-[20%] -left-[10%] w-[800px] h-[800px] bg-[#00D67D]/5 blur-[150px] rounded-full" 
        />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-[1fr_1.2fr] gap-16 items-center relative z-10">
        
        {/* --- LEFT COLUMN: CONTEXT & CONNECT --- */}
        <div className="flex flex-col space-y-12">
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-xs font-mono text-slate-400 mb-8">
                <span className="w-2 h-2 rounded-full bg-[#00D67D] animate-pulse" />
                Response time: &lt; 24 hours
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              Let's <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-[#00D67D]">collaborate.</span>
            </h1>
            
            <p className="text-slate-400 text-lg md:text-xl max-w-lg leading-relaxed font-light">
              Have a visionary project? We help ambitious brands build scalable, high-performance digital products.
            </p>
          </motion.div>

          {/* Contact Details */}
          <div className="space-y-6">
            
            {/* Email Card */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              onClick={handleCopyEmail}
              className="group cursor-pointer p-6 rounded-2xl bg-[#0A0A0A] border border-white/10 hover:border-blue-500/30 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-mono text-slate-500 uppercase tracking-widest">Direct Email</span>
                {copied ? <CheckCircle2 size={18} className="text-[#00D67D]" /> : <Copy size={18} className="text-slate-600 group-hover:text-blue-400 transition-colors" />}
              </div>
              <div className="text-2xl font-medium text-white group-hover:text-blue-400 transition-colors">
                spaczehq@gmail.com
              </div>
            </motion.div>

            {/* Grid for Secondary Info */}
            <div className="grid grid-cols-2 gap-4">
                <motion.a 
                    href="#"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-6 rounded-2xl bg-[#0A0A0A] border border-white/10 hover:border-[#00D67D]/30 group transition-all"
                >
                    <div className="mb-4 p-3 w-fit rounded-full bg-[#00D67D]/10 text-[#00D67D]">
                        <MessageSquare size={20} />
                    </div>
                    <div className="text-sm font-mono text-slate-500 uppercase tracking-widest mb-1">Live Chat</div>
                    <div className="flex items-center gap-2 font-medium text-white group-hover:text-[#00D67D] transition-colors">
                        WhatsApp <ArrowUpRight size={16} />
                    </div>
                </motion.a>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="p-6 rounded-2xl bg-[#0A0A0A] border border-white/10 group"
                >
                    <div className="mb-4 p-3 w-fit rounded-full bg-blue-500/10 text-blue-400">
                        <Globe2 size={20} />
                    </div>
                    <div className="text-sm font-mono text-slate-500 uppercase tracking-widest mb-1">Timezone</div>
                    <div className="font-medium text-white">
                        New York (GMT-4)
                    </div>
                </motion.div>
            </div>
          </div>

          {/* Social Row */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex gap-4 pt-4"
          >
            {[
                { icon: <Github size={20} />, href: "#" }, 
                { icon: <Linkedin size={20} />, href: "#" }, 
                { icon: <Twitter size={20} />, href: "#" }
            ].map((social, idx) => (
                <a 
                    key={idx} 
                    href={social.href}
                    className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-slate-400 hover:bg-white hover:text-black hover:scale-110 transition-all duration-300"
                >
                    {social.icon}
                </a>
            ))}
          </motion.div>

        </div>

        {/* --- RIGHT COLUMN: THE INTELLIGENT FORM --- */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
            {/* Glass Card Container */}
            <div className="relative bg-[#050505]/60 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl overflow-hidden">
                
                {/* Form Glow Effect based on status */}
                <div className={`absolute inset-0 transition-colors duration-700 pointer-events-none ${
                    formStatus === 'success' ? 'bg-[#00D67D]/5' : 'bg-blue-600/5'
                }`} />

                <AnimatePresence mode='wait'>
                    {formStatus === 'success' ? (
                        <motion.div 
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex flex-col items-center justify-center text-center py-20 min-h-[500px]"
                        >
                            <motion.div 
                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#00D67D] to-teal-500 flex items-center justify-center mb-8 shadow-[0_0_50px_-12px_rgba(0,214,125,0.5)]"
                            >
                                <CheckCircle2 size={48} className="text-black" />
                            </motion.div>
                            <h3 className="text-3xl font-bold text-white mb-4">Message Received.</h3>
                            <p className="text-slate-400 max-w-xs mx-auto mb-8">
                                Thank you for reaching out. We will analyze your request and reply within 24 hours.
                            </p>
                            <button 
                                onClick={() => setFormStatus('idle')}
                                className="px-6 py-2 rounded-full border border-white/10 text-sm font-medium hover:bg-white hover:text-black transition-all"
                            >
                                Send another
                            </button>
                        </motion.div>
                    ) : (
                        <motion.form 
                            key="form"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onSubmit={handleSubmit} 
                            className="space-y-6 relative z-10"
                        >
                            <div className="grid md:grid-cols-2 gap-6">
                                <InputField 
                                    label="Name" 
                                    placeholder="John Doe" 
                                    type="text" 
                                    id="name" 
                                    focusedField={focusedField} 
                                    setFocusedField={setFocusedField} 
                                />
                                <InputField 
                                    label="Email" 
                                    placeholder="john@company.com" 
                                    type="email" 
                                    id="email" 
                                    focusedField={focusedField} 
                                    setFocusedField={setFocusedField} 
                                />
                            </div>

                            <InputField 
                                label="Budget Range (USD)" 
                                placeholder="e.g. $5k - $10k" 
                                type="text" 
                                id="budget" 
                                focusedField={focusedField} 
                                setFocusedField={setFocusedField} 
                            />

                            <div className="space-y-2">
                                <label className={`text-xs font-mono uppercase tracking-widest transition-colors duration-300 ${focusedField === 'message' ? 'text-[#00D67D]' : 'text-slate-500'}`}>
                                    Project Details
                                </label>
                                <textarea 
                                    required 
                                    rows={4}
                                    onFocus={() => setFocusedField('message')}
                                    onBlur={() => setFocusedField(null)}
                                    placeholder="Tell us about your goals, timeline, and requirements..." 
                                    className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-[#00D67D] focus:ring-1 focus:ring-[#00D67D] transition-all placeholder:text-slate-700 resize-none text-sm"
                                />
                            </div>

                            <button 
                                type="submit"
                                disabled={formStatus === 'submitting'}
                                className="group w-full py-4 bg-white text-black font-bold text-lg rounded-xl hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.3)] transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2 overflow-hidden relative"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-[#00D67D]/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                
                                {formStatus === 'submitting' ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        <span>Transmitting...</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="relative">Send Proposal</span>
                                        <Send size={18} className="relative group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </motion.form>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>

      </div>
    </section>
  );
};

// --- Helper Component: Input Field with focus effects ---
const InputField = ({ label, placeholder, type, id, focusedField, setFocusedField }: any) => {
    const isActive = focusedField === id;
    
    return (
        <div className="space-y-2">
            <label className={`text-xs font-mono uppercase tracking-widest transition-colors duration-300 ${isActive ? 'text-[#00D67D]' : 'text-slate-500'}`}>
                {label}
            </label>
            <div className="relative">
                <input 
                    type={type} 
                    id={id}
                    required 
                    placeholder={placeholder} 
                    onFocus={() => setFocusedField(id)}
                    onBlur={() => setFocusedField(null)}
                    className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-[#00D67D] focus:ring-1 focus:ring-[#00D67D] transition-all placeholder:text-slate-700 text-sm peer"
                />
                {/* Visual indicator line on bottom */}
                <div className={`absolute bottom-0 left-4 right-4 h-[1px] bg-[#00D67D] transition-transform duration-300 origin-left ${isActive ? 'scale-x-100' : 'scale-x-0'}`} />
            </div>
        </div>
    );
}

export default ContactPage;