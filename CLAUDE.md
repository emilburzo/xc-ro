# CLAUDE.md — XC-RO Flight Analytics

## Project Overview

Mobile-first webapp exploring ~73k paragliding/hang-gliding flights scraped from xcontest.org (Romania only). Database spans 2007–2026 with 1,131 pilots, 1,220 takeoffs, and 1,421 glider models. UI is Romanian by default with English toggle. The app is branded as **XC-RO** (not "XContest" — that's a third-party trademark).

## Tech Stack

- **Framework**: Next.js 14 (App Router, Server Components) — `next@14.2.35`
- **Styling**: Tailwind CSS 3
- **Charts**: Recharts 3 (bar, line, composed, pie)
- **Maps**: Leaflet 1.9 (dynamic import, no SSR) — markers loaded via raw `leaflet` API, not `react-leaflet` components
- **Database**: PostgreSQL 16 with PostGIS — accessed via `postgres` (postgres.js) + Drizzle ORM
- **i18n**: next-intl 4 — cookie-based locale (`ro` default, `en` secondary)
- **Deployment**: Dockerfile with `output: "standalone"`

## Commands

```bash
npm run dev          # Start dev server (reads .env.local)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
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

| Table | Rows | Key columns |
|-------|------|-------------|
| `flights` | 72,765 | `id` (bigint, externally assigned), `pilot_id`, `takeoff_id` (nullable), `start_time`, `start_point` (geography), `type`, `distance_km`, `score`, `airtime` (minutes), `glider_id`, `url` |
| `pilots` | 1,131 | `id` (serial), `name`, `username` (unique) |
| `takeoffs` | 1,220 | `id` (serial), `name` (unique), `centroid` (geography Point 4326) |
| `gliders` | 1,421 | `id` (serial), `name` (unique), `category` (A/B/C/D/Z/HG/T/RW2/RW5) |

**App view:**
| View | Description |
|------|-------------|
| `flights_pg` | Paragliding-only flights — excludes HG (hang gliding) category. **All app queries should use this view**, not the `flights` table directly. Defined in `sql/001_create_flights_pg_view.sql`. |

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

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout (NextIntlClientProvider, Nav)
│   ├── page.tsx            # Home dashboard
│   ├── actions.ts          # Server action: setLocale cookie
│   ├── globals.css         # Tailwind + leaflet fix
│   ├── takeoffs/
│   │   ├── page.tsx        # Takeoffs list + map
│   │   └── [id]/page.tsx   # Takeoff detail
│   ├── pilots/
│   │   ├── page.tsx        # Pilots list
│   │   └── [username]/page.tsx  # Pilot detail
│   ├── flights/page.tsx    # Flights explorer
│   └── records/page.tsx    # Records & fun stats
├── components/
│   ├── Nav.tsx             # Responsive nav with mobile hamburger
│   ├── LanguageToggle.tsx  # RO/EN cookie toggle
│   ├── SeasonHeatmap.tsx   # Month×Year heatmap (reused on home, takeoff, pilot)
│   ├── TakeoffMap.tsx      # Leaflet map (dynamic import, no SSR)
│   ├── TakeoffsTable.tsx   # Client-side sortable/filterable table with tags
│   ├── TakeoffDetailCharts.tsx  # Orchestrator for takeoff detail charts
│   ├── PilotsTable.tsx     # Client-side sortable pilots table
│   ├── PilotDetailCharts.tsx    # Orchestrator for pilot charts
│   ├── PilotSiteMap.tsx    # Leaflet map for pilot's takeoffs
│   ├── FlightsExplorer.tsx # Client-side filters/pagination/sorting
│   └── charts/
│       ├── MonthlyBarChart.tsx
│       ├── HourlyChart.tsx
│       ├── DowChart.tsx
│       ├── DistanceHistogram.tsx
│       ├── WingDonut.tsx
│       ├── YearlyTrendChart.tsx
│       └── PilotYearlyChart.tsx
├── lib/
│   ├── db.ts               # Drizzle + postgres client singleton
│   ├── schema.ts           # Drizzle table definitions (no geography columns)
│   ├── queries.ts          # 25+ SQL queries (all use drizzle sql`` tagged templates)
│   └── utils.ts            # slugify, takeoffPath, pilotPath, formatDuration, relativeTime
├── i18n/
│   └── request.ts          # next-intl config (cookie-based locale)
└── messages/
    ├── ro.json              # Romanian translations (default)
    └── en.json              # English translations
```

## URL Strategy

- **Takeoffs**: `/takeoffs/[id]-[slug]` — ID prefix because 144 slug collisions exist
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

## Gotchas & Lessons Learned

1. **Set iteration in strict TS**: `[...new Set(arr)]` fails with `"can only be iterated with --downlevelIteration"`. Use `Array.from(new Set(arr))` instead.

2. **PostGIS geography columns**: Can't be represented in Drizzle schema directly. Omit them from the schema and read via `ST_X(col::geometry)` / `ST_Y(col::geometry)` in raw SQL queries.

3. **PostgreSQL local auth**: The VM's pg_hba.conf defaults to `scram-sha-256` for TCP (127.0.0.1). Changed to `trust` for local dev. For production, use a proper `DATABASE_URL` with credentials.

4. **next-intl v4 with Next.js 14**: Uses `createNextIntlPlugin` in `next.config.mjs`. The plugin path must point to the request config file (`./src/i18n/request.ts`).

5. **Leaflet CSS height conflict**: The Leaflet CSS (`leaflet.css` from unpkg) sets `.leaflet-container { height: 100% }`. Because this `<link>` is loaded in the component body (after Tailwind CSS in `<head>`), it overrides Tailwind height classes like `h-[300px]` at equal specificity. The fix is to use Tailwind's `!important` modifier: `!h-[300px]`. **All Leaflet map container divs must use `!h-[...]` for their height.** Without `!important`, the map renders as 0px tall (invisible) because `height: 100%` of an unsized parent collapses to 0.

6. **Leaflet default marker icons**: Broken in bundlers by default. Must call `delete (L.Icon.Default.prototype as any)._getIconUrl` and then `L.Icon.Default.mergeOptions(...)` with unpkg URLs.

7. **`flights.id` is not auto-increment**: It's the external xcontest flight ID. The Drizzle schema uses `bigint` (not `bigserial`) for this column.

## Environment

- **VM**: Ubuntu 24.04 (Vagrant/VirtualBox), 4GB RAM, 2 CPUs
- **Node**: v20.20.0, npm 10.8.2
- **PostgreSQL**: 16 with PostGIS
- **Port forwarding**: guest 8000 → host 8000 (Vagrantfile)
- **DB access from shell**: `sudo -u postgres psql -d xcontest`
