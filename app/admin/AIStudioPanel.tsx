'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Copy, CheckCircle2, RefreshCw, AlertCircle,
  Instagram, Twitter, Search, Mail, MessageCircle, Linkedin,
  ChevronDown, Zap, Send, LayoutTemplate, PenTool
} from 'lucide-react';
import { Lead } from '@/lib/supabase';
import { useLeads } from '@/lib/hooks';

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
  <div className={`p-6 rounded-2xl admin-surface border admin-border shadow-xl ${className}`}>
    {children}
  </div>
);

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="label-xs mb-3 block">
    {children}
  </label>
);

const inputBaseClasses = "w-full admin-input border admin-border-md rounded-xl px-4 py-3 text-sm admin-text outline-none focus:border-[#00D67D]/50 transition-all placeholder:admin-subtle";

// ─── COPY OUTPUT RENDERER ─────────────────────────────────────────────────────

function renderOutput(platform: Platform, raw: string) {
  if (!raw || typeof raw !== 'string') return <p className="text-sm admin-text">{String(raw)}</p>;

  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);

  if (platform === 'instagram') {
    const captionIdx = lines.findIndex(l => /^caption\s*:?/i.test(l));
    const hashtagIdx = lines.findIndex(l => /^hashtags?\s*:?/i.test(l));
    const caption = captionIdx >= 0
      ? lines.slice(captionIdx + 1, hashtagIdx >= 0 ? hashtagIdx : undefined).join('\n')
      : raw.replace(/^caption\s*:?/i, '');
    const hashtags = hashtagIdx >= 0
      ? lines.slice(hashtagIdx + 1).join(' ')
      : lines.find(l => l.includes('#')) || '';

    return (
      <div className="space-y-4">
        <div>
          <div className="text-[10px] font-mono admin-muted uppercase tracking-wider mb-2">Caption</div>
          <div className="p-4 rounded-xl admin-surface-3 border admin-border">
            <p className="text-sm leading-relaxed whitespace-pre-wrap admin-text">{caption || raw}</p>
          </div>
        </div>
        {hashtags && (
          <div>
            <div className="text-[10px] font-mono admin-muted uppercase tracking-wider mb-2">Hashtags</div>
            <div className="p-3 rounded-xl admin-surface-3 border admin-border">
              <p className="text-xs text-pink-400 leading-relaxed font-mono">{hashtags}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (platform === 'twitter') {
    const tweetIdx = lines.findIndex(l => /^tweet\s*:?/i.test(l));
    const replyIdx = lines.findIndex(l => /^reply\s*:?/i.test(l));
    const tweet = tweetIdx >= 0
      ? lines.slice(tweetIdx + 1, replyIdx >= 0 ? replyIdx : undefined).join('\n')
      : raw.replace(/^tweet\s*:?/i, '');
    const reply = replyIdx >= 0 ? lines.slice(replyIdx + 1).join('\n') : '';

    return (
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] font-mono admin-muted uppercase tracking-wider">Tweet</div>
            <div className={`text-[10px] font-mono ${tweet.length > 280 ? 'text-red-400' : 'admin-muted'}`}>
              {tweet.length} / 280 chars
            </div>
          </div>
          <div className="p-4 rounded-xl admin-surface-3 border admin-border">
            <p className="text-sm leading-relaxed whitespace-pre-wrap admin-text">{tweet || raw}</p>
          </div>
        </div>
        {reply && (
          <div>
            <div className="text-[10px] font-mono admin-muted uppercase tracking-wider mb-2">Reply Thread</div>
            <div className="p-4 rounded-xl admin-surface-3 border admin-border opacity-80">
              <p className="text-sm leading-relaxed whitespace-pre-wrap admin-text">{reply}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (platform === 'google_ads') {
    const fields: { label: string; value: string; max: number }[] = [];
    [
      { key: /headline\s*1\s*:?/i,     label: 'Headline 1',     max: 30 },
      { key: /headline\s*2\s*:?/i,     label: 'Headline 2',     max: 30 },
      { key: /headline\s*3\s*:?/i,     label: 'Headline 3',     max: 30 },
      { key: /description\s*1\s*:?/i,  label: 'Description 1',  max: 90 },
      { key: /description\s*2\s*:?/i,  label: 'Description 2',  max: 90 },
    ].forEach(({ key, label, max }) => {
      const line = lines.find(l => key.test(l));
      if (line) fields.push({ label, value: line.replace(key, '').trim(), max });
    });

    if (fields.length === 0) {
      return <p className="text-sm leading-relaxed admin-text">{raw}</p>;
    }

    return (
      <div className="space-y-3">
        {fields.map(f => (
          <div key={f.label} className="p-3 rounded-xl admin-surface-3 border admin-border flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-mono admin-muted uppercase tracking-wider">{f.label}</div>
              <span className={`text-[10px] font-mono ${f.value.length > f.max ? 'text-red-400' : 'admin-muted'}`}>
                {f.value.length}/{f.max}
              </span>
            </div>
            <p className="text-sm admin-text font-medium">{f.value}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl admin-surface-3 border admin-border space-y-2">
      {lines.map((line, i) => <p key={i} className="text-sm leading-relaxed admin-text">{line}</p>)}
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
      const raw = data.output || data.copy || data.content;
      if (!raw || typeof raw !== 'string') throw new Error('Unexpected response format from AI provider');
      // Unescape literal \n sequences the AI sometimes returns inside JSON strings
      setOutput(raw.replace(/\\n/g, '\n'));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally { setGenerating(false); }
  }

  function copyOutput() {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">

      {/* ── Left: Configuration ── */}
      <div className="lg:col-span-5 space-y-5">

        {/* Lead selector */}
        <motion.div {...fadeUp} className="admin-card p-5 space-y-3">
          <label className="label-xs block">Target Prospect</label>
          <div className="relative group">
            <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
              className="admin-input w-full appearance-none pr-10 py-3 text-sm cursor-pointer">
              <option value="">— Select a prospect profile —</option>
              {leads.map(l => (
                <option key={l.id} value={l.id}>
                  {l.business_name} ({l.contact_email || 'No email'})
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 admin-muted group-hover:admin-text transition-colors pointer-events-none" />
          </div>
        </motion.div>

        {/* Platform picker */}
        <motion.div {...fadeUp} transition={{ delay: 0.04 }} className="admin-card p-5 space-y-4">
          <label className="label-xs block">Destination Platform</label>
          <div className="grid grid-cols-3 gap-3">
            {PLATFORMS.map(p => {
              const isActive = platform === p.id;
              return (
                <button key={p.id} onClick={() => setPlatform(p.id)}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all duration-200 ${
                    isActive
                      ? 'bg-white/10 border-white/20 shadow-lg'
                      : 'admin-surface-2 border-transparent admin-hover admin-muted hover:admin-text'
                  }`}>
                  <div className={isActive ? p.color : 'opacity-60'}>{p.icon}</div>
                  <span className={`text-[10px] font-semibold tracking-wide ${isActive ? 'admin-text' : ''}`}>{p.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Tone, goal, key message, generate */}
        <motion.div {...fadeUp} transition={{ delay: 0.06 }} className="admin-card p-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label-xs mb-3 block">Voice Tone</label>
              <div className="flex flex-wrap gap-2">
                {TONES.map(t => (
                  <button key={t} onClick={() => setTone(t)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium ring-1 ring-inset transition-all ${
                      tone === t
                        ? 'bg-[#00D67D]/10 text-[#00D67D] ring-[#00D67D]/30'
                        : 'admin-surface-2 admin-muted ring-white/5 hover:ring-white/10 hover:admin-text'
                    }`}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="label-xs mb-3 block">Campaign Goal</label>
              <div className="flex flex-wrap gap-2">
                {GOALS.map(g => (
                  <button key={g} onClick={() => setGoal(g)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium ring-1 ring-inset transition-all ${
                      goal === g
                        ? 'bg-[#00D67D]/10 text-[#00D67D] ring-[#00D67D]/30'
                        : 'admin-surface-2 admin-muted ring-white/5 hover:ring-white/10 hover:admin-text'
                    }`}>{g}</button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="label-xs mb-2 block">
              Key Message{' '}
              <span className="normal-case font-normal admin-muted">— Optional</span>
            </label>
            <textarea value={keyMessage} onChange={e => setKeyMessage(e.target.value)}
              placeholder="e.g. We just launched a feature that helps you get 3× more bookings..."
              className="admin-input w-full resize-none h-20 py-3 text-sm" />
          </div>

          <button onClick={generate} disabled={!selectedLead || generating}
            className="w-full flex items-center justify-center gap-2 px-5 py-4 rounded-xl font-bold text-sm text-black transition-all disabled:opacity-50 hover:opacity-90 shadow-[0_0_20px_rgba(0,214,125,0.1)]"
            style={{ background: 'var(--accent)' }}>
            {generating
              ? <RefreshCw size={16} className="animate-spin" />
              : <Sparkles size={16} />}
            {generating ? 'Drafting content…' : 'Generate Copy'}
          </button>
        </motion.div>
      </div>

      {/* ── Right: Output ── */}
      <div className="lg:col-span-7">
        <AnimatePresence mode="wait">
          {!output && !error && !generating && (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="admin-card h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 border-dashed">
              <div className="w-12 h-12 rounded-full admin-surface-2 flex items-center justify-center mb-4">
                <Sparkles size={20} className="admin-subtle" />
              </div>
              <h3 className="text-sm font-semibold admin-text mb-1">Ready to generate</h3>
              <p className="text-xs admin-muted max-w-xs leading-relaxed">
                Select a prospect and click generate to create highly personalised, platform-specific copy.
              </p>
            </motion.div>
          )}

          {generating && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="admin-card h-full min-h-[300px] flex flex-col items-center justify-center p-8">
              <RefreshCw size={24} className="animate-spin text-[#00D67D] mb-4" />
              <p className="text-sm admin-muted animate-pulse">Analysing profile & writing copy…</p>
            </motion.div>
          )}

          {error && !generating && (
            <motion.div key="error" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />{error}
            </motion.div>
          )}

          {output && !generating && (
            <motion.div key="output" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="admin-card overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b admin-border admin-surface-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#00D67D] animate-pulse" />
                  <span className="text-sm font-semibold admin-text">Generated Result</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={generate} disabled={generating}
                    className="flex items-center gap-1.5 text-xs font-medium admin-muted hover:admin-text px-3 py-1.5 rounded-lg admin-hover transition-colors">
                    <RefreshCw size={13} /> Regenerate
                  </button>
                  <button onClick={copyOutput}
                    className="flex items-center gap-1.5 text-xs font-medium admin-surface-2 hover:bg-white/10 admin-text px-3 py-1.5 rounded-lg transition-colors border admin-border">
                    {copied
                      ? <CheckCircle2 size={13} className="text-[#00D67D]" />
                      : <Copy size={13} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
              <div className="p-6">
                {renderOutput(platform, output)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
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
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Generation failed'); }
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
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Send failed'); setSendStatus('error'); }
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
                  <div className="p-4 rounded-xl admin-surface-2 border admin-border space-y-3 mt-4">
                    <div className="flex items-center gap-3 border-b admin-border pb-3">
                      <div className="w-10 h-10 rounded-full admin-surface-3 border admin-border flex items-center justify-center admin-muted font-semibold text-sm">
                        {selectedLead.business_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold admin-text">{selectedLead.business_name}</div>
                        <div className="text-xs admin-muted">{selectedLead.contact_email || 'No email on file'}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="admin-muted">Industry:</span> <span className="admin-text">{selectedLead.industry || '—'}</span></div>
                      <div><span className="admin-muted">Score:</span> <span className="text-[#00D67D] font-medium">{selectedLead.website_quality_score ? `${selectedLead.website_quality_score}/10` : '—'}</span></div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <Label>Sequence Journey</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {EMAIL_STEPS.map((s) => {
                const isActive = activeStep === s.step;
                return (
                  <button key={s.step} onClick={() => setActiveStep(s.step)}
                    className={`relative p-4 rounded-xl border text-left transition-all duration-300 ${
                      isActive ? 'admin-surface-2 admin-border-md shadow-lg' : 'admin-hover admin-border'
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
                      <div className={`text-sm font-semibold mb-1 ${isActive ? 'admin-text' : 'admin-muted'}`}>{s.label}</div>
                      <div className="text-[10px] admin-muted leading-snug">{s.desc}</div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Visual Timeline Line */}
            <div className="flex items-center gap-1 pt-2 px-2">
              {EMAIL_STEPS.map((s, i) => (
                <React.Fragment key={s.step}>
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all duration-300 ${activeStep >= s.step ? 'scale-100' : 'scale-75'}`}
                    style={{ backgroundColor: activeStep >= s.step ? s.color : 'var(--admin-border-md)', color: s.color }} />
                  {i < EMAIL_STEPS.length - 1 && (
                    <div className="flex-1 h-0.5 transition-all duration-300"
                      style={{ backgroundColor: activeStep > s.step ? EMAIL_STEPS[i].color : 'var(--admin-border-md)' }} />
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
          <motion.div {...fadeUp} className="rounded-2xl admin-surface border admin-border shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b admin-border admin-surface-2">
              <div className="flex items-center gap-3">
                <div className="flex space-x-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400/70"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400/70"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400/70"></div>
                </div>
                <span className="text-sm font-medium admin-muted ml-2">New Message</span>
              </div>
            </div>

            <div className="p-6 admin-surface-2 space-y-4">
              <div className="flex items-center gap-4 border-b admin-border pb-4">
                <span className="admin-muted text-sm font-medium w-16">To:</span>
                <span className="admin-text text-sm admin-surface px-3 py-1 rounded-md border admin-border">
                  {selectedLead?.contact_email || 'No email provided'}
                </span>
              </div>
              <div className="flex items-center gap-4 border-b admin-border pb-4">
                <span className="admin-muted text-sm font-medium w-16">Subject:</span>
                <input value={subject} onChange={e => setSubject(e.target.value)}
                  className="flex-1 bg-transparent admin-text text-sm outline-none font-medium placeholder:admin-subtle" 
                  placeholder="Subject line..." />
              </div>
              <div className="pt-2">
                <textarea value={body} onChange={e => setBody(e.target.value)} rows={12}
                  className="w-full bg-transparent admin-text text-sm outline-none resize-none leading-relaxed placeholder:admin-subtle" 
                  placeholder="Write your message here..." />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border-t admin-border admin-surface-2">
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
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm admin-muted hover:admin-text admin-hover transition-colors">
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
  const { leads }         = useLeads();

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'copy',  label: 'Copy Generator', icon: <Sparkles size={16} /> },
    { id: 'email', label: 'Email Sequence', icon: <Mail size={16} /> },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      
      {/* Header & Animated Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold admin-text flex items-center gap-2">
            <Sparkles className="text-[#00D67D]" /> AI Content Studio
          </h1>
          <p className="text-sm admin-muted mt-1">Generate high-converting copy and outreach sequences.</p>
        </div>

        <div className="inline-flex p-1 admin-surface border admin-border rounded-2xl self-start">
          {tabs.map(t => {
            const isActive = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors z-10 ${
                  isActive ? 'text-[#00D67D]' : 'admin-muted hover:admin-text'
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