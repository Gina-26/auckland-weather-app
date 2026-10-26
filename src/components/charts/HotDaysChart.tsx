'use client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import type { DecadeSummary } from '@/types';

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

export default function HotDaysChart({ decades, threshold }: { decades: DecadeSummary[]; threshold: number }) {
  const data = decades.map(d => ({
    decade: d.years < 10 ? `${d.decade}*` : d.decade,
    'Hot days per year': d.hotDays,
  }));
  const last = data.length - 1;
  const partial = decades[last]?.years < 10;

  return (
    <div className="glass-card p-6">
      <div className="mb-5">
        <p className="wx-label mb-1">Finding 1</p>
        <h3 className="text-base font-bold text-white">Hot days have more than tripled</h3>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
          Average number of days per year reaching {threshold}°C or more, by decade
        </p>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="decade" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip {...TOOLTIP_STYLE} cursor={{ fill: 'rgba(255,255,255,0.04)' }} formatter={(v) => [`${v} days`]} />
          <Bar dataKey="Hot days per year" radius={[3, 3, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={i === last ? '#fcac28' : 'rgba(117,153,255,0.55)'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {partial && (
        <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
          * {decades[last].decade} = {decades[last].years} complete years so far
        </p>
      )}
    </div>
  );
}
