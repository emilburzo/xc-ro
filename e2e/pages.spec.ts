import { test, expect, waitForMapTiles } from "./fixtures";

test.describe("Home page", () => {
  test("matches visual snapshot", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("nav")).toBeVisible();
    // Wait for the dynamically-imported FlyabilityChart to render
    await expect(
      page.locator(".recharts-responsive-container svg").first(),
    ).toBeVisible({ timeout: 10_000 });
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
    // Wait for the dynamically-imported Recharts charts to render
    await expect(
      page.locator(".recharts-responsive-container svg").first(),
    ).toBeVisible({ timeout: 10_000 });
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
    // Wait for the last dynamically-imported Recharts chart to render
    await expect(
      page.locator(".recharts-responsive-container svg").nth(6),
    ).toBeVisible({ timeout: 15_000 });
    // Move mouse away from charts to avoid tooltip rendering differences
    await page.mouse.move(0, 0);
    // Use longer timeout so Playwright can capture two consecutive stable screenshots
    // after Recharts JS-driven entrance animations settle (~5s)
    await expect(page).toHaveScreenshot("takeoff-detail.png", {
      fullPage: true,
      timeout: 15_000,
    });
  });
});

test.describe("Pilot detail page", () => {
  test("matches visual snapshot", async ({ page }) => {
    // Pilot id=1 is Ion Popescu in seed data
    await page.goto("/pilots/ion.popescu");
    await expect(page.locator("h1")).toBeVisible();
    // Wait for the Pilot DNA chart SVG to render (confirms dynamic import loaded)
    await expect(
      page
        .locator('div:has(> h2:text-matches("ADN-ul Pilotului|Pilot DNA")) svg')
        .first(),
    ).toBeVisible({ timeout: 10_000 });
    // Wait for the pilot site map tiles to fully load
    await waitForMapTiles(page);
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
    // Wait for the dynamically-imported Recharts charts to render
    await expect(
      page.locator(".recharts-responsive-container svg").first(),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveScreenshot("wing-detail.png", { fullPage: true });
  });
});

test.describe("Flight detail page", () => {
  test("renders similar flights table and link", async ({ page }) => {
    // Flight 15 is Maria Ionescu from Bunloc, 42.5km — has 4 similar flights in seed data
    await page.goto("/flights/15");
    await expect(page.locator("h1")).toBeVisible();

    // Similar flights section should appear
    const similarSectionHeading = page.getByText(/Zboruri similare|Similar Flights/i);
    await expect(similarSectionHeading).toBeVisible();

    // Scope table lookup to the container that holds the similar flights heading
    const similarSection = similarSectionHeading.locator("xpath=ancestor::div[1]");

    // Table should have rows for the similar flights
    const similarTable = similarSection.locator("table");
    await expect(similarTable.locator("tbody tr")).not.toHaveCount(0);

    // "View more comparable flights" link should be present
    const viewMoreLink = page.getByText(/Vezi mai multe zboruri comparabile|View more comparable flights/i);
    await expect(viewMoreLink).toBeVisible();

    // The link should point to /flights with appropriate filters
    const href = await viewMoreLink.getAttribute("href");
    expect(href).toContain("/flights?");
    expect(href).toContain("takeoff=Bunloc");
    expect(href).toContain("distMin=");
    expect(href).toContain("distMax=");
  });
});
