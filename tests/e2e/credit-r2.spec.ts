import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { SEL } from "./selectors";
import { bodyTextExcludingLanguageSwitcher, containsCJK, longestLatinWordRun } from "./localePurity";
import { assertNoHorizontalOverflow } from "./mobileAudit";

const ROUTE = "/projects/credit-policy-desk";

// Task L4 [CLAUDE]: rebuild of /projects/credit-policy-desk to the
// user-approved chart-led Evidence page (spec §6.7 "Margin/Credit(归档)"),
// mirroring tests/e2e/margin-r2.spec.ts's structure exactly. This file
// replaces the credit-only coverage that used to live in
// tests/e2e/analytics-real-data.spec.ts, tests/e2e/portfolio.spec.ts,
// tests/e2e/quality.spec.ts, and tests/e2e/localized-error-paths.spec.ts
// against the pre-rebuild interactive workbench (source toggle, vintage
// picker, capacity slider, application search, swap-set panels) -- that UI
// no longer renders on this route, so those assertions were removed rather
// than left to fail; see task-L4-report.md for the full old-assertion ->
// new-assertion inventory. Margin Control Tower's tests are untouched.

function loadPolicyFrontierReport() {
  return JSON.parse(readFileSync(
    path.resolve(__dirname, "../../public/case-studies/credit-policy-desk/policy-frontier-report.json"),
    "utf8",
  )) as {
    approve_everyone_default_rate_preview: number;
    backtest_preview_row_count: number;
    active_policy_reference: string;
    reference_points: Record<string, { threshold: number; approval_rate: number; default_rate: number }>;
    points: Array<{ threshold: number; approval_rate: number; default_rate: number }>;
  };
}

function loadBacktestReport() {
  return JSON.parse(readFileSync(
    path.resolve(__dirname, "../../public/case-studies/credit-policy-desk/backtest-report.json"),
    "utf8",
  )) as {
    splits: { train: number; calibration: number; backtest: number };
    models: Record<string, { brier: number; log_loss: number; roc_auc: number }>;
    backtest_default_rate: number;
  };
}

function pct(value: number, digits = 1) {
  return `${(value * 100).toFixed(digits)}%`;
}

function noLeadingZero(value: number, digits: number) {
  return value.toFixed(digits).replace(/^(-?)0\./, "$1.");
}

function isDuckDBHeavyRuntimeRequest(url: string) {
  return /duckdb[^?]*(?:\.wasm|worker|extension)|parquet\.duckdb_extension/i.test(url);
}

test.describe("Credit Policy Desk exhibit 01 (policy frontier, real data)", () => {
  test("evidence metadata is an aligned slashless token list", async ({ page }) => {
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    const meta = page.locator(SEL.exhibit("01")).locator(".exhibit-opening-row .exhibit-meta");
    await expect(meta.locator("li")).toHaveText([
      "CREDIT-BACKTEST-PARQUET-V1",
      "CALIBRATED PD → POLICY",
      /EVALUATED \d{4}-\d{2}-\d{2}/,
    ]);
    expect(await meta.innerText()).not.toContain("/");
  });

  test("the stat band and frontier fallback table are read from the committed reports, not re-typed", async ({ page }) => {
    const frontier = loadPolicyFrontierReport();
    const backtest = loadBacktestReport();
    await page.goto(ROUTE, { waitUntil: "networkidle" });

    const exhibit01 = page.locator(SEL.exhibit("01"));
    const stats = exhibit01.locator(".exhibit-stat-value");
    await expect(stats).toHaveCount(6);
    const values = await stats.allTextContents();
    expect(values[0]).toBe(`${backtest.splits.train / 1000}k/${backtest.splits.calibration / 1000}k/${backtest.splits.backtest / 1000}k`);
    expect(values[1]).toBe(noLeadingZero(backtest.models.baseline_isotonic.brier, 4));
    expect(values[2]).toBe(noLeadingZero(backtest.models.baseline_isotonic.roc_auc, 4));
    expect(values[3]).toBe(noLeadingZero(backtest.models.challenger_isotonic.roc_auc, 4));
    expect(values[4]).toBe("120,000");
    expect(values[5]).toBe(backtest.backtest_default_rate.toFixed(3));

    const rows = exhibit01.locator("[data-frontier-row]");
    await expect(rows).toHaveCount(4);
    const active = frontier.reference_points[frontier.active_policy_reference];
    await expect(exhibit01.locator('[data-frontier-row="approve-everyone"]')).toContainText(pct(frontier.approve_everyone_default_rate_preview));
    await expect(exhibit01.locator('[data-frontier-row="pd15"]')).toContainText(pct(frontier.reference_points.pd_15.approval_rate));
    await expect(exhibit01.locator('[data-frontier-row="pd20"][data-active="true"]')).toContainText(pct(active.default_rate));
    await expect(exhibit01.locator('[data-frontier-row="pd30"]')).toContainText(pct(frontier.reference_points.pd_30.approval_rate));

    // "A score is not a policy." is the kept sitewide-quota hero assertion
    // (mock output/design-legacy/legacy-6-credit-policy-desk.html) -- exact
    // text, not a paraphrase.
    await expect(exhibit01.locator(".exhibit-title")).toContainText("A score is not");
    await expect(exhibit01.locator(".exhibit-title")).toContainText("a policy.");
    await expect(exhibit01).toContainText(`${frontier.backtest_preview_row_count} BACKTEST APPLICATIONS`);
  });
});

