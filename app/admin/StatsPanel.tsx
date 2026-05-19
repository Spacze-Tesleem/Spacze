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
  BarChart2, TrendingUp, Mail, MessageCircle, Megaphone,
  Users, Calendar, Sparkles, ArrowRight, Activity,
} from 'lucide-react';
import { Lead, Campaign, ScheduledMessage } from '@/lib/supabase';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler,
);

const fadeUp = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35 } };

type DateRange = '7d' | '30d' | '90d' | 'all';

const GREEN  = '#00D67D';
const BLUE   = '#3b82f6';
const PURPLE = '#a855f7';
const AMBER  = '#f59e0b';

// ── Helpers ───────────────────────────────────

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
  return Array.from({ length: 30 }, (_, i) => {
    const d = daysAgo(29 - i);
    d.setHours(0, 0, 0, 0);
    return d;
  });
}

// ── Chart base options ────────────────────────

const baseAxis = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: {
      grid: { color: 'rgba(255,255,255,0.03)', drawBorder: false },
      ticks: { color: '#4b5563', font: { size: 10 } },
      border: { display: false },
    },
    y: {
      grid: { color: 'rgba(255,255,255,0.03)', drawBorder: false },
      ticks: { color: '#4b5563', font: { size: 10 } },
      border: { display: false },
    },
  },
};

const lineOpts = {
  ...baseAxis,
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
      labels: { color: '#6b7280', font: { size: 10 }, padding: 14, boxWidth: 10, usePointStyle: true },
    },
  },
};

const doughnutOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom' as const,
      labels: { color: '#6b7280', font: { size: 10 }, padding: 12, boxWidth: 10, usePointStyle: true },
    },
  },
  cutout: '68%',
};

// ── Stat Card ─────────────────────────────────

function StatCard({
  label, value, icon: Icon, accent, delta, loading,
}: {
  label: string; value: number; icon: React.ElementType;
  accent: string; delta?: string; loading: boolean;
}) {
  return (
    <motion.div {...fadeUp} className="stat-card p-5">
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: accent + '18' }}
        >
          <Icon size={16} style={{ color: accent }} />
        </div>
        {delta && !loading && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full"
            style={{ background: accent + '14', color: accent }}>
            {delta}
          </span>
        )}
      </div>
      {loading ? (
        <div className="skeleton h-7 w-16 mb-1.5" />
      ) : (
        <div className="text-[26px] font-bold admin-text leading-none mb-1">{value}</div>
      )}
      <div className="text-[11px] admin-muted leading-tight">{label}</div>
    </motion.div>
  );
}

// ── Section header ────────────────────────────

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon size={13} className="admin-muted" />
      <span className="label-xs">{title}</span>
    </div>
  );
}

// ── Chart card ────────────────────────────────

function ChartCard({ icon: Icon, title, height = 'h-52', children }: {
  icon: React.ElementType; title: string; height?: string; children: React.ReactNode;
}) {
  return (
    <div className="admin-card p-5">
      <SectionHeader icon={Icon} title={title} />
      <div className={height}>{children}</div>
    </div>
  );
}

// ── Loading placeholder ───────────────────────

function ChartSkeleton() {
  return (
    <div className="h-full flex flex-col justify-end gap-2 pb-2">
      {[60, 80, 45, 90, 55, 70].map((h, i) => (
        <div key={i} className="skeleton rounded" style={{ height: `${h}%`, width: `${100 / 6 - 2}%`, display: 'inline-block', marginRight: '2%' }} />
      ))}
    </div>
  );
}

// ── Main panel ────────────────────────────────

