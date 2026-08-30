import { expect, test } from "@playwright/test";
import { SEL } from "./selectors";
import { assertNoHorizontalOverflow, assertTouchTarget } from "./mobileAudit";

// Task 0.4: ExhibitShell + rail dual-mode + exhibit primitives (spec §2.1/§2.5).
// Exercised against a dev-only fixture page that stands up every background
// variant, all four Finding kinds, and a StatGrid checkerboard so this suite
// can assert the frozen component contract without depending on any real
// page having been migrated onto ExhibitShell yet.

test.describe("exhibition shell", () => {
  test("exactly one rail; exhibits anchored; each exhibit carries data-bg", async ({ page }) => {
    await page.goto("/dev/exhibition-fixture");
    await expect(page.locator(SEL.rail)).toHaveCount(1);
    await expect(page.locator(SEL.exhibit("01"))).toBeVisible();
    await expect(page.locator(SEL.exhibit("00"))).toHaveAttribute("data-bg", "paper");
    await expect(page.locator(SEL.exhibit("01"))).toHaveAttribute("data-bg", "ink");
    await expect(page.locator(SEL.exhibit("02"))).toHaveAttribute("data-bg", "white");
    await expect(page.locator(SEL.exhibit("03"))).toHaveAttribute("data-bg", "paper-alt");
  });

  test("Finding renders all four kinds with default labels and no colored background", async ({ page }) => {
    await page.goto("/dev/exhibition-fixture");
    const negative = page.locator('[data-finding="negative"]').first();
    const limitation = page.locator('[data-finding="limitation"]').first();
    const note = page.locator('[data-finding="note"]').first();
    const pass = page.locator('[data-finding="pass"]').first();
    await expect(negative).toContainText("NEGATIVE RESULT");
    await expect(limitation).toContainText("LIMITATION");
    await expect(note).toContainText("NOTE");
    await expect(pass).toContainText("PASS");
    for (const finding of [negative, limitation, note, pass]) {
      const bg = await finding.evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(["rgba(0, 0, 0, 0)", "transparent"]).toContain(bg);
    }
  });

  // Task F10 (box-grammar ruling): equivalent-or-stronger replacement for
  // the retired "StatGrid renders a checkerboard of cells" test — the
  // checkerboard (per-cell background fill over a 1px hairline-gap grid)
  // is gone (F8 audit finding 1), replaced by a typographic stat row with
  // a single hairline rule above it and no per-cell fill. Still asserts
  // the frozen cell-count contract, and now also asserts the two things
  // that actually changed: no background fill on a cell, and a hairline
  // border-top on the row itself (on-ink variant too).
  test("StatGrid renders a typographic stat row with no cell fill and a top hairline", async ({ page }) => {
    await page.goto("/dev/exhibition-fixture");
    const grid = page.locator(".exhibit-stat-grid").first();
    const cells = grid.locator(".exhibit-stat-cell");
    await expect(cells).toHaveCount(4);
    const onInkGrid = page.locator('.exhibit-stat-grid[data-on-ink="true"]');
    const onInkCells = onInkGrid.locator(".exhibit-stat-cell");
    await expect(onInkCells).toHaveCount(3);

    for (const target of [cells.first(), onInkCells.first()]) {
      const bg = await target.evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(["rgba(0, 0, 0, 0)", "transparent"]).toContain(bg);
    }
    for (const target of [grid, onInkGrid]) {
      const borderTop = await target.evaluate((el) => getComputedStyle(el).borderTopWidth);
      expect(borderTop).toBe("1px");
    }
  });

  test("rail is a plain anchor list and gains aria-current on scroll", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Scroll-spy is exercised once against the fixed desktop rail.");
    await page.goto("/dev/exhibition-fixture");
    const navLink = (id: string) => page.locator(`.exhibit-rail-fixed .exhibit-rail-nav a[href="#${id}"]`);
    await expect(navLink("exhibit-00")).toHaveAttribute("href", "#exhibit-00");

    // The hero exhibit is in view at load, so the rail already marks it current.
    await expect(navLink("exhibit-00")).toHaveAttribute("aria-current", "true");

    await page.locator(SEL.exhibit("02")).scrollIntoViewIfNeeded();
    await expect(navLink("exhibit-02")).toHaveAttribute("aria-current", "true");
    await expect(navLink("exhibit-00")).not.toHaveAttribute("aria-current", "true");
  });

  test("mobile viewport collapses the rail to a 56px sticky index bar", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "The sticky index bar only renders under the 980px breakpoint.");
    await page.goto("/dev/exhibition-fixture");
    await expect(page.locator(".exhibit-rail-fixed")).not.toBeVisible();
    await expect(page.locator(".exhibit-rail-mobile-bar")).toBeVisible();
    await expect(page.locator(".exhibit-rail-mobile-bar")).toHaveJSProperty("offsetHeight", 56);
  });

  // Task F1 (comprehensive mobile pass, user's binding feedback): the
  // fixture's un-wrapped 7.3rem display-serif specimens overflowed the
  // viewport by ~27px at 390px width (task 0.7's known, deferred minor) --
  // fixed via a responsive clamp() on the specimen font-size. Checked at
  // both primary mobile widths this task audits (390x844, 360x780).
  test("no horizontal overflow at 390 or 360 (the known 27px specimen overflow)", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "This is a viewport-width-specific regression check; the mobile project renders at 390x844.");
    await page.goto("/dev/exhibition-fixture", { waitUntil: "networkidle" });
    await assertNoHorizontalOverflow(page, "/dev/exhibition-fixture at 390x844");
    await page.setViewportSize({ width: 360, height: 780 });
    await assertNoHorizontalOverflow(page, "/dev/exhibition-fixture at 360x780");
  });

  // Task F1: the mobile <details> INDEX panel is the primary mobile nav on
  // every page (spec §2.5's "cell 列表用于移动端索引" mandate) and its own
  // touch targets used to measure ~40px/~15px tall before this task's fix.
  test("mobile INDEX panel nav and footer links meet the 44px touch-target floor", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Touch-target sizing is only relevant under the <980px breakpoint the mobile project renders at.");
    await page.goto("/dev/exhibition-fixture");
    await page.locator(".exhibit-rail-mobile-bar").click();
    await assertTouchTarget(page, ".exhibit-rail-mobile-panel .exhibit-rail-nav a", "mobile INDEX nav link");
    await assertTouchTarget(page, ".exhibit-rail-mobile-panel .exhibit-rail-footer a", "mobile INDEX footer link");
  });

  // Task F5 (locale purity, user's binding rule): the rail's `copy` used to
  // render both `en` and `zh` lines unconditionally whenever both were
  // present on the RailSpec, regardless of the active locale (RailCopy,
  // src/components/exhibition/RailCopy.tsx, now gates on useI18n()). The
  // fixture rail carries both languages so this asserts exactly one of the
  // two ever renders, matching whichever locale is active.
  test("rail copy renders only the active locale's line, never both", async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "en"));
    await page.goto("/dev/exhibition-fixture", { waitUntil: "networkidle" });
    await expect(page.locator(".exhibit-rail-copy-en")).toHaveCount(1);
    await expect(page.locator(".exhibit-rail-copy-en")).toHaveText("AI agents. Measured systems.");
    await expect(page.locator(".exhibit-rail-copy-zh")).toHaveCount(0);

    await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "zh"));
    await page.goto("/dev/exhibition-fixture", { waitUntil: "networkidle" });
    await expect(page.locator(".exhibit-rail-copy-zh")).toHaveCount(1);
    await expect(page.locator(".exhibit-rail-copy-zh")).toHaveAttribute("lang", "zh");
    await expect(page.locator(".exhibit-rail-copy-zh")).toHaveText("有据可查的系统作品。");
    await expect(page.locator(".exhibit-rail-copy-en")).toHaveCount(0);
  });
});