test.describe("Credit Policy Desk exhibit 02 (decision boundary)", () => {
  test("approve/review/decline bands and the three-threshold table read from the same committed data", async ({ page }) => {
    const frontier = loadPolicyFrontierReport();
    await page.goto(ROUTE, { waitUntil: "networkidle" });

    const exhibit02 = page.locator(SEL.exhibit("02"));
    await expect(exhibit02.locator('[data-band="approve"] code')).toHaveText(/approve_threshold/);
    await expect(exhibit02.locator('[data-band="review"] code')).toHaveText(/review_threshold/);
    await expect(exhibit02.locator('[data-band="decline"] code')).toHaveText(/review_threshold/);

    const activeRow = exhibit02.locator('tr[data-active="true"]');
    await expect(activeRow).toHaveCount(1);
    const active = frontier.reference_points[frontier.active_policy_reference];
    await expect(activeRow).toContainText(pct(active.approval_rate));
    await expect(activeRow).toContainText(pct(active.default_rate));
  });
});

test.describe("Credit Policy Desk exhibit 03 (model-comparison honesty)", () => {
  test("baseline vs challenger table and the negative/limitation findings read from backtest-report.json", async ({ page }) => {
    const backtest = loadBacktestReport();
    await page.goto(ROUTE, { waitUntil: "networkidle" });

    const compare = page.getByTestId("credit-model-compare");
    await expect(compare).toContainText(noLeadingZero(backtest.models.baseline_isotonic.brier, 6));
    await expect(compare).toContainText(noLeadingZero(backtest.models.challenger_isotonic.brier, 6));
    await expect(compare).toContainText(noLeadingZero(backtest.models.baseline_isotonic.roc_auc, 6));
    await expect(compare).toContainText(noLeadingZero(backtest.models.challenger_isotonic.roc_auc, 6));

    const findings = page.locator(SEL.exhibit("03")).locator(".exhibit-finding");
    await expect(findings).toHaveCount(2);
    await expect(findings.first()).toContainText("challenger");
    await expect(findings.last()).toContainText("45%");
  });
});

test.describe("Credit Policy Desk exhibit 04 (click-gated DuckDB receipts)", () => {
  test.describe.configure({ timeout: 90_000 });

  test("no DuckDB-WASM request fires before the verify button is clicked", async ({ page }) => {
    const heavyRuntimeRequests: string[] = [];
    let parquetRequests = 0;
    page.on("request", (request) => {
      if (isDuckDBHeavyRuntimeRequest(request.url())) heavyRuntimeRequests.push(request.url());
      if (new URL(request.url()).pathname === "/case-studies/credit-policy-desk/scored-backtest.parquet") parquetRequests += 1;
    });
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    expect(heavyRuntimeRequests).toEqual([]);
    expect(parquetRequests).toBe(0);

    await page.locator("[data-evidence=credit] > details > summary").click();
    const verify = page.locator(".credit-verify");
    await expect(verify).toHaveAttribute("data-verify-status", "idle");
    await verify.getByRole("button").click();
    await expect(verify).toHaveAttribute("data-verify-status", "verified", { timeout: 60_000 });
    expect(parquetRequests).toBe(1);
    await expect(verify).toContainText("120,000");
    await expect(verify.locator("code")).toHaveText(/^[a-f0-9]{64}$/);
  });
});

