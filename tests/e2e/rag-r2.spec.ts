import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { SEL } from "./selectors";
import { bodyTextExcludingLanguageSwitcher, containsCJK, longestLatinWordRun } from "./localePurity";
import { assertNoHorizontalOverflow } from "./mobileAudit";

const ROUTE = "/projects/rag-quality-lab";

// Task L3 [CLAUDE]: rebuild of /projects/rag-quality-lab to the user-approved
// diff/对照 design (output/design-genres/genre-rag-diff.html). This file
// replaces the RAG-specific coverage that used to live in
// tests/e2e/portfolio.spec.ts (the "RAG Manifest & Drift Lab" describe
// block, and the route-loop's "/ai/rag-quality-lab" -- the route's URL at
// the time, ROUTE above today -- and metadata-test
// legs) against the pre-rebuild RagManifestDriftLab.tsx workbench -- that
// UI no longer renders on this route (unrouted, not deleted; see
// docs/evidence/digits-rag.md). See task-L3-report.md for the full
// old-assertion -> new-assertion inventory.

function loadRagRegistry() {
  return JSON.parse(readFileSync(
    path.resolve(__dirname, "../../public/case-studies/rag-quality-lab/claim-registry.json"),
    "utf8",
  )) as {
    baseline_manifest: { documents: number; questions: number; tests_passed: number };
    evidence_checkpoint: { commit: string; verification_date: string };
    claims: Array<{ id: string; display: string; status: string; source: string; boundary: string }>;
    forbidden_current_claims: string[];
  };
}

function loadDependencyPreflight() {
  return JSON.parse(readFileSync(
    path.resolve(__dirname, "../../public/case-studies/rag-quality-lab/c3-timebox/dependency-preflight.json"),
    "utf8",
  )) as { python_modules: { missing: string[]; available: Record<string, string> } };
}

// Every entry in claim-registry.json's own forbidden_current_claims is a
// sentence describing a retired figure ("498,725 documents as the current
// C2 scope", "0.809 to 0.944 as a current answer-quality result"); the
// numeric tokens inside each sentence are the actual forbidden strings the
// binding data-honesty constraint cares about. Extracted from the registry
// itself rather than hand-typed, so this test stays correct if the
// registry's own retired-figures list ever changes. The negative lookbehind
// keeps this from matching the trailing digit of a claim id like "C2" or
// "C3" (real, verified/blocked-claim vocabulary rendered all over this
// page) as if it were itself a forbidden number.
function forbiddenNumericTokens(forbiddenClaims: string[]): string[] {
  return forbiddenClaims.flatMap((claim) => claim.match(/(?<![A-Za-z])\d[\d.,]*/g) ?? []);
}

