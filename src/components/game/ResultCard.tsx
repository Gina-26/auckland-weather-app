'use client';
import type { GameGuess } from '@/types';

function PointPill({ points, label }: { points: number; label: string }) {
  const hit = points > 0;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
      style={{
        background: hit ? 'rgba(84,187,81,0.18)' : 'rgba(255,255,255,0.06)',
        border: `1px solid ${hit ? 'rgba(84,187,81,0.4)' : 'rgba(255,255,255,0.12)'}`,
        color: hit ? '#54bb51' : 'rgba(255,255,255,0.38)',
      }}
    >
      {hit ? '✓' : '✗'} {label} {hit && <strong>+{points}</strong>}
    </span>
  );
}

export default function ResultCard({ guess, dateLabel }: { guess: GameGuess; dateLabel: string }) {
  const total = guess.temp_points + guess.rain_points + guess.bonus_points;
  const pending = !guess.is_verified;

  return (
    <div
      className="glass-card p-6 fade-in"
      style={{ borderColor: pending ? 'rgba(252,172,40,0.3)' : total > 0 ? 'rgba(84,187,81,0.3)' : 'rgba(117,153,255,0.16)' }}
    >
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="wx-label mb-1">Previous Result</p>
          <h3 className="text-base font-bold text-white">Forecast for {dateLabel}</h3>
        </div>
        {pending ? (
          <span className="px-3 py-1 rounded-full text-xs font-semibold pulse-slow"
            style={{ background: 'rgba(252,172,40,0.18)', border: '1px solid rgba(252,172,40,0.4)', color: '#fcac28' }}>
            Pending
          </span>
        ) : (
          <span
            className="text-lg font-bold"
            style={{ color: total > 0 ? '#54bb51' : 'rgba(255,255,255,0.35)' }}
          >
            {total > 0 ? `+${total} pts` : '0 pts'}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded p-3" style={{ background: 'rgba(7,17,46,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="wx-label mb-2">Your Prediction</div>
          <div className="text-xl font-bold text-white">{guess.temp_guess}°C</div>
          <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {guess.rain_guess ? '🌧 Rain' : '☀️ No Rain'}
          </div>
        </div>
        {!pending && guess.actual_temp !== null ? (
          <div className="rounded p-3" style={{ background: 'rgba(7,17,46,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="wx-label mb-2">Actual Weather</div>
            <div className="text-xl font-bold" style={{ color: '#7599ff' }}>{guess.actual_temp}°C</div>
            <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {guess.actual_rain ? '🌧 Rained' : '☀️ Stayed Dry'}
            </div>
          </div>
        ) : (
          <div className="rounded p-3" style={{ background: 'rgba(7,17,46,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="wx-label mb-2">Actual Weather</div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Awaiting data…</div>
          </div>
        )}
      </div>

      {!pending && (
        <div className="flex flex-wrap gap-2">
          <PointPill
            points={guess.temp_points}
            label={guess.actual_temp !== null
              ? `Temp diff ${Math.abs(guess.temp_guess - (guess.actual_temp ?? 0)).toFixed(1)}°C`
              : 'Temperature'}
          />
          <PointPill points={guess.rain_points} label="Rainfall" />
          {guess.bonus_points > 0 && <PointPill points={guess.bonus_points} label="Double hit bonus" />}
        </div>
      )}
    </div>
  );
}
