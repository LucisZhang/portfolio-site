import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

const cases = [
  { file: "privacy-preflight/image-synthetic-input.png", project: { en: "Privacy Preflight", zh: "Privacy Preflight" }, route: "/ai/privacy-preflight", type: "PNG", viewer: ".artifact-image-viewer img" },
  { file: "exactly-once-drills/media/phase-1.4-dashboard.jpg", project: { en: "Exactly-Once Drills", zh: "Exactly-Once Drills" }, route: "/engineering/exactly-once-drills", type: "JPG", viewer: ".artifact-image-viewer img" },
  { file: "frontier-forge/architecture.svg", project: { en: "Frontier Forge", zh: "Frontier Forge" }, route: "/ai/frontier-forge", type: "SVG", viewer: ".artifact-image-viewer img" },
  { file: "privacy-preflight/pdf-synthetic-redacted.pdf", project: { en: "Privacy Preflight", zh: "Privacy Preflight" }, route: "/ai/privacy-preflight", type: "PDF", viewer: ".artifact-pdf-canvas canvas" },
  { file: "rag-quality-lab/claim-registry.json", project: { en: "RAG Quality Lab", zh: "RAG Quality Lab" }, route: "/ai/rag-quality-lab", type: "JSON", viewer: ".json-tree" },
  { file: "release-guardian/data/findings.csv", project: { en: "Release Guardian", zh: "Release Guardian" }, route: "/ai/release-guardian", type: "CSV", viewer: ".artifact-table-scroll" },
  { file: "exactly-once-drills/README.md", project: { en: "Exactly-Once Drills", zh: "Exactly-Once Drills" }, route: "/engineering/exactly-once-drills", type: "MD", viewer: ".artifact-markdown" },
  { file: "margin-control-tower/architecture.mmd", project: { en: "Margin Control Tower", zh: "Margin Control Tower" }, route: "/analytics/margin-control-tower", type: "MMD", viewer: ".artifact-mermaid-svg svg" },
  { file: "privacy-preflight/downloads/CPython-LICENSE.txt", project: { en: "Privacy Preflight", zh: "Privacy Preflight" }, route: "/ai/privacy-preflight", type: "TXT", viewer: ".artifact-raw-source" },
  { file: "credit-policy-desk/policy-contract.json", project: { en: "Credit Policy Desk", zh: "分数不是策略。" }, route: "/analytics/credit-policy-desk", type: "JSON", viewer: ".json-tree" },
  { file: "crossover-study/workbench/queries.json", project: { en: "Crossover Study", zh: "Crossover Study" }, route: "/engineering/crossover-study", type: "JSON", viewer: ".json-tree" },
  { file: "triage-router/strategy-cards.json", project: { en: "Triage Router", zh: "Triage Router" }, route: "/ai/triage-router", type: "JSON", viewer: ".json-tree" },
];
const rag = "/case-studies/rag-quality-lab/claim-registry.json";
const markdown = "/case-studies/exactly-once-drills/README.md";
const url = (src: string, rest: Record<string, string> = {}) => `/artifact?${new URLSearchParams({ src, ...rest })}`;

for (const item of cases) {
  test(`artifact context and exact download: ${item.file}`, async ({ page }, testInfo) => {
    const source = `/case-studies/${item.file}`;
    const lang = testInfo.project.name === "desktop" ? "en" : "zh";
    const response = await page.goto(url(source, { lang }));
    expect(response?.headers()["content-security-policy"]).toContain("object-src 'none'");
    await expect(page.locator(".artifact-page-header")).toContainText(item.project[lang]);
    await expect(page.locator(".artifact-page-header")).toContainText(item.type);
    await expect(page.locator(".artifact-page-header h1")).toHaveText(item.file.split("/").pop()!);
    await expect(page.locator(".artifact-page > .back-link")).toHaveAttribute("href", item.route + (lang === "zh" ? "?lang=zh" : ""));
    await expect(page.getByRole("region", { name: lang === "en" ? "Provenance context" : "来源说明" })).toBeVisible();
    await expect(page.locator(item.viewer)).toBeVisible({ timeout: 30_000 });
    await expect(page.locator("[data-exhibition-rail], .circuit-nav, .exhibit-rail-tools")).toHaveCount(0);
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("link", { name: lang === "en" ? "Download original" : "下载原文件", exact: true }).click();
    const download = await downloadPromise;
    expect(await readFile((await download.path())!)).toEqual(await readFile(`public${source}`));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  });
}

