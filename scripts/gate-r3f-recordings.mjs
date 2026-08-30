#!/usr/bin/env node
// R3F gate acceptance recordings ("phase-exit" human gate for the F-series
// feedback tasks + R3 pages). Follows the g3-recordings.mjs / f3-motion-
// recordings.mjs pattern: short, silent, functional clips exercising real
// on-page affordances (the same clicks/drags the e2e suite performs),
// nothing staged. Every selector below was read directly from the current
// component source, not guessed.
//
// Server provisioning: reuses an already-listening server on PORT
// (default 4183) if one responds; otherwise spawns `next start` against
// the existing `.next` production build and tears it down when done.
//
// Output: output/gate-r3f/*.webm, *.png (INDEX.md is written by the caller
// after this script runs).
//
// Usage: node scripts/gate-r3f-recordings.mjs

import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "output", "gate-r3f");
const TMP_VIDEO_DIR = path.join(OUT_DIR, ".video-tmp");
const PORT = process.env.PORT ? Number(process.env.PORT) : 4183;
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
    console.log(`[gate-r3f] reusing already-listening server at ${BASE_URL}`);
    return { proc: null };
  }
  console.log(`[gate-r3f] no server on port ${PORT}; spawning \`npm run start\` against the existing build...`);
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
  console.log(`[gate-r3f] server ready at ${BASE_URL}`);
  return { proc };
}

// --- Motion helpers ---

async function hold(page, ms) {
  await page.waitForTimeout(ms);
}

async function scrollToSelectorTop(page, selector, marginPx = 16) {
  await page.evaluate(
    ({ sel, margin }) => {
      const el = document.querySelector(sel);
      if (!el) throw new Error(`scrollToSelectorTop: not found: ${sel}`);
      const rect = el.getBoundingClientRect();
      window.scrollTo(0, window.scrollY + rect.top - margin);
    },
    { sel: selector, margin: marginPx },
  );
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
// recording's current framing is preserved (matches f3-motion-recordings).
async function clickWithoutScrolling(page, selector) {
  await page.$eval(selector, (el) => el.click());
}

// A real mouse drag across a native <input type="range"> track -- clicking
// and dragging along the track is standard browser behavior for range
// inputs, so this is the same physical action a human reviewer would
// perform, not a synthetic value-set.
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
  console.log(`[gate-r3f] wrote ${path.relative(ROOT, dest)}`);
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
  console.log(`[gate-r3f] wrote ${path.relative(ROOT, dest)}`);
}

// --- Recording plans ---

// Home: CSS-only hero entrance (hairline draw + two staggered title lines,
// complete by ~520ms per globals.css's home-hero-hairline-draw /
// home-hero-line-rise keyframes) captured from load, then one slow scroll
// through the seven home exhibits.
async function recordHome(browser) {
  for (const [label, viewport] of [["desktop", DESKTOP], ["mobile", MOBILE]]) {
    await captureRecording(browser, {
      url: `${BASE_URL}/`,
      viewport,
      outName: `home-${label}`,
      setup: async (page) => page.emulateMedia({ reducedMotion: "no-preference" }),
      run: async (page) => {
        await hold(page, 1000); // hero entrance (hairline + staggered title lines)
        await scrollToBottomSmooth(page, 6800, 18); // one slow scroll through all seven exhibits
      },
    });
  }
}

// Zh homepage on mobile: independent zh hero line (.home-hero-zh, rendered
// only when locale === "zh") + the self-hosted display serif, at the
// mobile type scale. `?lang=zh` is the site's real locale switch (checked
// before localStorage in src/lib/i18n.ts's detectLocale).
async function recordZhHomeMobile(browser) {
  await captureRecording(browser, {
    url: `${BASE_URL}/?lang=zh`,
    viewport: MOBILE,
    outName: "zh-home-mobile",
    setup: async (page) => page.emulateMedia({ reducedMotion: "no-preference" }),
    run: async (page) => {
      await hold(page, 3600); // hero entrance + the independent zh line, static hold
    },
  });
}

