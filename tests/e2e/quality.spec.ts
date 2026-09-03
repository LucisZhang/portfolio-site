import { expect, test } from "@playwright/test";
import { SEL } from "./selectors";
import axe from "axe-core";
import { getProject } from "../../src/lib/projects";

const auditRoutes = [
  "/",
  "/engineering/exactly-once-drills",
  "/ai/release-guardian",
  "/ai/rag-quality-lab",
  "/ai/privacy-preflight",
  "/analytics/margin-control-tower",
  "/analytics/credit-policy-desk",
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

  // Task F9: exactly-once-drills' reduced-motion contract moved again, from
  // EodInstrument's Scrubber (retired along with the rest of the old
  // fault-chessboard instrument) to the Duty Logbook's native <details>
  // entries — under prefers-reduced-motion, opening a closed entry via the
  // keyboard alone reveals its complete transcript instantly and the
  // replay state machine never arms (verified here by keyboard alone).
  await page.goto("/engineering/exactly-once-drills", { waitUntil: "networkidle" });
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe("auto");
  // `.first()` is a live query that re-resolves on every await — pin the
  // specific entry by its drill id before interacting, otherwise a
  // successful keyboard toggle just shifts "the first closed entry" to the
  // next one and every assertion below would appear to fail.
  const targetId = await page.locator(SEL.exhibit("01")).locator("[data-log-entry]:not([open])").first().getAttribute("data-drill-id");
  const closedEntry = page.locator(`[data-log-entry][data-drill-id="${targetId}"]`);
  const summary = closedEntry.locator("summary");
  await summary.focus();
  await summary.press("Space");
  await expect(closedEntry).toHaveAttribute("open", "");
  await expect(closedEntry).toHaveAttribute("data-replay-state", "idle");
  await expect(closedEntry.locator("[data-log-line]").first()).toBeVisible();

  await page.goto("/ai/privacy-preflight", { waitUntil: "networkidle" });
  const imageTab = page.getByRole("tab", { name: "Image" });
  await imageTab.focus();
  await page.keyboard.press("Enter");
  await expect(imageTab).toHaveAttribute("aria-selected", "true");
  const chooseImage = page.getByRole("button", { name: "Choose image" }).first();
  await chooseImage.focus();
  const fileChooser = page.waitForEvent("filechooser");
  await page.keyboard.press("Enter");
  await (await fileChooser).setFiles("public/case-studies/privacy-preflight/image-synthetic-input.png");
  await expect(page.locator(SEL.privacyCanvasWrapCanvas)).toBeVisible();

  // Task L4: the pre-rebuild "Review capacity" slider this leg used to
  // drive no longer exists (src/components/analytics/CreditPolicyLab.tsx
  // is unrouted) -- exercises the rebuilt chart-led page's own native
  // keyboard-operable disclosure instead (exhibit 04's <details>/<summary>
  // "View verification SQL" panel, same pattern as the exactly-once-drills
  // Duty Logbook entry above).
  await page.goto("/analytics/credit-policy-desk", { waitUntil: "networkidle" });
  const verifySqlSummary = page.locator(SEL.exhibit("04")).locator("summary");
  await verifySqlSummary.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(SEL.exhibit("04")).locator(".credit-verify-sql")).toHaveAttribute("open", "");

  await page.goto("/", { waitUntil: "networkidle" });
  // Task 1.2: the homepage's Round-1 LucisOrbit mark is removed (no
  // decorative animated emblem fits the exhibition grammar's no-icon rule
  // and the hero's new content script has no slot for it) — the reduced-
  // motion check that mattered here carries forward as "the rail's
  // language toggle stays keyboard-operable", asserted below.
  await expect(page.locator(SEL.homeHeroTitle)).toBeVisible();
  const chinese = page.getByRole("button", { name: "中", exact: true });
  await chinese.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(SEL.html)).toHaveAttribute("lang", "zh-CN");
});

