'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Send, Copy, CheckCircle2, RefreshCw, ChevronDown, Mail, AlertCircle } from 'lucide-react';
import { supabase, Lead } from '@/lib/supabase';

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } };

export default function EmailGeneratorPanel() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [sendStatus, setSendStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    supabase.from('leads').select('*').order('created_at', { ascending: false }).then(({ data }) => setLeads(data || []));
  }, []);

  useEffect(() => {
    const lead = leads.find(l => l.id === selectedId) || null;
    setSelectedLead(lead);
    setSubject('');
    setBody('');
    setError('');
    setSendStatus('idle');
  }, [selectedId, leads]);

  async function generate() {
    if (!selectedLead) return;
    setGenerating(true);
    setError('');
    setSendStatus('idle');
    try {
      const res = await fetch('/api/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedLead),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setSubject(data.subject);
      setBody(data.body);
      await supabase.from('leads').update({ generated_subject: data.subject, generated_email: data.body }).eq('id', selectedLead.id!);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  }

  async function sendEmail() {
    if (!selectedLead || !subject || !body) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: selectedLead.contact_email, subject, body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Send failed');
      await supabase.from('leads').update({
        email_sent: true,
        outreach_status: 'Sent',
        last_contacted: new Date().toISOString().split('T')[0],
      }).eq('id', selectedLead.id!);
      setSendStatus('success');
    } catch (e: any) {
      setError(e.message);
      setSendStatus('error');
    } finally {
      setSending(false);
    }
  }

  function copyEmail() {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const inp = 'w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#00D67D]/50 transition-colors placeholder:text-slate-700';

  return (
    <div className="space-y-4 max-w-3xl mx-auto lg:mx-0">

      {/* Lead selector card */}
      <motion.div {...fadeUp} className="p-5 lg:p-6 rounded-2xl bg-[#0A0A0A] border border-white/5">
        <h2 className="font-bold mb-0.5">AI Outreach Generator</h2>
        <p className="text-slate-500 text-sm mb-5">Select a lead, generate a personalised email, then send it directly.</p>

        <div className="mb-5">
          <label className="block text-[10px] text-slate-500 mb-2 font-mono uppercase tracking-wider">Select Lead</label>
          <div className="relative">
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              className={`${inp} appearance-none pr-10 cursor-pointer`}
            >
              <option value="">— Choose a lead —</option>
              {leads.map(l => (
                <option key={l.id} value={l.id}>{l.business_name} ({l.contact_email})</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
        </div>

        {/* Lead summary */}
        <AnimatePresence>
          {selectedLead && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-5 p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-3"
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {[
                  { label: 'Industry', value: selectedLead.industry || '—' },
                  { label: 'Score', value: selectedLead.website_quality_score ? `${selectedLead.website_quality_score}/10` : '—' },
                  { label: 'SEO', value: selectedLead.seo_quality || '—' },
                  { label: 'Mobile', value: selectedLead.mobile_responsiveness || '—' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="text-slate-600 font-mono uppercase tracking-wider text-[10px] mb-0.5">{label}</div>
                    <div className="text-white font-medium">{value}</div>
                  </div>
                ))}
              </div>
              {selectedLead.weak_points && (
                <div className="text-xs">
                  <div className="text-slate-600 font-mono uppercase tracking-wider text-[10px] mb-0.5">Weak Points</div>
                  <div className="text-slate-300 leading-relaxed">{selectedLead.weak_points}</div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={generate}
          disabled={!selectedLead || generating}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-[#00D67D] text-black font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {generating ? <RefreshCw size={15} className="animate-spin" /> : <Zap size={15} />}
          {generating ? 'Generating...' : 'Generate with AI'}
        </button>
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
          >
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generated email */}
      <AnimatePresence>
        {(subject || body) && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="p-5 lg:p-6 rounded-2xl bg-[#0A0A0A] border border-white/5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm">Generated Email</h3>
              <button
                onClick={copyEmail}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                {copied ? <CheckCircle2 size={13} className="text-[#00D67D]" /> : <Copy size={13} />}
                {copied ? 'Copied!' : 'Copy all'}
              </button>
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 mb-1.5 font-mono uppercase tracking-wider">Subject Line</label>
              <input value={subject} onChange={e => setSubject(e.target.value)} className={inp} />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 mb-1.5 font-mono uppercase tracking-wider">Email Body</label>
              <textarea
                rows={10}
                value={body}
                onChange={e => setBody(e.target.value)}
                className={`${inp} resize-none leading-relaxed`}
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                onClick={sendEmail}
                disabled={sending || !selectedLead?.contact_email}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-[#00D67D] transition-colors disabled:opacity-40"
              >
                {sending ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
                {sending ? 'Sending...' : `Send to ${selectedLead?.contact_email || '...'}`}
              </button>
              <button
                onClick={generate}
                disabled={generating}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-40"
              >
                <RefreshCw size={14} /> Regenerate
              </button>
            </div>

            <AnimatePresence>
              {sendStatus === 'success' && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-[#00D67D] text-sm"
                >
                  <CheckCircle2 size={16} /> Email sent — lead status updated to Sent.
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!selectedLead && !generating && (
        <motion.div {...fadeUp} className="p-10 rounded-2xl border border-dashed border-white/10 text-center">
          <Mail size={32} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Select a lead above to generate a personalised outreach email.</p>
          <p className="text-slate-600 text-xs mt-1">The AI will analyse their website data and craft a tailored message.</p>
        </motion.div>
      )}
    </div>
  );
}
