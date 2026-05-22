'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Zap, BarChart2, CheckCircle2, RefreshCw, AlertCircle,
  ChevronRight, Sparkles, TrendingUp, Eye, PenTool, Users, Star,
  Clock, ExternalLink, Copy, Check, BrainCircuit, Search,
  Activity, Target, ArrowUpRight, Shield, Cpu,
} from 'lucide-react';
import { Lead } from '@/lib/supabase';
import { useLeads } from '@/lib/hooks';

// ─── TYPES ────────────────────────────────────────────────────────────────────
type ClientTab = 'overview' | 'content' | 'audit' | 'activity';
interface SiteReport { score: number; seo: string; mobile: string; speed: string; issues: string[]; suggestions: string[]; }
interface GeneratedContent { hero: string; about: string; cta: string; tagline: string; }

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const ACCENT  = '#00D67D';
const ACCENT2 = '#38bdf8';
const SCORE_COLOR = (s: number) => s >= 7 ? '#10b981' : s >= 4 ? '#f59e0b' : '#f87171';
const TAB_CONFIG: { id: ClientTab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview',  icon: <BarChart2 size={11} /> },
  { id: 'content',  label: 'Content',   icon: <PenTool size={11} /> },
  { id: 'audit',    label: 'Audit',     icon: <Zap size={11} /> },
  { id: 'activity', label: 'Activity',  icon: <Clock size={11} /> },
];
const STATUS_MAP: Record<string, { color: string }> = {
  'Sent':           { color: '#10b981' },
  'Replied':        { color: '#38bdf8' },
  'Meeting Booked': { color: '#a78bfa' },
  'Pending':        { color: '#f59e0b' },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 72 }: { score: number; size?: number }) {
  const color = SCORE_COLOR(score);
  const r = 28; const circ = 2 * Math.PI * r; const dash = (score / 10) * circ;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--admin-surface-3)" strokeWidth="4" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 6px ${color}70)` }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-black leading-none" style={{ color, fontSize: size * 0.25 }}>{score}</span>
        <span className="font-mono leading-none opacity-50" style={{ color, fontSize: size * 0.13 }}>/10</span>
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1.5 rounded-lg border transition-all flex-shrink-0"
      style={copied ? { color: ACCENT, background: `${ACCENT}15`, borderColor: `${ACCENT}35` } : { color: 'var(--admin-muted)', background: 'transparent', borderColor: 'var(--admin-border)' }}>
      {copied ? <Check size={10} /> : <Copy size={10} />}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_MAP[status] ?? { color: '#71717a' };
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide border"
      style={{ color: cfg.color, background: `${cfg.color}12`, borderColor: `${cfg.color}30` }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color, boxShadow: `0 0 4px ${cfg.color}` }} />
      {status}
    </span>
  );
}

