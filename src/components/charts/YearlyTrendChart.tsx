'use client';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { YearlyTrend } from '@/types';

const TOOLTIP_STYLE = {
  contentStyle: {
    background: '#0b1940',
    border: '1px solid rgba(117,153,255,0.3)',
    borderRadius: 4,
    color: '#ffffff',
    fontSize: 12,
    fontFamily: "'Open Sans', sans-serif",
  },
  labelStyle: { color: '#7599ff', fontWeight: 600, marginBottom: 4 },
  itemStyle: { color: 'rgba(255,255,255,0.8)' },
};

export default function YearlyTrendChart({ data }: { data: YearlyTrend }) {
  const chartData = data.years.map((year, i) => ({
    year,
    'Daily High': data.avgMaxTemp[i],
    'Daily Low':  data.avgMinTemp[i],
  }));

  const avgHigh = data.avgMaxTemp.reduce((a, b) => a + b, 0) / data.avgMaxTemp.length;

  return (
    <div className="glass-card p-6">
      <div className="mb-5">
        <p className="wx-label mb-1">Long-term Record</p>
        <h3 className="text-base font-bold text-white">60-Year Temperature Trend</h3>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
          Annual average daily high & low — 1966 to 2024
        </p>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="year" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 10, fontFamily: "'Open Sans'" }} interval={9} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }} unit="°C" axisLine={false} tickLine={false} domain={['auto', 'auto']} />
          <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`${v}°C`]} />
          <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontFamily: "'Open Sans'" }} />
          <ReferenceLine
            y={avgHigh}
            stroke="rgba(252,172,40,0.45)"
            strokeDasharray="4 2"
            label={{ value: `Mean ${avgHigh.toFixed(1)}°C`, fill: 'rgba(252,172,40,0.7)', fontSize: 10 }}
          />
          <Line type="monotone" dataKey="Daily High" stroke="#7599ff" dot={false} strokeWidth={1.8} activeDot={{ r: 3, fill: '#7599ff' }} />
          <Line type="monotone" dataKey="Daily Low"  stroke="#57c2dd" dot={false} strokeWidth={1.8} activeDot={{ r: 3, fill: '#57c2dd' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
