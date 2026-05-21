'use client';

import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, Save, Trash2, Search, ChevronDown, Mail,
  MessageCircle, Linkedin, Twitter, Filter, Download,
  CheckSquare, Square,
} from 'lucide-react';
import { Lead } from '@/lib/supabase';
import { OUTREACH_STATUSES, RESPONSE_STATUSES } from '@/lib/constants';
import { useToast } from '@/app/components/Toast';
import { useLeads } from '@/lib/hooks';
import ModalPortal from '@/app/components/ModalPortal';

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

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    'Pending':        'bg-amber-500/10 text-amber-500 ring-amber-500/20',
    'Sent':           'bg-emerald-500/10 text-emerald-500 ring-emerald-500/20',
    'Replied':        'bg-blue-500/10 text-blue-400 ring-blue-500/20',
    'Meeting Booked': 'bg-purple-500/10 text-purple-400 ring-purple-500/20',
    'Not Interested': 'bg-red-500/10 text-red-400 ring-red-500/20',
  };
  return map[status] || 'bg-zinc-500/10 text-zinc-400 ring-zinc-500/20';
};

const scoreBadge = (score: number | null) => {
  if (score === null) return 'bg-zinc-500/10 text-zinc-400 ring-zinc-500/20';
  if (score >= 7) return 'bg-emerald-500/10 text-emerald-500 ring-emerald-500/20';
  if (score >= 4) return 'bg-amber-500/10 text-amber-500 ring-amber-500/20';
  return 'bg-red-500/10 text-red-400 ring-red-500/20';
};

