'use client';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { MonthlyAverage } from '@/types';

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

export default function SeasonalChart({ data }: { data: MonthlyAverage }) {
  const chartData = data.months.map((month, i) => ({
    month,
    'Avg High': data.avgMaxTemp[i],
    'Avg Low':  data.avgMinTemp[i],
    'Predicted': data.predictedMaxTemp[i],
  }));

  return (
    <div className="glass-card p-6">
      <div className="mb-5">
        <p className="wx-label mb-1">Seasonal Pattern</p>
        <h3 className="text-base font-bold text-white">Monthly Temperature</h3>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
          Historical average vs ML seasonal model
        </p>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="gHigh" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#7599ff" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#7599ff" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gLow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#57c2dd" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#57c2dd" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11, fontFamily: "'Open Sans'" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }} unit="°C" axisLine={false} tickLine={false} domain={['auto', 'auto']} />
          <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`${v}°C`]} />
          <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontFamily: "'Open Sans'" }} />
          <Area type="monotone" dataKey="Avg High"  stroke="#7599ff" fill="url(#gHigh)" strokeWidth={2} />
          <Area type="monotone" dataKey="Avg Low"   stroke="#57c2dd" fill="url(#gLow)"  strokeWidth={2} />
          <Area type="monotone" dataKey="Predicted" stroke="#fcac28" fill="none"        strokeWidth={2} strokeDasharray="5 3" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
