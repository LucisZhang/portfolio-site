import { expect, test } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts } from "pdf-lib";

const routes = [
  "/",
  "/engineering",
  "/engineering/p1-reliability-lab",
  "/ai",
  "/ai/release-guardian",
  "/ai/rag-quality-lab",
  "/ai/privacy-preflight-mac",
  "/analytics",
  "/analytics/margin-control-tower",
  "/analytics/credit-policy-lab",
  "/analytics/analytics-tandem",
];

const forbiddenClaims = [
  "498,725",
  "0.809",
  "0.944",
  "Private GitHub",
  "Heavy stack re-run on a 16 GB laptop remains",
  "Sample interface data only",
  "Telemetry sample",
];

for (const locale of ["en", "zh"] as const) {
  for (const route of routes) {
    test(`${locale} ${route} renders without overflow or broken evidence`, async ({ page }, testInfo) => {
      const browserErrors: string[] = [];
      page.on("pageerror", (error) => browserErrors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") browserErrors.push(message.text());
      });

      await page.addInitScript((selectedLocale) => {
        window.localStorage.setItem("portfolio-locale", selectedLocale);
      }, locale);
      const response = await page.goto(route, { waitUntil: "networkidle" });

      expect(response?.status()).toBe(200);
      await expect(page.locator("main")).toBeVisible();
      const bodyText = await page.locator("body").innerText();
      for (const claim of forbiddenClaims) expect(bodyText).not.toContain(claim);
      if (locale === "zh") expect(bodyText).toMatch(/[\u3400-\u9fff]/);
      if (route === "/") {
        await expect(page.locator("h1")).toHaveText(locale === "en" ? "Hsiang Kuo Chang" : "章向国");
        await expect(page.locator('a[href="https://github.com/LucisZhang"]')).toBeVisible();
        await expect(page.locator('a[href="https://www.linkedin.com/in/xiangguo-zhang"]')).toBeVisible();
        await expect(page.locator('a[href="mailto:HsiangKuoChang@outlook.com"]')).toBeVisible();
        await expect(page.locator(".identity-link-pending")).toContainText("Resume");
      }
      if (route.split("/").length === 3) {
        expect(bodyText).toContain(locale === "en" ? "Audience" : "面向对象");
      }
      if (route === "/engineering/p1-reliability-lab") {
        await expect(page.locator(".artifact-table > a")).toHaveCount(5);
        await expect(page.locator('a[href^="/artifact?"][href*="workstation-reproduction-guide.md"]')).toBeVisible();
      }
      if (route === "/ai/release-guardian") {
        await expect(page.locator(".finding-table > div:not(.finding-head)")).toHaveCount(5);
      }
      if (route === "/ai/privacy-preflight-mac") {
        await expect(page.locator(".redline-grid > span")).toHaveCount(3);
      }

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);

      for (const image of await page.locator("img").all()) {
        await expect(image).toBeVisible();
        expect(await image.evaluate((node) => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
      }
      expect(browserErrors).toEqual([]);

      const slug = route === "/" ? "home" : route.slice(1).replaceAll("/", "-");
      await page.screenshot({
        path: testInfo.outputPath("visual", `${locale}-${slug}.png`),
        fullPage: true,
      });
    });
  }
}

