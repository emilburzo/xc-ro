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
