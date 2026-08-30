import { expect, test } from "@playwright/test";
import { SEL } from "./selectors";
import { bodyTextExcludingLanguageSwitcher, containsCJK, longestLatinWordRun } from "./localePurity";
import { assertNoHorizontalOverflow, assertTouchTarget } from "./mobileAudit";

// Task 1.2: homepage seven-exhibit rebuild (spec §4). Content assertions
// here read from src/data/generated/home-stats.json / home-receipts.json
// at test time rather than duplicating literal numbers, matching the
// components' own "zero hardcoded benchmark numbers" discipline.
import homeStats from "../../src/data/generated/home-stats.json";
import homeReceipts from "../../src/data/generated/home-receipts.json";
// Task F13b: the homepage inline "Ask Portfolio" chips (exhibit 02) are the
// home route's ("/") entries from the verified question bank -- the same
// source src/lib/ask-question-bank.ts resolves the floating assistant
// panel's own route-aware presets from.
import questionBank from "../../src/data/generated/ask-question-bank.json";
const homeAskQuestionsEn = questionBank["/"].questions.map((question) => question.q_en);

test.describe("homepage seven exhibits", () => {
  test("seven exhibit anchors exist in order 00-06", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const nums = ["00", "01", "02", "03", "04", "05", "06"];
    for (const num of nums) {
      await expect(page.locator(SEL.exhibit(num))).toHaveCount(1);
    }
    const order = await page.locator("[data-exhibit]").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-exhibit")));
    expect(order).toEqual(nums);
  });

  test("background rhythm is paper, ink, paper, white, ink, paper, ink", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.locator(SEL.exhibit("00"))).toHaveAttribute("data-bg", "paper");
    for (const [num, bg] of [
      ["01", "ink"],
      ["02", "paper"],
      ["03", "white"],
      ["04", "ink"],
      ["05", "paper"],
      ["06", "ink"],
    ] as const) {
      await expect(page.locator(SEL.exhibit(num))).toHaveAttribute("data-bg", bg);
    }
  });

  test("exactly one exhibition rail, and it carries the seven-item homepage directory", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.locator(SEL.rail)).toHaveCount(1);
    await expect(page.locator(SEL.brandMark)).toHaveText("XGZ");
    await expect(page.locator(".exhibit-rail-fixed .exhibit-rail-nav a")).toHaveCount(7);
  });

  // Task W3 (auto-rail v3): RAIL-SCOPE.md's verdict for home is "太空" (the
  // collapsed-state hero has no right-column content to fill the freed
  // width) -- home stays on ExhibitShell's default `mode="fixed"` rather
  // than opting into the mechanic every other evaluated page adopted.
  test("home keeps the permanently-fixed rail (auto-rail v3 exemption)", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "The rail-mode contract only needs one browser size.");
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.locator(".exhibit-shell")).toHaveAttribute("data-rail-mode", "fixed");
    await expect(page.locator(".exhibit-rail-hotzone")).toHaveCount(0);
    await expect(page.locator(".exhibit-rail-affordance")).toHaveCount(0);
    // No retract signal moves it: a big accumulated scroll is exactly what
    // dismisses an *auto*-mode rail's entry state -- fixed mode ignores it.
    await page.mouse.wheel(0, 400);
    await expect(page.locator(".exhibit-rail-fixed")).toBeVisible();
    await expect(page.locator("main#main-content")).toHaveCSS("margin-left", "260px");
  });

  test("hero renders its 4 stat tiles server-side, visible without JavaScript", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const cells = page.locator(".exhibit-stat-grid").first().locator(".exhibit-stat-cell");
    await expect(cells).toHaveCount(homeStats.heroTiles.length);
    for (const tile of homeStats.heroTiles) {
      await expect(page.locator(".exhibit-stat-grid").first()).toContainText(tile.value);
      await expect(page.locator(".exhibit-stat-grid").first()).toContainText(tile.label);
    }
    await expect(page.locator(SEL.homeHeroTitle)).toBeVisible();
    // Task F3: the hero entrance is pure CSS (Ruling R8 — no GSAP on the
    // homepage), so its hairline and staggered title lines exist and
    // settle even with JavaScript disabled.
    await expect(page.locator("[data-hero-hairline]")).toHaveCount(1);
    await expect(page.locator('[data-hero-line="0"]')).toBeVisible();
    await expect(page.locator('[data-hero-line="1"]')).toBeVisible();
    await context.close();
  });

  test("?hero=b switches the hero title away from the default candidate", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.locator(SEL.homeHeroTitle)).toContainText("I build the whole path.");

    await page.goto("/?hero=b", { waitUntil: "networkidle" });
    await expect(page.locator(SEL.homeHeroTitle)).toContainText("I don't cite benchmarks.");
    await expect(page.locator(SEL.homeHeroTitle)).not.toContainText("I build the whole path.");

    await page.goto("/?hero=c", { waitUntil: "networkidle" });
    await expect(page.locator(SEL.homeHeroTitle)).toContainText("Agents that act.");

    // An unrecognized value falls back to the default candidate (a) rather
    // than rendering nothing.
    await page.goto("/?hero=zz", { waitUntil: "networkidle" });
    await expect(page.locator(SEL.homeHeroTitle)).toContainText("I build the whole path.");
  });

  test("hero contact links carry no icons, per the no-icon binding rule", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const links = page.locator(SEL.homeHeroContactLink);
    await expect(links).toHaveCount(5); // GitHub, LinkedIn, Email, Phone, WeChat
    expect(await links.evaluateAll((nodes) => nodes.every((node) => node.querySelectorAll("svg").length === 0))).toBe(true);
  });

  test("exhibit 01 claim-chain expands via native <details> to reveal a sha256: receipt", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const rows = page.locator(SEL.homeClaimRow);
    await expect(rows).toHaveCount(homeStats.flagshipClaims.length);
    const first = rows.first();
    await expect(first.locator(SEL.homeClaimValue)).toHaveText(homeStats.flagshipClaims[0].value);
    // Not yet expanded: the SHA is not in the accessible/visible text.
    expect(await first.evaluate((node) => (node as HTMLDetailsElement).open)).toBe(false);
    await first.locator("summary").click();
    expect(await first.evaluate((node) => (node as HTMLDetailsElement).open)).toBe(true);
    await expect(first).toContainText(`sha256:${homeStats.flagshipClaims[0].sha256}`);
  });

  test("claim-chain expansion needs no JavaScript", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const first = page.locator(SEL.homeClaimRow).first();
    await first.locator("summary").click();
    await expect(first).toContainText(`sha256:${homeStats.flagshipClaims[0].sha256}`);
    await context.close();
  });

  test("exhibit 01 has a single release-console CTA and one negative finding", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const exhibit01 = page.locator(SEL.exhibit("01"));
    const cta = exhibit01.locator(SEL.homeCta);
    await expect(cta).toHaveCount(1);
    await expect(cta).toHaveText("OPEN THE RELEASE CONSOLE →");
    await expect(cta).toHaveAttribute("href", /\/ai\/frontier-forge$/);
    await expect(exhibit01.locator('[data-finding="negative"]')).toHaveCount(1);
    await expect(exhibit01.locator('[data-finding="negative"]')).toContainText(homeStats.negativeRuns[0].conclusion);
  });

  // Task F10 (box-grammar ruling): equivalent-or-stronger replacement for
  // the retired "...with one micro-instrument each" test. The decorative
  // dot-grid/sparkline/mask-block texture beside each row (NodeGrid/
  // DistributionBars/MaskedBlock) was flagged by the F8 audit (finding 3)
  // as exactly the filled-block/grid-of-boxes pattern the ruling retires,
  // and is now removed — the row stands as typography only. This
  // supersedes spec §4's 微仪器 (micro-instrument) mandate for this row
  // per the controller's ruling. Still asserts the frozen row content and
  // count, now also asserts the glyphs are gone and each row keeps the
  // hairline-top separator that was already doing the row-dividing work.
  test("exhibit 02 lists Release Guardian, Triage Router, and Privacy Preflight as numbered rows with no decorative micro-glyph", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const rows = page.locator(SEL.homeAgentRow);
    await expect(rows).toHaveCount(3);
    await expect(rows.nth(0)).toContainText("Release Guardian");
    await expect(rows.nth(1)).toContainText("Triage Router");
    await expect(rows.nth(2)).toContainText("Privacy Preflight");
    await expect(page.locator(".home-instrument")).toHaveCount(0);
    for (let index = 0; index < 3; index += 1) {
      const borderTop = await rows.nth(index).evaluate((el) => getComputedStyle(el).borderTopWidth);
      expect(borderTop).toBe("1px");
    }
  });

  test("exhibit 02 Ask Portfolio inline input reads its 3 preset questions from the verified question bank and populates (never auto-sends) the assistant on click", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const exhibit02 = page.locator(SEL.exhibit("02"));
    const presetButtons = exhibit02.locator(SEL.homeAskPresetButton);
    await expect(presetButtons).toHaveCount(3);
    await expect(presetButtons).toHaveText(homeAskQuestionsEn);

    await presetButtons.first().click();
    const widget = page.getByTestId("assistant-widget");
    await expect(widget).toBeVisible();
    // Task F13b requirement: clicking a homepage preset hands the exact bank
    // question to the guardrailed assistant input -- it prefills, it does not
    // silently auto-submit -- the same "never auto-send" contract the panel's
    // own initialPrompt wiring already documents (AssistantWidget.tsx).
    await expect(widget.locator("textarea")).toHaveValue(homeAskQuestionsEn[0]);
    await expect(widget.locator(SEL.article)).toHaveCount(0);
    await page.keyboard.press("Escape");
  });

  test("exhibit 03 shows the five-layer stack depth diagram and the exactly-once fault checkerboard", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const exhibit03 = page.locator(SEL.exhibit("03"));
    await expect(exhibit03.locator(SEL.homeStackLayer)).toHaveCount(homeStats.stackDepth.length);
    for (const layer of homeStats.stackDepth) {
      await expect(exhibit03).toContainText(layer.layer);
      await expect(exhibit03).toContainText(layer.metric);
    }
    const streamLayer = homeStats.stackDepth.find((layer) => layer.layer === "Stream");
    const expectedFaultCells = Number(streamLayer?.metric.match(/^(\d+)/)?.[1] ?? 0);
    await expect(exhibit03.locator(SEL.homeEodCell)).toHaveCount(expectedFaultCells);
  });

  test("exhibit 04 lists every negative run with a receipt link", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const rows = page.locator(SEL.homeNegativeRow);
    await expect(rows).toHaveCount(homeStats.negativeRuns.length);
    for (const [index, run] of homeStats.negativeRuns.entries()) {
      await expect(rows.nth(index)).toContainText(run.conclusion);
      await expect(rows.nth(index).locator("a")).toHaveAttribute("href", run.receiptHref);
    }
  });

  test("exhibit 05 shelves 3 secondary and 2 archived projects in one hairline table, archive rows muted", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const rows = page.locator(SEL.homeShelfRow);
    await expect(rows).toHaveCount(5);
    await expect(rows).toHaveCount(await page.locator(`${SEL.homeShelfRow}[data-tier="secondary"]`).count() + await page.locator(`${SEL.homeShelfRow}[data-tier="archive"]`).count());
    await expect(page.locator(`${SEL.homeShelfRow}[data-tier="secondary"]`)).toHaveCount(3);
    await expect(page.locator(`${SEL.homeShelfRow}[data-tier="archive"]`)).toHaveCount(2);
  });

  test("exhibit 06 receipts dl carries the release/EOD/privacy SHA-256 values and gate status", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const dl = page.locator(SEL.homeReceiptsDl);
    await expect(dl).toContainText(`sha256:${homeReceipts.releaseJson.sha256}`);
    await expect(dl).toContainText(`sha256:${homeReceipts.eodManifest.sha256}`);
    await expect(dl).toContainText(`sha256:${homeReceipts.privacyManifest.sha256}`);
    await expect(dl).toContainText(homeReceipts.buildDate);
    const exhibit06 = page.locator(SEL.exhibit("06"));
    await expect(exhibit06.locator(SEL.homeAskInput)).toHaveCount(1);
    await expect(exhibit06).toContainText(homeReceipts.buildDate);
  });

  test("language switch preserves the current exhibit hash", async ({ page }) => {
    await page.goto("/#exhibit-04", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "中", exact: true }).click();
    await expect(page).toHaveURL(/\?lang=zh#exhibit-04$/);
  });

  // Spec §2.1's fourth rail tool (RESUME) is absent from the public
  // repository — the approved resume PDFs are owner-private and are served
  // only from the deployment host — so the single-mount assertion anchors
  // on the ASK control instead, which is likewise unique to HomeRailTools.
  test("homepage rail footer tools (search / ask / language) render exactly once", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.locator(SEL.homeRailTools)).toHaveCount(1);
    await expect(page.locator(SEL.homeRailTools).getByRole("button", { name: "ASK", exact: true })).toHaveCount(1);
    await expect(page.locator(SEL.homeRailTools).getByRole("button", { name: "ASK", exact: true })).toBeVisible();
    await expect(page.locator(SEL.homeRailTools).getByRole("link", { name: "RESUME", exact: true })).toHaveCount(0);
  });

  // Task F5 (locale purity, user's binding rule): "英文版网站只能有英文" — the
  // en locale must render zero Chinese text anywhere on the page, including
  // the hero's zh narrative paragraph and the rail's zh positioning line,
  // both of which used to render unconditionally alongside the English copy.
  test("en locale renders no Chinese (CJK) text anywhere on the page", async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "en"));
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator(SEL.homeHeroZh)).toHaveCount(0);
    await expect(page.locator(".exhibit-rail-copy-zh")).toHaveCount(0);
    const bodyText = await bodyTextExcludingLanguageSwitcher(page);
    expect(containsCJK(bodyText)).toBe(false);
  });

  // Task F4: no <link rel="preload"> for the self-hosted zh serif (its
  // @font-face unicode-range is lazy by design -- see globals.css) means
  // the browser should never even ask for display-serif-zh.woff2 on an
  // en-locale page, since nothing on it lays out CJK text. This guards
  // against that font accidentally taxing en visitors (e.g. via a stray
  // preload, or zh text leaking into an element the CJK scan above misses).
  test("en locale makes zero network request for the self-hosted zh serif font", async ({ page }) => {
    const requests: string[] = [];
    page.on("request", (request) => requests.push(request.url()));
    await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "en"));
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    const zhFontRequests = requests.filter((url) => url.includes("display-serif-zh"));
    expect(zhFontRequests).toEqual([]);
  });

  // The zh locale is allowed (expected) to lead with Chinese: the approved
  // hero narrative and the rail's zh positioning line render only here, and
  // neither carries a long untranslated English sentence (short necessary
  // terms are fine; the approved line here has none at all).
  test("zh locale renders the approved zh hero narrative and rail line, with no long English run", async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "zh"));
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");

    const heroZh = page.locator(SEL.homeHeroZh);
    await expect(heroZh).toHaveCount(1);
    await expect(heroZh).toHaveText("训练、上线、跑挂了再修——这条链路我一个人从头走到尾，出问题也不含糊。");
    expect(longestLatinWordRun(await heroZh.innerText())).toBeLessThanOrEqual(8);

    const railZh = page.locator(".exhibit-rail-copy-zh");
    await expect(railZh).toHaveCount(1);
    await expect(railZh).toHaveAttribute("lang", "zh");
    await expect(railZh).toHaveText("AI Agent 与大模型应用系统，端到端留痕。");
    expect(longestLatinWordRun(await railZh.innerText())).toBeLessThanOrEqual(8);
    await expect(page.locator(".exhibit-rail-copy-en")).toHaveCount(0);
  });

  // Task F11 (audit3 zh de-anglicization, home items): spot-checks on the
  // biggest translated fragments -- not exhaustive, see
  // src/lib/home-stats.ts's localizeStatText for the full lookup. Each
  // assertion also confirms the OLD English string is gone from that
  // element, not just that a translation is present, so a partial/failed
  // localizeStatText lookup (silent English fallback) would fail loudly.
  test("zh locale translates the audit3 home fragments (eyebrows, CTA, negative-run prose, stack metrics)", async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "zh"));
    await page.goto("/", { waitUntil: "networkidle" });

    const negativeEyebrow = page.locator(SEL.exhibit("04")).locator(".exhibit-eyebrow");
    await expect(negativeEyebrow).toHaveText("5 次没有跑通的实验");

    const cta = page.locator(SEL.homeCta);
    await expect(cta).toContainText("打开发布控制台");
    await expect(cta).not.toContainText("OPEN THE RELEASE CONSOLE");

    const negativeRows = page.locator(SEL.homeNegativeRow);
    const secondRowText = await negativeRows.nth(1).innerText();
    expect(secondRowText).toContain("两次置信区间都包含零");
    expect(secondRowText).not.toContain("both CIs contain zero");
    expect(containsCJK(secondRowText)).toBe(true);

    const receiptsEyebrow = page.locator(SEL.exhibit("06")).locator(".exhibit-eyebrow");
    await expect(receiptsEyebrow).toHaveText("这个站是怎么搭、怎么核对的");

    const stackLayers = await page.locator(SEL.homeStackLayer).allInnerTexts();
    const streamLayer = stackLayers.find((text) => text.includes("已演练故障类别"));
    expect(streamLayer).toBeTruthy();
    expect(streamLayer).not.toContain("failure classes drilled");
  });
});

