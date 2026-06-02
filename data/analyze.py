#!/usr/bin/env python3
"""
Auckland Weather Data Analysis
Reads 60 years of temperature + rainfall CSVs, trains seasonal ML models,
and exports JSON files into public/data/ for the Next.js frontend.

Usage:  cd auckland-weather-app/data && python analyze.py
"""

import sys
import json
import warnings
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression, LogisticRegression

warnings.filterwarnings("ignore")

ROOT     = Path(__file__).resolve().parent.parent
TEMP_CSV = ROOT.parent / "1962__Temperature__daily.csv"
RAIN_CSV = ROOT.parent / "1962__Rain__daily.csv"
OUT_DIR  = ROOT / "public" / "data"

MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

# --- helpers ------------------------------------------------------------------

def seasonal_features(doy_series: pd.Series) -> np.ndarray:
    """Return Fourier (sin/cos) features for day-of-year."""
    d = doy_series.values
    return np.column_stack([
        np.sin(2 * np.pi * d / 365),
        np.cos(2 * np.pi * d / 365),
        np.sin(4 * np.pi * d / 365),
        np.cos(4 * np.pi * d / 365),
    ])

MID_DOYS = [15, 46, 74, 105, 135, 166, 196, 227, 258, 288, 319, 349]

def predict_monthly(model, transform=None):
    results = []
    for doy in MID_DOYS:
        x = seasonal_features(pd.Series([doy]))
        if transform:
            pred = transform(model.predict(x)[0])
        else:
            pred = float(model.predict(x)[0])
        results.append(round(pred, 2))
    return results

# --- load data ----------------------------------------------------------------

def load_temperature() -> pd.DataFrame:
    df = pd.read_csv(TEMP_CSV, parse_dates=["Observation time UTC"])
    df = df.rename(columns={
        "Observation time UTC":       "date",
        "Maximum Temperature [Deg C]": "max_temp",
        "Minimum Temperature [Deg C]": "min_temp",
        "Mean Temperature [Deg C]":   "mean_temp",
    })
    df["date"]     = df["date"].dt.date
    df["max_temp"] = pd.to_numeric(df["max_temp"], errors="coerce")
    df["min_temp"] = pd.to_numeric(df["min_temp"], errors="coerce")
    df["mean_temp"]= pd.to_numeric(df["mean_temp"], errors="coerce")
    df = df[["date", "max_temp", "min_temp", "mean_temp"]]
    return df.dropna(subset=["max_temp"]).reset_index(drop=True)

def load_rain() -> pd.DataFrame:
    df = pd.read_csv(RAIN_CSV, parse_dates=["Observation time UTC"])
    df = df.rename(columns={
        "Observation time UTC": "date",
        "Rainfall [mm]":        "rainfall",
    })
    df["date"]    = df["date"].dt.date
    df["rainfall"]= pd.to_numeric(df["rainfall"], errors="coerce").fillna(0)
    return df[["date", "rainfall"]].reset_index(drop=True)

# --- analysis -----------------------------------------------------------------

def merge_and_enrich(temp: pd.DataFrame, rain: pd.DataFrame) -> pd.DataFrame:
    df = temp.merge(rain, on="date", how="inner")
    d  = pd.to_datetime(df["date"])
    df["year"]  = d.dt.year
    df["month"] = d.dt.month
    df["doy"]   = d.dt.dayofyear
    df["rainy"] = (df["rainfall"] > 1).astype(int)
    return df

def compute_stats(df: pd.DataFrame) -> dict:
    yearly_rain = df.groupby("year")["rainfall"].sum()
    avg_annual_rainfall = round(float(yearly_rain.mean()), 0)

    monthly_max = df.groupby("month")["max_temp"].mean()
    monthly_rain = df.groupby("month")["rainfall"].mean()

    return {
        "totalDays":         int(len(df)),
        "dataStartYear":     int(df["year"].min()),
        "dataEndYear":       int(df["year"].max()),
        "allTimeMaxTemp":    round(float(df["max_temp"].max()), 1),
        "allTimeMinTemp":    round(float(df["min_temp"].min()), 1),
        "avgAnnualRainfall": avg_annual_rainfall,
        "avgAnnualMaxTemp":  round(float(df["max_temp"].mean()), 1),
        "avgAnnualMinTemp":  round(float(df["min_temp"].mean()), 1),
        "hottestMonth":      MONTHS[int(monthly_max.idxmax()) - 1],
        "wettestMonth":      MONTHS[int(monthly_rain.idxmax()) - 1],
    }

