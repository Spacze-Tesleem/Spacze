'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Users, Mail, CheckCircle2, Calendar, Sparkles, Megaphone,
  ArrowRight, TrendingUp, BarChart2, MessageCircle,
} from 'lucide-react';
import { Campaign, ScheduledMessage } from '@/lib/supabase';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler,
);

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } };

const statusColor: Record<string, string> = {
  Pending:          'text-yellow-600 bg-yellow-100',
  Sent:             'text-emerald-700 bg-emerald-100',
  Replied:          'text-blue-600 bg-blue-100',
  'Meeting Booked': 'text-purple-600 bg-purple-100',
  'Not Interested': 'text-red-600 bg-red-100',
};

const GREEN  = '#00D67D';
const BLUE   = '#3b82f6';
const PURPLE = '#a855f7';
const YELLOW = '#eab308';

function last30DayLabels(): string[] {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  });
}

function last30DayDates(): Date[] {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });
}

const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', font: { size: 10 } } },
    y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', font: { size: 10 } } },
  },
};

const lineOptions = {
  ...baseChartOptions,
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
      labels: { color: '#64748b', font: { size: 10 }, padding: 10, boxWidth: 10 },
    },
  },
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom' as const,
      labels: { color: '#64748b', font: { size: 10 }, padding: 10, boxWidth: 10 },
    },
  },
  cutout: '65%',
};

