import { expect, test } from "@playwright/test";
import { SEL } from "./selectors";

import { PROJECT_NAVIGATION, localizedNavigationHref as localized } from "./navigationCases";
import { assertNoHorizontalOverflow } from "./mobileAudit";

test.describe("Bilingual project rail navigation", () => {
  for (const project of PROJECT_NAVIGATION) {
    test(`${project.route} shares bilingual tools, exhibit links and a single return`, async ({ page }, testInfo) => {
      for (const locale of ["en", "zh"] as const) {
        await page.goto(localized(project.route, locale), { waitUntil: "networkidle" });
        const rail = page.locator(SEL.rail);
        const tools = page.locator(SEL.projectRailTools);
        await expect(rail).toHaveAccessibleName(locale === "zh" ? "展品目录" : "Exhibition index");
        await expect(tools).toHaveCount(1);
        await expect(tools).toHaveAccessibleName(locale === "zh" ? "项目工具" : "Project tools");
        await expect(tools.getByRole("button", { name: locale === "zh" ? /搜索/ : /Search/ })).toBeVisible();
        await expect(tools.getByRole("button", { name: "EN", exact: true })).toBeVisible();
        await expect(tools.getByRole("button", { name: "中", exact: true })).toBeVisible();
        const contact = tools.getByRole("link", { name: locale === "zh" ? "联系章向国" : "Contact Xiangguo", exact: true });
        await expect(contact).toBeVisible();
        await expect(contact).toHaveAttribute("href", localized("/#contact", locale));

        const mobile = testInfo.project.name === "mobile";
        if (mobile) {
          const summary = rail.locator(".exhibit-rail-mobile-bar");
          await expect(summary).toContainText(locale === "zh" ? "目录" : "INDEX");
          await expect(summary.locator("[data-rail-current]")).toHaveText(`01 / ${String(project.nav[locale].length).padStart(2, "0")}`);
          await summary.focus();
          await page.keyboard.press("Enter");
          await expect(rail.locator(".exhibit-rail-mobile")).toHaveAttribute("open", "");
        }
        const panel = rail.locator(mobile ? ".exhibit-rail-mobile-panel" : ".exhibit-rail-fixed");
        const labels = project.nav[locale];
        await expect(panel.locator(".exhibit-rail-label")).toHaveText([...labels]);
        for (const [index, label] of labels.entries()) {
          const number = String(index + 1).padStart(2, "0");
          const link = panel.locator(`.exhibit-rail-nav a[href="#exhibit-${number}"]`);
          await expect(link).toContainText(label);
          await expect(link.locator(".exhibit-rail-num")).toHaveText(number);
          await expect(page.locator(`#exhibit-${number}[data-exhibit]`)).toHaveCount(1);
        }
        const stamp = rail.locator(".exhibit-rail-stamp");
        if (project.slug === "frontier-forge") {
          await expect(stamp).toHaveText(locale === "zh" ? "已记录产物" : "RECORDED ARTIFACT");
        } else if (project.slug === "margin-control-tower" || project.slug === "credit-policy-desk") {
          await expect(stamp).toHaveText(locale === "zh" ? "已归档" : "ARCHIVED");
        } else {
          await expect(stamp).toHaveCount(0);
        }
        // Desktop/mobile markup shares one return contract; only one control
        // is available at each breakpoint, and it preserves the active locale.
        const back = rail.getByRole("link", { name: locale === "zh" ? "← 全部作品" : "← ALL WORK", exact: true });
        await expect(back).toHaveCount(1);
        await expect(back).toHaveAttribute("href", localized("/", locale));
        await assertNoHorizontalOverflow(page, `${project.route} ${locale}`);
        // Visibility alone does not catch a link covered by the tools band.
        await back.click({ trial: true });
        await back.focus();
        await expect(back).toBeFocused();
        const outline = await back.evaluate((element) => getComputedStyle(element).outlineStyle);
        expect(outline).not.toBe("none");
        await page.keyboard.press("Enter");
        await expect(page).toHaveURL(localized("/", locale));
        await expect(page.locator(SEL.homeHero)).toBeVisible();
      }
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
    await expect(page.locator(".exhibit-rail-fixed .exhibit-rail-label").nth(1)).toHaveText("已知误分流");
    await expect(page.locator(".circuit-pos")).toHaveText("度量与决策 · 01 / 04");

    // Round-trips back to English the same way, still on the same page/hash.
    await page.locator(SEL.projectRailTools).getByRole("button", { name: "EN" }).click();
    await expect(page).toHaveURL(/\/ai\/triage-router#exhibit-02$/);
    await expect(page.locator(SEL.projectRailTools).getByRole("button", { name: /Search/ })).toBeVisible();
    await expect(page.locator(".exhibit-rail-fixed .exhibit-rail-label").nth(1)).toHaveText("Known misroutes");
    await expect(page.locator(".circuit-pos")).toHaveText("MEASURE & DECIDE · 01 / 04");
  });

  test("section positions and active anchors stay aligned through a locale switch under reduced motion", async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/ai/triage-router?lang=zh#exhibit-02", { waitUntil: "networkidle" });
    const active = page.locator('.exhibit-rail-fixed a[href="#exhibit-02"]');
    await expect(active).toHaveAttribute("aria-current", "true");
    await expect(page.locator("[data-rail-current]")).toHaveText(["02 / 05", "02 / 05"]);
    await expect(page.locator(".exhibit-rail-tab")).toHaveText("目录 · 02 / 05");
    // Keyboard focus reveals the auto rail; on mobile it uses the same
    // single-mounted language control below the native index panel.
    const english = page.locator(SEL.projectRailTools).getByRole("button", { name: "EN", exact: true });
    await english.focus();
    if (testInfo.project.name !== "mobile") {
      await expect(page.locator(".exhibit-shell")).not.toHaveClass(/rail-collapsed/);
      await expect(page.locator(".exhibit-rail-tools")).toHaveCSS("transition-duration", "0s");
    }
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL("/ai/triage-router#exhibit-02");
    await expect(page.locator(".exhibit-rail-tab")).toHaveText("INDEX · 02 / 05");
    await expect(active).toHaveAttribute("aria-current", "true");
    await expect(page.locator("[data-rail-current]")).toHaveText(["02 / 05", "02 / 05"]);
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