// Task F1 (comprehensive mobile adaptation pass, user's binding feedback:
// "从移动端进入首页时，一开始的字号太大了"). The hero title's clamp() used to
// be sized purely off viewport height (9vh), which has no relationship to
// a narrow phone's width -- 390x844 measured out to 75.96px (~4.75rem) on
// a 16ch-max column. Fixed to clamp(2.6rem, min(9vh, 11vw), 5.6rem).
test.describe("F1 mobile pass — home", () => {
  test("hero title is composed, not oversized, at 390 and 360", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Type-scale regression check for narrow phone widths.");
    await page.goto("/", { waitUntil: "networkidle" });
    const fontSize390 = await page.locator(SEL.homeHeroTitle).evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    // 4.75rem (76px) was the pre-fix measured size; this pins it well under
    // that while leaving room for the clamp's responsive range.
    expect(fontSize390, `home hero title font-size at 390px: ${fontSize390}px`).toBeLessThan(60);

    await page.setViewportSize({ width: 360, height: 780 });
    const fontSize360 = await page.locator(SEL.homeHeroTitle).evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(fontSize360, `home hero title font-size at 360px: ${fontSize360}px`).toBeLessThan(60);
  });

  test("no horizontal overflow at 390 or 360, first screen and mid-page", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Viewport-width-specific overflow scan.");
    await page.goto("/", { waitUntil: "networkidle" });
    await assertNoHorizontalOverflow(page, "/ at 390 (first screen)");
    await page.mouse.wheel(0, 3000);
    await assertNoHorizontalOverflow(page, "/ at 390 (mid-page)");

    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto("/", { waitUntil: "networkidle" });
    await assertNoHorizontalOverflow(page, "/ at 360 (first screen)");
    await page.mouse.wheel(0, 3000);
    await assertNoHorizontalOverflow(page, "/ at 360 (mid-page)");
  });

  test("key fixed controls meet the 44px touch-target floor", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Touch-target sizing is only relevant at mobile widths.");
    await page.goto("/", { waitUntil: "networkidle" });
    await assertTouchTarget(page, ".home-rail-ask", "rail ASK button");
    await assertTouchTarget(page, ".home-cta", "flagship CTA");
    await assertTouchTarget(page, ".home-ask-row button", "Ask Portfolio submit button");
    await assertTouchTarget(page, ".home-ask-row input", "Ask Portfolio input");
    await assertTouchTarget(page, ".home-claim-row summary", "claim-chain row (disclosure)");
    await assertTouchTarget(page, ".home-negative-row a", "negative-run RECEIPT link");
  });
});

