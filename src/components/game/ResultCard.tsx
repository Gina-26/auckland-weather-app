'use client';
import type { GameGuess } from '@/types';

interface Props {
  guess: GameGuess;
  dateLabel: string;
}

function PointsBadge({ points, label }: { points: number; label: string }) {
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
      points > 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                 : 'bg-white/5 text-white/40 border border-white/10'
    }`}>
      <span>{points > 0 ? '✓' : '✗'}</span>
      <span>{label}</span>
      {points > 0 && <span className="font-bold">+{points}</span>}
    </div>
  );
}

export default function ResultCard({ guess, dateLabel }: Props) {
  const totalPoints = guess.temp_points + guess.rain_points + guess.bonus_points;
  const isPending = !guess.is_verified;

  return (
    <div className={`glass-card p-6 fade-in ${
      isPending ? 'border-yellow-500/25' : totalPoints > 0 ? 'border-emerald-500/25' : 'border-rose-500/20'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">昨日结果</h3>
          <p className="text-xs text-white/50 mt-0.5">{dateLabel} 的预测</p>
        </div>
        {isPending ? (
          <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs border border-yellow-500/30 pulse-slow">
            待验证
          </span>
        ) : (
          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
            totalPoints > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white/50'
          }`}>
            {totalPoints > 0 ? `+${totalPoints} 分` : '0 分'}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="glass-card p-3 !rounded-xl">
          <div className="text-xs text-white/45 mb-1">你猜</div>
          <div className="text-white font-semibold">{guess.temp_guess}°C</div>
          <div className="text-white/60 text-sm">{guess.rain_guess ? '🌧️ 下雨' : '☀️ 不下雨'}</div>
        </div>
        {!isPending && guess.actual_temp !== null ? (
          <div className="glass-card p-3 !rounded-xl bg-white/5">
            <div className="text-xs text-white/45 mb-1">实际</div>
            <div className="text-white font-semibold">{guess.actual_temp}°C</div>
            <div className="text-white/60 text-sm">{guess.actual_rain ? '🌧️ 下雨了' : '☀️ 没下雨'}</div>
          </div>
        ) : (
          <div className="glass-card p-3 !rounded-xl bg-white/3">
            <div className="text-xs text-white/45 mb-1">实际</div>
            <div className="text-white/30 text-sm">等待数据…</div>
          </div>
        )}
      </div>

      {!isPending && (
        <div className="flex flex-wrap gap-2">
          <PointsBadge
            points={guess.temp_points}
            label={guess.actual_temp !== null
              ? `温度差 ${Math.abs(guess.temp_guess - (guess.actual_temp ?? 0)).toFixed(1)}°C`
              : '温度'}
          />
          <PointsBadge points={guess.rain_points} label="降雨判断" />
          {guess.bonus_points > 0 && (
            <PointsBadge points={guess.bonus_points} label="双中奖励" />
          )}
        </div>
      )}
    </div>
  );
}
