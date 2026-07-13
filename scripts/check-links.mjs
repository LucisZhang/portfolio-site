import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "@playwright/test";

const args = process.argv.slice(2);
function option(name, fallback = "") {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
}

const baseUrl = new URL(option("--url", process.env.PORTFOLIO_URL || "http://127.0.0.1:4173"));
const output = option("--output");
const routeQueue = ["/", "/analytics/analytics-tandem"];
const visitedRoutes = new Set();
const internalTargets = new Map();
const externalTargets = new Set();
const findings = [];

const mimeByExtension = {
  ".csv": ["text/csv"],
  ".json": ["application/json"],
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".md": ["text/markdown", "text/plain"],
  ".mmd": ["application/vnd.chipnuts.karaoke-mmd", "text/plain"],
  ".parquet": ["application/octet-stream"],
  ".pdf": ["application/pdf"],
  ".png": ["image/png"],
  ".svg": ["image/svg+xml"],
};

function addFinding(severity, category, page, message, target = "") {
  findings.push({ severity, category, page, target, message });
}

function normalizeRoute(url) {
  return `${url.pathname}${url.searchParams.has("lang") ? `?lang=${url.searchParams.get("lang")}` : ""}`;
}

function isArtifact(pathname) {
  return pathname.startsWith("/case-studies/") && Object.hasOwn(mimeByExtension, path.extname(pathname).toLowerCase());
}

function addInternal(url, detail) {
  const key = url.href;
  const existing = internalTargets.get(key) || [];
  existing.push(detail);
  internalTargets.set(key, existing);
}

const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const context = await browser.newContext({ serviceWorkers: "block" });
  while (routeQueue.length) {
    const route = routeQueue.shift();
    if (!route || visitedRoutes.has(route)) continue;
    visitedRoutes.add(route);
    const page = await context.newPage();
    const response = await page.goto(new URL(route, baseUrl).href, { waitUntil: "domcontentloaded", timeout: 30_000 });
    if (!response || response.status() >= 400) addFinding("error", "route", route, `Route returned HTTP ${response?.status() || 0}.`);
    await page.waitForTimeout(250);
    const controls = await page.evaluate(() => ({
      anchors: [...document.querySelectorAll("a")].map((anchor) => ({
        href: anchor.getAttribute("href") || "",
        resolved: anchor.href,
        text: (anchor.textContent || "").trim(),
        download: anchor.getAttribute("download"),
        disabled: anchor.getAttribute("aria-disabled") === "true" || anchor.classList.contains("disabled"),
      })),
      buttons: [...document.querySelectorAll("button")].map((button) => ({
        text: (button.textContent || "").trim(),
        label: button.getAttribute("aria-label") || "",
        title: button.getAttribute("title") || "",
      })),
    }));

    for (const button of controls.buttons) {
      if (!button.text && !button.label && !button.title) addFinding("error", "empty button", route, "Button has no visible text, aria-label, or title.");
    }

    for (const anchor of controls.anchors) {
      if (!anchor.href || anchor.href === "#" || /^javascript:/i.test(anchor.href)) {
        addFinding("error", "placeholder", route, `Clickable placeholder: ${anchor.text || "unnamed link"}.`, anchor.href);
        continue;
      }
      if (/\/private\/tmp\/|\/Users\//.test(anchor.href)) addFinding("error", "private path", route, "Public link exposes a local filesystem path.", anchor.href);
      if (anchor.disabled && anchor.href) addFinding("error", "disabled link", route, "Disabled state is still a clickable anchor.", anchor.href);
      if (anchor.href.startsWith("mailto:")) continue;
      const target = new URL(anchor.resolved);
      if (target.origin !== baseUrl.origin) {
        externalTargets.add(target.href);
        continue;
      }
      if (target.pathname === "/artifact") {
        const source = target.searchParams.get("src");
        if (!source) addFinding("error", "artifact viewer", route, "Artifact viewer link has no src parameter.", target.href);
        else addInternal(new URL(source, baseUrl), { page: route, download: null, throughViewer: true });
      } else if (isArtifact(target.pathname) && anchor.download === null) {
        addFinding("error", "raw artifact", route, "Project file bypasses the contextual viewer.", target.href);
      }
      addInternal(target, { page: route, download: anchor.download, throughViewer: false });
      if (!isArtifact(target.pathname) && target.pathname !== "/artifact") {
        const next = normalizeRoute(target);
        if (!visitedRoutes.has(next) && !routeQueue.includes(next)) routeQueue.push(next);
      }
    }
    await page.close();
  }

  for (const [href, references] of internalTargets) {
    const url = new URL(href);
    const response = await context.request.get(href, { failOnStatusCode: false, timeout: 30_000 });
    if (response.status() >= 400) {
      addFinding("error", "internal status", references[0].page, `Internal target returned HTTP ${response.status()}.`, href);
      continue;
    }
    if (isArtifact(url.pathname)) {
      const expected = mimeByExtension[path.extname(url.pathname).toLowerCase()];
      const actual = response.headers()["content-type"] || "";
      if (!expected.some((mime) => actual.startsWith(mime))) addFinding("error", "MIME", references[0].page, `Expected ${expected.join(" or ")}, received ${actual || "no Content-Type"}.`, href);
      for (const reference of references.filter((item) => item.download !== null)) {
        const requestedName = reference.download || decodeURIComponent(path.basename(url.pathname));
        if (requestedName !== decodeURIComponent(path.basename(url.pathname))) addFinding("error", "download name", reference.page, `Download name ${requestedName} does not match the source filename.`, href);
      }
    }
  }

  for (const href of externalTargets) {
    if (href.startsWith("mailto:")) continue;
    let status = 0;
    try {
      const response = await context.request.get(href, { failOnStatusCode: false, timeout: 30_000, maxRedirects: 8 });
      status = response.status();
    } catch (error) {
      addFinding("warning", "external request", "external", error instanceof Error ? error.message : String(error), href);
      continue;
    }
    if ([429, 999].includes(status)) addFinding("warning", "external rate limit", "external", `Automated request returned HTTP ${status}; verify in a normal anonymous browser.`, href);
    else if (status === 401 || status === 403 || status === 404 || status >= 500) addFinding("error", "external status", "external", `External target returned HTTP ${status}.`, href);
  }
  await context.close();
} finally {
  await browser.close();
}

if (!visitedRoutes.has("/analytics/analytics-tandem")) addFinding("error", "legacy route", "/analytics/analytics-tandem", "Legacy route was not checked.");

const report = {
  generatedAt: new Date().toISOString(),
  baseUrl: baseUrl.href,
  routes: [...visitedRoutes].sort(),
  internalTargets: internalTargets.size,
  externalTargets: externalTargets.size,
  findings,
  counts: findings.reduce((result, finding) => ({ ...result, [finding.severity]: (result[finding.severity] || 0) + 1 }), {}),
};

if (output) {
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
}
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (findings.some((finding) => finding.severity === "error")) process.exitCode = 1;
