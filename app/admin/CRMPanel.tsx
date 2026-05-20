'use client';

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, Save, Trash2, Search, ChevronDown, Mail,
  MessageCircle, Linkedin, Twitter, Filter, Download,
  CheckSquare, Square, ArrowUpDown, MoreHorizontal
} from 'lucide-react';
import { Lead } from '@/lib/supabase';
import { OUTREACH_STATUSES, RESPONSE_STATUSES } from '@/lib/constants';
import { ToastStack, useToast } from '@/app/components/Toast';

// ... Keep your EMPTY_LEAD, exportCSV, and sortLeads functions exactly the same ...
// (I am omitting them here for brevity, paste them from your original file)

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    'Pending': 'bg-amber-500/10 text-amber-500 ring-amber-500/20',
    'Sent': 'bg-emerald-500/10 text-emerald-500 ring-emerald-500/20',
    'Replied': 'bg-blue-500/10 text-blue-400 ring-blue-500/20',
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

// ... Keep LeadModal the same, just change its container classes to:
// className="bg-zinc-900/80 backdrop-blur-2xl border border-white/10 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[90vh] flex flex-col outline-none shadow-2xl"

export default function CRMPanel() {
  // ... Keep all your state and useEffect hooks exactly the same ...
  // (leads, search, selection, bulk updating, saving logic, etc.)

  return (
    <div className="space-y-6 max-w-full min-w-0 pb-12">
      <ToastStack toasts={toasts} onDismiss={dismiss} />

      {/* Modern Toolbar */}
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
          <button onClick={() => exportCSV(filtered)} className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 text-sm font-medium transition-all">
            <Download size={16} /> <span className="hidden sm:inline">Export</span>
          </button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={openAdd} className="flex items-center justify-center gap-2 px-5 py-3 text-black font-semibold text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(0,214,125,0.2)]" style={{ background: 'var(--accent)' }}>
            <Plus size={16} /> Add Prospect
          </motion.button>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-4 rounded-2xl bg-zinc-900/90 backdrop-blur-xl border border-white/10 shadow-2xl">
            <div className="flex items-center gap-3 border-r border-white/10 pr-4">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#00D67D]/20 text-[#00D67D] text-xs font-bold">{selected.size}</span>
              <span className="text-sm font-medium text-zinc-200">Selected</span>
            </div>
            <div className="relative min-w-[180px]">
              <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-200 outline-none appearance-none cursor-pointer hover:border-white/20 transition-colors">
                <option value="">Change status to…</option>
                {OUTREACH_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            </div>
            <button onClick={applyBulkStatus} disabled={!bulkStatus || bulkUpdating} className="px-5 py-2.5 rounded-xl text-black font-semibold text-sm transition-all disabled:opacity-50 hover:opacity-90" style={{ background: 'var(--accent)' }}>
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
              {filtered.map(lead => {
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
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 flex items-center justify-center text-xs font-bold text-zinc-300 shadow-inner">
                          {lead.business_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-zinc-200">{lead.business_name}</div>
                          <div className="text-xs text-zinc-500">{lead.industry || 'No industry'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-zinc-300">{lead.contact_email}</div>
                      {lead.follow_up_date && <div className="text-xs text-zinc-500 mt-0.5">Follow up: {lead.follow_up_date}</div>}
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
                        <span className={`p-1.5 rounded-md ${lead.contact_email ? 'bg-blue-500/10 text-blue-400' : 'bg-white/5 text-zinc-600'}`}><Mail size={14} /></span>
                        <span className={`p-1.5 rounded-md ${lead.whatsapp_number ? 'bg-[#25D366]/10 text-[#25D366]' : 'bg-white/5 text-zinc-600'}`}><MessageCircle size={14} /></span>
                        <span className={`p-1.5 rounded-md ${lead.linkedin_url ? 'bg-blue-500/10 text-blue-500' : 'bg-white/5 text-zinc-600'}`}><Linkedin size={14} /></span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(lead)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors">Edit</button>
                        <button onClick={() => deleteLead(lead.id!, lead.business_name)} className="p-1.5 rounded-lg text-red-400/70 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}