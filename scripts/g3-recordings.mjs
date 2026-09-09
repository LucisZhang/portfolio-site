#!/usr/bin/env node
// G3 acceptance recordings package ("product or report?" human gate).
//
// Produces short, silent, functional recordings/screenshots of the
// rebuilt pages so a human can judge -- in <=10s per clip -- whether the
// first screen reads as a working product rather than a report. This is
// NOT a marketing reel: motion is simple (holds + linear scrolls + real
// clicks Playwright would also perform in tests), and every interaction
// exercises a real on-page affordance, nothing staged.
//
// Server provisioning: reuses an already-listening server on PORT
// (default 4180) if one responds; otherwise spawns `next start` against
// the existing `.next` production build (deliberately NOT `next dev` --
// this measures the real shipped bundle) and tears it down when done.
// A non-default port is used so this never fights a reviewer's server on
// :3000.
//
// Output: output/g3-r1r2/*.webm, *.png (INDEX.md is written by the caller
// after this script runs).
//
// Usage: node scripts/g3-recordings.mjs

import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdir, rename, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "output", "g3-r1r2");
const TMP_VIDEO_DIR = path.join(OUT_DIR, ".video-tmp");
const PORT = process.env.PORT ? Number(process.env.PORT) : 4180;
const BASE_URL = `http://127.0.0.1:${PORT}`;

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

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
    console.log(`[g3-recordings] reusing already-listening server at ${BASE_URL}`);
    return { proc: null };
  }
  console.log(`[g3-recordings] no server on port ${PORT}; spawning \`npm run start\` against the existing build...`);
  const proc = spawn("npm", ["run", "start", "--", "--hostname", "127.0.0.1", "--port", String(PORT)], {
    cwd: ROOT,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, PORT: String(PORT) },
  });
  proc.stdout.on("data", (d) => process.stdout.write(`[next start] ${d}`));
  proc.stderr.on("data", (d) => process.stderr.write(`[next start] ${d}`));

  const up = await waitForServer();
  if (!up) {
    proc.kill();
    throw new Error(`server did not come up on ${BASE_URL} within timeout`);
  }
  console.log(`[g3-recordings] server ready at ${BASE_URL}`);
  return { proc };
}

// --- Motion helpers (linear, deterministic -- no easing tricks) ---

async function hold(page, ms) {
  await page.waitForTimeout(ms);
}

async function smoothScrollTo(page, targetY, durationMs, steps = 16) {
  const startY = await page.evaluate(() => window.scrollY);
  const stepMs = durationMs / steps;
  for (let i = 1; i <= steps; i++) {
    const y = startY + ((targetY - startY) * i) / steps;
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(stepMs);
  }
}

async function scrollToBottomSmooth(page, durationMs, steps = 18) {
  const maxY = await page.evaluate(() => document.body.scrollHeight - window.innerHeight);
  await smoothScrollTo(page, Math.max(0, maxY), durationMs, steps);
}

async function scrollToSelectorTop(page, selector, durationMs) {
  const y = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return window.scrollY;
    const rect = el.getBoundingClientRect();
    return window.scrollY + rect.top - 24;
  }, selector);
  await smoothScrollTo(page, y, durationMs);
}

// --- Video recording ---

async function captureRecording(browser, { url, viewport, outName, setup, run }) {
  const videoDir = path.join(TMP_VIDEO_DIR, outName);
  await mkdir(videoDir, { recursive: true });
  const context = await browser.newContext({
    viewport,
    recordVideo: { dir: videoDir, size: viewport },
  });
  const page = await context.newPage();
  if (setup) await setup(page);
  await page.goto(url, { waitUntil: "networkidle" });
  await run(page);
  const video = page.video();
  await context.close();
  const savedPath = await video.path();
  const dest = path.join(OUT_DIR, `${outName}.webm`);
  await rename(savedPath, dest);
  await rm(videoDir, { recursive: true, force: true });
  console.log(`[g3-recordings] wrote ${path.relative(ROOT, dest)}`);
}

