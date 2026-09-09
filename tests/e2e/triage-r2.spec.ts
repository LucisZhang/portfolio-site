import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { SEL } from "./selectors";
import { bodyTextExcludingLanguageSwitcher, containsCJK, longestLatinWordRun } from "./localePurity";
import { assertNoHorizontalOverflow, assertTouchTarget } from "./mobileAudit";

const ROUTE = "/projects/triage-router";
// Sum of the three real on-site file sizes the RUN button advertises
// (spec section 6.3): model.int8.onnx (67,575,183) + tokenizer.json
// (711,494) + ort-wasm-simd-threaded.wasm (13,479,978), measured after
// copying/syncing the real files -- see docs/evidence/digits-triage.md and
// heavy-assets.json's "/projects/triage-router" entry.
const TOTAL_MODEL_BYTES = "81766655";
const HEAVY_ASSET_PATTERN = /model\.int8\.onnx|ort-wasm-simd-threaded\.(wasm|mjs)/i;

test("public source receipt uses the Triage Router name and a repository-relative command", async ({ page }) => {
  await page.goto(ROUTE, { waitUntil: "networkidle" });
  const receipts = page.locator(SEL.exhibit("05"));
  await expect(receipts).toContainText("Triage Router's export_site_payloads.py");
  await expect(receipts.locator(".triage-reproduce-command code")).toHaveText(
    "python scripts/export_site_payloads.py --out public/case-studies/triage-router",
  );
  await expect(receipts).not.toContainText("nlp-eval-lab");
  await expect(receipts).not.toContainText("/Users/");
});

test("misroute and monthly costs use the recorded USD basis with accessible ranges", async ({ page }) => {
  await page.goto(ROUTE, { waitUntil: "networkidle" });
  const terminal = page.locator(SEL.exhibit("01")).locator("[data-triage-terminal]");
  const misroute = terminal.locator("[data-misroute-slider]");
  const threshold = terminal.locator("[data-threshold-slider]");

  await expect(terminal.locator("[data-misroute-value]")).toContainText(/^USD /);
  await expect(misroute).toHaveAttribute("aria-valuetext", /USD .*recorded range USD .* to USD/);
  await expect(threshold).toHaveAttribute("aria-valuetext", /recorded range .* to/);
  await expect(terminal.locator(`#${await misroute.getAttribute("aria-describedby")}`)).toContainText(/^Recorded sensitivity range: USD .* — USD/);
  await expect(terminal.locator(`#${await threshold.getAttribute("aria-describedby")}`)).toContainText(/^Recorded threshold range: .* —/);
  await expect(terminal.locator('[data-drawer] summary').last()).toContainText("monthly cost (USD / 1k)");
  await expect(terminal).not.toContainText(/CNY|monthlyCostCny|misrouteCostCny/);

  await misroute.fill(await misroute.getAttribute("max") ?? "0");
  await expect(misroute).toHaveAttribute("aria-valuetext", /USD 24\.00 misroute-cost sensitivity/);
  await expect(terminal.locator("[data-misroute-value]")).toHaveText("USD 24.00");
  await threshold.fill("0");
  await expect(terminal.locator("[data-strategy-card]")).toContainText("USD");
});

