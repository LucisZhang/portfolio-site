import { expect, test } from "@playwright/test";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { getProject } from "../../src/lib/projects";
import { circuitEntryForPath } from "../../src/lib/site-circuit";
import questionBank from "../../src/data/generated/ask-question-bank.json";

function scriptsContaining(marker: string): string[] {
  expect(marker.length).toBeGreaterThan(0);
  const directory = ".next/static/chunks";
  const scripts = readdirSync(directory, { recursive: true })
    .filter((file): file is string => typeof file === "string" && file.endsWith(".js"))
    .filter((file) => readFileSync(path.join(directory, file), "utf8").includes(marker))
    .map((file) => `/_next/static/chunks/${file.split(path.sep).join("/")}`);
  expect(scripts.length).toBeGreaterThan(0);
  return scripts;
}

test("home loads the full catalog, question bank and circuit only at their entry points", async ({ page }) => {
  const catalog = scriptsContaining(getProject("ai", "release-guardian")!.problem.en);
  const bank = scriptsContaining(questionBank["/ai/triage-router"].questions[0].id);
  const circuit = scriptsContaining("data-colophon");
  const requested = new Set<string>();
  page.on("request", (request) => {
    if (request.resourceType() === "script") requested.add(new URL(request.url()).pathname);
  });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "中", exact: true }).click();
  await expect(page.locator(".home-ask-presets button")).toHaveText(questionBank["/"].questions.map((question) => question.q_zh));
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await expect(page.locator(".home-ask-presets button")).toHaveText(questionBank["/"].questions.map((question) => question.q_en));
  for (const script of [...catalog, ...bank, ...circuit]) expect(requested.has(script), script).toBe(false);

  await page.keyboard.press("Control+k");
  await expect(page.getByRole("dialog").getByRole("combobox")).toBeVisible();
  await expect.poll(() => catalog.some((script) => requested.has(script))).toBe(true);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Ask Portfolio", exact: true }).click();
  await expect(page.getByTestId("assistant-widget")).toBeVisible();
  await expect.poll(() => bank.some((script) => requested.has(script))).toBe(true);
  await page.keyboard.press("Escape");

  await page.locator(".home-cta").click();
  await expect(page.locator("[data-circuit-top]")).toBeVisible();
  await expect(page.locator("[data-colophon-item]")).toHaveCount(10);
  await expect.poll(() => circuit.some((script) => requested.has(script))).toBe(true);
});

test("project circuit links remain in the server document without JavaScript", async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Static document coverage runs once.");
  const destination = circuitEntryForPath("/ai/frontier-forge")?.next;
  if (!destination) throw new Error("frontier-forge must have a next circuit stop");
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(`${testInfo.project.use.baseURL}/ai/frontier-forge`);
    await expect(page.locator("[data-circuit-top]")).toBeVisible();
    await expect(page.locator("[data-colophon-item]")).toHaveCount(10);
    await page.locator("[data-circuit-top] [data-circuit-next]").click();
    await expect(page).toHaveURL(new URL(destination.href, String(testInfo.project.use.baseURL)).toString());
    await expect(page.locator(`[data-colophon-item='${destination.slug}'] a`)).toHaveAttribute("aria-current", "page");
  } finally {
    await context.close();
  }
});

test("the no-JavaScript homepage keeps its documented English server snapshot", async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Static document coverage runs once.");
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(`${testInfo.project.use.baseURL}/?lang=zh`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("#hero-title")).toBeVisible();
    await expect(page.locator(".home-hero-zh")).toBeHidden();
    await expect(page.locator(".home-hero .exhibit-stat-cell")).toHaveCount(4);
  } finally {
    await context.close();
  }
});

// Hold hydration until the server document and fonts have painted. A fast
// machine can otherwise translate the toolbar before the first screenshot,
// masking the English two-row -> Chinese one-row collapse that moved <main>.
const localeEntries = [
  { name: "Chinese query", url: "/?lang=zh", browserLocale: "en-US", stored: null, expected: "zh-CN", widths: [320, 390, 412, 540, 639, 640, 768, 979] },
  { name: "saved Chinese preference", url: "/", browserLocale: "en-US", stored: "zh", expected: "zh-CN", widths: [412] },
  { name: "Chinese browser preference", url: "/", browserLocale: "zh-CN", stored: null, expected: "zh-CN", widths: [412] },
  { name: "explicit English over saved Chinese", url: "/?lang=en", browserLocale: "en-US", stored: "zh", expected: "en", widths: [412] },
  { name: "English default", url: "/", browserLocale: "en-US", stored: null, expected: "en", widths: [412] },
] as const;

