'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Megaphone, Plus, X, Play, Pause, Trash2, ChevronDown,
  Mail, MessageCircle, Linkedin, Calendar, Users,
  CheckCircle2, AlertCircle, RefreshCw, Eye,
} from 'lucide-react';
import { Campaign, CampaignChannel, Lead, ScheduledMessage } from '@/lib/supabase';

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } };

// ── Helpers ──────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  draft:     'text-slate-400 bg-slate-400/10 border-slate-400/20',
  active:    'text-[#00D67D] bg-[#00D67D]/10 border-[#00D67D]/20',
  paused:    'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  completed: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
};

const MSG_STATUS_STYLES: Record<string, string> = {
  pending:   'text-yellow-500 bg-yellow-500/10',
  sent:      'text-[#00D67D] bg-[#00D67D]/10',
  failed:    'text-red-400 bg-red-400/10',
  cancelled: 'text-slate-500 bg-slate-500/10',
};

const CHANNEL_ICONS: Record<CampaignChannel, React.ReactNode> = {
  email:    <Mail size={13} />,
  whatsapp: <MessageCircle size={13} />,
  linkedin: <Linkedin size={13} />,
};

const CHANNEL_COLORS: Record<CampaignChannel, string> = {
  email:    'text-blue-400',
  whatsapp: 'text-[#25D366]',
  linkedin: 'text-blue-500',
};

// Auto-sequence day offsets per step
const STEP_OFFSETS = [0, 3, 7, 14];

function addDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

// ── Sub-components ────────────────────────────

function ChannelBadge({ channel }: { channel: CampaignChannel }) {
  return (
    <span className={`flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md border ${CHANNEL_COLORS[channel]} bg-white/5 border-white/10`}>
      {CHANNEL_ICONS[channel]} {channel}
    </span>
  );
}

// ── Detail Modal ──────────────────────────────

