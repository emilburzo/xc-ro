import { test, expect } from "./fixtures";

test.describe("Navigation", () => {
  test("desktop nav matches visual snapshot", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("nav")).toBeVisible();
    await expect(page.locator("nav")).toHaveScreenshot("nav-desktop.png");
  });

  test("active link is highlighted", async ({ page }) => {
    await page.goto("/pilots");
    await expect(page.locator("nav")).toBeVisible();
    await expect(page.locator("nav")).toHaveScreenshot("nav-pilots-active.png");
  });
});

test.describe("Language toggle", () => {
  test("switches to English", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("nav")).toBeVisible();

    const toggle = page.getByRole("button", { name: /EN/i });
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(page.locator("nav")).toBeVisible();

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