// Task 1.2: the pre-rebuild homepage rendered contact controls as icon+text
// buttons inside `.identity-links` under a decorative LucisOrbit mark. The
// rebuilt hero (spec §2.1's no-icon rule) renders the same phone/WeChat/
// GitHub/LinkedIn/email functionality as plain text links with no <svg>
// children (home-r2.spec.ts asserts the icon-free structure directly);
// this test keeps the deeper behavioral coverage — locale-conditional
// LinkedIn, the phone dialog, and the WeChat QR variants — against the new
// markup. The orbit's own position/animation assertions have no
// replacement: the mark itself is removed, not relocated.
test("homepage contacts and WeChat QR variants follow locale", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Shared homepage behavior is exercised once.");
  await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "en"));
  await page.goto("/", { waitUntil: "domcontentloaded" });
  // Two GitHub links exist on the homepage now — the hero contact link
  // (exhibit 00) and the source link in exhibit 06's receipts — so this
  // scopes to the hero's, matching what this test otherwise exercises.
  await expect(page.locator(SEL.homeHero).getByRole("link", { name: /GitHub/ })).toHaveAttribute("target", "_blank");
  await expect(page.getByRole("link", { name: /LinkedIn/ })).toHaveAttribute("rel", /noopener/);
  expect(await page.locator(SEL.homeHeroContactLink).evaluateAll((controls) => (
    controls.map((control) => control.querySelectorAll(":scope > svg").length)
  ))).toEqual([0, 0, 0, 0, 0]);
  const phone = page.getByRole("link", { name: "Phone", exact: true });
  await expect(phone).toHaveAttribute("href", "tel:+8615990784046");
  await expect(page.locator(SEL.homeHero)).not.toContainText("+86 15990784046");
  await phone.click();
  await expect(page.getByRole("dialog", { name: "Contact by phone" })).toContainText("+86 15990784046");
  await page.getByRole("button", { name: "Close phone number" }).click();
  await page.getByRole("button", { name: "WeChat" }).click();
  await expect(page.getByAltText("WeChat QR code for Lucis")).toHaveAttribute("src", /wechat-en\.jpg/);
  await expect(page.getByRole("dialog")).toContainText("ZJ_Lucis");
  await page.getByRole("button", { name: "Close WeChat QR code" }).click();

  await page.getByRole("button", { name: "中", exact: true }).click();
  await expect(page.getByRole("link", { name: /LinkedIn/ })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "电话", exact: true })).toBeVisible();
  // Two "邮箱" links exist now (hero contact + exhibit 06 receipts).
  await expect(page.locator(SEL.homeHero).getByRole("link", { name: "邮箱", exact: true })).toBeVisible();
  expect(await page.locator(SEL.homeHeroContactLink).evaluateAll((controls) => (
    controls.map((control) => control.querySelectorAll(":scope > svg").length)
  ))).toEqual([0, 0, 0, 0]);
  await page.getByRole("button", { name: "微信", exact: true }).click();
  await expect(page.getByAltText("Lucis 的微信二维码")).toHaveAttribute("src", /wechat-zh\.jpg/);
});

test("the SSR homepage ships all seven exhibits without a reveal overlay", async ({ request }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "One SSR HTML audit is sufficient.");
  const html = await (await request.get("/")).text();
  expect(html).not.toContain('data-testid="lucis-orbit-overlay"');
  for (const num of ["00", "01", "02", "03", "04", "05", "06"]) {
    expect(html).toContain(`data-exhibit="${num}"`);
  }
});

test("the hero's independent Chinese narrative renders only in zh locale", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The zh-only hero narrative is exercised once per locale.");
  await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "zh"));
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator(SEL.homeHeroZh)).toBeVisible();
  await expect(page.locator(SEL.homeHeroZh)).toHaveText(/[㐀-鿿]/);
  // The English assertion title stays pinned to the self-hosted Latin
  // display serif even under the zh locale toggle (spec §2.3's explicit
  // asymmetry) rather than switching to the CJK serif :lang(zh) rule.
  await expect(page.locator(SEL.homeHeroTitle)).toHaveAttribute("lang", "en");
  // Task F5 (locale purity, user's binding rule): the zh narrative is no
  // longer always-on — it must not render in en locale. See home-r2.spec.ts
  // for the full en/zh coverage; this is a targeted regression check next
  // to the assertion above that used to claim the opposite.
  await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "en"));
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator(SEL.homeHeroZh)).toHaveCount(0);
});

