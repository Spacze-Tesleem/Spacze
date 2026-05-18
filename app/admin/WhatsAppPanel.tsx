'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wifi, WifiOff, RefreshCw, Send, CheckCircle2,
  AlertCircle, QrCode, MessageCircle, LogOut, Zap,
} from 'lucide-react';
import { Lead } from '@/lib/supabase';

type ConnectionStatus = 'disconnected' | 'connecting' | 'qr_ready' | 'connected' | 'unknown';

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } };

export default function WhatsAppPanel() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>('unknown');
  const [qr, setQr] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  // Bulk send state
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState('');
  const [sendDone, setSendDone] = useState(false);
  const [error, setError] = useState('');

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
      setStatus(data.status || 'unknown');
      setQr(data.qr || null);
    } catch {
      setStatus('disconnected');
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

  async function sendBulk() {
    const targets = leads.filter(l => selectedIds.has(l.id!));
    if (targets.length === 0) return;

    setSending(true);
    setSendDone(false);
    setError('');
    setProgress(`Generating messages for ${targets.length} leads...`);

    try {
      // Generate AI messages for each lead
      const messages: { to: string; message: string }[] = [];
      for (let i = 0; i < targets.length; i++) {
        const lead = targets[i];
        setProgress(`Generating message ${i + 1}/${targets.length} — ${lead.business_name}...`);
        const res = await fetch('/api/generate-whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lead),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Generation failed');
        messages.push({ to: lead.whatsapp_number, message: data.message });
      }

      setProgress(`Sending ${messages.length} messages with 30–60s delay between each...`);

      // Send bulk via worker (30–60s random delay between messages)
      const res = await fetch('/api/whatsapp-worker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send-bulk', messages, delayMin: 30000, delayMax: 60000 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk send failed');

      setProgress('');
      setSendDone(true);
      setSelectedIds(new Set());
    } catch (e: any) {
      setError(e.message);
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
    unknown:      { label: 'Checking…',    color: 'text-slate-400 border-slate-400/30 bg-slate-400/10', icon: <RefreshCw size={13} className="animate-spin" /> },
  };
  const badge = statusConfig[status];

  const leadsWithNumber = leads;
  const leadsWithoutNumber = /* shown as info */ 0;

  return (
    <div className="space-y-4 max-w-7xl mx-auto lg:mx-0">

      {/* ── Connection Card ── */}
      <motion.div {...fadeUp} className="p-5 lg:p-6 rounded-2xl bg-[#0A0A0A] border border-white/5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-bold mb-0.5">WhatsApp Connection</h2>
            <p className="text-slate-500 text-sm">Powered by Baileys worker on Railway</p>
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
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors disabled:opacity-50"
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
              <p className="text-sm text-slate-400 text-center">
                Open WhatsApp on your dedicated number → <strong className="text-white">Linked Devices</strong> → <strong className="text-white">Link a Device</strong> → scan below
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="WhatsApp QR Code" className="w-56 h-56 rounded-2xl border border-white/10 bg-white p-2" />
              <p className="text-xs text-slate-600">QR refreshes automatically. This page polls every 4 seconds.</p>
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

        {(status === 'disconnected' || status === 'unknown') && !qr && (
          <p className="mt-4 text-slate-600 text-sm">
            Worker is not connected. Click <strong className="text-slate-400">Reconnect</strong> to start, then scan the QR code.
          </p>
        )}
      </motion.div>

      {/* ── Bulk Send Card ── */}
      <motion.div {...fadeUp} transition={{ delay: 0.05 }} className="p-5 lg:p-6 rounded-2xl bg-[#0A0A0A] border border-white/5">
        <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
          <div>
            <h3 className="font-bold mb-0.5">Bulk WhatsApp Outreach</h3>
            <p className="text-slate-500 text-sm">
              AI generates a personalised message per lead. Sent with a 30–60s delay between each.
            </p>
          </div>
          {leadsWithNumber.length > 0 && (
            <span className="text-xs font-mono text-slate-500 border border-white/10 px-3 py-1.5 rounded-full">
              {leadsWithNumber.length} leads with WhatsApp number
            </span>
          )}
        </div>

        {leadsWithNumber.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-white/10 rounded-xl">
            <MessageCircle size={28} className="text-slate-700 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No leads with a WhatsApp number yet.</p>
            <p className="text-slate-600 text-xs mt-1">Add WhatsApp numbers in the CRM panel.</p>
          </div>
        ) : (
          <>
            {/* Select all */}
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer select-none">
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
                      : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(lead.id!)}
                    onChange={() => toggleLead(lead.id!)}
                    className="accent-[#25D366] w-4 h-4 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{lead.business_name}</div>
                    <div className="text-xs text-slate-500 truncate">{lead.whatsapp_number} · {lead.industry || 'Unknown industry'}</div>
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

            {/* Send button */}
            <button
              onClick={sendBulk}
              disabled={selectedIds.size === 0 || sending || status !== 'connected'}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#25D366] text-black font-bold text-sm hover:bg-[#20c05c] transition-colors disabled:opacity-40"
            >
              {sending ? <RefreshCw size={15} className="animate-spin" /> : <Zap size={15} />}
              {sending ? 'Processing...' : `Send to ${selectedIds.size || 0} lead${selectedIds.size !== 1 ? 's' : ''}`}
            </button>

            {status !== 'connected' && (
              <p className="text-xs text-slate-600 mt-2">Connect WhatsApp above before sending.</p>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
