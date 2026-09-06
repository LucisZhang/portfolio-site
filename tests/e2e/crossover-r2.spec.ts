import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { SEL } from "./selectors";
import { bodyTextExcludingLanguageSwitcher, containsCJK, longestLatinWordRun } from "./localePurity";
import { assertNoHorizontalOverflow } from "./mobileAudit";

const ROUTE = "/engineering/crossover-study";

// Task L6 [CLAUDE]: rebuild of /engineering/crossover-study to the user-
// approved notebook/workbench design (spec §6.6, output/design-legacy/
// legacy-4-crossover-study.html), mirroring tests/e2e/credit-r2.spec.ts's
// / tests/e2e/rag-r2.spec.ts's structure. This file replaces the
// crossover-only coverage that used to live in tests/e2e/portfolio.spec.ts
// ("Crossover Study publishes three bilingual exhibits with inspectable
// receipts", driving the retired CrossoverExhibit.tsx markup) -- see
// task-L6-report.md for the full old-assertion -> new-assertion inventory.

function loadWorkbenchJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(path.resolve(__dirname, "../../public/case-studies/crossover-study/workbench", relativePath), "utf8")) as T;
}

type Exhibits = { ml32m_crossover: { n_star: number }; catalog_churn: { ml32m: { churn_share: number } } };
function loadExhibits(): Exhibits {
  return JSON.parse(readFileSync(path.resolve(__dirname, "../../public/case-studies/crossover-study/exhibits.json"), "utf8")) as Exhibits;
}

// iceberg-plate.json's snapshotId (884031112460958161) is a real 64-bit
// Iceberg snapshot ID that exceeds Number.MAX_SAFE_INTEGER -- JSON.parse
// (loadWorkbenchJson above) silently rounds it to the nearest
// representable double, the same reason the page itself
// (src/app/engineering/crossover-study/page.tsx) reads the raw file text
// and regex-extracts the digit string instead of trusting the parsed
// number. This test does the same, so it asserts against the exact
// committed value, not a float-rounded stand-in.
function readIcebergSnapshotId(): string {
  const raw = readFileSync(path.resolve(__dirname, "../../public/case-studies/crossover-study/workbench/iceberg-plate.json"), "utf8");
  const match = raw.match(/"snapshotId"\s*:\s*(\d+)/);
  if (!match) throw new Error("iceberg-plate.json is missing a numeric snapshotId field");
  return match[1];
}

type WorkbenchResult = { rows: Record<string, unknown>[]; telemetry: { rowsScanned: number; elapsedMs: number }; builtAt: string };
type IcebergPlate = { snapshotId: number; committedAt: string; schemaVersion: number; rowCount: number; files: number; bytes: number };

function isHeavyRuntimeRequest(url: string) {
  return /duckdb[^?]*(?:\.wasm|worker|extension)|parquet\.duckdb_extension|\.parquet(?:$|\?)/i.test(url);
}

