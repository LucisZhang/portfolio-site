// Circuit chain + colophon index of work. Verifies, against the fixed
// circuit defined in src/lib/site-circuit.ts:
//   - every one of the 10 standalone project pages carries the top strip
//     (home crumb + prev/next with family context) and the bottom block,
//     with prev/next pointing at the correct circular neighbours;
//   - the colophon lists all 10 projects grouped 2/4/4 by the family
//     taxonomy (BUILD & RUN / GUARD & VERIFY / MEASURE & DECIDE) with
//     exactly the current page and exactly one current family marked;
//   - the crumb's family segment and the bottom TRACK row are same-document
//     jumps to #index-<family>, never a route -- the landing, keyboard and
//     no-overflow behaviour of that jump lives in
//     circuit-index-groups.spec.ts, which this spec does not duplicate;
//   - both locales (zh hrefs carry ?lang=zh via LocaleLink);
//   - the home crumb actually navigates home.
// The chain is the three families laid end to end, so each family occupies
// a contiguous run and the index's global numbers climb 01..10 straight
// down the three columns; that agreement is asserted here so it cannot
// drift silently.
// The exhaustive 10-page x 2-locale sweep runs on the desktop project only
// (workers=1 suite-runtime budget); tablet/mobile run a 2-route structural
// smoke so the responsive layout stays covered.
import { expect, test, type Page } from "@playwright/test";
import { SEL } from "./selectors";

import { PROJECT_NAVIGATION as CIRCUIT, localeVisitHref as visit, localizedNavigationHref as localized } from "./navigationCases";
import { assertNoHorizontalOverflow } from "./mobileAudit";

type Locale = "en" | "zh";

function neighbors(index: number) {
  const count = CIRCUIT.length;
  return {
    prev: CIRCUIT[(index - 1 + count) % count],
    next: CIRCUIT[(index + 1) % count],
  };
}