// Forge: first screen only at 390px, mobile type scale check (desktop
// forge is unchanged per this task's scope, so only mobile is recorded).
async function recordForgeMobile(browser) {
  await captureRecording(browser, {
    url: `${BASE_URL}/ai/frontier-forge`,
    viewport: MOBILE,
    outName: "forge-mobile",
    run: async (page) => {
      await hold(page, 900);
      await smoothScrollTo(page, 640, 3000, 10); // gentle partial scroll, still "first screen" territory
    },
  });
}

// Triage: desktop holds on the full frontier instrument (exhibit 01),
// drags the MISROUTE COST slider (real <input type="range"> drag) to show
// the strategy card re-render live, opens one sample drawer (native
// <details>/<summary>), then scrolls to the drift exhibit (04) for a
// glimpse. Mobile: the hero's compact instrument column is intentionally
// `display: none` below 1180px (triage.css) -- there is no slider in the
// hero at mobile widths -- so the only slider to drag is exhibit 01's,
// reached by the same short scroll (the hero itself is shorter on mobile
// with the instrument column gone, so this is still first-screen
// territory).
async function recordTriage(browser) {
  await captureRecording(browser, {
    url: `${BASE_URL}/ai/triage-router`,
    viewport: DESKTOP,
    outName: "triage-desktop",
    run: async (page) => {
      await smoothScrollToSelectorTop(page, "#exhibit-01", 24, 700);
      await hold(page, 700); // hold on the frontier instrument
      await dragSlider(page, "#exhibit-01 #triage-misroute-full", 0.08, 0.92); // strategy card re-renders live
      await hold(page, 800);
      await clickWithoutScrolling(page, '#exhibit-01 [data-readout-row] summary[data-drawer-summary]'); // open a sample drawer
      await hold(page, 900);
      await smoothScrollToSelectorTop(page, "#exhibit-04", 24, 1300); // to the drift exhibit
      await hold(page, 800); // glimpse the drift exhibit
    },
  });
  await captureRecording(browser, {
    url: `${BASE_URL}/ai/triage-router`,
    viewport: MOBILE,
    outName: "triage-mobile",
    run: async (page) => {
      await hold(page, 500); // first screen: hero (compact instrument column is hidden on mobile)
      await smoothScrollToSelectorTop(page, "#exhibit-01", 60, 600); // short scroll to the only slider available on mobile
      await hold(page, 500);
      await dragSlider(page, "#exhibit-01 #triage-misroute-full", 0.08, 0.92);
      await hold(page, 900); // strategy card re-renders live
    },
  });
}

// Privacy: the real SCAN -> [select entities] -> "Confirm review and show
// result" (PREVIEW REDACTION) sequence on the prefilled example text
// (spec's own literal sequence, per PrivacyTextLab.tsx's comment), then a
// glimpse of the fail-closed exhibit (04, "UNSAFE TO EXPORT").
async function recordPrivacy(browser) {
  for (const [label, viewport] of [["desktop", DESKTOP], ["mobile", MOBILE]]) {
    await captureRecording(browser, {
      url: `${BASE_URL}/ai/privacy-preflight`,
      viewport,
      outName: `privacy-${label}`,
      run: async (page) => {
        await hold(page, 700); // first screen (hero + compact read-only preview)
        await smoothScrollToSelectorTop(page, "#exhibit-01", 24, 900);
        await hold(page, 400);
        await clickWithoutScrolling(page, "#exhibit-01 button.privacy-scan-primary"); // SCAN the prefilled text
        await hold(page, 800); // entities appear
        await clickWithoutScrolling(page, "#exhibit-01 button.privacy-confirm-review"); // PREVIEW REDACTION
        await hold(page, 800); // redacted output revealed
        await smoothScrollToSelectorTop(page, "#exhibit-04", 24, 1000);
        await hold(page, 800); // glimpse the fail-closed exhibit
      },
    });
  }
}

