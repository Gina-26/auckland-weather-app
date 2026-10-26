import type { Evaluation, EvalModel } from '@/types';

const KIND_COLOR: Record<EvalModel['kind'], string> = {
  original: '#fcac28',
  baseline: 'rgba(255,255,255,0.35)',
  improved: '#54bb51',
};
const KIND_LABEL: Record<EvalModel['kind'], string> = {
  original: 'Original',
  baseline: 'Baseline',
  improved: 'Improved',
};

function Row({ m, value, pct }: { m: EvalModel; value: string; pct: number }) {
  const color = KIND_COLOR[m.kind];
  return (
    <div>
      <div className="flex justify-between items-baseline gap-3 mb-1.5">
        <div className="min-w-0">
          <span className="text-sm font-semibold text-white">{m.name}</span>
          <span className="text-[10px] uppercase tracking-wide ml-2" style={{ color }}>{KIND_LABEL[m.kind]}</span>
          <div className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>{m.description}</div>
        </div>
        <span className="text-base font-bold whitespace-nowrap" style={{ color }}>{value}</span>
      </div>
      <div className="h-2 w-full rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div className="h-full rounded-full" style={{ width: `${Math.max(2, Math.min(pct, 100))}%`, background: color }} />
      </div>
    </div>
  );
}

export default function ModelEvaluation({ e }: { e: Evaluation }) {
  const maxMae = Math.max(...e.temperature.map(m => m.mae));
  const original = e.rain.find(m => m.kind === 'original');
  const noRain = e.rain.find(m => m.name.startsWith('Always'));
  const origTemp = e.temperature.find(m => m.kind === 'original');
  const persist = e.temperature.find(m => m.name === 'Same as today');
  const improvedTemp = e.temperature.find(m => m.kind === 'improved');

  return (
    <section className="space-y-6 fade-in">
      <div>
        <p className="wx-label mb-1">Finding 3</p>
        <h2 className="text-xl font-bold text-white">Is the forecasting model any good?</h2>
        <p className="text-sm mt-1 max-w-3xl" style={{ color: 'rgba(255,255,255,0.52)' }}>
          {e.task}. Models are trained on {e.trainYears} and tested on {e.testYears}
          {' '}({e.testDays.toLocaleString()} days they never saw), then compared with simple baselines.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white">Tomorrow&apos;s high temperature</h3>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
              Average error in °C · lower is better
            </p>
          </div>
          {e.temperature.map(m => (
            <Row key={m.name} m={m} value={`±${m.mae.toFixed(2)}°C`} pct={(m.mae / maxMae) * 100} />
          ))}
        </div>

        <div className="glass-card p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white">Will it rain tomorrow?</h3>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
              Accuracy · higher is better · it rained on {Math.round(e.rainBaseRate * 100)}% of test days
            </p>
          </div>
          {e.rain.map(m => (
            <Row key={m.name} m={m} value={`${(m.accuracy * 100).toFixed(1)}%`} pct={m.accuracy * 100} />
          ))}
        </div>
      </div>

      <div className="glass-card p-6">
        <p className="wx-label mb-3">What this shows</p>
        <ul className="space-y-2 text-sm list-disc pl-5" style={{ color: 'rgba(255,255,255,0.6)' }}>
          {original && noRain && (
            <li>
              The original rain model scores {(original.accuracy * 100).toFixed(1)}%, exactly the same as
              always guessing &ldquo;no rain&rdquo;. It learned nothing beyond the base rate.
            </li>
          )}
          {origTemp && persist && (
            <li>
              The original temperature model (error ±{origTemp.mae.toFixed(2)}°C) is beaten by simply
              assuming tomorrow will be like today (±{persist.mae.toFixed(2)}°C). It only looked good before
              because it was scored on its own training data (R² {e.originalInSampleR2.toFixed(2)}) with no baseline to compare against.
            </li>
          )}
          {improvedTemp && (
            <li>
              Adding today&apos;s weather to the seasonal pattern gives the best results on both tasks
              (±{improvedTemp.mae.toFixed(2)}°C), but the gain over the simple baseline is small. Day-to-day
              weather is hard to predict without real forecast data such as air pressure and wind.
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}