// Task W3 (auto-rail v3): the generic mechanic contract, exercised against
// `/dev/exhibition-fixture?rail=auto` (ExhibitShell mode="auto") rather
// than a real page, so timing-sensitive assertions (wheel thresholds,
// hot-zone reveal, reduced motion) don't also depend on a real page's own
// instruments/timers. Per-page specs (forge-r2/eod-r2/triage-r2) only
// assert their own wiring (mode="auto", entry-open on load) plus anything
// page-specific (Forge's boxed mark/stamp, Triage's hero-grid width cap)
// on top of this shared contract. Prototype/spec:
// output/design-genres/rail-proto/rail-proto-v3.html +
// .superpowers/sdd/2026-08-22-site-revamp-r2/task-rail-proto-report.md.
test.describe("auto-rail v3 mechanic", () => {
  const AUTO_ROUTE = "/dev/exhibition-fixture?rail=auto";

  test("entry-open by default: rail visible, content pushed, no-JS-safe class absent", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Auto-rail v3 is desktop/tablet only (>=980px); tablet is covered once per-page.");
    await page.goto(AUTO_ROUTE, { waitUntil: "networkidle" });
    const shell = page.locator(".exhibit-shell");
    await expect(shell).toHaveAttribute("data-rail-mode", "auto");
    await expect(shell).not.toHaveClass(/rail-collapsed/);
    await expect(page.locator(".exhibit-rail-fixed")).toBeVisible();
    await expect(page.locator("main#main-content")).toHaveCSS("margin-left", "260px");
  });

  test("accumulated wheel scroll (entry-mode dismissal) retracts the rail", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Auto-rail v3 is desktop/tablet only (>=980px).");
    await page.goto(AUTO_ROUTE, { waitUntil: "networkidle" });
    const shell = page.locator(".exhibit-shell");
    await expect(shell).not.toHaveClass(/rail-collapsed/);
    // Spec threshold is 24px accumulated |deltaY|; 40 clears it in one step.
    await page.mouse.wheel(0, 40);
    await expect(shell).toHaveClass(/rail-collapsed/);
    await expect(page.locator("main#main-content")).toHaveCSS("margin-left", "0px");
  });

  test("hot-zone reveal brings a retracted rail back", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Auto-rail v3 is desktop/tablet only (>=980px).");
    await page.goto(AUTO_ROUTE, { waitUntil: "networkidle" });
    const shell = page.locator(".exhibit-shell");
    await page.mouse.wheel(0, 40);
    await expect(shell).toHaveClass(/rail-collapsed/);
    // 24px left-edge hot zone; x=10 is well inside it.
    await page.mouse.move(10, 400);
    await expect(shell).not.toHaveClass(/rail-collapsed/);
    await expect(page.locator(".exhibit-rail-fixed")).toBeVisible();
  });

  test("Escape retracts an open rail immediately", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Auto-rail v3 is desktop/tablet only (>=980px).");
    await page.goto(AUTO_ROUTE, { waitUntil: "networkidle" });
    const shell = page.locator(".exhibit-shell");
    await expect(shell).not.toHaveClass(/rail-collapsed/);
    await page.keyboard.press("Escape");
    await expect(shell).toHaveClass(/rail-collapsed/);
  });

  test("prefers-reduced-motion collapses the mechanic to instant toggles", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Auto-rail v3 is desktop/tablet only (>=980px).");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(AUTO_ROUTE, { waitUntil: "networkidle" });
    const railTransition = await page.locator(".exhibit-rail-fixed").evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(railTransition).toBe("0s");
    const mainTransition = await page.locator("main#main-content").evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(mainTransition).toBe("0s");
    // Esc retracts unconditionally (no grace timer on that path) -- confirms
    // the resulting state is already the end state, not mid-animation.
    await page.keyboard.press("Escape");
    await expect(page.locator(".exhibit-shell")).toHaveClass(/rail-collapsed/);
    await expect(page.locator("main#main-content")).toHaveCSS("margin-left", "0px");
  });

  // Reuses the rail-proto-v2/v3 scripts' sampler technique (scrollWidth vs
  // clientWidth at several points mid-transition) as a standing assertion
  // rather than a one-off manual recording: samples during both the
  // reveal-with-push and the retract-with-collapse animations.
  test("no horizontal overflow at 3 sampled timestamps mid-reveal and mid-retract", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Auto-rail v3 is desktop/tablet only (>=980px).");
    await page.goto(AUTO_ROUTE, { waitUntil: "networkidle" });

    // Retract first (so "reveal" below is a real transition, not a no-op).
    await page.mouse.wheel(0, 40);
    await expect(page.locator(".exhibit-shell")).toHaveClass(/rail-collapsed/);
    await page.waitForTimeout(350); // let the 240ms retract fully settle

    const revealStart = Date.now();
    await page.mouse.move(10, 400); // hot-zone reveal: 360ms rail / 380ms content push
    for (const targetMs of [60, 180, 350]) {
      await page.waitForTimeout(Math.max(0, targetMs - (Date.now() - revealStart)));
      await assertNoHorizontalOverflow(page, `${AUTO_ROUTE} mid-reveal @ ${targetMs}ms`);
    }
    await expect(page.locator(".exhibit-shell")).not.toHaveClass(/rail-collapsed/);

    const retractStart = Date.now();
    await page.mouse.move(900, 400); // leave the rail/hot zone: grace (300ms) then 240ms retract
    for (const targetMs of [350, 450, 560]) {
      await page.waitForTimeout(Math.max(0, targetMs - (Date.now() - retractStart)));
      await assertNoHorizontalOverflow(page, `${AUTO_ROUTE} mid-retract @ ${targetMs}ms`);
    }
    await expect(page.locator(".exhibit-shell")).toHaveClass(/rail-collapsed/);
  });
});

