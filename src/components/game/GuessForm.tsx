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

  const dateLabel = new Date(targetDate + 'T12:00:00').toLocaleDateString('zh-CN', {
    month: 'long', day: 'numeric', weekday: 'long',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rainGuess === null) { setError('请选择是否下雨'); return; }
    setError('');
    await onSubmit(tempGuess, rainGuess);
  }

  return (
    <div className="glass-card p-6 fade-in">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold text-white">今日预测</h3>
          <p className="text-xs text-white/50 mt-0.5">猜测 {dateLabel} 的天气</p>
        </div>
        {forecast && (
          <div className="text-right text-xs text-white/40">
            <div>今日实况</div>
            <div className="text-white/70">{forecast.maxTemp}°C · {forecast.rainfall > 1 ? '有雨' : '晴'}</div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="text-sm text-white/70 font-medium block mb-3">
            明天最高温度：
            <span className="text-2xl font-bold text-purple-300 ml-2">{tempGuess}°C</span>
          </label>
          <input
            type="range"
            min={5} max={40} step={0.5}
            value={tempGuess}
            onChange={e => setTempGuess(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #7c3aed ${((tempGuess - 5) / 35) * 100}%, rgba(255,255,255,0.15) ${((tempGuess - 5) / 35) * 100}%)`,
            }}
          />
          <div className="flex justify-between text-xs text-white/30 mt-1">
            <span>5°C</span><span>22.5°C</span><span>40°C</span>
          </div>
        </div>

        <div>
          <label className="text-sm text-white/70 font-medium block mb-3">明天是否下雨？</label>
          <div className="grid grid-cols-2 gap-3">
            {([
              { value: false, icon: '☀️', label: '不下雨' },
              { value: true,  icon: '🌧️', label: '会下雨' },
            ] as const).map(({ value, icon, label }) => (
              <button
                key={label}
                type="button"
                onClick={() => setRainGuess(value)}
                className={`py-3 rounded-xl border font-medium transition-all duration-200 ${
                  rainGuess === value
                    ? 'bg-purple-500/30 border-purple-400/60 text-purple-200'
                    : 'border-white/15 text-white/60 hover:border-white/30 hover:text-white'
                }`}
              >
                {icon} {label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-rose-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-gradient w-full py-3 text-base"
        >
          {isSubmitting ? '提交中…' : '提交预测 🎯'}
        </button>
      </form>
    </div>
  );
}
