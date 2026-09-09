import { expect, test } from "@playwright/test";
import { PROJECT_NAVIGATION, localeVisitHref } from "./navigationCases";

for (const project of PROJECT_NAVIGATION) {
  for (const locale of ["en", "zh"] as const) {
    test(`${project.slug} keeps a consistent ${locale} project header`, async ({ page }) => {
      await page.goto(localeVisitHref(project.route, locale), { waitUntil: "domcontentloaded" });
      const header = page.locator("[data-circuit-top]");
      await expect(header).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("lang", locale === "zh" ? "zh-CN" : "en");
      await page.evaluate(() => document.fonts.ready);
      for (const item of await page.locator(".exhibit-meta li + li").all()) {
        expect(await item.evaluate((element) => getComputedStyle(element, "::before").content)).toContain("·");
      }


      // Preserve the established breadcrumb / repository / compact-index order.
      await expect(header.locator(":scope > *")).toHaveCount(3);
      await expect(header.locator(":scope > *").nth(1)).toHaveAttribute("data-project-repository", project.slug);
      const geometry = async () => header.evaluate((element) => {
        const rect = (selector: string) => {
          const node = element.querySelector(selector)!;
          const box = node.getBoundingClientRect();
          return { top: box.top, bottom: box.bottom, left: box.left, right: box.right };
        };
        return {
          crumb: rect(".circuit-crumb"),
          repository: rect("[data-project-repository]"),
          steps: rect(".circuit-steps"),
          overflows: element.scrollWidth > element.clientWidth + 1,
          viewport: window.innerWidth,
        };
      });
      await expect.poll(async () => {
        const { crumb, repository, steps, overflows, viewport } = await geometry();
        const contained = [crumb, repository, steps].every((box) => box.left >= -1 && box.right <= viewport + 1);
        return contained && !overflows;
      }).toBe(true);

      if (page.viewportSize()!.width < 700) {
        await page.setViewportSize({ width: 320, height: 844 });
        await expect.poll(async () => {
          const { crumb, repository, steps, overflows, viewport } = await geometry();
          return !overflows && [crumb, repository, steps].every((box) => box.left >= -1 && box.right <= viewport + 1);
        }).toBe(true);
      }
    });
  }
}
