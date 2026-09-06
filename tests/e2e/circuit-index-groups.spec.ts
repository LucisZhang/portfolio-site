// Task D06: the behavioural contract for the project family taxonomy's
// in-page category navigation.
//
// The crumb's middle segment and the bottom TRACK row are same-document
// fragment links (`#index-<family>`) into that page's own index of work.
// circuit-nav.spec.ts owns the chain and colophon structure those links sit
// in; this spec asserts what actually happens when they are used.
//
// What is load-bearing here, and why each assertion exists:
//   - the click keeps the document: the route, the ?lang= query and a
//     `__d06Marker` sentinel set before the click all survive, which is what
//     proves no navigation occurred (the URL alone would not);
//   - the fragment resolves to a unique landing target inside the colophon
//     that is `:target`, on screen, and marked as the current family;
//   - the target carries tabindex="-1" and the focus-only enhancement leaves
//     focus on its first project link. Chromium and WebKit differ in native
//     fragment focus, so the operable destination is asserted in BOTH;
//   - the index is a heading outline (h2 index, h3 per family) and the
//     families are `group`s, not `region` landmarks: three extra landmarks
//     per project page would drown the page's real ones;
//   - the family labels are long, so no viewport may gain a horizontal
//     scroller before or after the jump;
//   - none of it needs JavaScript: the same jump is exercised in a context
//     with scripting disabled.
import { expect, test, type Page } from "@playwright/test";
import { SEL } from "./selectors";
import { PROJECT_NAVIGATION as CIRCUIT, localeVisitHref as visit, localizedNavigationHref as localized } from "./navigationCases";

declare global {
  interface Window {
    __d06Marker?: number;
  }
}

type Locale = "en" | "zh";

// Global circuit numbers are positions in the chain, and the chain is the
// families concatenated, so a family owns one contiguous run of numbers.
const NUMBERED = CIRCUIT.map((stop, index) => ({ ...stop, number: String(index + 1).padStart(2, "0") }));

const FAMILIES = NUMBERED.reduce<Array<{ id: string; anchor: string; label: { en: string; zh: string }; members: typeof NUMBERED }>>((families, stop) => {
  const existing = families.find((family) => family.id === stop.group.id);
  if (existing) existing.members.push(stop);
  else families.push({ id: stop.group.id, anchor: stop.group.anchor, label: stop.group.label, members: [stop] });
  return families;
}, []);

// The last family's block ends the document. Once the browser has scrolled
// to the document's maximum it can be fully on screen without its top
// reaching the scroll-margin landing position, so the honest contract there
// is "on screen", not "top-aligned".
const LAST_FAMILY = FAMILIES[FAMILIES.length - 1].id;

// One route per family for the non-exhaustive sweeps. margin-control-tower
// is the deliberate narrow-viewport worst case: the longest family label
// next to a long project title and long neighbour titles.
const REPRESENTATIVE = ["frontier-forge", "ask-portfolio", "margin-control-tower"];

const KEYBOARD_PROJECTS = ["desktop", "desktop-webkit"];

function stopFor(slug: string) {
  const index = NUMBERED.findIndex((stop) => stop.slug === slug);
  return { index, stop: NUMBERED[index] };
}

function headingName(family: (typeof FAMILIES)[number], locale: Locale) {
  return `${family.label[locale]} — ${String(family.members.length).padStart(2, "0")}`;
}

/** Where the landing target sits relative to the viewport, plus its state. */
async function landingGeometry(page: Page, anchor: string) {
  return page.evaluate((selector) => {
    const node = document.querySelector(selector)!;
    const box = node.getBoundingClientRect();
    return {
      top: box.top,
      bottom: box.bottom,
      viewportHeight: window.innerHeight,
      isTarget: node.matches(":target"),
      focused: document.activeElement === node,
    };
  }, anchor);
}

async function expectLandedOn(page: Page, familyId: string, anchor: string, label: string) {
  // Auto-retrying first, so a late layout settle cannot turn a correct jump
  // into a flake; the exact geometry below then states the real contract.
  await expect(page.locator(anchor)).toBeInViewport();
  // :target is the browser's own record of which fragment is current, so it
  // is asserted as a selector rather than inferred from the URL.
  await expect(page.locator(`${anchor}:target`)).toHaveCount(1);
  const geometry = await landingGeometry(page, anchor);
  expect(geometry.top, `${label}: ${anchor} starts below the fold`).toBeLessThan(geometry.viewportHeight);
  if (familyId === LAST_FAMILY) {
    expect(
      geometry.top >= 0 || geometry.bottom <= geometry.viewportHeight,
      `${label}: ${anchor} is off screen (top ${geometry.top}, bottom ${geometry.bottom})`,
    ).toBe(true);
  } else {
    expect(geometry.top, `${label}: ${anchor} is above the viewport`).toBeGreaterThanOrEqual(0);
  }
  // Exactly one family is the current one, and it is the one we landed on.
  await expect(page.locator(SEL.colophonGroupCurrent)).toHaveCount(1);
  await expect(page.locator(SEL.colophonGroupCurrent)).toHaveAttribute("data-colophon-group", familyId);
}

