'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw, Plus, X, Play, Pause, Trash2,
  Calendar, Users, Eye, Megaphone, Mail, MessageCircle, Linkedin, Twitter,
} from 'lucide-react';
import { Campaign, CampaignChannel, Lead, ScheduledMessage } from '@/lib/supabase';

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } };

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

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
  twitter:  <Twitter size={13} />,
};

const CHANNEL_COLORS: Record<CampaignChannel, string> = {
  email:    'text-blue-400',
  whatsapp: 'text-[#25D366]',
  linkedin: 'text-blue-500',
  twitter:  'text-sky-400',
};

const CHANNEL_REQUIREMENTS: Record<CampaignChannel, { field: keyof Lead; label: string }> = {
  email:    { field: 'contact_email',   label: 'email' },
  whatsapp: { field: 'whatsapp_number', label: 'WhatsApp number' },
  linkedin: { field: 'linkedin_url',    label: 'LinkedIn URL' },
  twitter:  { field: 'twitter_handle',  label: 'Twitter handle' },
};

const STEP_OFFSETS = [0, 3, 7, 14];
const ALL_CHANNELS: CampaignChannel[] = ['email', 'whatsapp', 'linkedin', 'twitter'];

function addDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

// ─── CHANNEL BADGE ────────────────────────────────────────────────────────────

function ChannelBadge({ channel }: { channel: CampaignChannel }) {
  return (
    <span className={`flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md border ${CHANNEL_COLORS[channel]} bg-white/5 border-white/10`}>
      {CHANNEL_ICONS[channel]} {channel}
    </span>
  );
}

// ─── CHANNEL COVERAGE ─────────────────────────────────────────────────────────