test.describe("exhibition shell without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("rail remains a plain anchor list with JS disabled", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "One no-JS structural check is sufficient.");
    await page.goto("/dev/exhibition-fixture", { waitUntil: "domcontentloaded" });
    const links = page.locator(SEL.rail).locator(".exhibit-rail-fixed a[href^='#']");
    await expect(links.first()).toBeVisible();
    await expect(page.locator(SEL.exhibit("01"))).toBeVisible();
  });

  // Task W3: the auto-rail mechanic is entirely JS-driven (RailAuto.tsx);
  // with JS disabled the shell must render exactly its default CSS state
  // (open, per exhibition.css's inverted-polarity comment) rather than a
  // blank margin or a rail stuck collapsed with no way to reopen it.
  test("auto-rail fixture renders open and static with JavaScript disabled", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "One no-JS structural check is sufficient.");
    await page.goto("/dev/exhibition-fixture?rail=auto", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".exhibit-shell")).not.toHaveClass(/rail-collapsed/);
    await expect(page.locator(".exhibit-rail-fixed")).toBeVisible();
    const links = page.locator(SEL.rail).locator(".exhibit-rail-fixed a[href^='#']");
    await expect(links.first()).toBeVisible();
    await expect(page.locator("main#main-content")).toHaveCSS("margin-left", "260px");
  });

  test("mobile index bar opens the <details> index without JavaScript", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "The 56px sticky index bar only renders under the 980px breakpoint.");
    await page.goto("/dev/exhibition-fixture", { waitUntil: "domcontentloaded" });

    const details = page.locator(".exhibit-rail-mobile");
    expect(await details.evaluate((el) => (el as HTMLDetailsElement).open)).toBe(false);

    await page.locator(".exhibit-rail-mobile-bar").click();

    expect(await details.evaluate((el) => (el as HTMLDetailsElement).open)).toBe(true);
    await expect(page.locator(".exhibit-rail-mobile-panel a").first()).toBeVisible();
  });
});