/** Heading outline, landmark budget, membership and numbering of the index. */
async function assertIndexStructure(page: Page, index: number, locale: Locale) {
  const stop = NUMBERED[index];
  const colophon = page.locator(SEL.colophon);

  // Crumb and TRACK row offer the same destination, as a bare fragment.
  const crumbLink = page.locator(SEL.circuitTop).locator(SEL.circuitGroupLink);
  const trackLink = page.locator(SEL.circuitBottom).locator(SEL.circuitGroupLink);
  await expect(crumbLink).toHaveAttribute("href", stop.group.anchor);
  await expect(trackLink).toHaveAttribute("href", stop.group.anchor);
  expect(await crumbLink.getAttribute("href")).toMatch(/^#index-[a-z-]+$/);

  // Real headings at the project page's own levels: every project page puts
  // its section headings at h2 under an h1, so the index is an h2 and each
  // family an h3 below it.
  await expect(colophon.getByRole("heading", { level: 2, name: locale === "zh" ? "作品索引" : "INDEX OF WORK" })).toHaveCount(1);
  for (const family of FAMILIES) {
    await expect(colophon.getByRole("heading", { level: 3, name: headingName(family, locale) })).toHaveCount(1);
  }

  // Three named groups, zero region landmarks: the families are bounded and
  // named for assistive technology without being announced as landmarks.
  await expect(colophon.getByRole("region")).toHaveCount(0);
  await expect(colophon.getByRole("group")).toHaveCount(FAMILIES.length);
  for (const family of FAMILIES) {
    const block = colophon.locator(SEL.colophonGroup(family.id));
    await expect(block).toHaveAttribute("tabindex", "-1");
    await expect(block).toHaveAccessibleName(headingName(family, locale));
    // Membership in chain order, carrying the global circuit numbers.
    expect(await block.locator(SEL.colophonItemAttr).evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-colophon-item"))))
      .toEqual(family.members.map((member) => member.slug));
    await expect(block.locator(".circuit-colophon-num")).toHaveText(family.members.map((member) => member.number));
  }

  // The landing target is inside the index of work, is the current family,
  // and holds this page's own entry.
  const landing = colophon.locator(stop.group.anchor);
  await expect(landing).toHaveCount(1);
  await expect(landing).toHaveAttribute("data-colophon-group-current", "true");
  await expect(landing.locator(SEL.colophonItem(stop.slug))).toHaveCount(1);
}

/** Clicks a family link and asserts the document, route and query survived.
 *  `how: "native"` dispatches the click from inside the page instead of
 *  through Playwright's pointer, because Playwright scrolls a link into view
 *  before clicking it -- for the bottom TRACK row that scroll alone would
 *  drag the colophon into the viewport and make the landing assertion pass
 *  without the jump ever happening. */
async function clickAndExpectSameDocument(
  page: Page,
  slot: "crumb" | "track",
  route: string,
  locale: Locale,
  familyId: string,
  anchor: string,
  how: "pointer" | "native" = "pointer",
) {
  await page.evaluate(() => {
    window.__d06Marker = 1;
  });
  const link = page.locator(slot === "crumb" ? SEL.circuitTop : SEL.circuitBottom).locator(SEL.circuitGroupLink);
  if (how === "native") await link.evaluate((node: HTMLAnchorElement) => node.click());
  else await link.click();
  await expect(page).toHaveURL(`${localized(route, locale)}${anchor}`);
  const url = new URL(page.url());
  expect(url.pathname).toBe(route);
  expect(url.searchParams.get("lang")).toBe(locale === "zh" ? "zh" : null);
  expect(url.hash).toBe(anchor);
  // The sentinel, not the URL, is what proves the document was never
  // replaced: a full navigation would wipe it.
  expect(await page.evaluate(() => window.__d06Marker)).toBe(1);
  await expectLandedOn(page, familyId, anchor, `${route} ${locale} ${slot}`);
}

for (const [index, stop] of CIRCUIT.entries()) {
  test(`${stop.slug} jumps to its family in this page's index without leaving the route`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "the exhaustive 10 x 2 sweep runs on desktop only");
    for (const locale of ["en", "zh"] as const) {
      const response = await page.goto(visit(stop.route, locale));
      expect(response?.status()).toBe(200);
      // Wait for the canonical URL (?lang=en is dropped, ?lang=zh is kept)
      // so the query assertions after the click describe a settled address
      // bar rather than the request we made.
      await expect(page).toHaveURL(localized(stop.route, locale));

      await assertIndexStructure(page, index, locale);
      await clickAndExpectSameDocument(page, "crumb", stop.route, locale, stop.group.id, stop.group.anchor);
      // The TRACK row offers the same jump from the bottom of the page.
      await page.evaluate(() => window.scrollTo(0, 0));
      await clickAndExpectSameDocument(page, "track", stop.route, locale, stop.group.id, stop.group.anchor, "native");
    }
  });
}

