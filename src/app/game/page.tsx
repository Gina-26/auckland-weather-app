'use client';
import { useState, useEffect, useCallback } from 'react';
import GuessForm from '@/components/game/GuessForm';
import ResultCard from '@/components/game/ResultCard';
import Leaderboard from '@/components/game/Leaderboard';
import type { GameProfile, GameGuess, ForecastDay, LeaderboardEntry } from '@/types';

const UID_KEY = 'weathergame_uid';

function getNZDate(offsetDays = 0): string {
  const nz = new Date().toLocaleString('en-CA', {
    timeZone: 'Pacific/Auckland', year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const d = new Date(nz);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

function fmtDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-NZ', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
}

const WX_ICON = (rain: number, max: number) =>
  rain > 5 ? '⛈' : rain > 1 ? '🌧' : max > 22 ? '☀️' : '⛅';
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function ForecastStrip({ days }: { days: ForecastDay[] }) {
  return (
    <div className="glass-card p-6">
      <p className="wx-label mb-1">Open-Meteo Forecast</p>
      <h3 className="text-base font-bold text-white mb-4">7-Day Auckland Outlook</h3>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          const d = new Date(day.date + 'T12:00:00');
          const todayStr = getNZDate(0);
          const isToday = day.date === todayStr;
          return (
            <div
              key={day.date}
              className="flex flex-col items-center py-3 px-1 rounded transition-colors"
              style={{
                background: isToday ? 'rgba(117,153,255,0.16)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isToday ? 'rgba(117,153,255,0.4)' : 'rgba(255,255,255,0.07)'}`,
              }}
            >
              <div className="wx-label mb-1.5">{i === 0 ? 'TODAY' : DAYS[d.getDay()]}</div>
              <div className="text-xl mb-1.5">{WX_ICON(day.rainfall, day.maxTemp)}</div>
              <div className="text-sm font-bold text-white">{day.maxTemp}°</div>
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{day.minTemp}°</div>
              {day.rainfall > 0 && (
                <div className="text-xs mt-1" style={{ color: '#57c2dd' }}>{day.rainfall}mm</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function GamePage() {
  const [userId, setUserId]         = useState<string | null>(null);
  const [profile, setProfile]       = useState<GameProfile | null>(null);
  const [todayGuess, setTodayGuess] = useState<GameGuess | null>(null);
  const [yestGuess, setYestGuess]   = useState<GameGuess | null>(null);
  const [forecast, setForecast]     = useState<ForecastDay[]>([]);
  const [leaders, setLeaders]       = useState<LeaderboardEntry[]>([]);
  const [nickname, setNickname]     = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createErr, setCreateErr]   = useState('');
  const [loading, setLoading]       = useState(true);

  const fetchProfile   = useCallback(async (uid: string) => {
    const r = await fetch(`/api/game/profile?id=${uid}`);
    if (r.ok) setProfile((await r.json()).profile);
  }, []);

  const fetchTodayGuess = useCallback(async (uid: string) => {
    const r = await fetch(`/api/game/guess?user_id=${uid}&date=${getNZDate(1)}`);
    if (r.ok) setTodayGuess((await r.json()).guess);
  }, []);

  const fetchYestGuess  = useCallback(async (uid: string) => {
    const r = await fetch(`/api/game/guess?user_id=${uid}&date=${getNZDate(-1)}`);
    if (r.ok) setYestGuess((await r.json()).guess);
  }, []);

  const verify = useCallback(async (uid: string) => {
    await fetch('/api/game/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: uid }) });
  }, []);

  useEffect(() => {
    const uid = localStorage.getItem(UID_KEY);
    setUserId(uid);
    const common = [
      fetch('/api/weather/forecast').then(r => r.json()).then(d => setForecast(d.days ?? [])),
      fetch('/api/game/leaderboard').then(r => r.json()).then(d => setLeaders(d.leaderboard ?? [])),
    ];
    if (uid) {
      Promise.all([
        verify(uid), fetchProfile(uid), fetchTodayGuess(uid), fetchYestGuess(uid), ...common,
      ]).then(() => { fetchProfile(uid); fetchYestGuess(uid); setLoading(false); });
    } else {
      Promise.all(common).then(() => setLoading(false));
    }
  }, [fetchProfile, fetchTodayGuess, fetchYestGuess, verify]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setIsCreating(true); setCreateErr('');
    const r = await fetch('/api/game/profile', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname }),
    });
    const data = await r.json();
    if (!r.ok) { setCreateErr(data.error ?? 'Failed to create profile'); setIsCreating(false); return; }
    const uid = data.profile.id;
    localStorage.setItem(UID_KEY, uid);
    setUserId(uid); setProfile(data.profile); setIsCreating(false);
  }

  async function handleSubmitGuess(tempGuess: number, rainGuess: boolean) {
    if (!userId) return;
    setIsSubmitting(true);
    const r = await fetch('/api/game/guess', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, temp_guess: tempGuess, rain_guess: rainGuess }),
    });
    if (r.ok) setTodayGuess((await r.json()).guess);
    setIsSubmitting(false);
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid md:grid-cols-2 gap-5">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-52" />)}
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 grid md:grid-cols-2 gap-8 items-start">
        <div className="glass-card p-8 fade-in">
          <p className="wx-label mb-2">Weather Game</p>
          <h2 className="text-2xl font-bold text-white mb-2">Daily Forecast Challenge</h2>
          <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Predict tomorrow's Auckland weather every day. Earn points for accuracy, climb the leaderboard, and unlock exclusive avatars.
          </p>
          <div className="space-y-3 mb-6 text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {[
              ['🎯', 'Temp within 1°C', '+20 pts'],
              ['🎯', 'Temp within 2°C', '+10 pts'],
              ['🌧', 'Rain correct', '+10 pts'],
              ['⭐', 'Double hit bonus', '+5 pts'],
            ].map(([icon, label, pts]) => (
              <div key={label} className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <span>{icon} {label}</span>
                <span className="font-semibold" style={{ color: '#7599ff' }}>{pts}</span>
              </div>
            ))}
          </div>
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              className="input-dark w-full px-4 py-3"
              placeholder="Choose a nickname (2–12 chars)"
              value={nickname} onChange={e => setNickname(e.target.value)}
              maxLength={12} minLength={2} required
            />
            {createErr && <p className="text-xs" style={{ color: '#ef2b2f' }}>{createErr}</p>}
            <button type="submit" disabled={isCreating} className="btn-gradient w-full py-3">
              {isCreating ? 'Creating…' : 'Start Playing'}
            </button>
          </form>
        </div>
        <Leaderboard entries={leaders} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile card */}
        {profile && (
          <div className="glass-card p-6 fade-in flex flex-col items-center text-center">
            <div className="text-5xl mb-3">{profile.avatar_emoji}</div>
            <p className="wx-label mb-0.5">Player</p>
            <h2 className="text-lg font-bold text-white">{profile.nickname}</h2>
            <div className="text-3xl font-bold mt-3 mb-0.5" style={{ color: '#7599ff', letterSpacing: '-0.03em' }}>
              {profile.score}
            </div>
            <div className="wx-label mb-4">points</div>
            <div className="grid grid-cols-3 gap-2 w-full text-center border-t pt-4" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              {[
                [profile.total_guesses, 'Predictions'],
                [profile.correct_guesses, 'Correct'],
                [profile.total_guesses > 0 ? `${Math.round((profile.correct_guesses / profile.total_guesses) * 100)}%` : '—', 'Accuracy'],
              ].map(([v, l]) => (
                <div key={String(l)}>
                  <div className="font-bold text-white">{v}</div>
                  <div className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Guess form or submitted state */}
        <div className="md:col-span-2">
          {todayGuess ? (
            <div className="glass-card p-8 flex flex-col items-center justify-center text-center h-full fade-in">
              <div className="text-4xl mb-3">✅</div>
              <p className="wx-label mb-1">Prediction Submitted</p>
              <h3 className="text-lg font-bold text-white mb-3">
                You're on record for {fmtDate(getNZDate(1))}
              </h3>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Your prediction: <span style={{ color: '#7599ff' }}>{todayGuess.temp_guess}°C</span>
                {' '}· {todayGuess.rain_guess ? '🌧 Rain expected' : '☀️ No rain expected'}
              </p>
              <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.3)' }}>Check back tomorrow for your result</p>
            </div>
          ) : (
            <GuessForm
              targetDate={getNZDate(1)}
              forecast={forecast[0]}
              onSubmit={handleSubmitGuess}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </div>

      {yestGuess && <ResultCard guess={yestGuess} dateLabel={fmtDate(getNZDate(-1))} />}
      {forecast.length > 0 && <ForecastStrip days={forecast} />}
      <Leaderboard entries={leaders} currentNickname={profile?.nickname} />

      <div className="text-center py-2">
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Scoring: ±1°C → 20 pts · ±2°C → 10 pts · ±3°C → 5 pts · Rain correct → 10 pts · Both correct → +5 bonus
        </p>
      </div>
    </div>
  );
}
