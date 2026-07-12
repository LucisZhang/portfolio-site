import { expect, test } from "@playwright/test";

const routes = [
  "/",
  "/engineering",
  "/engineering/p1-reliability-lab",
  "/ai",
  "/ai/release-guardian",
  "/ai/rag-quality-lab",
  "/ai/privacy-preflight-mac",
  "/analytics",
  "/analytics/analytics-tandem",
];

const forbiddenClaims = [
  "498,725",
  "0.809",
  "0.944",
  "Private GitHub",
  "Heavy stack re-run on a 16 GB laptop remains",
  "Sample interface data only",
  "Telemetry sample",
];

for (const locale of ["en", "zh"] as const) {
  for (const route of routes) {
    test(`${locale} ${route} renders without overflow or broken evidence`, async ({ page }, testInfo) => {
      const browserErrors: string[] = [];
      page.on("pageerror", (error) => browserErrors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") browserErrors.push(message.text());
      });

      await page.addInitScript((selectedLocale) => {
        window.localStorage.setItem("portfolio-locale", selectedLocale);
      }, locale);
      const response = await page.goto(route, { waitUntil: "networkidle" });

      expect(response?.status()).toBe(200);
      await expect(page.locator("main")).toBeVisible();
      const bodyText = await page.locator("body").innerText();
      for (const claim of forbiddenClaims) expect(bodyText).not.toContain(claim);
      if (locale === "zh") expect(bodyText).toMatch(/[\u3400-\u9fff]/);
      if (route.split("/").length === 3) {
        expect(bodyText).toContain(locale === "en" ? "Audience" : "面向对象");
      }
      if (route === "/engineering/p1-reliability-lab") {
        await expect(page.locator(".artifact-table > a")).toHaveCount(5);
        await expect(page.locator('a[href="/case-studies/p1-reliability-lab/workstation-reproduction-guide.md"]')).toBeVisible();
      }
      if (route === "/ai/release-guardian") {
        await expect(page.locator(".finding-table > div:not(.finding-head)")).toHaveCount(5);
      }
      if (route === "/ai/privacy-preflight-mac") {
        await expect(page.locator(".redline-grid > span")).toHaveCount(3);
      }

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);

      for (const image of await page.locator("img").all()) {
        await expect(image).toBeVisible();
        expect(await image.evaluate((node) => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
      }
      expect(browserErrors).toEqual([]);

      const slug = route === "/" ? "home" : route.slice(1).replaceAll("/", "-");
      await page.screenshot({
        path: testInfo.outputPath("visual", `${locale}-${slug}.png`),
        fullPage: true,
      });
    });
  }
}
