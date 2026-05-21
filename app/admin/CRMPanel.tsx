'use client';

import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, Save, Trash2, Search, ChevronDown, Mail,
  MessageCircle, Linkedin, Twitter, Filter, Download,
  CheckSquare, Square, Zap, RefreshCw, Sparkles, Users,
  TrendingUp, Clock, Star,
} from 'lucide-react';
import { Lead } from '@/lib/supabase';
import { OUTREACH_STATUSES, RESPONSE_STATUSES } from '@/lib/constants';
import { useToast } from '@/app/components/Toast';
import { useLeads } from '@/lib/hooks';
import ModalPortal from '@/app/components/ModalPortal';

const ACCENT = '#00D67D';

const EMPTY_LEAD: Omit<Lead, 'id' | 'created_at'> = {
  business_name: '', website: '', industry: '', contact_email: '',
  whatsapp_number: '', linkedin_url: '', twitter_handle: '',
  website_quality_score: null, mobile_responsiveness: '', whatsapp_integration: '',
  seo_quality: '', has_dashboard: false, ai_opportunity: '', weak_points: '',
  possible_improvements: '', last_contacted: null, follow_up_date: null,
  response_status: 'None', outreach_status: 'Pending',
  email_sent: false, reply_received: false, meeting_booked: false,
  generated_subject: '', generated_email: '',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
  'Pending':        { bg: 'bg-amber-500/10',   text: 'text-amber-400',   dot: '#f59e0b' },
  'Sent':           { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: '#10b981' },
  'Replied':        { bg: 'bg-blue-500/10',    text: 'text-blue-400',    dot: '#60a5fa' },
  'Meeting Booked': { bg: 'bg-purple-500/10',  text: 'text-purple-400',  dot: '#a78bfa' },
  'Not Interested': { bg: 'bg-red-500/10',     text: 'text-red-400',     dot: '#f87171' },
};

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { bg: 'bg-zinc-500/10', text: 'text-zinc-400', dot: '#71717a' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
      {status}
    </span>
  );
}

function ScorePill({ score }: { score: number | null }) {
  if (score === null) return <span className="text-[11px] font-mono admin-muted">—</span>;
  const color = score >= 7 ? '#10b981' : score >= 4 ? '#f59e0b' : '#f87171';
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold font-mono"
      style={{ color }}>
      {score}<span className="opacity-40 font-normal">/10</span>
    </span>
  );
}

