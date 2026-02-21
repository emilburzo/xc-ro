import { test as base, expect } from "@playwright/test";

/**
 * Custom test fixture that hides the Next.js dev indicator button before each test.
 * Only hides the floating "N" button — the "X issues" toast is intentionally
 * kept visible since it surfaces useful build warnings.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    // Hide only the Next.js floating dev indicator button
    const hideDevIndicators = async () => {
      await page.addStyleTag({
        content: `
          nextjs-portal { display: none !important; }
        `,
      });
    };

    // Apply after each navigation
    page.on("load", async () => {
      try {
        await hideDevIndicators();
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
