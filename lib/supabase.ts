import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Lead = {
  id?: string;
  business_name: string;
  website: string;
  industry: string;
  contact_email: string;
  whatsapp_number: string;
  website_quality_score: number | null;
  mobile_responsiveness: string;
  whatsapp_integration: string;
  seo_quality: string;
  has_dashboard: boolean;
  ai_opportunity: string;
  weak_points: string;
  possible_improvements: string;
  last_contacted: string | null;
  follow_up_date: string | null;
  response_status: string;
  outreach_status: string;
  email_sent: boolean;
  reply_received: boolean;
  meeting_booked: boolean;
  linkedin_url?: string;
  twitter_handle?: string;
  generated_subject?: string;
  generated_email?: string;
  created_at?: string;
};

export type { CampaignStatus, CampaignChannel } from './constants';

export type Campaign = {
  id?: string;
  name: string;
  description: string;
  status: CampaignStatus;
  channels: CampaignChannel[];
  lead_ids: string[];
  auto_sequence: boolean;
  start_date?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type { ScheduledMessageStatus } from './constants';

export type ScheduledMessage = {
  id?: string;
  campaign_id: string;
  lead_id: string;
  channel: CampaignChannel;
  sequence_step: number;
  scheduled_at: string;
  sent_at?: string | null;
  status: ScheduledMessageStatus;
  message_body?: string | null;
  subject?: string | null;
  created_at?: string;
};
