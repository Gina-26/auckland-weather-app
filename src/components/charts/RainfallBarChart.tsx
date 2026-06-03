'use client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
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
  labelStyle: { color: '#57c2dd', fontWeight: 600, marginBottom: 4 },
  itemStyle: { color: 'rgba(255,255,255,0.8)' },
};

export default function RainfallBarChart({ data }: { data: MonthlyAverage }) {
  const maxRain = Math.max(...(data.avgRainfall.filter(Boolean) as number[]));

  const chartData = data.months.map((month, i) => ({
    month,
    'Avg Rainfall (mm)': data.avgRainfall[i] ?? 0,
    'Rain Days (%)':     Math.round((data.rainProbability[i] ?? 0) * 100),
  }));

  return (
    <div className="glass-card p-6">
      <div className="mb-5">
        <p className="wx-label mb-1">Precipitation</p>
        <h3 className="text-base font-bold text-white">Monthly Rainfall & Rain Probability</h3>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
          Average millimetres and likelihood of a rainy day by month
        </p>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11, fontFamily: "'Open Sans'" }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="rain" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }} unit="mm" axisLine={false} tickLine={false} />
          <YAxis yAxisId="prob" orientation="right" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }} unit="%" axisLine={false} tickLine={false} domain={[0, 100]} />
          <Tooltip {...TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontFamily: "'Open Sans'" }} />
          <Bar yAxisId="rain" dataKey="Avg Rainfall (mm)" radius={[3, 3, 0, 0]}>
            {chartData.map((e, i) => (
              <Cell key={i} fill={`rgba(87,194,221,${0.28 + 0.62 * (e['Avg Rainfall (mm)'] / maxRain)})`} />
            ))}
          </Bar>
          <Bar yAxisId="prob" dataKey="Rain Days (%)" fill="rgba(117,153,255,0.42)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
