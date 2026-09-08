import { expect, test } from "@playwright/test";
import { SEL } from "./selectors";
import { bodyTextExcludingLanguageSwitcher, containsCJK, longestLatinWordRun } from "./localePurity";
import { assertNoHorizontalOverflow, assertTouchTarget } from "./mobileAudit";

const ROUTE = "/ai/frontier-forge";
const HEAVY_ASSET_PATTERN = /\.(onnx|wasm|gguf)(\?|$)/i;
const OVERLOAD_RECEIPT_PATTERN = /phase7_1_sustained_gateway_bench\.json/;

for (const locale of ["en", "zh"] as const) {
  test(`${locale} Frontier Forge instrument is prefilled in the first viewport with zero clicks`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "The instrument-first contract only needs one browser size.");
    await page.addInitScript((selectedLocale) => {
      window.localStorage.setItem("portfolio-locale", selectedLocale);
    }, locale);

    const response = await page.goto(ROUTE, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);

    // (a) data-instrument present in first viewport, prefilled, zero clicks.
    const instrument = page.locator(SEL.instrument).first();
    await expect(instrument).toBeVisible();
    const instrumentBox = await instrument.boundingBox();
    expect(instrumentBox).not.toBeNull();
    expect(instrumentBox!.y).toBeLessThan((page.viewportSize()?.height ?? 900) + 40);

    const readout = instrument.locator("[data-readout]");
    await expect(readout).toBeVisible();
    // The readout is a real recorded serving run (spec §6.1 exhibit 01) —
    // it must show a real run id and a real duration string, not an empty
    // or loading state, before any interaction.
    await expect(readout.locator("code")).toContainText("phase4_");
    await expect(readout.locator("strong")).toHaveText(/^\d+\.\d+s$/);

    // Chips are pre-selected (one is aria-selected="true" already).
    const selectedChip = instrument.locator('[data-forge-chip][aria-selected="true"]');
    await expect(selectedChip).toHaveCount(1);

    await expect(instrument.locator("textarea, input")).toHaveCount(0);
    await expect(page.locator("body")).not.toContainText("LIVE TRIAGE");
  });
}

test("Frontier Forge live slot renders the closed state one-liner", async ({ page }) => {
  await page.goto(ROUTE, { waitUntil: "networkidle" });
  // (b) live slot closed-state text, exact.
  const liveSlots = page.locator("[data-live-slot]");
  expect(await liveSlots.count()).toBeGreaterThan(0);
  for (const slot of await liveSlots.all()) {
    await expect(slot).toHaveText("RECORDED EVALUATION · OFFLINE REPLAY");
    await expect(slot).toHaveAttribute("data-live-state", "closed");
  }
});

test("Frontier Forge archive tabs read recorded evidence across cURL/Python/JSON", async ({ page }) => {
  await page.goto(ROUTE, { waitUntil: "networkidle" });
  const instrument = page.locator('[data-instrument][data-instrument-variant="full"]');
  const tabs = instrument.locator(".forge-console-tabs button");
  await expect(tabs).toHaveCount(3);
  await expect(instrument.locator("[data-forge-request-tab]")).toContainText("run_id");
  await tabs.nth(1).click();
  await expect(instrument.locator('[data-forge-request-tab="python"]')).toContainText("json.load");
  await tabs.nth(2).click();
  await expect(instrument.locator('[data-forge-request-tab="json"]')).toContainText("complaint_narrative");
});

test("Frontier Forge renders with no JavaScript: exhibits 01-05 have static server-rendered content", async ({ browser }) => {
  // (c) with JS disabled, exhibits 01-05 must show real static tables/values,
  // not an empty shell — this is what proves the content is server-rendered
  // rather than assembled client-side after hydration.
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

  // 01: instrument readout has a real value.
  await expect(page.locator(SEL.exhibit("01")).locator("[data-readout] strong")).toHaveText(/^\d+\.\d+s$/);
  // 02: evidence claim table has rows.
  await expect(page.getByTestId("forge-evidence-explorer").locator(SEL.tbodyTr)).toHaveCount(10);
  // 03: training ladder has all seven rungs.
  await expect(page.locator(SEL.exhibit("03")).locator("[data-ladder-rung]")).toHaveCount(7);
  // 04: serving boundary stat grid has real values.
  await expect(page.locator(SEL.exhibit("04")).locator(".exhibit-stat-cell")).toHaveCount(8);
  // 05: overload summary table (the no-JS-safe part) has the three cells.
  await expect(page.locator(SEL.exhibit("05")).locator("[data-multiplier]")).toHaveCount(3);
  await expect(page.locator(SEL.exhibit("05")).locator("[data-forge-load-replay]")).toBeVisible();

  await context.close();
});

