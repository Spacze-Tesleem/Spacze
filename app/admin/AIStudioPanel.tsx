'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Copy, CheckCircle2, RefreshCw, AlertCircle,
  Instagram, Twitter, Search, Mail, MessageCircle, Linkedin,
  ChevronDown, Send, PenTool, Wand2, Globe, Target,
} from 'lucide-react';
import { Lead } from '@/lib/supabase';
import { useLeads } from '@/lib/hooks';

type Mode = 'copy' | 'email' | 'sequence';
type Platform = 'instagram' | 'twitter' | 'google_ads' | 'email' | 'whatsapp' | 'linkedin';

const PLATFORMS: { id: Platform; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'instagram',  label: 'Instagram',   icon: <Instagram size={15} />,     color: '#e1306c' },
  { id: 'twitter',    label: 'Twitter / X', icon: <Twitter size={15} />,       color: '#38bdf8' },
  { id: 'google_ads', label: 'Google Ads',  icon: <Search size={15} />,        color: '#facc15' },
  { id: 'email',      label: 'Email',       icon: <Mail size={15} />,          color: '#60a5fa' },
  { id: 'whatsapp',   label: 'WhatsApp',    icon: <MessageCircle size={15} />, color: '#25D366' },
  { id: 'linkedin',   label: 'LinkedIn',    icon: <Linkedin size={15} />,      color: '#0a66c2' },
];

const TONES = ['Professional', 'Friendly', 'Bold', 'Urgent', 'Witty', 'Empathetic'];
const GOALS = ['Awareness', 'Clicks', 'Leads', 'Sales', 'Engagement', 'Retention'];

const EMAIL_STEPS = [
  { step: 1, label: 'Initial Outreach', tag: 'Day 1',  color: '#00D67D', desc: 'First touch — personalised observation' },
  { step: 2, label: 'Follow-up #1',     tag: 'Day 4',  color: '#3b82f6', desc: 'New insight, no "just checking in"' },
  { step: 3, label: 'Follow-up #2',     tag: 'Day 9',  color: '#a855f7', desc: 'Results angle + free audit offer' },
  { step: 4, label: 'Break-up',         tag: 'Day 14', color: '#f59e0b', desc: 'Gracious close, door stays open' },
];

// ─── LEAD SELECTOR ────────────────────────────────────────────────────────────

