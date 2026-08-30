#!/usr/bin/env node
// Task 0.7: G1 acceptance screenshot package.
//
// Captures the /dev/exhibition-fixture page (three-viewport matrix of
// exhibit backgrounds, vermilion shades, hairlines, and the three serif
// candidates), the exhibition rail across its desktop/narrow/mobile states
// (including the mobile <details> index open, with and without JavaScript),
// and the real homepage in its shell for whole-site context.
//
// Server provisioning: reuses an already-listening dev server on
// PORT (default 3000) if one responds; otherwise spawns `npm run dev`
// itself and waits for it to come up, tearing it down when done. Using
// `next dev` (not a production build) is deliberate here -- this is a
// visual/color acceptance package for a human gate, not a perf or bundle
// check, and dev mode avoids requiring a fresh `next build` on this branch.
//
// Output: PNGs under output/g1/, plus output/g1/INDEX.md (written by the
// caller after this script runs -- see task-0.7-report.md).
//
// Usage: node scripts/g1-shots.mjs

import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "output", "g1");
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const BASE_URL = `http://localhost:${PORT}`;

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  narrow: { width: 1024, height: 768 },
  mobile: { width: 390, height: 844 },
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function isServerUp() {
  try {
    const res = await fetch(BASE_URL, { method: "GET" });
    return res.status < 500;
  } catch {
    return false;
  }
}

async function waitForServer(timeoutMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isServerUp()) return true;
    await sleep(500);
  }
  return false;
}

async function ensureServer() {
  if (await isServerUp()) {
    console.log(`[g1-shots] reusing already-listening server at ${BASE_URL}`);
    return { proc: null };
  }
  console.log(`[g1-shots] no server on port ${PORT}; spawning \`npm run dev\`...`);
  const proc = spawn("npm", ["run", "dev", "--", "-p", String(PORT)], {
    cwd: ROOT,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, PORT: String(PORT) },
  });
  proc.stdout.on("data", (d) => process.stdout.write(`[dev] ${d}`));
  proc.stderr.on("data", (d) => process.stderr.write(`[dev] ${d}`));

  const up = await waitForServer();
  if (!up) {
    proc.kill();
    throw new Error(`dev server did not come up on ${BASE_URL} within timeout`);
  }
  console.log(`[g1-shots] dev server ready at ${BASE_URL}`);
  return { proc };
}

async function shot(page, name, opts = {}) {
  const file = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: file, ...opts });
  console.log(`[g1-shots] wrote ${path.relative(ROOT, file)}`);
}

async function elementShot(page, selector, name, opts = {}) {
  const locator = page.locator(selector).first();
  await locator.waitFor({ state: "visible" });
  const file = path.join(OUT_DIR, `${name}.png`);
  await locator.screenshot({ path: file, ...opts });
  console.log(`[g1-shots] wrote ${path.relative(ROOT, file)}`);
}

