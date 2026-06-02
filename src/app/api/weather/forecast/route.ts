import { NextResponse } from 'next/server';
import { getForecast } from '@/lib/openmeteo';

export async function GET() {
  try {
    const days = await getForecast();
    return NextResponse.json({ days }, { headers: { 'Cache-Control': 'public, s-maxage=3600' } });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch forecast' }, { status: 500 });
  }
}