test("pass indicators use ok while small hover text keeps accessible accent contrast", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Shared semantic colors are exercised once.");
  await page.goto("/ai/release-guardian", { waitUntil: "networkidle" });
  await expect(page.locator(SEL.metricTableSvg).first()).toHaveCSS("color", "rgb(47, 107, 82)");
  const evidenceLink = page.locator(SEL.evidenceLinkA).first();
  await expect(evidenceLink).toHaveCSS("color", "rgb(157, 43, 38)");
  await evidenceLink.hover();
  await expect(evidenceLink).toHaveCSS("color", "rgb(157, 43, 38)");
  // The privacy-preflight `.redline-grid` pass-indicator this test used
  // to also check here was deleted by the privacy restraint pass (ba9a83f)
  // and has no static equivalent: the rebuilt page's only default-rendered
  // status states are an idle workbench (no scan/accept yet) and exhibit
  // 04's deliberately always-failing demonstration -- a real `.pass` state
  // now requires simulating a scan+accept+confirm flow, which is out of
  // scope for this static color-token check.
});

test("mobile 390px keeps the hero readable without horizontal overflow", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "The 390px overflow regression is specific to the mobile layout.");
  await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "en"));
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator(SEL.homeHeroTitle)).toBeVisible();
  const viewportWidth = page.viewportSize()?.width ?? 390;
  const titleBox = (await page.locator(SEL.homeHeroTitle).boundingBox())!;
  expect(titleBox.x + titleBox.width).toBeLessThanOrEqual(viewportWidth + 1);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("mobile phone contact keeps the native dial link without exposing the number in the homepage row", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "The native dial behavior is specific to the mobile layout.");
  await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "zh"));
  await page.goto("/?lang=zh", { waitUntil: "networkidle" });
  const phone = page.getByRole("link", { name: "电话", exact: true });
  await expect(phone).toHaveAttribute("href", "tel:+8615990784046");
  await expect(page.locator(SEL.homeHero)).not.toContainText("+86 15990784046");
  await phone.click();
  await expect(page.getByRole("dialog", { name: "电话联系" })).toHaveCount(0);
});

test("footer contact returns to the top of the localized homepage contact section", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The shared rail contact link only needs one route pass.");
  await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "zh"));
  await page.goto("/?lang=zh", { waitUntil: "networkidle" });
  // Task 0.5: the contact link used to live in the deleted global <footer>
  // at the bottom of a long page, so reaching it required scrolling down —
  // that premise is asserted below with a manual scroll. It now lives in
  // the exhibition rail's always-visible tools slot (LegacyRailTools), so
  // scrollIntoViewIfNeeded() would no longer need to move the page at all;
  // what's still meaningful and still asserted is that clicking it jumps
  // back to the top of the localized contact section.
  await page.evaluate(() => window.scrollTo(0, 600));
  const contact = page.getByRole("link", { name: "联系章向国", exact: true });
  await expect(contact).toBeVisible();
  await contact.click();
  await expect(page).toHaveURL(/\/?\?lang=zh#contact$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThanOrEqual(1);
  await expect(page.locator(SEL.sectionContactWorkspaceHead)).toBeVisible();

  // Task L1: the second leg of this test used to repeat the same check on
  // "/ai/release-guardian?lang=zh" via the legacy-shell route's
  // LegacyRailTools contact link. release-guardian is now a standalone
  // route (src/app/ai/release-guardian/page.tsx, guardianRail.ts) built on
  // the same ExhibitShell contract frontier-forge/triage-router/privacy-
  // preflight-mac already use — none of those either render a rail-tools
  // contact link (their RailSpec footers carry only "← ALL WORK"), so this
  // was never a property this route class actually has; it belonged to
  // the retired legacy shell alone.
});