async function shot(browser, { url, viewport, outName, setup }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  if (setup) await setup(page);
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(300); // let post-hydration locale/hero swap settle
  const dest = path.join(OUT_DIR, `${outName}.png`);
  await page.screenshot({ path: dest, fullPage: false });
  await context.close();
  console.log(`[g3-recordings] wrote ${path.relative(ROOT, dest)}`);
}

// --- Recording plans ---

async function recordHome(browser) {
  for (const [label, viewport] of [["desktop", DESKTOP], ["mobile", MOBILE]]) {
    await captureRecording(browser, {
      url: `${BASE_URL}/`,
      viewport,
      outName: `home-${label}`,
      run: async (page) => {
        await hold(page, 900); // brief hold on hero (exhibit 00)
        await scrollToBottomSmooth(page, 6800, 18); // one slow scroll through all seven exhibits
      },
    });
  }
}

async function recordForge(browser) {
  for (const [label, viewport] of [["desktop", DESKTOP], ["mobile", MOBILE]]) {
    await captureRecording(browser, {
      url: `${BASE_URL}/projects/frontier-forge`,
      viewport,
      outName: `forge-${label}`,
      run: async (page) => {
        await hold(page, 900); // hold on the prefilled instrument first screen
        await scrollToSelectorTop(page, '[data-testid="forge-evidence-explorer"]', 1100); // to the claim table (exhibit 02)
        const trainingFilter = page.locator('[data-filter="training"]');
        await trainingFilter.click(); // expand/filter one claim row set -- a real, working affordance
        await hold(page, 600);
        await scrollToBottomSmooth(page, 4600, 14); // scroll through the remaining exhibits
      },
    });
  }
}

async function recordEod(browser) {
  for (const [label, viewport] of [["desktop", DESKTOP], ["mobile", MOBILE]]) {
    await captureRecording(browser, {
      url: `${BASE_URL}/projects/exactly-once-drills`,
      viewport,
      outName: `eod-${label}`,
      setup: async (page) => {
        // Guarantee the autoplay replay path (not the reduced-motion
        // stage-button fallback) so the timeline/curve/scrubber sync is
        // actually visible in the clip.
        await page.emulateMedia({ reducedMotion: "no-preference" });
      },
      run: async (page) => {
        await hold(page, 1000); // hold on topology + board (exhibit 01)
        const cell = page.locator('[data-exhibit="01"] [data-drill-cell][data-drill-id="small-file-rewrite"]');
        await cell.click(); // a non-default drill cell
        await hold(page, 400);
        const playButton = page.locator('[data-exhibit="01"] [data-scrubber-play]');
        await playButton.click();
        await hold(page, 4200); // let the replay run, showing timeline/curve/scrubber sync
      },
    });
  }
}

async function shootHeroVariants(browser) {
  for (const variant of ["a", "b", "c"]) {
    await shot(browser, {
      url: `${BASE_URL}/?hero=${variant}`,
      viewport: DESKTOP,
      outName: `hero-${variant}`,
    });
    // The site's real locale switch: `?lang=zh` (checked before
    // localStorage in src/lib/i18n.ts's detectLocale) -- same mechanism a
    // shared zh link would use, so this is what the site actually does,
    // not a synthetic override.
    await shot(browser, {
      url: `${BASE_URL}/?hero=${variant}&lang=zh`,
      viewport: DESKTOP,
      outName: `hero-${variant}-zh`,
    });
  }
}

async function main() {
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });
  const { proc } = await ensureServer();
  const browser = await chromium.launch();
  try {
    await recordHome(browser);
    await shootHeroVariants(browser);
    await recordForge(browser);
    await recordEod(browser);
  } finally {
    await browser.close();
    await rm(TMP_VIDEO_DIR, { recursive: true, force: true });
    if (proc) {
      console.log("[g3-recordings] stopping server spawned by this script...");
      proc.kill();
    }
  }
  console.log(`[g3-recordings] done. Output in ${path.relative(ROOT, OUT_DIR)}/`);
}

main().catch((err) => {
  console.error("[g3-recordings] failed:", err);
  process.exitCode = 1;
});
