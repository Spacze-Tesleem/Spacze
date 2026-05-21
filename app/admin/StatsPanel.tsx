'use client';

import React, { useState, useMemo } from 'react';
import { useLeads, useCampaigns, useScheduledMessages, useWhatsAppReplies } from '@/lib/hooks';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  TrendingUp, Mail, MessageCircle, Megaphone, Users, Calendar,
  Sparkles, ArrowRight, Activity, BarChart2, Linkedin, Twitter,
  CheckCircle2, Clock, XCircle, Zap, Reply,
} from 'lucide-react';
import { Lead, Campaign, ScheduledMessage } from '@/lib/supabase';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const fu = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } };
type DateRange = '7d' | '30d' | '90d' | 'all';
const GREEN = '#00D67D'; const BLUE = '#3b82f6'; const PURPLE = '#a855f7'; const AMBER = '#f59e0b'; const SKY = '#38bdf8';

function daysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d; }
function filterByRange(date: string, range: DateRange) {
  if (range === 'all' || !date) return true;
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  return new Date(date) >= daysAgo(days);
}
function last30Labels() {
  return Array.from({ length: 30 }, (_, i) => daysAgo(29 - i).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }));
}
function last30Dates() {
  return Array.from({ length: 30 }, (_, i) => { const d = daysAgo(29 - i); d.setHours(0,0,0,0); return d; });
}

const axisBase = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#4b5563', font: { size: 10 } }, border: { display: false } },
    y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#4b5563', font: { size: 10 } }, border: { display: false } },
  },
};
const lineOpts = {
  ...axisBase,
  plugins: { legend: { display: true, position: 'top' as const, labels: { color: '#6b7280', font: { size: 10 }, padding: 12, boxWidth: 8, usePointStyle: true } } },
};
const doughnutOpts = {
  responsive: true, maintainAspectRatio: false, cutout: '70%',
  plugins: { legend: { display: true, position: 'bottom' as const, labels: { color: '#6b7280', font: { size: 10 }, padding: 10, boxWidth: 8, usePointStyle: true } } },
};

function KpiCard({ label, value, icon: Icon, accent, sub, loading }: {
  label: string; value: number | string; icon: React.ElementType;
  accent: string; sub?: string; loading: boolean;
}) {
  return (
    <motion.div {...fu} className="admin-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: accent + '18' }}>
          <Icon size={15} style={{ color: accent }} />
        </div>
        {sub && !loading && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: accent + '14', color: accent }}>{sub}</span>
        )}
      </div>
      {loading
        ? <div className="skeleton h-7 w-14 rounded-lg" />
        : <div className="text-[24px] font-bold admin-text leading-none">{value}</div>
      }
      <div className="text-[11px] admin-muted leading-tight">{label}</div>
    </motion.div>
  );
}

function ChartCard({ icon: Icon, title, height = 'h-52', children }: {
  icon: React.ElementType; title: string; height?: string; children: React.ReactNode;
}) {
  return (
    <div className="admin-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={13} className="admin-muted" />
        <span className="label-xs">{title}</span>
      </div>
      <div className={height}>{children}</div>
    </div>
  );
}

function ChartSkeleton() {
  return <div className="h-full flex items-end gap-2 pb-2">{[60,80,45,90,55,70,65,85].map((h,i) => <div key={i} className="skeleton flex-1 rounded" style={{ height: `${h}%` }} />)}</div>;
}