function ChannelCoverage({ channel, leads }: { channel: CampaignChannel; leads: Lead[] }) {
  const req = CHANNEL_REQUIREMENTS[channel];
  if (!req) return null;
  const covered = leads.filter(l => !!l[req.field]).length;
  const pct = leads.length > 0 ? Math.round((covered / leads.length) * 100) : 0;
  return (
    <div className="flex items-center gap-1.5 text-[10px] admin-muted">
      <div className="w-12 h-1 rounded-full overflow-hidden" style={{ background: 'var(--admin-surface-3)' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--accent)' }} />
      </div>
      <span>{covered}/{leads.length} have {req.label}</span>
    </div>
  );
}

// ─── DETAIL MODAL ─────────────────────────────────────────────────────────────

function DetailModal({ campaign, leads, onClose }: { campaign: Campaign; leads: Lead[]; onClose: () => void }) {
  const [messages, setMessages]       = useState<ScheduledMessage[]>([]);
  const [loading, setLoading]         = useState(true);
  const [processing, setProcessing]   = useState(false);
  const [processResult, setProcessResult] = useState('');

  useEffect(() => {
    fetch(`/api/scheduled-messages?campaign_id=${campaign.id}`)
      .then(r => r.json())
      .then(d => { setMessages(Array.isArray(d) ? d : []); setLoading(false); });
  }, [campaign.id]);

  const leadMap = Object.fromEntries(leads.map(l => [l.id, l.business_name]));

  async function cancelMessage(id: string) {
    await fetch(`/api/scheduled-messages?id=${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    });
    setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'cancelled' } : m));
  }

  async function processQueue() {
    setProcessing(true); setProcessResult('');
    const res = await fetch('/api/scheduled-messages/process', { method: 'POST' });
    const data = await res.json();
    setProcessResult(`Processed ${data.processed} message(s).`);
    const refreshed = await fetch(`/api/scheduled-messages?campaign_id=${campaign.id}`).then(r => r.json());
    setMessages(Array.isArray(refreshed) ? refreshed : []);
    setProcessing(false);
  }

  const pending = messages.filter(m => m.status === 'pending');
  const sent    = messages.filter(m => m.status === 'sent');
  const failed  = messages.filter(m => m.status === 'failed');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-2xl admin-surface border admin-border-md rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b admin-border">
          <div>
            <h2 className="font-bold text-[15px] admin-text">{campaign.name}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${STATUS_STYLES[campaign.status]}`}>{campaign.status}</span>
              {(campaign.channels as CampaignChannel[]).map(ch => <ChannelBadge key={ch} channel={ch} />)}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl admin-muted admin-hover border admin-border transition-colors"><X size={14} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Pending', value: pending.length, style: 'text-yellow-400' },
              { label: 'Sent',    value: sent.length,    style: 'text-[#00D67D]' },
              { label: 'Failed',  value: failed.length,  style: 'text-red-400' },
            ].map(s => (
              <div key={s.label} className="admin-card p-3 text-center">
                <div className={`text-xl font-bold ${s.style}`}>{s.value}</div>
                <div className="text-[10px] admin-muted font-mono uppercase tracking-wider mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
          {pending.length > 0 && (
            <div className="flex items-center gap-3">
              <button onClick={processQueue} disabled={processing}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-black font-bold text-[13px] transition-colors disabled:opacity-40"
                style={{ background: 'var(--accent)' }}>
                {processing ? <RefreshCw size={13} className="animate-spin" /> : <Play size={13} />}
                {processing ? 'Processing…' : `Process ${pending.length} pending`}
              </button>
              {processResult && <span className="text-xs text-[#00D67D]">{processResult}</span>}
            </div>
          )}
          {loading ? (
            <div className="flex items-center justify-center py-8 admin-muted text-sm">Loading…</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 admin-muted text-sm">No scheduled messages.</div>
          ) : (
            <div className="space-y-2">
              {messages.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl border admin-border admin-card text-xs">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono ${MSG_STATUS_STYLES[m.status]}`}>{m.status}</span>
                  <span className={`${CHANNEL_COLORS[m.channel as CampaignChannel]} flex items-center gap-1`}>
                    {CHANNEL_ICONS[m.channel as CampaignChannel]} {m.channel}
                  </span>
                  <span className="admin-text font-medium truncate flex-1">{leadMap[m.lead_id] ?? m.lead_id}</span>
                  <span className="admin-muted flex-shrink-0">Step {m.sequence_step}</span>
                  <span className="admin-muted flex-shrink-0">
                    {new Date(m.scheduled_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                  {m.status === 'pending' && (
                    <button onClick={() => cancelMessage(m.id!)}
                      className="p-1 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors flex-shrink-0" title="Cancel">
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── CREATE MODAL ─────────────────────────────────────────────────────────────

function CreateModal({ leads, onClose, onCreated }: { leads: Lead[]; onClose: () => void; onCreated: (c: Campaign) => void }) {
  const [name, setName]               = useState('');
  const [description, setDescription] = useState('');
  const [channels, setChannels]       = useState<CampaignChannel[]>(['email']);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [startDate, setStartDate]     = useState(() => new Date().toISOString().slice(0, 16));
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');

  const inp = 'w-full admin-input border admin-border-md rounded-xl px-3 py-2.5 text-[13px] outline-none transition-colors';

  function toggleChannel(ch: CampaignChannel) {
    setChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
  }
  function toggleLead(id: string) {
    setSelectedLeadIds(prev => prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]);
  }
  function toggleAllLeads() {
    setSelectedLeadIds(prev => prev.length === leads.length ? [] : leads.map(l => l.id!));
  }

  async function save(activate: boolean) {
    if (!name.trim())                 { setError('Campaign name is required.'); return; }
    if (channels.length === 0)        { setError('Select at least one channel.'); return; }
    if (selectedLeadIds.length === 0) { setError('Select at least one lead.'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(), description: description.trim(),
          status: activate ? 'active' : 'draft',
          channels, lead_ids: selectedLeadIds,
          auto_sequence: true, start_date: startDate,
        }),
      });
      const campaignData = await res.json();
      if (!res.ok) throw new Error(campaignData.error || 'Failed to create campaign');
      const campaign: Campaign = campaignData;
      if (activate && campaign.id) {
        const base = new Date(startDate);
        const rows: Omit<ScheduledMessage, 'id' | 'created_at'>[] = [];
        for (const leadId of selectedLeadIds) {
          for (const channel of channels) {
            const steps = (channel === 'linkedin' || channel === 'twitter') ? [1] : [1, 2, 3, 4];
            for (const step of steps) {
              rows.push({
                campaign_id: campaign.id!, lead_id: leadId, channel,
                sequence_step: step, scheduled_at: addDays(base, STEP_OFFSETS[step - 1]),
                status: 'pending', sent_at: null, message_body: null, subject: null,
              });
            }
          }
        }
        await fetch('/api/scheduled-messages', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rows),
        });
      }
      onCreated(campaign);
      onClose();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-lg admin-surface border admin-border-md rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b admin-border">
          <div>
            <h2 className="font-bold text-[15px] admin-text">New Campaign</h2>
            <p className="text-[11px] admin-muted mt-0.5">Configure channels, leads & schedule</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl admin-muted admin-hover border admin-border transition-colors"><X size={14} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="label-xs mb-1.5 block">Campaign Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Lagos Restaurants Q3" className={inp} />
          </div>
          <div>
            <label className="label-xs mb-1.5 block">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional notes…" rows={2}
              className={`${inp} resize-none`} />
          </div>
          <div>
            <label className="label-xs mb-2 block">Channels</label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_CHANNELS.map(ch => (
                <button key={ch} onClick={() => toggleChannel(ch)}
                  className={`flex flex-col gap-1 p-3 rounded-xl border text-left transition-all ${
                    channels.includes(ch)
                      ? `${CHANNEL_COLORS[ch]} bg-white/5 border-white/15`
                      : 'admin-hover admin-border admin-muted'
                  }`}>
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    {CHANNEL_ICONS[ch]} {ch}
                  </div>
                  {channels.includes(ch) && selectedLeadIds.length > 0 && (
                    <ChannelCoverage channel={ch} leads={leads.filter(l => selectedLeadIds.includes(l.id!))} />
                  )}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label-xs">Leads ({selectedLeadIds.length} selected)</label>
              <button onClick={toggleAllLeads} className="text-[10px] text-[#00D67D] hover:underline">
                {selectedLeadIds.length === leads.length ? 'Deselect all' : 'Select all'}
              </button>
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
              {leads.map(l => (
                <button key={l.id} onClick={() => toggleLead(l.id!)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all text-xs ${
                    selectedLeadIds.includes(l.id!)
                      ? 'bg-[#00D67D]/8 border-[#00D67D]/25 text-[#00D67D]'
                      : 'admin-hover admin-border admin-muted'
                  }`}>
                  <div className={`w-3.5 h-3.5 rounded flex-shrink-0 border flex items-center justify-center transition-all ${
                    selectedLeadIds.includes(l.id!) ? 'bg-[#00D67D] border-[#00D67D]' : 'border-white/20'
                  }`}>
                    {selectedLeadIds.includes(l.id!) && <span className="text-black text-[8px] font-bold">✓</span>}
                  </div>
                  <span className="truncate font-medium admin-text">{l.business_name}</span>
                  <span className="admin-muted truncate">{l.contact_email}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label-xs mb-1.5 block">Start Date & Time</label>
            <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} className={inp} />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>
        <div className="px-5 py-4 border-t admin-border flex gap-3">
          <button onClick={() => save(true)} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-black font-bold text-[13px] transition-colors disabled:opacity-40"
            style={{ background: 'var(--accent)' }}>
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
            Activate
          </button>
          <button onClick={() => save(false)} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl admin-muted admin-hover border admin-border font-semibold text-[13px] transition-colors disabled:opacity-40">
            Save as Draft
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────

export default function CampaignsPanel() {
  const [leads, setLeads]               = useState<Lead[]>([]);
  const [campaigns, setCampaigns]       = useState<Campaign[]>([]);
  const [loading, setLoading]           = useState(true);
  const [showCreate, setShowCreate]     = useState(false);
  const [detailCampaign, setDetailCampaign] = useState<Campaign | null>(null);
  const [deleting, setDeleting]         = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/leads').then(r => r.json()).then(d => setLeads(Array.isArray(d) ? d : []));
    fetch('/api/campaigns').then(r => r.json()).then(d => { setCampaigns(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  async function toggleStatus(campaign: Campaign) {
    const next = campaign.status === 'active' ? 'paused' : 'active';
    const res = await fetch(`/api/campaigns?id=${campaign.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
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
    <div className="space-y-4 max-w-7xl mx-auto lg:mx-0">
      <div className="flex items-center justify-between">
        <p className="text-[12px] admin-muted">Multi-channel outreach sequences</p>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-black font-bold text-[13px] transition-colors"
          style={{ background: 'var(--accent)' }}>
          <Plus size={15} /> New Campaign
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 admin-muted text-sm">Loading…</div>
      ) : campaigns.length === 0 ? (
        <motion.div {...fadeUp} className="flex flex-col items-center justify-center py-16 gap-3 border border-dashed admin-border rounded-2xl">
          <Megaphone size={32} className="text-slate-700" />
          <p className="text-sm admin-muted">No campaigns yet.</p>
          <button onClick={() => setShowCreate(true)} className="text-xs text-[#00D67D] hover:underline">
            Create your first campaign →
          </button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c, i) => (
            <motion.div key={c.id} {...fadeUp} transition={{ delay: i * 0.05 }} className="admin-card p-4 lg:p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-sm admin-text">{c.name}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${STATUS_STYLES[c.status]}`}>{c.status}</span>
                  </div>
                  {c.description && <p className="text-xs admin-muted mb-2 truncate">{c.description}</p>}
                  <div className="flex items-center gap-2 flex-wrap">
                    {(c.channels as CampaignChannel[]).map(ch => <ChannelBadge key={ch} channel={ch} />)}
                    <span className="flex items-center gap-1 text-[10px] admin-muted"><Users size={11} /> {c.lead_ids?.length ?? 0} leads</span>
                    <span className="flex items-center gap-1 text-[10px] admin-muted">
                      <Calendar size={11} />
                      {c.start_date ? new Date(c.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => setDetailCampaign(c)}
                    className="p-2 rounded-lg admin-muted admin-hover border admin-border transition-colors" title="View details">
                    <Eye size={14} />
                  </button>
                  {(c.status === 'active' || c.status === 'paused') && (
                    <button onClick={() => toggleStatus(c)}
                      className={`p-2 rounded-lg border transition-colors ${
                        c.status === 'active'
                          ? 'text-yellow-400 bg-yellow-400/5 border-yellow-400/20 hover:bg-yellow-400/10'
                          : 'text-[#00D67D] bg-[#00D67D]/5 border-[#00D67D]/20 hover:bg-[#00D67D]/10'
                      }`} title={c.status === 'active' ? 'Pause' : 'Resume'}>
                      {c.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                  )}
                  <button onClick={() => deleteCampaign(c.id!)} disabled={deleting === c.id}
                    className="p-2 rounded-lg text-red-400 bg-red-400/5 border border-red-400/20 hover:bg-red-400/10 transition-colors disabled:opacity-40" title="Delete">
                    {deleting === c.id ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showCreate && (
          <CreateModal leads={leads} onClose={() => setShowCreate(false)}
            onCreated={c => setCampaigns(prev => [c, ...prev])} />
        )}
        {detailCampaign && (
          <DetailModal campaign={detailCampaign} leads={leads} onClose={() => setDetailCampaign(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