test.describe("Triage Router first screen (zero heavy assets)", () => {
  // Task W2 (Option B, user ruling): the hero's right column no longer has
  // an interactive instrument -- it is now a naked frontier figure (see the
  // "hero right column" describe block below). Dragging the slider and
  // watching the strategy-card text change with zero network requests is
  // now exclusively a property of the full instrument (exhibit 01), so this
  // test moved there instead of reading the hero's SEL.instrument. It also
  // no longer skips on mobile: exhibit 01's full instrument renders (and is
  // interactive) at every viewport width, unlike the old hero-only compact
  // instrument this test used to scope to desktop.
  test("dragging exhibit 01's slider changes the strategy-card text with zero network requests", async ({ page }) => {
    await page.goto(ROUTE, { waitUntil: "networkidle" });

    const full = page.locator(SEL.exhibit("01"));
    const card = full.locator("[data-strategy-card]");
    const before = await card.innerText();

    const requests: string[] = [];
    page.on("request", (request) => requests.push(request.url()));

    const thresholdSlider = full.locator("[data-threshold-slider]");
    const max = await thresholdSlider.getAttribute("max");
    await thresholdSlider.fill(String(max));

    await expect(card).not.toHaveText(before);
    expect(requests).toEqual([]);
  });

  test("misroute sensitivity follows a fractional pointer drag, then settles on a recorded stop", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Pointer geometry is covered at the desktop review size.");
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    const full = page.locator(SEL.exhibit("01"));
    const slider = full.locator("[data-misroute-slider]");
    const frontier = full.locator("[data-frontier-chart] .triage-frontier-line");
    await page.mouse.wheel(0, 40);
    await expect(page.locator(".exhibit-shell")).toHaveClass(/rail-collapsed/);
    await expect(page.locator("main#main-content")).toHaveCSS("margin-left", "0px");
    await slider.scrollIntoViewIfNeeded();

    const beforePath = await frontier.getAttribute("points");
    const box = await slider.boundingBox();
    expect(box).not.toBeNull();
    const max = Number(await slider.getAttribute("max"));
    const current = Number(await slider.inputValue());
    const targets = current > max / 2 ? [current - .45, current - .9, 1.6] : [current + .45, current + .9, max - 1.6];
    const usableWidth = box!.width - 18;
    const xFor = (value: number) => box!.x + 9 + (usableWidth * value) / max;
    const y = box!.y + box!.height / 2;
    await page.mouse.move(xFor(current), y);
    await page.mouse.down();
    const dragValues: number[] = [];
    const dragPaths: string[] = [];
    for (const target of targets) {
      await page.mouse.move(xFor(target), y, { steps: 4 });
      dragValues.push(Number(await slider.inputValue()));
      dragPaths.push(await frontier.getAttribute("points") ?? "");
    }

    const during = dragValues.at(-1)!;
    expect(Math.abs(during - Math.round(during))).toBeGreaterThan(.05);
    expect(new Set(dragValues.map((value) => value.toFixed(2))).size).toBeGreaterThanOrEqual(3);
    expect(new Set([beforePath ?? "", ...dragPaths]).size).toBeGreaterThanOrEqual(3);
    await page.mouse.up();

    const settled = Math.round(during);
    await expect.poll(async () => Number(await slider.inputValue()), { timeout: 1_000 }).toBe(settled);
    await expect(full.locator(".triage-slider-ticks i")).toHaveCount(max + 1);
  });

  test("misroute keyboard moves animate through intermediate values and reduced motion snaps immediately", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "The motion contract only needs one desktop browser.");
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    const slider = page.locator(SEL.exhibit("01")).locator("[data-misroute-slider]");
    await slider.focus();
    const start = Math.round(Number(await slider.inputValue()));
    const max = Number(await slider.getAttribute("max"));
    const key = start < max ? "ArrowRight" : "ArrowLeft";
    const target = start + (key === "ArrowRight" ? 1 : -1);
    await slider.evaluate((node) => {
      const state = window as Window & { __triageRangeFrames?: string[] };
      state.__triageRangeFrames = [];
      let frames = 0;
      const capture = () => {
        state.__triageRangeFrames!.push((node as HTMLInputElement).value);
        frames += 1;
        if (frames < 20) requestAnimationFrame(capture);
      };
      requestAnimationFrame(capture);
    });
    await page.keyboard.press(key);
    await expect.poll(async () => Number(await slider.inputValue()), { timeout: 1_000 }).toBe(target);
    const animatedFrames = await page.evaluate(() => (window as Window & { __triageRangeFrames?: string[] }).__triageRangeFrames ?? []);
    expect(new Set(animatedFrames).size).toBeGreaterThan(3);

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.keyboard.press("End");
    await expect(slider).toHaveValue(String(max));
    await page.keyboard.press("Home");
    await expect(slider).toHaveValue("0");
    await page.keyboard.press("PageUp");
    await expect(slider).toHaveValue("1");
    await page.keyboard.press("PageDown");
    await expect(slider).toHaveValue("0");
  });

  test("misroute range authors circular 18px thumbs for WebKit and Mozilla range engines", async ({ page }) => {
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    const thumbRules = await page.evaluate(() => {
      const found: Array<{ selector: string; radius: string; width: string; height: string }> = [];
      const visit = (rules: CSSRuleList) => {
        for (const rule of Array.from(rules)) {
          if (rule instanceof CSSStyleRule && rule.selectorText.includes("triage-slider-row") && rule.selectorText.includes("slider-thumb") && !rule.selectorText.includes(":active") && !rule.selectorText.includes(":focus-visible")) {
            found.push({ selector: rule.selectorText, radius: rule.style.borderRadius, width: rule.style.width, height: rule.style.height });
          }
          if ("cssRules" in rule) visit((rule as CSSGroupingRule).cssRules);
        }
      };
      for (const sheet of Array.from(document.styleSheets)) {
        try { visit(sheet.cssRules); } catch { /* only same-origin site CSS is inspected */ }
      }
      return found;
    });
    expect(thumbRules.some((rule) => rule.selector.includes("webkit") && rule.radius === "50%" && rule.width === "18px" && rule.height === "18px")).toBe(true);
    const authoredCss = readFileSync(path.resolve(__dirname, "../../src/components/triage/triage.css"), "utf8");
    expect(authoredCss).toMatch(/::-moz-range-thumb\s*\{[\s\S]*?width:\s*18px;[\s\S]*?height:\s*18px;[\s\S]*?border-radius:\s*50%;/);
  });

  test("initial load requests no heavy asset (onnx/wasm) before any interaction", async ({ page }) => {
    const requests: string[] = [];
    page.on("request", (request) => requests.push(request.url()));
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    const heavy = requests.filter((url) => HEAVY_ASSET_PATTERN.test(url));
    expect(heavy).toEqual([]);
  });
});

