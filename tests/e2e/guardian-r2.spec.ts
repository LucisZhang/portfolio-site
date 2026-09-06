import { expect, test } from "@playwright/test";
import { SEL } from "./selectors";
import { bodyTextExcludingLanguageSwitcher, containsCJK, longestLatinWordRun } from "./localePurity";
import { assertNoHorizontalOverflow } from "./mobileAudit";
import {
  affectedCount,
  allNodes,
  approveBranch,
  approveOutcome,
  blockBranch,
  blockOutcome,
  instrument,
  refNode,
  risk,
  rollout,
  scenarioIdUpper,
  totals,
} from "../../src/components/guardian/guardianData";
import { readGuardianEvaluationLedgers } from "../../src/components/guardian/guardianEval.server";

const ROUTE = "/ai/release-guardian";

// Task L1: Release Guardian rebuilt to the user-approved 呈批件 (approval
// dossier) design (output/design-genres/genre-rg-dossier.html). This file
// replaces the old tests/e2e/portfolio.spec.ts "Release Guardian Sanitized
// Change Review Replay" / "Release Guardian Group C acceptance" describe
// blocks (see portfolio.spec.ts's own comment at the removal site for the
// full replaced-assertion inventory) with equivalent-or-stronger coverage
// against the new dossier: every assertion below imports its expected
// value from guardianData.ts (the same module the page itself renders
// from) rather than a re-typed literal, so a change to the recorded fixture
// and a drift in the page's own derivation would both surface here.

test.describe("Release Guardian dossier (exhibit 01)", () => {
  test("renders memo rows computed from the real recorded-stub-runs.json trace", async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "en"));
    const response = await page.goto(ROUTE, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);

    const exhibit = page.locator(SEL.exhibit("01"));
    await expect(exhibit).toContainText(scenarioIdUpper.toLowerCase());
    await expect(exhibit).toContainText(totals.verdict);
    await expect(exhibit).toContainText(`${allNodes.length}`);
    await expect(exhibit).toContainText(`${totals.ms}`);
    await expect(exhibit).toContainText(totals.tokens.toLocaleString());

    await expect(exhibit).toContainText(scenarioIdUpper);
    await expect(exhibit).toContainText(refNode);
    await expect(exhibit).toContainText(instrument.subject);
    await expect(exhibit.locator(".guardian-cb code")).toContainText(instrument.sql);

    await expect(exhibit).toContainText(String(risk.score));
    await expect(exhibit).toContainText(String(affectedCount));
    await expect(exhibit).toContainText(String(rollout.stages));
  });

  // Fix round 1 (review finding, Important): both counts below used to be
  // typed literally ("13 NODES", "does not erase 30 strict failures") even
  // though the exact same values were already computed/bound elsewhere on
  // the page. Asserting the rendered text equals the JSON/CSV-derived
  // value (not a copy-pasted "13"/"30") means a future change to the
  // recorded fixture's node count or the live ledger's strict-flagged
  // count would fail this test if the copy didn't follow it.
  test("exhibit 02 eyebrow and exhibit 04 headline bind their counts to the JSON/CSV, not a literal", async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "en"));
    await page.goto(ROUTE, { waitUntil: "networkidle" });

    const exhibit02Eyebrow = page.locator(SEL.exhibit("02")).locator(".exhibit-eyebrow");
    await expect(exhibit02Eyebrow).toContainText(`${allNodes.length} NODES`);

    const { live } = readGuardianEvaluationLedgers();
    const strictFlagged = live[0].strictFlaggedScenarios;
    const exhibit04Headline = page.locator(SEL.exhibit("04")).locator(".exhibit-title");
    await expect(exhibit04Headline).toContainText(`${strictFlagged} strict failures`);
  });

  test("#gate is addressable and scrolls the disposition into view", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "One viewport is enough for the anchor-scroll contract.");
    await page.goto(`${ROUTE}#gate`, { waitUntil: "networkidle" });
    const gate = page.locator("#gate");
    await expect(gate).toBeVisible();
    const box = await gate.boundingBox();
    expect(box).not.toBeNull();
    // scroll-margin-top keeps it clear of any sticky chrome, but it must
    // still land in (or very near) the first viewport, not require a
    // second manual scroll after landing on the hash URL.
    expect(box!.y).toBeGreaterThanOrEqual(-4);
    expect(box!.y).toBeLessThan((page.viewportSize()?.height ?? 900) + 200);
  });

  test("choosing BLOCK reveals the block branch trace and ghosts the approve footnote", async ({ page }) => {
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    const sign = page.locator(".guardian-sign");
    await expect(sign).toHaveAttribute("data-enhanced", "true");

    const approveBlock = sign.locator('.guardian-fnote-block[data-branch="approve"]');
    const blockBlock = sign.locator('.guardian-fnote-block[data-branch="block"]');

    await page.locator('[data-guardian-decide="block"]').click();
    await expect(blockBlock).toHaveAttribute("data-chosen", "true");
    await expect(approveBlock).toHaveAttribute("data-ghost", "true");
    const blockTrace = blockBlock.locator(".guardian-branch-trace");
    for (const node of blockBranch) {
      await expect(blockTrace).toContainText(node.id.toUpperCase());
    }
    await expect(blockTrace).toHaveCSS("max-height", /^(?!0px$).+/);

    // ...and the reverse choice flips which side is lit vs. ghosted.
    await page.locator('[data-guardian-decide="approve"]').click();
    await expect(approveBlock).toHaveAttribute("data-chosen", "true");
    await expect(blockBlock).toHaveAttribute("data-ghost", "true");
    const approveTrace = approveBlock.locator(".guardian-branch-trace");
    for (const node of approveBranch) {
      await expect(approveTrace).toContainText(node.id.toUpperCase());
    }
  });
});

