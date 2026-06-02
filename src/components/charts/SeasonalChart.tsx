'use client';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
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
  labelStyle: { color: '#a78bfa', fontWeight: 600 },
};

export default function SeasonalChart({ data }: Props) {
  const chartData = data.months.map((month, i) => ({
    month,
    '历史最高': data.avgMaxTemp[i],
    '历史最低': data.avgMinTemp[i],
    'AI预测': data.predictedMaxTemp[i],
  }));

  return (
    <div className="glass-card p-6">
      <div className="mb-4">
        <h3 className="text-lg font-bold gradient-text">月均气温变化</h3>
        <p className="text-xs text-white/40 mt-1">历史实测 vs AI季节预测模型</p>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gMax" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gMin" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#34d399" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#34d399" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
          <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} unit="°C" axisLine={false} tickLine={false} domain={['auto', 'auto']} />
          <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`${v}°C`]} />
          <Legend wrapperStyle={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }} />
          <Area type="monotone" dataKey="历史最高" stroke="#a78bfa" fill="url(#gMax)" strokeWidth={2} />
          <Area type="monotone" dataKey="历史最低" stroke="#34d399" fill="url(#gMin)" strokeWidth={2} />
          <Area type="monotone" dataKey="AI预测" stroke="#f59e0b" fill="none" strokeWidth={2} strokeDasharray="6 3" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
