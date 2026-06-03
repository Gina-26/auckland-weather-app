import type { LeaderboardEntry } from '@/types';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function Leaderboard({
  entries,
  currentNickname,
}: {
  entries: LeaderboardEntry[];
  currentNickname?: string;
}) {
  return (
    <div className="glass-card p-6">
      <div className="mb-4">
        <p className="wx-label mb-1">Rankings</p>
        <h3 className="text-base font-bold text-white">Leaderboard</h3>
      </div>

      {entries.length === 0 ? (
        <p className="text-center py-8 text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
          No players yet — be the first!
        </p>
      ) : (
        <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {entries.map((e, i) => {
            const isMe = e.nickname === currentNickname;
            return (
              <div
                key={e.nickname}
                className="flex items-center gap-3 py-3 px-1 rounded transition-colors"
                style={{ background: isMe ? 'rgba(117,153,255,0.08)' : 'transparent' }}
              >
                <span className="w-7 text-center text-sm font-bold" style={{ color: i < 3 ? undefined : 'rgba(255,255,255,0.3)' }}>
                  {i < 3 ? MEDALS[i] : i + 1}
                </span>
                <span className="text-xl w-8 text-center">{e.avatar_emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: isMe ? '#7599ff' : '#ffffff' }}>
                    {e.nickname}{isMe && <span className="text-xs ml-1.5" style={{ color: 'rgba(117,153,255,0.7)' }}>(you)</span>}
                  </div>
                  <div className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>
                    {e.total_guesses > 0
                      ? `${Math.round((e.correct_guesses / e.total_guesses) * 100)}% accuracy · ${e.total_guesses} predictions`
                      : 'No predictions yet'}
                  </div>
                </div>
                <span className="font-bold text-sm" style={{ color: '#7599ff' }}>
                  {e.score} <span className="text-xs font-normal" style={{ color: 'rgba(255,255,255,0.4)' }}>pts</span>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
