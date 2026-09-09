import { expect, test, type Page } from "@playwright/test";
import { ZH_LEXICON } from "../../src/lib/zh-lexicon";
import {
  collectZhLineBoxes,
  collectZhMarkupChecks,
  hanRatio,
  isDisplayBox,
  isKinsokuExempt,
  kinsokuFaults,
  lastLineIsOrphan,
  meanFill,
  numberUnitSplits,
  segmenterWords,
  wordSplits,
  type ZhLineBox,
  type ZhLineReport,
} from "./zhLineBoxes";

// Task D05: Chinese lineation asserted on rendered line boxes, site-wide.
// Runs in Chromium (desktop project) and WebKit (lineation-webkit project);
// every route is measured at each width by resizing the same page.
//
// Contract, per route and width, on every visible zh surface (headings,
// leads, paragraphs, list items, definition lists, labels, table cells):
//   - no line boundary inside a segmenter word, a lexicon compound or a name;
//   - no number split from its measure word across a line;
//   - closers never open a line, openers never end one (the Privacy
//     redaction galley is the one documented exception: its detections are
//     <button>s, atomic inlines by HTML);
//   - display copy is laid out by the phrase tier on every inline branch and
//     never ends on a one-character line; prose keeps a prose fill;
//   - the zh page is never wider than the en page;
//   - generated <zh-seg>/<zh-phrase> markers are style-transparent to their
//     parent, carry no a11y semantics, and never appear inside pre / code /
//     form controls / svg / data-zh-raw;
//   - the console stays clean (no hydration mismatch, no React errors).

const FIXED_ROUTES = [
  "/",
  "/projects/frontier-forge",
  "/projects/triage-router",
  "/projects/privacy-preflight",
  "/projects/release-guardian",
  "/projects/credit-policy-desk",
  "/projects/margin-control-tower",
  "/projects/exactly-once-drills",
  "/projects/crossover-study",
  "/projects/rag-quality-lab",
  "/projects/ask-portfolio",
  "/projects/groupconv-atlas",
];
// Beyond the exhibition routes only the artifact viewer's default page is a
// distinct, publicly reachable document; it renders zh display copy only when
// an artifact is open, so its display-surface count is not asserted.
const BOUNDARY_ROUTES = ["/artifact"];
// next.config.ts permanently redirects the three retired track indexes to
// "/", so they are the home page under another URL: asserted as redirects,
// not counted as covered surfaces. The retired /analytics/analytics-tandem
// URL is no longer one of them -- it now lands on the served
// /projects/analytics-tandem compatibility shell, whose redirect is covered
// by tests/e2e/redirects.spec.ts.
const REDIRECTED_ROUTES = ["/ai", "/engineering", "/analytics"];
const WIDTHS = [320, 390, 412, 768, 980, 1440];

// Protected compounds beyond what the segmenter reports: the site lexicon and
// the owner's name, which no segmenter knows.
const PROTECTED = new Set<string>([...ZH_LEXICON, "章向国"]);
const CONSOLE_NOISE = /favicon|net::ERR|Failed to load resource|Download the React DevTools|preloaded using link preload but not used/;

const describeBox = (box: ZhLineBox) => `${box.tag}.${box.cls.split(" ")[0]} ${JSON.stringify(box.lines.map((line) => line.text))}`;

function watchConsole(page: Page): string[] {
  const problems: string[] = [];
  page.on("console", (message) => {
    if (message.type() !== "error" && message.type() !== "warning") return;
    const text = message.text();
    if (!CONSOLE_NOISE.test(text)) problems.push(`console.${message.type()}: ${text.slice(0, 200)}`);
  });
  page.on("pageerror", (error) => problems.push(`pageerror: ${String(error).slice(0, 200)}`));
  return problems;
}

async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function measure(page: Page, width: number): Promise<ZhLineReport> {
  await page.setViewportSize({ width, height: 900 });
  await settle(page);
  return page.evaluate(collectZhLineBoxes);
}

