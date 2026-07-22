import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function decodedParquetFixture(name: "margin" | "credit") {
  const encoded = readFileSync(resolve(process.cwd(), `tests/e2e/analytics-invalid-${name}.parquet.b64`), "utf8").trim();
  return Buffer.from(encoded, "base64");
}

function syntheticCreditRows() {
  const value = JSON.parse(readFileSync(resolve(process.cwd(), "public/case-studies/credit-policy-lab/synthetic-credit-data.json"), "utf8")) as {
    rows: Array<{ application_id: string; vintage: string }>;
  };
  return value.rows;
}

function isDuckDBHeavyRuntimeRequest(url: string) {
  return /duckdb[^?]*(?:\.wasm|worker|extension)|parquet\.duckdb_extension/i.test(url);
}

async function measureCachedSwitch(
  page: import("@playwright/test").Page,
  testId: "margin-control-tower" | "credit-policy-lab",
  buttonName: string,
  expectedSource: "synthetic" | "real",
) {
  return page.evaluate(({ testId: id, buttonName: label, expectedSource: source }) => new Promise<number>((resolveElapsed, rejectElapsed) => {
    const lab = document.querySelector<HTMLElement>(`[data-testid="${id}"]`);
    const button = [...(lab?.querySelectorAll<HTMLButtonElement>(".dataset-source-toggle button") ?? [])]
      .find((candidate) => candidate.textContent?.trim() === label);
    if (!lab || !button) {
      rejectElapsed(new Error(`Unable to locate ${id} source control.`));
      return;
    }
    const started = performance.now();
    button.click();
    const observe = () => {
      if (lab.dataset.activeSource === source) {
        resolveElapsed(performance.now() - started);
        return;
      }
      if (performance.now() - started > 2_000) {
        rejectElapsed(new Error(`Timed out switching ${id} to ${source}.`));
        return;
      }
      requestAnimationFrame(observe);
    };
    requestAnimationFrame(observe);
  }), { testId, buttonName, expectedSource });
}

// Browser-native DuckDB initialization and the 5 MB credit artifact can legitimately take
// longer than Playwright's 30-second default on a cold mobile/WebAssembly run. Keep the test
// budget above the explicit 60-second real-artifact assertions below.
test.describe.configure({ mode: "serial", timeout: 90_000 });

