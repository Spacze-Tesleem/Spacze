import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// GET /api/scheduled-messages?campaign_id=<uuid>
export async function GET(req: NextRequest) {
  const campaignId = req.nextUrl.searchParams.get('campaign_id');
  const db = getSupabaseAdmin();

  let query = db
    .from('scheduled_messages')
    .select('*')
    .order('scheduled_at', { ascending: true });

  if (campaignId) {
    query = query.eq('campaign_id', campaignId);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/scheduled-messages — bulk insert (used when activating a campaign)
export async function POST(req: NextRequest) {
  const db = getSupabaseAdmin();
  const body = await req.json();

  // body can be a single object or an array
  const rows = Array.isArray(body) ? body : [body];
  const { data, error } = await db
    .from('scheduled_messages')
    .insert(rows)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// PUT /api/scheduled-messages?id=<uuid> — update a single message (e.g. cancel)
export async function PUT(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const db = getSupabaseAdmin();
  const body = await req.json();
  const { data, error } = await db
    .from('scheduled_messages')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