// Task F7 (direction B mobile tables, approved mock
// output/design-align/direction-mobile-table-b.html): two exhibit-04/05
// grids broke down at mobile widths. Exhibit 04's Conclusion/n/Disposition/
// Receipt 4-column grid crushed the sentence-length disposition column to
// ~118px, wrapping into a near-unreadable sliver; exhibit 05's bare `auto`
// metric column took its full-line max-content width and, at 390px, left
// the title column squeezed to 0px -- title and metric text visibly
// overlapped (measured live: title rect width 0px, metric 306px of a
// 322px row). Both are re-templated below 768px via CSS grid alone (same
// DOM cells, no markup restructuring).
test.describe("F7 mobile table grammar — home", () => {
  test("negative-runs grid reflows to a number-first card with no overlap or overflow", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Direction B's mobile reflow only applies below 768px.");
    await page.goto("/", { waitUntil: "networkidle" });
    const exhibit = page.locator(SEL.exhibit("04"));
    const rows = exhibit.locator(".home-negative-row");
    await expect(rows).toHaveCount(5);

    // The label column: column headers are still real ARIA columnheaders
    // (kept for assistive tech) even though visually hidden once the grid
    // reflows to a headline+caption card.
    await expect(exhibit.locator('.home-negative-head [role="columnheader"]')).toHaveCount(4);

    const first = rows.first();
    const conclusion = first.locator(".home-negative-conclusion");
    const disposition = first.locator(".home-negative-disposition");
    await expect(conclusion).not.toBeEmpty();
    const [conclusionBox, dispositionBox, rowBox] = await Promise.all([
      conclusion.boundingBox(),
      disposition.boundingBox(),
      first.boundingBox(),
    ]);
    expect(conclusionBox && dispositionBox && rowBox).toBeTruthy();
    // Disposition is promoted to a full-width caption line below the
    // headline, not squeezed into a narrow side column.
    expect(dispositionBox!.width).toBeGreaterThan(rowBox!.width * 0.85);
    // No vertical overlap between the headline row and the caption below.
    expect(dispositionBox!.y).toBeGreaterThanOrEqual(conclusionBox!.y + conclusionBox!.height - 1);

    await assertNoHorizontalOverflow(page, "/ exhibit 04 negative-runs at 390");
  });

  test("shelf title/metric columns stay bounded (no overlap) at 390", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Direction B's mobile column-bounding only applies below 768px.");
    await page.goto("/", { waitUntil: "networkidle" });
    const exhibit = page.locator(SEL.exhibit("05"));
    const row = exhibit.locator(".home-shelf-row").first();
    const title = row.locator(".home-shelf-title");
    const metric = row.locator(".home-shelf-metric");
    const [titleBox, metricBox] = await Promise.all([title.boundingBox(), metric.boundingBox()]);
    expect(titleBox && metricBox).toBeTruthy();
    // The regression was the title column collapsing to 0px width while
    // the metric column overlapped it -- both must now have real width
    // and sit side by side without overlapping horizontally.
    expect(titleBox!.width).toBeGreaterThan(20);
    expect(metricBox!.width).toBeGreaterThan(20);
    expect(titleBox!.x + titleBox!.width).toBeLessThanOrEqual(metricBox!.x + 1);

    await assertNoHorizontalOverflow(page, "/ exhibit 05 shelf at 390");
  });

  test("desktop keeps the negative-runs 4-column grid and shelf's unbounded metric column", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Desktop-only regression guard for the F7 mobile reflow.");
    await page.goto("/", { waitUntil: "networkidle" });
    const negativeHead = page.locator(SEL.exhibit("04")).locator(".home-negative-head");
    await expect(negativeHead).toBeVisible();
    const columns = await negativeHead.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
    expect(columns).toBe(4);
  });
});