for (const entry of localeEntries) {
  test.describe(entry.name, () => {
    test.use({ locale: entry.browserLocale });

    for (const width of entry.widths) {
      test(`homepage chrome and hero keep their painted geometry through hydration at ${width}px`, async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== "mobile", "The mobile toolbar matrix runs once.");
        const runtimeErrors: string[] = [];
        page.on("console", (message) => {
          if (message.type() === "error") runtimeErrors.push(message.text());
        });
        page.on("pageerror", (error) => runtimeErrors.push(error.message));
        await page.setViewportSize({ width, height: 823 });
        await page.addInitScript((stored) => {
          if (stored) localStorage.setItem("portfolio-locale", stored);
          const state = window as unknown as { homeLocaleCLS: number };
          state.homeLocaleCLS = 0;
          new PerformanceObserver((list) => {
            for (const item of list.getEntries()) {
              const shift = item as PerformanceEntry & { value: number; hadRecentInput: boolean };
              if (!shift.hadRecentInput) state.homeLocaleCLS += shift.value;
            }
          }).observe({ type: "layout-shift", buffered: true });
        }, entry.stored);

        let releaseScripts!: () => void;
        const hydration = new Promise<void>((resolve) => { releaseScripts = resolve; });
        await page.route("**/_next/**/*.js", async (route) => {
          await hydration;
          await route.continue();
        });

        const geometry = () => page.locator([
          ".home-rail-tools > *",
          "#main-content",
          "#hero-title",
          ".home-hero-narrative",
          ".home-hero-body",
          ".home-hero .exhibit-stat-cell",
          ".home-hero-scope",
          ".home-hero-contact",
          '[data-exhibit="01"] .exhibit-opening-row',
        ].join(", ")).evaluateAll((nodes) =>
          nodes.map((node) => {
            const rect = node.getBoundingClientRect();
            const identity = node instanceof HTMLElement
              ? `${node.tagName.toLowerCase()}${node.id ? `#${node.id}` : ""}.${[...node.classList].join(".")}`
              : node.nodeName;
            const stableSize = !(node instanceof HTMLElement && (node.id === "main-content" || node.parentElement?.matches(".home-rail-tools")));
            return { identity, stableSize, x: rect.x, y: rect.y, width: rect.width, height: rect.height };
          }));
        const heroStructure = () => page.locator(".home-hero").evaluate((hero) =>
          [...hero.querySelectorAll("*")].map((node) => ({ tag: node.tagName, classes: [...node.classList] })));

        try {
          await page.goto(entry.url, { waitUntil: "commit" });
          await expect(page.locator("#hero-title")).toBeVisible();
          await expect(page.locator("html")).toHaveAttribute("lang", entry.expected);
          await expect(page.locator(".home-hero-narrative"))[entry.expected === "en" ? "toBeHidden" : "toBeVisible"]();
          expect(await page.locator(".home-hero").evaluate((hero, expected) => {
            const active = expected === "en" ? ".home-locale-en" : ".home-locale-zh";
            const inactive = expected === "en" ? ".home-locale-zh" : ".home-locale-en";
            return {
              active: [...hero.querySelectorAll(active)].every((node) => getComputedStyle(node).display !== "none"),
              inactive: [...hero.querySelectorAll(inactive)].every((node) => getComputedStyle(node).display === "none"),
            };
          }, entry.expected === "en" ? "en" : "zh")).toEqual({ active: true, inactive: true });
          await page.evaluate(() => document.fonts.ready);
          const titleFont = await page.locator("#hero-title").evaluate((node) => getComputedStyle(node).fontFamily);
          expect(titleFont).toContain('"Display Serif",');
          // Expire Chromium's initial recent-input window before releasing
          // scripts so a hydration shift is included in the CLS observer.
          await page.waitForTimeout(650);
          const before = await geometry();
          expect(before).toHaveLength(16);
          const structureBefore = await heroStructure();
          const clsBeforeHydration = await page.evaluate(() => (window as unknown as { homeLocaleCLS: number }).homeLocaleCLS);

          releaseScripts();
          await expect(page.locator("html")).toHaveAttribute("lang", entry.expected);
          await page.waitForLoadState("networkidle");
          await page.evaluate(() => new Promise<void>((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
          }));
          await expect(page.locator("#hero-title")).toHaveCSS("font-family", titleFont);
          expect(await heroStructure()).toEqual(structureBefore);
          const after = await geometry();
          for (const [index, rect] of after.entries()) {
            const identity = `${index}: ${rect.identity}`;
            expect(Math.abs(rect.x - before[index].x), `${identity} horizontal shift`).toBeLessThanOrEqual(0.5);
            expect(Math.abs(rect.y - before[index].y), `${identity} vertical shift`).toBeLessThanOrEqual(0.5);
            if (rect.stableSize) {
              expect(Math.abs(rect.width - before[index].width), `${identity} width change`).toBeLessThanOrEqual(0.5);
              expect(Math.abs(rect.height - before[index].height), `${identity} height change`).toBeLessThanOrEqual(0.5);
            }
          }
          await expect(page.locator(".home-rail-tools > a:last-child")).toHaveText(
            entry.expected === "en" ? "Contact Xiangguo" : "联系章向国",
          );
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
          // The Lighthouse mobile viewport also guards the remaining
          // translation/hero movement against the standard good-CLS limit.
          if (width === 412) {
            const cls = await page.evaluate(() => (window as unknown as { homeLocaleCLS: number }).homeLocaleCLS);
            expect(cls).toBeLessThanOrEqual(0.1);
            expect(cls - clsBeforeHydration).toBeLessThanOrEqual(0.001);
          }
          expect(runtimeErrors).toEqual([]);
        } finally {
          releaseScripts();
        }
      });
    }
  });
}

