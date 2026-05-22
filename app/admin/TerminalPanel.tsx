'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Terminal, Key, Eye, EyeOff, CheckCircle2, AlertCircle,
  Save, RefreshCw, Zap, Mail, MessageCircle, Database,
  Globe, Shield, ChevronDown, ChevronRight, Linkedin, Twitter,
  Facebook, Search, Trash2,
} from 'lucide-react';

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } };

// ── Types ─────────────────────────────────────

interface ApiField {
  key: string;
  label: string;
  placeholder: string;
  hint: string;
  link?: string;
  linkLabel?: string;
}

interface ApiGroup {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  fields: ApiField[];
}

// ── Config groups ─────────────────────────────

const API_GROUPS: ApiGroup[] = [
  {
    id: 'ai',
    label: 'AI Providers',
    icon: <Zap size={15} />,
    color: 'text-[#00D67D]',
    description: 'At least one key required. The system falls back through OpenAI → Gemini → Groq.',
    fields: [
      {
        key: 'OPENAI_API_KEY',
        label: 'OpenAI API Key',
        placeholder: 'sk-...',
        hint: 'Used for gpt-4o-mini. Primary provider.',
        link: 'https://platform.openai.com/api-keys',
        linkLabel: 'Get key →',
      },
      {
        key: 'GEMINI_API_KEY',
        label: 'Google Gemini API Key',
        placeholder: 'AIza...',
        hint: 'Used for gemini-2.0-flash. Fallback #1.',
        link: 'https://aistudio.google.com/app/apikey',
        linkLabel: 'Get key →',
      },
      {
        key: 'GROQ_API_KEY',
        label: 'Groq API Key',
        placeholder: 'gsk_...',
        hint: 'Used for llama-3.3-70b. Fallback #2.',
        link: 'https://console.groq.com/keys',
        linkLabel: 'Get key →',
      },
    ],
  },
  {
    id: 'email',
    label: 'Email (Gmail)',
    icon: <Mail size={15} />,
    color: 'text-blue-400',
    description: 'Gmail account used to send outreach emails via Nodemailer.',
    fields: [
      {
        key: 'EMAIL_FROM',
        label: 'Gmail Address',
        placeholder: 'you@gmail.com',
        hint: 'The Gmail account emails are sent from.',
      },
      {
        key: 'EMAIL_PASSWORD',
        label: 'Gmail App Password',
        placeholder: 'xxxx xxxx xxxx xxxx',
        hint: 'Use a Gmail App Password, not your account password.',
        link: 'https://myaccount.google.com/apppasswords',
        linkLabel: 'Create app password →',
      },
    ],
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp Worker',
    icon: <MessageCircle size={15} />,
    color: 'text-[#25D366]',
    description: 'Baileys-based worker deployed on Railway. Proxied through /api/whatsapp-worker.',
    fields: [
      {
        key: 'WHATSAPP_WORKER_URL',
        label: 'Worker URL',
        placeholder: 'https://your-worker.railway.app',
        hint: 'Base URL of the deployed Baileys worker.',
      },
      {
        key: 'WHATSAPP_WORKER_SECRET',
        label: 'Worker Secret',
        placeholder: 'your-secret-token',
        hint: 'Shared secret sent as x-worker-secret header.',
      },
    ],
  },
  {
    id: 'supabase',
    label: 'Supabase',
    icon: <Database size={15} />,
    color: 'text-emerald-400',
    description: 'PostgreSQL database for leads, campaigns, and scheduled messages.',
    fields: [
      {
        key: 'NEXT_PUBLIC_SUPABASE_URL',
        label: 'Supabase Project URL',
        placeholder: 'https://xxxx.supabase.co',
        hint: 'Found in Project Settings → API.',
        link: 'https://supabase.com/dashboard',
        linkLabel: 'Open dashboard →',
      },
      {
        key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        label: 'Supabase Anon Key',
        placeholder: 'eyJ...',
        hint: 'Public anon key — safe to expose in the browser.',
      },
      {
        key: 'SUPABASE_SERVICE_ROLE_KEY',
        label: 'Supabase Service Role Key',
        placeholder: 'eyJ...',
        hint: 'Server-only key used by admin routes. Never expose publicly.',
      },
    ],
  },
  {
    id: 'linkedin',
    label: 'LinkedIn (Sales Navigator)',
    icon: <Linkedin size={15} />,
    color: 'text-blue-500',
    description: 'Send InMails via the LinkedIn API. Requires an approved Sales Navigator app.',
    fields: [
      {
        key: 'LINKEDIN_ACCESS_TOKEN',
        label: 'LinkedIn Access Token',
        placeholder: 'AQV...',
        hint: 'OAuth 2.0 bearer token with w_member_social scope.',
        link: 'https://developer.linkedin.com/products/marketing/getting-started',
        linkLabel: 'LinkedIn developer docs →',
      },
      {
        key: 'LINKEDIN_PERSON_URN',
        label: 'Sender Person URN',
        placeholder: 'urn:li:person:ABC123',
        hint: "Your LinkedIn person URN — found via the /v2/me endpoint.",
      },
    ],
  },
  {
    id: 'twitter',
    label: 'Twitter / X',
    icon: <Twitter size={15} />,
    color: 'text-sky-400',
    description: 'Send DMs via the Twitter API v2. Requires a developer app with OAuth 1.0a.',
    fields: [
      {
        key: 'TWITTER_API_KEY',
        label: 'API Key (Consumer Key)',
        placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxx',
        hint: 'Found in your Twitter developer app settings.',
        link: 'https://developer.twitter.com/en/portal/dashboard',
        linkLabel: 'Twitter developer portal →',
      },
      {
        key: 'TWITTER_API_SECRET',
        label: 'API Secret (Consumer Secret)',
        placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        hint: 'Consumer secret from your Twitter app.',
      },
      {
        key: 'TWITTER_ACCESS_TOKEN',
        label: 'Access Token',
        placeholder: '000000000-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        hint: 'OAuth 1.0a access token for your sending account.',
      },
      {
        key: 'TWITTER_ACCESS_TOKEN_SECRET',
        label: 'Access Token Secret',
        placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        hint: 'OAuth 1.0a access token secret.',
      },
      {
        key: 'TWITTER_BEARER_TOKEN',
        label: 'Bearer Token',
        placeholder: 'AAAA...',
        hint: 'App-only bearer token — used for user lookups.',
      },
    ],
  },
  {
    id: 'facebook',
    label: 'Facebook Ads',
    icon: <Facebook size={15} />,
    color: 'text-[#1877F2]',
    description: 'Meta Marketing API for automated ad creation.',
    fields: [
      {
        key: 'FB_ACCESS_TOKEN',
        label: 'Access Token',
        placeholder: 'EAAxxxxxxxxxxxxxxxx',
        hint: 'Long-lived system-user or page access token from Meta Business Suite.',
      },
      {
        key: 'FB_AD_ACCOUNT_ID',
        label: 'Ad Account ID',
        placeholder: 'act_123456789',
        hint: 'Your ad account ID — starts with act_. Found in Ads Manager.',
      },
      {
        key: 'FB_PAGE_ID',
        label: 'Page ID',
        placeholder: '123456789012345',
        hint: 'Facebook Page ID to run ads from. Found in Page Settings → About.',
      },
    ],
  },
  {
    id: 'google_ads',
    label: 'Google Ads',
    icon: <Search size={15} />,
    color: 'text-yellow-400',
    description: 'Google Ads API for automated search ad creation.',
    fields: [
      {
        key: 'GOOGLE_ADS_DEVELOPER_TOKEN',
        label: 'Developer Token',
        placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxx',
        hint: 'From Google Ads API Center → API Access. Requires approved access.',
      },
      {
        key: 'GOOGLE_ADS_CLIENT_ID',
        label: 'OAuth Client ID',
        placeholder: 'xxxxxxxxxx.apps.googleusercontent.com',
        hint: 'OAuth 2.0 client ID from Google Cloud Console.',
      },
      {
        key: 'GOOGLE_ADS_CLIENT_SECRET',
        label: 'OAuth Client Secret',
        placeholder: 'GOCSPX-xxxxxxxxxxxxxxxx',
        hint: 'OAuth 2.0 client secret from Google Cloud Console.',
      },
      {
        key: 'GOOGLE_ADS_REFRESH_TOKEN',
        label: 'Refresh Token',
        placeholder: '1//xxxxxxxxxxxxxxxxxxxxxxxx',
        hint: 'Offline refresh token obtained via OAuth consent flow.',
      },
      {
        key: 'GOOGLE_ADS_CUSTOMER_ID',
        label: 'Customer ID',
        placeholder: '1234567890',
        hint: '10-digit Google Ads customer ID (no dashes). Found in the top-right of Google Ads UI.',
      },
    ],
  },
  {
    id: 'app',
    label: 'App Config',
    icon: <Globe size={15} />,
    color: 'text-purple-400',
    description: 'General application settings.',
    fields: [
      {
        key: 'NEXT_PUBLIC_APP_URL',
        label: 'App URL',
        placeholder: 'https://spacze.vercel.app',
        hint: 'Used by the queue processor to call internal API routes.',
      },
      {
        key: 'ADMIN_PASSWORD',
        label: 'Admin Password',
        placeholder: '••••••••',
        hint: 'Password for the /admin login page.',
      },
      {
        key: 'ADMIN_SESSION_SECRET',
        label: 'Session Secret',
        placeholder: 'long-random-string-32-chars-min',
        hint: 'Signs the httpOnly session cookie. Use a long random string (≥32 chars). Required for server-side auth.',
      },
    ],
  },
];