test("Frontier Forge initial load requests no heavy asset (onnx/wasm/gguf)", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto(ROUTE, { waitUntil: "networkidle" });
  const heavy = requests.filter((url) => HEAVY_ASSET_PATTERN.test(url));
  expect(heavy).toEqual([]);
  // The overload receipt itself must not be part of the initial load either.
  const overloadRequestsBeforeClick = requests.filter((url) => OVERLOAD_RECEIPT_PATTERN.test(url));
  expect(overloadRequestsBeforeClick).toEqual([]);
});

test("Frontier Forge overload replay loads its recorded receipt only after a click", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto(ROUTE, { waitUntil: "networkidle" });

  // (e) no fetch for the 1.49 MB recorded receipt before the click.
  expect(requests.some((url) => OVERLOAD_RECEIPT_PATTERN.test(url))).toBe(false);

  const loadButton = page.locator("[data-forge-load-replay]");
  await expect(loadButton).toBeVisible();
  const [request] = await Promise.all([
    page.waitForRequest((req) => OVERLOAD_RECEIPT_PATTERN.test(req.url())),
    loadButton.click(),
  ]);
  expect(OVERLOAD_RECEIPT_PATTERN.test(request.url())).toBe(true);

  const replay = page.getByTestId("forge-overload-replay");
  await expect(replay).toHaveAttribute("data-state", "ready");
  await expect(replay.locator(SEL.dataSeriesGateway)).toContainText("687");
  await expect(replay.locator(SEL.dataSeriesBareVllm)).toContainText("651");
  await expect(replay.locator(SEL.forgeReplayReceiptBoundary)).toContainText("aggregate counts");
});

for (const locale of ["en", "zh"] as const) {
  test(`${locale} Frontier Forge renders recorded claims, filters, replay, and the model boundary`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "The flagship interaction contract only needs one browser size.");
    const browserErrors: string[] = [];
    page.on("pageerror", (error) => browserErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") browserErrors.push(message.text());
    });
    await page.addInitScript((selectedLocale) => {
      window.localStorage.setItem("portfolio-locale", selectedLocale);
    }, locale);

    const response = await page.goto(ROUTE, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/Frontier Forge/);
    await expect(page.locator("#project-title")).toBeVisible();

    // Equivalent-or-stronger replacement for the retired portfolio.spec.ts
    // "Frontier Forge renders recorded claims, filters, replay, and
    // disclosure" test (task-2.2-report.md documents the substitution).
    // Task W1 updated the hero to the reference demo's scope-note copy —
    // SEL.forgeHonestyNote now points at .forge-scope-note (see
    // selectors.ts) and this asserts its new text, one locale each.
    await expect(page.locator(SEL.forgeHonestyNote)).toHaveText(locale === "en"
      ? "The release model is the rule-label scaling ablation, not GRPO. GRPO's paired 95% CI includes zero across both completed seeds; a third seed aborted on the zero-reward-variance guard."
      : "发布使用的是规则标签扩量消融实验，不是 GRPO。GRPO 两个已完成 seed 的配对 95% CI 均含零；第三个 seed 被零奖励方差门禁提前终止。");

    const explorer = page.getByTestId("forge-evidence-explorer");
    await expect(explorer).toBeVisible();
    await expect(explorer.locator(SEL.tbodyTr)).toHaveCount(10);
    await expect(explorer.locator(SEL.dataResultNegative)).not.toHaveCount(0);
    const negativeBorder = await explorer.locator(SEL.dataResultNegative).first().evaluate((row) => {
      const style = getComputedStyle(row);
      return { leftWidth: style.borderLeftWidth, topWidth: style.borderTopWidth };
    });
    expect(negativeBorder.leftWidth).toBe("0px");
    expect(negativeBorder.topWidth).toBe("1px");
    await explorer.locator(SEL.buttonDataFilterTraining).click();
    await expect(explorer.locator(SEL.tbodyTr)).toHaveCount(4);
    expect(await explorer.locator(SEL.tbodyTr).evaluateAll((rows) => rows.map((row) => row.getAttribute("data-dimension")))).toEqual(["training", "training", "training", "training"]);

    // Model boundary matrix: negative count >= positive count.
    const matrix = page.locator(SEL.exhibit("06")).locator("[data-capability]");
    const yesCount = await matrix.locator('[data-capability="yes"]').count();
    const noCount = await matrix.locator('[data-capability="no"]').count();
    expect(noCount).toBeGreaterThanOrEqual(yesCount);
    await expect(page.locator(SEL.exhibit("06")).locator(".forge-not-recorded")).toContainText(locale === "en" ? "NOT RECORDED" : "未记录");

    // Report layer: Architecture -> Results & negatives -> Limitations.
    expect(await page.locator('[data-project-section="how"], [data-project-section="results"], [data-project-section="limitations"]').evaluateAll(
      (sections) => sections.map((section) => section.getAttribute("data-project-section")),
    )).toEqual(["how", "results", "limitations"]);
    await expect(page.locator('[data-project-section="how"] h2')).toHaveText(locale === "en" ? "Architecture" : "架构");
    await expect(page.locator('[data-project-section="results"] h2')).toHaveText(locale === "en" ? "Results & negatives" : "结果与负结果");
    await expect(page.locator('[data-project-section="limitations"] h2')).toHaveText(locale === "en" ? "Limitations" : "局限与边界");
    await expect(page.locator(SEL.linkListAHrefGithubComNotHref).or(page.locator('a[href="https://github.com/LucisZhang/frontier-forge"]'))).toBeVisible();

    expect(browserErrors).toEqual([]);
  });
}