test("Release Guardian renders with no JavaScript: both recorded branches are fully static", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

  const exhibit = page.locator(SEL.exhibit("01"));
  await expect(exhibit).toBeVisible();

  // Without JS, `enhanced` never flips true, so the disposition renders in
  // its expanded default -- both branches' node-by-node trace present and
  // un-collapsed, exactly the no-JS contract this task requires.
  const approveTrace = page.locator('[data-testid="guardian-branch-trace-approve"]');
  const blockTrace = page.locator('[data-testid="guardian-branch-trace-block"]');
  for (const node of approveBranch) await expect(approveTrace).toContainText(node.id.toUpperCase());
  for (const node of blockBranch) await expect(blockTrace).toContainText(node.id.toUpperCase());
  await expect(approveTrace).toContainText(approveOutcome.disposition);
  await expect(blockTrace).toContainText(blockOutcome.disposition);

  // The buttons render (inert without JS) rather than disappearing.
  await expect(page.locator('[data-guardian-decide="approve"]')).toBeVisible();
  await expect(page.locator('[data-guardian-decide="block"]')).toBeVisible();

  // Exhibit 02's full 13-node trace is also server-rendered static markup.
  await expect(page.locator(SEL.exhibit("02")).locator(".guardian-node-table [role=\"row\"]")).toHaveCount(allNodes.length + 1);
  await expect(page.locator(SEL.exhibit("04")).getByRole("table", { name: "Release gate metrics" })).toBeVisible();

  await context.close();
});

// Generic auto-rail mechanic behavior (entry-open, retract-on-scroll,
// hot-zone reveal, Esc, reduced motion, no-JS) is covered once against the
// content-independent dev fixture in exhibition-shell.spec.ts; this is the
// page-specific wiring check, matching triage-r2.spec.ts's "auto-rail v3"
// precedent.
test.describe("Release Guardian auto-rail v3", () => {
  test("rail is auto-mode and entry-open on load", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Auto-rail v3 is desktop/tablet only (>=980px).");
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    await expect(page.locator(".exhibit-shell")).toHaveAttribute("data-rail-mode", "auto");
    await expect(page.locator(".exhibit-shell")).not.toHaveClass(/rail-collapsed/);
  });
});

test("en Release Guardian renders no Chinese (CJK) text anywhere on the page", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "en"));
  await page.goto(ROUTE, { waitUntil: "networkidle" });
  await expect(page.locator(".exhibit-rail-copy-zh")).toHaveCount(0);
  await expect(page.locator(".exhibit-rail-copy-en")).toHaveCount(1);
  await expect(page.locator(SEL.exhibit("04")).getByRole("table", { name: "Release gate metrics" })).toBeVisible();
  const bodyText = await bodyTextExcludingLanguageSwitcher(page);
  expect(containsCJK(bodyText)).toBe(false);
});

test("zh Release Guardian renders an independently-written zh headline with no long English run", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "zh"));
  await page.goto(ROUTE, { waitUntil: "networkidle" });

  const headline = page.locator(".guardian-h1");
  await expect(headline).toBeVisible();
  expect(containsCJK(await headline.innerText())).toBe(true);
  expect(longestLatinWordRun(await headline.innerText())).toBeLessThanOrEqual(8);

  const intro = page.locator(SEL.exhibit("04")).locator(".exhibit-intro");
  expect(containsCJK(await intro.innerText())).toBe(true);
  expect(longestLatinWordRun(await intro.innerText())).toBeLessThanOrEqual(8);
  await expect(page.locator(SEL.exhibit("04")).getByRole("table", { name: "发布门禁指标" })).toBeVisible();

  await expect(page.locator(".exhibit-rail-copy-en")).toHaveCount(0);
});

test.describe("F1 mobile pass — Release Guardian", () => {
  test("no horizontal overflow at 390, and the two-column memo folds to one column", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Viewport-width-specific overflow/fold scan.");
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    await assertNoHorizontalOverflow(page, `${ROUTE} at 390 (first screen)`);

    const columns = await page.locator(".guardian-doc").evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
    expect(columns).toBe(1);

    await page.mouse.wheel(0, 3000);
    await assertNoHorizontalOverflow(page, `${ROUTE} at 390 (mid-page)`);
  });

  test("desktop keeps the two-column filing-stub + memo layout", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Desktop-only regression guard for the mobile fold.");
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    const columns = await page.locator(".guardian-doc").evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
    expect(columns).toBe(2);
  });
});