test("portfolio search returns bilingual, typo-tolerant, and nearest-page results", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Shared search ranking is exercised once.");
  await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "en"));
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Search/ }).click();
  const input = page.getByPlaceholder("Search projects, systems, or tools");
  await input.fill("relese gate");
  await expect(page.locator(SEL.cmdkItem).first()).toContainText("Release Guardian");
  await expect(page.locator(SEL.cmdkItem)).toHaveCount(1);
  await input.fill("scan confidential PDF");
  await expect(page.locator(SEL.cmdkItem).first()).toContainText("Privacy Preflight");
  await input.fill("a completely unrelated business phrase");
  await expect(page.locator(SEL.cmdkItem)).toHaveCount(0);
  await expect(page.locator(SEL.commandEmpty)).toContainText("No confident project match");
  await expect(page.locator(SEL.commandSearchNote)).toContainText("support English, Simplified and Traditional Chinese, pinyin");
  await page.getByRole("button", { name: "Ask an open-ended question" }).click();
  await expect(page.getByTestId("assistant-widget")).toBeVisible();
  await page.getByRole("button", { name: "Close portfolio assistant" }).click();

  await page.getByRole("button", { name: "中", exact: true }).click();
  await page.getByRole("button", { name: "搜索" }).click();
  await page.getByPlaceholder("搜索项目、系统或工具").fill("利润分析");
  await expect(page.locator(SEL.cmdkItem).first()).toContainText("Margin Control Tower");
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
  await expect(page.locator(SEL.artifactImageViewerImg)).toBeVisible();
  await expect(page.locator(SEL.artifactZoomControlsOutput)).toHaveText("100%");
  await page.getByTitle("Zoom in").click();
  await expect(page.locator(SEL.artifactZoomControlsOutput)).toHaveText("125%");
  const imageDownload = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download original" }).click();
  expect((await imageDownload).suggestedFilename()).toBe("image-synthetic-input.png");

  await page.goto("/artifact?src=/case-studies/privacy-preflight/pdf-synthetic-redacted.pdf", { waitUntil: "networkidle" });
  const pdfCanvas = page.locator(SEL.artifactPdfCanvasCanvas);
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
  await expect(page.locator(SEL.artifactPdfControls)).toContainText("Page 1 / 1");

  await page.goto("/artifact?src=/case-studies/rag-quality-lab/claim-registry.json", { waitUntil: "networkidle" });
  await expect(page.locator(SEL.jsonTree)).toContainText("root");
  await page.getByPlaceholder("Search keys or values").fill("11309");
  await expect(page.locator(SEL.jsonTree)).toContainText("11309");
  const jsonDownload = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download", exact: true }).click();
  expect((await jsonDownload).suggestedFilename()).toBe("claim-registry.json");

  await page.goto("/artifact?src=/case-studies/release-guardian/data/findings.csv", { waitUntil: "networkidle" });
  await expect(page.locator(SEL.artifactFilterbar)).toContainText("13 records");
  const firstFinding = page.locator(SEL.tbodyTr).first().locator(SEL.td).first();
  await expect(firstFinding).toHaveText("W3-01");
  await page.getByRole("button", { name: /^id/ }).click();
  await page.getByRole("button", { name: /^id/ }).click();
  await expect(firstFinding).toHaveText("W3-13");
  await page.getByPlaceholder("Search all fields").fill("architecture");
  await expect(page.locator(SEL.tbodyTr)).toHaveCount(1);

  await page.goto("/artifact?src=/case-studies/exactly-once-drills/README.md", { waitUntil: "networkidle" });
  await expect(page.locator(SEL.artifactMarkdownH1)).toBeVisible();
  await expect(page.locator(SEL.artifactMarkdownLayoutAsideAHref).first()).toBeVisible();
  const markdownDownload = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download source" }).click();
  expect((await markdownDownload).suggestedFilename()).toBe("README.md");

  await page.goto("/artifact?src=/case-studies/release-guardian/architecture.mmd", { waitUntil: "networkidle" });
  const diagram = page.locator(SEL.artifactMermaidSvgSvg);
  await expect(diagram).toBeVisible();
  const diagramBox = await diagram.boundingBox();
  expect(diagramBox?.width ?? 0).toBeGreaterThan(900);
  expect(diagramBox?.height ?? 0).toBeGreaterThan(140);
  await page.getByRole("button", { name: "View source" }).click();
  await expect(page.locator(SEL.artifactRawSource)).toContainText("flowchart");
  await page.getByRole("button", { name: "Hide source" }).click();
  const svgDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download SVG" }).click();
  expect((await svgDownload).suggestedFilename()).toBe("architecture.svg");
});

