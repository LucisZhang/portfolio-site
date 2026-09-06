import { expect, test } from "@playwright/test";
import { SEL } from "./selectors";
import { bodyTextExcludingLanguageSwitcher, containsCJK, longestLatinWordRun } from "./localePurity";
import { assertNoHorizontalOverflow, assertTouchTarget } from "./mobileAudit";
import ocrBenchmark from "../../public/case-studies/privacy-preflight/ocr-fixture-benchmark.json";

const ROUTE = "/ai/privacy-preflight";
// Task 3.2 (spec §6.4, "restraint-first reflow"): tesseract's WASM core /
// language packs and the PDF.js runtime are the two heavy asset roots
// (public/generated/privacy-ocr 16MB, public/generated/privacy-pdf 1.7MB,
// public/case-studies/privacy-preflight 34MB) that must stay click-gated —
// absent from the initial load, present only after the visitor picks the
// corresponding tab/action.
const TESSERACT_PATTERN = /\/generated\/privacy-ocr\//;
const PDFJS_PATTERN = /\/generated\/privacy-pdf\//;

test.describe("Privacy Preflight first screen (spec §6.4)", () => {
  test("prefilled synthetic text, SCAN, and USE A SAMPLE FILE are all visible with zero clicks", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "The instrument-first contract only needs one browser size.");
    const response = await page.goto(ROUTE, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);

    const instrument = page.locator('[data-instrument][data-instrument-variant="full"]');
    await expect(instrument).toBeVisible();

    // (a) The text workspace is the default view and its working copy
    // already carries the synthetic example, scanned on load -- direction
    // B's "the document is the interface": the marked-up proof is already
    // there, not an empty state waiting for a first SCAN.
    const doc = instrument.locator(SEL.privacyGalleyDoc);
    await expect(doc).toContainText("ada@example.com");
    // Task F12 (user-ordered sample enrichment): seven detections across
    // seven entity types (EMAIL/PHONE/LOCAL_PATH/IP_ADDRESS/URL/SCHOOL/ID)
    // fill both the galley and the editor's notes column -- stronger than
    // the previous "at least one strike" assertion.
    await expect(doc.locator(SEL.privacyDocStrike)).toHaveCount(7);
    await expect(instrument.locator(SEL.privacyNote)).toHaveCount(7);

    // (a) SCAN is still present as a re-scan/reset action; it is enabled
    // because the working copy is already there.
    const scanButton = instrument.locator(SEL.privacyScanLink);
    await expect(scanButton).toBeVisible();
    await expect(scanButton).toBeEnabled();

    // (a) USE A SAMPLE FILE is required — recruiters have no file on hand
    // for the Image/PDF tabs — and must already be visible on this first
    // (Text) screen, not hidden behind a tab switch.
    await expect(page.getByRole("button", { name: "USE A SAMPLE FILE" })).toBeVisible();
  });

  test("Image and PDF are tabs of the same workbench (spec's single one-dimensional tab group)", async ({ page }) => {
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    const instrument = page.locator('[data-instrument][data-instrument-variant="full"]');
    const tabs = instrument.getByRole("tab");
    await expect(tabs).toHaveCount(3);
    await expect(tabs.nth(1)).toHaveText(/image/i);
    await expect(tabs.nth(2)).toHaveText(/pdf/i);
  });
});