function ActivityItem({ icon: Icon, color, text, time }: { icon: React.ElementType; color: string; text: string; time: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b admin-border last:border-0">
      <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: color + '18' }}>
        <Icon size={11} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] admin-text leading-snug">{text}</p>
        <p className="text-[10px] admin-muted mt-0.5">{time}</p>
      </div>
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function StatsPanel({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { leads,    loading: lLoading }  = useLeads();
  const { campaigns, loading: cLoading } = useCampaigns();
  const { messages,  loading: mLoading } = useScheduledMessages();
  const { replies,   loading: rLoading } = useWhatsAppReplies();
  const loading = lLoading || cLoading || mLoading || rLoading;

  const [dateRange, setDateRange]     = useState<DateRange>('30d');
  const [selCampaign, setSelCampaign] = useState('all');

  const fMsgs = useMemo(() => messages.filter(m => {
    const inCamp = selCampaign === 'all' || m.campaign_id === selCampaign;
    return inCamp && filterByRange(m.scheduled_at, dateRange);
  }), [messages, selCampaign, dateRange]);

  const fLeads = useMemo(() => leads.filter(l => filterByRange(l.created_at || '', dateRange)), [leads, dateRange]);

  // Replies filtered to the same date range as other stats
  const fReplies = useMemo(() =>
    replies.filter(r => filterByRange(r.received_at, dateRange)),
  [replies, dateRange]);

  const stats = useMemo(() => ({
    totalLeads:   fLeads.length,
    emailSent:    fMsgs.filter(m => m.channel === 'email'    && m.status === 'sent').length,
    waSent:       fMsgs.filter(m => m.channel === 'whatsapp' && m.status === 'sent').length,
    liSent:       fMsgs.filter(m => m.channel === 'linkedin' && m.status === 'sent').length,
    twSent:       fMsgs.filter(m => m.channel === 'twitter'  && m.status === 'sent').length,
    // Use the real whatsapp_replies table count — more accurate than the boolean flag
    replied:      fReplies.length,
    meetings:     fLeads.filter(l => l.meeting_booked).length,
    activeCamps:  campaigns.filter(c => c.status === 'active').length,
    pending:      leads.filter(l => l.outreach_status === 'Pending').length,
    failed:       fMsgs.filter(m => m.status === 'failed').length,
  }), [fLeads, fMsgs, fReplies, campaigns, leads]);

  const replyRate = stats.totalLeads > 0 ? Math.round((stats.replied / stats.totalLeads) * 100) : 0;
  const meetRate  = stats.totalLeads > 0 ? Math.round((stats.meetings / stats.totalLeads) * 100) : 0;

  const funnelData = useMemo(() => ({
    labels: ['Leads', 'Emails', 'WhatsApp', 'LinkedIn', 'Twitter', 'Replies', 'Meetings'],
    datasets: [{
      label: 'Count',
      data: [stats.totalLeads, stats.emailSent, stats.waSent, stats.liSent, stats.twSent, stats.replied, stats.meetings],
      backgroundColor: [BLUE+'28', GREEN+'28', '#25D366'+'28', '#6366f1'+'28', SKY+'28', PURPLE+'28', AMBER+'28'],
      borderColor:     [BLUE, GREEN, '#25D366', '#6366f1', SKY, PURPLE, AMBER],
      borderWidth: 1.5, borderRadius: 6,
    }],
  }), [stats]);

  const channelData = useMemo(() => ({
    labels: ['Email', 'WhatsApp', 'LinkedIn', 'Twitter'],
    datasets: [{
      data: [stats.emailSent, stats.waSent, stats.liSent, stats.twSent],
      backgroundColor: [BLUE+'aa', '#25D366aa', '#6366f1aa', SKY+'aa'],
      borderColor: [BLUE, '#25D366', '#6366f1', SKY],
      borderWidth: 1.5,
    }],
  }), [stats]);

  const timelineData = useMemo(() => {
    const labels = last30Labels();
    const dates  = last30Dates();
    const count = (ch: string) => dates.map(d => {
      const next = new Date(d); next.setDate(next.getDate() + 1);
      return messages.filter(m => m.channel === ch && m.status === 'sent' && new Date(m.sent_at || m.scheduled_at) >= d && new Date(m.sent_at || m.scheduled_at) < next).length;
    });
    return {
      labels,
      datasets: [
        { label: 'Email',    data: count('email'),    borderColor: BLUE,     backgroundColor: BLUE+'12',     fill: true, tension: 0.4, pointRadius: 2, borderWidth: 1.5 },
        { label: 'WhatsApp', data: count('whatsapp'), borderColor: '#25D366',backgroundColor: '#25D36612',   fill: true, tension: 0.4, pointRadius: 2, borderWidth: 1.5 },
        { label: 'LinkedIn', data: count('linkedin'), borderColor: '#6366f1',backgroundColor: '#6366f112',   fill: true, tension: 0.4, pointRadius: 2, borderWidth: 1.5 },
        { label: 'Twitter',  data: count('twitter'),  borderColor: SKY,      backgroundColor: SKY+'12',      fill: true, tension: 0.4, pointRadius: 2, borderWidth: 1.5 },
      ],
    };
  }, [messages]);

  // Activity feed — sent/failed messages + inbound WhatsApp replies, newest first
  const activity = useMemo(() => {
    const chIcon: Record<string, React.ElementType> = { email: Mail, whatsapp: MessageCircle, linkedin: Linkedin, twitter: Twitter };
    const chColor: Record<string, string> = { email: BLUE, whatsapp: '#25D366', linkedin: '#6366f1', twitter: SKY };

    type ActivityItem = { icon: React.ElementType; color: string; text: string; time: string; _ts: number };

    const msgItems: ActivityItem[] = [...messages]
      .filter(m => m.status === 'sent' || m.status === 'failed')
      .map(m => {
        const lead  = leads.find(l => l.id === m.lead_id);
        const name  = lead?.business_name || 'Unknown lead';
        const Icon  = chIcon[m.channel] || Mail;
        const color = m.status === 'failed' ? '#ef4444' : chColor[m.channel] || BLUE;
        const text  = m.status === 'failed'
          ? `Failed to send ${m.channel} to ${name}`
          : `${m.channel.charAt(0).toUpperCase() + m.channel.slice(1)} sent to ${name} (step ${m.sequence_step})`;
        return { icon: Icon, color, text, time: timeAgo(m.sent_at || m.scheduled_at), _ts: new Date(m.sent_at || m.scheduled_at).getTime() };
      });

    const replyItems: ActivityItem[] = replies.map(r => {
      const lead = leads.find(l => l.id === r.lead_id);
      const name = lead?.business_name || r.phone;
      return {
        icon: Reply,
        color: '#25D366',
        text: `${name} replied on WhatsApp: "${r.message.slice(0, 60)}${r.message.length > 60 ? '…' : ''}"`,
        time: timeAgo(r.received_at),
        _ts: new Date(r.received_at).getTime(),
      };
    });

    return [...msgItems, ...replyItems]
      .sort((a, b) => b._ts - a._ts)
      .slice(0, 10);
  }, [messages, leads, replies]);

  const campaignStats = useMemo(() => campaigns.map(c => {
    const cMsgs  = messages.filter(m => m.campaign_id === c.id);
    const sent   = cMsgs.filter(m => m.status === 'sent').length;
    const cLeads = leads.filter(l => (c.lead_ids || []).includes(l.id!));
    const replied  = cLeads.filter(l => l.reply_received).length;
    const meetings = cLeads.filter(l => l.meeting_booked).length;
    return {
      name: c.name, status: c.status, leadCount: cLeads.length,
      sent, total: cMsgs.length,
      replyRate:   cLeads.length > 0 ? Math.round((replied  / cLeads.length) * 100) : 0,
      meetingRate: cLeads.length > 0 ? Math.round((meetings / cLeads.length) * 100) : 0,
    };
  }), [campaigns, messages, leads]);

  const campStatusPill: Record<string, string> = {
    active:    'text-[#00D67D] bg-[#00D67D]/10 border-[#00D67D]/20',
    paused:    'text-amber-400 bg-amber-400/10 border-amber-400/20',
    completed: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    draft:     'text-zinc-400 bg-zinc-400/10 border-zinc-400/20',
  };
  const leadStatusPill: Record<string, string> = {
    Pending:          'text-amber-500 bg-amber-500/10',
    Sent:             'text-emerald-500 bg-emerald-500/10',
    Replied:          'text-blue-400 bg-blue-400/10',
    'Meeting Booked': 'text-purple-400 bg-purple-400/10',
    'Not Interested': 'text-red-400 bg-red-400/10',
  };

  return (
    <div className="space-y-5 max-w-[1400px]">

      {/* Filters */}
      <motion.div {...fu} className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 p-1 rounded-xl border admin-border" style={{ background: 'var(--admin-surface-2)' }}>
          {(['7d','30d','90d','all'] as DateRange[]).map(r => (
            <button key={r} onClick={() => setDateRange(r)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${dateRange === r ? 'accent-bg accent-text font-semibold' : 'admin-muted hover:admin-text'}`}>
              {r === 'all' ? 'All time' : `Last ${r}`}
            </button>
          ))}
        </div>
        <select value={selCampaign} onChange={e => setSelCampaign(e.target.value)}
          className="admin-input border rounded-xl px-3 py-2 text-[11px] outline-none transition-colors">
          <option value="all">All Campaigns</option>
          {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </motion.div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
        <KpiCard label="Total Leads"   value={stats.totalLeads}  icon={Users}         accent={BLUE}     loading={loading} />
        <KpiCard label="Emails Sent"   value={stats.emailSent}   icon={Mail}          accent={GREEN}    loading={loading} />
        <KpiCard label="WhatsApp Sent" value={stats.waSent}      icon={MessageCircle} accent="#25D366"  loading={loading} />
        <KpiCard label="LinkedIn Sent" value={stats.liSent}      icon={Linkedin}      accent="#6366f1"  loading={loading} />
        <KpiCard label="Twitter DMs"   value={stats.twSent}      icon={Twitter}       accent={SKY}      loading={loading} />
        <KpiCard label="Replies"       value={stats.replied}     icon={TrendingUp}    accent={PURPLE}   loading={loading} sub={`${replyRate}%`} />
        <KpiCard label="Meetings"      value={stats.meetings}    icon={Calendar}      accent={AMBER}    loading={loading} sub={`${meetRate}%`} />
        <KpiCard label="Active Camps"  value={stats.activeCamps} icon={Megaphone}     accent={GREEN}    loading={loading} />
      </div>

      {/* Raw message status strip — shows unfiltered DB truth to catch mismatches */}
      {!loading && messages.length > 0 && (
        <motion.div {...fu} className="flex flex-wrap items-center gap-2 px-4 py-2.5 rounded-xl border admin-border text-[11px] font-mono"
          style={{ background: 'var(--admin-surface-2)' }}>
          <span className="admin-muted mr-1">All messages in DB:</span>
          {(['pending','processing','sent','failed','cancelled'] as const).map(s => {
            const count = messages.filter(m => m.status === s).length;
            if (count === 0) return null;
            const color: Record<string, string> = {
              pending: 'text-yellow-400', processing: 'text-blue-400',
              sent: 'text-[#00D67D]', failed: 'text-red-400', cancelled: 'text-zinc-500',
            };
            return (
              <span key={s} className={`${color[s]} px-2 py-0.5 rounded-md bg-white/5`}>
                {count} {s}
              </span>
            );
          })}
          <span className="admin-muted ml-auto">
            {(['email','whatsapp','linkedin','twitter'] as const).map(ch => {
              const count = messages.filter(m => m.channel === ch).length;
              return count > 0 ? `${count} ${ch}` : null;
            }).filter(Boolean).join(' · ')}
          </span>
        </motion.div>
      )}
      {!loading && messages.length === 0 && (
        <motion.div {...fu} className="px-4 py-2.5 rounded-xl border border-yellow-400/20 bg-yellow-400/5 text-[11px] font-mono text-yellow-400">
          No scheduled_messages rows found in DB — sends via AI Studio or WhatsApp panel are not tracked here.
        </motion.div>
      )}

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-4">
        <motion.div {...fu} transition={{ delay: 0.06 }} className="lg:col-span-2">
          <ChartCard icon={BarChart2} title="Conversion Funnel">
            {loading ? <ChartSkeleton /> : <Bar data={funnelData} options={axisBase} />}
          </ChartCard>
        </motion.div>
        <motion.div {...fu} transition={{ delay: 0.1 }}>
          <ChartCard icon={Activity} title="Channel Mix">
            {loading ? <ChartSkeleton /> : <Doughnut data={channelData} options={doughnutOpts} />}
          </ChartCard>
        </motion.div>
      </div>

      {/* Timeline */}
      <motion.div {...fu} transition={{ delay: 0.14 }}>
        <ChartCard icon={TrendingUp} title="Messages Sent — Last 30 Days" height="h-48">
          {loading ? <ChartSkeleton /> : <Line data={timelineData} options={lineOpts} />}
        </ChartCard>
      </motion.div>

      {/* Activity + Quick actions */}
      <div className="grid lg:grid-cols-3 gap-4">

        {/* Activity feed */}
        <motion.div {...fu} transition={{ delay: 0.18 }} className="lg:col-span-2 admin-card overflow-hidden">
          <div className="px-5 py-4 border-b admin-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={13} className="admin-muted" />
              <span className="label-xs">Activity Feed</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono admin-muted">
              <span className="flex items-center gap-1"><CheckCircle2 size={10} className="text-[#00D67D]" /> {fMsgs.filter(m=>m.status==='sent').length} sent</span>
              <span className="flex items-center gap-1"><Clock size={10} className="text-amber-400" /> {fMsgs.filter(m=>m.status==='pending').length} pending</span>
              <span className="flex items-center gap-1"><XCircle size={10} className="text-red-400" /> {stats.failed} failed</span>
            </div>
          </div>
          <div className="px-5 py-1 max-h-64 overflow-y-auto">
            {loading ? (
              <div className="py-4 space-y-3">{[1,2,3,4].map(i => <div key={i} className="skeleton h-8 w-full rounded-lg" />)}</div>
            ) : activity.length === 0 ? (
              <div className="py-10 text-center admin-muted text-sm">No activity yet. Activate a campaign to start sending.</div>
            ) : (
              activity.map((a, i) => <ActivityItem key={i} {...a} />)
            )}
          </div>
        </motion.div>

        {/* Quick actions */}
        <motion.div {...fu} transition={{ delay: 0.22 }} className="flex flex-col gap-3">
          {[
            { tab: 'audience',  icon: Users,         accent: GREEN,     title: 'Audience',   sub: `${stats.pending} pending` },
            { tab: 'campaigns', icon: Sparkles,      accent: BLUE,      title: 'Campaigns',  sub: 'Sequences & scheduling' },
            { tab: 'whatsapp',  icon: MessageCircle, accent: '#25D366', title: 'WhatsApp',   sub: 'Bulk messaging' },
          ].map(({ tab, icon: Icon, accent, title, sub }) => (
            <button key={tab} onClick={() => onNavigate(tab)}
              className="admin-card p-4 text-left flex items-center justify-between gap-3 admin-hover transition-all hover:-translate-y-0.5 group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: accent + '18' }}>
                  <Icon size={14} style={{ color: accent }} />
                </div>
                <div>
                  <div className="font-semibold text-[12px] admin-text">{title}</div>
                  <div className="text-[10px] admin-muted">{sub}</div>
                </div>
              </div>
              <ArrowRight size={13} className="admin-subtle flex-shrink-0" />
            </button>
          ))}
        </motion.div>
      </div>

      {/* Campaign performance table */}
      <motion.div {...fu} transition={{ delay: 0.26 }} className="admin-card overflow-hidden">
        <div className="px-5 py-4 border-b admin-border flex items-center gap-2">
          <Megaphone size={13} className="admin-muted" />
          <span className="label-xs">Campaign Performance</span>
        </div>
        {campaignStats.length === 0 ? (
          <div className="px-5 py-10 text-center admin-muted text-sm">No campaigns yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b admin-border">
                  {['Campaign','Status','Leads','Sent','Reply Rate','Meeting Rate'].map(h => (
                    <th key={h} className="text-left px-5 py-3 label-xs whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaignStats.map((c, i) => (
                  <tr key={i} className="border-b admin-border last:border-0 admin-hover transition-colors">
                    <td className="px-5 py-3 font-medium text-[13px] admin-text">{c.name}</td>
                    <td className="px-5 py-3">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${campStatusPill[c.status] || campStatusPill.draft}`}>{c.status}</span>
                    </td>
                    <td className="px-5 py-3 admin-muted text-[12px]">{c.leadCount}</td>
                    <td className="px-5 py-3 admin-muted text-[12px]">{c.sent}/{c.total}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-14 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--admin-surface-3)' }}>
                          <div className="h-full rounded-full" style={{ width: `${c.replyRate}%`, background: PURPLE }} />
                        </div>
                        <span className="text-[11px] admin-muted">{c.replyRate}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-14 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--admin-surface-3)' }}>
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

      {/* Recent leads */}
      <motion.div {...fu} transition={{ delay: 0.3 }} className="admin-card overflow-hidden">
        <div className="px-5 py-4 border-b admin-border flex items-center justify-between">
          <div className="flex items-center gap-2"><Users size={13} className="admin-muted" /><span className="label-xs">Recent Leads</span></div>
          <button onClick={() => onNavigate('audience')} className="text-[11px] admin-muted hover:accent-text transition-colors">View all →</button>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-10 w-full rounded-lg" />)}</div>
        ) : leads.slice(0,5).length === 0 ? (
          <div className="px-5 py-10 text-center admin-muted text-sm">No leads yet.</div>
        ) : (
          <div>
            {leads.slice(0,5).map((lead, i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between gap-4 border-b admin-border last:border-0 admin-hover transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-[11px] font-bold"
                    style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                    {lead.business_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-[12px] admin-text truncate">{lead.business_name}</div>
                    <div className="text-[10px] admin-muted truncate">{lead.contact_email || lead.industry || '—'}</div>
                  </div>
                </div>
                <span className={`flex-shrink-0 text-[10px] font-mono px-2 py-0.5 rounded-full ${leadStatusPill[lead.outreach_status] || 'admin-muted bg-white/5'}`}>
                  {lead.outreach_status || 'Pending'}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

    </div>
  );
}
