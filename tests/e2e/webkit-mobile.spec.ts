import { expect, test } from "@playwright/test";
import { SEL } from "./selectors";
import { routableProjects } from "../../src/lib/projects";

test("iPhone WebKit exposes every public project repository in both locales", async ({ page }) => {
  test.setTimeout(90_000);
  for (const project of routableProjects.filter((candidate) => !candidate.legacy)) {
    for (const locale of ["en", "zh"] as const) {
      await page.goto(`/${project.track}/${project.slug}?lang=${locale}`, { waitUntil: "domcontentloaded" });
      const entry = page.locator("[data-project-repository]");
      await expect(entry).toHaveCount(1);
      await expect(entry).toBeInViewport();
      if (project.repository.status !== "public") throw new Error(`${project.slug}: expected its approved repository`);
      const link = entry.getByRole("link");
      await expect(link).toContainText(project.repository.label[locale]);
      await expect(link).toHaveAttribute("href", project.repository.href);
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", "noopener noreferrer");
      const box = await link.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
      expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
    }
  }
});

// Task 1.2: the homepage's Round-1 LucisOrbit entrance mark is removed
// (no decorative animated emblem fits the exhibition grammar). The
// equivalent-or-stronger iPhone WebKit check is that the rebuilt hero
// renders normally, without a permanent reveal overlay, on first paint.
test("iPhone WebKit renders the homepage hero without an entrance overlay", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.getByTestId("lucis-orbit-overlay")).toHaveCount(0);
  await expect(page.locator(SEL.homeHeroTitle)).toBeVisible();
  await expect(page.locator(".exhibit-stat-grid").first()).toBeVisible();
});

test("iPhone WebKit shows immediate feedback while a route is opening", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.route("**/ai/release-guardian?*", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 700));
    await route.continue();
  });
  const navigation = page.locator(SEL.aHrefAiReleaseGuardian).first().click();
  await expect(page.getByTestId("navigation-pending")).toBeVisible();
  await navigation;
  await expect(page).toHaveURL(/\/ai\/release-guardian/);
});

test("iPhone WebKit loads every bundled PDF with immediate local feedback", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "zh"));
  await page.goto("/ai/privacy-preflight?lang=zh", { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "PDF" }).click();

  for (const fixture of [
    { button: "加载文字层 PDF", file: "privacy-text-layer-example.pdf", pages: 1 },
    { button: "加载扫描版 PDF", file: "privacy-scanned-example.pdf", pages: 1 },
    { button: "加载多页 PDF", file: "privacy-multipage-example.pdf", pages: 3 },
  ]) {
    await page.getByRole("button", { name: fixture.button }).click();
    await expect(page.locator(SEL.privacyFileName)).toContainText(fixture.file, { timeout: 30_000 });
    await expect(page.locator(SEL.privacyExampleStatus)).toContainText(`已可在本地复核: ${fixture.file}`);
    await expect(page.getByTestId("privacy-pdf-source-pages").locator(SEL.dataPdfPage)).toHaveCount(fixture.pages);
    await expect(page.locator(SEL.privacyPdfCanvasWrap)).toHaveAttribute("aria-busy", "false");
  }
});