// Task F5 (locale purity, user's binding rule): the project-state rail's
// zh gloss line (project.glossZh) and the hero's .cn-gloss paragraph used
// to render unconditionally regardless of locale — the en locale must show
// zero Chinese text anywhere on the page.
test("en Frontier Forge renders no Chinese (CJK) text anywhere on the page", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "en"));
  await page.goto(ROUTE, { waitUntil: "networkidle" });
  await expect(page.locator(SEL.cnGloss)).toHaveCount(0);
  await expect(page.locator(".exhibit-rail-copy-zh")).toHaveCount(0);
  // Task F2 review finding (Important): a regression re-blanking forgeRail's
  // copy.en would previously go undetected — nothing asserted the EN rail
  // copy line actually renders (only its zh sibling's absence). Mirrors
  // exhibition-shell.spec.ts:75-76's presence+exact-text pattern.
  await expect(page.locator(".exhibit-rail-copy-en")).toHaveCount(1);
  await expect(page.locator(".exhibit-rail-copy-en")).toHaveText("SFT fine-tuning, taken through to a running vLLM release.");
  const bodyText = await bodyTextExcludingLanguageSwitcher(page);
  expect(containsCJK(bodyText)).toBe(false);
});

// zh locale leads with Chinese for the gloss/rail lines, and neither one
// carries a long untranslated English sentence.
test("zh Frontier Forge renders the glossZh line only in zh locale, with no long English run", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "zh"));
  await page.goto(ROUTE, { waitUntil: "networkidle" });

  const gloss = page.locator(SEL.cnGloss).first();
  await expect(gloss).toHaveCount(1);
  await expect(gloss).toHaveText("SFT 微调到 vLLM 上线跑通");
  expect(longestLatinWordRun(await gloss.innerText())).toBeLessThanOrEqual(8);

  const railZh = page.locator(".exhibit-rail-copy-zh");
  await expect(railZh).toHaveCount(1);
  await expect(railZh).toHaveText("SFT 微调到 vLLM 上线跑通");
  expect(longestLatinWordRun(await railZh.innerText())).toBeLessThanOrEqual(8);
  await expect(page.locator(".exhibit-rail-copy-en")).toHaveCount(0);
});

