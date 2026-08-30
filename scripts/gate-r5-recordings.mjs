#!/usr/bin/env node
// R5 gate acceptance recordings -- the FINAL phase-exit human gate,
// covering the full eleven-page site (the six brand-new legacy-wave pages:
// release-guardian, rag-quality-lab, ask-portfolio, crossover-study,
// margin-control-tower, credit-policy-desk; plus forge/eod/triage
// re-recorded for the auto-rail v3 change; home/privacy carried forward
// unchanged from output/gate-r4/). Follows the same pattern as
// gate-r3f/gate-r4: short, silent, functional clips exercising real
// on-page affordances, nothing staged. Every selector below was read
// directly from the current component source at HEAD cb11fdc.
//
// Server provisioning: reuses an already-listening server on PORT
// (default 4185) if one responds; otherwise spawns `next start` against
// the existing `.next` production build and tears it down when done.
//
// Output: output/gate-r5/*.webm (INDEX.md is written by the caller after
// this script runs).
//
// Usage: node scripts/gate-r5-recordings.mjs

import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "output", "gate-r5");
const TMP_VIDEO_DIR = path.join(OUT_DIR, ".video-tmp");
const PORT = process.env.PORT ? Number(process.env.PORT) : 4185;
const BASE_URL = `http://127.0.0.1:${PORT}`;

const DESKTOP = { width: 1440, height: 900 };

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
    console.log(`[gate-r5] reusing already-listening server at ${BASE_URL}`);
    return { proc: null };
  }
  console.log(`[gate-r5] no server on port ${PORT}; spawning \`npm run start\` against the existing build...`);
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
  console.log(`[gate-r5] server ready at ${BASE_URL}`);
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

async function clickWithoutScrolling(page, selector) {
  await page.$eval(selector, (el) => el.click());
}

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
  console.log(`[gate-r5] wrote ${path.relative(ROOT, dest)}`);
}

// --- Recording plans: six NEW legacy pages ---

// Release Guardian: the human "gate choice" -- clicking APPROVE reveals
// the approve branch trace (audit chain footnote), clicking BLOCK would
// reveal the other. `data-guardian-decide` on the two buttons, real state
// toggle (aria-pressed + data-branch/data-chosen/data-ghost), not a modal.
async function recordGuardian(browser) {
  await captureRecording(browser, {
    url: `${BASE_URL}/ai/release-guardian`,
    viewport: DESKTOP,
    outName: "rg-desktop",
    run: async (page) => {
      await smoothScrollToSelectorTop(page, "#gate", 24, 900);
      await hold(page, 700);
      await clickWithoutScrolling(page, 'button[data-guardian-decide="approve"]'); // the gate choice
      await hold(page, 1400); // branch trace reveals, ghost the other branch
      await clickWithoutScrolling(page, 'button[data-guardian-decide="block"]'); // switch the choice live
      await hold(page, 1400);
    },
  });
}

// RAG Quality Lab: the "diff edit" -- typing into the live working-copy
// textarea recomputes the check rows / verdict word in real time (no
// submit button; onChange drives it). Types a short, real edit rather than
// faking a value-set.
async function recordRag(browser) {
  await captureRecording(browser, {
    url: `${BASE_URL}/ai/rag-quality-lab`,
    viewport: DESKTOP,
    outName: "rag-desktop",
    run: async (page) => {
      await smoothScrollToSelectorTop(page, '[data-testid="rag-diff-instrument"]', 24, 900);
      await hold(page, 600);
      const editor = page.locator('textarea[data-testid="rag-working-copy-editor"]');
      await editor.click();
      await editor.press("End");
      await page.keyboard.type(" This sentence was added live during the recording.", { delay: 28 }); // real keystrokes -> live diff/verdict recompute
      await hold(page, 1300);
    },
  });
}

// Ask Portfolio: "preset submit" -- clicking one of the opener questions
// sends it through the real assistant conversation hook (a genuine
// request, not a canned transcript).
async function recordAsk(browser, locale = "en") {
  const outName = locale === "en" ? "ask-desktop" : "ask-desktop-zh";
  await captureRecording(browser, {
    url: locale === "en" ? `${BASE_URL}/ai/ask-portfolio` : `${BASE_URL}/ai/ask-portfolio?lang=zh`,
    viewport: DESKTOP,
    outName,
    run: async (page) => {
      await hold(page, 700); // first screen: conversation + opener presets
      await clickWithoutScrolling(page, "button.ask-opener"); // preset submit -> real assistant request
      await hold(page, 6500); // busy state, then the real response starting to arrive
    },
  });
}

