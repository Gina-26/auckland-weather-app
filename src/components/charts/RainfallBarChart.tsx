'use client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';
import type { MonthlyAverage } from '@/types';

interface Props { data: MonthlyAverage }

const TOOLTIP_STYLE = {
  contentStyle: {
    background: 'rgba(15,12,41,0.92)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 12,
    color: '#f0f0f5',
  },
  labelStyle: { color: '#06b6d4', fontWeight: 600 },
};

export default function RainfallBarChart({ data }: Props) {
  const chartData = data.months.map((month, i) => ({
    month,
    '月均降雨(mm)': data.avgRainfall[i] ?? 0,
    '雨天概率(%)': Math.round((data.rainProbability[i] ?? 0) * 100),
  }));

  const maxRain = Math.max(...(data.avgRainfall.filter(Boolean) as number[]));

  return (
    <div className="glass-card p-6">
      <div className="mb-4">
        <h3 className="text-lg font-bold gradient-text">月均降雨量 & 下雨概率</h3>
        <p className="text-xs text-white/40 mt-1">奥克兰全年降水分布规律</p>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="rain" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} unit="mm" />
          <YAxis yAxisId="prob" orientation="right" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
          <Tooltip {...TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }} />
          <Bar yAxisId="rain" dataKey="月均降雨(mm)" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell
                key={i}
                fill={`rgba(6,182,212,${0.3 + 0.6 * (entry['月均降雨(mm)'] / maxRain)})`}
              />
            ))}
          </Bar>
          <Bar yAxisId="prob" dataKey="雨天概率(%)" fill="rgba(167,139,250,0.45)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
