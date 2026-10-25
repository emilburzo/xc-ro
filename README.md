# XC-RO — Paragliding Flight Analytics

Mobile-first web application exploring ~90 000 paragliding flights scraped from [xcontest.org](https://www.xcontest.org) (Romania only, from both the XContest Romania and World leagues). The dataset spans 2007–2026 and covers 1 600+ pilots, 1 300+ takeoffs, and 1 600+ glider models. The UI is Romanian by default with an English toggle.

## Features

- **Home dashboard** — aggregate stats, recent notable flights, season heatmap, top takeoffs & pilots
- **Today's flights** — the day's flights in Romania from both XContest leagues, ranked by score (sortable), with flight type icons, direct links to XContest and day-by-day navigation
- **Takeoffs** — sortable/filterable list with smart tags, interactive Leaflet map, per-takeoff detail pages with charts (monthly, hourly, day-of-week, distance histogram, wing donut, yearly trend)
- **Pilots** — searchable list, per-pilot detail pages with career timeline, site map, equipment progression, and top flights
- **Wings** — searchable/sortable wing database with category filters, per-wing detail pages with adoption curve, distance histogram, yearly stats, favorite takeoffs, and top flights
- **Flights explorer** — full-text filters, date/distance ranges, flight type & glider category selectors, preset views (today, best this month, top 100, 100 km+ club), server-side pagination, map view; per-flight pages with the start location and similar flights
- **Records & fun stats** — all-time records, per-category/site/year records, growth chart, fun facts (epic day, most sites, most consistent pilot)
- **Internationalization** — Romanian (default) / English, cookie-based locale toggle

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 — App Router, Server Components |
| Styling | Tailwind CSS 4 |
| Charts | Recharts 3 |
| Maps | Leaflet 1.9 |
| Database | PostgreSQL 16 + PostGIS |
| ORM / Driver | Drizzle ORM + postgres.js |
| i18n | next-intl 4 |
| Testing | Jest 30 + Testing Library (unit), Playwright (visual/e2e) |

## Prerequisites

- **Node.js** ≥ 20
- **PostgreSQL** 16 with the PostGIS extension
- A populated database (the four tables — `flights`, `pilots`, `takeoffs`, `gliders` — are filled by an external scraper)

## Getting Started

```bash
# Install dependencies
npm ci

# Set the database connection (optional — defaults to postgres://postgres@localhost:5432/xcontest)
export DATABASE_URL="postgres://user:pass@host:5432/xcontest"

# Create the app's view, indexes, extensions and materialized view (requires psql).
# Idempotent and safe on an existing scraper database; also creates the tables when they're missing.
psql "$DATABASE_URL" -f sql/schema.sql

# Start the dev server
npm run dev
```

Open <http://localhost:3000> to view the app. The app refreshes the `pilot_dna_mv` materialized view on every startup.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Jest unit tests |
| `npm run test:watch` | Jest in watch mode |
| `npm run test:visual` | Playwright visual/e2e tests |
| `npm run test:visual:update` | Update Playwright snapshots |
| `npm run test:visual:seed` | Seed DB for visual tests |
| `npm run test:integration` | Jest integration tests only |

Integration tests (`*.integration.test.ts`) run only when `TEST_DATABASE_URL` points at a database created from `sql/schema.sql`; otherwise they are skipped. The visual tests need a database seeded with `npm run test:visual:seed` — point `DATABASE_URL` at an empty database for that, since the seed inserts fixed ids. More details for contributors are in [AGENTS.md](AGENTS.md).

## Project Structure

```
src/
├── app/                # Next.js App Router pages
│   ├── page.tsx        # Home dashboard
│   ├── api/            # API routes (health check)
│   ├── takeoffs/       # Takeoffs list & detail
│   ├── pilots/         # Pilots list & detail
│   ├── wings/          # Wings list & detail
│   ├── flights/        # Flights explorer & flight detail
│   ├── daily/          # Today's flights
│   └── records/        # Records & fun stats
├── components/         # React components (charts, maps, tables)
│   └── __tests__/      # Jest unit tests for components
├── lib/
│   ├── db.ts           # Database client (Drizzle + postgres.js)
│   ├── schema.ts       # Drizzle table definitions
│   ├── queries/        # SQL queries, one module per page (plus cached wrappers)
│   ├── cache-handler.cjs  # In-memory Next.js cache handler
│   ├── utils.ts        # Helpers (slugify, formatting, paths, removeDiacritics)
│   └── __tests__/      # Jest unit tests for lib
├── i18n/               # next-intl configuration
└── messages/           # Translation files (ro.json, en.json)
e2e/                    # Playwright visual/e2e tests
sql/                    # schema.sql (canonical DDL) + incremental scripts for existing databases
```

## Docker

The project includes a multi-stage `Dockerfile` that produces a standalone Next.js image:

```bash
docker build -t xc-ro .
docker run -e DATABASE_URL="postgres://..." -p 3000:3000 xc-ro
```

## Database Notes

- The app treats the database as **read-only** (apart from refreshing `pilot_dna_mv`); an external scraper continuously populates it from both the XContest Romania and World leagues.
- All app queries use the `flights_pg` view (paragliding only; excludes the hang gliding and rigid wing categories).
- Geography columns (`centroid`, `start_point`) are read via `ST_X`/`ST_Y` in raw SQL — they are not represented in the Drizzle schema.
- `flights.id` is the external xcontest flight ID and is **not** auto-incremented.
- `flights.start_time` holds Romanian local time (a `timestamp` without time zone).

## License

This project is private and not currently published under an open-source license.
