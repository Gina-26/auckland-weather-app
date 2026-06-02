import { Suspense } from 'react';
import StatCard from '@/components/ui/StatCard';
import SeasonalChart from '@/components/charts/SeasonalChart';
import YearlyTrendChart from '@/components/charts/YearlyTrendChart';
import RainfallBarChart from '@/components/charts/RainfallBarChart';
import type { WeatherStats, MonthlyAverage, YearlyTrend } from '@/types';

async function loadData<T>(file: string): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/data/${file}`, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`Failed to load ${file}`);
  return res.json();
}

function ChartSkeleton() {
  return <div className="skeleton h-80 w-full" />;
}

export default async function DashboardPage() {
  let stats: WeatherStats | null = null;
  let monthly: MonthlyAverage | null = null;
  let yearly: YearlyTrend | null = null;

  try {
    [stats, monthly, yearly] = await Promise.all([
      loadData<WeatherStats>('stats.json'),
      loadData<MonthlyAverage>('monthly_averages.json'),
      loadData<YearlyTrend>('yearly_trends.json'),
    ]);
  } catch {
    // data not generated yet
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="text-center space-y-2 fade-in">
        <h1 className="text-4xl md:text-5xl font-bold gradient-text">奥克兰天气档案</h1>
        <p className="text-white/50 text-lg">
          {stats
            ? `${stats.dataStartYear}—${stats.dataEndYear}  ·  ${stats.totalDays.toLocaleString()} 天气象数据`
            : '60年奥克兰气象数据分析'}
        </p>
      </div>

      {stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon="🌡️" label="年均最高温" accent="purple"
            value={`${stats.avgAnnualMaxTemp}°C`}
            sub={`最高纪录 ${stats.allTimeMaxTemp}°C`}
          />
          <StatCard
            icon="💧" label="年均降雨量" accent="cyan"
            value={`${stats.avgAnnualRainfall}mm`}
            sub={`最湿月份：${stats.wettestMonth}`}
          />
          <StatCard
            icon="☀️" label="最热月份" accent="orange"
            value={stats.hottestMonth}
            sub={`夏季均温 ${stats.avgAnnualMaxTemp + 4}°C`}
          />
          <StatCard
            icon="❄️" label="最低纪录" accent="green"
            value={`${stats.allTimeMinTemp}°C`}
            sub={`年均最低 ${stats.avgAnnualMinTemp}°C`}
          />
        </div>
      ) : (
        <div className="glass-card p-8 text-center">
          <p className="text-white/50 text-lg mb-2">数据文件尚未生成</p>
          <p className="text-white/30 text-sm">请先运行 <code className="bg-white/10 px-2 py-0.5 rounded">cd data && python analyze.py</code></p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Suspense fallback={<ChartSkeleton />}>
          {monthly ? <SeasonalChart data={monthly} /> : <div className="skeleton h-80 w-full" />}
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          {yearly ? <YearlyTrendChart data={yearly} /> : <div className="skeleton h-80 w-full" />}
        </Suspense>
      </div>

      <Suspense fallback={<ChartSkeleton />}>
        {monthly ? <RainfallBarChart data={monthly} /> : <div className="skeleton h-80 w-full" />}
      </Suspense>

      {stats && (
        <div className="glass-card p-6 fade-in">
          <h3 className="text-base font-bold text-white/80 mb-3">关于这份数据</h3>
          <div className="grid sm:grid-cols-3 gap-4 text-sm text-white/50">
            <div>
              <span className="text-white/70 font-medium">数据来源</span>
              <p className="mt-1">新西兰国家气象局（NIWA）奥克兰观测站</p>
            </div>
            <div>
              <span className="text-white/70 font-medium">分析方法</span>
              <p className="mt-1">Python + Pandas 数据清洗，scikit-learn 季节性回归模型</p>
            </div>
            <div>
              <span className="text-white/70 font-medium">预测模型</span>
              <p className="mt-1">基于傅里叶特征的线性/逻辑回归，捕捉年度季节性规律</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
