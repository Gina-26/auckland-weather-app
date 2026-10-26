#!/usr/bin/env python3
"""
Auckland Weather Data Analysis
==============================

Reads ~60 years of daily Auckland weather, answers three questions and exports
JSON files into public/data/ for the Next.js frontend:

  1. Is Auckland getting warmer?          -> findings.json
  2. Is the forecasting model any good?   -> evaluation.json
  3. Basic climate summary for charts     -> stats.json, monthly_averages.json,
                                             yearly_trends.json, model.json

Data source (in order of preference):
  - NIWA station CSVs (1962__Temperature__daily.csv / 1962__Rain__daily.csv)
    placed one directory above the project root, if present
  - otherwise data/auckland_daily_era5.csv: Open-Meteo ERA5 reanalysis for
    Auckland, 1966-01-01 onwards (committed to this repo, so the analysis is
    fully reproducible)

Usage:  python data/analyze.py
"""

import json
import warnings
from pathlib import Path

import numpy as np
import pandas as pd
from scipy import stats as sstats
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.metrics import accuracy_score, mean_absolute_error, r2_score

warnings.filterwarnings("ignore")

ROOT     = Path(__file__).resolve().parent.parent
NIWA_TEMP = ROOT.parent / "1962__Temperature__daily.csv"
NIWA_RAIN = ROOT.parent / "1962__Rain__daily.csv"
ERA5_CSV  = ROOT / "data" / "auckland_daily_era5.csv"
OUT_DIR   = ROOT / "public" / "data"

MONTHS   = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
MID_DOYS = [15, 46, 74, 105, 135, 166, 196, 227, 258, 288, 319, 349]

RAIN_DAY_MM    = 1.0   # a "rainy day" = more than 1 mm
HOT_DAY_C      = 25.0  # a "hot day"   = max temp of 25 °C or more
COLD_NIGHT_C   = 5.0   # a "cold night" = min temp of 5 °C or less
HEAVY_RAIN_MM  = 50.0  # a "heavy rain day" = 50 mm or more
TEST_START_YEAR = 2016 # models are trained on data before this year, tested after


# ── Loading ──────────────────────────────────────────────────────────────────

def load_niwa() -> tuple[pd.DataFrame, str]:
    t = pd.read_csv(NIWA_TEMP, parse_dates=["Observation time UTC"]).rename(columns={
        "Observation time UTC": "date",
        "Maximum Temperature [Deg C]": "max_temp",
        "Minimum Temperature [Deg C]": "min_temp",
        "Mean Temperature [Deg C]": "mean_temp",
    })
    r = pd.read_csv(NIWA_RAIN, parse_dates=["Observation time UTC"]).rename(columns={
        "Observation time UTC": "date", "Rainfall [mm]": "rainfall",
    })
    for df in (t, r):
        df["date"] = df["date"].dt.normalize()
    for c in ["max_temp", "min_temp", "mean_temp"]:
        t[c] = pd.to_numeric(t[c], errors="coerce")
    r["rainfall"] = pd.to_numeric(r["rainfall"], errors="coerce")
    df = t[["date", "max_temp", "min_temp", "mean_temp"]].merge(
        r[["date", "rainfall"]], on="date", how="inner")
    return df, "NIWA Auckland station"


def load_era5() -> tuple[pd.DataFrame, str]:
    # Open-Meteo CSV export: 2 metadata lines, a blank line, then the data.
    df = pd.read_csv(ERA5_CSV, skiprows=3)
    df.columns = ["date", "max_temp", "min_temp", "mean_temp", "rainfall"]
    df["date"] = pd.to_datetime(df["date"])
    return df, "Open-Meteo ERA5 reanalysis (Auckland)"


def load() -> tuple[pd.DataFrame, str]:
    if NIWA_TEMP.exists() and NIWA_RAIN.exists():
        df, source = load_niwa()
    else:
        df, source = load_era5()

    before = len(df)
    df = df.dropna(subset=["max_temp", "min_temp", "rainfall"]).copy()
    df = df.sort_values("date").drop_duplicates("date").reset_index(drop=True)
    print(f"  Source: {source}")
    print(f"  Rows: {before:,} loaded, {before - len(df):,} dropped (missing/duplicate)")

    df["year"]  = df["date"].dt.year
    df["month"] = df["date"].dt.month
    df["doy"]   = df["date"].dt.dayofyear
    df["rainy"] = (df["rainfall"] > RAIN_DAY_MM).astype(int)
    return df, source


