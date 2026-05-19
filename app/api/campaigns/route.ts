import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// GET /api/campaigns
export async function GET() {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false });

  // Return empty array if table doesn't exist yet (Supabase error code 42P01)
  if (error) {
    if (error.code === '42P01') return NextResponse.json([]);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}

// POST /api/campaigns
export async function POST(req: NextRequest) {
  const db = getSupabaseAdmin();
  const body = await req.json();
  const now = new Date().toISOString();

  const { data, error } = await db
    .from('campaigns')
    .insert([{ ...body, created_at: now, updated_at: now }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// PUT /api/campaigns?id=<uuid>
export async function PUT(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const db = getSupabaseAdmin();
  const body = await req.json();
  const { data, error } = await db
    .from('campaigns')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/campaigns?id=<uuid>
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const db = getSupabaseAdmin();
  // Also delete associated scheduled messages
  await db.from('scheduled_messages').delete().eq('campaign_id', id);
  const { error } = await db.from('campaigns').delete().eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
