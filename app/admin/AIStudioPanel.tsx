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

const ACCENT = '#00D67D';

const PLATFORMS: { id: Platform; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'instagram',  label: 'Instagram',   icon: <Instagram size={14} />,     color: '#e1306c' },
  { id: 'twitter',    label: 'Twitter / X', icon: <Twitter size={14} />,       color: '#38bdf8' },
  { id: 'google_ads', label: 'Google Ads',  icon: <Search size={14} />,        color: '#facc15' },
  { id: 'email',      label: 'Email',       icon: <Mail size={14} />,          color: '#60a5fa' },
  { id: 'whatsapp',   label: 'WhatsApp',    icon: <MessageCircle size={14} />, color: '#25D366' },
  { id: 'linkedin',   label: 'LinkedIn',    icon: <Linkedin size={14} />,      color: '#0a66c2' },
];

const TONES = ['Professional', 'Friendly', 'Bold', 'Urgent', 'Witty', 'Empathetic'];
const GOALS = ['Awareness', 'Clicks', 'Leads', 'Sales', 'Engagement', 'Retention'];

const EMAIL_STEPS = [
  { step: 1, label: 'Initial Outreach', tag: 'Day 1',  color: ACCENT,    desc: 'First touch — personalised observation' },
  { step: 2, label: 'Follow-up #1',     tag: 'Day 4',  color: '#3b82f6', desc: 'New insight, no "just checking in"' },
  { step: 3, label: 'Follow-up #2',     tag: 'Day 9',  color: '#a855f7', desc: 'Results angle + free audit offer' },
  { step: 4, label: 'Break-up',         tag: 'Day 14', color: '#f59e0b', desc: 'Gracious close, door stays open' },
];

