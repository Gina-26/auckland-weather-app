import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';
import Navbar from '@/components/ui/Navbar';

export const metadata: Metadata = {
  title: '奥克兰天气 | Auckland Weather',
  description: '60年奥克兰天气数据分析 + 每日猜天气游戏',
  keywords: 'Auckland, weather, New Zealand, 奥克兰, 天气, 数据分析',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body>
        <Navbar />
        <main className="pt-20 min-h-screen">
          {children}
        </main>
        <Analytics />
      </body>
    </html>
  );
}
