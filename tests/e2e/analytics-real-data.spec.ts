import { expect, test } from "@playwright/test";
import { SEL } from "./selectors";

// Task L2 [CLAUDE]: the "margin" fixture variant is no longer exercised
// here -- Margin Control Tower's equivalent-or-stronger coverage (including
// its own click-gated DuckDB verify affordance) moved to
// tests/e2e/margin-r2.spec.ts once /analytics/margin-control-tower stopped
// serving the interactive workbench this file's margin-specific tests used
// to drive. tests/e2e/analytics-invalid-margin.parquet.b64 is left in place
// (harmless, unreferenced) rather than deleted.
//
// Task L4 [CLAUDE]: every Credit-specific test that used to live below
// (source-toggle default-source detection, explicit full-dataset load,
// application search + vintage selection, cached-source-switch timing,
// missing/invalid/wrong-hash/wrong-parent-hash artifact fail-closed states)
// moved to tests/e2e/credit-r2.spec.ts once /analytics/credit-policy-desk
// stopped serving the interactive workbench (src/components/analytics/
// CreditPolicyLab.tsx: source toggle, vintage picker, capacity slider,
// application search, swap-set panels) these tests used to drive -- that
// route now serves the rebuilt chart-led Evidence page (spec §6.7). The
// `decodedParquetFixture`/`syntheticCreditRows`/`measureCachedSwitch`/
// `isDuckDBHeavyRuntimeRequest` helpers those removed tests used are
// removed with them (unused otherwise in this file); the fixture file
// tests/e2e/analytics-invalid-credit.parquet.b64 is left in place
// (harmless, unreferenced) rather than deleted. See task-L4-report.md for
// the full old-assertion -> new-assertion inventory. Only the
// project-agnostic AnalyticsMethods coverage below (shared, unmodified
// component, rendered identically on both rebuilt pages) remains here.

// Browser-native DuckDB initialization can legitimately take longer than
// Playwright's 30-second default on a cold mobile/WebAssembly run. Keep
// the test budget generous even though this file's only remaining test
// does not itself touch DuckDB.
test.describe.configure({ mode: "serial", timeout: 90_000 });

test.describe("analytics real-data evidence", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "en"));
  });

  test.afterEach(async ({ page }) => {
    // Explicitly unload DuckDB-WASM workers before Playwright tears down its test worker.
    await page.goto("about:blank").catch(() => undefined);
  });

  test("both project pages mount the dedicated methods section and authoritative dataset source", async ({ page }) => {
    for (const [route, project, sourceHref] of [
      ["/analytics/margin-control-tower", "margin", "https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce"],
      ["/analytics/credit-policy-desk", "credit", "https://zenodo.org/records/11295916"],
    ] as const) {
      await page.goto(route, { waitUntil: "networkidle" });
      await page.locator(`[data-evidence=${project}] > details > summary`).click();
      const methods = page.getByTestId(`analytics-methods-${project}`);
      await expect(methods).toBeVisible();
      await expect(methods).toContainText("Methods / Results / Real-data analysis");
      await expect(methods).toContainText("Acquire and clean");
      await expect(methods).toContainText("Train and estimate");
      await expect(methods).toContainText("Split and prevent leakage");
      await expect(methods).toContainText("Outcome / anomaly labels");
      await expect(methods).toContainText("Quality controls");
      await expect(methods).toContainText("What changed with real data");
      await expect(methods).toContainText("Reproduce");
      await expect(methods.locator(SEL.codeTitle)).toHaveText(/^[a-f0-9]{64}$/);
      await expect(methods.getByRole("link", { name: "Open source record" })).toHaveAttribute("href", sourceHref);
    }
  });
});
