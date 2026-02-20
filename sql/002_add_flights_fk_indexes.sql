-- Add indexes on flights foreign keys.
-- These are critical for all joins in takeoff, pilot, and flight queries.
-- Without them, every aggregation query does a full sequential scan of 72k+ rows.

CREATE INDEX CONCURRENTLY IF NOT EXISTS flights_takeoff_id ON flights(takeoff_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS flights_pilot_id ON flights(pilot_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS flights_glider_id ON flights(glider_id);
