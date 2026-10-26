-- =============================================================================
-- 03_analysis.sql
-- Business question: How has Auckland's climate changed since 1966, and what
-- should planners and businesses expect now?
-- =============================================================================

-- Reusable yearly summary, complete years only (>= 360 days of data).
CREATE OR REPLACE VIEW yearly_summary AS
SELECT
    EXTRACT(YEAR FROM obs_date)::INT                    AS year,
    ROUND(AVG(mean_temp_c), 2)                          AS avg_temp_c,
    COUNT(*) FILTER (WHERE max_temp_c >= 25)            AS hot_days,     -- days >= 25 °C
    COUNT(*) FILTER (WHERE min_temp_c <= 5)             AS cold_nights,  -- nights <= 5 °C
    ROUND(SUM(rainfall_mm), 0)                          AS rainfall_mm,
    COUNT(*) FILTER (WHERE rainfall_mm > 1)             AS rainy_days,
    COUNT(*) FILTER (WHERE rainfall_mm >= 50)           AS heavy_rain_days
FROM daily_weather
GROUP BY 1
HAVING COUNT(*) >= 360;


-- Q1. How much has Auckland warmed?
--     regr_slope fits a straight line through the yearly values,
--     x 10 converts "per year" into "per decade".
SELECT
    ROUND((regr_slope(avg_temp_c,  year) * 10)::NUMERIC, 2) AS temp_change_per_decade_c,
    ROUND((regr_slope(hot_days,    year) * 10)::NUMERIC, 2) AS hot_days_change_per_decade,
    ROUND((regr_slope(cold_nights, year) * 10)::NUMERIC, 2) AS cold_nights_change_per_decade,
    ROUND((regr_slope(rainfall_mm, year) * 10)::NUMERIC, 1) AS rainfall_change_per_decade_mm,
    ROUND(regr_r2(avg_temp_c, year)::NUMERIC, 2)             AS temp_trend_r2
FROM yearly_summary;


-- Q2. Decade by decade: the clearest way to show the change to a non-technical reader.
SELECT
    (year - year % 10) || 's'        AS decade,
    COUNT(*)                         AS years_in_data,
    ROUND(AVG(avg_temp_c), 2)        AS avg_temp_c,
    ROUND(AVG(hot_days), 1)          AS hot_days_per_year,
    ROUND(AVG(cold_nights), 1)       AS cold_nights_per_year,
    ROUND(AVG(rainfall_mm), 0)       AS rainfall_mm_per_year
FROM yearly_summary
GROUP BY (year - year % 10)
ORDER BY (year - year % 10);


-- Q3. Ten warmest years on record, with their rank.
SELECT
    RANK() OVER (ORDER BY avg_temp_c DESC) AS rank,
    year,
    avg_temp_c,
    hot_days
FROM yearly_summary
ORDER BY rank
LIMIT 10;


-- Q4. Which months are getting the most extra hot days?
--     Compares the first 20 complete years with the most recent 20.
WITH periods AS (
    SELECT
        EXTRACT(MONTH FROM obs_date)::INT AS month,
        CASE
            WHEN EXTRACT(YEAR FROM obs_date) BETWEEN 1966 AND 1985 THEN 'early'
            WHEN EXTRACT(YEAR FROM obs_date) BETWEEN 2006 AND 2025 THEN 'recent'
        END AS period,
        max_temp_c
    FROM daily_weather
)
SELECT
    month,
    ROUND(COUNT(*) FILTER (WHERE period = 'early'  AND max_temp_c >= 25) / 20.0, 1) AS hot_days_1966_1985,
    ROUND(COUNT(*) FILTER (WHERE period = 'recent' AND max_temp_c >= 25) / 20.0, 1) AS hot_days_2006_2025
FROM periods
WHERE period IS NOT NULL
GROUP BY month
HAVING COUNT(*) FILTER (WHERE max_temp_c >= 25) > 0
ORDER BY month;


-- Q5. Wettest single days on record.
--     Note: ERA5 is a gridded dataset and smooths local downpours, so the
--     27 Jan 2023 Auckland flood ranks lower here than in rain-gauge records.
SELECT
    RANK() OVER (ORDER BY rainfall_mm DESC) AS rank,
    obs_date,
    rainfall_mm
FROM daily_weather
ORDER BY rainfall_mm DESC
LIMIT 10;


-- Q6. Rain persistence: if it rains today, how likely is rain tomorrow?
--     This is why "same as today" is a strong baseline for the forecast model.
WITH pairs AS (
    SELECT
        rainfall_mm > 1                                        AS rain_today,
        LEAD(rainfall_mm) OVER (ORDER BY obs_date) > 1         AS rain_tomorrow
    FROM daily_weather
)
SELECT
    CASE WHEN rain_today THEN 'Rained today' ELSE 'Dry today' END AS today,
    COUNT(*)                                                       AS days,
    ROUND(100.0 * AVG(CASE WHEN rain_tomorrow THEN 1 ELSE 0 END), 1) AS pct_rain_tomorrow
FROM pairs
WHERE rain_tomorrow IS NOT NULL
GROUP BY rain_today
ORDER BY today;