// ── Secret field component ────────────────────

function SecretField({
  field,
  value,
  onChange,
  onClear,
  saved,
}: {
  field: ApiField;
  value: string;
  onChange: (v: string) => void;
  onClear: (key: string) => void;
  saved: boolean;
}) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="label-xs">{field.label}</label>
        <div className="flex items-center gap-3">
          {saved && (
            <button
              type="button"
              onClick={() => onClear(field.key)}
              className="text-[10px] text-red-400/60 hover:text-red-400 flex items-center gap-1 transition-colors"
              title="Remove this key"
            >
              <Trash2 size={10} /> clear
            </button>
          )}
          {field.link && (
            <a
              href={field.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-[#00D67D] hover:underline"
            >
              {field.linkLabel}
            </a>
          )}
        </div>
      </div>
      <div className="relative">
        <Key size={12} className="absolute left-3 top-1/2 -translate-y-1/2 admin-subtle pointer-events-none" />
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="w-full admin-input border rounded-xl pl-8 pr-16 py-2.5 text-[12px] font-mono outline-none transition-colors"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {saved && <CheckCircle2 size={13} className="text-[#00D67D]" />}
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="admin-muted hover:admin-text transition-colors"
          >
            {show ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        </div>
      </div>
      <p className="text-[10px] admin-subtle mt-1">{field.hint}</p>
    </div>
  );
}

// ── Group card ────────────────────────────────

function GroupCard({
  group,
  values,
  onChange,
  onSave,
  onClear,
  saving,
  savedKeys,
  delay,
}: {
  group: ApiGroup;
  values: Record<string, string>;
  onChange: (key: string, val: string) => void;
  onSave: (groupId: string) => void;
  onClear: (key: string) => void;
  saving: boolean;
  savedKeys: Set<string>;
  delay: number;
}) {
  const [open, setOpen] = useState(true);

  return (
    <motion.div {...fadeUp} transition={{ delay }} className="admin-card overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 admin-hover transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--admin-surface-3)' }}>
            <span className={group.color}>{group.icon}</span>
          </div>
          <div className="text-left">
            <div className="font-semibold text-[13px] admin-text">{group.label}</div>
            <div className="text-[10px] admin-muted hidden sm:block">{group.description}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {group.fields.every(f => savedKeys.has(f.key)) && (
            <span className="text-[10px] font-mono accent-text border accent-border accent-bg px-2 py-0.5 rounded-full">
              configured
            </span>
          )}
          {open ? <ChevronDown size={13} className="admin-muted" /> : <ChevronRight size={13} className="admin-muted" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4 border-t admin-border pt-4">
              {group.fields.map(field => (
                <SecretField
                  key={field.key}
                  field={field}
                  value={values[field.key] || ''}
                  onChange={val => onChange(field.key, val)}
                  onClear={onClear}
                  saved={savedKeys.has(field.key)}
                />
              ))}
              <button
                onClick={() => onSave(group.id)}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-black font-bold text-[12px] transition-colors disabled:opacity-40"
                style={{ background: 'var(--accent)' }}
              >
                {saving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main panel ────────────────────────────────

export default function TerminalPanel() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [notice, setNotice] = useState('');

  // Load existing env values from the API on mount
  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        if (data && typeof data === 'object' && !data.error) {
          setValues(data);
          // Mark any key that has a non-empty value as saved
          const configured = new Set<string>(
            Object.entries(data)
              .filter(([, v]) => v && (v as string).length > 0)
              .map(([k]) => k)
          );
          setSavedKeys(configured);
        }
      })
      .catch(() => {/* settings API not yet configured — silent */});
  }, []);

  function handleChange(key: string, val: string) {
    setValues(prev => ({ ...prev, [key]: val }));
  }

  async function handleSave(groupId: string) {
    const group = API_GROUPS.find(g => g.id === groupId);
    if (!group) return;

    setSaving(true);
    setSaveError('');
    setNotice('');

    const payload: Record<string, string> = {};
    group.fields.forEach(f => {
      if (values[f.key] !== undefined) payload[f.key] = values[f.key];
    });

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');

      setSavedKeys(prev => {
        const next = new Set(prev);
        group.fields.forEach(f => {
          if (values[f.key]?.trim()) next.add(f.key);
          else next.delete(f.key);
        });
        return next;
      });
      setNotice(`${group.label} saved to database — active immediately and persisted across restarts.`);
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  async function handleClear(key: string) {
    setSaveError('');
    setNotice('');
    try {
      const res = await fetch(`/api/settings?key=${encodeURIComponent(key)}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');

      setValues(prev => { const next = { ...prev }; delete next[key]; return next; });
      setSavedKeys(prev => { const next = new Set(prev); next.delete(key); return next; });
      setNotice(`${key} removed.`);
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : 'Failed to remove key');
    }
  }

  return (
    <div className="space-y-5 max-w-3xl">

      {/* Header */}
      <motion.div {...fadeUp}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
            <Terminal size={15} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h2 className="font-bold text-[15px] admin-text">Settings</h2>
            <p className="text-[11px] admin-muted">API keys & integrations</p>
          </div>
        </div>
      </motion.div>

      {/* Notice / error banners */}
      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-start gap-2 p-3 rounded-xl bg-[#00D67D]/10 border border-[#00D67D]/20 text-[#00D67D] text-xs"
          >
            <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5" />
            {notice}
          </motion.div>
        )}
        {saveError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs"
          >
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            {saveError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Security notice */}
      <motion.div {...fadeUp} transition={{ delay: 0.05 }}
        className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/15 text-amber-400 text-[12px]"
      >
        <Shield size={14} className="flex-shrink-0 mt-0.5" />
        <span>
          Settings are encrypted in Supabase and applied to the server process immediately.
          They persist across restarts — no need to set environment variables manually.
          Never share API keys or commit them to version control.
        </span>
      </motion.div>

      {/* API groups */}
      {API_GROUPS.map((group, i) => (
        <GroupCard
          key={group.id}
          group={group}
          values={values}
          onChange={handleChange}
          onSave={handleSave}
          onClear={handleClear}
          saving={saving}
          savedKeys={savedKeys}
          delay={0.08 + i * 0.06}
        />
      ))}
    </div>
  );
}