test("artifact viewer preserves the shareable Chinese locale and project return URL", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Locale mechanics are shared across viewports.");
  await page.goto("/artifact?src=/case-studies/exactly-once-drills/README.md&from=/engineering/exactly-once-drills&lang=zh", { waitUntil: "networkidle" });
  await expect(page.locator(SEL.html)).toHaveAttribute("lang", "zh-CN");
  await expect(page.getByRole("link", { name: "返回项目" })).toHaveAttribute("href", /engineering\/exactly-once-drills\?lang=zh$/);
  await expect(page.locator(SEL.artifactPageHeaderDivFirstChildPNotEyebrow)).toHaveText("Exactly-Once Drills / MARKDOWN");
  await expect(page.locator(SEL.artifactPageHeader)).not.toContainText("P1 Reliability Lab");
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator(SEL.html)).toHaveAttribute("lang", "zh-CN");
});

test("Chinese artifact controls localize tree summaries while preserving source identity", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Locale mechanics are shared across viewports.");
  await page.goto("/artifact?src=/case-studies/rag-quality-lab/claim-registry.json&lang=zh", { waitUntil: "networkidle" });

  const rootSummary = page.locator(SEL.jsonTreeJsonNodeSummary);
  await expect(rootSummary.locator(SEL.span)).toHaveText("根节点");
  await expect(rootSummary.locator(SEL.small)).toHaveText("9 个键");
  await expect(page.locator(SEL.jsonNodeSummarySmall).filter({ hasText: /^4 项$/ })).toBeVisible();
  await expect(page.locator(SEL.jsonTree)).toContainText("project");
  await expect(page.locator(SEL.jsonTree)).toContainText('"RAG Quality Lab"');
  await expect(page.locator(SEL.artifactPageHeaderDivFirstChildPNotEyebrow)).toHaveText("RAG Quality Lab / JSON");
});

test("Chinese artifact errors expose only controlled localized messages", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Diagnostic presentation is shared across viewports.");

  await page.goto("/artifact?src=/case-studies/rag-quality-lab/missing.json&lang=zh", { waitUntil: "domcontentloaded" });
  await expect(page.locator(SEL.artifactError)).toHaveText("无法打开该文件。");
  await expect(page.locator(SEL.artifactError)).not.toContainText("HTTP 404");

  await page.route("**/case-studies/rag-quality-lab/broken.pdf", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/pdf", body: "not a PDF" });
  });
  await page.goto("/artifact?src=/case-studies/rag-quality-lab/broken.pdf&lang=zh", { waitUntil: "domcontentloaded" });
  await expect(page.locator(SEL.artifactError)).toHaveText("PDF 预览加载失败，请下载原文件。", { timeout: 20_000 });
  await expect(page.locator(SEL.artifactErrorSmall)).toHaveCount(0);

  await page.route("**/case-studies/rag-quality-lab/broken.mmd", async (route) => {
    await route.fulfill({ status: 200, contentType: "text/plain", body: "not a Mermaid diagram" });
  });
  await page.goto("/artifact?src=/case-studies/rag-quality-lab/broken.mmd&lang=zh", { waitUntil: "domcontentloaded" });
  await expect(page.locator(SEL.artifactError)).toHaveText("架构图渲染失败，仍可查看下方 Mermaid 源码。", { timeout: 20_000 });
  await expect(page.locator(SEL.artifactErrorSmall)).toHaveCount(0);
});

