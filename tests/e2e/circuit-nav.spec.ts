// Task R9a (checklist A3, directions b+c): circuit chain + colophon index.
// Verifies, against the fixed circuit defined in src/lib/site-circuit.ts:
//   - every one of the 10 standalone project pages carries the top strip
//     (home crumb + prev/next with track context) and the bottom block,
//     with prev/next pointing at the correct circular neighbors;
//   - the colophon lists all 10 projects grouped 6/2/2 with exactly the
//     current page marked;
//   - both locales (zh hrefs carry ?lang=zh via LocaleLink);
//   - the home crumb actually navigates home.
// The exhaustive 10-page x 2-locale sweep runs on the desktop project only
// (workers=1 suite-runtime budget); tablet/mobile run a 2-route structural
// smoke so the responsive layout stays covered.
import { expect, test, type Page } from "@playwright/test";
import { SEL } from "./selectors";

// Mirror of src/lib/site-circuit.ts's circuit order (kept literal here on
// purpose: the spec is the independent check that the lib's order is the
// owner-approved one, so it must not import the lib).
const CIRCUIT = [
  { slug: "frontier-forge", route: "/ai/frontier-forge", title: "Frontier Forge", pos: "AI · 1 of 6" },
  { slug: "release-guardian", route: "/ai/release-guardian", title: "Release Guardian", pos: "AI · 2 of 6" },
  { slug: "triage-router", route: "/ai/triage-router", title: "Triage Router", pos: "AI · 3 of 6" },
  { slug: "privacy-preflight", route: "/ai/privacy-preflight", title: "Privacy Preflight", pos: "AI · 4 of 6" },
  { slug: "rag-quality-lab", route: "/ai/rag-quality-lab", title: "RAG Quality Lab", pos: "AI · 5 of 6" },
  { slug: "ask-portfolio", route: "/ai/ask-portfolio", title: "Ask Portfolio", pos: "AI · 6 of 6" },
  { slug: "exactly-once-drills", route: "/engineering/exactly-once-drills", title: "Exactly-Once Drills", pos: "ENGINEERING · 1 of 2" },
  { slug: "crossover-study", route: "/engineering/crossover-study", title: "Crossover Study", pos: "ENGINEERING · 2 of 2" },
  { slug: "margin-control-tower", route: "/analytics/margin-control-tower", title: "Margin Control Tower", pos: "ANALYTICS · 1 of 2" },
  { slug: "credit-policy-desk", route: "/analytics/credit-policy-desk", title: "Credit Policy Desk", pos: "ANALYTICS · 2 of 2" },
] as const;

type Locale = "en" | "zh";

function localized(route: string, locale: Locale) {
  return locale === "zh" ? `${route}?lang=zh` : route;
}

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
  await expect(top.locator(SEL.circuitHome)).toHaveAttribute("href", localized("/", locale));
  await expect(top).toContainText(stop.title);
  await expect(top).toContainText(stop.pos);
  await expect(top.locator(SEL.circuitPrev)).toHaveAttribute("href", localized(prev.route, locale));
  await expect(top.locator(SEL.circuitNext)).toHaveAttribute("href", localized(next.route, locale));

  // Bottom block: NEXT feature entry + PREV row, same circular order.
  await expect(bottom).toHaveCount(1);
  await expect(bottom.locator(SEL.circuitNext)).toHaveAttribute("href", localized(next.route, locale));
  await expect(bottom.locator(SEL.circuitNext)).toContainText(next.title);
  await expect(bottom.locator(SEL.circuitPrev)).toHaveAttribute("href", localized(prev.route, locale));

  // Colophon: all 10 listed, grouped, exactly the current page marked.
  const colophon = page.locator(SEL.colophon);
  await expect(colophon).toHaveCount(1);
  await expect(colophon.locator(SEL.colophonItemAttr)).toHaveCount(CIRCUIT.length);
  await expect(colophon.locator(SEL.colophonCurrent)).toHaveCount(1);
  await expect(colophon.locator(SEL.colophonCurrent)).toHaveAttribute("data-colophon-item", stop.slug);
  await expect(colophon.locator(SEL.colophonCurrent)).toContainText("THIS PAGE");
  for (const other of CIRCUIT) {
    await expect(colophon.locator(SEL.colophonItem(other.slug)).locator(`a[href="${localized(other.route, locale)}"]`)).toHaveCount(1);
  }
}

for (const [index, stop] of CIRCUIT.entries()) {
  test(`${stop.slug} carries the circuit chain and colophon in both locales`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "exhaustive sweep runs on desktop only");
    for (const locale of ["en", "zh"] as const) {
      await page.goto(localized(stop.route, locale));
      await assertCircuitPage(page, index, locale);
    }
  });
}

test("responsive smoke: circuit chain and colophon render on tablet/mobile", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "desktop", "desktop is covered by the exhaustive sweep");
  for (const index of [0, CIRCUIT.length - 1]) {
    await page.goto(CIRCUIT[index].route);
    await assertCircuitPage(page, index, "en");
  }
});

test("home crumb navigates back to home", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "one navigation check is enough for the suite");
  await page.goto(CIRCUIT[0].route);
  await page.locator(SEL.circuitTop).locator(SEL.circuitHome).click();
  await page.waitForURL("/");
  await expect(page.locator(SEL.homeHero)).toBeVisible();
});

test("zh colophon descriptions use the project zh gloss", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "locale content check runs once");
  await page.goto(localized(CIRCUIT[0].route, "zh"));
  // frontier-forge's glossZh (projects.ts) is the zh one-liner for the
  // current colophon entry; the mono fabric labels stay English.
  await expect(page.locator(SEL.colophonCurrent)).toContainText("SFT 微调到 vLLM 上线跑通");
  await expect(page.locator(SEL.colophon)).toContainText("INDEX OF WORK");
});
