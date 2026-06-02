import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const db = getAdminClient();
  const { data, error } = await db
    .from('game_profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ profile: data });
}

export async function POST(req: NextRequest) {
  const { nickname } = await req.json();
  if (!nickname || nickname.trim().length < 2 || nickname.trim().length > 12) {
    return NextResponse.json({ error: '昵称需 2-12 个字符' }, { status: 400 });
  }

  const db = getAdminClient();

  const { data, error } = await db
    .from('game_profiles')
    .insert({ nickname: nickname.trim() })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: '昵称已被占用，换一个试试' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await db.from('user_avatars').insert({ user_id: data.id, avatar_id: 1 });

  return NextResponse.json({ profile: data }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const { user_id, avatar_emoji, avatar_id } = await req.json();
  if (!user_id) return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });

  const db = getAdminClient();
  const update: Record<string, unknown> = {};
  if (avatar_emoji) update.avatar_emoji = avatar_emoji;
  if (avatar_id) update.avatar_id = avatar_id;

  const { data, error } = await db
    .from('game_profiles')
    .update(update)
    .eq('id', user_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data });
}
