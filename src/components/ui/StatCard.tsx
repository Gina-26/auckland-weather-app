interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  accent?: 'purple' | 'cyan' | 'green' | 'orange' | 'rose';
}

const ACCENT_MAP: Record<string, string> = {
  purple: 'from-purple-500/20 to-purple-900/10 border-purple-500/25',
  cyan:   'from-cyan-500/20 to-cyan-900/10 border-cyan-500/25',
  green:  'from-emerald-500/20 to-emerald-900/10 border-emerald-500/25',
  orange: 'from-orange-500/20 to-orange-900/10 border-orange-500/25',
  rose:   'from-rose-500/20 to-rose-900/10 border-rose-500/25',
};

export default function StatCard({ icon, label, value, sub, accent = 'purple' }: StatCardProps) {
  return (
    <div className={`glass-card p-5 bg-gradient-to-br ${ACCENT_MAP[accent]} fade-in`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{icon}</span>
        <span className="text-xs text-white/55 font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-white/40 mt-1">{sub}</div>}
    </div>
  );
}