// ─── CLIENT CARD (sidebar row) ────────────────────────────────────────────────
function ClientCard({ lead, selected, onClick }: { lead: Lead; selected: boolean; onClick: () => void }) {
  const score = lead.website_quality_score;
  const color = score != null ? SCORE_COLOR(score) : '#71717a';
  const cfg   = STATUS_MAP[lead.outreach_status] ?? { color: '#71717a' };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full text-left group relative rounded-xl border transition-all duration-200 overflow-hidden"
      style={{
        background: selected ? `${ACCENT}0a` : 'transparent',
        borderColor: selected ? `${ACCENT}35` : 'var(--admin-border)',
      }}
    >
      {/* selected accent bar */}
      {selected && (
        <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full" style={{ background: ACCENT }} />
      )}

      <div className="px-3 py-3 flex items-center gap-3">
        {/* avatar */}
        <div
          className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-[12px] font-black border"
          style={{ background: `${color}18`, color, borderColor: `${color}28` }}
        >
          {lead.business_name.slice(0, 2).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold admin-text truncate leading-tight">{lead.business_name}</p>
          <p className="text-[10px] admin-muted truncate mt-0.5">{lead.industry || 'Unknown'}</p>
        </div>

        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {score != null && (
            <span className="text-[12px] font-black leading-none" style={{ color }}>{score}</span>
          )}
          <span className="w-2 h-2 rounded-full" style={{ background: cfg.color, boxShadow: `0 0 5px ${cfg.color}` }} />
        </div>
      </div>
    </motion.button>
  );
}
// ─── CLIENT DETAIL ────────────────────────────────────────────────────────────
function ClientDetail({ lead }: { lead: Lead }) {
  const [tab, setTab]               = useState<ClientTab>('overview');
  const [report, setReport]         = useState<SiteReport | null>(null);
  const [auditing, setAuditing]     = useState(false);
  const [auditError, setAuditError] = useState('');
  const [content, setContent]       = useState<GeneratedContent | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError]     = useState('');
  const score = lead.website_quality_score;
  const scoreColor = score != null ? SCORE_COLOR(score) : '#71717a';

  const existingReport: SiteReport | null = !report && (lead.weak_points || lead.seo_quality) ? {
    score: score ?? 0,
    seo: lead.seo_quality || '—',
    mobile: lead.mobile_responsiveness || '—',
    speed: '—',
    issues: lead.weak_points ? lead.weak_points.split(/[.\n]/).filter(s => s.trim().length > 4).slice(0, 5) : [],
    suggestions: lead.possible_improvements ? lead.possible_improvements.split(/[.\n]/).filter(s => s.trim().length > 4).slice(0, 5) : [],
  } : null;
  const activeReport = report || existingReport;

  async function runAudit() {
    if (!lead.website) { setAuditError('No website URL on this lead.'); return; }
    setAuditing(true); setAuditError('');
    try {
      const res = await fetch('/api/analyze-lead', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_name: lead.business_name, industry: lead.industry, website: lead.website, ai_opportunity: lead.ai_opportunity, weak_points: lead.weak_points, possible_improvements: lead.possible_improvements }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setContent(data);
    } catch (e: unknown) { setGenError(e instanceof Error ? e.message : 'Generation failed'); }
    finally { setGenerating(false); }
  }

  return (
    <div className="h-full flex flex-col">
      {/* ── Detail header ── */}
      <div className="flex-shrink-0 pb-5 border-b mb-5" style={{ borderColor: 'var(--admin-border)' }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-[15px] font-black border flex-shrink-0"
              style={{ background: `${scoreColor}18`, color: scoreColor, borderColor: `${scoreColor}30` }}>
              {lead.business_name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-black text-[16px] admin-text leading-tight">{lead.business_name}</h2>
                <StatusBadge status={lead.outreach_status} />
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="text-[11px] admin-muted">{lead.industry || 'Unknown industry'}</span>
                {lead.website && (
                  <a href={lead.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] font-mono transition-colors"
                    style={{ color: 'var(--admin-muted)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = ACCENT)}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--admin-muted)')}>
                    <ExternalLink size={9} />{lead.website.replace(/^https?:\/\//, '').split('/')[0]}
                  </a>
                )}
              </div>
            </div>
          </div>
          {score != null && <ScoreRing score={score} size={64} />}
        </div>

        {/* quick metric strip */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-4">
          {[
            { label: 'SEO',       value: lead.seo_quality || '—',                              color: '#60a5fa' },
            { label: 'Mobile',    value: lead.mobile_responsiveness || '—',                    color: '#a78bfa' },
            { label: 'AI Opp',    value: lead.ai_opportunity || '—',                           color: ACCENT },
            { label: 'WhatsApp',  value: lead.whatsapp_integration || '—',                     color: '#25D366' },
            { label: 'Dashboard', value: lead.has_dashboard ? 'Yes' : 'No',                    color: lead.has_dashboard ? ACCENT : '#f87171' },
            { label: 'Email',     value: lead.email_sent ? 'Sent' : 'Pending',                 color: lead.email_sent ? ACCENT : '#f59e0b' },
          ].map(m => (
            <div key={m.label} className="rounded-xl border p-2 text-center"
              style={{ background: `${m.color}08`, borderColor: `${m.color}20` }}>
              <p className="text-[11px] font-bold truncate" style={{ color: m.color }}>{m.value}</p>
              <p className="text-[9px] font-mono uppercase tracking-wider mt-0.5 opacity-60" style={{ color: m.color }}>{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex-shrink-0 flex gap-1 p-1 rounded-xl border w-fit mb-5"
        style={{ background: 'var(--admin-surface-2)', borderColor: 'var(--admin-border)' }}>
        {TAB_CONFIG.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
            style={tab === t.id
              ? { background: 'var(--admin-surface-3)', color: 'var(--admin-text)', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }
              : { color: 'var(--admin-muted)' }}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {tab === 'overview' && <OverviewTab lead={lead} />}
            {tab === 'content'  && <ContentTab lead={lead} content={content} generating={generating} genError={genError} onGenerate={generateContent} />}
            {tab === 'audit'    && <AuditTab lead={lead} activeReport={activeReport} auditing={auditing} auditError={auditError} onAudit={runAudit} />}
            {tab === 'activity' && <ActivityTab lead={lead} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
// ─── OVERVIEW TAB ─────────────────────────────────────────────────────────────
function OverviewTab({ lead }: { lead: Lead }) {
  const contacts = [
    { label: 'Email',    value: lead.contact_email },
    { label: 'WhatsApp', value: lead.whatsapp_number },
    { label: 'LinkedIn', value: lead.linkedin_url },
    { label: 'Twitter',  value: lead.twitter_handle },
  ].filter(r => r.value);

  return (
    <div className="space-y-4">
      {contacts.length > 0 && (
        <div className="rounded-2xl border p-4 space-y-1" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
          <p className="text-[10px] font-bold uppercase tracking-widest admin-muted mb-3">Contact</p>
          {contacts.map(r => (
            <div key={r.label} className="flex items-center gap-3 py-1.5 border-b last:border-0" style={{ borderColor: 'var(--admin-border)' }}>
              <span className="text-[10px] font-mono uppercase tracking-wider admin-muted w-16 flex-shrink-0">{r.label}</span>
              <span className="text-[12px] admin-text truncate flex-1">{r.value}</span>
              <CopyButton text={r.value!} />
            </div>
          ))}
        </div>
      )}
      {(lead.weak_points || lead.possible_improvements) && (
        <div className="grid sm:grid-cols-2 gap-3">
          {lead.weak_points && (
            <div className="rounded-2xl border p-4" style={{ background: '#f8717108', borderColor: '#f8717125' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-2 flex items-center gap-1.5"><AlertCircle size={10} />Weak Points</p>
              <p className="text-[12px] admin-text leading-relaxed">{lead.weak_points}</p>
            </div>
          )}
          {lead.possible_improvements && (
            <div className="rounded-2xl border p-4" style={{ background: `${ACCENT}08`, borderColor: `${ACCENT}25` }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: ACCENT }}><TrendingUp size={10} />Improvements</p>
              <p className="text-[12px] admin-text leading-relaxed">{lead.possible_improvements}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── CONTENT TAB ──────────────────────────────────────────────────────────────
function ContentTab({ lead, content, generating, genError, onGenerate }: {
  lead: Lead; content: GeneratedContent | null; generating: boolean; genError: string; onGenerate: () => void;
}) {
  return (
    <div className="rounded-2xl border p-5 space-y-4" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-bold text-[13px] admin-text flex items-center gap-2"><Sparkles size={13} style={{ color: ACCENT }} />AI Website Content</h3>
          <p className="text-[11px] admin-muted mt-1">Generate copy for <span className="admin-text font-semibold">{lead.business_name}</span></p>
        </div>
        <button onClick={onGenerate} disabled={generating}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-black font-bold text-[12px] transition-all disabled:opacity-40 flex-shrink-0"
          style={{ background: ACCENT, boxShadow: generating ? 'none' : `0 0 18px ${ACCENT}40` }}>
          {generating ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
          {generating ? 'Generating…' : content ? 'Regenerate' : 'Generate'}
        </button>
      </div>
      {genError && (
        <div className="flex items-start gap-2 p-3 rounded-xl border text-red-400 text-[12px]" style={{ background: '#f8717110', borderColor: '#f8717130' }}>
          <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />{genError}
        </div>
      )}
      {generating && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 animate-ping" style={{ borderColor: `${ACCENT}30` }} />
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: `${ACCENT}15` }}>
              <Sparkles size={18} style={{ color: ACCENT }} className="animate-pulse" />
            </div>
          </div>
          <p className="text-[12px] admin-muted">Writing content for {lead.business_name}…</p>
        </div>
      )}
      {!generating && !content && !genError && (
        <div className="flex flex-col items-center justify-center py-10 gap-3 rounded-xl border border-dashed" style={{ borderColor: 'var(--admin-border-md)' }}>
          <PenTool size={18} className="opacity-30" style={{ color: ACCENT }} />
          <p className="text-[12px] admin-muted">Click Generate to create website copy</p>
        </div>
      )}
      {content && !generating && (
        <div className="space-y-3">
          {([
            { key: 'tagline', label: 'Tagline',        color: '#f59e0b', icon: <Star size={10} /> },
            { key: 'hero',    label: 'Hero Section',   color: '#60a5fa', icon: <Eye size={10} /> },
            { key: 'about',   label: 'About Section',  color: '#a78bfa', icon: <Users size={10} /> },
            { key: 'cta',     label: 'Call to Action', color: ACCENT,    icon: <TrendingUp size={10} /> },
          ] as const).map(({ key, label, color, icon }) => (
            <div key={key} className="p-4 rounded-xl border" style={{ background: 'var(--admin-surface-2)', borderColor: 'var(--admin-border)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color }}>{icon}{label}</span>
                <CopyButton text={content[key]} />
              </div>
              <p className="text-[13px] admin-text leading-relaxed">{content[key]}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── AUDIT TAB ────────────────────────────────────────────────────────────────
function AuditTab({ lead, activeReport, auditing, auditError, onAudit }: {
  lead: Lead; activeReport: SiteReport | null; auditing: boolean; auditError: string; onAudit: () => void;
}) {
  return (
    <div className="rounded-2xl border p-5 space-y-4" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-bold text-[13px] admin-text flex items-center gap-2"><Zap size={13} style={{ color: '#60a5fa' }} />Website Audit</h3>
          <p className="text-[11px] admin-muted mt-1">
            {lead.website ? <span className="font-mono admin-text">{lead.website.replace(/^https?:\/\//, '').split('/')[0]}</span> : 'No website URL'}
          </p>
        </div>
        <button onClick={onAudit} disabled={auditing || !lead.website}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-[12px] transition-all disabled:opacity-40 flex-shrink-0 text-black"
          style={{ background: '#60a5fa', boxShadow: auditing ? 'none' : '0 0 18px #60a5fa40' }}>
          {auditing ? <RefreshCw size={12} className="animate-spin" /> : <Zap size={12} />}
          {auditing ? 'Auditing…' : activeReport ? 'Re-audit' : 'Run Audit'}
        </button>
      </div>
      {auditError && (
        <div className="flex items-start gap-2 p-3 rounded-xl border text-red-400 text-[12px]" style={{ background: '#f8717110', borderColor: '#f8717130' }}>
          <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />{auditError}
        </div>
      )}
      {auditing && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 animate-ping" style={{ borderColor: '#60a5fa30' }} />
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: '#60a5fa15' }}>
              <Globe size={18} className="animate-pulse" style={{ color: '#60a5fa' }} />
            </div>
          </div>
          <p className="text-[12px] admin-muted font-mono">{lead.website}</p>
        </div>
      )}
      {!auditing && !activeReport && !auditError && (
        <div className="flex flex-col items-center justify-center py-10 gap-3 rounded-xl border border-dashed" style={{ borderColor: 'var(--admin-border-md)' }}>
          <Globe size={18} className="opacity-30" style={{ color: '#60a5fa' }} />
          <p className="text-[12px] admin-muted">{lead.website ? 'Click Run Audit to analyse the site' : 'Add a website URL in the Audience panel first'}</p>
        </div>
      )}
      {activeReport && !auditing && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-xl border" style={{ background: 'var(--admin-surface-2)', borderColor: 'var(--admin-border)' }}>
            <ScoreRing score={activeReport.score} size={64} />
            <div className="grid grid-cols-3 gap-2 flex-1">
              {[
                { label: 'SEO',    value: activeReport.seo,    color: '#60a5fa' },
                { label: 'Mobile', value: activeReport.mobile, color: '#a78bfa' },
                { label: 'Speed',  value: activeReport.speed,  color: '#f59e0b' },
              ].map(m => (
                <div key={m.label} className="text-center p-2 rounded-lg border" style={{ background: `${m.color}08`, borderColor: `${m.color}20` }}>
                  <p className="text-[11px] font-bold" style={{ color: m.color }}>{m.value}</p>
                  <p className="text-[9px] font-mono uppercase tracking-wider mt-0.5 opacity-60" style={{ color: m.color }}>{m.label}</p>
                </div>
              ))}
            </div>
          </div>
          {activeReport.issues.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-2 flex items-center gap-1.5"><AlertCircle size={10} />Issues Found</p>
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
          {activeReport.suggestions.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: ACCENT }}><CheckCircle2 size={10} />Recommendations</p>
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
  );
}

// ─── ACTIVITY TAB ─────────────────────────────────────────────────────────────
function ActivityTab({ lead }: { lead: Lead }) {
  const steps = [
    { label: 'Lead created',   done: true,               color: '#71717a', date: lead.created_at,    desc: 'Added to pipeline' },
    { label: 'Email sent',     done: lead.email_sent,    color: '#60a5fa', date: lead.last_contacted, desc: 'Initial outreach sent' },
    { label: 'Reply received', done: lead.reply_received,color: ACCENT,    date: null,                desc: 'Prospect responded' },
    { label: 'Meeting booked', done: lead.meeting_booked,color: '#a78bfa', date: lead.follow_up_date, desc: 'Discovery call scheduled' },
  ];
  return (
    <div className="rounded-2xl border p-5 space-y-4" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
      <p className="text-[10px] font-bold uppercase tracking-widest admin-muted">Outreach Timeline</p>
      <div className="relative space-y-0">
        <div className="absolute left-[11px] top-3 bottom-3 w-px" style={{ background: 'var(--admin-border-md)' }} />
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-3 py-3 relative">
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border-2 z-10 transition-all"
              style={step.done
                ? { background: step.color, borderColor: step.color, boxShadow: `0 0 8px ${step.color}50` }
                : { background: 'var(--admin-surface)', borderColor: 'var(--admin-border-lg)' }}>
              {step.done ? <Check size={10} className="text-black" /> : <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--admin-border-lg)' }} />}
            </div>
            <div className="flex-1 flex items-start justify-between gap-2 pt-0.5">
              <div>
                <p className="text-[12px] font-semibold leading-tight" style={{ color: step.done ? 'var(--admin-text)' : 'var(--admin-muted)' }}>{step.label}</p>
                <p className="text-[10px] mt-0.5" style={{ color: step.done ? 'var(--admin-muted)' : 'var(--admin-subtle)' }}>{step.desc}</p>
              </div>
              {step.date && <p className="text-[10px] admin-muted font-mono flex-shrink-0 mt-0.5">{new Date(step.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>}
            </div>
          </div>
        ))}
      </div>
      {lead.follow_up_date && (
        <div className="p-3.5 rounded-xl border flex items-center gap-3" style={{ borderColor: `${ACCENT}30`, background: `${ACCENT}08` }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${ACCENT}20` }}>
            <Clock size={14} style={{ color: ACCENT }} />
          </div>
          <div>
            <p className="text-[12px] font-bold" style={{ color: ACCENT }}>Follow-up scheduled</p>
            <p className="text-[11px] admin-muted mt-0.5">{new Date(lead.follow_up_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
export default function SAIPanel() {
  const { leads, loading } = useLeads();
  const [selected, setSelected] = useState<Lead | null>(null);
  const [search, setSearch]     = useState('');

  const clients = useMemo(() =>
    leads.filter(l => l.outreach_status === 'Sent' || l.outreach_status === 'Replied' || l.outreach_status === 'Meeting Booked' || l.reply_received || l.meeting_booked),
    [leads]);
  const prospects = useMemo(() => leads.filter(l => !clients.includes(l)), [leads, clients]);

  const filtered = (list: Lead[]) =>
    list.filter(l =>
      l.business_name.toLowerCase().includes(search.toLowerCase()) ||
      (l.industry || '').toLowerCase().includes(search.toLowerCase())
    );

  const scoredLeads = leads.filter(l => l.website_quality_score != null);
  const stats = useMemo(() => ({
    total:    leads.length,
    clients:  clients.length,
    avgScore: scoredLeads.length ? Math.round(scoredLeads.reduce((s, l) => s + l.website_quality_score!, 0) / scoredLeads.length * 10) / 10 : null,
    highOpp:  leads.filter(l => l.ai_opportunity === 'High').length,
  }), [leads, clients, scoredLeads]);

  return (
    <div className="flex h-[calc(100vh-140px)] gap-0 overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--admin-border)' }}>

      {/* ══ LEFT SIDEBAR ══════════════════════════════════════════════════════ */}
      <div className="w-[300px] flex-shrink-0 flex flex-col border-r" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>

        {/* Sidebar header */}
        <div className="flex-shrink-0 p-4 border-b" style={{ borderColor: 'var(--admin-border)' }}>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center border flex-shrink-0"
              style={{ background: `${ACCENT}15`, borderColor: `${ACCENT}30`, boxShadow: `0 0 14px ${ACCENT}20` }}>
              <BrainCircuit size={15} style={{ color: ACCENT }} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-[13px] admin-text leading-none">Spacze AI</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full border font-mono"
                  style={{ color: ACCENT, background: `${ACCENT}12`, borderColor: `${ACCENT}25` }}>SAI</span>
              </div>
              <p className="text-[10px] admin-muted mt-0.5">Command Center</p>
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {[
              { label: 'Leads',    value: loading ? '—' : stats.total,                                        color: '#60a5fa', icon: Users },
              { label: 'Clients',  value: loading ? '—' : stats.clients,                                      color: ACCENT,    icon: CheckCircle2 },
              { label: 'Avg Score',value: loading ? '—' : stats.avgScore != null ? `${stats.avgScore}/10` : '—', color: '#f59e0b', icon: Activity },
              { label: 'High Opp', value: loading ? '—' : stats.highOpp,                                      color: '#a78bfa', icon: Sparkles },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="rounded-xl border p-2.5 flex items-center gap-2"
                style={{ background: `${color}08`, borderColor: `${color}18` }}>
                <Icon size={12} style={{ color }} className="flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[13px] font-black leading-none admin-text">{value}</p>
                  <p className="text-[9px] font-mono uppercase tracking-wider mt-0.5 truncate" style={{ color: `${color}80` }}>{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--admin-muted)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              className="admin-input w-full pl-8 pr-3 py-2 text-[12px] rounded-xl" />
          </div>
        </div>

        {/* Lead list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-10">
              <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${ACCENT}40`, borderTopColor: ACCENT }} />
            </div>
          )}

          {!loading && leads.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
              <Users size={20} className="opacity-30" style={{ color: ACCENT }} />
              <p className="text-[11px] admin-muted">No leads yet</p>
            </div>
          )}

          {filtered(clients).length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[9px] font-bold uppercase tracking-widest admin-muted px-1 flex items-center gap-1.5">
                Active Clients
                <span className="px-1.5 py-0.5 rounded-full text-black font-black text-[9px]" style={{ background: ACCENT }}>{filtered(clients).length}</span>
              </p>
              {filtered(clients).map(l => (
                <ClientCard key={l.id} lead={l} selected={selected?.id === l.id} onClick={() => setSelected(l)} />
              ))}
            </div>
          )}

          {filtered(prospects).length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[9px] font-bold uppercase tracking-widest admin-muted px-1 flex items-center gap-1.5">
                Prospects
                <span className="px-1.5 py-0.5 rounded-full border text-[9px] font-bold"
                  style={{ color: 'var(--admin-muted)', background: 'var(--admin-surface-3)', borderColor: 'var(--admin-border)' }}>
                  {filtered(prospects).length}
                </span>
              </p>
              {filtered(prospects).map(l => (
                <ClientCard key={l.id} lead={l} selected={selected?.id === l.id} onClick={() => setSelected(l)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ══ RIGHT DETAIL PANE ═════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto p-6" style={{ background: 'var(--admin-surface-2)' }}>
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div key={selected.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
              <ClientDetail lead={selected} />
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center border"
                style={{ background: `${ACCENT}10`, borderColor: `${ACCENT}20` }}>
                <Target size={24} style={{ color: ACCENT }} className="opacity-50" />
              </div>
              <div>
                <p className="text-[14px] font-bold admin-text">Select a lead</p>
                <p className="text-[12px] admin-muted mt-1">Choose a client or prospect from the sidebar to begin diagnostics</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
