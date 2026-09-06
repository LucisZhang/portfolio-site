import { expect, test, type Locator, type Page } from "@playwright/test";

// F-05/F-05a keyboard-access regression coverage. This file is the only
// spec assigned to desktop WebKit in playwright.config.ts, keeping browser
// parity focused on the shared rail and ScrollRegion contracts.

const KEYBOARD_PROJECTS = ["desktop", "desktop-webkit"];
const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 980, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
] as const;

type Locale = "en" | "zh";
type LocalizedLabel = Record<Locale, string>;
type RouteContract = {
  route: string;
  key: string;
  labels: LocalizedLabel[];
};

const ROUTE_CONTRACTS: RouteContract[] = [
  {
    key: "frontier-forge",
    route: "/ai/frontier-forge",
    labels: [
      { en: "Request body code", zh: "请求体代码" },
      { en: "Claims and evidence table", zh: "断言与证据表" },
      { en: "Overload summary table", zh: "过载摘要表" },
    ],
  },
  {
    key: "release-guardian",
    route: "/ai/release-guardian",
    labels: [
      { en: "Docker full-stack install command", zh: "Docker 全栈安装命令" },
      { en: "MCP server install command", zh: "MCP 服务器安装命令" },
    ],
  },
  {
    key: "triage-router",
    route: "/ai/triage-router",
    labels: [
      { en: "Known failures table", zh: "已知失败案例表" },
      { en: "Frontier pareto table", zh: "策略前沿表" },
      { en: "Drift over time table", zh: "漂移趋势表" },
      { en: "Reproduce command", zh: "复现命令" },
    ],
  },
  {
    key: "margin-control-tower",
    route: "/analytics/margin-control-tower",
    labels: [
      { en: "Detection weeks table", zh: "检出周表" },
      { en: "Governed metric registry table", zh: "受治理指标注册表" },
      { en: "Verification SQL", zh: "验证 SQL" },
      { en: "Reproduce commands", zh: "复现命令" },
      { en: "Reproduce commands", zh: "复现命令" },
    ],
  },
  {
    key: "credit-policy-desk",
    route: "/analytics/credit-policy-desk",
    labels: [
      { en: "Policy frontier reference table", zh: "政策前沿参考表" },
      { en: "Approve-threshold comparison table", zh: "批准阈值对比表" },
      { en: "Model comparison table", zh: "模型对比表" },
      { en: "Verification SQL", zh: "验证 SQL" },
      { en: "Reproduce commands", zh: "复现命令" },
      { en: "Reproduce commands", zh: "复现命令" },
    ],
  },
  {
    key: "crossover-study",
    route: "/engineering/crossover-study",
    labels: [
      { en: "SQL query", zh: "SQL 查询" },
      { en: "Results table", zh: "结果表" },
      { en: "Amazon results chart", zh: "Amazon 结果图表" },
      { en: "Amazon results table", zh: "Amazon 结果表" },
      { en: "ML-32M results chart", zh: "ML-32M 结果图表" },
      { en: "ML-32M results table", zh: "ML-32M 结果表" },
    ],
  },
];

function keyboardProjectOnly(projectName: string) {
  test.skip(!KEYBOARD_PROJECTS.includes(projectName), "Covered in desktop Chromium and desktop WebKit.");
}

async function settleRail(page: Page) {
  // Escape is a no-op below the 980px rail breakpoint. At desktop widths it
  // makes every measurement use the final reading-column width.
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => getComputedStyle(document.querySelector<HTMLElement>("main#main-content")!).marginLeft === "0px");
}

async function openTechnicalEvidence(page: Page) {
  // Scroll regions inside native <details> are intentionally unreachable
  // while the disclosure is closed. Exercise their keyboard contract in the
  // user-visible state where the technical evidence has been opened.
  await page.locator("details.evidence-details").evaluateAll((nodes) => {
    for (const node of nodes) (node as HTMLDetailsElement).open = true;
  });
}

async function assertScrollRegionContract(page: Page, expectedLabels: string[], context: string) {
  const regions = page.locator("[data-scroll-region]");
  await expect(regions, `${context}: every wrapped region is present`).toHaveCount(expectedLabels.length);

  await expect
    .poll(async () => regions.evaluateAll((nodes, labels) => nodes.map((node, index) => {
      const overflows = node.scrollWidth - node.clientWidth > 1;
      const expectedName = labels[index];
      const tabIndex = node.getAttribute("tabindex");
      const role = node.getAttribute("role");
      const name = node.getAttribute("aria-label");
      const valid = overflows
        ? tabIndex === "0" && role === "region" && name === expectedName
        : tabIndex === null && role === null && name === null;
      return valid ? null : `${index}:${expectedName}:overflow=${overflows},tabindex=${tabIndex},role=${role},name=${name}`;
    }).filter(Boolean), expectedLabels), { message: `${context}: focus, role, and localized name exist if and only if the region overflows` })
    .toEqual([]);
}

