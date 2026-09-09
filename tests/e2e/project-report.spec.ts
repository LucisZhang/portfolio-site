import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { routableProjects } from "../../src/lib/projects";
import { frontierProjectDetail } from "../../src/lib/frontier-project-detail";

const projects = routableProjects.filter((project) => !project.legacy);
const concepts = ["architecture", "results", "limitations"] as const;

test("report inventory covers every standalone static project and keeps the compatibility route", async ({ request }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Build inventory is viewport-independent.");
  const manifest = JSON.parse(readFileSync(".next/prerender-manifest.json", "utf8"));
  for (const project of routableProjects) {
    const route = `/projects/${project.slug}`;
    expect(manifest.routes[route], route).toBeDefined();
    const response = await request.get(route, { maxRedirects: 0 });
    if (project.legacy) {
      // Task A4 fix: this branch used to assert 308 -> "/#archive", which was
      // true while the legacy project's only URL was
      // "/analytics/analytics-tandem". The flat-route move (Tasks A1-A3)
      // inverted that: the RETIRED URL now 308s to "/projects/analytics-tandem"
      // and this route is genuinely served -- prerendered, 200, noindex.
      // The redirect itself belongs to tests/e2e/redirects.spec.ts, which owns
      // every source->destination rule; what this inventory test still needs to
      // say is that the compatibility route is present in the build and is
      // marked noindex, which is why it is exempt from the report-section
      // assertions below (it renders the legacy ProjectPageView shell, not the
      // architecture/results/limitations report composition).
      expect(response.status(), route).toBe(200);
      expect(await response.text(), route).toMatch(/<meta name="robots" content="noindex[^"]*"/u);
      continue;
    }
    expect(response.status(), route).toBe(200);
    const html = await response.text();
    for (const concept of concepts) expect(html).toContain(`id="report-${concept}"`);
  }
});

for (const project of projects) {
  const route = `/projects/${project.slug}`;
  for (const locale of ["en", "zh"] as const) {
    test(`${project.slug} ${locale}: report order, evidence, keyboard anchors and reading geometry`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(`${route}?lang=${locale}`, { waitUntil: "networkidle" });
      await expect(page.locator("html")).toHaveAttribute("lang", locale === "en" ? "en" : "zh-CN");
      const sections = page.locator("[data-report-section]");
      expect(await sections.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-report-section")))).toEqual(concepts);
      const sources = project.slug === "frontier-forge" ? frontierProjectDetail : project;

      for (const concept of concepts) {
        const section = page.locator(`[data-report-section="${concept}"]`);
        const heading = page.locator(`#report-${concept}`);
        await expect(heading).toHaveCount(1);
        await expect(section.getByRole("heading", { level: 2 })).toHaveCount(1);
        expect((await section.innerText()).length).toBeGreaterThan(40);
        expect(await section.getAttribute("aria-labelledby")).toContain(`report-${concept}`);
        await page.goto(`${route}?lang=${locale}#report-${concept}`, { waitUntil: "networkidle" });
        await expect(heading).toBeFocused();
        const box = await heading.boundingBox();
        expect(box!.y).toBeGreaterThanOrEqual(56);
        expect(box!.y).toBeLessThan(page.viewportSize()!.height - 24);
        const geometry = await section.evaluate((node) => {
          const content = node.firstElementChild!;
          const rect = content.getBoundingClientRect();
          const sectionRect = node.getBoundingClientRect();
          const style = getComputedStyle(node);
          return {
            width: rect.width,
            left: rect.left,
            expectedLeft: sectionRect.left + parseFloat(style.paddingLeft),
            padding: style.paddingTop,
          };
        });
        expect(Math.abs(geometry.left - geometry.expectedLeft)).toBeLessThanOrEqual(1);
        if (!(project.slug === "crossover-study" && concept === "architecture")) {
          expect(geometry.width).toBeLessThanOrEqual(760);
        }
      }

      const reportLeftEdges = await sections.evaluateAll((nodes) => nodes.map((node) => node.firstElementChild!.getBoundingClientRect().left));
      for (const left of reportLeftEdges) expect(Math.abs(left - reportLeftEdges[0])).toBeLessThanOrEqual(1);

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
    for (const concept of concepts) {
      await page.goto(`/projects/${project.slug}#report-${concept}`, { waitUntil: "load" });
      await expect(page.locator(`#report-${concept}`)).toBeVisible();
      await expect(page.locator(`[data-report-section="${concept}"]`)).not.toBeEmpty();
    }
  }
  await context.close();
});
