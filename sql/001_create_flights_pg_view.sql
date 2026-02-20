-- Paragliding-only flights view.
-- Excludes hang gliding (HG) flights (~716 rows, ~1% of data).
-- The app queries this view instead of the flights table directly.
-- The scraper continues writing to the flights table unchanged.

CREATE OR REPLACE VIEW flights_pg AS
SELECT *
FROM flights
WHERE glider_id NOT IN (SELECT id FROM gliders WHERE category = 'HG');
