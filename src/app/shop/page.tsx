'use client';
import { useState, useEffect } from 'react';
import type { GameAvatar, GameProfile } from '@/types';

const UID_KEY = 'weathergame_uid';

export default function ShopPage() {
  const [avatars, setAvatars] = useState<GameAvatar[]>([]);
  const [unlocked, setUnlocked] = useState<number[]>([]);
  const [profile, setProfile] = useState<GameProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const uid = localStorage.getItem(UID_KEY);
    setUserId(uid);

    const shopUrl = uid ? `/api/game/shop?user_id=${uid}` : '/api/game/shop';
    const profileUrl = uid ? `/api/game/profile?id=${uid}` : null;

    Promise.all([
      fetch(shopUrl).then(r => r.json()),
      profileUrl ? fetch(profileUrl).then(r => r.json()) : Promise.resolve(null),
    ]).then(([shopData, profileData]) => {
      setAvatars(shopData.avatars ?? []);
      setUnlocked(shopData.unlocked ?? [1]);
      if (profileData?.profile) setProfile(profileData.profile);
      setLoading(false);
    });
  }, []);

  async function handleAvatarAction(avatar: GameAvatar) {
    if (!userId) return;
    setPurchasing(avatar.id);
    setMessage('');

    const res = await fetch('/api/game/shop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, avatar_id: avatar.id }),
    });
    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error ?? '操作失败');
    } else if (data.purchased) {
      setUnlocked(prev => [...prev, avatar.id]);
      setProfile(prev => prev ? { ...prev, score: prev.score - avatar.cost, avatar_emoji: avatar.emoji } : prev);
      setMessage(`已购买 ${avatar.emoji} ${avatar.name}！`);
    } else if (data.equipped) {
      setProfile(prev => prev ? { ...prev, avatar_emoji: avatar.emoji } : prev);
      setMessage(`已装备 ${avatar.emoji} ${avatar.name}`);
    }

    setPurchasing(null);
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
          {[...Array(9)].map((_, i) => <div key={i} className="skeleton h-36" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="text-center fade-in">
        <h1 className="text-3xl font-bold gradient-text">头像商店</h1>
        <p className="text-white/50 text-sm mt-2">用积分解锁专属天气头像</p>
      </div>

      {!userId && (
        <div className="glass-card p-6 text-center border-yellow-500/20">
          <p className="text-white/60">请先前往 <a href="/game" className="text-purple-400 underline">猜天气</a> 创建你的游戏档案</p>
        </div>
      )}

      {profile && (
        <div className="glass-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{profile.avatar_emoji}</span>
            <div>
              <div className="font-bold text-white">{profile.nickname}</div>
              <div className="text-xs text-white/40">当前头像</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold gradient-text">{profile.score}</div>
            <div className="text-xs text-white/40">可用积分</div>
          </div>
        </div>
      )}

      {message && (
        <div className={`glass-card p-4 text-center text-sm ${
          message.includes('失败') || message.includes('不足') ? 'text-rose-400 border-rose-500/25' : 'text-emerald-400 border-emerald-500/25'
        } fade-in`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
        {avatars.map((avatar) => {
          const isUnlocked = unlocked.includes(avatar.id);
          const isEquipped = profile?.avatar_emoji === avatar.emoji;
          const canAfford = profile ? profile.score >= avatar.cost : false;

          return (
            <div
              key={avatar.id}
              className={`glass-card p-4 text-center card-hoverable cursor-pointer transition-all duration-200 fade-in ${
                isEquipped ? 'border-purple-400/50 bg-purple-500/15' :
                isUnlocked ? 'border-emerald-500/30' :
                !canAfford && !avatar.is_default ? 'opacity-60' : ''
              }`}
              onClick={() => userId && handleAvatarAction(avatar)}
            >
              <div className="text-4xl mb-2">{avatar.emoji}</div>
              <div className="text-xs font-bold text-white truncate">{avatar.name}</div>
              <div className="text-xs text-white/40 mt-1 line-clamp-2">{avatar.description}</div>

              <div className="mt-3">
                {isEquipped ? (
                  <span className="text-xs bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded-full border border-purple-400/40">
                    已装备
                  </span>
                ) : isUnlocked ? (
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    {purchasing === avatar.id ? '…' : '装备'}
                  </span>
                ) : avatar.is_default ? (
                  <span className="text-xs text-white/30">免费</span>
                ) : (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    canAfford
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-white/30'
                  }`}>
                    {purchasing === avatar.id ? '…' : `${avatar.cost} 分`}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="glass-card p-4 text-center">
        <p className="text-xs text-white/30">
          通过每日猜天气积累积分 · 积分可用于解锁头像 · 购买后永久拥有
        </p>
      </div>
    </div>
  );
}
