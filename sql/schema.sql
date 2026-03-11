-- Schema for the xc-ro database.
-- Creates extensions, tables, view, and indexes.
-- Used by integration tests and can be run on a fresh database.

-- Ensure PostGIS is available
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable unaccent for accent-insensitive search
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ============ TABLES ============
CREATE TABLE IF NOT EXISTS pilots (
  id bigserial PRIMARY KEY,
  name varchar(200) NOT NULL,
  username varchar(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS takeoffs (
  id bigserial PRIMARY KEY,
  name varchar(200) NOT NULL,
  centroid geography(Point,4326)
);

CREATE TABLE IF NOT EXISTS gliders (
  id bigserial PRIMARY KEY,
  name varchar(100) NOT NULL UNIQUE,
  category varchar(20) NOT NULL
);

CREATE TABLE IF NOT EXISTS flights (
  id bigint PRIMARY KEY,
  pilot_id bigint NOT NULL REFERENCES pilots(id),
  takeoff_id bigint REFERENCES takeoffs(id),
  start_time timestamp NOT NULL,
  start_point geography(Point,4326),
  type varchar(512) NOT NULL,
  distance_km double precision NOT NULL,
  score double precision NOT NULL,
  airtime integer NOT NULL,
  glider_id bigint NOT NULL REFERENCES gliders(id),
  url varchar(512) NOT NULL
);

-- ============ VIEW & INDEXES ============
CREATE OR REPLACE VIEW flights_pg AS
SELECT *
FROM flights
WHERE glider_id NOT IN (SELECT id FROM gliders WHERE category IN ('HG', 'RW2', 'RW5'));

CREATE INDEX IF NOT EXISTS flights_takeoff_id ON flights(takeoff_id);
CREATE INDEX IF NOT EXISTS flights_pilot_id ON flights(pilot_id);
CREATE INDEX IF NOT EXISTS flights_glider_id ON flights(glider_id);

-- ============ MATERIALIZED VIEWS ============
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

CREATE UNIQUE INDEX IF NOT EXISTS pilot_dna_mv_pilot_id_idx ON pilot_dna_mv (pilot_id);
