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
      // Save generated email to Supabase
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
      // Update lead status in Supabase
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
    <div className="space-y-6 max-w-4xl">
      <motion.div {...fadeUp} className="p-6 rounded-2xl bg-[#0A0A0A] border border-white/5">
        <h2 className="font-bold mb-1">AI Outreach Generator</h2>
        <p className="text-slate-500 text-sm mb-6">Select a lead, generate a personalized email, then send it directly.</p>

        {/* Lead selector */}
        <div className="mb-6">
          <label className="block text-xs text-slate-500 mb-2 font-mono uppercase tracking-wider">Select Lead</label>
          <div className="relative">
            <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
              className={`${inp} appearance-none pr-10 cursor-pointer`}>
              <option value="">— Choose a lead —</option>
              {leads.map(l => (
                <option key={l.id} value={l.id}>{l.business_name} ({l.contact_email})</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
        </div>

        {/* Lead summary card */}
        <AnimatePresence>
          {selectedLead && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-6 p-4 rounded-xl bg-white/[0.03] border border-white/5 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              {[
                { label: 'Industry', value: selectedLead.industry || '—' },
                { label: 'Website Score', value: selectedLead.website_quality_score ? `${selectedLead.website_quality_score}/10` : '—' },
                { label: 'SEO', value: selectedLead.seo_quality || '—' },
                { label: 'Mobile', value: selectedLead.mobile_responsiveness || '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="text-slate-600 font-mono uppercase tracking-wider mb-0.5">{label}</div>
                  <div className="text-white font-medium">{value}</div>
                </div>
              ))}
              {selectedLead.weak_points && (
                <div className="col-span-2 md:col-span-4">
                  <div className="text-slate-600 font-mono uppercase tracking-wider mb-0.5">Weak Points</div>
                  <div className="text-slate-300">{selectedLead.weak_points}</div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generate button */}
        <button onClick={generate} disabled={!selectedLead || generating}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-[#00D67D] text-black font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-40">
          {generating ? <RefreshCw size={15} className="animate-spin" /> : <Zap size={15} />}
          {generating ? 'Generating...' : 'Generate Email with AI'}
        </button>
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle size={16} /> {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generated email */}
      <AnimatePresence>
        {(subject || body) && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="p-6 rounded-2xl bg-[#0A0A0A] border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm">Generated Email</h3>
              <button onClick={copyEmail}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                {copied ? <CheckCircle2 size={13} className="text-[#00D67D]" /> : <Copy size={13} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs text-slate-500 mb-1.5 font-mono uppercase tracking-wider">Subject Line</label>
              <input value={subject} onChange={e => setSubject(e.target.value)} className={inp} />
            </div>

            {/* Body */}
            <div>
              <label className="block text-xs text-slate-500 mb-1.5 font-mono uppercase tracking-wider">Email Body</label>
              <textarea rows={12} value={body} onChange={e => setBody(e.target.value)}
                className={`${inp} resize-none leading-relaxed`} />
            </div>

            {/* Send */}
            <div className="flex items-center gap-3 pt-2">
              <button onClick={sendEmail} disabled={sending || !selectedLead?.contact_email}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-[#00D67D] transition-colors disabled:opacity-40">
                {sending ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
                {sending ? 'Sending...' : `Send to ${selectedLead?.contact_email || '...'}`}
              </button>

              <button onClick={generate} disabled={generating}
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-40">
                <RefreshCw size={14} /> Regenerate
              </button>
            </div>

            {/* Send status */}
            <AnimatePresence>
              {sendStatus === 'success' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-[#00D67D] text-sm">
                  <CheckCircle2 size={16} /> Email sent successfully! Lead status updated to Sent.
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions when no lead selected */}
      {!selectedLead && !generating && (
        <motion.div {...fadeUp} className="p-8 rounded-2xl border border-dashed border-white/10 text-center">
          <Mail size={32} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Select a lead above to generate a personalized outreach email.</p>
          <p className="text-slate-600 text-xs mt-1">The AI will analyze their website data and craft a tailored message.</p>
        </motion.div>
      )}
    </div>
  );
}
