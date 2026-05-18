'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Save, Trash2, Search, ChevronDown } from 'lucide-react';
import { Lead } from '@/lib/supabase';

const EMPTY_LEAD: Omit<Lead, 'id' | 'created_at'> = {
  business_name: '', website: '', industry: '', contact_email: '',
  whatsapp_number: '',
  website_quality_score: null, mobile_responsiveness: '', whatsapp_integration: '',
  seo_quality: '', has_dashboard: false, ai_opportunity: '', weak_points: '',
  possible_improvements: '', last_contacted: null, follow_up_date: null,
  response_status: 'None', outreach_status: 'Pending',
  email_sent: false, reply_received: false, meeting_booked: false,
  generated_subject: '', generated_email: '',
};

const STATUS_OPTIONS = ['Pending', 'Sent', 'Replied', 'Meeting Booked', 'Not Interested'];
const RESPONSE_OPTIONS = ['None', 'Positive', 'Negative', 'No Reply', 'Bounced'];

const statusColor: Record<string, string> = {
  Pending:          'text-yellow-600 bg-yellow-100 border-yellow-300',
  Sent:             'text-emerald-700 bg-emerald-100 border-emerald-300',
  Replied:          'text-blue-600 bg-blue-100 border-blue-300',
  'Meeting Booked': 'text-purple-600 bg-purple-100 border-purple-300',
  'Not Interested': 'text-red-600 bg-red-100 border-red-300',
};

const scoreColor = (score: number | null) => {
  if (score === null) return 'text-slate-500 bg-slate-100 border border-slate-200';
  if (score >= 7) return 'text-emerald-700 bg-emerald-100';
  if (score >= 4) return 'text-yellow-700 bg-yellow-100';
  return 'text-red-600 bg-red-100';
};