// Keyboard, in both engines. Enter on the family link must move real focus
// to the first project in that family (not merely scroll it into view).
// Chromium additionally asserts that sequential Tab continues to the next
// project; macOS WebKit's link-tab preference is host-dependent.
for (const slug of REPRESENTATIVE) {
  test(`${slug}: the family crumb focuses the first project in its index group`, async ({ page }, testInfo) => {
    test.skip(!KEYBOARD_PROJECTS.includes(testInfo.project.name), "keyboard behaviour is asserted once per engine");
    const { index, stop } = stopFor(slug);
    await page.goto(visit(stop.route, "en"), { waitUntil: "networkidle" });
    await assertIndexStructure(page, index, "en");

    const crumbLink = page.locator(SEL.circuitTop).locator(SEL.circuitGroupLink);
    if (testInfo.project.name === "desktop") {
      // Chromium's test profile tabs through every link, so assert the DOM
      // order from XGZ to the family link there. macOS WebKit's link-tab
      // preference is host-dependent; focus it directly below so the
      // cross-engine contract starts at the actual activation.
      await page.locator(SEL.circuitTop).locator(SEL.circuitHome).focus();
      await page.keyboard.press("Tab");
    } else {
      await crumbLink.focus();
    }
    expect(await page.evaluate(() => document.activeElement?.getAttribute("data-circuit-group-link"))).toBe("crumb");
    expect(await page.evaluate(() => document.activeElement?.getAttribute("data-circuit-group"))).toBe(stop.group.id);

    await page.keyboard.press("Enter");
    // Polled, not read once: the focus-only enhancement runs after the
    // browser's own fragment navigation has finished.
    await expectLandedOn(page, stop.group.id, stop.group.anchor, `${stop.route} keyboard`);

    const firstMember = FAMILIES.find((family) => family.id === stop.group.id)!.members[0];
    const focused = () => page.evaluate(() => {
      const active = document.activeElement;
      const item = active?.closest("[data-colophon-item]");
      return {
        tag: active?.tagName,
        slug: item?.getAttribute("data-colophon-item") ?? null,
        family: active?.closest("[data-colophon-group]")?.getAttribute("data-colophon-group") ?? null,
      };
    });
    await expect.poll(focused).toEqual({ tag: "A", slug: firstMember.slug, family: stop.group.id });

    if (testInfo.project.name === "desktop") {
      const family = FAMILIES.find((candidate) => candidate.id === stop.group.id)!;
      await page.keyboard.press("Tab");
      await expect.poll(focused).toEqual({ tag: "A", slug: family.members[1].slug, family: stop.group.id });
    }
  });
}

