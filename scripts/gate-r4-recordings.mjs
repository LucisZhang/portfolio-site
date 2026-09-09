#!/usr/bin/env node
// R4 gate acceptance recordings ("phase-exit" human gate for the design-
// overhaul wave: privacy document-as-interface rebuild, mobile tables,
// StatGrid/header/glyph retirement, EOD duty-logbook rebuild). Supersedes
// output/gate-r3f/ -- privacy and eod's old selectors from
// gate-r3f-recordings.mjs no longer exist post-rebuild, so this is a fresh
// script rather than an edit of that one. Follows the same pattern: short,
// silent, functional clips exercising real on-page affordances, nothing
// staged. Every selector below was read directly from the current
// component source at HEAD 78d6d10, not guessed.
//
// Server provisioning: reuses an already-listening server on PORT
// (default 4184) if one responds; otherwise spawns `next start` against
// the existing `.next` production build and tears it down when done.
//
// Output: output/gate-r4/*.webm, *.png (INDEX.md is written by the caller
// after this script runs).
//
// Usage: node scripts/gate-r4-recordings.mjs

import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "output", "gate-r4");
const TMP_VIDEO_DIR = path.join(OUT_DIR, ".video-tmp");
const PORT = process.env.PORT ? Number(process.env.PORT) : 4184;
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
    console.log(`[gate-r4] reusing already-listening server at ${BASE_URL}`);
    return { proc: null };
  }
  console.log(`[gate-r4] no server on port ${PORT}; spawning \`npm run start\` against the existing build...`);
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
  console.log(`[gate-r4] server ready at ${BASE_URL}`);
  return { proc };
}

// --- Motion helpers ---

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

async function smoothScrollToSelectorTop(page, selector, marginPx, durationMs, steps = 14) {
  const targetY = await page.evaluate(
    ({ sel, margin }) => {
      const el = document.querySelector(sel);
      if (!el) throw new Error(`smoothScrollToSelectorTop: not found: ${sel}`);
      const rect = el.getBoundingClientRect();
      return window.scrollY + rect.top - margin;
    },
    { sel: selector, margin: marginPx },
  );
  await smoothScrollTo(page, Math.max(0, targetY), durationMs, steps);
}

async function scrollToBottomSmooth(page, durationMs, steps = 18) {
  const maxY = await page.evaluate(() => document.body.scrollHeight - window.innerHeight);
  await smoothScrollTo(page, Math.max(0, maxY), durationMs, steps);
}

// A real DOM click without Playwright's scroll-into-view, so the
// recording's current framing is preserved.
async function clickWithoutScrolling(page, selector) {
  await page.$eval(selector, (el) => el.click());
}

// A real mouse drag across a native <input type="range"> track.
async function dragSlider(page, selector, fromFraction, toFraction, steps = 10, stepMs = 55) {
  const box = await page.locator(selector).boundingBox();
  if (!box) throw new Error(`dragSlider: slider not found: ${selector}`);
  const y = box.y + box.height / 2;
  const fromX = box.x + box.width * fromFraction;
  const toX = box.x + box.width * toFraction;
  await page.mouse.move(fromX, y);
  await page.mouse.down();
  for (let i = 1; i <= steps; i++) {
    const x = fromX + ((toX - fromX) * i) / steps;
    await page.mouse.move(x, y);
    await page.waitForTimeout(stepMs);
  }
  await page.mouse.up();
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
  console.log(`[gate-r4] wrote ${path.relative(ROOT, dest)}`);
}

async function shootClip(browser, { url, viewport, outName, setup, prepare, clipSelector }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  if (setup) await setup(page);
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  if (prepare) await prepare(page);
  const dest = path.join(OUT_DIR, `${outName}.png`);
  if (clipSelector) {
    const clip = await page.evaluate((selectors) => {
      const rects = selectors.map((sel) => {
        const el = document.querySelector(sel);
        if (!el) throw new Error(`shootClip: not found: ${sel}`);
        return el.getBoundingClientRect();
      });
      const top = Math.max(0, Math.min(...rects.map((r) => r.top)) - 24);
      const bottom = Math.max(...rects.map((r) => r.bottom)) + 24;
      const left = Math.max(0, Math.min(...rects.map((r) => r.left)) - 24);
      const right = Math.max(...rects.map((r) => r.right)) + 24;
      return { x: left, y: top, width: right - left, height: bottom - top };
    }, clipSelector);
    await page.screenshot({ path: dest, clip });
  } else {
    await page.screenshot({ path: dest, fullPage: false });
  }
  await context.close();
  console.log(`[gate-r4] wrote ${path.relative(ROOT, dest)}`);
}

