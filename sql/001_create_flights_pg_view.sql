-- Paragliding-only flights view.
-- Excludes hang gliding (HG) and rigid wing (RW2, RW5) flights.
-- The app queries this view instead of the flights table directly.
-- The scraper continues writing to the flights table unchanged.

CREATE OR REPLACE VIEW flights_pg AS
SELECT *
FROM flights
WHERE glider_id NOT IN (SELECT id FROM gliders WHERE category IN ('HG', 'RW2', 'RW5'));
