import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';
import { authoriseRequest } from '@/lib/auth';

const AVATAR_COPY: Record<number, { name: string; description: string }> = {
  1: { name: 'Partly Cloudy',  description: "The default — just like Auckland's ever-changing skies." },
  2: { name: 'Overcast',       description: 'Clouds thickening, but light still breaking through.' },
  3: { name: 'Light Rain',     description: "Auckland's signature drizzle — a walk in the rain." },
  4: { name: 'Thunderstorm',   description: 'Wind, rain, and drama — a wild Auckland night.' },
  5: { name: 'Rainbow',        description: 'After every storm, colour stretches across the sky.' },
  6: { name: 'Ocean Swell',    description: 'The Tasman Sea in full force — wild and vast.' },
  7: { name: 'Volcano',        description: 'North Island geothermal legend, forged over millennia.' },
  8: { name: 'Star',           description: 'The brightest light in the night sky.' },
  9: { name: 'Unicorn',        description: "Legendary. Rare. Yours if you're dedicated enough." },
};

function withEnglishCopy(avatar: Record<string, unknown>) {
  const copy = AVATAR_COPY[avatar.id as number];
  return copy ? { ...avatar, ...copy } : avatar;
}

export async function GET(req: NextRequest) {
  const user_id = req.nextUrl.searchParams.get('user_id');
  const db = getAdminClient();
  const { data: avatars } = await db.from('game_avatars').select('*').order('cost');
  const translated = (avatars ?? []).map(withEnglishCopy);

  if (!user_id) return NextResponse.json({ avatars: translated, unlocked: [1] });

  const { data: unlocked } = await db
    .from('user_avatars').select('avatar_id').eq('user_id', user_id);
  return NextResponse.json({ avatars: translated, unlocked: (unlocked ?? []).map(u => u.avatar_id) });
}

export async function POST(req: NextRequest) {
  const { user_id, avatar_id } = await req.json();
  if (!user_id || !avatar_id) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  if (!authoriseRequest(req, user_id))
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

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
