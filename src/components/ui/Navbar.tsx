'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/',      label: 'Analysis',    icon: '📊' },
  { href: '/game',  label: 'Daily Guess', icon: '🎮' },
  { href: '/shop',  label: 'Avatars',     icon: '🏆' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{ background: 'rgba(7,17,46,0.96)', borderBottom: '1px solid rgba(117,153,255,0.18)', backdropFilter: 'blur(8px)' }}
    >
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <span className="text-2xl">🌤️</span>
          <div className="leading-tight">
            <div className="text-white font-bold text-base tracking-tight group-hover:text-[#7599ff] transition-colors">
              Auckland Weather
            </div>
            <div className="text-[10px] text-white/35 font-normal tracking-wide uppercase">
              NIWA Station · Est. 1962
            </div>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`px-4 py-2 rounded text-sm font-semibold transition-all duration-150 ${
                  active
                    ? 'bg-[#7599ff]/20 text-[#7599ff] border border-[#7599ff]/35'
                    : 'text-white/60 hover:text-white hover:bg-white/8'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
