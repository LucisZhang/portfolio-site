import { chromium } from "playwright";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { PDFDocument, StandardFonts } from "pdf-lib";

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1]);
}

const baseUrl = new URL(args.get("--url") || "https://portfolio-site-gpt-review.vercel.app");
const vercelShareToken = process.env.VERCEL_SHARE_TOKEN || "";
const label = args.get("--label") || "baseline";
const requiredRoutes = (args.get("--required-routes") || "/analytics/analytics-tandem")
  .split(",")
  .map((route) => route.trim())
  .filter(Boolean);
const outputRoot = path.resolve(args.get("--output") || "docs/phase2-public-review-artifacts", label);
const screenshotRoot = path.join(outputRoot, "screenshots");
const fixtureRoot = path.join(outputRoot, "fixtures");
const imageFixture = path.resolve("public/case-studies/privacy-preflight/image-synthetic-input.png");

const viewports = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "tablet", width: 1024, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];
const locales = ["en", "zh"];
const artifactExtensions = new Set([".csv", ".json", ".jpg", ".jpeg", ".md", ".mmd", ".parquet", ".pdf", ".png", ".svg", ".txt", ".zip"]);

function stablePathname(value) {
  const url = new URL(value, baseUrl);
  return url.pathname.replace(/\/+$/, "") || "/";
}

function accessUrl(value) {
  const url = new URL(value, baseUrl);
  if (vercelShareToken) url.searchParams.set("_vercel_share", vercelShareToken);
  return url;
}

async function authorizeContext(context) {
  if (!vercelShareToken) return;
  await context.request.get(accessUrl("/").href, { failOnStatusCode: false, timeout: 30_000 });
}

function isArtifact(value) {
  return artifactExtensions.has(path.extname(new URL(value, baseUrl).pathname).toLowerCase());
}

function screenshotName(locale, viewport, route, state = "initial") {
  const slug = route === "/" ? "home" : route.slice(1).replaceAll("/", "-");
  return `${locale}-${viewport}-${slug}-${state}.png`;
}

function issue(report, issue) {
  const dedupeKey = issue.dedupeKey || `${issue.category}:${issue.page}:${issue.problem}`;
  if (report.issues.some((current) => current.dedupeKey === dedupeKey)) return;
  report.issues.push({
    status: "open",
    fixVerification: "pending",
    dedupeKey,
    ...issue,
  });
}

function isExpectedArtifactPrefetchAbort(problem) {
  return problem.includes(`GET ${baseUrl.origin}/artifact?`)
    && problem.includes("_rsc=")
    && problem.endsWith("net::ERR_ABORTED");
}

async function walkFiles(root, relative = "") {
  const current = path.join(root, relative);
  const entries = await readdir(current, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const next = path.join(relative, entry.name);
    if (entry.isDirectory()) files.push(...await walkFiles(root, next));
    else if (entry.isFile()) files.push(next);
  }
  return files;
}

async function discoverPublicArtifacts() {
  const root = path.resolve("public/case-studies");
  return (await walkFiles(root))
    .filter((file) => artifactExtensions.has(path.extname(file).toLowerCase()))
    .map((file) => new URL(`/case-studies/${file.split(path.sep).join("/")}`, baseUrl).href)
    .sort();
}

async function makePdfFixture() {
  const document = await PDFDocument.create();
  const font = await document.embedFont(StandardFonts.Helvetica);
  document.addPage([480, 320]).drawText("Synthetic contact ada@example.com or 415-555-0188", {
    x: 48,
    y: 220,
    size: 18,
    font,
  });
  document.addPage([480, 320]).drawText("Synthetic second page contains no sensitive value", {
    x: 48,
    y: 220,
    size: 18,
    font,
  });
  const target = path.join(fixtureRoot, "synthetic-two-page.pdf");
  await writeFile(target, await document.save());
  return target;
}

async function settle(page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
  await page.locator("main").waitFor({ state: "visible", timeout: 15_000 }).catch(() => undefined);
}

