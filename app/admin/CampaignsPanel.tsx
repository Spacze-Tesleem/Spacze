'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw, Plus, X, Play, Pause, Trash2,
  Calendar, Users, Eye, Megaphone, Mail, MessageCircle, Linkedin, Twitter,
  Facebook, Search, Wand2, ArrowLeft, Sparkles,
} from 'lucide-react';
import { Campaign, CampaignChannel, Lead, ScheduledMessage } from '@/lib/supabase';
import { useToast, ToastStack } from '@/app/components/Toast';
import { useLeads, useCampaigns } from '@/lib/hooks';
import ModalPortal from '@/app/components/ModalPortal';

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } };

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  draft:     'text-zinc-400 bg-zinc-400/10 border-zinc-400/20',
  active:    'text-[#00D67D] bg-[#00D67D]/10 border-[#00D67D]/20',
  paused:    'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  completed: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
};

const MSG_STATUS_STYLES: Record<string, string> = {
  pending:   'text-yellow-500 bg-yellow-500/10',
  sent:      'text-[#00D67D] bg-[#00D67D]/10',
  failed:    'text-red-400 bg-red-400/10',
  cancelled: 'text-zinc-500 bg-zinc-500/10',
};

const CHANNEL_ICONS: Record<CampaignChannel, React.ReactNode> = {
  email:      <Mail size={13} />,
  whatsapp:   <MessageCircle size={13} />,
  linkedin:   <Linkedin size={13} />,
  twitter:    <Twitter size={13} />,
  facebook:   <Facebook size={13} />,
  google_ads: <Search size={13} />,
};

const CHANNEL_COLORS: Record<CampaignChannel, string> = {
  email:      'text-blue-400',
  whatsapp:   'text-[#25D366]',
  linkedin:   'text-blue-500',
  twitter:    'text-sky-400',
  facebook:   'text-[#1877F2]',
  google_ads: 'text-yellow-400',
};

// Channels that target individual leads via contact fields
const CHANNEL_REQUIREMENTS: Partial<Record<CampaignChannel, { field: keyof Lead; label: string }>> = {
  email:    { field: 'contact_email',   label: 'email' },
  whatsapp: { field: 'whatsapp_number', label: 'WhatsApp number' },
  linkedin: { field: 'linkedin_url',    label: 'LinkedIn URL' },
  twitter:  { field: 'twitter_handle',  label: 'Twitter handle' },
};

// Ad channels publish one ad per campaign (not per-lead)
const AD_CHANNELS: CampaignChannel[] = ['facebook', 'google_ads'];

const CHANNEL_LABELS: Record<CampaignChannel, string> = {
  email:      'Email',
  whatsapp:   'WhatsApp',
  linkedin:   'LinkedIn',
  twitter:    'Twitter / X',
  facebook:   'Facebook Ads',
  google_ads: 'Google Ads',
};

const STEP_OFFSETS = [0, 3, 7, 14];
const ALL_CHANNELS: CampaignChannel[] = ['email', 'whatsapp', 'linkedin', 'twitter', 'facebook', 'google_ads'];

function addDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

// ─── CHANNEL BADGE ────────────────────────────────────────────────────────────

function ChannelBadge({ channel }: { channel: CampaignChannel }) {
  return (
    <span className={`flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md border ${CHANNEL_COLORS[channel]} bg-white/5 border-white/10`}>
      {CHANNEL_ICONS[channel]} {CHANNEL_LABELS[channel]}
    </span>
  );
}

// ─── CHANNEL COVERAGE ─────────────────────────────────────────────────────────

function ChannelCoverage({ channel, leads }: { channel: CampaignChannel; leads: Lead[] }) {
  const req = CHANNEL_REQUIREMENTS[channel];
  if (!req) {
    // Ad channels (facebook, google_ads) publish one ad — no per-lead requirement
    return <span className="text-[10px] admin-muted">1 ad per campaign</span>;
  }
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
    <ModalPortal>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
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
    </ModalPortal>
  );
}

// ─── HELPERS: parse /api/generate-copy output for google_ads ─────────────────

function parseGoogleAdsCopy(raw: string): { headlines: string[]; descriptions: string[] } {
  const headlines: string[] = [];
  const descriptions: string[] = [];
  for (const line of raw.split('\n')) {
    const hl = line.match(/^HEADLINE_\d+:\s*(.+)/);
    if (hl) headlines.push(hl[1].trim());
    const desc = line.match(/^DESCRIPTION_\d+:\s*(.+)/);
    if (desc) descriptions.push(desc[1].trim());
  }
  return {
    headlines:    headlines.length    >= 3 ? headlines    : ['Boost Your Business', 'Expert Tech Audits', 'Spacze Web Solutions'],
    descriptions: descriptions.length >= 2 ? descriptions : ['Uncover technical weak points holding your site back.', 'Transform your digital presence with our expert team.'],
  };
}

