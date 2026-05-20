'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wifi, WifiOff, RefreshCw, Send, CheckCircle2,
  AlertCircle, QrCode, MessageCircle, LogOut, Zap, Eye, Edit3, X,
} from 'lucide-react';
import { Lead } from '@/lib/supabase';
import ModalPortal from '@/app/components/ModalPortal';

type ConnectionStatus = 'disconnected' | 'connecting' | 'qr_ready' | 'connected' | 'unknown';

interface PreviewMessage { leadId: string; to: string; businessName: string; message: string; }

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } };

export default function WhatsAppPanel() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>('unknown');
  const [qr, setQr] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [statusError, setStatusError] = useState('');

  // Bulk send state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState('');
  const [sendDone, setSendDone] = useState(false);
  const [error, setError] = useState('');

  // Preview state — messages generated but not yet sent
  const [previews, setPreviews] = useState<PreviewMessage[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // ── Fetch leads ──
  useEffect(() => {
    fetch('/api/leads')
      .then(r => r.json())
      .then(data => setLeads(Array.isArray(data) ? data.filter((l: Lead) => l.whatsapp_number) : []));
  }, []);

  // ── Poll connection status ──
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp-worker');
      const data = await res.json();
      if (data.error) {
        setStatusError(data.error);
        setStatus('disconnected');
        setQr(null);
      } else {
        setStatusError('');
        setStatus(data.status || 'unknown');
        setQr(data.qr || null);
      }
    } catch (e: any) {
      setStatus('disconnected');
      setStatusError(e.message || 'Could not reach worker');
      setQr(null);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Poll every 4s while waiting for QR scan or connecting
  useEffect(() => {
    if (status === 'connected') return;
    const interval = setInterval(fetchStatus, 4000);
    return () => clearInterval(interval);
  }, [status, fetchStatus]);

  // ── Actions ──
  async function reconnect() {
    setPolling(true);
    setError('');
    await fetch('/api/whatsapp-worker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reconnect' }),
    });
    await fetchStatus();
    setPolling(false);
  }

  async function disconnect() {
    setError('');
    await fetch('/api/whatsapp-worker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'disconnect' }),
    });
    setStatus('disconnected');
    setQr(null);
  }

  function toggleLead(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selectedIds.size === leads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(leads.map(l => l.id!)));
    }
  }

  // Phase 1: generate previews for selected leads
  async function generatePreviews() {
    const targets = leads.filter(l => selectedIds.has(l.id!));
    if (targets.length === 0) return;
    setGenerating(true);
    setError('');
    setProgress(`Generating messages for ${targets.length} leads…`);
    try {
      const generated: PreviewMessage[] = [];
      for (let i = 0; i < targets.length; i++) {
        const lead = targets[i];
        setProgress(`Generating ${i + 1}/${targets.length} — ${lead.business_name}…`);
        const res  = await fetch('/api/generate-whatsapp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lead) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Generation failed');
        generated.push({ leadId: lead.id!, to: lead.whatsapp_number, businessName: lead.business_name, message: data.message });
      }
      setPreviews(generated);
      setShowPreview(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setGenerating(false);
      setProgress('');
    }
  }

  // Phase 2: send previewed messages via server-side job
  async function sendPreviews() {
    setSending(true);
    setSendDone(false);
    setError('');
    setProgress(`Sending ${previews.length} messages via server…`);
    try {
      const res  = await fetch('/api/whatsapp-bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: previews }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk send failed');
      setProgress('');
      setSendDone(true);
      setSelectedIds(new Set());
      setPreviews([]);
      setShowPreview(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Send failed');
      setProgress('');
    } finally {
      setSending(false);
    }
  }

  // ── Status badge ──
  const statusConfig: Record<ConnectionStatus, { label: string; color: string; icon: React.ReactNode }> = {
    connected:    { label: 'Connected',    color: 'text-[#25D366] border-[#25D366]/30 bg-[#25D366]/10', icon: <Wifi size={13} /> },
    qr_ready:     { label: 'Scan QR',      color: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10', icon: <QrCode size={13} /> },
    connecting:   { label: 'Connecting…',  color: 'text-blue-400 border-blue-400/30 bg-blue-400/10', icon: <RefreshCw size={13} className="animate-spin" /> },
    disconnected: { label: 'Disconnected', color: 'text-red-400 border-red-400/30 bg-red-400/10', icon: <WifiOff size={13} /> },
    unknown:      { label: 'Checking…',    color: 'text-zinc-400 border-zinc-400/30 bg-zinc-400/10', icon: <RefreshCw size={13} className="animate-spin" /> },
  };
  const badge = statusConfig[status];

  const leadsWithNumber = leads;
  const leadsWithoutNumber = /* shown as info */ 0;

  return (
    <div className="space-y-4 max-w-4xl">

      {/* ── Connection Card ── */}
      <motion.div {...fadeUp} className="admin-card p-5 lg:p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-bold text-[15px] admin-text mb-0.5">WhatsApp Connection</h2>
            <p className="admin-muted text-[12px]">Powered by Baileys worker on Railway</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1.5 rounded-full border ${badge.color}`}>
              {badge.icon} {badge.label}
            </span>
            {status === 'connected' && (
              <button
                onClick={disconnect}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
              >
                <LogOut size={13} /> Disconnect
              </button>
            )}
            {(status === 'disconnected' || status === 'unknown') && (
              <button
                onClick={reconnect}
                disabled={polling}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg admin-surface-2 border admin-border-md admin-text-2 admin-hover transition-colors disabled:opacity-50"
              >
                <RefreshCw size={13} className={polling ? 'animate-spin' : ''} /> Reconnect
              </button>
            )}
          </div>
        </div>

        {/* QR Code */}
        <AnimatePresence>
          {status === 'qr_ready' && qr && (
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-5 flex flex-col items-center gap-3"
            >
              <p className="text-sm admin-muted text-center">
                Open WhatsApp on your dedicated number → <strong className="admin-text">Linked Devices</strong> → <strong className="admin-text">Link a Device</strong> → scan below
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="WhatsApp QR Code" className="w-56 h-56 rounded-2xl border admin-border-md bg-white p-2" />
              <p className="text-xs admin-subtle">QR refreshes automatically. This page polls every 4 seconds.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {status === 'connected' && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mt-4 flex items-center gap-2 text-[#25D366] text-sm"
          >
            <CheckCircle2 size={16} /> WhatsApp is live. You can now send bulk messages.
          </motion.div>
        )}

        {statusError && (
          <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono break-all">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            {statusError}
          </div>
        )}

        {(status === 'disconnected' || status === 'unknown') && !qr && !statusError && (
          <p className="mt-4 admin-subtle text-sm">
            Worker is not connected. Click <strong className="admin-text-2">Reconnect</strong> to start, then scan the QR code.
          </p>
        )}
      </motion.div>

      {/* ── Bulk Send Card ── */}
      <motion.div {...fadeUp} transition={{ delay: 0.05 }} className="admin-card p-5 lg:p-6">
        <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
          <div>
            <h3 className="font-bold text-[15px] admin-text mb-0.5">Bulk WhatsApp Outreach</h3>
            <p className="admin-muted text-[12px]">
              AI generates a personalised message per lead. Sent with a 30–60s delay between each.
            </p>
          </div>
          {leadsWithNumber.length > 0 && (
            <span className="text-xs font-mono admin-muted border admin-border-md px-3 py-1.5 rounded-full">
              {leadsWithNumber.length} leads with WhatsApp number
            </span>
          )}
        </div>

        {leadsWithNumber.length === 0 ? (
          <div className="py-8 text-center border border-dashed admin-border-md rounded-xl">
            <MessageCircle size={28} className="admin-subtle mx-auto mb-2" />
            <p className="admin-muted text-sm">No leads with a WhatsApp number yet.</p>
            <p className="admin-subtle text-xs mt-1">Add WhatsApp numbers in the CRM panel.</p>
          </div>
        ) : (
          <>
            {/* Select all */}
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 text-sm admin-muted cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={selectedIds.size === leadsWithNumber.length}
                  onChange={toggleAll}
                  className="accent-[#25D366] w-4 h-4"
                />
                Select all ({leadsWithNumber.length})
              </label>
              {selectedIds.size > 0 && (
                <span className="text-xs text-[#25D366] font-mono">{selectedIds.size} selected</span>
              )}
            </div>

            {/* Lead list */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1 mb-4">
              {leadsWithNumber.map(lead => (
                <label
                  key={lead.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedIds.has(lead.id!)
                      ? 'bg-[#25D366]/5 border-[#25D366]/20'
                      : 'admin-hover admin-border hover:admin-border-md'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(lead.id!)}
                    onChange={() => toggleLead(lead.id!)}
                    className="accent-[#25D366] w-4 h-4 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium admin-text truncate">{lead.business_name}</div>
                    <div className="text-xs admin-muted truncate">{lead.whatsapp_number} · {lead.industry || 'Unknown industry'}</div>
                  </div>
                  {lead.outreach_status === 'Sent' && (
                    <span className="text-[10px] font-mono text-[#25D366] border border-[#25D366]/20 px-2 py-0.5 rounded-full flex-shrink-0">Sent</span>
                  )}
                </label>
              ))}
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-3"
                >
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Progress */}
            <AnimatePresence>
              {progress && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-blue-400 text-sm mb-3"
                >
                  <RefreshCw size={14} className="animate-spin flex-shrink-0" />
                  {progress}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success */}
            <AnimatePresence>
              {sendDone && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-[#25D366] text-sm mb-3"
                >
                  <CheckCircle2 size={16} /> Bulk send started — messages are being delivered with delays.
                </motion.div>
              )}
            </AnimatePresence>

            {/* Generate previews button */}
            <button
              onClick={generatePreviews}
              disabled={selectedIds.size === 0 || generating || sending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border admin-border-md admin-muted hover:admin-text text-[13px] font-bold transition-colors disabled:opacity-40"
            >
              {generating ? <RefreshCw size={15} className="animate-spin" /> : <Eye size={15} />}
              {generating ? progress || 'Generating…' : `Preview ${selectedIds.size || 0} message${selectedIds.size !== 1 ? 's' : ''}`}
            </button>

            {status !== 'connected' && (
              <p className="text-xs admin-subtle mt-2">Connect WhatsApp above before sending.</p>
            )}
          </>
        )}
      </motion.div>

      {/* Preview modal */}
      <AnimatePresence>
        {showPreview && previews.length > 0 && (
          <ModalPortal>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={e => { if (e.target === e.currentTarget) setShowPreview(false); }}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="admin-surface border admin-border-md rounded-t-3xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b admin-border flex-shrink-0">
                <div>
                  <h2 className="font-bold text-[15px] admin-text">Preview Messages</h2>
                  <p className="text-[11px] admin-muted mt-0.5">{previews.length} message{previews.length !== 1 ? 's' : ''} ready — review before sending</p>
                </div>
                <button onClick={() => setShowPreview(false)} className="admin-muted hover:admin-text p-1.5 rounded-xl admin-hover border admin-border transition-colors">
                  <X size={15} />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 p-5 space-y-4">
                {previews.map((p, i) => (
                  <div key={p.leadId} className="admin-card p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[13px] admin-text">{p.businessName}</span>
                      <span className="text-[10px] font-mono admin-muted">{p.to}</span>
                    </div>
                    <textarea
                      rows={4}
                      value={p.message}
                      onChange={e => setPreviews(prev => prev.map((m, j) => j === i ? { ...m, message: e.target.value } : m))}
                      className="w-full admin-input border rounded-xl px-3 py-2.5 text-[12px] admin-text outline-none resize-none transition-colors"
                    />
                  </div>
                ))}
              </div>

              <div className="flex-shrink-0 px-5 py-4 border-t admin-border space-y-3">
                {error && <p className="text-red-400 text-[12px] text-center px-3 py-2 rounded-xl bg-red-500/8 border border-red-500/20">{error}</p>}
                {progress && (
                  <div className="flex items-center gap-2 text-blue-400 text-[12px]">
                    <RefreshCw size={13} className="animate-spin" /> {progress}
                  </div>
                )}
                {sendDone && (
                  <div className="flex items-center gap-2 text-[#25D366] text-[12px]">
                    <CheckCircle2 size={14} /> All messages sent successfully.
                  </div>
                )}
                <div className="flex gap-3">
                  <button onClick={() => setShowPreview(false)} className="flex-1 py-2.5 rounded-xl text-[13px] admin-muted hover:admin-text border admin-border admin-hover transition-colors">Cancel</button>
                  <button
                    onClick={sendPreviews}
                    disabled={sending || status !== 'connected'}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#25D366] text-black font-bold text-[13px] hover:bg-[#20c05c] transition-colors disabled:opacity-40"
                  >
                    {sending ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
                    {sending ? 'Sending…' : `Send ${previews.length} message${previews.length !== 1 ? 's' : ''}`}
                  </button>
                </div>
                {status !== 'connected' && <p className="text-xs admin-subtle text-center">Connect WhatsApp before sending.</p>}
              </div>
            </motion.div>
          </motion.div>
          </ModalPortal>
        )}
      </AnimatePresence>
    </div>
  );
}