async function discoverSite(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    locale: "en-US",
    serviceWorkers: "block",
  });
  await context.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  const page = await context.newPage();
  await authorizeContext(context);
  const queue = ["/", ...requiredRoutes];
  const routes = new Set();
  const artifacts = new Set();
  const linkedArtifacts = new Set();
  const externalLinks = new Set();
  const mailLinks = new Set();
  const placeholders = [];

  while (queue.length) {
    const route = queue.shift();
    if (!route || routes.has(route)) continue;
    const response = await page.goto(new URL(route, baseUrl).href, { waitUntil: "domcontentloaded", timeout: 30_000 });
    if (!response || response.status() >= 400) {
      routes.add(route);
      continue;
    }
    await settle(page);
    routes.add(route);
    const links = await page.locator("a").evaluateAll((nodes) => nodes.map((node) => ({
      href: node.getAttribute("href") || "",
      text: (node.textContent || "").trim().replace(/\s+/g, " "),
      download: node.getAttribute("download"),
    })));
    for (const link of links) {
      if (!link.href || link.href === "#" || link.href.startsWith("javascript:")) {
        placeholders.push({ route, ...link });
        continue;
      }
      if (link.href.startsWith("mailto:")) {
        mailLinks.add(link.href);
        continue;
      }
      const resolved = new URL(link.href, page.url());
      if (resolved.origin !== baseUrl.origin) {
        externalLinks.add(resolved.href);
        continue;
      }
      if (resolved.pathname.startsWith("/_next/")) continue;
      if (resolved.pathname === "/artifact") {
        const source = resolved.searchParams.get("src");
        if (source) artifacts.add(new URL(source, baseUrl).href);
        continue;
      }
      if (isArtifact(resolved.href)) {
        artifacts.add(resolved.href);
        if (route !== "/artifact" && link.download === null && path.extname(resolved.pathname).toLowerCase() !== ".parquet") linkedArtifacts.add(resolved.href);
        continue;
      }
      const pathname = stablePathname(resolved.href);
      if (!routes.has(pathname) && !queue.includes(pathname)) queue.push(pathname);
    }
  }

  await context.close();
  return {
    routes: [...routes].sort(),
    artifacts: [...artifacts].sort(),
    linkedArtifacts: [...linkedArtifacts].sort(),
    externalLinks: [...externalLinks].sort(),
    mailLinks: [...mailLinks].sort(),
    placeholders,
  };
}

async function capture(page, locale, viewport, route, state, report) {
  const name = screenshotName(locale, viewport, route, state);
  const target = path.join(screenshotRoot, name);
  await page.screenshot({ path: target, fullPage: true });
  report.screenshots.push(path.relative(path.resolve("docs"), target));
  return target;
}