// Task W2 (Option B, user ruling): the hero right column keeps ONLY the
// naked frontier curve -- the hairline cost-accuracy curve + the single
// vermilion point, as a pure figure. No sliders, no strategy card, no
// terminal chrome in the hero; that interaction lives exclusively in the
// full instrument (exhibit 01) below, unchanged. Approved mock:
// output/design-align-r4/triage-hero-b.html.
test.describe("Triage Router hero right column (naked frontier figure, Option B)", () => {
  test("hero shows only the static frontier figure — no sliders, no strategy card, no instrument frame", async ({ page }, testInfo) => {
    // Unchanged rule from the old compact instrument: the right column is
    // CSS-hidden below 1180px (triage.css), so this is only meaningful at
    // desktop width.
    test.skip(testInfo.project.name !== "desktop", "The hero right column only renders at desktop width (>=1180px).");
    await page.goto(ROUTE, { waitUntil: "networkidle" });

    const hero = page.locator("#hero"); // TriagePage.tsx's hero section id
    await expect(hero.locator("[data-hero-figure]")).toBeVisible();
    await expect(hero.locator("[data-frontier-chart]")).toBeVisible();

    // Nothing interactive and no instrument chrome in the hero.
    await expect(hero.locator("[data-instrument]")).toHaveCount(0);
    await expect(hero.locator("input[type=range]")).toHaveCount(0);
    await expect(hero.locator("[data-strategy-card]")).toHaveCount(0);
    await expect(hero.locator("[data-run-model]")).toHaveCount(0);

    // The figure still carries the real default operating point (same
    // default the full instrument opens on) as its caption/fineprint, not a
    // hardcoded string.
    const caption = hero.locator("figcaption");
    await expect(caption).toContainText(/Tier frontier · \d+ thresholds/);
    await expect(caption).toContainText(/macro-F1 0\.\d{3}/);
    await expect(hero.locator(".triage-hero-figure-fineprint")).not.toBeEmpty();
  });

  test("hero figure is hidden below 1180px, same rule the old compact instrument followed", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Only meaningful at a viewport narrower than the 1180px breakpoint.");
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    await expect(page.locator("#hero [data-hero-figure]")).toBeHidden();
  });

  test("hero figure renders with no JavaScript (server-rendered, not client-gated)", async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "The hero right column only renders at desktop width (>=1180px).");
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });
    await expect(page.locator("#hero [data-frontier-chart]")).toBeVisible();
    await context.close();
  });
});