test.describe("Crossover Study exhibit 01 (cached SQL workbench)", () => {
  test("first screen shows the full result table and telemetry with zero engine network", async ({ page }) => {
    const dataScale = loadWorkbenchJson<WorkbenchResult>("results/data-scale.json");
    const heavyRequests: string[] = [];
    page.on("request", (request) => {
      if (isHeavyRuntimeRequest(request.url())) heavyRequests.push(request.url());
    });

    await page.goto(ROUTE, { waitUntil: "networkidle" });
    expect(heavyRequests).toEqual([]);

    const exhibit01 = page.locator(SEL.exhibit("01"));
    const table = exhibit01.getByTestId("crossover-results-table");
    await expect(table.locator("tbody tr")).toHaveCount(dataScale.rows.length);
    await expect(table).toContainText("43,365,424");
    await expect(table).toContainText("18,286,190");

    const telemetry = exhibit01.getByTestId("crossover-telemetry");
    await expect(telemetry).toContainText(dataScale.telemetry.rowsScanned.toLocaleString("en-US"));
    await expect(telemetry).toContainText(dataScale.telemetry.elapsedMs.toFixed(2));
    await expect(telemetry).toContainText("cached");
    await expect(telemetry).toContainText(dataScale.builtAt.slice(0, 10));
    // Zero clicks, zero engine: the RUN affordance must not have fired yet.
    await expect(exhibit01.getByTestId("crossover-engine-note")).toHaveCount(0);
  });

  test("clicking a curated query swaps the cached SQL, table, and telemetry with no additional network request", async ({ page }) => {
    const categoryDistribution = loadWorkbenchJson<WorkbenchResult>("results/category-distribution.json");
    const heavyRequests: string[] = [];
    const workbenchDataRequests: string[] = [];
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    page.on("request", (request) => {
      if (isHeavyRuntimeRequest(request.url())) heavyRequests.push(request.url());
      if (new URL(request.url()).pathname.includes("/case-studies/crossover-study/workbench/")) workbenchDataRequests.push(request.url());
    });

    const exhibit01 = page.locator(SEL.exhibit("01"));
    await exhibit01.locator(".crossover-query-index li", { hasText: "02" }).getByRole("button").click();

    await expect(exhibit01.getByTestId("crossover-sql")).toContainText("dominate");
    const table = exhibit01.getByTestId("crossover-results-table");
    await expect(table.locator("tbody tr")).toHaveCount(categoryDistribution.rows.length);
    await expect(table).toContainText("Computers");
    await expect(exhibit01.getByTestId("crossover-telemetry")).toContainText(categoryDistribution.telemetry.elapsedMs.toFixed(2));

    // The click only swaps already-loaded React state -- no engine request,
    // and no fresh fetch of the workbench's own JSON (it was statically
    // imported at build time, not fetched at runtime).
    expect(heavyRequests).toEqual([]);
    expect(workbenchDataRequests).toEqual([]);
  });

  for (const locale of ["en", "zh"] as const) {
    test(`${locale} RUN describes the deferred R6 engine and never requests the DuckDB runtime`, async ({ page }) => {
      const heavyRequests: string[] = [];
      await page.addInitScript((selectedLocale) => {
        window.localStorage.setItem("portfolio-locale", selectedLocale);
      }, locale);
      await page.goto(ROUTE, { waitUntil: "networkidle" });
      page.on("request", (request) => {
        if (isHeavyRuntimeRequest(request.url())) heavyRequests.push(request.url());
      });

      const runButton = page.locator(SEL.exhibit("01")).locator(".crossover-run-button");
      await expect(runButton).toHaveAttribute("data-asset", "/duckdb/duckdb-mvp.wasm");
      await expect(runButton).toHaveAttribute("data-bytes", "39362651");
      await expect(runButton).toHaveAttribute("aria-label", locale === "en"
        ? "Run (Cmd+Enter) — the live engine is not connected until R6"
        : "运行（Cmd+Enter）——在线引擎将在 R6 阶段接入");
      await runButton.click();
      await expect(page.getByTestId("crossover-engine-note")).toHaveText(locale === "en" ? "ENGINE ARRIVES WITH R6" : "引擎将在 R6 阶段接入");
      expect(heavyRequests).toEqual([]);
    });
  }

  test("the Iceberg nameplate renders the real committed snapshot", async ({ page }) => {
    const plate = loadWorkbenchJson<IcebergPlate>("iceberg-plate.json");
    const snapshotId = readIcebergSnapshotId();
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    const nameplate = page.getByTestId("crossover-iceberg-plate");
    await expect(nameplate).toContainText(snapshotId);
    await expect(nameplate).toContainText(plate.committedAt.slice(0, 10));
    await expect(nameplate).toContainText(`v${plate.schemaVersion}`);
    await expect(nameplate).toContainText(plate.rowCount.toLocaleString("en-US"));
  });

  test("the download link resolves to the real committed result file", async ({ page, request }) => {
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    const href = await page.locator(SEL.exhibit("01")).locator(".crossover-table-foot a").getAttribute("href");
    expect(href).toBe("/case-studies/crossover-study/workbench/results/data-scale.json");
    const response = await request.get(href!);
    expect(response.status()).toBe(200);
  });
});

test.describe("Crossover Study exhibit 02 (the two main curves)", () => {
  test("Amazon null and ML-32M n*=20 curves both render with their legend and no-JS fallback table", async ({ page }) => {
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    const exhibit02 = page.locator(SEL.exhibit("02"));
    await expect(exhibit02.locator(SEL.exhibit("amazon-null"))).toBeVisible();
    await expect(exhibit02.locator(SEL.exhibit("ml32m-crossover"))).toBeVisible();
    await expect(exhibit02).toContainText("n*=20");
    await expect(exhibit02.locator(".crossover-curve-legend")).toHaveCount(2);
    await expect(exhibit02.locator(".crossover-curve-table")).toHaveCount(2);
  });

  // Fix (task review, Important): "n*=20" and "6.40%" used to be literal
  // strings in CrossoverCurves.tsx/SqlWorkbench.tsx -- this asserts the
  // rendered page instead matches values freshly computed from
  // exhibits.json at test time (not a second hardcoded expectation), so a
  // future change to the committed data would fail this test rather than
  // silently drift from what the page claims to derive.
  test("the n*=20 threshold and the 6.40% churn figure match exhibits.json, not a literal", async ({ page }) => {
    const exhibits = loadExhibits();
    const expectedNStar = exhibits.ml32m_crossover.n_star;
    const expectedChurnPercent = (exhibits.catalog_churn.ml32m.churn_share * 100).toFixed(2);

    await page.goto(ROUTE, { waitUntil: "networkidle" });
    const exhibit02 = page.locator(SEL.exhibit("02"));
    await expect(exhibit02).toContainText(`n*=${expectedNStar}`);
    await expect(exhibit02.locator(SEL.exhibit("ml32m-crossover"))).toContainText(`${expectedChurnPercent}%`);

    const query05Blurb = page.locator(SEL.exhibit("01")).locator(".crossover-query-index li", { hasText: "05" });
    await expect(query05Blurb).toContainText(`n*=${expectedNStar}`);
  });
});

