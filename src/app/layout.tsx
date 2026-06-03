import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';
import Navbar from '@/components/ui/Navbar';

export const metadata: Metadata = {
  title: 'Auckland Weather | 60 Years of Climate Data',
  description: 'Historical Auckland weather analysis covering 60 years of NIWA station data, with interactive charts, ML seasonal predictions, and a daily weather guessing game.',
  keywords: 'Auckland, weather, New Zealand, NIWA, climate, temperature, rainfall, forecast',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="pt-20 min-h-screen">
          {children}
        </main>
        <footer className="border-t border-white/8 mt-16 py-8 text-center text-xs text-white/30">
          <p>Data source: NIWA Auckland Station · Weather forecasts via Open-Meteo · Built with Next.js & Supabase</p>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
