'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Zap, BarChart2, CheckCircle2,
  RefreshCw, AlertCircle, ChevronRight, Sparkles,
  TrendingUp, Eye, PenTool, Users, Star, Clock,
  ExternalLink, Copy, Check, BrainCircuit, Search,
  Activity, Target,
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
  { id: 'overview', label: 'Overview',  icon: <BarChart2 size={12} /> },
  { id: 'content',  label: 'Content',   icon: <PenTool size={12} /> },
  { id: 'audit',    label: 'Audit',     icon: <Zap size={12} /> },
  { id: 'activity', label: 'Activity',  icon: <Clock size={12} /> },
];

const SCORE_COLOR = (s: number) => s >= 7 ? '#10b981' : s >= 4 ? '#f59e0b' : '#f87171';

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const color = SCORE_COLOR(score);
  const r = 22; const circ = 2 * Math.PI * r;
  const dash = (score / 10) * circ;
  return (
    <div className="relative w-16 h-16 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r={r} fill="none" stroke="var(--admin-surface-3)" strokeWidth="4" />
        <circle cx="26" cy="26" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 4px ${color}80)` }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[15px] font-black leading-none" style={{ color }}>{score}</span>
        <span className="text-[8px] font-mono" style={{ color: `${color}80` }}>/10</span>
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1.5 rounded-lg transition-all flex-shrink-0 border"
      style={copied
        ? { color: ACCENT, background: `${ACCENT}15`, borderColor: `${ACCENT}30` }
        : { color: 'var(--admin-muted)', background: 'transparent', borderColor: 'var(--admin-border)' }
      }
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; dot: string }> = {
    'Sent':           { bg: '#10b98115', color: '#10b981', dot: '#10b981' },
    'Replied':        { bg: '#60a5fa15', color: '#60a5fa', dot: '#60a5fa' },
    'Meeting Booked': { bg: '#a78bfa15', color: '#a78bfa', dot: '#a78bfa' },
    'Pending':        { bg: '#f59e0b15', color: '#f59e0b', dot: '#f59e0b' },
  };
  const cfg = map[status] || { bg: '#71717a15', color: '#71717a', dot: '#71717a' };
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide border"
      style={{ background: cfg.bg, color: cfg.color, borderColor: `${cfg.dot}30` }}
    >
      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: cfg.dot }} />
      {status}
    </span>
  );
}
// ─── CLIENT CARD ──────────────────────────────────────────────────────────────
function ClientCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  const score = lead.website_quality_score;
  const color = score != null ? SCORE_COLOR(score) : '#71717a';
  const hasWebsite = !!lead.website;
  const initials = lead.business_name.slice(0, 2).toUpperCase();

  return (
    <motion.button
      whileHover={{ y: -1, scale: 1.005 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full text-left group relative overflow-hidden rounded-2xl border transition-all duration-200"
      style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}
    >
      {/* Hover accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-2xl"
        style={{ background: `linear-gradient(90deg, ${color}00, ${color}, ${color}00)` }}
      />

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div
            className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center text-[13px] font-black border"
            style={{ background: `${color}18`, color, borderColor: `${color}30` }}
          >
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-bold text-[13px] admin-text truncate leading-tight">{lead.business_name}</p>
                <p className="text-[11px] admin-muted truncate mt-0.5">{lead.industry || 'Unknown industry'}</p>
              </div>
              {score != null && (
                <div
                  className="flex-shrink-0 px-2 py-0.5 rounded-lg text-center border"
                  style={{ background: `${color}12`, borderColor: `${color}25` }}
                >
                  <p className="text-[14px] font-black leading-none" style={{ color }}>{score}</p>
                  <p className="text-[8px] font-mono opacity-60" style={{ color }}>/10</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              <StatusBadge status={lead.outreach_status} />
              {hasWebsite && (
                <span className="flex items-center gap-1 text-[10px] admin-muted font-mono">
                  <Globe size={9} />
                  {lead.website.replace(/^https?:\/\//, '').split('/')[0]}
                </span>
              )}
              {lead.ai_opportunity && lead.ai_opportunity !== 'None' && (
                <span
                  className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md border"
                  style={{ color: '#a78bfa', background: '#a78bfa12', borderColor: '#a78bfa25' }}
                >
                  <Sparkles size={8} /> {lead.ai_opportunity}
                </span>
              )}
            </div>
          </div>

          <ChevronRight
            size={14}
            className="flex-shrink-0 mt-1 transition-all duration-200 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5"
            style={{ color: 'var(--admin-muted)' }}
          />
        </div>
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

  const scoreColor = score != null ? SCORE_COLOR(score) : '#71717a';

  return (
    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }} className="space-y-5">

      {/* Back + header card */}
      <div
        className="rounded-2xl border p-4"
        style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl border transition-all hover:scale-105 flex-shrink-0"
            style={{ color: 'var(--admin-muted)', borderColor: 'var(--admin-border)', background: 'var(--admin-surface-2)' }}
          >
            <ChevronRight size={14} className="rotate-180" />
          </button>

          <div
            className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center text-[14px] font-black border"
            style={{ background: `${scoreColor}18`, color: scoreColor, borderColor: `${scoreColor}30` }}
          >
            {lead.business_name.slice(0, 2).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-[15px] admin-text truncate leading-tight">{lead.business_name}</h2>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-[11px] admin-muted">{lead.industry || 'Unknown'}</span>
              {lead.website && (
                <a
                  href={lead.website} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] font-mono transition-colors"
                  style={{ color: 'var(--admin-muted)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = ACCENT)}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--admin-muted)')}
                >
                  <ExternalLink size={9} />
                  {lead.website.replace(/^https?:\/\//, '').split('/')[0]}
                </a>
              )}
            </div>
          </div>

          <StatusBadge status={lead.outreach_status} />
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 p-1 rounded-xl border w-fit"
        style={{ background: 'var(--admin-surface-2)', borderColor: 'var(--admin-border)' }}
      >
        {TAB_CONFIG.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
            style={tab === t.id
              ? { background: 'var(--admin-surface-3)', color: 'var(--admin-text)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }
              : { color: 'var(--admin-muted)' }
            }
          >
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
              {/* Score hero + metrics grid */}
              <div
                className="rounded-2xl border p-5"
                style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}
              >
                <p className="text-[10px] font-bold uppercase tracking-widest admin-muted mb-4">Site Health</p>
                <div className="flex items-center gap-5">
                  {score != null ? <ScoreRing score={score} /> : (
                    <div
                      className="w-16 h-16 rounded-full border-2 border-dashed flex items-center justify-center flex-shrink-0"
                      style={{ borderColor: 'var(--admin-border-lg)', color: 'var(--admin-muted)' }}
                    >
                      <span className="text-[10px] font-mono">N/A</span>
                    </div>
                  )}
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {[
                      { label: 'SEO',      value: lead.seo_quality || '—',                                    color: '#60a5fa' },
                      { label: 'Mobile',   value: lead.mobile_responsiveness || '—',                          color: '#a78bfa' },
                      { label: 'AI Opp',   value: lead.ai_opportunity || '—',                                 color: ACCENT },
                      { label: 'WhatsApp', value: lead.whatsapp_integration || '—',                           color: '#25D366' },
                      { label: 'Dashboard',value: lead.has_dashboard ? 'Yes' : 'No',                          color: lead.has_dashboard ? ACCENT : '#f87171' },
                      { label: 'Email',    value: lead.email_sent ? 'Sent' : 'Pending',                       color: lead.email_sent ? ACCENT : '#f59e0b' },
                    ].map(s => (
                      <div
                        key={s.label}
                        className="p-2.5 rounded-xl border"
                        style={{ background: `${s.color}08`, borderColor: `${s.color}20` }}
                      >
                        <p className="text-[9px] font-mono uppercase tracking-wider mb-1" style={{ color: `${s.color}80` }}>{s.label}</p>
                        <p className="text-[12px] font-bold truncate" style={{ color: s.color }}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contact info */}
              <div
                className="rounded-2xl border p-4 space-y-2.5"
                style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}
              >
                <p className="text-[10px] font-bold uppercase tracking-widest admin-muted mb-3">Contact</p>
                {[
                  { label: 'Email',    value: lead.contact_email },
                  { label: 'WhatsApp', value: lead.whatsapp_number },
                  { label: 'LinkedIn', value: lead.linkedin_url },
                  { label: 'Twitter',  value: lead.twitter_handle },
                ].filter(r => r.value).map(r => (
                  <div key={r.label} className="flex items-center justify-between gap-3 py-1.5 border-b last:border-0" style={{ borderColor: 'var(--admin-border)' }}>
                    <span className="text-[10px] font-mono uppercase tracking-wider admin-muted w-16 flex-shrink-0">{r.label}</span>
                    <span className="text-[12px] admin-text truncate flex-1">{r.value}</span>
                    <CopyButton text={r.value!} />
                  </div>
                ))}
              </div>

              {/* Weak points + improvements */}
              {(lead.weak_points || lead.possible_improvements) && (
                <div className="grid sm:grid-cols-2 gap-3">
                  {lead.weak_points && (
                    <div className="rounded-2xl border p-4" style={{ background: '#f8717108', borderColor: '#f8717125' }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-2 flex items-center gap-1.5">
                        <AlertCircle size={10} /> Weak Points
                      </p>
                      <p className="text-[12px] admin-text leading-relaxed">{lead.weak_points}</p>
                    </div>
                  )}
                  {lead.possible_improvements && (
                    <div className="rounded-2xl border p-4" style={{ background: `${ACCENT}08`, borderColor: `${ACCENT}25` }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: ACCENT }}>
                        <TrendingUp size={10} /> Improvements
                      </p>
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
              <div className="rounded-2xl border p-5" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <h3 className="font-bold text-[13px] admin-text flex items-center gap-2">
                      <Sparkles size={13} style={{ color: ACCENT }} />
                      AI Website Content
                    </h3>
                    <p className="text-[11px] admin-muted mt-1">Generate hero copy, about section, tagline & CTA for <span className="admin-text font-semibold">{lead.business_name}</span></p>
                  </div>
                  <button
                    onClick={generateContent}
                    disabled={generating}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-black font-bold text-[12px] transition-all disabled:opacity-40 flex-shrink-0"
                    style={{ background: generating ? `${ACCENT}80` : ACCENT, boxShadow: generating ? 'none' : `0 0 16px ${ACCENT}40` }}
                  >
                    {generating ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    {generating ? 'Generating…' : content ? 'Regenerate' : 'Generate'}
                  </button>
                </div>

                {genError && (
                  <div className="flex items-start gap-2 p-3 rounded-xl border text-red-400 text-[12px] mb-4" style={{ background: '#f8717110', borderColor: '#f8717130' }}>
                    <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />{genError}
                  </div>
                )}

                {generating && (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <div className="relative w-12 h-12">
                      <div className="absolute inset-0 rounded-full border-2 animate-ping" style={{ borderColor: `${ACCENT}30` }} />
                      <div className="absolute inset-1 rounded-full border-2 animate-ping [animation-delay:0.3s]" style={{ borderColor: `${ACCENT}20` }} />
                      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: `${ACCENT}15` }}>
                        <Sparkles size={18} style={{ color: ACCENT }} className="animate-pulse" />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-[13px] font-semibold admin-text">Writing content…</p>
                      <p className="text-[11px] admin-muted mt-0.5">Crafting copy for {lead.business_name}</p>
                    </div>
                  </div>
                )}

                {!generating && !content && !genError && (
                  <div className="flex flex-col items-center justify-center py-10 gap-3 rounded-xl border border-dashed" style={{ borderColor: 'var(--admin-border-md)' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${ACCENT}12` }}>
                      <PenTool size={16} style={{ color: ACCENT }} className="opacity-60" />
                    </div>
                    <p className="text-[12px] admin-muted">Click Generate to create website copy</p>
                  </div>
                )}

                {content && !generating && (
                  <div className="space-y-3">
                    {([
                      { key: 'tagline', label: 'Tagline',        icon: <Star size={10} />,      color: '#f59e0b' },
                      { key: 'hero',    label: 'Hero Section',   icon: <Eye size={10} />,       color: '#60a5fa' },
                      { key: 'about',   label: 'About Section',  icon: <Users size={10} />,     color: '#a78bfa' },
                      { key: 'cta',     label: 'Call to Action', icon: <TrendingUp size={10} />,color: ACCENT },
                    ] as const).map(({ key, label, icon, color }) => (
                      <div key={key} className="p-4 rounded-xl border" style={{ background: 'var(--admin-surface-2)', borderColor: 'var(--admin-border)' }}>
                        <div className="flex items-center justify-between mb-2.5">
                          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color }}>
                            {icon}{label}
                          </span>
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
              <div className="rounded-2xl border p-5" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <h3 className="font-bold text-[13px] admin-text flex items-center gap-2">
                      <Zap size={13} style={{ color: '#60a5fa' }} />
                      Website Audit
                    </h3>
                    <p className="text-[11px] admin-muted mt-1">
                      {lead.website
                        ? <>Analyse <span className="font-mono admin-text">{lead.website.replace(/^https?:\/\//, '').split('/')[0]}</span></>
                        : 'No website URL on this lead'}
                    </p>
                  </div>
                  <button
                    onClick={runAudit}
                    disabled={auditing || !lead.website}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-[12px] transition-all disabled:opacity-40 flex-shrink-0 text-black"
                    style={{ background: auditing ? '#60a5fa80' : '#60a5fa', boxShadow: auditing ? 'none' : '0 0 16px #60a5fa40' }}
                  >
                    {auditing ? <RefreshCw size={12} className="animate-spin" /> : <Zap size={12} />}
                    {auditing ? 'Auditing…' : activeReport ? 'Re-audit' : 'Run Audit'}
                  </button>
                </div>

                {auditError && (
                  <div className="flex items-start gap-2 p-3 rounded-xl border text-red-400 text-[12px] mb-4" style={{ background: '#f8717110', borderColor: '#f8717130' }}>
                    <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />{auditError}
                  </div>
                )}

                {auditing && (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <div className="relative w-12 h-12">
                      <div className="absolute inset-0 rounded-full border-2 animate-ping" style={{ borderColor: '#60a5fa30' }} />
                      <div className="absolute inset-1 rounded-full border-2 animate-ping [animation-delay:0.3s]" style={{ borderColor: '#60a5fa20' }} />
                      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: '#60a5fa15' }}>
                        <Globe size={18} className="animate-pulse" style={{ color: '#60a5fa' }} />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-[13px] font-semibold admin-text">Scanning site…</p>
                      <p className="text-[11px] admin-muted mt-0.5 font-mono">{lead.website}</p>
                    </div>
                  </div>
                )}

                {!auditing && !activeReport && !auditError && (
                  <div className="flex flex-col items-center justify-center py-10 gap-3 rounded-xl border border-dashed" style={{ borderColor: 'var(--admin-border-md)' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#60a5fa12' }}>
                      <Globe size={16} style={{ color: '#60a5fa' }} className="opacity-60" />
                    </div>
                    <p className="text-[12px] admin-muted">
                      {lead.website ? 'Click Run Audit to analyse the site' : 'Add a website URL in the Audience panel first'}
                    </p>
                  </div>
                )}

                {activeReport && !auditing && (
                  <div className="space-y-4">
                    {/* Score + metrics row */}
                    <div className="flex items-center gap-4 p-4 rounded-xl border" style={{ background: 'var(--admin-surface-2)', borderColor: 'var(--admin-border)' }}>
                      <ScoreRing score={activeReport.score} />
                      <div className="grid grid-cols-3 gap-3 flex-1">
                        {[
                          { label: 'SEO',    value: activeReport.seo,    color: '#60a5fa' },
                          { label: 'Mobile', value: activeReport.mobile, color: '#a78bfa' },
                          { label: 'Speed',  value: activeReport.speed,  color: '#f59e0b' },
                        ].map(m => (
                          <div key={m.label} className="text-center p-2 rounded-lg border" style={{ background: `${m.color}08`, borderColor: `${m.color}20` }}>
                            <p className="text-[12px] font-bold" style={{ color: m.color }}>{m.value}</p>
                            <p className="text-[9px] font-mono uppercase tracking-wider mt-0.5" style={{ color: `${m.color}70` }}>{m.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Issues */}
                    {activeReport.issues.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-2.5 flex items-center gap-1.5">
                          <AlertCircle size={10} /> Issues Found
                        </p>
                        <div className="space-y-1.5">
                          {activeReport.issues.map((issue, i) => (
                            <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl border" style={{ background: '#f8717108', borderColor: '#f8717120' }}>
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
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5 flex items-center gap-1.5" style={{ color: ACCENT }}>
                          <CheckCircle2 size={10} /> Recommendations
                        </p>
                        <div className="space-y-1.5">
                          {activeReport.suggestions.map((s, i) => (
                            <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl border" style={{ background: `${ACCENT}06`, borderColor: `${ACCENT}20` }}>
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
            <div className="rounded-2xl border p-5 space-y-4" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest admin-muted">Outreach Timeline</p>

              <div className="relative space-y-0">
                {/* Vertical connector line */}
                <div className="absolute left-[11px] top-3 bottom-3 w-px" style={{ background: 'var(--admin-border-md)' }} />

                {[
                  { label: 'Lead created',  done: true,               color: '#71717a', date: lead.created_at,    desc: 'Added to pipeline' },
                  { label: 'Email sent',    done: lead.email_sent,    color: '#60a5fa', date: lead.last_contacted, desc: 'Initial outreach sent' },
                  { label: 'Reply received',done: lead.reply_received,color: ACCENT,    date: null,                desc: 'Prospect responded' },
                  { label: 'Meeting booked',done: lead.meeting_booked,color: '#a78bfa', date: lead.follow_up_date, desc: 'Discovery call scheduled' },
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3 py-3 relative">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border-2 z-10 transition-all"
                      style={step.done
                        ? { background: step.color, borderColor: step.color, boxShadow: `0 0 8px ${step.color}50` }
                        : { background: 'var(--admin-surface)', borderColor: 'var(--admin-border-lg)' }
                      }
                    >
                      {step.done
                        ? <Check size={10} className="text-black font-black" />
                        : <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--admin-border-lg)' }} />
                      }
                    </div>
                    <div className="flex-1 flex items-start justify-between gap-2 pt-0.5">
                      <div>
                        <p className="text-[12px] font-semibold leading-tight" style={{ color: step.done ? 'var(--admin-text)' : 'var(--admin-muted)' }}>
                          {step.label}
                        </p>
                        <p className="text-[10px] mt-0.5" style={{ color: step.done ? 'var(--admin-muted)' : 'var(--admin-subtle)' }}>
                          {step.desc}
                        </p>
                      </div>
                      {step.date && (
                        <p className="text-[10px] admin-muted font-mono flex-shrink-0 mt-0.5">
                          {new Date(step.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {lead.follow_up_date && (
                <div
                  className="p-3.5 rounded-xl border flex items-center gap-3"
                  style={{ borderColor: `${ACCENT}30`, background: `${ACCENT}08` }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${ACCENT}20` }}>
                    <Clock size={14} style={{ color: ACCENT }} />
                  </div>
                  <div>
                    <p className="text-[12px] font-bold" style={{ color: ACCENT }}>Follow-up scheduled</p>
                    <p className="text-[11px] admin-muted mt-0.5">
                      {new Date(lead.follow_up_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
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

  const scoredLeads = leads.filter(l => l.website_quality_score != null);
  const stats = useMemo(() => ({
    total:    leads.length,
    clients:  clients.length,
    avgScore: scoredLeads.length
      ? Math.round(scoredLeads.reduce((s, l) => s + l.website_quality_score!, 0) / scoredLeads.length * 10) / 10
      : null,
    highOpp: leads.filter(l => l.ai_opportunity === 'High').length,
  }), [leads, clients, scoredLeads]);

  return (
    <div className="max-w-4xl pb-12 space-y-6">

      {/* ── Header ── */}
      <div
        className="rounded-2xl border p-5 relative overflow-hidden"
        style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}
      >
        {/* Ambient glow */}
        <div
          className="absolute -top-8 -right-8 w-40 h-40 rounded-full blur-3xl pointer-events-none"
          style={{ background: `${ACCENT}12` }}
        />
        <div className="relative flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border"
            style={{ background: `${ACCENT}15`, borderColor: `${ACCENT}30`, boxShadow: `0 0 20px ${ACCENT}20` }}
          >
            <BrainCircuit size={20} style={{ color: ACCENT }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-black text-[17px] admin-text leading-none">Spacze AI</h1>
              <span
                className="text-[9px] font-bold px-2 py-0.5 rounded-full border font-mono uppercase tracking-wider"
                style={{ color: ACCENT, background: `${ACCENT}12`, borderColor: `${ACCENT}25` }}
              >
                SAI
              </span>
            </div>
            <p className="text-[12px] admin-muted mt-1">Client website intelligence & content hub</p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border" style={{ background: `${ACCENT}08`, borderColor: `${ACCENT}20` }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: ACCENT }} />
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: ACCENT }}>Active</span>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {selected ? (
          <motion.div key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ClientDetail lead={selected} onBack={() => setSelected(null)} />
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">

            {/* ── Stats row ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {([
                { label: 'Total Leads', value: stats.total,                                        color: '#60a5fa', icon: Users,       sub: 'in pipeline' },
                { label: 'Clients',     value: stats.clients,                                      color: ACCENT,    icon: CheckCircle2, sub: 'active' },
                { label: 'Avg Score',   value: stats.avgScore != null ? `${stats.avgScore}/10` : '—', color: '#f59e0b', icon: Activity,  sub: 'site health' },
                { label: 'High AI Opp', value: stats.highOpp,                                      color: '#a78bfa', icon: Sparkles,    sub: 'opportunities' },
              ] as const).map(({ label, value, color, icon: Icon, sub }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="rounded-2xl border p-4 relative overflow-hidden group"
                  style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{ background: `radial-gradient(circle at top right, ${color}08, transparent 70%)` }}
                  />
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center border"
                      style={{ background: `${color}15`, borderColor: `${color}25` }}
                    >
                      <Icon size={14} style={{ color }} />
                    </div>
                    <Target size={10} className="opacity-20 mt-1" style={{ color }} />
                  </div>
                  <p className="text-[22px] font-black leading-none admin-text">{loading ? '—' : value}</p>
                  <p className="text-[10px] admin-muted mt-1">{label}</p>
                  <p className="text-[9px] font-mono uppercase tracking-wider mt-0.5" style={{ color: `${color}60` }}>{sub}</p>
                </motion.div>
              ))}
            </div>

            {/* ── Search ── */}
            <div className="relative group max-w-sm">
              <Search
                size={13}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors"
                style={{ color: 'var(--admin-muted)' }}
              />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search clients & prospects…"
                className="admin-input w-full pl-9 pr-4 py-2.5 text-[13px] rounded-xl"
              />
            </div>

            {/* ── Active Clients ── */}
            {filterLeads(clients).length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-bold admin-muted uppercase tracking-widest">Active Clients</p>
                  <span
                    className="text-[10px] font-black px-2 py-0.5 rounded-full text-black"
                    style={{ background: ACCENT }}
                  >
                    {filterLeads(clients).length}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {filterLeads(clients).map(l => (
                    <ClientCard key={l.id} lead={l} onClick={() => setSelected(l)} />
                  ))}
                </div>
              </div>
            )}

            {/* ── Prospects ── */}
            {filterLeads(prospects).length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-bold admin-muted uppercase tracking-widest">Prospects</p>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                    style={{ color: 'var(--admin-muted)', background: 'var(--admin-surface-3)', borderColor: 'var(--admin-border)' }}
                  >
                    {filterLeads(prospects).length}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {filterLeads(prospects).map(l => (
                    <ClientCard key={l.id} lead={l} onClick={() => setSelected(l)} />
                  ))}
                </div>
              </div>
            )}

            {/* ── Empty state ── */}
            {!loading && leads.length === 0 && (
              <div
                className="flex flex-col items-center justify-center py-16 gap-4 border border-dashed rounded-2xl"
                style={{ borderColor: 'var(--admin-border-md)' }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: `${ACCENT}12` }}
                >
                  <Users size={22} style={{ color: ACCENT }} className="opacity-60" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold admin-text">No leads yet</p>
                  <p className="text-[11px] admin-muted mt-1 max-w-xs">
                    Add leads in the Audience panel — they'll appear here as clients once contacted.
                  </p>
                </div>
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
