import { Suspense } from 'react';
import StatCard from '@/components/ui/StatCard';
import SeasonalChart from '@/components/charts/SeasonalChart';
import YearlyTrendChart from '@/components/charts/YearlyTrendChart';
import RainfallBarChart from '@/components/charts/RainfallBarChart';
import type { WeatherStats, MonthlyAverage, YearlyTrend } from '@/types';

let stats: WeatherStats | null = null;
let monthly: MonthlyAverage | null = null;
let yearly: YearlyTrend | null = null;

try {
  stats  = require('../../public/data/stats.json')            as WeatherStats;
  monthly = require('../../public/data/monthly_averages.json') as MonthlyAverage;
  yearly  = require('../../public/data/yearly_trends.json')    as YearlyTrend;
} catch { /* data not yet generated */ }

export default function DashboardPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">

      {/* ── Hero ── */}
      <div className="fade-in">
        <p className="wx-label mb-2">Climate Data Archive</p>
        <h1
          className="text-4xl md:text-5xl font-bold leading-tight mb-3"
          style={{ letterSpacing: '-0.03em' }}
        >
          Auckland Weather
        </h1>
        <p className="text-base max-w-xl" style={{ color: 'rgba(255,255,255,0.52)' }}>
          {stats
            ? `${stats.dataStartYear}–${stats.dataEndYear} · ${stats.totalDays.toLocaleString()} daily observations from the NIWA Auckland station`
            : '60 years of daily observations from the NIWA Auckland station'}
        </p>
        <hr className="wx-divider mt-6" />
      </div>

      {/* ── Stats ── */}
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
          <p className="text-white/50 mb-2">Data not yet generated</p>
          <code className="text-xs text-white/30 bg-white/8 px-2 py-1 rounded">cd data && python analyze.py</code>
        </div>
      )}

      {/* ── Charts row ── */}
      <div className="grid md:grid-cols-2 gap-6">
        <Suspense fallback={<div className="skeleton h-80" />}>
          {monthly ? <SeasonalChart data={monthly} /> : <div className="skeleton h-80" />}
        </Suspense>
        <Suspense fallback={<div className="skeleton h-80" />}>
          {yearly ? <YearlyTrendChart data={yearly} /> : <div className="skeleton h-80" />}
        </Suspense>
      </div>

      {/* ── Rainfall chart ── */}
      <Suspense fallback={<div className="skeleton h-80" />}>
        {monthly ? <RainfallBarChart data={monthly} /> : <div className="skeleton h-80" />}
      </Suspense>

      {/* ── Data note ── */}
      {stats && (
        <div className="glass-card p-6 fade-in">
          <p className="wx-label mb-3">Methodology</p>
          <div className="grid sm:grid-cols-3 gap-6 text-sm" style={{ color: 'rgba(255,255,255,0.48)' }}>
            <div>
              <div className="font-semibold text-white/70 mb-1">Data Source</div>
              NIWA Auckland station — daily temperature highs, lows, and rainfall since 1962.
            </div>
            <div>
              <div className="font-semibold text-white/70 mb-1">Processing</div>
              Python + Pandas for cleaning and aggregation. Missing values excluded, not imputed.
            </div>
            <div>
              <div className="font-semibold text-white/70 mb-1">Seasonal Model</div>
              Fourier-feature linear regression (R²&nbsp;=&nbsp;0.76) and logistic classifier (66% accuracy) trained on day-of-year.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
