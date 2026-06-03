const LAT = -36.8509;
const LON = 174.7645;
const TZ = 'Pacific%2FAuckland';

export interface DayForecast {
  date: string;
  maxTemp: number;
  minTemp: number;
  rainfall: number;
}

export async function getForecast(): Promise<DayForecast[]> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=${TZ}&forecast_days=7`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error('Failed to fetch forecast');
  const data = await res.json();
  return (data.daily.time as string[]).map((date, i) => ({
    date,
    maxTemp: Math.round((data.daily.temperature_2m_max[i] ?? 0) * 10) / 10,
    minTemp: Math.round((data.daily.temperature_2m_min[i] ?? 0) * 10) / 10,
    rainfall: Math.round((data.daily.precipitation_sum[i] ?? 0) * 10) / 10,
  }));
}

export async function getHistoricalDay(date: string): Promise<DayForecast | null> {
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${LAT}&longitude=${LON}&start_date=${date}&end_date=${date}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=${TZ}`;
  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.daily?.time?.[0]) return null;
  return {
    date: data.daily.time[0],
    maxTemp: data.daily.temperature_2m_max[0] ?? 0,
    minTemp: data.daily.temperature_2m_min[0] ?? 0,
    rainfall: data.daily.precipitation_sum[0] ?? 0,
  };
}

/** Fetch the last `days` days of archive data (ends yesterday). */
export async function getRecentDays(days: number): Promise<DayForecast[]> {
  const end   = getNZDateString(-1);   // yesterday — archive is always available
  const start = getNZDateString(-days);
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${LAT}&longitude=${LON}&start_date=${start}&end_date=${end}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=${TZ}`;
  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) return [];
  const data = await res.json();
  if (!data.daily?.time) return [];
  return (data.daily.time as string[]).map((date, i) => ({
    date,
    maxTemp: Math.round((data.daily.temperature_2m_max[i] ?? 0) * 10) / 10,
    minTemp: Math.round((data.daily.temperature_2m_min[i] ?? 0) * 10) / 10,
    rainfall: Math.round((data.daily.precipitation_sum[i] ?? 0) * 10) / 10,
  }));
}

export function getNZDateString(offsetDays = 0): string {
  const nzStr = new Date().toLocaleString('en-CA', {
    timeZone: 'Pacific/Auckland', year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const d = new Date(nzStr);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}
