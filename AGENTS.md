# XC-RO Flight Analytics — Agent Instructions

## Project Overview

Mobile-first webapp exploring paragliding and hang-gliding flights scraped from xcontest.org (Romania only). Data spans from 2007 to the present. UI is Romanian by default with an English toggle. The app is branded as **XC-RO** (not "XContest" — that's a third-party trademark).

**Approximate scale** (these numbers grow continuously as the scraper adds new data):
- ~73k flights
- ~1,100 pilots
- ~1,200 takeoffs
- ~1,400 glider models

## Tech Stack

- **Framework**: Next.js (App Router, Server Components)
- **Styling**: Tailwind CSS
- **Charts**: Recharts (bar, line, composed, pie)
- **Maps**: Leaflet (dynamic import, no SSR) — markers loaded via raw `leaflet` API, not `react-leaflet` components
- **Database**: PostgreSQL with PostGIS — accessed via `postgres` (postgres.js) + Drizzle ORM
- **i18n**: next-intl — cookie-based locale (`ro` default, `en` secondary)
- **Deployment**: Dockerfile with `output: "standalone"`
- **Testing**: Jest + Testing Library (unit), Playwright (visual/e2e)

## Commands

```bash
npm run dev              # Start dev server (reads .env.local)
npm run build            # Production build
npm run start            # Start production server
npm run lint             # ESLint
npm run test             # Jest unit tests
npm run test:watch       # Jest in watch mode
npm run test:visual      # Playwright visual/e2e tests
npm run test:visual:update   # Update Playwright snapshots
npm run test:visual:seed     # Seed DB for visual tests
```

Dev server runs on port 3000 by default. Use `--port 8000` to match Vagrantfile forwarding.

## Database

### Connection
- **Env var**: `DATABASE_URL` (falls back to `postgres://postgres@localhost:5432/xcontest`)
- **Local auth**: PostgreSQL pg_hba.conf was changed to `trust` for 127.0.0.1 TCP connections (no password needed locally)
- **Driver**: `postgres` (postgres.js) — NOT `pg` (node-postgres). This matters for Drizzle config.

### Data lifecycle
- The database is **continuously updated by an external scraper** that writes to the four application tables. This is a working copy of that dataset.
- **Do NOT rename or drop existing tables** — the scraper depends on them.
- Creating new tables, views, indexes, etc. is fine.

### Schema (read-only from app, no migrations)
Four application tables plus PostGIS `spatial_ref_sys`:

| Table | Key columns |
|-------|-------------|
| `flights` | `id` (bigint, externally assigned), `pilot_id`, `takeoff_id` (nullable), `start_time`, `start_point` (geography), `type`, `distance_km`, `score`, `airtime` (minutes), `glider_id`, `url` |
| `pilots` | `id` (serial), `name`, `username` (unique) |
| `takeoffs` | `id` (serial), `name` (unique), `centroid` (geography Point 4326) |
| `gliders` | `id` (serial), `name` (unique), `category` (A/B/C/D/Z/HG/T/RW2/RW5) |

**App view:**
| View | Description |
|------|-------------|
| `flights_pg` | Paragliding-only flights — excludes HG (hang gliding) category. **All app queries should use this view**, not the `flights` table directly. Defined in `sql/001_create_flights_pg_view.sql`. |

**Materialized view:**
| View | Description |
|------|-------------|
| `pilot_dna_mv` | Pre-computed pilot DNA metrics (5 raw values + 5 PERCENT_RANK percentiles). Refreshed on app startup via `src/instrumentation.ts`. Defined in `sql/004_create_pilot_dna_mv.sql`. |

**SQL file structure:**

| File | Role | Used by |
|------|------|---------|
| `sql/schema.sql` | **Canonical DDL** — all extensions, tables, views, indexes, materialized views. Single source of truth for building a fresh database. | CI unit tests (`test.yml`), sourced by `e2e/seed.sql` |
| `e2e/seed.sql` | **Test data only** — sources `schema.sql` via `\ir ../sql/schema.sql`, then INSERTs seed data and refreshes materialized views. | CI visual tests (`visual.yml`), local `npm run test:visual:seed` |
| `sql/001_*.sql` – `sql/004_*.sql` | **Incremental patches** — for applying individual changes to an existing production/dev database. Not used by CI. | Manual application to existing DBs |

When adding new database objects (tables, views, indexes, materialized views):
1. Add the DDL to `sql/schema.sql` (canonical source)
2. If the object needs a refresh after data insertion, add the refresh to the end of `e2e/seed.sql`
3. If the object needs a refresh in integration tests, add it to `seedStandardData()` in `src/lib/queries/test-utils.ts`
4. Optionally create a numbered `sql/NNN_*.sql` script for incremental application to existing databases

**Incremental scripts:**
| Script | Description |
|--------|-------------|
| `sql/001_create_flights_pg_view.sql` | Creates the `flights_pg` view |
| `sql/002_add_flights_fk_indexes.sql` | Adds indexes on `flights(takeoff_id)`, `flights(pilot_id)`, `flights(glider_id)` — critical for join performance |
| `sql/003_add_unaccent_extension.sql` | Enables the `unaccent` PostgreSQL extension for accent-insensitive search |
| `sql/004_create_pilot_dna_mv.sql` | Creates `pilot_dna_mv` materialized view + unique index on `pilot_id` |

**Important schema notes:**
- `flights.id` does NOT auto-increment — it's the xcontest flight ID
- `flights.takeoff_id` is the only nullable FK
- Geography columns (`centroid`, `start_point`) are NOT in the Drizzle schema — read with `ST_X(centroid::geometry)` / `ST_Y(centroid::geometry)` in raw SQL
- All FKs use `ON UPDATE RESTRICT ON DELETE RESTRICT`
- Flight types include both Romanian and English: `zbor liber`, `triunghi FAI`, `triunghi plat`, `free flight`, `FAI triangle`, `flat triangle`

### Key data characteristics
- 60% of flights from just 10 takeoffs (Bunloc alone = 20%)
- Median flight is 4.7km, top 1.5% are 100km+
- 144 takeoff name slug collisions (case variants) — that's why URLs use `/takeoffs/[id]-[slug]`
- July 8, 2022 was the epic day: 5 pilots flew 300km+ from Sticlaria

### Avg speed metric (wings table)
The `avg_speed` column in the wings list uses `distance_km / (airtime / 60)`. This metric is inherently noisy because airtime includes thermalling (climbing, not covering distance). Three filters are required to produce sensible rankings:

1. **Distance >= 30 km** — flights under 30 km are not representative XC. Short flights (sled rides, local soaring) inflate speed because there's little thermalling. At 10 km threshold, B wings appeared faster than C/D wings due to short straight-line flights on strong days.
2. **At least 5 qualifying flights** — single-flight outliers dominate without this. One lucky day (or bad airtime data, e.g. ELEMENTZ at 489 km/h) skews the average.
3. **At least 25% of total flights must qualify** — without this, wings used mostly for local flying (e.g. NOVA Ion 4L: 6/40 qualifying = 15%) show inflated speed because their rare XC flights happened on epic conditions. Wings where XC is the norm (e.g. NIVIUK Peak 6: 46/57 = 81%) give representative averages.

With all three filters, the ranking correctly shows D/Z (competition) > C > B. ~92 wings have speed data. See `getWingsList()` in `src/lib/queries/wings.ts`.

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout (NextIntlClientProvider, Nav)
│   ├── page.tsx            # Home dashboard
│   ├── actions.ts          # Server action: setLocale cookie
│   ├── globals.css         # Tailwind + leaflet fix
│   ├── api/
│   │   └── health/route.ts # Health check endpoint (GET /api/health)
│   ├── takeoffs/
│   │   ├── page.tsx        # Takeoffs list + map
│   │   └── [id]/page.tsx   # Takeoff detail
│   ├── pilots/
│   │   ├── page.tsx        # Pilots list
│   │   └── [username]/page.tsx  # Pilot detail
│   ├── wings/
│   │   ├── page.tsx        # Wings list
│   │   └── [id]/page.tsx   # Wing detail
│   ├── flights/page.tsx    # Flights explorer
│   └── records/page.tsx    # Records & fun stats
├── components/
│   ├── Nav.tsx             # Responsive nav with mobile hamburger
│   ├── SortHeader.tsx      # Reusable sortable column header
│   ├── LanguageToggle.tsx  # RO/EN cookie toggle
│   ├── SeasonHeatmap.tsx   # Month×Year heatmap (reused on home, takeoff, pilot)
│   ├── TakeoffMap.tsx      # Leaflet map (dynamic import, no SSR)
│   ├── TakeoffsTable.tsx   # Client-side sortable/filterable table with tags
│   ├── TakeoffDetailCharts.tsx  # Orchestrator for takeoff detail charts
│   ├── PilotsTable.tsx     # Client-side sortable pilots table
│   ├── PilotDetailCharts.tsx    # Orchestrator for pilot charts
│   ├── PilotSiteMap.tsx    # Leaflet map for pilot's takeoffs
│   ├── WingsTable.tsx      # Client-side sortable/filterable wings table
│   ├── WingDetailCharts.tsx # Orchestrator for wing detail charts
│   ├── FlightsExplorer.tsx # Client-side filters/pagination/sorting
│   ├── __tests__/          # Jest unit tests for components
│   └── charts/
│       ├── MonthlyBarChart.tsx
│       ├── HourlyChart.tsx
│       ├── DowChart.tsx
│       ├── DistanceHistogram.tsx
│       ├── WingDonut.tsx
│       ├── YearlyTrendChart.tsx
│       ├── AdoptionChart.tsx
│       ├── PilotYearlyChart.tsx
│       └── PilotDnaChart.tsx
├── instrumentation.ts       # Next.js register() hook — refreshes materialized views on startup
├── lib/
│   ├── db.ts               # Drizzle + postgres client singleton
│   ├── schema.ts           # Drizzle table definitions (no geography columns)
│   ├── queries.ts           # SQL queries (all use drizzle sql`` tagged templates)
│   ├── utils.ts             # slugify, takeoffPath, wingPath, pilotPath, formatDuration, formatDistance, formatNumber, formatDate, relativeTime, removeDiacritics
│   └── __tests__/           # Jest unit tests (e.g. utils.test.ts)
├── i18n/
│   └── request.ts          # next-intl config (cookie-based locale)
└── messages/
    ├── ro.json              # Romanian translations (default)
    └── en.json              # English translations

e2e/                         # Playwright visual/e2e tests
├── fixtures.ts              # Test fixtures and helpers
├── seed.sql                 # Sources sql/schema.sql + inserts test data
├── navigation.spec.ts       # Navigation tests
├── pages.spec.ts            # Page rendering tests
└── interactions.spec.ts     # User interaction tests

jest.config.ts               # Jest configuration
jest.setup.ts                # Jest setup (@testing-library/jest-dom)
playwright.config.ts         # Playwright configuration
```

## URL Strategy

- **Takeoffs**: `/takeoffs/[id]-[slug]` — ID prefix because 144 slug collisions exist
- **Wings**: `/wings/[id]-[slug]` — same ID-prefix pattern as takeoffs
- **Pilots**: `/pilots/[username]` — usernames are unique and URL-safe
- **Flights**: `/flights` with query params for filters/presets/pagination
- **All paths in English** regardless of UI language

## Patterns & Conventions

### Data fetching
- All pages use Server Components with `export const dynamic = "force-dynamic"` (or `revalidate = 0`)
- Heavy queries in `src/lib/queries.ts` — all use Drizzle's `sql` tagged template for parameterization
- For dynamic WHERE clauses (flights explorer), build an array of `sql` fragments and join with `sql.join(conditions, sql' AND ')`
- **Never use `sql.raw()`** — it doesn't parameterize and is vulnerable to SQL injection

### Client components
- Charts: all wrapped in `dynamic(() => import(...), { ssr: false })` — Recharts and Leaflet don't work with SSR
- Leaflet maps: use raw `import("leaflet")` inside `useEffect`, fix default icons with `L.Icon.Default.mergeOptions`
- Tables: client-side sorting/filtering with `useState`/`useMemo`, server-side data fetched in parent

### i18n
- Locale stored in cookie named `locale`, toggled via server action in `src/app/actions.ts`
- `next-intl/server` for server components (`getTranslations`), `next-intl` for client (`useTranslations`)
- next-intl plugin configured in `next.config.mjs` pointing to `./src/i18n/request.ts`

### Recharts typing
- Recharts 3 Tooltip `formatter` prop has strict typing — use `(val: any, _name: any, props: any)` to avoid build errors

## Testing Requirements

Every new feature, improvement, or bug fix **must** include tests unless the change is already covered by existing tests. Follow these guidelines:

- **Unit tests** (Jest + Testing Library): Add tests in the co-located `__tests__/` directory next to the code being tested. For example, a new component in `src/components/` should have a corresponding test in `src/components/__tests__/`.
- **Utility / library changes**: Any new or modified function in `src/lib/` must have unit tests in `src/lib/__tests__/`.
- **Snapshot tests**: New components should be added to the relevant snapshot test file (`snapshots.test.tsx`, `chartSnapshots.test.tsx`, or `tableSnapshots.test.tsx`).
- **E2E tests** (Playwright): If a change affects user-facing behavior (new pages, navigation changes, interactive features), add or update tests in `e2e/`.
- **Run tests before submitting**: Always run `npm run test` (unit) and verify nothing is broken. Run `npm run lint` to check for lint errors.
- **Don't remove or weaken existing tests** unless the underlying behavior has intentionally changed.

## Gotchas & Lessons Learned

1. **Set iteration in strict TS**: `[...new Set(arr)]` fails with `"can only be iterated with --downlevelIteration"`. Use `Array.from(new Set(arr))` instead.

2. **PostGIS geography columns**: Can't be represented in Drizzle schema directly. Omit them from the schema and read via `ST_X(col::geometry)` / `ST_Y(col::geometry)` in raw SQL queries.

3. **PostgreSQL local auth**: The VM's pg_hba.conf defaults to `scram-sha-256` for TCP (127.0.0.1). Changed to `trust` for local dev. For production, use a proper `DATABASE_URL` with credentials.

4. **next-intl v4 with Next.js 15**: Uses `createNextIntlPlugin` in `next.config.mjs`. The plugin path must point to the request config file (`./src/i18n/request.ts`).

5. **Leaflet CSS height conflict**: The Leaflet CSS (`leaflet.css` from unpkg) sets `.leaflet-container { height: 100% }`. Because this `<link>` is loaded in the component body (after Tailwind CSS in `<head>`), it overrides Tailwind height classes like `h-[300px]` at equal specificity. The fix is to use Tailwind's `!important` modifier: `!h-[300px]`. **All Leaflet map container divs must use `!h-[...]` for their height.** Without `!important`, the map renders as 0px tall (invisible) because `height: 100%` of an unsized parent collapses to 0.

6. **Leaflet default marker icons**: Broken in bundlers by default. Must call `delete (L.Icon.Default.prototype as any)._getIconUrl` and then `L.Icon.Default.mergeOptions(...)` with unpkg URLs.

7. **`flights.id` is not auto-increment**: It's the external xcontest flight ID. The Drizzle schema uses `bigint` (not `bigserial`) for this column.

8. **`ssr: false` not allowed in Server Components**: `next/dynamic` with `ssr: false` cannot be used directly in Server Component pages. The `dynamic()` call must live inside a `"use client"` component. For Recharts charts, use a thin client wrapper component (e.g. `RecordProgressionWrapper.tsx`) or an orchestrator component (e.g. `TakeoffDetailCharts.tsx`) that does the `dynamic(() => import(...), { ssr: false })` internally.

9. **Always run `npm run build` after changes**: `npm run lint` and `npm run test` do not compile Next.js pages. Only `npm run build` catches naming collisions, Server Component constraint violations, and other compile-time errors in pages.

10. **Chart wrapper components must use typed interfaces, not `any[]`**: When creating a `"use client"` wrapper that bridges server data to a chart component, define a typed row interface for the `data` prop (matching the SQL query's output columns). The `as any` cast at the page level (server→client boundary) is acceptable because Drizzle's `db.execute` returns `Record<string, unknown>[]`, but the wrapper's Props interface must be strongly typed so the chart component receives correct types.

## Git Hygiene

- **Never commit `package-lock.json`** unless the task specifically involves adding, removing, or updating dependencies. Unrelated changes to `package-lock.json` (e.g., from incidental `npm install` runs) must not be staged or committed.

## Environment

- **VM**: Ubuntu 24.04 (Vagrant/VirtualBox), 4GB RAM, 2 CPUs
- **Node**: v20.20.0, npm 10.8.2
- **PostgreSQL**: 16 with PostGIS
- **Port forwarding**: guest 8000 → host 8000 (Vagrantfile)
- **DB access from shell**: `sudo -u postgres psql -d xcontest`