test.describe("Triage Router local inference (second step)", () => {
  test("RUN button advertises the exact ledger byte sum", async ({ page }) => {
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    const runButton = page.locator(SEL.exhibit("01")).locator("[data-run-model]");
    await expect(runButton).toBeVisible();
    await expect(runButton).toHaveAttribute("data-bytes", TOTAL_MODEL_BYTES);

    // The three per-file numbers that sum to the total are also
    // individually registered (verify-heavy-assets.mjs cross-checks these
    // literal data-asset/data-bytes pairs against heavy-assets.json).
    const manifestItems = page.locator("[data-model-manifest] li");
    await expect(manifestItems).toHaveCount(3);
    const bytesSum = await manifestItems.evaluateAll((items) =>
      items.reduce((sum, item) => sum + Number(item.getAttribute("data-bytes")), 0),
    );
    expect(String(bytesSum)).toBe(TOTAL_MODEL_BYTES);
  });

  test("no onnx/wasm request before click; clicking RUN begins the fetch", async ({ page }) => {
    const requests: string[] = [];
    page.on("request", (request) => requests.push(request.url()));
    await page.goto(ROUTE, { waitUntil: "networkidle" });

    expect(requests.some((url) => HEAVY_ASSET_PATTERN.test(url))).toBe(false);

    // Abort the heavy downloads instead of letting 82 MB actually transfer
    // in the test -- the assertion only needs proof the request FIRED.
    await page.route(/tokenizer\.json|model\.int8\.onnx|ort/, (route) => route.abort());

    const runButton = page.locator(SEL.exhibit("01")).locator("[data-run-model]");
    const [request] = await Promise.all([
      page.waitForRequest((req) => /model\.int8\.onnx|tokenizer\.json/i.test(req.url())),
      runButton.click(),
    ]);
    expect(/model\.int8\.onnx|tokenizer\.json/i.test(request.url())).toBe(true);
  });

  test("a failing load falls back to the recorded state without an error dialog", async ({ page }) => {
    const browserErrors: string[] = [];
    page.on("pageerror", (error) => browserErrors.push(error.message));
    await page.goto(ROUTE, { waitUntil: "networkidle" });

    // Mocks the 20s-timeout outcome without waiting 20s: any load failure
    // (network abort here, an actual client-side timeout in production)
    // takes the same catch path to the "timeout" fallback state.
    await page.route(/tokenizer\.json/, (route) => route.abort());

    const runButton = page.locator(SEL.exhibit("01")).locator("[data-run-model]");
    await runButton.click();

    const inference = page.locator("[data-local-inference]");
    await expect(inference).toHaveAttribute("data-state", "timeout", { timeout: 10000 });
    await expect(page.locator("[data-fallback-note]")).toBeVisible();
    // No JS dialog / uncaught error is raised on this path.
    expect(browserErrors).toEqual([]);
    // The recorded compare row (from samples.curated.json) is still on the
    // page regardless of the failed local attempt -- "falls back to the
    // recorded state" is the page's steady state, not a special view.
    await expect(page.locator("[data-strategy-card]").first()).not.toBeEmpty();
  });
});

test("projects.ts no longer links the retired GitHub Pages demo", async ({ page }) => {
  const source = readFileSync(path.resolve(__dirname, "../../src/lib/projects.ts"), "utf8");
  expect(source).not.toContain("luciszhang.github.io");

  await page.goto(ROUTE, { waitUntil: "networkidle" });
  await expect(page.locator('a[href*="luciszhang.github.io"]')).toHaveCount(0);
});

test("Triage Router renders with no JavaScript: exhibits 01-04 show real static content", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

  // 01: instrument's strategy card and frontier chart render without JS
  // (the "use client" component's initial render is still server-rendered
  // HTML -- no useEffect gates this content).
  await expect(page.locator(SEL.exhibit("01")).locator("[data-strategy-card]")).not.toBeEmpty();
  await expect(page.locator(SEL.exhibit("01")).locator("[data-frontier-chart]")).toBeVisible();
  // The RUN button itself is present but inert without JS (no onclick can
  // fire) -- it must not silently disappear.
  await expect(page.locator(SEL.exhibit("01")).locator("[data-run-model]")).toBeVisible();

  // 02: known-failures static table, 8 real rows.
  await expect(page.locator(SEL.exhibit("02")).locator("[data-known-failures] tbody tr")).toHaveCount(8);

  // 03: tier frontier static table, 8 real rows (one per recorded tier).
  await expect(page.locator(SEL.exhibit("03")).locator("[data-pareto-table] tbody tr")).toHaveCount(8);

  // 04: drift static table -- 4 measured rows + 1 pending row (Tier B1,
  // rendered as unmeasured, never a fabricated value), all server-rendered.
  const driftRows = page.locator(SEL.exhibit("04")).locator("[data-drift-table] [data-drift-row]");
  await expect(driftRows).toHaveCount(5);
  await expect(page.locator(SEL.exhibit("04")).locator('[data-drift-row][data-tier="tier_b1"][data-drift-pending="true"]')).toContainText(/PENDING/);

  await context.close();
});

test("en Triage Router renders no Chinese (CJK) text anywhere on the page", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "en"));
  await page.goto(ROUTE, { waitUntil: "networkidle" });
  await expect(page.locator(SEL.cnGloss)).toHaveCount(0);
  await expect(page.locator(".exhibit-rail-copy-zh")).toHaveCount(0);
  await expect(page.locator(".exhibit-rail-copy-en")).toHaveCount(1);
  const bodyText = await bodyTextExcludingLanguageSwitcher(page);
  expect(containsCJK(bodyText)).toBe(false);
});

test("zh Triage Router renders the independently-written zh disclosure with no long English run", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "zh"));
  await page.goto(ROUTE, { waitUntil: "networkidle" });

  const gloss = page.locator(SEL.cnGloss).first();
  await expect(gloss).toHaveCount(1);
  expect(longestLatinWordRun(await gloss.innerText())).toBeLessThanOrEqual(8);

  const disclosure = page.locator("[data-disclosure]");
  await expect(disclosure).toBeVisible();
  expect(containsCJK(await disclosure.innerText())).toBe(true);
  expect(longestLatinWordRun(await disclosure.innerText())).toBeLessThanOrEqual(8);

  await expect(page.locator(".exhibit-rail-copy-en")).toHaveCount(0);
});

