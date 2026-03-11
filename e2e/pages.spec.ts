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

test.describe("Wings page", () => {
  test("matches visual snapshot", async ({ page }) => {
    await page.goto("/wings");
    await expect(page.locator("table")).toBeVisible();
    await expect(page).toHaveScreenshot("wings.png", { fullPage: true });
  });
});

test.describe("Takeoff detail page", () => {
  test("matches visual snapshot", async ({ page }) => {
    // Takeoff id=1 is Bunloc in seed data
    await page.goto("/takeoffs/1-bunloc");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page).toHaveTitle("Bunloc | Decolare | XC-RO");
    await expect(page).toHaveScreenshot("takeoff-detail.png", { fullPage: true });
  });
});

test.describe("Pilot detail page", () => {
  test("matches visual snapshot", async ({ page }) => {
    // Pilot id=1 is Ion Popescu in seed data
    await page.goto("/pilots/ion.popescu");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page).toHaveTitle("Ion Popescu | Pilot | XC-RO");
    await expect(page).toHaveScreenshot("pilot-detail.png", { fullPage: true });
  });
});

test.describe("Wing detail page", () => {
  test("matches visual snapshot", async ({ page }) => {
    // Wing id=3 is Nova Mentor 7 (category B) in seed data
    await page.goto("/wings/3-nova-mentor-7");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page).toHaveTitle("Nova Mentor 7 | Aripă | XC-RO");
    await expect(page).toHaveScreenshot("wing-detail.png", { fullPage: true });
  });
});
