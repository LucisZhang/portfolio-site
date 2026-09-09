import { expect, test, type Locator } from "@playwright/test";
import links from "../../src/data/generated/evidence-links.json";
import { containsCJK, longestLatinWordRun } from "./localePurity";

const routes = [
  ["/", "home"],
  ["/projects/frontier-forge", "forge"],
  ["/projects/release-guardian", "guardian"],
  ["/projects/triage-router", "triage"],
  ["/projects/exactly-once-drills", "eod"],
  ["/projects/crossover-study", "crossover"],
  ["/projects/rag-quality-lab", "rag"],
  ["/projects/privacy-preflight", "privacy"],
  ["/projects/margin-control-tower", "margin"],
  ["/projects/credit-policy-desk", "credit"],
  ["/projects/ask-portfolio", "ask"],
] as const;
const publicLinks = Object.fromEntries(Object.entries(links).filter(([, link]) => link.status === "public")) as Record<string, { href: string }>;
const localAskFiles = ["src/lib/assistant-retrieval.ts", "src/data/assistant-knowledge.generated.json", "scripts/generate-ask-question-bank.mjs"] as const;

async function expectAskReceiptStates(evidence: Locator, locale: "en" | "zh") {
  await expect(evidence.locator("[data-evidence-status=local]")).toHaveCount(3);
  for (const id of localAskFiles) {
    const receipt = evidence.locator(`[data-evidence-file="${id}"]`);
    await expect(receipt).toBeVisible();
    await expect(receipt).toHaveJSProperty("tagName", "SPAN");
    await expect(receipt).not.toHaveAttribute("href");
    await expect(receipt).not.toHaveAttribute("tabindex");
    await expect(receipt.getByRole("link")).toHaveCount(0);
    await expect(receipt).toContainText(locale === "en" ? "Commit-local file · unpublished" : "当前提交文件 · 尚未公开");
    await expect(receipt).toContainText(`SHA-256: ${links[id].sha256}`);
    await expect(receipt).not.toContainText("acf05ae");
  }
  await expect(evidence.locator("a[data-evidence-file]")).toHaveCount(1);
  await expect(evidence.locator('a[data-evidence-file="scripts/generate-ask-recorded-example.mjs"]')).toHaveAttribute("href", publicLinks["scripts/generate-ask-recorded-example.mjs"].href);
}

for (const [route, project] of routes) {
  test(`${project}: bilingual evidence summary precedes keyboard-operable exact-file receipts`, async ({ page }) => {
    for (const locale of ["en", "zh"] as const) {
      await page.goto(`${route}?lang=${locale}`, { waitUntil: "networkidle" });
      const evidence = page.locator(`[data-evidence=${project}]`);
      const overview = evidence.locator(".evidence-overview");
      await expect(overview).toBeVisible();
      await expect(overview.locator("dd")).toHaveCount(3);
      const summaryText = await overview.innerText();
      expect(containsCJK(summaryText)).toBe(locale === "zh");
      if (locale === "zh") expect(longestLatinWordRun(summaryText)).toBeLessThan(7);
      expect(summaryText).not.toMatch(/sha256:|\/Users\/|public\/case-studies\//u);
      const details = evidence.locator(":scope > details");
      await expect(details).not.toHaveAttribute("open", "");
      const firstLink = details.locator("a[data-evidence-file]").first();
      await expect(firstLink).toBeHidden();
      const summary = details.locator(":scope > summary");
      await expect(summary).toHaveText(locale === "en" ? "Files, hashes and methods" : "文件、哈希与验证方法");
      await summary.focus();
      await summary.press("Enter");
      await expect(details).toHaveAttribute("open", "");
      // The first Crossover config sits in a second native, per-run disclosure.
      if (project === "crossover") await details.locator(".crossover-receipt > summary").first().click();
      await expect(firstLink).toBeVisible();
      for (const link of await details.locator("a[data-evidence-file]").all()) {
        const id = await link.getAttribute("data-evidence-file");
        await expect(link).toHaveAttribute("href", publicLinks[id!].href);
      }
      if (project === "ask") await expectAskReceiptStates(evidence, locale);
      expect(await details.textContent()).not.toMatch(/\/Users\/|\/home\/|\/private\/tmp\//u);
      // Methods intentionally bleed to the exhibit edge; check actual page overflow.
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      expect(overflow).toBe(false);
      await summary.focus();
      await summary.press("Space");
      await expect(details).not.toHaveAttribute("open", "");
    }
  });
}

test("all evidence remains discoverable without JavaScript, including licenses and negative results", async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "One complete no-JS route pass.");
  test.setTimeout(90_000);
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    for (const [route, project] of routes) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      const evidence = page.locator(`[data-evidence=${project}]`);
      await expect(evidence.locator("[data-evidence-summary=boundary]")).toBeVisible();
      await evidence.locator(":scope > details > summary").click();
      await expect(evidence.locator(".evidence-technical")).toBeVisible();
      if (project === "guardian") {
        await expect(evidence.locator(".evidence-overview")).toContainText("30/44");
        await expect(evidence.locator(".evidence-overview")).toContainText("15/44");
      }
      if (project === "rag") await expect(evidence).toContainText("C3 closed without retrieval or answer-quality metrics");
      if (project === "margin" || project === "credit") {
        const methods = evidence.getByTestId(`analytics-methods-${project}`);
        await expect(methods).toBeVisible();
        await expect(methods).toContainText(project === "margin" ? "CC BY-NC-SA 4.0" : "CC BY 4.0");
      }
      if (project === "triage") await expect(evidence).toContainText("no committed GitHub file");
      if (project === "ask") await expectAskReceiptStates(evidence, "en");
    }
  } finally { await context.close(); }
});
