import { test, expect } from "@playwright/test";

test.describe("Home page", () => {
  test("matches visual snapshot", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("home.png", { fullPage: true });
  });
});

test.describe("Takeoffs page", () => {
  test("matches visual snapshot", async ({ page }) => {
    await page.goto("/takeoffs");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("takeoffs.png", { fullPage: true });
  });
});

test.describe("Pilots page", () => {
  test("matches visual snapshot", async ({ page }) => {
    await page.goto("/pilots");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("pilots.png", { fullPage: true });
  });
});

test.describe("Flights page", () => {
  test("matches visual snapshot", async ({ page }) => {
    await page.goto("/flights");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("flights.png", { fullPage: true });
  });
});

test.describe("Records page", () => {
  test("matches visual snapshot", async ({ page }) => {
    await page.goto("/records");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("records.png", { fullPage: true });
  });
});
