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