// Task F11 (audit3 zh de-anglicization, forge items): the hero stat label
// and the shared "HOW THIS WAS VERIFIED" eyebrow translate for zh.
// Task W1 replaced the hero's 3-stat StatGrid with the reference demo's
// 4-cell metric band (own markup, not StatGrid — see forge.css); this is
// the equivalent-or-stronger check for that band's one translated label
// ("实测训练成本" replaces "实测总花费" — same "translate the cost/spend
// label" precedent, different underlying figure, see task-W1 report).
test("zh Frontier Forge translates the audit3 hero stat label and verified eyebrow", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "zh"));
  await page.goto(ROUTE, { waitUntil: "networkidle" });

  const heroStatLabels = await page.locator("#hero .forge-hero-metric span").allInnerTexts();
  expect(heroStatLabels).toContain("实测训练成本");
  expect(heroStatLabels.join(" ")).not.toContain("MEASURED TRAINING COST");

  await expect(page.locator(SEL.exhibit("07")).locator(".exhibit-eyebrow")).toHaveText("如何验证");
});

test("Frontier Forge rail is a single project-state rail with exhibit directory and back link", async ({ page }, testInfo) => {
  // Task W3: the desktop-width assumption still holds (auto-rail v3 is
  // desktop/tablet only), but the rail is no longer *permanently* fixed --
  // it's entry-open by default, which renders identically to the old
  // always-visible contract on a fresh load with no pointer interaction.
  // Equivalent-or-stronger: same assertions, plus the auto-mode contract
  // itself and the two page-scoped W1/W3 rail exceptions (boxed FF mark,
  // RECORDED ARTIFACT stamp) this page opts into.
  test.skip(testInfo.project.name !== "desktop", "The entry-open rail contract only applies at desktop/tablet widths (auto-rail v3 is >=980px only).");
  await page.goto(ROUTE, { waitUntil: "networkidle" });
  await expect(page.locator(SEL.rail)).toHaveCount(1);
  await expect(page.locator(".exhibit-shell")).toHaveAttribute("data-rail-mode", "auto");
  await expect(page.locator(".exhibit-shell")).not.toHaveClass(/rail-collapsed/);
  expect(await page.locator(SEL.rail).locator(".exhibit-rail-fixed .exhibit-rail-nav a .exhibit-rail-num").allTextContents()).toEqual(
    ["01", "02", "03", "04", "05", "06", "07"],
  );
  await expect(page.locator(SEL.rail).locator(".exhibit-rail-fixed").getByText("← ALL WORK")).toBeVisible();
  expect(await page.locator("main [data-exhibit]").evaluateAll((sections) => sections.map((section) => section.getAttribute("data-exhibit")))).toEqual([
    "01", "02", "03", "04", "05", "06", "07",
  ]);

  // Page-scoped rail exceptions (task W3): boxed FF mark + RECORDED
  // ARTIFACT stamp, both opt-in via forgeRail.ts and unique to this
  // page's rail. Stamp reads "RECORDED" (tone "offline") rather than
  // "LIVE" because LiveSlot.tsx's own `data-live-state="closed"` says the
  // live layer is offline until R6 -- flip this assertion only when that
  // ships and forgeRail.ts's stamp flips with it.
  await expect(page.locator(".exhibit-rail-mark")).toHaveAttribute("data-boxed", "true");
  await expect(page.locator(".exhibit-rail-stamp")).toHaveText("RECORDED ARTIFACT");
  await expect(page.locator(".exhibit-rail-stamp")).toHaveAttribute("data-tone", "offline");
});

