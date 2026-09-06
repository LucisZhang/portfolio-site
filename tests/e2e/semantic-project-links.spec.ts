import { expect, test } from "@playwright/test";
import questionBank from "../../src/data/generated/ask-question-bank.json";
import presetAnswers from "../../src/data/generated/ask-preset-answers.json";
import { findProjectMentions, projectIdentityHref } from "../../src/lib/project-identities";

const stackRoutes = [
  "/ai/frontier-forge", "/ai/frontier-forge", "/engineering/exactly-once-drills",
  "/engineering/exactly-once-drills", "/engineering/crossover-study", "/ai/release-guardian",
];

for (const locale of ["en", "zh"] as const) {
  const suffix = locale === "zh" ? "?lang=zh" : "";

  test(`stack project links (${locale}) are localized, keyboard operable and leave layer labels as text`, async ({ page }) => {
    await page.goto(`/${suffix}`, { waitUntil: "networkidle" });
    const links = page.locator(".home-stack-layer-projects a");
    await expect(links).toHaveCount(6);
    expect(await links.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href"))))
      .toEqual(stackRoutes.map((route) => `${route}${suffix}`));
    await expect(page.locator(".home-stack-layer-name a, .home-stack-layer-metric a")).toHaveCount(0);
    await links.first().focus();
    await expect(links.first()).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(links.nth(1)).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(new RegExp(`/ai/frontier-forge${locale === "zh" ? "\\?lang=zh" : ""}$`));
    await expect(page.locator("h1")).toBeVisible();
  });

  test(`stack project links (${locale}) exist without JavaScript`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(`${baseURL}/${suffix}`);
    // The statically generated document is English until locale hydration;
    // every project anchor and its canonical path must already exist.
    const links = page.locator(".home-stack-layer-projects a");
    expect(await links.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href"))))
      .toEqual(stackRoutes);
    await links.nth(4).click();
    await expect(page).toHaveURL(/\/engineering\/crossover-study$/);
    await context.close();
  });

  for (const [route, bank] of Object.entries(questionBank)) {
    // The compatibility route redirects to the archive; its bank and alias
    // routing remain exhaustively covered by project-identities.test.mjs.
    if (route === "/analytics/analytics-tandem") continue;
    test(`launcher presets (${locale}) link every project mention on ${route} without a model call`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name === "tablet", "Desktop and touch layouts cover this complete preset matrix.");
      let calls = 0;
      await page.route("**/api/assistant", async (request) => { calls += 1; await request.abort(); });
      await page.goto(`${route}${suffix}`, { waitUntil: "networkidle" });
      for (const question of bank.questions) {
        await page.getByRole("button", { name: locale === "en" ? "Ask Portfolio" : "询问作品集", exact: true }).click();
        const widget = page.getByTestId("assistant-widget");
        await widget.getByRole("button", { name: question[`q_${locale}`], exact: true }).click();
        const record = presetAnswers.answers[question.id as keyof typeof presetAnswers.answers];
        const paragraphs = widget.locator("em");
        await expect(paragraphs).toHaveCount(record[locale].segments.length);
        for (const [index, segment] of record[locale].segments.entries()) {
          const paragraph = paragraphs.nth(index);
          await expect(paragraph).toHaveText(segment.text);
          const expected = findProjectMentions(segment.text).map((mention) => ({
            text: mention.text, href: projectIdentityHref(mention.id, locale),
          }));
          expect(await paragraph.locator("a").evaluateAll((nodes) => nodes.map((node) => ({ text: node.textContent, href: node.getAttribute("href") })))).toEqual(expected);
        }
        await expect(widget.locator("em a a")).toHaveCount(0);
        await widget.getByRole("button", { name: locale === "en" ? "Close" : "关闭", exact: true }).click();
      }
      expect(calls).toBe(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });
  }

  test(`Ask page answers (${locale}) link all names and keep pinned citation destinations`, async ({ page }) => {
    let calls = 0;
    await page.route("**/api/assistant", async (request) => { calls += 1; await request.abort(); });
    await page.goto(`/ai/ask-portfolio${suffix}`, { waitUntil: "networkidle" });
    for (const [index, question] of questionBank["/"].questions.entries()) {
      await page.locator(".ask-opener").nth(index).click();
      const answer = page.locator(".ask-turn-folio").last();
      const record = presetAnswers.answers[question.id as keyof typeof presetAnswers.answers];
      await expect(answer.locator(".ask-preset-segment > em")).toHaveCount(record[locale].segments.length);
      const expected = record[locale].segments.flatMap((segment) => findProjectMentions(segment.text)
        .map((mention) => projectIdentityHref(mention.id, locale)));
      expect(await answer.locator(".ask-preset-segment > em a").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href")))).toEqual(expected);
      for (const citation of record.citations.filter((c) => !c.sourceId.startsWith("portfolio-site:"))) {
        await expect(answer.locator(`.ask-go a[href="${citation.url}"]`)).toHaveCount(1);
      }
    }
    expect(calls).toBe(0);
  });

  test(`known legacy project failure (${locale}) offers the requested routes`, async ({ page }) => {
    await page.route("**/api/assistant", (request) => request.fulfill({
      status: 502, contentType: "application/json", body: JSON.stringify({ reply: "Unavailable", retryable: true }),
    }));
    await page.goto(`/ai/ask-portfolio${suffix}`, { waitUntil: "networkidle" });
    await page.locator(".ask-turn-next input").fill(locale === "en"
      ? "Compare Streaming Reliability Lab with Credit Policy Lab."
      : "比较流式可靠性实验室和信贷策略实验室。");
    await page.locator(".ask-turn-next button").click();
    const links = page.locator(".ask-fallback a");
    await expect(links).toHaveCount(2);
    expect(await links.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href"))))
      .toEqual([`/engineering/exactly-once-drills${suffix}`, `/analytics/credit-policy-desk${suffix}`]);
  });

  test(`both answer surfaces (${locale}) render all typed and legacy names as canonical links`, async ({ page }) => {
    const text = "Frontier Forge · Release Guardian · RAG Quality Lab · Triage Router · Crossover Study · Ask Portfolio · Streaming Reliability Lab · Credit Policy Lab · 隐私预检 · Margin Control Tower · Voice in Security · Analytics Tandem";
    const mentions = findProjectMentions(text);
    await page.route("**/api/assistant", (request) => request.fulfill({
      contentType: "application/json", body: JSON.stringify({
        reply: text,
        blocks: [
          { type: "paragraph", segments: [{ type: "text", text }] },
          { type: "bullet", segments: [{ type: "project", projectId: "streaming-reliability-lab" }] },
        ],
      }),
    }));
    const expected = [...mentions.map(({ id }) => projectIdentityHref(id, locale)), `/engineering/exactly-once-drills${suffix}`];
    await page.goto(`/ai/ask-portfolio${suffix}`, { waitUntil: "networkidle" });
    await page.locator(".ask-turn-next input").fill("Compare the named projects.");
    await page.locator(".ask-turn-next button").click();
    const pageLinks = page.locator('.ask-turn-folio [class*="richAnswer"] a');
    await expect(pageLinks).toHaveCount(expected.length);
    expect(await pageLinks.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href")))).toEqual(expected);
    await page.goto(`/${suffix}`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: locale === "en" ? "Ask Portfolio" : "询问作品集", exact: true }).click();
    const widget = page.getByTestId("assistant-widget");
    await widget.locator("textarea").fill("Compare the named projects.");
    await widget.locator('button[type="submit"]').click();
    const widgetLinks = widget.locator('[class*="richAnswer"] a');
    await expect(widgetLinks).toHaveCount(expected.length);
    expect(await widgetLinks.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href")))).toEqual(expected);
  });
}