test.describe("analytics real-data evidence", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "en"));
  });

  test("both project pages mount the dedicated methods section and authoritative dataset source", async ({ page }) => {
    for (const [route, project, sourceHref] of [
      ["/analytics/margin-control-tower", "margin", "https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce"],
      ["/analytics/credit-policy-lab", "credit", "https://zenodo.org/records/11295916"],
    ] as const) {
      await page.goto(route, { waitUntil: "networkidle" });
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
      await expect(methods.locator("code[title]")).toHaveText(/^[a-f0-9]{64}$/);
      await expect(methods.getByRole("link", { name: "Open source record" })).toHaveAttribute("href", sourceHref);
    }
  });

  test("Margin paints a verified compact preview, then verifies the same buffer through DuckDB by default", async ({ page }) => {
    const heavyRuntimeRequests: string[] = [];
    let parquetArtifactRequests = 0;
    page.on("request", (request) => {
      if (isDuckDBHeavyRuntimeRequest(request.url())) heavyRuntimeRequests.push(request.url());
      if (new URL(request.url()).pathname === "/case-studies/margin-control-tower/olist-margin.parquet") {
        parquetArtifactRequests += 1;
      }
    });
    await page.goto("/analytics/margin-control-tower", { waitUntil: "networkidle" });
    const lab = page.getByTestId("margin-control-tower");
    await expect(lab).toHaveAttribute("data-requested-source", "real", { timeout: 60_000 });
    await expect(lab).toHaveAttribute("data-active-source", "real", { timeout: 60_000 });
    await expect(lab).toHaveAttribute("data-real-materialization-status", "preview");
    await expect(lab.getByRole("button", { name: "Olist (real)" })).toHaveAttribute("aria-pressed", "true");
    await expect(lab).toContainText("Verified compact real preview", { timeout: 60_000 });
    await expect(lab).toContainText("Olist margin artifact");
    await expect(lab).toContainText("15,809 derived category cells");
    await expect(lab).toContainText("748 preview cells loaded");
    await expect(lab).toContainText("Recorded full-artifact contract: 10 / 10");
    const promotionDepth = lab.getByRole("slider", { name: "Promotion depth" });
    await promotionDepth.fill("7");
    await expect(promotionDepth).toHaveValue("7");
    const drilldown = page.getByTestId("detection-week-drilldown");
    await expect(drilldown).toBeVisible();
    await expect(drilldown.locator("article")).toHaveCount(6);
    await expect(drilldown).toContainText(/Detected|Missed/);
    await expect(page.locator(".analytics-offline-panel").last()).toContainText("Holdout MAPE");
    await expect(lab).toHaveAttribute("data-real-full-warm-status", "ready", { timeout: 60_000 });
    await expect(lab).toHaveAttribute("data-real-materialization-status", "full");
    await expect(promotionDepth).toHaveValue("7");
    await expect(lab).toContainText("Complete DuckDB materialization");
    expect(heavyRuntimeRequests.length).toBeGreaterThan(0);
    expect(parquetArtifactRequests).toBe(1);
    await lab.getByRole("button", { name: "Synthetic fixture" }).click();
    await expect(lab).toHaveAttribute("data-active-source", "synthetic");
    await lab.getByRole("button", { name: "Olist (real)" }).click();
    await expect(lab).toHaveAttribute("data-active-source", "real");
    await expect(lab).toHaveAttribute("data-real-materialization-status", "full");
    expect(parquetArtifactRequests).toBe(1);
    await page.locator("a.brand").click();
    await expect(page).toHaveURL(/\/$/);
    await page.getByRole("link", { name: /Margin Control Tower/ }).first().click();
    const remountedLab = page.getByTestId("margin-control-tower");
    await expect(remountedLab).toHaveAttribute("data-real-materialization-status", "full", { timeout: 60_000 });
    expect(parquetArtifactRequests).toBe(1);
  });

  test("a remount joins an in-flight full materialization without a second Parquet request", async ({ page }) => {
    let parquetArtifactRequests = 0;
    page.on("request", (request) => {
      if (new URL(request.url()).pathname === "/case-studies/margin-control-tower/olist-margin.parquet") {
        parquetArtifactRequests += 1;
      }
    });
    await page.route("**/duckdb/extensions/**", async (route) => {
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 3_000));
      await route.continue();
    });
    await page.goto("/analytics/margin-control-tower", { waitUntil: "networkidle" });
    const lab = page.getByTestId("margin-control-tower");
    await expect(lab).toHaveAttribute("data-real-materialization-status", "preview", { timeout: 60_000 });
    await expect(lab).toHaveAttribute("data-real-full-warm-status", "loading", { timeout: 30_000 });
    await page.locator("a.brand").click();
    await page.getByRole("link", { name: /Margin Control Tower/ }).first().click();
    const remountedLab = page.getByTestId("margin-control-tower");
    await expect(remountedLab).toHaveAttribute("data-real-materialization-status", "full", { timeout: 60_000 });
    await expect(remountedLab).toHaveAttribute("data-real-full-warm-status", "ready");
    expect(parquetArtifactRequests).toBe(1);
  });

  test("an explicit same-source Olist interaction preserves selection and completes full DuckDB materialization", async ({ page }) => {
    await page.goto("/analytics/margin-control-tower", { waitUntil: "networkidle" });
    const lab = page.getByTestId("margin-control-tower");
    await expect(lab).toHaveAttribute("data-real-materialization-status", "preview", { timeout: 60_000 });
    await lab.getByRole("combobox", { name: "Region" }).selectOption("All");
    await lab.getByRole("combobox", { name: "Channel" }).selectOption("All");
    await lab.getByRole("button", { name: "Olist (real)" }).click();
    await expect(lab).toHaveAttribute("data-real-materialization-status", "full", { timeout: 60_000 });
    await expect(lab.getByRole("combobox", { name: "Region" })).toHaveValue("All");
    await expect(lab.getByRole("combobox", { name: "Channel" })).toHaveValue("All");
    await expect(lab).toContainText("Complete DuckDB materialization");
    await expect(lab).toContainText("10 / 10 contracts pass");
  });

  test("a compact-preview week interaction materializes full data before preserving the target week", async ({ page }) => {
    await page.goto("/analytics/margin-control-tower", { waitUntil: "networkidle" });
    const lab = page.getByTestId("margin-control-tower");
    await expect(lab).toHaveAttribute("data-real-materialization-status", "preview", { timeout: 60_000 });
    const weekSelect = lab.getByRole("combobox", { name: "Week" });
    await weekSelect.selectOption("2017-01-02");
    await expect(lab).toHaveAttribute("data-real-materialization-status", "full", { timeout: 60_000 });
    await expect(weekSelect).toHaveValue("2017-01-02");
  });

  test("a DuckDB runtime failure preserves the verified preview and its linked evidence", async ({ page }) => {
    await page.route("**/duckdb/extensions/**", (route) => route.fulfill({ status: 503, body: "runtime extension unavailable" }));
    await page.goto("/analytics/margin-control-tower", { waitUntil: "networkidle" });
    const lab = page.getByTestId("margin-control-tower");
    await expect(lab).toHaveAttribute("data-real-materialization-status", "preview", { timeout: 60_000 });
    const artifactSha = lab.locator(".analytics-lab-footer code").nth(1);
    await expect(artifactSha).toHaveText(/^[a-f0-9]{64}$/);
    const verifiedSha = await artifactSha.textContent();
    await lab.getByRole("button", { name: "Olist (real)" }).click();
    await expect(lab).toHaveAttribute("data-real-materialization-status", "unavailable", { timeout: 60_000 });
    await expect(lab).toHaveAttribute("data-active-source", "real");
    await expect(lab).toHaveAttribute("data-real-artifact-status", "loaded");
    await expect(artifactSha).toHaveText(verifiedSha!);
    await expect(lab).toContainText("Verified compact real preview");
    await expect(lab).toContainText("748 preview cells loaded");
    await expect(page.getByTestId("detection-week-drilldown")).toBeVisible();
    await expect(lab).not.toContainText("Margin Synthetic v2");
  });

  test("a compact-preview heatmap selection outside the guided category queues full materialization", async ({ page }) => {
    await page.goto("/analytics/margin-control-tower", { waitUntil: "networkidle" });
    const lab = page.getByTestId("margin-control-tower");
    await expect(lab).toHaveAttribute("data-real-materialization-status", "preview", { timeout: 60_000 });
    const selection = await page.evaluate(() => new Promise<{ elapsed: number; category: string; region: string }>((resolveSelection, rejectSelection) => {
      const categorySelect = document.querySelector<HTMLSelectElement>('.analytics-controlbar select[aria-label="Category"], .analytics-controlbar label:nth-child(2) select');
      const regionSelect = document.querySelector<HTMLSelectElement>('.analytics-controlbar select[aria-label="Region"], .analytics-controlbar label:nth-child(3) select');
      const guidedCategory = categorySelect?.value ?? "";
      const target = [...document.querySelectorAll<HTMLButtonElement>(".margin-heatmap-grid button:not([disabled])")]
        .find((button) => button.querySelector("span")?.textContent !== guidedCategory);
      const category = target?.querySelector("span")?.textContent ?? "";
      const region = target?.querySelector("small")?.textContent ?? "";
      if (!target || !categorySelect || !regionSelect || !category || !region) {
        rejectSelection(new Error("Unable to locate a compact heatmap target."));
        return;
      }
      const started = performance.now();
      target.click();
      const observe = () => {
        if (categorySelect.value === category && regionSelect.value === region) {
          resolveSelection({ elapsed: performance.now() - started, category, region });
          return;
        }
        if (performance.now() - started > 2_000) {
          rejectSelection(new Error("Compact heatmap selection did not render immediately."));
          return;
        }
        requestAnimationFrame(observe);
      };
      requestAnimationFrame(observe);
    }));
    expect(selection.elapsed).toBeLessThan(200);
    await expect(lab).toHaveAttribute("data-real-materialization-status", "full", { timeout: 60_000 });
    await expect(lab.getByRole("combobox", { name: "Category" })).toHaveValue(selection.category);
    await expect(lab.getByRole("combobox", { name: "Region" })).toHaveValue(selection.region);
  });

  test("Credit requests the real backtest by default and reveals outcome-window swap-set rates", async ({ page }) => {
    await page.goto("/analytics/credit-policy-lab", { waitUntil: "networkidle" });
    const lab = page.getByTestId("credit-policy-lab");
    await expect(lab).toHaveAttribute("data-requested-source", "real", { timeout: 60_000 });
    await expect(lab).toHaveAttribute("data-active-source", "real", { timeout: 60_000 });
    await expect(lab.getByRole("button", { name: "Real backtest" })).toHaveAttribute("aria-pressed", "true");
    await expect(lab).toContainText("Scored backtest artifact", { timeout: 60_000 });
    await expect(lab).toContainText("120,000 applications");
    await expect(lab).toContainText("All ten checks pass");
    const rates = lab.getByTestId("swap-set-observed-rates");
    await expect(rates).toBeVisible();
    await expect(rates).toContainText("Observed default rates in the loaded outcome window");
    await expect(rates).toContainText("Challenger-only");
    await expect(rates).toContainText("Baseline-only");
  });

  test("Credit application search reaches rows beyond the bounded option window and every vintage switch resets selection", async ({ page }) => {
    const rows = syntheticCreditRows();
    const vintages = [...new Set(rows.map((row) => row.vintage))].sort();
    const finalVintage = vintages.at(-1)!;
    const finalRows = rows.filter((row) => row.vintage === finalVintage);
    const searchedRow = finalRows[500];

    await page.goto("/analytics/credit-policy-lab", { waitUntil: "networkidle" });
    const lab = page.getByTestId("credit-policy-lab");
    await lab.getByRole("button", { name: "Synthetic fixture" }).click();
    await expect(lab).toHaveAttribute("data-active-source", "synthetic");

    const applicationSelect = lab.getByRole("combobox", { name: "Synthetic application" });
    await expect(applicationSelect.locator("option")).toHaveCount(250);
    await expect(applicationSelect.locator(`option[value="${searchedRow.application_id}"]`)).toHaveCount(0);
    await lab.getByRole("searchbox", { name: "Application" }).fill(searchedRow.application_id);
    await expect(applicationSelect.locator(`option[value="${searchedRow.application_id}"]`)).toHaveCount(1);
    await applicationSelect.selectOption(searchedRow.application_id);
    await expect(lab.locator(".credit-entity-ledger code").first()).toHaveText(searchedRow.application_id);

    const policyVintage = lab.getByRole("combobox", { name: "Backtest vintage" });
    const selectedVintage = vintages[0];
    const selectedVintageRows = rows.filter((row) => row.vintage === selectedVintage);
    await policyVintage.selectOption(selectedVintage);
    await expect(applicationSelect).toHaveValue(selectedVintageRows[0].application_id);
    expect(await applicationSelect.locator("option").allTextContents()).toEqual(selectedVintageRows.slice(0, 250).map((row) => row.application_id));

    const trendVintage = vintages[1];
    const trendVintageRows = rows.filter((row) => row.vintage === trendVintage);
    await lab.locator(`.credit-vintages button[title^="${trendVintage}:"]`).click();
    await expect(policyVintage).toHaveValue(trendVintage);
    await expect(applicationSelect).toHaveValue(trendVintageRows[0].application_id);
    expect(await applicationSelect.locator("option").allTextContents()).toEqual(trendVintageRows.slice(0, 250).map((row) => row.application_id));
  });

  test("warmed Margin source switches stay below the interaction budget", async ({ page }) => {
    await page.goto("/analytics/margin-control-tower", { waitUntil: "networkidle" });
    const lab = page.getByTestId("margin-control-tower");
    await expect(lab).toHaveAttribute("data-active-source", "real", { timeout: 60_000 });
    await expect(lab).toHaveAttribute("data-real-materialization-status", "preview");

    await expect(lab).toHaveAttribute("data-synthetic-cache-ready", "true", { timeout: 30_000 });
    await expect(lab).toHaveAttribute("data-real-full-warm-status", "ready", { timeout: 60_000 });
    const toSynthetic = await measureCachedSwitch(page, "margin-control-tower", "Synthetic fixture", "synthetic");
    const toReal = await measureCachedSwitch(page, "margin-control-tower", "Olist (real)", "real");
    expect(toSynthetic).toBeLessThan(200);
    expect(toReal).toBeLessThan(200);
    await expect(lab).toHaveAttribute("data-real-materialization-status", "full");
  });

  test("warmed Credit source switches stay below the interaction budget", async ({ page }) => {
    await page.goto("/analytics/credit-policy-lab", { waitUntil: "networkidle" });
    const lab = page.getByTestId("credit-policy-lab");
    await expect(lab).toHaveAttribute("data-active-source", "real", { timeout: 60_000 });
    await expect(lab).toHaveAttribute("data-synthetic-cache-ready", "true", { timeout: 30_000 });
    const toSynthetic = await measureCachedSwitch(page, "credit-policy-lab", "Synthetic fixture", "synthetic");
    const toReal = await measureCachedSwitch(page, "credit-policy-lab", "Real backtest", "real");
    expect(toSynthetic).toBeLessThan(200);
    expect(toReal).toBeLessThan(200);
  });

  test("Margin panels align and the trend stays expanded in both sources and locales", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "The requested height comparison is the 1440×900 desktop layout.");
    await page.goto("/analytics/margin-control-tower", { waitUntil: "networkidle" });
    const lab = page.getByTestId("margin-control-tower");
    await expect(lab).toHaveAttribute("data-active-source", "real", { timeout: 60_000 });

    const readLayout = () => page.evaluate(() => {
      const waterfall = document.querySelector<HTMLElement>(".margin-waterfall")!;
      const heatmap = document.querySelector<HTMLElement>(".margin-heatmap")!;
      const heatmapGrid = document.querySelector<HTMLElement>(".margin-heatmap-grid")!;
      const trend = document.querySelector<HTMLElement>(".margin-trend-panel .margin-week-bars")!;
      const heatmapHeading = document.querySelector<HTMLElement>(".margin-heatmap .analytics-pane-heading")!;
      const labElement = document.querySelector<HTMLElement>('[data-testid="margin-control-tower"]')!;
      return {
        activeSource: labElement.dataset.activeSource,
        waterfallHeight: waterfall.getBoundingClientRect().height,
        heatmapHeight: heatmap.getBoundingClientRect().height,
        heatmapHasOverflow: heatmapGrid.scrollHeight > heatmapGrid.clientHeight,
        heatmapOverflowY: getComputedStyle(heatmapGrid).overflowY,
        trendOverflowY: getComputedStyle(trend).overflowY,
        trendFitsVertically: trend.scrollHeight <= trend.clientHeight + 1,
        fakeCaptionCount: heatmapHeading.querySelectorAll("code").length,
      };
    });
    const assertLayout = async () => {
      const layout = await readLayout();
      expect(Math.abs(layout.waterfallHeight - layout.heatmapHeight)).toBeLessThanOrEqual(2);
      expect(["auto", "scroll"]).toContain(layout.heatmapOverflowY);
      if (layout.activeSource === "real") expect(layout.heatmapHasOverflow).toBe(true);
      expect(["auto", "scroll"]).not.toContain(layout.trendOverflowY);
      expect(layout.trendFitsVertically).toBe(true);
      expect(layout.fakeCaptionCount).toBe(0);
    };

    await assertLayout();
    await page.getByRole("button", { name: "中", exact: true }).click();
    await assertLayout();
    await expect(lab).toHaveAttribute("data-synthetic-cache-ready", "true", { timeout: 30_000 });
    await lab.getByRole("button", { name: "合成夹具" }).click();
    await expect(lab).toHaveAttribute("data-active-source", "synthetic");
    await assertLayout();
    await page.getByRole("button", { name: "EN", exact: true }).click();
    await assertLayout();
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
    await expect(page.getByTestId("analytics-methods-margin")).toContainText("The methods report is being prepared with the real-data artifact.");
    const margin = page.getByTestId("margin-control-tower");
    await expect(margin).toHaveAttribute("data-requested-source", "real");
    await expect(margin).toHaveAttribute("data-active-source", "synthetic");
    await expect(margin.getByRole("status")).toContainText("real-data artifact pending");
    await expect(page.locator(".analytics-offline-panel").first()).toContainText("Detection report pending");
    await expect(page.locator(".analytics-offline-panel").last()).toContainText("Elasticity report pending");

    await page.unrouteAll({ behavior: "wait" });
    for (const report of ["detection-report.json", "elasticity-report.json"]) {
      await page.route(`**/case-studies/margin-control-tower/${report}`, (route) => route.fulfill({ status: 404 }));
      await page.goto("/analytics/margin-control-tower", { waitUntil: "networkidle" });
      const reportBlockedMargin = page.getByTestId("margin-control-tower");
      await expect(reportBlockedMargin).toHaveAttribute("data-requested-source", "real");
      await expect(reportBlockedMargin).toHaveAttribute("data-real-artifact-status", "pending", { timeout: 60_000 });
      await expect(reportBlockedMargin).toHaveAttribute("data-active-source", "synthetic");
      await expect(reportBlockedMargin).toContainText("Margin Synthetic v2");
      await expect(page.locator(".analytics-offline-panel").first()).toContainText("Detection report pending");
      await expect(page.locator(".analytics-offline-panel").last()).toContainText("Elasticity report pending");
      await page.unrouteAll({ behavior: "wait" });
    }

    for (const artifact of ["scored-backtest.parquet", "methods-evidence.json"]) {
      await page.route(`**/case-studies/credit-policy-lab/${artifact}`, (route) => route.fulfill({ status: 404 }));
    }
    await page.goto("/analytics/credit-policy-lab", { waitUntil: "networkidle" });
    await expect(page.getByTestId("analytics-methods-credit")).toContainText("The methods report is being prepared with the real-data artifact.");
    const credit = page.getByTestId("credit-policy-lab");
    await expect(credit).toHaveAttribute("data-requested-source", "real");
    await expect(credit).toHaveAttribute("data-active-source", "synthetic");
    await expect(credit.getByRole("status")).toContainText("real-data artifact pending");
    expect(browserErrors).toEqual([]);
  });

  test("malformed versioned reports fail closed", async ({ page }) => {
    for (const [report, body] of [
      ["detection-report.json", { report_version: "detection-report-v2", method: "STL + robust z-score", precision: 1, recall: 1 }],
      ["elasticity-report.json", { coefficient: "not-a-number", confidence_interval_95: [0, 1], holdout_mape: 0.1 }],
    ] as const) {
      await page.route(`**/case-studies/margin-control-tower/${report}`, (route) => route.fulfill({ json: body }));
      await page.goto("/analytics/margin-control-tower", { waitUntil: "networkidle" });
      const margin = page.getByTestId("margin-control-tower");
      await expect(margin).toHaveAttribute("data-requested-source", "real");
      await expect(margin).toHaveAttribute("data-real-artifact-status", "invalid", { timeout: 60_000 });
      await expect(margin).toHaveAttribute("data-active-source", "synthetic");
      await expect(margin).toContainText("Margin Synthetic v2");
      await expect(page.locator(".analytics-offline-panel").first()).toContainText("Report blocked: invalid contract");
      await expect(page.locator(".analytics-offline-panel").last()).toContainText("Report blocked: invalid contract");
      await page.unrouteAll({ behavior: "wait" });
    }
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
    const margin = page.getByTestId("margin-control-tower");
    await expect(margin).toHaveAttribute("data-requested-source", "real");
    await expect(margin).toHaveAttribute("data-real-artifact-status", "invalid", { timeout: 60_000 });
    await expect(margin).toHaveAttribute("data-active-source", "synthetic");
    await expect(margin).toContainText("Margin Synthetic v2");
    await expect(page.locator(".analytics-offline-panel").first()).toContainText("Report blocked: invalid contract", { timeout: 60_000 });
    await expect(page.locator(".analytics-offline-panel").last()).toContainText("Report blocked: invalid contract");
  });

  test("Credit rejects a readable Parquet artifact whose SHA-256 is not the recorded backtest identity", async ({ page }) => {
    const differentValidParquet = readFileSync(resolve(
      process.cwd(),
      "public/case-studies/credit-policy-lab/synthetic-credit-data.parquet",
    ));
    await page.route("**/case-studies/credit-policy-lab/scored-backtest.parquet", (route) => route.fulfill({
      status: 200,
      contentType: "application/octet-stream",
      body: differentValidParquet,
    }));

    await page.goto("/analytics/credit-policy-lab", { waitUntil: "networkidle" });
    const credit = page.getByTestId("credit-policy-lab");
    await expect(credit).toHaveAttribute("data-requested-source", "real");
    await expect(credit).toHaveAttribute("data-real-artifact-status", "invalid", { timeout: 60_000 });
    await expect(credit).toHaveAttribute("data-active-source", "synthetic");
    await expect(credit.getByRole("status")).toContainText("real backtest artifact blocked");
    await expect(credit).toContainText("Credit Synthetic v2");
    await expect(credit).not.toContainText("Scored backtest artifact");
  });

  test("invalid Parquet bytes block real mode and keep the governed synthetic source active", async ({ page }) => {
    await page.route("**/case-studies/margin-control-tower/olist-margin.parquet", (route) => route.fulfill({ status: 200, contentType: "application/octet-stream", body: "not-a-parquet-file" }));
    await page.goto("/analytics/margin-control-tower", { waitUntil: "networkidle" });
    const margin = page.getByTestId("margin-control-tower");
    await expect(margin.getByRole("status")).toContainText("real-data artifact blocked", { timeout: 60_000 });
    await expect(margin).toHaveAttribute("data-active-source", "synthetic");
    await expect(margin).toContainText("Margin Synthetic v2");

    await page.unrouteAll({ behavior: "wait" });
    await page.route("**/case-studies/credit-policy-lab/scored-backtest.parquet", (route) => route.fulfill({ status: 200, contentType: "application/octet-stream", body: "not-a-parquet-file" }));
    await page.goto("/analytics/credit-policy-lab", { waitUntil: "networkidle" });
    const credit = page.getByTestId("credit-policy-lab");
    await expect(credit.getByRole("status")).toContainText("real backtest artifact blocked", { timeout: 60_000 });
    await expect(credit).toHaveAttribute("data-active-source", "synthetic");
    await expect(credit).toContainText("Credit Synthetic v2");
  });

  test("readable but wrong-parent-hash artifacts fail closed before DuckDB materialization", async ({ page }) => {
    const heavyRuntimeRequests: string[] = [];
    page.on("request", (request) => {
      if (isDuckDBHeavyRuntimeRequest(request.url())) heavyRuntimeRequests.push(request.url());
    });
    await page.route("**/case-studies/margin-control-tower/olist-margin.parquet", (route) => route.fulfill({
      status: 200,
      contentType: "application/octet-stream",
      body: decodedParquetFixture("margin"),
    }));
    await page.goto("/analytics/margin-control-tower", { waitUntil: "networkidle" });
    const margin = page.getByTestId("margin-control-tower");
    await expect(margin.getByRole("status")).toContainText("real-data artifact blocked", { timeout: 60_000 });
    await expect(margin.getByRole("status")).toContainText("Dataset unavailable.");
    await expect(margin).toContainText("Margin Synthetic v2");
    expect(heavyRuntimeRequests).toEqual([]);

    await page.unrouteAll({ behavior: "wait" });
    await page.route("**/case-studies/credit-policy-lab/scored-backtest.parquet", (route) => route.fulfill({
      status: 200,
      contentType: "application/octet-stream",
      body: decodedParquetFixture("credit"),
    }));
    await page.goto("/analytics/credit-policy-lab", { waitUntil: "networkidle" });
    const credit = page.getByTestId("credit-policy-lab");
    await expect(credit.getByRole("status")).toContainText("real backtest artifact blocked", { timeout: 60_000 });
    await expect(credit.getByRole("status")).toContainText("Dataset unavailable.");
    await expect(credit).toContainText("Credit Synthetic v2");
    expect(heavyRuntimeRequests).toEqual([]);
  });
});