test.describe("p1 Failure Replay Console", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "en"));
    await page.goto("/engineering/p1-reliability-lab", { waitUntil: "networkidle" });
    await expect(page.getByTestId("p1-failure-replay")).toBeVisible();
  });

  test("replays five recorded scenarios with bounded provenance and deterministic controls", async ({ page }) => {
    const replay = page.getByTestId("p1-failure-replay");
    await expect(replay).toContainText("Captured Run");
    await expect(replay).toContainText("Recorded evidence, not a live cluster.");
    await expect(replay.getByRole("tab")).toHaveCount(5);
    await expect(replay).toContainText("20260711T034018Z-local-mac");
    await expect(replay).toContainText("20260711T035242Z-b518d211");
    await expect(replay).toContainText("Apple Silicon macOS, 16 GiB RAM");
    await expect(replay.locator(".p1-stage-count")).toContainText("01 / 08");
    await expect(page.getByTestId("p1-evidence-excerpt")).toContainText("source_snapshot_row_count");

    await replay.getByRole("button", { name: "Next stage" }).click();
    await expect(replay.locator(".p1-stage-count")).toContainText("02 / 08");
    await expect(page.getByTestId("p1-evidence-excerpt")).toContainText("recorded_rows");

    await replay.getByRole("tab", { name: /Checkpoint restore/ }).click();
    await expect(replay.locator(".p1-stage-count")).toContainText("01 / 08");
    await replay.getByRole("slider", { name: "Replay timeline" }).fill("4");
    await expect(replay.locator(".p1-stage-count")).toContainText("05 / 08");
    await expect(replay.locator(".p1-stage-panel")).toContainText("restore from externalized checkpoint");

    await replay.getByRole("button", { name: "Reset replay" }).click();
    await replay.getByRole("button", { name: "Play replay" }).click();
    await expect(replay.locator(".p1-stage-count")).toContainText("02 / 08", { timeout: 3_000 });
    await replay.getByRole("button", { name: "Pause replay" }).click();
    await expect(replay.getByRole("link", { name: "View recorded JSON" })).toHaveAttribute("href", /eo_reconciliation-all\.json/);
  });

  test("graph supports zoom, pan, fit, fullscreen, node detail, original, and download", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "The full graph is intentionally replaced by a step list on mobile.");
    const replay = page.getByTestId("p1-failure-replay");
    const graph = replay.locator(".p1-flow-panel");
    await expect(graph).toBeVisible();
    await expect(graph.getByLabel("Graph zoom and fit controls")).toBeVisible();
    const viewport = graph.locator(".react-flow__viewport");
    const before = await viewport.getAttribute("style");
    await graph.getByRole("button", { name: "Zoom in" }).click();
    await expect.poll(() => viewport.getAttribute("style")).not.toBe(before);
    await graph.getByRole("button", { name: "Reset view" }).click();
    const fitted = await viewport.getAttribute("style");
    const canvas = graph.locator(".p1-flow-canvas");
    const bounds = await canvas.boundingBox();
    expect(bounds).not.toBeNull();
    if (bounds) {
      await page.mouse.move(bounds.x + bounds.width * .55, bounds.y + bounds.height * .55);
      await page.mouse.down();
      await page.mouse.move(bounds.x + bounds.width * .42, bounds.y + bounds.height * .45, { steps: 5 });
      await page.mouse.up();
      await expect.poll(() => viewport.getAttribute("style")).not.toBe(fitted);
    }
    await graph.locator('.react-flow__node[data-id="iceberg"]').click();
    await expect(graph.locator(".p1-node-detail")).toContainText("Iceberg snapshot");
    await expect(graph.locator(".p1-graph-legend")).toContainText("Status is written inside every node");
    await expect(graph.getByRole("link", { name: "Open original JSON" })).toHaveAttribute("href", /eo_reconciliation-all\.json/);
    await expect(graph.getByRole("link", { name: "Download" })).toHaveAttribute("download", "eo_reconciliation-all.json");
    await graph.getByRole("button", { name: "Fullscreen" }).click();
    await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true);
    await page.keyboard.press("Escape");
  });
});