async function runInteraction(page, route, locale, viewport, pdfFixture, report) {
  const screenshot = (state) => capture(page, locale, viewport, route, state, report);
  try {
    if (route === "/engineering/p1-reliability-lab") {
      const replay = page.getByTestId("p1-failure-replay");
      await replay.waitFor({ state: "visible" });
      await replay.locator('input[type="range"]').fill("4");
      await screenshot("failure-recovery");
    } else if (route === "/ai/release-guardian") {
      const replay = page.getByTestId("release-change-replay");
      await replay.waitFor({ state: "visible" });
      await replay.getByRole("tab").nth(1).click();
      await replay.locator('input[type="range"]').fill("7");
      await replay.locator(".release-approval-gate button").first().click();
      await screenshot("approval-audit");
    } else if (route === "/ai/rag-quality-lab") {
      const lab = page.getByTestId("rag-drift-lab");
      await lab.waitFor({ state: "visible" });
      await lab.locator(".rag-scenario-bar button").nth(2).click();
      await screenshot("contract-drift");
    } else if (route === "/analytics/margin-control-tower") {
      const lab = page.getByTestId("margin-control-tower");
      await lab.waitFor({ state: "visible" });
      await lab.locator('input[type="range"]').fill("8");
      await lab.locator(".margin-week-bars button").last().click();
      await screenshot("scenario");
    } else if (route === "/analytics/credit-policy-lab") {
      const lab = page.getByTestId("credit-policy-lab");
      await lab.waitFor({ state: "visible" });
      const ranges = lab.locator('input[type="range"]');
      await ranges.last().fill("360");
      const record = lab.locator(".credit-publish-policy");
      if (await record.isEnabled()) await record.click();
      await screenshot("policy-decision");
    } else if (route === "/ai/privacy-preflight-mac") {
      const lab = page.getByTestId("privacy-preflight-lab");
      await lab.waitFor({ state: "visible" });
      await lab.getByRole("button", { name: locale === "en" ? "Load synthetic example" : "载入合成示例" }).click();
      await screenshot("text-review");

      if (viewport === "desktop" && locale === "en") {
        await lab.getByRole("tab", { name: "Image" }).click();
        await lab.locator('input[type="file"]').setInputFiles(imageFixture);
        const canvas = lab.locator(".privacy-canvas-wrap canvas");
        await canvas.waitFor({ state: "visible" });
        const bounds = await canvas.boundingBox();
        if (bounds) {
          await page.mouse.move(bounds.x + bounds.width * 0.12, bounds.y + bounds.height * 0.18);
          await page.mouse.down();
          await page.mouse.move(bounds.x + bounds.width * 0.66, bounds.y + bounds.height * 0.4, { steps: 5 });
          await page.mouse.up();
        }
        await lab.getByRole("button", { name: "Preview redacted result" }).click();
        const imageOutput = lab.getByTestId("privacy-image-output");
        await imageOutput.waitFor({ state: "visible" });
        const [downloadedImage] = await Promise.all([
          page.waitForEvent("download"),
          imageOutput.getByRole("link", { name: "Download redacted file" }).click(),
        ]);
        await downloadedImage.saveAs(path.join(outputRoot, downloadedImage.suggestedFilename()));
        await screenshot("image-export");

        await lab.getByRole("tab", { name: "PDF" }).click();
        await lab.locator('input[type="file"]').setInputFiles(pdfFixture);
        await lab.locator(".privacy-pdf-canvas-stack canvas").last().waitFor({ state: "visible", timeout: 30_000 });
        await screenshot("pdf-review");
      }
    }
  } catch (error) {
    issue(report, {
      page: route,
      severity: "high",
      category: "interaction",
      problem: `${locale}/${viewport} interaction failed: ${error instanceof Error ? error.message : String(error)}`,
      reproduction: `Open ${route} as ${locale} at ${viewport} and run its primary interaction.`,
      screenshot: screenshotName(locale, viewport, route, "initial"),
    });
  }
}