// ─── CSV export ───────────────────────────────────────────────────────────────
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
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = [cols.join(','), ...leads.map(l => cols.map(c => esc(l[c])).join(','))];
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `spacze-leads-${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

// ─── LeadModal ────────────────────────────────────────────────────────────────
//
// Text inputs are UNCONTROLLED (defaultValue + onBlur) so React does not
// re-render the modal on every keystroke — this is what caused the mobile
// typing lag. Selects, checkboxes, and date pickers remain controlled because
// they are single-action interactions with no typing involved.
//
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

  // Sync a single text field into form state on blur
  const blur = useCallback((key: string) => (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [key]: e.target.value }));
  }, [setForm]);

  // ESC to close + focus trap
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
      else            { if (document.activeElement === last)  { e.preventDefault(); first.focus(); } }
    }
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); prev?.focus(); };
  }, [onClose]);

  // Shared class strings
  const inp = [
    'w-full rounded-xl px-4 py-3 text-[14px] leading-snug',
    'bg-zinc-800/60 border border-white/8 text-zinc-100',
    'placeholder:text-zinc-600',
    'focus:outline-none focus:border-[#00D67D]/50 focus:ring-1 focus:ring-[#00D67D]/20',
    'transition-colors duration-150',
  ].join(' ');

  const sel = `${inp} cursor-pointer appearance-none`;

  const Section = ({ title }: { title: string }) => (
    <div className="sm:col-span-2 pt-2 pb-1">
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{title}</span>
        <div className="flex-1 h-px bg-white/6" />
      </div>
    </div>
  );

  return (
    <ModalPortal>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-sm"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          ref={dialogRef} tabIndex={-1}
          role="dialog" aria-modal="true"
          aria-label={editId ? 'Edit Lead' : 'Add New Lead'}
          initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 32, stiffness: 320 }}
          className="w-full sm:max-w-xl bg-zinc-900 border border-white/10 rounded-t-[2rem] sm:rounded-2xl shadow-2xl flex flex-col outline-none max-h-[92vh] sm:max-h-[88vh]"
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/8 flex-shrink-0">
            <div>
              <h2 className="font-bold text-base text-zinc-100">
                {editId ? 'Edit Lead' : 'Add New Lead'}
              </h2>
              <p className="text-[12px] text-zinc-500 mt-0.5">
                {editId ? 'Update the details below' : 'Fill in what you know — you can edit later'}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/8 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* ── Scrollable body ── */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">

              {/* ── Core ── */}
              <Section title="Core Info" />

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">Business Name <span className="text-[#00D67D]">*</span></label>
                <input
                  key={`bn-${editId}`}
                  defaultValue={form.business_name}
                  onBlur={blur('business_name')}
                  placeholder="Acme Corp"
                  className={inp}
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">Contact Email <span className="text-[#00D67D]">*</span></label>
                <input
                  key={`ce-${editId}`}
                  type="email"
                  defaultValue={form.contact_email}
                  onBlur={blur('contact_email')}
                  placeholder="hello@acme.com"
                  className={inp}
                  autoComplete="off"
                  inputMode="email"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">Industry</label>
                <input
                  key={`ind-${editId}`}
                  defaultValue={form.industry}
                  onBlur={blur('industry')}
                  placeholder="E-Commerce"
                  className={inp}
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">Website</label>
                <input
                  key={`web-${editId}`}
                  type="url"
                  defaultValue={form.website}
                  onBlur={blur('website')}
                  placeholder="https://acme.com"
                  className={inp}
                  autoComplete="off"
                  inputMode="url"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">Website Quality <span className="text-zinc-600 font-normal">(0–10)</span></label>
                <input
                  key={`wq-${editId}`}
                  type="number"
                  min={0} max={10}
                  defaultValue={form.website_quality_score ?? ''}
                  onBlur={e => setForm(f => ({ ...f, website_quality_score: e.target.value ? Number(e.target.value) : null }))}
                  placeholder="7"
                  className={inp}
                  inputMode="numeric"
                />
              </div>

              {/* ── Contact Channels ── */}
              <Section title="Contact Channels" />

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">WhatsApp Number</label>
                <input
                  key={`wa-${editId}`}
                  type="tel"
                  defaultValue={form.whatsapp_number}
                  onBlur={blur('whatsapp_number')}
                  placeholder="+2348012345678"
                  className={inp}
                  autoComplete="off"
                  inputMode="tel"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">LinkedIn URL</label>
                <input
                  key={`li-${editId}`}
                  defaultValue={form.linkedin_url}
                  onBlur={blur('linkedin_url')}
                  placeholder="linkedin.com/in/username"
                  className={inp}
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">Twitter Handle</label>
                <input
                  key={`tw-${editId}`}
                  defaultValue={form.twitter_handle}
                  onBlur={blur('twitter_handle')}
                  placeholder="@handle"
                  className={inp}
                  autoComplete="off"
                />
              </div>

              {/* ── Audit ── */}
              <Section title="Site Audit" />

              {([
                { label: 'Mobile Responsiveness', key: 'mobile_responsiveness', opts: ['Good', 'Average', 'Poor', 'None'] },
                { label: 'WhatsApp Integration',  key: 'whatsapp_integration',  opts: ['Yes', 'No', 'Partial'] },
                { label: 'SEO Quality',           key: 'seo_quality',           opts: ['Good', 'Average', 'Poor', 'None'] },
                { label: 'AI Opportunity',        key: 'ai_opportunity',        opts: ['High', 'Medium', 'Low', 'None'] },
              ] as const).map(({ label, key, opts }) => (
                <div key={key} className="relative">
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">{label}</label>
                  <select
                    value={(form as Record<string, unknown>)[key] as string || ''}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className={sel}
                  >
                    <option value="">Select…</option>
                    {opts.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <ChevronDown size={13} className="absolute right-3.5 bottom-3.5 text-zinc-500 pointer-events-none" />
                </div>
              ))}

              {/* ── Status ── */}
              <Section title="Outreach Status" />

              {([
                { label: 'Outreach Status', key: 'outreach_status', opts: [...OUTREACH_STATUSES] },
                { label: 'Response Status', key: 'response_status', opts: [...RESPONSE_STATUSES] },
              ] as const).map(({ label, key, opts }) => (
                <div key={key} className="relative">
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">{label}</label>
                  <select
                    value={(form as Record<string, unknown>)[key] as string || ''}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className={sel}
                  >
                    <option value="">Select…</option>
                    {opts.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <ChevronDown size={13} className="absolute right-3.5 bottom-3.5 text-zinc-500 pointer-events-none" />
                </div>
              ))}

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">Last Contacted</label>
                <input
                  type="date"
                  value={(form.last_contacted as string) || ''}
                  onChange={e => setForm(f => ({ ...f, last_contacted: e.target.value || null }))}
                  className={inp}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">Follow-Up Date</label>
                <input
                  type="date"
                  value={(form.follow_up_date as string) || ''}
                  onChange={e => setForm(f => ({ ...f, follow_up_date: e.target.value || null }))}
                  className={inp}
                />
              </div>

              {/* ── Flags ── */}
              <Section title="Flags" />

              <div className="sm:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {([
                  { label: 'Has Dashboard',  key: 'has_dashboard' },
                  { label: 'Email Sent',     key: 'email_sent' },
                  { label: 'Reply Received', key: 'reply_received' },
                  { label: 'Meeting Booked', key: 'meeting_booked' },
                ] as const).map(({ label, key }) => {
                  const checked = !!(form as Record<string, unknown>)[key];
                  return (
                    <label
                      key={key}
                      className={`flex items-center gap-2.5 cursor-pointer px-3 py-3 rounded-xl border transition-colors ${
                        checked
                          ? 'border-[#00D67D]/30 bg-[#00D67D]/8 text-[#00D67D]'
                          : 'border-white/8 bg-white/3 text-zinc-400 hover:border-white/15'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
                        checked ? 'bg-[#00D67D] border-[#00D67D]' : 'border-white/20'
                      }`}>
                        {checked && <span className="text-black text-[9px] font-black leading-none">✓</span>}
                      </div>
                      <span className="text-[12px] font-medium leading-tight">{label}</span>
                    </label>
                  );
                })}
              </div>

              {/* ── Notes ── */}
              <Section title="Notes" />

              {([
                { label: 'Weak Points',           key: 'weak_points',           placeholder: 'Poor mobile UX, no SEO…' },
                { label: 'Possible Improvements', key: 'possible_improvements', placeholder: 'Add dashboard, improve speed…' },
              ] as const).map(({ label, key, placeholder }) => (
                <div key={key} className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">{label}</label>
                  <textarea
                    key={`${key}-${editId}`}
                    rows={3}
                    defaultValue={(form as Record<string, unknown>)[key] as string || ''}
                    onBlur={blur(key)}
                    placeholder={placeholder}
                    className={`${inp} resize-none`}
                  />
                </div>
              ))}

            </div>
          </div>

          {/* ── Footer ── */}
          <div className="flex-shrink-0 px-6 py-4 border-t border-white/8 space-y-3">
            {saveError && (
              <p className="text-red-400 text-[12px] text-center px-3 py-2 rounded-xl bg-red-500/8 border border-red-500/20">
                {saveError}
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl text-[13px] font-medium text-zinc-400 hover:text-zinc-200 border border-white/8 hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                disabled={saving}
                className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl text-black font-bold text-[13px] transition-all disabled:opacity-60 shadow-[0_0_20px_rgba(0,214,125,0.15)] hover:opacity-90"
                style={{ background: 'var(--accent)' }}
              >
                <Save size={14} />
                {saving ? 'Saving…' : editId ? 'Update Lead' : 'Add Lead'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </ModalPortal>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CRMPanel() {
  const { leads, loading, refresh: fetchLeads } = useLeads();
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [showForm, setShowForm]     = useState(false);
  const [editId, setEditId]         = useState<string | null>(null);
  const [form, setForm]             = useState<Omit<Lead, 'id' | 'created_at'>>(EMPTY_LEAD);
  const [saving, setSaving]         = useState(false);
  const [saveError, setSaveError]   = useState('');
  const [selected, setSelected]     = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>('');
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const { toast }                   = useToast();

  // ── Filter ──
  const filtered = useMemo(() => leads.filter(l => {
    const q = search.toLowerCase();
    const matchSearch =
      l.business_name?.toLowerCase().includes(q) ||
      l.contact_email?.toLowerCase().includes(q) ||
      l.industry?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'All' || l.outreach_status === statusFilter;
    return matchSearch && matchStatus;
  }), [leads, search, statusFilter]);

  // ── Selection ──
  const allSelected = filtered.length > 0 && filtered.every(l => selected.has(l.id!));
  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map(l => l.id!)));
  }
  function toggleOne(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  // ── Bulk status update ──
  async function applyBulkStatus() {
    if (!bulkStatus || selected.size === 0) return;
    setBulkUpdating(true);
    let ok = 0; let fail = 0;
    for (const id of selected) {
      const res = await fetch(`/api/leads?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outreach_status: bulkStatus }),
      });
      res.ok ? ok++ : fail++;
    }
    await fetchLeads();
    setSelected(new Set());
    setBulkStatus('');
    setBulkUpdating(false);
    if (fail === 0) toast('success', `Updated ${ok} lead${ok !== 1 ? 's' : ''} to "${bulkStatus}"`);
    else toast('error', `${ok} updated, ${fail} failed`);
  }

  // ── CRUD ──
  const openAdd = useCallback(() => { setForm({ ...EMPTY_LEAD }); setEditId(null); setSaveError(''); setShowForm(true); }, []);
  const openEdit = useCallback((lead: Lead) => {
    const { id, created_at, ...fields } = lead as Lead & { id: string; created_at: string };
    setForm(fields); setEditId(id ?? null); setSaveError(''); setShowForm(true);
  }, []);
  const closeForm = useCallback(() => { setShowForm(false); setEditId(null); setSaveError(''); }, []);

  const saveLead = useCallback(async () => {
    if (!form.business_name.trim() || !form.contact_email.trim()) {
      setSaveError('Business name and contact email are required.'); return;
    }
    setSaving(true); setSaveError('');
    try {
      const res = editId
        ? await fetch(`/api/leads?id=${editId}`, { method: 'PUT',  headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
        : await fetch('/api/leads',               { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed to save lead'); }
      closeForm(); await fetchLeads();
      toast('success', editId ? 'Lead updated' : 'Lead added');
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save lead.');
    } finally { setSaving(false); }
  }, [form, editId, closeForm, fetchLeads, toast]);

  async function deleteLead(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/leads?id=${id}`, { method: 'DELETE' });
    if (res.ok) { await fetchLeads(); toast('success', `"${name}" deleted`); }
    else toast('error', 'Failed to delete lead');
  }

  return (
    <div className="space-y-6 max-w-full min-w-0 pb-12">

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <div className="flex flex-1 gap-3 flex-wrap">
          <div className="relative flex-1 sm:max-w-md group">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[#00D67D] transition-colors" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads by name, email, or industry…" className="admin-input w-full pl-11 pr-4 py-3 text-sm" />
          </div>
          <div className="relative min-w-[160px]">
            <Filter size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="admin-input w-full pl-10 pr-10 py-3 text-sm cursor-pointer appearance-none">
              <option value="All">All Statuses</option>
              {OUTREACH_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button onClick={() => exportCSV(filtered)} className="flex items-center gap-2 px-4 py-3 rounded-xl border admin-border admin-surface-2 admin-hover admin-text-2 text-sm font-medium transition-all">
            <Download size={16} /> <span className="hidden sm:inline">Export</span>
          </button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={openAdd}
            className="flex items-center justify-center gap-2 px-5 py-3 text-black font-semibold text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(0,214,125,0.2)]"
            style={{ background: 'var(--accent)' }}>
            <Plus size={16} /> Add Prospect
          </motion.button>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-4 rounded-2xl bg-zinc-900/90 backdrop-blur-xl border border-white/10 shadow-2xl">
            <div className="flex items-center gap-3 border-r border-white/10 pr-4">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#00D67D]/20 text-[#00D67D] text-xs font-bold">{selected.size}</span>
              <span className="text-sm font-medium text-zinc-200">Selected</span>
            </div>
            <div className="relative min-w-[180px]">
              <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-200 outline-none appearance-none cursor-pointer hover:border-white/20 transition-colors">
                <option value="">Change status to…</option>
                {OUTREACH_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            </div>
            <button onClick={applyBulkStatus} disabled={!bulkStatus || bulkUpdating}
              className="px-5 py-2.5 rounded-xl text-black font-semibold text-sm transition-all disabled:opacity-50 hover:opacity-90"
              style={{ background: 'var(--accent)' }}>
              {bulkUpdating ? 'Applying…' : 'Apply Change'}
            </button>
            <button onClick={() => setSelected(new Set())} className="p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Desktop Table */}
      <div className="hidden md:block border border-white/10 bg-zinc-900/30 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-900/80 border-b border-white/10 text-xs uppercase tracking-wider text-zinc-500 font-medium">
              <tr>
                <th className="px-6 py-4 w-12">
                  <button onClick={toggleAll} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                    {allSelected ? <CheckSquare size={16} className="text-[#00D67D]" /> : <Square size={16} />}
                  </button>
                </th>
                <th className="px-6 py-4">Business</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Score</th>
                <th className="px-6 py-4">Channels</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="px-6 py-4"><div className="skeleton w-4 h-4 rounded" /></td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="skeleton w-8 h-8 rounded-full flex-shrink-0" />
                          <div className="space-y-1.5">
                            <div className="skeleton h-3 w-32 rounded" />
                            <div className="skeleton h-2.5 w-20 rounded" />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4"><div className="skeleton h-3 w-36 rounded" /></td>
                      <td className="px-6 py-4"><div className="skeleton h-5 w-20 rounded-full" /></td>
                      <td className="px-6 py-4"><div className="skeleton h-5 w-12 rounded-full" /></td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <div className="skeleton w-7 h-7 rounded-md" />
                          <div className="skeleton w-7 h-7 rounded-md" />
                          <div className="skeleton w-7 h-7 rounded-md" />
                        </div>
                      </td>
                      <td className="px-6 py-4"><div className="skeleton h-7 w-16 rounded-lg ml-auto" /></td>
                    </tr>
                  ))}
                </>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-14 text-center text-zinc-500 text-sm">No leads found.</td></tr>
              ) : filtered.map(lead => {
                const isSelected = selected.has(lead.id!);
                return (
                  <tr key={lead.id} className={`group transition-colors ${isSelected ? 'bg-[#00D67D]/5' : 'hover:bg-white/[0.02]'}`}>
                    <td className="px-6 py-4">
                      <button onClick={() => toggleOne(lead.id!)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                        {isSelected ? <CheckSquare size={16} className="text-[#00D67D]" /> : <Square size={16} />}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 flex items-center justify-center text-xs font-bold text-zinc-300 shadow-inner flex-shrink-0">
                          {lead.business_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-zinc-200 truncate max-w-[160px]">{lead.business_name}</div>
                          <div className="text-xs text-zinc-500">{lead.industry || 'No industry'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-zinc-300 text-sm truncate max-w-[180px]">{lead.contact_email}</div>
                      {lead.follow_up_date && (
                        <div className={`text-xs mt-0.5 font-mono ${new Date(lead.follow_up_date) < new Date() ? 'text-red-400' : 'text-zinc-500'}`}>
                          Follow up: {lead.follow_up_date}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ring-1 ring-inset ${statusBadge(lead.outreach_status)}`}>
                        {lead.outreach_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold font-mono ring-1 ring-inset ${scoreBadge(lead.website_quality_score)}`}>
                        {lead.website_quality_score != null ? `${lead.website_quality_score}/10` : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`p-1.5 rounded-md ${lead.contact_email   ? 'bg-blue-500/10 text-blue-400'   : 'bg-white/5 text-zinc-600'}`}><Mail          size={14} /></span>
                        <span className={`p-1.5 rounded-md ${lead.whatsapp_number ? 'bg-[#25D366]/10 text-[#25D366]' : 'bg-white/5 text-zinc-600'}`}><MessageCircle size={14} /></span>
                        <span className={`p-1.5 rounded-md ${lead.linkedin_url    ? 'bg-blue-500/10 text-blue-500'   : 'bg-white/5 text-zinc-600'}`}><Linkedin      size={14} /></span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(lead)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors">Edit</button>
                        <button onClick={() => deleteLead(lead.id!, lead.business_name)} className="p-1.5 rounded-lg text-red-400/70 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border border-white/10 bg-zinc-900/40 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="skeleton w-9 h-9 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton h-3 w-40 rounded" />
                    <div className="skeleton h-2.5 w-28 rounded" />
                  </div>
                  <div className="skeleton h-5 w-16 rounded-full" />
                </div>
                <div className="flex gap-2">
                  <div className="skeleton w-7 h-7 rounded-md" />
                  <div className="skeleton w-7 h-7 rounded-md" />
                  <div className="skeleton w-7 h-7 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-sm">No leads found.</div>
        ) : filtered.map(lead => (
          <div key={lead.id} className="border border-white/10 bg-zinc-900/40 rounded-2xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 flex items-center justify-center text-xs font-bold text-zinc-300 flex-shrink-0">
                  {lead.business_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-zinc-200 truncate">{lead.business_name}</div>
                  <div className="text-xs text-zinc-500 truncate mt-0.5">{lead.contact_email}</div>
                </div>
              </div>
              <span className={`flex-shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ring-1 ring-inset ${statusBadge(lead.outreach_status)}`}>
                {lead.outreach_status}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`p-1.5 rounded-md ${lead.contact_email   ? 'bg-blue-500/10 text-blue-400'   : 'bg-white/5 text-zinc-600'}`}><Mail          size={13} /></span>
                <span className={`p-1.5 rounded-md ${lead.whatsapp_number ? 'bg-[#25D366]/10 text-[#25D366]' : 'bg-white/5 text-zinc-600'}`}><MessageCircle size={13} /></span>
                <span className={`p-1.5 rounded-md ${lead.linkedin_url    ? 'bg-blue-500/10 text-blue-500'   : 'bg-white/5 text-zinc-600'}`}><Linkedin      size={13} /></span>
              </div>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold font-mono ring-1 ring-inset ${scoreBadge(lead.website_quality_score)}`}>
                {lead.website_quality_score != null ? `${lead.website_quality_score}/10` : 'N/A'}
              </span>
            </div>
            {lead.follow_up_date && (
              <div className={`text-[11px] font-mono ${new Date(lead.follow_up_date) < new Date() ? 'text-red-400' : 'text-zinc-500'}`}>
                Follow-up: {lead.follow_up_date}
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button onClick={() => openEdit(lead)} className="flex-1 py-2.5 rounded-xl text-xs font-medium border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors">Edit</button>
              <button onClick={() => deleteLead(lead.id!, lead.business_name)} className="px-4 py-2.5 rounded-xl text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Lead modal */}
      <AnimatePresence>
        {showForm && (
          <LeadModal
            editId={editId} form={form} setForm={setForm}
            onClose={closeForm} onSave={saveLead}
            saving={saving} saveError={saveError}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