async function assertCircuitPage(page: Page, index: number, locale: Locale) {
  const stop = CIRCUIT[index];
  const { prev, next } = neighbors(index);
  const top = page.locator(SEL.circuitTop);
  const bottom = page.locator(SEL.circuitBottom);

  // Top strip: crumb (home + current) and prev/next with track context.
  await expect(top).toHaveCount(1);
  await expect(top).toHaveAccessibleName(locale === "zh" ? "项目环线" : "Project circuit");
  await expect(top.locator(SEL.circuitHome)).toHaveAttribute("href", localized("/", locale));
  await expect(top.locator(SEL.circuitHome)).toHaveAccessibleName(locale === "zh" ? "首页" : "HOME");
  await expect(top).toContainText(stop.title[locale]);
  await expect(top).toContainText(stop.pos[locale]);
  await expect(top.locator(SEL.circuitPrev)).toHaveAttribute("href", localized(prev.route, locale));
  await expect(top.locator(SEL.circuitNext)).toHaveAttribute("href", localized(next.route, locale));
  await expect(top.locator(SEL.circuitPrev).locator(".circuit-step-context")).toHaveText(
    `← ${locale === "zh" ? "上一项" : "PREV"} · ${prev.group.label[locale]}`,
  );
  await expect(top.locator(SEL.circuitPrev).locator(".circuit-step-title")).toHaveText(prev.title[locale]);
  await expect(top.locator(SEL.circuitNext).locator(".circuit-step-context")).toHaveText(
    `${locale === "zh" ? "下一项" : "NEXT"} · ${next.group.label[locale]} →`,
  );
  await expect(top.locator(SEL.circuitNext).locator(".circuit-step-title")).toHaveText(next.title[locale]);

  // Bottom block: NEXT feature entry + PREV row, same circular order.
  await expect(bottom).toHaveCount(1);
  await expect(bottom.locator(".circuit-bottom-label")).toHaveText(locale === "zh" ? "继续浏览项目" : "CONTINUE THE CIRCUIT");
  await expect(bottom.locator(".circuit-next-kicker")).toHaveText(`${locale === "zh" ? "下一项" : "NEXT"} — ${next.pos[locale]}`);
  await expect(bottom.locator(".circuit-k")).toHaveText(locale === "zh" ? ["上一项", "方向", "首页"] : ["PREV", "TRACK", "HOME"]);
  // The family segment (top) and the TRACK row (bottom) both jump into THIS
  // page's index of work. The href is asserted exactly: a bare fragment is
  // what keeps the pathname and ?lang= untouched, so a LocaleLink or a path
  // in either slot fails here.
  for (const [scope, slot] of [[top, "crumb"], [bottom, "track"]] as const) {
    const link = scope.locator(SEL.circuitGroupLink);
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute("href", stop.group.anchor);
    await expect(link).toHaveAttribute("href", /^#index-[a-z-]+$/);
    await expect(link).toHaveAttribute("data-circuit-group", stop.group.id);
    await expect(link).toHaveAttribute("data-circuit-group-link", slot);
  }
  // The visible text is the bare family label; the destination is stated in
  // a visually hidden span, so the accessible name STARTS with the visible
  // label (WCAG 2.5.3 label-in-name, and voice control still works).
  await expect(top.locator(SEL.circuitGroupLink)).toContainText(stop.group.label[locale]);
  await expect(top.locator(SEL.circuitGroupLink)).toHaveAccessibleName(locale === "zh"
    ? `${stop.group.label.zh} ——跳到本页作品索引中的这一组`
    : `${stop.group.label.en} — jump to this group in the index of work on this page`);
  await expect(bottom.locator(SEL.circuitGroupLink)).toHaveText(locale === "zh"
    ? `本页索引：${stop.group.label.zh} →`
    : `In this index: ${stop.group.label.en} →`);
  // The circuit points at this page's own index, never at a homepage
  // section anchor.
  await expect(page.locator([
    '[data-circuit-top] a[href*="#agent-systems"]',
    '[data-circuit-top] a[href*="#systems"]',
    '[data-circuit-top] a[href*="#archive"]',
    '[data-circuit-bottom] a[href*="#agent-systems"]',
    '[data-circuit-bottom] a[href*="#systems"]',
    '[data-circuit-bottom] a[href*="#archive"]',
  ].join(", "))).toHaveCount(0);
  await expect(bottom.getByRole("link", { name: locale === "zh" ? "全部作品 →" : "ALL WORK →", exact: true })).toHaveAttribute("href", localized("/", locale));
  await expect(bottom.locator(SEL.circuitNext)).toHaveAttribute("href", localized(next.route, locale));
  await expect(bottom.locator(SEL.circuitNext)).toContainText(next.title[locale]);
  await expect(bottom.locator(SEL.circuitPrev)).toHaveAttribute("href", localized(prev.route, locale));

  // Colophon: all 10 listed, grouped, exactly the current page marked.
  const colophon = page.locator(SEL.colophon);
  await expect(colophon).toHaveCount(1);
  await expect(colophon.locator(".circuit-colophon-label")).toHaveText(locale === "zh" ? "作品索引" : "INDEX OF WORK");
  // The index is a real heading outline (h2 for the index, h3 per family);
  // circuit-index-groups.spec.ts asserts the family headings and levels.
  await expect(colophon.getByRole("heading", { level: 2, name: locale === "zh" ? "作品索引" : "INDEX OF WORK" })).toHaveCount(1);
  await expect(colophon.locator(".circuit-colophon-track")).toHaveText(locale === "zh"
    ? ["构建与运行 — 02", "把关与验证 — 04", "度量与决策 — 04"]
    : ["BUILD & RUN — 02", "GUARD & VERIFY — 04", "MEASURE & DECIDE — 04"]);
  // One muted line per family, stating the family's claim.
  await expect(colophon.locator(".circuit-colophon-gloss")).toHaveText(locale === "zh"
    ? ["从搭起来，到在负载与故障下继续跑。", "该拦下时，宁可失败，也不放行。", "用结果定阈值、定策略，也明确什么时候该否决。"]
    : [
        "From standing it up to keeping it running under load and failure.",
        "When it should be stopped, fail rather than let it through.",
        "Use the results to set thresholds and policies, and to say when to refuse.",
      ]);
  // The global numbers climb straight down the three columns: the chain is
  // the families concatenated, so the circuit position and the reading
  // order of the index are the same sequence.
  await expect(colophon.locator(".circuit-colophon-num")).toHaveText(["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"]);
  const groupBlocks = colophon.locator(SEL.colophonGroupAttr);
  await expect(groupBlocks).toHaveCount(3);
  expect(await groupBlocks.evaluateAll((nodes) => nodes.map((node) => node.id)))
    .toEqual(["index-build-run", "index-guard-verify", "index-measure-decide"]);
  expect(await groupBlocks.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("tabindex"))))
    .toEqual(["-1", "-1", "-1"]);
  for (const [id, size] of [["build-run", 2], ["guard-verify", 4], ["measure-decide", 4]] as const) {
    await expect(colophon.locator(SEL.colophonGroup(id)).locator(SEL.colophonItemAttr)).toHaveCount(size);
  }
  await expect(colophon.locator(SEL.colophonGroupCurrent)).toHaveCount(1);
  await expect(colophon.locator(SEL.colophonGroupCurrent)).toHaveAttribute("data-colophon-group", stop.group.id);
  await expect(colophon.locator(SEL.colophonGroupCurrent).locator(SEL.colophonCurrent)).toHaveCount(1);
  await expect(colophon.locator(SEL.colophonItemAttr)).toHaveCount(CIRCUIT.length);
  await expect(colophon.locator(SEL.colophonCurrent)).toHaveCount(1);
  await expect(colophon.locator(SEL.colophonCurrent)).toHaveAttribute("data-colophon-item", stop.slug);
  await expect(colophon.locator(SEL.colophonCurrent)).toContainText(locale === "zh" ? "当前项目" : "THIS PAGE");
  await expect(colophon.locator(SEL.colophonCurrent).locator("a")).toHaveAttribute("aria-current", "page");
  await expect(colophon.locator(".circuit-colophon-foot a")).toHaveText(locale === "zh"
    ? ["← 首页", "联系章向国"] : ["← HOME", "Contact Xiangguo"]);
  for (const other of CIRCUIT) {
    const projectLink = colophon.locator(SEL.colophonItem(other.slug)).locator(`a[href="${localized(other.route, locale)}"]`);
    await expect(projectLink).toHaveCount(1);
    await expect(projectLink).toHaveText(other.title[locale]);
  }
}