function parseMetaCopy(raw: string): { primaryText: string; headline: string } {
  let primaryText = '';
  let headline = '';
  const lines = raw.split('\n');
  let inBody = false;
  for (const line of lines) {
    if (/^PRIMARY_TEXT:|^CAPTION:|^BODY:/i.test(line)) { inBody = true; primaryText = line.replace(/^[^:]+:\s*/, '').trim(); continue; }
    if (/^HEADLINE:/i.test(line)) { headline = line.replace(/^HEADLINE:\s*/i, '').trim(); inBody = false; continue; }
    if (inBody && line.trim()) primaryText += (primaryText ? ' ' : '') + line.trim();
  }
  if (!primaryText) primaryText = raw.split('\n').find(l => l.trim().length > 20) ?? raw.slice(0, 150);
  if (!headline)    headline    = 'Free Website Tech Audit';
  return { primaryText, headline };
}

// ─── CREATE MODAL (multi-step wizard) ────────────────────────────────────────

function CreateModal({ leads, onClose, onCreated }: { leads: Lead[]; onClose: () => void; onCreated: (c?: Campaign) => void }) {
  const { toast, toasts, dismiss } = useToast();

  // Step management
  const [step, setStep]           = useState<1 | 2>(1);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  // Step 1 state
  const [name, setName]           = useState('');
  const [targetUrl, setTargetUrl] = useState('https://spacze.vercel.app');
  const [dailyBudget, setDailyBudget] = useState('500');
  const [channels, setChannels]   = useState<CampaignChannel[]>(['email']);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 16));

  // Step 2 state — ad copy drafts
  const [googleDraft, setGoogleDraft] = useState({ headlines: ['', '', ''], descriptions: ['', ''] });
  const [metaDraft, setMetaDraft]     = useState({ primaryText: '', headline: '', cta: 'Learn More' });

  const inp = 'w-full admin-input border admin-border-md rounded-xl px-3 py-2.5 text-[13px] admin-text outline-none transition-colors placeholder:admin-subtle';

  function toggleChannel(ch: CampaignChannel) {
    setChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
  }
  function toggleLead(id: string) {
    setSelectedLeadIds(prev => prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]);
  }
  function toggleAllLeads() {
    setSelectedLeadIds(prev => prev.length === leads.length ? [] : leads.map(l => l.id!));
  }

  const outreachChannels = channels.filter(ch => !AD_CHANNELS.includes(ch));
  const hasAds           = channels.some(ch => AD_CHANNELS.includes(ch));

  // ── Step 1 → Step 2: validate, then generate AI copy for ad channels ────────
  async function handleNext() {
    if (!name.trim())          { setError('Campaign name is required.'); return; }
    if (channels.length === 0) { setError('Select at least one channel.'); return; }
    if (outreachChannels.length > 0 && selectedLeadIds.length === 0) {
      setError('Select at least one lead for outreach channels.'); return;
    }
    setError('');

    if (!hasAds) {
      // No ad networks — skip Step 2 and publish directly
      await publishCampaign(true, { headlines: [], descriptions: [] }, { primaryText: '', headline: '', cta: 'Learn More' });
      return;
    }

    setGenerating(true);
    try {
      const brief = { productName: 'Spacze Web Agency', targetAudience: 'Business owners', tone: 'Professional', goal: 'Leads', keyMessage: name };

      const [googleRaw, metaRaw] = await Promise.all([
        channels.includes('google_ads')
          ? fetch('/api/generate-copy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ platform: 'google_ads', ...brief }) })
              .then(r => r.json()).then(d => d.output ?? '')
          : Promise.resolve(''),
        channels.includes('facebook')
          ? fetch('/api/generate-copy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ platform: 'instagram', ...brief }) })
              .then(r => r.json()).then(d => d.output ?? '')
          : Promise.resolve(''),
      ]);

      if (channels.includes('google_ads')) setGoogleDraft(parseGoogleAdsCopy(googleRaw));
      if (channels.includes('facebook'))   setMetaDraft({ ...parseMetaCopy(metaRaw), cta: 'Learn More' });

      setStep(2);
    } catch {
      setError('Failed to generate ad copy. You can still edit the fields manually.');
      setStep(2);
    } finally {
      setGenerating(false);
    }
  }

  // ── Final publish: save to DB + dispatch to ad networks ─────────────────────
  async function publishCampaign(
    activate: boolean,
    gDraft: typeof googleDraft,
    mDraft: typeof metaDraft,
  ) {
    setSaving(true); setError('');
    try {
      // 1. Create campaign record
      const dbRes = await fetch('/api/campaigns', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: targetUrl ? `Target URL: ${targetUrl}` : '',
          status: activate ? 'active' : 'draft',
          channels, lead_ids: selectedLeadIds,
          auto_sequence: true, start_date: startDate,
        }),
      });
      const campaign: Campaign = await dbRes.json();
      if (!dbRes.ok) throw new Error((campaign as any).error || 'Failed to create campaign');

      // 2. Schedule outreach messages for per-lead channels
      if (activate && campaign.id && outreachChannels.length > 0 && selectedLeadIds.length > 0) {
        const base = new Date(startDate);
        const rows: Omit<ScheduledMessage, 'id' | 'created_at'>[] = [];
        for (const leadId of selectedLeadIds) {
          for (const channel of outreachChannels) {
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
        if (rows.length > 0) {
          await fetch('/api/scheduled-messages', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rows),
          });
        }
      }

      // 3. Dispatch to ad networks (fire-and-forget with toast feedback)
      if (activate) {
        if (channels.includes('google_ads')) {
          const gRes = await fetch('/api/send-google-ads', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              headlines:    gDraft.headlines.filter(Boolean),
              descriptions: gDraft.descriptions.filter(Boolean),
              finalUrl: targetUrl, campaignName: name,
            }),
          });
          toast(gRes.ok ? 'success' : 'error', gRes.ok ? 'Google Ad created (paused — review in Ads UI)' : 'Google Ads push failed — check API keys');
        }
        if (channels.includes('facebook')) {
          const fRes = await fetch('/api/send-facebook', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              primaryText: mDraft.primaryText, headline: mDraft.headline,
              description: '', cta: mDraft.cta,
              targetUrl, campaignName: name,
              dailyBudget: parseInt(dailyBudget) || 500,
            }),
          });
          toast(fRes.ok ? 'success' : 'error', fRes.ok ? 'Meta Ad created (paused — review in Ads Manager)' : 'Facebook Ads push failed — check API keys');
        }
      }

      onCreated(campaign);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save campaign');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalPortal>
      <ToastStack toasts={toasts} onDismiss={dismiss} />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <motion.div
          initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="w-full sm:max-w-2xl bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] sm:max-h-[88vh] flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 flex-shrink-0">
            <div>
              <h2 className="font-bold text-[15px] admin-text flex items-center gap-2">
                <Wand2 size={14} className="text-[#00D67D]" />
                {step === 1 ? 'New Campaign' : 'Review Ad Creative'}
              </h2>
              <p className="text-[11px] admin-muted mt-0.5">
                Step {step} of {hasAds ? 2 : 1}: {step === 1 ? 'Strategy & targeting' : 'AI-generated copy — edit before launch'}
              </p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-xl admin-muted hover:admin-text hover:bg-white/5 border border-white/8 transition-colors">
              <X size={14} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">
            {error && <p className="text-red-400 text-xs px-3 py-2 rounded-xl bg-red-500/8 border border-red-500/20">{error}</p>}

            {/* ── STEP 1 ── */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label-xs mb-1.5 block">Campaign Name *</label>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Q3 Tech Audits" className={inp} />
                  </div>
                  <div>
                    <label className="label-xs mb-1.5 block">Target URL</label>
                    <input value={targetUrl} onChange={e => setTargetUrl(e.target.value)} placeholder="https://spacze.vercel.app" className={inp} />
                  </div>
                </div>

                {/* Channels */}
                <div>
                  <label className="label-xs mb-2 block">Channels</label>
                  <div className="grid grid-cols-3 gap-2">
                    {ALL_CHANNELS.map(ch => {
                      const active = channels.includes(ch);
                      const isAd   = AD_CHANNELS.includes(ch);
                      return (
                        <button key={ch} onClick={() => toggleChannel(ch)}
                          className={`relative flex flex-col items-center justify-center gap-1.5 px-2 py-3 rounded-xl border text-xs font-medium transition-all ${
                            active
                              ? `${CHANNEL_COLORS[ch]} bg-white/8 border-white/15`
                              : 'admin-muted border-white/8 hover:bg-white/5 hover:border-white/12 hover:admin-text'
                          }`}>
                          <span className={`${active ? CHANNEL_COLORS[ch] : 'opacity-50'}`}>{CHANNEL_ICONS[ch]}</span>
                          <span className="text-center leading-tight">{CHANNEL_LABELS[ch]}</span>
                          {isAd && <span className="absolute top-1.5 right-1.5 text-[8px] font-bold px-1 py-0.5 rounded bg-white/10 admin-muted leading-none">AD</span>}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] admin-muted mt-2">
                    Channels marked <span className="font-bold admin-text">AD</span> push one AI-generated ad per campaign — no per-lead contact needed.
                  </p>
                </div>

                {/* Daily budget — only shown when ad channels are selected */}
                {hasAds && (
                  <div>
                    <label className="label-xs mb-1.5 block">Daily Ad Budget (cents — 500 = $5.00)</label>
                    <input type="number" value={dailyBudget} onChange={e => setDailyBudget(e.target.value)} placeholder="500" className={inp} />
                  </div>
                )}

                {/* Leads */}
                {outreachChannels.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="label-xs">
                        Leads <span className="normal-case font-normal admin-muted">({selectedLeadIds.length} selected)</span>
                      </label>
                      <button onClick={toggleAllLeads} className="text-[11px] font-medium text-[#00D67D] hover:opacity-80 transition-opacity">
                        {selectedLeadIds.length === leads.length ? 'Deselect all' : 'Select all'}
                      </button>
                    </div>
                    <div className="max-h-44 overflow-y-auto rounded-xl border border-white/8 divide-y divide-white/5">
                      {leads.map(l => {
                        const sel = selectedLeadIds.includes(l.id!);
                        return (
                          <button key={l.id} onClick={() => toggleLead(l.id!)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${sel ? 'bg-[#00D67D]/6' : 'hover:bg-white/3'}`}>
                            <div className={`w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center transition-all ${sel ? 'bg-[#00D67D] border-[#00D67D]' : 'border-white/20'}`}>
                              {sel && <span className="text-black text-[9px] font-black leading-none">✓</span>}
                            </div>
                            <div className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] font-bold"
                              style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                              {l.business_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className={`text-[12px] font-semibold truncate ${sel ? 'text-[#00D67D]' : 'admin-text'}`}>{l.business_name}</div>
                              <div className="text-[10px] admin-muted truncate">{l.contact_email}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Start date */}
                <div>
                  <label className="label-xs mb-1.5 block">Start Date &amp; Time</label>
                  <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} className={inp} />
                </div>
              </motion.div>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="p-3 rounded-xl border border-blue-500/20 bg-blue-500/5 text-[12px] text-blue-300 leading-relaxed">
                  AI has drafted your ad assets. Edit them below, then click <strong>Launch</strong>. Ads are pushed in a <strong>PAUSED</strong> state — activate them in Google Ads / Meta Ads Manager after review.
                </div>

                {channels.includes('google_ads') && (
                  <div className="p-4 rounded-2xl border border-white/10 bg-black/20 space-y-3">
                    <h3 className="text-[12px] font-bold text-yellow-400 flex items-center gap-2"><Search size={13}/> Google Search Ads</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] admin-muted">Headlines (max 30 chars each)</label>
                        {googleDraft.headlines.map((hl, i) => (
                          <input key={i} value={hl} maxLength={30}
                            onChange={e => { const h = [...googleDraft.headlines]; h[i] = e.target.value; setGoogleDraft({ ...googleDraft, headlines: h }); }}
                            className={inp} />
                        ))}
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] admin-muted">Descriptions (max 90 chars each)</label>
                        {googleDraft.descriptions.map((desc, i) => (
                          <textarea key={i} value={desc} rows={2} maxLength={90}
                            onChange={e => { const d = [...googleDraft.descriptions]; d[i] = e.target.value; setGoogleDraft({ ...googleDraft, descriptions: d }); }}
                            className={`${inp} resize-none`} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {channels.includes('facebook') && (
                  <div className="p-4 rounded-2xl border border-white/10 bg-black/20 space-y-3">
                    <h3 className="text-[12px] font-bold text-[#1877F2] flex items-center gap-2"><Facebook size={13}/> Meta Ads (Facebook &amp; Instagram)</h3>
                    <div>
                      <label className="text-[10px] admin-muted mb-1 block">Primary Text</label>
                      <textarea rows={3} value={metaDraft.primaryText}
                        onChange={e => setMetaDraft({ ...metaDraft, primaryText: e.target.value })}
                        className={`${inp} resize-none`} />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] admin-muted mb-1 block">Headline</label>
                        <input value={metaDraft.headline} onChange={e => setMetaDraft({ ...metaDraft, headline: e.target.value })} className={inp} />
                      </div>
                      <div>
                        <label className="text-[10px] admin-muted mb-1 block">Call To Action</label>
                        <select value={metaDraft.cta} onChange={e => setMetaDraft({ ...metaDraft, cta: e.target.value })} className={inp}>
                          <option>Learn More</option>
                          <option>Sign Up</option>
                          <option>Get Quote</option>
                          <option>Contact Us</option>
                          <option>Book Now</option>
                        </select>
                      </div>
                    </div>
                    <p className="text-[10px] admin-muted flex items-center gap-1">
                      <Sparkles size={10} className="text-purple-400" />
                      Image/video generation is processed asynchronously — attach creatives in Meta Ads Manager.
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t admin-border flex gap-3 flex-shrink-0">
            {step === 1 ? (
              <>
                <button onClick={handleNext} disabled={generating || saving}
                  className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl text-black font-bold text-[13px] transition-all disabled:opacity-40 hover:opacity-90"
                  style={{ background: '#00D67D', boxShadow: '0 0 20px rgba(0,214,125,0.25)' }}>
                  {generating ? <RefreshCw size={14} className="animate-spin" /> : hasAds ? <Wand2 size={14} /> : <Play size={14} />}
                  {generating ? 'Generating copy…' : hasAds ? 'Generate Ad Creative' : 'Activate Campaign'}
                </button>
                <button onClick={() => { setError(''); publishCampaign(false, googleDraft, metaDraft); }} disabled={saving || generating}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl admin-muted hover:admin-text hover:bg-[var(--admin-hover-bg)] border admin-border font-semibold text-[13px] transition-all disabled:opacity-40">
                  {saving ? <RefreshCw size={14} className="animate-spin" /> : null}
                  Save Draft
                </button>
              </>
            ) : (
              <>
                <button onClick={() => { setStep(1); setError(''); }}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-xl admin-muted hover:admin-text hover:bg-[var(--admin-hover-bg)] border admin-border font-semibold text-[13px] transition-all">
                  <ArrowLeft size={13} /> Back
                </button>
                <button onClick={() => publishCampaign(true, googleDraft, metaDraft)} disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-black font-bold text-[13px] transition-all disabled:opacity-40 shadow-[0_0_20px_rgba(0,214,125,0.15)] hover:opacity-90"
                  style={{ background: 'var(--accent)' }}>
                  {saving ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
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
  const { leads }                                       = useLeads();
  const { campaigns, loading, refresh: refreshCampaigns } = useCampaigns();
  const [showCreate, setShowCreate]     = useState(false);
  const [detailCampaign, setDetailCampaign] = useState<Campaign | null>(null);
  const [deleting, setDeleting]         = useState<string | null>(null);

  async function toggleStatus(campaign: Campaign) {
    const next = campaign.status === 'active' ? 'paused' : 'active';
    await fetch(`/api/campaigns?id=${campaign.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    refreshCampaigns();
  }

  async function deleteCampaign(id: string) {
    setDeleting(id);
    await fetch(`/api/campaigns?id=${id}`, { method: 'DELETE' });
    setDeleting(null);
    refreshCampaigns();
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto lg:mx-0">
      <div className="flex items-center justify-between">
        <p className="text-[12px] admin-muted">Multi-channel outreach sequences</p>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-black font-bold text-[13px] transition-colors shadow-[0_0_20px_rgba(0,214,125,0.15)] hover:opacity-90"
          style={{ background: 'var(--accent)' }}>
          <Wand2 size={15} /> New Campaign
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="admin-card p-4 lg:p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="skeleton h-4 w-40 rounded" />
                    <div className="skeleton h-4 w-16 rounded-full" />
                  </div>
                  <div className="skeleton h-3 w-64 rounded" />
                  <div className="flex gap-2 mt-1">
                    <div className="skeleton h-5 w-12 rounded-full" />
                    <div className="skeleton h-5 w-12 rounded-full" />
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <div className="skeleton h-8 w-8 rounded-lg" />
                  <div className="skeleton h-8 w-8 rounded-lg" />
                  <div className="skeleton h-8 w-8 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <motion.div {...fadeUp} className="flex flex-col items-center justify-center py-16 gap-3 border border-dashed admin-border rounded-2xl">
          <Megaphone size={32} className="admin-subtle" />
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
            onCreated={() => { setShowCreate(false); refreshCampaigns(); }} />
        )}
        {detailCampaign && (
          <DetailModal campaign={detailCampaign} leads={leads} onClose={() => setDetailCampaign(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