// Task F11 (audit3 zh de-anglicization, triage(12)): the recorded-misroute
// attribution sentences (KnownFailures.tsx's formatAttribution) rebuild in
// Chinese for zh, keeping the tier/slug identifiers (tier_b2,
// deposit_account, ...) as embedded data per audit3 -- they are recorded
// routing/label identifiers, not prose.
test("zh Triage Router translates the audit3 misroute attribution sentences", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "zh"));
  await page.goto(ROUTE, { waitUntil: "networkidle" });

  const attributions = page.locator(".triage-known-failures-attribution li");
  await expect(attributions.first()).toBeVisible();
  const firstText = await attributions.first().innerText();
  expect(firstText).toContain("把这条投诉路由到了");
  expect(firstText).toContain("置信度");
  expect(firstText).toContain("实际记录的标签是");
  expect(firstText).not.toContain("routed this complaint");
  expect(containsCJK(firstText)).toBe(true);
});

test("sample drawer computes stop/escalate against the current threshold, not a fixed value", async ({ page }) => {
  await page.goto(ROUTE, { waitUntil: "networkidle" });
  const full = page.locator(SEL.exhibit("01"));

  // Push the confidence threshold to its maximum: every Tier A sample's
  // confidence in samples.curated.json is below 1.0, so all three must
  // read as ESCALATES at the top of the range.
  const thresholdSlider = full.locator("[data-threshold-slider]");
  const max = await thresholdSlider.getAttribute("max");
  await thresholdSlider.fill(String(max));

  const drawer = full.locator("[data-drawer]").first();
  await drawer.locator("summary").click();
  const routes = drawer.locator("[data-drawer-sample]");
  await expect(routes).toHaveCount(3);
  const values = await routes.evaluateAll((items) => items.map((item) => item.getAttribute("data-route")));
  expect(values.every((value) => value === "escalate")).toBe(true);
});

test.describe("Triage Router drift exhibit (04)", () => {
  test("selecting a legend tier turns its line vermilion (ink ramp otherwise)", async ({ page }) => {
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    const exhibit = page.locator(SEL.exhibit("04"));

    // Exactly one measured series is selected on load, and it is not
    // necessarily the one this test is about to click -- so read the
    // starting selection instead of assuming which tier it is.
    const legendButtons = exhibit.locator("[data-drift-legend-item]");
    await expect(legendButtons).toHaveCount(4);

    const target = exhibit.locator('[data-drift-legend-item="tier_c_sonnet"]');
    await target.click();
    await expect(target).toHaveAttribute("aria-selected", "true");
    const selectedSeries = exhibit.locator('[data-drift-series="tier_c_sonnet"]');
    await expect(selectedSeries).toHaveAttribute("data-selected", "true");
    // CI whiskers are drawn only for the selected series.
    await expect(selectedSeries.locator(".triage-drift-whisker")).toHaveCount(5);

    const otherButton = exhibit.locator('[data-drift-legend-item="tier_a"]');
    await expect(otherButton).toHaveAttribute("aria-selected", "false");
    const otherSeries = exhibit.locator('[data-drift-series="tier_a"]');
    await expect(otherSeries).toHaveAttribute("data-selected", "false");
    await expect(otherSeries.locator(".triage-drift-whisker")).toHaveCount(0);
  });

  test("Tier B1 renders as an unmeasured pending tier, never a fabricated line", async ({ page }) => {
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    const exhibit = page.locator(SEL.exhibit("04"));
    // Tier B1 has no clickable legend chip (nothing to select -- it has no
    // line at all) and is instead a plain, visibly-labeled pending entry.
    await expect(exhibit.locator('[data-drift-legend-item="tier_b1"]')).toHaveCount(0);
    await expect(exhibit.locator('[data-drift-legend-pending="tier_b1"]')).toContainText(/UNMEASURED/);
    await expect(exhibit.locator('[data-drift-series="tier_b1"]')).toHaveCount(0);
  });
});

