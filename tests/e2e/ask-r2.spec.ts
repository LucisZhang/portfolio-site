import { expect, test } from "@playwright/test";
import { SEL } from "./selectors";
import { bodyTextExcludingLanguageSwitcher, containsCJK, longestLatinWordRun } from "./localePurity";
import { assertNoHorizontalOverflow } from "./mobileAudit";
import questionBank from "../../src/data/generated/ask-question-bank.json";
import recordedExample from "../../src/data/generated/ask-recorded-example.json";

// Task L5 [CLAUDE]: /ai/ask-portfolio, the user-approved dialogue-genre
// "Ask Portfolio" page (output/design-genres/genre-ask-dialogue.html is the
// design authority). This route was previously routeEnabled: false (404);
// this task enables it and builds the full-page conversation surface as a
// standalone route (src/app/ai/ask-portfolio/page.tsx), reusing the
// floating panel's own ask/submit/citation machinery (extracted to
// src/lib/use-assistant-conversation.ts, also now used by
// AssistantWidget.tsx) rather than forking a second copy of it.

const ROUTE = "/ai/ask-portfolio";

type QuestionBank = Record<string, { questions: Array<{ id: string; q_en: string; q_zh: string }> }>;
const bank = questionBank as QuestionBank;

// /ai/ask-portfolio has no route-specific entry in the generated bank (task
// F13a's route set is "/" plus the 11 pre-existing leaf project routes), so
// src/lib/ask-question-bank.ts's exact-path-with-home-fallback resolution
// always falls back to the home ("/") question set for this page -- see
// AskPage.tsx's `getRouteQuestions(askQuestionBankRoute, locale)` call.
function bankPrompts(locale: "en" | "zh" = "en"): string[] {
  return bank["/"].questions.map((question) => (locale === "en" ? question.q_en : question.q_zh));
}

test("renders the conversation instrument with the recorded example and the verified preset bank", async ({ page }) => {
  await page.goto(ROUTE, { waitUntil: "networkidle" });

  const exhibit01 = page.locator(SEL.exhibit("01"));
  await expect(exhibit01.locator(".exhibit-title")).toContainText("A conversation with the work itself.");
  await expect(exhibit01.locator(".exhibit-title")).toContainText("Every reply carries receipts.");

  // The pre-filled example is a real, frozen retrieval run (see
  // scripts/generate-ask-recorded-example.mjs), not a hand-typed string --
  // asserted against the same generated JSON file the page renders from.
  await expect(exhibit01).toContainText(recordedExample.question.q_en);
  await expect(exhibit01).toContainText(recordedExample.answer.en);
  await expect(exhibit01).toContainText("RECORDED");
  const recordedLink = exhibit01.getByRole("link", { name: recordedExample.citation.label.en });
  await expect(recordedLink).toHaveAttribute("href", recordedExample.citation.url);

  const openers = exhibit01.locator(".ask-opener");
  await expect(openers).toHaveCount(3);
  const prompts = bankPrompts("en");
  for (const [index, prompt] of prompts.entries()) {
    await expect(openers.nth(index)).toContainText(prompt);
  }

  await expect(exhibit01.locator(".ask-ratelimit")).toContainText("Rate limit is shown here once you ask");
});

test("submitting a preset produces a live answer with citation links and updates the rate-limit status from the real response", async ({ page }) => {
  const sourceUrl = "https://github.com/LucisZhang/portfolio-site/blob/e8821702bfe69ee5846a617aa178486f216b5346/src/lib/projects.ts#L1-L20";
  await page.route("**/api/assistant", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "x-ratelimit-remaining-minute": "7", "x-ratelimit-remaining-day": "42" },
      body: JSON.stringify({
        reply: "Frontier Forge demonstrates repeatable applied-AI delivery.",
        blocks: [{ type: "paragraph", segments: [
          { type: "project", projectId: "release-guardian", strong: true },
          { type: "text", text: " demonstrates repeatable applied-AI delivery." },
        ] }],
        sources: [{
          sourceId: "portfolio-site:home:src/lib/projects.ts:L1-L20",
          kind: "public-github",
          label: { en: "Xiangguo Zhang portfolio · src/lib/projects.ts · lines 1-20", zh: "章向国作品集 · src/lib/projects.ts · 第 1-20 行" },
          url: sourceUrl,
        }],
      }),
    });
  });

  await page.goto(ROUTE, { waitUntil: "networkidle" });
  const [firstPrompt] = bankPrompts("en");
  await page.getByRole("button", { name: firstPrompt, exact: false }).click();

  await expect(page.getByRole("link", { name: "Release Guardian" })).toHaveAttribute("href", "/ai/release-guardian");
  const citationLink = page.getByRole("link", { name: "Xiangguo Zhang portfolio · src/lib/projects.ts · lines 1-20" });
  await expect(citationLink).toHaveAttribute("href", sourceUrl);

  await expect(page.locator(".ask-ratelimit")).toContainText("7 requests left this minute");
  await expect(page.locator(".ask-ratelimit")).toContainText("42 left today");
});

