import { expect, test } from "@playwright/test";
import axe from "axe-core";

const auditRoutes = [
  "/",
  "/engineering/p1-reliability-lab",
  "/ai/release-guardian",
  "/ai/rag-quality-lab",
  "/ai/privacy-preflight-mac",
  "/analytics/margin-control-tower",
  "/analytics/credit-policy-lab",
];

test("security headers are present on the static application", async ({ page }) => {
  const response = await page.goto("/");
  expect(response).not.toBeNull();
  const headers = response?.headers() ?? {};
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["content-security-policy"]).toContain("worker-src 'self' blob:");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
});

test("representative workflows remain keyboard-operable with reduced motion", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "One keyboard audit is sufficient across shared markup.");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "en"));

  await page.goto("/engineering/p1-reliability-lab", { waitUntil: "networkidle" });
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe("auto");
  const nextStage = page.getByRole("button", { name: "Next stage" });
  await nextStage.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".p1-stage-count")).toContainText("02 / 08");

  await page.goto("/ai/privacy-preflight-mac", { waitUntil: "networkidle" });
  const imageTab = page.getByRole("tab", { name: "Image" });
  await imageTab.focus();
  await page.keyboard.press("Enter");
  await expect(imageTab).toHaveAttribute("aria-selected", "true");
  const chooseImage = page.getByRole("button", { name: "Choose image" }).first();
  await chooseImage.focus();
  const fileChooser = page.waitForEvent("filechooser");
  await page.keyboard.press("Enter");
  await (await fileChooser).setFiles("public/case-studies/privacy-preflight/image-synthetic-input.png");
  await expect(page.locator(".privacy-canvas-wrap canvas")).toBeVisible();

  await page.goto("/analytics/credit-policy-lab", { waitUntil: "networkidle" });
  const capacity = page.getByRole("slider", { name: "Review capacity" });
  await capacity.focus();
  const before = Number(await capacity.inputValue());
  await page.keyboard.press("ArrowRight");
  expect(Number(await capacity.inputValue())).toBeGreaterThan(before);

  await page.goto("/", { waitUntil: "networkidle" });
  const chinese = page.getByRole("button", { name: "中", exact: true });
  await chinese.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
});

test("core operable routes have no serious automated accessibility violations", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "One semantic audit is sufficient across shared markup.");
  await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "en"));
  const routeViolations: Array<{ route: string; violations: unknown[] }> = [];

  for (const route of auditRoutes) {
    await page.goto(route, { waitUntil: "networkidle" });
    await page.addScriptTag({ content: axe.source });
    const violations = await page.evaluate(async () => {
      const runner = (window as typeof window & { axe: typeof axe }).axe;
      const result = await runner.run(document, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
      });
      return result.violations
        .filter((item) => item.impact === "serious" || item.impact === "critical")
        .map((item) => ({ id: item.id, impact: item.impact, targets: item.nodes.map((node) => node.target) }));
    });
    if (violations.length) routeViolations.push({ route, violations });
  }
  expect(routeViolations, JSON.stringify(routeViolations)).toEqual([]);
});

test("artifact viewer renders and operates every supported project file type", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "One functional viewer audit is sufficient across shared markup.");

  await page.goto("/artifact?src=/case-studies/privacy-preflight/image-synthetic-input.png", { waitUntil: "networkidle" });
  await expect(page.locator(".artifact-image-viewer img")).toBeVisible();
  await expect(page.locator(".artifact-zoom-controls output")).toHaveText("100%");
  await page.getByTitle("Zoom in").click();
  await expect(page.locator(".artifact-zoom-controls output")).toHaveText("125%");
  const imageDownload = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download original" }).click();
  expect((await imageDownload).suggestedFilename()).toBe("image-synthetic-input.png");

  await page.goto("/artifact?src=/case-studies/privacy-preflight/pdf-synthetic-redacted.pdf", { waitUntil: "networkidle" });
  const pdfCanvas = page.locator(".artifact-pdf-canvas canvas");
  await expect(pdfCanvas).toBeVisible();
  await expect.poll(() => pdfCanvas.evaluate((canvas: HTMLCanvasElement) => canvas.width * canvas.height)).toBeGreaterThan(0);
  const renderedPixels = await pdfCanvas.evaluate((canvas: HTMLCanvasElement) => {
    const context = canvas.getContext("2d");
    if (!context) return 0;
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    let nonWhite = 0;
    for (let index = 0; index < data.length; index += 64) {
      if (data[index] < 248 || data[index + 1] < 248 || data[index + 2] < 248) nonWhite += 1;
    }
    return nonWhite;
  });
  expect(renderedPixels).toBeGreaterThan(100);
  await expect(page.locator(".artifact-pdf-controls")).toContainText("Page 1 / 1");

  await page.goto("/artifact?src=/case-studies/rag-quality-lab/claim-registry.json", { waitUntil: "networkidle" });
  await expect(page.locator(".json-tree")).toContainText("root");
  await page.getByPlaceholder("Search keys or values").fill("11309");
  await expect(page.locator(".json-tree")).toContainText("11309");
  const jsonDownload = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download", exact: true }).click();
  expect((await jsonDownload).suggestedFilename()).toBe("claim-registry.json");

  await page.goto("/artifact?src=/case-studies/release-guardian/data/findings.csv", { waitUntil: "networkidle" });
  await expect(page.locator(".artifact-filterbar")).toContainText("13 records");
  const firstFinding = page.locator("tbody tr").first().locator("td").first();
  await expect(firstFinding).toHaveText("W3-01");
  await page.getByRole("button", { name: /^id/ }).click();
  await page.getByRole("button", { name: /^id/ }).click();
  await expect(firstFinding).toHaveText("W3-13");
  await page.getByPlaceholder("Search all fields").fill("architecture");
  await expect(page.locator("tbody tr")).toHaveCount(1);

  await page.goto("/artifact?src=/case-studies/p1-reliability-lab/README.md", { waitUntil: "networkidle" });
  await expect(page.locator(".artifact-markdown h1")).toBeVisible();
  await expect(page.locator(".artifact-markdown-layout aside a[href^='#']").first()).toBeVisible();
  const markdownDownload = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download source" }).click();
  expect((await markdownDownload).suggestedFilename()).toBe("README.md");

  await page.goto("/artifact?src=/case-studies/release-guardian/architecture.mmd", { waitUntil: "networkidle" });
  const diagram = page.locator(".artifact-mermaid-svg svg");
  await expect(diagram).toBeVisible();
  const diagramBox = await diagram.boundingBox();
  expect(diagramBox?.width ?? 0).toBeGreaterThan(900);
  expect(diagramBox?.height ?? 0).toBeGreaterThan(140);
  await page.getByRole("button", { name: "View source" }).click();
  await expect(page.locator(".artifact-raw-source")).toContainText("flowchart");
  await page.getByRole("button", { name: "Hide source" }).click();
  const svgDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download SVG" }).click();
  expect((await svgDownload).suggestedFilename()).toBe("architecture.svg");
});

test("artifact viewer preserves the shareable Chinese locale and project return URL", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Locale mechanics are shared across viewports.");
  await page.goto("/artifact?src=/case-studies/p1-reliability-lab/README.md&from=/engineering/p1-reliability-lab&lang=zh", { waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await expect(page.getByRole("link", { name: "返回项目" })).toHaveAttribute("href", /engineering\/p1-reliability-lab\?lang=zh$/);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
});