// Crossover Study: "query-index swap" -- clicking a different entry in the
// curated query index swaps already-loaded React state (SQL text +
// results table), zero network request per the component's own comment.
async function recordCrossover(browser, locale = "en") {
  const outName = locale === "en" ? "crossover-desktop" : "crossover-desktop-zh";
  await captureRecording(browser, {
    url: locale === "en" ? `${BASE_URL}/engineering/crossover-study` : `${BASE_URL}/engineering/crossover-study?lang=zh`,
    viewport: DESKTOP,
    outName,
    run: async (page) => {
      await smoothScrollToSelectorTop(page, '[data-testid="crossover-workbench-main"]', 24, 900);
      await hold(page, 700);
      await clickWithoutScrolling(page, ".crossover-query-index li:nth-of-type(2) button"); // swap to the second curated query
      await hold(page, 1400); // SQL + results table update live
    },
  });
}

// Margin Control Tower / Credit Policy Desk: first screens only (chart-led
// "Evidence" pages, spec's deliberately non-workbench archive form --
// exhibit 01 folds the hero assertion/stat-line/figure into one screen,
// no scroll needed to see it).
async function recordFirstScreenOnly(browser, { url, outName }) {
  await captureRecording(browser, {
    url,
    viewport: DESKTOP,
    outName,
    run: async (page) => {
      await hold(page, 2200);
    },
  });
}

// --- Recording plans: three rail-v3-changed pages (desktop only, per the
// coordinator's scope) ---

async function recordForge(browser) {
  await captureRecording(browser, {
    url: `${BASE_URL}/ai/frontier-forge`,
    viewport: DESKTOP,
    outName: "forge-desktop",
    run: async (page) => {
      await hold(page, 900); // first screen: judge the auto-rail v3 entry-open state
      await smoothScrollToSelectorTop(page, '[data-testid="forge-evidence-explorer"]', 24, 1200); // rail should push/retract on scroll intent
      const trainingFilter = page.locator('[data-filter="training"]');
      await trainingFilter.click();
      await hold(page, 700);
      await scrollToBottomSmooth(page, 3800, 12);
    },
  });
}

async function recordEod(browser) {
  await captureRecording(browser, {
    url: `${BASE_URL}/engineering/exactly-once-drills`,
    viewport: DESKTOP,
    outName: "eod-desktop",
    setup: async (page) => page.emulateMedia({ reducedMotion: "no-preference" }),
    run: async (page) => {
      await hold(page, 500); // first viewport: pinned entry + auto-rail v3 state
      await smoothScrollToSelectorTop(page, '[data-eod-log] > details[data-log-entry]:nth-of-type(2)', 24, 500);
      await hold(page, 150);
      await clickWithoutScrolling(page, '[data-eod-log] > details[data-log-entry]:nth-of-type(2) summary[data-log-summary]');
      await hold(page, 8700); // full typed replay
    },
  });
}

async function recordTriage(browser) {
  await captureRecording(browser, {
    url: `${BASE_URL}/ai/triage-router`,
    viewport: DESKTOP,
    outName: "triage-desktop",
    run: async (page) => {
      await hold(page, 700); // first screen: judge the auto-rail v3 state
      await smoothScrollToSelectorTop(page, "#exhibit-01", 24, 700);
      await hold(page, 500);
      await dragSlider(page, "#exhibit-01 #triage-misroute-full", 0.08, 0.92);
      await hold(page, 700);
    },
  });
}

async function main() {
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });
  const { proc } = await ensureServer();
  const browser = await chromium.launch();
  try {
    await recordGuardian(browser);
    await recordRag(browser);
    await recordAsk(browser, "en");
    await recordAsk(browser, "zh");
    await recordCrossover(browser, "en");
    await recordCrossover(browser, "zh");
    await recordFirstScreenOnly(browser, { url: `${BASE_URL}/analytics/margin-control-tower`, outName: "margin-desktop" });
    await recordFirstScreenOnly(browser, { url: `${BASE_URL}/analytics/credit-policy-desk`, outName: "credit-desktop" });
    await recordForge(browser);
    await recordEod(browser);
    await recordTriage(browser);
  } finally {
    await browser.close();
    await rm(TMP_VIDEO_DIR, { recursive: true, force: true });
    if (proc) {
      console.log("[gate-r5] stopping server spawned by this script...");
      proc.kill();
    }
  }

  const expected = [
    ["rg-desktop.webm", 30_000],
    ["rag-desktop.webm", 30_000],
    ["ask-desktop.webm", 30_000],
    ["ask-desktop-zh.webm", 30_000],
    ["crossover-desktop.webm", 30_000],
    ["crossover-desktop-zh.webm", 30_000],
    ["margin-desktop.webm", 30_000],
    ["credit-desktop.webm", 30_000],
    ["forge-desktop.webm", 30_000],
    ["eod-desktop.webm", 30_000],
    ["triage-desktop.webm", 30_000],
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
  if (problems.length > 0) throw new Error(`gate-r5 output sanity check failed:\n${problems.join("\n")}`);

  console.log(`[gate-r5] done. Output in ${path.relative(ROOT, OUT_DIR)}/`);
}

main().catch((err) => {
  console.error("[gate-r5] failed:", err);
  process.exitCode = 1;
});