# ── Helpers ──────────────────────────────────────────────────────────────────

def seasonal_features(doy) -> np.ndarray:
    """Fourier (sin/cos) features for day-of-year: captures the seasonal cycle."""
    d = np.asarray(doy, dtype=float)
    return np.column_stack([
        np.sin(2 * np.pi * d / 365.25), np.cos(2 * np.pi * d / 365.25),
        np.sin(4 * np.pi * d / 365.25), np.cos(4 * np.pi * d / 365.25),
    ])


def complete_years(df: pd.DataFrame) -> pd.DataFrame:
    """Only keep years with (almost) a full year of data, so annual totals are fair."""
    counts = df.groupby("year").size()
    return df[df["year"].isin(counts[counts >= 360].index)]


def r(x, n=2):
    return round(float(x), n)


# ── 1. Findings: is Auckland getting warmer? ─────────────────────────────────

def compute_findings(df: pd.DataFrame, source: str) -> dict:
    full = complete_years(df)
    yearly = full.groupby("year").agg(
        mean_temp=("mean_temp", "mean"),
        hot_days=("max_temp", lambda s: int((s >= HOT_DAY_C).sum())),
        cold_nights=("min_temp", lambda s: int((s <= COLD_NIGHT_C).sum())),
        rainfall=("rainfall", "sum"),
        heavy_rain_days=("rainfall", lambda s: int((s >= HEAVY_RAIN_MM).sum())),
    )

    def trend(col):
        fit = sstats.linregress(yearly.index, yearly[col])
        return {"perDecade": r(fit.slope * 10, 3), "pValue": r(fit.pvalue, 4),
                "significant": bool(fit.pvalue < 0.05)}

    yearly["decade"] = (yearly.index // 10) * 10
    decades = yearly.groupby("decade").agg(
        years=("mean_temp", "size"),
        meanTemp=("mean_temp", "mean"),
        hotDays=("hot_days", "mean"),
        coldNights=("cold_nights", "mean"),
        rainfall=("rainfall", "mean"),
        heavyRainDays=("heavy_rain_days", "mean"),
    ).reset_index()

    first, last = decades.iloc[0], decades.iloc[-1]
    temp_trend = trend("mean_temp")
    span_years = int(yearly.index.max() - yearly.index.min())

    warmest = yearly["mean_temp"].sort_values(ascending=False).head(5)
    wettest_days = df.nlargest(10, "rainfall")[["date", "rainfall"]]

    return {
        "dataSource": source,
        "firstYear": int(yearly.index.min()),
        "lastYear": int(yearly.index.max()),
        "temperatureTrend": {**temp_trend,
                             "totalChange": r(temp_trend["perDecade"] * span_years / 10, 2)},
        "hotDaysTrend": trend("hot_days"),
        "coldNightsTrend": trend("cold_nights"),
        "rainfallTrend": trend("rainfall"),
        "heavyRainTrend": trend("heavy_rain_days"),
        "hotDays": {"firstDecade": f"{int(first.decade)}s", "firstDecadeAvg": r(first.hotDays, 1),
                    "lastDecade": f"{int(last.decade)}s", "lastDecadeAvg": r(last.hotDays, 1),
                    "lastDecadeYears": int(last.years),
                    "ratio": r(last.hotDays / first.hotDays, 1)},
        "coldNights": {"firstDecadeAvg": r(first.coldNights, 1),
                       "lastDecadeAvg": r(last.coldNights, 1)},
        "warmestYears": [{"year": int(y), "meanTemp": r(t)} for y, t in warmest.items()],
        "warmestYearsSince2016": int((warmest.index >= 2016).sum()),
        "decades": [{
            "decade": f"{int(d.decade)}s", "years": int(d.years),
            "meanTemp": r(d.meanTemp), "hotDays": r(d.hotDays, 1),
            "coldNights": r(d.coldNights, 1), "rainfall": r(d.rainfall, 0),
            "heavyRainDays": r(d.heavyRainDays, 1),
        } for d in decades.itertuples()],
        "wettestDays": [{"date": d.strftime("%Y-%m-%d"), "rainfall": r(mm, 1)}
                        for d, mm in zip(wettest_days["date"], wettest_days["rainfall"])],
        "thresholds": {"hotDayC": HOT_DAY_C, "coldNightC": COLD_NIGHT_C,
                       "heavyRainMm": HEAVY_RAIN_MM, "rainyDayMm": RAIN_DAY_MM},
    }


# ── 2. Evaluation: is the forecasting model any good? ────────────────────────

def compute_evaluation(df: pd.DataFrame) -> tuple[dict, LinearRegression, LogisticRegression]:
    """
    Task: predict TOMORROW's max temperature and whether it will rain tomorrow,
    using only what we know today. Train on years before TEST_START_YEAR and
    test on later years (a time-based split, so the model never sees the future).
    Every model is compared with simple baselines.
    """
    d = df.copy()
    d["next_max"]   = d["max_temp"].shift(-1)
    d["next_rainy"] = d["rainy"].shift(-1)
    # tomorrow must really be the next calendar day
    d = d[d["date"].shift(-1) - d["date"] == pd.Timedelta(days=1)].dropna(subset=["next_max", "next_rainy"])
    d["next_rainy"] = d["next_rainy"].astype(int)
    d["next_doy"] = (d["date"] + pd.Timedelta(days=1)).dt.dayofyear

    season = seasonal_features(d["next_doy"])
    today = np.column_stack([
        d["max_temp"], d["min_temp"], d["max_temp"] - d["min_temp"],
        d["rainy"], np.log1p(d["rainfall"]),
    ])
    X_season, X_full = season, np.column_stack([season, today])

    train = (d["year"] < TEST_START_YEAR).values
    test = ~train
    y_t, y_r = d["next_max"].values, d["next_rainy"].values

    # Temperature
    temp_models = []
    def add_temp(name, desc, pred, kind):
        temp_models.append({"name": name, "description": desc, "kind": kind,
                            "mae": r(mean_absolute_error(y_t[test], pred), 2),
                            "r2": r(r2_score(y_t[test], pred), 3)})

    seasonal_t = LinearRegression().fit(X_season[train], y_t[train])
    full_t     = LinearRegression().fit(X_full[train], y_t[train])
    add_temp("Seasonal average", "Original model: uses only the day of the year",
             seasonal_t.predict(X_season[test]), "original")
    add_temp("Same as today", "Baseline: tomorrow's high = today's high",
             d["max_temp"].values[test], "baseline")
    add_temp("Season + today's weather", "Improved model: day of year plus today's temperature and rain",
             full_t.predict(X_full[test]), "improved")

    # Rain
    rain_models = []
    def add_rain(name, desc, pred, kind):
        rain_models.append({"name": name, "description": desc, "kind": kind,
                            "accuracy": r(accuracy_score(y_r[test], pred), 3)})

    seasonal_r = LogisticRegression(max_iter=1000).fit(X_season[train], y_r[train])
    full_r     = LogisticRegression(max_iter=1000).fit(X_full[train], y_r[train])
    add_rain("Always \"no rain\"", "Baseline: never predict rain",
             np.zeros(test.sum(), dtype=int), "baseline")
    add_rain("Seasonal average", "Original model: uses only the day of the year",
             seasonal_r.predict(X_season[test]), "original")
    add_rain("Same as today", "Baseline: rain tomorrow if it rained today",
             d["rainy"].values[test], "baseline")
    add_rain("Season + today's weather", "Improved model: day of year plus today's temperature and rain",
             full_r.predict(X_full[test]), "improved")

    # What the original project reported: scored on the same data it was trained on.
    in_sample_r2 = r(seasonal_t.score(X_season[train], y_t[train]), 3)

    evaluation = {
        "task": "Predict tomorrow's max temperature and whether it will rain (>1 mm)",
        "trainYears": f"{int(d['year'].min())}–{TEST_START_YEAR - 1}",
        "testYears": f"{TEST_START_YEAR}–{int(d['year'].max())}",
        "testDays": int(test.sum()),
        "rainBaseRate": r(y_r[test].mean(), 3),
        "temperature": temp_models,
        "rain": rain_models,
        "originalInSampleR2": in_sample_r2,
    }
    return evaluation, full_t, full_r


# ── 3. Summary data for the existing charts ──────────────────────────────────

def compute_stats(df: pd.DataFrame, source: str) -> dict:
    full = complete_years(df)
    monthly_max  = df.groupby("month")["max_temp"].mean()
    monthly_rain = df.groupby("month")["rainfall"].mean()
    return {
        "dataSource":        source,
        "totalDays":         int(len(df)),
        "dataStartYear":     int(df["year"].min()),
        "dataEndYear":       int(df["year"].max()),
        "allTimeMaxTemp":    r(df["max_temp"].max(), 1),
        "allTimeMinTemp":    r(df["min_temp"].min(), 1),
        "avgAnnualRainfall": r(full.groupby("year")["rainfall"].sum().mean(), 0),
        "avgAnnualMaxTemp":  r(df["max_temp"].mean(), 1),
        "avgAnnualMinTemp":  r(df["min_temp"].mean(), 1),
        "hottestMonth":      MONTHS[int(monthly_max.idxmax()) - 1],
        "wettestMonth":      MONTHS[int(monthly_rain.idxmax()) - 1],
    }


def compute_monthly(df: pd.DataFrame) -> dict:
    grp = df.groupby("month")
    seasonal = LinearRegression().fit(seasonal_features(df["doy"]), df["max_temp"])
    return {
        "months":           MONTHS,
        "avgMaxTemp":       [r(grp["max_temp"].mean().get(m, 0), 1) for m in range(1, 13)],
        "avgMinTemp":       [r(grp["min_temp"].mean().get(m, 0), 1) for m in range(1, 13)],
        "avgRainfall":      [r(grp["rainfall"].mean().get(m, 0), 1) for m in range(1, 13)],
        "predictedMaxTemp": [r(v) for v in seasonal.predict(seasonal_features(MID_DOYS))],
        "rainProbability":  [r(grp["rainy"].mean().get(m, 0), 3) for m in range(1, 13)],
    }


def compute_yearly(df: pd.DataFrame) -> dict:
    grp = complete_years(df).groupby("year")
    years = sorted(grp.groups.keys())
    return {
        "years":         [int(y) for y in years],
        "avgMaxTemp":    [r(grp.get_group(y)["max_temp"].mean(), 1) for y in years],
        "avgMinTemp":    [r(grp.get_group(y)["min_temp"].mean(), 1) for y in years],
        "totalRainfall": [r(grp.get_group(y)["rainfall"].sum(), 0) for y in years],
    }


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    print("=== Auckland Weather Analysis ===\n")
    df, source = load()
    print(f"  Using {len(df):,} days ({df['year'].min()}–{df['year'].max()})\n")

    findings = compute_findings(df, source)
    evaluation, _, _ = compute_evaluation(df)

    t = findings["temperatureTrend"]; h = findings["hotDays"]
    print("Findings")
    print(f"  Mean temperature: {t['perDecade']:+.2f} °C per decade (p={t['pValue']}), "
          f"{t['totalChange']:+.1f} °C overall")
    print(f"  Hot days (>= {HOT_DAY_C:.0f} °C): {h['firstDecadeAvg']}/yr in the {h['firstDecade']} "
          f"-> {h['lastDecadeAvg']}/yr in the {h['lastDecade']} (x{h['ratio']})\n")

    print(f"Model evaluation (train {evaluation['trainYears']}, test {evaluation['testYears']})")
    for m in evaluation["temperature"]:
        print(f"  Temp  {m['name']:<26} MAE {m['mae']:.2f} °C   R² {m['r2']:.3f}")
    for m in evaluation["rain"]:
        print(f"  Rain  {m['name']:<26} accuracy {m['accuracy']*100:.1f}%")
    print()

    improved_rain = next(m for m in evaluation["rain"] if m["kind"] == "improved")
    improved_temp = next(m for m in evaluation["temperature"] if m["kind"] == "improved")
    monthly = compute_monthly(df)

    files = {
        "findings.json":         findings,
        "evaluation.json":       evaluation,
        "stats.json":            compute_stats(df, source),
        "monthly_averages.json": monthly,
        "yearly_trends.json":    compute_yearly(df),
        "model.json": {
            "monthlyPredictedMaxTemp": monthly["predictedMaxTemp"],
            "monthlyRainProbability":  monthly["rainProbability"],
            "tempModelMae":  improved_temp["mae"],
            "tempModelR2":   improved_temp["r2"],
            "rainModelAcc":  improved_rain["accuracy"],
        },
    }
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for name, payload in files.items():
        with open(OUT_DIR / name, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
        print(f"  Saved → public/data/{name}")


if __name__ == "__main__":
    main()
