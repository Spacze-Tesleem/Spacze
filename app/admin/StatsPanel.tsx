'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Mail, CheckCircle2, Calendar, Sparkles, Megaphone, ArrowRight, TrendingUp } from 'lucide-react';

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } };

const statusColor: Record<string, string> = {
  Pending:          'text-yellow-600 bg-yellow-100',
  Sent:             'text-emerald-700 bg-emerald-100',
  Replied:          'text-blue-600 bg-blue-100',
  'Meeting Booked': 'text-purple-600 bg-purple-100',
  'Not Interested': 'text-red-600 bg-red-100',
};

export default function StatsPanel({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const [stats, setStats] = useState({ total: 0, emailSent: 0, replied: 0, meetings: 0, pending: 0, activeCampaigns: 0 });
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [leadsRes, campaignsRes] = await Promise.all([
        fetch('/api/leads'),
        fetch('/api/campaigns'),
      ]);
      const data = await leadsRes.json();
      const campaigns = await campaignsRes.json();
      if (!Array.isArray(data)) return;
      setStats({
        total: data.length,
        emailSent: data.filter((d: any) => d.email_sent).length,
        replied: data.filter((d: any) => d.reply_received).length,
        meetings: data.filter((d: any) => d.meeting_booked).length,
        pending: data.filter((d: any) => d.outreach_status === 'Pending').length,
        activeCampaigns: Array.isArray(campaigns) ? campaigns.filter((c: any) => c.status === 'active').length : 0,
      });
      setRecent(data.slice(0, 5));
      setLoading(false);
    }
    load();
  }, []);

  const cards = [
    { label: 'Total Leads',       value: stats.total,            icon: Users,        color: 'text-blue-600',    bg: 'bg-blue-100' },
    { label: 'Emails Sent',       value: stats.emailSent,        icon: Mail,         color: 'text-emerald-700', bg: 'bg-emerald-100' },
    { label: 'Replies',           value: stats.replied,          icon: CheckCircle2, color: 'text-purple-600',  bg: 'bg-purple-100' },
    { label: 'Meetings Booked',   value: stats.meetings,         icon: Calendar,     color: 'text-yellow-600',  bg: 'bg-yellow-100' },
    { label: 'Active Campaigns',  value: stats.activeCampaigns,  icon: Megaphone,    color: 'text-[#00D67D]',   bg: 'bg-emerald-100' },
  ];

  return (
    <div className="space-y-5">

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
        {cards.map((c, i) => (
          <motion.div key={i} {...fadeUp} transition={{ delay: i * 0.07 }}
            className="p-4 lg:p-5 rounded-2xl admin-surface border admin-border">
            <div className={`w-8 h-8 lg:w-9 lg:h-9 rounded-xl ${c.bg} flex items-center justify-center mb-3`}>
              <c.icon size={16} className={c.color} />
            </div>
            <div className="text-2xl font-bold">{loading ? '—' : c.value}</div>
            <div className="text-[11px] admin-muted mt-0.5 leading-tight">{c.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Conversion bar */}
      {!loading && stats.total > 0 && (
        <motion.div {...fadeUp} transition={{ delay: 0.28 }}
          className="p-4 lg:p-5 rounded-2xl admin-surface border admin-border">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={14} className="admin-muted" />
            <span className="text-xs font-mono admin-muted uppercase tracking-wider">Pipeline Conversion</span>
          </div>
          <div className="space-y-2.5">
            {[
              { label: 'Emails sent', value: stats.emailSent, color: 'bg-[#00D67D]' },
              { label: 'Replies',     value: stats.replied,   color: 'bg-blue-500' },
              { label: 'Meetings',    value: stats.meetings,  color: 'bg-purple-500' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-20 text-[10px] admin-muted font-mono shrink-0">{label}</div>
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round((value / stats.total) * 100)}%` }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className={`h-full ${color} rounded-full`}
                  />
                </div>
                <div className="w-8 text-[10px] text-slate-400 font-mono text-right shrink-0">{value}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
        <motion.button {...fadeUp} transition={{ delay: 0.3 }} onClick={() => onNavigate('crm')}
          className="group p-5 rounded-2xl admin-surface border admin-border hover:border-[#00D67D]/30 transition-all text-left">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Users size={18} className="text-emerald-700" />
            </div>
            <ArrowRight size={16} className="admin-subtle group-hover:text-[#00D67D] transition-colors" />
          </div>
          <div className="font-bold text-sm mb-1">Manage CRM Pipeline</div>
          <div className="text-xs admin-muted">{stats.pending} lead{stats.pending !== 1 ? 's' : ''} pending outreach</div>
        </motion.button>

        <motion.button {...fadeUp} transition={{ delay: 0.35 }} onClick={() => onNavigate('copy')}
          className="group p-5 rounded-2xl admin-surface border admin-border hover:border-blue-500/30 transition-all text-left">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
              <Sparkles size={18} className="text-blue-600" />
            </div>
            <ArrowRight size={16} className="admin-subtle group-hover:text-blue-400 transition-colors" />
          </div>
          <div className="font-bold text-sm mb-1">AI Copy Generator</div>
          <div className="text-xs admin-muted">Generate copy for 6 platforms</div>
        </motion.button>

        <motion.button {...fadeUp} transition={{ delay: 0.4 }} onClick={() => onNavigate('campaigns')}
          className="group p-5 rounded-2xl admin-surface border admin-border hover:border-purple-500/30 transition-all text-left">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center">
              <Megaphone size={18} className="text-purple-600" />
            </div>
            <ArrowRight size={16} className="admin-subtle group-hover:text-purple-400 transition-colors" />
          </div>
          <div className="font-bold text-sm mb-1">Create Campaign</div>
          <div className="text-xs admin-muted">{stats.activeCampaigns} active campaign{stats.activeCampaigns !== 1 ? 's' : ''}</div>
        </motion.button>
      </div>

      {/* Recent leads */}
      <motion.div {...fadeUp} transition={{ delay: 0.4 }}
        className="rounded-2xl admin-surface border admin-border overflow-hidden">
        <div className="px-5 py-4 border-b admin-border flex items-center justify-between">
          <h3 className="font-bold text-sm">Recent Leads</h3>
          <button onClick={() => onNavigate('crm')} className="text-xs admin-muted hover:text-[#00D67D] transition-colors">View all →</button>
        </div>
        {loading ? (
          <div className="px-5 py-10 text-center admin-subtle text-sm">Loading...</div>
        ) : recent.length === 0 ? (
          <div className="px-5 py-10 text-center admin-subtle text-sm">No leads yet. Add your first lead in the CRM.</div>
        ) : (
          <div className="admin-divider divide-y">
            {recent.map((lead: any, i: number) => (
              <div key={i} className="px-5 py-3.5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{lead.business_name}</div>
                  <div className="text-[11px] admin-muted truncate mt-0.5">{lead.contact_email}</div>
                </div>
                <span className={`flex-shrink-0 text-[10px] font-mono px-2 py-1 rounded-md ${statusColor[lead.outreach_status] || 'admin-muted admin-hover'}`}>
                  {lead.outreach_status}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
