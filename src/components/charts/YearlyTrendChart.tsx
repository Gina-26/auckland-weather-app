'use client';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { YearlyTrend } from '@/types';

interface Props { data: YearlyTrend }

const TOOLTIP_STYLE = {
  contentStyle: {
    background: 'rgba(15,12,41,0.92)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 12,
    color: '#f0f0f5',
  },
  labelStyle: { color: '#a78bfa', fontWeight: 600 },
};

export default function YearlyTrendChart({ data }: Props) {
  const chartData = data.years.map((year, i) => ({
    year,
    '年均最高': data.avgMaxTemp[i],
    '年均最低': data.avgMinTemp[i],
  }));

  const avgMax = data.avgMaxTemp.reduce((a, b) => a + b, 0) / data.avgMaxTemp.length;

  return (
    <div className="glass-card p-6">
      <div className="mb-4">
        <h3 className="text-lg font-bold gradient-text">60年气温趋势</h3>
        <p className="text-xs text-white/40 mt-1">1966—2024 年均最高 / 最低气温</p>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
          <XAxis dataKey="year" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} interval={9} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} unit="°C" axisLine={false} tickLine={false} domain={['auto', 'auto']} />
          <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`${v}°C`]} />
          <Legend wrapperStyle={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }} />
          <ReferenceLine y={avgMax} stroke="rgba(245,158,11,0.4)" strokeDasharray="4 2" label={{ value: '均线', fill: 'rgba(245,158,11,0.7)', fontSize: 10 }} />
          <Line type="monotone" dataKey="年均最高" stroke="#a78bfa" dot={false} strokeWidth={2} activeDot={{ r: 4, fill: '#a78bfa' }} />
          <Line type="monotone" dataKey="年均最低" stroke="#34d399" dot={false} strokeWidth={2} activeDot={{ r: 4, fill: '#34d399' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