// Fix round 1 (review finding, Important, "PREFERRED fix"): LOCAL inference
// had never been checked against the real Python int8 reference. This test
// runs the actual RUN button (real ~82 MB download against the local
// public/models/triage-tier-b2 files this task copies on-site -- NOT
// mocked, unlike the other LocalInference tests above, which deliberately
// abort the download to stay fast) and compares the three rendered LOCAL
// predictions against public/case-studies/triage-router/
// python_int8_curated.json's recorded Python int8 predictions for the same
// three complaint ids. Desktop only, generous timeout: a real model
// download + WASM warm-up is slow and viewport-independent.
test("LOCAL WASM predictions match the Python int8 reference for the 3 curated samples", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "One real model download is enough to prove parity; no need to repeat per viewport.");
  test.setTimeout(120000);

  const fixture = JSON.parse(readFileSync(
    path.resolve(__dirname, "../../public/case-studies/triage-router/python_int8_curated.json"),
    "utf8",
  )) as { predictions: { complaint_id: number; label: string; p_max: number }[] };
  const referenceById = new Map(fixture.predictions.map((prediction) => [prediction.complaint_id, prediction]));

  await page.goto(ROUTE, { waitUntil: "networkidle" });
  const runButton = page.locator(SEL.exhibit("01")).locator("[data-run-model]");
  await runButton.click();

  const inference = page.locator("[data-local-inference]");
  // Real download + tokenizer/session warm-up + 3 sequential inferences.
  await expect(inference).toHaveAttribute("data-state", "ready", { timeout: 110000 });

  const parityRows = page.locator("[data-parity-row]");
  await expect(parityRows).toHaveCount(3);

  const rendered = await parityRows.evaluateAll((rows) =>
    rows.map((row) => ({
      complaintId: Number(row.getAttribute("data-complaint-id")),
      label: row.querySelector("[data-local-label]")?.textContent ?? "",
      pMax: Number(row.querySelector("[data-local-pmax]")?.textContent ?? "NaN"),
    })),
  );

  expect(rendered).toHaveLength(3);
  for (const row of rendered) {
    const reference = referenceById.get(row.complaintId);
    expect(reference, `no Python reference prediction for complaint ${row.complaintId}`).toBeTruthy();
    expect(row.label, `label mismatch for complaint ${row.complaintId}`).toBe(reference!.label);
    // Reference provenance (python_int8_curated.json's own
    // batching_sensitivity note) records up to ~0.018 max abs probability
    // delta between legitimate batching/padding variants of the SAME
    // model; this browser call matches the reference's own batch_size=1/
    // no-padding condition exactly, so a tight but non-zero tolerance
    // catches a real regression without chasing float32/wasm-vs-Python
    // rounding noise.
    expect(Math.abs(row.pMax - reference!.p_max), `p_max mismatch for complaint ${row.complaintId}`).toBeLessThan(0.02);
  }
});

// Task F1 (comprehensive mobile adaptation pass, spec §2.5).
test.describe("F1 mobile pass — Triage Router", () => {
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

  // Task F1: the pareto/drift tables (exhibits 03/04) are genuine
  // multi-column matrices (macro-F1+CI per tier, or 5 measured periods per
  // tier) that don't reduce to a single comparable pair -- they keep the
  // .triage-table-scroll horizontal-scroll pattern (overflow-x: auto),
  // matching forge.css's pre-existing pattern.
  test("pareto/drift matrices scroll within their own wrapper instead of overflowing the page", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Only relevant once the table's min-width exceeds a mobile viewport.");
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    // Task F7: exhibit 02's own .triage-table-scroll is display:none at
    // mobile widths now (replaced by the aligned-pair ledger below), so
    // this scan is scoped to exhibits 03/04's wrappers specifically.
    const wraps = page.locator('[data-exhibit="03"] .triage-table-scroll, [data-exhibit="04"] .triage-table-scroll');
    await expect(wraps).toHaveCount(2);
    for (const wrap of await wraps.all()) {
      await wrap.scrollIntoViewIfNeeded();
      const overflowX = await wrap.evaluate((el) => getComputedStyle(el).overflowX);
      expect(overflowX).toBe("auto");
      const scrollable = await wrap.evaluate((el) => el.scrollWidth > el.clientWidth);
      expect(scrollable, "pareto/drift table should be wider than its wrapper at a 390px viewport").toBe(true);
    }
  });

  // Task F7 (direction B mobile tables, approved mock
  // output/design-align/direction-mobile-table-b.html): exhibit 02's
  // known-failures table is text/sentence-adjacent enough (a 5-6 hop route
  // chain, two label columns readers directly compare) that a horizontal
  // scroll was the wrong mobile answer -- it is replaced below 768px by an
  // aligned two-column ledger (predicted/truth stay columnar; complaint
  // id/confidence/route are demoted to a quiet meta line).
  test("known-failures table becomes an aligned two-column ledger with no horizontal overflow", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Direction B's mobile-only ledger only renders below 768px.");
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    const exhibit = page.locator(SEL.exhibit("02"));

    // The desktop table is present in the DOM (no-JS static markup) but
    // hidden at mobile widths -- the ledger takes over visually.
    await expect(exhibit.locator(".triage-table-scroll")).toBeHidden();
    const ledger = exhibit.locator("[data-known-failures-pairs]");
    await expect(ledger).toBeVisible();

    // The label column: one head row with the two comparable column
    // labels (predicted/truth), present as real ARIA columnheaders.
    await expect(ledger.locator('[role="columnheader"]')).toHaveCount(2);

    // All 8 real entries render as a pair row plus a demoted meta line
    // carrying the complaint id, confidence, and route chain.
    const entries = ledger.locator("[data-pair-row]");
    await expect(entries).toHaveCount(8);
    const first = entries.first();
    await expect(first.locator(".triage-pair-meta")).toContainText(/conf 0\.\d{3}/);
    await expect(first.locator(".triage-pair-read")).not.toBeEmpty();
    await expect(first.locator(".triage-pair-truth")).not.toBeEmpty();

    await assertNoHorizontalOverflow(page, `${ROUTE} exhibit 02 ledger at 390`);
  });

  test("desktop keeps the real 5-column known-failures table, ledger hidden", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Desktop-only regression guard for the F7 mobile-ledger toggle.");
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    const exhibit = page.locator(SEL.exhibit("02"));
    await expect(exhibit.locator(".triage-table-scroll")).toBeVisible();
    await expect(exhibit.locator("[data-known-failures] tbody tr")).toHaveCount(8);
    await expect(exhibit.locator("[data-known-failures-pairs]")).toBeHidden();
  });

  test("sliders, the local-inference button, and COPY meet the 44px touch-target floor", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Touch-target sizing is only relevant at mobile widths.");
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    // Both the compact hero instrument (display:none <1180px) and the
    // "full" exhibit-01 instrument render a slider pair -- :visible scopes
    // this to the one actually on-screen at a mobile viewport.
    const sliders = page.locator(".triage-slider-row input[type=range]:visible");
    await expect(sliders).toHaveCount(2);
    for (const slider of await sliders.all()) {
      const box = await slider.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height, `slider height ${box!.height}px`).toBeGreaterThanOrEqual(44);
    }
    await page.locator(".triage-syntax-line button:visible").first().scrollIntoViewIfNeeded();
    await assertTouchTarget(page, ".triage-syntax-line button:visible", "COPY button");
  });
});

