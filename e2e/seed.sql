-- Seed data for visual regression tests.
-- Provides enough mock data for all pages to render meaningfully.
-- Creates tables, inserts data, creates view and indexes.

-- Ensure PostGIS is available
CREATE EXTENSION IF NOT EXISTS postgis;

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

-- ============ PILOTS ============
INSERT INTO pilots (id, name, username) VALUES
  (1, 'Ion Popescu', 'ion.popescu'),
  (2, 'Maria Ionescu', 'maria.ionescu'),
  (3, 'Alex Novice', 'alex.novice'),
  (4, 'Elena Dragomir', 'elena.dragomir'),
  (5, 'Andrei Vasile', 'andrei.vasile');
SELECT setval('pilots_id_seq', 5);

-- ============ TAKEOFFS ============
INSERT INTO takeoffs (id, name, centroid) VALUES
  (1, 'Bunloc',     ST_GeogFromText('POINT(25.5128 45.6220)')),
  (2, 'Sticlaria',  ST_GeogFromText('POINT(24.7700 46.2300)')),
  (3, 'Blaj',       ST_GeogFromText('POINT(23.9170 46.1750)')),
  (4, 'Trascau',    ST_GeogFromText('POINT(23.4500 46.3700)')),
  (5, 'Rimetea',    ST_GeogFromText('POINT(23.5700 46.4500)'));
SELECT setval('takeoffs_id_seq', 5);

-- ============ GLIDERS ============
INSERT INTO gliders (id, name, category) VALUES
  (1,  'Nova Prion 5',             'A'),
  (2,  'Advance Alpha 7',          'A'),
  (3,  'Nova Mentor 7',            'B'),
  (4,  'Gin Explorer 3',           'B'),
  (5,  'Ozone Mantra 8',           'C'),
  (6,  'Niviuk Ikuma 2',           'C'),
  (7,  'Advance Omega X-Alps 4',   'D'),
  (8,  'Ozone Enzo 3',             'D'),
  (9,  'Icaro Laminar',            'HG'),
  (10, 'Wills Wing T3',            'HG');
SELECT setval('gliders_id_seq', 10);

-- ============ FLIGHTS ============
-- Generate a diverse set of flights across years, seasons, and types.
-- Covers: multiple pilots, takeoffs, glider categories, distances, airtimes.

