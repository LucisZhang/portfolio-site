import { expect, test } from "@playwright/test";

// Regression: the SSR paper veil used to stay opaque forever when JavaScript was
// disabled, leaving the homepage permanently blank. The <noscript> fallback must
// hide the overlay and reveal the normal homepage plus the final compact mark.
test.use({ javaScriptEnabled: false });

test("with JavaScript disabled the homepage is visible and the veil does not cover it", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The no-JS fallback is exercised once.");
  await page.goto("/", { waitUntil: "domcontentloaded" });

  // Normal homepage content is on screen, not behind a permanent veil.
  await expect(page.locator(".identity-title h1")).toBeVisible();
  await expect(page.getByRole("link", { name: /GitHub/ })).toBeVisible();

  // The overlay is still in the SSR HTML but the noscript style keeps it from
  // rendering, so it can never block the page.
  const overlay = page.getByTestId("lucis-orbit-overlay");
  await expect(overlay).toHaveCount(1);
  await expect(overlay).toBeHidden();
  await expect(overlay).toHaveCSS("display", "none");

  // Final compact emblem + LUCIS wordmark below the name, fully visible.
  const mark = page.getByTestId("lucis-orbit");
  await expect(mark).toBeVisible();
  await expect(mark).toHaveCSS("opacity", "1");
  await expect(mark.locator(".lucis-orbit-emblem .lo-planet")).toHaveCount(3);
  await expect(mark.locator(".lucis-orbit-wordmark")).toHaveText("Lucis");
  const nameBox = (await page.locator(".identity-title h1").boundingBox())!;
  const markBox = (await mark.boundingBox())!;
  expect(markBox.y).toBeGreaterThanOrEqual(nameBox.y + nameBox.height - 1);

  // Nothing at the viewport center intercepts or covers the page.
  const viewport = page.viewportSize()!;
  const hit = await page.evaluate(([x, y]) => {
    const el = document.elementFromPoint(x, y);
    return el ? el.closest('[data-testid="lucis-orbit-overlay"]') !== null : false;
  }, [viewport.width / 2, viewport.height / 2] as const);
  expect(hit).toBe(false);
});
