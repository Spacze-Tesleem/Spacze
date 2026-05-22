'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
  useSpring,
  useTransform,
} from 'framer-motion';

// Navigation Data
const navLinks = [
  { name: 'Services', href: '/services' },
  { name: 'About Us', href: '/about' },
  { name: 'Portfolio', href: '/portfolio' },
  { name: 'Contact', href: '/contact' },
];

// Brand Colors - Green & Silver
const brandColors = {
  green: '#00D67D',
  greenLight: '#00F590',
  greenDark: '#00B368',
  silver: '#C0C0C0',
  silverLight: '#E8E8E8',
  silverDark: '#A0A0A0',
};

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<string>('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHoveringNav, setIsHoveringNav] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  // Smooth spring animation for scroll
  const scrollYSpring = useSpring(scrollY, { stiffness: 100, damping: 30 });
  const navBlur = useTransform(scrollYSpring, [0, 100], [0, 20]);

  // Handle Scroll State
  useMotionValueEvent(scrollY, 'change', (latest) => {
    setIsScrolled(latest > 20);
  });

  // Track active section
  useEffect(() => {
    const handleScroll = () => {
      const sections = navLinks.map(link => link.href.replace('#', ''));
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveSection(section);
            break;
          }
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock Body Scroll
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileOpen]);

  // Track mouse position
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (navRef.current) {
        const rect = navRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <>
      <motion.nav
        ref={navRef}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        onMouseEnter={() => setIsHoveringNav(true)}
        onMouseLeave={() => setIsHoveringNav(false)}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? 'py-2'
            : 'py-4'
        }`}
      >
        {/* Background with glass effect */}
        <motion.div
          className="absolute inset-0 transition-all duration-500"
          style={{
            backgroundColor: isScrolled ? 'rgba(0, 0, 0, 0.8)' : 'transparent',
            backdropFilter: isScrolled ? 'blur(20px) saturate(180%)' : 'none',
          }}
        />

        {/* Animated gradient border */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ 
            scaleX: isScrolled ? 1 : 0, 
            opacity: isScrolled ? 1 : 0 
          }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="absolute bottom-0 left-0 right-0 h-[1px] origin-left"
          style={{
            background: `linear-gradient(90deg, transparent, ${brandColors.green}40, ${brandColors.silver}40, transparent)`,
          }}
        />

        {/* Mouse follow glow */}
        <motion.div
          animate={{ opacity: isHoveringNav ? 0.4 : 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, ${brandColors.green}08, transparent 40%)`,
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 flex items-center justify-between">
          
          {/* --- LOGO --- */}
          <Link href="/" className="flex items-center gap-3 group z-50 relative">
            <motion.div 
              className="relative flex items-center justify-center w-10 h-10 rounded-xl overflow-hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Logo background */}
              <div 
                className="absolute inset-0 rounded-xl"
                style={{
                  // background: `linear-gradient(135deg, ${brandColors.green}15, ${brandColors.silver}10)`,
                }}
              />

              
              {/* Pulse effect */}
              <motion.div
                className="absolute inset-0 rounded-xl"
                initial={{ scale: 1, opacity: 0 }}
                whileHover={{ 
                  scale: [1, 1.4, 1.4],
                  opacity: [0, 0.3, 0],
                }}
                transition={{ duration: 0.8 }}
                style={{ border: `2px solid ${brandColors.green}` }}
              />
            </motion.div>
            
            <div className="flex flex-col">
              <motion.span 
                className="text-xl font-bold tracking-tight leading-none"
                style={{ color: brandColors.silverLight }}
              >
                SPA
                <span 
                  className="font-medium"
                  style={{ color: brandColors.silver }}
                >
                  CZE
                </span>
              </motion.span>
              <motion.span 
                className="text-[9px] tracking-[0.25em] uppercase font-medium mt-0.5"
                style={{ color: brandColors.silverDark }}
              >
                Digital Agency
              </motion.span>
            </div>
          </Link>

          {/* --- DESKTOP NAVIGATION --- */}
          <div
            className="hidden md:flex items-center gap-1 px-2 py-1.5 rounded-2xl relative"
            style={{
              background: `linear-gradient(135deg, ${brandColors.silver}08, ${brandColors.silver}04)`,
              border: `1px solid ${brandColors.silver}10`,
            }}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {navLinks.map((link, idx) => {
              const isActive = activeSection === link.href.replace('#', '');
              return (
                <div key={link.name} className="relative">
                  <Link
                    href={link.href}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    className="relative z-10 flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-300"
                    style={{
                      color: isActive 
                        ? brandColors.green 
                        : hoveredIndex === idx 
                          ? brandColors.silverLight 
                          : brandColors.silverDark,
                    }}
                  >
                    {/* Active dot */}
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ 
                        scale: isActive ? 1 : 0, 
                        opacity: isActive ? 1 : 0 
                      }}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: brandColors.green }}
                    />
                    {link.name}
                  </Link>
                  
                  {/* Hover background */}
                  <AnimatePresence>
                    {hoveredIndex === idx && (
                      <motion.div
                        layoutId="nav-hover"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 rounded-xl -z-0"
                        style={{ 
                          background: `${brandColors.silver}10`,
                        }}
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                      />
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* --- DESKTOP BUTTONS --- */}
          <div className="hidden md:flex items-center gap-3">

            {/* Primary CTA - Black & White */}
            <motion.button
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => window.location.href = '/contact'}
              className="group relative overflow-hidden rounded-xl px-6 py-2.5 font-semibold text-black bg-white"
            >
              {/* Gradient overlay on hover */}
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `linear-gradient(135deg, ${brandColors.silverLight}, white)`,
                }}
              />
              
              {/* Green accent line */}
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-[2px]"
                initial={{ scaleX: 0 }}
                whileHover={{ scaleX: 1 }}
                transition={{ duration: 0.3 }}
                style={{ 
                  background: `linear-gradient(90deg, ${brandColors.green}, ${brandColors.greenLight})`,
                  transformOrigin: 'left',
                }}
              />
              
              {/* Shimmer */}
              <div 
                className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(0,214,125,0.15), transparent)',
                }}
              />

              <span className="relative z-10 flex items-center gap-2 text-sm tracking-wide">
                Book Strategy
                <motion.svg 
                  className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </motion.svg>
              </span>
            </motion.button>
          </div>

          {/* --- MOBILE HAMBURGER --- */}
          <motion.button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            whileTap={{ scale: 0.95 }}
            className="flex md:hidden flex-col justify-center items-center w-11 h-11 rounded-xl z-50 transition-all duration-300"
            style={{
              background: `${brandColors.silver}08`,
              border: `1px solid ${brandColors.silver}15`,
            }}
          >
            <div className="relative w-5 h-4 flex flex-col justify-between">
              <motion.span
                animate={isMobileOpen 
                  ? { rotate: 45, y: 7, backgroundColor: brandColors.green } 
                  : { rotate: 0, y: 0, backgroundColor: brandColors.silverLight }
                }
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="h-[2px] block rounded-full origin-center w-full"
              />
              <motion.span
                animate={isMobileOpen 
                  ? { opacity: 0, scaleX: 0 } 
                  : { opacity: 1, scaleX: 1 }
                }
                transition={{ duration: 0.2 }}
                className="h-[2px] block rounded-full w-3/4 ml-auto"
                style={{ backgroundColor: brandColors.silver }}
              />
              <motion.span
                animate={isMobileOpen 
                  ? { rotate: -45, y: -7, backgroundColor: brandColors.green } 
                  : { rotate: 0, y: 0, backgroundColor: brandColors.silverLight }
                }
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="h-[2px] block rounded-full origin-center w-3/5"
              />
            </div>
          </motion.button>
        </div>
      </motion.nav>

      {/* --- MOBILE MENU --- */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="fixed inset-0 z-40 bg-black md:hidden overflow-hidden"
          >
            {/* Background Effects */}
            <div className="absolute inset-0">
              {/* Noise */}
              <div 
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                }}
              />
              
              {/* Gradient orbs */}
              <motion.div 
                animate={{ 
                  x: [0, 30, 0],
                  y: [0, -30, 0],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-[5%] right-[-30%] w-[500px] h-[500px] rounded-full blur-[150px]"
                style={{ backgroundColor: brandColors.green, opacity: 0.15 }}
              />
              <motion.div 
                animate={{ 
                  x: [0, -20, 0],
                  y: [0, 40, 0],
                }}
                transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute bottom-[5%] left-[-30%] w-[500px] h-[500px] rounded-full blur-[150px]"
                style={{ backgroundColor: brandColors.silver, opacity: 0.1 }}
              />

              {/* Grid */}
              <div 
                className="absolute inset-0 opacity-[0.02]"
                style={{
                  backgroundImage: `
                    linear-gradient(${brandColors.silver}30 1px, transparent 1px),
                    linear-gradient(90deg, ${brandColors.silver}30 1px, transparent 1px)
                  `,
                  backgroundSize: '60px 60px',
                }}
              />
            </div>

            <nav className="relative z-10 flex flex-col h-full pt-24 pb-8 px-6">
              {/* Navigation Label */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-8"
              >
                <span 
                  className="text-[10px] tracking-[0.4em] uppercase font-medium"
                  style={{ color: brandColors.silverDark }}
                >
                  Navigation
                </span>
                <motion.div 
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="h-[1px] w-12 mt-2 origin-left"
                  style={{ backgroundColor: brandColors.green }}
                />
              </motion.div>

              {/* Links */}
              <div className="flex-1 flex flex-col justify-center gap-1">
                {navLinks.map((link, idx) => (
                  <motion.div
                    key={link.name}
                    initial={{ opacity: 0, x: -60 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ 
                      delay: 0.15 + idx * 0.08, 
                      duration: 0.5,
                      ease: [0.23, 1, 0.32, 1]
                    }}
                    className="group"
                  >
                    <Link
                      href={link.href}
                      onClick={() => setIsMobileOpen(false)}
                      className="flex items-center gap-4 py-4 group relative"
                    >
                      {/* Number */}
                      <motion.span 
                        className="text-xs font-mono w-8 transition-colors duration-300"
                        style={{ color: brandColors.silverDark }}
                        whileHover={{ color: brandColors.green }}
                      >
                        0{idx + 1}
                      </motion.span>
                      
                      {/* Link */}
                      <span 
                        className="text-4xl sm:text-5xl font-semibold transition-all duration-300 group-hover:translate-x-3"
                        style={{ 
                          color: brandColors.silver,
                        }}
                      >
                        <span className="group-hover:text-white transition-colors duration-300">
                          {link.name}
                        </span>
                      </span>
                      
                      {/* Arrow */}
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        whileHover={{ opacity: 1, x: 0 }}
                        className="ml-auto"
                      >
                        <svg 
                          className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke={brandColors.green}
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </motion.div>
                      
                      {/* Hover line */}
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 h-[1px] origin-left"
                        initial={{ scaleX: 0 }}
                        whileHover={{ scaleX: 1 }}
                        transition={{ duration: 0.3 }}
                        style={{ 
                          background: `linear-gradient(90deg, ${brandColors.green}50, transparent)`,
                        }}
                      />
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* CTA Button - Black & White */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="mt-8"
              >
                <button 
                  onClick={() => { setIsMobileOpen(false); setTimeout(() => { window.location.href = '/contact'; }, 300); }}
                  className="w-full py-4 rounded-2xl bg-white text-black font-bold text-lg relative overflow-hidden group"
                >
                  {/* Hover overlay */}
                  <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ backgroundColor: brandColors.silverLight }}
                  />
                  
                  {/* Green accent */}
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-1"
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    style={{ 
                      background: `linear-gradient(90deg, ${brandColors.green}, ${brandColors.greenLight})`,
                      transformOrigin: 'left',
                    }}
                  />
                  
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Book Strategy Call
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </button>

              </motion.div>

              {/* Footer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-8 pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                style={{ borderTop: `1px solid ${brandColors.silver}10` }}
              >
                <div>
                  <p 
                    className="text-xs mb-1"
                    style={{ color: brandColors.silverDark }}
                  >
                    Get in touch
                  </p>
                  <a 
                    href="mailto:spaczehq@gmail.com" 
                    className="text-sm transition-colors duration-300 hover:text-white"
                    style={{ color: brandColors.silver }}
                  >
                    spaczehq@gmail.com
                  </a>
                </div>
                
                <div className="flex gap-6">
                  {([
                    { label: 'Twitter',  href: 'https://twitter.com/spaczehq' },
                    { label: 'LinkedIn', href: 'https://linkedin.com/company/spacze' },
                    { label: 'GitHub',   href: 'https://github.com/Spacze-Tesleem' },
                  ] as const).map(({ label, href }, idx) => (
                    <motion.a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.9 + idx * 0.1 }}
                      className="text-xs transition-colors duration-300 hover:text-white"
                      style={{ color: brandColors.silverDark }}
                      whileHover={{ color: brandColors.green }}
                    >
                      {label}
                    </motion.a>
                  ))}
                </div>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;