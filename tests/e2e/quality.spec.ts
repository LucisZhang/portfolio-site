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
  await expect(page.getByTestId("lucis-orbit")).toHaveCSS("animation-name", "none");
  await expect(page.getByTestId("lucis-orbit-overlay")).toBeHidden();
  await expect(page.getByTestId("lucis-orbit").locator(".lo-planet")).toHaveCount(3);
  const chinese = page.getByRole("button", { name: "中", exact: true });
  await chinese.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
});

test("homepage contacts, WeChat QR variants, and one-time Lucis Orbit follow locale", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Shared homepage behavior is exercised once.");
  await page.addInitScript(() => {
    window.localStorage.setItem("portfolio-locale", "en");
    window.sessionStorage.removeItem("lucis-orbit-seen-v3");
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const orbit = page.getByTestId("lucis-orbit");
  const overlay = page.getByTestId("lucis-orbit-overlay");
  // First session: a viewport-centered solar system at hero scale leads the entrance.
  await expect(overlay).toBeVisible();
  await expect(overlay).toHaveCSS("pointer-events", "none");
  // A paper veil isolates the hero scene so page copy cannot bleed through the labels.
  const veilOf = () => page.evaluate(() => {
    const el = document.querySelector('[data-testid="lucis-orbit-overlay"]');
    if (!el) return { opacity: 0, background: "rgba(0, 0, 0, 0)" };
    const cs = getComputedStyle(el, "::before");
    return { opacity: parseFloat(cs.opacity), background: cs.backgroundColor };
  });
  await expect.poll(async () => (await veilOf()).opacity, { timeout: 2000 }).toBeGreaterThan(0.9);
  const veil = await veilOf();
  expect(veil.background).toBe("rgb(247, 248, 246)");
  await expect(overlay.locator(".lo-sun")).toBeVisible();
  await expect(overlay.locator(".lo-planet")).toHaveCount(3);
  // The hero-scale scene carries readable identity and direction labels (en locale).
  for (const label of ["Lucis", "AI Applications", "Data Engineering", "Data Analytics"]) {
    await expect(overlay.getByText(label, { exact: true })).toBeVisible();
  }
  await expect(orbit).toHaveAttribute("data-entering", "true");
  const viewport = page.viewportSize()!;
  const overlayBox = (await overlay.locator(".lucis-orbit-system").boundingBox())!;
  expect(overlayBox.width).toBeGreaterThan(300);
  expect(Math.abs(overlayBox.x + overlayBox.width / 2 - viewport.width / 2)).toBeLessThan(40);
  expect(Math.abs(overlayBox.y + overlayBox.height / 2 - viewport.height / 2)).toBeLessThan(40);
  // While the system flies, the final mark beside the name is still hidden and much smaller.
  const markBox = (await orbit.boundingBox())!;
  expect(markBox.width).toBeLessThanOrEqual(40);
  expect(overlayBox.width).toBeGreaterThan(markBox.width * 5);
  await expect(orbit).toHaveCSS("opacity", "0");
  // After the one-time entrance the overlay is gone and the static mark sits beside the name.
  await expect(overlay).toHaveCount(0, { timeout: 5000 });
  await expect(orbit).toHaveAttribute("data-entering", "false");
  await expect(orbit).toHaveCSS("opacity", "1");
  await expect.poll(() => page.evaluate(() => window.sessionStorage.getItem("lucis-orbit-seen-v3"))).toBe("1");
  await expect(page.getByRole("link", { name: /GitHub/ })).toHaveAttribute("target", "_blank");
  await expect(page.getByRole("link", { name: /LinkedIn/ })).toHaveAttribute("rel", /noopener/);
  const phone = page.getByRole("link", { name: "Phone", exact: true });
  await expect(phone).toHaveAttribute("href", "tel:+8615990784046");
  await expect(page.locator(".identity-links")).not.toContainText("+86 15990784046");
  await phone.click();
  await expect(page.getByRole("dialog", { name: "Contact by phone" })).toContainText("+86 15990784046");
  await page.getByRole("button", { name: "Close phone number" }).click();
  await page.getByRole("button", { name: "WeChat" }).click();
  await expect(page.getByAltText("WeChat QR code for Lucis")).toHaveAttribute("src", /wechat-en\.jpg/);
  await expect(page.getByRole("dialog")).toContainText("ZJ_Lucis");
  await page.getByRole("button", { name: "Close WeChat QR code" }).click();
  await page.reload({ waitUntil: "networkidle" });
  // Replay is suppressed: no overlay, no entrance, final static mark directly.
  await expect(page.getByTestId("lucis-orbit-overlay")).toHaveCount(0);
  await expect(orbit).not.toHaveClass(/is-entering/);
  await expect(orbit).toHaveAttribute("data-entering", "false");
  await expect(orbit).toHaveCSS("animation-name", "none");
  await expect(orbit).toHaveCSS("opacity", "1");
  const box = await orbit.boundingBox();
  expect(box?.width).toBe(40);
  expect(box?.height).toBe(40);

  await page.getByRole("button", { name: "中", exact: true }).click();
  await expect(page.getByRole("link", { name: /LinkedIn/ })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "电话", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "邮箱", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "微信", exact: true }).click();
  await expect(page.getByAltText("Lucis 的微信二维码")).toHaveAttribute("src", /wechat-zh\.jpg/);
});

