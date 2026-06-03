# 🌤️ Auckland Weather

> A full-stack weather data science project — 60 years of Auckland climate analysis, interactive charts, ML seasonal predictions, and a daily weather guessing game.

**[Live Demo](https://auckland-weather-app.vercel.app)** · **[GitHub](https://github.com/Gina-26/auckland-weather-app)**

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![Python](https://img.shields.io/badge/Python-3.10+-blue) ![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green) ![Vercel](https://img.shields.io/badge/Deployed-Vercel-black)

---

## Features

### 📊 Analysis Dashboard
- **Live 30-day data** — fetched daily from the Open-Meteo ERA5 archive API (real observations, not predictions)
- **Human vs AI** — compare community prediction accuracy against a trained ML seasonal model
- **60-year historical archive** — NIWA Auckland station data from 1966 to 2026
- **Interactive charts** (Recharts) — monthly temperature, 60-year trend, rainfall & rain probability
- **Seasonal ML model** — Fourier-feature linear regression (R² = 0.76) and logistic rain classifier (66.2% accuracy)

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
| Data Analysis | Python · Pandas · scikit-learn |
| Backend | Next.js API Routes · Supabase (PostgreSQL) |
| Weather API | Open-Meteo — forecast + ERA5 archive (free, no API key) |
| Automation | Vercel Cron Jobs — daily auto-verification at 1 AM NZT |
| Deployment | Vercel (ISR, revalidates hourly) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+ with pandas and scikit-learn

### 1. Clone the repository
```bash
git clone https://github.com/Gina-26/auckland-weather-app.git
cd auckland-weather-app
```

### 2. Run the Python data analysis (first time only)
```bash
# Place the NIWA CSV files one directory above the project root, or update paths in analyze.py
cd data
python analyze.py
# Generates 4 JSON files in public/data/
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

**Source:** NIWA Auckland weather station

| File | Contents | Date Range |
|------|----------|------------|
| `1962__Temperature__daily.csv` | Daily max / min / mean temperature | 1966–2026 |
| `1962__Rain__daily.csv` | Daily rainfall (mm) | 1962–2026 |

**Generated JSON files** (committed to repo, produced by `data/analyze.py`):
```
public/data/
├── stats.json             # Summary statistics (records, averages, hottest/wettest month)
├── monthly_averages.json  # Monthly averages + ML predictions
├── yearly_trends.json     # Annual average trends
└── model.json             # ML model metadata (R², accuracy)
```

**ML models:**
- **Temperature** — linear regression with sin/cos day-of-year Fourier features · R² = 0.76
- **Rainfall** — logistic regression with same features · accuracy = 66.2%

**Live data pipeline:**
- Recent 30-day chart fetches from Open-Meteo ERA5 archive (real observations)
- Game scoring uses the same archive API — never forecast/predicted data
- Vercel Cron runs at 13:00 UTC daily (≈ 1 AM NZT) to verify all pending guesses

---

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
│   ├── analyze.py              # Python analysis + ML training script
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
│   │   ├── charts/             # Recharts components (seasonal, yearly, rainfall, recent)
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