test.describe("Release Guardian Sanitized Change Review Replay", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "en"));
    await page.goto("/ai/release-guardian", { waitUntil: "networkidle" });
    await expect(page.getByTestId("release-change-replay")).toBeVisible();
  });

  test("replays deterministic retrieval, risk, planning, approval, and audit boundaries", async ({ page }) => {
    const replay = page.getByTestId("release-change-replay");
    await expect(replay).toContainText("Synthetic scenario / deterministic replay");
    await expect(replay).toContainText("Sanitized deterministic replay — not connected to the private repository or a live model.");
    await expect(replay.getByRole("tab")).toHaveCount(4);
    await expect(replay.locator(".release-stage-heading")).toContainText("01 / 09");

    await replay.getByRole("button", { name: "Next stage" }).click();
    await expect(replay.locator(".release-retriever-result")).toContainText("code evidence");
    await expect(replay.locator(".release-evidence-detail-grid > div")).toHaveCount(6);
    await expect(replay.locator(".release-evidence-detail-grid")).toContainText("Changed component");
    await expect(replay.locator(".release-evidence-detail-grid .withheld")).toContainText("Withheld by publication boundary");
    await expect(replay.locator(".release-evidence-progress .reached")).toHaveCount(1);

    await replay.getByRole("tab", { name: /database schema change/i }).click();
    await replay.getByRole("slider", { name: "Replay stage" }).fill("5");
    await expect(replay.locator(".release-risk-score")).toContainText("critical");
    await expect(replay.locator(".release-risk-score")).toContainText("90 / 100");
    await expect(replay.locator(".release-blocker-list")).toContainText("Destructive schema rollback is untested");

    await replay.getByRole("slider", { name: "Replay stage" }).fill("6");
    await expect(replay.locator(".release-plan-grid section")).toHaveCount(4);
    await expect(replay.locator(".release-plan-grid")).toContainText("Rollout");
    await expect(replay.locator(".release-plan-grid")).toContainText("Rollback");

    await replay.getByRole("slider", { name: "Replay stage" }).fill("7");
    await expect(replay.locator(".release-approval-gate")).toBeVisible();
    await replay.getByRole("button", { name: "Approve" }).click();
    await expect(replay.locator(".release-audit-grid article")).toHaveCount(1);
    await expect(replay.locator(".release-audit-grid")).toContainText("SYN-SCHEMA-02-APPROVE");
    await replay.getByRole("button", { name: "Previous stage" }).click();
    await expect(replay.locator(".release-approval-gate")).toBeVisible();
    await replay.getByRole("button", { name: "Reject" }).click();
    await expect(replay.locator(".release-audit-grid article")).toHaveCount(2);
    await expect(replay.locator(".release-audit-grid")).toContainText("SYN-SCHEMA-02-REJECT");
    await expect(replay.getByRole("link", { name: "Explore scenario data" })).toHaveAttribute("href", /synthetic-scenarios\.json/);

    await expect(replay.locator(".release-verified-rail-list article")).toHaveCount(6);
    await expect(replay.locator(".release-verified-rail-list")).toContainText("44 scenarios × 3 trials = 132 graph runs");
    await expect(replay.locator(".release-verified-rail-list")).toContainText("30 / 44 outcome_pass:false");
    await expect(replay.locator(".release-verified-rail-list")).toContainText("15 / 44 flagged");

    const evidencePair = page.locator(".release-eval-pair article");
    await expect(evidencePair).toHaveCount(2);
    await expect(evidencePair.nth(0)).toContainText("132");
    await expect(evidencePair.nth(1)).toContainText("30 / 44");
    await expect(page.locator(".release-mode-ledger")).toContainText("15 of 44 flagged");
    await expect(page.locator(".release-what-changed")).toContainText("I separated live evaluation, deterministic stub results, and the synthetic replay");
  });
});