function LeadSelector({ leads, value, onChange }: { leads: Lead[]; value: string; onChange: (v: string) => void }) {
  const selected = leads.find(l => l.id === value);
  return (
    <div className="space-y-3">
      <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value)}
          className="admin-input w-full appearance-none pr-10 py-2.5 text-sm cursor-pointer">
          <option value="">— Select a prospect —</option>
          {leads.map(l => <option key={l.id} value={l.id}>{l.business_name}</option>)}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 admin-muted pointer-events-none" />
      </div>
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="p-3 rounded-xl bg-[var(--admin-surface-2)] border admin-border space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[var(--admin-surface-3)] border admin-border flex items-center justify-center text-xs font-bold admin-text-2 flex-shrink-0">
                  {selected.business_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold admin-text truncate">{selected.business_name}</div>
                  <div className="text-[11px] admin-muted truncate">{selected.contact_email || 'No email'}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] pt-1 border-t admin-border">
                <div className="flex items-center gap-1.5 admin-muted"><Globe size={10} />{selected.industry || '—'}</div>
                <div className="flex items-center gap-1.5"><Target size={10} className="text-[#00D67D]" /><span className="text-[#00D67D] font-medium">{selected.website_quality_score != null ? `${selected.website_quality_score}/10` : '—'}</span></div>
                {selected.weak_points && <div className="col-span-2 admin-muted leading-snug line-clamp-2 mt-0.5">{selected.weak_points}</div>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── COPY OUTPUT RENDERER ─────────────────────────────────────────────────────

function renderOutput(platform: Platform, raw: string) {
  if (!raw) return null;
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);

  if (platform === 'instagram') {
    const capIdx = lines.findIndex(l => /^caption\s*:?/i.test(l));
    const tagIdx = lines.findIndex(l => /^hashtags?\s*:?/i.test(l));
    const caption = capIdx >= 0 ? lines.slice(capIdx + 1, tagIdx >= 0 ? tagIdx : undefined).join('\n') : raw;
    const hashtags = tagIdx >= 0 ? lines.slice(tagIdx + 1).join(' ') : '';
    return (
      <div className="space-y-3">
        <div className="p-4 rounded-xl bg-[var(--admin-surface-2)] border admin-border">
          <div className="text-[10px] font-mono admin-muted uppercase tracking-wider mb-2">Caption</div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap admin-text">{caption}</p>
        </div>
        {hashtags && <div className="p-3 rounded-xl bg-[var(--admin-surface-2)] border admin-border">
          <div className="text-[10px] font-mono admin-muted uppercase tracking-wider mb-1.5">Hashtags</div>
          <p className="text-xs text-pink-400 font-mono leading-relaxed">{hashtags}</p>
        </div>}
      </div>
    );
  }

  if (platform === 'twitter') {
    const tIdx = lines.findIndex(l => /^tweet\s*:?/i.test(l));
    const rIdx = lines.findIndex(l => /^reply\s*:?/i.test(l));
    const tweet = tIdx >= 0 ? lines.slice(tIdx + 1, rIdx >= 0 ? rIdx : undefined).join('\n') : raw;
    const reply = rIdx >= 0 ? lines.slice(rIdx + 1).join('\n') : '';
    return (
      <div className="space-y-3">
        <div className="p-4 rounded-xl bg-[var(--admin-surface-2)] border admin-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono admin-muted uppercase tracking-wider">Tweet</span>
            <span className={`text-[10px] font-mono ${tweet.length > 280 ? 'text-red-400' : 'admin-muted'}`}>{tweet.length}/280</span>
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap admin-text">{tweet}</p>
        </div>
        {reply && <div className="p-4 rounded-xl bg-[var(--admin-surface-2)] border admin-border opacity-80">
          <div className="text-[10px] font-mono admin-muted uppercase tracking-wider mb-2">Reply Thread</div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap admin-text">{reply}</p>
        </div>}
      </div>
    );
  }

  if (platform === 'google_ads') {
    const fields: { label: string; value: string; max: number }[] = [];
    [
      { key: /headline\s*1\s*:?/i, label: 'Headline 1', max: 30 },
      { key: /headline\s*2\s*:?/i, label: 'Headline 2', max: 30 },
      { key: /headline\s*3\s*:?/i, label: 'Headline 3', max: 30 },
      { key: /description\s*1\s*:?/i, label: 'Description 1', max: 90 },
      { key: /description\s*2\s*:?/i, label: 'Description 2', max: 90 },
    ].forEach(({ key, label, max }) => {
      const line = lines.find(l => key.test(l));
      if (line) fields.push({ label, value: line.replace(key, '').trim(), max });
    });
    if (!fields.length) return <p className="text-sm admin-text leading-relaxed">{raw}</p>;
    return (
      <div className="space-y-2">
        {fields.map(f => (
          <div key={f.label} className="p-3 rounded-xl bg-[var(--admin-surface-2)] border admin-border">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono admin-muted uppercase tracking-wider">{f.label}</span>
              <span className={`text-[10px] font-mono ${f.value.length > f.max ? 'text-red-400' : 'admin-muted'}`}>{f.value.length}/{f.max}</span>
            </div>
            <p className="text-sm admin-text font-medium">{f.value}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-[var(--admin-surface-2)] border admin-border">
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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...selectedLead, platform, tone, goal, keyMessage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      const raw = data.output || data.copy || data.content;
      if (!raw) throw new Error('Unexpected response from AI');
      setOutput(raw.replace(/\\n/g, '\n'));
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Generation failed'); }
    finally { setGenerating(false); }
  }

  const activePlatform = PLATFORMS.find(p => p.id === platform)!;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-0 min-h-[600px] rounded-2xl overflow-hidden border admin-border shadow-2xl">

      {/* ── Config sidebar ── */}
      <div className="bg-[var(--admin-surface)] border-r admin-border flex flex-col">
        <div className="px-5 py-4 border-b admin-border">
          <div className="flex items-center gap-2 mb-1">
            <Wand2 size={14} className="text-[#00D67D]" />
            <span className="text-xs font-bold admin-text uppercase tracking-wider">Copy Generator</span>
          </div>
          <p className="text-[11px] admin-muted">Platform-specific ad & social copy</p>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Prospect */}
          <div>
            <label className="text-[10px] font-bold admin-muted uppercase tracking-wider mb-2 block">Prospect</label>
            <LeadSelector leads={leads} value={selectedId} onChange={setSelectedId} />
          </div>

          {/* Platform */}
          <div>
            <label className="text-[10px] font-bold admin-muted uppercase tracking-wider mb-2 block">Platform</label>
            <div className="grid grid-cols-3 gap-2">
              {PLATFORMS.map(p => (
                <button key={p.id} onClick={() => setPlatform(p.id)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
                    platform === p.id
                      ? 'bg-[var(--admin-surface-2)] border-[var(--admin-border-md)] shadow-sm'
                      : 'border-transparent hover:bg-[var(--admin-hover-bg)] admin-muted'
                  }`}
                  style={platform === p.id ? { borderColor: `${p.color}40` } : {}}>
                  <span style={{ color: platform === p.id ? p.color : undefined }}>{p.icon}</span>
                  <span className="text-[9px] font-semibold leading-tight" style={{ color: platform === p.id ? p.color : undefined }}>
                    {p.label.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div>
            <label className="text-[10px] font-bold admin-muted uppercase tracking-wider mb-2 block">Tone</label>
            <div className="flex flex-wrap gap-1.5">
              {TONES.map(t => (
                <button key={t} onClick={() => setTone(t)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                    tone === t
                      ? 'bg-[#00D67D]/10 text-[#00D67D] border-[#00D67D]/30'
                      : 'admin-muted border-[var(--admin-border)] hover:border-[var(--admin-border-md)] hover:admin-text'
                  }`}>{t}</button>
              ))}
            </div>
          </div>

          {/* Goal */}
          <div>
            <label className="text-[10px] font-bold admin-muted uppercase tracking-wider mb-2 block">Goal</label>
            <div className="flex flex-wrap gap-1.5">
              {GOALS.map(g => (
                <button key={g} onClick={() => setGoal(g)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                    goal === g
                      ? 'bg-[#00D67D]/10 text-[#00D67D] border-[#00D67D]/30'
                      : 'admin-muted border-[var(--admin-border)] hover:border-[var(--admin-border-md)] hover:admin-text'
                  }`}>{g}</button>
              ))}
            </div>
          </div>

          {/* Key message */}
          <div>
            <label className="text-[10px] font-bold admin-muted uppercase tracking-wider mb-2 block">Key Message <span className="normal-case font-normal">(optional)</span></label>
            <textarea value={keyMessage} onChange={e => setKeyMessage(e.target.value)} rows={3}
              placeholder="e.g. We just launched a feature that gets 3× more bookings…"
              className="admin-input w-full resize-none text-sm py-2.5" />
          </div>
        </div>

        {/* Generate button */}
        <div className="p-4 border-t admin-border">
          <button onClick={generate} disabled={!selectedLead || generating}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-black transition-all disabled:opacity-40 hover:opacity-90"
            style={{ background: generating ? 'var(--admin-surface-3)' : `linear-gradient(135deg, ${activePlatform.color}dd, ${activePlatform.color})` }}>
            {generating ? <RefreshCw size={15} className="animate-spin text-[#00D67D]" /> : <Wand2 size={15} />}
            <span style={{ color: generating ? 'var(--admin-text)' : '#000' }}>
              {generating ? 'Generating…' : `Generate for ${activePlatform.label}`}
            </span>
          </button>
        </div>
      </div>

      {/* ── Output canvas ── */}
      <div className="bg-[var(--admin-surface-2)] flex flex-col">
        <div className="px-6 py-4 border-b admin-border flex items-center justify-between bg-[var(--admin-surface)]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: output ? activePlatform.color : 'var(--admin-border-md)' }} />
            <span className="text-xs font-semibold admin-text">Output Canvas</span>
            {output && <span className="text-[10px] admin-muted">— {activePlatform.label}</span>}
          </div>
          {output && (
            <button onClick={() => { navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="flex items-center gap-1.5 text-xs font-medium admin-muted hover:admin-text px-3 py-1.5 rounded-lg hover:bg-[var(--admin-hover-bg)] transition-colors border admin-border">
              {copied ? <CheckCircle2 size={12} className="text-[#00D67D]" /> : <Copy size={12} />}
              {copied ? 'Copied!' : 'Copy all'}
            </button>
          )}
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            {!output && !error && !generating && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="h-full min-h-[400px] flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-[var(--admin-surface)] border admin-border flex items-center justify-center mb-4 shadow-sm">
                  <Wand2 size={24} className="admin-subtle" />
                </div>
                <p className="text-sm font-semibold admin-text mb-1">Canvas is empty</p>
                <p className="text-xs admin-muted max-w-[240px] leading-relaxed">Select a prospect, choose a platform, and click Generate.</p>
              </motion.div>
            )}
            {generating && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="h-full min-h-[400px] flex flex-col items-center justify-center gap-4">
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 rounded-full border-2 border-[#00D67D]/20 animate-ping" />
                  <div className="w-12 h-12 rounded-full bg-[#00D67D]/10 border border-[#00D67D]/30 flex items-center justify-center">
                    <Sparkles size={20} className="text-[#00D67D] animate-pulse" />
                  </div>
                </div>
                <p className="text-sm admin-muted animate-pulse">Writing {activePlatform.label} copy…</p>
              </motion.div>
            )}
            {error && !generating && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />{error}
              </motion.div>
            )}
            {output && !generating && (
              <motion.div key="output" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {renderOutput(platform, output)}
                <button onClick={generate} className="mt-4 flex items-center gap-1.5 text-xs admin-muted hover:admin-text transition-colors">
                  <RefreshCw size={12} /> Regenerate
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── EMAIL TAB ────────────────────────────────────────────────────────────────

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
        body: JSON.stringify({ to: selectedLead.contact_email, subject, body, lead_id: selectedLead.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Send failed');
      setSendStatus('success');
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Send failed'); setSendStatus('error'); }
    finally { setSending(false); }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-0 min-h-[600px] rounded-2xl overflow-hidden border admin-border shadow-2xl">

      {/* ── Config sidebar ── */}
      <div className="bg-[var(--admin-surface)] border-r admin-border flex flex-col">
        <div className="px-5 py-4 border-b admin-border">
          <div className="flex items-center gap-2 mb-1">
            <Mail size={14} className="text-blue-400" />
            <span className="text-xs font-bold admin-text uppercase tracking-wider">Email Sequence</span>
          </div>
          <p className="text-[11px] admin-muted">Personalised step-by-step outreach</p>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Prospect */}
          <div>
            <label className="text-[10px] font-bold admin-muted uppercase tracking-wider mb-2 block">Prospect</label>
            <LeadSelector leads={leads} value={selectedId} onChange={setSelectedId} />
          </div>

          {/* Sequence steps */}
          <div>
            <label className="text-[10px] font-bold admin-muted uppercase tracking-wider mb-2 block">Sequence Step</label>
            <div className="space-y-2">
              {EMAIL_STEPS.map(s => (
                <button key={s.step} onClick={() => setActiveStep(s.step)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    activeStep === s.step
                      ? 'bg-[var(--admin-surface-2)] shadow-sm'
                      : 'border-transparent hover:bg-[var(--admin-hover-bg)] admin-muted'
                  }`}
                  style={activeStep === s.step ? { borderColor: `${s.color}40` } : {}}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${s.color}20`, color: s.color }}>{s.tag}</span>
                    <span className={`text-xs font-semibold ${activeStep === s.step ? 'admin-text' : ''}`}>{s.label}</span>
                  </div>
                  <p className="text-[10px] admin-muted leading-snug">{s.desc}</p>
                </button>
              ))}
            </div>

            {/* Progress dots */}
            <div className="flex items-center gap-1 mt-3 px-1">
              {EMAIL_STEPS.map((s, i) => (
                <React.Fragment key={s.step}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0 transition-all"
                    style={{ backgroundColor: activeStep >= s.step ? s.color : 'var(--admin-border-md)' }} />
                  {i < EMAIL_STEPS.length - 1 && (
                    <div className="flex-1 h-px transition-all"
                      style={{ backgroundColor: activeStep > s.step ? EMAIL_STEPS[i].color : 'var(--admin-border-md)' }} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t admin-border">
          <button onClick={generate} disabled={!selectedLead || generating}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40"
            style={{ background: `linear-gradient(135deg, ${stepMeta.color}cc, ${stepMeta.color})`, color: '#000' }}>
            {generating ? <RefreshCw size={15} className="animate-spin" /> : <PenTool size={15} />}
            {generating ? 'Drafting…' : `Draft ${stepMeta.label}`}
          </button>
        </div>
      </div>

      {/* ── Email composer ── */}
      <div className="bg-[var(--admin-surface-2)] flex flex-col">
        <div className="px-6 py-4 border-b admin-border bg-[var(--admin-surface)] flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
            <div className="w-3 h-3 rounded-full bg-green-400/60" />
          </div>
          <span className="text-xs admin-muted font-medium ml-1">New Message</span>
        </div>

        <div className="flex-1 flex flex-col">
          {error && (
            <div className="mx-6 mt-4 flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />{error}
            </div>
          )}

          {!subject && !body && !generating && !error && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-[var(--admin-surface)] border admin-border flex items-center justify-center mb-4 shadow-sm">
                <Mail size={24} className="admin-subtle" />
              </div>
              <p className="text-sm font-semibold admin-text mb-1">Composer is empty</p>
              <p className="text-xs admin-muted max-w-[220px] leading-relaxed">Select a prospect and step, then click Draft.</p>
            </div>
          )}

          {generating && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-2 border-blue-400/20 animate-ping" />
                <div className="w-12 h-12 rounded-full bg-blue-400/10 border border-blue-400/30 flex items-center justify-center">
                  <PenTool size={20} className="text-blue-400 animate-pulse" />
                </div>
              </div>
              <p className="text-sm admin-muted animate-pulse">Writing {stepMeta.label}…</p>
            </div>
          )}

          {(subject || body) && !generating && (
            <div className="flex-1 flex flex-col p-6 space-y-4">
              <div className="flex items-center gap-3 border-b admin-border pb-3">
                <span className="text-xs admin-muted font-medium w-14 flex-shrink-0">To:</span>
                <span className="text-sm admin-text bg-[var(--admin-surface)] px-3 py-1 rounded-lg border admin-border">
                  {selectedLead?.contact_email || 'No email'}
                </span>
              </div>
              <div className="flex items-center gap-3 border-b admin-border pb-3">
                <span className="text-xs admin-muted font-medium w-14 flex-shrink-0">Subject:</span>
                <input value={subject} onChange={e => setSubject(e.target.value)}
                  className="flex-1 bg-transparent admin-text text-sm outline-none font-semibold placeholder:admin-subtle" />
              </div>
              <textarea value={body} onChange={e => setBody(e.target.value)} rows={12}
                className="flex-1 w-full bg-transparent admin-text text-sm outline-none resize-none leading-relaxed placeholder:admin-subtle" />
            </div>
          )}
        </div>

        {(subject || body) && !generating && (
          <div className="flex items-center justify-between px-6 py-4 border-t admin-border bg-[var(--admin-surface)]">
            <div className="flex items-center gap-2">
              <button onClick={sendEmail} disabled={sending || !selectedLead?.contact_email}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-[#00D67D] hover:opacity-90 text-black transition-all disabled:opacity-40">
                {sending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                {sending ? 'Sending…' : 'Send'}
              </button>
              <button onClick={() => { navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs admin-muted hover:admin-text hover:bg-[var(--admin-hover-bg)] transition-colors border admin-border">
                {copied ? <CheckCircle2 size={13} className="text-[#00D67D]" /> : <Copy size={13} />}
              </button>
            </div>
            {sendStatus === 'success' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-1.5 text-[#00D67D] text-xs font-semibold">
                <CheckCircle2 size={14} /> Sent successfully
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SEQUENCE TAB ─────────────────────────────────────────────────────────────

interface EmailStep { step: number; subject: string; body: string; }

function SequenceTab({ leads }: { leads: Lead[] }) {
  const [selectedId, setSelectedId] = useState('');
  const [generating, setGenerating] = useState(false);
  const [steps, setSteps]           = useState<EmailStep[]>([]);
  const [activeStep, setActiveStep] = useState(1);
  const [error, setError]           = useState('');
  const [sending, setSending]       = useState(false);
  const [sendStatus, setSendStatus] = useState<Record<number, 'idle'|'success'|'error'>>({});
  const [copied, setCopied]         = useState<number | null>(null);
  const selectedLead = leads.find(l => l.id === selectedId) ?? null;
  const currentStep = steps.find(s => s.step === activeStep);

  async function generate() {
    if (!selectedLead) return;
    setGenerating(true); setError(''); setSteps([]);
    try {
      const res = await fetch('/api/generate-sequence', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedLead),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setSteps(data.steps || []);
      setActiveStep(1);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Generation failed'); }
    finally { setGenerating(false); }
  }

  async function sendStep(step: EmailStep) {
    if (!selectedLead?.contact_email) return;
    setSending(true);
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: selectedLead.contact_email, subject: step.subject, body: step.body, lead_id: selectedLead.id }),
      });
      if (!res.ok) throw new Error('Send failed');
      setSendStatus(prev => ({ ...prev, [step.step]: 'success' }));
    } catch { setSendStatus(prev => ({ ...prev, [step.step]: 'error' })); }
    finally { setSending(false); }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-0 min-h-[600px] rounded-2xl overflow-hidden border admin-border shadow-2xl">

      {/* ── Config sidebar ── */}
      <div className="bg-[var(--admin-surface)] border-r admin-border flex flex-col">
        <div className="px-5 py-4 border-b admin-border">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={14} className="text-purple-400" />
            <span className="text-xs font-bold admin-text uppercase tracking-wider">Full AI Sequence</span>
          </div>
          <p className="text-[11px] admin-muted">Generate all 4 emails at once with Gemini</p>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <label className="text-[10px] font-bold admin-muted uppercase tracking-wider mb-2 block">Prospect</label>
            <LeadSelector leads={leads} value={selectedId} onChange={setSelectedId} />
          </div>

          {steps.length > 0 && (
            <div>
              <label className="text-[10px] font-bold admin-muted uppercase tracking-wider mb-2 block">Sequence Steps</label>
              <div className="space-y-1.5">
                {EMAIL_STEPS.map(s => {
                  const generated = steps.find(st => st.step === s.step);
                  const status = sendStatus[s.step];
                  return (
                    <button key={s.step} onClick={() => setActiveStep(s.step)}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        activeStep === s.step ? 'bg-[var(--admin-surface-2)] shadow-sm' : 'border-transparent hover:bg-[var(--admin-hover-bg)]'
                      }`}
                      style={activeStep === s.step ? { borderColor: `${s.color}40` } : {}}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${s.color}20`, color: s.color }}>{s.tag}</span>
                          <span className={`text-xs font-medium ${activeStep === s.step ? 'admin-text' : 'admin-muted'}`}>{s.label}</span>
                        </div>
                        {generated && (
                          status === 'success'
                            ? <CheckCircle2 size={12} className="text-[#00D67D]" />
                            : <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t admin-border">
          <button onClick={generate} disabled={!selectedLead || generating}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #a855f7cc, #a855f7)', color: '#000' }}>
            {generating ? <RefreshCw size={15} className="animate-spin" /> : <Sparkles size={15} />}
            {generating ? 'Generating sequence…' : steps.length ? 'Regenerate All' : 'Generate Full Sequence'}
          </button>
        </div>
      </div>

      {/* ── Sequence viewer ── */}
      <div className="bg-[var(--admin-surface-2)] flex flex-col">
        <div className="px-6 py-4 border-b admin-border bg-[var(--admin-surface)] flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
            <div className="w-3 h-3 rounded-full bg-green-400/60" />
          </div>
          <span className="text-xs admin-muted font-medium ml-1">
            {currentStep ? `Step ${activeStep} of 4 — ${EMAIL_STEPS.find(s => s.step === activeStep)?.label}` : 'Sequence Viewer'}
          </span>
        </div>

        <div className="flex-1 flex flex-col">
          {error && (
            <div className="mx-6 mt-4 flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />{error}
            </div>
          )}

          {!steps.length && !generating && !error && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-[var(--admin-surface)] border admin-border flex items-center justify-center mb-4 shadow-sm">
                <Sparkles size={24} className="admin-subtle" />
              </div>
              <p className="text-sm font-semibold admin-text mb-1">No sequence yet</p>
              <p className="text-xs admin-muted max-w-[220px] leading-relaxed">Select a prospect and generate a full 4-step sequence in one click.</p>
            </div>
          )}

          {generating && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-2 border-purple-400/20 animate-ping" />
                <div className="w-12 h-12 rounded-full bg-purple-400/10 border border-purple-400/30 flex items-center justify-center">
                  <Sparkles size={20} className="text-purple-400 animate-pulse" />
                </div>
              </div>
              <p className="text-sm admin-muted animate-pulse">Gemini is writing your 4-step sequence…</p>
            </div>
          )}

          {currentStep && !generating && (
            <div className="flex-1 flex flex-col p-6 space-y-4">
              <div className="flex items-center gap-3 border-b admin-border pb-3">
                <span className="text-xs admin-muted font-medium w-14 flex-shrink-0">To:</span>
                <span className="text-sm admin-text bg-[var(--admin-surface)] px-3 py-1 rounded-lg border admin-border">
                  {selectedLead?.contact_email || 'No email'}
                </span>
              </div>
              <div className="flex items-center gap-3 border-b admin-border pb-3">
                <span className="text-xs admin-muted font-medium w-14 flex-shrink-0">Subject:</span>
                <span className="text-sm admin-text font-semibold">{currentStep.subject}</span>
              </div>
              <div className="flex-1 overflow-y-auto">
                <p className="text-sm admin-text leading-relaxed whitespace-pre-wrap">{currentStep.body}</p>
              </div>
            </div>
          )}
        </div>

        {currentStep && !generating && (
          <div className="flex items-center justify-between px-6 py-4 border-t admin-border bg-[var(--admin-surface)]">
            <div className="flex items-center gap-2">
              <button onClick={() => sendStep(currentStep)} disabled={sending || !selectedLead?.contact_email || sendStatus[activeStep] === 'success'}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-[#00D67D] hover:opacity-90 text-black transition-all disabled:opacity-40">
                {sending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                {sendStatus[activeStep] === 'success' ? 'Sent!' : 'Send Step'}
              </button>
              <button onClick={() => { navigator.clipboard.writeText(`Subject: ${currentStep.subject}\n\n${currentStep.body}`); setCopied(activeStep); setTimeout(() => setCopied(null), 2000); }}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs admin-muted hover:admin-text hover:bg-[var(--admin-hover-bg)] transition-colors border admin-border">
                {copied === activeStep ? <CheckCircle2 size={13} className="text-[#00D67D]" /> : <Copy size={13} />}
              </button>
            </div>
            <div className="flex items-center gap-1">
              {[1,2,3,4].map(n => (
                <button key={n} onClick={() => setActiveStep(n)}
                  className="w-7 h-7 rounded-lg text-[11px] font-bold transition-all"
                  style={activeStep === n
                    ? { backgroundColor: `${EMAIL_STEPS[n-1].color}20`, color: EMAIL_STEPS[n-1].color, border: `1px solid ${EMAIL_STEPS[n-1].color}40` }
                    : { color: 'var(--admin-muted)' }}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────

const MODES: { id: Mode; label: string; icon: React.ReactNode; accent: string }[] = [
  { id: 'copy',     label: 'Copy Generator',   icon: <Wand2 size={15} />,     accent: '#00D67D' },
  { id: 'email',    label: 'Email Sequence',   icon: <Mail size={15} />,      accent: '#3b82f6' },
  { id: 'sequence', label: 'Full AI Sequence', icon: <Sparkles size={15} />,  accent: '#a855f7' },
];

export default function AIStudioPanel() {
  const [mode, setMode] = useState<Mode>('copy');
  const { leads }       = useLeads();
  const activeMode      = MODES.find(m => m.id === mode)!;

  return (
    <div className="max-w-7xl pb-12 space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold admin-text flex items-center gap-2">
            <Sparkles size={20} className="text-[#00D67D]" /> AI Studio
          </h1>
          <p className="text-xs admin-muted mt-0.5">Generate copy, draft emails, and build full outreach sequences.</p>
        </div>

        {/* Mode switcher */}
        <div className="flex p-1 bg-[var(--admin-surface)] border admin-border rounded-2xl gap-1 self-start">
          {MODES.map(m => {
            const isActive = mode === m.id;
            return (
              <button key={m.id} onClick={() => setMode(m.id)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive ? 'admin-text' : 'admin-muted hover:admin-text'
                }`}>
                {isActive && (
                  <motion.div layoutId="studio-tab"
                    className="absolute inset-0 rounded-xl -z-10"
                    style={{ backgroundColor: `${m.accent}15`, border: `1px solid ${m.accent}30` }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span style={{ color: isActive ? m.accent : undefined }}>{m.icon}</span>
                <span style={{ color: isActive ? m.accent : undefined }}>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Panel */}
      <AnimatePresence mode="wait">
        <motion.div key={mode}
          initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
          transition={{ duration: 0.25 }}>
          {mode === 'copy'     && <CopyTab     leads={leads} />}
          {mode === 'email'    && <EmailTab    leads={leads} />}
          {mode === 'sequence' && <SequenceTab leads={leads} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
