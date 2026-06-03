import { Suspense } from 'react';
import StatCard from '@/components/ui/StatCard';
import SeasonalChart from '@/components/charts/SeasonalChart';
import YearlyTrendChart from '@/components/charts/YearlyTrendChart';
import RainfallBarChart from '@/components/charts/RainfallBarChart';
import RecentWeatherChart from '@/components/charts/RecentWeatherChart';
import { getRecentDays } from '@/lib/openmeteo';
import { supabase } from '@/lib/supabase';
import type { WeatherStats, MonthlyAverage, YearlyTrend } from '@/types';
import type { DayForecast } from '@/lib/openmeteo';

export const revalidate = 3600; // Refresh every hour (community stats need to stay fresh)

// ── Static 60-year data ───────────────────────────────────────────────────────
let stats: WeatherStats | null = null;
let monthly: MonthlyAverage | null = null;
let yearly: YearlyTrend | null = null;
try {
  stats   = require('../../public/data/stats.json')            as WeatherStats;
  monthly = require('../../public/data/monthly_averages.json') as MonthlyAverage;
  yearly  = require('../../public/data/yearly_trends.json')    as YearlyTrend;
} catch { /* run data/analyze.py */ }

// ── AI model constants (from model.json) ────────────────────────────────────
const AI_RAIN_ACC  = 66.2; // logistic regression accuracy on held-out data
const AI_TEMP_RMSE = 2.3;  // approximate, derived from R² = 0.76 on seasonal model

// ── Helpers ──────────────────────────────────────────────────────────────────
function liveStats(days: DayForecast[]) {
  if (!days.length) return null;
  const yesterday = days[days.length - 1];
  return {
    yesterday,
    maxTemp:   Math.max(...days.map(d => d.maxTemp)),
    totalRain: Math.round(days.reduce((s, d) => s + d.rainfall, 0)),
    rainyDays: days.filter(d => d.rainfall > 1).length,
  };
}

function AccBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-2 w-full rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(pct, 100)}%`, background: color }}
      />
    </div>
  );
}

export default async function DashboardPage() {
  // Live data (both fetches run in parallel, cached 1 h)
  const [recent30, playerRows] = await Promise.all([
    getRecentDays(30).catch(() => [] as DayForecast[]),
    supabase
      .from('game_profiles')
      .select('nickname, avatar_emoji, score, correct_guesses, total_guesses')
      .gt('total_guesses', 3)
      .order('score', { ascending: false })
      .limit(100)
      .then(r => r.data ?? []),
  ]);

  const live = liveStats(recent30);

  // Community vs AI stats
  const activePlayers = playerRows.filter(p => p.total_guesses > 3);
  const communityStats = activePlayers.length > 0 ? (() => {
    const accs = activePlayers.map(p =>
      Math.round((p.correct_guesses / p.total_guesses) * 1000) / 10,
    );
    const avg = Math.round(accs.reduce((s, a) => s + a, 0) / accs.length * 10) / 10;
    const beating = accs.filter(a => a > AI_RAIN_ACC).length;
    const top = activePlayers[0];
    const topAcc = accs[0];
    return { avg, beating, total: activePlayers.length, top, topAcc };
  })() : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-12">

      {/* ── Hero ── */}
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

      {/* ── Live: Recent 30 days ── */}
      {recent30.length > 0 && (
        <section className="space-y-5">
          <div>
            <p className="wx-label mb-1">Live Archive · Open-Meteo ERA5 · Updates Daily</p>
            <h2 className="text-xl font-bold text-white">Recent 30 Days</h2>
          </div>
          {live && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon="🌡️" label="Yesterday High" accent="blue"
                value={`${live.yesterday.maxTemp}°C`}
                sub={`Low: ${live.yesterday.minTemp}°C`} />
              <StatCard icon="☀️" label="30-Day Peak" accent="orange"
                value={`${live.maxTemp}°C`} sub="highest daily max" />
              <StatCard icon="💧" label="30-Day Rainfall" accent="teal"
                value={`${live.totalRain} mm`} sub={`${live.rainyDays} rainy days`} />
              <StatCard
                icon={live.yesterday.rainfall > 1 ? '🌧' : '☀️'}
                label="Yesterday Rain" accent="green"
                value={live.yesterday.rainfall > 0 ? `${live.yesterday.rainfall} mm` : 'Dry'}
                sub={live.yesterday.rainfall > 1 ? 'Rained' : 'No rain'} />
            </div>
          )}
          <RecentWeatherChart data={recent30} />
        </section>
      )}

      {/* ── Human vs AI Challenge ── */}
      {communityStats && (
        <section className="fade-in">
          <div className="mb-4">
            <p className="wx-label mb-1">Challenge</p>
            <h2 className="text-xl font-bold text-white">Human vs AI</h2>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
              Can players out-predict a machine learning seasonal model?
            </p>
          </div>

          <div className="glass-card p-6">
            <div className="grid md:grid-cols-2 gap-8">

              {/* Left: accuracy bars */}
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between items-baseline mb-1.5">
                    <span className="text-sm font-semibold text-white">Community accuracy</span>
                    <span
                      className="text-lg font-bold"
                      style={{ color: communityStats.avg > AI_RAIN_ACC ? '#54bb51' : '#fcac28' }}
                    >
                      {communityStats.avg}%
                      <span className="text-xs font-normal ml-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {communityStats.avg > AI_RAIN_ACC
                          ? `↑ +${(communityStats.avg - AI_RAIN_ACC).toFixed(1)}%`
                          : `↓ −${(AI_RAIN_ACC - communityStats.avg).toFixed(1)}%`}
                      </span>
                    </span>
                  </div>
                  <AccBar pct={communityStats.avg} color={communityStats.avg > AI_RAIN_ACC ? '#54bb51' : '#fcac28'} />
                </div>

                <div>
                  <div className="flex justify-between items-baseline mb-1.5">
                    <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      AI model baseline
                    </span>
                    <span className="text-lg font-bold" style={{ color: '#7599ff' }}>{AI_RAIN_ACC}%</span>
                  </div>
                  <AccBar pct={AI_RAIN_ACC} color="#7599ff" />
                </div>

                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Player accuracy = predictions where any points were earned.
                  AI baseline = logistic regression rain-prediction accuracy (66.2%).
                </p>
              </div>

              {/* Right: leaderboard snapshot */}
              <div>
                <p className="wx-label mb-3">
                  {communityStats.beating} of {communityStats.total} players beating the AI
                </p>
                <div className="space-y-2">
                  {activePlayers.slice(0, 5).map((p, i) => {
                    const acc = Math.round((p.correct_guesses / p.total_guesses) * 1000) / 10;
                    const ahead = acc > AI_RAIN_ACC;
                    return (
                      <div key={p.nickname} className="flex items-center gap-3">
                        <span className="text-sm w-5 text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>
                          {i + 1}
                        </span>
                        <span className="text-lg">{p.avatar_emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-white truncate">{p.nickname}</span>
                            {ahead
                              ? <span className="text-xs" style={{ color: '#54bb51' }}>▲ AI</span>
                              : <span className="text-xs" style={{ color: '#fcac28' }}>▼ AI</span>}
                          </div>
                          <div className="h-1.5 mt-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', width: '100%' }}>
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${Math.min(acc, 100)}%`, background: ahead ? '#54bb51' : '#fcac28' }}
                            />
                          </div>
                        </div>
                        <span className="text-xs font-bold w-10 text-right" style={{ color: ahead ? '#54bb51' : 'rgba(255,255,255,0.5)' }}>
                          {acc}%
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    Temp model R² = 0.76 · Rain classifier = 66.2% · Data: ERA5 reanalysis (not predicted)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Historical 60-year archive ── */}
      <section className="space-y-6">
        <div>
          <p className="wx-label mb-1">Historical Archive</p>
          <h2 className="text-xl font-bold text-white">60-Year Climate Record</h2>
        </div>
        {stats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon="🌡️" label="Avg Daily High" accent="blue"
              value={`${stats.avgAnnualMaxTemp}°C`} sub={`Record: ${stats.allTimeMaxTemp}°C`} />
            <StatCard icon="💧" label="Annual Rainfall" accent="teal"
              value={`${stats.avgAnnualRainfall} mm`} sub={`Wettest: ${stats.wettestMonth}`} />
            <StatCard icon="☀️" label="Hottest Month" accent="orange"
              value={stats.hottestMonth} sub="Southern Hemisphere summer" />
            <StatCard icon="❄️" label="Record Low" accent="green"
              value={`${stats.allTimeMinTemp}°C`} sub={`Avg Low: ${stats.avgAnnualMinTemp}°C`} />
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

      {/* ── Methodology ── */}
      {stats && (
        <div className="glass-card p-6 fade-in">
          <p className="wx-label mb-3">Methodology</p>
          <div className="grid sm:grid-cols-3 gap-6 text-sm" style={{ color: 'rgba(255,255,255,0.48)' }}>
            <div>
              <div className="font-semibold text-white/70 mb-1">Data Source</div>
              NIWA Auckland station (historical). Recent data via Open-Meteo ERA5 reanalysis —
              actual observations from weather stations, satellites, and radiosondes. Not predictions.
            </div>
            <div>
              <div className="font-semibold text-white/70 mb-1">Processing</div>
              Python + Pandas for historical cleaning. Recent 30-day data fetches automatically
              every hour. Game scoring uses archive API only, never forecast data.
            </div>
            <div>
              <div className="font-semibold text-white/70 mb-1">Seasonal Model</div>
              Fourier-feature linear regression (R²&nbsp;=&nbsp;0.76) and logistic rain classifier
              (66.2% accuracy) trained on 60 years of day-of-year data.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
