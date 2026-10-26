import StatCard from '@/components/ui/StatCard';
import HotDaysChart from '@/components/charts/HotDaysChart';
import type { Findings } from '@/types';

const FLOOD_DATE = '2023-01-27'; // Auckland Anniversary weekend flood

export default function KeyFindings({ f }: { f: Findings }) {
  const t = f.temperatureTrend;
  const flood = f.wettestDays.findIndex(d => d.date === FLOOD_DATE);
  const floodDay = flood >= 0 ? f.wettestDays[flood] : null;

  return (
    <section className="space-y-6 fade-in">
      <div>
        <p className="wx-label mb-1">Analysis</p>
        <h2 className="text-xl font-bold text-white">Key Findings</h2>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
          {f.firstYear}–{f.lastYear} · complete years only · trends from linear regression on annual values
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon="🌡️" label="Warming" accent="orange"
          value={`+${t.totalChange.toFixed(1)}°C`}
          sub={`+${t.perDecade.toFixed(2)}°C per decade${t.significant ? ' · statistically significant' : ''}`} />
        <StatCard icon="☀️" label={`Days ≥ ${f.thresholds.hotDayC}°C`} accent="red"
          value={`×${f.hotDays.ratio}`}
          sub={`${f.hotDays.firstDecadeAvg}/yr in ${f.hotDays.firstDecade} → ${f.hotDays.lastDecadeAvg}/yr in ${f.hotDays.lastDecade}`} />
        <StatCard icon="❄️" label={`Nights ≤ ${f.thresholds.coldNightC}°C`} accent="blue"
          value={`${f.coldNights.firstDecadeAvg} → ${f.coldNights.lastDecadeAvg}`}
          sub="cold nights per year, first vs latest decade" />
        <StatCard icon="🔥" label="Warmest Years" accent="green"
          value={`${f.warmestYearsSince2016} of 5`}
          sub={`happened since 2016 (hottest: ${f.warmestYears[0].year})`} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <HotDaysChart decades={f.decades} threshold={f.thresholds.hotDayC} />

        <div className="glass-card p-6 space-y-5">
          <div>
            <p className="wx-label mb-1">Finding 2</p>
            <h3 className="text-base font-bold text-white">Rain has not clearly changed</h3>
            <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Unlike temperature, annual rainfall and the number of very wet days
              (≥ {f.thresholds.heavyRainMm} mm) show no statistically significant trend
              (p = {f.rainfallTrend.pValue.toFixed(2)} and {f.heavyRainTrend.pValue.toFixed(2)}).
              Year-to-year variation is much larger than any long-term change.
            </p>
          </div>
          <div className="pt-5 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
            <p className="wx-label mb-1">Data limitation</p>
            <h3 className="text-base font-bold text-white">Gridded data smooths out extreme rain</h3>
            <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
              This analysis uses {f.dataSource}, which averages weather over a grid cell
              tens of kilometres wide.
              {floodDay
                ? ` The record-breaking Auckland Anniversary flood (27 Jan 2023) only ranks #${flood + 1} here at ${floodDay.rainfall} mm, far below what local rain gauges measured.`
                : ' The record-breaking Auckland Anniversary flood (27 Jan 2023) does not even appear in the 10 wettest days here.'}
              {' '}It is reliable for long-term temperature trends, but not for local extremes.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