async function auditPages(browser, discovered, pdfFixture, report) {
  for (const viewport of viewports) {
    for (const locale of locales) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        locale: locale === "zh" ? "zh-CN" : "en-US",
        serviceWorkers: "block",
        acceptDownloads: true,
      });
      await authorizeContext(context);
      await context.addInitScript((selectedLocale) => {
        window.localStorage.clear();
        window.sessionStorage.clear();
        window.localStorage.setItem("portfolio-locale", selectedLocale);
      }, locale);

      for (const route of discovered.routes) {
        const page = await context.newPage();
        const consoleErrors = [];
        const pageErrors = [];
        const failedRequests = [];
        page.on("console", (message) => {
          if (message.type() === "error") consoleErrors.push(message.text());
        });
        page.on("pageerror", (error) => pageErrors.push(error.message));
        page.on("requestfailed", (request) => {
          const problem = `${request.method()} ${request.url()} ${request.failure()?.errorText || "failed"}`;
          if (!isExpectedArtifactPrefetchAbort(problem)) failedRequests.push(problem);
        });

        const startedAt = Date.now();
        let response;
        try {
          response = await page.goto(new URL(route, baseUrl).href, { waitUntil: "domcontentloaded", timeout: 30_000 });
          await settle(page);
        } catch (error) {
          issue(report, {
            page: route,
            severity: "critical",
            category: "navigation",
            problem: `${locale}/${viewport.name} did not load: ${error instanceof Error ? error.message : String(error)}`,
            reproduction: `Open ${route} in a fresh ${viewport.name} context.`,
            screenshot: "none",
          });
          await page.close();
          continue;
        }
        const durationMs = Date.now() - startedAt;
        const status = response?.status() || 0;
        const metrics = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          title: document.title,
          h1: document.querySelector("h1")?.textContent?.trim() || "",
          bodyCharacters: document.body.innerText.length,
          buttons: [...document.querySelectorAll("button")].map((button) => (button.textContent || button.title || button.getAttribute("aria-label") || "").trim()).filter(Boolean),
          disabledAnchors: [...document.querySelectorAll("a[aria-disabled='true'], a.disabled")].length,
        }));
        const initialScreenshot = await capture(page, locale, viewport.name, route, "initial", report);
        report.pages.push({
          route,
          locale,
          viewport: viewport.name,
          status,
          durationMs,
          ...metrics,
          consoleErrors,
          pageErrors,
          failedRequests,
          screenshot: path.relative(path.resolve("docs"), initialScreenshot),
        });

        if (status !== 200) issue(report, {
          page: route,
          severity: "critical",
          category: "status",
          problem: `${locale}/${viewport.name} returned HTTP ${status}.`,
          reproduction: `Open ${route} in a fresh anonymous browser.`,
          screenshot: path.relative(path.resolve("docs"), initialScreenshot),
        });
        if (durationMs > 10_000) issue(report, {
          page: route,
          severity: "medium",
          category: "comprehension/load",
          problem: `${locale}/${viewport.name} needed ${durationMs} ms to settle.`,
          reproduction: `Open ${route} with an empty cache and wait for network idle.`,
          screenshot: path.relative(path.resolve("docs"), initialScreenshot),
        });
        if (metrics.overflow > 1) issue(report, {
          page: route,
          severity: "high",
          category: "responsive",
          problem: `${locale}/${viewport.name} has ${metrics.overflow}px horizontal overflow.`,
          reproduction: `Open ${route} at ${viewport.width}x${viewport.height}.`,
          screenshot: path.relative(path.resolve("docs"), initialScreenshot),
        });
        const runtimeProblems = [...consoleErrors, ...pageErrors, ...failedRequests];
        if (runtimeProblems.length) {
          const previewToolbarOnly = runtimeProblems.every((problem) => problem.includes("vercel.live/_next-live/feedback/feedback.js"));
          issue(report, previewToolbarOnly ? {
            page: "all routes",
            severity: "high",
            category: "preview toolbar/CSP",
            problem: "Vercel injects the Preview Toolbar feedback script, while the site CSP blocks it and logs a console error on every page.",
            reproduction: "Open any public Review route with a fresh console and observe the blocked vercel.live feedback script.",
            screenshot: path.relative(path.resolve("docs"), initialScreenshot),
            dedupeKey: "preview-toolbar-csp",
          } : {
            page: route,
            severity: "high",
            category: "runtime",
            problem: runtimeProblems.join(" | "),
            reproduction: `Open ${route} as ${locale}/${viewport.name} and inspect console/network failures.`,
            screenshot: path.relative(path.resolve("docs"), initialScreenshot),
          });
        }

        await runInteraction(page, route, locale, viewport.name, pdfFixture, report);
        await page.close();
      }
      await context.close();
    }
  }
}

