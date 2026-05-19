'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Copy, CheckCircle2, RefreshCw, AlertCircle,
  Instagram, Twitter, Search, Mail, MessageCircle, Linkedin,
  ChevronDown, Megaphone, Plus, X, Play, Pause, Trash2,
  Calendar, Users, Eye, Zap, Globe,
} from 'lucide-react';
import { Campaign, CampaignChannel, Lead, ScheduledMessage } from '@/lib/supabase';

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } };

// ─── SHARED TYPES & CONSTANTS ────────────────────────────────────────────────

type Platform = 'instagram' | 'twitter' | 'google_ads' | 'email' | 'whatsapp' | 'linkedin';

const PLATFORMS: { id: Platform; label: string; icon: React.ReactNode; color: string; bg: string }[] = [
  { id: 'instagram', label: 'Instagram',   icon: <Instagram size={15} />,     color: 'text-pink-500',   bg: 'bg-pink-500/10 border-pink-500/20' },
  { id: 'twitter',   label: 'Twitter / X', icon: <Twitter size={15} />,       color: 'text-sky-400',    bg: 'bg-sky-400/10 border-sky-400/20' },
  { id: 'google_ads',label: 'Google Ads',  icon: <Search size={15} />,        color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20' },
  { id: 'email',     label: 'Email',       icon: <Mail size={15} />,          color: 'text-blue-400',   bg: 'bg-blue-400/10 border-blue-400/20' },
  { id: 'whatsapp',  label: 'WhatsApp',    icon: <MessageCircle size={15} />, color: 'text-[#25D366]',  bg: 'bg-[#25D366]/10 border-[#25D366]/20' },
  { id: 'linkedin',  label: 'LinkedIn',    icon: <Linkedin size={15} />,      color: 'text-blue-500',   bg: 'bg-blue-500/10 border-blue-500/20' },
];

const TONES = ['Professional', 'Friendly', 'Bold', 'Urgent', 'Witty'];
const GOALS = ['Awareness', 'Clicks', 'Leads', 'Sales', 'Engagement'];

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

const CHANNEL_REQUIREMENTS: Record<CampaignChannel, { field: keyof import('@/lib/supabase').Lead; label: string }> = {
  email:    { field: 'contact_email',   label: 'email' },
  whatsapp: { field: 'whatsapp_number', label: 'WhatsApp number' },
  linkedin: { field: 'linkedin_url',    label: 'LinkedIn URL' },
  twitter:  { field: 'twitter_handle',  label: 'Twitter handle' },
};

const STEP_OFFSETS = [0, 3, 7, 14];

function addDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

// ─── COPY OUTPUT RENDERER ────────────────────────────────────────────────────

function renderOutput(platform: Platform, raw: string) {
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);

  if (platform === 'instagram') {
    const captionIdx = lines.findIndex(l => l.startsWith('CAPTION:'));
    const hashtagIdx = lines.findIndex(l => l.startsWith('HASHTAGS:'));
    const caption = captionIdx >= 0
      ? lines.slice(captionIdx + 1, hashtagIdx >= 0 ? hashtagIdx : undefined).join('\n')
      : raw;
    const hashtags = hashtagIdx >= 0 ? lines.slice(hashtagIdx + 1).join(' ') : '';
    return (
      <div className="space-y-3">
        <div>
          <div className="text-[10px] font-mono admin-muted uppercase tracking-wider mb-1">Caption</div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap admin-text">{caption}</p>
        </div>
        {hashtags && (
          <div>
            <div className="text-[10px] font-mono admin-muted uppercase tracking-wider mb-1">Hashtags</div>
            <p className="text-xs text-pink-400 leading-relaxed">{hashtags}</p>
          </div>
        )}
      </div>
    );
  }

  if (platform === 'twitter') {
    const tweetIdx = lines.findIndex(l => l.startsWith('TWEET:'));
    const replyIdx = lines.findIndex(l => l.startsWith('REPLY'));
    const tweet = tweetIdx >= 0
      ? lines.slice(tweetIdx + 1, replyIdx >= 0 ? replyIdx : undefined).join('\n')
      : raw;
    const reply = replyIdx >= 0 ? lines.slice(replyIdx + 1).join('\n') : '';
    return (
      <div className="space-y-3">
        <div>
          <div className="text-[10px] font-mono admin-muted uppercase tracking-wider mb-1">Tweet</div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap admin-text">{tweet}</p>
          <p className="text-[10px] admin-muted mt-1">{tweet.length} / 280 chars</p>
        </div>
        {reply && (
          <div>
            <div className="text-[10px] font-mono admin-muted uppercase tracking-wider mb-1">Reply Thread</div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap admin-text">{reply}</p>
          </div>
        )}
      </div>
    );
  }

  if (platform === 'google_ads') {
    const fields: { label: string; value: string; max: number }[] = [];
    ['HEADLINE_1', 'HEADLINE_2', 'HEADLINE_3'].forEach(key => {
      const line = lines.find(l => l.startsWith(key + ':'));
      if (line) fields.push({ label: key.replace(/_/g, ' '), value: line.replace(key + ':', '').trim(), max: 30 });
    });
    ['DESCRIPTION_1', 'DESCRIPTION_2'].forEach(key => {
      const line = lines.find(l => l.startsWith(key + ':'));
      if (line) fields.push({ label: key.replace(/_/g, ' '), value: line.replace(key + ':', '').trim(), max: 90 });
    });
    return (
      <div className="space-y-2">
        {fields.map(f => (
          <div key={f.label}>
            <div className="text-[10px] font-mono admin-muted uppercase tracking-wider mb-0.5">{f.label}</div>
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm admin-text">{f.value}</p>
              <span className={`text-[10px] font-mono flex-shrink-0 ${f.value.length > f.max ? 'text-red-400' : 'admin-muted'}`}>
                {f.value.length}/{f.max}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // email / whatsapp / linkedin — plain paragraphs
  return (
    <div className="space-y-2">
      {lines.map((line, i) => (
        <p key={i} className="text-sm leading-relaxed admin-text">{line}</p>
      ))}
    </div>
  );
}

// ─── SHARED SUB-COMPONENTS ───────────────────────────────────────────────────

function ChannelBadge({ channel }: { channel: CampaignChannel }) {
  return (
    <span className={`flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md border ${CHANNEL_COLORS[channel]} bg-white/5 border-white/10`}>
      {CHANNEL_ICONS[channel]} {channel}
    </span>
  );
}

/** Shows how many leads in a list have the required field for a channel */
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

// ─── CAMPAIGN DETAIL MODAL ───────────────────────────────────────────────────

function DetailModal({ campaign, leads, onClose }: { campaign: Campaign; leads: Lead[]; onClose: () => void }) {
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
    const refreshed = await fetch(`/api/scheduled-messages?campaign_id=${campaign.id}`).then(r => r.json());
    setMessages(Array.isArray(refreshed) ? refreshed : []);
    setProcessing(false);
  }

  const pending = messages.filter(m => m.status === 'pending');
  const sent    = messages.filter(m => m.status === 'sent');
  const failed  = messages.filter(m => m.status === 'failed');

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
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${STATUS_STYLES[campaign.status]}`}>{campaign.status}</span>
              {(campaign.channels as CampaignChannel[]).map(ch => <ChannelBadge key={ch} channel={ch} />)}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl admin-muted admin-hover border admin-border transition-colors"><X size={14} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Stats row */}
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

          {/* Process button */}
          {pending.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                onClick={processQueue}
                disabled={processing}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-black font-bold text-[13px] transition-colors disabled:opacity-40"
                style={{ background: 'var(--accent)' }}
              >
                {processing ? <RefreshCw size={13} className="animate-spin" /> : <Play size={13} />}
                {processing ? 'Processing…' : `Process ${pending.length} pending`}
              </button>
              {processResult && <span className="text-xs text-[#00D67D]">{processResult}</span>}
            </div>
          )}

          {/* Message list */}
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
                    <button onClick={() => cancelMessage(m.id!)} className="p-1 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors flex-shrink-0" title="Cancel">
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

// ─── CREATE CAMPAIGN MODAL ───────────────────────────────────────────────────

function CreateModal({ leads, onClose, onCreated }: { leads: Lead[]; onClose: () => void; onCreated: (c: Campaign) => void }) {
  const [name, setName]                   = useState('');
  const [description, setDescription]     = useState('');
  const [channels, setChannels]           = useState<CampaignChannel[]>(['email']);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [startDate, setStartDate]         = useState(() => new Date().toISOString().slice(0, 16));
  const [saving, setSaving]               = useState(false);
  const [error, setError]                 = useState('');

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
    if (!name.trim())              { setError('Campaign name is required.'); return; }
    if (channels.length === 0)     { setError('Select at least one channel.'); return; }
    if (selectedLeadIds.length === 0) { setError('Select at least one lead.'); return; }

    setSaving(true); setError('');
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Lagos Restaurants Q3"
              className="w-full admin-input border rounded-xl px-3 py-2.5 text-[13px] outline-none transition-colors" />
          </div>
          <div>
            <label className="label-xs mb-1.5 block">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional notes…" rows={2}
              className="w-full admin-input border rounded-xl px-3 py-2.5 text-[13px] outline-none transition-colors resize-none" />
          </div>
          <div>
            <label className="label-xs mb-2 block">Channels *</label>
            <div className="grid grid-cols-2 gap-2">
              {(['email', 'whatsapp', 'linkedin', 'twitter'] as CampaignChannel[]).map(ch => {
                const selLeads = leads.filter(l => selectedLeadIds.includes(l.id!));
                return (
                  <button key={ch} onClick={() => toggleChannel(ch)}
                    className={`flex flex-col gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium border transition-all text-left ${
                      channels.includes(ch) ? `${CHANNEL_COLORS[ch]} bg-white/5 border-white/20` : 'admin-border admin-muted admin-hover'
                    }`}>
                    <span className="flex items-center gap-1.5">{CHANNEL_ICONS[ch]} {ch.charAt(0).toUpperCase() + ch.slice(1)}</span>
                    {selLeads.length > 0 && <ChannelCoverage channel={ch} leads={selLeads} />}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label-xs">Leads *</label>
              <button onClick={toggleAllLeads} className="text-[10px] text-[#00D67D] hover:underline">
                {selectedLeadIds.length === leads.length ? 'Deselect all' : 'Select all'}
              </button>
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {leads.map(l => (
                <label key={l.id} className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all text-sm ${
                  selectedLeadIds.includes(l.id!) ? 'bg-[#00D67D]/5 border-[#00D67D]/20' : 'admin-border admin-hover'
                }`}>
                  <input type="checkbox" checked={selectedLeadIds.includes(l.id!)} onChange={() => toggleLead(l.id!)}
                    className="accent-[#00D67D] w-3.5 h-3.5 flex-shrink-0" />
                  <span className="admin-text font-medium truncate">{l.business_name}</span>
                  <span className="admin-muted text-[11px] ml-auto flex-shrink-0">{l.industry || '—'}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="label-xs mb-1.5 block">Start Date & Time</label>
            <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full admin-input border rounded-xl px-3 py-2.5 text-[13px] outline-none transition-colors" />
            <div className="mt-2 p-3 rounded-xl border admin-border text-[11px] admin-muted space-y-1" style={{ background: 'var(--admin-surface-2)' }}>
              <div>Step 1 — Day 0 (start date)</div>
              <div>Step 2 — Day +3</div>
              <div>Step 3 — Day +7</div>
              <div>Step 4 — Day +14 (breakup)</div>
              <div className="text-[10px] admin-subtle mt-1">LinkedIn & Twitter send step 1 only (no multi-step API).</div>
            </div>
          </div>
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              <AlertCircle size={13} /> {error}
            </div>
          )}
        </div>

        <div className="flex gap-2 px-5 py-4 border-t admin-border">
          <button onClick={() => save(false)} disabled={saving}
            className="flex-1 py-2.5 rounded-xl border admin-border text-[13px] admin-muted admin-hover transition-colors disabled:opacity-40">
            Save as Draft
          </button>
          <button onClick={() => save(true)} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-black font-bold text-[13px] transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: 'var(--accent)' }}>
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
            {saving ? 'Saving…' : 'Activate'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── AI COPY TAB ─────────────────────────────────────────────────────────────

function CopyTab({ leads }: { leads: Lead[] }) {
  const [platform, setPlatform]       = useState<Platform>('email');
  const [tone, setTone]               = useState('Professional');
  const [goal, setGoal]               = useState('Leads');
  const [keyMessage, setKeyMessage]   = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadOpen, setLeadOpen]       = useState(false);
  const [generating, setGenerating]   = useState(false);
  const [output, setOutput]           = useState('');
  const [provider, setProvider]       = useState('');
  const [copied, setCopied]           = useState(false);
  const [error, setError]             = useState('');

  const activePlatform = PLATFORMS.find(p => p.id === platform)!;

  async function generate() {
    setGenerating(true); setError(''); setOutput(''); setCopied(false);
    const body = selectedLead
      ? { platform, tone, goal, keyMessage,
          businessName: selectedLead.business_name, industry: selectedLead.industry,
          aiOpportunity: selectedLead.ai_opportunity, weakPoints: selectedLead.weak_points,
          possibleImprovements: selectedLead.possible_improvements, website: selectedLead.website }
      : { platform, tone, goal, keyMessage };
    try {
      const res = await fetch('/api/generate-copy', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setOutput(data.output); setProvider(data.provider);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  }

  function copyOutput() {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="grid lg:grid-cols-2 gap-5">
      {/* Left: controls */}
      <motion.div {...fadeUp} transition={{ delay: 0.05 }} className="space-y-4">
        {/* Platform picker */}
        <div className="admin-card p-4">
          <div className="label-xs mb-3">Platform</div>
          <div className="grid grid-cols-3 gap-2">
            {PLATFORMS.map(p => (
              <button key={p.id} onClick={() => setPlatform(p.id)}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                  platform === p.id ? `${p.bg} ${p.color}` : 'admin-border admin-muted hover:admin-text admin-hover'
                }`}>
                <span className={platform === p.id ? p.color : 'admin-muted'}>{p.icon}</span>
                <span className="text-[10px] leading-tight text-center">{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Lead selector */}
        <div className="admin-card p-4">
          <div className="text-[10px] font-mono admin-muted uppercase tracking-wider mb-2">Select Lead</div>
          <div className="relative">
            <button onClick={() => setLeadOpen(o => !o)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl admin-input border text-sm transition-colors">
              <span className={selectedLead ? 'admin-text' : 'admin-muted'}>
                {selectedLead ? selectedLead.business_name : 'Choose a lead…'}
              </span>
              <ChevronDown size={14} className={`admin-muted transition-transform ${leadOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {leadOpen && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  className="absolute z-20 top-full mt-1 w-full admin-surface border admin-border rounded-xl shadow-xl max-h-48 overflow-y-auto">
                  {leads.length === 0
                    ? <div className="px-3 py-4 text-sm admin-muted text-center">No leads found</div>
                    : leads.map(l => (
                      <button key={l.id} onClick={() => { setSelectedLead(l); setLeadOpen(false); }}
                        className="w-full text-left px-3 py-2.5 text-sm admin-hover transition-colors border-b admin-border last:border-0">
                        <div className="font-medium admin-text">{l.business_name}</div>
                        <div className="text-[11px] admin-muted">{l.industry || 'Unknown industry'}</div>
                      </button>
                    ))
                  }
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {selectedLead && (
            <div className="mt-3 p-3 rounded-xl bg-[#00D67D]/5 border border-[#00D67D]/10 space-y-1">
              <div className="text-[10px] font-mono text-[#00D67D] uppercase tracking-wider">Lead context loaded</div>
              <div className="text-xs admin-muted">{selectedLead.industry} · {selectedLead.website || 'No website'}</div>
              {selectedLead.ai_opportunity && (
                <div className="text-xs admin-muted truncate">AI opp: {selectedLead.ai_opportunity}</div>
              )}
            </div>
          )}
        </div>

        {/* Tone & Goal */}
        <div className="admin-card p-4">
          <div className="label-xs mb-3">Tone & Goal</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs admin-muted mb-1 block">Tone</label>
              <div className="flex flex-wrap gap-1.5">
                {TONES.map(t => (
                  <button key={t} onClick={() => setTone(t)}
                    className={`px-2.5 py-1 rounded-lg text-xs border transition-all ${
                      tone === t ? 'bg-[#00D67D]/10 text-[#00D67D] border-[#00D67D]/20' : 'admin-border admin-muted hover:admin-text admin-hover'
                    }`}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs admin-muted mb-1 block">Goal</label>
              <div className="flex flex-wrap gap-1.5">
                {GOALS.map(g => (
                  <button key={g} onClick={() => setGoal(g)}
                    className={`px-2.5 py-1 rounded-lg text-xs border transition-all ${
                      goal === g ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'admin-border admin-muted hover:admin-text admin-hover'
                    }`}>{g}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Key message */}
        <div className="admin-card p-4">
          <label className="label-xs mb-1.5 block">Additional Key Message (optional)</label>
          <textarea value={keyMessage} onChange={e => setKeyMessage(e.target.value)}
            placeholder="Any extra context or angle to emphasise…" rows={2}
            className="w-full admin-input border rounded-xl px-3 py-2.5 text-[13px] outline-none transition-colors resize-none" />
        </div>

        <button onClick={generate} disabled={generating || !selectedLead}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-black font-bold text-[13px] transition-colors disabled:opacity-40"
          style={{ background: 'var(--accent)' }}>
          {generating ? <RefreshCw size={15} className="animate-spin" /> : <Sparkles size={15} />}
          {generating ? 'Generating…' : `Generate ${activePlatform.label} Copy`}
        </button>
      </motion.div>

      {/* Right: output */}
      <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
        <div className="admin-card p-5 min-h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className={activePlatform.color}>{activePlatform.icon}</span>
              <span className="text-sm font-bold admin-text">{activePlatform.label} Copy</span>
            </div>
            {output && (
              <div className="flex items-center gap-2">
                {provider && (
                  <span className="text-[10px] font-mono admin-muted border admin-border px-2 py-1 rounded-md">via {provider}</span>
                )}
                <button onClick={copyOutput}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg admin-hover border admin-border transition-colors admin-muted hover:admin-text">
                  {copied ? <CheckCircle2 size={13} className="text-[#00D67D]" /> : <Copy size={13} />}
                  {copied ? 'Copied!' : 'Copy all'}
                </button>
                <button onClick={generate} disabled={generating}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg admin-hover border admin-border transition-colors admin-muted hover:admin-text disabled:opacity-40">
                  <RefreshCw size={13} className={generating ? 'animate-spin' : ''} />
                  Regenerate
                </button>
              </div>
            )}
          </div>
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />{error}
                </motion.div>
              )}
              {generating && !output && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-48 gap-3">
                  <RefreshCw size={24} className="animate-spin text-[#00D67D]" />
                  <p className="text-sm admin-muted">Generating {activePlatform.label} copy…</p>
                </motion.div>
              )}
              {output && !generating && (
                <motion.div key="output" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-white/[0.02] border admin-border">
                  {renderOutput(platform, output)}
                </motion.div>
              )}
              {!output && !generating && !error && (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-48 gap-3 border border-dashed admin-border rounded-xl">
                  <Sparkles size={28} className="text-slate-700" />
                  <p className="text-sm admin-muted text-center">Select a lead and click Generate</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── CAMPAIGNS TAB ───────────────────────────────────────────────────────────

function CampaignsTab({ leads }: { leads: Lead[] }) {
  const [campaigns, setCampaigns]         = useState<Campaign[]>([]);
  const [loading, setLoading]             = useState(true);
  const [showCreate, setShowCreate]       = useState(false);
  const [detailCampaign, setDetailCampaign] = useState<Campaign | null>(null);
  const [deleting, setDeleting]           = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/campaigns').then(r => r.json()).then(d => {
      setCampaigns(Array.isArray(d) ? d : []);
      setLoading(false);
    });
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
    <div className="space-y-4">
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

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

type Tab = 'copy' | 'campaigns';

// defaultTab: when provided by the sidebar, the internal tab switcher is hidden
// and the panel renders only that tab. When absent, the switcher is shown.
export default function OutreachPanel({ defaultTab }: { defaultTab?: Tab }) {
  const [tab, setTab]     = useState<Tab>(defaultTab ?? 'copy');
  const [leads, setLeads] = useState<Lead[]>([]);

  // Sync if the sidebar navigates to a different tab
  useEffect(() => { if (defaultTab) setTab(defaultTab); }, [defaultTab]);

  useEffect(() => {
    fetch('/api/leads').then(r => r.json()).then(d => setLeads(Array.isArray(d) ? d : []));
  }, []);

  const tabs: { id: Tab; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'copy',      label: 'AI Copy',   icon: <Sparkles size={14} />,  desc: 'Generate platform copy for a lead — 6 channels' },
    { id: 'campaigns', label: 'Campaigns', icon: <Megaphone size={14} />, desc: 'Build & schedule multi-channel outreach sequences' },
  ];

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Internal tab switcher — only shown when not driven by the sidebar */}
      {!defaultTab && (
        <>
          <motion.div {...fadeUp} className="flex items-center gap-1 p-1 rounded-2xl border admin-border w-fit" style={{ background: 'var(--admin-surface-2)' }}>
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                  tab === t.id ? 'text-black' : 'admin-muted hover:admin-text'
                }`}
              >
                {tab === t.id && (
                  <motion.div layoutId="outreach-tab-bg" className="absolute inset-0 rounded-xl"
                    style={{ background: 'var(--accent)' }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                )}
                <span className="relative z-10 flex items-center gap-2">{t.icon}{t.label}</span>
              </button>
            ))}
          </motion.div>
          <motion.p key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[11px] admin-muted font-mono -mt-2">
            {tabs.find(t => t.id === tab)?.desc}
          </motion.p>
        </>
      )}

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          {tab === 'copy'      && <CopyTab leads={leads} />}
          {tab === 'campaigns' && <CampaignsTab leads={leads} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