test("homepage locale switching exposes one visible and accessible Hero copy", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "The locale accessibility contract runs once.");
  await page.addInitScript(() => localStorage.setItem("portfolio-locale", "en"));
  const response = await page.goto("/", { waitUntil: "networkidle" });
  expect(response?.headers()["content-security-policy"]).toContain("script-src 'self' 'unsafe-inline'");
  await expect(page.locator(".home-hero-narrative")).toBeHidden();
  await expect(page.locator(".home-hero").getByRole("link", { name: "Email", exact: true })).toBeVisible();
  await expect(page.locator(".home-hero").getByRole("link", { name: "Phone", exact: true })).toBeVisible();
  await expect(page.locator(".home-hero").getByRole("button", { name: "WeChat", exact: true })).toBeVisible();
  const enAccessibility = await page.locator(".home-hero").ariaSnapshot();
  expect(enAccessibility).not.toContain("我把整条链路做通");
  expect(enAccessibility).not.toContain("校招方向");

  await page.getByRole("button", { name: "中", exact: true }).click();
  await expect(page.locator(".home-hero-narrative")).toBeVisible();
  expect(await page.locator(".home-hero").evaluate((hero) => ({
    enHidden: [...hero.querySelectorAll(".home-locale-en")].every((node) => getComputedStyle(node).display === "none"),
    zhVisible: [...hero.querySelectorAll(".home-locale-zh")].every((node) => getComputedStyle(node).display !== "none"),
  }))).toEqual({ enHidden: true, zhVisible: true });
  await expect(page.locator(".home-hero").getByRole("link", { name: "Email", exact: true })).toHaveCount(0);
  await expect(page.locator(".home-hero").getByRole("link", { name: "邮箱", exact: true })).toBeVisible();
  await expect(page.locator(".home-hero").getByRole("link", { name: "电话", exact: true })).toBeVisible();
  await expect(page.locator(".home-hero").getByRole("button", { name: "微信", exact: true })).toBeVisible();
  await expect(page.locator(".home-hero").getByRole("link", { name: "LinkedIn", exact: true })).toHaveCount(0);
  const zhAccessibility = await page.locator(".home-hero").ariaSnapshot();
  expect(zhAccessibility.replaceAll(" ", "")).toContain("我把整条链路做通");
  expect(zhAccessibility).not.toContain("Email");
  expect(zhAccessibility).not.toContain("Phone");
  expect(zhAccessibility).not.toContain("Open to:");
});

test("the hero text is visible from the start of its entrance animation", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "The first-paint animation contract runs once.");
  await page.goto("/", { waitUntil: "networkidle" });
  const opacity = await page.locator(".home-hero-line").evaluateAll((nodes) => nodes.map((node) => {
    for (const animation of node.getAnimations()) {
      animation.pause();
      animation.currentTime = 0;
    }
    return getComputedStyle(node).opacity;
  }));
  expect(opacity).toEqual(["1", "1"]);
});
