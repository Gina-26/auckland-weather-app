-- =============================================================================
-- 01_schema.sql
-- Table for daily Auckland weather (Open-Meteo ERA5, 1966 onwards).
-- Written for PostgreSQL / Supabase. Also runs in DuckDB for local testing.
--
-- Load the data:
--   Supabase:  Table Editor -> daily_weather -> Import data from CSV
--              (use data/auckland_daily_era5.csv, skip the first 3 lines)
--   psql:      tail -n +4 data/auckland_daily_era5.csv > clean.csv
--              \copy daily_weather FROM 'clean.csv' WITH (FORMAT csv, HEADER true)
--
-- Tested on PostgreSQL 16 and DuckDB 2.0.
-- =============================================================================

CREATE TABLE IF NOT EXISTS daily_weather (
    obs_date      DATE PRIMARY KEY,          -- one row per day
    max_temp_c    NUMERIC(4,1) NOT NULL,     -- daily maximum, °C
    min_temp_c    NUMERIC(4,1) NOT NULL,     -- daily minimum, °C
    mean_temp_c   NUMERIC(4,1) NOT NULL,     -- daily mean, °C
    rainfall_mm   NUMERIC(5,1) NOT NULL,     -- daily total, mm

    -- basic sanity rules, so bad rows are rejected on load
    CONSTRAINT min_below_max  CHECK (min_temp_c <= max_temp_c),
    CONSTRAINT rain_not_negative CHECK (rainfall_mm >= 0)
);

-- Analysis is almost always grouped by year, so index it.
CREATE INDEX IF NOT EXISTS idx_daily_weather_year
    ON daily_weather (EXTRACT(YEAR FROM obs_date));