test.describe("RAG Quality Lab exhibit 01 (the drift lab, real registry data)", () => {
  test("the verified stat line and eyebrow read from claim-registry.json, not re-typed", async ({ page }) => {
    const registry = loadRagRegistry();
    await page.goto(ROUTE, { waitUntil: "networkidle" });

    const exhibit01 = page.locator(SEL.exhibit("01"));
    const stats = exhibit01.locator(".exhibit-stat-value");
    await expect(stats).toHaveCount(3);
    const values = await stats.allTextContents();
    expect(values[0]).toBe(registry.baseline_manifest.documents.toLocaleString("en-US"));
    expect(values[1]).toBe(String(registry.baseline_manifest.questions));
    expect(values[2]).toBe(String(registry.baseline_manifest.tests_passed));

    await expect(exhibit01.locator(".exhibit-eyebrow")).toContainText(registry.evidence_checkpoint.commit);
    await expect(exhibit01.locator(".exhibit-eyebrow")).toContainText(registry.evidence_checkpoint.verification_date);
  });

  test("the two-pane diff renders a line-numbered baseline and working copy with a hunk header", async ({ page }) => {
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    const exhibit01 = page.locator(SEL.exhibit("01"));

    await expect(exhibit01.locator(".rag-hunk-at")).toBeVisible();
    const baselineRows = exhibit01.getByTestId("rag-pane-baseline").locator("tr[data-line-kind]");
    const workingRows = exhibit01.getByTestId("rag-pane-working").locator("tr[data-line-kind]");
    expect(await baselineRows.count()).toBeGreaterThan(0);
    expect(await workingRows.count()).toBeGreaterThan(0);
    // The default working copy is the mock's own illustrative edit, so at
    // least one deletion and one addition render on first paint (no click
    // required to see a real diff, not an empty aligned pair).
    await expect(exhibit01.getByTestId("rag-pane-baseline").locator('tr[data-line-kind="del"]')).toHaveCount(1);
    await expect(exhibit01.getByTestId("rag-pane-working").locator('tr[data-line-kind="add"]')).toHaveCount(1);

    await expect(exhibit01.getByTestId("rag-demo-deterministic")).toHaveText("demo · deterministic");
  });

  test("editing the working copy recomputes the verdict, and the same edit always recomputes the same verdict", async ({ page }) => {
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    const exhibit01 = page.locator(SEL.exhibit("01"));
    const editor = exhibit01.getByTestId("rag-working-copy-editor");
    const verdictWord = exhibit01.getByTestId("rag-verdict-word");

    const baselineText = "Access tokens are issued by the gateway and\nvalidated per request.\nSession tokens expire after 24 hours\nand are rotated on privilege change.\nIncident owners page the auth on-call before\nrotating the signing key.";
    const novelEdit = `${baselineText}\nA new sentence with an entirely new anchor word appended here.`;

    // Introduce a real, novel edit not covered by the mock's own default.
    await editor.fill(novelEdit);
    const firstVerdict = await verdictWord.getAttribute("data-verdict");
    const firstBadCount = await exhibit01.locator('[data-testid="rag-check-row"][data-check-status="bad"]').count();
    const firstGoodCount = await exhibit01.locator('[data-testid="rag-check-row"][data-check-status="good"]').count();
    expect(firstVerdict).toBeTruthy();

    // Reload and type the exact same edit again from a clean load.
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    const exhibit01Reloaded = page.locator(SEL.exhibit("01"));
    await exhibit01Reloaded.getByTestId("rag-working-copy-editor").fill(novelEdit);
    const secondVerdict = await exhibit01Reloaded.getByTestId("rag-verdict-word").getAttribute("data-verdict");
    const secondBadCount = await exhibit01Reloaded.locator('[data-testid="rag-check-row"][data-check-status="bad"]').count();
    const secondGoodCount = await exhibit01Reloaded.locator('[data-testid="rag-check-row"][data-check-status="good"]').count();

    expect(secondVerdict).toBe(firstVerdict);
    expect(secondBadCount).toBe(firstBadCount);
    expect(secondGoodCount).toBe(firstGoodCount);

    // Resetting to the exact baseline text (no edit at all) must be a TIE:
    // every one of the 12 checks compares equal text to itself.
    await exhibit01Reloaded.getByTestId("rag-working-copy-editor").fill(baselineText);
    await expect(exhibit01Reloaded.getByTestId("rag-verdict-word")).toHaveAttribute("data-verdict", "TIE");
    await expect(exhibit01Reloaded.locator('[data-testid="rag-check-row"][data-check-status="bad"]')).toHaveCount(0);
    await expect(exhibit01Reloaded.locator('[data-testid="rag-check-row"][data-check-status="good"]')).toHaveCount(0);
  });

  test("C3 is rendered honestly as results never produced", async ({ page }) => {
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    const honesty = page.getByTestId("rag-c3-honesty");
    await expect(honesty).toBeVisible();
    await expect(honesty).toContainText("RESULTS NEVER PRODUCED");
    await expect(honesty).toContainText("timebox expired");
  });
});

test.describe("RAG Quality Lab exhibit 02 (evidence claims registry)", () => {
  test("verified claims render from the registry and the C3 claim renders as blocked, quoting its real boundary", async ({ page }) => {
    const registry = loadRagRegistry();
    const preflight = loadDependencyPreflight();
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    const exhibit02 = page.locator(SEL.exhibit("02"));

    const verifiedClaims = registry.claims.filter((claim) => claim.status === "verified");
    const rows = exhibit02.getByTestId("rag-verified-claims").locator("tbody tr");
    await expect(rows).toHaveCount(verifiedClaims.length + 1); // + the one blocked row

    for (const claim of verifiedClaims) {
      const row = exhibit02.locator(`tr[data-claim-id="${claim.id}"]`);
      await expect(row).toContainText(claim.display);
      await expect(row).toContainText(claim.boundary);
    }

    const blocked = registry.claims.find((claim) => claim.status === "blocked_no_results");
    expect(blocked).toBeTruthy();
    const blockedRow = exhibit02.locator(`tr[data-claim-id="${blocked!.id}"]`);
    await expect(blockedRow).toContainText(blocked!.boundary);
    await expect(blockedRow.locator(".rag-claim-status-blocked")).toBeVisible();

    const preflightCard = exhibit02.getByTestId("rag-c3-preflight");
    for (const missingModule of preflight.python_modules.missing) {
      await expect(preflightCard).toContainText(missingModule);
    }
  });

  test("forbidden claim strings never render anywhere on the page", async ({ page }) => {
    const registry = loadRagRegistry();
    const forbiddenTokens = forbiddenNumericTokens(registry.forbidden_current_claims);
    expect(forbiddenTokens.length).toBeGreaterThan(0);

    await page.goto(ROUTE, { waitUntil: "networkidle" });
    const bodyText = await page.locator(SEL.body).innerText();
    for (const token of forbiddenTokens) expect(bodyText).not.toContain(token);
    // Also assert directly against the two specific numbers named in the
    // binding data-honesty constraint, independent of the registry's own
    // wording.
    expect(bodyText).not.toContain("498,725");
    expect(bodyText).not.toContain("0.944");
    expect(bodyText).not.toContain("0.809");
  });
});

