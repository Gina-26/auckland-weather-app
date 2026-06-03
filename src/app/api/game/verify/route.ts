import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';
import { getHistoricalDay, getNZDateString } from '@/lib/openmeteo';
import { authoriseRequest } from '@/lib/auth';

function calcPoints(
  tempGuess: number, actualTemp: number,
  rainGuess: boolean, actualRain: boolean,
) {
  const diff = Math.abs(tempGuess - actualTemp);
  const tempPoints  = diff <= 1 ? 20 : diff <= 2 ? 10 : diff <= 3 ? 5 : 0;
  const rainPoints  = rainGuess === actualRain ? 10 : 0;
  const bonusPoints = tempPoints >= 10 && rainPoints > 0 ? 5 : 0;
  return { tempPoints, rainPoints, bonusPoints };
}

export async function POST(req: NextRequest) {
  const { user_id } = await req.json();
  if (!user_id) return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
  if (!authoriseRequest(req, user_id))
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const db    = getAdminClient();
  const today = getNZDateString(0);

  const { data: guesses } = await db
    .from('game_guesses')
    .select('*')
    .eq('user_id', user_id)
    .eq('is_verified', false)
    .lt('target_date', today)
    .order('target_date', { ascending: true })
    .limit(10);

  if (!guesses || guesses.length === 0)
    return NextResponse.json({ verified: 0, results: [] });

  const results = [];
  let totalPoints = 0;
  let correctCount = 0;

  for (const guess of guesses) {
    const actual = await getHistoricalDay(guess.target_date);
    if (!actual) continue;

    const actualRain = actual.rainfall > 1;
    const { tempPoints, rainPoints, bonusPoints } = calcPoints(
      Number(guess.temp_guess), actual.maxTemp, Boolean(guess.rain_guess), actualRain,
    );
    const earned = tempPoints + rainPoints + bonusPoints;

    await db.from('game_guesses').update({
      actual_temp: actual.maxTemp, actual_rain: actualRain,
      temp_points: tempPoints, rain_points: rainPoints, bonus_points: bonusPoints,
      is_verified: true,
    }).eq('id', guess.id);

    totalPoints += earned;
    if (earned > 0) correctCount++;
    results.push({ date: guess.target_date, points: earned });
  }

  if (guesses.length > 0) {
    const { data: profile } = await db
      .from('game_profiles')
      .select('score, total_guesses, correct_guesses')
      .eq('id', user_id).single();

    if (profile) {
      await db.from('game_profiles').update({
        score:           profile.score + totalPoints,
        total_guesses:   profile.total_guesses + guesses.length,
        correct_guesses: profile.correct_guesses + correctCount,
      }).eq('id', user_id);
    }
  }

  return NextResponse.json({ verified: results.length, results, totalPoints });
}