test.describe("Privacy Preflight heavy-asset gating (spec §6.4 byte discipline)", () => {
  test("no tesseract or PDF.js request fires on initial load", async ({ page }) => {
    const requests: string[] = [];
    page.on("request", (request) => requests.push(request.url()));
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    expect(requests.filter((url) => TESSERACT_PATTERN.test(url))).toEqual([]);
    expect(requests.filter((url) => PDFJS_PATTERN.test(url))).toEqual([]);
  });

  test("tesseract loads only after the Image tab's scan action, not merely on tab selection", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "The heavy OCR runtime is exercised once.");
    test.setTimeout(120_000);
    const requests: string[] = [];
    page.on("request", (request) => requests.push(request.url()));
    await page.goto(ROUTE, { waitUntil: "networkidle" });

    const instrument = page.locator('[data-instrument][data-instrument-variant="full"]');
    await instrument.getByRole("tab", { name: "Image" }).click();
    expect(requests.some((url) => TESSERACT_PATTERN.test(url))).toBe(false);

    // USE A SAMPLE FILE loads a real image into this tab (recruiters have
    // no file of their own) -- still no tesseract request until Scan runs.
    await instrument.getByRole("button", { name: "USE A SAMPLE FILE" }).click();
    await expect(instrument.locator(".privacy-file-name")).not.toHaveText("or drop PNG/JPEG here");
    expect(requests.some((url) => TESSERACT_PATTERN.test(url))).toBe(false);

    const [request] = await Promise.all([
      page.waitForRequest((req) => TESSERACT_PATTERN.test(req.url()), { timeout: 100_000 }),
      instrument.getByRole("button", { name: "Scan for sensitive information" }).click(),
    ]);
    expect(TESSERACT_PATTERN.test(request.url())).toBe(true);
  });

  test("PDF.js loads only after a PDF is chosen on the PDF tab, not merely on tab selection", async ({ page }) => {
    const requests: string[] = [];
    page.on("request", (request) => requests.push(request.url()));
    await page.goto(ROUTE, { waitUntil: "networkidle" });

    const instrument = page.locator('[data-instrument][data-instrument-variant="full"]');
    await instrument.getByRole("tab", { name: /PDF/ }).click();
    expect(requests.some((url) => PDFJS_PATTERN.test(url))).toBe(false);

    const [request] = await Promise.all([
      page.waitForRequest((req) => PDFJS_PATTERN.test(req.url()), { timeout: 30_000 }),
      instrument.getByRole("button", { name: "Load text-layer PDF" }).click(),
    ]);
    expect(PDFJS_PATTERN.test(request.url())).toBe(true);
  });
});

test.describe("Privacy Preflight fail-closed export (spec §6.4 exhibit 04)", () => {
  test("exhibit 04 shows a crafted, deterministic UNSAFE TO EXPORT state with the --danger product-status treatment", async ({ page }) => {
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    const exhibit = page.locator(SEL.exhibit("04"));
    // Distinct from exhibit 01's .privacy-validation (fix, reviewer
    // finding Critical): this exhibit's status block must not collide with
    // the live workbench's own global .privacy-validation class, which the
    // legacy tests/e2e/portfolio.spec.ts suite selects unscoped.
    const statusWord = exhibit.locator(".privacy-fail-closed-status.fail strong");
    await expect(statusWord).toHaveText("UNSAFE TO EXPORT");
    await expect(exhibit.locator(".privacy-validation")).toHaveCount(0);
    const treatment = await exhibit.locator(".privacy-fail-closed-status.fail").evaluate((node) => {
      const style = getComputedStyle(node);
      return { borderTopWidth: style.borderTopWidth, borderLeftWidth: style.borderLeftWidth };
    });
    expect(treatment.borderTopWidth).toBe("2px");
    expect(treatment.borderLeftWidth).toBe("0px");
  });

  // Task F6 (direction B, "the document is the interface"): the fine-grained
  // accept/reject entity cards are gone -- the reviewer's only move is
  // clicking a strike directly in the working copy to keep it (reject its
  // destruction). Equivalent-or-stronger coverage: the same
  // validateRedaction fail-closed gate, exercised through the new click
  // target, plus a check that the kept original value actually resurfaces
  // in "what leaves the browser" (never a silent pass).
  test("reviewer-driven fail-closed gate in exhibit 01: clicking a strike to keep it renders a failing verdict, never a silent pass", async ({ page }) => {
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    const instrument = page.locator('[data-instrument][data-instrument-variant="full"]');
    const doc = instrument.locator(SEL.privacyGalleyDoc);
    const firstStrike = doc.locator(SEL.privacyDocStrike).first();
    await expect(firstStrike).toBeVisible();
    await expect(instrument.locator(SEL.privacyVerdictPass)).toBeVisible();
    await firstStrike.click();
    await expect(instrument.locator(SEL.privacyVerdictFail)).toBeVisible();
    await expect(instrument.locator(SEL.privacySafeOutput)).toContainText("ada@example.com");
  });
});

