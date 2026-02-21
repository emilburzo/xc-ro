import { test, expect, waitForMapTiles } from "./fixtures";

test.describe("Home page", () => {
  test("matches visual snapshot", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("nav")).toBeVisible();
    await expect(page).toHaveScreenshot("home.png", { fullPage: true });
  });
});

test.describe("Takeoffs page", () => {
  test("matches visual snapshot", async ({ page }) => {
    await page.goto("/takeoffs");
    await expect(page.locator("table")).toBeVisible();
    await waitForMapTiles(page);
    await expect(page).toHaveScreenshot("takeoffs.png", { fullPage: true });
  });
});

test.describe("Pilots page", () => {
  test("matches visual snapshot", async ({ page }) => {
    await page.goto("/pilots");
    await expect(page.locator("table")).toBeVisible();
    await expect(page).toHaveScreenshot("pilots.png", { fullPage: true });
  });
});

test.describe("Flights page", () => {
  test("matches visual snapshot", async ({ page }) => {
    await page.goto("/flights");
    await expect(page.locator("table")).toBeVisible();
    await expect(page).toHaveScreenshot("flights.png", { fullPage: true });
  });
});

test.describe("Records page", () => {
  test("matches visual snapshot", async ({ page }) => {
    await page.goto("/records");
    await expect(page.locator("nav")).toBeVisible();
    await expect(page).toHaveScreenshot("records.png", { fullPage: true });
  });
});