// Re-activating the link while the hash is already set must still take the
// reader back to the family. The hash does not change, so no hashchange
// fires and no history entry is added -- if the engine treats that as a
// no-op, the bottom TRACK row would be dead for anyone who used the crumb
// first. The click is dispatched from inside the page rather than through
// Playwright's pointer: Playwright scrolls a link into view before clicking
// it, and that scroll alone would bring the colophon back on screen and
// make this assertion pass without any jump.
test("the TRACK row still returns to the family when the hash is already set", async ({ page }, testInfo) => {
  test.skip(!KEYBOARD_PROJECTS.includes(testInfo.project.name), "one re-activation check per engine");
  const { stop } = stopFor("rag-quality-lab");
  await page.goto(visit(stop.route, "en"), { waitUntil: "networkidle" });
  await page.locator(SEL.circuitTop).locator(SEL.circuitGroupLink).click();
  await expectLandedOn(page, stop.group.id, stop.group.anchor, "first activation");

  // Back to the top, with nothing focused: the family is now well below the
  // fold, so anything that follows has to be the jump doing the work.
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur();
    window.scrollTo(0, 0);
    window.__d06Marker = 1;
  });
  const before = await landingGeometry(page, stop.group.anchor);
  expect(before.top).toBeGreaterThanOrEqual(before.viewportHeight);
  expect(before.focused).toBe(false);

  const trackLink = page.locator(SEL.circuitBottom).locator(SEL.circuitGroupLink);
  expect(await trackLink.getAttribute("href")).toBe(new URL(page.url()).hash);
  await trackLink.evaluate((node: HTMLAnchorElement) => node.click());

  // The route, the query and the document are untouched; the family is back
  // on screen and its first project link holds focus.
  const url = new URL(page.url());
  expect(url.pathname).toBe(stop.route);
  expect(url.searchParams.get("lang")).toBe(null);
  expect(url.hash).toBe(stop.group.anchor);
  expect(await page.evaluate(() => window.__d06Marker)).toBe(1);
  const firstMember = FAMILIES.find((family) => family.id === stop.group.id)!.members[0];
  await expect.poll(() => page.evaluate(() => ({
    tag: document.activeElement?.tagName ?? null,
    slug: document.activeElement?.closest("[data-colophon-item]")?.getAttribute("data-colophon-item") ?? null,
  }))).toEqual({ tag: "A", slug: firstMember.slug });
  await expectLandedOn(page, stop.group.id, stop.group.anchor, "re-activated TRACK row");
});

// Every project viewport: 1440 desktop, 1024 tablet, 390 mobile, iPhone 13.
// The family labels are far longer than a track initial, so the page must
// gain no horizontal scroller before or after the jump, and the crumb link
// itself must sit fully inside the viewport.
test("family crumbs render and jump without horizontal overflow at every project viewport", async ({ page }, testInfo) => {
  for (const slug of REPRESENTATIVE) {
    const { index, stop } = stopFor(slug);
    for (const locale of ["en", "zh"] as const) {
      const label = `${testInfo.project.name} ${stop.route} ${locale}`;
      await page.goto(visit(stop.route, locale));
      await expect(page).toHaveURL(localized(stop.route, locale));
      await assertIndexStructure(page, index, locale);

      const crumbLink = page.locator(SEL.circuitTop).locator(SEL.circuitGroupLink);
      await expect(crumbLink).toBeVisible();
      const horizontal = await crumbLink.evaluate((node) => {
        const box = node.getBoundingClientRect();
        return { left: box.left, right: box.right, viewportWidth: window.innerWidth };
      });
      expect(horizontal.left, `${label}: crumb link starts off the left edge`).toBeGreaterThanOrEqual(0);
      expect(horizontal.right, `${label}: crumb link overflows the right edge`).toBeLessThanOrEqual(horizontal.viewportWidth);

      await expectNoHorizontalScroller(page, `${label} on load`);
      await clickAndExpectSameDocument(page, "crumb", stop.route, locale, stop.group.id, stop.group.anchor);
      await expectNoHorizontalScroller(page, `${label} after the jump`);
    }
  }
});

async function expectNoHorizontalScroller(page: Page, label: string) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, `${label}: the document is ${overflow}px wider than the viewport`).toBeLessThanOrEqual(0);
}

// With scripting off the jump has to behave identically: it is a plain
// fragment link, so nothing about it depends on hydration. One English page
// per family, in both engines.
test("the family jump works with JavaScript disabled", async ({ browser }, testInfo) => {
  test.skip(!KEYBOARD_PROJECTS.includes(testInfo.project.name), "the no-JS fallback is exercised once per engine");
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: testInfo.project.use.viewport,
  });
  try {
    for (const slug of REPRESENTATIVE) {
      const { stop } = stopFor(slug);
      const page = await context.newPage();
      const response = await page.goto(stop.route, { waitUntil: "domcontentloaded" });
      expect(response?.status()).toBe(200);

      const crumbLink = page.locator(SEL.circuitTop).locator(SEL.circuitGroupLink);
      await expect(crumbLink).toHaveAttribute("href", stop.group.anchor);
      // Keyboard activation avoids a Playwright/WebKit no-JS `.click()`
      // deadlock while exercising the same native anchor default action.
      await crumbLink.focus();
      await crumbLink.press("Enter");

      const url = new URL(page.url());
      expect(url.pathname).toBe(stop.route);
      expect(url.hash).toBe(stop.group.anchor);
      await expectLandedOn(page, stop.group.id, stop.group.anchor, `${stop.route} without JavaScript`);
      await page.close();
    }
  } finally {
    await context.close();
  }
});