test.describe("RAG Manifest & Drift Lab", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "en"));
    await page.goto("/ai/rag-quality-lab", { waitUntil: "networkidle" });
    await expect(page.getByTestId("rag-drift-lab")).toBeVisible();
  });

  test("detects corpus, metric, fallback, and public-sync claim drift", async ({ page }) => {
    const lab = page.getByTestId("rag-drift-lab");
    await expect(lab).toContainText("Deterministic verifier");
    await expect(lab).toContainText("C2 sync pending");
    await expect(lab).toContainText("0fc1433");
    await expect(lab).toContainText("6c887a1");
    await expect(lab.locator(".rag-verdict")).toContainText("No claim drift");
    await expect(lab.locator(".rag-claim-registry article")).toHaveCount(4);

    await lab.getByRole("button", { name: "Corpus drift" }).click();
    await expect(lab.locator(".rag-verdict")).toContainText("1 drift item");
    await expect(lab.getByTestId("rag-diff-list")).toContainText("documents");

    await lab.getByRole("button", { name: "Metric leak" }).click();
    await expect(lab.locator(".rag-verdict")).toContainText("3 drift items");
    await expect(lab.getByTestId("rag-diff-list")).toContainText("answer_quality_metrics");
    await expect(lab.getByTestId("rag-diff-list")).toContainText("fallback_metrics_substituted");

    await lab.getByRole("button", { name: "Sync overclaim" }).click();
    await expect(lab.locator(".rag-verdict")).toContainText("1 drift item");
    await expect(lab.getByTestId("rag-diff-list")).toContainText("public_c2_code_synced");

    await lab.getByRole("textbox", { name: "Candidate manifest JSON" }).fill("{not-json");
    await lab.getByRole("button", { name: "Verify", exact: true }).click();
    await expect(lab.locator(".rag-verdict")).toContainText("Invalid candidate");
    await expect(lab.locator(".rag-parse-error")).toBeVisible();
    await expect(lab.getByRole("link", { name: "View JSON" })).toHaveAttribute("href", /claim-registry\.json/);

    const documentLab = page.getByTestId("rag-document-lab");
    await expect(documentLab.locator(".rag-document-verdict")).toContainText("Pass — no drift");
    await expect(documentLab.getByTestId("rag-normalized-document")).toContainText("Fictional support policy");
    await documentLab.getByRole("button", { name: "Edit one character" }).click();
    await expect(documentLab.locator(".rag-document-verdict")).toContainText("Hash drift");
    await documentLab.getByRole("button", { name: "Change document ID" }).click();
    await expect(documentLab.locator(".rag-document-verdict")).toContainText("Document ID drift");
    await documentLab.getByRole("button", { name: "Delete title field" }).click();
    await expect(documentLab.locator(".rag-document-verdict")).toContainText("missing title");
    await documentLab.getByRole("button", { name: "Change backend contract" }).click();
    await expect(documentLab.locator(".rag-document-verdict")).toContainText("Backend contract drift");
    await documentLab.getByRole("button", { name: "Reset" }).click();
    await expect(documentLab.locator(".rag-document-verdict")).toContainText("Pass — no drift");
  });
});

