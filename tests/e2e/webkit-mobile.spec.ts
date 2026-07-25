import { expect, test } from "@playwright/test";

test("iPhone WebKit loads every bundled PDF with immediate local feedback", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "zh"));
  await page.goto("/ai/privacy-preflight-mac?lang=zh", { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "PDF" }).click();

  for (const fixture of [
    { button: "加载文字层 PDF", file: "privacy-text-layer-example.pdf", pages: 1 },
    { button: "加载扫描版 PDF", file: "privacy-scanned-example.pdf", pages: 1 },
    { button: "加载多页 PDF", file: "privacy-multipage-example.pdf", pages: 3 },
  ]) {
    await page.getByRole("button", { name: fixture.button }).click();
    await expect(page.locator(".privacy-file-name")).toContainText(fixture.file, { timeout: 30_000 });
    await expect(page.locator(".privacy-example-status")).toContainText(`已可在本地复核: ${fixture.file}`);
    await expect(page.getByTestId("privacy-pdf-source-pages").locator("[data-pdf-page]")).toHaveCount(fixture.pages);
    await expect(page.locator(".privacy-pdf-canvas-wrap")).toHaveAttribute("aria-busy", "false");
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
  await page.goto("/ai/privacy-preflight-mac?lang=zh", { waitUntil: "networkidle" });

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
    await expect(page.locator(".privacy-file-name")).toContainText(fixture.file, { timeout: 30_000 });
    await expect(page.getByTestId("privacy-pdf-source-pages").locator("[data-pdf-page]")).toHaveCount(fixture.pages);
    await expect(page.locator(".privacy-pdf-canvas-wrap")).toHaveAttribute("aria-busy", "false");
    await expect(page.locator(".privacy-error")).toHaveCount(0);
  }
});

test("iPhone WebKit opens the portfolio assistant without zoom-triggering focus", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "en"));
  await page.goto("/", { waitUntil: "networkidle" });
  const initialWidth = await page.evaluate(() => window.visualViewport?.width ?? window.innerWidth);
  await page.getByRole("button", { name: "Ask Portfolio" }).click();
  const textarea = page.getByTestId("assistant-widget").locator("textarea");
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
  const dialog = page.locator(".command-dialog");
  const input = page.getByPlaceholder("Search projects, systems, or tools");
  await input.fill("dian");
  await expect(page.locator("[cmdk-item]").first()).toContainText("Margin Control Tower");
  await expect(page.locator(".command-completions")).toBeVisible();
  await page.getByRole("button", { name: "Clear search" }).click();
  await expect(input).toHaveValue("");
  await expect(dialog).toBeVisible();
  await page.getByRole("button", { name: "Close search" }).click();
  await expect(dialog).not.toBeVisible();
});
