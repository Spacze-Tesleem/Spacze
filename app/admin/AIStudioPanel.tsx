'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Copy, CheckCircle2, RefreshCw, AlertCircle,
  Instagram, Twitter, Search, Mail, MessageCircle, Linkedin,
  ChevronDown, Zap, Send,
} from 'lucide-react';
import { Lead } from '@/lib/supabase';

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } };

// ─── TYPES & CONSTANTS ────────────────────────────────────────────────────────

type Tab = 'copy' | 'email';
type Platform = 'instagram' | 'twitter' | 'google_ads' | 'email' | 'whatsapp' | 'linkedin';

const PLATFORMS: { id: Platform; label: string; icon: React.ReactNode; color: string; bg: string }[] = [
  { id: 'instagram',  label: 'Instagram',   icon: <Instagram size={15} />,     color: 'text-pink-500',   bg: 'bg-pink-500/10 border-pink-500/20' },
  { id: 'twitter',    label: 'Twitter / X', icon: <Twitter size={15} />,       color: 'text-sky-400',    bg: 'bg-sky-400/10 border-sky-400/20' },
  { id: 'google_ads', label: 'Google Ads',  icon: <Search size={15} />,        color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20' },
  { id: 'email',      label: 'Email',       icon: <Mail size={15} />,          color: 'text-blue-400',   bg: 'bg-blue-400/10 border-blue-400/20' },
  { id: 'whatsapp',   label: 'WhatsApp',    icon: <MessageCircle size={15} />, color: 'text-[#25D366]',  bg: 'bg-[#25D366]/10 border-[#25D366]/20' },
  { id: 'linkedin',   label: 'LinkedIn',    icon: <Linkedin size={15} />,      color: 'text-blue-500',   bg: 'bg-blue-500/10 border-blue-500/20' },
];

const TONES = ['Professional', 'Friendly', 'Bold', 'Urgent', 'Witty'];
const GOALS = ['Awareness', 'Clicks', 'Leads', 'Sales', 'Engagement'];

const EMAIL_STEPS = [
  { step: 1, label: 'Initial Email',  tag: 'Day 1',  desc: 'First touch — personalised observation + soft CTA', color: '#00D67D', tagBg: 'bg-[#00D67D]/10 text-[#00D67D] border-[#00D67D]/20' },
  { step: 2, label: 'Follow-up #1',   tag: 'Day 3',  desc: 'New insight — no "just checking in"',               color: '#3b82f6', tagBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { step: 3, label: 'Follow-up #2',   tag: 'Day 7',  desc: 'Results angle + soft availability mention',         color: '#a855f7', tagBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  { step: 4, label: 'Breakup Email',  tag: 'Day 14', desc: 'Gracious close — leaves door open forever',         color: '#f59e0b', tagBg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
];

// ─── COPY OUTPUT RENDERER ─────────────────────────────────────────────────────

function renderOutput(platform: Platform, raw: string) {
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);

  if (platform === 'instagram') {
    const captionIdx = lines.findIndex(l => l.startsWith('CAPTION:'));
    const hashtagIdx = lines.findIndex(l => l.startsWith('HASHTAGS:'));
    const caption = captionIdx >= 0 ? lines.slice(captionIdx + 1, hashtagIdx >= 0 ? hashtagIdx : undefined).join('\n') : raw;
    const hashtags = hashtagIdx >= 0 ? lines.slice(hashtagIdx + 1).join(' ') : '';
    return (
      <div className="space-y-3">
        <div>
          <div className="text-[10px] font-mono admin-muted uppercase tracking-wider mb-1">Caption</div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap admin-text">{caption}</p>
        </div>
        {hashtags && <div>
          <div className="text-[10px] font-mono admin-muted uppercase tracking-wider mb-1">Hashtags</div>
          <p className="text-xs text-pink-400 leading-relaxed">{hashtags}</p>
        </div>}
      </div>
    );
  }

  if (platform === 'twitter') {
    const tweetIdx = lines.findIndex(l => l.startsWith('TWEET:'));
    const replyIdx = lines.findIndex(l => l.startsWith('REPLY'));
    const tweet = tweetIdx >= 0 ? lines.slice(tweetIdx + 1, replyIdx >= 0 ? replyIdx : undefined).join('\n') : raw;
    const reply = replyIdx >= 0 ? lines.slice(replyIdx + 1).join('\n') : '';
    return (
      <div className="space-y-3">
        <div>
          <div className="text-[10px] font-mono admin-muted uppercase tracking-wider mb-1">Tweet</div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap admin-text">{tweet}</p>
          <p className="text-[10px] admin-muted mt-1">{tweet.length} / 280 chars</p>
        </div>
        {reply && <div>
          <div className="text-[10px] font-mono admin-muted uppercase tracking-wider mb-1">Reply Thread</div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap admin-text">{reply}</p>
        </div>}
      </div>
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
      <div className="space-y-2">
        {fields.map(f => (
          <div key={f.label}>
            <div className="text-[10px] font-mono admin-muted uppercase tracking-wider mb-0.5">{f.label}</div>
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm admin-text">{f.value}</p>
              <span className={`text-[10px] font-mono flex-shrink-0 ${f.value.length > f.max ? 'text-red-400' : 'admin-muted'}`}>{f.value.length}/{f.max}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
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
  const inp = 'w-full admin-input border admin-border-md rounded-xl px-4 py-3 text-sm admin-text outline-none focus:border-[#00D67D]/50 transition-colors placeholder:admin-subtle';

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
    <div className="space-y-4">
      {/* Lead selector */}
      <motion.div {...fadeUp} className="p-5 rounded-2xl admin-surface border admin-border">
        <label className="label-xs mb-2 block">Select Lead</label>
        <div className="relative">
          <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
            className={`${inp} appearance-none pr-10 cursor-pointer`}>
            <option value="">— Choose a lead —</option>
            {leads.map(l => <option key={l.id} value={l.id}>{l.business_name} ({l.contact_email})</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 admin-muted pointer-events-none" />
        </div>
      </motion.div>

      {/* Platform picker */}
      <motion.div {...fadeUp} transition={{ delay: 0.04 }} className="p-5 rounded-2xl admin-surface border admin-border">
        <label className="label-xs mb-3 block">Platform</label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {PLATFORMS.map(p => (
            <button key={p.id} onClick={() => setPlatform(p.id)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-all duration-150 ${
                platform === p.id ? `${p.bg} ${p.color}` : 'admin-hover admin-border admin-muted hover:admin-border-md'
              }`}>
              {p.icon}
              <span className="text-[10px] leading-tight text-center">{p.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Tone / Goal / Key message */}
      <motion.div {...fadeUp} transition={{ delay: 0.06 }} className="p-5 rounded-2xl admin-surface border admin-border space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-xs mb-2 block">Tone</label>
            <div className="flex flex-wrap gap-1.5">
              {TONES.map(t => (
                <button key={t} onClick={() => setTone(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    tone === t ? 'bg-[#00D67D]/10 border-[#00D67D]/30 text-[#00D67D]' : 'admin-hover admin-border admin-muted'
                  }`}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="label-xs mb-2 block">Goal</label>
            <div className="flex flex-wrap gap-1.5">
              {GOALS.map(g => (
                <button key={g} onClick={() => setGoal(g)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    goal === g ? 'bg-[#00D67D]/10 border-[#00D67D]/30 text-[#00D67D]' : 'admin-hover admin-border admin-muted'
                  }`}>{g}</button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <label className="label-xs mb-2 block">Key Message <span className="normal-case font-normal opacity-60">(optional)</span></label>
          <input value={keyMessage} onChange={e => setKeyMessage(e.target.value)}
            placeholder="e.g. We help restaurants get 3× more bookings"
            className={inp} />
        </div>
        <button onClick={generate} disabled={!selectedLead || generating}
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-black transition-opacity disabled:opacity-40"
          style={{ background: 'var(--accent)' }}>
          {generating ? <RefreshCw size={15} className="animate-spin" /> : <Sparkles size={15} />}
          {generating ? 'Generating…' : 'Generate Copy'}
        </button>
      </motion.div>

      {/* Output */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />{error}
          </motion.div>
        )}
        {output && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="p-5 rounded-2xl admin-surface border admin-border space-y-3">
            <div className="flex items-center justify-between">
              <label className="label-xs">Generated Copy</label>
              <button onClick={copyOutput}
                className="flex items-center gap-1.5 text-xs admin-muted hover:text-white px-3 py-1.5 rounded-lg bg-white/5 admin-hover transition-colors">
                {copied ? <CheckCircle2 size={13} className="text-[#00D67D]" /> : <Copy size={13} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="p-4 rounded-xl admin-surface-2 border admin-border">
              {renderOutput(platform, output)}
            </div>
            <button onClick={generate} disabled={generating}
              className="flex items-center gap-2 text-xs admin-muted hover:text-white px-3 py-2 rounded-lg bg-white/5 admin-hover transition-colors">
              <RefreshCw size={12} /> Regenerate
            </button>
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
  const inp = 'w-full admin-input border admin-border-md rounded-xl px-4 py-3 text-sm admin-text outline-none focus:border-[#00D67D]/50 transition-colors placeholder:admin-subtle';

  useEffect(() => { setSubject(''); setBody(''); setError(''); setSendStatus('idle'); }, [activeStep]);
  useEffect(() => { setSubject(''); setBody(''); setError(''); setSendStatus('idle'); }, [selectedId]);

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
      if (activeStep === 1) {
        await fetch(`/api/leads?id=${selectedLead.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ generated_subject: data.subject, generated_email: data.body }),
        });
      }
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
      const updates: Record<string, any> = { email_sent: true, last_contacted: new Date().toISOString().split('T')[0] };
      if (activeStep === 1) updates.outreach_status = 'Sent';
      await fetch(`/api/leads?id=${selectedLead.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      setSendStatus('success');
    } catch (e: any) { setError(e.message); setSendStatus('error'); }
    finally { setSending(false); }
  }

  function copyEmail() {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      <motion.div {...fadeUp} className="p-5 rounded-2xl admin-surface border admin-border">
        <label className="label-xs mb-2 block">Select Lead</label>
        <div className="relative">
          <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
            className={`${inp} appearance-none pr-10 cursor-pointer`}>
            <option value="">— Choose a lead —</option>
            {leads.map(l => <option key={l.id} value={l.id}>{l.business_name} ({l.contact_email})</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 admin-muted pointer-events-none" />
        </div>
        <AnimatePresence>
          {selectedLead && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-4 p-4 rounded-xl admin-hover border admin-border grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {[
                { label: 'Industry', value: selectedLead.industry || '—' },
                { label: 'Score',    value: selectedLead.website_quality_score ? `${selectedLead.website_quality_score}/10` : '—' },
                { label: 'SEO',      value: selectedLead.seo_quality || '—' },
                { label: 'Mobile',   value: selectedLead.mobile_responsiveness || '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="label-xs mb-0.5">{label}</div>
                  <div className="admin-text font-medium">{value}</div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div {...fadeUp} transition={{ delay: 0.04 }} className="p-5 rounded-2xl admin-surface border admin-border">
        <label className="label-xs mb-3 block">Sequence Step</label>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {EMAIL_STEPS.map(s => (
            <button key={s.step} onClick={() => setActiveStep(s.step)}
              className={`relative flex flex-col gap-1.5 p-3 rounded-xl border text-left transition-all duration-200 ${
                activeStep === s.step ? 'admin-hover border-white/20' : 'admin-hover admin-border hover:admin-border-md'
              }`}>
              {activeStep === s.step && (
                <motion.div layoutId="email-step-indicator" className="absolute inset-0 rounded-xl"
                  style={{ border: `1px solid ${s.color}40`, backgroundColor: `${s.color}08` }} />
              )}
              <div className="relative z-10">
                <span className={`inline-block text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${s.tagBg} mb-1`}>{s.tag}</span>
                <div className="text-xs font-bold admin-text leading-tight">{s.label}</div>
                <div className="text-[10px] admin-muted leading-tight mt-0.5">{s.desc}</div>
              </div>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 mt-4 px-1">
          {EMAIL_STEPS.map((s, i) => (
            <React.Fragment key={s.step}>
              <div className="w-2 h-2 rounded-full flex-shrink-0 transition-all duration-200"
                style={{ backgroundColor: activeStep >= s.step ? s.color : '#ffffff15' }} />
              {i < EMAIL_STEPS.length - 1 && (
                <div className="flex-1 h-px transition-all duration-300"
                  style={{ backgroundColor: activeStep > s.step ? EMAIL_STEPS[i].color + '60' : '#ffffff10' }} />
              )}
            </React.Fragment>
          ))}
        </div>
        <button onClick={generate} disabled={!selectedLead || generating}
          className="mt-5 flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-opacity disabled:opacity-40"
          style={{ background: `linear-gradient(135deg, ${stepMeta.color}cc, ${stepMeta.color})`, color: activeStep === 1 ? '#000' : '#fff' }}>
          {generating ? <RefreshCw size={15} className="animate-spin" /> : <Zap size={15} />}
          {generating ? 'Generating…' : `Generate ${stepMeta.label}`}
        </button>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />{error}
          </motion.div>
        )}
        {(subject || body) && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="p-5 rounded-2xl admin-surface border admin-border space-y-4">
            <div className="flex items-center justify-between">
              <label className="label-xs">Generated Email</label>
              <button onClick={copyEmail}
                className="flex items-center gap-1.5 text-xs admin-muted hover:text-white px-3 py-1.5 rounded-lg bg-white/5 admin-hover transition-colors">
                {copied ? <CheckCircle2 size={13} className="text-[#00D67D]" /> : <Copy size={13} />}
                {copied ? 'Copied!' : 'Copy all'}
              </button>
            </div>
            <div>
              <label className="label-xs mb-1.5 block">Subject</label>
              <input value={subject} onChange={e => setSubject(e.target.value)}
                className="w-full admin-input border admin-border-md rounded-xl px-4 py-2.5 text-sm admin-text outline-none focus:border-[#00D67D]/50 transition-colors" />
            </div>
            <div>
              <label className="label-xs mb-1.5 block">Body</label>
              <textarea rows={10} value={body} onChange={e => setBody(e.target.value)}
                className="w-full admin-input border admin-border-md rounded-xl px-4 py-3 text-sm admin-text outline-none focus:border-[#00D67D]/50 transition-colors resize-none leading-relaxed" />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={sendEmail} disabled={sending || !selectedLead?.contact_email}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-black transition-opacity disabled:opacity-40"
                style={{ background: 'var(--accent)' }}>
                {sending ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
                {sending ? 'Sending…' : selectedLead?.contact_email ? `Send to ${selectedLead.contact_email}` : 'No email saved'}
              </button>
              <button onClick={generate} disabled={generating}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm admin-muted hover:text-white bg-white/5 admin-hover transition-colors">
                <RefreshCw size={14} /> Regenerate
              </button>
            </div>
            <AnimatePresence>
              {sendStatus === 'success' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-[#00D67D] text-sm">
                  <CheckCircle2 size={16} /> Email sent successfully.
                </motion.div>
              )}
            </AnimatePresence>
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
    { id: 'copy',  label: 'Copy Generator', icon: <Sparkles size={14} /> },
    { id: 'email', label: 'Email Sequence',  icon: <Mail size={14} /> },
  ];

  return (
    <div className="space-y-4 max-w-7xl mx-auto lg:mx-0">
      <div className="flex gap-2">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 ${
              tab === t.id
                ? 'bg-[#00D67D]/10 border-[#00D67D]/30 text-[#00D67D]'
                : 'admin-hover admin-border admin-muted hover:text-slate-300'
            }`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
          {tab === 'copy'  && <CopyTab  leads={leads} />}
          {tab === 'email' && <EmailTab leads={leads} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