async function captureFixture(browser) {
  const FIXTURE_URL = `${BASE_URL}/dev/exhibition-fixture`;

  // --- Full-page shots across the three viewports (JS enabled) ---
  for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
    const context = await browser.newContext({ viewport: vp });
    const page = await context.newPage();
    await page.goto(FIXTURE_URL, { waitUntil: "networkidle" });
    await shot(page, `fixture-${vp.width}x${vp.height}-full`, { fullPage: true });
    await context.close();
  }

  // --- Exhibit background / vermilion / hairline crops (1440, JS enabled) ---
  {
    const context = await browser.newContext({ viewport: VIEWPORTS.desktop });
    const page = await context.newPage();
    await page.goto(FIXTURE_URL, { waitUntil: "networkidle" });
    await elementShot(page, '[data-exhibit="00"][data-bg="paper"]', "exhibit-00-bg-paper-1440");
    await elementShot(page, '[data-exhibit="01"][data-bg="ink"]', "exhibit-01-bg-ink-vermilion-on-ink-1440");
    await elementShot(page, '[data-exhibit="02"][data-bg="white"]', "exhibit-02-bg-white-findings-1440");
    await elementShot(page, '[data-exhibit="03"][data-bg="paper-alt"]', "exhibit-03-bg-paper-alt-1440");
    // StatGrid checkerboard hairlines, isolated.
    await elementShot(page, '[data-exhibit="00"] .exhibit-stat-grid', "statgrid-checkerboard-hairlines-1440");
    await context.close();
  }

  // --- Serif specimens (1440, JS enabled): full section + per-candidate crops ---
  {
    const context = await browser.newContext({ viewport: VIEWPORTS.desktop });
    const page = await context.newPage();
    await page.goto(FIXTURE_URL, { waitUntil: "networkidle" });
    const specimenSection = 'section[aria-label="Display serif specimen (task 0.6)"]';
    await elementShot(page, specimenSection, "serif-specimens-all-three-1440");
    const divs = page.locator(`${specimenSection} > div`);
    const count = await divs.count();
    const labels = ["serif-primary-source-serif4-1440", "serif-alternate-bitter-1440", "serif-fallback-georgia-1440"];
    for (let i = 0; i < count && i < labels.length; i++) {
      const file = path.join(OUT_DIR, `${labels[i]}.png`);
      await divs.nth(i).screenshot({ path: file });
      console.log(`[g1-shots] wrote ${path.relative(ROOT, file)}`);
    }
    await context.close();
  }

  // --- Rail states (JS enabled) ---
  {
    // NOTE: the outer <nav data-exhibition-rail> has no box of its own --
    // its only >=980px child (.exhibit-rail-fixed) is position:fixed and
    // its <980px child (.exhibit-rail-mobile) is a sibling <details> --
    // so Playwright treats the <nav> itself as zero-size/hidden. Screenshot
    // the actual visible rail element (.exhibit-rail-fixed or
    // .exhibit-rail-mobile) instead.

    // Desktop fixed rail (1440).
    const ctxDesktop = await browser.newContext({ viewport: VIEWPORTS.desktop });
    const pageDesktop = await ctxDesktop.newPage();
    await pageDesktop.goto(FIXTURE_URL, { waitUntil: "networkidle" });
    await elementShot(pageDesktop, ".exhibit-rail-fixed", "rail-desktop-fixed-1440");
    await ctxDesktop.close();

    // Narrowed rail (1024, within the 980-1180 narrow band).
    const ctxNarrow = await browser.newContext({ viewport: VIEWPORTS.narrow });
    const pageNarrow = await ctxNarrow.newPage();
    await pageNarrow.goto(FIXTURE_URL, { waitUntil: "networkidle" });
    await elementShot(pageNarrow, ".exhibit-rail-fixed", "rail-narrowed-1024");
    await ctxNarrow.close();

    // Mobile sticky bar, index CLOSED (default state).
    const ctxMobile = await browser.newContext({ viewport: VIEWPORTS.mobile });
    const pageMobile = await ctxMobile.newPage();
    await pageMobile.goto(FIXTURE_URL, { waitUntil: "networkidle" });
    await elementShot(pageMobile, ".exhibit-rail-mobile", "rail-mobile-bar-closed-390");

    // Mobile sticky bar, index OPEN -- toggled via a real click on the
    // <summary>, which is native <details> browser behavior (no page JS
    // involved in the toggle itself).
    await pageMobile.click(".exhibit-rail-mobile-bar");
    await pageMobile.waitForSelector(".exhibit-rail-mobile[open]");
    await elementShot(pageMobile, ".exhibit-rail-mobile", "rail-mobile-index-open-390");
    await shot(pageMobile, "fixture-390x844-index-open", { fullPage: true });
    await ctxMobile.close();
  }

  // --- Mobile <details> index, JavaScript DISABLED (proves zero-JS) ---
  {
    const ctxNoJs = await browser.newContext({
      viewport: VIEWPORTS.mobile,
      javaScriptEnabled: false,
    });
    const pageNoJs = await ctxNoJs.newPage();
    await pageNoJs.goto(FIXTURE_URL, { waitUntil: "load" });

    await elementShot(pageNoJs, ".exhibit-rail-mobile", "nojs-rail-mobile-bar-closed-390");
    await shot(pageNoJs, "nojs-fixture-390x844-closed", { fullPage: true });

    // Native <details>/<summary> disclosure toggles on click even with
    // page JavaScript fully disabled -- this is browser HTML behavior, not
    // a script. A real Playwright click (not page.evaluate) proves it.
    await pageNoJs.click(".exhibit-rail-mobile-bar");
    await pageNoJs.waitForSelector(".exhibit-rail-mobile[open]");
    await elementShot(pageNoJs, ".exhibit-rail-mobile", "nojs-rail-mobile-index-open-390");
    await shot(pageNoJs, "nojs-fixture-390x844-index-open", { fullPage: true });

    await ctxNoJs.close();
  }
}

async function captureHomepage(browser) {
  for (const [vpName, vp] of Object.entries({ desktop: VIEWPORTS.desktop, mobile: VIEWPORTS.mobile })) {
    const context = await browser.newContext({ viewport: vp });
    const page = await context.newPage();
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    await shot(page, `home-${vp.width}x${vp.height}-full`, { fullPage: true });
    await context.close();
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const { proc } = await ensureServer();
  const browser = await chromium.launch();
  try {
    await captureFixture(browser);
    await captureHomepage(browser);
  } finally {
    await browser.close();
    if (proc) {
      console.log("[g1-shots] stopping dev server spawned by this script...");
      proc.kill();
    }
  }
  console.log(`[g1-shots] done. Output in ${path.relative(ROOT, OUT_DIR)}/`);
}

main().catch((err) => {
  console.error("[g1-shots] failed:", err);
  process.exitCode = 1;
});
