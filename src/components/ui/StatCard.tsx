interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  accent?: 'blue' | 'teal' | 'green' | 'orange' | 'red';
}

const ACCENT: Record<string, { border: string; glow: string }> = {
  blue:   { border: 'rgba(117,153,255,0.45)', glow: 'rgba(117,153,255,0.08)' },
  teal:   { border: 'rgba(87,194,221,0.45)',  glow: 'rgba(87,194,221,0.08)'  },
  green:  { border: 'rgba(84,187,81,0.45)',   glow: 'rgba(84,187,81,0.08)'   },
  orange: { border: 'rgba(252,172,40,0.45)',  glow: 'rgba(252,172,40,0.08)'  },
  red:    { border: 'rgba(239,43,47,0.45)',   glow: 'rgba(239,43,47,0.08)'   },
};

export default function StatCard({ icon, label, value, sub, accent = 'blue' }: StatCardProps) {
  const { border, glow } = ACCENT[accent];
  return (
    <div
      className="fade-in rounded-md p-5 flex flex-col gap-1"
      style={{
        background: `rgba(13,28,65,0.75)`,
        border: `1px solid ${border}`,
        boxShadow: `inset 0 0 40px ${glow}`,
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <span className="wx-label">{label}</span>
      </div>
      <div
        className="text-3xl font-bold leading-none"
        style={{ color: '#ffffff', letterSpacing: '-0.03em' }}
      >
        {value}
      </div>
      {sub && <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.42)' }}>{sub}</div>}
    </div>
  );
}
