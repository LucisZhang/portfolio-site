import { expect, test } from "@playwright/test";
import { SEL } from "./selectors";

// Task F14 (spec §2.1/§2.5): the 10 standalone project routes never grew
// the SEARCH ⌘K / EN·中 / contact trio home's rail ships. A first attempt
// at this fix (railTools={<LegacyRailTools />} on all ten routes,
// task-suite-reconcile) built and typechecked clean but pushed "/"'s
// route-own bundle from 45,193 to 50,707 gzip bytes, over Ruling R11's
// hard 50,000 ceiling via a webpack shared-chunk shift, and was reverted
// (see task-suite-reconcile-report.md). This suite covers the real fix:
// ProjectRailTools.tsx, mounted via ExhibitShell's `railTools` slot on
// all ten routes (nine auto-rail, one fixed-rail -- privacy-preflight).
const PROJECT_ROUTES = [
  "/ai/ask-portfolio",
  "/ai/frontier-forge",
  "/ai/privacy-preflight",
  "/ai/rag-quality-lab",
  "/ai/release-guardian",
  "/ai/triage-router",
  "/analytics/credit-policy-desk",
  "/analytics/margin-control-tower",
  "/engineering/crossover-study",
  "/engineering/exactly-once-drills",
];

test.describe("Project rail chrome trio (task F14)", () => {
  for (const route of PROJECT_ROUTES) {
    test(`${route} rail exposes SEARCH ⌘K / EN·中 / contact`, async ({ page }) => {
      await page.goto(route, { waitUntil: "networkidle" });
      const tools = page.locator(SEL.projectRailTools);
      // Exactly one mount (ExhibitShell's railTools slot is single-mount by
      // design -- CommandPaletteLauncher's window ⌘K listener must not
      // double-fire), present regardless of rail mode (auto slide-out for
      // nine routes, fixed for privacy-preflight) or viewport (this
      // spec runs across the desktop/tablet/mobile Playwright projects, so
      // this assertion alone covers the fixed sidebar (>=980px) and the
      // <980px flowed-in-place placement documented in exhibition.css).
      await expect(tools).toHaveCount(1);
      await expect(tools.getByRole("button", { name: /Search/ })).toBeVisible();
      await expect(tools.getByRole("button", { name: "EN" })).toBeVisible();
      await expect(tools.getByRole("button", { name: "中" })).toBeVisible();
      await expect(tools.getByRole("link", { name: /Contact/ })).toBeVisible();
    });
  }

  test("SEARCH ⌘K opens the command palette from a fixed-rail project route", async ({ page }) => {
    // privacy-preflight is the one project route in mode="fixed"
    // (no auto slide-out/hotzone/RailAuto) -- covering it here alongside
    // the auto-mode route below exercises both rail modes' `railTools`
    // slot, which is structurally identical in ExhibitShell.tsx regardless
    // of mode.
    await page.goto("/ai/privacy-preflight", { waitUntil: "networkidle" });
    await page.locator(SEL.projectRailTools).getByRole("button", { name: /Search/ }).click();
    await expect(page.getByPlaceholder("Search projects, systems, or tools")).toBeVisible();
  });

  test("SEARCH ⌘K opens the command palette from an auto-rail project route", async ({ page }) => {
    await page.goto("/analytics/credit-policy-desk", { waitUntil: "networkidle" });
    await page.locator(SEL.projectRailTools).getByRole("button", { name: /Search/ }).click();
    await expect(page.getByPlaceholder("Search projects, systems, or tools")).toBeVisible();
  });

  test("EN·中 toggle switches language and preserves the page's path and hash (spec §2.5)", async ({ page }) => {
    await page.goto("/ai/triage-router#exhibit-02", { waitUntil: "networkidle" });
    await expect(page).toHaveURL(/\/ai\/triage-router#exhibit-02$/);
    await page.locator(SEL.projectRailTools).getByRole("button", { name: "中" }).click();
    await expect(page).toHaveURL(/\/ai\/triage-router\?lang=zh#exhibit-02$/);
    // Functional confirmation the locale actually switched, not just the
    // URL: the search trigger's own label is locale-driven (dict.paletteOpen).
    await expect(page.locator(SEL.projectRailTools).getByRole("button", { name: /搜索/ })).toBeVisible();

    // Round-trips back to English the same way, still on the same page/hash.
    await page.locator(SEL.projectRailTools).getByRole("button", { name: "EN" }).click();
    await expect(page).toHaveURL(/\/ai\/triage-router#exhibit-02$/);
    await expect(page.locator(SEL.projectRailTools).getByRole("button", { name: /Search/ })).toBeVisible();
  });

  // Fix round 1 (reviewer-reported Critical): ExhibitShell renders
  // `railTools` as a SIBLING of `.exhibit-rail-fixed`, not a descendant of
  // it, so RailAuto's `.rail-collapsed` -- which only translateX(-100%)s
  // `.exhibit-rail-fixed` -- used to leave the trio's own
  // `position: fixed; bottom:0; left:0` box exactly where it was: a solid
  // ink-invert rectangle floating over page content, clipping copy and
  // intercepting clicks underneath it. Reproduced live on
  // /ai/frontier-forge with a single content click. Fixed by giving the
  // trio's wrapper the same transform + transition timing
  // `.exhibit-rail-fixed` uses (exhibition.css), scoped to mode="auto".
  test("trio retracts fully off-screen with the rail on collapse, and returns on re-expand", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "RailAuto's collapse mechanic is desktop/tablet only (>=980px); mobile always flows the trio in place, uncollapsible.");
    await page.goto("/ai/frontier-forge", { waitUntil: "networkidle" });
    const shell = page.locator(".exhibit-shell");
    const tools = page.locator(SEL.projectRailTools);
    await expect(shell).not.toHaveClass(/rail-collapsed/);
    await expect(tools).toBeVisible();

    // Drive the rail into its collapsed state via one of RailAuto's
    // documented off-rail signals (entry-mode's accumulated-scroll
    // dismissal — same idiom as exhibition-shell.spec.ts and
    // triage-r2.spec.ts's own auto-rail tests).
    await page.mouse.wheel(0, 40);
    await expect(shell).toHaveClass(/rail-collapsed/);

    // Fully off-screen (its right edge at or left of the viewport's left
    // edge — the same geometry .exhibit-rail-fixed's own translateX(-100%)
    // relies on), not just "not the default position". expect.poll rides
    // out the CSS transition rather than racing a fixed timeout.
    await expect.poll(async () => {
      const box = await tools.boundingBox();
      return box ? box.x + box.width : null;
    }, { message: "trio should be fully left of the viewport once collapsed" }).toBeLessThanOrEqual(0.5);
    await expect(tools).toHaveCSS("pointer-events", "none");

    // Not floating over content: the collapsed trio's own box has no
    // positive-x extent left to overlap main with, but assert main is
    // still interactable at a point inside the trio's old footprint
    // (bottom-left of the viewport) as a direct regression guard for the
    // reported "intercepting clicks on content beneath it" symptom.
    const viewport = page.viewportSize();
    await expect(page.locator("main#main-content")).toBeVisible();
    if (viewport) {
      const elementAtOldFootprint = await page.evaluate(([x, y]) => {
        const el = document.elementFromPoint(x, y);
        return el ? el.closest(".project-rail-tools") !== null : false;
      }, [20, viewport.height - 20] as const);
      expect(elementAtOldFootprint).toBe(false);
    }

    // Re-expand (hot-zone hover) brings it back in lockstep with the rail.
    await page.locator("[data-rail-hotzone]").hover();
    await expect(shell).not.toHaveClass(/rail-collapsed/);
    await expect.poll(async () => (await tools.boundingBox())?.x ?? null, {
      message: "trio should return to x=0 once re-expanded",
    }).toBeGreaterThanOrEqual(-0.5);
    await expect(tools).toBeVisible();
    await expect(tools).toHaveCSS("pointer-events", "auto");
    await expect(tools.getByRole("button", { name: /Search/ })).toBeVisible();
  });
});
