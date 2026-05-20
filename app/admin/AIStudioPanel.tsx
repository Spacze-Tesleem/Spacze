'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Copy, CheckCircle2, RefreshCw, AlertCircle,
  Instagram, Twitter, Search, Mail, MessageCircle, Linkedin,
  ChevronDown, Zap, Send, LayoutTemplate, PenTool
} from 'lucide-react';
import { Lead } from '@/lib/supabase'; // Adjust import as needed

const fadeUp = { 
  initial: { opacity: 0, y: 16 }, 
  animate: { opacity: 1, y: 0 }, 
  exit: { opacity: 0, y: -16 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } 
};

// ─── TYPES & CONSTANTS ────────────────────────────────────────────────────────

type Tab = 'copy' | 'email';
type Platform = 'instagram' | 'twitter' | 'google_ads' | 'email' | 'whatsapp' | 'linkedin';

const PLATFORMS: { id: Platform; label: string; icon: React.ReactNode; color: string; bg: string; activeBorder: string }[] = [
  { id: 'instagram',  label: 'Instagram',  icon: <Instagram size={18} />,     color: 'text-pink-500',  bg: 'bg-pink-500/10', activeBorder: 'border-pink-500/50' },
  { id: 'twitter',    label: 'Twitter / X',icon: <Twitter size={18} />,       color: 'text-sky-400',   bg: 'bg-sky-400/10', activeBorder: 'border-sky-400/50' },
  { id: 'google_ads', label: 'Google Ads', icon: <Search size={18} />,        color: 'text-yellow-400',bg: 'bg-yellow-400/10', activeBorder: 'border-yellow-400/50' },
  { id: 'email',      label: 'Email',      icon: <Mail size={18} />,          color: 'text-blue-400',  bg: 'bg-blue-400/10', activeBorder: 'border-blue-400/50' },
  { id: 'whatsapp',   label: 'WhatsApp',   icon: <MessageCircle size={18} />, color: 'text-[#25D366]', bg: 'bg-[#25D366]/10', activeBorder: 'border-[#25D366]/50' },
  { id: 'linkedin',   label: 'LinkedIn',   icon: <Linkedin size={18} />,      color: 'text-blue-500',  bg: 'bg-blue-500/10', activeBorder: 'border-blue-500/50' },
];

const TONES = ['Professional', 'Friendly', 'Bold', 'Urgent', 'Witty', 'Empathetic'];
const GOALS = ['Awareness', 'Clicks', 'Leads', 'Sales', 'Engagement', 'Retention'];

const EMAIL_STEPS = [
  { step: 1, label: 'Initial Email',  tag: 'Day 1',  desc: 'First touch — personalised observation + soft CTA', color: '#00D67D' },
  { step: 2, label: 'Follow-up #1',   tag: 'Day 3',  desc: 'New insight — no "just checking in"',               color: '#3b82f6' },
  { step: 3, label: 'Follow-up #2',   tag: 'Day 7',  desc: 'Results angle + soft availability mention',         color: '#a855f7' },
  { step: 4, label: 'Breakup Email',  tag: 'Day 14', desc: 'Gracious close — leaves door open forever',         color: '#f59e0b' },
];

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────

const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`p-6 rounded-2xl bg-zinc-900/40 border border-white/5 backdrop-blur-md shadow-xl ${className}`}>
    {children}
  </div>
);

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 block">
    {children}
  </label>
);

const inputBaseClasses = "w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none focus:border-[#00D67D]/50 focus:bg-black/40 transition-all placeholder:text-zinc-600";

// ─── COPY OUTPUT RENDERER ─────────────────────────────────────────────────────

