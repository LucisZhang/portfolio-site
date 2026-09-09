#!/usr/bin/env node
// Task F10: after-shots of the four fixed areas (StatGrid, header chrome,
// home decorative micro-glyphs, Forge visual bugs) at desktop (1440x900)
// and mobile (390x844) against an already-running server (default :4173).
//
// Usage: node scripts/f10-residuals-shots.mjs [port]

import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "output", "f10-residuals");
const PORT = process.argv[2] ? Number(process.argv[2]) : 4173;
const BASE_URL = `http://127.0.0.1:${PORT}`;

const VIEWPORTS = [
  ["desktop", { width: 1440, height: 900 }],
  ["mobile", { width: 390, height: 844 }],
];

// name -> route. home covers item 1 (hero StatGrid) + item 3 (exhibit 02
// micro-glyph removal); forge covers item 2 (header chrome, shared
// globals.css rail) + item 4 (Serving Boundary StatGrid orphan-cell bug +
// Evidence Explorer filter-bar tint); triage is an extra StatGrid consumer
// check (a different item count than home/forge, per the "verify every
// consumer page still lays out" instruction).
const ROUTES = [
  ["home", "/"],
  ["forge", "/projects/frontier-forge"],
  ["triage", "/projects/triage-router"],
];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();

  try {
    for (const [vpName, viewport] of VIEWPORTS) {
      for (const [name, route] of ROUTES) {
        const page = await browser.newPage({ viewport });
        await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle" });
        await page.screenshot({ path: path.join(OUT_DIR, `${name}-${vpName}.png`), fullPage: true });
        await page.close();
      }
    }
    console.log(`Wrote screenshots to ${OUT_DIR}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