export default function CRMPanel() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Lead, 'id' | 'created_at'>>(EMPTY_LEAD);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  async function fetchLeads() {
    setLoading(true);
    const res = await fetch('/api/leads');
    const data = await res.json();
    setLeads(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { fetchLeads(); }, []);

  function openAdd() {
    setForm({ ...EMPTY_LEAD });
    setEditId(null);
    setSaveError('');
    setShowForm(true);
  }

  function openEdit(lead: Lead) {
    const { id, created_at, ...formFields } = lead as any;
    setForm(formFields);
    setEditId(id ?? null);
    setSaveError('');
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditId(null);
    setSaveError('');
  }

  async function saveLead() {
    if (!form.business_name.trim() || !form.contact_email.trim()) {
      setSaveError('Business name and contact email are required.');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      const res = editId
        ? await fetch(`/api/leads?id=${editId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
          })
        : await fetch('/api/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
          });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save lead');
      }
      closeForm();
      await fetchLeads();
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save lead.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteLead(id: string) {
    if (!confirm('Delete this lead?')) return;
    await fetch(`/api/leads?id=${id}`, { method: 'DELETE' });
    fetchLeads();
  }

  const filtered = leads.filter(l =>
    l.business_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.contact_email?.toLowerCase().includes(search.toLowerCase()) ||
    l.industry?.toLowerCase().includes(search.toLowerCase())
  );

  const inp = 'w-full admin-input border admin-border-md rounded-lg px-3 py-2.5 text-sm admin-text outline-none focus:border-[#00D67D]/50 transition-colors placeholder:admin-subtle';
  const sel = `${inp} cursor-pointer appearance-none`;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 admin-subtle" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search leads..."
            className={`${inp} pl-8`}
          />
        </div>
        <button
          onClick={openAdd}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#00D67D] text-black font-bold text-sm rounded-xl hover:bg-[#00c06e] transition-colors"
        >
          <Plus size={16} /> Add Lead
        </button>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-2xl admin-surface border admin-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b admin-border text-[10px] font-mono admin-muted uppercase tracking-wider">
                {['Business', 'Email', 'Industry', 'Score', 'Mobile', 'SEO', 'AI Opp.', 'Outreach', 'Flags', 'Follow-Up', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="admin-divider divide-y">
              {loading ? (
                <tr><td colSpan={11} className="px-4 py-12 text-center admin-subtle">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={11} className="px-4 py-12 text-center admin-subtle">No leads found.</td></tr>
              ) : filtered.map(lead => (
                <tr key={lead.id} className="hover:admin-hover transition-colors group">
                  <td className="px-4 py-3 font-medium whitespace-nowrap max-w-[140px] truncate">{lead.business_name}</td>
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap max-w-[160px] truncate">{lead.contact_email}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{lead.industry || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`font-mono text-xs px-2 py-0.5 rounded ${scoreColor(lead.website_quality_score)}`}>
                      {lead.website_quality_score != null ? `${lead.website_quality_score}/10` : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{lead.mobile_responsiveness || '—'}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{lead.seo_quality || '—'}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{lead.ai_opportunity || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-mono px-2 py-1 rounded-md border ${statusColor[lead.outreach_status] || 'text-slate-400 bg-white/5 admin-border-md'}`}>
                      {lead.outreach_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 text-[10px] font-mono">
                      {lead.email_sent && <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">Sent</span>}
                      {lead.reply_received && <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-600">Reply</span>}
                      {lead.meeting_booked && <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400">Mtg</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 admin-muted text-xs whitespace-nowrap">{lead.follow_up_date || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(lead)} className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-white/5 admin-hover transition-colors">Edit</button>
                      <button onClick={() => deleteLead(lead.id!)} className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded bg-red-500/5 hover:bg-red-500/10 transition-colors"><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="py-12 text-center admin-subtle text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center admin-subtle text-sm">No leads found.</div>
        ) : filtered.map(lead => (
          <div key={lead.id} className="rounded-2xl admin-surface border admin-border p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold text-sm truncate">{lead.business_name}</div>
                <div className="text-xs admin-muted truncate mt-0.5">{lead.contact_email}</div>
              </div>
              <span className={`flex-shrink-0 text-[10px] font-mono px-2 py-1 rounded-md border ${statusColor[lead.outreach_status] || 'text-slate-400 bg-white/5 admin-border-md'}`}>
                {lead.outreach_status}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
              {lead.industry && <span className="px-2 py-1 rounded-md admin-hover admin-muted">{lead.industry}</span>}
              {lead.website_quality_score != null && (
                <span className={`px-2 py-1 rounded-md ${scoreColor(lead.website_quality_score)}`}>Score {lead.website_quality_score}/10</span>
              )}
              {lead.seo_quality && <span className="px-2 py-1 rounded-md admin-hover admin-muted">SEO: {lead.seo_quality}</span>}
              {lead.mobile_responsiveness && <span className="px-2 py-1 rounded-md admin-hover admin-muted">Mobile: {lead.mobile_responsiveness}</span>}
              {lead.email_sent && <span className="px-2 py-1 rounded-md bg-emerald-100 text-emerald-700">Email Sent</span>}
              {lead.reply_received && <span className="px-2 py-1 rounded-md bg-blue-100 text-blue-600">Replied</span>}
              {lead.meeting_booked && <span className="px-2 py-1 rounded-md bg-purple-100 text-purple-600">Meeting</span>}
            </div>
            {lead.follow_up_date && (
              <div className="text-[10px] admin-subtle font-mono">Follow-up: {lead.follow_up_date}</div>
            )}
            <div className="flex gap-2 pt-1">
              <button onClick={() => openEdit(lead)} className="flex-1 py-2 rounded-xl text-xs font-medium bg-white/5 admin-hover text-slate-300 hover:text-white transition-colors">Edit</button>
              <button onClick={() => deleteLead(lead.id!)} className="px-4 py-2 rounded-xl text-xs bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors"><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="admin-surface border admin-border-md rounded-t-3xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b admin-border flex-shrink-0">
                <h2 className="font-bold text-base">{editId ? 'Edit Lead' : 'Add New Lead'}</h2>
                <button onClick={closeForm} className="admin-muted hover:text-white p-1 rounded-lg admin-hover transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Business Name *', key: 'business_name', placeholder: 'Acme Corp' },
                    { label: 'Contact Email *', key: 'contact_email', placeholder: 'hello@acme.com' },
                    { label: 'WhatsApp Number', key: 'whatsapp_number', placeholder: '+2348012345678' },
                    { label: 'Website', key: 'website', placeholder: 'https://acme.com' },
                    { label: 'Industry', key: 'industry', placeholder: 'E-Commerce' },
                  ].map(({ label, key, placeholder }) => (
                    <div key={key}>
                      <label className="block text-[10px] admin-muted mb-1.5 font-mono uppercase tracking-wider">{label}</label>
                      <input value={(form as any)[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} className={inp} />
                    </div>
                  ))}

                  <div>
                    <label className="block text-[10px] admin-muted mb-1.5 font-mono uppercase tracking-wider">Website Quality (0–10)</label>
                    <input type="number" min={0} max={10} value={form.website_quality_score ?? ''} onChange={e => setForm(f => ({ ...f, website_quality_score: e.target.value ? Number(e.target.value) : null }))} placeholder="7" className={inp} />
                  </div>

                  {[
                    { label: 'Mobile Responsiveness', key: 'mobile_responsiveness', opts: ['Good', 'Average', 'Poor', 'None'] },
                    { label: 'WhatsApp Integration', key: 'whatsapp_integration', opts: ['Yes', 'No', 'Partial'] },
                    { label: 'SEO Quality', key: 'seo_quality', opts: ['Good', 'Average', 'Poor', 'None'] },
                    { label: 'AI Opportunity', key: 'ai_opportunity', opts: ['High', 'Medium', 'Low', 'None'] },
                    { label: 'Outreach Status', key: 'outreach_status', opts: STATUS_OPTIONS },
                    { label: 'Response Status', key: 'response_status', opts: RESPONSE_OPTIONS },
                  ].map(({ label, key, opts }) => (
                    <div key={key} className="relative">
                      <label className="block text-[10px] admin-muted mb-1.5 font-mono uppercase tracking-wider">{label}</label>
                      <select value={(form as any)[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className={sel}>
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
                      <label className="block text-[10px] admin-muted mb-1.5 font-mono uppercase tracking-wider">{label}</label>
                      <input type="date" value={(form as any)[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value || null }))} className={inp} />
                    </div>
                  ))}

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] admin-muted mb-2.5 font-mono uppercase tracking-wider">Flags</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Has Dashboard', key: 'has_dashboard' },
                        { label: 'Email Sent', key: 'email_sent' },
                        { label: 'Reply Received', key: 'reply_received' },
                        { label: 'Meeting Booked', key: 'meeting_booked' },
                      ].map(({ label, key }) => (
                        <label key={key} className="flex items-center gap-2.5 cursor-pointer p-3 rounded-xl admin-hover border admin-border hover:admin-border-md transition-colors">
                          <input type="checkbox" checked={!!(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} className="w-4 h-4 accent-[#00D67D] flex-shrink-0" />
                          <span className="text-xs text-slate-300 leading-tight">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {[
                    { label: 'Weak Points', key: 'weak_points', placeholder: 'Poor mobile UX, no SEO...' },
                    { label: 'Possible Improvements', key: 'possible_improvements', placeholder: 'Add dashboard, improve speed...' },
                  ].map(({ label, key, placeholder }) => (
                    <div key={key} className="sm:col-span-2">
                      <label className="block text-[10px] admin-muted mb-1.5 font-mono uppercase tracking-wider">{label}</label>
                      <textarea rows={3} value={(form as any)[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} className={`${inp} resize-none`} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-shrink-0 px-5 py-4 border-t admin-border space-y-3">
                {saveError && <p className="text-red-400 text-xs text-center">{saveError}</p>}
                <div className="flex gap-3">
                  <button onClick={closeForm} className="flex-1 py-3 rounded-xl text-sm text-slate-400 hover:text-white bg-white/5 admin-hover transition-colors">Cancel</button>
                  <button onClick={saveLead} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#00D67D] text-black font-bold text-sm hover:bg-[#00c06e] transition-colors disabled:opacity-60">
                    <Save size={14} />
                    {saving ? 'Saving...' : editId ? 'Update Lead' : 'Add Lead'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
