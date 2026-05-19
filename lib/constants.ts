/**
 * Shared constants used across API routes and UI components.
 * Single source of truth for status values — prevents UI/DB mismatches.
 */

export const OUTREACH_STATUSES = ['Pending', 'Sent', 'Replied', 'Meeting Booked', 'Not Interested'] as const;
export type OutreachStatus = typeof OUTREACH_STATUSES[number];

export const RESPONSE_STATUSES = ['None', 'Positive', 'Negative', 'No Reply', 'Bounced'] as const;
export type ResponseStatus = typeof RESPONSE_STATUSES[number];

export const CAMPAIGN_STATUSES = ['draft', 'active', 'paused', 'completed'] as const;
export type CampaignStatus = typeof CAMPAIGN_STATUSES[number];

export const CAMPAIGN_CHANNELS = ['email', 'whatsapp', 'linkedin', 'twitter'] as const;
export type CampaignChannel = typeof CAMPAIGN_CHANNELS[number];

export const SCHEDULED_MESSAGE_STATUSES = ['pending', 'processing', 'sent', 'failed', 'cancelled'] as const;
export type ScheduledMessageStatus = typeof SCHEDULED_MESSAGE_STATUSES[number];