test("Credit Policy Desk renders with no JavaScript: exhibits 01-04 show real static content", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

  await expect(page.locator(SEL.exhibit("01")).locator("[data-frontier-row]")).toHaveCount(4);
  await expect(page.locator(SEL.exhibit("01")).locator(".exhibit-stat-value")).toHaveCount(6);
  await expect(page.locator(SEL.exhibit("02")).locator(".credit-band")).toHaveCount(3);
  await expect(page.locator(SEL.exhibit("02")).locator(".credit-threshold-table-inner tbody tr")).toHaveCount(3);
  await expect(page.locator(SEL.exhibit("03")).locator(".exhibit-finding")).toHaveCount(2);
  await expect(page.locator(SEL.exhibit("04")).locator(".credit-receipts-dl > div")).toHaveCount(5);
  // Native disclosure remains operable without JS; the verify action is still present.
  await page.locator("[data-evidence=credit] > details > summary").click();
  await expect(page.locator(".credit-verify-button")).toBeVisible();

  await context.close();
});

test("Credit Policy Desk rail entry-open opens on load and collapses on scroll (auto-rail v3)", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Auto-rail v3 is desktop/tablet only (>=980px).");
  await page.goto(ROUTE, { waitUntil: "networkidle" });
  await expect(page.locator(".exhibit-shell")).toHaveAttribute("data-rail-mode", "auto");
  await expect(page.locator(".exhibit-shell")).not.toHaveClass(/rail-collapsed/);
  await expect(page.locator(".exhibit-rail-stamp")).toHaveText("ARCHIVED");
  await expect(page.locator(".exhibit-rail-stamp")).toHaveAttribute("data-tone", "offline");

  await page.mouse.wheel(0, 40);
  await expect(page.locator(".exhibit-shell")).toHaveClass(/rail-collapsed/);
});

test("en Credit Policy Desk renders no Chinese (CJK) text anywhere on the page", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "en"));
  await page.goto(ROUTE, { waitUntil: "networkidle" });
  await expect(page.locator(SEL.cnGloss)).toHaveCount(0);
  const bodyText = await bodyTextExcludingLanguageSwitcher(page);
  expect(containsCJK(bodyText)).toBe(false);
});

test("zh Credit Policy Desk carries independently-written zh copy with no long English run", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "zh"));
  await page.goto(ROUTE, { waitUntil: "networkidle" });

  await expect(page.locator(SEL.exhibit("01")).locator(".exhibit-title")).toHaveText("分数不是策略。");
  await expect(page).toHaveTitle("Credit Policy Desk | 章向国");

  const gloss = page.locator(SEL.cnGloss).first();
  await expect(gloss).toHaveCount(1);
  expect(longestLatinWordRun(await gloss.innerText())).toBeLessThanOrEqual(8);

  // Exhibit 04 embeds the shared, unmodified <AnalyticsMethods project="credit">
  // (same component margin-control-tower uses, out of this task's scope to
  // edit -- see task-L4-report.md). Its real dataset-name card renders the
  // Lending Club archive's own official title immediately before its
  // license abbreviation with no intervening block boundary the innerText
  // whitespace-only tokenizer respects: "Lending Club loan dataset for
  // granting models" (7 plain words, already an allowlisted proper-noun
  // citation in scripts/check-localization.mjs) followed by "CC BY 4.0"
  // (2 more plain-letter tokens before the version number breaks the run)
  // -- a real 9-word run of two back-to-back citations, not an untranslated
  // sentence. Margin's own equivalent card (a 6-word Olist title + the same
  // "CC BY 4.0") lands at exactly 8, the general ceiling below; Credit's
  // real title is one word longer, so exhibit 04 alone gets a one-word-wider
  // ceiling with this comment as the record of why.
  const ceilings: Record<string, number> = { "01": 8, "02": 8, "03": 8, "04": 9 };
  for (const num of ["01", "02", "03", "04"]) {
    const exhibitText = await page.locator(SEL.exhibit(num)).innerText();
    expect(containsCJK(exhibitText)).toBe(true);
    expect(longestLatinWordRun(exhibitText)).toBeLessThanOrEqual(ceilings[num]);
  }
});

test.describe("Credit Policy Desk mobile layout", () => {
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
