'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, Save, Trash2, Search, ChevronDown, Mail,
  MessageCircle, Linkedin, Twitter, Filter, Download,
  CheckSquare, Square, ArrowUpDown,
} from 'lucide-react';
import { Lead } from '@/lib/supabase';
import { OUTREACH_STATUSES, RESPONSE_STATUSES } from '@/lib/constants';
import { ToastStack, useToast } from '@/app/components/Toast';

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

const statusColor: Record<string, string> = {
  Pending:          'text-amber-600 bg-amber-50 border-amber-200',
  Sent:             'text-emerald-700 bg-emerald-50 border-emerald-200',
  Replied:          'text-blue-600 bg-blue-50 border-blue-200',
  'Meeting Booked': 'text-purple-600 bg-purple-50 border-purple-200',
  'Not Interested': 'text-red-500 bg-red-50 border-red-200',
};

const scoreColor = (score: number | null) => {
  if (score === null) return 'text-slate-500 bg-slate-100 border border-slate-200';
  if (score >= 7) return 'text-emerald-700 bg-emerald-100';
  if (score >= 4) return 'text-yellow-700 bg-yellow-100';
  return 'text-red-600 bg-red-100';
};

type SortKey = 'business_name' | 'follow_up_date' | 'website_quality_score' | 'outreach_status' | 'created_at';
type SortDir = 'asc' | 'desc';

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

// ─── Sort helper ──────────────────────────────────────────────────────────────
function sortLeads(leads: Lead[], key: SortKey, dir: SortDir): Lead[] {
  return [...leads].sort((a, b) => {
    let av: string | number | null = (a as Record<string, unknown>)[key] as string | number | null;
    let bv: string | number | null = (b as Record<string, unknown>)[key] as string | number | null;
    if (av == null) av = dir === 'asc' ? '\uffff' : '';
    if (bv == null) bv = dir === 'asc' ? '\uffff' : '';
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return dir === 'asc' ? cmp : -cmp;
  });
}

