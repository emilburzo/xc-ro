import { test, expect } from "@playwright/test";

test.describe("Takeoffs table interactions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/takeoffs");
    await page.waitForLoadState("networkidle");
  });

  test("search filters table visually", async ({ page }) => {
    const search = page.getByPlaceholder(/search|caut/i);
    if (await search.isVisible()) {
      await search.fill("Bunloc");
      await page.waitForTimeout(300);
    }
    await expect(page).toHaveScreenshot("takeoffs-search.png", {
      fullPage: true,
    });
  });

  test("sort by flights changes order visually", async ({ page }) => {
    const flightsHeader = page.getByRole("columnheader", {
      name: /flight|zbor/i,
    });
    if (await flightsHeader.isVisible()) {
      await flightsHeader.click();
      await page.waitForTimeout(300);
    }
    await expect(page).toHaveScreenshot("takeoffs-sorted.png", {
      fullPage: true,
    });
  });
});

test.describe("Pilots table interactions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/pilots");
    await page.waitForLoadState("networkidle");
  });

  test("search filters pilots visually", async ({ page }) => {
    const search = page.getByPlaceholder(/search|caut/i);
    if (await search.isVisible()) {
      await search.fill("emil");
      await page.waitForTimeout(300);
    }
    await expect(page).toHaveScreenshot("pilots-search.png", {
      fullPage: true,
    });
  });
});

test.describe("Flights explorer interactions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/flights");
    await page.waitForLoadState("networkidle");
  });

  test("preset filter applies visually", async ({ page }) => {
    const top100 = page.getByRole("button", { name: /top 100/i });
    if (await top100.isVisible()) {
      await top100.click();
      await page.waitForLoadState("networkidle");
    }
    await expect(page).toHaveScreenshot("flights-top100.png", {
      fullPage: true,
    });
  });
});

test.describe("Responsive layouts", () => {
  const viewports = [
    { name: "mobile", width: 375, height: 812 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "desktop", width: 1280, height: 720 },
  ];

  for (const vp of viewports) {
    test(`home page at ${vp.name} (${vp.width}x${vp.height})`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveScreenshot(`home-${vp.name}.png`, {
        fullPage: true,
      });
    });
  }
});