test("Crossover Study renders with no JavaScript: the cached query, table, and receipts are real static content", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

  const exhibit01 = page.locator(SEL.exhibit("01"));
  await expect(exhibit01.locator(".crossover-run-button")).toHaveAttribute("aria-label", "Run (Cmd+Enter) — the live engine is not connected until R6");
  await expect(exhibit01.getByTestId("crossover-sql")).toContainText("SELECT");
  await expect(exhibit01.getByTestId("crossover-results-table").locator("tbody tr")).toHaveCount(2);
  await expect(exhibit01.locator(".crossover-query-index li")).toHaveCount(6);
  await expect(exhibit01.getByTestId("crossover-iceberg-plate")).toContainText("884031112460958161");

  await expect(page.locator(SEL.exhibit("02")).locator(".crossover-curve-table")).toHaveCount(2);
  await expect(page.getByTestId("crossover-receipts-list").locator(".crossover-receipt")).toHaveCount(6);

  await context.close();
});

test("Crossover Study rail entry-open opens on load and collapses on scroll (auto-rail v3)", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Auto-rail v3 is desktop/tablet only (>=980px).");
  await page.goto(ROUTE, { waitUntil: "networkidle" });
  await expect(page.locator(".exhibit-shell")).toHaveAttribute("data-rail-mode", "auto");
  await expect(page.locator(".exhibit-shell")).not.toHaveClass(/rail-collapsed/);
  // "secondary" tier (projects.ts) carries no rail-stamp -- the ragRail.ts/
  // triageRail.ts precedent, unlike Margin/Credit's "archive"-tier
  // ARCHIVED tag.
  await expect(page.locator(".exhibit-rail-stamp")).toHaveCount(0);

  await page.mouse.wheel(0, 40);
  await expect(page.locator(".exhibit-shell")).toHaveClass(/rail-collapsed/);
});

test("en Crossover Study renders no Chinese (CJK) text anywhere on the page", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "en"));
  await page.goto(ROUTE, { waitUntil: "networkidle" });
  await expect(page.locator(SEL.cnGloss)).toHaveCount(0);
  const bodyText = await bodyTextExcludingLanguageSwitcher(page);
  expect(containsCJK(bodyText)).toBe(false);
});

test("zh Crossover Study carries independently-written zh copy with no long English run", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "zh"));
  await page.goto(ROUTE, { waitUntil: "networkidle" });

  const gloss = page.locator(SEL.cnGloss).first();
  await expect(gloss).toHaveCount(1);
  expect(longestLatinWordRun(await gloss.innerText())).toBeLessThanOrEqual(8);

  // Exhibit 01's ceiling is higher than the sitewide default: it is the
  // one exhibit that deliberately keeps real, untranslated instrument
  // content in both locales (the SQL body plus its leading `--` research-
  // question comment line, per the UI-fabric convention SqlWorkbench.tsx's
  // own header comment documents) -- flattened together with no
  // intervening CJK or digit run, "How large is the current contract-
  // checked silver data plane? SELECT" alone measures 10 consecutive
  // plain-English tokens. This is real code/citation content, the same
  // "kept English on the zh page deliberately" treatment as RagDiffLab's
  // two-pane diff, not an untranslated sentence -- every other string in
  // this exhibit (title, intro, disclosure, query-index blurbs) is
  // independently translated.
  const ceilings: Record<string, number> = { "01": 10, "02": 8, "03": 8 };
  for (const num of ["01", "02", "03"]) {
    const exhibitText = await page.locator(SEL.exhibit(num)).innerText();
    expect(containsCJK(exhibitText)).toBe(true);
    expect(longestLatinWordRun(exhibitText)).toBeLessThanOrEqual(ceilings[num]);
  }
});

test.describe("Crossover Study mobile layout", () => {
  test("no horizontal overflow at 390 or 360, first screen and exhibit 03; the results table folds to label:value rows", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Overflow audit is meaningful only at narrow viewports.");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    await assertNoHorizontalOverflow(page, `${ROUTE} at 390 (first screen)`);
    await expect(page.locator(SEL.exhibit("01")).getByTestId("crossover-results-table").locator("thead")).toBeHidden();
    await page.locator(SEL.exhibit("03")).scrollIntoViewIfNeeded();
    await assertNoHorizontalOverflow(page, `${ROUTE} at 390 (exhibit 03)`);

    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    await assertNoHorizontalOverflow(page, `${ROUTE} at 360 (first screen)`);
    await page.locator(SEL.exhibit("03")).scrollIntoViewIfNeeded();
    await assertNoHorizontalOverflow(page, `${ROUTE} at 360 (exhibit 03)`);
  });
});
