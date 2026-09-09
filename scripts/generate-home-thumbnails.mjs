import { chromium } from "@playwright/test";
import { mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

const baseUrl = new URL(process.env.PORTFOLIO_URL || "http://127.0.0.1:4173");
const outputDir = path.resolve("public/thumbs");
const browserChannel = process.env.PLAYWRIGHT_CHANNEL || "chrome";
const maxBytes = 60 * 1024;
const captures = [
  { slug: "release-guardian", route: "/projects/release-guardian", selector: '[data-testid="release-change-replay"]' },
  { slug: "triage-router", route: "/projects/triage-router", selector: 'figure[aria-labelledby="triage-drift-title"]' },
  { slug: "privacy-preflight", route: "/projects/privacy-preflight", selector: '[data-testid="privacy-preflight-lab"]' },
  { slug: "exactly-once-drills", route: "/projects/exactly-once-drills", selector: '[data-testid="p1-failure-replay"]' },
];

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ channel: browserChannel, headless: true });
const results = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  for (const capture of captures) {
    const url = new URL(capture.route, baseUrl);
    const response = await page.goto(url.href, { waitUntil: "networkidle", timeout: 60_000 });
    if (!response?.ok()) throw new Error(`${capture.slug} returned HTTP ${response?.status() ?? 0}`);
    await page.addStyleTag({ content: ".site-header, body > footer { visibility: hidden !important; }" });
    const target = page.locator(capture.selector);
    await target.waitFor({ state: "visible", timeout: 30_000 });
    const temporary = path.join(outputDir, `.${capture.slug}.png`);
    const output = path.join(outputDir, `${capture.slug}.webp`);
    await target.screenshot({ path: temporary, animations: "disabled" });

    let quality = 76;
    let bytes = Number.POSITIVE_INFINITY;
    while (quality >= 36) {
      await sharp(temporary)
        .resize(1280, 800, { fit: "cover", position: "northwest" })
        .webp({ quality, effort: 6 })
        .toFile(output);
      bytes = (await stat(output)).size;
      if (bytes <= maxBytes) break;
      quality -= 5;
    }
    await rm(temporary);
    if (bytes > maxBytes) throw new Error(`${capture.slug} is ${bytes} bytes after compression`);
    results.push({ slug: capture.slug, width: 1280, height: 800, bytes, quality, selector: capture.selector });
  }
} finally {
  await browser.close();
}

for (const result of results) console.log(`${result.slug}\t${result.width}x${result.height}\t${result.bytes} bytes\tq${result.quality}\t${result.selector}`);