// ─── SortButton ───────────────────────────────────────────────────────────────
function SortButton({ label, sortKey, current, dir, onSort }: {
  label: string; sortKey: SortKey;
  current: SortKey; dir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  const active = current === sortKey;
  return (
    <button
      onClick={() => onSort(sortKey)}
      className={`flex items-center gap-1 whitespace-nowrap label-xs hover:admin-text transition-colors ${active ? 'accent-text' : ''}`}
    >
      {label}
      <ArrowUpDown size={10} className={active ? 'opacity-100' : 'opacity-30'} />
    </button>
  );
}

// ─── LeadModal ────────────────────────────────────────────────────────────────
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
  const inp = 'w-full admin-input border rounded-xl px-3 py-2.5 text-[13px] admin-text outline-none transition-colors placeholder:admin-subtle';
  const sel = `${inp} cursor-pointer appearance-none`;

  // Focus trap + ESC to close
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

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        ref={dialogRef} tabIndex={-1}
        role="dialog" aria-modal="true"
        aria-label={editId ? 'Edit Lead' : 'Add New Lead'}
        initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="admin-surface border admin-border-md rounded-t-3xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[90vh] flex flex-col outline-none"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b admin-border flex-shrink-0">
          <div>
            <h2 className="font-bold text-[15px] admin-text">{editId ? 'Edit Lead' : 'Add New Lead'}</h2>
            <p className="text-[11px] admin-muted mt-0.5">{editId ? 'Update lead details' : 'Fill in the lead information below'}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="admin-muted hover:admin-text p-1.5 rounded-xl admin-hover transition-colors border admin-border">
            <X size={15} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Business Name *', key: 'business_name', placeholder: 'Acme Corp' },
              { label: 'Contact Email *',  key: 'contact_email',   placeholder: 'hello@acme.com' },
              { label: 'WhatsApp Number',  key: 'whatsapp_number', placeholder: '+2348012345678' },
              { label: 'LinkedIn URL',     key: 'linkedin_url',    placeholder: 'linkedin.com/in/username' },
              { label: 'Twitter Handle',   key: 'twitter_handle',  placeholder: '@handle' },
              { label: 'Website',          key: 'website',         placeholder: 'https://acme.com' },
              { label: 'Industry',         key: 'industry',        placeholder: 'E-Commerce' },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="block label-xs mb-1.5">{label}</label>
                <input value={(form as Record<string,unknown>)[key] as string || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} className={inp} />
              </div>
            ))}

            <div>
              <label className="block label-xs mb-1.5">Website Quality (0–10)</label>
              <input type="number" min={0} max={10} value={form.website_quality_score ?? ''} onChange={e => setForm(f => ({ ...f, website_quality_score: e.target.value ? Number(e.target.value) : null }))} placeholder="7" className={inp} />
            </div>

            {[
              { label: 'Mobile Responsiveness', key: 'mobile_responsiveness', opts: ['Good', 'Average', 'Poor', 'None'] },
              { label: 'WhatsApp Integration',  key: 'whatsapp_integration',  opts: ['Yes', 'No', 'Partial'] },
              { label: 'SEO Quality',           key: 'seo_quality',           opts: ['Good', 'Average', 'Poor', 'None'] },
              { label: 'AI Opportunity',        key: 'ai_opportunity',        opts: ['High', 'Medium', 'Low', 'None'] },
              { label: 'Outreach Status',       key: 'outreach_status',       opts: [...OUTREACH_STATUSES] },
              { label: 'Response Status',       key: 'response_status',       opts: [...RESPONSE_STATUSES] },
            ].map(({ label, key, opts }) => (
              <div key={key} className="relative">
                <label className="block label-xs mb-1.5">{label}</label>
                <select value={(form as Record<string,unknown>)[key] as string || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className={sel}>
                  <option value="">Select...</option>
                  {opts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-3 bottom-3 admin-subtle pointer-events-none" />
              </div>
            ))}

            {[
              { label: 'Last Contacted', key: 'last_contacted' },
              { label: 'Follow-Up Date', key: 'follow_up_date' },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block label-xs mb-1.5">{label}</label>
                <input type="date" value={(form as Record<string,unknown>)[key] as string || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value || null }))} className={inp} />
              </div>
            ))}

            <div className="sm:col-span-2">
              <label className="block label-xs mb-2.5">Flags</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Has Dashboard',  key: 'has_dashboard' },
                  { label: 'Email Sent',     key: 'email_sent' },
                  { label: 'Reply Received', key: 'reply_received' },
                  { label: 'Meeting Booked', key: 'meeting_booked' },
                ].map(({ label, key }) => (
                  <label key={key} className="flex items-center gap-2.5 cursor-pointer p-3 rounded-xl admin-hover border admin-border hover:admin-border-md transition-colors">
                    <input type="checkbox" checked={!!(form as Record<string,unknown>)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} className="w-4 h-4 accent-[#00D67D] flex-shrink-0" />
                    <span className="text-xs text-slate-300 leading-tight">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {[
              { label: 'Weak Points',           key: 'weak_points',           placeholder: 'Poor mobile UX, no SEO...' },
              { label: 'Possible Improvements', key: 'possible_improvements', placeholder: 'Add dashboard, improve speed...' },
            ].map(({ label, key, placeholder }) => (
              <div key={key} className="sm:col-span-2">
                <label className="block label-xs mb-1.5">{label}</label>
                <textarea rows={3} value={(form as Record<string,unknown>)[key] as string || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} className={`${inp} resize-none`} />
              </div>
            ))}
          </div>
        </div>

        <div className="flex-shrink-0 px-5 py-4 border-t admin-border space-y-3">
          {saveError && (
            <p className="text-red-400 text-[12px] text-center px-3 py-2 rounded-xl bg-red-500/8 border border-red-500/20">{saveError}</p>
          )}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-[13px] admin-muted hover:admin-text border admin-border admin-hover transition-colors">Cancel</button>
            <button onClick={onSave} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-black font-bold text-[13px] transition-colors disabled:opacity-60" style={{ background: 'var(--accent)' }}>
              <Save size={13} />
              {saving ? 'Saving...' : editId ? 'Update Lead' : 'Add Lead'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CRMPanel() {
  const [leads, setLeads]           = useState<Lead[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortKey, setSortKey]       = useState<SortKey>('created_at');
  const [sortDir, setSortDir]       = useState<SortDir>('desc');
  const [showForm, setShowForm]     = useState(false);
  const [editId, setEditId]         = useState<string | null>(null);
  const [form, setForm]             = useState<Omit<Lead, 'id' | 'created_at'>>(EMPTY_LEAD);
  const [saving, setSaving]         = useState(false);
  const [saveError, setSaveError]   = useState('');
  const [selected, setSelected]     = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>('');
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const { toasts, toast, dismiss }  = useToast();

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const res  = await fetch('/api/leads');
    const data = await res.json();
    setLeads(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  // ── Sort ──
  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }

  // ── Filter + sort ──
  const filtered = sortLeads(
    leads.filter(l => {
      const q = search.toLowerCase();
      const matchSearch =
        l.business_name?.toLowerCase().includes(q) ||
        l.contact_email?.toLowerCase().includes(q) ||
        l.industry?.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'All' || l.outreach_status === statusFilter;
      return matchSearch && matchStatus;
    }),
    sortKey, sortDir,
  );

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
  function openAdd() { setForm({ ...EMPTY_LEAD }); setEditId(null); setSaveError(''); setShowForm(true); }
  function openEdit(lead: Lead) {
    const { id, created_at, ...fields } = lead as Lead & { id: string; created_at: string };
    setForm(fields); setEditId(id ?? null); setSaveError(''); setShowForm(true);
  }
  function closeForm() { setShowForm(false); setEditId(null); setSaveError(''); }

  async function saveLead() {
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
  }

  async function deleteLead(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/leads?id=${id}`, { method: 'DELETE' });
    if (res.ok) { await fetchLeads(); toast('success', `"${name}" deleted`); }
    else toast('error', 'Failed to delete lead');
  }

  const inp = 'w-full admin-input border rounded-xl px-3 py-2.5 text-[13px] admin-text outline-none transition-colors placeholder:admin-subtle';

  return (
    <div className="space-y-4 max-w-full min-w-0">
      <ToastStack toasts={toasts} onDismiss={dismiss} />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-1 gap-2 flex-wrap">
          <div className="relative flex-1 sm:max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 admin-subtle pointer-events-none" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads…" className={`${inp} pl-9`} />
          </div>
          <div className="relative">
            <Filter size={12} className="absolute left-3 top-1/2 -translate-y-1/2 admin-subtle pointer-events-none" />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={`${inp} pl-8 pr-8 cursor-pointer appearance-none min-w-[140px]`}>
              <option value="All">All Statuses</option>
              {OUTREACH_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 admin-subtle pointer-events-none" />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[11px] font-mono admin-muted hidden sm:block">{filtered.length} lead{filtered.length !== 1 ? 's' : ''}</span>
          <button onClick={() => exportCSV(filtered)} title="Export CSV" className="p-2.5 rounded-xl border admin-border admin-hover admin-muted hover:admin-text transition-colors">
            <Download size={14} />
          </button>
          <button onClick={openAdd} className="flex items-center justify-center gap-2 px-4 py-2.5 text-black font-bold text-[13px] rounded-xl transition-colors" style={{ background: 'var(--accent)' }}>
            <Plus size={15} /> Add Lead
          </button>
        </div>
      </div>

      {/* Bulk action bar */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl border admin-border-md admin-surface-2">
            <span className="text-[12px] font-mono accent-text">{selected.size} selected</span>
            <div className="relative flex-1 min-w-[160px] max-w-xs">
              <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)} className={`${inp} py-1.5 pr-8 cursor-pointer appearance-none text-[12px]`}>
                <option value="">Set status…</option>
                {OUTREACH_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 admin-subtle pointer-events-none" />
            </div>
            <button onClick={applyBulkStatus} disabled={!bulkStatus || bulkUpdating}
              className="px-3 py-1.5 rounded-lg text-black font-bold text-[12px] disabled:opacity-40 transition-colors"
              style={{ background: 'var(--accent)' }}>
              {bulkUpdating ? 'Updating…' : 'Apply'}
            </button>
            <button onClick={() => setSelected(new Set())} className="text-[12px] admin-muted hover:admin-text transition-colors">Clear</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop table */}
      <div className="hidden md:block admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b admin-border">
                <th className="px-4 py-3 w-10">
                  <button onClick={toggleAll} aria-label="Select all" className="admin-muted hover:admin-text transition-colors">
                    {allSelected ? <CheckSquare size={14} className="accent-text" /> : <Square size={14} />}
                  </button>
                </th>
                {([
                  { label: 'Business',  key: 'business_name' },
                  { label: 'Follow-up', key: 'follow_up_date' },
                  { label: 'Score',     key: 'website_quality_score' },
                ] as { label: string; key: SortKey }[]).map(({ label, key }) => (
                  <th key={key} className="px-4 py-3 text-left">
                    <SortButton label={label} sortKey={key} current={sortKey} dir={sortDir} onSort={handleSort} />
                  </th>
                ))}
                {['Email', 'Industry', 'SEO', 'AI Opp.', 'Channels', 'Outreach', 'Flags', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left label-xs whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={13} className="px-4 py-14 text-center admin-subtle text-sm">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={13} className="px-4 py-14 text-center admin-subtle text-sm">No leads found.</td></tr>
              ) : filtered.map(lead => (
                <tr key={lead.id} className={`border-b admin-border last:border-0 transition-colors group ${selected.has(lead.id!) ? 'bg-[#00D67D]/4' : 'admin-hover'}`}>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleOne(lead.id!)} aria-label={`Select ${lead.business_name}`} className="admin-muted hover:admin-text transition-colors">
                      {selected.has(lead.id!) ? <CheckSquare size={14} className="accent-text" /> : <Square size={14} />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-[11px] font-bold" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                        {lead.business_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-[13px] admin-text whitespace-nowrap max-w-[120px] truncate">{lead.business_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 admin-muted text-[12px] whitespace-nowrap">
                    {lead.follow_up_date ? (
                      <span className={new Date(lead.follow_up_date) < new Date() ? 'text-red-400 font-mono' : 'font-mono'}>
                        {lead.follow_up_date}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-mono text-[11px] px-2 py-0.5 rounded-md ${scoreColor(lead.website_quality_score)}`}>
                      {lead.website_quality_score != null ? `${lead.website_quality_score}/10` : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 admin-muted text-[12px] whitespace-nowrap max-w-[160px] truncate">{lead.contact_email}</td>
                  <td className="px-4 py-3 admin-muted text-[12px]">{lead.industry || '—'}</td>
                  <td className="px-4 py-3 admin-muted text-[12px]">{lead.seo_quality || '—'}</td>
                  <td className="px-4 py-3 admin-muted text-[12px] max-w-[120px] truncate">{lead.ai_opportunity || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span title="Email"    className={lead.contact_email   ? 'text-blue-400'    : 'text-slate-700'}><Mail          size={12} /></span>
                      <span title="WhatsApp" className={lead.whatsapp_number ? 'text-[#25D366]'   : 'text-slate-700'}><MessageCircle size={12} /></span>
                      <span title="LinkedIn" className={lead.linkedin_url    ? 'text-blue-500'    : 'text-slate-700'}><Linkedin      size={12} /></span>
                      <span title="Twitter"  className={lead.twitter_handle  ? 'text-sky-400'     : 'text-slate-700'}><Twitter       size={12} /></span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${statusColor[lead.outreach_status] || 'text-slate-400 bg-white/5 border-white/10'}`}>
                      {lead.outreach_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 text-[10px] font-mono">
                      {lead.email_sent     && <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Sent</span>}
                      {lead.reply_received && <span className="px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">Reply</span>}
                      {lead.meeting_booked && <span className="px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">Mtg</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(lead)} className="admin-muted hover:admin-text text-[12px] px-2.5 py-1 rounded-lg border admin-border admin-hover transition-colors">Edit</button>
                      <button onClick={() => deleteLead(lead.id!, lead.business_name)} aria-label={`Delete ${lead.business_name}`} className="text-red-400 hover:text-red-300 p-1.5 rounded-lg bg-red-500/5 hover:bg-red-500/10 transition-colors"><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="py-12 text-center admin-subtle text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center admin-subtle text-sm">No leads found.</div>
        ) : filtered.map(lead => (
          <div key={lead.id} className="admin-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-[12px] font-bold" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                  {lead.business_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-[13px] admin-text truncate">{lead.business_name}</div>
                  <div className="text-[11px] admin-muted truncate mt-0.5">{lead.contact_email}</div>
                </div>
              </div>
              <span className={`flex-shrink-0 text-[10px] font-mono px-2 py-0.5 rounded-full border ${statusColor[lead.outreach_status] || 'text-slate-400 bg-white/5 border-white/10'}`}>
                {lead.outreach_status}
              </span>
            </div>
            {lead.follow_up_date && (
              <div className={`text-[10px] font-mono ${new Date(lead.follow_up_date) < new Date() ? 'text-red-400' : 'admin-subtle'}`}>
                Follow-up: {lead.follow_up_date}
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button onClick={() => openEdit(lead)} className="flex-1 py-2 rounded-xl text-[12px] font-medium border admin-border admin-hover admin-muted hover:admin-text transition-colors">Edit</button>
              <button onClick={() => deleteLead(lead.id!, lead.business_name)} aria-label={`Delete ${lead.business_name}`} className="px-4 py-2 rounded-xl text-[12px] bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors"><Trash2 size={13} /></button>
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