export default function StatsPanel({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const [leads, setLeads] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [messages, setMessages] = useState<ScheduledMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/leads').then(r => r.json()),
      fetch('/api/campaigns').then(r => r.json()),
      fetch('/api/scheduled-messages').then(r => r.json()),
    ]).then(([l, c, m]) => {
      setLeads(Array.isArray(l) ? l : []);
      setCampaigns(Array.isArray(c) ? c : []);
      setMessages(Array.isArray(m) ? m : []);
      setLoading(false);
    });
  }, []);

  // ── Derived stats ──
  const stats = useMemo(() => ({
    total:           leads.length,
    emailSent:       leads.filter(d => d.email_sent).length,
    replied:         leads.filter(d => d.reply_received).length,
    meetings:        leads.filter(d => d.meeting_booked).length,
    pending:         leads.filter(d => d.outreach_status === 'Pending').length,
    activeCampaigns: campaigns.filter(c => c.status === 'active').length,
  }), [leads, campaigns]);

  const recent = useMemo(() => leads.slice(0, 5), [leads]);

  // ── Funnel chart ──
  const funnelData = useMemo(() => ({
    labels: ['Total Leads', 'Emails Sent', 'Replies', 'Meetings'],
    datasets: [{
      label: 'Count',
      data: [stats.total, stats.emailSent, stats.replied, stats.meetings],
      backgroundColor: [BLUE + '33', GREEN + '33', PURPLE + '33', YELLOW + '33'],
      borderColor: [BLUE, GREEN, PURPLE, YELLOW],
      borderWidth: 1.5,
      borderRadius: 6,
    }],
  }), [stats]);

  // ── Channel doughnut ──
  const channelData = useMemo(() => ({
    labels: ['Email', 'WhatsApp', 'LinkedIn'],
    datasets: [{
      data: [
        messages.filter(m => m.channel === 'email'    && m.status === 'sent').length,
        messages.filter(m => m.channel === 'whatsapp' && m.status === 'sent').length,
        messages.filter(m => m.channel === 'linkedin' && m.status === 'sent').length,
      ],
      backgroundColor: [BLUE + '99', GREEN + '99', '#6366f199'],
      borderColor: [BLUE, GREEN, '#6366f1'],
      borderWidth: 1.5,
    }],
  }), [messages]);

  // ── 30-day timeline ──
  const timelineData = useMemo(() => {
    const labels = last30DayLabels();
    const dates  = last30DayDates();
    const emailCounts = dates.map(d => {
      const next = new Date(d); next.setDate(next.getDate() + 1);
      return messages.filter(m =>
        m.channel === 'email' && m.status === 'sent' &&
        new Date(m.sent_at || m.scheduled_at) >= d &&
        new Date(m.sent_at || m.scheduled_at) < next
      ).length;
    });
    const waCounts = dates.map(d => {
      const next = new Date(d); next.setDate(next.getDate() + 1);
      return messages.filter(m =>
        m.channel === 'whatsapp' && m.status === 'sent' &&
        new Date(m.sent_at || m.scheduled_at) >= d &&
        new Date(m.sent_at || m.scheduled_at) < next
      ).length;
    });
    return {
      labels,
      datasets: [
        { label: 'Email',    data: emailCounts, borderColor: BLUE,  backgroundColor: BLUE  + '15', fill: true, tension: 0.4, pointRadius: 2 },
        { label: 'WhatsApp', data: waCounts,    borderColor: GREEN, backgroundColor: GREEN + '15', fill: true, tension: 0.4, pointRadius: 2 },
      ],
    };
  }, [messages]);

  // ── Campaign performance ──
  const campaignStats = useMemo(() => campaigns.map(c => {
    const cMsgs    = messages.filter(m => m.campaign_id === c.id);
    const sent     = cMsgs.filter(m => m.status === 'sent').length;
    const cLeads   = leads.filter(l => (c.lead_ids || []).includes(l.id));
    const replied  = cLeads.filter(l => l.reply_received).length;
    const meetings = cLeads.filter(l => l.meeting_booked).length;
    return {
      name:        c.name,
      status:      c.status,
      leadCount:   cLeads.length,
      sent,
      total:       cMsgs.length,
      replyRate:   cLeads.length > 0 ? Math.round((replied  / cLeads.length) * 100) : 0,
      meetingRate: cLeads.length > 0 ? Math.round((meetings / cLeads.length) * 100) : 0,
    };
  }), [campaigns, messages, leads]);

  const statCards = [
    { label: 'Total Leads',      value: stats.total,           icon: Users,        color: 'text-blue-600',    bg: 'bg-blue-100' },
    { label: 'Emails Sent',      value: stats.emailSent,       icon: Mail,         color: 'text-emerald-700', bg: 'bg-emerald-100' },
    { label: 'Replies',          value: stats.replied,         icon: CheckCircle2, color: 'text-purple-600',  bg: 'bg-purple-100' },
    { label: 'Meetings Booked',  value: stats.meetings,        icon: Calendar,     color: 'text-yellow-600',  bg: 'bg-yellow-100' },
    { label: 'Active Campaigns', value: stats.activeCampaigns, icon: Megaphone,    color: 'text-[#00D67D]',   bg: 'bg-emerald-100' },
  ];

  return (
    <div className="space-y-5">

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
        {statCards.map((c, i) => (
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

      {/* ── Charts row: funnel + channel mix ── */}
      <div className="grid lg:grid-cols-3 gap-5">
        <motion.div {...fadeUp} transition={{ delay: 0.2 }}
          className="lg:col-span-2 p-5 rounded-2xl admin-surface border admin-border">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={14} className="admin-muted" />
            <span className="text-xs font-mono admin-muted uppercase tracking-wider">Conversion Funnel</span>
          </div>
          <div className="h-44">
            {loading
              ? <div className="h-full flex items-center justify-center admin-muted text-sm">Loading…</div>
              : <Bar data={funnelData} options={baseChartOptions} />}
          </div>
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.25 }}
          className="p-5 rounded-2xl admin-surface border admin-border">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle size={14} className="admin-muted" />
            <span className="text-xs font-mono admin-muted uppercase tracking-wider">Channel Mix</span>
          </div>
          <div className="h-44">
            {loading
              ? <div className="h-full flex items-center justify-center admin-muted text-sm">Loading…</div>
              : <Doughnut data={channelData} options={doughnutOptions} />}
          </div>
        </motion.div>
      </div>

      {/* ── 30-day timeline ── */}
      <motion.div {...fadeUp} transition={{ delay: 0.3 }}
        className="p-5 rounded-2xl admin-surface border admin-border">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={14} className="admin-muted" />
          <span className="text-xs font-mono admin-muted uppercase tracking-wider">Messages Sent — Last 30 Days</span>
        </div>
        <div className="h-44">
          {loading
            ? <div className="h-full flex items-center justify-center admin-muted text-sm">Loading…</div>
            : <Line data={timelineData} options={lineOptions} />}
        </div>
      </motion.div>

      {/* ── Pipeline conversion bars ── */}
      {!loading && stats.total > 0 && (
        <motion.div {...fadeUp} transition={{ delay: 0.35 }}
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

      {/* ── Quick actions ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
        <motion.button {...fadeUp} transition={{ delay: 0.38 }} onClick={() => onNavigate('crm')}
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

        <motion.button {...fadeUp} transition={{ delay: 0.42 }} onClick={() => onNavigate('copy')}
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

        <motion.button {...fadeUp} transition={{ delay: 0.46 }} onClick={() => onNavigate('campaigns')}
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

      {/* ── Campaign performance table ── */}
      {!loading && campaignStats.length > 0 && (
        <motion.div {...fadeUp} transition={{ delay: 0.5 }}
          className="rounded-2xl admin-surface border admin-border overflow-hidden">
          <div className="px-5 py-4 border-b admin-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Megaphone size={14} className="admin-muted" />
              <span className="text-xs font-mono admin-muted uppercase tracking-wider">Campaign Performance</span>
            </div>
            <button onClick={() => onNavigate('analytics')} className="text-xs admin-muted hover:text-[#00D67D] transition-colors">
              Full analytics →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b admin-border">
                  {['Campaign', 'Status', 'Leads', 'Sent', 'Reply Rate', 'Meeting Rate'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] font-mono admin-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y admin-divider">
                {campaignStats.map(c => (
                  <tr key={c.name} className="admin-hover transition-colors">
                    <td className="px-5 py-3 font-medium admin-text">{c.name}</td>
                    <td className="px-5 py-3">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        c.status === 'active'    ? 'text-[#00D67D] bg-[#00D67D]/10 border-[#00D67D]/20' :
                        c.status === 'paused'    ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' :
                        c.status === 'completed' ? 'text-blue-400 bg-blue-400/10 border-blue-400/20' :
                                                   'text-slate-400 bg-slate-400/10 border-slate-400/20'
                      }`}>{c.status}</span>
                    </td>
                    <td className="px-5 py-3 admin-muted">{c.leadCount}</td>
                    <td className="px-5 py-3 admin-muted">{c.sent}/{c.total}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-14 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full" style={{ width: `${c.replyRate}%` }} />
                        </div>
                        <span className="text-xs admin-muted">{c.replyRate}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-14 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${c.meetingRate}%` }} />
                        </div>
                        <span className="text-xs admin-muted">{c.meetingRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* ── Recent leads ── */}
      <motion.div {...fadeUp} transition={{ delay: 0.55 }}
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