test("Lucis Orbit hero scene labels follow the Chinese locale", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The labeled hero scene is exercised once per locale.");
  await page.addInitScript(() => {
    window.localStorage.setItem("portfolio-locale", "zh");
    window.sessionStorage.removeItem("lucis-orbit-seen-v3");
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const overlay = page.getByTestId("lucis-orbit-overlay");
  await expect(overlay).toBeVisible();
  // Visible in the hero-scale scene, not merely present in the DOM.
  for (const label of ["Lucis", "AI 应用", "数据工程", "数据分析"]) {
    await expect(overlay.getByText(label, { exact: true })).toBeVisible();
  }
  // Labels retire with the entrance; the final mark beside the name stays small and static.
  await expect(overlay).toHaveCount(0, { timeout: 5000 });
  const mark = page.getByTestId("lucis-orbit");
  await expect(mark).toHaveCSS("opacity", "1");
  expect(((await mark.boundingBox())!).width).toBeLessThanOrEqual(40);
});

test("mobile 390px keeps the Lucis mark compact without horizontal overflow", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "The 390px overflow regression is specific to the mobile layout.");
  await page.addInitScript(() => {
    window.localStorage.setItem("portfolio-locale", "en");
    window.sessionStorage.setItem("lucis-orbit-seen-v3", "1");
  });
  await page.goto("/", { waitUntil: "networkidle" });
  const orbit = page.getByTestId("lucis-orbit");
  await expect(orbit).toBeVisible();
  await expect(page.getByTestId("lucis-orbit-overlay")).toHaveCount(0);
  await expect(orbit).not.toHaveClass(/is-entering/);
  const box = await orbit.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeLessThanOrEqual(32);
  expect(box!.height).toBeLessThanOrEqual(32);
  const viewportWidth = page.viewportSize()?.width ?? 390;
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewportWidth);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("mobile phone contact keeps the native dial link without exposing the number in the homepage row", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "The native dial behavior is specific to the mobile layout.");
  await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "zh"));
  await page.goto("/?lang=zh", { waitUntil: "networkidle" });
  const phone = page.getByRole("link", { name: "电话", exact: true });
  await expect(phone).toHaveAttribute("href", "tel:+8615990784046");
  await expect(page.locator(".identity-links")).not.toContainText("+86 15990784046");
  await phone.click();
  await expect(page.getByRole("dialog", { name: "电话联系" })).toHaveCount(0);
});

test("footer contact returns to the localized homepage contact row", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The shared footer destination only needs one route pass.");
  await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "zh"));
  await page.goto("/ai/release-guardian?lang=zh", { waitUntil: "networkidle" });
  const contact = page.getByRole("link", { name: "联系章向国", exact: true });
  await expect(contact).toHaveAttribute("href", "/?lang=zh#contact");
  await contact.click();
  await expect(page).toHaveURL(/\/?\?lang=zh#contact$/);
  await expect(page.locator("#contact")).toBeVisible();
});

test("portfolio search returns bilingual, typo-tolerant, and nearest-page results", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Shared search ranking is exercised once.");
  await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "en"));
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Search/ }).click();
  const input = page.getByPlaceholder("Search projects, systems, or tools");
  await input.fill("relese gate");
  await expect(page.locator("[cmdk-item]").first()).toContainText("Release Guardian");
  await expect(page.locator("[cmdk-item]")).toHaveCount(1);
  await input.fill("scan confidential PDF");
  await expect(page.locator("[cmdk-item]").first()).toContainText("Privacy Preflight Web");
  await input.fill("a completely unrelated business phrase");
  await expect(page.locator("[cmdk-item]")).toHaveCount(0);
  await expect(page.locator(".command-empty")).toContainText("No confident project match");
  await expect(page.locator(".command-search-note")).toContainText("bilingual concepts");
  await page.getByRole("button", { name: "Ask an open-ended question" }).click();
  await expect(page.getByTestId("assistant-widget")).toBeVisible();
  await page.getByRole("button", { name: "Close portfolio assistant" }).click();

  await page.getByRole("button", { name: "中", exact: true }).click();
  await page.getByRole("button", { name: "搜索" }).click();
  await page.getByPlaceholder("搜索项目、系统或工具").fill("利润分析");
  await expect(page.locator("[cmdk-item]").first()).toContainText("毛利控制塔");
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
  await expect(page.locator(".artifact-page-header > div:first-child > p:not(.eyebrow)")).toHaveText("流式可靠性实验室 / MARKDOWN");
  await expect(page.locator(".artifact-page-header")).not.toContainText("P1 Reliability Lab");
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
});

