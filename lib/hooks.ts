'use client';

/**
 * Shared data-fetching hooks backed by SWR.
 *
 * SWR deduplicates requests across panels — switching tabs reuses the cache
 * instead of firing a new network request. Mutations call `mutate()` to
 * revalidate all consumers of the same key simultaneously.
 */

import useSWR from 'swr';
import { Lead, Campaign, ScheduledMessage } from './supabase';

export type WhatsAppReply = {
  id: string;
  lead_id: string | null;
  phone: string;
  message: string;
  direction: 'inbound' | 'outbound';
  received_at: string;
  created_at: string;
};

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    return res.json();
  });

// ── useLeads ──────────────────────────────────────────────────────────────────

export function useLeads() {
  const { data, error, isLoading, mutate } = useSWR<Lead[]>('/api/leads', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });

  return {
    leads: data ?? [],
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refresh: mutate,
  };
}

// ── useCampaigns ──────────────────────────────────────────────────────────────

export function useCampaigns() {
  const { data, error, isLoading, mutate } = useSWR<Campaign[]>('/api/campaigns', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });

  return {
    campaigns: data ?? [],
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refresh: mutate,
  };
}

// ── useScheduledMessages ──────────────────────────────────────────────────────

export function useScheduledMessages(campaignId?: string) {
  const url = campaignId
    ? `/api/scheduled-messages?campaign_id=${campaignId}`
    : '/api/scheduled-messages';

  const { data, error, isLoading, mutate } = useSWR<ScheduledMessage[]>(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });

  return {
    messages: data ?? [],
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refresh: mutate,
  };
}

// ── useWhatsAppReplies ────────────────────────────────────────────────────────
// Fetches all inbound WhatsApp replies, optionally filtered to a set of lead IDs.
// Polls every 30s so the dashboard stays fresh without a manual refresh.

export function useWhatsAppReplies(leadIds?: string[]) {
  const url = leadIds?.length
    ? `/api/whatsapp-replies?lead_ids=${leadIds.join(',')}`
    : '/api/whatsapp-replies';

  const { data, error, isLoading, mutate } = useSWR<WhatsAppReply[]>(url, fetcher, {
    revalidateOnFocus: true,
    refreshInterval: 30_000,
    dedupingInterval: 10_000,
  });

  return {
    replies: data ?? [],
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refresh: mutate,
  };
}
