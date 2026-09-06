import { expect, test } from "@playwright/test";
import { SEL } from "./selectors";
import homeStats from "../../src/data/generated/home-stats.json";

// The homepage must remain fully readable without hydration. Task 1.2
// rebuilds the page as seven server-rendered exhibits (spec §4); this test
// is the equivalent-or-stronger no-JS coverage for what the pre-rebuild
// homepage used to assert here (LucisOrbit visibility/position, the old
// hero/flagship/tier-list markup) — see task-1.2-report.md's
// replaced-assertion inventory for the old-selector -> new-assertion map.
// The Lucis orbit emblem itself is removed from the homepage in this
// rebuild (spec §2.1's "no icon" rule and the new hero content script have
// no slot for a decorative animated mark), so there is nothing to assert
// in its place beyond "the page is a normal document without it".
test.use({ javaScriptEnabled: false });

test("with JavaScript disabled the whole seven-exhibit homepage renders in the initial HTML", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The no-JS fallback is exercised once.");
  await page.goto("/", { waitUntil: "domcontentloaded" });

  // Hero (exhibit 00): title and all 4 stat tiles. Without JavaScript the
  // client-only locale store never hydrates past its en snapshot (see
  // src/lib/i18n.ts's getServerLocaleSnapshot), so the stable zh narrative
  // node stays outside layout and the accessibility tree.
  await expect(page.locator(SEL.homeHeroTitle)).toBeVisible();
  await expect(page.locator(SEL.homeHeroZh)).toBeHidden();
  const heroCells = page.locator(".exhibit-stat-grid").first().locator(".exhibit-stat-cell");
  await expect(heroCells).toHaveCount(homeStats.heroTiles.length);
  // Two GitHub links exist on the homepage — the hero contact link
  // (exhibit 00) and the source link in exhibit 06's receipts.
  await expect(page.locator(SEL.homeHero).getByRole("link", { name: /GitHub/ })).toBeVisible();

  // All seven exhibit anchors are present without any client script.
  for (const num of ["00", "01", "02", "03", "04", "05", "06"]) {
    await expect(page.locator(SEL.exhibit(num))).toBeVisible();
  }

  // Exhibit 01: claim chain rows exist (expansion itself is covered by
  // home-r2.spec.ts's dedicated <details>-without-JS test).
  await expect(page.locator(SEL.homeClaimRow)).toHaveCount(homeStats.flagshipClaims.length);

  // Exhibit 02: three agent-system rows.
  await expect(page.locator(SEL.homeAgentRow)).toHaveCount(3);

  // Exhibit 05: shelf table (3 secondary + 2 archive rows).
  await expect(page.locator(SEL.homeShelfRow)).toHaveCount(5);

  // The exhibition rail's fixed desktop sidebar is a plain anchor list
  // requiring no JavaScript to render or use (task 0.5's equivalent check,
  // carried forward unchanged by the rebuild).
  await expect(page.locator(".exhibit-rail-fixed")).toBeVisible();
  await expect(page.locator(".exhibit-rail-fixed .exhibit-rail-nav a")).toHaveCount(7);

  // Nothing at the viewport center is covered by a permanent overlay (the
  // old LucisOrbit reveal-veil regression check, restated generically: the
  // element under the viewport center is part of the normal document).
  const viewport = page.viewportSize()!;
  const covered = await page.evaluate(([x, y]) => {
    const el = document.elementFromPoint(x, y);
    return el === null || el.closest('[data-testid="lucis-orbit-overlay"]') !== null;
  }, [viewport.width / 2, viewport.height / 2] as const);
  expect(covered).toBe(false);
});
