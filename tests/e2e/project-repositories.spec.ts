import { expect, test } from "@playwright/test";
import { routableProjects } from "../../src/lib/projects";

for (const project of routableProjects.filter((candidate) => !candidate.legacy)) {
  const route = `/projects/${project.slug}`;
  for (const locale of ["en", "zh"] as const) {
    test(`${route} has one prominent ${locale} repository entry`, async ({ page }) => {
      await page.goto(`${route}?lang=${locale}`, { waitUntil: "domcontentloaded" });
      await expect(page.locator("html")).toHaveAttribute("lang", locale === "zh" ? "zh-CN" : "en");
      const entry = page.locator("[data-project-repository]");
      await expect(entry).toHaveCount(1);
      await expect(entry).toHaveAttribute("data-project-repository", project.slug);
      await expect(entry).toHaveAttribute("data-repository-status", project.repository.status);
      await expect(entry).toBeInViewport();
      expect(await entry.evaluate((element) => {
        const firstExhibit = document.querySelector('main .exhibit, main [data-project-section="hero"]');
        return !!firstExhibit && !!(element.compareDocumentPosition(firstExhibit) & Node.DOCUMENT_POSITION_FOLLOWING);
      })).toBe(true);

      if (project.repository.status === "public") {
        const link = entry.getByRole("link");
        await expect(link).toHaveCount(1);
        await expect(link).toHaveText(new RegExp(project.repository.label[locale]));
        await expect(link).toHaveAccessibleName(new RegExp(project.title[locale]));
        await expect(link).toHaveAccessibleName(locale === "zh" ? /新标签页/ : /new tab/);
        await expect(link).toHaveAttribute("href", project.repository.href);
        await expect(link).toHaveAttribute("target", "_blank");
        await expect(link).toHaveAttribute("rel", "noopener noreferrer");
        await expect(page.locator(`a[href="${project.repository.href}"]`)).toHaveCount(1);
        const box = await link.boundingBox();
        expect(box?.height).toBeGreaterThanOrEqual(44);
        expect(box?.x).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
        await link.focus();
        await page.keyboard.press("Shift+Tab");
        await page.keyboard.press("Tab");
        await expect(link).toBeFocused();
        await expect(link).toHaveCSS("outline-style", "solid");
      } else {
        await expect(entry.getByRole("link")).toHaveCount(0);
        await expect(entry).toContainText(project.repository.reason[locale]);
        await expect(page.locator('a[href*="Risk-Control-Portfolio"]')).toHaveCount(0);
      }
    });
  }
}

test("repository navigation opens a separate tab by keyboard and survives locale switching", async ({ page, context }) => {
  const project = routableProjects.find((candidate) => candidate.slug === "ask-portfolio")!;
  if (project.repository.status !== "public") throw new Error("Ask Portfolio needs its approved site repository");
  await context.route(project.repository.href, (route) => route.fulfill({ contentType: "text/html", body: "Repository destination" }));
  await page.goto("/projects/ask-portfolio", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "中", exact: true }).click();
  const link = page.locator("[data-project-repository]").getByRole("link");
  await expect(link).toContainText(project.repository.label.zh);
  await link.focus();
  const [popup] = await Promise.all([page.waitForEvent("popup"), page.keyboard.press("Enter")]);
  await expect(popup).toHaveURL(project.repository.href);
  expect(await popup.evaluate(() => window.opener === null)).toBe(true);
  await expect(page).toHaveURL(/\/projects\/ask-portfolio\?lang=zh$/);
  await popup.close();
});

test.describe("repository entries in static HTML", () => {
  test.use({ javaScriptEnabled: false });
  test("every project has its repository state before hydration", async ({ page }) => {
    for (const project of routableProjects.filter((candidate) => !candidate.legacy)) {
      await page.goto(`/projects/${project.slug}`, { waitUntil: "domcontentloaded" });
      const entry = page.locator("[data-project-repository]");
      await expect(entry).toBeVisible();
      if (project.repository.status === "public") {
        await expect(entry.getByRole("link")).toHaveAttribute("href", project.repository.href);
      } else {
        await expect(entry.getByRole("link")).toHaveCount(0);
        await expect(entry).toContainText(project.repository.reason.en);
      }
    }
  });
});

test("the private legacy repository is never linked from the compatibility page", async ({ page, request }) => {
  // The retired /analytics/analytics-tandem URL now follows the page's route
  // to /projects/analytics-tandem, which is genuinely served as a noindex
  // compatibility shell rather than bounced to the archive shelf.
  const response = await request.get("/analytics/analytics-tandem", { maxRedirects: 0 });
  expect(response.status()).toBe(308);
  expect(response.headers().location).toBe("/projects/analytics-tandem");
  await page.goto("/analytics/analytics-tandem");
  await expect(page).toHaveURL(/\/projects\/analytics-tandem$/);
  // The repository entry states the private status without ever exposing a
  // link to the private Risk-Control-Portfolio repository.
  const entry = page.locator("[data-project-repository]");
  await expect(entry).toHaveAttribute("data-repository-status", "private");
  await expect(entry.getByRole("link")).toHaveCount(0);
  await expect(page.locator('a[href*="Risk-Control-Portfolio"]')).toHaveCount(0);
});

test("non-project pages have no repository entry", async ({ page }) => {
  for (const route of ["/", "/missing-project"]) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-project-repository]")).toHaveCount(0);
  }
});