test.describe("Analytics decision vertical slices", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "en"));
  });

  test("Margin Control Tower verifies contracts, diagnoses the injected anomaly, and recomputes a scenario", async ({ page }) => {
    await page.goto("/analytics/margin-control-tower", { waitUntil: "networkidle" });
    const lab = page.getByTestId("margin-control-tower");
    await expect(lab).toBeVisible();
    await expect(lab).toContainText("10 / 10 contracts pass");
    await expect(lab).toContainText("fixed-seed injected anomaly");
    await expect(lab.locator(".margin-week-bars button")).toHaveCount(52);
    await expect(lab.locator(".analytics-contract-grid p.pass")).toHaveCount(1);
    await lab.getByRole("tab", { name: "Quality checks" }).click();
    await expect(lab.locator(".analytics-quality-list p.pass")).toHaveCount(10);
    const initial = await lab.locator(".margin-before-after").innerText();
    await lab.getByRole("slider", { name: "Promotion depth" }).fill("8");
    await expect(lab.locator(".margin-before-after")).not.toHaveText(initial);
    await expect(lab.locator(".margin-action")).toContainText(/Test the lower-cost|Do not publish/);
    await expect(lab.getByRole("link", { name: "Metric definitions" })).toHaveAttribute("href", /metric-registry\.json/);
  });

  test("Credit Policy Lab separates score, economics, policy, capacity, monitoring, and audit", async ({ page }) => {
    await page.goto("/analytics/credit-policy-lab", { waitUntil: "networkidle" });
    const lab = page.getByTestId("credit-policy-lab");
    await expect(lab).toBeVisible();
    await expect(lab.locator(".credit-layer-strip > div")).toHaveCount(5);
    await expect(lab.locator(".credit-decision-bands > div")).toHaveCount(3);
    await expect(lab.locator(".analytics-contract-grid p.pass")).toHaveCount(1);
    await expect(lab.locator(".analytics-contract-grid")).toContainText("All ten checks pass");
    await expect(lab).toContainText("Model probability is not the final business decision");
    await expect(lab).toContainText("Backtest score comparison");
    await lab.getByRole("slider", { name: "Review capacity" }).fill("40");
    await expect(lab.getByRole("button", { name: "Resolve queue overflow" })).toBeDisabled();
    await lab.getByRole("slider", { name: "Review capacity" }).fill("360");
    const record = lab.getByRole("button", { name: "Record policy decision" });
    await expect(record).toBeEnabled();
    await record.click();
    await expect(lab.locator(".credit-audit-record")).toContainText("SYN-POLICY-2030-06-baseline-12-28-360");
    await expect(lab.getByRole("link", { name: "Open policy contract" })).toHaveAttribute("href", /policy-contract\.json/);
  });

  test("legacy Analytics Tandem route explains the migration", async ({ page }) => {
    await page.goto("/analytics/analytics-tandem", { waitUntil: "networkidle" });
    await expect(page.locator(".analytics-migration")).toContainText("has been split into two operable case studies");
    await expect(page.locator('.analytics-migration a[href="/analytics/margin-control-tower"]')).toBeVisible();
    await expect(page.locator('.analytics-migration a[href="/analytics/credit-policy-lab"]')).toBeVisible();
  });
});

