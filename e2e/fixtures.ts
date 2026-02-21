import { test as base, expect } from "@playwright/test";

/**
 * Custom test fixture that hides Next.js dev indicators before each test.
 * This prevents the floating "N" button and "X issues" toast from appearing
 * in screenshots, which would cause non-deterministic visual diffs.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    // Hide Next.js dev indicators (floating button + issues toast)
    const hideDevIndicators = async () => {
      await page.addStyleTag({
        content: `
          [data-nextjs-dialog-overlay],
          [data-nextjs-toast],
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
  // Wait for at least one tile image to be loaded
  await expect(page.locator(".leaflet-tile-loaded").first()).toBeVisible({
    timeout: 15_000,
  });
  // Give a short buffer for remaining tiles to settle
  await page.waitForTimeout(500);
}

export { expect };