// --- Recording plans ---

// Home: unchanged interaction (CSS-only hero entrance, complete by ~520ms
// per globals.css's home-hero-hairline-draw / home-hero-line-rise
// keyframes) then one slow scroll through the home exhibits -- what's new
// to judge this wave is visual (typographic stats replacing StatGrid
// boxes, cleaner header chrome), not a new interaction.
async function recordHome(browser) {
  for (const [label, viewport] of [["desktop", DESKTOP], ["mobile", MOBILE]]) {
    await captureRecording(browser, {
      url: `${BASE_URL}/`,
      viewport,
      outName: `home-${label}`,
      setup: async (page) => page.emulateMedia({ reducedMotion: "no-preference" }),
      run: async (page) => {
        await hold(page, 1000); // hero entrance (hairline + staggered title lines)
        await scrollToBottomSmooth(page, 8500, 18); // slow scroll through the exhibits, now with typographic stats
      },
    });
  }
}

// Zh homepage on mobile: unchanged (independent zh hero line + self-hosted
// display serif), reused verbatim from gate-r3f-recordings.mjs.
async function recordZhHomeMobile(browser) {
  await captureRecording(browser, {
    url: `${BASE_URL}/?lang=zh`,
    viewport: MOBILE,
    outName: "zh-home-mobile",
    setup: async (page) => page.emulateMedia({ reducedMotion: "no-preference" }),
    run: async (page) => {
      await hold(page, 3600);
    },
  });
}

// Triage: unchanged page per this wave's scope -- one desktop reference
// recording only (no mobile this time). Reused verbatim from
// gate-r3f-recordings.mjs: hold on the frontier instrument, drag the
// MISROUTE COST slider (real <input type="range"> drag) to show the
// strategy card re-render live, open one sample drawer, glimpse the drift
// exhibit.
async function recordTriage(browser) {
  await captureRecording(browser, {
    url: `${BASE_URL}/projects/triage-router`,
    viewport: DESKTOP,
    outName: "triage-desktop",
    run: async (page) => {
      await smoothScrollToSelectorTop(page, "#exhibit-01", 24, 700);
      await hold(page, 700);
      await dragSlider(page, "#exhibit-01 #triage-misroute-full", 0.08, 0.92);
      await hold(page, 800);
      await clickWithoutScrolling(page, '#exhibit-01 [data-readout-row] summary[data-drawer-summary]');
      await hold(page, 900);
      await smoothScrollToSelectorTop(page, "#exhibit-04", 24, 1300);
      await hold(page, 800);
    },
  });
}

// Privacy: rebuilt this wave as "the document is the interface" (task F6).
// SCAN renders detections as strikethrough-galley text with a vermilion
// [TYPE] token; there is no longer an Accept/Reject button pair -- clicking
// a strike (button.doc-strike) directly toggles that one detection between
// "destroy" (struck, replaced in the clean copy) and "keep" (left intact,
// original text stays in "What leaves the browser"). Every detection
// starts "destroy" after SCAN, so toggling any one strike to "keep" is
// exactly the verdict-flip case: the clean copy now contains real
// sensitive text again, so [data-testid="privacy-verdict"] flips from
// "export allowed" (pass) to "export blocked" (fail).
async function recordPrivacy(browser) {
  for (const [label, viewport] of [["desktop", DESKTOP], ["mobile", MOBILE]]) {
    await captureRecording(browser, {
      url: `${BASE_URL}/projects/privacy-preflight`,
      viewport,
      outName: `privacy-${label}`,
      run: async (page) => {
        await hold(page, 600); // first screen (hero + compact read-only preview)
        await smoothScrollToSelectorTop(page, "#exhibit-01", 24, 900);
        await hold(page, 400);
        await clickWithoutScrolling(page, "#exhibit-01 button.privacy-scan-link"); // SCAN the prefilled text
        await hold(page, 800); // galley renders: every detection struck (destroy), verdict passes
        await clickWithoutScrolling(page, '#exhibit-01 [data-testid="privacy-galley-doc"] button.doc-strike'); // toggle the first strike to "keep"
        await hold(page, 1100); // output regains real text, verdict flips to fail -- both visible on screen
      },
    });
  }
}

