import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';

export async function GET() {
  const db = getAdminClient();
  const { data, error } = await db
    .from('game_profiles')
    .select('nickname, avatar_emoji, score, total_guesses, correct_guesses')
    .order('score', { ascending: false })
    .limit(10);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ leaderboard: data ?? [] }, {
    headers: { 'Cache-Control': 'public, s-maxage=60' },
  });
}