for (const [index, stop] of CIRCUIT.entries()) {
  test(`${stop.slug} carries the circuit chain and colophon in both locales`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "exhaustive sweep runs on desktop only");
    for (const locale of ["en", "zh"] as const) {
      await page.goto(visit(stop.route, locale));
      await expect(page).toHaveURL(localized(stop.route, locale));
      await assertCircuitPage(page, index, locale);
    }
  });
}

test("responsive smoke: circuit chain and colophon render on tablet/mobile", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "desktop", "desktop is covered by the exhaustive sweep");
  for (const index of [0, CIRCUIT.length - 1]) {
    for (const locale of ["en", "zh"] as const) {
      await page.goto(visit(CIRCUIT[index].route, locale));
      await expect(page).toHaveURL(localized(CIRCUIT[index].route, locale));
      await assertCircuitPage(page, index, locale);
      await assertNoHorizontalOverflow(page, `${CIRCUIT[index].route} ${locale}`);
    }
  }
});

test("home crumb navigates back to home", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "one navigation check is enough for the suite");
  await page.goto(CIRCUIT[0].route);
  await page.locator(SEL.circuitTop).locator(SEL.circuitHome).click();
  await page.waitForURL("/");
  await expect(page.locator(SEL.homeHero)).toBeVisible();
});

test("circuit navigation preserves locale and refreshes the destination's active exhibit", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const locale of ["en", "zh"] as const) {
    await page.goto(visit(CIRCUIT[0].route, locale));
    await expect(page).toHaveURL(localized(CIRCUIT[0].route, locale));
    await page.locator(SEL.circuitTop).locator(SEL.circuitNext).click();
    await expect(page).toHaveURL(localized(CIRCUIT[1].route, locale));
    await expect(page.locator(".circuit-pos")).toHaveText(CIRCUIT[1].pos[locale]);
    await page.locator("#exhibit-02").scrollIntoViewIfNeeded();
    await expect(page.locator('.exhibit-rail-fixed a[href="#exhibit-02"]')).toHaveAttribute("aria-current", "true");
    await expect(page.locator("[data-rail-current]")).toHaveText(["02 / 05", "02 / 05"]);
  }
});

test("zh colophon descriptions use the project zh gloss", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "locale content check runs once");
  await page.goto(visit(CIRCUIT[0].route, "zh"));
  // frontier-forge's glossZh (projects.ts) is the zh one-liner for the
  // current colophon entry; the structural labels follow the locale too.
  await expect(page.locator(SEL.colophonCurrent)).toContainText("SFT 微调到 vLLM 上线跑通");
  await expect(page.locator(SEL.colophon)).toContainText("作品索引");
});