function auditRoute(route: string, requireDisplay: boolean) {
  test(`zh lineation holds on ${route} at every width`, async ({ page }) => {
    test.setTimeout(300_000);
    // The desktop project deliberately resizes one document across the
    // responsive rail breakpoint. Reduced motion makes each measurement the
    // settled layout instead of sampling the rail's temporary margin-left
    // transition two animation frames after a resize.
    await page.emulateMedia({ reducedMotion: "reduce" });
    const problems = watchConsole(page);
    // en baseline page width: zh may never scroll wider than en does.
    await page.goto(route, { waitUntil: "networkidle" });
    const enScrollWidth = new Map<number, number>();
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await settle(page);
      enScrollWidth.set(width, await page.evaluate(() => document.documentElement.scrollWidth));
    }

    await page.goto(`${route}?lang=zh`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => document.documentElement.lang === "zh-CN");
    await settle(page);

    const failures: string[] = [];

    for (const width of WIDTHS) {
      const report = await measure(page, width);
      // Marker style and display-branch checks run at every responsive width:
      // flex/grid blockification and hidden responsive branches cannot be
      // inferred from the 1440px DOM alone.
      const markup = await page.evaluate(collectZhMarkupChecks);
      for (const fault of markup.rawViolations) failures.push(`@${width} raw/pre host with generated markers: ${fault}`);
      for (const fault of markup.styleViolations) failures.push(`@${width} marker not style-transparent: ${fault}`);
      for (const fault of markup.displayBranchGaps) failures.push(`@${width} display text without phrase tier: ${fault}`);
      for (const fault of markup.a11yViolations) failures.push(`@${width} marker with a11y semantics: ${fault}`);
      for (const fault of markup.blockifiedMarkers) failures.push(`@${width} marker blockified by a flex/grid parent: ${fault}`);
      for (const fault of markup.flexRunGaps) failures.push(`@${width} flex/grid text run pushed apart: ${fault}`);
      if (requireDisplay) expect(markup.segs, `${route}@${width}: no word units rendered`).toBeGreaterThan(50);
      const boxes = report.boxes;
      const displayBoxes = boxes.filter(isDisplayBox);
      if (requireDisplay) {
        expect(displayBoxes.length, `${route}@${width}: no display surfaces measured`).toBeGreaterThan(0);
        expect(boxes.length, `${route}@${width}: no zh surfaces measured`).toBeGreaterThan(displayBoxes.length);
      }

      if (report.scrollWidth > Math.max(report.viewportWidth, enScrollWidth.get(width) ?? 0)) {
        failures.push(`@${width} zh page scrolls to ${report.scrollWidth}px (en ${enScrollWidth.get(width)}px, viewport ${report.viewportWidth}px)`);
      }

      for (const box of boxes) {
        const text = box.lines.map((line) => line.text).join("");
        // Mixed technical copy still gets the hard guarantees. Han density
        // controls prose-fill aesthetics only; it must never suppress word,
        // number, kinsoku, marker, or overflow checks.
        if (box.overflowRight > 1 && !box.inScroller) failures.push(`@${width} overflow ${box.overflowRight}px: ${describeBox(box)}`);
        if (!box.segCount) failures.push(`@${width} zh surface without word units: ${describeBox(box)}`);
        if (box.splitSegs.length) failures.push(`@${width} unit split across lines ${JSON.stringify(box.splitSegs)}: ${describeBox(box)}`);
        for (const fault of wordSplits(box, new Set([...PROTECTED, ...segmenterWords(text)]))) failures.push(`@${width} ${fault}: ${describeBox(box)}`);
        for (const fault of numberUnitSplits(box)) failures.push(`@${width} ${fault}: ${describeBox(box)}`);
        if (!isKinsokuExempt(box)) for (const fault of kinsokuFaults(box)) failures.push(`@${width} ${fault}: ${describeBox(box)}`);
        if (isDisplayBox(box)) {
          if (!box.phraseCount) failures.push(`@${width} display surface without phrase groups: ${describeBox(box)}`);
          if (lastLineIsOrphan(box)) failures.push(`@${width} one-character last line: ${describeBox(box)}`);
        } else {
          if (box.phraseCount) failures.push(`@${width} prose formatted as verse (${box.phraseCount} phrase groups): ${describeBox(box)}`);
          const fill = meanFill(box);
          if (box.lines.length >= 3 && hanRatio(text) >= 0.85 && fill != null && fill < 0.6) {
            failures.push(`@${width} ragged prose (mean fill ${fill.toFixed(2)}): ${describeBox(box)}`);
          }
        }
      }
    }
    for (const problem of problems) failures.push(problem);
    expect(failures, failures.join("\n")).toEqual([]);
  });
}

for (const route of FIXED_ROUTES) auditRoute(route, true);
for (const route of BOUNDARY_ROUTES) auditRoute(route, false);

test("the retired track indexes redirect to the home page (covered there)", async ({ page }) => {
  for (const route of REDIRECTED_ROUTES) {
    const response = await page.goto(`${route}?lang=zh`, { waitUntil: "domcontentloaded" });
    expect(response?.request().redirectedFrom(), `${route} should redirect`).not.toBeNull();
    expect(new URL(page.url()).pathname, `${route} final path`).toBe("/");
  }
});

