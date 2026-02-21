import { test, expect, waitForMapTiles } from "./fixtures";

test.describe("Takeoffs table interactions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/takeoffs");
    await expect(page.locator("table")).toBeVisible();
  });

  test("search filters table visually", async ({ page }) => {
    const search = page.getByPlaceholder(/search|caut/i);
    await expect(search).toBeVisible();
    await search.fill("Bunloc");
    await expect(page.locator("tbody tr")).not.toHaveCount(0);
    await waitForMapTiles(page);
    await expect(page).toHaveScreenshot("takeoffs-search.png", {
      fullPage: true,
    });
  });

  test("sort by flights changes order visually", async ({ page }) => {
    const flightsHeader = page.getByRole("columnheader", {
      name: /flight|zbor/i,
    });
    await expect(flightsHeader).toBeVisible();
    await flightsHeader.click();
    await expect(page.locator("tbody tr").first()).toBeVisible();
    await waitForMapTiles(page);
    await expect(page).toHaveScreenshot("takeoffs-sorted.png", {
      fullPage: true,
    });
  });
});

test.describe("Pilots table interactions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/pilots");
    await expect(page.locator("table")).toBeVisible();
  });

  test("search filters pilots visually", async ({ page }) => {
    const search = page.getByPlaceholder(/search|caut/i);
    await expect(search).toBeVisible();
    await search.fill("ion");
    await expect(page.locator("tbody tr")).not.toHaveCount(0);
    await expect(page).toHaveScreenshot("pilots-search.png", {
      fullPage: true,
    });
  });
});

test.describe("Flights explorer interactions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/flights");
    await expect(page.locator("table")).toBeVisible();
  });

  test("preset filter applies visually", async ({ page }) => {
    const top100 = page.getByRole("button", { name: /top 100/i });
    await expect(top100).toBeVisible();
    await top100.click();
    await expect(page.locator("table")).toBeVisible();
    await expect(page).toHaveScreenshot("flights-top100.png", {
      fullPage: true,
    });
  });
});

test.describe("Wings table interactions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/wings");
    await expect(page.locator("table")).toBeVisible();
  });

  test("search filters wings table visually", async ({ page }) => {
    const search = page.getByPlaceholder(/search|caut/i);
    await expect(search).toBeVisible();
    await search.fill("Nova");
    await expect(page.locator("tbody tr")).not.toHaveCount(0);
    await expect(page).toHaveScreenshot("wings-search.png", {
      fullPage: true,
    });
  });

  test("category filter limits results visually", async ({ page }) => {
    const categorySelect = page.getByRole("combobox").first();
    await expect(categorySelect).toBeVisible();
    await categorySelect.selectOption("B");
    await expect(page.locator("tbody tr")).not.toHaveCount(0);
    await expect(page).toHaveScreenshot("wings-category-filter.png", {
      fullPage: true,
    });
  });

  test("sort by flights changes order visually", async ({ page }) => {
    const flightsHeader = page.getByRole("columnheader", {
      name: /flight|zbor/i,
    });
    await expect(flightsHeader).toBeVisible();
    await flightsHeader.click();
    await expect(page.locator("tbody tr").first()).toBeVisible();
    await expect(page).toHaveScreenshot("wings-sorted.png", {
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
      await expect(page.locator("nav")).toBeVisible();
      await expect(page).toHaveScreenshot(`home-${vp.name}.png`, {
        fullPage: true,
      });
    });
  }
});