test("invalid src never loads an artifact or exposes attacker return context", async ({ page }) => {
  const fetched: string[] = [];
  page.on("request", (request) => { if (new URL(request.url()).pathname.startsWith("/case-studies/")) fetched.push(request.url()); });
  const attacks = [
    "https://evil.test/data.json", "//evil.test/image.png", "javascript:alert(1)",
    "/case-studies/privacy-preflight/../../.env.txt", "/case-studies/privacy-preflight/%2e%2e/bad.pdf",
    "/case-studies/release-guardian/%252e%252e/bad.mmd", "/case-studies/release-guardian/data%2ffindings.csv",
    "/case-studies/exactly-once-drills/\\README.md", "/case-studies/exactly-once-drills/missing.md",
    "data:text/plain,anything.txt", "blob:https://evil.test/anything.svg", "/api/assistant",
  ];
  for (const src of attacks) {
    await page.goto(url(src, { from: "//evil.test", lang: "zh" }));
    await expect(page.locator(".artifact-error[role=alert]")).toHaveText("未选择有效的项目文件。");
    await expect(page.locator(".artifact-page > .back-link")).toHaveAttribute("href", "/?lang=zh");
    await expect(page.getByRole("link", { name: "下载原文件" })).toHaveCount(0);
    await expect(page).toHaveURL(/\/artifact\?lang=zh$/);
  }
  await page.goto(url(rag) + `&src=${encodeURIComponent(markdown)}`);
  await expect(page.locator(".artifact-error[role=alert]")).toBeVisible();
  expect(fetched).toEqual([]);
});

test("return and locale are canonical across aliases, nested languages, duplicates, and reload", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("portfolio-locale", "zh"));
  await page.goto(url(markdown, { from: "/engineering/p1-reliability-lab?lang=zh&next=//evil.test", lang: "en" }));
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator(".back-link")).toHaveAttribute("href", "/engineering/exactly-once-drills");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.goto(url(rag, { from: "/ai/frontier-forge", lang: "zh-CN" }));
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator(".back-link")).toHaveAttribute("href", "/ai/rag-quality-lab");
  await page.goto(url(rag, { lang: "zh" }) + "&lang=en&from=//evil.test&from=/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator(".back-link")).toHaveAttribute("href", "/ai/rag-quality-lab");
  await page.getByRole("button", { name: "中", exact: true }).click();
  await expect(page.locator(".back-link")).toHaveAttribute("href", "/ai/rag-quality-lab?lang=zh");
  await page.locator(".back-link").click();
  await expect(page).toHaveURL(/\/ai\/rag-quality-lab\?lang=zh$/);
});

test("archived files return to the localized archive", async ({ page }) => {
  await page.goto(url("/case-studies/analytics-tandem/links.json", { lang: "zh" }));
  await expect(page.locator(".back-link")).toHaveAttribute("href", "/?lang=zh#archive");
  await expect(page.locator(".artifact-page-header")).toContainText("Analytics Tandem");
  await page.reload();
  await expect(page.locator(".back-link")).toHaveAttribute("href", "/?lang=zh#archive");
});

