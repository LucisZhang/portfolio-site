import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { routableProjects } from "../../src/lib/projects";
import { frontierProjectDetail } from "../../src/lib/frontier-project-detail";

const projects = routableProjects.filter((project) => !project.legacy);
const concepts = ["architecture", "results", "limitations"] as const;
const labels = { en: ["Architecture", "Results", "Limitations"], zh: ["架构", "结果", "局限与边界"] };

test("report inventory covers every standalone static project and keeps the compatibility route", async ({ request }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Build inventory is viewport-independent.");
  const manifest = JSON.parse(readFileSync(".next/prerender-manifest.json", "utf8"));
  for (const project of routableProjects) {
    const route = `/${project.track}/${project.slug}`;
    expect(manifest.routes[route], route).toBeDefined();
    const response = await request.get(route, { maxRedirects: 0 });
    if (project.legacy) {
      expect(response.status()).toBe(308);
      expect(response.headers().location).toBe("/#archive");
      continue;
    }
    expect(response.status(), route).toBe(200);
    const html = await response.text();
    for (const concept of concepts) expect(html).toContain(`id="report-${concept}"`);
  }
});

for (const project of projects) {
  const route = `/${project.track}/${project.slug}`;
  for (const locale of ["en", "zh"] as const) {
    test(`${project.slug} ${locale}: report order, evidence, keyboard anchors and reading geometry`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(`${route}?lang=${locale}`, { waitUntil: "networkidle" });
      await expect(page.locator("html")).toHaveAttribute("lang", locale === "en" ? "en" : "zh-CN");
      const nav = page.locator("[data-report-contents]");
      await expect(nav).toHaveCount(1);
      await expect(nav.getByRole("link")).toHaveText(labels[locale]);
      const sections = page.locator("[data-report-section]");
      expect(await sections.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-report-section")))).toEqual(concepts);
      const sources = project.slug === "frontier-forge" ? frontierProjectDetail : project;

      for (const [index, concept] of concepts.entries()) {
        const section = page.locator(`[data-report-section="${concept}"]`);
        const heading = page.locator(`#report-${concept}`);
        await expect(heading).toHaveCount(1);
        await expect(section.getByRole("heading", { level: 2 })).toHaveCount(1);
        expect((await section.innerText()).length).toBeGreaterThan(40);
        expect(await section.getAttribute("aria-labelledby")).toContain(`report-${concept}`);
        const link = nav.getByRole("link").nth(index);
        const destination = new URL(page.url());
        destination.hash = `report-${concept}`;
        await link.focus();
        await page.keyboard.press("Enter");
        await expect(page).toHaveURL(destination.href);
        await expect(heading).toBeFocused();
        const box = await heading.boundingBox();
        expect(box!.y).toBeGreaterThanOrEqual(56);
        expect(box!.y).toBeLessThan(page.viewportSize()!.height - 24);
        const geometry = await section.evaluate((node) => {
          const content = node.firstElementChild!;
          const rect = content.getBoundingClientRect();
          const style = getComputedStyle(node);
          return { width: rect.width, center: rect.x + rect.width / 2, sectionCenter: node.getBoundingClientRect().x + node.getBoundingClientRect().width / 2, padding: style.paddingTop };
        });
        if (!(project.slug === "crossover-study" && concept === "architecture")) {
          expect(geometry.width).toBeLessThanOrEqual(760);
          expect(Math.abs(geometry.center - geometry.sectionCenter)).toBeLessThan(1);
        }
      }

      const limitations = page.locator('[data-report-section="limitations"] [data-limitations] li');
      if (project.slug === "ask-portfolio") {
        await expect(limitations).toHaveCount(2);
        await expect(page.locator('[data-report-section="results"] .ask-refusal')).toHaveCount(2);
        await expect(page.locator('[data-report-section="results"]')).toContainText(locale === "en" ? "no model call, no network request" : "未调用模型、未发出网络请求");
      } else {
        await expect(limitations).toHaveCount(sources.boundaries.length);
        for (const [index, boundary] of sources.boundaries.entries()) await expect(limitations.nth(index)).toContainText(boundary[locale]);
        for (const note of sources.fieldNotes ?? []) await expect(page.locator('[data-report-section="results"]')).toContainText(note[locale]);
        await expect(page.locator('[data-report-section="results"]')).toContainText(sources.outcome[locale]);
        if (project.slug !== "crossover-study") {
          for (const step of sources.architecture) {
            await expect(page.locator('[data-report-section="architecture"]')).toContainText(step.label[locale]);
            await expect(page.locator('[data-report-section="architecture"]')).toContainText(step.detail[locale]);
          }
        }
      }
      if (project.slug === "privacy-preflight") {
        await expect(page.locator('#exhibit-05 [data-limitations] li')).toHaveCount(sources.boundaries.length);
        await expect(page.locator('[data-limitations]')).toHaveCount(1);
      }
      if (project.slug === "crossover-study") {
        await expect(page.locator('[data-report-section="architecture"] [data-testid="crossover-sql"]')).toBeVisible();
        await expect(page.locator('[data-report-section="architecture"] [data-testid="crossover-results-table"]')).toBeVisible();
      }
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }
}

test("all report anchors and evidence remain usable without JavaScript", async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Static HTML contract is viewport-independent.");
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL: testInfo.project.use.baseURL });
  const page = await context.newPage();
  for (const project of projects) {
    await page.goto(`/${project.track}/${project.slug}`, { waitUntil: "load" });
    for (const concept of concepts) {
      await page.locator(`[data-report-contents] a[href="#report-${concept}"]`).click();
      await expect(page.locator(`#report-${concept}`)).toBeVisible();
      await expect(page.locator(`[data-report-section="${concept}"]`)).not.toBeEmpty();
    }
  }
  await context.close();
});
