'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Save, Trash2, ChevronDown, Search, Upload } from 'lucide-react';
import { supabase, Lead } from '@/lib/supabase';

const EMPTY_LEAD: Omit<Lead, 'id' | 'created_at'> = {
  business_name: '', website: '', industry: '', contact_email: '',
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
  Pending: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  Sent: 'text-[#00D67D] bg-[#00D67D]/10 border-[#00D67D]/20',
  Replied: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  'Meeting Booked': 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  'Not Interested': 'text-red-400 bg-red-500/10 border-red-500/20',
};

export default function CRMPanel() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [form, setForm] = useState<Omit<Lead, 'id' | 'created_at'>>(EMPTY_LEAD);
  const [saving, setSaving] = useState(false);

  async function fetchLeads() {
    setLoading(true);
    const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
    setLeads(data || []);
    setLoading(false);
  }

  useEffect(() => { fetchLeads(); }, []);

  function openAdd() { setForm(EMPTY_LEAD); setEditLead(null); setShowForm(true); }
  function openEdit(lead: Lead) { setForm({ ...lead } as any); setEditLead(lead); setShowForm(true); }

  async function saveLead() {
    setSaving(true);
    if (editLead?.id) {
      await supabase.from('leads').update(form).eq('id', editLead.id);
    } else {
      await supabase.from('leads').insert([form]);
    }
    setSaving(false);
    setShowForm(false);
    fetchLeads();
  }

  async function deleteLead(id: string) {
    if (!confirm('Delete this lead?')) return;
    await supabase.from('leads').delete().eq('id', id);
    fetchLeads();
  }

  const filtered = leads.filter(l =>
    l.business_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.contact_email?.toLowerCase().includes(search.toLowerCase()) ||
    l.industry?.toLowerCase().includes(search.toLowerCase())
  );

  const inp = 'w-full bg-[#050505] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#00D67D]/50 transition-colors placeholder:text-slate-700';
  const sel = `${inp} cursor-pointer`;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search leads..." className={`${inp} pl-8`} />
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[#00D67D] text-black font-bold text-sm rounded-xl hover:bg-[#00c06e] transition-colors">
          <Plus size={16} /> Add Lead
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-[#0A0A0A] border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                {['Business', 'Email', 'Industry', 'Score', 'Mobile', 'SEO', 'Dashboard', 'AI Opp.', 'Outreach', 'Email Sent', 'Reply', 'Meeting', 'Follow-Up', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={14} className="px-4 py-10 text-center text-slate-600">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={14} className="px-4 py-10 text-center text-slate-600">No leads found.</td></tr>
              ) : filtered.map(lead => (
                <tr key={lead.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-4 py-3 font-medium whitespace-nowrap max-w-[140px] truncate">{lead.business_name}</td>
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap max-w-[160px] truncate">{lead.contact_email}</td>
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{lead.industry}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-mono text-xs px-2 py-0.5 rounded ${(lead.website_quality_score ?? 0) >= 7 ? 'text-[#00D67D] bg-[#00D67D]/10' : (lead.website_quality_score ?? 0) >= 4 ? 'text-yellow-400 bg-yellow-500/10' : 'text-red-400 bg-red-500/10'}`}>
                      {lead.website_quality_score ?? '—'}/10
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{lead.mobile_responsiveness || '—'}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{lead.seo_quality || '—'}</td>
                  <td className="px-4 py-3 text-center">{lead.has_dashboard ? '✅' : '❌'}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs max-w-[120px] truncate">{lead.ai_opportunity || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-mono px-2 py-1 rounded-md border ${statusColor[lead.outreach_status] || 'text-slate-400 bg-white/5 border-white/10'}`}>
                      {lead.outreach_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">{lead.email_sent ? '✅' : '—'}</td>
                  <td className="px-4 py-3 text-center">{lead.reply_received ? '✅' : '—'}</td>
                  <td className="px-4 py-3 text-center">{lead.meeting_booked ? '✅' : '—'}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{lead.follow_up_date || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(lead)} className="text-slate-400 hover:text-white transition-colors text-xs px-2 py-1 rounded bg-white/5 hover:bg-white/10">Edit</button>
                      <button onClick={() => deleteLead(lead.id!)} className="text-red-400 hover:text-red-300 transition-colors text-xs px-2 py-1 rounded bg-red-500/5 hover:bg-red-500/10">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0A0A0A] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-[#0A0A0A] px-6 py-4 border-b border-white/5 flex items-center justify-between z-10">
                <h2 className="font-bold">{editLead ? 'Edit Lead' : 'Add New Lead'}</h2>
                <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white"><X size={18} /></button>
              </div>

              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Basic info */}
                {[
                  { label: 'Business Name', key: 'business_name', placeholder: 'Acme Corp' },
                  { label: 'Website', key: 'website', placeholder: 'https://acme.com' },
                  { label: 'Industry', key: 'industry', placeholder: 'E-Commerce' },
                  { label: 'Contact Email', key: 'contact_email', placeholder: 'hello@acme.com' },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs text-slate-500 mb-1.5 font-mono uppercase tracking-wider">{label}</label>
                    <input value={(form as any)[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder} className={inp} />
                  </div>
                ))}

                {/* Score */}
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-mono uppercase tracking-wider">Website Quality (0–10)</label>
                  <input type="number" min={0} max={10} value={form.website_quality_score ?? ''} onChange={e => setForm(f => ({ ...f, website_quality_score: e.target.value ? Number(e.target.value) : null }))}
                    placeholder="7" className={inp} />
                </div>

                {/* Selects */}
                {[
                  { label: 'Mobile Responsiveness', key: 'mobile_responsiveness', opts: ['Good', 'Average', 'Poor', 'None'] },
                  { label: 'WhatsApp Integration', key: 'whatsapp_integration', opts: ['Yes', 'No', 'Partial'] },
                  { label: 'SEO Quality', key: 'seo_quality', opts: ['Good', 'Average', 'Poor', 'None'] },
                  { label: 'AI Opportunity', key: 'ai_opportunity', opts: ['High', 'Medium', 'Low', 'None'] },
                  { label: 'Outreach Status', key: 'outreach_status', opts: STATUS_OPTIONS },
                  { label: 'Response Status', key: 'response_status', opts: RESPONSE_OPTIONS },
                ].map(({ label, key, opts }) => (
                  <div key={key}>
                    <label className="block text-xs text-slate-500 mb-1.5 font-mono uppercase tracking-wider">{label}</label>
                    <select value={(form as any)[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className={sel}>
                      <option value="">Select...</option>
                      {opts.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}

                {/* Dates */}
                {[
                  { label: 'Last Contacted', key: 'last_contacted' },
                  { label: 'Follow-Up Date', key: 'follow_up_date' },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <label className="block text-xs text-slate-500 mb-1.5 font-mono uppercase tracking-wider">{label}</label>
                    <input type="date" value={(form as any)[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value || null }))} className={inp} />
                  </div>
                ))}

                {/* Checkboxes */}
                <div className="sm:col-span-2 flex flex-wrap gap-6">
                  {[
                    { label: 'Has Dashboard/System', key: 'has_dashboard' },
                    { label: 'Email Sent', key: 'email_sent' },
                    { label: 'Reply Received', key: 'reply_received' },
                    { label: 'Meeting Booked', key: 'meeting_booked' },
                  ].map(({ label, key }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={!!(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                        className="w-4 h-4 accent-[#00D67D]" />
                      <span className="text-sm text-slate-300">{label}</span>
                    </label>
                  ))}
                </div>

                {/* Textareas */}
                {[
                  { label: 'Weak Points', key: 'weak_points', placeholder: 'Poor mobile UX, no SEO...' },
                  { label: 'Possible Improvements', key: 'possible_improvements', placeholder: 'Add dashboard, improve speed...' },
                ].map(({ label, key, placeholder }) => (
                  <div key={key} className="sm:col-span-2">
                    <label className="block text-xs text-slate-500 mb-1.5 font-mono uppercase tracking-wider">{label}</label>
                    <textarea rows={3} value={(form as any)[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder} className={`${inp} resize-none`} />
                  </div>
                ))}
              </div>

              <div className="sticky bottom-0 bg-[#0A0A0A] px-6 py-4 border-t border-white/5 flex gap-3 justify-end">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors">Cancel</button>
                <button onClick={saveLead} disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#00D67D] text-black font-bold text-sm hover:bg-[#00c06e] transition-colors disabled:opacity-60">
                  <Save size={14} /> {saving ? 'Saving...' : 'Save Lead'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
