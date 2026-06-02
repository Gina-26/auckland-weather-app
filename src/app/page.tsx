import { Suspense } from 'react';
import StatCard from '@/components/ui/StatCard';
import SeasonalChart from '@/components/charts/SeasonalChart';
import YearlyTrendChart from '@/components/charts/YearlyTrendChart';
import RainfallBarChart from '@/components/charts/RainfallBarChart';
import type { WeatherStats, MonthlyAverage, YearlyTrend } from '@/types';

let stats: WeatherStats | null = null;
let monthly: MonthlyAverage | null = null;
let yearly: YearlyTrend | null = null;

try {
  stats  = require('../../public/data/stats.json')           as WeatherStats;
  monthly = require('../../public/data/monthly_averages.json') as MonthlyAverage;
  yearly  = require('../../public/data/yearly_trends.json')    as YearlyTrend;
} catch {
  // data not yet generated — show placeholder
}

function ChartSkeleton() {
  return <div className="skeleton h-80 w-full" />;
}

export default function DashboardPage() {
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
            sub={`历史最高 ${stats.allTimeMaxTemp}°C`}
          />
          <StatCard
            icon="💧" label="年均降雨量" accent="cyan"
            value={`${stats.avgAnnualRainfall}mm`}
            sub={`最湿月份：${stats.wettestMonth}`}
          />
          <StatCard
            icon="☀️" label="最热月份" accent="orange"
            value={stats.hottestMonth}
            sub="南半球夏末最热"
          />
          <StatCard
            icon="❄️" label="历史最低温" accent="green"
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
              <p className="mt-1">新西兰国家气象局（NIWA）奥克兰气象站</p>
            </div>
            <div>
              <span className="text-white/70 font-medium">分析方法</span>
              <p className="mt-1">Python + Pandas 数据清洗，scikit-learn 季节性回归模型</p>
            </div>
            <div>
              <span className="text-white/70 font-medium">预测精度</span>
              <p className="mt-1">温度模型 R²=0.76，降雨分类准确率 66.2%</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
