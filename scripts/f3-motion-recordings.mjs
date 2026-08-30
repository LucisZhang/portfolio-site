#!/usr/bin/env node
// Task F3 acceptance recordings: the EOD replay choreography (desktop +
// mobile, one full replay each including the inject and recovery moments)
// and the CSS-only homepage hero entrance. Follows the g3-recordings.mjs
// pattern: silent functional clips, real on-page affordances only (the
// PLAY press is the same click the eod-r2 Playwright suite performs),
// nothing staged.
//
// Server provisioning: reuses an already-listening server on PORT
// (default 4181) if one responds; otherwise spawns `next start` against
// the existing `.next` production build and tears it down when done.
//
// Output: output/f3-motion/*.webm (INDEX.md is written by the caller).
//
// Usage: node scripts/f3-motion-recordings.mjs

import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdir, rename, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "output", "f3-motion");
const TMP_VIDEO_DIR = path.join(OUT_DIR, ".video-tmp");
const PORT = process.env.PORT ? Number(process.env.PORT) : 4181;
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
    console.log(`[f3-motion] reusing already-listening server at ${BASE_URL}`);
    return { proc: null };
  }
  console.log(`[f3-motion] no server on port ${PORT}; spawning \`npm run start\` against the existing build...`);
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
  console.log(`[f3-motion] server ready at ${BASE_URL}`);
  return { proc };
}

async function scrollToSelectorTop(page, selector, marginPx = 16) {
  await page.evaluate(
    ({ sel, margin }) => {
      const el = document.querySelector(sel);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      window.scrollTo(0, window.scrollY + rect.top - margin);
    },
    { sel: selector, margin: marginPx },
  );
}

async function smoothScrollBy(page, deltaY, durationMs, steps = 14) {
  const startY = await page.evaluate(() => window.scrollY);
  const stepMs = durationMs / steps;
  for (let i = 1; i <= steps; i += 1) {
    await page.evaluate((y) => window.scrollTo(0, y), startY + (deltaY * i) / steps);
    await page.waitForTimeout(stepMs);
  }
}

// A real DOM click on the PLAY affordance without Playwright's
// scroll-into-view, so the recording's framing (pipeline map + timeline
// in shot for the inject moment) is preserved.
async function clickWithoutScrolling(page, selector) {
  await page.$eval(selector, (el) => el.click());
}

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
  console.log(`[f3-motion] wrote ${path.relative(ROOT, dest)}`);
}

// One full choreographed replay of the default drill (broker-restart:
// real inject T+0, detect T+0.198s, recover T+5m19s, verify T+6m08s —
// time-warped to ~8.5s). The clip covers PLAY, the inject moment (line
// draw + blast-radius outline + fault band), the compressed quiet
// stretch, the recovery crossing (band clears, outline undraws), the
// verify cascade, and the REPLAY affordance fading in.
async function recordEodReplay(browser) {
  for (const [label, viewport] of [["desktop", DESKTOP], ["mobile", MOBILE]]) {
    await captureRecording(browser, {
      url: `${BASE_URL}/engineering/exactly-once-drills`,
      viewport,
      outName: `eod-replay-${label}`,
      setup: async (page) => {
        await page.emulateMedia({ reducedMotion: "no-preference" });
      },
      run: async (page) => {
        // Open framed on the pipeline map + board + timeline top, so the
        // inject moment (blast-radius outline draw + pulse + INJECT/DETECT
        // cascade) is in shot.
        await scrollToSelectorTop(page, '[data-exhibit="01"] [data-eod-instrument]', label === "desktop" ? 24 : 60);
        await page.waitForTimeout(700);
        await clickWithoutScrolling(page, '[data-exhibit="01"] [data-scrubber-play]');
        await page.waitForTimeout(3200); // inject + detect, fault window opens
        // Pan down during the compressed quiet stretch so the recovery
        // crossing, verify cascade, curve completion, and REPLAY fade
        // play out with the curve + scrubber in shot.
        await smoothScrollBy(page, label === "desktop" ? 320 : 560, 900);
        await page.waitForTimeout(6300); // recovery ~T+319s, verify, REPLAY fade
      },
    });
  }
}

// The CSS-only hero entrance (520ms) — capture starts before navigation
// so the hairline draw-in and the two staggered title lines are on film.
async function recordHeroEntrance(browser) {
  await captureRecording(browser, {
    url: `${BASE_URL}/`,
    viewport: DESKTOP,
    outName: "hero-entrance-desktop",
    run: async (page) => {
      await page.waitForTimeout(2600);
    },
  });
}

async function main() {
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });
  const { proc } = await ensureServer();
  const browser = await chromium.launch();
  try {
    await recordEodReplay(browser);
    await recordHeroEntrance(browser);
  } finally {
    await browser.close();
    await rm(TMP_VIDEO_DIR, { recursive: true, force: true });
    if (proc) {
      console.log("[f3-motion] stopping server spawned by this script...");
      proc.kill();
    }
  }
  console.log(`[f3-motion] done. Output in ${path.relative(ROOT, OUT_DIR)}/`);
}

main().catch((err) => {
  console.error("[f3-motion] failed:", err);
  process.exitCode = 1;
});