function Avatar({ name, size = 8 }: { name: string; size?: number }) {
  const colors = ['#00D67D', '#60a5fa', '#a78bfa', '#f59e0b', '#f87171', '#34d399'];
  const idx = name.charCodeAt(0) % colors.length;
  return (
    <div className={`w-${size} h-${size} rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold text-black`}
      style={{ background: colors[idx] }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function exportCSV(leads: Lead[]) {
  const cols: (keyof Lead)[] = [
    'business_name','contact_email','industry','website','whatsapp_number',
    'linkedin_url','twitter_handle','website_quality_score','seo_quality',
    'mobile_responsiveness','ai_opportunity','outreach_status','response_status',
    'email_sent','reply_received','meeting_booked','follow_up_date','last_contacted',
    'weak_points','possible_improvements','created_at',
  ];
  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = [cols.join(','), ...leads.map(l => cols.map(c => esc(l[c])).join(','))];
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `spacze-leads-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

// ── LeadModal ────────────────────────────────────────────────────────────────
function LeadModal({ editId, form, setForm, onClose, onSave, saving, saveError }: {
  editId: string | null;
  form: Omit<Lead, 'id' | 'created_at'>;
  setForm: React.Dispatch<React.SetStateAction<Omit<Lead, 'id' | 'created_at'>>>;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
  saveError: string;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const blur = useCallback((key: string) => (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [key]: e.target.value }));
  }, [setForm]);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button,input,select,textarea,[tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
      else { if (document.activeElement === last) { e.preventDefault(); first.focus(); } }
    }
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); prev?.focus(); };
  }, [onClose]);

  const inp = [
    'w-full rounded-xl px-4 py-2.5 text-[13px] leading-snug',
    'bg-[var(--admin-input-bg)] border admin-border-md admin-text',
    'placeholder:admin-subtle',
    'focus:outline-none focus:border-[#00D67D]/50 focus:ring-1 focus:ring-[#00D67D]/20',
    'transition-colors duration-150',
  ].join(' ');
  const sel = `${inp} cursor-pointer appearance-none`;

  const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
    <div>
      <label className="block text-[11px] font-semibold admin-muted mb-1.5">
        {label}{required && <span className="text-[#00D67D] ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );

  const Divider = ({ title }: { title: string }) => (
    <div className="sm:col-span-2 flex items-center gap-3 pt-1">
      <span className="text-[10px] font-bold uppercase tracking-widest admin-muted whitespace-nowrap">{title}</span>
      <div className="flex-1 h-px bg-[var(--admin-divider)]" />
    </div>
  );

  return (
    <ModalPortal>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-sm"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true"
          initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 32, stiffness: 320 }}
          className="w-full sm:max-w-xl bg-[var(--admin-surface)] border admin-border-md rounded-t-[2rem] sm:rounded-2xl shadow-2xl flex flex-col outline-none max-h-[92vh] sm:max-h-[88vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b admin-border flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${ACCENT}18` }}>
                <Users size={14} style={{ color: ACCENT }} />
              </div>
              <div>
                <h2 className="font-bold text-[14px] admin-text leading-none">{editId ? 'Edit Lead' : 'Add Lead'}</h2>
                <p className="text-[11px] admin-muted mt-0.5">{editId ? 'Update details below' : 'Fill in what you know — edit anytime'}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center admin-muted hover:admin-text hover:bg-[var(--admin-hover-bg)] transition-colors">
              <X size={15} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">

              <Divider title="Core Info" />

              <div className="sm:col-span-2">
                <Field label="Business Name" required>
                  <input key={`bn-${editId}`} defaultValue={form.business_name} onBlur={blur('business_name')} placeholder="Acme Corp" className={inp} autoComplete="off" />
                </Field>
              </div>

              <Field label="Contact Email" required>
                <input key={`ce-${editId}`} type="email" defaultValue={form.contact_email} onBlur={blur('contact_email')} placeholder="hello@acme.com" className={inp} autoComplete="off" inputMode="email" />
              </Field>

              <Field label="Industry">
                <input key={`ind-${editId}`} defaultValue={form.industry} onBlur={blur('industry')} placeholder="E-Commerce" className={inp} autoComplete="off" />
              </Field>

              <Field label="Website">
                <input key={`web-${editId}`} type="url" defaultValue={form.website} onBlur={blur('website')} placeholder="https://acme.com" className={inp} autoComplete="off" inputMode="url" />
              </Field>

              <Field label="Website Quality (0–10)">
                <input key={`wq-${editId}`} type="number" min={0} max={10} defaultValue={form.website_quality_score ?? ''} onBlur={e => setForm(f => ({ ...f, website_quality_score: e.target.value ? Number(e.target.value) : null }))} placeholder="7" className={inp} inputMode="numeric" />
              </Field>

              <Divider title="Contact Channels" />

              <Field label="WhatsApp Number">
                <input key={`wa-${editId}`} type="tel" defaultValue={form.whatsapp_number} onBlur={blur('whatsapp_number')} placeholder="+2348012345678" className={inp} autoComplete="off" inputMode="tel" />
              </Field>

              <Field label="LinkedIn URL">
                <input key={`li-${editId}`} defaultValue={form.linkedin_url} onBlur={blur('linkedin_url')} placeholder="linkedin.com/in/username" className={inp} autoComplete="off" />
              </Field>

              <div className="sm:col-span-2">
                <Field label="Twitter Handle">
                  <input key={`tw-${editId}`} defaultValue={form.twitter_handle} onBlur={blur('twitter_handle')} placeholder="@handle" className={inp} autoComplete="off" />
                </Field>
              </div>

              <Divider title="Site Audit" />

              {([
                { label: 'Mobile Responsiveness', key: 'mobile_responsiveness', opts: ['Good', 'Average', 'Poor', 'None'] },
                { label: 'WhatsApp Integration',  key: 'whatsapp_integration',  opts: ['Yes', 'No', 'Partial'] },
                { label: 'SEO Quality',           key: 'seo_quality',           opts: ['Good', 'Average', 'Poor', 'None'] },
                { label: 'AI Opportunity',        key: 'ai_opportunity',        opts: ['High', 'Medium', 'Low', 'None'] },
              ] as const).map(({ label, key, opts }) => (
                <div key={key} className="relative">
                  <Field label={label}>
                    <select value={(form as Record<string, unknown>)[key] as string || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className={sel}>
                      <option value="">Select…</option>
                      {opts.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-3.5 bottom-3 admin-muted pointer-events-none" />
                  </Field>
                </div>
              ))}

              <Divider title="Outreach Status" />

              {([
                { label: 'Outreach Status', key: 'outreach_status', opts: [...OUTREACH_STATUSES] },
                { label: 'Response Status', key: 'response_status', opts: [...RESPONSE_STATUSES] },
              ] as const).map(({ label, key, opts }) => (
                <div key={key} className="relative">
                  <Field label={label}>
                    <select value={(form as Record<string, unknown>)[key] as string || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className={sel}>
                      <option value="">Select…</option>
                      {opts.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-3.5 bottom-3 admin-muted pointer-events-none" />
                  </Field>
                </div>
              ))}

              <Field label="Last Contacted">
                <input type="date" value={(form.last_contacted as string) || ''} onChange={e => setForm(f => ({ ...f, last_contacted: e.target.value || null }))} className={inp} />
              </Field>

              <Field label="Follow-Up Date">
                <input type="date" value={(form.follow_up_date as string) || ''} onChange={e => setForm(f => ({ ...f, follow_up_date: e.target.value || null }))} className={inp} />
              </Field>

              <Divider title="Flags" />

              <div className="sm:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {([
                  { label: 'Has Dashboard',  key: 'has_dashboard' },
                  { label: 'Email Sent',     key: 'email_sent' },
                  { label: 'Reply Received', key: 'reply_received' },
                  { label: 'Meeting Booked', key: 'meeting_booked' },
                ] as const).map(({ label, key }) => {
                  const checked = !!(form as Record<string, unknown>)[key];
                  return (
                    <label key={key} className={`flex items-center gap-2 cursor-pointer px-3 py-2.5 rounded-xl border transition-all ${checked ? 'border-[#00D67D]/30 bg-[#00D67D]/8 text-[#00D67D]' : 'border-[var(--admin-border-md)] bg-[var(--admin-hover-bg)] admin-muted hover:border-[var(--admin-border-lg)]'}`}>
                      <input type="checkbox" checked={checked} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} className="sr-only" />
                      <div className={`w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${checked ? 'bg-[#00D67D] border-[#00D67D]' : 'border-[var(--admin-border-lg)]'}`}>
                        {checked && <span className="text-black text-[8px] font-black leading-none">✓</span>}
                      </div>
                      <span className="text-[11px] font-medium leading-tight">{label}</span>
                    </label>
                  );
                })}
              </div>

              <Divider title="Notes" />

              {([
                { label: 'Weak Points',           key: 'weak_points',           placeholder: 'Poor mobile UX, no SEO…' },
                { label: 'Possible Improvements', key: 'possible_improvements', placeholder: 'Add dashboard, improve speed…' },
              ] as const).map(({ label, key, placeholder }) => (
                <div key={key} className="sm:col-span-2">
                  <Field label={label}>
                    <textarea key={`${key}-${editId}`} rows={3} defaultValue={(form as Record<string, unknown>)[key] as string || ''} onBlur={blur(key)} placeholder={placeholder} className={`${inp} resize-none`} />
                  </Field>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 px-6 py-4 border-t admin-border space-y-3">
            {saveError && (
              <p className="text-red-400 text-[12px] text-center px-3 py-2 rounded-xl bg-red-500/8 border border-red-500/20">{saveError}</p>
            )}
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-[13px] font-medium admin-muted hover:admin-text border admin-border hover:bg-[var(--admin-hover-bg)] transition-colors">
                Cancel
              </button>
              <button onClick={onSave} disabled={saving}
                className="flex-[2] flex items-center justify-center gap-2 py-2.5 rounded-xl text-black font-bold text-[13px] transition-all disabled:opacity-60 hover:opacity-90"
                style={{ background: 'var(--accent)' }}>
                <Save size={13} />
                {saving ? 'Saving…' : editId ? 'Update Lead' : 'Add Lead'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </ModalPortal>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function CRMPanel() {
  const { leads, loading, refresh: fetchLeads } = useLeads();
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showForm, setShowForm]         = useState(false);
  const [editId, setEditId]             = useState<string | null>(null);
  const [form, setForm]                 = useState<Omit<Lead, 'id' | 'created_at'>>(EMPTY_LEAD);
  const [saving, setSaving]             = useState(false);
  const [saveError, setSaveError]       = useState('');
  const [selected, setSelected]         = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus]     = useState('');
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [analysisState, setAnalysisState] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const analyzeLead = useCallback(async (lead: Lead) => {
    if (!lead.id || !lead.website) { toast('error', 'Lead needs a website URL to analyse'); return; }
    setAnalysisState(prev => ({ ...prev, [lead.id!]: 'scraping' }));
    try {
      const res = await fetch('/api/analyze-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id, website: lead.website, business_name: lead.business_name, industry: lead.industry }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Analysis failed'); }
      setAnalysisState(prev => ({ ...prev, [lead.id!]: 'done' }));
      toast('success', `"${lead.business_name}" analysed — score updated`);
      fetchLeads();
    } catch (err: unknown) {
      setAnalysisState(prev => ({ ...prev, [lead.id!]: 'error' }));
      toast('error', err instanceof Error ? err.message : 'Analysis failed');
    }
  }, [toast, fetchLeads]);

  const filtered = useMemo(() => leads.filter(l => {
    const q = search.toLowerCase();
    const matchSearch = l.business_name?.toLowerCase().includes(q) || l.contact_email?.toLowerCase().includes(q) || l.industry?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'All' || l.outreach_status === statusFilter;
    return matchSearch && matchStatus;
  }), [leads, search, statusFilter]);

  // Stats
  const stats = useMemo(() => ({
    total:    leads.length,
    sent:     leads.filter(l => l.outreach_status === 'Sent').length,
    replied:  leads.filter(l => l.reply_received).length,
    meetings: leads.filter(l => l.meeting_booked).length,
  }), [leads]);

  const allSelected = filtered.length > 0 && filtered.every(l => selected.has(l.id!));
  function toggleAll() { setSelected(allSelected ? new Set() : new Set(filtered.map(l => l.id!))); }
  function toggleOne(id: string) { setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }); }

  async function applyBulkStatus() {
    if (!bulkStatus || selected.size === 0) return;
    setBulkUpdating(true);
    let ok = 0; let fail = 0;
    for (const id of selected) {
      const res = await fetch(`/api/leads?id=${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ outreach_status: bulkStatus }) });
      res.ok ? ok++ : fail++;
    }
    await fetchLeads(); setSelected(new Set()); setBulkStatus(''); setBulkUpdating(false);
    if (fail === 0) toast('success', `Updated ${ok} lead${ok !== 1 ? 's' : ''} to "${bulkStatus}"`);
    else toast('error', `${ok} updated, ${fail} failed`);
  }

  const openAdd  = useCallback(() => { setForm({ ...EMPTY_LEAD }); setEditId(null); setSaveError(''); setShowForm(true); }, []);
  const openEdit = useCallback((lead: Lead) => {
    const { id, created_at, ...fields } = lead as Lead & { id: string; created_at: string };
    setForm(fields); setEditId(id ?? null); setSaveError(''); setShowForm(true);
  }, []);
  const closeForm = useCallback(() => { setShowForm(false); setEditId(null); setSaveError(''); }, []);

  const saveLead = useCallback(async () => {
    if (!form.business_name.trim() || !form.contact_email.trim()) { setSaveError('Business name and contact email are required.'); return; }
    setSaving(true); setSaveError('');
    try {
      const res = editId
        ? await fetch(`/api/leads?id=${editId}`, { method: 'PUT',  headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
        : await fetch('/api/leads',               { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed to save lead'); }
      const saved = await res.json();
      closeForm(); await fetchLeads();
      toast('success', editId ? 'Lead updated' : 'Lead added — analysing website…');
      if (!editId && form.website?.trim()) analyzeLead({ ...saved, website: form.website, business_name: form.business_name, industry: form.industry });
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save lead.');
    } finally { setSaving(false); }
  }, [form, editId, closeForm, fetchLeads, toast, analyzeLead]);

  async function deleteLead(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/leads?id=${id}`, { method: 'DELETE' });
    if (res.ok) { await fetchLeads(); toast('success', `"${name}" deleted`); }
    else toast('error', 'Failed to delete lead');
  }

  const STAT_CARDS = [
    { label: 'Total Leads',   value: stats.total,    icon: Users,       color: '#60a5fa' },
    { label: 'Contacted',     value: stats.sent,     icon: TrendingUp,  color: ACCENT },
    { label: 'Replied',       value: stats.replied,  icon: Clock,       color: '#a78bfa' },
    { label: 'Meetings',      value: stats.meetings, icon: Star,        color: '#f59e0b' },
  ];

  return (
    <div className="space-y-5 max-w-full min-w-0 pb-16">

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STAT_CARDS.map(({ label, value, icon: Icon, color }) => (
          <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="admin-card p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}18` }}>
              <Icon size={16} style={{ color }} />
            </div>
            <div className="min-w-0">
              <p className="text-[22px] font-black admin-text leading-none">{loading ? '—' : value}</p>
              <p className="text-[11px] admin-muted mt-0.5 truncate">{label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        {/* Search */}
        <div className="relative flex-1 sm:max-w-sm group">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 admin-muted group-focus-within:text-[#00D67D] transition-colors pointer-events-none" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email, industry…"
            className="admin-input w-full pl-9 pr-4 py-2.5 text-[13px] rounded-xl"
          />
        </div>

        {/* Status filter */}
        <div className="relative min-w-[160px]">
          <Filter size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 admin-muted pointer-events-none" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="admin-input w-full pl-9 pr-8 py-2.5 text-[13px] rounded-xl cursor-pointer appearance-none">
            <option value="All">All Statuses</option>
            {OUTREACH_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 admin-muted pointer-events-none" />
        </div>

        <div className="flex items-center gap-2 sm:ml-auto flex-shrink-0">
          <button onClick={() => exportCSV(filtered)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border admin-border admin-surface-2 admin-hover admin-muted hover:admin-text text-[12px] font-medium transition-all">
            <Download size={13} /> <span className="hidden sm:inline">Export</span>
          </button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={openAdd}
            className="flex items-center gap-1.5 px-4 py-2.5 text-black font-bold text-[12px] rounded-xl transition-all"
            style={{ background: 'var(--accent)', boxShadow: '0 0 20px rgba(0,214,125,0.2)' }}>
            <Plus size={14} /> Add Lead
          </motion.button>
        </div>
      </div>

      {/* ── Desktop table ── */}
      <div className="hidden md:block admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="border-b admin-border bg-[var(--admin-surface-2)]">
              <tr>
                <th className="px-5 py-3.5 w-10">
                  <button onClick={toggleAll} className="admin-muted hover:admin-text transition-colors">
                    {allSelected ? <CheckSquare size={15} style={{ color: ACCENT }} /> : <Square size={15} />}
                  </button>
                </th>
                <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider admin-muted">Business</th>
                <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider admin-muted">Contact</th>
                <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider admin-muted">Status</th>
                <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider admin-muted">Score</th>
                <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider admin-muted">Channels</th>
                <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider admin-muted text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--admin-divider)]">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-4"><div className="skeleton w-4 h-4 rounded" /></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="skeleton w-8 h-8 rounded-full flex-shrink-0" />
                        <div className="space-y-1.5"><div className="skeleton h-3 w-28 rounded" /><div className="skeleton h-2.5 w-16 rounded" /></div>
                      </div>
                    </td>
                    <td className="px-5 py-4"><div className="skeleton h-3 w-36 rounded" /></td>
                    <td className="px-5 py-4"><div className="skeleton h-5 w-20 rounded-full" /></td>
                    <td className="px-5 py-4"><div className="skeleton h-5 w-10 rounded" /></td>
                    <td className="px-5 py-4"><div className="flex gap-1.5"><div className="skeleton w-6 h-6 rounded-md" /><div className="skeleton w-6 h-6 rounded-md" /><div className="skeleton w-6 h-6 rounded-md" /></div></td>
                    <td className="px-5 py-4"><div className="skeleton h-6 w-14 rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Users size={28} className="admin-muted opacity-30" />
                      <p className="text-sm admin-muted">No leads found</p>
                      {search && <p className="text-[11px] admin-subtle">Try a different search term</p>}
                    </div>
                  </td>
                </tr>
              ) : filtered.map(lead => {
                const isSelected = selected.has(lead.id!);
                const st = analysisState[lead.id!] || 'idle';
                return (
                  <tr key={lead.id} className={`group transition-colors ${isSelected ? 'bg-[#00D67D]/4' : 'hover:bg-[var(--admin-hover-bg)]'}`}>
                    <td className="px-5 py-3.5">
                      <button onClick={() => toggleOne(lead.id!)} className="admin-muted hover:admin-text transition-colors">
                        {isSelected ? <CheckSquare size={15} style={{ color: ACCENT }} /> : <Square size={15} />}
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={lead.business_name} size={8} />
                        <div className="min-w-0">
                          <p className="font-semibold text-[13px] admin-text truncate max-w-[150px]">{lead.business_name}</p>
                          <p className="text-[11px] admin-muted truncate max-w-[150px]">{lead.industry || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-[12px] admin-text-2 truncate max-w-[180px]">{lead.contact_email}</p>
                      {lead.follow_up_date && (
                        <p className={`text-[10px] mt-0.5 font-mono ${new Date(lead.follow_up_date) < new Date() ? 'text-red-400' : 'admin-muted'}`}>
                          ↻ {lead.follow_up_date}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusPill status={lead.outreach_status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <ScorePill score={lead.website_quality_score} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span title="Email"    className={`p-1.5 rounded-lg transition-colors ${lead.contact_email   ? 'bg-blue-500/10 text-blue-400'    : 'bg-[var(--admin-surface-3)] admin-subtle opacity-40'}`}><Mail          size={12} /></span>
                        <span title="WhatsApp" className={`p-1.5 rounded-lg transition-colors ${lead.whatsapp_number ? 'bg-[#25D366]/10 text-[#25D366]'  : 'bg-[var(--admin-surface-3)] admin-subtle opacity-40'}`}><MessageCircle size={12} /></span>
                        <span title="LinkedIn" className={`p-1.5 rounded-lg transition-colors ${lead.linkedin_url    ? 'bg-blue-500/10 text-blue-500'    : 'bg-[var(--admin-surface-3)] admin-subtle opacity-40'}`}><Linkedin      size={12} /></span>
                        <span title="Twitter"  className={`p-1.5 rounded-lg transition-colors ${lead.twitter_handle  ? 'bg-sky-500/10 text-sky-400'      : 'bg-[var(--admin-surface-3)] admin-subtle opacity-40'}`}><Twitter       size={12} /></span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {lead.website && (
                          <button onClick={() => analyzeLead(lead)} disabled={st === 'scraping' || st === 'analysing'} title="AI-analyse website"
                            className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${st === 'done' ? 'text-[#00D67D] bg-[#00D67D]/10' : st === 'error' ? 'text-red-400 bg-red-500/10' : 'text-purple-400 bg-purple-500/10 hover:bg-purple-500/20'}`}>
                            {(st === 'scraping' || st === 'analysing') ? <RefreshCw size={13} className="animate-spin" /> : st === 'done' ? <Sparkles size={13} /> : <Zap size={13} />}
                          </button>
                        )}
                        <button onClick={() => openEdit(lead)}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold admin-muted hover:admin-text bg-[var(--admin-hover-bg)] hover:bg-[var(--admin-surface-3)] transition-colors">
                          Edit
                        </button>
                        <button onClick={() => deleteLead(lead.id!, lead.business_name)}
                          className="p-1.5 rounded-lg text-red-400/60 hover:text-red-400 bg-red-500/8 hover:bg-red-500/15 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Table footer */}
        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t admin-border flex items-center justify-between">
            <p className="text-[11px] admin-muted">
              {filtered.length} lead{filtered.length !== 1 ? 's' : ''}
              {statusFilter !== 'All' && ` · filtered by "${statusFilter}"`}
            </p>
            {selected.size > 0 && (
              <p className="text-[11px]" style={{ color: ACCENT }}>{selected.size} selected</p>
            )}
          </div>
        )}
      </div>

      {/* ── Mobile cards ── */}
      <div className="md:hidden space-y-2.5">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="admin-card p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="skeleton w-9 h-9 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1.5"><div className="skeleton h-3 w-36 rounded" /><div className="skeleton h-2.5 w-24 rounded" /></div>
                <div className="skeleton h-5 w-16 rounded-full" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center admin-muted text-sm">No leads found.</div>
        ) : filtered.map(lead => {
          const st = analysisState[lead.id!] || 'idle';
          return (
            <motion.div key={lead.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="admin-card p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar name={lead.business_name} size={9} />
                  <div className="min-w-0">
                    <p className="font-semibold text-[13px] admin-text truncate">{lead.business_name}</p>
                    <p className="text-[11px] admin-muted truncate mt-0.5">{lead.contact_email}</p>
                  </div>
                </div>
                <StatusPill status={lead.outreach_status} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className={`p-1.5 rounded-lg ${lead.contact_email   ? 'bg-blue-500/10 text-blue-400'   : 'bg-[var(--admin-surface-3)] admin-subtle opacity-40'}`}><Mail          size={12} /></span>
                  <span className={`p-1.5 rounded-lg ${lead.whatsapp_number ? 'bg-[#25D366]/10 text-[#25D366]' : 'bg-[var(--admin-surface-3)] admin-subtle opacity-40'}`}><MessageCircle size={12} /></span>
                  <span className={`p-1.5 rounded-lg ${lead.linkedin_url    ? 'bg-blue-500/10 text-blue-500'   : 'bg-[var(--admin-surface-3)] admin-subtle opacity-40'}`}><Linkedin      size={12} /></span>
                  <span className={`p-1.5 rounded-lg ${lead.twitter_handle  ? 'bg-sky-500/10 text-sky-400'     : 'bg-[var(--admin-surface-3)] admin-subtle opacity-40'}`}><Twitter       size={12} /></span>
                </div>
                <ScorePill score={lead.website_quality_score} />
              </div>

              {lead.follow_up_date && (
                <p className={`text-[10px] font-mono ${new Date(lead.follow_up_date) < new Date() ? 'text-red-400' : 'admin-muted'}`}>
                  ↻ Follow-up: {lead.follow_up_date}
                </p>
              )}

              <div className="flex gap-2 pt-0.5">
                <button onClick={() => openEdit(lead)}
                  className="flex-1 py-2 rounded-xl text-[12px] font-semibold border admin-border-md bg-[var(--admin-hover-bg)] hover:bg-[var(--admin-surface-3)] admin-text-2 transition-colors">
                  Edit
                </button>
                {lead.website && (
                  <button onClick={() => analyzeLead(lead)} disabled={st === 'scraping' || st === 'analysing'} title="AI analyse"
                    className={`px-3 py-2 rounded-xl text-[12px] transition-colors disabled:opacity-50 ${st === 'done' ? 'text-[#00D67D] bg-[#00D67D]/10' : st === 'error' ? 'text-red-400 bg-red-500/10' : 'text-purple-400 bg-purple-500/10'}`}>
                    {(st === 'scraping' || st === 'analysing') ? <RefreshCw size={13} className="animate-spin" /> : st === 'done' ? <Sparkles size={13} /> : <Zap size={13} />}
                  </button>
                )}
                <button onClick={() => deleteLead(lead.id!, lead.business_name)}
                  className="px-3 py-2 rounded-xl text-[12px] bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Bulk action bar ── */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.97 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border admin-border-md"
            style={{ background: 'var(--admin-surface)', backdropFilter: 'blur(16px)' }}>
            <div className="flex items-center gap-2 pr-3 border-r admin-border-md">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-black" style={{ background: ACCENT }}>
                {selected.size}
              </span>
              <span className="text-[12px] font-medium admin-text">selected</span>
            </div>
            <div className="relative">
              <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}
                className="bg-[var(--admin-input-bg)] border admin-border-md rounded-xl px-3 py-2 text-[12px] admin-text outline-none appearance-none cursor-pointer pr-7 min-w-[160px]">
                <option value="">Change status…</option>
                {OUTREACH_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 admin-muted pointer-events-none" />
            </div>
            <button onClick={applyBulkStatus} disabled={!bulkStatus || bulkUpdating}
              className="px-4 py-2 rounded-xl text-black font-bold text-[12px] transition-all disabled:opacity-50 hover:opacity-90"
              style={{ background: ACCENT }}>
              {bulkUpdating ? 'Applying…' : 'Apply'}
            </button>
            <button onClick={() => setSelected(new Set())} className="p-2 rounded-xl admin-muted hover:admin-text hover:bg-[var(--admin-hover-bg)] transition-colors">
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Lead modal ── */}
      <AnimatePresence>
        {showForm && (
          <LeadModal editId={editId} form={form} setForm={setForm} onClose={closeForm} onSave={saveLead} saving={saving} saveError={saveError} />
        )}
      </AnimatePresence>
    </div>
  );
}
