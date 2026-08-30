import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { SEL } from "./selectors";
import { bodyTextExcludingLanguageSwitcher, containsCJK, longestLatinWordRun } from "./localePurity";
import { assertNoHorizontalOverflow } from "./mobileAudit";

const ROUTE = "/analytics/margin-control-tower";

// Task L2 [CLAUDE]: rebuild of /analytics/margin-control-tower to the
// user-approved chart-led Evidence page (spec §6.7 "Margin/Credit(归档)").
// This file replaces the margin-only coverage that used to live in
// tests/e2e/analytics-real-data.spec.ts and tests/e2e/analytics-phase2.spec.ts
// against the pre-rebuild interactive workbench (source toggle, scenario
// slider, heatmap, waterfall) — that UI no longer renders on this route, so
// those assertions were removed rather than left to fail; see
// task-L2-report.md for the full old-assertion -> new-assertion inventory.
// Credit Policy Desk's tests in both of those files are untouched (still
// exercising its own still-live interactive workbench).

function loadDetectionReport() {
  return JSON.parse(readFileSync(
    path.resolve(__dirname, "../../public/case-studies/margin-control-tower/detection-report.json"),
    "utf8",
  )) as {
    recall: number;
    precision: number;
    true_positives: number;
    false_positives: number;
    threshold: number;
    evaluated_week_count: number;
    missing_week_count: number;
    labeled_weeks: Array<{ week: string; robust_z_score: number; injected_delta: number; detected: boolean }>;
  };
}

function isDuckDBHeavyRuntimeRequest(url: string) {
  return /duckdb[^?]*(?:\.wasm|worker|extension)|parquet\.duckdb_extension/i.test(url);
}

test.describe("Margin Control Tower exhibit 01 (detection figure, real data)", () => {
  test("the figure plots exactly 6 vermilion detections read from detection-report.json", async ({ page }) => {
    const report = loadDetectionReport();
    await page.goto(ROUTE, { waitUntil: "networkidle" });

    const exhibit01 = page.locator(SEL.exhibit("01"));
    const dots = exhibit01.locator('[data-detection-dot="true"]');
    await expect(dots).toHaveCount(report.labeled_weeks.length);
    expect(report.labeled_weeks.length).toBe(6);

    // No-JS-equivalent static table carries the same 6 rows with the exact
    // recorded values (zero hardcoded numbers -- read straight from the
    // committed JSON, not re-typed as literals in this test).
    const rows = exhibit01.locator("[data-detection-row]");
    await expect(rows).toHaveCount(report.labeled_weeks.length);
    for (const labeled of report.labeled_weeks) {
      const row = exhibit01.locator(`[data-detection-row][data-detected="${labeled.detected}"]`, { hasText: labeled.week });
      await expect(row).toContainText(labeled.robust_z_score.toFixed(2));
      await expect(row).toContainText(labeled.injected_delta.toFixed(2));
    }
    // Every labeled week in this artifact is a true positive (recall 1.0,
    // 0 false negatives) -- confirms the "six alarms" assertion is not
    // vacuous over a differently-shaped future artifact.
    expect(report.labeled_weeks.every((row) => row.detected)).toBe(true);
  });

  test("the stat line's recall/precision/weeks/threshold values are read from detection-report.json, not re-typed", async ({ page }) => {
    const report = loadDetectionReport();
    await page.goto(ROUTE, { waitUntil: "networkidle" });

    const stats = page.locator(SEL.exhibit("01")).locator(".exhibit-stat-value");
    await expect(stats).toHaveCount(4);
    const values = await stats.allTextContents();
    expect(values[0]).toBe(report.recall.toFixed(2));
    expect(values[1]).toBe(report.precision.toFixed(3).replace(/^0\./, "."));
    expect(values[2]).toBe(String(report.evaluated_week_count));
    expect(values[3]).toBe(`±${report.threshold}`);

    const totalAlarms = report.true_positives + report.false_positives;
    await expect(page.locator(SEL.exhibit("03"))).toContainText(String(totalAlarms));
    await expect(page.locator(SEL.exhibit("03"))).toContainText(String(report.false_positives));
  });
});

