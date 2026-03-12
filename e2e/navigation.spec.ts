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

    const toggle = page.getByRole("button", { name: "EN", exact: true });
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

  test("bottom nav bar is visible", async ({ page }) => {
    await page.goto("/");
    const bottomNav = page.locator('[role="navigation"][aria-label="Mobile navigation"]');
    await expect(bottomNav).toBeVisible();
    await expect(bottomNav).toHaveScreenshot("nav-mobile-bottom.png");
  });

  test("bottom nav highlights active page", async ({ page }) => {
    await page.goto("/pilots");
    const bottomNav = page.locator('[role="navigation"][aria-label="Mobile navigation"]');
    await expect(bottomNav).toBeVisible();
    await expect(bottomNav).toHaveScreenshot("nav-mobile-bottom-active.png");
  });
});
