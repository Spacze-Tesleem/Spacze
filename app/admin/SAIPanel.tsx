'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Zap, BarChart2, FileText, CheckCircle2,
  RefreshCw, AlertCircle, ChevronRight, Sparkles,
  TrendingUp, Eye, PenTool, Users, Star, Clock,
  ExternalLink, Copy, Check,
} from 'lucide-react';
import { Lead } from '@/lib/supabase';
import { useLeads } from '@/lib/hooks';

// ─── TYPES ────────────────────────────────────────────────────────────────────
type ClientTab = 'overview' | 'content' | 'audit' | 'activity';

interface SiteReport {
  score: number;
  seo: string;
  mobile: string;
  speed: string;
  issues: string[];
  suggestions: string[];
}

interface GeneratedContent {
  hero: string;
  about: string;
  cta: string;
  tagline: string;
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const ACCENT = '#00D67D';

const TAB_CONFIG: { id: ClientTab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview',  icon: <BarChart2 size={13} /> },
  { id: 'content',  label: 'Content',   icon: <PenTool size={13} /> },
  { id: 'audit',    label: 'Audit',     icon: <Zap size={13} /> },
  { id: 'activity', label: 'Activity',  icon: <Clock size={13} /> },
];

const SCORE_COLOR = (s: number) => s >= 7 ? '#10b981' : s >= 4 ? '#f59e0b' : '#f87171';

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const color = SCORE_COLOR(score);
  const r = 20; const circ = 2 * Math.PI * r;
  const dash = (score / 10) * circ;
  return (
    <div className="relative w-14 h-14 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={r} fill="none" stroke="var(--admin-surface-3)" strokeWidth="4" />
        <circle cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[13px] font-black" style={{ color }}>{score}</span>
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1.5 rounded-lg admin-muted hover:admin-text transition-colors admin-hover border admin-border flex-shrink-0">
      {copied ? <Check size={11} style={{ color: ACCENT }} /> : <Copy size={11} />}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; dot: string }> = {
    'Sent':           { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: '#10b981' },
    'Replied':        { bg: 'bg-blue-500/10',    text: 'text-blue-400',    dot: '#60a5fa' },
    'Meeting Booked': { bg: 'bg-purple-500/10',  text: 'text-purple-400',  dot: '#a78bfa' },
    'Pending':        { bg: 'bg-amber-500/10',   text: 'text-amber-400',   dot: '#f59e0b' },
  };
  const cfg = map[status] || { bg: 'bg-zinc-500/10', text: 'text-zinc-400', dot: '#71717a' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />{status}
    </span>
  );
}
// ─── CLIENT CARD ──────────────────────────────────────────────────────────────
function ClientCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  const score = lead.website_quality_score;
  const color = score != null ? SCORE_COLOR(score) : '#71717a';
  const hasWebsite = !!lead.website;

  return (
    <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full text-left admin-card p-4 hover:border-[var(--admin-border-md)] transition-all group">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-[14px] font-black text-black"
          style={{ background: `${color}30`, color }}>
          {lead.business_name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-bold text-[13px] admin-text truncate">{lead.business_name}</p>
              <p className="text-[11px] admin-muted truncate mt-0.5">{lead.industry || 'Unknown industry'}</p>
            </div>
            {score != null && (
              <div className="flex-shrink-0 text-right">
                <p className="text-[16px] font-black leading-none" style={{ color }}>{score}</p>
                <p className="text-[9px] admin-muted font-mono">/10</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
            <StatusBadge status={lead.outreach_status} />
            {hasWebsite && (
              <span className="flex items-center gap-1 text-[10px] admin-muted">
                <Globe size={9} /> {lead.website.replace(/^https?:\/\//, '').split('/')[0]}
              </span>
            )}
            {lead.ai_opportunity && lead.ai_opportunity !== 'None' && (
              <span className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                style={{ color: '#a78bfa', background: '#a78bfa15' }}>
                <Sparkles size={9} /> {lead.ai_opportunity} AI
              </span>
            )}
          </div>
        </div>

        <ChevronRight size={14} className="admin-muted flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </motion.button>
  );
}
// ─── CLIENT DETAIL ────────────────────────────────────────────────────────────
function ClientDetail({ lead, onBack }: { lead: Lead; onBack: () => void }) {
  const [tab, setTab]                   = useState<ClientTab>('overview');
  const [report, setReport]             = useState<SiteReport | null>(null);
  const [auditing, setAuditing]         = useState(false);
  const [auditError, setAuditError]     = useState('');
  const [content, setContent]           = useState<GeneratedContent | null>(null);
  const [generating, setGenerating]     = useState(false);
  const [genError, setGenError]         = useState('');
  const score = lead.website_quality_score;

  async function runAudit() {
    if (!lead.website) { setAuditError('No website URL on this lead.'); return; }
    setAuditing(true); setAuditError('');
    try {
      const res = await fetch('/api/analyze-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id, website: lead.website, business_name: lead.business_name, industry: lead.industry }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Audit failed');
      setReport({
        score: data.website_quality_score ?? score ?? 0,
        seo: data.seo_quality || lead.seo_quality || '—',
        mobile: data.mobile_responsiveness || lead.mobile_responsiveness || '—',
        speed: data.speed || '—',
        issues: data.weak_points ? data.weak_points.split(/[.\n]/).filter((s: string) => s.trim().length > 4).slice(0, 5) : (lead.weak_points ? lead.weak_points.split(/[.\n]/).filter((s: string) => s.trim().length > 4).slice(0, 5) : []),
        suggestions: data.possible_improvements ? data.possible_improvements.split(/[.\n]/).filter((s: string) => s.trim().length > 4).slice(0, 5) : (lead.possible_improvements ? lead.possible_improvements.split(/[.\n]/).filter((s: string) => s.trim().length > 4).slice(0, 5) : []),
      });
    } catch (e: unknown) { setAuditError(e instanceof Error ? e.message : 'Audit failed'); }
    finally { setAuditing(false); }
  }

  async function generateContent() {
    setGenerating(true); setGenError('');
    try {
      const res = await fetch('/api/generate-site-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_name: lead.business_name, industry: lead.industry, website: lead.website, ai_opportunity: lead.ai_opportunity, weak_points: lead.weak_points, possible_improvements: lead.possible_improvements }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setContent(data);
    } catch (e: unknown) { setGenError(e instanceof Error ? e.message : 'Generation failed'); }
    finally { setGenerating(false); }
  }

  const existingReport: SiteReport | null = !report && (lead.weak_points || lead.seo_quality) ? {
    score: score ?? 0,
    seo: lead.seo_quality || '—',
    mobile: lead.mobile_responsiveness || '—',
    speed: '—',
    issues: lead.weak_points ? lead.weak_points.split(/[.\n]/).filter(s => s.trim().length > 4).slice(0, 5) : [],
    suggestions: lead.possible_improvements ? lead.possible_improvements.split(/[.\n]/).filter(s => s.trim().length > 4).slice(0, 5) : [],
  } : null;

  const activeReport = report || existingReport;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">

      {/* Back + header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl admin-muted hover:admin-text admin-hover border admin-border transition-colors flex-shrink-0">
          <ChevronRight size={14} className="rotate-180" />
        </button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-[14px] font-black"
            style={{ background: `${score != null ? SCORE_COLOR(score) : '#71717a'}25`, color: score != null ? SCORE_COLOR(score) : '#71717a' }}>
            {lead.business_name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-[15px] admin-text truncate">{lead.business_name}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-[11px] admin-muted">{lead.industry || 'Unknown'}</p>
              {lead.website && (
                <a href={lead.website} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] admin-muted hover:admin-text transition-colors">
                  <ExternalLink size={9} /> {lead.website.replace(/^https?:\/\//, '').split('/')[0]}
                </a>
              )}
            </div>
          </div>
        </div>
        <StatusBadge status={lead.outreach_status} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-[var(--admin-surface-2)] border admin-border w-fit">
        {TAB_CONFIG.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${tab === t.id ? 'admin-text' : 'admin-muted hover:admin-text'}`}
            style={tab === t.id ? { background: 'var(--admin-surface-3)' } : {}}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>

          {/* ── OVERVIEW ── */}
          {tab === 'overview' && (
            <div className="space-y-4">
              {/* Score + quick stats */}
              <div className="admin-card p-5">
                <div className="flex items-center gap-5">
                  {score != null ? <ScoreRing score={score} /> : (
                    <div className="w-14 h-14 rounded-full border-2 border-dashed admin-border flex items-center justify-center admin-muted flex-shrink-0">
                      <span className="text-[10px]">N/A</span>
                    </div>
                  )}
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { label: 'SEO',     value: lead.seo_quality || '—',             color: '#60a5fa' },
                      { label: 'Mobile',  value: lead.mobile_responsiveness || '—',   color: '#a78bfa' },
                      { label: 'AI Opp',  value: lead.ai_opportunity || '—',          color: ACCENT },
                      { label: 'WhatsApp',value: lead.whatsapp_integration || '—',    color: '#25D366' },
                      { label: 'Dashboard',value: lead.has_dashboard ? 'Yes' : 'No',  color: lead.has_dashboard ? ACCENT : '#f87171' },
                      { label: 'Email',   value: lead.email_sent ? 'Sent' : 'Pending',color: lead.email_sent ? ACCENT : '#f59e0b' },
                    ].map(s => (
                      <div key={s.label} className="p-2.5 rounded-xl bg-[var(--admin-surface-2)] border admin-border">
                        <p className="text-[10px] admin-muted mb-0.5">{s.label}</p>
                        <p className="text-[12px] font-bold" style={{ color: s.color }}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contact info */}
              <div className="admin-card p-4 space-y-2.5">
                <p className="text-[11px] font-bold admin-muted uppercase tracking-wider">Contact</p>
                {[
                  { label: 'Email',    value: lead.contact_email },
                  { label: 'WhatsApp', value: lead.whatsapp_number },
                  { label: 'LinkedIn', value: lead.linkedin_url },
                  { label: 'Twitter',  value: lead.twitter_handle },
                ].filter(r => r.value).map(r => (
                  <div key={r.label} className="flex items-center justify-between gap-3">
                    <span className="text-[11px] admin-muted w-16 flex-shrink-0">{r.label}</span>
                    <span className="text-[12px] admin-text truncate flex-1">{r.value}</span>
                    <CopyButton text={r.value!} />
                  </div>
                ))}
              </div>

              {/* Notes */}
              {(lead.weak_points || lead.possible_improvements) && (
                <div className="admin-card p-4 space-y-3">
                  {lead.weak_points && (
                    <div>
                      <p className="text-[11px] font-bold text-red-400 mb-1.5 flex items-center gap-1.5"><AlertCircle size={11} /> Weak Points</p>
                      <p className="text-[12px] admin-text leading-relaxed">{lead.weak_points}</p>
                    </div>
                  )}
                  {lead.possible_improvements && (
                    <div>
                      <p className="text-[11px] font-bold mb-1.5 flex items-center gap-1.5" style={{ color: ACCENT }}><TrendingUp size={11} /> Improvements</p>
                      <p className="text-[12px] admin-text leading-relaxed">{lead.possible_improvements}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── CONTENT ── */}
          {tab === 'content' && (
            <div className="space-y-4">
              <div className="admin-card p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-bold text-[13px] admin-text">AI Website Content</h3>
                    <p className="text-[11px] admin-muted mt-0.5">Generate hero copy, about section, tagline & CTA for {lead.business_name}</p>
                  </div>
                  <button onClick={generateContent} disabled={generating}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-black font-bold text-[12px] transition-all disabled:opacity-40 hover:opacity-90 flex-shrink-0"
                    style={{ background: ACCENT }}>
                    {generating ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    {generating ? 'Generating…' : content ? 'Regenerate' : 'Generate'}
                  </button>
                </div>

                {genError && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[12px] mb-3">
                    <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />{genError}
                  </div>
                )}

                {generating && (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <div className="relative w-10 h-10">
                      <div className="absolute inset-0 rounded-full border-2 animate-ping" style={{ borderColor: `${ACCENT}30` }} />
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${ACCENT}15` }}>
                        <Sparkles size={16} style={{ color: ACCENT }} className="animate-pulse" />
                      </div>
                    </div>
                    <p className="text-[12px] admin-muted animate-pulse">Writing content for {lead.business_name}…</p>
                  </div>
                )}

                {!generating && !content && !genError && (
                  <div className="flex flex-col items-center justify-center py-8 gap-2 border border-dashed admin-border rounded-xl">
                    <PenTool size={20} className="admin-muted opacity-40" />
                    <p className="text-[12px] admin-muted">Click Generate to create website copy</p>
                  </div>
                )}

                {content && !generating && (
                  <div className="space-y-3">
                    {([
                      { key: 'tagline',  label: 'Tagline',       icon: <Star size={11} /> },
                      { key: 'hero',     label: 'Hero Section',  icon: <Eye size={11} /> },
                      { key: 'about',    label: 'About Section', icon: <Users size={11} /> },
                      { key: 'cta',      label: 'Call to Action',icon: <TrendingUp size={11} /> },
                    ] as const).map(({ key, label, icon }) => (
                      <div key={key} className="p-3.5 rounded-xl bg-[var(--admin-surface-2)] border admin-border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="flex items-center gap-1.5 text-[10px] font-bold admin-muted uppercase tracking-wider">{icon}{label}</span>
                          <CopyButton text={content[key]} />
                        </div>
                        <p className="text-[13px] admin-text leading-relaxed">{content[key]}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── AUDIT ── */}
          {tab === 'audit' && (
            <div className="space-y-4">
              <div className="admin-card p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-bold text-[13px] admin-text">Website Audit</h3>
                    <p className="text-[11px] admin-muted mt-0.5">
                      {lead.website ? `Analyse ${lead.website.replace(/^https?:\/\//, '').split('/')[0]}` : 'No website URL on this lead'}
                    </p>
                  </div>
                  <button onClick={runAudit} disabled={auditing || !lead.website}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-[12px] transition-all disabled:opacity-40 hover:opacity-90 flex-shrink-0 text-black"
                    style={{ background: ACCENT }}>
                    {auditing ? <RefreshCw size={12} className="animate-spin" /> : <Zap size={12} />}
                    {auditing ? 'Auditing…' : activeReport ? 'Re-audit' : 'Run Audit'}
                  </button>
                </div>

                {auditError && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[12px] mb-3">
                    <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />{auditError}
                  </div>
                )}

                {auditing && (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <div className="relative w-10 h-10">
                      <div className="absolute inset-0 rounded-full border-2 animate-ping" style={{ borderColor: '#60a5fa30' }} />
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500/10">
                        <Globe size={16} className="text-blue-400 animate-pulse" />
                      </div>
                    </div>
                    <p className="text-[12px] admin-muted animate-pulse">Scanning {lead.website}…</p>
                  </div>
                )}

                {!auditing && !activeReport && !auditError && (
                  <div className="flex flex-col items-center justify-center py-8 gap-2 border border-dashed admin-border rounded-xl">
                    <Globe size={20} className="admin-muted opacity-40" />
                    <p className="text-[12px] admin-muted">{lead.website ? 'Click Run Audit to analyse the site' : 'Add a website URL in the Audience panel first'}</p>
                  </div>
                )}

                {activeReport && !auditing && (
                  <div className="space-y-4">
                    {/* Score + metrics */}
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--admin-surface-2)] border admin-border">
                      <ScoreRing score={activeReport.score} />
                      <div className="grid grid-cols-3 gap-3 flex-1">
                        {[
                          { label: 'SEO',    value: activeReport.seo,    color: '#60a5fa' },
                          { label: 'Mobile', value: activeReport.mobile, color: '#a78bfa' },
                          { label: 'Speed',  value: activeReport.speed,  color: '#f59e0b' },
                        ].map(m => (
                          <div key={m.label} className="text-center">
                            <p className="text-[11px] font-bold" style={{ color: m.color }}>{m.value}</p>
                            <p className="text-[9px] admin-muted mt-0.5">{m.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Issues */}
                    {activeReport.issues.length > 0 && (
                      <div>
                        <p className="text-[11px] font-bold text-red-400 mb-2 flex items-center gap-1.5"><AlertCircle size={11} /> Issues Found</p>
                        <div className="space-y-1.5">
                          {activeReport.issues.map((issue, i) => (
                            <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-red-500/5 border border-red-500/15">
                              <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0 mt-1.5" />
                              <p className="text-[12px] admin-text leading-snug">{issue.trim()}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Suggestions */}
                    {activeReport.suggestions.length > 0 && (
                      <div>
                        <p className="text-[11px] font-bold mb-2 flex items-center gap-1.5" style={{ color: ACCENT }}><CheckCircle2 size={11} /> Recommendations</p>
                        <div className="space-y-1.5">
                          {activeReport.suggestions.map((s, i) => (
                            <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg border" style={{ background: `${ACCENT}06`, borderColor: `${ACCENT}20` }}>
                              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: ACCENT }} />
                              <p className="text-[12px] admin-text leading-snug">{s.trim()}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── ACTIVITY ── */}
          {tab === 'activity' && (
            <div className="admin-card p-5 space-y-3">
              <h3 className="font-bold text-[13px] admin-text">Outreach Timeline</h3>
              <div className="space-y-2">
                {[
                  { label: 'Lead created',      done: true,                    color: '#71717a', date: lead.created_at },
                  { label: 'Email sent',         done: lead.email_sent,         color: '#60a5fa', date: lead.last_contacted },
                  { label: 'Reply received',     done: lead.reply_received,     color: ACCENT,    date: null },
                  { label: 'Meeting booked',     done: lead.meeting_booked,     color: '#a78bfa', date: lead.follow_up_date },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${step.done ? 'border-transparent' : 'border-[var(--admin-border-lg)]'}`}
                      style={step.done ? { background: step.color } : {}}>
                      {step.done
                        ? <Check size={11} className="text-black" />
                        : <div className="w-1.5 h-1.5 rounded-full bg-[var(--admin-border-lg)]" />}
                    </div>
                    <div className="flex-1 flex items-center justify-between">
                      <p className={`text-[12px] font-medium ${step.done ? 'admin-text' : 'admin-muted'}`}>{step.label}</p>
                      {step.date && <p className="text-[10px] admin-muted font-mono">{new Date(step.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>}
                    </div>
                  </div>
                ))}
              </div>

              {lead.follow_up_date && (
                <div className="mt-4 p-3 rounded-xl border flex items-center gap-2.5"
                  style={{ borderColor: `${ACCENT}25`, background: `${ACCENT}08` }}>
                  <Clock size={13} style={{ color: ACCENT }} />
                  <div>
                    <p className="text-[11px] font-semibold" style={{ color: ACCENT }}>Follow-up scheduled</p>
                    <p className="text-[10px] admin-muted">{new Date(lead.follow_up_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                  </div>
                </div>
              )}
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
export default function SAIPanel() {
  const { leads, loading } = useLeads();
  const [selected, setSelected] = useState<Lead | null>(null);
  const [search, setSearch]     = useState('');

  const clients = useMemo(() =>
    leads.filter(l =>
      l.outreach_status === 'Sent' ||
      l.outreach_status === 'Replied' ||
      l.outreach_status === 'Meeting Booked' ||
      l.reply_received ||
      l.meeting_booked
    ), [leads]);

  const prospects = useMemo(() =>
    leads.filter(l => !clients.includes(l)), [leads, clients]);

  const filterLeads = (list: Lead[]) =>
    list.filter(l =>
      l.business_name.toLowerCase().includes(search.toLowerCase()) ||
      (l.industry || '').toLowerCase().includes(search.toLowerCase())
    );

  const stats = useMemo(() => ({
    total:    leads.length,
    clients:  clients.length,
    avgScore: leads.filter(l => l.website_quality_score != null).length
      ? Math.round(leads.filter(l => l.website_quality_score != null).reduce((s, l) => s + l.website_quality_score!, 0) / leads.filter(l => l.website_quality_score != null).length * 10) / 10
      : null,
    highOpp: leads.filter(l => l.ai_opportunity === 'High').length,
  }), [leads, clients]);

  return (
    <div className="max-w-4xl pb-12 space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${ACCENT}18`, boxShadow: `0 0 0 1px ${ACCENT}25` }}>
          <Sparkles size={18} style={{ color: ACCENT }} />
        </div>
        <div>
          <h1 className="font-black text-[16px] admin-text leading-none">Spacze AI</h1>
          <p className="text-[11px] admin-muted mt-0.5">Client website intelligence & content hub</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {selected ? (
          <motion.div key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ClientDetail lead={selected} onBack={() => setSelected(null)} />
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {([
                { label: 'Total Leads',  value: stats.total,                          color: '#60a5fa', icon: Users },
                { label: 'Clients',      value: stats.clients,                        color: ACCENT,    icon: CheckCircle2 },
                { label: 'Avg Score',    value: stats.avgScore != null ? `${stats.avgScore}/10` : '—', color: '#f59e0b', icon: Star },
                { label: 'High AI Opp', value: stats.highOpp,                        color: '#a78bfa', icon: Sparkles },
              ] as const).map(({ label, value, color, icon: Icon }) => (
                <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="admin-card p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
                    <Icon size={15} style={{ color }} />
                  </div>
                  <div>
                    <p className="text-[20px] font-black admin-text leading-none">{loading ? '—' : value}</p>
                    <p className="text-[11px] admin-muted mt-0.5">{label}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Search */}
            <div className="relative group max-w-sm">
              <Globe size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 admin-muted group-focus-within:text-[#00D67D] transition-colors pointer-events-none" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search clients & prospects…"
                className="admin-input w-full pl-9 pr-4 py-2.5 text-[13px] rounded-xl" />
            </div>

            {/* Clients */}
            {filterLeads(clients).length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <p className="text-[11px] font-bold admin-muted uppercase tracking-wider">Active Clients</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-black" style={{ background: ACCENT }}>{filterLeads(clients).length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {filterLeads(clients).map(l => <ClientCard key={l.id} lead={l} onClick={() => setSelected(l)} />)}
                </div>
              </div>
            )}

            {/* Prospects */}
            {filterLeads(prospects).length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <p className="text-[11px] font-bold admin-muted uppercase tracking-wider">Prospects</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full admin-muted bg-[var(--admin-surface-3)]">{filterLeads(prospects).length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {filterLeads(prospects).map(l => <ClientCard key={l.id} lead={l} onClick={() => setSelected(l)} />)}
                </div>
              </div>
            )}

            {!loading && leads.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3 border border-dashed admin-border rounded-2xl">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${ACCENT}12` }}>
                  <Users size={22} style={{ color: ACCENT }} className="opacity-60" />
                </div>
                <p className="text-sm font-semibold admin-text">No leads yet</p>
                <p className="text-[11px] admin-muted text-center max-w-xs">Add leads in the Audience panel — they'll appear here as clients once contacted.</p>
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
