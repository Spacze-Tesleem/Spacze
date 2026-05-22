'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw, Plus, X, Play, Pause, Trash2,
  Calendar, Users, Eye, Megaphone, Mail, MessageCircle, Linkedin, Twitter,
  Facebook, Search, Wand2, ArrowLeft, Sparkles,
  ChevronDown, ChevronUp, Reply, CheckCheck, AlertCircle, Clock,
} from 'lucide-react';
import { Campaign, CampaignChannel, Lead, ScheduledMessage } from '@/lib/supabase';
import { useToast, ToastStack } from '@/app/components/Toast';
import { useLeads, useCampaigns, useWhatsAppReplies, WhatsAppReply } from '@/lib/hooks';
import ModalPortal from '@/app/components/ModalPortal';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const ACCENT = '#00D67D';

const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string; text: string; border: string }> = {
  draft:     { label: 'Draft',     dot: '#71717a', bg: 'bg-zinc-500/10',   text: 'text-zinc-400',   border: 'border-zinc-500/20' },
  active:    { label: 'Active',    dot: ACCENT,    bg: 'bg-[#00D67D]/10',  text: 'text-[#00D67D]',  border: 'border-[#00D67D]/20' },
  paused:    { label: 'Paused',    dot: '#facc15', bg: 'bg-yellow-400/10', text: 'text-yellow-400', border: 'border-yellow-400/20' },
  completed: { label: 'Completed', dot: '#60a5fa', bg: 'bg-blue-400/10',   text: 'text-blue-400',   border: 'border-blue-400/20' },
};

const MSG_STATUS_STYLES: Record<string, string> = {
  pending:   'text-yellow-400 bg-yellow-400/10',
  sent:      'text-[#00D67D] bg-[#00D67D]/10',
  failed:    'text-red-400 bg-red-400/10',
  cancelled: 'text-zinc-500 bg-zinc-500/10',
};

const CHANNEL_ICONS: Record<CampaignChannel, React.ReactNode> = {
  email:      <Mail size={12} />,
  whatsapp:   <MessageCircle size={12} />,
  linkedin:   <Linkedin size={12} />,
  twitter:    <Twitter size={12} />,
  facebook:   <Facebook size={12} />,
  google_ads: <Search size={12} />,
};

const CHANNEL_COLORS: Record<CampaignChannel, string> = {
  email:      '#60a5fa',
  whatsapp:   '#25D366',
  linkedin:   '#0a66c2',
  twitter:    '#38bdf8',
  facebook:   '#1877F2',
  google_ads: '#facc15',
};

const CHANNEL_LABELS: Record<CampaignChannel, string> = {
  email:      'Email',
  whatsapp:   'WhatsApp',
  linkedin:   'LinkedIn',
  twitter:    'Twitter / X',
  facebook:   'Facebook Ads',
  google_ads: 'Google Ads',
};

const CHANNEL_REQUIREMENTS: Partial<Record<CampaignChannel, { field: keyof Lead; label: string }>> = {
  email:    { field: 'contact_email',   label: 'email' },
  whatsapp: { field: 'whatsapp_number', label: 'WhatsApp number' },
  linkedin: { field: 'linkedin_url',    label: 'LinkedIn URL' },
  twitter:  { field: 'twitter_handle',  label: 'Twitter handle' },
};

const AD_CHANNELS: CampaignChannel[] = ['facebook', 'google_ads'];
const ALL_CHANNELS: CampaignChannel[] = ['email', 'whatsapp', 'linkedin', 'twitter', 'facebook', 'google_ads'];
const STEP_OFFSETS = [0, 3, 7, 14];

function addDays(base: Date, days: number): string {
  const d = new Date(base); d.setDate(d.getDate() + days); return d.toISOString();
}

// ─── SMALL COMPONENTS ─────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot, boxShadow: status === 'active' ? `0 0 5px ${cfg.dot}` : 'none' }} />
      {cfg.label}
    </span>
  );
}

function ChannelDot({ channel }: { channel: CampaignChannel }) {
  return (
    <span title={CHANNEL_LABELS[channel]}
      className="inline-flex items-center justify-center w-6 h-6 rounded-lg text-[11px]"
      style={{ background: `${CHANNEL_COLORS[channel]}18`, color: CHANNEL_COLORS[channel] }}>
      {CHANNEL_ICONS[channel]}
    </span>
  );
}

function ChannelCoverage({ channel, leads }: { channel: CampaignChannel; leads: Lead[] }) {
  const req = CHANNEL_REQUIREMENTS[channel];
  if (!req) return <span className="text-[10px] admin-muted">1 ad per campaign</span>;
  const covered = leads.filter(l => !!l[req.field]).length;
  const pct = leads.length > 0 ? Math.round((covered / leads.length) * 100) : 0;
  return (
    <div className="flex items-center gap-1.5 text-[10px] admin-muted">
      <div className="w-12 h-1 rounded-full overflow-hidden bg-[var(--admin-surface-3)]">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: ACCENT }} />
      </div>
      {covered}/{leads.length} have {req.label}
    </div>
  );
}

