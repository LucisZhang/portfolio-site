import { expect, test, type Page } from "@playwright/test";

const rawRuntimeEnglish = [
  "Failed to fetch",
  "NetworkError",
  "Claim registry returned",
  "Synthetic scenarios returned",
  "Result evidence returned",
  "Manifest returned",
  "Credit dataset returned",
  "Margin dataset returned",
];

async function expectNoRawRuntimeEnglish(page: Page) {
  const body = await page.locator("body").innerText();
  for (const marker of rawRuntimeEnglish) expect(body).not.toContain(marker);
}

test.describe("Chinese runtime failures use bounded display copy", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "A single Chrome viewport covers copy selection.");
    await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "zh"));
  });

  test("Margin report failure stays localized and keeps the governed fallback", async ({ page }) => {
    await page.route("**/case-studies/margin-control-tower/detection-report.json", (route) => route.fulfill({ status: 503 }));
    await page.goto("/analytics/margin-control-tower?lang=zh", { waitUntil: "domcontentloaded" });

    const lab = page.getByTestId("margin-control-tower");
    await expect(lab).toHaveAttribute("data-active-source", "synthetic", { timeout: 60_000 });
    await expect(lab.getByRole("status")).toContainText("检测报告待提交");
    await expectNoRawRuntimeEnglish(page);
  });

  test("Credit network failure never renders the browser Error message", async ({ page }) => {
    await page.route("**/case-studies/credit-policy-lab/scored-backtest.parquet", (route) => route.abort("connectionfailed"));
    await page.route("**/case-studies/credit-policy-lab/synthetic-credit-data.json", (route) => route.abort("connectionfailed"));
    await page.goto("/analytics/credit-policy-lab?lang=zh", { waitUntil: "domcontentloaded" });

    await expect(page.locator(".analytics-lab-loading.error")).toHaveText(/数据集不可用。/, { timeout: 60_000 });
    await expectNoRawRuntimeEnglish(page);
  });

  test("RAG registry fetch failure uses the Chinese registry message", async ({ page }) => {
    await page.route("**/case-studies/rag-quality-lab/claim-registry.json", (route) => route.abort("connectionfailed"));
    await page.goto("/ai/rag-quality-lab?lang=zh", { waitUntil: "domcontentloaded" });

    await expect(page.locator(".rag-lab-loading.error")).toHaveText(/声明注册表加载失败。/);
    await expectNoRawRuntimeEnglish(page);
  });

  test("Release replay HTTP failure uses the fixed Chinese message", async ({ page }) => {
    await page.route("**/case-studies/release-guardian/replay/synthetic-scenarios.json", (route) => route.fulfill({ status: 503 }));
    await page.goto("/ai/release-guardian?lang=zh", { waitUntil: "domcontentloaded" });

    await expect(page.locator(".release-replay-loading.error")).toHaveText(/无法加载合成回放。/);
    await expectNoRawRuntimeEnglish(page);
  });

  test("P1 evidence HTTP failure uses the fixed Chinese message", async ({ page }) => {
    await page.route("**/case-studies/p1-reliability-lab/results/u6-local-mac/eo_reconciliation-all.json", (route) => route.fulfill({ status: 503 }));
    await page.goto("/engineering/p1-reliability-lab?lang=zh", { waitUntil: "domcontentloaded" });

    const error = page.locator(".p1-replay-error");
    await expect(error).toContainText("录制证据不可用");
    await expect(error).toContainText("证据加载失败。");
    await expectNoRawRuntimeEnglish(page);
  });
});
