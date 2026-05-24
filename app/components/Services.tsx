'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Code2, 
  ShieldCheck, 
  Bot, 
  ShoppingCart, 
  Database, 
  MessageSquare, 
  ArrowUpRight,
  Zap,
  Megaphone,
} from 'lucide-react';

const Services = () => {
  const services = [
    {
      icon: <Code2 size={24} />,
      title: "Web & App Engineering",
      desc: "Pixel-perfect frontends backed by robust, scalable architectures.",
      tags: ["React", "Next.js", "Native"],
      color: "from-blue-500 to-cyan-400"
    },
    {
      icon: <ShieldCheck size={24} />,
      title: "Cybersecurity Audit",
      desc: "Penetration testing and protocol hardening to zero-trust standards.",
      tags: ["Auth0", "Pen-Test", "GDPR"],
      color: "from-[#00D67D] to-emerald-500"
    },
    {
      icon: <Bot size={24} />,
      title: "AI Integration",
      desc: "LLM fine-tuning and automated workflows to replace manual labor.",
      tags: ["OpenAI", "Python", "Vector DB"],
      color: "from-purple-500 to-indigo-500"
    },
    {
      icon: <ShoppingCart size={24} />,
      title: "Headless Commerce",
      desc: "High-performance stores decoupled from the backend for speed.",
      tags: ["Shopify", "Stripe", "Redis"],
      color: "from-orange-500 to-red-500"
    },
    {
      icon: <Database size={24} />,
      title: "Backend Infrastructure",
      desc: "Serverless and microservices architectures built for millions of requests.",
      tags: ["AWS", "Postgres", "Docker"],
      color: "from-pink-500 to-rose-500"
    },
    {
      icon: <MessageSquare size={24} />,
      title: "Conversational Tech",
      desc: "WhatsApp bots and support automation pipelines.",
      tags: ["Twilio", "Meta API", "Node"],
      color: "from-teal-400 to-blue-400"
    },
    {
      icon: <Megaphone size={24} />,
      title: "AI Marketing Engine",
      desc: "Multi-channel campaign management, AI-generated ad copy, automated outreach sequences, and real-time analytics — all in one platform.",
      tags: ["AI Copy", "Campaigns", "Analytics"],
      color: "from-[#00D67D] to-blue-500"
    }
  ];

  return (
    <section id="services" className="relative w-full py-24 md:py-32 bg-[#020202] text-white overflow-hidden">
      
      {/* --- Background Texture --- */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSczMDAnIGhlaWdodD0nMzAwJz48ZmlsdGVyIGlkPSdub2lzZSc+PGZlVHVyYnVsZW5jZSB0eXBlPSdmcmFjdGFsTm9pc2UnIGJhc2VGcmVxdWVuY3k9JzAuNjUnIG51bU9jdGF2ZXM9JzMnIHN0aXRjaFRpbGVzPSdzdGl0Y2gnLz48ZmVDb2xvck1hdHJpeCB0eXBlPSdzYXR1cmF0ZScgdmFsdWVzPScwJy8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9JzMwMCcgaGVpZ2h0PSczMDAnIGZpbHRlcj0ndXJsKCNub2lzZSknIG9wYWNpdHk9JzEnLz48L3N2Zz4=")' }} />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* Ambient Glows */}
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#00D67D]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* --- Header --- */}
        <div className="mb-20 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl"
          >
            <div className="flex items-center gap-2 mb-4">
               <span className="w-2 h-2 rounded-full bg-[#00D67D] shadow-[0_0_10px_#00D67D]" />
               <span className="text-[#00D67D] font-mono text-xs uppercase tracking-widest">System Capabilities</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
              Architecture for <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-[#00D67D]">
                modern velocity.
              </span>
            </h2>
          </motion.div>

          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-slate-400 max-w-sm text-sm md:text-base leading-relaxed"
          >
            We don't just write code. We engineer digital assets that scale, perform, and generate value from day one.
          </motion.p>
        </div>

        {/* --- Grid --- */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <ServiceCard key={index} service={service} index={index} />
          ))}
        </div>

        {/* --- Bottom CTA --- */}
        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           className="mt-24 flex justify-center"
        >
            <div className="p-[1px] rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent">
                <button className="px-8 py-3 rounded-full bg-[#050505] border border-white/5 text-slate-300 text-sm font-medium hover:text-white hover:bg-white/5 transition-all flex items-center gap-2 group">
                    <Zap size={16} className="text-[#00D67D]" />
                    <span>View Full Tech Stack</span>
                    <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
            </div>
        </motion.div>

      </div>
    </section>
  );
};

// --- Sub-Component: The Holographic Card ---
interface ServiceItem {
  icon: React.ReactNode;
  title: string;
  desc: string;
  tags: string[];
  color: string;
}

const ServiceCard = ({ service, index }: { service: ServiceItem; index: number }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="group relative h-full"
        >
            {/* Hover Glow Background */}
            <div className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-r ${service.color} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500`} />

            {/* Main Card Content */}
            <div className="relative h-full flex flex-col p-8 rounded-2xl bg-[#0A0A0A] border border-white/10 group-hover:border-white/20 overflow-hidden transition-colors duration-300">
                
                {/* Tech Grid Background inside card */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none" 
                     style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '16px 16px' }} 
                />

                {/* Header: Icon & Title */}
                <div className="flex items-start justify-between mb-6">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${service.color} bg-opacity-10 bg-clip-padding backdrop-filter backdrop-blur-sm border border-white/10 text-white shadow-lg`}>
                        {service.icon}
                    </div>
                    <ArrowUpRight className="text-slate-600 group-hover:text-white transition-colors transform group-hover:translate-x-1 group-hover:-translate-y-1" size={20} />
                </div>

                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-400 transition-all">
                    {service.title}
                </h3>
                
                <p className="text-slate-400 text-sm leading-relaxed mb-8 flex-grow">
                    {service.desc}
                </p>

                {/* Footer: Tags */}
                <div className="pt-6 border-t border-white/5 flex flex-wrap gap-2">
                    {service.tags.map((tag: string, idx: number) => (
                        <span key={idx} className="px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] font-mono text-slate-400 uppercase tracking-wide group-hover:border-white/10 transition-colors">
                            {tag}
                        </span>
                    ))}
                </div>

                {/* Decor: Corner Brackets (The "Tech" feel) */}
                <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-50 transition-opacity">
                     <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 1H9V10" stroke="white" />
                     </svg>
                </div>
                <div className="absolute bottom-0 left-0 p-3 opacity-20 group-hover:opacity-50 transition-opacity">
                     <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 9H1V0" stroke="white" />
                     </svg>
                </div>

            </div>
        </motion.div>
    );
};

export default Services;