async function auditLinks(browser, discovered, report) {
  const context = await browser.newContext({ serviceWorkers: "block" });
  if (vercelShareToken) {
    await context.request.get(accessUrl("/").href, { timeout: 30_000, failOnStatusCode: false });
  }
  for (const href of discovered.artifacts) {
    const response = await context.request.get(href, { timeout: 30_000, failOnStatusCode: false });
    const contentType = response.headers()["content-type"] || "";
    const disposition = response.headers()["content-disposition"] || "";
    const linked = discovered.linkedArtifacts.includes(href);
    report.artifacts.push({ href, linked, status: response.status(), contentType, disposition });
    if (response.status() !== 200) issue(report, {
      page: href,
      severity: "critical",
      category: "artifact",
      problem: `Artifact returned HTTP ${response.status()}.`,
      reproduction: `Open ${href} anonymously.`,
      screenshot: "none",
    });
    if (linked) issue(report, {
      page: href,
      severity: "medium",
      category: "artifact experience",
      problem: "Artifact is linked as a raw file instead of opening in a contextual viewer.",
      reproduction: `Follow the artifact link ${href} from its case study.`,
      screenshot: "none",
    });
    if (contentType.includes("text/html")) issue(report, {
      page: href,
      severity: "high",
      category: "artifact MIME",
      problem: `Artifact unexpectedly returned ${contentType}.`,
      reproduction: `Request ${href} and inspect Content-Type.`,
      screenshot: "none",
    });
  }

  for (const href of discovered.externalLinks) {
    let status = 0;
    let error = "";
    try {
      const response = await context.request.get(href, { timeout: 30_000, failOnStatusCode: false, maxRedirects: 8 });
      status = response.status();
    } catch (reason) {
      error = reason instanceof Error ? reason.message : String(reason);
    }
    report.externalLinks.push({ href, status, error });
    if ((!status || status >= 400) && ![429, 999].includes(status)) issue(report, {
      page: href,
      severity: href.includes("github.com") ? "high" : "medium",
      category: "external link",
      problem: error || `Anonymous request returned HTTP ${status}.`,
      reproduction: `Open ${href} without an authenticated session.`,
      screenshot: "none",
    });
  }

  for (const placeholder of discovered.placeholders) issue(report, {
    page: placeholder.route,
    severity: "high",
    category: "placeholder",
    problem: `Clickable placeholder: ${placeholder.text || "unnamed link"}.`,
    reproduction: `Inspect links on ${placeholder.route}.`,
    screenshot: "none",
  });
  await context.close();
}

async function auditLocaleSharing(browser, report) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: "block" });
  const page = await context.newPage();
  await authorizeContext(context);
  await page.goto(baseUrl.href, { waitUntil: "domcontentloaded" });
  await settle(page);
  const initialUrl = page.url();
  await page.getByRole("button", { name: "中", exact: true }).click();
  await page.reload({ waitUntil: "domcontentloaded" });
  await settle(page);
  const persisted = await page.locator("body").innerText().then((text) => /[\u3400-\u9fff]/.test(text));
  const switchedUrl = page.url();
  report.localePersistence = { initialUrl, switchedUrl, persisted, shareable: initialUrl !== switchedUrl };
  if (initialUrl === switchedUrl) issue(report, {
    page: "/",
    severity: "high",
    category: "localization",
    problem: "Chinese selection persists only in browser storage; the URL cannot preserve or share the selected language.",
    reproduction: "Switch to Chinese, copy the URL, then open it in a fresh context.",
    screenshot: "none",
  });
  await context.close();
}

async function main() {
  await mkdir(screenshotRoot, { recursive: true });
  await mkdir(fixtureRoot, { recursive: true });
  const pdfFixture = await makePdfFixture();
  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: baseUrl.href,
    label,
    browser: "Google Chrome via Playwright, fresh contexts, service workers blocked, Review share-link authorization when configured",
    accessMode: vercelShareToken ? "Vercel Shareable Link" : "anonymous",
    viewports,
    locales,
    routes: [],
    pages: [],
    artifacts: [],
    externalLinks: [],
    mailLinks: [],
    screenshots: [],
    issues: [],
  };

  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const discovered = await discoverSite(browser);
    discovered.artifacts = [...new Set([...discovered.artifacts, ...await discoverPublicArtifacts()])].sort();
    report.routes = discovered.routes;
    report.mailLinks = discovered.mailLinks;
    await auditPages(browser, discovered, pdfFixture, report);
    await auditLinks(browser, discovered, report);
    await auditLocaleSharing(browser, report);
  } finally {
    await browser.close();
  }

  report.issueCounts = report.issues.reduce((counts, current) => {
    counts[current.severity] = (counts[current.severity] || 0) + 1;
    return counts;
  }, {});
  await writeFile(path.join(outputRoot, "audit.json"), `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({
    baseUrl: report.baseUrl,
    routes: report.routes.length,
    pages: report.pages.length,
    artifacts: report.artifacts.length,
    externalLinks: report.externalLinks.length,
    screenshots: report.screenshots.length,
    issues: report.issueCounts,
  }, null, 2)}\n`);
}

await main();
