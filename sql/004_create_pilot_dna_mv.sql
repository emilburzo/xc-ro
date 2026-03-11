-- Materialized view for pilot DNA radar chart.
-- Pre-computes per-pilot metrics and PERCENT_RANK percentiles.
-- Refreshed on app startup via instrumentation.ts.

CREATE MATERIALIZED VIEW IF NOT EXISTS pilot_dna_mv AS
WITH pilot_metrics AS (
  SELECT
    f.pilot_id,
    max(f.distance_km) AS max_distance,
    count(DISTINCT EXTRACT(YEAR FROM f.start_time))::int AS active_years,
    count(*)::int AS flight_count,
    count(DISTINCT f.takeoff_id)::int AS unique_sites,
    round(100.0 * count(*) FILTER (
      WHERE f.type ILIKE '%triangle%' OR f.type ILIKE '%triunghi%'
    ) / count(*), 1) AS triangle_pct
  FROM flights_pg f
  GROUP BY f.pilot_id
)
SELECT pilot_id,
       max_distance, active_years, flight_count, unique_sites, triangle_pct,
       round(PERCENT_RANK() OVER (ORDER BY max_distance)::numeric, 3)  AS pct_distance,
       round(PERCENT_RANK() OVER (ORDER BY active_years)::numeric, 3)  AS pct_consistency,
       round(PERCENT_RANK() OVER (ORDER BY flight_count)::numeric, 3)  AS pct_volume,
       round(PERCENT_RANK() OVER (ORDER BY unique_sites)::numeric, 3)  AS pct_diversity,
       round(PERCENT_RANK() OVER (ORDER BY triangle_pct)::numeric, 3)  AS pct_triangle
FROM pilot_metrics;

-- Unique index required for REFRESH MATERIALIZED VIEW CONCURRENTLY
CREATE UNIQUE INDEX IF NOT EXISTS pilot_dna_mv_pilot_id_idx ON pilot_dna_mv (pilot_id);
