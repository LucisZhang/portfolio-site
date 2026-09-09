import { expect, test, type Page } from "@playwright/test";
import { SEL } from "./selectors";

const rawRuntimeEnglish = [
  "Failed to fetch",
  "NetworkError",
  "Claim registry returned",
  "Synthetic scenarios returned",
  "Result evidence returned",
  "Manifest returned",
  "Credit dataset returned",
  "Margin dataset returned",
];

async function expectNoRawRuntimeEnglish(page: Page) {
  const body = await page.locator(SEL.body).innerText();
  for (const marker of rawRuntimeEnglish) expect(body).not.toContain(marker);
}

test.describe("Chinese runtime failures use bounded display copy", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "A single Chrome viewport covers copy selection.");
    await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "zh"));
  });

  // Task L2 (Margin Control Tower chart-led Evidence rebuild): the "Margin
  // report failure stays localized and keeps the governed fallback" test
  // that used to live here targeted the pre-rebuild
  // src/components/analytics/MarginControlTower.tsx's runtime fetch of
  // detection-report.json (its `data-active-source="synthetic"` fallback
  // state and a "检测报告待提交" status message). Root-caused live
  // (63-failure full-suite run, HEAD cb11fdc): src/components/margin/
  // marginData.ts statically imports detection-report.json as a bundler
  // import resolved at build time -- `import detectionReportJson from
  // "../../../public/case-studies/margin-control-tower/detection-
  // report.json"` -- so the routed page (MarginPage.tsx) has no
  // client-side network request for this file left to intercept or fail;
  // the `page.route(...).fulfill({ status: 503 })` above never fires
  // against anything the page actually requests, and neither
  // `data-active-source` nor a "检测报告待提交" status exists on the page
  // at all (same "no equivalent runtime fetch" pattern as the four cases
  // immediately below -- Credit, RAG, Guardian, Duty Logbook -- just
  // missed when task L2 landed instead of being retired alongside them).
  // This is an architectural improvement, not a loss of coverage: the
  // detection figure's real content (recall/precision/weeks/threshold
  // values, the 6 vermilion detections) is committed, versioned evidence
  // present unconditionally at build time, so there is no failure mode
  // left on this route for a 503 to induce.

  // Task L4 (Credit Policy Desk chart-led Evidence rebuild): the "Credit
  // full-data network failure keeps the real preview and never renders the
  // browser Error message" test that used to live here targeted the
  // pre-rebuild CreditPolicyLab.tsx's runtime fetch of scored-backtest.parquet
  // and synthetic-credit-data.json (data-real-materialization-status states,
  // the "载入完整已验证数据集" button). src/components/credit/CreditPage.tsx
  // has no equivalent runtime fetch of either file at page-load time:
  // backtest-report.json and policy-frontier-report.json are static bundler
  // imports (creditData.ts) resolved at build time, and scored-backtest.parquet
  // is only ever requested after an explicit click on exhibit 04's DuckDB
  // verify button (CreditVerify.tsx) -- there is no client-side network
  // request on page load left to fail, so this test has nothing left to
  // exercise (same reasoning as the Release Guardian and Duty Logbook cases
  // above).

  // Task L3 (RAG Quality Lab diff/对照 rebuild): the "RAG registry fetch
  // failure uses the Chinese registry message" test that used to live here
  // targeted the pre-rebuild RagManifestDriftLab.tsx's runtime fetch of
  // claim-registry.json (its .rag-lab-loading.error state). ragData.ts now
  // statically imports and validates claim-registry.json (and
  // dependency-preflight.json) at build time, the same margin-control-
  // tower / release-guardian precedent immediately below -- there is no
  // client-side network request on this route left to fail, so this test
  // has nothing left to exercise (same reasoning as the Release Guardian,
  // Credit Policy Desk, and Duty Logbook cases here).

  // Task L1 (Release Guardian approval-dossier rebuild): the retired
  // ReleaseChangeReplay.tsx fetched synthetic-scenarios.json client-side
  // and had a bounded fetch-failure message to test. GuardianPage.tsx has
  // no equivalent runtime fetch: recorded-stub-runs.json is a static
  // bundler import (guardianData.ts) resolved at build time, and the two
  // eval CSVs are read server-side in src/app/projects/release-guardian/page.tsx
  // before any HTML reaches the browser — there is no client-side network
  // request on this route left to fail, so this test has nothing left to
  // exercise (same reasoning as the Duty Logbook case directly below).

  // Task F9 (Duty Logbook rebuild): EodInstrument.tsx's click-to-fetch
  // DrillBoard (and its bounded "录制证据不可用" error banner) is retired —
  // every log entry's dateline, narrative sentence, and transcript are
  // already real and complete from the server-rendered generated summary
  // (src/data/generated/eod-log-summary.json) before any fetch happens; a
  // failed enrichment fetch on open has nothing to visibly break. This is
  // an architectural improvement, not a loss of coverage: it asserts the
  // graceful-degradation property directly — a 503 on the drill's raw file
  // leaves the entry's real static content intact, with no raw runtime
  // English error surfacing anywhere on the page.
  test("Exactly-Once Drills log entry keeps its real static content when the enrichment fetch fails", async ({ page }) => {
    await page.route("**/case-studies/exactly-once-drills/results/eo_reconciliation.json", (route) => route.fulfill({ status: 503 }));
    await page.goto("/projects/exactly-once-drills?lang=zh", { waitUntil: "networkidle" });

    const entry = page.locator(SEL.exhibit("01")).locator('[data-log-entry][data-drill-id="eo-reconciliation"]');
    await entry.locator("summary").click();
    await expect(entry).toHaveAttribute("open", "");
    await expect(entry.locator("[data-log-line]").first()).not.toBeEmpty();
    await expect(entry.locator("[data-log-sentence]")).toContainText("Flink");
    await expectNoRawRuntimeEnglish(page);
  });
});
