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

### XC-relevant averages (sled ride exclusion)
When computing `avg_distance` or `avg_airtime` for XC statistics, flights under 20 km must be excluded — they are sled rides or local soaring, not cross-country flights. Use PostgreSQL's `FILTER (WHERE distance_km >= 20)` clause on the aggregate so that counts and totals remain unaffected. This applies to averages in takeoff stats, pilot stats, pilot yearly stats, wing stats, and takeoff monthly stats. The threshold is 20 km (not 30 km — that stricter threshold is only for the `avg_speed` metric on wings).

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
├── __mocks__/
│   └── next-cache.ts       # Jest mock for next/cache (pass-through unstable_cache)
├── lib/
│   ├── db.ts               # Drizzle + postgres client singleton
│   ├── cache-ttl.ts        # Shared cache TTL constants (THIRTY_MINUTES, ONE_HOUR, etc.)
│   ├── schema.ts           # Drizzle table definitions (no geography columns)
│   ├── queries/             # SQL queries (all use drizzle sql`` tagged templates)
│   │   ├── index.ts         # Re-exports all query modules
│   │   ├── home.ts          # Home page queries + cached wrappers
│   │   ├── takeoffs.ts      # Takeoff queries + cached wrappers
│   │   ├── pilots.ts        # Pilot queries + cached wrappers
│   │   ├── wings.ts         # Wing queries + cached wrappers
│   │   ├── records.ts       # Records queries + cached wrappers
│   │   ├── flights.ts       # Flights queries + cached wrappers
│   │   ├── health.ts        # Health check query
│   │   └── sitemap.ts       # Sitemap queries
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
- Heavy queries in `src/lib/queries/` — all use Drizzle's `sql` tagged template for parameterization
- For dynamic WHERE clauses (flights explorer), build an array of `sql` fragments and join with `sql.join(conditions, sql' AND ')`
- **Never use `sql.raw()`** — it doesn't parameterize and is vulnerable to SQL injection
- **Pages use cached query wrappers** (`getCachedFoo`) — see [Query Caching](#query-caching) below

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

### Query Caching

Database query results are cached using Next.js `unstable_cache` from `next/cache`. This avoids re-running expensive aggregation queries (multi-CTE joins over ~73k flights) on every page load while the underlying data only changes when the scraper runs.

**How it works:**
- Each query file (`src/lib/queries/*.ts`) exports both the raw function (`getFoo`) and a cached wrapper (`getCachedFoo`)
- Pages import and call the `getCachedFoo` versions; tests use the raw `getFoo` versions
- `unstable_cache` serializes function arguments into the cache key automatically, so `getCachedTakeoffTop10(42)` and `getCachedTakeoffTop10(43)` have separate cache entries

**TTL constants** are defined once in `src/lib/cache-ttl.ts`:

| Constant | Value | Used for |
|----------|-------|----------|
| `THIRTY_MINUTES` | 1800s | Recent/latest flights |
| `ONE_HOUR` | 3600s | Home stats, heatmaps, flyability calendar |
| `TWO_HOURS` | 7200s | List pages, detail page charts, histograms |
| `FOUR_HOURS` | 14400s | Top flights, favorites, equipment timelines |
| `SIX_HOURS` | 21600s | Yearly trends, community growth, fun stats |
| `TWELVE_HOURS` | 43200s | All-time/category/annual records |

**Revalidation tags** — each domain has a tag (`home`, `takeoffs`, `pilots`, `wings`, `records`, `flights`) for future on-demand invalidation via `revalidateTag()`.

**What is NOT cached** (by design):
- `getFlightsList()` / `getFlightsChartData()` — dynamic filters + pagination make the cache key space too large
- `getById()` functions (`getTakeoffById`, `getPilotByUsername`, `getWingById`, `getFlightById`) — already request-deduplicated via React `cache()`, simple SELECTs
- Health check and sitemap queries — trivial

**Adding caching to a new query:**
1. Import `unstable_cache` from `next/cache` and the appropriate TTL from `../cache-ttl`
2. Add a `getCachedFoo` export at the bottom of the query file:
   ```ts
   export const getCachedFoo = unstable_cache(
     getFoo,
     ["foo-cache-key"],
     { revalidate: TWO_HOURS, tags: ["domain-tag"] }
   );
   ```
3. Use `getCachedFoo` in page files; keep `getFoo` for tests

**Jest compatibility:** `unstable_cache` pulls in Next.js server internals that break in jsdom. The mock at `src/__mocks__/next-cache.ts` (mapped via `moduleNameMapper` in `jest.config.ts`) makes `unstable_cache` a pass-through so the cached wrappers behave identically to the raw functions in tests.

**Cache backend — in-memory only:** Next.js's default cache handler writes each cache entry to a file under `.next/cache/fetch-cache/`. With ~52 cached wrappers, many of them keyed by entity ID, that directory can accumulate tens of thousands of tiny files in the container's writable overlayfs layer. On Kubernetes nodes (kubelet + containerd) this triggers an aggressive `newfstatat` loop when kubelet recomputes ephemeral-storage usage — pinning containerd at >100% CPU.

The app uses a custom in-memory `CacheHandler` at `src/lib/cache-handler.cjs`, wired via the `cacheHandler` option in `next.config.mjs`. `cacheMaxMemorySize: 0` disables Next.js's default in-memory LRU wrapper so we don't double-cache.

- Backed by `lru-cache` v11 with a byte-size cap (default 256MB, overridable via `CACHE_HANDLER_MAX_SIZE_BYTES` env var)
- Tag→key reverse index so `revalidateTag(t)` is O(keys-for-t), not O(all-entries)
- Module-level singleton — one cache per Node.js process. Cold on process restart, which is acceptable because the underlying Postgres queries are <100ms and TTLs are 30 min – 12 h
- No filesystem writes at all; safe for Pi SD card endurance
- Standalone build trace pulls in both `cache-handler.cjs` and `lru-cache` automatically

Tests for the handler live at `src/lib/__tests__/cache-handler.test.ts`. They `require()` the handler directly and exercise it under `@jest-environment node`. The existing `next/cache` Jest mock is unchanged — query tests still bypass the handler entirely via the pass-through `unstable_cache`.

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
