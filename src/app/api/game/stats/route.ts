import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const user_id = req.nextUrl.searchParams.get('user_id');
  if (!user_id) return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });

  const db = getAdminClient();
  const { data: guesses } = await db
    .from('game_guesses')
    .select('rain_points, temp_points, temp_guess, actual_temp')
    .eq('user_id', user_id)
    .eq('is_verified', true);

  if (!guesses || guesses.length === 0)
    return NextResponse.json({ total: 0, rain_accuracy: null, avg_temp_diff: null });

  const total = guesses.length;

  // Rain: rain_points is 10 when correct, 0 when wrong
  const rainCorrect = guesses.filter(g => Number(g.rain_points) > 0).length;

  // Temperature: average absolute difference
  const diffs = guesses
    .filter(g => g.actual_temp !== null)
    .map(g => Math.abs(Number(g.temp_guess) - Number(g.actual_temp)));
  const avgTempDiff = diffs.length > 0
    ? Math.round(diffs.reduce((s, d) => s + d, 0) / diffs.length * 10) / 10
    : null;

  return NextResponse.json({
    total,
    rain_correct: rainCorrect,
    rain_accuracy: Math.round((rainCorrect / total) * 1000) / 10,
    avg_temp_diff: avgTempDiff,
  });
}
