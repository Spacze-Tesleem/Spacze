'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wifi, WifiOff, RefreshCw, Send, CheckCircle2,
  AlertCircle, QrCode, MessageCircle, LogOut, Eye, X,
  Inbox, ChevronLeft, Users, Zap, Phone,
} from 'lucide-react';
import { Lead } from '@/lib/supabase';
import ModalPortal from '@/app/components/ModalPortal';
import { useLeads } from '@/lib/hooks';

type ConnectionStatus = 'disconnected' | 'connecting' | 'qr_ready' | 'connected' | 'unknown';
interface PreviewMessage { leadId: string; to: string; businessName: string; message: string; }
type WaMessage = { id: string; phone: string; message: string; direction: 'inbound' | 'outbound'; received_at: string; };
type Conversation = { phone: string; lead_id: string | null; business_name: string | null; last_message: string; last_at: string; unread: number; messages: WaMessage[]; };

const WA_GREEN = '#25D366';
const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35 } };

// ─── INBOX ────────────────────────────────────────────────────────────────────
function WhatsAppInbox({ status }: { status: ConnectionStatus }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Conversation | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  async function loadInbox() {
    setLoading(true);
    const res = await fetch('/api/whatsapp-inbox');
    const data = await res.json();
    const convs: Conversation[] = Array.isArray(data) ? data : [];
    setConversations(convs);
    if (active) {
      const updated = convs.find(c => c.phone === active.phone);
      if (updated) setActive(updated);
    }
    setLoading(false);
  }

  useEffect(() => { loadInbox(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (status !== 'connected') return;
    const t = setInterval(loadInbox, 10_000);
    return () => clearInterval(t);
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [active?.messages.length]);

  async function sendReply() {
    if (!active || !reply.trim()) return;
    setSending(true); setSendError('');
    try {
      const res = await fetch('/api/whatsapp-inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: active.phone, message: reply.trim(), lead_id: active.lead_id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Send failed');
      setReply('');
      await loadInbox();
    } catch (e: unknown) {
      setSendError(e instanceof Error ? e.message : 'Send failed');
    } finally { setSending(false); }
  }

  function formatTime(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    return isToday
      ? d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);

  return (
    <div className="flex flex-col h-full min-h-[480px]">
      {/* Inbox header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b admin-border flex-shrink-0">
        <div className="flex items-center gap-2.5">
          {active ? (
            <button onClick={() => setActive(null)} className="p-1.5 rounded-lg admin-hover transition-colors admin-muted hover:admin-text">
              <ChevronLeft size={15} />
            </button>
          ) : (
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${WA_GREEN}18` }}>
              <Inbox size={13} style={{ color: WA_GREEN }} />
            </div>
          )}
          <div>
            <p className="font-semibold text-[13px] admin-text leading-none">
              {active ? (active.business_name ?? active.phone) : 'Inbox'}
            </p>
            {active && <p className="text-[10px] admin-muted mt-0.5 font-mono">{active.phone}</p>}
            {!active && conversations.length > 0 && (
              <p className="text-[10px] admin-muted mt-0.5">{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</p>
            )}
          </div>
          {!active && totalUnread > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-black" style={{ background: WA_GREEN }}>
              {totalUnread}
            </span>
          )}
        </div>
        <button onClick={loadInbox} className="p-1.5 rounded-lg admin-hover transition-colors admin-muted hover:admin-text" title="Refresh">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {loading && conversations.length === 0 ? (
          <div className="flex-1 flex items-center justify-center gap-2 admin-muted text-sm">
            <RefreshCw size={14} className="animate-spin" /> Loading…
          </div>
        ) : !active ? (
          conversations.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 py-12">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${WA_GREEN}12` }}>
                <MessageCircle size={24} style={{ color: WA_GREEN }} className="opacity-60" />
              </div>
              <p className="text-sm admin-muted font-medium">No conversations yet</p>
              <p className="text-[11px] admin-muted opacity-60 text-center max-w-xs leading-relaxed">
                Messages sent and received via WhatsApp will appear here once the worker is connected.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto divide-y admin-border">
              {conversations.map(conv => (
                <button key={conv.phone} onClick={() => setActive(conv)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 admin-hover transition-colors text-left group">
                  <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-[13px] font-bold"
                    style={{ background: `${WA_GREEN}20`, color: WA_GREEN }}>
                    {(conv.business_name ?? conv.phone).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[13px] admin-text truncate">{conv.business_name ?? conv.phone}</span>
                      <span className="text-[10px] admin-muted flex-shrink-0">{formatTime(conv.last_at)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className="text-[11px] admin-muted truncate">{conv.last_message}</p>
                      {conv.unread > 0 && (
                        <span className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full text-black min-w-[18px] text-center" style={{ background: WA_GREEN }}>
                          {conv.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )
        ) : (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2 max-h-[360px]">
              {active.messages.map(msg => {
                const isOut = msg.direction === 'outbound';
                return (
                  <div key={msg.id} className={`flex ${isOut ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-[12px] leading-relaxed shadow-sm ${
                      isOut ? 'rounded-br-sm text-black' : 'admin-surface-2 admin-text rounded-bl-sm border admin-border'
                    }`} style={isOut ? { background: WA_GREEN } : {}}>
                      <p>{msg.message}</p>
                      <p className={`text-[10px] mt-1 text-right ${isOut ? 'text-black/50' : 'admin-muted'}`}>
                        {formatTime(msg.received_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            <div className="border-t admin-border px-4 py-3 flex-shrink-0">
              {sendError && <p className="text-red-400 text-[11px] mb-2">{sendError}</p>}
              <div className="flex items-end gap-2">
                <textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                  placeholder="Type a message… (Enter to send)"
                  rows={2}
                  disabled={status !== 'connected'}
                  className="flex-1 admin-input border admin-border rounded-xl px-3 py-2 text-[12px] admin-text outline-none resize-none transition-colors placeholder:admin-subtle disabled:opacity-40"
                />
                <button
                  onClick={sendReply}
                  disabled={!reply.trim() || sending || status !== 'connected'}
                  className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 hover:brightness-110"
                  style={{ background: WA_GREEN }}
                >
                  {sending ? <RefreshCw size={14} className="animate-spin text-black" /> : <Send size={14} className="text-black" />}
                </button>
              </div>
              {status !== 'connected' && (
                <p className="text-[10px] admin-muted mt-1.5">Connect WhatsApp to send replies.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── BULK SEND PANEL ──────────────────────────────────────────────────────────
interface BulkSendProps {
  leads: Lead[];
  status: ConnectionStatus;
  selectedIds: Set<string>;
  generating: boolean;
  sending: boolean;
  progress: string;
  sendDone: boolean;
  error: string;
  previews: PreviewMessage[];
  showPreview: boolean;
  onToggleLead: (id: string) => void;
  onToggleAll: () => void;
  onGenerate: () => void;
  onSend: () => void;
  onClosePreview: () => void;
  onOpenPreview: () => void;
}

function BulkSendPanel({
  leads, status, selectedIds, generating, sending, progress, sendDone, error,
  previews, onToggleLead, onToggleAll, onGenerate, onOpenPreview,
}: BulkSendProps) {
  const sentLeads = leads.filter(l => l.outreach_status === 'Sent');
  const pendingLeads = leads.filter(l => l.outreach_status !== 'Sent');

  return (
    <div className="admin-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b admin-border">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${WA_GREEN}18` }}>
              <Zap size={15} style={{ color: WA_GREEN }} />
            </div>
            <div>
              <h3 className="font-bold text-[14px] admin-text leading-none">Bulk Outreach</h3>
              <p className="text-[11px] admin-muted mt-0.5">AI-personalised messages · 30–60s delay between sends</p>
            </div>
          </div>
          {leads.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-[11px] admin-muted border admin-border px-3 py-1.5 rounded-full">
                <Users size={11} /> {leads.length} with number
              </div>
              {sentLeads.length > 0 && (
                <div className="flex items-center gap-1.5 text-[11px] border px-3 py-1.5 rounded-full"
                  style={{ color: WA_GREEN, borderColor: `${WA_GREEN}30`, background: `${WA_GREEN}10` }}>
                  <CheckCircle2 size={11} /> {sentLeads.length} sent
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        {leads.length === 0 ? (
          <div className="py-10 text-center border border-dashed admin-border rounded-xl">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: `${WA_GREEN}12` }}>
              <Phone size={20} style={{ color: WA_GREEN }} className="opacity-50" />
            </div>
            <p className="admin-muted text-sm font-medium">No leads with a WhatsApp number</p>
            <p className="admin-subtle text-[11px] mt-1">Add WhatsApp numbers in the Audience panel.</p>
          </div>
        ) : (
          <>
            {/* Select all row */}
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2.5 text-[12px] admin-muted cursor-pointer select-none group">
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                  selectedIds.size === leads.length ? 'border-transparent' : 'admin-border-md group-hover:border-[#25D366]/50'
                }`} style={selectedIds.size === leads.length ? { background: WA_GREEN } : {}}>
                  {selectedIds.size === leads.length && <CheckCircle2 size={10} className="text-black" />}
                </div>
                <input type="checkbox" checked={selectedIds.size === leads.length} onChange={onToggleAll} className="sr-only" />
                Select all ({leads.length})
              </label>
              {selectedIds.size > 0 && (
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ color: WA_GREEN, background: `${WA_GREEN}15` }}>
                  {selectedIds.size} selected
                </span>
              )}
            </div>

            {/* Lead list */}
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1 mb-5">
              {leads.map(lead => {
                const isSelected = selectedIds.has(lead.id!);
                const isSent = lead.outreach_status === 'Sent';
                return (
                  <label key={lead.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected ? 'border-[#25D366]/25' : 'admin-border admin-hover'
                    }`}
                    style={isSelected ? { background: `${WA_GREEN}08` } : {}}>
                    <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
                      isSelected ? 'border-transparent' : 'admin-border-md'
                    }`} style={isSelected ? { background: WA_GREEN } : {}}>
                      {isSelected && <CheckCircle2 size={10} className="text-black" />}
                    </div>
                    <input type="checkbox" checked={isSelected} onChange={() => onToggleLead(lead.id!)} className="sr-only" />
                    <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold"
                      style={{ background: `${WA_GREEN}20`, color: WA_GREEN }}>
                      {lead.business_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold admin-text truncate">{lead.business_name}</p>
                      <p className="text-[10px] admin-muted truncate font-mono">{lead.whatsapp_number} · {lead.industry || 'Unknown'}</p>
                    </div>
                    {isSent && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 border"
                        style={{ color: WA_GREEN, borderColor: `${WA_GREEN}30`, background: `${WA_GREEN}10` }}>
                        Sent
                      </span>
                    )}
                  </label>
                );
              })}
            </div>

            {/* Status messages */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[12px] mb-3">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" /> {error}
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {progress && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-blue-400 text-[12px] mb-3">
                  <RefreshCw size={13} className="animate-spin flex-shrink-0" /> {progress}
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {sendDone && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-[12px] mb-3" style={{ color: WA_GREEN }}>
                  <CheckCircle2 size={14} /> Bulk send started — messages are being delivered with delays.
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action buttons */}
            <div className="flex gap-2 flex-wrap">
              <button onClick={onGenerate} disabled={selectedIds.size === 0 || generating || sending}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border admin-border-md admin-muted hover:admin-text text-[12px] font-semibold transition-colors disabled:opacity-40 admin-hover">
                {generating ? <RefreshCw size={13} className="animate-spin" /> : <Zap size={13} />}
                {generating ? 'Generating…' : `Generate ${selectedIds.size > 0 ? `(${selectedIds.size})` : ''}`}
              </button>
              {previews.length > 0 && (
                <button onClick={onOpenPreview}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-black text-[12px] font-bold transition-all hover:brightness-110"
                  style={{ background: WA_GREEN }}>
                  <Eye size={13} /> Review & Send ({previews.length})
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── MAIN PANEL ───────────────────────────────────────────────────────────────
export default function WhatsAppPanel() {
  const { leads: allLeads } = useLeads();
  const leads = allLeads.filter((l: Lead) => l.whatsapp_number);

  const [status, setStatus] = useState<ConnectionStatus>('unknown');
  const [qr, setQr] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [activeTab, setActiveTab] = useState<'send' | 'inbox'>('send');

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState('');
  const [sendDone, setSendDone] = useState(false);
  const [error, setError] = useState('');
  const [previews, setPreviews] = useState<PreviewMessage[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp-worker');
      const data = await res.json();
      if (data.error) { setStatusError(data.error); setStatus('disconnected'); setQr(null); }
      else { setStatusError(''); setStatus(data.status || 'unknown'); setQr(data.qr || null); }
    } catch (e: unknown) {
      setStatus('disconnected');
      setStatusError(e instanceof Error ? e.message : 'Could not reach worker');
      setQr(null);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);
  useEffect(() => {
    if (status === 'connected') return;
    const interval = setInterval(fetchStatus, 4000);
    return () => clearInterval(interval);
  }, [status, fetchStatus]);

  async function reconnect() {
    setPolling(true); setError('');
    await fetch('/api/whatsapp-worker', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reconnect' }) });
    await fetchStatus();
    setPolling(false);
  }

  async function disconnect() {
    setError('');
    await fetch('/api/whatsapp-worker', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'disconnect' }) });
    setStatus('disconnected'); setQr(null);
  }

  function toggleLead(id: string) {
    setSelectedIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }
  function toggleAll() {
    setSelectedIds(selectedIds.size === leads.length ? new Set() : new Set(leads.map(l => l.id!)));
  }

  async function generatePreviews() {
    const targets = leads.filter(l => selectedIds.has(l.id!));
    if (!targets.length) return;
    setGenerating(true); setError(''); setProgress(`Generating messages for ${targets.length} leads…`);
    try {
      const generated: PreviewMessage[] = [];
      for (let i = 0; i < targets.length; i++) {
        const lead = targets[i];
        setProgress(`Generating ${i + 1}/${targets.length} — ${lead.business_name}…`);
        const res = await fetch('/api/generate-whatsapp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lead) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Generation failed');
        generated.push({ leadId: lead.id!, to: lead.whatsapp_number, businessName: lead.business_name, message: data.message });
      }
      setPreviews(generated); setShowPreview(true);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Generation failed'); }
    finally { setGenerating(false); setProgress(''); }
  }

  async function sendPreviews() {
    setSending(true); setSendDone(false); setError(''); setProgress(`Sending ${previews.length} messages via server…`);
    try {
      const res = await fetch('/api/whatsapp-bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: previews }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk send failed');
      setProgress(''); setSendDone(true); setSelectedIds(new Set()); setPreviews([]); setShowPreview(false);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Send failed'); setProgress(''); }
    finally { setSending(false); }
  }

  const statusConfig: Record<ConnectionStatus, { label: string; dot: string; icon: React.ReactNode }> = {
    connected:    { label: 'Connected',    dot: WA_GREEN,    icon: <Wifi size={12} /> },
    qr_ready:     { label: 'Scan QR',      dot: '#facc15',   icon: <QrCode size={12} /> },
    connecting:   { label: 'Connecting',   dot: '#60a5fa',   icon: <RefreshCw size={12} className="animate-spin" /> },
    disconnected: { label: 'Disconnected', dot: '#f87171',   icon: <WifiOff size={12} /> },
    unknown:      { label: 'Checking…',    dot: '#71717a',   icon: <RefreshCw size={12} className="animate-spin" /> },
  };
  const badge = statusConfig[status];

  return (
    <div className="space-y-5 max-w-5xl">

      {/* ── Top status bar ── */}
      <motion.div {...fadeUp} className="admin-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">

          {/* Left: icon + title */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${WA_GREEN}18` }}>
              <MessageCircle size={18} style={{ color: WA_GREEN }} />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-[15px] admin-text leading-none">WhatsApp</h2>
              <p className="text-[11px] admin-muted mt-0.5">Powered by Baileys · Railway worker</p>
            </div>
          </div>

          {/* Right: status badge + actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full border"
              style={{ color: badge.dot, borderColor: `${badge.dot}30`, background: `${badge.dot}12` }}>
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: badge.dot, boxShadow: status === 'connected' ? `0 0 6px ${badge.dot}` : 'none' }} />
              {badge.label}
            </span>

            {status === 'connected' && (
              <button onClick={disconnect}
                className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors font-medium">
                <LogOut size={12} /> Disconnect
              </button>
            )}
            {(status === 'disconnected' || status === 'unknown') && (
              <button onClick={reconnect} disabled={polling}
                className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg admin-surface-2 border admin-border-md admin-text-2 admin-hover transition-colors disabled:opacity-50 font-medium">
                <RefreshCw size={12} className={polling ? 'animate-spin' : ''} /> Reconnect
              </button>
            )}
            <button onClick={fetchStatus}
              className="p-1.5 rounded-lg admin-hover transition-colors admin-muted hover:admin-text" title="Refresh status">
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        {/* QR Code */}
        <AnimatePresence>
          {status === 'qr_ready' && qr && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-5 pt-5 border-t admin-border flex flex-col sm:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qr} alt="WhatsApp QR Code" className="w-48 h-48 rounded-2xl border-4 bg-white p-1.5" style={{ borderColor: `${WA_GREEN}40` }} />
              </div>
              <div className="space-y-2 text-center sm:text-left">
                <p className="font-semibold text-[13px] admin-text">Scan to connect</p>
                <ol className="text-[12px] admin-muted space-y-1 list-decimal list-inside">
                  <li>Open WhatsApp on your phone</li>
                  <li>Go to <strong className="admin-text">Linked Devices</strong></li>
                  <li>Tap <strong className="admin-text">Link a Device</strong></li>
                  <li>Scan the QR code on the left</li>
                </ol>
                <p className="text-[10px] admin-muted opacity-60 pt-1">QR refreshes automatically every 4 seconds.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {status === 'connected' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mt-4 pt-4 border-t admin-border flex items-center gap-2 text-[12px]" style={{ color: WA_GREEN }}>
            <CheckCircle2 size={14} /> WhatsApp is live — bulk messages and inbox are active.
          </motion.div>
        )}

        {statusError && (
          <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-mono break-all">
            <AlertCircle size={13} className="flex-shrink-0 mt-0.5" /> {statusError}
          </div>
        )}

        {(status === 'disconnected' || status === 'unknown') && !qr && !statusError && (
          <p className="mt-4 admin-subtle text-[12px]">
            Worker is not connected. Click <strong className="admin-text-2">Reconnect</strong> to start, then scan the QR code.
          </p>
        )}
      </motion.div>

      {/* ── Tab switcher ── */}
      <motion.div {...fadeUp} transition={{ delay: 0.05 }} className="flex gap-1 p-1 rounded-xl admin-surface-2 border admin-border w-fit">
        {([['send', Zap, 'Bulk Send'], ['inbox', Inbox, 'Inbox']] as const).map(([id, Icon, label]) => (
          <button key={id} onClick={() => setActiveTab(id as 'send' | 'inbox')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold transition-all ${
              activeTab === id
                ? 'admin-text shadow-sm'
                : 'admin-muted hover:admin-text'
            }`}
            style={activeTab === id ? { background: 'var(--admin-surface-3)' } : {}}>
            <Icon size={13} /> {label}
          </button>
        ))}
      </motion.div>

      {/* ── Tab content ── */}
      <AnimatePresence mode="wait">
        {activeTab === 'send' ? (
          <motion.div key="send" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <BulkSendPanel
              leads={leads}
              status={status}
              selectedIds={selectedIds}
              generating={generating}
              sending={sending}
              progress={progress}
              sendDone={sendDone}
              error={error}
              previews={previews}
              showPreview={showPreview}
              onToggleLead={toggleLead}
              onToggleAll={toggleAll}
              onGenerate={generatePreviews}
              onSend={sendPreviews}
              onClosePreview={() => setShowPreview(false)}
              onOpenPreview={() => setShowPreview(true)}
            />
          </motion.div>
        ) : (
          <motion.div key="inbox" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
            className="admin-card overflow-hidden">
            <WhatsAppInbox status={status} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Preview modal ── */}
      <AnimatePresence>
        {showPreview && (
          <ModalPortal>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
              onClick={() => setShowPreview(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className="admin-card w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-5 py-4 border-b admin-border flex-shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${WA_GREEN}18` }}>
                      <Eye size={13} style={{ color: WA_GREEN }} />
                    </div>
                    <div>
                      <p className="font-bold text-[13px] admin-text leading-none">Preview Messages</p>
                      <p className="text-[10px] admin-muted mt-0.5">{previews.length} message{previews.length !== 1 ? 's' : ''} ready to send</p>
                    </div>
                  </div>
                  <button onClick={() => setShowPreview(false)} className="p-1.5 rounded-lg admin-hover transition-colors admin-muted hover:admin-text">
                    <X size={15} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {previews.map((p, i) => (
                    <div key={p.leadId} className="p-4 rounded-xl border admin-border admin-surface-2">
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                          style={{ background: `${WA_GREEN}20`, color: WA_GREEN }}>
                          {p.businessName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold admin-text truncate">{p.businessName}</p>
                          <p className="text-[10px] admin-muted font-mono">{p.to}</p>
                        </div>
                        <span className="text-[10px] admin-muted">{i + 1}/{previews.length}</span>
                      </div>
                      <p className="text-[12px] admin-text leading-relaxed whitespace-pre-wrap">{p.message}</p>
                    </div>
                  ))}
                </div>

                <div className="px-5 py-4 border-t admin-border flex-shrink-0 space-y-3">
                  {error && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[11px]">
                      <AlertCircle size={13} className="flex-shrink-0 mt-0.5" /> {error}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => setShowPreview(false)}
                      className="flex-1 py-2.5 rounded-xl border admin-border-md admin-muted hover:admin-text text-[12px] font-semibold transition-colors admin-hover">
                      Cancel
                    </button>
                    <button onClick={sendPreviews} disabled={sending || status !== 'connected'}
                      className="flex-1 py-2.5 rounded-xl text-black text-[12px] font-bold transition-all disabled:opacity-40 hover:brightness-110 flex items-center justify-center gap-2"
                      style={{ background: WA_GREEN }}>
                      {sending ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                      {sending ? 'Sending…' : `Send ${previews.length} message${previews.length !== 1 ? 's' : ''}`}
                    </button>
                  </div>
                  {status !== 'connected' && (
                    <p className="text-[11px] admin-muted text-center">Connect WhatsApp before sending.</p>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </ModalPortal>
        )}
      </AnimatePresence>
    </div>
  );
}