INSERT INTO flights (id, pilot_id, takeoff_id, start_time, type, distance_km, score, airtime, glider_id, url, start_point) VALUES
  -- Ion Popescu: experienced pilot, many flights from Bunloc and Sticlaria
  (1,  1, 1, '2022-07-08 10:00:00', 'FAI triangle',  312.5,  420.5, 480, 7, 'https://xcontest.org/flight/1',  ST_GeogFromText('POINT(25.5128 45.6220)')),
  (2,  1, 1, '2022-07-15 09:30:00', 'free flight',    85.3,  100.2, 240, 5, 'https://xcontest.org/flight/2',  ST_GeogFromText('POINT(25.5128 45.6220)')),
  (3,  1, 2, '2022-08-01 11:00:00', 'flat triangle', 145.0,  195.0, 360, 7, 'https://xcontest.org/flight/3',  ST_GeogFromText('POINT(24.7700 46.2300)')),
  (4,  1, 1, '2023-06-15 10:30:00', 'free flight',    62.1,   75.5, 210, 5, 'https://xcontest.org/flight/4',  ST_GeogFromText('POINT(25.5128 45.6220)')),
  (5,  1, 1, '2023-07-20 09:00:00', 'FAI triangle',  180.2,  250.3, 400, 8, 'https://xcontest.org/flight/5',  ST_GeogFromText('POINT(25.5128 45.6220)')),
  (6,  1, 2, '2023-08-10 10:00:00', 'free flight',   110.5,  140.0, 300, 7, 'https://xcontest.org/flight/6',  ST_GeogFromText('POINT(24.7700 46.2300)')),
  (7,  1, 1, '2024-05-20 11:00:00', 'free flight',    45.2,   55.0, 180, 5, 'https://xcontest.org/flight/7',  ST_GeogFromText('POINT(25.5128 45.6220)')),
  (8,  1, 3, '2024-06-10 10:00:00', 'flat triangle',  95.0,  130.0, 280, 7, 'https://xcontest.org/flight/8',  ST_GeogFromText('POINT(23.9170 46.1750)')),
  (9,  1, 1, '2024-07-05 09:00:00', 'FAI triangle',  205.0,  290.0, 420, 8, 'https://xcontest.org/flight/9',  ST_GeogFromText('POINT(25.5128 45.6220)')),
  (10, 1, 1, '2025-03-15 12:00:00', 'free flight',    15.3,   18.0,  90, 3, 'https://xcontest.org/flight/10', ST_GeogFromText('POINT(25.5128 45.6220)')),
  (11, 1, 1, '2025-05-01 10:30:00', 'free flight',    35.0,   42.0, 150, 5, 'https://xcontest.org/flight/11', ST_GeogFromText('POINT(25.5128 45.6220)')),
  (12, 1, 2, '2025-06-20 09:30:00', 'free flight',    55.5,   68.0, 200, 5, 'https://xcontest.org/flight/12', ST_GeogFromText('POINT(24.7700 46.2300)')),
  (13, 1, 1, '2025-07-10 10:00:00', 'flat triangle', 130.0,  175.0, 340, 7, 'https://xcontest.org/flight/13', ST_GeogFromText('POINT(25.5128 45.6220)')),

  -- Maria Ionescu: intermediate pilot
  (14, 2, 1, '2022-06-10 11:00:00', 'free flight',    25.0,   30.0, 120, 3, 'https://xcontest.org/flight/14', ST_GeogFromText('POINT(25.5128 45.6220)')),
  (15, 2, 1, '2022-07-22 10:00:00', 'free flight',    42.5,   50.5, 180, 4, 'https://xcontest.org/flight/15', ST_GeogFromText('POINT(25.5128 45.6220)')),
  (16, 2, 2, '2023-05-10 09:30:00', 'free flight',    58.0,   70.0, 210, 4, 'https://xcontest.org/flight/16', ST_GeogFromText('POINT(24.7700 46.2300)')),
  (17, 2, 1, '2023-07-15 10:00:00', 'flat triangle',  75.0,   95.0, 250, 5, 'https://xcontest.org/flight/17', ST_GeogFromText('POINT(25.5128 45.6220)')),
  (18, 2, 1, '2024-06-20 10:30:00', 'free flight',    38.0,   45.0, 160, 3, 'https://xcontest.org/flight/18', ST_GeogFromText('POINT(25.5128 45.6220)')),
  (19, 2, 3, '2024-07-05 09:00:00', 'free flight',    65.0,   80.0, 220, 5, 'https://xcontest.org/flight/19', ST_GeogFromText('POINT(23.9170 46.1750)')),
  (20, 2, 1, '2025-05-15 11:00:00', 'free flight',    48.0,   58.0, 190, 4, 'https://xcontest.org/flight/20', ST_GeogFromText('POINT(25.5128 45.6220)')),
  (21, 2, 2, '2025-07-01 10:00:00', 'flat triangle',  82.0,  105.0, 260, 5, 'https://xcontest.org/flight/21', ST_GeogFromText('POINT(24.7700 46.2300)')),

  -- Alex Novice: beginner, short flights
  (22, 3, 1, '2024-08-01 12:00:00', 'free flight',     3.5,    4.0,  30, 1, 'https://xcontest.org/flight/22', ST_GeogFromText('POINT(25.5128 45.6220)')),
  (23, 3, 1, '2024-08-15 11:30:00', 'free flight',     5.2,    6.0,  45, 1, 'https://xcontest.org/flight/23', ST_GeogFromText('POINT(25.5128 45.6220)')),
  (24, 3, 1, '2025-04-20 13:00:00', 'free flight',     8.0,    9.5,  55, 2, 'https://xcontest.org/flight/24', ST_GeogFromText('POINT(25.5128 45.6220)')),
  (25, 3, 1, '2025-06-01 12:00:00', 'free flight',    12.0,   14.0,  70, 2, 'https://xcontest.org/flight/25', ST_GeogFromText('POINT(25.5128 45.6220)')),

  -- Elena Dragomir: cross-country specialist
  (26, 4, 2, '2021-07-10 08:30:00', 'FAI triangle',  250.0,  340.0, 450, 8, 'https://xcontest.org/flight/26', ST_GeogFromText('POINT(24.7700 46.2300)')),
  (27, 4, 4, '2022-06-20 09:00:00', 'free flight',   160.0,  210.0, 380, 7, 'https://xcontest.org/flight/27', ST_GeogFromText('POINT(23.4500 46.3700)')),
  (28, 4, 2, '2022-07-08 09:00:00', 'FAI triangle',  310.0,  415.0, 475, 8, 'https://xcontest.org/flight/28', ST_GeogFromText('POINT(24.7700 46.2300)')),
  (29, 4, 5, '2023-06-01 10:00:00', 'flat triangle', 120.0,  160.0, 320, 7, 'https://xcontest.org/flight/29', ST_GeogFromText('POINT(23.5700 46.4500)')),
  (30, 4, 2, '2023-07-22 08:00:00', 'free flight',   185.0,  240.0, 400, 8, 'https://xcontest.org/flight/30', ST_GeogFromText('POINT(24.7700 46.2300)')),
  (31, 4, 4, '2024-05-15 09:30:00', 'FAI triangle',  200.0,  275.0, 410, 8, 'https://xcontest.org/flight/31', ST_GeogFromText('POINT(23.4500 46.3700)')),
  (32, 4, 2, '2024-07-10 08:00:00', 'flat triangle', 170.0,  225.0, 390, 7, 'https://xcontest.org/flight/32', ST_GeogFromText('POINT(24.7700 46.2300)')),
  (33, 4, 2, '2025-06-15 09:00:00', 'FAI triangle',  220.0,  300.0, 430, 8, 'https://xcontest.org/flight/33', ST_GeogFromText('POINT(24.7700 46.2300)')),

  -- Andrei Vasile: weekend warrior
  (34, 5, 1, '2023-03-18 12:00:00', 'free flight',    18.0,   22.0,  95, 3, 'https://xcontest.org/flight/34', ST_GeogFromText('POINT(25.5128 45.6220)')),
  (35, 5, 1, '2023-06-24 10:00:00', 'free flight',    32.0,   38.0, 140, 4, 'https://xcontest.org/flight/35', ST_GeogFromText('POINT(25.5128 45.6220)')),
  (36, 5, 3, '2023-09-16 11:00:00', 'free flight',    28.5,   34.0, 130, 3, 'https://xcontest.org/flight/36', ST_GeogFromText('POINT(23.9170 46.1750)')),
  (37, 5, 1, '2024-04-13 10:30:00', 'free flight',    22.0,   26.0, 110, 4, 'https://xcontest.org/flight/37', ST_GeogFromText('POINT(25.5128 45.6220)')),
  (38, 5, 1, '2024-07-20 09:00:00', 'flat triangle',  52.0,   65.0, 200, 5, 'https://xcontest.org/flight/38', ST_GeogFromText('POINT(25.5128 45.6220)')),
  (39, 5, 5, '2024-09-07 11:00:00', 'free flight',    40.0,   48.0, 170, 4, 'https://xcontest.org/flight/39', ST_GeogFromText('POINT(23.5700 46.4500)')),
  (40, 5, 1, '2025-05-10 10:00:00', 'free flight',    30.0,   36.0, 135, 4, 'https://xcontest.org/flight/40', ST_GeogFromText('POINT(25.5128 45.6220)')),

  -- HG flights (excluded by flights_pg view)
  (41, 1, 1, '2023-08-05 10:00:00', 'free flight',    50.0,   60.0, 200, 9,  'https://xcontest.org/flight/41', ST_GeogFromText('POINT(25.5128 45.6220)')),
  (42, 5, 3, '2024-06-15 11:00:00', 'free flight',    35.0,   42.0, 160, 10, 'https://xcontest.org/flight/42', ST_GeogFromText('POINT(23.9170 46.1750)'));

-- ============ VIEW & INDEXES ============
CREATE OR REPLACE VIEW flights_pg AS
SELECT * FROM flights
WHERE glider_id NOT IN (SELECT id FROM gliders WHERE category = 'HG');

CREATE INDEX IF NOT EXISTS flights_takeoff_id ON flights(takeoff_id);
CREATE INDEX IF NOT EXISTS flights_pilot_id ON flights(pilot_id);
CREATE INDEX IF NOT EXISTS flights_glider_id ON flights(glider_id);
