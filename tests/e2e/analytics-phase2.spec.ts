import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const screenshotRoot = resolve("docs/phase2-public-review-artifacts/local-analytics");

test.describe.configure({ timeout: 90_000 });

test.beforeAll(async () => {
  await mkdir(screenshotRoot, { recursive: true });
});

test("Margin Control Tower uses the expanded dataset for linked diagnosis and scenario recomputation", async ({ page }, testInfo) => {
  const browserErrors: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  await page.goto("/analytics/margin-control-tower", { waitUntil: "networkidle" });
  const lab = page.getByTestId("margin-control-tower");
  await expect(lab).toHaveAttribute("data-active-source", "real", { timeout: 60_000 });
  await lab.getByRole("button", { name: "Synthetic fixture" }).click();
  await expect(lab).toHaveAttribute("data-active-source", "synthetic");
  await expect(page.locator(".analytics-dataset-context dd").filter({ hasText: "9,360 rows" }).first()).toBeVisible();
  await expect(page.locator(".analytics-dataset-context dd").filter({ hasText: "52 weeks" }).first()).toBeVisible();
  await expect(page.getByText("fixed-seed injected anomaly")).toBeVisible();

  await page.getByRole("tab", { name: "Schema and dictionary" }).click();
  await expect(page.locator(".analytics-field-grid")).toContainText("product_id");
  await page.getByRole("tab", { name: "Quality checks" }).click();
  await expect(page.locator(".analytics-quality-list .pass")).toHaveCount(10);

  await page.locator(".margin-heatmap-grid button", { hasText: "Beauty" }).filter({ hasText: "North" }).click();
  await expect(page.locator(".analytics-controlbar select").nth(1)).toHaveValue("Beauty");
  await expect(page.locator(".analytics-controlbar select").nth(2)).toHaveValue("North");

  await page.getByRole("button", { name: "Guided scenario" }).click();
  const actionBefore = await page.locator(".margin-action code").textContent();
  await page.getByRole("slider", { name: "Promotion depth" }).fill("8");
  await expect(page.locator(".margin-action code")).not.toHaveText(actionBefore ?? "");
  await expect(page.locator(".margin-before-after")).toContainText("Delta");
  await expect(page.getByRole("img", { name: "Contribution margin waterfall" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Download full CSV" })).toHaveAttribute("href", /synthetic-margin-data\.csv$/);
  await expect(page.getByRole("link", { name: "Download synthetic Parquet" })).toHaveAttribute("href", /synthetic-margin-data\.parquet$/);
  expect(browserErrors).toEqual([]);

  if (testInfo.project.name !== "tablet") {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: resolve(screenshotRoot, `margin-${testInfo.project.name}.png`), fullPage: true });
  }
});

test("Credit Policy Lab recomputes model, thresholds, capacity, queue, and audit record", async ({ page }, testInfo) => {
  const browserErrors: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  await page.goto("/analytics/credit-policy-lab", { waitUntil: "networkidle" });
  const lab = page.getByTestId("credit-policy-lab");
  await expect(lab).toHaveAttribute("data-active-source", "real", { timeout: 60_000 });
  await lab.getByRole("button", { name: "Synthetic fixture" }).click();
  await expect(lab).toHaveAttribute("data-active-source", "synthetic");
  await expect(page.locator(".analytics-dataset-context dd").filter({ hasText: "12,000 applications" }).first()).toBeVisible();
  await expect(page.locator(".credit-decision-boundary")).toContainText("The final business decision combines probability, economics, policy thresholds, and human review");

  await page.getByRole("tab", { name: "Quality checks" }).click();
  await expect(page.locator(".analytics-quality-list .pass")).toHaveCount(10);
  const baselineScore = await page.locator(".credit-score-chain > div").nth(1).locator("strong").textContent();
  await page.getByRole("tab", { name: "Challenger synthetic PD" }).click();
  await expect(page.locator(".credit-score-chain > div").nth(1).locator("strong")).not.toHaveText(baselineScore ?? "");
  await page.getByRole("tab", { name: "Baseline calibrated PD" }).click();

  await expect(page.getByRole("button", { name: "Resolve queue overflow" })).toBeDisabled();
  await page.getByRole("slider", { name: "Review capacity" }).fill("360");
  await expect(page.getByRole("button", { name: "Record policy decision" })).toBeEnabled();
  await page.getByRole("button", { name: "Record policy decision" }).click();
  await expect(page.locator(".credit-audit-record")).toContainText("SYN-POLICY-2030-06-baseline-12-28-360");
  await expect(page.locator(".credit-calibration")).toContainText("backtest");
  await expect(page.locator(".credit-queue-grid section").first()).toContainText("Manual review queue");
  await expect(page.getByRole("link", { name: "Download full CSV" })).toHaveAttribute("href", /synthetic-credit-data\.csv$/);
  await expect(page.getByRole("link", { name: "Download Parquet" })).toHaveAttribute("href", /synthetic-credit-data\.parquet$/);
  await expect(page.locator(".swap-set-panel article")).toHaveCount(5);
  await expect(page.locator(".swap-set-panel")).toContainText("Challenger-only approvals");

  if (testInfo.project.name === "mobile") {
    const originalViewport = page.viewportSize();
    await page.setViewportSize({ width: 375, height: 844 });
    await page.getByRole("button", { name: "中", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
    await page.getByRole("button", { name: "EN", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    if (originalViewport) await page.setViewportSize(originalViewport);
  }

  expect(browserErrors).toEqual([]);

  if (testInfo.project.name !== "tablet") {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: resolve(screenshotRoot, `credit-${testInfo.project.name}.png`), fullPage: true });
  }
});