// Task F1 (comprehensive mobile adaptation pass, spec §2.5). The compact
// hero instrument is intentionally display:none below 1180px (exhibit 01's
// full-size instrument takes over) -- these checks target the always-
// visible-on-mobile "full" variant via :visible so they don't pick up the
// hidden compact copy's own (identically-classed) elements.
test.describe("F1 mobile pass — Frontier Forge", () => {
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

  test("chips, tabs, filter bar, and the overload CTA meet the 44px touch-target floor", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Touch-target sizing is only relevant at mobile widths.");
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    await assertTouchTarget(page, ".forge-console-chips button:visible", "serving-run chip (e.g. R1b BF16)");
    await assertTouchTarget(page, ".forge-console-tabs button:visible", "request-body tab (cURL/Python/JSON)");
    await assertTouchTarget(page, ".forge-serving-segmented button:visible", "serving-boundary segmented control");
    await page.locator(".forge-filter-bar button:visible").first().scrollIntoViewIfNeeded();
    await assertTouchTarget(page, ".forge-filter-bar button:visible", "claim-table filter chip");
    await page.locator(".forge-overload-load-button:visible").scrollIntoViewIfNeeded();
    await assertTouchTarget(page, ".forge-overload-load-button:visible", "LOAD RECORDED REPLAY button");
  });
});

// Task F7 (direction B mobile tables, approved mock
// output/design-align/direction-mobile-table-b.html's dark "number-first"
// section): the evidence claim table's Claim/Number/n·CI/command/SHA-256
// columns crushed the claim sentence into an unreadable sliver at mobile
// widths even though the horizontal-scroll wrapper kept the page itself
// from overflowing -- replaced below 768px by a number-first card list.
test.describe("F7 mobile table grammar — Frontier Forge", () => {
  test("evidence claim table becomes a number-first card list with no horizontal overflow", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Direction B's mobile-only card list only renders below 768px.");
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    const exhibit = page.locator(SEL.exhibit("02"));

    await expect(exhibit.locator(".forge-claim-table-scroll")).toBeHidden();
    const cards = page.getByTestId("forge-claim-cards");
    await expect(cards).toBeVisible();

    // The label: each card leads with the number and an inline mono
    // result tag (POSITIVE/NEGATIVE/BOUNDARY) -- the same verdict label
    // the desktop table renders in its Claim column.
    const items = cards.locator("li");
    await expect(items).toHaveCount(10);
    const first = items.first();
    await expect(first.locator(".forge-claim-card-number code")).not.toBeEmpty();
    await expect(first.locator(".forge-result-tag")).toBeVisible();
    await expect(first.locator(".forge-claim-card-caption")).not.toBeEmpty();

    // Filtering still drives both renderings off the same state.
    await page.locator('.forge-filter-bar button[data-filter="training"]').click();
    await expect(items).toHaveCount(4);

    await assertNoHorizontalOverflow(page, `${ROUTE} exhibit 02 claim cards at 390`);
  });

  test("desktop keeps the real 5-column claim table, card list hidden", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Desktop-only regression guard for the F7 mobile-card toggle.");
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    const exhibit = page.locator(SEL.exhibit("02"));
    await expect(exhibit.locator(".forge-claim-table-scroll")).toBeVisible();
    await expect(page.getByTestId("forge-evidence-explorer").locator(SEL.tbodyTr)).toHaveCount(10);
    await expect(page.getByTestId("forge-claim-cards")).toBeHidden();
  });
});

for (const locale of ["en", "zh"] as const) {
  test(`${locale} archived Forge controls remain keyboard usable without inference calls`, async ({ page }) => {
    const calls: string[] = [];
    page.on("request", request => {
      if (/\/api\/(triage|forge)/.test(request.url())) calls.push(request.url());
    });
    await page.addInitScript(value => localStorage.setItem("portfolio-locale", value), locale);
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    await expect(page.locator("[data-forge-input]")).toHaveCount(0);
    await expect(page.locator("body")).not.toContainText("LIVE TRIAGE");
    const instrument = page.locator('[data-instrument-variant="full"]');
    const chips = instrument.locator("[data-forge-chip]");
    await chips.first().focus();
    await page.keyboard.press("Enter");
    await expect(chips.first()).toHaveAttribute("aria-selected", "true");
    const tabs = instrument.locator(".forge-console-tabs button");
    await tabs.nth(1).focus();
    await page.keyboard.press("Enter");
    await expect(instrument.locator("[data-forge-request-tab]")).toContainText("json.load");
    await expect(instrument.locator("[data-forge-request-tab]")).not.toContainText("requests.post");
    await tabs.nth(2).focus();
    await page.keyboard.press("Enter");
    await expect(instrument.locator("[data-forge-request-tab]")).toContainText("release.json");
    expect(calls).toEqual([]);
  });
}