test("RAG Quality Lab renders with no JavaScript: the diff, stats, and C3 honesty are real static content", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

  const exhibit01 = page.locator(SEL.exhibit("01"));
  await expect(exhibit01.locator(".exhibit-stat-value")).toHaveCount(3);
  await expect(exhibit01.getByTestId("rag-pane-baseline").locator("tr[data-line-kind]")).not.toHaveCount(0);
  await expect(exhibit01.getByTestId("rag-verdict-word")).toBeVisible();
  await expect(exhibit01.getByTestId("rag-c3-honesty")).toBeVisible();
  // The editor is present but inert without JS -- must not vanish.
  await expect(exhibit01.getByTestId("rag-working-copy-editor")).toBeVisible();
  await expect(page.locator(SEL.exhibit("02")).getByTestId("rag-verified-claims")).toBeVisible();
  await page.locator("[data-evidence=rag] > details > summary").click();
  await expect(page.locator(SEL.exhibit("03")).getByTestId("rag-receipts-list")).toBeVisible();

  await context.close();
});

test("RAG Quality Lab rail entry-open opens on load and collapses on scroll (auto-rail v3)", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Auto-rail v3 is desktop/tablet only (>=980px).");
  await page.goto(ROUTE, { waitUntil: "networkidle" });
  await expect(page.locator(".exhibit-shell")).toHaveAttribute("data-rail-mode", "auto");
  await expect(page.locator(".exhibit-shell")).not.toHaveClass(/rail-collapsed/);

  await page.mouse.wheel(0, 40);
  await expect(page.locator(".exhibit-shell")).toHaveClass(/rail-collapsed/);
});

test("en RAG Quality Lab renders no Chinese (CJK) text anywhere on the page", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "en"));
  await page.goto(ROUTE, { waitUntil: "networkidle" });
  await expect(page.locator(SEL.cnGloss)).toHaveCount(0);
  const bodyText = await bodyTextExcludingLanguageSwitcher(page);
  expect(containsCJK(bodyText)).toBe(false);
});

test("zh RAG Quality Lab carries independently-written zh copy with no long English run", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "zh"));
  await page.goto(ROUTE, { waitUntil: "networkidle" });

  const gloss = page.locator(SEL.cnGloss).first();
  await expect(gloss).toHaveCount(1);
  expect(longestLatinWordRun(await gloss.innerText())).toBeLessThanOrEqual(8);

  for (const num of ["01", "02", "03"]) {
    const exhibitText = await page.locator(SEL.exhibit(num)).innerText();
    expect(containsCJK(exhibitText)).toBe(true);
    expect(longestLatinWordRun(exhibitText)).toBeLessThanOrEqual(8);
  }
});

test.describe("RAG Quality Lab mobile layout", () => {
  test("no horizontal overflow at 390 or 360, first screen and exhibits 02/03", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Overflow audit is meaningful only at narrow viewports.");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    await assertNoHorizontalOverflow(page, `${ROUTE} at 390 (first screen)`);
    await page.locator(SEL.exhibit("02")).scrollIntoViewIfNeeded();
    await assertNoHorizontalOverflow(page, `${ROUTE} at 390 (exhibit 02)`);
    await page.locator(SEL.exhibit("03")).scrollIntoViewIfNeeded();
    await assertNoHorizontalOverflow(page, `${ROUTE} at 390 (exhibit 03)`);

    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    await assertNoHorizontalOverflow(page, `${ROUTE} at 360 (first screen)`);
    await page.locator(SEL.exhibit("02")).scrollIntoViewIfNeeded();
    await assertNoHorizontalOverflow(page, `${ROUTE} at 360 (exhibit 02)`);
  });
});
