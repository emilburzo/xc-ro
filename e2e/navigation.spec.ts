import { test, expect, waitForCharts } from "./fixtures";

test.describe("Navigation", () => {
  test("desktop nav matches visual snapshot", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("nav")).toBeVisible();
    await expect(page.locator("nav")).toHaveScreenshot("nav-desktop.png");
  });

  test("active link is highlighted", async ({ page }) => {
    await page.goto("/pilots");
    // Not locator("nav"): the pilots table's ro-RO hydration mismatch can open the
    // (hidden) Next.js dev error overlay, which has a <nav> of its own
    const nav = page.getByRole("navigation");
    await expect(nav).toBeVisible();
    await expect(nav).toHaveScreenshot("nav-pilots-active.png");
  });
});

test.describe("Today link", () => {
  test("opens today's flights", async ({ page, isMobile }) => {
    await page.goto("/");
    if (isMobile) await page.getByRole("button", { name: /menu/i }).click();
    await page.getByRole("navigation").getByRole("link", { name: "Azi", exact: true }).click();
    await expect(page).toHaveURL(/\/daily$/);
    await expect(page.locator("h1")).toHaveText("Zborurile de azi");
  });
});

test.describe("Language toggle", () => {
  test("switches to English", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("nav")).toBeVisible();

    const toggle = page.getByRole("button", { name: "EN", exact: true });
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(
      page.getByRole("button", { name: "RO", exact: true }),
    ).toBeVisible();
    await waitForCharts(page, 2);

    await expect(page).toHaveScreenshot("home-english.png", {
      fullPage: true,
    });
  });
});

test.describe("Mobile navigation", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("hamburger menu matches visual snapshot", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("nav")).toBeVisible();
    await expect(page.locator("nav")).toHaveScreenshot("nav-mobile-closed.png");
  });

  test("open hamburger menu matches visual snapshot", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("nav")).toBeVisible();

    const hamburger = page.getByRole("button", { name: /menu/i });
    await expect(hamburger).toBeVisible();
    await hamburger.click();

    await expect(page.locator("nav")).toHaveScreenshot("nav-mobile-open.png");
  });
});
