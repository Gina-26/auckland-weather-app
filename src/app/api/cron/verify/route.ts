import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';
import { getHistoricalDay, getNZDateString } from '@/lib/openmeteo';

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

export async function GET(req: NextRequest) {
  // Allow Vercel cron scheduler OR a manual bearer token for testing
  const isVercelCron = req.headers.get('x-vercel-cron') === '1';
  const secret = process.env.CRON_SECRET ?? '';
  const auth = req.headers.get('authorization') ?? '';
  if (!isVercelCron && (!secret || auth !== `Bearer ${secret}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db    = getAdminClient();
  const today = getNZDateString(0);

  // 1 — fetch every unverified guess whose target date has passed
  const { data: guesses, error } = await db
    .from('game_guesses')
    .select('id, user_id, target_date, temp_guess, rain_guess')
    .eq('is_verified', false)
    .lt('target_date', today)
    .order('target_date', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!guesses || guesses.length === 0)
    return NextResponse.json({ verified: 0, message: 'Nothing to verify' });

  // 2 — deduplicate dates and fetch actual weather once per date
  const uniqueDates = [...new Set(guesses.map(g => g.target_date))] as string[];
  const weatherCache = new Map<string, Awaited<ReturnType<typeof getHistoricalDay>>>();
  await Promise.all(
    uniqueDates.map(async date => {
      const w = await getHistoricalDay(date);
      weatherCache.set(date, w);
    }),
  );

  // 3 — score each guess; accumulate per-user deltas
  type UserDelta = { points: number; total: number; correct: number };
  const userDeltas = new Map<string, UserDelta>();
  let verifiedCount = 0;

  for (const guess of guesses) {
    const actual = weatherCache.get(guess.target_date);
    if (!actual) continue; // archive not yet available — skip, retry tomorrow

    const actualRain = actual.rainfall > 1;
    const { tempPoints, rainPoints, bonusPoints } = calcPoints(
      Number(guess.temp_guess), actual.maxTemp,
      Boolean(guess.rain_guess), actualRain,
    );
    const earned = tempPoints + rainPoints + bonusPoints;

    await db.from('game_guesses').update({
      actual_temp:  actual.maxTemp,
      actual_rain:  actualRain,
      temp_points:  tempPoints,
      rain_points:  rainPoints,
      bonus_points: bonusPoints,
      is_verified:  true,
    }).eq('id', guess.id);

    const uid = guess.user_id as string;
    const prev = userDeltas.get(uid) ?? { points: 0, total: 0, correct: 0 };
    userDeltas.set(uid, {
      points:  prev.points + earned,
      total:   prev.total + 1,
      correct: prev.correct + (earned > 0 ? 1 : 0),
    });
    verifiedCount++;
  }

  // 4 — update each player's profile atomically
  for (const [uid, delta] of userDeltas) {
    const { data: p } = await db
      .from('game_profiles')
      .select('score, total_guesses, correct_guesses')
      .eq('id', uid)
      .single();
    if (!p) continue;
    await db.from('game_profiles').update({
      score:           p.score + delta.points,
      total_guesses:   p.total_guesses + delta.total,
      correct_guesses: p.correct_guesses + delta.correct,
    }).eq('id', uid);
  }

  return NextResponse.json({
    verified: verifiedCount,
    players:  userDeltas.size,
    dates:    uniqueDates,
  });
}
