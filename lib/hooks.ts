'use client';

/**
 * Shared data-fetching hooks for admin panels.
 *
 * Each hook fetches once on mount and exposes a `refresh` callback.
 * Panels that previously fetched independently can share these hooks
 * to avoid redundant network requests when multiple panels are mounted.
 */

import { useState, useEffect, useCallback } from 'react';
import { Lead, Campaign, ScheduledMessage } from './supabase';

// ── useLeads ──────────────────────────────────────────────────────────────────

export function useLeads() {
  const [leads, setLeads]     = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch('/api/leads');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch leads');
      setLeads(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { leads, loading, error, refresh };
}

// ── useCampaigns ──────────────────────────────────────────────────────────────

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch('/api/campaigns');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch campaigns');
      setCampaigns(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { campaigns, loading, error, refresh };
}

// ── useScheduledMessages ──────────────────────────────────────────────────────

export function useScheduledMessages(campaignId?: string) {
  const [messages, setMessages] = useState<ScheduledMessage[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url  = campaignId ? `/api/scheduled-messages?campaign_id=${campaignId}` : '/api/scheduled-messages';
      const res  = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch messages');
      setMessages(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { messages, loading, error, refresh };
}
