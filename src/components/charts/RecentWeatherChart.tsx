'use client';
import {
  ComposedChart, Area, Bar, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import type { DayForecast } from '@/lib/openmeteo';

interface Props {
  data: DayForecast[];
}

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
};

function shortDate(iso: string) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-NZ', { month: 'short', day: 'numeric' });
}

export default function RecentWeatherChart({ data }: Props) {
  const chartData = data.map(d => ({
    label: shortDate(d.date),
    'High (°C)':   d.maxTemp,
    'Low (°C)':    d.minTemp,
    'Rain (mm)':   d.rainfall,
  }));

  return (
    <div className="glass-card p-6">
      <div className="mb-5">
        <p className="wx-label mb-1">Live Archive · Open-Meteo</p>
        <h3 className="text-base font-bold text-white">Last 30 Days — Auckland</h3>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
          Daily high / low temperature and rainfall · auto-updates every 24 h
        </p>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={chartData} margin={{ top: 4, right: 16, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="gHigh30" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#7599ff" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#7599ff" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: 'rgba(255,255,255,0.42)', fontSize: 10, fontFamily: "'Open Sans'" }}
            interval={4}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="temp"
            tick={{ fill: 'rgba(255,255,255,0.42)', fontSize: 11 }}
            unit="°C"
            axisLine={false}
            tickLine={false}
            domain={['auto', 'auto']}
          />
          <YAxis
            yAxisId="rain"
            orientation="right"
            tick={{ fill: 'rgba(255,255,255,0.42)', fontSize: 11 }}
            unit="mm"
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            {...TOOLTIP_STYLE}
            formatter={(v, name) => [
              name === 'Rain (mm)' ? `${v} mm` : `${v}°C`,
              name,
            ]}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontFamily: "'Open Sans'" }} />
          <Bar
            yAxisId="rain"
            dataKey="Rain (mm)"
            fill="rgba(87,194,221,0.35)"
            radius={[2, 2, 0, 0]}
          />
          <Area
            yAxisId="temp"
            type="monotone"
            dataKey="High (°C)"
            stroke="#7599ff"
            fill="url(#gHigh30)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, fill: '#7599ff' }}
          />
          <Line
            yAxisId="temp"
            type="monotone"
            dataKey="Low (°C)"
            stroke="#57c2dd"
            strokeWidth={1.8}
            dot={false}
            activeDot={{ r: 3, fill: '#57c2dd' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
