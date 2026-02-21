import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("desktop nav matches visual snapshot", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const nav = page.locator("nav");
    await expect(nav).toHaveScreenshot("nav-desktop.png");
  });

  test("active link is highlighted", async ({ page }) => {
    await page.goto("/pilots");
    await page.waitForLoadState("networkidle");
    const nav = page.locator("nav");
    await expect(nav).toHaveScreenshot("nav-pilots-active.png");
  });
});

test.describe("Language toggle", () => {
  test("switches to English", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Click English toggle
    const toggle = page.getByRole("button", { name: /EN/i });
    if (await toggle.isVisible()) {
      await toggle.click();
      await page.waitForLoadState("networkidle");
    }

    await expect(page).toHaveScreenshot("home-english.png", {
      fullPage: true,
    });
  });
});

test.describe("Mobile navigation", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("hamburger menu matches visual snapshot", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const nav = page.locator("nav");
    await expect(nav).toHaveScreenshot("nav-mobile-closed.png");
  });

  test("open hamburger menu matches visual snapshot", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Open mobile menu
    const hamburger = page.getByRole("button", { name: /menu/i });
    if (await hamburger.isVisible()) {
      await hamburger.click();
      await page.waitForTimeout(300); // animation
    }

    const nav = page.locator("nav");
    await expect(nav).toHaveScreenshot("nav-mobile-open.png");
  });
});
