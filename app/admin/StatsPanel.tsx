'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Mail, CheckCircle2, Calendar, TrendingUp, Zap, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } };

export default function StatsPanel({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const [stats, setStats] = useState({ total: 0, emailSent: 0, replied: 0, meetings: 0, pending: 0 });
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
      if (!data) return;
      setStats({
        total: data.length,
        emailSent: data.filter(d => d.email_sent).length,
        replied: data.filter(d => d.reply_received).length,
        meetings: data.filter(d => d.meeting_booked).length,
        pending: data.filter(d => d.outreach_status === 'Pending').length,
      });
      setRecent(data.slice(0, 5));
    }
    load();
  }, []);

  const cards = [
    { label: 'Total Leads', value: stats.total, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Emails Sent', value: stats.emailSent, icon: Mail, color: 'text-[#00D67D]', bg: 'bg-[#00D67D]/10' },
    { label: 'Replies', value: stats.replied, icon: CheckCircle2, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Meetings Booked', value: stats.meetings, icon: Calendar, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  ];

  const statusColor: Record<string, string> = {
    Pending: 'text-yellow-400 bg-yellow-500/10',
    Sent: 'text-[#00D67D] bg-[#00D67D]/10',
    Replied: 'text-blue-400 bg-blue-500/10',
    'Meeting Booked': 'text-purple-400 bg-purple-500/10',
    'Not Interested': 'text-red-400 bg-red-500/10',
  };

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <motion.div key={i} {...fadeUp} transition={{ delay: i * 0.07 }}
            className="p-5 rounded-2xl bg-[#0A0A0A] border border-white/5">
            <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center mb-3`}>
              <c.icon size={18} className={c.color} />
            </div>
            <div className="text-2xl font-bold">{c.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{c.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <motion.button {...fadeUp} transition={{ delay: 0.3 }} onClick={() => onNavigate('crm')}
          className="group p-6 rounded-2xl bg-[#0A0A0A] border border-white/5 hover:border-[#00D67D]/30 transition-all text-left">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-[#00D67D]/10 flex items-center justify-center">
              <Users size={18} className="text-[#00D67D]" />
            </div>
            <ArrowRight size={16} className="text-slate-600 group-hover:text-[#00D67D] transition-colors" />
          </div>
          <div className="font-bold mb-1">Manage CRM Pipeline</div>
          <div className="text-xs text-slate-500">{stats.pending} leads pending outreach</div>
        </motion.button>

        <motion.button {...fadeUp} transition={{ delay: 0.35 }} onClick={() => onNavigate('generator')}
          className="group p-6 rounded-2xl bg-[#0A0A0A] border border-white/5 hover:border-blue-500/30 transition-all text-left">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Zap size={18} className="text-blue-400" />
            </div>
            <ArrowRight size={16} className="text-slate-600 group-hover:text-blue-400 transition-colors" />
          </div>
          <div className="font-bold mb-1">AI Email Generator</div>
          <div className="text-xs text-slate-500">Generate & send personalized outreach</div>
        </motion.button>
      </div>

      {/* Recent leads */}
      <motion.div {...fadeUp} transition={{ delay: 0.4 }} className="rounded-2xl bg-[#0A0A0A] border border-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-bold text-sm">Recent Leads</h3>
          <button onClick={() => onNavigate('crm')} className="text-xs text-slate-500 hover:text-[#00D67D] transition-colors">View all →</button>
        </div>
        {recent.length === 0 ? (
          <div className="px-6 py-10 text-center text-slate-600 text-sm">No leads yet. Add your first lead in the CRM.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {recent.map((lead, i) => (
              <div key={i} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{lead.business_name}</div>
                  <div className="text-xs text-slate-500 truncate">{lead.contact_email}</div>
                </div>
                <span className={`flex-shrink-0 text-[10px] font-mono px-2 py-1 rounded-md ${statusColor[lead.outreach_status] || 'text-slate-400 bg-white/5'}`}>
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
