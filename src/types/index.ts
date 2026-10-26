export interface MonthlyAverage {
  months: string[];
  avgMaxTemp: (number | null)[];
  avgMinTemp: (number | null)[];
  avgRainfall: (number | null)[];
  predictedMaxTemp: number[];
  rainProbability: number[];
}

export interface YearlyTrend {
  years: number[];
  avgMaxTemp: number[];
  avgMinTemp: number[];
  totalRainfall: number[];
}

export interface WeatherStats {
  dataSource?: string;
  totalDays: number;
  dataStartYear: number;
  dataEndYear: number;
  allTimeMaxTemp: number;
  allTimeMinTemp: number;
  avgAnnualRainfall: number;
  avgAnnualMaxTemp: number;
  avgAnnualMinTemp: number;
  hottestMonth: string;
  wettestMonth: string;
}

export interface ModelData {
  monthlyPredictedMaxTemp: number[];
  monthlyRainProbability: number[];
  tempModelR2: number;
  rainModelAccuracy: number;
}

export interface ForecastDay {
  date: string;
  maxTemp: number;
  minTemp: number;
  rainfall: number;
}

export interface GameProfile {
  id: string;
  nickname: string;
  avatar_emoji: string;
  score: number;
  total_guesses: number;
  correct_guesses: number;
  created_at: string;
}

export interface GameGuess {
  id: string;
  user_id: string;
  target_date: string;
  temp_guess: number;
  rain_guess: boolean;
  actual_temp: number | null;
  actual_rain: boolean | null;
  temp_points: number;
  rain_points: number;
  bonus_points: number;
  is_verified: boolean;
  created_at: string;
}

export interface GameAvatar {
  id: number;
  emoji: string;
  name: string;
  description: string;
  cost: number;
  is_default: boolean;
}

export interface LeaderboardEntry {
  nickname: string;
  avatar_emoji: string;
  score: number;
  total_guesses: number;
  correct_guesses: number;
}

export interface Trend {
  perDecade: number;
  pValue: number;
  significant: boolean;
}

export interface DecadeSummary {
  decade: string;
  years: number;
  meanTemp: number;
  hotDays: number;
  coldNights: number;
  rainfall: number;
  heavyRainDays: number;
}

export interface Findings {
  dataSource: string;
  firstYear: number;
  lastYear: number;
  temperatureTrend: Trend & { totalChange: number };
  hotDaysTrend: Trend;
  coldNightsTrend: Trend;
  rainfallTrend: Trend;
  heavyRainTrend: Trend;
  hotDays: {
    firstDecade: string; firstDecadeAvg: number;
    lastDecade: string; lastDecadeAvg: number; lastDecadeYears: number;
    ratio: number;
  };
  coldNights: { firstDecadeAvg: number; lastDecadeAvg: number };
  warmestYears: { year: number; meanTemp: number }[];
  warmestYearsSince2016: number;
  decades: DecadeSummary[];
  wettestDays: { date: string; rainfall: number }[];
  thresholds: { hotDayC: number; coldNightC: number; heavyRainMm: number; rainyDayMm: number };
}

export interface EvalModel {
  name: string;
  description: string;
  kind: 'original' | 'baseline' | 'improved';
}

export interface Evaluation {
  task: string;
  trainYears: string;
  testYears: string;
  testDays: number;
  rainBaseRate: number;
  temperature: (EvalModel & { mae: number; r2: number })[];
  rain: (EvalModel & { accuracy: number })[];
  originalInSampleR2: number;
}