test("a failing live answer states it honestly and offers real static route suggestions, never a fabricated answer", async ({ page }) => {
  await page.route("**/api/assistant", async (route) => {
    await route.fulfill({
      status: 502,
      contentType: "application/json",
      body: JSON.stringify({
        reply: "The assistant could not complete a grounded answer. Please try again or inspect the project pages directly.",
        retryable: true,
        failureReason: "http_transient",
      }),
    });
  });

  await page.goto(ROUTE, { waitUntil: "networkidle" });
  const [firstPrompt] = bankPrompts("en");
  await page.getByRole("button", { name: firstPrompt, exact: false }).click();

  // .ask-turn-folio matches both the always-present static recorded example
  // and the newly rendered live reply -- .last() targets the live one.
  await expect(page.locator(".ask-turn-folio").last()).toContainText("The assistant could not complete a grounded answer.");
  const fallback = page.locator(".ask-fallback");
  await expect(fallback).toBeVisible();
  await expect(fallback).toContainText("Honest fallback");
  await expect(fallback.getByRole("link", { name: "Frontier Forge" })).toHaveAttribute("href", "/ai/frontier-forge");
  await expect(fallback.getByRole("link", { name: "Crossover Study" })).toHaveAttribute("href", "/engineering/crossover-study");
  await expect(fallback.getByRole("link", { name: "Credit Policy Desk" })).toHaveAttribute("href", "/analytics/credit-policy-desk");
  await expect(page.getByRole("button", { name: "Retry", exact: true })).toBeVisible();
});

test("renders with no JavaScript: the recorded example, presets, and honest note are already static", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

  await expect(page.locator(SEL.exhibit("01"))).toContainText(recordedExample.question.q_en);
  await expect(page.locator(SEL.exhibit("01"))).toContainText(recordedExample.answer.en);
  await expect(page.locator(SEL.exhibit("01"))).toContainText("RECORDED");
  await expect(page.locator(".ask-opener")).toHaveCount(3);
  // The live-conversation input is present but inert without JS -- must not vanish.
  await expect(page.locator(".ask-turn-next button")).toBeVisible();

  await context.close();
});

test("Ask Portfolio rail entry-open opens on load and collapses on scroll (auto-rail v3)", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Auto-rail v3 is desktop/tablet only (>=980px).");
  await page.goto(ROUTE, { waitUntil: "networkidle" });
  await expect(page.locator(".exhibit-shell")).toHaveAttribute("data-rail-mode", "auto");
  await expect(page.locator(".exhibit-shell")).not.toHaveClass(/rail-collapsed/);

  await page.mouse.wheel(0, 40);
  await expect(page.locator(".exhibit-shell")).toHaveClass(/rail-collapsed/);
});

test("en Ask Portfolio renders no Chinese (CJK) text anywhere on the page", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "en"));
  await page.goto(ROUTE, { waitUntil: "networkidle" });
  await expect(page.locator(SEL.cnGloss)).toHaveCount(0);
  const bodyText = await bodyTextExcludingLanguageSwitcher(page);
  expect(containsCJK(bodyText)).toBe(false);
});

test("zh Ask Portfolio carries independently-written zh copy with no long English run", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "zh"));
  await page.goto(ROUTE, { waitUntil: "networkidle" });

  await expect(page.locator(SEL.exhibit("01"))).toContainText(recordedExample.question.q_zh);
  await expect(page.locator(SEL.exhibit("01"))).toContainText(recordedExample.answer.zh);

  const gloss = page.locator(SEL.cnGloss).first();
  await expect(gloss).toHaveCount(1);
  expect(longestLatinWordRun(await gloss.innerText())).toBeLessThanOrEqual(8);

  for (const num of ["01", "02", "03"]) {
    const exhibitText = await page.locator(SEL.exhibit(num)).innerText();
    expect(containsCJK(exhibitText)).toBe(true);
    expect(longestLatinWordRun(exhibitText)).toBeLessThanOrEqual(8);
  }
});

test.describe("Ask Portfolio mobile layout", () => {
  test("no horizontal overflow at 390 or 360, first screen and exhibits 02/03", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Overflow audit is meaningful only at narrow viewports.");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    await assertNoHorizontalOverflow(page, `${ROUTE} at 390 (first screen)`);
    await page.locator(SEL.exhibit("02")).scrollIntoViewIfNeeded();
    await assertNoHorizontalOverflow(page, `${ROUTE} at 390 (exhibit 02)`);
    await page.locator(SEL.exhibit("03")).scrollIntoViewIfNeeded();
    await assertNoHorizontalOverflow(page, `${ROUTE} at 390 (exhibit 03)`);

    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    await assertNoHorizontalOverflow(page, `${ROUTE} at 360 (first screen)`);
    await page.locator(SEL.exhibit("02")).scrollIntoViewIfNeeded();
    await assertNoHorizontalOverflow(page, `${ROUTE} at 360 (exhibit 02)`);
    await page.locator(SEL.exhibit("03")).scrollIntoViewIfNeeded();
    await assertNoHorizontalOverflow(page, `${ROUTE} at 360 (exhibit 03)`);
  });
});