// ─── LEAD SELECTOR ────────────────────────────────────────────────────────────
function LeadSelector({ leads, value, onChange }: { leads: Lead[]; value: string; onChange: (v: string) => void }) {
  const selected = leads.find(l => l.id === value);
  return (
    <div className="space-y-2.5">
      <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value)}
          className="admin-input w-full appearance-none pr-9 py-2.5 text-[13px] cursor-pointer">
          <option value="">— Select a prospect —</option>
          {leads.map(l => <option key={l.id} value={l.id}>{l.business_name}</option>)}
        </select>
        <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 admin-muted pointer-events-none" />
      </div>
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="p-3 rounded-xl bg-[var(--admin-surface-2)] border admin-border space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-black flex-shrink-0" style={{ background: ACCENT }}>
                  {selected.business_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold admin-text truncate">{selected.business_name}</p>
                  <p className="text-[11px] admin-muted truncate">{selected.contact_email || 'No email'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] pt-1.5 border-t admin-border">
                <div className="flex items-center gap-1.5 admin-muted"><Globe size={10} />{selected.industry || '—'}</div>
                <div className="flex items-center gap-1.5"><Target size={10} style={{ color: ACCENT }} /><span className="font-semibold" style={{ color: ACCENT }}>{selected.website_quality_score != null ? `${selected.website_quality_score}/10` : '—'}</span></div>
                {selected.weak_points && <p className="col-span-2 admin-muted leading-snug line-clamp-2 mt-0.5">{selected.weak_points}</p>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
// ─── OUTPUT RENDERER ──────────────────────────────────────────────────────────
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
        <div className="p-4 rounded-xl bg-[var(--admin-surface)] border admin-border">
          <p className="text-[10px] font-mono admin-muted uppercase tracking-wider mb-2">Caption</p>
          <p className="text-[13px] leading-relaxed whitespace-pre-wrap admin-text">{caption}</p>
        </div>
        {hashtags && <div className="p-3 rounded-xl bg-[var(--admin-surface)] border admin-border">
          <p className="text-[10px] font-mono admin-muted uppercase tracking-wider mb-1.5">Hashtags</p>
          <p className="text-[12px] text-pink-400 font-mono leading-relaxed">{hashtags}</p>
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
        <div className="p-4 rounded-xl bg-[var(--admin-surface)] border admin-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-mono admin-muted uppercase tracking-wider">Tweet</p>
            <span className={`text-[10px] font-mono ${tweet.length > 280 ? 'text-red-400' : 'admin-muted'}`}>{tweet.length}/280</span>
          </div>
          <p className="text-[13px] leading-relaxed whitespace-pre-wrap admin-text">{tweet}</p>
        </div>
        {reply && <div className="p-4 rounded-xl bg-[var(--admin-surface)] border admin-border opacity-80">
          <p className="text-[10px] font-mono admin-muted uppercase tracking-wider mb-2">Reply Thread</p>
          <p className="text-[13px] leading-relaxed whitespace-pre-wrap admin-text">{reply}</p>
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
    if (!fields.length) return <p className="text-[13px] admin-text leading-relaxed">{raw}</p>;
    return (
      <div className="space-y-2">
        {fields.map(f => (
          <div key={f.label} className="p-3 rounded-xl bg-[var(--admin-surface)] border admin-border">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-mono admin-muted uppercase tracking-wider">{f.label}</p>
              <span className={`text-[10px] font-mono ${f.value.length > f.max ? 'text-red-400' : 'admin-muted'}`}>{f.value.length}/{f.max}</span>
            </div>
            <p className="text-[13px] admin-text font-medium">{f.value}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-[var(--admin-surface)] border admin-border">
      {lines.map((line, i) => <p key={i} className="text-[13px] leading-relaxed admin-text">{line}</p>)}
    </div>
  );
}
// ─── SHARED LAYOUT ────────────────────────────────────────────────────────────
function StudioLayout({ sidebar, canvas }: { sidebar: React.ReactNode; canvas: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] min-h-[580px] rounded-2xl overflow-hidden border admin-border shadow-xl">
      <div className="bg-[var(--admin-surface)] border-b lg:border-b-0 lg:border-r admin-border flex flex-col">{sidebar}</div>
      <div className="bg-[var(--admin-surface-2)] flex flex-col">{canvas}</div>
    </div>
  );
}

function SidebarHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="px-5 py-4 border-b admin-border flex-shrink-0">
      <div className="flex items-center gap-2 mb-0.5">{icon}<span className="text-[12px] font-bold admin-text">{title}</span></div>
      <p className="text-[11px] admin-muted">{subtitle}</p>
    </div>
  );
}

function CanvasHeader({ dot, title, subtitle, action }: { dot?: string; title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="px-5 py-3.5 border-b admin-border bg-[var(--admin-surface)] flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-2.5">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400/50" />
        </div>
        {dot && <div className="w-1.5 h-1.5 rounded-full ml-1" style={{ background: dot }} />}
        <span className="text-[12px] admin-muted font-medium">{title}</span>
        {subtitle && <span className="text-[11px] admin-muted opacity-60">— {subtitle}</span>}
      </div>
      {action}
    </div>
  );
}

function CanvasEmpty({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 min-h-[300px]">
      <div className="w-14 h-14 rounded-2xl bg-[var(--admin-surface)] border admin-border flex items-center justify-center mb-3 shadow-sm">{icon}</div>
      <p className="text-[13px] font-semibold admin-text mb-1">{title}</p>
      <p className="text-[11px] admin-muted max-w-[220px] leading-relaxed">{desc}</p>
    </div>
  );
}

function CanvasGenerating({ color, icon, label }: { color: string; icon: React.ReactNode; label: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 min-h-[300px]">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 animate-ping" style={{ borderColor: `${color}30` }} />
        <div className="w-12 h-12 rounded-full flex items-center justify-center border" style={{ background: `${color}12`, borderColor: `${color}30` }}>{icon}</div>
      </div>
      <p className="text-[12px] admin-muted animate-pulse">{label}</p>
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
  const activePlatform = PLATFORMS.find(p => p.id === platform)!;

  async function generate() {
    if (!selectedLead) return;
    setGenerating(true); setError(''); setOutput('');
    try {
      const res = await fetch('/api/generate-copy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...selectedLead, platform, tone, goal, keyMessage }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      const raw = data.output || data.copy || data.content;
      if (!raw) throw new Error('Unexpected response from AI');
      setOutput(raw.replace(/\\n/g, '\n'));
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Generation failed'); }
    finally { setGenerating(false); }
  }

  return (
    <StudioLayout
      sidebar={
        <>
          <SidebarHeader icon={<Wand2 size={13} style={{ color: ACCENT }} />} title="Copy Generator" subtitle="Platform-specific ad & social copy" />
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div>
              <p className="text-[10px] font-bold admin-muted uppercase tracking-wider mb-2">Prospect</p>
              <LeadSelector leads={leads} value={selectedId} onChange={setSelectedId} />
            </div>
            <div>
              <p className="text-[10px] font-bold admin-muted uppercase tracking-wider mb-2">Platform</p>
              <div className="grid grid-cols-3 gap-1.5">
                {PLATFORMS.map(p => (
                  <button key={p.id} onClick={() => setPlatform(p.id)}
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-center transition-all ${platform === p.id ? 'shadow-sm' : 'border-transparent hover:bg-[var(--admin-hover-bg)] admin-muted'}`}
                    style={platform === p.id ? { borderColor: `${p.color}40`, background: `${p.color}12`, color: p.color } : {}}>
                    <span style={{ color: platform === p.id ? p.color : undefined, opacity: platform === p.id ? 1 : 0.5 }}>{p.icon}</span>
                    <span className="text-[9px] font-semibold leading-tight">{p.label.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold admin-muted uppercase tracking-wider mb-2">Tone</p>
              <div className="flex flex-wrap gap-1.5">
                {TONES.map(t => (
                  <button key={t} onClick={() => setTone(t)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${tone === t ? 'border-[#00D67D]/30 bg-[#00D67D]/10 text-[#00D67D]' : 'admin-muted border-[var(--admin-border)] hover:border-[var(--admin-border-md)] hover:admin-text'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold admin-muted uppercase tracking-wider mb-2">Goal</p>
              <div className="flex flex-wrap gap-1.5">
                {GOALS.map(g => (
                  <button key={g} onClick={() => setGoal(g)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${goal === g ? 'border-[#00D67D]/30 bg-[#00D67D]/10 text-[#00D67D]' : 'admin-muted border-[var(--admin-border)] hover:border-[var(--admin-border-md)] hover:admin-text'}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold admin-muted uppercase tracking-wider mb-2">Key Message <span className="normal-case font-normal">(optional)</span></p>
              <textarea value={keyMessage} onChange={e => setKeyMessage(e.target.value)} rows={3} placeholder="e.g. We just launched a feature that gets 3× more bookings…" className="admin-input w-full resize-none text-[13px] py-2.5" />
            </div>
          </div>
          <div className="p-4 border-t admin-border flex-shrink-0">
            <button onClick={generate} disabled={!selectedLead || generating}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-[13px] text-black transition-all disabled:opacity-40 hover:opacity-90"
              style={{ background: generating ? 'var(--admin-surface-3)' : `linear-gradient(135deg, ${activePlatform.color}cc, ${activePlatform.color})` }}>
              {generating ? <RefreshCw size={14} className="animate-spin text-[#00D67D]" /> : <Wand2 size={14} />}
              <span style={{ color: generating ? 'var(--admin-text)' : '#000' }}>{generating ? 'Generating…' : `Generate for ${activePlatform.label}`}</span>
            </button>
          </div>
        </>
      }
      canvas={
        <>
          <CanvasHeader
            dot={output ? activePlatform.color : undefined}
            title="Output Canvas"
            subtitle={output ? activePlatform.label : undefined}
            action={output ? (
              <button onClick={() => { navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="flex items-center gap-1.5 text-[11px] font-medium admin-muted hover:admin-text px-3 py-1.5 rounded-lg hover:bg-[var(--admin-hover-bg)] transition-colors border admin-border">
                {copied ? <CheckCircle2 size={12} style={{ color: ACCENT }} /> : <Copy size={12} />}
                {copied ? 'Copied!' : 'Copy all'}
              </button>
            ) : undefined}
          />
          <div className="flex-1 p-5 overflow-y-auto">
            <AnimatePresence mode="wait">
              {!output && !error && !generating && <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><CanvasEmpty icon={<Wand2 size={22} className="admin-subtle" />} title="Canvas is empty" desc="Select a prospect, choose a platform, and click Generate." /></motion.div>}
              {generating && <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><CanvasGenerating color={activePlatform.color} icon={<Sparkles size={18} style={{ color: activePlatform.color }} className="animate-pulse" />} label={`Writing ${activePlatform.label} copy…`} /></motion.div>}
              {error && !generating && <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[13px]"><AlertCircle size={15} className="flex-shrink-0 mt-0.5" />{error}</motion.div>}
              {output && !generating && (
                <motion.div key="output" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  {renderOutput(platform, output)}
                  <button onClick={generate} className="mt-4 flex items-center gap-1.5 text-[11px] admin-muted hover:admin-text transition-colors"><RefreshCw size={11} /> Regenerate</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      }
    />
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
  const [sendStatus, setSendStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const selectedLead = leads.find(l => l.id === selectedId) ?? null;
  const stepMeta = EMAIL_STEPS.find(s => s.step === activeStep)!;

  useEffect(() => { setSubject(''); setBody(''); setError(''); setSendStatus('idle'); }, [activeStep, selectedId]);

  async function generate() {
    if (!selectedLead) return;
    setGenerating(true); setError(''); setSendStatus('idle');
    try {
      const res = await fetch('/api/generate-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...selectedLead, sequenceStep: activeStep }) });
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
      const res = await fetch('/api/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: selectedLead.contact_email, subject, body, lead_id: selectedLead.id }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Send failed');
      setSendStatus('success');
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Send failed'); setSendStatus('error'); }
    finally { setSending(false); }
  }

  return (
    <StudioLayout
      sidebar={
        <>
          <SidebarHeader icon={<Mail size={13} className="text-blue-400" />} title="Email Sequence" subtitle="Personalised step-by-step outreach" />
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div>
              <p className="text-[10px] font-bold admin-muted uppercase tracking-wider mb-2">Prospect</p>
              <LeadSelector leads={leads} value={selectedId} onChange={setSelectedId} />
            </div>
            <div>
              <p className="text-[10px] font-bold admin-muted uppercase tracking-wider mb-2">Sequence Step</p>
              <div className="space-y-1.5">
                {EMAIL_STEPS.map(s => (
                  <button key={s.step} onClick={() => setActiveStep(s.step)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${activeStep === s.step ? 'shadow-sm' : 'border-transparent hover:bg-[var(--admin-hover-bg)] admin-muted'}`}
                    style={activeStep === s.step ? { borderColor: `${s.color}40`, background: `${s.color}0d` } : {}}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${s.color}20`, color: s.color }}>{s.tag}</span>
                      <span className={`text-[12px] font-semibold ${activeStep === s.step ? 'admin-text' : ''}`}>{s.label}</span>
                    </div>
                    <p className="text-[10px] admin-muted leading-snug">{s.desc}</p>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1 mt-3 px-1">
                {EMAIL_STEPS.map((s, i) => (
                  <React.Fragment key={s.step}>
                    <div className="w-2 h-2 rounded-full flex-shrink-0 transition-all" style={{ background: activeStep >= s.step ? s.color : 'var(--admin-border-md)' }} />
                    {i < EMAIL_STEPS.length - 1 && <div className="flex-1 h-px transition-all" style={{ background: activeStep > s.step ? EMAIL_STEPS[i].color : 'var(--admin-border-md)' }} />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
          <div className="p-4 border-t admin-border flex-shrink-0">
            <button onClick={generate} disabled={!selectedLead || generating}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-[13px] text-black transition-all disabled:opacity-40 hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${stepMeta.color}cc, ${stepMeta.color})` }}>
              {generating ? <RefreshCw size={14} className="animate-spin" /> : <PenTool size={14} />}
              {generating ? 'Drafting…' : `Draft ${stepMeta.label}`}
            </button>
          </div>
        </>
      }
      canvas={
        <>
          <CanvasHeader title={subject ? 'New Message' : 'Composer'} />
          <div className="flex-1 flex flex-col overflow-hidden">
            {error && <div className="mx-5 mt-4 flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[12px]"><AlertCircle size={13} className="flex-shrink-0 mt-0.5" />{error}</div>}
            {!subject && !body && !generating && !error && <CanvasEmpty icon={<Mail size={22} className="admin-subtle" />} title="Composer is empty" desc="Select a prospect and step, then click Draft." />}
            {generating && <CanvasGenerating color={stepMeta.color} icon={<PenTool size={18} style={{ color: stepMeta.color }} className="animate-pulse" />} label={`Writing ${stepMeta.label}…`} />}
            {(subject || body) && !generating && (
              <div className="flex-1 flex flex-col p-5 space-y-3 overflow-hidden">
                <div className="flex items-center gap-3 border-b admin-border pb-3">
                  <span className="text-[11px] admin-muted font-medium w-14 flex-shrink-0">To:</span>
                  <span className="text-[13px] admin-text bg-[var(--admin-surface)] px-3 py-1 rounded-lg border admin-border">{selectedLead?.contact_email || 'No email'}</span>
                </div>
                <div className="flex items-center gap-3 border-b admin-border pb-3">
                  <span className="text-[11px] admin-muted font-medium w-14 flex-shrink-0">Subject:</span>
                  <input value={subject} onChange={e => setSubject(e.target.value)} className="flex-1 bg-transparent admin-text text-[13px] outline-none font-semibold placeholder:admin-subtle" />
                </div>
                <textarea value={body} onChange={e => setBody(e.target.value)} className="flex-1 w-full bg-transparent admin-text text-[13px] outline-none resize-none leading-relaxed placeholder:admin-subtle min-h-[200px]" />
              </div>
            )}
          </div>
          {(subject || body) && !generating && (
            <div className="flex items-center justify-between px-5 py-3.5 border-t admin-border bg-[var(--admin-surface)] flex-shrink-0">
              <div className="flex items-center gap-2">
                <button onClick={sendEmail} disabled={sending || !selectedLead?.contact_email}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-[12px] text-black transition-all disabled:opacity-40 hover:opacity-90"
                  style={{ background: ACCENT }}>
                  {sending ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                  {sending ? 'Sending…' : 'Send'}
                </button>
                <button onClick={() => { navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] admin-muted hover:admin-text admin-hover transition-colors border admin-border">
                  {copied ? <CheckCircle2 size={12} style={{ color: ACCENT }} /> : <Copy size={12} />}
                </button>
              </div>
              {sendStatus === 'success' && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: ACCENT }}>
                  <CheckCircle2 size={13} /> Sent successfully
                </motion.div>
              )}
            </div>
          )}
        </>
      }
    />
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
  const [sendStatus, setSendStatus] = useState<Record<number, 'idle' | 'success' | 'error'>>({});
  const [copied, setCopied]         = useState<number | null>(null);
  const selectedLead = leads.find(l => l.id === selectedId) ?? null;
  const currentStep  = steps.find(s => s.step === activeStep);

  async function generate() {
    if (!selectedLead) return;
    setGenerating(true); setError(''); setSteps([]);
    try {
      const res = await fetch('/api/generate-sequence', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(selectedLead) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setSteps(data.steps || []); setActiveStep(1);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Generation failed'); }
    finally { setGenerating(false); }
  }

  async function sendStep(step: EmailStep) {
    if (!selectedLead?.contact_email) return;
    setSending(true);
    try {
      const res = await fetch('/api/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: selectedLead.contact_email, subject: step.subject, body: step.body, lead_id: selectedLead.id }) });
      if (!res.ok) throw new Error('Send failed');
      setSendStatus(prev => ({ ...prev, [step.step]: 'success' }));
    } catch { setSendStatus(prev => ({ ...prev, [step.step]: 'error' })); }
    finally { setSending(false); }
  }

  return (
    <StudioLayout
      sidebar={
        <>
          <SidebarHeader icon={<Sparkles size={13} className="text-purple-400" />} title="Full AI Sequence" subtitle="Generate all 4 emails at once with Gemini" />
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div>
              <p className="text-[10px] font-bold admin-muted uppercase tracking-wider mb-2">Prospect</p>
              <LeadSelector leads={leads} value={selectedId} onChange={setSelectedId} />
            </div>
            {steps.length > 0 && (
              <div>
                <p className="text-[10px] font-bold admin-muted uppercase tracking-wider mb-2">Sequence Steps</p>
                <div className="space-y-1.5">
                  {EMAIL_STEPS.map(s => {
                    const generated = steps.find(st => st.step === s.step);
                    const status = sendStatus[s.step];
                    return (
                      <button key={s.step} onClick={() => setActiveStep(s.step)}
                        className={`w-full text-left p-3 rounded-xl border transition-all ${activeStep === s.step ? 'shadow-sm' : 'border-transparent hover:bg-[var(--admin-hover-bg)]'}`}
                        style={activeStep === s.step ? { borderColor: `${s.color}40`, background: `${s.color}0d` } : {}}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${s.color}20`, color: s.color }}>{s.tag}</span>
                            <span className={`text-[12px] font-medium ${activeStep === s.step ? 'admin-text' : 'admin-muted'}`}>{s.label}</span>
                          </div>
                          {generated && (status === 'success' ? <CheckCircle2 size={12} style={{ color: ACCENT }} /> : <div className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <div className="p-4 border-t admin-border flex-shrink-0">
            <button onClick={generate} disabled={!selectedLead || generating}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-[13px] text-black transition-all disabled:opacity-40 hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #a855f7cc, #a855f7)' }}>
              {generating ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {generating ? 'Generating sequence…' : steps.length ? 'Regenerate All' : 'Generate Full Sequence'}
            </button>
          </div>
        </>
      }
      canvas={
        <>
          <CanvasHeader title={currentStep ? `Step ${activeStep} of 4` : 'Sequence Viewer'} subtitle={currentStep ? EMAIL_STEPS.find(s => s.step === activeStep)?.label : undefined} />
          <div className="flex-1 flex flex-col overflow-hidden">
            {error && <div className="mx-5 mt-4 flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[12px]"><AlertCircle size={13} className="flex-shrink-0 mt-0.5" />{error}</div>}
            {!steps.length && !generating && !error && <CanvasEmpty icon={<Sparkles size={22} className="admin-subtle" />} title="No sequence yet" desc="Select a prospect and generate a full 4-step sequence in one click." />}
            {generating && <CanvasGenerating color="#a855f7" icon={<Sparkles size={18} className="text-purple-400 animate-pulse" />} label="Gemini is writing your 4-step sequence…" />}
            {currentStep && !generating && (
              <div className="flex-1 flex flex-col p-5 space-y-3 overflow-hidden">
                <div className="flex items-center gap-3 border-b admin-border pb-3">
                  <span className="text-[11px] admin-muted font-medium w-14 flex-shrink-0">To:</span>
                  <span className="text-[13px] admin-text bg-[var(--admin-surface)] px-3 py-1 rounded-lg border admin-border">{selectedLead?.contact_email || 'No email'}</span>
                </div>
                <div className="flex items-center gap-3 border-b admin-border pb-3">
                  <span className="text-[11px] admin-muted font-medium w-14 flex-shrink-0">Subject:</span>
                  <span className="text-[13px] admin-text font-semibold">{currentStep.subject}</span>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <p className="text-[13px] admin-text leading-relaxed whitespace-pre-wrap">{currentStep.body}</p>
                </div>
              </div>
            )}
          </div>
          {currentStep && !generating && (
            <div className="flex items-center justify-between px-5 py-3.5 border-t admin-border bg-[var(--admin-surface)] flex-shrink-0">
              <div className="flex items-center gap-2">
                <button onClick={() => sendStep(currentStep)} disabled={sending || !selectedLead?.contact_email || sendStatus[activeStep] === 'success'}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-[12px] text-black transition-all disabled:opacity-40 hover:opacity-90"
                  style={{ background: ACCENT }}>
                  {sending ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                  {sendStatus[activeStep] === 'success' ? 'Sent!' : 'Send Step'}
                </button>
                <button onClick={() => { navigator.clipboard.writeText(`Subject: ${currentStep.subject}\n\n${currentStep.body}`); setCopied(activeStep); setTimeout(() => setCopied(null), 2000); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] admin-muted hover:admin-text admin-hover transition-colors border admin-border">
                  {copied === activeStep ? <CheckCircle2 size={12} style={{ color: ACCENT }} /> : <Copy size={12} />}
                </button>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4].map(n => (
                  <button key={n} onClick={() => setActiveStep(n)}
                    className="w-7 h-7 rounded-lg text-[11px] font-bold transition-all"
                    style={activeStep === n
                      ? { background: `${EMAIL_STEPS[n - 1].color}20`, color: EMAIL_STEPS[n - 1].color, border: `1px solid ${EMAIL_STEPS[n - 1].color}40` }
                      : { color: 'var(--admin-muted)' }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      }
    />
  );
}
// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
const MODES: { id: Mode; label: string; icon: React.ReactNode; accent: string; desc: string }[] = [
  { id: 'copy',     label: 'Copy Generator',   icon: <Wand2 size={14} />,    accent: ACCENT,    desc: 'Platform-specific ad & social copy' },
  { id: 'email',    label: 'Email Sequence',   icon: <Mail size={14} />,     accent: '#3b82f6', desc: 'Personalised step-by-step outreach' },
  { id: 'sequence', label: 'Full AI Sequence', icon: <Sparkles size={14} />, accent: '#a855f7', desc: 'Generate all 4 emails at once' },
];

export default function AIStudioPanel() {
  const [mode, setMode] = useState<Mode>('copy');
  const { leads }       = useLeads();
  const activeMode      = MODES.find(m => m.id === mode)!;

  return (
    <div className="max-w-7xl pb-12 space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${activeMode.accent}18` }}>
            <Sparkles size={18} style={{ color: activeMode.accent }} />
          </div>
          <div>
            <h1 className="text-[15px] font-bold admin-text leading-none">AI Studio</h1>
            <p className="text-[11px] admin-muted mt-0.5">{activeMode.desc}</p>
          </div>
        </div>

        {/* Mode switcher */}
        <div className="flex p-1 bg-[var(--admin-surface)] border admin-border rounded-xl gap-1 self-start">
          {MODES.map(m => {
            const isActive = mode === m.id;
            return (
              <button key={m.id} onClick={() => setMode(m.id)}
                className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12px] font-semibold transition-all ${isActive ? 'admin-text' : 'admin-muted hover:admin-text'}`}>
                {isActive && (
                  <motion.div layoutId="studio-tab"
                    className="absolute inset-0 rounded-lg -z-10"
                    style={{ background: `${m.accent}15`, border: `1px solid ${m.accent}30` }}
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
          transition={{ duration: 0.2 }}>
          {mode === 'copy'     && <CopyTab     leads={leads} />}
          {mode === 'email'    && <EmailTab    leads={leads} />}
          {mode === 'sequence' && <SequenceTab leads={leads} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