// Task W3 (RAIL-SCOPE.md verdict "尚可" -- auto-rail v3 adopted, with a
// hero-grid max-width cap so the composition doesn't drift as the rail
// pushes/retracts). Generic auto-rail mechanic behavior (entry-open,
// retract-on-scroll, hot-zone reveal, Esc, reduced motion, no-JS) is
// covered once against the content-independent dev fixture in
// exhibition-shell.spec.ts; this is the page-specific wiring check plus
// the width-cap regression guard the doc's recommendation exists for.
test.describe("Triage Router auto-rail v3 (task W3)", () => {
  test("rail is auto-mode, entry-open, and the hero-grid width cap holds with the rail retracted", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Auto-rail v3 is desktop/tablet only (>=980px).");
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    await expect(page.locator(".exhibit-shell")).toHaveAttribute("data-rail-mode", "auto");
    await expect(page.locator(".exhibit-shell")).not.toHaveClass(/rail-collapsed/);

    // Retract (entry-mode's accumulated-scroll dismissal), then confirm the
    // hero grid stays at its 1180px cap rather than stretching to fill the
    // freed width -- the exact drift RAIL-SCOPE.md flagged for this page.
    await page.mouse.wheel(0, 40);
    await expect(page.locator(".exhibit-shell")).toHaveClass(/rail-collapsed/);
    const heroGridWidth = await page.locator(".triage-hero-grid").evaluate((el) => el.getBoundingClientRect().width);
    expect(heroGridWidth).toBeLessThanOrEqual(1180.5);
  });

  // Task D-03: the content column re-centers in whatever canvas the rail
  // leaves behind. Measured against <main>'s own box (which is what the
  // rail pushes), the exhibit-01 body must sit with equal left/right
  // gutters in BOTH rail states, never overflow, and keep the 1180px cap.
  // 1440x1000 and 1024x768 are the two rail widths (260px / 208px); the
  // mobile project's own overflow test covers the no-rail 390 state.
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 1024, height: 768 }]) {
    test(`content column stays centered in <main> with the rail open and retracted at ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "desktop", "The viewport is set explicitly below; one browser project is enough.");
      await page.setViewportSize(viewport);
      await page.goto(ROUTE, { waitUntil: "networkidle" });
      const shell = page.locator(".exhibit-shell");
      await expect(shell).toHaveAttribute("data-rail-mode", "auto");
      await expect(shell).not.toHaveClass(/rail-collapsed/);

      const open = await measureTriageColumn(page);
      expect(open.overflow, "rail open: no horizontal overflow").toBe(false);
      expect(Math.abs(open.leftGutter - open.rightGutter), "rail open: symmetric gutters").toBeLessThanOrEqual(1);
      expect(open.heroWidth).toBeLessThanOrEqual(1180.5);
      expect(Math.abs(open.circuitContentLeft - open.columnLeft), "rail open: circuit strip sits on the column's left edge").toBeLessThanOrEqual(1);

      await page.mouse.wheel(0, 40);
      await expect(shell).toHaveClass(/rail-collapsed/);
      await expect.poll(async () => (await measureTriageColumn(page)).mainLeft, { message: "main's push margin has finished animating to 0" }).toBe(0);

      const collapsed = await measureTriageColumn(page);
      expect(collapsed.overflow, "rail retracted: no horizontal overflow").toBe(false);
      expect(Math.abs(collapsed.leftGutter - collapsed.rightGutter), "rail retracted: symmetric gutters").toBeLessThanOrEqual(1);
      expect(collapsed.heroWidth).toBeLessThanOrEqual(1180.5);
      expect(Math.abs(collapsed.circuitContentLeft - collapsed.columnLeft), "rail retracted: circuit strip sits on the column's left edge").toBeLessThanOrEqual(1);
      // The column followed the canvas: its left edge moved toward the
      // viewport's left as the rail left, and its gutter did not shrink
      // (at 1440 it grows from the 7vw gutter to the centering gutter).
      expect(collapsed.columnLeft).toBeLessThan(open.columnLeft);
      expect(collapsed.leftGutter).toBeGreaterThanOrEqual(open.leftGutter - 0.5);
    });
  }
});

async function measureTriageColumn(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const main = document.querySelector(".exhibit-shell > main")!.getBoundingClientRect();
    const column = document.querySelector("#exhibit-01 > .exhibit-body")!.getBoundingClientRect();
    const hero = document.querySelector(".triage-hero-grid")!.getBoundingClientRect();
    const circuit = document.querySelector(".exhibit-shell > main > .circuit-top")!;
    const circuitLeft = circuit.getBoundingClientRect().left + parseFloat(getComputedStyle(circuit).paddingLeft);
    return {
      mainLeft: main.left,
      columnLeft: column.left,
      circuitContentLeft: circuitLeft,
      leftGutter: column.left - main.left,
      rightGutter: main.right - column.right,
      heroWidth: hero.width,
      overflow: document.documentElement.scrollWidth > window.innerWidth,
    };
  });
}

// Task D-03: exhibit 01 reads in four labelled steps, in DOM order (so the
// single-column mobile form and the two-column desktop form share one
// reading order), and the CURRENT READING ledger has no per-cell fill --
// the former paper-bright cells were the "coarse row of bordered cells".
test("exhibit 01 reads control -> current reading -> interpretation -> detail, as a hairline ledger with no filled cells", async ({ page }) => {
  await page.goto(ROUTE, { waitUntil: "networkidle" });
  const terminal = page.locator(SEL.exhibit("01")).locator("[data-triage-terminal]");
  const steps = await terminal.locator(":scope > [data-step]").evaluateAll((els) => els.map((el) => el.getAttribute("data-step")));
  expect(steps).toEqual(["control", "reading", "interpretation", "detail"]);

  await expect(terminal.locator('[data-step="control"] input[type=range]')).toHaveCount(2);
  await expect(terminal.locator('[data-step="control"] [data-frontier-chart]')).toHaveCount(1);
  await expect(terminal.locator('[data-step="reading"] [data-drawer]')).toHaveCount(4);
  await expect(terminal.locator('[data-step="reading"] [data-drawer] > summary[data-drawer-summary]')).toHaveCount(4);
  await expect(terminal.locator('[data-step="interpretation"] [data-strategy-card]')).toHaveCount(1);
  await expect(terminal.locator('[data-step="interpretation"] [data-copy-syntax]')).toHaveCount(1);
  await expect(terminal.locator('[data-step="detail"] [data-disclosure]')).toHaveCount(1);
  await expect(terminal.locator('[data-step="detail"] [data-run-model]')).toHaveCount(1);

  const fills = await terminal.locator("[data-drawer]").evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundColor));
  for (const fill of fills) expect(fill, "readout rows carry no fill").toBe("rgba(0, 0, 0, 0)");
  const rules = await terminal.locator("[data-drawer]").evaluateAll((els) => els.map((el) => getComputedStyle(el).borderTopWidth));
  for (const rule of rules) expect(rule, "readout rows are hairline-ruled").toBe("1px");
});
