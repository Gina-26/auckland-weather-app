'use client';
import { useState, useEffect, useCallback } from 'react';
import GuessForm from '@/components/game/GuessForm';
import ResultCard from '@/components/game/ResultCard';
import Leaderboard from '@/components/game/Leaderboard';
import type { GameProfile, GameGuess, ForecastDay, LeaderboardEntry } from '@/types';

const UID_KEY = 'weathergame_uid';

function getTomorrowNZ(): string {
  const nz = new Date().toLocaleString('en-CA', {
    timeZone: 'Pacific/Auckland', year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const d = new Date(nz);
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

function getYesterdayNZ(): string {
  const nz = new Date().toLocaleString('en-CA', {
    timeZone: 'Pacific/Auckland', year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const d = new Date(nz);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

function ForecastCard({ days }: { days: ForecastDay[] }) {
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-bold gradient-text mb-4">七日天气预报</h3>
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {days.map((day) => {
          const d = new Date(day.date + 'T12:00:00');
          const isToday = day.date === new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' });
          return (
            <div key={day.date} className={`text-center p-2 rounded-xl ${isToday ? 'bg-purple-500/20 border border-purple-500/30' : 'hover:bg-white/5'} transition-colors`}>
              <div className="text-xs text-white/40 mb-1">周{weekdays[d.getDay()]}</div>
              <div className="text-lg">{day.rainfall > 5 ? '⛈️' : day.rainfall > 1 ? '🌧️' : day.maxTemp > 22 ? '☀️' : '⛅'}</div>
              <div className="text-xs font-bold text-white mt-1">{day.maxTemp}°</div>
              <div className="text-xs text-white/40">{day.minTemp}°</div>
              {day.rainfall > 0 && <div className="text-xs text-cyan-400">{day.rainfall}mm</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function GamePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<GameProfile | null>(null);
  const [todayGuess, setTodayGuess] = useState<GameGuess | null>(null);
  const [yesterdayGuess, setYesterdayGuess] = useState<GameGuess | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [nickname, setNickname] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (uid: string) => {
    const res = await fetch(`/api/game/profile?id=${uid}`);
    if (res.ok) {
      const { profile } = await res.json();
      setProfile(profile);
    }
  }, []);

  const fetchTodayGuess = useCallback(async (uid: string) => {
    const tomorrow = getTomorrowNZ();
    const res = await fetch(`/api/game/guess?user_id=${uid}&date=${tomorrow}`);
    if (res.ok) {
      const { guess } = await res.json();
      setTodayGuess(guess);
    }
  }, []);

  const fetchYesterdayGuess = useCallback(async (uid: string) => {
    const yesterday = getYesterdayNZ();
    const res = await fetch(`/api/game/guess?user_id=${uid}&date=${yesterday}`);
    if (res.ok) {
      const { guess } = await res.json();
      setYesterdayGuess(guess);
    }
  }, []);

  const verifyGuesses = useCallback(async (uid: string) => {
    await fetch('/api/game/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: uid }),
    });
  }, []);

  useEffect(() => {
    const uid = localStorage.getItem(UID_KEY);
    setUserId(uid);

    if (uid) {
      Promise.all([
        verifyGuesses(uid),
        fetchProfile(uid),
        fetchTodayGuess(uid),
        fetchYesterdayGuess(uid),
        fetch('/api/weather/forecast').then(r => r.json()).then(d => setForecast(d.days ?? [])),
        fetch('/api/game/leaderboard').then(r => r.json()).then(d => setLeaderboard(d.leaderboard ?? [])),
      ]).then(() => {
        fetchProfile(uid);
        fetchYesterdayGuess(uid);
        setLoading(false);
      });
    } else {
      Promise.all([
        fetch('/api/weather/forecast').then(r => r.json()).then(d => setForecast(d.days ?? [])),
        fetch('/api/game/leaderboard').then(r => r.json()).then(d => setLeaderboard(d.leaderboard ?? [])),
      ]).then(() => setLoading(false));
    }
  }, [fetchProfile, fetchTodayGuess, fetchYesterdayGuess, verifyGuesses]);

  async function handleCreateProfile(e: React.FormEvent) {
    e.preventDefault();
    setIsCreating(true);
    setCreateError('');
    const res = await fetch('/api/game/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname }),
    });
    const data = await res.json();
    if (!res.ok) {
      setCreateError(data.error ?? '创建失败');
      setIsCreating(false);
      return;
    }
    const uid = data.profile.id;
    localStorage.setItem(UID_KEY, uid);
    setUserId(uid);
    setProfile(data.profile);
    setIsCreating(false);
  }

  async function handleSubmitGuess(tempGuess: number, rainGuess: boolean) {
    if (!userId) return;
    setIsSubmitting(true);
    const res = await fetch('/api/game/guess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, temp_guess: tempGuess, rain_guess: rainGuess }),
    });
    const data = await res.json();
    if (res.ok) {
      setTodayGuess(data.guess);
    }
    setIsSubmitting(false);
  }

  const tomorrowLabel = new Date(getTomorrowNZ() + 'T12:00:00').toLocaleDateString('zh-CN', {
    month: 'long', day: 'numeric', weekday: 'long',
  });
  const yesterdayLabel = new Date(getYesterdayNZ() + 'T12:00:00').toLocaleDateString('zh-CN', {
    month: 'long', day: 'numeric', weekday: 'long',
  });

  const todayForecast = forecast[0];

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-48" />)}
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="glass-card p-8 text-center fade-in">
          <div className="text-5xl mb-4">🌤️</div>
          <h2 className="text-2xl font-bold gradient-text mb-2">加入猜天气游戏</h2>
          <p className="text-white/50 text-sm mb-6">每天预测奥克兰明天的天气，积累积分，解锁专属头像！</p>
          <form onSubmit={handleCreateProfile} className="space-y-4">
            <input
              className="input-dark w-full px-4 py-3 text-center text-lg"
              placeholder="输入昵称（2-12字符）"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              maxLength={12}
              required
            />
            {createError && <p className="text-rose-400 text-sm">{createError}</p>}
            <button type="submit" disabled={isCreating} className="btn-gradient w-full py-3">
              {isCreating ? '创建中…' : '开始游戏 🎯'}
            </button>
          </form>
        </div>
        <Leaderboard entries={leaderboard} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        {profile && (
          <div className="glass-card p-6 fade-in flex flex-col items-center text-center">
            <div className="text-5xl mb-3">{profile.avatar_emoji}</div>
            <h2 className="text-xl font-bold text-white">{profile.nickname}</h2>
            <div className="text-3xl font-bold gradient-text mt-2">{profile.score}</div>
            <div className="text-xs text-white/40 mb-3">积分</div>
            <div className="flex gap-4 text-sm text-white/60">
              <div className="text-center">
                <div className="font-bold text-white">{profile.total_guesses}</div>
                <div className="text-xs">总猜测</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-white">{profile.correct_guesses}</div>
                <div className="text-xs">猜中</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-white">
                  {profile.total_guesses > 0
                    ? `${Math.round((profile.correct_guesses / profile.total_guesses) * 100)}%`
                    : '--'}
                </div>
                <div className="text-xs">正确率</div>
              </div>
            </div>
          </div>
        )}

        <div className="md:col-span-2">
          {todayGuess ? (
            <div className="glass-card p-6 fade-in flex flex-col items-center justify-center text-center h-full">
              <div className="text-4xl mb-3">✅</div>
              <h3 className="text-lg font-bold text-white mb-1">今日预测已提交！</h3>
              <p className="text-white/50 text-sm mb-4">你猜 {tomorrowLabel} 最高温 <span className="text-purple-300 font-bold">{todayGuess.temp_guess}°C</span>，{todayGuess.rain_guess ? '🌧️ 会下雨' : '☀️ 不下雨'}</p>
              <p className="text-white/30 text-xs">明天揭晓结果，结果在下方查看</p>
            </div>
          ) : (
            <GuessForm
              targetDate={getTomorrowNZ()}
              forecast={todayForecast}
              onSubmit={handleSubmitGuess}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </div>

      {yesterdayGuess && (
        <ResultCard guess={yesterdayGuess} dateLabel={yesterdayLabel} />
      )}

      {forecast.length > 0 && <ForecastCard days={forecast} />}

      <Leaderboard entries={leaderboard} currentNickname={profile?.nickname} />

      <div className="glass-card p-4 text-center">
        <p className="text-xs text-white/30">
          积分规则：温度差 ≤1°C → +20分 | ≤2°C → +10分 | ≤3°C → +5分 | 降雨猜对 → +10分 | 双中奖励 → +5分
        </p>
      </div>
    </div>
  );
}
