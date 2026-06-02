'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: '数据分析', icon: '📊' },
  { href: '/game', label: '猜天气', icon: '🎮' },
  { href: '/shop', label: '头像商店', icon: '🛒' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="glass-card fixed top-3 left-4 right-4 z-50 px-6 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl">🌤️</span>
          <span className="gradient-text font-bold text-lg hidden sm:block">奥克兰天气</span>
          <span className="text-white/40 text-xs hidden md:block">Auckland Weather</span>
        </Link>

        <div className="flex gap-1 sm:gap-2">
          {NAV_ITEMS.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                pathname === href
                  ? 'bg-purple-500/30 text-purple-200 border border-purple-500/40'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>{icon}</span>
              <span className="hidden sm:block">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
