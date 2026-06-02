import type { LeaderboardEntry } from '@/types';

interface Props {
  entries: LeaderboardEntry[];
  currentNickname?: string;
}

const RANK_COLORS = ['text-yellow-400', 'text-gray-300', 'text-amber-600'];
const RANK_ICONS = ['🥇', '🥈', '🥉'];

export default function Leaderboard({ entries, currentNickname }: Props) {
  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-bold gradient-text mb-4">积分排行榜</h3>
      {entries.length === 0 ? (
        <p className="text-white/40 text-sm text-center py-6">暂无记录，快来抢占榜首！</p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, i) => (
            <div
              key={entry.nickname}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                entry.nickname === currentNickname
                  ? 'bg-purple-500/20 border border-purple-500/30'
                  : 'hover:bg-white/5'
              }`}
            >
              <span className={`w-6 text-center font-bold text-sm ${RANK_COLORS[i] ?? 'text-white/40'}`}>
                {i < 3 ? RANK_ICONS[i] : `${i + 1}`}
              </span>
              <span className="text-xl">{entry.avatar_emoji}</span>
              <div className="flex-1 min-w-0">
                <div className={`font-semibold text-sm truncate ${entry.nickname === currentNickname ? 'text-purple-200' : 'text-white'}`}>
                  {entry.nickname}
                  {entry.nickname === currentNickname && <span className="ml-1 text-xs text-purple-400">(我)</span>}
                </div>
                <div className="text-xs text-white/40">
                  {entry.total_guesses > 0
                    ? `${Math.round((entry.correct_guesses / entry.total_guesses) * 100)}% 正确率`
                    : '尚未参与'}
                </div>
              </div>
              <span className="font-bold text-purple-300">{entry.score}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
