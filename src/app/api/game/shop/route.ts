import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const user_id = req.nextUrl.searchParams.get('user_id');
  const db = getAdminClient();
  const { data: avatars } = await db.from('game_avatars').select('*').order('cost');

  if (!user_id) return NextResponse.json({ avatars: avatars ?? [], unlocked: [1] });

  const { data: unlocked } = await db
    .from('user_avatars').select('avatar_id').eq('user_id', user_id);
  return NextResponse.json({ avatars: avatars ?? [], unlocked: (unlocked ?? []).map(u => u.avatar_id) });
}

export async function POST(req: NextRequest) {
  const { user_id, avatar_id } = await req.json();
  if (!user_id || !avatar_id) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const db = getAdminClient();
  const { data: avatar } = await db.from('game_avatars').select('*').eq('id', avatar_id).single();
  if (!avatar) return NextResponse.json({ error: 'Avatar not found' }, { status: 404 });

  const { data: profile } = await db.from('game_profiles').select('score').eq('id', user_id).single();
  if (!profile) return NextResponse.json({ error: 'Player not found' }, { status: 404 });

  const { data: owned } = await db
    .from('user_avatars').select('avatar_id').eq('user_id', user_id).eq('avatar_id', avatar_id).maybeSingle();

  if (owned) {
    await db.from('game_profiles').update({ avatar_emoji: avatar.emoji }).eq('id', user_id);
    return NextResponse.json({ success: true, equipped: true });
  }

  if (profile.score < avatar.cost)
    return NextResponse.json({ error: `Not enough points — you need ${avatar.cost} pts` }, { status: 403 });

  await db.from('user_avatars').insert({ user_id, avatar_id });
  await db.from('game_profiles').update({ score: profile.score - avatar.cost, avatar_emoji: avatar.emoji }).eq('id', user_id);
  return NextResponse.json({ success: true, purchased: true });
}