test.describe("Privacy Preflight no-JS static content (spec §6.0 template)", () => {
  test("exhibits 01-05 render real static content with JavaScript disabled", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    // 01: the working copy is scanned on load -- the marked-up proof (real
    // strikes, footnotes, and tokens) is static server-rendered content,
    // not something a client-side scan produces after hydration.
    const doc = page.locator(SEL.exhibit("01")).locator(SEL.privacyGalleyDoc);
    await expect(doc).toContainText("ada@example.com");
    await expect(doc.locator(SEL.privacyDocStrike)).toHaveCount(7);

    // 02: detect/review/destroy pipeline steps are a static ordered list.
    await expect(page.locator(SEL.exhibit("02")).locator("li")).not.toHaveCount(0);

    // 03: the OCR benchmark table is server-rendered from the real fixture
    // JSON, not fetched client-side after hydration.
    const benchmarkSummary = page.locator(SEL.exhibit("03")).locator(SEL.privacyBenchmarkSummary);
    await expect(benchmarkSummary).toContainText(`${ocrBenchmark.summary.hitCount} / ${ocrBenchmark.summary.expectedCount}`);
    await expect(benchmarkSummary).toContainText(`${ocrBenchmark.summary.falsePositiveCount}`);

    // 04: the crafted fail-closed demonstration is server-rendered too.
    await expect(page.locator(SEL.exhibit("04")).locator(".privacy-fail-closed-status.fail strong")).toHaveText("UNSAFE TO EXPORT");

    // 05: boundary findings render as static Finding blocks.
    await expect(page.locator(SEL.exhibit("05")).locator("[data-finding]")).not.toHaveCount(0);

    await context.close();
  });
});

test.describe("Privacy Preflight zero-hardcoded OCR digits (spec commandment #10)", () => {
  test("exhibit 03's 19/19 and 2 FP figures match the on-site benchmark JSON, not a typed-in number", async ({ page }) => {
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    const summary = page.locator(SEL.exhibit("03")).locator(SEL.privacyBenchmarkSummary);
    await expect(summary).toContainText(`${ocrBenchmark.summary.hitCount} / ${ocrBenchmark.summary.expectedCount}`);
    await expect(summary).toContainText(`${ocrBenchmark.summary.falsePositiveCount}`);
    expect(ocrBenchmark.summary.hitCount).toBe(19);
    expect(ocrBenchmark.summary.expectedCount).toBe(19);
    expect(ocrBenchmark.summary.falsePositiveCount).toBe(2);
  });
});

test("Privacy Preflight rail is a single project-state rail with the exhibit directory and back link", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The fixed-rail contract only applies at desktop widths.");
  await page.goto(ROUTE, { waitUntil: "networkidle" });
  await expect(page.locator(SEL.rail)).toHaveCount(1);
  const navNums = await page.locator(SEL.rail).locator(".exhibit-rail-fixed .exhibit-rail-nav a .exhibit-rail-num").allTextContents();
  expect(navNums[0]).toBe("01");
  expect(navNums.at(-1)).toBeDefined();
  await expect(page.locator(SEL.rail).locator(".exhibit-rail-fixed").getByText("← ALL WORK")).toBeVisible();
  const exhibitNums = await page.locator("main [data-exhibit]").evaluateAll((sections) => sections.map((section) => section.getAttribute("data-exhibit")));
  expect(exhibitNums).toEqual(navNums);
});

// Task F5 (locale purity, user's binding rule).
test("en Privacy Preflight renders no Chinese (CJK) text anywhere on the page", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "en"));
  await page.goto(ROUTE, { waitUntil: "networkidle" });
  await expect(page.locator(SEL.cnGloss)).toHaveCount(0);
  await expect(page.locator(".exhibit-rail-copy-zh")).toHaveCount(0);
  await expect(page.locator(".exhibit-rail-copy-en")).toHaveCount(1);
  const bodyText = await bodyTextExcludingLanguageSwitcher(page);
  expect(containsCJK(bodyText)).toBe(false);
});

test("zh Privacy Preflight renders an independent gloss line at or under 20 characters, with no long English run", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "zh"));
  await page.goto(ROUTE, { waitUntil: "networkidle" });
  const railZh = page.locator(".exhibit-rail-copy-zh");
  await expect(railZh).toHaveCount(1);
  const railZhText = await railZh.innerText();
  expect(railZhText.length).toBeLessThanOrEqual(20);
  expect(longestLatinWordRun(railZhText)).toBeLessThanOrEqual(8);
  await expect(page.locator(".exhibit-rail-copy-en")).toHaveCount(0);

  const gloss = page.locator(SEL.cnGloss).first();
  await expect(gloss).toHaveCount(1);
  expect(longestLatinWordRun(await gloss.innerText())).toBeLessThanOrEqual(8);
});

