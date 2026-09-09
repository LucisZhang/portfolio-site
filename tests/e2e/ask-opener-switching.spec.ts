import { expect, test } from "@playwright/test";
import bank from "../../src/data/generated/ask-question-bank.json";
import answers from "../../src/data/generated/ask-preset-answers.json";

for (const locale of ["en", "zh"] as const) {
  test(`openers replace one answer and preserve typed conversation (${locale})`, async ({ page }) => {
    let calls = 0;
    await page.route("**/api/assistant", async (route) => {
      calls += 1;
      await route.fulfill({ json: { reply: "A retained conversation reply.", sources: [] } });
    });
    await page.goto(`/projects/ask-portfolio?lang=${locale}`);
    const buttons = page.locator(".ask-opener");
    const display = page.locator(".ask-opener-display");
    await expect(page.locator(".ask-opener-active")).toHaveCount(0);
    const questions = bank["/"].questions;
    for (const index of [0, 1, 2, 0, 2]) {
      await buttons.nth(index).click();
      await expect(buttons.nth(index)).toHaveAttribute("aria-pressed", "true");
      await expect(page.locator('.ask-opener[aria-pressed="true"]')).toHaveCount(1);
      await expect(display.locator(".ask-turn-folio")).toHaveCount(1);
      await expect(display.locator(".ask-say-question")).toHaveText(questions[index][locale === "en" ? "q_en" : "q_zh"]);
      const answer = answers.answers[questions[index].id as keyof typeof answers.answers][locale];
      for (const segment of answer.segments) await expect(display).toContainText(segment.text);
    }
    await expect(page.locator(".ask-turn-folio")).toHaveCount(1);
    expect(calls).toBe(0);
    await page.locator(".ask-turn-next input").fill("Tell me about the projects.");
    await page.locator(".ask-turn-next button").click();
    await expect(page.locator(".ask-script")).toContainText("A retained conversation reply.");
    await buttons.nth(1).click();
    await expect(display).toHaveAttribute("aria-busy", "false");
    await expect(page.locator(".ask-script")).toContainText("A retained conversation reply.");
    await expect(page.locator(".ask-turn-folio")).toHaveCount(2);
    expect(calls).toBe(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test("rapid opener selection renders only the final question and answer", async ({ page }) => {
  let releaseAnswer!: () => void;
  const heldAnswer = new Promise<void>((resolve) => { releaseAnswer = resolve; });
  let answerChunkHeld = false;
  await page.route("**/_next/static/chunks/*.js", async (route) => {
    const response = await route.fetch();
    const body = await response.text();
    if (body.includes("authored preset answers (assistant-knowledge/question-bank.json)")) {
      answerChunkHeld = true;
      await heldAnswer;
    }
    await route.fulfill({ response });
  });
  await page.goto("/projects/ask-portfolio?lang=en");
  await page.locator(".ask-opener").nth(0).evaluate((element: HTMLButtonElement) => element.click());
  await expect.poll(() => answerChunkHeld).toBe(true);
  await expect(page.locator(".ask-opener-display")).toHaveAttribute("aria-busy", "true");
  await page.locator(".ask-opener").nth(1).evaluate((element: HTMLButtonElement) => element.click());
  await page.locator(".ask-opener").nth(2).evaluate((element: HTMLButtonElement) => element.click());
  releaseAnswer();
  const last = bank["/"].questions[2];
  const display = page.locator(".ask-opener-display");
  await expect(display.locator(".ask-say-question")).toHaveText(last.q_en);
  for (const segment of answers.answers[last.id as keyof typeof answers.answers].en.segments) {
    await expect(display).toContainText(segment.text);
  }
  await expect(display.locator(".ask-turn-folio")).toHaveCount(1);
  const language = page.getByRole("button", { name: "中", exact: true });
  await language.focus();
  await language.click();
  await expect(display.locator(".ask-say-question")).toHaveText(last.q_zh);
  for (const segment of answers.answers[last.id as keyof typeof answers.answers].zh.segments) {
    await expect(display).toContainText(segment.text);
  }
});