function renderOutput(platform: Platform, raw: string) {
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);

  const OutputSection = ({ title, content, meta }: { title: string, content: string, meta?: string }) => (
    <div className="mb-4 last:mb-0">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{title}</div>
        {meta && <div className="text-[10px] text-zinc-600">{meta}</div>}
      </div>
      <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap bg-black/20 p-4 rounded-xl border border-white/5">
        {content}
      </p>
    </div>
  );

  if (platform === 'instagram') {
    const captionIdx = lines.findIndex(l => l.startsWith('CAPTION:'));
    const hashtagIdx = lines.findIndex(l => l.startsWith('HASHTAGS:'));
    const caption = captionIdx >= 0 ? lines.slice(captionIdx + 1, hashtagIdx >= 0 ? hashtagIdx : undefined).join('\n') : raw;
    const hashtags = hashtagIdx >= 0 ? lines.slice(hashtagIdx + 1).join(' ') : '';
    
    return (
      <>
        <OutputSection title="Caption" content={caption} />
        {hashtags && <OutputSection title="Hashtags" content={hashtags} />}
      </>
    );
  }

  if (platform === 'twitter') {
    const tweetIdx = lines.findIndex(l => l.startsWith('TWEET:'));
    const replyIdx = lines.findIndex(l => l.startsWith('REPLY'));
    const tweet = tweetIdx >= 0 ? lines.slice(tweetIdx + 1, replyIdx >= 0 ? replyIdx : undefined).join('\n') : raw;
    const reply = replyIdx >= 0 ? lines.slice(replyIdx + 1).join('\n') : '';
    
    return (
      <>
        <OutputSection title="Tweet" content={tweet} meta={`${tweet.length} / 280 chars`} />
        {reply && <OutputSection title="Reply Thread" content={reply} />}
      </>
    );
  }

  if (platform === 'google_ads') {
    const fields: { label: string; value: string; max: number }[] = [];
    ['HEADLINE_1','HEADLINE_2','HEADLINE_3'].forEach(key => {
      const line = lines.find(l => l.startsWith(key + ':'));
      if (line) fields.push({ label: key.replace(/_/g,' '), value: line.replace(key+':','').trim(), max: 30 });
    });
    ['DESCRIPTION_1','DESCRIPTION_2'].forEach(key => {
      const line = lines.find(l => l.startsWith(key + ':'));
      if (line) fields.push({ label: key.replace(/_/g,' '), value: line.replace(key+':','').trim(), max: 90 });
    });
    
    return (
      <div className="grid gap-3">
        {fields.map(f => (
          <div key={f.label} className="bg-black/20 p-3 rounded-xl border border-white/5">
            <div className="flex items-center justify-between mb-1">
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{f.label}</div>
              <span className={`text-[10px] font-mono ${f.value.length > f.max ? 'text-red-400' : 'text-zinc-600'}`}>
                {f.value.length}/{f.max}
              </span>
            </div>
            <p className="text-sm text-zinc-300">{f.value}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-2">
      {lines.map((line, i) => <p key={i} className="text-sm text-zinc-300 leading-relaxed">{line}</p>)}
    </div>
  );
}

// ─── COPY TAB ─────────────────────────────────────────────────────────────────

function CopyTab({ leads }: { leads: Lead[] }) {
  const [selectedId, setSelectedId] = useState('');
  const [platform, setPlatform]     = useState<Platform>('instagram');
  const [tone, setTone]             = useState('Professional');
  const [goal, setGoal]             = useState('Awareness');
  const [keyMessage, setKeyMessage] = useState('');
  const [output, setOutput]         = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied]         = useState(false);
  const [error, setError]           = useState('');

  const selectedLead = leads.find(l => l.id === selectedId) ?? null;

  async function generate() {
    if (!selectedLead) return;
    setGenerating(true); setError(''); setOutput('');
    try {
      const res = await fetch('/api/generate-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...selectedLead, platform, tone, goal, keyMessage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setOutput(data.copy || data.content || JSON.stringify(data));
    } catch (e: any) { setError(e.message); }
    finally { setGenerating(false); }
  }

  function copyOutput() {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Core Setup */}
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <Label>Select Target Lead</Label>
            <div className="relative group">
              <select 
                value={selectedId} 
                onChange={e => setSelectedId(e.target.value)}
                className={`${inputBaseClasses} appearance-none pr-10 cursor-pointer`}
              >
                <option value="">— Select a business profile —</option>
                {leads.map(l => <option key={l.id} value={l.id}>{l.business_name} ({l.contact_email})</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 group-hover:text-zinc-300 pointer-events-none transition-colors" />
            </div>
          </Card>

          <Card>
            <Label>Destination Platform</Label>
            <div className="grid grid-cols-3 gap-3">
              {PLATFORMS.map(p => {
                const isActive = platform === p.id;
                return (
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    key={p.id} 
                    onClick={() => setPlatform(p.id)}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all duration-300 ${
                      isActive 
                        ? `${p.bg} ${p.activeBorder} shadow-[0_0_15px_rgba(0,0,0,0.2)]` 
                        : 'bg-black/20 border-white/5 hover:border-white/20 hover:bg-black/40 text-zinc-500'
                    }`}
                  >
                    <div className={`${isActive ? p.color : 'text-zinc-400'}`}>{p.icon}</div>
                    <span className={`text-[11px] font-medium tracking-wide ${isActive ? 'text-zinc-200' : 'text-zinc-500'}`}>
                      {p.label}
                    </span>
                  </motion.button>
                )
              })}
            </div>
          </Card>
        </div>

        {/* Right Column: Creative Direction */}
        <div className="lg:col-span-7">
          <Card className="h-full flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <Label>Brand Tone</Label>
                <div className="flex flex-wrap gap-2">
                  {TONES.map(t => (
                    <button key={t} onClick={() => setTone(t)}
                      className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                        tone === t 
                          ? 'bg-[#00D67D]/10 border-[#00D67D]/30 text-[#00D67D]' 
                          : 'bg-black/20 border-white/5 text-zinc-400 hover:border-white/20 hover:text-zinc-200'
                      }`}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Campaign Goal</Label>
                <div className="flex flex-wrap gap-2">
                  {GOALS.map(g => (
                    <button key={g} onClick={() => setGoal(g)}
                      className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                        goal === g 
                          ? 'bg-[#00D67D]/10 border-[#00D67D]/30 text-[#00D67D]' 
                          : 'bg-black/20 border-white/5 text-zinc-400 hover:border-white/20 hover:text-zinc-200'
                      }`}>{g}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-grow mb-6">
              <Label>Key Message / Offer <span className="normal-case font-normal text-zinc-500 ml-1">(Optional)</span></Label>
              <textarea 
                value={keyMessage} 
                onChange={e => setKeyMessage(e.target.value)}
                placeholder="e.g. We just launched a new feature that helps restaurants get 3× more bookings..."
                className={`${inputBaseClasses} resize-none h-24`} 
              />
            </div>

            <motion.button 
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={generate} 
              disabled={!selectedLead || generating}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-sm text-black bg-gradient-to-r from-[#00D67D] to-[#00b868] hover:to-[#00a35c] transition-all disabled:opacity-50 shadow-lg shadow-[#00D67D]/20 disabled:shadow-none"
            >
              {generating ? <RefreshCw size={18} className="animate-spin" /> : <Sparkles size={18} />}
              {generating ? 'Crafting the perfect copy…' : 'Generate Copy'}
            </motion.button>
          </Card>
        </div>
      </div>

      {/* Output Area */}
      <AnimatePresence>
        {error && (
          <motion.div {...fadeUp} className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle size={18} className="flex-shrink-0" /> {error}
          </motion.div>
        )}

        {output && (
          <motion.div {...fadeUp} className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
              <div className="flex items-center gap-2 text-zinc-300">
                <LayoutTemplate size={16} className="text-[#00D67D]" />
                <span className="text-sm font-semibold">Generated Output</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={generate} disabled={generating}
                  className="flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <RefreshCw size={14} className={generating ? "animate-spin" : ""} /> 
                  <span className="hidden sm:inline">Regenerate</span>
                </button>
                <button onClick={copyOutput}
                  className="flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  {copied ? <CheckCircle2 size={14} className="text-[#00D67D]" /> : <Copy size={14} />}
                  <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6 bg-[#0a0a0c]">
              {renderOutput(platform, output)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── EMAIL SEQUENCE TAB ───────────────────────────────────────────────────────

function EmailTab({ leads }: { leads: Lead[] }) {
  const [selectedId, setSelectedId] = useState('');
  const [activeStep, setActiveStep] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending]       = useState(false);
  const [subject, setSubject]       = useState('');
  const [body, setBody]             = useState('');
  const [copied, setCopied]         = useState(false);
  const [error, setError]           = useState('');
  const [sendStatus, setSendStatus] = useState<'idle'|'success'|'error'>('idle');

  const selectedLead = leads.find(l => l.id === selectedId) ?? null;
  const stepMeta = EMAIL_STEPS.find(s => s.step === activeStep)!;

  useEffect(() => { setSubject(''); setBody(''); setError(''); setSendStatus('idle'); }, [activeStep, selectedId]);

  async function generate() {
    if (!selectedLead) return;
    setGenerating(true); setError(''); setSendStatus('idle');
    try {
      const res = await fetch('/api/generate-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...selectedLead, sequenceStep: activeStep }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setSubject(data.subject); setBody(data.body);
    } catch (e: any) { setError(e.message); }
    finally { setGenerating(false); }
  }

  async function sendEmail() {
    if (!selectedLead || !subject || !body) return;
    setSending(true); setError('');
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: selectedLead.contact_email, subject, body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Send failed');
      setSendStatus('success');
    } catch (e: any) { setError(e.message); setSendStatus('error'); }
    finally { setSending(false); }
  }

  return (
    <div className="space-y-6">
      
      {/* Lead Info & Timeline */}
      <Card>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-4">
            <Label>Prospect Profile</Label>
            <div className="relative group">
              <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
                className={`${inputBaseClasses} appearance-none pr-10 cursor-pointer`}>
                <option value="">— Select a prospect —</option>
                {leads.map(l => <option key={l.id} value={l.id}>{l.business_name}</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 group-hover:text-zinc-300 pointer-events-none" />
            </div>

            <AnimatePresence>
              {selectedLead && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-3 mt-4">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                        {selectedLead.business_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-zinc-200">{selectedLead.business_name}</div>
                        <div className="text-xs text-zinc-500">{selectedLead.contact_email || 'No email on file'}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-zinc-500">Industry:</span> <span className="text-zinc-300">{selectedLead.industry || '—'}</span></div>
                      <div><span className="text-zinc-500">Score:</span> <span className="text-[#00D67D] font-medium">{selectedLead.website_quality_score ? `${selectedLead.website_quality_score}/10` : '—'}</span></div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <Label>Sequence Journey</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {EMAIL_STEPS.map((s, idx) => {
                const isActive = activeStep === s.step;
                return (
                  <button key={s.step} onClick={() => setActiveStep(s.step)}
                    className={`relative p-4 rounded-xl border text-left transition-all duration-300 ${
                      isActive ? 'bg-zinc-800/50 border-zinc-600 shadow-lg' : 'bg-black/20 border-white/5 hover:border-white/20'
                    }`}>
                    {isActive && (
                      <motion.div layoutId="active-step-border" className="absolute inset-0 rounded-xl"
                        style={{ border: `1px solid ${s.color}60`, boxShadow: `0 0 20px ${s.color}10` }} />
                    )}
                    <div className="relative z-10">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold tracking-widest uppercase mb-2" 
                        style={{ backgroundColor: `${s.color}15`, color: s.color, border: `1px solid ${s.color}30` }}>
                        {s.tag}
                      </span>
                      <div className={`text-sm font-semibold mb-1 ${isActive ? 'text-zinc-100' : 'text-zinc-400'}`}>{s.label}</div>
                      <div className="text-[10px] text-zinc-500 leading-snug">{s.desc}</div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Visual Timeline Line */}
            <div className="flex items-center gap-1 pt-2 px-2">
              {EMAIL_STEPS.map((s, i) => (
                <React.Fragment key={s.step}>
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all duration-300 ${activeStep >= s.step ? 'scale-100 shadow-[0_0_8px_currentColor]' : 'scale-75'}`}
                    style={{ backgroundColor: activeStep >= s.step ? s.color : '#3f3f46', color: s.color }} />
                  {i < EMAIL_STEPS.length - 1 && (
                    <div className="flex-1 h-0.5 transition-all duration-300"
                      style={{ backgroundColor: activeStep > s.step ? EMAIL_STEPS[i].color : '#27272a' }} />
                  )}
                </React.Fragment>
              ))}
            </div>

            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              onClick={generate} disabled={!selectedLead || generating}
              className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
              style={{ background: `linear-gradient(135deg, ${stepMeta.color}dd, ${stepMeta.color})`, color: '#000' }}>
              {generating ? <RefreshCw size={18} className="animate-spin" /> : <PenTool size={18} />}
              {generating ? 'Drafting...' : `Draft ${stepMeta.label}`}
            </motion.button>
          </div>
        </div>
      </Card>

      {/* Editor / Output Area */}
      <AnimatePresence>
        {error && (
          <motion.div {...fadeUp} className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle size={18} className="flex-shrink-0" /> {error}
          </motion.div>
        )}

        {(subject || body) && (
          <motion.div {...fadeUp} className="rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="flex space-x-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                </div>
                <span className="text-sm font-medium text-zinc-400 ml-2">New Message</span>
              </div>
            </div>

            <div className="p-6 bg-[#0a0a0c] space-y-4">
              <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                <span className="text-zinc-500 text-sm font-medium w-16">To:</span>
                <span className="text-zinc-300 text-sm bg-white/5 px-3 py-1 rounded-md border border-white/10">
                  {selectedLead?.contact_email || 'No email provided'}
                </span>
              </div>
              <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                <span className="text-zinc-500 text-sm font-medium w-16">Subject:</span>
                <input value={subject} onChange={e => setSubject(e.target.value)}
                  className="flex-1 bg-transparent text-zinc-200 text-sm outline-none font-medium placeholder:text-zinc-600" 
                  placeholder="Subject line..." />
              </div>
              <div className="pt-2">
                <textarea value={body} onChange={e => setBody(e.target.value)} rows={12}
                  className="w-full bg-transparent text-zinc-300 text-sm outline-none resize-none leading-relaxed placeholder:text-zinc-600" 
                  placeholder="Write your message here..." />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border-t border-zinc-800 bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <button onClick={sendEmail} disabled={sending || !selectedLead?.contact_email}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm bg-[#00D67D] hover:bg-[#00c271] text-black transition-colors disabled:opacity-50">
                  {sending ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                  Send Email
                </button>
                <button onClick={() => {
                    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
                    setCopied(true); setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
                  {copied ? <CheckCircle2 size={16} className="text-[#00D67D]" /> : <Copy size={16} />}
                </button>
              </div>

              {sendStatus === 'success' && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} 
                  className="flex items-center gap-2 text-[#00D67D] text-sm font-medium">
                  <CheckCircle2 size={16} /> Sent!
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────

export default function AIStudioPanel() {
  const [tab, setTab]     = useState<Tab>('copy');
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    fetch('/api/leads').then(r => r.json()).then(d => setLeads(Array.isArray(d) ? d : []));
  }, []);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'copy',  label: 'Copy Generator', icon: <Sparkles size={16} /> },
    { id: 'email', label: 'Email Sequence', icon: <Mail size={16} /> },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      
      {/* Header & Animated Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <Sparkles className="text-[#00D67D]" /> AI Content Studio
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Generate high-converting copy and outreach sequences.</p>
        </div>

        <div className="inline-flex p-1 bg-zinc-900/50 border border-white/5 rounded-2xl backdrop-blur-md self-start">
          {tabs.map(t => {
            const isActive = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors z-10 ${
                  isActive ? 'text-[#00D67D]' : 'text-zinc-500 hover:text-zinc-300'
                }`}>
                {isActive && (
                  <motion.div layoutId="active-tab" 
                    className="absolute inset-0 bg-[#00D67D]/10 border border-[#00D67D]/20 rounded-xl -z-10 shadow-[0_0_15px_rgba(0,214,125,0.05)]" 
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                {t.icon} {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={tab} 
          initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }} 
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }} 
          transition={{ duration: 0.3 }}
        >
          {tab === 'copy'  && <CopyTab  leads={leads} />}
          {tab === 'email' && <EmailTab leads={leads} />}
        </motion.div>
      </AnimatePresence>

    </div>
  );
}