// Regression for flex/grid text runs (P1 from the D05 review): the artifact
// viewer's context strip is a flex row; word units inside it must not become
// flex items (the 8px gap once pushed the last unit to 426px on a 390px
// viewport), and the strip must be measured, not skipped, by the collector.
test("artifact context strip keeps one text run per flex child at 390px", async ({ page }) => {
  const problems = watchConsole(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/artifact?lang=zh", { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.lang === "zh-CN");
  await settle(page);
  const report = await page.evaluate(collectZhLineBoxes);
  const markup = await page.evaluate(collectZhMarkupChecks);
  const strip = report.boxes.filter((box) => box.cls.split(/\s+/u).includes("artifact-context"));
  expect(report.scrollWidth, "artifact page must not scroll horizontally").toBeLessThanOrEqual(report.viewportWidth);
  expect(markup.blockifiedMarkers, markup.blockifiedMarkers.join("\n")).toEqual([]);
  expect(markup.flexRunGaps, markup.flexRunGaps.join("\n")).toEqual([]);
  expect(strip, "context strip text was not measured exactly once").toHaveLength(1);
  expect(strip[0].lines.map((line) => line.text).join("")).toBe("查看器仅增加说明与操作控件，原文件内容保持不变并可直接下载。");
  expect(strip[0].segCount).toBeGreaterThan(0);
  expect(strip[0].splitSegs).toEqual([]);
  expect(strip[0].overflowRight).toBeLessThanOrEqual(1);
  for (const box of report.boxes) expect(box.overflowRight, describeBox(box)).toBeLessThanOrEqual(1);
  expect(problems, problems.join("\n")).toEqual([]);
});

test("Chinese Markdown uses the word-tier adapter while links and literal code stay exact", async ({ page }) => {
  const problems = watchConsole(page);
  const source = "/case-studies/exactly-once-drills/README.md";
  const title = "中文标题，按语义分行。";
  const prose = "正文包含浏览器本地脱敏工作台，也包含";
  const link = "证据链接";
  const inlineCode = "原始中文代码";
  const listItem = "列表项保留完整词语。";
  const quote = "引文强调验证边界。";
  const deepHeading = "深层标题仍保留词语";
  const deleted = "删除线中文词语";
  const fencedCode = "代码中的中文必须保持原样";
  const markdown = [
    `# ${title}`,
    "",
    `${prose}[${link}](/case-studies/rag-quality-lab/claim-registry.json)与 \`${inlineCode}\`。`,
    "",
    `- ${listItem}`,
    "",
    `> ${quote}`,
    "",
    `##### ${deepHeading}`,
    "",
    `~~${deleted}~~`,
    "",
    "```text",
    fencedCode,
    "```",
  ].join("\n");
  await page.route(`**${source}`, (route) => route.fulfill({ contentType: "text/markdown", body: markdown }));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/artifact?lang=zh&src=${encodeURIComponent(source)}`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.lang === "zh-CN");
  await settle(page);

  const article = page.locator(".artifact-markdown");
  await expect(article).toBeVisible();
  await expect(article.locator("h1")).toHaveText(title);
  await expect(article.getByRole("heading", { level: 1, name: title, exact: true })).toBeVisible();
  await expect(article.locator(":scope > p").first()).toContainText(`${prose}${link}与 ${inlineCode}。`);
  await expect(article.locator("a")).toHaveText(link);
  await expect(article.getByRole("link", { name: link, exact: true })).toBeVisible();
  await expect(article.locator("li")).toHaveText(listItem);
  await expect(article.locator("blockquote")).toHaveText(quote);
  await expect(article.locator("h5")).toHaveText(deepHeading);
  await expect(article.locator("del")).toHaveText(deleted);
  await expect(article.locator("p code")).toHaveText(inlineCode);
  await expect(article.locator("pre code")).toHaveText(fencedCode);
  for (const selector of ["h1 zh-seg", ":scope > p zh-seg", "a zh-seg", "li zh-seg", "blockquote zh-seg", "h5 zh-seg", "del zh-seg"]) {
    expect(await article.locator(selector).count(), `${selector} did not pass through the Markdown word-tier adapter`).toBeGreaterThan(0);
  }
  await expect(article.locator("code zh-run, code zh-seg, code zh-phrase")).toHaveCount(0);

  const markerFaults = await article.evaluate((root) => Array.from(root.querySelectorAll("zh-seg")).flatMap((seg) => {
    const range = document.createRange();
    range.selectNodeContents(seg);
    const tops = new Set(Array.from(range.getClientRects()).filter((rect) => rect.width > 0).map((rect) => Math.round(rect.top)));
    return tops.size > 1 ? [seg.textContent ?? ""] : [];
  }));
  expect(markerFaults, `Markdown word units split: ${markerFaults.join(", ")}`).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  expect(problems, problems.join("\n")).toEqual([]);
});

// The Triage policy terminal's copy button used to rewrite its own
// textContent imperatively; with React-owned word units inside the label that
// would orphan nodes. The label now flips through state while the mounted
// tree survives both a mid-feedback and a post-feedback locale switch.
test("policy terminal copy label survives copy, restore and a locale switch without React errors", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => {});
  const problems = watchConsole(page);
  await page.goto("/projects/triage-router?lang=zh", { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.lang === "zh-CN");
  const button = page.locator("[data-copy-syntax]");
  await button.scrollIntoViewIfNeeded();
  await expect(button).toHaveText("复制");
  await button.click();
  await expect(button).toHaveText("已复制");

  // Switch while the copied state still owns the same button subtree.
  await page.locator(".language-switcher").getByRole("button", { name: "EN", exact: true }).evaluate((control: HTMLButtonElement) => control.click());
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(button).toHaveText("COPIED");
  await expect(button).toHaveText("COPY", { timeout: 5_000 });

  // Switch again after the timer restored the idle label, still without a
  // reload or replacement document.
  await page.locator(".language-switcher").getByRole("button", { name: "中", exact: true }).evaluate((control: HTMLButtonElement) => control.click());
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await expect(button).toHaveText("复制");
  expect(problems, problems.join("\n")).toEqual([]);
});
