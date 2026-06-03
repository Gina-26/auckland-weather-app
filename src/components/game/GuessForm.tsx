'use client';
import { useState } from 'react';
import type { ForecastDay } from '@/types';

interface Props {
  targetDate: string;
  forecast?: ForecastDay;
  onSubmit: (tempGuess: number, rainGuess: boolean) => Promise<void>;
  isSubmitting: boolean;
}

export default function GuessForm({ targetDate, forecast, onSubmit, isSubmitting }: Props) {
  const [tempGuess, setTempGuess] = useState(20);
  const [rainGuess, setRainGuess] = useState<boolean | null>(null);
  const [error, setError] = useState('');

  const dateLabel = new Date(targetDate + 'T12:00:00').toLocaleDateString('en-NZ', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rainGuess === null) { setError('Please select a rainfall option'); return; }
    setError('');
    await onSubmit(tempGuess, rainGuess);
  }

  const pct = ((tempGuess - 5) / 35) * 100;

  return (
    <div className="glass-card p-6 fade-in">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="wx-label mb-1">Today's Prediction</p>
          <h3 className="text-base font-bold text-white">Forecast for {dateLabel}</h3>
        </div>
        {forecast && (
          <div className="text-right">
            <div className="wx-label mb-0.5">Today's actual</div>
            <div className="text-white font-semibold">{forecast.maxTemp}°C</div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {forecast.rainfall > 1 ? '🌧 Rain' : '☀️ Dry'}
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-7">
        <div>
          <div className="flex justify-between items-baseline mb-3">
            <label className="text-sm font-semibold text-white/80">Tomorrow's Max Temperature</label>
            <span
              className="text-3xl font-bold"
              style={{ color: '#7599ff', letterSpacing: '-0.03em' }}
            >
              {tempGuess}°C
            </span>
          </div>
          <input
            type="range" min={5} max={40} step={0.5}
            value={tempGuess}
            onChange={e => setTempGuess(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #7599ff ${pct}%, rgba(255,255,255,0.15) ${pct}%)`,
            }}
          />
          <div className="flex justify-between text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.28)' }}>
            <span>5°C</span><span>22°C</span><span>40°C</span>
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-white/80 block mb-3">Will it rain tomorrow?</label>
          <div className="grid grid-cols-2 gap-3">
            {([
              { v: false, icon: '☀️', label: 'No Rain' },
              { v: true,  icon: '🌧', label: 'Rain Expected' },
            ] as const).map(({ v, icon, label }) => (
              <button
                key={label} type="button"
                onClick={() => setRainGuess(v)}
                className="py-3 rounded transition-all duration-150 text-sm font-semibold"
                style={{
                  background: rainGuess === v ? 'rgba(117,153,255,0.22)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${rainGuess === v ? 'rgba(117,153,255,0.55)' : 'rgba(255,255,255,0.14)'}`,
                  color: rainGuess === v ? '#7599ff' : 'rgba(255,255,255,0.6)',
                }}
              >
                {icon} {label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm" style={{ color: '#ef2b2f' }}>{error}</p>}

        <button type="submit" disabled={isSubmitting} className="btn-gradient w-full py-3 text-sm">
          {isSubmitting ? 'Submitting…' : 'Submit Prediction'}
        </button>
      </form>
    </div>
  );
}