def compute_monthly_averages(df: pd.DataFrame, model_temp, model_rain) -> dict:
    grp = df.groupby("month")
    avg_max   = grp["max_temp"].mean()
    avg_min   = grp["min_temp"].mean()
    avg_rain  = grp["rainfall"].mean()
    rain_prob = grp["rainy"].mean()

    predicted_temp = predict_monthly(model_temp)
    predicted_rain = predict_monthly(model_rain, transform=lambda p: float(model_rain.predict_proba([[p]])[0][1]) if False else p)

    # for logistic: predict_proba directly
    pred_rain_prob = []
    for doy in MID_DOYS:
        x = seasonal_features(pd.Series([doy]))
        p = float(model_rain.predict_proba(x)[0][1])
        pred_rain_prob.append(round(p, 3))

    return {
        "months":           MONTHS,
        "avgMaxTemp":       [round(float(avg_max.get(m, 0)), 1) for m in range(1, 13)],
        "avgMinTemp":       [round(float(avg_min.get(m, 0)), 1) for m in range(1, 13)],
        "avgRainfall":      [round(float(avg_rain.get(m, 0)), 1) for m in range(1, 13)],
        "predictedMaxTemp": predicted_temp,
        "rainProbability":  [round(float(rain_prob.get(m, 0)), 3) for m in range(1, 13)],
    }

def compute_yearly_trends(df: pd.DataFrame) -> dict:
    grp = df[df["year"].between(1966, 2024)].groupby("year")
    years    = sorted(grp.groups.keys())
    avg_max  = [round(float(grp.get_group(y)["max_temp"].mean()), 1) for y in years]
    avg_min  = [round(float(grp.get_group(y)["min_temp"].mean()), 1) for y in years]
    tot_rain = [round(float(grp.get_group(y)["rainfall"].sum()), 0) for y in years]
    return {
        "years":        [int(y) for y in years],
        "avgMaxTemp":   avg_max,
        "avgMinTemp":   avg_min,
        "totalRainfall": tot_rain,
    }

def train_models(df: pd.DataFrame):
    X = seasonal_features(df["doy"])

    model_temp = LinearRegression().fit(X, df["max_temp"])
    model_rain = LogisticRegression(max_iter=500).fit(X, df["rainy"])

    r2_temp   = round(float(model_temp.score(X, df["max_temp"])), 3)
    acc_rain  = round(float(model_rain.score(X, df["rainy"])), 3)

    return model_temp, model_rain, r2_temp, acc_rain

# --- main ---------------------------------------------------------------------

def main():
    print("=== Auckland Weather Analysis ===\n")

    print("Loading CSVs…")
    temp_df = load_temperature()
    rain_df = load_rain()
    print(f"  Temperature: {len(temp_df):,} rows")
    print(f"  Rainfall:    {len(rain_df):,} rows")

    df = merge_and_enrich(temp_df, rain_df)
    print(f"  Merged:      {len(df):,} rows ({df['year'].min()}–{df['year'].max()})\n")

    print("Training ML models…")
    model_temp, model_rain, r2, acc = train_models(df)
    print(f"  Temperature LinearRegression  R2 = {r2}")
    print(f"  Rain LogisticRegression  acc = {acc}\n")

    stats   = compute_stats(df)
    monthly = compute_monthly_averages(df, model_temp, model_rain)
    yearly  = compute_yearly_trends(df)
    model_meta = {
        "monthlyPredictedMaxTemp": monthly["predictedMaxTemp"],
        "monthlyRainProbability":  monthly["rainProbability"],
        "tempModelR2":   r2,
        "rainModelAcc":  acc,
    }

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    files = {
        "stats.json":            stats,
        "monthly_averages.json": monthly,
        "yearly_trends.json":    yearly,
        "model.json":            model_meta,
    }
    for name, payload in files.items():
        with open(OUT_DIR / name, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
        print(f"  Saved → public/data/{name}")

    print(f"\nDone! Avg annual max temp: {stats['avgAnnualMaxTemp']}°C, "
          f"annual rainfall: {stats['avgAnnualRainfall']}mm")

if __name__ == "__main__":
    main()