// Task F11 (audit3 zh de-anglicization, privacy(7)): spot-checks on the
// biggest translated action-line/eyebrow/status fragments. "USE A SAMPLE
// FILE" and the strike hint were previously documented "mono UI fabric,
// English both locales" (PrivacyActionLine.tsx) -- audit3 overrides that
// for zh specifically, so en must stay byte-identical while zh gets a real
// translation (locale-keyed pair, same convention as RailCopy/localize).
test("zh Privacy Preflight translates the audit3 action-line, stat, and status fragments", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "zh"));
  await page.goto(ROUTE, { waitUntil: "networkidle" });

  await expect(page.locator(SEL.privacySampleLink).first()).toHaveText("使用示例文件");
  await expect(page.locator(".privacy-action-hint")).toHaveText("点击删除线即可保留");

  const heroStatLabels = await page.locator(".privacy-hero-copy .exhibit-stat-label").allInnerTexts();
  expect(heroStatLabels).toEqual(["工作线程测试通过数", "OCR 样本命中数", "OCR 误报数"]);

  await expect(page.locator(SEL.exhibit("04")).locator(".exhibit-eyebrow")).toHaveText("默认拦截的导出关卡");
  await expect(page.locator(SEL.exhibit("04")).locator(".privacy-fail-closed-status.fail strong")).toHaveText("禁止导出");
});

test("Privacy Preflight report layer follows Architecture -> Results & negatives -> Limitations", async ({ page }) => {
  await page.goto(ROUTE, { waitUntil: "networkidle" });
  const sections = await page.locator('[data-project-section="how"], [data-project-section="results"], [data-project-section="limitations"]').evaluateAll(
    (nodes) => nodes.map((node) => node.getAttribute("data-project-section")),
  );
  expect(sections).toEqual(["how", "results", "limitations"]);
  await expect(page.locator(SEL.linkListAHrefGithubComNotHref).or(page.locator('a[href="https://github.com/LucisZhang/privacy-preflight"]'))).toBeVisible();
});

// Task F1 (comprehensive mobile adaptation pass, spec §2.5).
test.describe("F1 mobile pass — Privacy Preflight", () => {
  test("no horizontal overflow at 390 or 360, first screen and mid-page", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Viewport-width-specific overflow scan.");
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    await assertNoHorizontalOverflow(page, `${ROUTE} at 390 (first screen)`);
    await page.mouse.wheel(0, 3000);
    await assertNoHorizontalOverflow(page, `${ROUTE} at 390 (mid-page)`);

    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    await assertNoHorizontalOverflow(page, `${ROUTE} at 360 (first screen)`);
    await page.mouse.wheel(0, 3000);
    await assertNoHorizontalOverflow(page, `${ROUTE} at 360 (mid-page)`);
  });

  // Task F1/F6: the old boxed workspace bar (flex:1 tab row + a
  // never-shrinking sample CTA) is gone -- replaced by the mono action
  // line, which wraps its dot-separated words instead of overflowing.
  // Equivalent-or-stronger coverage: the new line's own flex-wrap, plus the
  // 44px floor on every real click target the line replaces (workspace
  // tabs, USE A SAMPLE FILE, SCAN), plus the Image workspace's own
  // restyled actionbar (its Scan button and Blackout/Pixelate toggle,
  // direction B's "hairlines + text actions" for the labs kept from
  // Round 1) -- the "sensitivity" Balanced/Strict toggle it replaces is
  // retired from the text workspace along with every other fine-grained
  // review control (see task-F6-report.md).
  test("action line wraps instead of overflowing, and its controls meet the 44px touch-target floor", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "This overflow only manifested below ~900px.");
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    const instrument = page.locator('[data-instrument][data-instrument-variant="full"]');
    const line = instrument.locator(SEL.privacyActionLine).first();
    await line.scrollIntoViewIfNeeded();
    await expect(line).toHaveCSS("flex-wrap", "wrap");
    await assertTouchTarget(page, ".privacy-action-tablist [role='tab']", "workspace tab (Text/Image/PDF)");
    await assertTouchTarget(page, SEL.privacySampleLink, "USE A SAMPLE FILE link");
    await assertTouchTarget(page, SEL.privacyScanLink, "SCAN link");

    await instrument.getByRole("tab", { name: "Image" }).click();
    await assertTouchTarget(page, ".privacy-actionbar button.privacy-scan-primary", "Scan for sensitive information button");
    await assertTouchTarget(page, ".privacy-segmented button:visible", "redaction style segmented control (Blackout/Pixelate)");
  });
});
