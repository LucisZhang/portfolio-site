import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function decodedParquetFixture(name: "margin" | "credit") {
  const encoded = readFileSync(resolve(process.cwd(), `tests/e2e/analytics-invalid-${name}.parquet.b64`), "utf8").trim();
  return Buffer.from(encoded, "base64");
}

// Browser-native DuckDB initialization and the 5 MB credit artifact can legitimately take
// longer than Playwright's 30-second default on a cold mobile/WebAssembly run. Keep the test
// budget above the explicit 60-second real-artifact assertions below.
test.describe.configure({ mode: "serial", timeout: 90_000 });

test.describe("analytics real-data evidence", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "en"));
  });

  test("both project pages mount the dedicated methods section and exact public-branch pipeline link", async ({ page }) => {
    for (const [route, project, sourceHref] of [
      ["/analytics/margin-control-tower", "margin", "https://github.com/LucisZhang/portfolio-site/tree/codex/portfolio-phase2/pipelines/olist-margin"],
      ["/analytics/credit-policy-lab", "credit", "https://github.com/LucisZhang/portfolio-site/tree/codex/portfolio-phase2/pipelines/credit-backtest"],
    ] as const) {
      await page.goto(route, { waitUntil: "networkidle" });
      const methods = page.getByTestId(`analytics-methods-${project}`);
      await expect(methods).toBeVisible();
      await expect(methods).toContainText("Methods / Evidence / What changed with real data");
      await expect(methods).toContainText("Acquire and clean");
      await expect(methods).toContainText("Train and estimate");
      await expect(methods).toContainText("Split and prevent leakage");
      await expect(methods).toContainText("Outcome / anomaly labels");
      await expect(methods).toContainText("Why this evidence is trustworthy");
      await expect(methods).toContainText("What changed with real data");
      await expect(methods).toContainText("Reproduce");
      await expect(methods.locator("code[title]")).toHaveText(/^[a-f0-9]{64}$/);
      await expect(page.getByRole("link", { name: "Real-data pipeline source" })).toHaveAttribute("href", sourceHref);
    }
  });

  test("real Margin artifact activates DuckDB and renders measured detection drill-down and elasticity", async ({ page }) => {
    await page.goto("/analytics/margin-control-tower", { waitUntil: "networkidle" });
    const lab = page.getByTestId("margin-control-tower");
    await lab.getByRole("button", { name: "Olist (real)" }).click();
    await expect(lab).toContainText("Loaded offline artifact", { timeout: 60_000 });
    await expect(lab).toContainText("Olist margin artifact");
    await expect(lab).toContainText("10 / 10 contracts pass");
    const drilldown = page.getByTestId("detection-week-drilldown");
    await expect(drilldown).toBeVisible();
    await expect(drilldown.locator("article")).toHaveCount(6);
    await expect(drilldown).toContainText(/Detected|Missed/);
    await expect(page.locator(".analytics-offline-panel").last()).toContainText("Holdout MAPE");
  });

  test("real Credit artifact activates and reveals outcome-window swap-set rates", async ({ page }) => {
    await page.goto("/analytics/credit-policy-lab", { waitUntil: "networkidle" });
    const lab = page.getByTestId("credit-policy-lab");
    await lab.getByRole("button", { name: "Real backtest" }).click();
    await expect(lab).toContainText("Scored backtest artifact", { timeout: 60_000 });
    await expect(lab).toContainText("120,000 applications");
    await expect(lab).toContainText("All ten checks pass");
    const rates = lab.getByTestId("swap-set-observed-rates");
    await expect(rates).toBeVisible();
    await expect(rates).toContainText("Observed default rates in the loaded outcome window");
    await expect(rates).toContainText("Challenger-only");
    await expect(rates).toContainText("Baseline-only");
  });

  test("missing real artifacts and reports preserve explicit pending states without console errors", async ({ page }) => {
    const browserErrors: string[] = [];
    page.on("pageerror", (error) => browserErrors.push(error.message));
    page.on("console", (message) => {
      const text = message.text();
      const isExpectedMissingResource = text === "Failed to load resource: the server responded with a status of 404 (Not Found)";
      if (message.type() === "error" && !isExpectedMissingResource) browserErrors.push(text);
    });
    for (const artifact of ["olist-margin.parquet", "detection-report.json", "elasticity-report.json", "methods-evidence.json"]) {
      await page.route(`**/case-studies/margin-control-tower/${artifact}`, (route) => route.fulfill({ status: 404 }));
    }
    await page.goto("/analytics/margin-control-tower", { waitUntil: "networkidle" });
    await expect(page.getByTestId("analytics-methods-margin")).toContainText("Methods evidence is pending");
    const margin = page.getByTestId("margin-control-tower");
    await margin.getByRole("button", { name: "Olist (real)" }).click();
    await expect(margin.getByRole("status")).toContainText("real-data artifact pending");
    await expect(page.locator(".analytics-offline-panel").first()).toContainText("Detection report pending");
    await expect(page.locator(".analytics-offline-panel").last()).toContainText("Elasticity report pending");

    await page.unrouteAll({ behavior: "wait" });
    for (const artifact of ["scored-backtest.parquet", "methods-evidence.json"]) {
      await page.route(`**/case-studies/credit-policy-lab/${artifact}`, (route) => route.fulfill({ status: 404 }));
    }
    await page.goto("/analytics/credit-policy-lab", { waitUntil: "networkidle" });
    await expect(page.getByTestId("analytics-methods-credit")).toContainText("Methods evidence is pending");
    const credit = page.getByTestId("credit-policy-lab");
    await credit.getByRole("button", { name: "Real backtest" }).click();
    await expect(credit.getByRole("status")).toContainText("real-data artifact pending");
    expect(browserErrors).toEqual([]);
  });

  test("malformed versioned reports fail closed", async ({ page }) => {
    await page.route("**/case-studies/margin-control-tower/detection-report.json", (route) => route.fulfill({ json: { report_version: "detection-report-v2", method: "STL + robust z-score", precision: 1, recall: 1 } }));
    await page.route("**/case-studies/margin-control-tower/elasticity-report.json", (route) => route.fulfill({ json: { coefficient: "not-a-number", confidence_interval_95: [0, 1], holdout_mape: 0.1 } }));
    await page.goto("/analytics/margin-control-tower", { waitUntil: "networkidle" });
    await page.getByTestId("margin-control-tower").getByRole("button", { name: "Olist (real)" }).click();
    await expect(page.locator(".analytics-offline-panel").first()).toContainText("Report blocked: invalid contract");
    await expect(page.locator(".analytics-offline-panel").last()).toContainText("Report blocked: invalid contract");
  });

  test("structurally valid reports with a stale Parquet hash fail closed", async ({ page }) => {
    for (const report of ["detection-report.json", "elasticity-report.json"]) {
      await page.route(`**/case-studies/margin-control-tower/${report}`, async (route) => {
        const response = await route.fetch();
        const body = await response.json() as Record<string, unknown>;
        await route.fulfill({ response, json: { ...body, artifact_sha256: "0".repeat(64) } });
      });
    }
    await page.goto("/analytics/margin-control-tower", { waitUntil: "networkidle" });
    await page.getByTestId("margin-control-tower").getByRole("button", { name: "Olist (real)" }).click();
    await expect(page.locator(".analytics-offline-panel").first()).toContainText("Report blocked: invalid contract", { timeout: 60_000 });
    await expect(page.locator(".analytics-offline-panel").last()).toContainText("Report blocked: invalid contract");
  });

  test("invalid Parquet bytes block real mode and keep the governed synthetic source active", async ({ page }) => {
    await page.route("**/case-studies/margin-control-tower/olist-margin.parquet", (route) => route.fulfill({ status: 200, contentType: "application/octet-stream", body: "not-a-parquet-file" }));
    await page.goto("/analytics/margin-control-tower", { waitUntil: "networkidle" });
    const margin = page.getByTestId("margin-control-tower");
    await margin.getByRole("button", { name: "Olist (real)" }).click();
    await expect(margin.getByRole("status")).toContainText("real-data artifact blocked", { timeout: 60_000 });
    await expect(margin).toContainText("Margin Synthetic v2");

    await page.unrouteAll({ behavior: "wait" });
    await page.route("**/case-studies/credit-policy-lab/scored-backtest.parquet", (route) => route.fulfill({ status: 200, contentType: "application/octet-stream", body: "not-a-parquet-file" }));
    await page.goto("/analytics/credit-policy-lab", { waitUntil: "networkidle" });
    const credit = page.getByTestId("credit-policy-lab");
    await credit.getByRole("button", { name: "Real backtest" }).click();
    await expect(credit.getByRole("status")).toContainText("real backtest artifact blocked", { timeout: 60_000 });
    await expect(credit).toContainText("Credit Synthetic v2");
  });

  test("readable Parquet artifacts that violate real-data contracts fail closed", async ({ page }) => {
    await page.route("**/case-studies/margin-control-tower/olist-margin.parquet", (route) => route.fulfill({
      status: 200,
      contentType: "application/octet-stream",
      body: decodedParquetFixture("margin"),
    }));
    await page.goto("/analytics/margin-control-tower", { waitUntil: "networkidle" });
    const margin = page.getByTestId("margin-control-tower");
    await margin.getByRole("button", { name: "Olist (real)" }).click();
    await expect(margin.getByRole("status")).toContainText("real-data artifact blocked", { timeout: 60_000 });
    await expect(margin.getByRole("status")).toContainText("Olist Parquet contract failed");
    await expect(margin.getByRole("status")).toContainText("grain unique");
    await expect(margin).toContainText("Margin Synthetic v2");

    await page.unrouteAll({ behavior: "wait" });
    await page.route("**/case-studies/credit-policy-lab/scored-backtest.parquet", (route) => route.fulfill({
      status: 200,
      contentType: "application/octet-stream",
      body: decodedParquetFixture("credit"),
    }));
    await page.goto("/analytics/credit-policy-lab", { waitUntil: "networkidle" });
    const credit = page.getByTestId("credit-policy-lab");
    await credit.getByRole("button", { name: "Real backtest" }).click();
    await expect(credit.getByRole("status")).toContainText("real backtest artifact blocked", { timeout: 60_000 });
    await expect(credit.getByRole("status")).toContainText("Scored backtest contract failed: application_id_unique");
    await expect(credit).toContainText("Credit Synthetic v2");
  });
});
