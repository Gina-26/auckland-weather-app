# 🌤️ Auckland Weather

> A full-stack weather data project — 60 years of Auckland climate data, analysed with Python to answer two questions: **Is Auckland getting warmer?** and **Can a simple model predict tomorrow's weather?** Includes an interactive dashboard and a daily weather guessing game.

**[Live Demo](https://auckland-weather-app.vercel.app)** · **[GitHub](https://github.com/Gina-26/auckland-weather-app)**

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![Python](https://img.shields.io/badge/Python-3.10+-blue) ![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green) ![Vercel](https://img.shields.io/badge/Deployed-Vercel-black)

---

## Key Findings

Data: 22,208 days of Auckland weather, 1966–2026 (Open-Meteo ERA5 reanalysis). Trends use complete years only.

| | 1960s | 2020s | Trend |
|---|---|---|---|
| Mean temperature | 14.6 °C | 16.0 °C | **+0.18 °C per decade** (p < 0.001), about +1.1 °C since 1966 |
| Hot days (≥ 25 °C) per year | 3.8 | 13.5 | **More than tripled** (p = 0.01) |
| Cold nights (≤ 5 °C) per year | 13.8 | 4.7 | Down by two thirds (p < 0.001) |
| Annual rainfall | 1,241 mm | 1,378 mm | No significant trend (p = 0.80) |

- **4 of the 5 warmest years** on record happened since 2016 (warmest: 2022).
- **Rain has not clearly changed.** Year-to-year variation is far larger than any long-term trend.
- **Data limitation:** ERA5 averages weather over a grid cell tens of kilometres wide, so it smooths out local extremes. The record-breaking Auckland Anniversary flood (27 Jan 2023) only ranks #7 in this dataset. It is reliable for long-term temperature trends, not for local extreme rainfall.

## Model Evaluation: is the forecast any good?

Task: predict **tomorrow's** max temperature and whether it will rain (> 1 mm), using only today's information.
Trained on 1966–2015, **tested on 2016–2026** (3,945 unseen days), and compared against simple baselines.

| Tomorrow's high temperature | Average error (MAE) |
|---|---|
| Original model (day of year only) | ±1.47 °C |
| Baseline: same as today | ±1.06 °C |
| **Improved: day of year + today's weather** | **±1.00 °C** |

| Will it rain tomorrow? | Accuracy |
|---|---|
| Baseline: always "no rain" | 59.8% |
| Original model (day of year only) | 59.8% |
| Baseline: rain if it rained today | 66.6% |
| **Improved: day of year + today's weather** | **68.3%** |

**What I learned:** my original models reported R² = 0.76 and 66.2% accuracy, but those numbers were measured on the same data the models were trained on, with nothing to compare against. Tested properly, the original rain model was no better than always guessing "no rain", and the temperature model was beaten by "tomorrow = today". Adding today's weather fixed both, but the gain over the simple baseline is small: day-to-day weather needs real forecast inputs such as pressure and wind. A model is only useful if it beats a simple baseline.

## Features

### 📊 Analysis Dashboard

- **Key findings** — warming trend, hot days by decade, rainfall trend and data limitations
- **Model evaluation** — original vs improved model vs simple baselines, on held-out years
- **Live 30-day data** — fetched daily from the Open-Meteo ERA5 archive API (real observations, not predictions)
- **Human vs AI** — compare community prediction accuracy against the improved model
- **Interactive charts** (Recharts) — monthly temperature, 60-year trend, rainfall & rain probability

### 🎮 Daily Guess Game
- Predict tomorrow's Auckland maximum temperature (slider) and whether it will rain
- Results verified automatically the next day via Open-Meteo archive data — no manual input
- Personal accuracy stats vs the AI model: rain prediction % and average temperature error
- Leaderboard of top 10 players

**Scoring:**

| Condition | Points |
|-----------|--------|
| Temp within ±1°C | +20 |
| Temp within ±2°C | +10 |
| Temp within ±3°C | +5 |
| Rain prediction correct | +10 |
| Both correct (double hit) | +5 bonus |

### 🏆 Avatar Shop
- 9 weather-themed emoji avatars, from free to 2,000 pts
- Unlocked permanently with game points
- Active avatar shown on leaderboard

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 |
| Charts | Recharts v3 |
| Data Analysis | Python · Pandas · SciPy · scikit-learn |
| Backend | Next.js API Routes · Supabase (PostgreSQL) |
| Weather API | Open-Meteo — forecast + ERA5 archive (free, no API key) |
| Automation | Vercel Cron Jobs — daily auto-verification at 1 AM NZT |
| Deployment | Vercel (ISR, revalidates hourly) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+ with pandas, scipy and scikit-learn

### 1. Clone the repository
```bash
git clone https://github.com/Gina-26/auckland-weather-app.git
cd auckland-weather-app
```

### 2. Run the Python data analysis (first time only)
```bash
pip install -r data/requirements.txt
python data/analyze.py
# Reads data/auckland_daily_era5.csv and writes 6 JSON files to public/data/
```

### 3. Configure environment variables
```bash
cp .env.local.example .env.local
# Fill in your Supabase credentials
```

### 4. Set up Supabase
1. Create a project at [app.supabase.com](https://app.supabase.com)
2. Run `supabase/schema.sql` in the SQL Editor
3. Copy your project URL and anon key into `.env.local`

### 5. Install dependencies and run
```bash
npm install
npm run dev
# Open http://localhost:3000
```

---

## Data

**Source:** [Open-Meteo](https://open-meteo.com/) ERA5 reanalysis for Auckland (−36.94, 174.78), daily from 1966-01-01.
The raw CSV is committed at `data/auckland_daily_era5.csv`, so every number on the site can be reproduced with one command.
(If the original NIWA station CSVs are placed one directory above the project root, `analyze.py` uses those instead.)

**Generated JSON files** (produced by `data/analyze.py`):

```
public/data/
├── findings.json          # Trends, decade summaries, warmest years, wettest days
├── evaluation.json        # Model vs baseline results on held-out years
├── stats.json             # Summary statistics
├── monthly_averages.json  # Monthly averages + seasonal predictions
├── yearly_trends.json     # Annual average trends
└── model.json             # Improved model metrics (used by the game)
```

**Live data pipeline:**

- Recent 30-day chart fetches from Open-Meteo ERA5 archive (real observations)
- Game scoring uses the same archive API — never forecast/predicted data
- Vercel Cron runs at 13:00 UTC daily (≈ 1 AM NZT) to verify all pending guesses

## Deployment

```bash
npm install -g vercel
vercel --prod
```

Set the following environment variables in the Vercel dashboard:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (optional, falls back to anon) |

---

## Project Structure

```
auckland-weather-app/
├── data/
│   ├── analyze.py              # Python analysis, trend tests + model evaluation
│   ├── auckland_daily_era5.csv # Raw daily data (1966–2026)
│   └── requirements.txt
├── public/data/                # Pre-generated JSON (committed)
├── src/
│   ├── app/
│   │   ├── page.tsx            # Analysis dashboard (ISR, revalidates hourly)
│   │   ├── game/page.tsx       # Daily Guess game
│   │   ├── shop/page.tsx       # Avatar shop
│   │   └── api/
│   │       ├── weather/        # Open-Meteo forecast endpoint
│   │       ├── game/           # Profile, guess, verify, leaderboard, stats, shop
│   │       └── cron/verify/    # Automated daily verification (Vercel Cron)
│   ├── components/
│   │   ├── analysis/           # KeyFindings, ModelEvaluation
│   │   ├── charts/             # Recharts components (seasonal, yearly, rainfall, recent, hot days)
│   │   ├── game/               # GuessForm, ResultCard, Leaderboard
│   │   └── ui/                 # Navbar, StatCard
│   ├── lib/
│   │   ├── supabase.ts         # Supabase client
│   │   └── openmeteo.ts        # Open-Meteo API wrapper
│   └── types/index.ts
├── supabase/schema.sql         # Database DDL + avatar seed data
└── vercel.json                 # Cron job schedule
```

---

## License

MIT