test("long Markdown has keyboard sections and byte-exact source; small files omit the index", async ({ page }) => {
  const text = ["# Report", "", "A paragraph. ".repeat(120), "", "## Repeated", "", "```js", "const literal = '<script>never run</script>';", "```", "", "## Repeated", "", "### 中文标题", "", `[Raw record](${rag})`, ""].join("\r\n");
  await page.route(`**${markdown}`, (route) => route.fulfill({ contentType: "text/markdown", body: text }));
  await page.goto(url(markdown));
  const index = page.getByRole("navigation", { name: "On this page", exact: true });
  await expect(index.getByRole("link")).toHaveCount(4);
  const section = index.getByRole("link", { name: "Repeated", exact: true }).nth(1);
  await section.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#repeated-3")).toBeFocused();
  await expect(page).toHaveURL(/#repeated-3$/);
  await page.getByRole("button", { name: "View source", exact: true }).click();
  expect(await page.locator(".artifact-raw-source code").textContent()).toBe(text);
  await page.getByRole("button", { name: "Read document" }).click();
  await expect(page.locator(".artifact-markdown pre code")).toContainText("<script>never run</script>");
  await page.unroute(`**${markdown}`);
  await page.route(`**${markdown}`, (route) => route.fulfill({ contentType: "text/markdown", body: "# Small\n\n## Note\n\nShort." }));
  await page.reload();
  await expect(page.locator(".artifact-markdown")).toContainText("Short.");
  await expect(page.getByRole("navigation", { name: "On this page" })).toHaveCount(0);
});

test("text headings navigate without changing literal license content", async ({ page }) => {
  const source = "/case-studies/privacy-preflight/downloads/CPython-LICENSE.txt";
  await page.goto(url(source, { lang: "zh" }));
  const index = page.getByRole("navigation", { name: "目录", exact: true });
  await expect(index.getByRole("link").first()).toBeVisible();
  await index.getByRole("link").nth(1).focus();
  await page.keyboard.press("Enter");
  expect(await page.locator(".artifact-raw-source code").textContent()).toBe(await readFile(`public${source}`, "utf8"));
  await expect(page.locator(".artifact-markdown")).toHaveCount(0);
});

test("nested file links and browser history clear stale project, search, sections, and language", async ({ page }) => {
  await page.route(`**${markdown}`, (route) => route.fulfill({ contentType: "text/markdown", body: `# Report\n\n[Registry](${rag})\n\n[Capture](results/u6-local-mac/SUMMARY.md)` }));
  await page.goto(url(markdown, { from: "/", lang: "zh" }));
  await page.getByRole("link", { name: "Registry", exact: true }).click();
  await expect(page.locator(".artifact-page-header h1")).toHaveText("claim-registry.json");
  await expect(page.locator(".back-link")).toHaveAttribute("href", "/ai/rag-quality-lab?lang=zh");
  await page.getByPlaceholder("搜索键或值").fill("11309");
  await page.goBack();
  await expect(page.locator(".artifact-page-header h1")).toHaveText("README.md");
  await expect(page.locator(".back-link")).toHaveAttribute("href", "/?lang=zh");
  await page.goForward();
  await expect(page.getByPlaceholder("搜索键或值")).toHaveValue("");
  await page.evaluate((href) => history.pushState(null, "", href), url("/case-studies/frontier-forge/architecture.svg", { lang: "en" }));
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator(".back-link")).toHaveAttribute("href", "/ai/frontier-forge");
  await expect(page.locator(".artifact-image-viewer img")).toBeVisible();
  await expect(page.locator(".json-tree, .artifact-section-index")).toHaveCount(0);
});

test("Markdown markup cannot load off-site images or unsafe links", async ({ page }) => {
  const external: string[] = [];
  page.on("request", (request) => { if (request.url().includes("evil.test")) external.push(request.url()); });
  await page.route(`**${markdown}`, (route) => route.fulfill({ contentType: "text/markdown", body: `# Document\n\n![remote](https://evil.test/track.png)\n\n![protocol](//evil.test/a.svg)\n\n[run](javascript:alert(1))\n\n[api](/api/assistant)\n\n<script>window.artifactInjection=true</script>\n\n[allowed](${rag})\n` }));
  await page.goto(url(markdown));
  await expect(page.locator(".artifact-markdown")).toBeVisible();
  await expect(page.locator(".artifact-markdown img, .artifact-markdown script")).toHaveCount(0);
  await expect(page.locator(".artifact-markdown a")).toHaveCount(1);
  expect(external).toEqual([]);
  expect(await page.evaluate(() => "artifactInjection" in window)).toBe(false);
});

test("redirected artifacts fail closed before contacting the redirect target", async ({ page }) => {
  const external: string[] = [];
  page.on("request", (request) => { if (request.url().includes("evil.test")) external.push(request.url()); });
  await page.route(`**${rag}`, (route) => route.fulfill({ status: 302, headers: { location: "https://evil.test/payload.json" }, body: "" }));
  await page.goto(url(rag, { lang: "zh" }));
  await expect(page.locator(".artifact-error[role=alert]")).toHaveText("无法打开该文件。");
  expect(external).toEqual([]);
  await expect(page.locator(".json-tree")).toHaveCount(0);
});

test("artifact global search retains its keyboard shortcut without a project rail", async ({ page }) => {
  await page.goto(url(rag, { lang: "zh" }));
  await expect(page.locator(".json-tree")).toBeVisible();
  await page.keyboard.press("ControlOrMeta+k");
  await expect(page.locator(".command-dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".command-dialog")).toHaveCount(0);
  await expect(page.locator(".artifact-page-header")).toContainText("RAG Quality Lab");
  await expect(page.locator("[data-exhibition-rail]")).toHaveCount(0);
});