test("root, project, and artifact metadata follow the active locale", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Metadata synchronization is shared across viewports.");
  const description = page.locator(SEL.metaNameDescription);

  await page.goto("/?lang=zh", { waitUntil: "networkidle" });
  await expect.poll(() => page.title()).toBe("章向国 | 作品集");
  await expect.poll(() => description.evaluateAll((nodes) => nodes.length > 0 && nodes.every((node) => node.getAttribute("content") === "主打 LLM Agent 与 AI 应用系统，后端和数据工程作支撑。项目可以上手、回放实录，也说清能证明到哪一步。"))).toBe(true);
  // Task 0.5: the deleted site-header's aria-labelledby="Primary navigation"
  // / "主要导航" <nav> no longer exists — its wayfinding duty moved to the
  // exhibition rail's <nav data-exhibition-rail aria-label="Exhibition
  // index">, which is not (yet) locale-labeled. Retargeted to assert the
  // rail's fixed desktop sidebar renders instead of matching the deleted
  // localized name (SEL.rail's own <nav> box collapses to zero size since
  // its visible content is position:fixed and out of normal flow).
  await expect(page.locator(".exhibit-rail-fixed")).toBeVisible();

  // Task-suite-reconcile (2026-08-30): the "track" leg that used to live
  // here navigated to "/analytics?lang=zh" and read its title/description
  // back from SEL.mainHeaderH1/SEL.mainHeaderLede -- a track index page
  // rendered via src/app/[track]/page.tsx. Task 5.2 made "/ai",
  // "/engineering", and "/analytics" all 308-redirect straight to a
  // homepage anchor instead (next.config.ts's `redirects()`), the same
  // closure that retired "/analytics/analytics-tandem" -- root-caused
  // live (this test's own failure, HEAD cb11fdc): `page.goto("/analytics
  // ...")` lands on the homepage, where SEL.mainHeaderH1 resolves to 0
  // elements, so `.innerText()` times out. There is no other still-live
  // route that renders a "track" page's metadata contract -- all three
  // track index routes are gone the same way, not just this one example
  // -- so the leg has nothing left to retarget to and is dropped (test
  // renamed from "root, track, project, and artifact metadata" to drop
  // the now-untestable "track" claim, rather than leave a stale name).
  // src/app/[track]/page.tsx itself is unrouted dead code as of this
  // closure (every path it could serve is intercepted by a redirect
  // first) -- worth a follow-up deletion, out of scope here.

  // Task L3: this leg used to target "/ai/rag-quality-lab?lang=zh" as its
  // example still-legacy project route. rag-quality-lab is now a
  // standalone route (src/app/ai/rag-quality-lab/page.tsx) built on
  // RagPage.tsx, which never renders SEL.projectTitle/SEL.caseTitleLede
  // (the shared ProjectPageView markup this generic metadata check needs
  // any still-legacy project for) -- retargeted to
  // "/engineering/crossover-study". Task L6 then rebuilt crossover-study
  // itself the same way, making "/analytics/analytics-tandem" the one
  // remaining routable project still on the shared [track]/[project]
  // catch-all (ProjectPageView/CaseStudyBlock) -- so this leg retargeted a
  // third time to that route. Task 5.2 (route closure) then made
  // analytics-tandem itself 308-redirect to "/#archive" instead of
  // rendering at all (root-caused live: 63-failure full-suite run, HEAD
  // cb11fdc -- SEL.projectTitle resolves to 0 elements once the redirect
  // lands on the homepage), so it can no longer serve as this leg's
  // example either, and there is no longer any project anywhere that
  // still renders #project-title/.case-title .lede -- every project is
  // now a standalone route (see tests/e2e/portfolio.spec.ts's `routes`
  // array comment for the full list).
  //
  // Retargeted a fourth time, this time off DOM selectors entirely: every
  // standalone project page's <LocaleDocumentMetadata> sets title/
  // description directly from the same `getProject()` data, as
  // `${project.title[locale]} | ${siteName}` / `project.summary[locale]`
  // (confirmed identical across all nine standalone pages by reading each
  // page's LocaleDocumentMetadata call site: ForgePage.tsx, GuardianPage.tsx,
  // TriagePage.tsx, PrivacyPage.tsx, RagPage.tsx, EodPage.tsx,
  // MarginPage.tsx, CreditPage.tsx, CrossoverPage.tsx, AskPage.tsx all use
  // this exact pattern), so the expected values below are computed from
  // that shared data source instead of read back off a page-specific DOM
  // selector -- this is not tied to frontier-forge's markup in particular
  // and will keep working regardless of which project's page gets rebuilt
  // next.
  const project = getProject("ai", "frontier-forge");
  if (!project) throw new Error("frontier-forge project data is missing from src/lib/projects.ts");
  await page.goto("/ai/frontier-forge?lang=zh", { waitUntil: "networkidle" });
  await expect.poll(() => page.title()).toBe(`${project.title.zh} | 章向国`);
  await expect.poll(() => description.evaluateAll((nodes, expected) => nodes.every((node) => node.getAttribute("content") === expected), project.summary.zh)).toBe(true);

  await page.goto("/artifact?src=/case-studies/rag-quality-lab/claim-registry.json&lang=zh", { waitUntil: "networkidle" });
  await expect.poll(() => page.title()).toBe("项目文件 | 章向国");
  await expect.poll(() => description.evaluateAll((nodes) => nodes.every((node) => node.getAttribute("content") === "查看器仅增加说明与操作控件，原文件内容保持不变并可直接下载。"))).toBe(true);
});
