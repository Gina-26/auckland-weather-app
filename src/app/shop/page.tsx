'use client';
import { useState, useEffect } from 'react';
import type { GameAvatar, GameProfile } from '@/types';

const UID_KEY = 'weathergame_uid';

export default function ShopPage() {
  const [avatars, setAvatars]   = useState<GameAvatar[]>([]);
  const [unlocked, setUnlocked] = useState<number[]>([]);
  const [profile, setProfile]   = useState<GameProfile | null>(null);
  const [userId, setUserId]     = useState<string | null>(null);
  const [loading, setLoading]   = useState(true);
  const [busy, setBusy]         = useState<number | null>(null);
  const [msg, setMsg]           = useState('');
  const [isErr, setIsErr]       = useState(false);

  useEffect(() => {
    const uid = localStorage.getItem(UID_KEY);
    setUserId(uid);
    Promise.all([
      fetch(uid ? `/api/game/shop?user_id=${uid}` : '/api/game/shop').then(r => r.json()),
      uid ? fetch(`/api/game/profile?id=${uid}`).then(r => r.json()) : Promise.resolve(null),
    ]).then(([shop, prof]) => {
      setAvatars(shop.avatars ?? []);
      setUnlocked(shop.unlocked ?? [1]);
      if (prof?.profile) setProfile(prof.profile);
      setLoading(false);
    });
  }, []);

  async function handleAvatar(a: GameAvatar) {
    if (!userId) return;
    setBusy(a.id); setMsg(''); setIsErr(false);
    const r = await fetch('/api/game/shop', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, avatar_id: a.id }),
    });
    const data = await r.json();
    if (!r.ok) {
      setMsg(data.error ?? 'Action failed'); setIsErr(true);
    } else if (data.purchased) {
      setUnlocked(prev => [...prev, a.id]);
      setProfile(prev => prev ? { ...prev, score: prev.score - a.cost, avatar_emoji: a.emoji } : prev);
      setMsg(`Unlocked ${a.emoji} ${a.name}!`);
    } else if (data.equipped) {
      setProfile(prev => prev ? { ...prev, avatar_emoji: a.emoji } : prev);
      setMsg(`Now wearing ${a.emoji} ${a.name}`);
    }
    setBusy(null);
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
        {[...Array(9)].map((_, i) => <div key={i} className="skeleton h-40" />)}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-7">
      {/* Header */}
      <div className="fade-in">
        <p className="wx-label mb-1">Rewards</p>
        <h1 className="text-3xl font-bold text-white mb-1" style={{ letterSpacing: '-0.03em' }}>Avatar Collection</h1>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Spend points earned from the Daily Guess game to unlock weather-themed avatars.
        </p>
        <hr className="wx-divider mt-5" />
      </div>

      {!userId && (
        <div className="glass-card p-5 text-center">
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
            <a href="/game" className="underline" style={{ color: '#7599ff' }}>Join the Daily Guess</a> game to earn points and unlock avatars.
          </p>
        </div>
      )}

      {profile && (
        <div className="glass-card p-4 flex items-center gap-4">
          <span className="text-4xl">{profile.avatar_emoji}</span>
          <div className="flex-1">
            <div className="font-bold text-white">{profile.nickname}</div>
            <div className="wx-label">Active avatar</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold" style={{ color: '#7599ff', letterSpacing: '-0.03em' }}>{profile.score}</div>
            <div className="wx-label">points available</div>
          </div>
        </div>
      )}

      {msg && (
        <div
          className="glass-card p-4 text-sm text-center fade-in"
          style={{ borderColor: isErr ? 'rgba(239,43,47,0.4)' : 'rgba(84,187,81,0.4)', color: isErr ? '#ef6b6b' : '#54bb51' }}
        >
          {msg}
        </div>
      )}

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
        {avatars.map((a) => {
          const owned    = unlocked.includes(a.id);
          const equipped = profile?.avatar_emoji === a.emoji;
          const afford   = profile ? profile.score >= a.cost : false;

          return (
            <button
              key={a.id}
              onClick={() => userId && handleAvatar(a)}
              disabled={!userId || busy === a.id}
              className="glass-card card-hoverable p-4 flex flex-col items-center text-center transition-all duration-200 fade-in disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                borderColor: equipped ? 'rgba(117,153,255,0.55)' : owned ? 'rgba(84,187,81,0.35)' : 'rgba(117,153,255,0.14)',
                background:  equipped ? 'rgba(117,153,255,0.12)' : undefined,
              }}
            >
              <div className="text-4xl mb-2">{a.emoji}</div>
              <div className="text-xs font-semibold text-white truncate w-full">{a.name}</div>
              <div className="text-xs mt-1 mb-3 line-clamp-2" style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.65rem' }}>
                {a.description}
              </div>

              {busy === a.id ? (
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>…</span>
              ) : equipped ? (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(117,153,255,0.25)', color: '#7599ff', border: '1px solid rgba(117,153,255,0.4)' }}>
                  Equipped
                </span>
              ) : owned ? (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(84,187,81,0.2)', color: '#54bb51', border: '1px solid rgba(84,187,81,0.35)' }}>
                  Equip
                </span>
              ) : a.is_default ? (
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Free</span>
              ) : (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{
                  background: afford ? 'rgba(117,153,255,0.15)' : 'rgba(255,255,255,0.05)',
                  color:      afford ? '#7599ff' : 'rgba(255,255,255,0.28)',
                  border:     `1px solid ${afford ? 'rgba(117,153,255,0.35)' : 'rgba(255,255,255,0.1)'}`,
                }}>
                  {a.cost} pts
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
        Avatars are permanently unlocked after purchase · Earn points by playing the Daily Guess game
      </p>
    </div>
  );
}