test("iPhone WebKit loads every bundled PDF when newer PDF.js platform APIs are unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(Promise, "withResolvers", { configurable: true, value: undefined });
    Object.defineProperty(Promise, "try", { configurable: true, value: undefined });
    Object.defineProperty(AbortSignal, "any", { configurable: true, value: undefined });
    Object.defineProperty(URL, "parse", { configurable: true, value: undefined });
    Object.defineProperty(Uint8Array, "fromBase64", { configurable: true, value: undefined });
    Object.defineProperty(Uint8Array.prototype, "toBase64", { configurable: true, value: undefined });
    Object.defineProperty(Response.prototype, "bytes", { configurable: true, value: undefined });
    Object.defineProperty(ReadableStream.prototype, "values", { configurable: true, value: undefined });
    Object.defineProperty(ReadableStream.prototype, Symbol.asyncIterator, { configurable: true, value: undefined });
  });
  await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "zh"));
  await page.goto("/ai/privacy-preflight?lang=zh", { waitUntil: "networkidle" });

  const workerCompatibility = await page.evaluate(() => new Promise<string[]>((resolve, reject) => {
    const compatibilityUrl = new URL("/generated/privacy-pdf/pdf.worker.compat.mjs", window.location.origin).href;
    const source = `
      Object.defineProperty(Promise, "withResolvers", { configurable: true, value: undefined });
      Object.defineProperty(Promise, "try", { configurable: true, value: undefined });
      Object.defineProperty(AbortSignal, "any", { configurable: true, value: undefined });
      Object.defineProperty(URL, "parse", { configurable: true, value: undefined });
      Object.defineProperty(ReadableStream.prototype, "values", { configurable: true, value: undefined });
      Object.defineProperty(ReadableStream.prototype, Symbol.asyncIterator, { configurable: true, value: undefined });
      import(${JSON.stringify(compatibilityUrl)})
        .then(() => postMessage([
          typeof Promise.withResolvers,
          typeof Promise.try,
          typeof AbortSignal.any,
          typeof URL.parse,
          typeof ReadableStream.prototype.values,
          typeof ReadableStream.prototype[Symbol.asyncIterator],
        ]))
        .catch((error) => postMessage(["error", error.message]));
    `;
    const workerUrl = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
    const worker = new Worker(workerUrl, { type: "module" });
    const timer = window.setTimeout(() => reject(new Error("Compatibility worker timed out.")), 10_000);
    worker.onmessage = (event) => {
      if (!Array.isArray(event.data)) return;
      window.clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      resolve(event.data as string[]);
    };
    worker.onerror = (event) => {
      window.clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      reject(new Error(event.message));
    };
  }));
  expect(workerCompatibility).toEqual(["function", "function", "function", "function", "function", "function"]);

  await page.getByRole("tab", { name: "PDF" }).click();
  for (const fixture of [
    { button: "加载文字层 PDF", file: "privacy-text-layer-example.pdf", pages: 1 },
    { button: "加载扫描版 PDF", file: "privacy-scanned-example.pdf", pages: 1 },
    { button: "加载多页 PDF", file: "privacy-multipage-example.pdf", pages: 3 },
  ]) {
    await page.getByRole("button", { name: fixture.button }).click();
    await expect(page.locator(SEL.privacyFileName)).toContainText(fixture.file, { timeout: 30_000 });
    await expect(page.getByTestId("privacy-pdf-source-pages").locator(SEL.dataPdfPage)).toHaveCount(fixture.pages);
    await expect(page.locator(SEL.privacyPdfCanvasWrap)).toHaveAttribute("aria-busy", "false");
    await expect(page.locator(SEL.privacyError)).toHaveCount(0);
  }
});

test("iPhone WebKit opens the portfolio assistant without zoom-triggering focus", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "en"));
  await page.goto("/", { waitUntil: "networkidle" });
  const initialWidth = await page.evaluate(() => window.visualViewport?.width ?? window.innerWidth);
  await page.getByRole("button", { name: "Ask Portfolio" }).click();
  const textarea = page.getByTestId("assistant-widget").locator(SEL.textarea);
  await expect(textarea).toBeVisible();
  const state = await textarea.evaluate((node) => ({
    active: document.activeElement === node,
    fontSize: Number.parseFloat(getComputedStyle(node).fontSize),
    viewportWidth: window.visualViewport?.width ?? window.innerWidth,
    scale: window.visualViewport?.scale ?? 1,
  }));
  expect(state.active).toBe(false);
  expect(state.fontSize).toBeGreaterThanOrEqual(16);
  expect(Math.abs(state.viewportWidth - initialWidth)).toBeLessThan(2);
  expect(state.scale).toBeLessThanOrEqual(1.01);
});

test("iPhone WebKit keeps the search dialog open when the first close action clears a query", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "en"));
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Search/ }).click();
  const dialog = page.locator(SEL.commandDialog);
  const input = page.getByPlaceholder("Search projects, systems, or tools");
  await input.fill("dian");
  await expect(page.locator(SEL.cmdkItem).first()).toContainText("Margin Control Tower");
  await expect(page.locator(SEL.commandCompletions)).toBeVisible();
  await page.getByRole("button", { name: "Clear search" }).click();
  await expect(input).toHaveValue("");
  await expect(dialog).toBeVisible();
  await page.getByRole("button", { name: "Close search" }).click();
  await expect(dialog).not.toBeVisible();
});
