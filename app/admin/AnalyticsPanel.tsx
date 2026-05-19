'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { BarChart2, TrendingUp, Mail, MessageCircle, Megaphone, Users, Calendar } from 'lucide-react';
import { Lead, Campaign, ScheduledMessage } from '@/lib/supabase';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler,
);

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } };

type DateRange = '7d' | '30d' | '90d' | 'all';

const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
};

const GREEN  = '#00D67D';
const BLUE   = '#3b82f6';
const PURPLE = '#a855f7';
const YELLOW = '#eab308';

// ── Helpers ──────────────────────────────────

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function filterByRange(date: string, range: DateRange): boolean {
  if (range === 'all') return true;
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  return new Date(date) >= daysAgo(days);
}

function last30DayLabels(): string[] {
  return Array.from({ length: 30 }, (_, i) => {
    const d = daysAgo(29 - i);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  });
}

function last30DayDates(): Date[] {
  return Array.from({ length: 30 }, (_, i) => daysAgo(29 - i));
}

// ── Stat Card ────────────────────────────────

function StatCard({ label, value, icon: Icon, color, bg }: {
  label: string; value: number | string;
  icon: React.ElementType; color: string; bg: string;
}) {
  return (
    <motion.div {...fadeUp} className="p-4 lg:p-5 rounded-2xl admin-surface border admin-border">
      <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center mb-3`}>
        <Icon size={16} className={color} />
      </div>
      <div className="text-2xl font-bold admin-text">{value}</div>
      <div className="text-[11px] admin-muted mt-0.5 leading-tight">{label}</div>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────

export default function AnalyticsPanel() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [messages, setMessages] = useState<ScheduledMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange>('30d');

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

  // ── Filtered data ──
  const filteredMessages = useMemo(() => {
    return messages.filter(m => {
      const inCampaign = selectedCampaign === 'all' || m.campaign_id === selectedCampaign;
      const inRange = filterByRange(m.scheduled_at, dateRange);
      return inCampaign && inRange;
    });
  }, [messages, selectedCampaign, dateRange]);

  const filteredLeads = useMemo(() => {
    return leads.filter(l => filterByRange(l.created_at || '', dateRange));
  }, [leads, dateRange]);

  // ── Overview stats ──
  const stats = useMemo(() => {
    const sentMsgs = filteredMessages.filter(m => m.status === 'sent');
    const emailSent = sentMsgs.filter(m => m.channel === 'email').length;
    const waSent = sentMsgs.filter(m => m.channel === 'whatsapp').length;
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
    const replied = filteredLeads.filter(l => l.reply_received).length;
    const meetings = filteredLeads.filter(l => l.meeting_booked).length;
    return { emailSent, waSent, activeCampaigns, replied, meetings, totalLeads: filteredLeads.length };
  }, [filteredMessages, filteredLeads, campaigns]);

  // ── Funnel chart data ──
  const funnelData = useMemo(() => ({
    labels: ['Total Leads', 'Emails Sent', 'Replies', 'Meetings'],
    datasets: [{
      label: 'Count',
      data: [stats.totalLeads, stats.emailSent, stats.replied, stats.meetings],
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
        filteredMessages.filter(m => m.channel === 'email' && m.status === 'sent').length,
        filteredMessages.filter(m => m.channel === 'whatsapp' && m.status === 'sent').length,
        filteredMessages.filter(m => m.channel === 'linkedin' && m.status === 'sent').length,
      ],
      backgroundColor: [BLUE + '99', GREEN + '99', '#3b82f699'],
      borderColor: [BLUE, GREEN, '#3b82f6'],
      borderWidth: 1.5,
    }],
  }), [filteredMessages]);

  // ── Timeline (last 30 days) ──
  const timelineData = useMemo(() => {
    const labels = last30DayLabels();
    const dates = last30DayDates();

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
        {
          label: 'Email',
          data: emailCounts,
          borderColor: BLUE,
          backgroundColor: BLUE + '15',
          fill: true,
          tension: 0.4,
          pointRadius: 2,
        },
        {
          label: 'WhatsApp',
          data: waCounts,
          borderColor: GREEN,
          backgroundColor: GREEN + '15',
          fill: true,
          tension: 0.4,
          pointRadius: 2,
        },
      ],
    };
  }, [messages]);

  // ── Campaign performance table ──
  const campaignStats = useMemo(() => {
    return campaigns.map(c => {
      const cMsgs = messages.filter(m => m.campaign_id === c.id);
      const sent = cMsgs.filter(m => m.status === 'sent').length;
      const total = cMsgs.length;
      const cLeads = leads.filter(l => (c.lead_ids || []).includes(l.id!));
      const replied = cLeads.filter(l => l.reply_received).length;
      const meetings = cLeads.filter(l => l.meeting_booked).length;
      const replyRate = cLeads.length > 0 ? Math.round((replied / cLeads.length) * 100) : 0;
      const meetingRate = cLeads.length > 0 ? Math.round((meetings / cLeads.length) * 100) : 0;
      return { campaign: c, total, sent, replyRate, meetingRate, leadCount: cLeads.length };
    });
  }, [campaigns, messages, leads]);

  const chartOptions = {
    ...CHART_DEFAULTS,
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', font: { size: 10 } } },
      y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', font: { size: 10 } } },
    },
  };

  const doughnutOptions = {
    ...CHART_DEFAULTS,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: { color: '#64748b', font: { size: 10 }, padding: 12, boxWidth: 10 },
      },
    },
    cutout: '65%',
  };

  const lineOptions = {
    ...chartOptions,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: { color: '#64748b', font: { size: 10 }, padding: 12, boxWidth: 10 },
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 admin-muted text-sm">Loading analytics…</div>
    );
  }

  return (
    <div className="space-y-5 max-w-6xl">

      {/* Filters */}
      <motion.div {...fadeUp} className="flex flex-wrap items-center gap-3">
        {/* Campaign filter */}
        <div className="flex items-center gap-2">
          <Megaphone size={13} className="admin-muted" />
          <select
            value={selectedCampaign}
            onChange={e => setSelectedCampaign(e.target.value)}
            className="admin-input border rounded-xl px-3 py-2 text-xs outline-none focus:border-[#00D67D]/40 transition-colors"
          >
            <option value="all">All Campaigns</option>
            {campaigns.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Date range */}
        <div className="flex gap-1">
          {(['7d', '30d', '90d', 'all'] as DateRange[]).map(r => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                dateRange === r
                  ? 'bg-[#00D67D]/10 text-[#00D67D] border-[#00D67D]/20'
                  : 'admin-border admin-muted admin-hover'
              }`}
            >
              {r === 'all' ? 'All time' : `Last ${r}`}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard label="Total Leads"       value={stats.totalLeads}      icon={Users}         color="text-blue-400"   bg="bg-blue-400/10" />
        <StatCard label="Emails Sent"       value={stats.emailSent}       icon={Mail}          color="text-[#00D67D]"  bg="bg-[#00D67D]/10" />
        <StatCard label="WhatsApp Sent"     value={stats.waSent}          icon={MessageCircle} color="text-[#25D366]"  bg="bg-[#25D366]/10" />
        <StatCard label="Replies"           value={stats.replied}         icon={TrendingUp}    color="text-purple-400" bg="bg-purple-400/10" />
        <StatCard label="Meetings Booked"   value={stats.meetings}        icon={Calendar}      color="text-yellow-400" bg="bg-yellow-400/10" />
        <StatCard label="Active Campaigns"  value={stats.activeCampaigns} icon={Megaphone}     color="text-[#00D67D]"  bg="bg-[#00D67D]/10" />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* Funnel bar */}
        <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="lg:col-span-2 p-5 rounded-2xl admin-surface border admin-border">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={14} className="admin-muted" />
            <span className="text-xs font-mono admin-muted uppercase tracking-wider">Conversion Funnel</span>
          </div>
          <div className="h-48">
            <Bar data={funnelData} options={chartOptions} />
          </div>
        </motion.div>

        {/* Channel doughnut */}
        <motion.div {...fadeUp} transition={{ delay: 0.15 }} className="p-5 rounded-2xl admin-surface border admin-border">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle size={14} className="admin-muted" />
            <span className="text-xs font-mono admin-muted uppercase tracking-wider">Channel Mix</span>
          </div>
          <div className="h-48">
            <Doughnut data={channelData} options={doughnutOptions} />
          </div>
        </motion.div>
      </div>

      {/* Timeline */}
      <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="p-5 rounded-2xl admin-surface border admin-border">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={14} className="admin-muted" />
          <span className="text-xs font-mono admin-muted uppercase tracking-wider">Messages Sent — Last 30 Days</span>
        </div>
        <div className="h-48">
          <Line data={timelineData} options={lineOptions} />
        </div>
      </motion.div>

      {/* Campaign performance table */}
      <motion.div {...fadeUp} transition={{ delay: 0.25 }} className="rounded-2xl admin-surface border admin-border overflow-hidden">
        <div className="px-5 py-4 border-b admin-border flex items-center gap-2">
          <Megaphone size={14} className="admin-muted" />
          <span className="text-xs font-mono admin-muted uppercase tracking-wider">Campaign Performance</span>
        </div>
        {campaignStats.length === 0 ? (
          <div className="px-5 py-10 text-center admin-muted text-sm">No campaigns yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b admin-border">
                  {['Campaign', 'Status', 'Leads', 'Msgs Sent', 'Reply Rate', 'Meeting Rate'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] font-mono admin-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y admin-divider">
                {campaignStats.map(({ campaign: c, total, sent, replyRate, meetingRate, leadCount }) => (
                  <tr key={c.id} className="admin-hover transition-colors">
                    <td className="px-5 py-3 font-medium admin-text">{c.name}</td>
                    <td className="px-5 py-3">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        c.status === 'active' ? 'text-[#00D67D] bg-[#00D67D]/10 border-[#00D67D]/20' :
                        c.status === 'paused' ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' :
                        c.status === 'completed' ? 'text-blue-400 bg-blue-400/10 border-blue-400/20' :
                        'text-slate-400 bg-slate-400/10 border-slate-400/20'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 admin-muted">{leadCount}</td>
                    <td className="px-5 py-3 admin-muted">{sent} / {total}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full" style={{ width: `${replyRate}%` }} />
                        </div>
                        <span className="text-xs admin-muted">{replyRate}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${meetingRate}%` }} />
                        </div>
                        <span className="text-xs admin-muted">{meetingRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