async function assertArrowScroll(page: Page, region: Locator, context: string) {
  await region.scrollIntoViewIfNeeded();
  await region.evaluate((node) => { node.scrollLeft = 0; });
  await region.focus();
  await expect(region, `${context}: representative overflow region receives focus`).toBeFocused();
  // A held key crosses a frame in WebKit's keyboard scroll animator, matching
  // a physical keypress instead of a same-tick keydown/keyup tap.
  await page.keyboard.press("ArrowRight", { delay: 120 });
  await expect.poll(() => region.evaluate((node) => node.scrollLeft), { message: `${context}: ArrowRight scrolls the focused region` }).toBeGreaterThan(0);
}

async function pauseMarginTransitionAtMidpoint(page: Page) {
  return page.evaluate(async () => {
    const content = document.querySelector<HTMLElement>("main#main-content")!;
    let transition: Animation | undefined;
    for (let frame = 0; frame < 10 && !transition; frame += 1) {
      transition = content.getAnimations().find((animation) =>
        "transitionProperty" in animation && (animation as CSSTransition).transitionProperty === "margin-left");
      if (!transition) await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }
    if (!transition) throw new Error("The normal-motion margin-left transition did not start.");
    const duration = Number(transition.effect?.getTiming().duration);
    if (!(duration > 0)) throw new Error(`Expected a non-zero normal-motion duration, received ${duration}.`);
    transition.currentTime = duration / 2;
    transition.pause();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    return { duration, margin: parseFloat(getComputedStyle(content).marginLeft) };
  });
}

for (const concept of ["results", "limitations"] as const) {
  test(`frontier-forge ${concept}: mid-retraction Enter keeps the focused heading in view`, async ({ page }, testInfo) => {
    keyboardProjectOnly(testInfo.project.name);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/ai/frontier-forge", { waitUntil: "networkidle" });

    const shell = page.locator('.exhibit-shell[data-rail-mode="auto"]');
    const content = page.locator("main#main-content");
    const openMargin = await content.evaluate((node) => parseFloat(getComputedStyle(node).marginLeft));
    expect(openMargin).toBeGreaterThan(0);

    const link = page.locator(`[data-report-contents] a[href="#report-${concept}"]`);
    await link.focus();
    await expect(shell).toHaveClass(/rail-collapsed/);

    // Pause the real, non-reduced-motion CSS transition at exactly 50%.
    // This removes browser-protocol timing from the race while preserving
    // the production transition and focus-pin behavior under test.
    const midpoint = await pauseMarginTransitionAtMidpoint(page);
    expect(midpoint.duration).toBe(240);
    expect(midpoint.margin).toBeGreaterThan(0);
    expect(midpoint.margin).toBeLessThan(openMargin);

    await page.keyboard.press("Enter");
    expect((await content.evaluate((node) => parseFloat(getComputedStyle(node).marginLeft)))).toBeGreaterThan(0);

    const heading = page.locator(`#report-${concept}`);
    await expect(page).toHaveURL(new RegExp(`#report-${concept}$`));
    await expect(heading).toBeFocused();

    await content.evaluate((node) => node.getAnimations().forEach((animation) => animation.play()));
    await page.waitForFunction(() => getComputedStyle(document.querySelector<HTMLElement>("main#main-content")!).marginLeft === "0px");
    await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    const box = await heading.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.y + box!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
    await expect(heading).toBeFocused();
    await expect(page).toHaveURL(new RegExp(`#report-${concept}$`));
  });
}

for (const contract of ROUTE_CONTRACTS) {
  for (const locale of ["en", "zh"] as const) {
    test(`${contract.key}: ${locale} overflow regions obey the keyboard contract at 390/980/1440/1920`, async ({ page }, testInfo) => {
      keyboardProjectOnly(testInfo.project.name);
      const expectedLabels = contract.labels.map((label) => label[locale]);
      let exercisedArrowScroll = false;

      for (const viewport of VIEWPORTS) {
        await page.setViewportSize(viewport);
        await page.goto(`${contract.route}?lang=${locale}`, { waitUntil: "networkidle" });
        await openTechnicalEvidence(page);
        await settleRail(page);
        const context = `${contract.key} ${locale} ${viewport.width}px`;
        await assertScrollRegionContract(page, expectedLabels, context);

        if (!exercisedArrowScroll) {
          const overflowingIndex = await page.locator("[data-scroll-region]").evaluateAll((nodes) =>
            nodes.findIndex((node) => node.scrollWidth - node.clientWidth > 1));
          if (overflowingIndex >= 0) {
            await assertArrowScroll(page, page.locator("[data-scroll-region]").nth(overflowingIndex), context);
            exercisedArrowScroll = true;
          }
        }
      }

      expect(exercisedArrowScroll, `${contract.key} ${locale}: at least one representative region must overflow and accept ArrowRight`).toBe(true);
    });
  }
}
