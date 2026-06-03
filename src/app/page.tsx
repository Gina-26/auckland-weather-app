import { Suspense } from 'react';
import StatCard from '@/components/ui/StatCard';
import SeasonalChart from '@/components/charts/SeasonalChart';
import YearlyTrendChart from '@/components/charts/YearlyTrendChart';
import RainfallBarChart from '@/components/charts/RainfallBarChart';
import RecentWeatherChart from '@/components/charts/RecentWeatherChart';
import { getRecentDays } from '@/lib/openmeteo';
import type { WeatherStats, MonthlyAverage, YearlyTrend } from '@/types';
import type { DayForecast } from '@/lib/openmeteo';

// Regenerate this page at most once per day
export const revalidate = 86400;

// ── Static 60-year data (from Python analysis, committed to repo) ─────────────
let stats: WeatherStats | null = null;
let monthly: MonthlyAverage | null = null;
let yearly: YearlyTrend | null = null;
try {
  stats   = require('../../public/data/stats.json')            as WeatherStats;
  monthly = require('../../public/data/monthly_averages.json') as MonthlyAverage;
  yearly  = require('../../public/data/yearly_trends.json')    as YearlyTrend;
} catch { /* data not yet generated — run data/analyze.py */ }

// ── Derived live stats from recent data ────────────────────────────────────────
function liveStats(days: DayForecast[]) {
  if (days.length === 0) return null;
  const yesterday = days[days.length - 1];
  const maxTemp   = Math.max(...days.map(d => d.maxTemp));
  const totalRain = days.reduce((s, d) => s + d.rainfall, 0);
  const rainyDays = days.filter(d => d.rainfall > 1).length;
  return { yesterday, maxTemp, totalRain: Math.round(totalRain), rainyDays };
}

export default async function DashboardPage() {
  // Live fetch — cached 24 h, auto-refreshes daily
  const recent30 = await getRecentDays(30).catch(() => [] as DayForecast[]);
  const live = liveStats(recent30);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-12">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="fade-in">
        <p className="wx-label mb-2">Climate Data Archive</p>
        <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-3" style={{ letterSpacing: '-0.03em' }}>
          Auckland Weather
        </h1>
        <p className="text-base max-w-xl" style={{ color: 'rgba(255,255,255,0.52)' }}>
          {stats
            ? `${stats.dataStartYear}–${stats.dataEndYear} · ${stats.totalDays.toLocaleString()} daily observations from the NIWA Auckland station`
            : '60 years of daily observations from the NIWA Auckland station'}
        </p>
        <hr className="wx-divider mt-6" />
      </div>

      {/* ── Live: Recent 30 days ─────────────────────────────────────── */}
      {recent30.length > 0 && (
        <section className="space-y-5">
          <div>
            <p className="wx-label mb-1">Live Data · Updates Daily</p>
            <h2 className="text-xl font-bold text-white">Recent 30 Days</h2>
          </div>

          {live && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon="🌡️" label="Yesterday High" accent="blue"
                value={`${live.yesterday.maxTemp}°C`}
                sub={`Low: ${live.yesterday.minTemp}°C`}
              />
              <StatCard
                icon="☀️" label="30-Day Peak" accent="orange"
                value={`${live.maxTemp}°C`}
                sub="highest daily max"
              />
              <StatCard
                icon="💧" label="30-Day Rainfall" accent="teal"
                value={`${live.totalRain} mm`}
                sub={`${live.rainyDays} rainy days`}
              />
              <StatCard
                icon={live.yesterday.rainfall > 1 ? '🌧' : '☀️'}
                label="Yesterday Rain" accent="green"
                value={live.yesterday.rainfall > 0 ? `${live.yesterday.rainfall} mm` : 'Dry'}
                sub={live.yesterday.rainfall > 1 ? 'Rained' : 'No rain'}
              />
            </div>
          )}

          <RecentWeatherChart data={recent30} />
        </section>
      )}

      {/* ── Historical 60-year archive ────────────────────────────────── */}
      <section className="space-y-6">
        <div>
          <p className="wx-label mb-1">Historical Archive</p>
          <h2 className="text-xl font-bold text-white">60-Year Climate Record</h2>
        </div>

        {stats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon="🌡️" label="Avg Daily High" accent="blue"
              value={`${stats.avgAnnualMaxTemp}°C`}
              sub={`Record: ${stats.allTimeMaxTemp}°C`} />
            <StatCard icon="💧" label="Annual Rainfall" accent="teal"
              value={`${stats.avgAnnualRainfall} mm`}
              sub={`Wettest: ${stats.wettestMonth}`} />
            <StatCard icon="☀️" label="Hottest Month" accent="orange"
              value={stats.hottestMonth}
              sub="Southern Hemisphere summer" />
            <StatCard icon="❄️" label="Record Low" accent="green"
              value={`${stats.allTimeMinTemp}°C`}
              sub={`Avg Low: ${stats.avgAnnualMinTemp}°C`} />
          </div>
        ) : (
          <div className="glass-card p-10 text-center">
            <p className="text-white/50 mb-2">Historical data not yet generated</p>
            <code className="text-xs text-white/30 bg-white/8 px-2 py-1 rounded">cd data && python analyze.py</code>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <Suspense fallback={<div className="skeleton h-80" />}>
            {monthly ? <SeasonalChart data={monthly} /> : <div className="skeleton h-80" />}
          </Suspense>
          <Suspense fallback={<div className="skeleton h-80" />}>
            {yearly ? <YearlyTrendChart data={yearly} /> : <div className="skeleton h-80" />}
          </Suspense>
        </div>

        <Suspense fallback={<div className="skeleton h-80" />}>
          {monthly ? <RainfallBarChart data={monthly} /> : <div className="skeleton h-80" />}
        </Suspense>
      </section>

      {/* ── Methodology ──────────────────────────────────────────────── */}
      {stats && (
        <div className="glass-card p-6 fade-in">
          <p className="wx-label mb-3">Methodology</p>
          <div className="grid sm:grid-cols-3 gap-6 text-sm" style={{ color: 'rgba(255,255,255,0.48)' }}>
            <div>
              <div className="font-semibold text-white/70 mb-1">Data Source</div>
              NIWA Auckland station — daily temperature highs, lows, and rainfall since 1962.
              Recent data fetched live via Open-Meteo Archive API.
            </div>
            <div>
              <div className="font-semibold text-white/70 mb-1">Processing</div>
              Python + Pandas for historical cleaning and aggregation.
              Recent 30-day data updates automatically every 24 hours.
            </div>
            <div>
              <div className="font-semibold text-white/70 mb-1">Seasonal Model</div>
              Fourier-feature linear regression (R²&nbsp;=&nbsp;0.76) and logistic classifier (66% accuracy) trained on 60 years of day-of-year data.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
