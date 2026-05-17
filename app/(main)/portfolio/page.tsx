'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { ArrowUpRight, Code2, Zap, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

const projects = [
  {
    title: 'Jannah Vizora',
    category: 'Real Estate Marketing Website',
    tags: ['Next.js', 'Tailwind CSS', 'Framer Motion'],
    problem: 'No digital presence to showcase premium properties to high-intent buyers.',
    solution: 'Conversion-focused marketing site with immersive property listings and lead capture.',
    result: 'Live & Converting',
    color: 'green',
    image: '/jannah-vizora.png',
    url: 'https://jannah-vizora.vercel.app/',
  },
  {
    title: 'Livana',
    category: 'Property Management Platform',
    tags: ['React', 'Node.js', 'PostgreSQL'],
    problem: 'Landlords managing tenants, payments, and maintenance across spreadsheets.',
    solution: 'Full-stack web app centralising tenant records, rent tracking, and maintenance requests.',
    result: 'End-to-End Automation',
    color: 'blue',
    image: '/livana.png',
    url: 'https://property-manager-property-manager.vercel.app/',
  },
  {
    title: 'MoverSpadi',
    category: 'Moving & Logistics Platform',
    tags: ['Next.js', 'Tailwind CSS', 'REST API'],
    problem: 'Customers had no reliable way to book and track moving services online.',
    solution: 'Booking platform with real-time job tracking and instant mover quotes.',
    result: 'Seamless Bookings',
    color: 'purple',
    image: '/moverspadi.png',
    url: 'https://moverspadi.vercel.app/',
  },
  {
    title: 'DMS',
    category: 'Digital Marketing Website',
    tags: ['HTML', 'CSS', 'JavaScript'],
    problem: 'Agency lacked a professional web presence to attract and convert clients.',
    solution: 'Clean, fast marketing site communicating services and driving enquiries.',
    result: 'Brand Established',
    color: 'blue',
    image: '/dms.png',
    url: 'https://dmsv1.netlify.app',
  },
  {
    title: 'Mumtaazah',
    category: 'E-Commerce & Brand Website',
    tags: ['Next.js', 'Tailwind CSS', 'Stripe'],
    problem: 'Fashion brand selling exclusively via social DMs with no scalable storefront.',
    solution: 'Branded e-commerce site with product catalogue, cart, and secure checkout.',
    result: 'Store Live',
    color: 'green',
    image: '/mumtaazah.png',
    url: 'https://mumtaazah.vercel.app/',
  },
];

const accentColor = (color: string) =>
  color === 'green' ? '#00D67D' : color === 'blue' ? '#3b82f6' : '#a855f7';

const ProjectCard = ({ project, index }: { project: (typeof projects)[0]; index: number }) => {
  const [hovered, setHovered] = useState(false);
  const accent = accentColor(project.color);

  return (
    <motion.div
      {...fadeUp}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden hover:border-white/20 transition-all duration-500"
    >
      {/* Ambient glow */}
      <div
        className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full blur-[100px] opacity-0 group-hover:opacity-10 transition-opacity duration-700 pointer-events-none"
        style={{ backgroundColor: accent }}
      />

      <div className="grid md:grid-cols-[1fr_0.85fr]">
        {/* Left: Content */}
        <div className="p-8 flex flex-col">
          <div className="flex flex-wrap gap-2 mb-6">
            {project.tags.map((tag, i) => (
              <span
                key={i}
                className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-md border border-white/5 text-[10px] font-mono text-slate-400"
              >
                {i === 0 && <Code2 size={11} />}
                {tag}
              </span>
            ))}
          </div>

          <h3 className="text-2xl font-bold text-white mb-1">{project.title}</h3>
          <p className="text-slate-500 text-sm mb-6">{project.category}</p>

          <div className="space-y-3 mb-8">
            <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
              <h4 className="flex items-center gap-2 text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">
                <AlertCircle size={11} /> Challenge
              </h4>
              <p className="text-slate-400 text-xs leading-relaxed">{project.problem}</p>
            </div>
            <div className="p-3 rounded-lg bg-[#00D67D]/5 border border-[#00D67D]/10">
              <h4 className="flex items-center gap-2 text-[10px] font-bold text-[#00D67D] uppercase tracking-widest mb-1">
                <Zap size={11} /> Solution
              </h4>
              <p className="text-slate-300 text-xs leading-relaxed">{project.solution}</p>
            </div>
          </div>

          <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Result</span>
              <div className="text-sm font-bold text-white">{project.result}</div>
            </div>
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-[#00D67D] group-hover:text-black transition-colors"
            >
              <ArrowUpRight size={15} />
            </a>
          </div>
        </div>

        {/* Right: Screenshot */}
        <div className="hidden md:flex flex-col justify-center items-center bg-[#080808] p-5 border-l border-white/5">
          <div className="w-full rounded-xl overflow-hidden border border-white/10 shadow-2xl transition-transform duration-500 group-hover:scale-[1.03]">
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
            <div className="relative w-full aspect-[16/10] overflow-hidden bg-[#111]">
              <Image
                src={project.image}
                alt={`${project.title} screenshot`}
                fill
                className="object-cover object-top"
              />
            </div>
          </div>
          <div
            className="absolute inset-0 blur-[80px] opacity-5 pointer-events-none rounded-3xl"
            style={{ backgroundColor: accent }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default function PortfolioPage() {
  return (
    <main className="bg-[#020202] text-white min-h-screen">

      {/* ── HERO ── */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-900/10 blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div {...fadeUp} className="mb-4 flex items-center gap-2">
            <span className="w-6 h-[1px] bg-[#00D67D]" />
            <span className="text-[#00D67D] font-mono text-xs uppercase tracking-widest">Selected Works</span>
          </motion.div>

          <motion.h1
            {...fadeUp}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
          >
            Proof, not{' '}
            <span className="text-slate-600">promises.</span>
          </motion.h1>

          <motion.p
            {...fadeUp}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-slate-400 text-lg max-w-xl leading-relaxed"
          >
            Real projects, real results. Every product here was built to solve a specific problem for a real business.
          </motion.p>
        </div>
      </section>

      {/* ── PROJECTS ── */}
      <section className="px-6 pb-32">
        <div className="max-w-7xl mx-auto space-y-6">
          {projects.map((project, i) => (
            <ProjectCard key={i} project={project} index={i} />
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 pb-32 text-center bg-[#050505]">
        <motion.div {...fadeUp} className="max-w-xl mx-auto pt-24">
          <h2 className="text-3xl font-bold mb-4">Want to be next?</h2>
          <p className="text-slate-400 mb-8">Let's build something you're proud to show off.</p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-[#00D67D] transition-colors duration-200"
          >
            Start a Project <ArrowRight size={16} />
          </Link>
        </motion.div>
      </section>

    </main>
  );
}
