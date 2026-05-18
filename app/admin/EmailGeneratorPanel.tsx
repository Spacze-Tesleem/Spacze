'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Send, Copy, CheckCircle2, RefreshCw,
  ChevronDown, Mail, AlertCircle, ChevronRight,
  MessageCircle,
} from 'lucide-react';
import { Lead } from '@/lib/supabase';

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } };

// ─────────────────────────────────────────────
// Sequence steps metadata
// ─────────────────────────────────────────────
const STEPS = [
  {
    step: 1,
    label: 'Initial Email',
    tag: 'Day 1',
    desc: 'First touch — personalised observation + soft CTA',
    color: '#00D67D',
    tagBg: 'bg-[#00D67D]/10 text-[#00D67D] border-[#00D67D]/20',
  },
  {
    step: 2,
    label: 'Follow-up #1',
    tag: 'Day 3–4',
    desc: 'New insight — no "just checking in"',
    color: '#3b82f6',
    tagBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  {
    step: 3,
    label: 'Follow-up #2',
    tag: 'Day 7',
    desc: 'Results angle + soft availability mention',
    color: '#a855f7',
    tagBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  },
  {
    step: 4,
    label: 'Breakup Email',
    tag: 'Day 14',
    desc: 'Gracious close — leaves door open forever',
    color: '#f59e0b',
    tagBg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  },
];

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
export default function EmailGeneratorPanel() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeTab, setActiveTab] = useState<'email' | 'whatsapp'>('email');

  // Email state
  const [activeStep, setActiveStep] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [sendStatus, setSendStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // WhatsApp state
  const [waGenerating, setWaGenerating] = useState(false);
  const [waSending, setWaSending] = useState(false);
  const [waMessage, setWaMessage] = useState('');
  const [waCopied, setWaCopied] = useState(false);
  const [waError, setWaError] = useState('');
  const [waSendStatus, setWaSendStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    fetch('/api/leads').then(r => r.json()).then(data => setLeads(Array.isArray(data) ? data : []));
  }, []);

  useEffect(() => {
    const lead = leads.find(l => l.id === selectedId) || null;
    setSelectedLead(lead);
    setSubject('');
    setBody('');
    setError('');
    setSendStatus('idle');
    setWaMessage('');
    setWaError('');
    setWaSendStatus('idle');
  }, [selectedId, leads]);

  // Clear output when step changes
  useEffect(() => {
    setSubject('');
    setBody('');
    setError('');
    setSendStatus('idle');
  }, [activeStep]);

  async function generate() {
    if (!selectedLead) return;
    setGenerating(true);
    setError('');
    setSendStatus('idle');
    try {
      const res = await fetch('/api/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...selectedLead, sequenceStep: activeStep }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setSubject(data.subject);
      setBody(data.body);

      // Persist to lead record (step 1 only — initial email)
      if (activeStep === 1) {
        await fetch(`/api/leads?id=${selectedLead.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ generated_subject: data.subject, generated_email: data.body }),
        });
      }
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

      // Update lead status
      const updates: Record<string, any> = {
        email_sent: true,
        last_contacted: new Date().toISOString().split('T')[0],
      };
      if (activeStep === 1) updates.outreach_status = 'Sent';

      await fetch(`/api/leads?id=${selectedLead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

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

  async function generateWhatsApp() {
    if (!selectedLead) return;
    setWaGenerating(true);
    setWaError('');
    setWaSendStatus('idle');
    try {
      const res = await fetch('/api/generate-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedLead),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setWaMessage(data.message);
    } catch (e: any) {
      setWaError(e.message);
    } finally {
      setWaGenerating(false);
    }
  }

  async function sendWhatsApp() {
    if (!selectedLead?.whatsapp_number || !waMessage) return;
    setWaSending(true);
    setWaError('');
    try {
      const res = await fetch('/api/send-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: selectedLead.whatsapp_number, message: waMessage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Send failed');

      await fetch(`/api/leads?id=${selectedLead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ last_contacted: new Date().toISOString().split('T')[0] }),
      });

      setWaSendStatus('success');
    } catch (e: any) {
      setWaError(e.message);
      setWaSendStatus('error');
    } finally {
      setWaSending(false);
    }
  }

  function copyWhatsApp() {
    navigator.clipboard.writeText(waMessage);
    setWaCopied(true);
    setTimeout(() => setWaCopied(false), 2000);
  }

  const inp = 'w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#00D67D]/50 transition-colors placeholder:text-slate-700';
  const currentStepMeta = STEPS.find(s => s.step === activeStep)!;

  return (
    <div className="space-y-4 max-w-7xl mx-auto lg:mx-0">

      {/* ── Lead selector ── */}
      <motion.div {...fadeUp} className="p-5 lg:p-6 rounded-2xl bg-[#0A0A0A] border border-white/5">
        <h2 className="font-bold mb-0.5">AI Outreach Sequence</h2>
        <p className="text-slate-500 text-sm mb-5">
          Select a lead, choose a sequence step, then generate and send.
        </p>

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

        {/* Lead preview */}
        <AnimatePresence>
          {selectedLead && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
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
      </motion.div>

      {/* ── Channel Tabs ── */}
      <motion.div {...fadeUp} transition={{ delay: 0.03 }} className="flex gap-2">
        {[
          { id: 'email' as const, label: 'Email Sequence', icon: <Mail size={14} /> },
          { id: 'whatsapp' as const, label: 'WhatsApp', icon: <MessageCircle size={14} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 ${
              activeTab === tab.id
                ? tab.id === 'whatsapp'
                  ? 'bg-[#25D366]/10 border-[#25D366]/30 text-[#25D366]'
                  : 'bg-[#00D67D]/10 border-[#00D67D]/30 text-[#00D67D]'
                : 'bg-white/[0.02] border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </motion.div>

      {activeTab === 'whatsapp' && (
        <>
          {/* ── WhatsApp Generator ── */}
          <motion.div {...fadeUp} transition={{ delay: 0.05 }} className="p-5 lg:p-6 rounded-2xl bg-[#0A0A0A] border border-white/5 space-y-4">
            <div>
              <h3 className="font-bold text-sm mb-0.5">WhatsApp Message</h3>
              <p className="text-slate-500 text-xs">
                Short, conversational message optimised for WhatsApp. 60–90 words.
              </p>
            </div>

            {selectedLead && !selectedLead.whatsapp_number && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                No WhatsApp number saved for this lead. Add one in the CRM panel first.
              </div>
            )}

            <button
              onClick={generateWhatsApp}
              disabled={!selectedLead || waGenerating}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-[#25D366] text-black hover:bg-[#20c05c] transition-colors disabled:opacity-40"
            >
              {waGenerating ? <RefreshCw size={15} className="animate-spin" /> : <Zap size={15} />}
              {waGenerating ? 'Generating...' : 'Generate Message'}
            </button>

            <AnimatePresence>
              {waError && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                >
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{waError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {waMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] text-slate-500 font-mono uppercase tracking-wider">Message</label>
                    <button
                      onClick={copyWhatsApp}
                      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      {waCopied ? <CheckCircle2 size={13} className="text-[#25D366]" /> : <Copy size={13} />}
                      {waCopied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <textarea
                    rows={5}
                    value={waMessage}
                    onChange={e => setWaMessage(e.target.value)}
                    className={`${inp} resize-none leading-relaxed`}
                  />

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={sendWhatsApp}
                      disabled={waSending || !selectedLead?.whatsapp_number}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#25D366] text-black font-bold text-sm hover:bg-[#20c05c] transition-colors disabled:opacity-40"
                    >
                      {waSending ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
                      {waSending ? 'Sending...' : selectedLead?.whatsapp_number ? `Send to ${selectedLead.whatsapp_number}` : 'No number saved'}
                    </button>
                    <button
                      onClick={generateWhatsApp}
                      disabled={waGenerating}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-40"
                    >
                      <RefreshCw size={14} /> Regenerate
                    </button>
                  </div>

                  <AnimatePresence>
                    {waSendStatus === 'success' && (
                      <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-2 text-[#25D366] text-sm"
                      >
                        <CheckCircle2 size={16} /> WhatsApp message sent successfully.
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            {!selectedLead && (
              <div className="py-6 text-center">
                <MessageCircle size={28} className="text-slate-700 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">Select a lead above to generate a WhatsApp message.</p>
              </div>
            )}
          </motion.div>
        </>
      )}

      {activeTab === 'email' && (
      <>
      {/* ── Sequence Step Selector ── */}
      <motion.div {...fadeUp} transition={{ delay: 0.05 }} className="p-5 lg:p-6 rounded-2xl bg-[#0A0A0A] border border-white/5">
        <label className="block text-[10px] text-slate-500 mb-3 font-mono uppercase tracking-wider">
          Sequence Step
        </label>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {STEPS.map(s => (
            <button
              key={s.step}
              onClick={() => setActiveStep(s.step)}
              className={`relative flex flex-col gap-1.5 p-3 rounded-xl border text-left transition-all duration-200 ${
                activeStep === s.step
                  ? 'bg-white/[0.05] border-white/20'
                  : 'bg-white/[0.02] border-white/5 hover:border-white/10'
              }`}
            >
              {/* Active indicator */}
              {activeStep === s.step && (
                <motion.div
                  layoutId="step-indicator"
                  className="absolute inset-0 rounded-xl"
                  style={{ border: `1px solid ${s.color}40`, backgroundColor: `${s.color}08` }}
                />
              )}
              <div className="relative z-10">
                <span
                  className={`inline-block text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${s.tagBg} mb-1`}
                >
                  {s.tag}
                </span>
                <div className="text-xs font-bold text-white leading-tight">{s.label}</div>
                <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{s.desc}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Step timeline connector */}
        <div className="flex items-center gap-1 mt-4 px-1">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.step}>
              <div
                className="w-2 h-2 rounded-full flex-shrink-0 transition-all duration-200"
                style={{ backgroundColor: activeStep >= s.step ? s.color : '#ffffff15' }}
              />
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-px transition-all duration-300"
                  style={{ backgroundColor: activeStep > s.step ? STEPS[i].color + '60' : '#ffffff10' }}
                />
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="flex justify-between mt-1 text-[9px] font-mono text-slate-600">
          <span>Initial</span>
          <span>Breakup</span>
        </div>

        {/* Generate button */}
        <button
          onClick={generate}
          disabled={!selectedLead || generating}
          className="mt-5 w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-opacity disabled:opacity-40"
          style={{
            background: `linear-gradient(135deg, ${currentStepMeta.color}cc, ${currentStepMeta.color})`,
            color: activeStep === 1 ? '#000' : '#fff',
          }}
        >
          {generating ? <RefreshCw size={15} className="animate-spin" /> : <Zap size={15} />}
          {generating ? 'Generating...' : `Generate ${currentStepMeta.label}`}
        </button>
      </motion.div>

      {/* ── Error ── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
          >
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Generated email ── */}
      <AnimatePresence>
        {(subject || body) && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-5 lg:p-6 rounded-2xl bg-[#0A0A0A] border border-white/5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm">Generated Email</h3>
                <span
                  className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${currentStepMeta.tagBg}`}
                >
                  {currentStepMeta.label}
                </span>
              </div>
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

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                onClick={sendEmail}
                disabled={sending || !selectedLead?.contact_email}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-[#00D67D] transition-colors disabled:opacity-40"
              >
                {sending ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
                {sending ? 'Sending...' : `Send to ${selectedLead?.contact_email || '...'}`}
              </button>

              {/* Next step hint */}
              {activeStep < 4 && (
                <button
                  onClick={() => setActiveStep(s => s + 1)}
                  className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-sm text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Next Step <ChevronRight size={14} />
                </button>
              )}

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
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-[#00D67D] text-sm"
                >
                  <CheckCircle2 size={16} />
                  {activeStep === 1
                    ? 'Email sent — lead status updated to Sent.'
                    : `${currentStepMeta.label} sent successfully.`}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Empty state ── */}
      {!selectedLead && !generating && (
        <motion.div {...fadeUp} className="p-10 rounded-2xl border border-dashed border-white/10 text-center">
          <Mail size={32} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Select a lead above to start generating your outreach sequence.</p>
          <p className="text-slate-600 text-xs mt-1">
            4-step sequence: Initial → Follow-up #1 → Follow-up #2 → Breakup Email
          </p>
        </motion.div>
      )}
      </>
      )}
    </div>
  );
}