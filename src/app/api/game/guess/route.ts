import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';
import { getNZDateString } from '@/lib/openmeteo';

export async function GET(req: NextRequest) {
  const user_id = req.nextUrl.searchParams.get('user_id');
  const date    = req.nextUrl.searchParams.get('date') ?? getNZDateString(1);
  if (!user_id) return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });

  const db = getAdminClient();
  const { data } = await db
    .from('game_guesses').select('*').eq('user_id', user_id).eq('target_date', date).maybeSingle();
  return NextResponse.json({ guess: data ?? null });
}

export async function POST(req: NextRequest) {
  const { user_id, temp_guess, rain_guess } = await req.json();
  if (!user_id || temp_guess === undefined || rain_guess === undefined)
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  if (temp_guess < 5 || temp_guess > 40)
    return NextResponse.json({ error: 'Temperature must be between 5°C and 40°C' }, { status: 400 });

  const target_date = getNZDateString(1);
  const db = getAdminClient();
  const { data, error } = await db
    .from('game_guesses')
    .insert({ user_id, temp_guess, rain_guess, target_date })
    .select().single();

  if (error) {
    if (error.code === '23505')
      return NextResponse.json({ error: 'You have already submitted a prediction for today' }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ guess: data }, { status: 201 });
}