export default function StatsPanel({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const [leads, setLeads]         = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [messages, setMessages]   = useState<ScheduledMessage[]>([]);
  const [loading, setLoading]     = useState(true);
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
    }).catch(() => setLoading(false));
  }, []);

  const filteredMessages = useMemo(() =>
    messages.filter(m => {
      const inCampaign = selectedCampaign === 'all' || m.campaign_id === selectedCampaign;
      const inRange    = filterByRange(m.scheduled_at, dateRange);
      return inCampaign && inRange;
    }), [messages, selectedCampaign, dateRange]);

  const filteredLeads = useMemo(() =>
    leads.filter(l => filterByRange(l.created_at || '', dateRange)),
    [leads, dateRange]);

  const stats = useMemo(() => ({
    totalLeads:      filteredLeads.length,
    emailSent:       filteredMessages.filter(m => m.channel === 'email'    && m.status === 'sent').length,
    waSent:          filteredMessages.filter(m => m.channel === 'whatsapp' && m.status === 'sent').length,
    replied:         filteredLeads.filter(l => l.reply_received).length,
    meetings:        filteredLeads.filter(l => l.meeting_booked).length,
    activeCampaigns: campaigns.filter(c => c.status === 'active').length,
    pending:         leads.filter(l => (l as any).outreach_status === 'Pending').length,
  }), [filteredLeads, filteredMessages, campaigns, leads]);

  const funnelData = useMemo(() => ({
    labels: ['Total Leads', 'Emails Sent', 'Replies', 'Meetings'],
    datasets: [{
      label: 'Count',
      data: [stats.totalLeads, stats.emailSent, stats.replied, stats.meetings],
      backgroundColor: [BLUE + '28', GREEN + '28', PURPLE + '28', AMBER + '28'],
      borderColor:     [BLUE, GREEN, PURPLE, AMBER],
      borderWidth: 1.5,
      borderRadius: 8,
    }],
  }), [stats]);

  const channelData = useMemo(() => ({
    labels: ['Email', 'WhatsApp', 'LinkedIn'],
    datasets: [{
      data: [
        filteredMessages.filter(m => m.channel === 'email'    && m.status === 'sent').length,
        filteredMessages.filter(m => m.channel === 'whatsapp' && m.status === 'sent').length,
        filteredMessages.filter(m => m.channel === 'linkedin' && m.status === 'sent').length,
      ],
      backgroundColor: [BLUE + 'aa', GREEN + 'aa', '#6366f1aa'],
      borderColor:     [BLUE, GREEN, '#6366f1'],
      borderWidth: 1.5,
    }],
  }), [filteredMessages]);

  const timelineData = useMemo(() => {
    const labels = last30DayLabels();
    const dates  = last30DayDates();
    const count = (channel: string) => dates.map(d => {
      const next = new Date(d); next.setDate(next.getDate() + 1);
      return messages.filter(m =>
        m.channel === channel && m.status === 'sent' &&
        new Date(m.sent_at || m.scheduled_at) >= d &&
        new Date(m.sent_at || m.scheduled_at) < next
      ).length;
    });
    return {
      labels,
      datasets: [
        { label: 'Email',    data: count('email'),    borderColor: BLUE,  backgroundColor: BLUE  + '12', fill: true, tension: 0.4, pointRadius: 2, borderWidth: 1.5 },
        { label: 'WhatsApp', data: count('whatsapp'), borderColor: GREEN, backgroundColor: GREEN + '12', fill: true, tension: 0.4, pointRadius: 2, borderWidth: 1.5 },
      ],
    };
  }, [messages]);

  const campaignStats = useMemo(() => campaigns.map(c => {
    const cMsgs    = messages.filter(m => m.campaign_id === c.id);
    const sent     = cMsgs.filter(m => m.status === 'sent').length;
    const cLeads   = leads.filter(l => (c.lead_ids || []).includes(l.id!));
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

  const recent = useMemo(() => leads.slice(0, 5), [leads]);

  const statusPill: Record<string, string> = {
    Pending:          'text-amber-600 bg-amber-50 border border-amber-200',
    Sent:             'text-emerald-700 bg-emerald-50 border border-emerald-200',
    Replied:          'text-blue-600 bg-blue-50 border border-blue-200',
    'Meeting Booked': 'text-purple-600 bg-purple-50 border border-purple-200',
    'Not Interested': 'text-red-500 bg-red-50 border border-red-200',
  };

  const campaignStatusPill: Record<string, string> = {
    active:    'text-[#00D67D] bg-[#00D67D]/10 border-[#00D67D]/20',
    paused:    'text-amber-400 bg-amber-400/10 border-amber-400/20',
    completed: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    draft:     'text-slate-400 bg-slate-400/10 border-slate-400/20',
  };

  return (
    <div className="space-y-5 max-w-[1400px]">

      {/* ── Filters ── */}
      <motion.div {...fadeUp} className="flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-2 p-1 rounded-xl border admin-border admin-surface-2">
          {(['7d', '30d', '90d', 'all'] as DateRange[]).map(r => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                dateRange === r
                  ? 'accent-bg accent-text font-semibold'
                  : 'admin-muted hover:admin-text'
              }`}
            >
              {r === 'all' ? 'All time' : `Last ${r}`}
            </button>
          ))}
        </div>

        <select
          value={selectedCampaign}
          onChange={e => setSelectedCampaign(e.target.value)}
          className="admin-input border rounded-xl px-3 py-2 text-[11px] outline-none transition-colors"
        >
          <option value="all">All Campaigns</option>
          {campaigns.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </motion.div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard label="Total Leads"      value={stats.totalLeads}      icon={Users}         accent={BLUE}   loading={loading} />
        <StatCard label="Emails Sent"      value={stats.emailSent}       icon={Mail}          accent={GREEN}  loading={loading} />
        <StatCard label="WhatsApp Sent"    value={stats.waSent}          icon={MessageCircle} accent="#25D366" loading={loading} />
        <StatCard label="Replies"          value={stats.replied}         icon={TrendingUp}    accent={PURPLE} loading={loading} />
        <StatCard label="Meetings Booked"  value={stats.meetings}        icon={Calendar}      accent={AMBER}  loading={loading} />
        <StatCard label="Active Campaigns" value={stats.activeCampaigns} icon={Megaphone}     accent={GREEN}  loading={loading} />
      </div>

      {/* ── Charts row ── */}
      <div className="grid lg:grid-cols-3 gap-4">
        <motion.div {...fadeUp} transition={{ delay: 0.08 }} className="lg:col-span-2">
          <ChartCard icon={BarChart2} title="Conversion Funnel">
            {loading ? <ChartSkeleton /> : <Bar data={funnelData} options={baseAxis} />}
          </ChartCard>
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.12 }}>
          <ChartCard icon={Activity} title="Channel Mix">
            {loading ? <ChartSkeleton /> : <Doughnut data={channelData} options={doughnutOpts} />}
          </ChartCard>
        </motion.div>
      </div>

      {/* ── Timeline ── */}
      <motion.div {...fadeUp} transition={{ delay: 0.16 }}>
        <ChartCard icon={TrendingUp} title="Messages Sent — Last 30 Days" height="h-52">
          {loading ? <ChartSkeleton /> : <Line data={timelineData} options={lineOpts} />}
        </ChartCard>
      </motion.div>

      {/* ── Quick actions ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { tab: 'crm',       icon: Users,     accent: GREEN,  bg: 'bg-emerald-50',  iconCls: 'text-emerald-700', title: 'Manage CRM Pipeline',   sub: `${stats.pending} lead${stats.pending !== 1 ? 's' : ''} pending outreach` },
          { tab: 'copy',      icon: Sparkles,  accent: BLUE,   bg: 'bg-blue-50',     iconCls: 'text-blue-600',    title: 'AI Copy Generator',     sub: 'Generate copy for 6 platforms' },
          { tab: 'campaigns', icon: Megaphone, accent: PURPLE, bg: 'bg-purple-50',   iconCls: 'text-purple-600',  title: 'Create Campaign',       sub: `${stats.activeCampaigns} active campaign${stats.activeCampaigns !== 1 ? 's' : ''}` },
        ].map(({ tab, icon: Icon, accent, bg, iconCls, title, sub }, i) => (
          <motion.button
            key={tab}
            {...fadeUp}
            transition={{ delay: 0.2 + i * 0.05 }}
            onClick={() => onNavigate(tab)}
            className="group admin-card p-5 text-left transition-all hover:-translate-y-0.5"
            style={{ '--hover-border': accent + '40' } as React.CSSProperties}
            onMouseEnter={e => (e.currentTarget.style.borderColor = accent + '35')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '')}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon size={17} className={iconCls} />
              </div>
              <ArrowRight size={15} className="admin-subtle transition-colors" style={{ color: 'var(--admin-subtle)' }}
                onMouseEnter={e => (e.currentTarget.style.color = accent)}
                onMouseLeave={e => (e.currentTarget.style.color = '')}
              />
            </div>
            <div className="font-semibold text-[13px] admin-text mb-1">{title}</div>
            <div className="text-[11px] admin-muted">{sub}</div>
          </motion.button>
        ))}
      </div>

      {/* ── Campaign performance ── */}
      <motion.div {...fadeUp} transition={{ delay: 0.3 }} className="admin-card overflow-hidden">
        <div className="px-5 py-4 border-b admin-border flex items-center gap-2">
          <Megaphone size={13} className="admin-muted" />
          <span className="label-xs">Campaign Performance</span>
        </div>
        {campaignStats.length === 0 ? (
          <div className="px-5 py-12 text-center admin-muted text-sm">No campaigns yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b admin-border">
                  {['Campaign', 'Status', 'Leads', 'Sent', 'Reply Rate', 'Meeting Rate'].map(h => (
                    <th key={h} className="text-left px-5 py-3 label-xs whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaignStats.map((c, i) => (
                  <tr key={i} className="border-b admin-border last:border-0 admin-hover transition-colors">
                    <td className="px-5 py-3.5 font-medium text-[13px] admin-text">{c.name}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${campaignStatusPill[c.status] || campaignStatusPill.draft}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 admin-muted text-[13px]">{c.leadCount}</td>
                    <td className="px-5 py-3.5 admin-muted text-[13px]">{c.sent}/{c.total}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--admin-surface-3)' }}>
                          <div className="h-full rounded-full" style={{ width: `${c.replyRate}%`, background: PURPLE }} />
                        </div>
                        <span className="text-[11px] admin-muted">{c.replyRate}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--admin-surface-3)' }}>
                          <div className="h-full rounded-full" style={{ width: `${c.meetingRate}%`, background: AMBER }} />
                        </div>
                        <span className="text-[11px] admin-muted">{c.meetingRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* ── Recent leads ── */}
      <motion.div {...fadeUp} transition={{ delay: 0.35 }} className="admin-card overflow-hidden">
        <div className="px-5 py-4 border-b admin-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={13} className="admin-muted" />
            <span className="label-xs">Recent Leads</span>
          </div>
          <button
            onClick={() => onNavigate('crm')}
            className="text-[11px] admin-muted hover:accent-text transition-colors font-medium"
          >
            View all →
          </button>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">
            {[1,2,3].map(i => <div key={i} className="skeleton h-10 w-full" />)}
          </div>
        ) : recent.length === 0 ? (
          <div className="px-5 py-12 text-center admin-muted text-sm">No leads yet. Add your first lead in the CRM.</div>
        ) : (
          <div>
            {recent.map((lead, i) => (
              <div key={i} className="px-5 py-3.5 flex items-center justify-between gap-4 border-b admin-border last:border-0 admin-hover transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-[11px] font-bold"
                    style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                    {lead.business_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-[13px] admin-text truncate">{lead.business_name}</div>
                    <div className="text-[11px] admin-muted truncate">{lead.contact_email}</div>
                  </div>
                </div>
                <span className={`flex-shrink-0 text-[10px] font-mono px-2 py-0.5 rounded-full ${statusPill[(lead as any).outreach_status] || 'admin-muted'}`}>
                  {(lead as any).outreach_status}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

    </div>
  );
}