// EOD: rebuilt this wave as the "duty logbook" (task F9) -- ten real log
// entries as native <details>, no more fault-chessboard/pipeline-map/
// scrubber instrument. The default-drill entry (broker-restart) is pinned
// open in the FIRST viewport (EodLog.tsx renders the log as the page's
// hero, no scroll needed). Opening any OTHER closed entry (a real click on
// its <summary>) automatically fetches that drill's real recorded file and
// types the transcript in via GSAP at the real recorded pace -- this is
// the "opening another entry" + "a full typed replay" requirement in one
// action, not two. Total replay duration is a fixed 8.5s (rich drills,
// >=4 real anchors) or 3.2s (sparse drills) per replayTimeWarp.ts, so it
// always finishes well inside a 12s clip regardless of which entry opens
// second in DOM order (DEFAULT_LOG_ID's entry is always first; whichever
// drill is next in EOD_LOG_ORDER is always second -- selected positionally
// here rather than by a specific id, so this keeps working if the log's
// order changes).
async function recordEod(browser) {
  for (const [label, viewport] of [["desktop", DESKTOP], ["mobile", MOBILE]]) {
    await captureRecording(browser, {
      url: `${BASE_URL}/projects/exactly-once-drills`,
      viewport,
      outName: `eod-${label}`,
      setup: async (page) => page.emulateMedia({ reducedMotion: "no-preference" }),
      run: async (page) => {
        // Kept lean: page-load-to-networkidle time before this function
        // starts already eats ~1.3-1.4s of the recorded video, so the
        // setup phase here is trimmed hard to leave the full 8.5s replay
        // (rich-drill path, replayTimeWarp.ts) room to finish inside the
        // 12s clip budget.
        await hold(page, 400); // first viewport: the pinned featured entry, already open
        await smoothScrollToSelectorTop(page, '[data-eod-log] > details[data-log-entry]:nth-of-type(2)', label === "desktop" ? 24 : 60, 500);
        await hold(page, 150);
        await clickWithoutScrolling(page, '[data-eod-log] > details[data-log-entry]:nth-of-type(2) summary[data-log-summary]'); // open another entry -> auto-arms the typed replay
        await hold(page, 8700); // ride the full typed replay through to "done" (rich path: 8.5s fixed)
      },
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
    await recordZhHomeMobile(browser);
    await recordTriage(browser);
    await recordPrivacy(browser);
    await recordEod(browser);
  } finally {
    await browser.close();
    await rm(TMP_VIDEO_DIR, { recursive: true, force: true });
    if (proc) {
      console.log("[gate-r4] stopping server spawned by this script...");
      proc.kill();
    }
  }

  const expected = [
    ["home-desktop.webm", 30_000],
    ["home-mobile.webm", 30_000],
    ["zh-home-mobile.webm", 30_000],
    ["triage-desktop.webm", 30_000],
    ["privacy-desktop.webm", 30_000],
    ["privacy-mobile.webm", 30_000],
    ["eod-desktop.webm", 30_000],
    ["eod-mobile.webm", 30_000],
  ];
  const problems = [];
  for (const [name, minBytes] of expected) {
    const filePath = path.join(OUT_DIR, name);
    try {
      const info = await stat(filePath);
      if (info.size < minBytes) problems.push(`${name}: ${info.size} bytes < ${minBytes} minimum`);
    } catch {
      problems.push(`${name}: MISSING`);
    }
  }
  if (problems.length > 0) throw new Error(`gate-r4 output sanity check failed:\n${problems.join("\n")}`);

  console.log(`[gate-r4] done. Output in ${path.relative(ROOT, OUT_DIR)}/`);
}

main().catch((err) => {
  console.error("[gate-r4] failed:", err);
  process.exitCode = 1;
});
