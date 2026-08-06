import { test as base, expect } from "@playwright/test";

/**
 * Fake "now" for every visual test, 10 days after the most recent flight in
 * `e2e/seed.sql` (Bunloc, 2025-07-10).
 *
 * The seed data has fixed dates, but parts of the UI are relative to the current
 * date: the "Inactiv" tag in TakeoffsTable (last activity > 365 days), the
 * active/dormant filter, and the marker colours in TakeoffMap (green <= 30 days,
 * yellow <= 365, grey beyond). With the real clock those cross their thresholds
 * as real time passes, so snapshots taken today stop matching tomorrow's render
 * — eventually every site shows as inactive and every marker turns grey.
 *
 * Pinning the clock keeps that UI deterministic and keeps the fixture realistic:
 * 2 recent sites (green), 1 within the year (yellow), 2 dormant (grey + tag).
 * Only `Date`/`new Date()` are faked — timers keep running, so Recharts
 * animations still complete normally (Leaflet's tile fade is handled below).
 *
 * This covers browser-side date logic only. Queries that ask the database for
 * "recent" data (`now() - interval ...` in home.ts) still use the real clock;
 * every seeded flight is already older than those windows, so their output no
 * longer changes over time either.
 */
export const FIXED_NOW = new Date("2025-07-20T12:00:00Z");

/**
 * Custom test fixture that pins the clock, hides the Next.js dev indicator
 * button and disables Leaflet's tile fade-in before each test. Only the floating
 * "N" button is hidden — the "X issues" toast is intentionally kept visible
 * since it surfaces useful build warnings.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.clock.setFixedTime(FIXED_NOW);

    const applyTestStyles = async () => {
      await page.addStyleTag({
        content: `
          nextjs-portal { display: none !important; }
          /* Leaflet fades tiles in over 200ms by diffing Date.now() against the
             tile's load time. With the clock pinned above that difference is
             always 0, so tiles would stay at opacity 0 and every map would
             screenshot blank. Forcing them opaque also removes the flake of
             capturing a screenshot mid-fade. */
          .leaflet-tile { opacity: 1 !important; }
        `,
      });
    };

    // Apply after each navigation
    page.on("load", async () => {
      try {
        await applyTestStyles();
      } catch {
        // Page may have been closed
      }
    });

    await use(page);
  },
});

/** Wait for Leaflet map tiles to finish loading on the page. */
export async function waitForMapTiles(page: import("@playwright/test").Page) {
  // Wait for the Leaflet container to appear
  await expect(page.locator(".leaflet-container")).toBeVisible();
  // Wait for at least one tile to be loaded
  await expect(page.locator(".leaflet-tile-loaded").first()).toBeVisible({
    timeout: 15_000,
  });
  // Wait until ALL tiles have finished loading (no tiles without .leaflet-tile-loaded)
  await page.waitForFunction(
    () => {
      const allTiles = document.querySelectorAll(".leaflet-tile");
      const loadedTiles = document.querySelectorAll(".leaflet-tile-loaded");
      return allTiles.length > 0 && allTiles.length === loadedTiles.length;
    },
    { timeout: 15_000 },
  );
}

export { expect };
