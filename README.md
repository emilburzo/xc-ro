# XC-RO — Paragliding Flight Analytics

Mobile-first web application exploring ~73 000 paragliding flights scraped from [xcontest.org](https://www.xcontest.org) (Romania only). The dataset spans 2007–2026 and covers 1 100+ pilots, 1 200+ takeoffs, and 1 400+ glider models. The UI is Romanian by default with an English toggle.

## Features

- **Home dashboard** — aggregate stats, recent notable flights, season heatmap, top takeoffs & pilots
- **Takeoffs** — sortable/filterable list with smart tags, interactive Leaflet map, per-takeoff detail pages with charts (monthly, hourly, day-of-week, distance histogram, wing donut, yearly trend)
- **Pilots** — searchable list, per-pilot detail pages with career timeline, site map, equipment progression, and top flights
- **Wings** — searchable/sortable wing database with category filters, per-wing detail pages with adoption curve, distance histogram, yearly stats, favorite takeoffs, and top flights
- **Flights explorer** — full-text filters, date/distance ranges, flight type & glider category selectors, preset views (today, best this month, top 100, 100 km+ club), server-side pagination
- **Records & fun stats** — all-time records, per-category/site/year records, growth chart, fun facts (epic day, most sites, most consistent pilot)
- **Internationalization** — Romanian (default) / English, cookie-based locale toggle

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 — App Router, Server Components |
| Styling | Tailwind CSS 3 |
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

# Apply the helper view & indexes (one-time, requires psql)
psql "$DATABASE_URL" -f sql/001_create_flights_pg_view.sql
psql "$DATABASE_URL" -f sql/002_add_flights_fk_indexes.sql
psql "$DATABASE_URL" -f sql/003_add_unaccent_extension.sql    # accent-insensitive search

# Start the dev server
npm run dev
```

Open <http://localhost:3000> to view the app.

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

## Project Structure

```
src/
├── app/                # Next.js App Router pages
│   ├── page.tsx        # Home dashboard
│   ├── api/            # API routes (health check)
│   ├── takeoffs/       # Takeoffs list & detail
│   ├── pilots/         # Pilots list & detail
│   ├── wings/          # Wings list & detail
│   ├── flights/        # Flights explorer
│   └── records/        # Records & fun stats
├── components/         # React components (charts, maps, tables)
│   └── __tests__/      # Jest unit tests for components
├── lib/
│   ├── db.ts           # Database client (Drizzle + postgres.js)
│   ├── schema.ts       # Drizzle table definitions
│   ├── queries.ts      # SQL queries
│   ├── utils.ts        # Helpers (slugify, formatting, paths, removeDiacritics)
│   └── __tests__/      # Jest unit tests for lib
├── i18n/               # next-intl configuration
└── messages/           # Translation files (ro.json, en.json)
e2e/                    # Playwright visual/e2e tests
sql/                    # One-time SQL scripts (view, indexes, extensions)
```

## Docker

The project includes a multi-stage `Dockerfile` that produces a standalone Next.js image:

```bash
docker build -t xc-ro .
docker run -e DATABASE_URL="postgres://..." -p 3000:3000 xc-ro
```

## Database Notes

- The app treats the database as **read-only**; an external scraper continuously populates it.
- All app queries use the `flights_pg` view (paragliding-only, excludes hang-gliding).
- Geography columns (`centroid`, `start_point`) are read via `ST_X`/`ST_Y` in raw SQL — they are not represented in the Drizzle schema.
- `flights.id` is the external xcontest flight ID and is **not** auto-incremented.

## License

This project is private and not currently published under an open-source license.