test("Chinese artifact controls localize tree summaries while preserving source identity", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Locale mechanics are shared across viewports.");
  await page.goto("/artifact?src=/case-studies/rag-quality-lab/claim-registry.json&lang=zh", { waitUntil: "networkidle" });

  const rootSummary = page.locator(".json-tree > .json-node > summary");
  await expect(rootSummary.locator("span")).toHaveText("根节点");
  await expect(rootSummary.locator("small")).toHaveText("9 个键");
  await expect(page.locator(".json-node summary small").filter({ hasText: /^4 项$/ })).toBeVisible();
  await expect(page.locator(".json-tree")).toContainText("project");
  await expect(page.locator(".json-tree")).toContainText('"RAG Quality Lab"');
  await expect(page.locator(".artifact-page-header > div:first-child > p:not(.eyebrow)")).toHaveText("RAG 质量实验室 / JSON");
});

test("Chinese artifact errors expose only controlled localized messages", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Diagnostic presentation is shared across viewports.");

  await page.goto("/artifact?src=/case-studies/rag-quality-lab/missing.json&lang=zh", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".artifact-error")).toHaveText("无法打开该文件。");
  await expect(page.locator(".artifact-error")).not.toContainText("HTTP 404");

  await page.route("**/case-studies/rag-quality-lab/broken.pdf", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/pdf", body: "not a PDF" });
  });
  await page.goto("/artifact?src=/case-studies/rag-quality-lab/broken.pdf&lang=zh", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".artifact-error")).toHaveText("PDF 预览加载失败，请下载原文件。", { timeout: 20_000 });
  await expect(page.locator(".artifact-error small")).toHaveCount(0);

  await page.route("**/case-studies/rag-quality-lab/broken.mmd", async (route) => {
    await route.fulfill({ status: 200, contentType: "text/plain", body: "not a Mermaid diagram" });
  });
  await page.goto("/artifact?src=/case-studies/rag-quality-lab/broken.mmd&lang=zh", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".artifact-error")).toHaveText("架构图渲染失败，仍可查看下方 Mermaid 源码。", { timeout: 20_000 });
  await expect(page.locator(".artifact-error small")).toHaveCount(0);
});

test("root, track, project, and artifact metadata follow the active locale", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Metadata synchronization is shared across viewports.");
  const description = page.locator('meta[name="description"]');

  await page.goto("/?lang=zh", { waitUntil: "networkidle" });
  await expect.poll(() => page.title()).toBe("章向国 | 作品集");
  await expect.poll(() => description.evaluateAll((nodes) => nodes.length > 0 && nodes.every((node) => node.getAttribute("content") === "数据工程、决策分析与 AI 应用项目——交互式演示，并明确每项所能验证的范围。"))).toBe(true);
  await expect(page.getByRole("navigation", { name: "主要导航" })).toBeVisible();

  await page.goto("/analytics?lang=zh", { waitUntil: "networkidle" });
  const trackTitle = await page.locator("main > header h1").innerText();
  const trackDescription = await page.locator("main > header .lede").innerText();
  await expect.poll(() => page.title()).toBe(`${trackTitle} | 章向国`);
  await expect.poll(() => description.evaluateAll((nodes, expected) => nodes.every((node) => node.getAttribute("content") === expected), trackDescription)).toBe(true);

  await page.goto("/ai/rag-quality-lab?lang=zh", { waitUntil: "networkidle" });
  const projectTitle = await page.locator("#project-title").innerText();
  const projectDescription = await page.locator(".case-title .lede").innerText();
  await expect.poll(() => page.title()).toBe(`${projectTitle} | 章向国`);
  await expect.poll(() => description.evaluateAll((nodes, expected) => nodes.every((node) => node.getAttribute("content") === expected), projectDescription)).toBe(true);

  await page.goto("/artifact?src=/case-studies/rag-quality-lab/claim-registry.json&lang=zh", { waitUntil: "networkidle" });
  await expect.poll(() => page.title()).toBe("项目文件 | 章向国");
  await expect.poll(() => description.evaluateAll((nodes) => nodes.every((node) => node.getAttribute("content") === "查看器仅增加说明与操作控件，原文件内容保持不变并可直接下载。"))).toBe(true);
});