function DetailModal({
  campaign,
  leads,
  onClose,
}: {
  campaign: Campaign;
  leads: Lead[];
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<ScheduledMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [processResult, setProcessResult] = useState('');

  useEffect(() => {
    fetch(`/api/scheduled-messages?campaign_id=${campaign.id}`)
      .then(r => r.json())
      .then(d => { setMessages(Array.isArray(d) ? d : []); setLoading(false); });
  }, [campaign.id]);

  const leadMap = Object.fromEntries(leads.map(l => [l.id, l.business_name]));

  async function cancelMessage(id: string) {
    await fetch(`/api/scheduled-messages?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    });
    setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'cancelled' } : m));
  }

  async function processQueue() {
    setProcessing(true);
    setProcessResult('');
    const res = await fetch('/api/scheduled-messages/process', { method: 'POST' });
    const data = await res.json();
    setProcessResult(`Processed ${data.processed} message(s).`);
    // Refresh
    const r2 = await fetch(`/api/scheduled-messages?campaign_id=${campaign.id}`);
    const d2 = await r2.json();
    setMessages(Array.isArray(d2) ? d2 : []);
    setProcessing(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-2xl admin-surface border admin-border-md rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b admin-border">
          <div>
            <h2 className="font-bold text-[15px] admin-text">{campaign.name}</h2>
            <p className="text-[11px] admin-muted mt-0.5">{messages.length} scheduled messages</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={processQueue}
              disabled={processing}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#00D67D]/10 border border-[#00D67D]/20 text-[#00D67D] hover:bg-[#00D67D]/20 transition-colors disabled:opacity-40"
            >
              {processing ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
              Process Queue
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg admin-muted admin-hover transition-colors"><X size={15} /></button>
          </div>
        </div>

        {processResult && (
          <div className="px-5 py-2 bg-[#00D67D]/5 border-b border-[#00D67D]/10 text-xs text-[#00D67D]">
            {processResult}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12 admin-muted text-sm">Loading…</div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Calendar size={28} className="text-slate-700" />
              <p className="text-sm admin-muted">No scheduled messages for this campaign.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b admin-border">
                  <th className="text-left px-5 py-3 label-xs">Lead</th>
                  <th className="text-left px-3 py-3 label-xs">Channel</th>
                  <th className="text-left px-3 py-3 label-xs">Step</th>
                  <th className="text-left px-3 py-3 label-xs">Scheduled</th>
                  <th className="text-left px-3 py-3 label-xs">Status</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {messages.map(msg => (
                  <tr key={msg.id} className="border-b admin-border last:border-0 admin-hover transition-colors">
                    <td className="px-5 py-3 admin-text font-medium truncate max-w-[140px]">
                      {leadMap[msg.lead_id] || msg.lead_id.slice(0, 8)}
                    </td>
                    <td className="px-3 py-3">
                      <ChannelBadge channel={msg.channel} />
                    </td>
                    <td className="px-3 py-3 text-xs admin-muted font-mono">#{msg.sequence_step}</td>
                    <td className="px-3 py-3 text-xs admin-muted">
                      {new Date(msg.scheduled_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${MSG_STATUS_STYLES[msg.status] || ''}`}>
                        {msg.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {msg.status === 'pending' && (
                        <button
                          onClick={() => cancelMessage(msg.id!)}
                          className="text-[10px] text-red-400 hover:text-red-300 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Panel ───────────────────────────────

export default function CampaignsPanel() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [detailCampaign, setDetailCampaign] = useState<Campaign | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/campaigns').then(r => r.json()),
      fetch('/api/leads').then(r => r.json()),
    ]).then(([c, l]) => {
      setCampaigns(Array.isArray(c) ? c : []);
      setLeads(Array.isArray(l) ? l : []);
      setLoading(false);
    });
  }, []);

  async function toggleStatus(campaign: Campaign) {
    const next = campaign.status === 'active' ? 'paused' : 'active';
    const res = await fetch(`/api/campaigns?id=${campaign.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    const updated = await res.json();
    setCampaigns(prev => prev.map(c => c.id === campaign.id ? updated : c));
  }

  async function deleteCampaign(id: string) {
    setDeleting(id);
    await fetch(`/api/campaigns?id=${id}`, { method: 'DELETE' });
    setCampaigns(prev => prev.filter(c => c.id !== id));
    setDeleting(null);
  }

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <motion.div {...fadeUp} className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-[15px] admin-text">Campaigns</h2>
          <p className="text-[12px] admin-muted mt-0.5">Multi-channel outreach campaigns</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-black font-bold text-[13px] transition-colors"
          style={{ background: 'var(--accent)' }}
        >
          <Plus size={15} /> New Campaign
        </button>
      </motion.div>

      {/* Campaign list */}
      {loading ? (
        <div className="flex items-center justify-center py-16 admin-muted text-sm">Loading…</div>
      ) : campaigns.length === 0 ? (
        <motion.div {...fadeUp} className="flex flex-col items-center justify-center py-16 gap-3 border border-dashed admin-border rounded-2xl">
          <Megaphone size={32} className="text-slate-700" />
          <p className="text-sm admin-muted">No campaigns yet.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="text-xs text-[#00D67D] hover:underline"
          >
            Create your first campaign →
          </button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c, i) => (
            <motion.div
              key={c.id}
              {...fadeUp}
              transition={{ delay: i * 0.05 }}
              className="admin-card p-4 lg:p-5"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-sm admin-text">{c.name}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${STATUS_STYLES[c.status]}`}>
                      {c.status}
                    </span>
                  </div>
                  {c.description && (
                    <p className="text-xs admin-muted mb-2 truncate">{c.description}</p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    {(c.channels as CampaignChannel[]).map(ch => (
                      <ChannelBadge key={ch} channel={ch} />
                    ))}
                    <span className="flex items-center gap-1 text-[10px] admin-muted">
                      <Users size={11} /> {c.lead_ids?.length ?? 0} leads
                    </span>
                    <span className="flex items-center gap-1 text-[10px] admin-muted">
                      <Calendar size={11} />
                      {c.start_date ? new Date(c.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setDetailCampaign(c)}
                    className="p-2 rounded-lg admin-muted admin-hover border admin-border transition-colors"
                    title="View details"
                  >
                    <Eye size={14} />
                  </button>
                  {(c.status === 'active' || c.status === 'paused') && (
                    <button
                      onClick={() => toggleStatus(c)}
                      className={`p-2 rounded-lg border transition-colors ${
                        c.status === 'active'
                          ? 'text-yellow-400 bg-yellow-400/5 border-yellow-400/20 hover:bg-yellow-400/10'
                          : 'text-[#00D67D] bg-[#00D67D]/5 border-[#00D67D]/20 hover:bg-[#00D67D]/10'
                      }`}
                      title={c.status === 'active' ? 'Pause' : 'Resume'}
                    >
                      {c.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                  )}
                  <button
                    onClick={() => deleteCampaign(c.id!)}
                    disabled={deleting === c.id}
                    className="p-2 rounded-lg text-red-400 bg-red-400/5 border border-red-400/20 hover:bg-red-400/10 transition-colors disabled:opacity-40"
                    title="Delete"
                  >
                    {deleting === c.id ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showCreate && (
          <CreateModal
            leads={leads}
            onClose={() => setShowCreate(false)}
            onCreated={c => setCampaigns(prev => [c, ...prev])}
          />
        )}
        {detailCampaign && (
          <DetailModal
            campaign={detailCampaign}
            leads={leads}
            onClose={() => setDetailCampaign(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Create Campaign Modal ─────────────────────

function CreateModal({
  leads,
  onClose,
  onCreated,
}: {
  leads: Lead[];
  onClose: () => void;
  onCreated: (c: Campaign) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [channels, setChannels] = useState<CampaignChannel[]>(['email']);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [autoSeq, setAutoSeq] = useState(true);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [manualDates, setManualDates] = useState<string[]>(['', '', '', '']);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function toggleChannel(ch: CampaignChannel) {
    setChannels(prev =>
      prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]
    );
  }

  function toggleLead(id: string) {
    setSelectedLeadIds(prev =>
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    );
  }

  function toggleAllLeads() {
    if (selectedLeadIds.length === leads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(leads.map(l => l.id!));
    }
  }

  async function save(activate: boolean) {
    if (!name.trim()) { setError('Campaign name is required.'); return; }
    if (channels.length === 0) { setError('Select at least one channel.'); return; }
    if (selectedLeadIds.length === 0) { setError('Select at least one lead.'); return; }

    setSaving(true);
    setError('');

    try {
      const status = activate ? 'active' : 'draft';
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          status,
          channels,
          lead_ids: selectedLeadIds,
          auto_sequence: autoSeq,
          start_date: startDate,
        }),
      });
      const campaign: Campaign = await res.json();
      if (!res.ok) throw new Error((campaign as any).error || 'Failed to create campaign');

      // If activating, schedule messages
      if (activate && campaign.id) {
        const base = new Date(startDate);
        const rows: Omit<ScheduledMessage, 'id' | 'created_at'>[] = [];

        for (const leadId of selectedLeadIds) {
          for (const channel of channels) {
            const steps = channel === 'linkedin' ? [1] : [1, 2, 3, 4];
            for (const step of steps) {
              const offset = autoSeq ? STEP_OFFSETS[step - 1] : 0;
              const scheduledAt = autoSeq
                ? addDays(base, offset)
                : (manualDates[step - 1] ? new Date(manualDates[step - 1]).toISOString() : addDays(base, offset));

              rows.push({
                campaign_id: campaign.id!,
                lead_id: leadId,
                channel,
                sequence_step: step,
                scheduled_at: scheduledAt,
                status: 'pending',
                sent_at: null,
                message_body: null,
                subject: null,
              });
            }
          }
        }

        await fetch('/api/scheduled-messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rows),
        });
      }

      onCreated(campaign);
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-lg admin-surface border admin-border-md rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b admin-border">
          <div>
            <h2 className="font-bold text-[15px] admin-text">New Campaign</h2>
            <p className="text-[11px] admin-muted mt-0.5">Configure channels, leads & schedule</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl admin-muted admin-hover border admin-border transition-colors"><X size={14} /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="label-xs mb-1.5 block">Campaign Name *</label>
            <input
              value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Lagos Restaurants Q3"
              className="w-full admin-input border rounded-xl px-3 py-2.5 text-[13px] outline-none transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="label-xs mb-1.5 block">Description</label>
            <textarea
              value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Optional notes about this campaign…"
              rows={2}
              className="w-full admin-input border rounded-xl px-3 py-2.5 text-[13px] outline-none transition-colors resize-none"
            />
          </div>

          {/* Channels */}
          <div>
            <label className="label-xs mb-2 block">Channels *</label>
            <div className="flex gap-2 flex-wrap">
              {(['email', 'whatsapp', 'linkedin'] as CampaignChannel[]).map(ch => (
                <button
                  key={ch}
                  onClick={() => toggleChannel(ch)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                    channels.includes(ch)
                      ? `${CHANNEL_COLORS[ch]} bg-white/5 border-white/20`
                      : 'admin-border admin-muted admin-hover'
                  }`}
                >
                  {CHANNEL_ICONS[ch]} {ch.charAt(0).toUpperCase() + ch.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Lead selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label-xs">Leads *</label>
              <button onClick={toggleAllLeads} className="text-[10px] text-[#00D67D] hover:underline">
                {selectedLeadIds.length === leads.length ? 'Deselect all' : 'Select all'}
              </button>
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {leads.map(l => (
                <label
                  key={l.id}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all text-sm ${
                    selectedLeadIds.includes(l.id!)
                      ? 'bg-[#00D67D]/5 border-[#00D67D]/20'
                      : 'admin-border admin-hover'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedLeadIds.includes(l.id!)}
                    onChange={() => toggleLead(l.id!)}
                    className="accent-[#00D67D] w-3.5 h-3.5 flex-shrink-0"
                  />
                  <span className="admin-text font-medium truncate">{l.business_name}</span>
                  <span className="admin-muted text-[11px] ml-auto flex-shrink-0">{l.industry || '—'}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Scheduling */}
          <div>
            <label className="label-xs mb-2 block">Scheduling</label>
            <div className="flex gap-2 mb-3">
              {[true, false].map(v => (
                <button
                  key={String(v)}
                  onClick={() => setAutoSeq(v)}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all ${
                    autoSeq === v
                      ? 'bg-[#00D67D]/10 text-[#00D67D] border-[#00D67D]/20'
                      : 'admin-border admin-muted admin-hover'
                  }`}
                >
                  {v ? 'Auto-sequence' : 'Manual dates'}
                </button>
              ))}
            </div>

            <div>
              <label className="label-xs mb-1.5 block">Start Date & Time</label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full admin-input border rounded-xl px-3 py-2.5 text-[13px] outline-none transition-colors"
              />
            </div>

            {autoSeq && (
              <div className="mt-2 p-3 rounded-xl bg-white/[0.02] border admin-border text-xs admin-muted space-y-1">
                <div>Step 1 — Day 0 (start date)</div>
                <div>Step 2 — Day +3</div>
                <div>Step 3 — Day +7</div>
                <div>Step 4 — Day +14 (breakup)</div>
                <div className="text-[10px] admin-subtle mt-1">LinkedIn sends step 1 only (copy-only, no API).</div>
              </div>
            )}

            {!autoSeq && (
              <div className="mt-2 space-y-2">
                {['Step 1', 'Step 2', 'Step 3', 'Step 4 (Breakup)'].map((label, i) => (
                  <div key={i}>
                    <label className="text-[10px] admin-muted mb-0.5 block">{label}</label>
                    <input
                      type="datetime-local"
                      value={manualDates[i]}
                      onChange={e => {
                        const next = [...manualDates];
                        next[i] = e.target.value;
                        setManualDates(next);
                      }}
                      className="w-full admin-input border rounded-xl px-3 py-2 text-sm outline-none focus:border-[#00D67D]/40 transition-colors"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              <AlertCircle size={13} /> {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-4 border-t admin-border">
          <button
            onClick={() => save(false)}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl border admin-border text-[13px] admin-muted admin-hover transition-colors disabled:opacity-40"
          >
            Save as Draft
          </button>
          <button
            onClick={() => save(true)}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-black font-bold text-[13px] transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: 'var(--accent)' }}
          >
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
            {saving ? 'Saving…' : 'Activate'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