// ─── MESSAGE ROW ──────────────────────────────────────────────────────────────
function MessageRow({ m, leadMap, repliedLeadIds, onCancel }: {
  m: ScheduledMessage; leadMap: Record<string, string>;
  repliedLeadIds: Set<string>; onCancel: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasBody = !!m.message_body;
  const hasReplied = repliedLeadIds.has(m.lead_id) && m.channel === 'whatsapp';
  const ch = m.channel as CampaignChannel;

  return (
    <div className="rounded-xl border admin-border overflow-hidden bg-[var(--admin-surface)]">
      <div className="flex items-center gap-2.5 px-3.5 py-2.5">
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono flex-shrink-0 ${MSG_STATUS_STYLES[m.status]}`}>{m.status}</span>
        <span className="inline-flex items-center gap-1 text-[11px] flex-shrink-0" style={{ color: CHANNEL_COLORS[ch] }}>
          {CHANNEL_ICONS[ch]} {m.channel}
        </span>
        <span className="admin-text text-[12px] font-medium truncate flex-1 min-w-0">{leadMap[m.lead_id] ?? m.lead_id}</span>
        {hasReplied && (
          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md text-[#25D366] bg-[#25D366]/10 flex-shrink-0">
            <Reply size={10} /> replied
          </span>
        )}
        <span className="text-[10px] admin-muted flex-shrink-0">Step {m.sequence_step}</span>
        <span className="text-[10px] admin-muted flex-shrink-0">
          {new Date(m.scheduled_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </span>
        {hasBody && (
          <button onClick={() => setExpanded(v => !v)} className="p-1 rounded-lg admin-muted hover:admin-text transition-colors flex-shrink-0">
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        )}
        {m.status === 'pending' && (
          <button onClick={() => onCancel(m.id!)} className="p-1 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors flex-shrink-0">
            <X size={12} />
          </button>
        )}
      </div>
      <AnimatePresence>
        {expanded && hasBody && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="px-3.5 pb-3 pt-0 border-t admin-border">
              {m.subject && <p className="text-[10px] admin-muted mb-1"><span className="font-mono uppercase tracking-wider">Subject:</span> {m.subject}</p>}
              <p className="text-[11px] admin-text leading-relaxed whitespace-pre-wrap">{m.message_body}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
// ─── DETAIL MODAL ─────────────────────────────────────────────────────────────
type DetailTab = 'queue' | 'replies';

function DetailModal({ campaign, leads, onClose }: { campaign: Campaign; leads: Lead[]; onClose: () => void }) {
  const [messages, setMessages]             = useState<ScheduledMessage[]>([]);
  const [replies, setReplies]               = useState<WhatsAppReply[]>([]);
  const [loading, setLoading]               = useState(true);
  const [repliesLoading, setRepliesLoading] = useState(true);
  const [processing, setProcessing]         = useState(false);
  const [processResult, setProcessResult]   = useState('');
  const [tab, setTab]                       = useState<DetailTab>('queue');
  const [filter, setFilter]                 = useState<'all' | 'pending' | 'sent' | 'failed'>('all');

  useEffect(() => {
    fetch(`/api/scheduled-messages?campaign_id=${campaign.id}`).then(r => r.json()).then(d => { setMessages(Array.isArray(d) ? d : []); setLoading(false); });
  }, [campaign.id]);

  useEffect(() => {
    if (!campaign.lead_ids?.length) { setRepliesLoading(false); return; }
    fetch(`/api/whatsapp-replies?lead_ids=${campaign.lead_ids.join(',')}`).then(r => r.json()).then(d => { setReplies(Array.isArray(d) ? d : []); setRepliesLoading(false); }).catch(() => setRepliesLoading(false));
  }, [campaign.id, campaign.lead_ids]);

  const leadMap = Object.fromEntries(leads.map(l => [l.id, l.business_name]));
  const repliedLeadIds = new Set(replies.map(r => r.lead_id).filter((id): id is string => !!id));

  async function cancelMessage(id: string) {
    await fetch(`/api/scheduled-messages?id=${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'cancelled' }) });
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

  const pending   = messages.filter(m => m.status === 'pending');
  const sent      = messages.filter(m => m.status === 'sent');
  const failed    = messages.filter(m => m.status === 'failed');
  const filteredMessages = filter === 'all' ? messages : messages.filter(m => m.status === filter);

  const STAT_ITEMS = [
    { label: 'Pending', value: pending.length,  color: '#facc15', icon: <Clock size={11} /> },
    { label: 'Sent',    value: sent.length,      color: ACCENT,    icon: <CheckCheck size={11} /> },
    { label: 'Failed',  value: failed.length,    color: '#f87171', icon: <AlertCircle size={11} /> },
    { label: 'Replies', value: replies.length,   color: '#25D366', icon: <Reply size={11} /> },
  ];

  return (
    <ModalPortal>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
          className="w-full max-w-2xl admin-card shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

          {/* Header */}
          <div className="flex items-start justify-between px-5 py-4 border-b admin-border flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${ACCENT}18` }}>
                <Megaphone size={15} style={{ color: ACCENT }} />
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-[14px] admin-text truncate">{campaign.name}</h2>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <StatusPill status={campaign.status} />
                  {(campaign.channels as CampaignChannel[]).map(ch => <ChannelDot key={ch} channel={ch} />)}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-xl admin-muted hover:admin-text admin-hover border admin-border transition-colors flex-shrink-0 ml-3">
              <X size={14} />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 px-5 pt-4 flex-shrink-0">
            {STAT_ITEMS.map(s => (
              <div key={s.label} className="rounded-xl border admin-border p-3 text-center bg-[var(--admin-surface-2)]">
                <p className="text-[20px] font-black leading-none" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[10px] font-mono uppercase tracking-wider mt-1 flex items-center justify-center gap-1 opacity-70" style={{ color: s.color }}>
                  {s.icon}{s.label}
                </p>
              </div>
            ))}
          </div>

          {/* Process button */}
          {pending.length > 0 && (
            <div className="flex items-center gap-3 px-5 pt-3 flex-shrink-0">
              <button onClick={processQueue} disabled={processing}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-black font-bold text-[12px] transition-all disabled:opacity-40 hover:opacity-90"
                style={{ background: ACCENT }}>
                {processing ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
                {processing ? 'Processing…' : `Process ${pending.length} pending`}
              </button>
              {processResult && <span className="text-[11px]" style={{ color: ACCENT }}>{processResult}</span>}
            </div>
          )}

          {/* Tabs */}
          <div className="flex items-center gap-1 px-5 pt-4 border-b admin-border pb-0 flex-shrink-0">
            {([['queue', 'Queue', messages.length], ['replies', 'Replies', replies.length]] as const).map(([id, label, count]) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold border-b-2 transition-colors -mb-px ${tab === id ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent admin-muted hover:admin-text'}`}>
                {label}
                {count > 0 && <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${tab === id ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'bg-white/5 admin-muted'}`}>{count}</span>}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-5">
            {tab === 'queue' && (
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {([['all', 'All', messages.length, 'admin-muted'], ['pending', 'Pending', pending.length, 'text-yellow-400'], ['sent', 'Sent', sent.length, 'text-[#00D67D]'], ['failed', 'Failed', failed.length, 'text-red-400']] as const).map(([id, label, count, color]) => (
                    <button key={id} onClick={() => setFilter(id)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-colors ${filter === id ? `${color} border-current bg-current/10` : 'admin-muted border-white/10 hover:border-white/20'}`}>
                      {label} <span className="opacity-70">{count}</span>
                    </button>
                  ))}
                </div>
                {loading ? (
                  <div className="flex items-center justify-center py-10 admin-muted text-sm gap-2"><RefreshCw size={14} className="animate-spin" /> Loading…</div>
                ) : filteredMessages.length === 0 ? (
                  <div className="text-center py-10 admin-muted text-sm">No messages match this filter.</div>
                ) : (
                  <div className="space-y-2">
                    {filteredMessages.map(m => <MessageRow key={m.id} m={m} leadMap={leadMap} repliedLeadIds={repliedLeadIds} onCancel={cancelMessage} />)}
                  </div>
                )}
              </div>
            )}
            {tab === 'replies' && (
              <div className="space-y-2">
                {repliesLoading ? (
                  <div className="flex items-center justify-center py-10 admin-muted text-sm gap-2"><RefreshCw size={14} className="animate-spin" /> Loading replies…</div>
                ) : replies.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <MessageCircle size={28} className="admin-muted opacity-30" />
                    <p className="text-sm admin-muted">No WhatsApp replies yet.</p>
                    <p className="text-[11px] admin-muted opacity-60 text-center max-w-xs">When a lead replies to your WhatsApp message, it will appear here automatically.</p>
                  </div>
                ) : replies.map(r => (
                  <div key={r.id} className="p-3.5 rounded-xl border admin-border bg-[var(--admin-surface)] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Reply size={12} className="text-[#25D366]" />
                        <span className="text-[12px] font-semibold admin-text">{(r.lead_id ? leadMap[r.lead_id] : null) ?? r.phone}</span>
                        <span className="text-[10px] font-mono admin-muted">{r.phone}</span>
                      </div>
                      <span className="text-[10px] admin-muted">{new Date(r.received_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-[12px] admin-text leading-relaxed pl-5 border-l-2 border-[#25D366]/30">{r.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </ModalPortal>
  );
}
// ─── PARSE HELPERS ────────────────────────────────────────────────────────────
function parseGoogleAdsCopy(raw: string): { headlines: string[]; descriptions: string[] } {
  const headlines: string[] = []; const descriptions: string[] = [];
  for (const line of raw.split('\n')) {
    const hl = line.match(/^HEADLINE_\d+:\s*(.+)/); if (hl) headlines.push(hl[1].trim());
    const desc = line.match(/^DESCRIPTION_\d+:\s*(.+)/); if (desc) descriptions.push(desc[1].trim());
  }
  return {
    headlines:    headlines.length    >= 3 ? headlines    : ['Boost Your Business', 'Expert Tech Audits', 'Spacze Web Solutions'],
    descriptions: descriptions.length >= 2 ? descriptions : ['Uncover technical weak points holding your site back.', 'Transform your digital presence with our expert team.'],
  };
}

function parseMetaCopy(raw: string): { primaryText: string; headline: string } {
  let primaryText = ''; let headline = ''; const lines = raw.split('\n'); let inBody = false;
  for (const line of lines) {
    if (/^PRIMARY_TEXT:|^CAPTION:|^BODY:/i.test(line)) { inBody = true; primaryText = line.replace(/^[^:]+:\s*/, '').trim(); continue; }
    if (/^HEADLINE:/i.test(line)) { headline = line.replace(/^HEADLINE:\s*/i, '').trim(); inBody = false; continue; }
    if (inBody && line.trim()) primaryText += (primaryText ? ' ' : '') + line.trim();
  }
  if (!primaryText) primaryText = raw.split('\n').find(l => l.trim().length > 20) ?? raw.slice(0, 150);
  if (!headline)    headline    = 'Free Website Tech Audit';
  return { primaryText, headline };
}
// ─── CREATE MODAL ─────────────────────────────────────────────────────────────
function CreateModal({ leads, onClose, onCreated }: { leads: Lead[]; onClose: () => void; onCreated: (c?: Campaign) => void }) {
  const { toast, toasts, dismiss } = useToast();
  const [step, setStep]             = useState<1 | 2>(1);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');
  const [name, setName]             = useState('');
  const [targetUrl, setTargetUrl]   = useState('https://spacze.vercel.app');
  const [dailyBudget, setDailyBudget] = useState('500');
  const [channels, setChannels]     = useState<CampaignChannel[]>(['email']);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [startDate, setStartDate]   = useState(() => new Date().toISOString().slice(0, 16));
  const [googleDraft, setGoogleDraft] = useState({ headlines: ['', '', ''], descriptions: ['', ''] });
  const [metaDraft, setMetaDraft]   = useState({ primaryText: '', headline: '', cta: 'Learn More' });

  const inp = 'w-full bg-[var(--admin-input-bg)] border admin-border-md rounded-xl px-3.5 py-2.5 text-[13px] admin-text outline-none transition-colors placeholder:admin-subtle focus:border-[#00D67D]/50 focus:ring-1 focus:ring-[#00D67D]/20';

  const outreachChannels = channels.filter(ch => !AD_CHANNELS.includes(ch));
  const hasAds           = channels.some(ch => AD_CHANNELS.includes(ch));

  function toggleChannel(ch: CampaignChannel) { setChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]); }
  function toggleLead(id: string) { setSelectedLeadIds(prev => prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]); }
  function toggleAllLeads() { setSelectedLeadIds(prev => prev.length === leads.length ? [] : leads.map(l => l.id!)); }

  async function handleNext() {
    if (!name.trim())          { setError('Campaign name is required.'); return; }
    if (channels.length === 0) { setError('Select at least one channel.'); return; }
    if (outreachChannels.length > 0 && selectedLeadIds.length === 0) { setError('Select at least one lead for outreach channels.'); return; }
    setError('');
    if (!hasAds) { await publishCampaign(true, { headlines: [], descriptions: [] }, { primaryText: '', headline: '', cta: 'Learn More' }); return; }
    setGenerating(true);
    try {
      const brief = { productName: 'Spacze Web Agency', targetAudience: 'Business owners', tone: 'Professional', goal: 'Leads', keyMessage: name };
      const [googleRaw, metaRaw] = await Promise.all([
        channels.includes('google_ads') ? fetch('/api/generate-copy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ platform: 'google_ads', ...brief }) }).then(r => r.json()).then(d => d.output ?? '') : Promise.resolve(''),
        channels.includes('facebook')   ? fetch('/api/generate-copy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ platform: 'instagram', ...brief }) }).then(r => r.json()).then(d => d.output ?? '') : Promise.resolve(''),
      ]);
      if (channels.includes('google_ads')) setGoogleDraft(parseGoogleAdsCopy(googleRaw));
      if (channels.includes('facebook'))   setMetaDraft({ ...parseMetaCopy(metaRaw), cta: 'Learn More' });
      setStep(2);
    } catch { setError('Failed to generate ad copy. You can still edit the fields manually.'); setStep(2); }
    finally { setGenerating(false); }
  }

  async function publishCampaign(activate: boolean, gDraft: typeof googleDraft, mDraft: typeof metaDraft) {
    setSaving(true); setError('');
    try {
      const dbRes = await fetch('/api/campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim(), description: targetUrl ? `Target URL: ${targetUrl}` : '', status: activate ? 'active' : 'draft', channels, lead_ids: selectedLeadIds, auto_sequence: true, start_date: startDate }) });
      const campaign: Campaign = await dbRes.json();
      if (!dbRes.ok) throw new Error((campaign as unknown as { error: string }).error || 'Failed to create campaign');
      if (activate && campaign.id && outreachChannels.length > 0 && selectedLeadIds.length > 0) {
        const base = new Date(startDate);
        const rows: Omit<ScheduledMessage, 'id' | 'created_at'>[] = [];
        for (const leadId of selectedLeadIds) {
          for (const channel of outreachChannels) {
            const steps = (channel === 'linkedin' || channel === 'twitter') ? [1] : [1, 2, 3, 4];
            for (const s of steps) rows.push({ campaign_id: campaign.id!, lead_id: leadId, channel, sequence_step: s, scheduled_at: addDays(base, STEP_OFFSETS[s - 1]), status: 'pending', sent_at: null, message_body: null, subject: null });
          }
        }
        if (rows.length > 0) await fetch('/api/scheduled-messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rows) });
      }
      if (activate) {
        if (channels.includes('google_ads')) { const gRes = await fetch('/api/send-google-ads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ headlines: gDraft.headlines.filter(Boolean), descriptions: gDraft.descriptions.filter(Boolean), finalUrl: targetUrl, campaignName: name }) }); toast(gRes.ok ? 'success' : 'error', gRes.ok ? 'Google Ad created (paused — review in Ads UI)' : 'Google Ads push failed — check API keys'); }
        if (channels.includes('facebook'))   { const fRes = await fetch('/api/send-facebook',   { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ primaryText: mDraft.primaryText, headline: mDraft.headline, description: '', cta: mDraft.cta, targetUrl, campaignName: name, dailyBudget: parseInt(dailyBudget) || 500 }) }); toast(fRes.ok ? 'success' : 'error', fRes.ok ? 'Meta Ad created (paused — review in Ads Manager)' : 'Facebook Ads push failed — check API keys'); }
      }
      onCreated(campaign); onClose();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to save campaign'); }
    finally { setSaving(false); }
  }

  return (
    <ModalPortal>
      <ToastStack toasts={toasts} onDismiss={dismiss} />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-6 bg-black/50 backdrop-blur-md"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <motion.div initial={{ y: 40, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 40, opacity: 0, scale: 0.97 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="w-full sm:max-w-lg bg-[var(--admin-surface)] border admin-border-md rounded-t-[2rem] sm:rounded-2xl shadow-2xl overflow-hidden max-h-[94vh] sm:max-h-[86vh] flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-5 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${ACCENT}18`, boxShadow: `0 0 0 1px ${ACCENT}25` }}>
                <Wand2 size={15} style={{ color: ACCENT }} />
              </div>
              <div>
                <h2 className="font-bold text-[15px] admin-text leading-none">
                  {step === 1 ? 'New Campaign' : 'Review Ad Creative'}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  {[1, hasAds ? 2 : null].filter(Boolean).map((s, i) => (
                    <React.Fragment key={s}>
                      {i > 0 && <div className="w-4 h-px bg-[var(--admin-border-md)]" />}
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-all ${step === s ? 'text-black' : 'admin-muted bg-[var(--admin-surface-3)]'}`}
                        style={step === s ? { background: ACCENT } : {}}>
                        {s === 1 ? 'Strategy' : 'Creative'}
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center admin-muted hover:admin-text transition-colors bg-[var(--admin-surface-2)] hover:bg-[var(--admin-surface-3)] border admin-border">
              <X size={14} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 pb-2 space-y-5 min-h-0">
            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/8 border border-red-500/20 text-red-400 text-[12px]">
                <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />{error}
              </div>
            )}

            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">

                {/* Name */}
                <div>
                  <label className="text-[12px] font-semibold admin-text mb-2 block">
                    Campaign Name <span style={{ color: ACCENT }}>*</span>
                  </label>
                  <input value={name} onChange={e => setName(e.target.value)}
                    placeholder="e.g. Q3 Tech Audits"
                    className={`${inp} text-[14px] font-medium`} />
                </div>

                {/* Channels */}
                <div>
                  <label className="text-[12px] font-semibold admin-text mb-3 block">Channels</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ALL_CHANNELS.map(ch => {
                      const active = channels.includes(ch);
                      const isAd   = AD_CHANNELS.includes(ch);
                      return (
                        <button key={ch} onClick={() => toggleChannel(ch)}
                          className={`relative flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                            active
                              ? 'shadow-sm'
                              : 'border-[var(--admin-border)] bg-[var(--admin-surface-2)] hover:bg-[var(--admin-surface-3)] admin-muted'
                          }`}
                          style={active ? {
                            borderColor: `${CHANNEL_COLORS[ch]}35`,
                            background: `${CHANNEL_COLORS[ch]}0e`,
                          } : {}}>
                          <span className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ background: `${CHANNEL_COLORS[ch]}${active ? '22' : '12'}`, color: CHANNEL_COLORS[ch], opacity: active ? 1 : 0.55 }}>
                            {CHANNEL_ICONS[ch]}
                          </span>
                          <span className={`text-[12px] font-semibold leading-none ${active ? 'admin-text' : ''}`}
                            style={active ? { color: CHANNEL_COLORS[ch] } : {}}>
                            {CHANNEL_LABELS[ch]}
                          </span>
                          {isAd && (
                            <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0"
                              style={{ background: `${CHANNEL_COLORS[ch]}18`, color: CHANNEL_COLORS[ch] }}>
                              AD
                            </span>
                          )}
                          {active && (
                            <span className="ml-auto w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-black text-[9px] font-black"
                              style={{ background: CHANNEL_COLORS[ch] }}>✓</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {hasAds && (
                    <p className="text-[11px] admin-muted mt-2.5 leading-relaxed">
                      <strong className="admin-text">AD</strong> channels push one AI-generated ad — no per-lead contact needed.
                    </p>
                  )}
                </div>

                {/* Settings row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[12px] font-semibold admin-text mb-2 block">Start Date</label>
                    <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} className={inp} />
                  </div>
                  {hasAds ? (
                    <div>
                      <label className="text-[12px] font-semibold admin-text mb-2 block">Daily Budget (₦)</label>
                      <input type="number" value={dailyBudget} onChange={e => setDailyBudget(e.target.value)} placeholder="500" className={inp} />
                    </div>
                  ) : (
                    <div>
                      <label className="text-[12px] font-semibold admin-text mb-2 block">Target URL</label>
                      <input value={targetUrl} onChange={e => setTargetUrl(e.target.value)} placeholder="https://spacze.vercel.app" className={inp} />
                    </div>
                  )}
                </div>

                {/* Lead selection */}
                {outreachChannels.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <label className="text-[12px] font-semibold admin-text">
                        Target Leads
                        {selectedLeadIds.length > 0 && (
                          <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full text-black" style={{ background: ACCENT }}>
                            {selectedLeadIds.length}
                          </span>
                        )}
                      </label>
                      <button onClick={toggleAllLeads} className="text-[11px] font-semibold transition-colors hover:opacity-80" style={{ color: ACCENT }}>
                        {selectedLeadIds.length === leads.length ? 'Deselect all' : 'Select all'}
                      </button>
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                      {leads.map(lead => {
                        const sel = selectedLeadIds.includes(lead.id!);
                        return (
                          <label key={lead.id}
                            className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border cursor-pointer transition-all ${
                              sel ? '' : 'border-[var(--admin-border)] bg-[var(--admin-surface-2)] hover:bg-[var(--admin-surface-3)]'
                            }`}
                            style={sel ? { borderColor: `${ACCENT}30`, background: `${ACCENT}08` } : {}}>
                            <div className={`w-4 h-4 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all`}
                              style={sel ? { background: ACCENT, borderColor: ACCENT } : { borderColor: 'var(--admin-border-lg)' }}>
                              {sel && <span className="text-black text-[9px] font-black leading-none">✓</span>}
                            </div>
                            <input type="checkbox" checked={sel} onChange={() => toggleLead(lead.id!)} className="sr-only" />
                            <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold text-black"
                              style={{ background: `${ACCENT}30`, color: ACCENT }}>
                              {lead.business_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-semibold admin-text truncate">{lead.business_name}</p>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                {outreachChannels.map(ch => {
                                  const req = CHANNEL_REQUIREMENTS[ch];
                                  const has = req ? !!lead[req.field] : true;
                                  return (
                                    <span key={ch} className="text-[10px] font-medium px-1.5 py-0.5 rounded-md"
                                      style={{ color: has ? CHANNEL_COLORS[ch] : '#71717a', background: has ? `${CHANNEL_COLORS[ch]}15` : 'var(--admin-surface-3)', opacity: has ? 1 : 0.6 }}>
                                      {CHANNEL_LABELS[ch]}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                    {outreachChannels.map(ch => (
                      <div key={ch} className="mt-2"><ChannelCoverage channel={ch} leads={leads.filter(l => selectedLeadIds.includes(l.id!))} /></div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                {channels.includes('google_ads') && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Search size={13} className="text-yellow-400" />
                      <span className="text-[12px] font-bold admin-text">Google Ads Copy</span>
                    </div>
                    {googleDraft.headlines.map((h, i) => (
                      <div key={i}>
                        <label className="text-[10px] font-semibold admin-muted mb-1 block">Headline {i + 1} <span className={`font-mono ${h.length > 30 ? 'text-red-400' : 'admin-muted'}`}>{h.length}/30</span></label>
                        <input value={h} onChange={e => setGoogleDraft(d => { const hs = [...d.headlines]; hs[i] = e.target.value; return { ...d, headlines: hs }; })} className={inp} maxLength={30} />
                      </div>
                    ))}
                    {googleDraft.descriptions.map((d, i) => (
                      <div key={i}>
                        <label className="text-[10px] font-semibold admin-muted mb-1 block">Description {i + 1} <span className={`font-mono ${d.length > 90 ? 'text-red-400' : 'admin-muted'}`}>{d.length}/90</span></label>
                        <input value={d} onChange={e => setGoogleDraft(dr => { const ds = [...dr.descriptions]; ds[i] = e.target.value; return { ...dr, descriptions: ds }; })} className={inp} maxLength={90} />
                      </div>
                    ))}
                  </div>
                )}
                {channels.includes('facebook') && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Facebook size={13} className="text-[#1877F2]" />
                      <span className="text-[12px] font-bold admin-text">Meta Ad Copy</span>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold admin-muted mb-1 block">Headline</label>
                      <input value={metaDraft.headline} onChange={e => setMetaDraft(d => ({ ...d, headline: e.target.value }))} className={inp} />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold admin-muted mb-1 block">Primary Text</label>
                      <textarea value={metaDraft.primaryText} onChange={e => setMetaDraft(d => ({ ...d, primaryText: e.target.value }))} rows={4} className={`${inp} resize-none`} />
                    </div>
                    <div className="relative sm:max-w-xs">
                      <label className="text-[10px] font-semibold admin-muted mb-1 block">CTA Button</label>
                      <select value={metaDraft.cta} onChange={e => setMetaDraft(d => ({ ...d, cta: e.target.value }))} className={`${inp} appearance-none cursor-pointer pr-8`}>
                        {['Learn More', 'Sign Up', 'Get Quote', 'Contact Us', 'Book Now'].map(o => <option key={o}>{o}</option>)}
                      </select>
                      <ChevronDown size={12} className="absolute right-3 bottom-3 admin-muted pointer-events-none" />
                    </div>
                    <p className="text-[10px] admin-muted flex items-center gap-1"><Sparkles size={10} className="text-purple-400" /> Image/video generation is processed asynchronously — attach creatives in Meta Ads Manager.</p>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-5 flex gap-2.5 flex-shrink-0">
            {step === 1 ? (
              <>
                <button
                  onClick={() => { setError(''); publishCampaign(false, googleDraft, metaDraft); }}
                  disabled={saving || generating}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border admin-border-md admin-muted hover:admin-text bg-[var(--admin-surface-2)] hover:bg-[var(--admin-surface-3)] font-semibold text-[13px] transition-all disabled:opacity-40 flex-shrink-0">
                  {saving ? <RefreshCw size={13} className="animate-spin" /> : null}
                  Draft
                </button>
                <button
                  onClick={handleNext}
                  disabled={generating || saving}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-black font-bold text-[13px] transition-all disabled:opacity-40 hover:opacity-90"
                  style={{ background: ACCENT, boxShadow: `0 4px 20px ${ACCENT}35` }}>
                  {generating
                    ? <><RefreshCw size={13} className="animate-spin" /> Generating…</>
                    : hasAds
                      ? <><Wand2 size={13} /> Generate Ad Creative</>
                      : <><Play size={13} /> Activate Campaign</>
                  }
                </button>
              </>
            ) : (
              <>
                <button onClick={() => { setStep(1); setError(''); }}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-xl border admin-border-md admin-muted hover:admin-text bg-[var(--admin-surface-2)] hover:bg-[var(--admin-surface-3)] font-semibold text-[13px] transition-all flex-shrink-0">
                  <ArrowLeft size={13} /> Back
                </button>
                <button onClick={() => publishCampaign(true, googleDraft, metaDraft)} disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-black font-bold text-[13px] transition-all disabled:opacity-40 hover:opacity-90"
                  style={{ background: ACCENT, boxShadow: `0 4px 20px ${ACCENT}35` }}>
                  {saving ? <RefreshCw size={13} className="animate-spin" /> : <Play size={13} />}
                  {saving ? 'Publishing…' : 'Launch Campaign'}
                </button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </ModalPortal>
  );
}
// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
export default function CampaignsPanel() {
  const { leads }                                         = useLeads();
  const { campaigns, loading, refresh: refreshCampaigns } = useCampaigns();
  const { replies }                                       = useWhatsAppReplies();
  const [showCreate, setShowCreate]       = useState(false);
  const [detailCampaign, setDetailCampaign] = useState<Campaign | null>(null);
  const [deleting, setDeleting]           = useState<string | null>(null);

  const repliedCountByCampaign = React.useMemo(() => {
    const repliedLeadIds = new Set(replies.map(r => r.lead_id).filter(Boolean));
    return Object.fromEntries(campaigns.map(c => [c.id, (c.lead_ids ?? []).filter(id => repliedLeadIds.has(id)).length]));
  }, [campaigns, replies]);

  async function toggleStatus(campaign: Campaign) {
    const next = campaign.status === 'active' ? 'paused' : 'active';
    await fetch(`/api/campaigns?id=${campaign.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: next }) });
    refreshCampaigns();
  }

  async function deleteCampaign(id: string) {
    setDeleting(id);
    await fetch(`/api/campaigns?id=${id}`, { method: 'DELETE' });
    setDeleting(null); refreshCampaigns();
  }

  const stats = React.useMemo(() => ({
    total:  campaigns.length,
    active: campaigns.filter(c => c.status === 'active').length,
    leads:  campaigns.reduce((s, c) => s + (c.lead_ids?.length ?? 0), 0),
    replied: (Object.values(repliedCountByCampaign) as number[]).reduce((s, n) => s + n, 0),
  }), [campaigns, repliedCountByCampaign]);

  return (
    <div className="space-y-5 max-w-5xl pb-12">

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {([
          { label: 'Campaigns',    value: stats.total,   color: '#60a5fa', icon: Megaphone as React.ElementType },
          { label: 'Active',       value: stats.active,  color: ACCENT,    icon: Play      as React.ElementType },
          { label: 'Total Leads',  value: stats.leads,   color: '#a78bfa', icon: Users     as React.ElementType },
          { label: 'Replies',      value: stats.replied, color: '#25D366', icon: Reply     as React.ElementType },
        ]).map(({ label, value, color, icon: Icon }) => (
          <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="admin-card p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
              <Icon size={15} style={{ color }} />
            </div>
            <div>
              <p className="text-[22px] font-black admin-text leading-none">{loading ? '—' : value}</p>
              <p className="text-[11px] admin-muted mt-0.5">{label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between">
        <p className="text-[12px] admin-muted">Multi-channel outreach sequences</p>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-black font-bold text-[12px] transition-all"
          style={{ background: ACCENT, boxShadow: '0 0 20px rgba(0,214,125,0.2)' }}>
          <Plus size={14} /> New Campaign
        </motion.button>
      </div>

      {/* ── Campaign list ── */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="admin-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2"><div className="skeleton h-4 w-40 rounded" /><div className="skeleton h-4 w-16 rounded-full" /></div>
                  <div className="skeleton h-3 w-56 rounded" />
                  <div className="flex gap-1.5"><div className="skeleton h-6 w-6 rounded-lg" /><div className="skeleton h-6 w-6 rounded-lg" /></div>
                </div>
                <div className="flex gap-2"><div className="skeleton h-8 w-8 rounded-lg" /><div className="skeleton h-8 w-8 rounded-lg" /></div>
              </div>
            </div>
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 gap-4 border border-dashed admin-border rounded-2xl">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${ACCENT}12` }}>
            <Megaphone size={22} style={{ color: ACCENT }} className="opacity-60" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold admin-text">No campaigns yet</p>
            <p className="text-[11px] admin-muted mt-1">Create your first multi-channel outreach campaign</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="text-[12px] font-semibold transition-colors" style={{ color: ACCENT }}>
            Create campaign →
          </button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c, i) => {
            const cfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.draft;
            const repliedCount = repliedCountByCampaign[c.id!] ?? 0;
            return (
              <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="admin-card p-4 lg:p-5 hover:border-[var(--admin-border-md)] transition-colors">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    {/* Title row */}
                    <div className="flex items-center gap-2.5 flex-wrap mb-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${cfg.dot}18` }}>
                        <Megaphone size={12} style={{ color: cfg.dot }} />
                      </div>
                      <span className="font-bold text-[14px] admin-text">{c.name}</span>
                      <StatusPill status={c.status} />
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Channel dots */}
                      <div className="flex items-center gap-1">
                        {(c.channels as CampaignChannel[]).map(ch => <ChannelDot key={ch} channel={ch} />)}
                      </div>
                      <span className="w-px h-3 bg-[var(--admin-border-md)]" />
                      <span className="flex items-center gap-1 text-[11px] admin-muted">
                        <Users size={11} /> {c.lead_ids?.length ?? 0} leads
                      </span>
                      {repliedCount > 0 && (
                        <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ color: '#25D366', background: '#25D36615' }}>
                          <Reply size={10} /> {repliedCount} replied
                        </span>
                      )}
                      {c.start_date && (
                        <span className="flex items-center gap-1 text-[11px] admin-muted">
                          <Calendar size={11} /> {new Date(c.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => setDetailCampaign(c)} title="View details"
                      className="p-2 rounded-lg admin-muted admin-hover border admin-border transition-colors hover:admin-text">
                      <Eye size={14} />
                    </button>
                    {(c.status === 'active' || c.status === 'paused') && (
                      <button onClick={() => toggleStatus(c)} title={c.status === 'active' ? 'Pause' : 'Resume'}
                        className={`p-2 rounded-lg border transition-colors ${c.status === 'active' ? 'text-yellow-400 bg-yellow-400/5 border-yellow-400/20 hover:bg-yellow-400/10' : 'border-[#00D67D]/20 bg-[#00D67D]/5 hover:bg-[#00D67D]/10'}`}
                        style={c.status === 'paused' ? { color: ACCENT } : {}}>
                        {c.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                      </button>
                    )}
                    <button onClick={() => deleteCampaign(c.id!)} disabled={deleting === c.id} title="Delete"
                      className="p-2 rounded-lg text-red-400 bg-red-400/5 border border-red-400/20 hover:bg-red-400/10 transition-colors disabled:opacity-40">
                      {deleting === c.id ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {showCreate && <CreateModal leads={leads} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); refreshCampaigns(); }} />}
        {detailCampaign && <DetailModal campaign={detailCampaign} leads={leads} onClose={() => setDetailCampaign(null)} />}
      </AnimatePresence>
    </div>
  );
}