// EOD: click a real drill cell (a genuine affordance even on the
// already-selected default drill), then PLAY the new choreographed replay
// through inject + recovery. Desktop rides the full choreography
// (inject/detect, the compressed quiet stretch, the recovery crossing,
// verify cascade, REPLAY fade) at the exact timing f3-motion-recordings.mjs
// validated for the default drill (broker-restart) -- reused here rather
// than re-tuned against a different drill's real timeline. Mobile stops
// after the replay starts (board + replay start only).
async function recordEod(browser) {
  await captureRecording(browser, {
    url: `${BASE_URL}/engineering/exactly-once-drills`,
    viewport: DESKTOP,
    outName: "eod-desktop",
    setup: async (page) => page.emulateMedia({ reducedMotion: "no-preference" }),
    run: async (page) => {
      await scrollToSelectorTop(page, '[data-exhibit="01"] [data-eod-instrument]', 24);
      await hold(page, 500);
      await clickWithoutScrolling(page, '[data-exhibit="01"] [data-drill-cell][data-drill-id="broker-restart"]'); // click a drill
      await hold(page, 400);
      await clickWithoutScrolling(page, '[data-exhibit="01"] [data-scrubber-play]');
      await hold(page, 3000); // inject + detect, fault window opens
      const startY = await page.evaluate(() => window.scrollY);
      await smoothScrollTo(page, startY + 320, 900);
      await hold(page, 6100); // recovery crossing, verify cascade, REPLAY fade
    },
  });
  await captureRecording(browser, {
    url: `${BASE_URL}/engineering/exactly-once-drills`,
    viewport: MOBILE,
    outName: "eod-mobile",
    setup: async (page) => page.emulateMedia({ reducedMotion: "no-preference" }),
    run: async (page) => {
      await scrollToSelectorTop(page, '[data-exhibit="01"] [data-eod-instrument]', 60);
      await hold(page, 500);
      await clickWithoutScrolling(page, '[data-exhibit="01"] [data-drill-cell][data-drill-id="broker-restart"]');
      await hold(page, 400);
      await clickWithoutScrolling(page, '[data-exhibit="01"] [data-scrubber-play]');
      await hold(page, 4200); // board + replay start (inject moment) only
    },
  });
}

// The dev fixture's zh BODY serif-vs-sans specimen pair (task F4's pending
// design choice) -- the last two of the four specimen divs under the "Zh
// serif pairing specimen (task F4)" section (divs 1-2 are the DISPLAY
// pair, already resolved; divs 3-4 are the still-open BODY toggle).
async function shootZhBodySpecimens(browser) {
  const sectionSel = 'section[aria-label="Zh serif pairing specimen (task F4)"]';
  await shootClip(browser, {
    url: `${BASE_URL}/dev/exhibition-fixture`,
    viewport: DESKTOP,
    outName: "zh-serif-body-specimens",
    prepare: async (page) => {
      await scrollToSelectorTop(page, `${sectionSel} > div:nth-child(3)`, 40);
      await page.waitForTimeout(200);
    },
    clipSelector: [`${sectionSel} > div:nth-child(3)`, `${sectionSel} > div:nth-child(4)`],
  });
}

async function main() {
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });
  const { proc } = await ensureServer();
  const browser = await chromium.launch();
  try {
    await recordHome(browser);
    await recordZhHomeMobile(browser);
    await recordForgeMobile(browser);
    await recordTriage(browser);
    await recordPrivacy(browser);
    await recordEod(browser);
    await shootZhBodySpecimens(browser);
  } finally {
    await browser.close();
    await rm(TMP_VIDEO_DIR, { recursive: true, force: true });
    if (proc) {
      console.log("[gate-r3f] stopping server spawned by this script...");
      proc.kill();
    }
  }

  // Sanity: every expected output exists and clears the minimum size floor.
  const expected = [
    ["home-desktop.webm", 30_000],
    ["home-mobile.webm", 30_000],
    ["zh-home-mobile.webm", 30_000],
    ["forge-mobile.webm", 30_000],
    ["triage-desktop.webm", 30_000],
    ["triage-mobile.webm", 30_000],
    ["privacy-desktop.webm", 30_000],
    ["privacy-mobile.webm", 30_000],
    ["eod-desktop.webm", 30_000],
    ["eod-mobile.webm", 30_000],
    ["zh-serif-body-specimens.png", 10_000],
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
  if (problems.length > 0) throw new Error(`gate-r3f output sanity check failed:\n${problems.join("\n")}`);

  console.log(`[gate-r3f] done. Output in ${path.relative(ROOT, OUT_DIR)}/`);
}

main().catch((err) => {
  console.error("[gate-r3f] failed:", err);
  process.exitCode = 1;
});
