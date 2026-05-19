'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, Shield } from 'lucide-react';
import AdminDashboard from './AdminDashboard';

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Probe a protected API endpoint to check whether the session cookie is
  // still valid. This replaces the old sessionStorage flag — the cookie is
  // the real auth token now.
  useEffect(() => {
    fetch('/api/leads', { method: 'HEAD' })
      .then(r => { if (r.ok || r.status !== 401) setAuthed(true); })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setAuthed(true);
      } else {
        const data = await res.json();
        setError(data.error || 'Incorrect password.');
        setPassword('');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) return null;
  async function handleLogout() {
    await fetch('/api/admin-logout', { method: 'POST' });
    setAuthed(false);
  }

  if (authed) return <AdminDashboard onLogout={handleLogout} />;

  return (
    <div className="min-h-screen bg-[#020202] flex items-center justify-center px-6">
      {/* Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00D67D]/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-900/10 blur-[150px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00D67D] to-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-[#00D67D]/20">
            <Shield size={26} className="text-black" />
          </div>
          <h1 className="text-2xl font-bold text-white">Spacze Command Centre</h1>
          <p className="text-slate-500 text-sm mt-1">Restricted access</p>
        </div>

        <form onSubmit={handleLogin} className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 space-y-5">
          <div>
            <label className="block text-xs text-slate-500 font-mono uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
              <input
                type={show ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter admin password"
                autoFocus
                className="w-full bg-[#050505] border border-white/10 rounded-xl pl-9 pr-10 py-3 text-white text-sm outline-none focus:border-[#00D67D]/50 transition-colors placeholder:text-slate-700"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400"
              >
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-red-400 text-xs mt-2"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-[#00D67D] transition-colors duration-200 disabled:opacity-60"
          >
            {submitting ? 'Verifying...' : 'Access Dashboard'}
          </button>
        </form>

        <p className="text-center text-slate-700 text-xs mt-6">
          This page is not publicly linked. Spacze Command Centre — internal use only.
        </p>
      </motion.div>
    </div>
  );
}
