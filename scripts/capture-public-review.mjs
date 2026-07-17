import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

const baseUrl = process.env.PORTFOLIO_CAPTURE_BASE_URL ?? "http://127.0.0.1:4173";
const outputDirectory = path.resolve(
  "docs/phase2-public-review-artifacts/portfolio-upgrade-20260717/screenshots",
);

const desktopProjects = [
  ["/ai/release-guardian", "20260717-project-release-guardian-desktop-full.png"],
  ["/ai/rag-quality-lab", "20260717-project-rag-quality-lab-desktop-full.png"],
  ["/ai/privacy-preflight-mac", "20260717-project-privacy-preflight-desktop-full.png"],
  ["/engineering/p1-reliability-lab", "20260717-project-p1-reliability-lab-desktop-full.png"],
];

async function prepareCapture(page) {
  await page.addStyleTag({
    content: "*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }",
  });
  await page.evaluate(async () => {
    await document.fonts.ready;
    window.scrollTo(0, 0);
  });
}

async function capture(page, route, filename, fullPage = true) {
  await page.goto(new URL(route, baseUrl).toString(), { waitUntil: "networkidle" });
  await prepareCapture(page);
  await page.screenshot({ path: path.join(outputDirectory, filename), fullPage });
}

await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });

try {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await capture(desktop, "/", "20260717-home-desktop-above-fold.png", false);
  await capture(desktop, "/", "20260717-home-desktop-full.png");

  for (const [route, filename] of desktopProjects) {
    await capture(desktop, route, filename);
  }

  await desktop.goto(new URL("/analytics/margin-control-tower", baseUrl).toString(), {
    waitUntil: "networkidle",
  });
  await desktop.getByRole("button", { name: "Olist (real)" }).click();
  await desktop.getByText("Olist margin artifact", { exact: false }).first().waitFor({ timeout: 60_000 });
  await prepareCapture(desktop);
  await desktop.screenshot({
    path: path.join(outputDirectory, "20260717-project-margin-control-tower-real-desktop-full.png"),
    fullPage: true,
  });

  await desktop.goto(new URL("/analytics/credit-policy-lab", baseUrl).toString(), {
    waitUntil: "networkidle",
  });
  await desktop.getByRole("button", { name: "Real backtest" }).click();
  await desktop.getByText("Scored backtest artifact", { exact: true }).waitFor({ timeout: 60_000 });
  await prepareCapture(desktop);
  await desktop.screenshot({
    path: path.join(outputDirectory, "20260717-project-credit-policy-lab-real-desktop-full.png"),
    fullPage: true,
  });

  await desktop.close();

  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  await capture(mobile, "/", "20260717-home-mobile-full.png");
  await mobile.close();
} finally {
  await browser.close();
}