test.describe("Margin Control Tower exhibit 04 (click-gated DuckDB receipts)", () => {
  test.describe.configure({ timeout: 90_000 });

  test("no DuckDB-WASM request fires before the verify button is clicked", async ({ page }) => {
    const heavyRuntimeRequests: string[] = [];
    let parquetRequests = 0;
    page.on("request", (request) => {
      if (isDuckDBHeavyRuntimeRequest(request.url())) heavyRuntimeRequests.push(request.url());
      if (new URL(request.url()).pathname === "/case-studies/margin-control-tower/olist-margin.parquet") parquetRequests += 1;
    });
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    expect(heavyRuntimeRequests).toEqual([]);
    expect(parquetRequests).toBe(0);

    const verify = page.locator(".margin-verify");
    await expect(verify).toHaveAttribute("data-verify-status", "idle");
    await verify.getByRole("button").click();
    await expect(verify).toHaveAttribute("data-verify-status", "verified", { timeout: 60_000 });
    expect(parquetRequests).toBe(1);
    await expect(verify).toContainText("15,809");
    await expect(verify.locator("code")).toHaveText(/^[a-f0-9]{64}$/);
  });
});

test("Margin Control Tower renders with no JavaScript: exhibits 01-04 show real static content", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

  await expect(page.locator(SEL.exhibit("01")).locator("[data-detection-row]")).toHaveCount(6);
  await expect(page.locator(SEL.exhibit("01")).locator(".exhibit-stat-value")).toHaveCount(4);
  await expect(page.locator(SEL.exhibit("02")).locator(".margin-registry-table tbody tr")).toHaveCount(4);
  await expect(page.locator(SEL.exhibit("03")).locator(".exhibit-finding")).toHaveCount(2);
  await expect(page.locator(SEL.exhibit("04")).locator(".margin-receipts-dl > div")).toHaveCount(4);
  // The verify button is present but inert without JS -- must not vanish.
  await expect(page.locator(".margin-verify-button")).toBeVisible();

  await context.close();
});

test("Margin Control Tower rail entry-open opens on load and collapses on scroll (auto-rail v3)", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Auto-rail v3 is desktop/tablet only (>=980px).");
  await page.goto(ROUTE, { waitUntil: "networkidle" });
  await expect(page.locator(".exhibit-shell")).toHaveAttribute("data-rail-mode", "auto");
  await expect(page.locator(".exhibit-shell")).not.toHaveClass(/rail-collapsed/);
  await expect(page.locator(".exhibit-rail-stamp")).toHaveText("ARCHIVED");
  await expect(page.locator(".exhibit-rail-stamp")).toHaveAttribute("data-tone", "offline");

  await page.mouse.wheel(0, 40);
  await expect(page.locator(".exhibit-shell")).toHaveClass(/rail-collapsed/);
});

test("en Margin Control Tower renders no Chinese (CJK) text anywhere on the page", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "en"));
  await page.goto(ROUTE, { waitUntil: "networkidle" });
  await expect(page.locator(SEL.cnGloss)).toHaveCount(0);
  const bodyText = await bodyTextExcludingLanguageSwitcher(page);
  expect(containsCJK(bodyText)).toBe(false);
});

test("zh Margin Control Tower carries independently-written zh copy with no long English run", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "zh"));
  await page.goto(ROUTE, { waitUntil: "networkidle" });

  const gloss = page.locator(SEL.cnGloss).first();
  await expect(gloss).toHaveCount(1);
  expect(longestLatinWordRun(await gloss.innerText())).toBeLessThanOrEqual(8);

  for (const num of ["01", "02", "03", "04"]) {
    const exhibitText = await page.locator(SEL.exhibit(num)).innerText();
    expect(containsCJK(exhibitText)).toBe(true);
    expect(longestLatinWordRun(exhibitText)).toBeLessThanOrEqual(8);
  }
});

test.describe("Margin Control Tower mobile layout", () => {
  test("no horizontal overflow at 390 or 360, first screen and mid-page", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Overflow audit is meaningful only at narrow viewports.");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    await assertNoHorizontalOverflow(page, `${ROUTE} at 390 (first screen)`);
    await page.locator(SEL.exhibit("04")).scrollIntoViewIfNeeded();
    await assertNoHorizontalOverflow(page, `${ROUTE} at 390 (exhibit 04)`);

    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    await assertNoHorizontalOverflow(page, `${ROUTE} at 360 (first screen)`);
    await page.locator(SEL.exhibit("04")).scrollIntoViewIfNeeded();
    await assertNoHorizontalOverflow(page, `${ROUTE} at 360 (exhibit 04)`);
  });
});
