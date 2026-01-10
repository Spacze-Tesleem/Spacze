'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
  AnimatePresence,
  useMotionValue,
} from 'framer-motion';

// --- Theme Configuration ---
const theme = {
  colors: {
    green: '#00D67D',
    greenLight: '#05FF96',
    greenDark: '#00A35F',
    silver: '#C0C0C0',
    silverLight: '#E8E8E8',
    silverDark: '#7A7A7A',
    text: '#0F172A',
    textMuted: '#64748B',
    bg: '#FFFFFF',
  },
  easing: [0.19, 1, 0.22, 1], // Custom sophisticated expo-out easing
};

// --- Components ---

const InteractiveGrid = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const maskImage = useTransform(
    [mouseX, mouseY],
    ([x, y]) => `radial-gradient(600px circle at ${x}px ${y}px, black, transparent)`
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div 
        className="absolute inset-0 opacity-[0.15]" 
        style={{ 
          backgroundImage: `linear-gradient(${theme.colors.silver} 1px, transparent 1px), linear-gradient(90deg, ${theme.colors.silver} 1px, transparent 1px)`,
          backgroundSize: '64px 64px'
        }} 
      />
      <motion.div 
        className="absolute inset-0 opacity-[0.4]" 
        style={{ 
          backgroundImage: `linear-gradient(${theme.colors.green} 1px, transparent 1px), linear-gradient(90deg, ${theme.colors.green} 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
          WebkitMaskImage: maskImage,
          maskImage: maskImage
        }} 
      />
    </div>
  );
};

const MagneticButton = ({ children, variant = 'primary' }: { children: React.ReactNode, variant?: 'primary' | 'secondary' }) => {
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { width, height, left, top } = ref.current.getBoundingClientRect();
    const x = clientX - (left + width / 2);
    const y = clientY - (top + height / 2);
    setPosition({ x: x * 0.3, y: y * 0.3 });
  };

  const handleMouseLeave = () => setPosition({ x: 0, y: 0 });

  const isPrimary = variant === 'primary';

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.6 }}
      className={`
        relative px-8 py-4 rounded-full font-bold text-sm tracking-tight overflow-hidden transition-shadow duration-500
        ${isPrimary ? 'bg-black text-white' : 'bg-transparent border border-slate-200 text-slate-600'}
      `}
      style={{ boxShadow: isPrimary ? '0 20px 40px -12px rgba(0,214,125,0.25)' : 'none' }}
    >
      <motion.div 
        className="absolute inset-0 z-0 bg-gradient-to-r from-green-400 to-emerald-500"
        initial={{ y: '100%' }}
        whileHover={{ y: '0%' }}
        transition={{ duration: 0.4, ease: theme.easing }}
      />
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
    </motion.button>
  );
};

const HeroCharacter = ({ char, index }: { char: string, index: number }) => (
  <motion.span
    initial={{ y: 100, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{
      delay: index * 0.02,
      duration: 0.8,
      ease: theme.easing
    }}
    className="inline-block"
  >
    {char === ' ' ? '\u00A0' : char}
  </motion.span>
);

const Hero = () => {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollY } = useScroll();
  
  // Parallax calculations
  const textY = useTransform(scrollY, [0, 500], [0, 100]);
  const glowY = useTransform(scrollY, [0, 500], [0, -50]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  const stats = [
    { label: 'Revenue Boost', value: '45%' },
    { label: 'Active Users', value: '1.2M' },
    { label: 'Market Cap', value: '$2B+' }
  ];

  return (
    <section 
      ref={containerRef}
      className="relative min-h-[110vh] w-full flex flex-col items-center justify-center overflow-hidden bg-white selection:bg-emerald-100"
    >
      <InteractiveGrid />
      
      {/* Dynamic Background Glows */}
      <motion.div 
        style={{ y: glowY }}
        className="absolute top-1/4 -left-20 w-[600px] h-[600px] rounded-full bg-emerald-50/50 blur-[120px] pointer-events-none" 
      />
      <motion.div 
        style={{ y: glowY, scale: 1.2 }}
        className="absolute bottom-0 -right-20 w-[500px] h-[500px] rounded-full bg-slate-50 blur-[100px] pointer-events-none" 
      />

      {/* Main Content Area */}
      <motion.div 
        style={{ y: textY, opacity }}
        className="relative z-20 flex flex-col items-center max-w-7xl px-6 text-center"
      >
        {/* Modern Chip */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-10 flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-100 bg-emerald-50/30 backdrop-blur-sm"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">
            Evolutionizing Digital Products
          </span>
        </motion.div>

        {/* Headline with Masking Effect */}
        <h1 className="text-6xl md:text-8xl lg:text-[100px] font-bold tracking-[-0.04em] leading-[0.9] text-slate-900 mb-8">
          <div className="overflow-hidden py-2">
            {"Impactful Design".split("").map((c, i) => (
              <HeroCharacter key={i} char={c} index={i} />
            ))}
          </div>
          <div className="overflow-hidden py-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-emerald-400 to-slate-400">
            {"For The Bold.".split("").map((c, i) => (
              <HeroCharacter key={i} char={c} index={i + 15} />
            ))}
          </div>
        </h1>

        {/* Subcopy */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="max-w-xl text-lg md:text-xl text-slate-500 leading-relaxed mb-12"
        >
          Spacze bridges the gap between <span className="text-slate-900 font-medium">visionary ideas</span> and 
          <span className="text-emerald-600 font-medium"> market-leading reality</span>. We build the interfaces of tomorrow.
        </motion.p>

        {/* CTAs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="flex flex-col sm:flex-row items-center gap-6"
        >
          <MagneticButton variant="primary">
            Start Your Transformation
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14m-7-7 7 7-7 7"/>
            </svg>
          </MagneticButton>
          
          <MagneticButton variant="secondary">
            View Case Studies
          </MagneticButton>
        </motion.div>

        {/* Trust Stats */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 1 }}
          className="mt-24 grid grid-cols-3 gap-12 md:gap-24 border-t border-slate-100 pt-12"
        >
          {stats.map((stat, i) => (
            <div key={i} className="flex flex-col items-center">
              <span className="text-3xl md:text-4xl font-bold text-slate-900 mb-1">{stat.value}</span>
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Modern Grain Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* Scroll Indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
      >
        <div className="w-[1px] h-12 bg-gradient-to-b from-emerald-400 to-transparent" />
      </motion.div>
    </section>
  );
};

export default Hero;