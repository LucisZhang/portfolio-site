import { expect, type Page } from "@playwright/test";

// Task F1 (comprehensive mobile adaptation pass, spec §2.5): shared
// assertions for the overflow scan and touch-target checks added to each
// *-r2.spec.ts file's mobile-project coverage. Kept in one place (same
// pattern as localePurity.ts / selectors.ts) so all five pages assert the
// same contract the same way.

// document.scrollingElement.scrollWidth > document.documentElement.clientWidth
// is the real signal for horizontal overflow -- window.innerWidth itself
// can balloon past the device width when unconstrained content forces the
// layout viewport wider (verified live during this task: a triage-router
// table before its fix reported window.innerWidth=601 at a 390px device
// width), so this deliberately does not compare against window.innerWidth.
export async function assertNoHorizontalOverflow(page: Page, label: string) {
  const overflow = await page.evaluate(() => {
    const el = document.scrollingElement!;
    return el.scrollWidth - document.documentElement.clientWidth;
  });
  expect(overflow, `${label}: document.scrollingElement.scrollWidth exceeds the viewport width by ${overflow}px`).toBeLessThanOrEqual(0);
}

// WeUI touch-target floor (spec §2.5: "触控目标 >= 44px"). Checks the
// element's own layout box, which is what several of this task's fixes
// deliberately grow via padding/min-height/min-width even when the
// painted content (a hairline slider thumb, an underlined text link)
// stays visually small.
export async function assertTouchTarget(page: Page, selector: string, label: string) {
  const box = await page.locator(selector).first().boundingBox();
  expect(box, `${label} (${selector}): element not visible/found`).not.toBeNull();
  if (!box) return;
  expect(box.width, `${label} (${selector}): width ${box.width}px`).toBeGreaterThanOrEqual(44);
  expect(box.height, `${label} (${selector}): height ${box.height}px`).toBeGreaterThanOrEqual(44);
}

// For elements whose real hit target is an invisible ::before/::after
// overlay rather than the painted box itself (e.g. eod.css's
// .eod-pipeline-edge, a 2-12px-tall/24-64px-wide connector line centered
// under a 44x44 ::before) -- assertTouchTarget can't see this, since
// boundingBox() only measures the real element. Checks every match
// (not just .first()) since the floor must hold per-element, not just for
// one representative -- this is exactly what a review finding caught:
// the trunk edges specifically fell short under real data while other
// edges happened to pass.
export async function assertPseudoHitArea(page: Page, selector: string, pseudo: "::before" | "::after", label: string) {
  const boxes = await page.locator(selector).evaluateAll((elements, pseudoSel) =>
    elements.map((el) => {
      const cs = getComputedStyle(el, pseudoSel);
      return { width: parseFloat(cs.width), height: parseFloat(cs.height), display: cs.display };
    }), pseudo);
  expect(boxes.length, `${label} (${selector}): no matching elements`).toBeGreaterThan(0);
  for (const [index, box] of boxes.entries()) {
    if (box.display === "none") continue;
    expect(box.width, `${label} #${index} (${selector}${pseudo}): width ${box.width}px`).toBeGreaterThanOrEqual(44);
    expect(box.height, `${label} #${index} (${selector}${pseudo}): height ${box.height}px`).toBeGreaterThanOrEqual(44);
  }
}
