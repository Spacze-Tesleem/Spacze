'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Copy, CheckCircle2, RefreshCw, AlertCircle,
  Instagram, Twitter, Search, Mail, MessageCircle, Linkedin,
  ChevronDown,
} from 'lucide-react';
import { Lead } from '@/lib/supabase';

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } };

// ─────────────────────────────────────────────
// Platform config
// ─────────────────────────────────────────────

type Platform = 'instagram' | 'twitter' | 'google_ads' | 'email' | 'whatsapp' | 'linkedin';

const PLATFORMS: { id: Platform; label: string; icon: React.ReactNode; color: string; bg: string }[] = [
  { id: 'instagram', label: 'Instagram',  icon: <Instagram size={15} />,    color: 'text-pink-500',   bg: 'bg-pink-500/10 border-pink-500/20' },
  { id: 'twitter',   label: 'Twitter / X', icon: <Twitter size={15} />,     color: 'text-sky-400',    bg: 'bg-sky-400/10 border-sky-400/20' },
  { id: 'google_ads',label: 'Google Ads', icon: <Search size={15} />,       color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20' },
  { id: 'email',     label: 'Email',      icon: <Mail size={15} />,         color: 'text-blue-400',   bg: 'bg-blue-400/10 border-blue-400/20' },
  { id: 'whatsapp',  label: 'WhatsApp',   icon: <MessageCircle size={15} />,color: 'text-[#25D366]',  bg: 'bg-[#25D366]/10 border-[#25D366]/20' },
  { id: 'linkedin',  label: 'LinkedIn',   icon: <Linkedin size={15} />,     color: 'text-blue-500',   bg: 'bg-blue-500/10 border-blue-500/20' },
];

const TONES = ['Professional', 'Friendly', 'Bold', 'Urgent', 'Witty'];
const GOALS = ['Awareness', 'Clicks', 'Leads', 'Sales', 'Engagement'];

// ─────────────────────────────────────────────
// Output renderer — platform-specific formatting
// ─────────────────────────────────────────────

function renderOutput(platform: Platform, raw: string) {
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);

  if (platform === 'instagram') {
    const captionIdx = lines.findIndex(l => l.startsWith('CAPTION:'));
    const hashtagIdx = lines.findIndex(l => l.startsWith('HASHTAGS:'));
    const caption = captionIdx >= 0
      ? lines.slice(captionIdx + 1, hashtagIdx >= 0 ? hashtagIdx : undefined).join('\n')
      : raw;
    const hashtags = hashtagIdx >= 0 ? lines.slice(hashtagIdx + 1).join(' ') : '';
    return (
      <div className="space-y-3">
        <div>
          <div className="text-[10px] font-mono admin-muted uppercase tracking-wider mb-1">Caption</div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap admin-text">{caption}</p>
        </div>
        {hashtags && (
          <div>
            <div className="text-[10px] font-mono admin-muted uppercase tracking-wider mb-1">Hashtags</div>
            <p className="text-xs text-pink-400 leading-relaxed">{hashtags}</p>
          </div>
        )}
      </div>
    );
  }

  if (platform === 'twitter') {
    const tweetIdx = lines.findIndex(l => l.startsWith('TWEET:'));
    const replyIdx = lines.findIndex(l => l.startsWith('REPLY'));
    const tweet = tweetIdx >= 0
      ? lines.slice(tweetIdx + 1, replyIdx >= 0 ? replyIdx : undefined).join('\n')
      : raw;
    const reply = replyIdx >= 0 ? lines.slice(replyIdx + 1).join('\n') : '';
    return (
      <div className="space-y-3">
        <div>
          <div className="text-[10px] font-mono admin-muted uppercase tracking-wider mb-1">Tweet</div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap admin-text">{tweet}</p>
          <p className="text-[10px] admin-muted mt-1">{tweet.length} / 280 chars</p>
        </div>
        {reply && (
          <div>
            <div className="text-[10px] font-mono admin-muted uppercase tracking-wider mb-1">Reply Thread</div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap admin-text">{reply}</p>
          </div>
        )}
      </div>
    );
  }

  if (platform === 'google_ads') {
    const fields: { label: string; value: string; max: number }[] = [];
    ['HEADLINE_1', 'HEADLINE_2', 'HEADLINE_3'].forEach(key => {
      const line = lines.find(l => l.startsWith(key + ':'));
      if (line) fields.push({ label: key.replace('_', ' '), value: line.replace(key + ':', '').trim(), max: 30 });
    });
    ['DESCRIPTION_1', 'DESCRIPTION_2'].forEach(key => {
      const line = lines.find(l => l.startsWith(key + ':'));
      if (line) fields.push({ label: key.replace('_', ' '), value: line.replace(key + ':', '').trim(), max: 90 });
    });
    return (
      <div className="space-y-2">
        {fields.map(f => (
          <div key={f.label}>
            <div className="text-[10px] font-mono admin-muted uppercase tracking-wider mb-0.5">{f.label}</div>
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm admin-text">{f.value}</p>
              <span className={`text-[10px] font-mono flex-shrink-0 ${f.value.length > f.max ? 'text-red-400' : 'admin-muted'}`}>
                {f.value.length}/{f.max}
              </span>
            </div>
          </div>
        ))}
        {fields.length === 0 && <p className="text-sm admin-text whitespace-pre-wrap">{raw}</p>}
      </div>
    );
  }

  if (platform === 'email') {
    const subjectIdx = lines.findIndex(l => l.startsWith('SUBJECT:'));
    const bodyIdx = lines.findIndex(l => l.startsWith('BODY:'));
    const subject = subjectIdx >= 0 ? lines[subjectIdx].replace('SUBJECT:', '').trim() : '';
    const body = bodyIdx >= 0 ? lines.slice(bodyIdx + 1).join('\n') : raw;
    return (
      <div className="space-y-3">
        {subject && (
          <div>
            <div className="text-[10px] font-mono admin-muted uppercase tracking-wider mb-1">Subject</div>
            <p className="text-sm font-medium admin-text">{subject}</p>
          </div>
        )}
        <div>
          <div className="text-[10px] font-mono admin-muted uppercase tracking-wider mb-1">Body</div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap admin-text">{body}</p>
        </div>
      </div>
    );
  }

  if (platform === 'whatsapp') {
    const msgIdx = lines.findIndex(l => l.startsWith('MESSAGE:'));
    const message = msgIdx >= 0 ? lines.slice(msgIdx + 1).join('\n') : raw;
    return (
      <div>
        <div className="text-[10px] font-mono admin-muted uppercase tracking-wider mb-1">Message</div>
        <p className="text-sm leading-relaxed whitespace-pre-wrap admin-text">{message}</p>
      </div>
    );
  }

  if (platform === 'linkedin') {
    const connIdx = lines.findIndex(l => l.startsWith('CONNECTION_NOTE:'));
    const followIdx = lines.findIndex(l => l.startsWith('FOLLOW_UP:'));
    const connNote = connIdx >= 0
      ? lines.slice(connIdx + 1, followIdx >= 0 ? followIdx : undefined).join('\n')
      : '';
    const followUp = followIdx >= 0 ? lines.slice(followIdx + 1).join('\n') : '';
    return (
      <div className="space-y-3">
        {connNote && (
          <div>
            <div className="text-[10px] font-mono admin-muted uppercase tracking-wider mb-1">Connection Note</div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap admin-text">{connNote}</p>
            <p className="text-[10px] admin-muted mt-1">{connNote.length} / 300 chars</p>
          </div>
        )}
        {followUp && (
          <div>
            <div className="text-[10px] font-mono admin-muted uppercase tracking-wider mb-1">Follow-up Message</div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap admin-text">{followUp}</p>
          </div>
        )}
        {!connNote && !followUp && <p className="text-sm admin-text whitespace-pre-wrap">{raw}</p>}
      </div>
    );
  }

  return <p className="text-sm admin-text whitespace-pre-wrap">{raw}</p>;
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────

export default function AICopyPanel() {
  const [platform, setPlatform] = useState<Platform>('instagram');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadOpen, setLeadOpen] = useState(false);

  const [tone, setTone] = useState('Professional');
  const [goal, setGoal] = useState('Leads');
  const [keyMessage, setKeyMessage] = useState('');

  // Output state
  const [output, setOutput] = useState('');
  const [provider, setProvider] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/leads').then(r => r.json()).then(d => setLeads(Array.isArray(d) ? d : []));
  }, []);

  const activePlatform = PLATFORMS.find(p => p.id === platform)!;

  async function generate() {
    setGenerating(true);
    setError('');
    setOutput('');
    setCopied(false);

    const body = selectedLead
      ? {
          platform,
          tone,
          goal,
          keyMessage,
          businessName: selectedLead.business_name,
          industry: selectedLead.industry,
          aiOpportunity: selectedLead.ai_opportunity,
          weakPoints: selectedLead.weak_points,
          possibleImprovements: selectedLead.possible_improvements,
          website: selectedLead.website,
        }
      : { platform, tone, goal, keyMessage };

    try {
      const res = await fetch('/api/generate-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setOutput(data.output);
      setProvider(data.provider);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  }

  function copyOutput() {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const canGenerate = selectedLead !== null;

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="grid lg:grid-cols-2 gap-5">

        {/* ── Left: Form ── */}
        <motion.div {...fadeUp} transition={{ delay: 0.05 }} className="space-y-4">

          {/* Platform picker */}
          <div className="admin-card p-4">
            <div className="label-xs mb-3">Platform</div>
            <div className="grid grid-cols-3 gap-2">
              {PLATFORMS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    platform === p.id ? `${p.bg} ${p.color}` : 'admin-border admin-muted hover:admin-text admin-hover'
                  }`}
                >
                  <span className={platform === p.id ? p.color : 'admin-muted'}>{p.icon}</span>
                  <span className="text-[10px] leading-tight text-center">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Lead selector */}
          <div className="admin-card p-4">
              <div className="text-[10px] font-mono admin-muted uppercase tracking-wider mb-2">Select Lead</div>
              <div className="relative">
                <button
                  onClick={() => setLeadOpen(o => !o)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl admin-input border text-sm transition-colors"
                >
                  <span className={selectedLead ? 'admin-text' : 'admin-muted'}>
                    {selectedLead ? selectedLead.business_name : 'Choose a lead…'}
                  </span>
                  <ChevronDown size={14} className={`admin-muted transition-transform ${leadOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {leadOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                      className="absolute z-20 top-full mt-1 w-full admin-surface border admin-border rounded-xl shadow-xl max-h-48 overflow-y-auto"
                    >
                      {leads.length === 0 ? (
                        <div className="px-3 py-4 text-sm admin-muted text-center">No leads found</div>
                      ) : leads.map(l => (
                        <button
                          key={l.id}
                          onClick={() => { setSelectedLead(l); setLeadOpen(false); }}
                          className="w-full text-left px-3 py-2.5 text-sm admin-hover transition-colors border-b admin-border last:border-0"
                        >
                          <div className="font-medium admin-text">{l.business_name}</div>
                          <div className="text-[11px] admin-muted">{l.industry || 'Unknown industry'}</div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {selectedLead && (
                <div className="mt-3 p-3 rounded-xl bg-[#00D67D]/5 border border-[#00D67D]/10 space-y-1">
                  <div className="text-[10px] font-mono text-[#00D67D] uppercase tracking-wider">Lead context loaded</div>
                  <div className="text-xs admin-muted">{selectedLead.industry} · {selectedLead.website || 'No website'}</div>
                  {selectedLead.ai_opportunity && (
                    <div className="text-xs admin-muted truncate">AI opp: {selectedLead.ai_opportunity}</div>
                  )}
                </div>
              )}
            </div>

          {/* Tone & Goal (shared) */}
          <div className="admin-card p-4">
            <div className="label-xs mb-3">Tone & Goal</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs admin-muted mb-1 block">Tone</label>
                <div className="flex flex-wrap gap-1.5">
                  {TONES.map(t => (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className={`px-2.5 py-1 rounded-lg text-xs border transition-all ${
                        tone === t
                          ? 'bg-[#00D67D]/10 text-[#00D67D] border-[#00D67D]/20'
                          : 'admin-border admin-muted hover:admin-text admin-hover'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs admin-muted mb-1 block">Goal</label>
                <div className="flex flex-wrap gap-1.5">
                  {GOALS.map(g => (
                    <button
                      key={g}
                      onClick={() => setGoal(g)}
                      className={`px-2.5 py-1 rounded-lg text-xs border transition-all ${
                        goal === g
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : 'admin-border admin-muted hover:admin-text admin-hover'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Key message */}
          <div className="admin-card p-4">
            <label className="label-xs mb-1.5 block">Additional Key Message (optional)</label>
            <textarea
              value={keyMessage}
              onChange={e => setKeyMessage(e.target.value)}
              placeholder="Any extra context or angle to emphasise…"
              rows={2}
              className="w-full admin-input border rounded-xl px-3 py-2.5 text-[13px] outline-none transition-colors resize-none"
            />
          </div>

          <button
            onClick={generate}
            disabled={generating || !canGenerate}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-black font-bold text-[13px] transition-colors disabled:opacity-40"
            style={{ background: 'var(--accent)' }}
          >
            {generating ? <RefreshCw size={15} className="animate-spin" /> : <Sparkles size={15} />}
            {generating ? 'Generating…' : `Generate ${activePlatform.label} Copy`}
          </button>
        </motion.div>

        {/* ── Right: Output ── */}
        <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
          <div className="admin-card p-5 min-h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className={activePlatform.color}>{activePlatform.icon}</span>
                <span className="text-sm font-bold admin-text">{activePlatform.label} Copy</span>
              </div>
              {output && (
                <div className="flex items-center gap-2">
                  {provider && (
                    <span className="text-[10px] font-mono admin-muted border admin-border px-2 py-1 rounded-md">
                      via {provider}
                    </span>
                  )}
                  <button
                    onClick={copyOutput}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg admin-hover border admin-border transition-colors admin-muted hover:admin-text"
                  >
                    {copied ? <CheckCircle2 size={13} className="text-[#00D67D]" /> : <Copy size={13} />}
                    {copied ? 'Copied!' : 'Copy all'}
                  </button>
                  <button
                    onClick={generate}
                    disabled={generating}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg admin-hover border admin-border transition-colors admin-muted hover:admin-text disabled:opacity-40"
                  >
                    <RefreshCw size={13} className={generating ? 'animate-spin' : ''} />
                    Regenerate
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                  >
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    {error}
                  </motion.div>
                )}

                {generating && !output && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-48 gap-3"
                  >
                    <RefreshCw size={24} className="animate-spin text-[#00D67D]" />
                    <p className="text-sm admin-muted">Generating {activePlatform.label} copy…</p>
                  </motion.div>
                )}

                {output && !generating && (
                  <motion.div
                    key="output"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-white/[0.02] border admin-border"
                  >
                    {renderOutput(platform, output)}
                  </motion.div>
                )}

                {!output && !generating && !error && (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center h-48 gap-3 border border-dashed admin-border rounded-xl"
                  >
                    <Sparkles size={28} className="text-slate-700" />
                    <p className="text-sm admin-muted text-center">
                      Select a lead and click Generate
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
