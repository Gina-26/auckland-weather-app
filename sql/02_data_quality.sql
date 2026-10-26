-- =============================================================================
-- 02_data_quality.sql
-- Checks run before any analysis. Each query should return what the comment
-- says. Anything else means the data needs cleaning first.
-- =============================================================================

-- 1. Overall coverage: expect ~22,000 rows from 1966-01-01 to the latest date.
SELECT
    COUNT(*)            AS total_days,
    MIN(obs_date)       AS first_day,
    MAX(obs_date)       AS last_day
FROM daily_weather;

-- 2. Missing values in any column: expect 0 for every column.
SELECT
    COUNT(*) FILTER (WHERE max_temp_c  IS NULL) AS missing_max,
    COUNT(*) FILTER (WHERE min_temp_c  IS NULL) AS missing_min,
    COUNT(*) FILTER (WHERE mean_temp_c IS NULL) AS missing_mean,
    COUNT(*) FILTER (WHERE rainfall_mm IS NULL) AS missing_rain
FROM daily_weather;

-- 3. Gaps in the calendar: expect no rows (every day follows the previous one).
SELECT obs_date, prev_date, obs_date - prev_date AS gap_days
FROM (
    SELECT obs_date, LAG(obs_date) OVER (ORDER BY obs_date) AS prev_date
    FROM daily_weather
) t
WHERE obs_date - prev_date > 1;

-- 4. Impossible or suspicious values: expect no rows.
--    Auckland has never been near -10 °C or 40 °C, and min must not exceed max.
SELECT *
FROM daily_weather
WHERE min_temp_c > max_temp_c
   OR mean_temp_c NOT BETWEEN min_temp_c AND max_temp_c
   OR max_temp_c NOT BETWEEN -10 AND 40
   OR rainfall_mm < 0
   OR rainfall_mm > 400;

-- 5. Incomplete years: these are excluded from yearly totals so that a
--    half-finished year doesn't look unusually dry or cool.
SELECT EXTRACT(YEAR FROM obs_date) AS year, COUNT(*) AS days
FROM daily_weather
GROUP BY 1
HAVING COUNT(*) < 360
ORDER BY 1;