test.describe("Privacy Preflight Web", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "en"));
    await page.goto("/ai/privacy-preflight-mac", { waitUntil: "networkidle" });
    await expect(page.getByTestId("privacy-preflight-lab")).toBeVisible();
  });

  test("text review is deterministic, editable, undoable, and does not send content", async ({ page }) => {
    const requests: string[] = [];
    page.on("request", (request) => {
      if (/^https?:/.test(request.url())) requests.push(`${request.method()} ${request.url()}`);
    });

    await page.getByRole("button", { name: "Load synthetic example" }).click();
    await expect(page.locator(".privacy-entity")).toHaveCount(4);
    const output = page.getByTestId("privacy-safe-output");
    await expect(output).toContainText("[EMAIL]");
    await expect(output).not.toContainText("ada@example.com");
    await expect(page.locator(".privacy-validation.pass")).toBeVisible();

    const firstToggle = page.locator(".privacy-entity .privacy-accept").first();
    await firstToggle.click();
    await expect(page.locator(".privacy-validation.fail")).toBeVisible();
    await firstToggle.click();
    await expect(page.locator(".privacy-validation.pass")).toBeVisible();

    const textarea = page.getByRole("textbox", { name: "Input" });
    await textarea.fill("Project Phoenix owner: synthetic@example.com");
    await textarea.evaluate((node) => {
      const input = node as HTMLTextAreaElement;
      input.focus();
      input.setSelectionRange(0, 15);
    });
    await page.getByRole("button", { name: "Add selected text" }).click();
    await expect(page.locator(".privacy-entity")).toHaveCount(1);
    await page.locator(".privacy-entity-actions").getByRole("button", { name: "Mask" }).click();
    await expect(output).toContainText("***************");
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(page.locator(".privacy-entity")).toHaveCount(1);
    await page.getByRole("button", { name: "Reset" }).click();
    await expect(textarea).toHaveValue("");

    expect(requests).toEqual([]);
  });

  test("Chinese fixture detects the bilingual deterministic subset", async ({ page }) => {
    await page.getByRole("button", { name: "中", exact: true }).click();
    await page.getByRole("button", { name: "载入合成示例" }).click();
    await expect(page.locator(".privacy-entity")).toHaveCount(4);
    await expect(page.locator(".privacy-entity").filter({ hasText: "SCHOOL" })).toBeVisible();
    await expect(page.getByTestId("privacy-safe-output")).toContainText("[SCHOOL]");
    await expect(page.locator(".privacy-validation.pass")).toBeVisible();
  });

  test("image export burns pixels into a fresh verified PNG without requests", async ({ page }) => {
    await page.getByRole("tab", { name: "Image" }).click();
    const requests: string[] = [];
    page.on("request", (request) => {
      if (/^https?:/.test(request.url())) requests.push(`${request.method()} ${request.url()}`);
    });
    await page.locator('input[type="file"]').setInputFiles(path.resolve("public/case-studies/privacy-preflight/image-synthetic-input.png"));
    const canvas = page.locator(".privacy-canvas-wrap canvas");
    await expect(canvas).toBeVisible();
    const bounds = await canvas.boundingBox();
    expect(bounds).not.toBeNull();
    if (!bounds) return;
    await page.mouse.move(bounds.x + bounds.width * 0.15, bounds.y + bounds.height * 0.2);
    await page.mouse.down();
    await page.mouse.move(bounds.x + bounds.width * 0.65, bounds.y + bounds.height * 0.42, { steps: 5 });
    await page.mouse.up();
    await expect(page.locator(".privacy-box-list article")).toHaveCount(1);
    const xInput = page.locator(".privacy-box-list article input").first();
    const initialX = Number(await xInput.inputValue());
    await page.mouse.move(bounds.x + bounds.width * 0.4, bounds.y + bounds.height * 0.3);
    await page.mouse.down();
    await page.mouse.move(bounds.x + bounds.width * 0.46, bounds.y + bounds.height * 0.34, { steps: 4 });
    await page.mouse.up();
    expect(Number(await xInput.inputValue())).toBeGreaterThan(initialX);
    await page.getByRole("button", { name: "Preview redacted result" }).click();
    await expect(page.getByTestId("privacy-image-output")).toBeVisible();
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("link", { name: "Download redacted file" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain("-redacted.png");
    await expect(page.locator(".privacy-validation.pass")).toBeVisible();
    expect(requests).toEqual([]);
  });

  test("local OCR loads only same-origin runtime assets and produces review boxes", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "The heavy OCR runtime is exercised once; responsive review controls are covered separately.");
    test.setTimeout(120_000);
    await page.getByRole("tab", { name: "Image" }).click();
    await page.locator('input[type="file"]').setInputFiles(path.resolve("public/case-studies/privacy-preflight/image-synthetic-input.png"));
    const unsafeRequests: string[] = [];
    page.on("request", (request) => {
      if (!/^https?:/.test(request.url())) return;
      const url = new URL(request.url());
      if (url.origin !== "http://127.0.0.1:4173" || request.method() !== "GET" || /ada%40example|415-555|Private/i.test(url.href)) {
        unsafeRequests.push(`${request.method()} ${request.url()}`);
      }
    });
    await page.getByRole("button", { name: "Scan for sensitive information" }).click();
    await expect(page.locator(".privacy-ocr-status")).toContainText(/rule-matched OCR regions/, { timeout: 100_000 });
    expect(await page.locator('.privacy-box-list article code').filter({ hasText: "ocr" }).count()).toBeGreaterThan(0);
    expect(unsafeRequests).toEqual([]);
  });

  test("PDF export reviews every page, rasterizes, rebuilds, and passes the fail-closed gate", async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    await page.getByRole("tab", { name: "PDF" }).click();
    const unsafeRequests: string[] = [];
    page.on("request", (request) => {
      if (!/^https?:/.test(request.url())) return;
      const url = new URL(request.url());
      if (url.origin !== "http://127.0.0.1:4173" || request.method() !== "GET" || /ada%40example|415-555|Private/i.test(url.href)) {
        unsafeRequests.push(`${request.method()} ${request.url()}`);
      }
    });
    const fixture = await PDFDocument.create();
    const font = await fixture.embedFont(StandardFonts.Helvetica);
    fixture.addPage([480, 320]).drawText("Synthetic contact ada@example.com or 415-555-0188", { x: 48, y: 220, size: 18, font });
    fixture.addPage([480, 320]).drawText("Synthetic second page contains no sensitive value", { x: 48, y: 220, size: 18, font });
    const fixturePath = testInfo.outputPath("synthetic-two-page.pdf");
    await writeFile(fixturePath, await fixture.save());
    await page.locator('input[type="file"]').setInputFiles(fixturePath);
    await expect(page.locator(".privacy-pdf-canvas-stack canvas").last()).toBeVisible();
    await expect(page.locator(".privacy-page-counter")).toContainText("1 / 2");
    await expect(page.locator(".privacy-page-method")).toContainText("Text layer");
    expect(await page.locator('.privacy-box-list article code').filter({ hasText: "text-layer" }).count()).toBeGreaterThan(0);
    await page.getByRole("button", { name: "Mark page reviewed" }).click();
    await expect(page.getByRole("button", { name: "Preview redacted result" })).toBeDisabled();
    await page.getByRole("button", { name: "Next page" }).click();
    await expect(page.locator(".privacy-page-counter")).toContainText("2 / 2");
    await page.getByRole("button", { name: "Mark page reviewed" }).click();
    await page.getByRole("button", { name: "Preview redacted result" }).click();
    await expect(page.getByTestId("privacy-pdf-output")).toBeVisible({ timeout: 100_000 });
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("link", { name: "Download redacted file" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain("-redacted.pdf");
    await expect(page.locator(".privacy-validation.pass")).toContainText("ready to preview and download", { timeout: 100_000 });
    await expect(page.locator(".privacy-pdf-checks span")).toHaveCount(7);
    expect(unsafeRequests).toEqual([]);
  });

  test("integrated image and PDF examples enter the real review workflow", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "The fixture workflow is exercised once; mobile layout is covered by responsive tests.");
    await page.getByRole("tab", { name: "Image" }).click();
    await page.getByRole("button", { name: "Load English image example" }).click();
    await expect(page.locator(".privacy-file-name")).toContainText("privacy-english-example.png");
    await expect(page.locator(".privacy-canvas-wrap canvas")).toBeVisible();
    await page.getByRole("button", { name: "Load Chinese image example" }).click();
    await expect(page.locator(".privacy-file-name")).toContainText("privacy-chinese-example.png");

    await page.getByRole("tab", { name: "PDF" }).click();
    await page.getByRole("button", { name: "Load text-layer PDF" }).click();
    await expect(page.locator(".privacy-page-method")).toContainText("Text layer");
    await expect(page.locator('.privacy-box-list article code').filter({ hasText: "text-layer" })).toHaveCount(3);
    await page.getByRole("button", { name: "Load scanned PDF" }).click();
    await expect(page.locator(".privacy-page-method")).toContainText("OCR required");
    await page.getByRole("button", { name: "Scan for sensitive information" }).click();
    await expect(page.locator(".privacy-page-method")).toContainText("Local OCR", { timeout: 100_000 });
    expect(await page.locator('.privacy-box-list article code').filter({ hasText: "ocr" }).count()).toBeGreaterThan(0);
    await page.getByRole("button", { name: "Load multi-page PDF" }).click();
    await expect(page.locator(".privacy-page-counter")).toContainText("1 / 2");
    await expect(page.locator(".privacy-page-method")).toContainText("OCR required");
    await expect(page.locator(".privacy-benchmark-summary")).toContainText("94.7%");
  });
});
