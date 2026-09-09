import { expect, test } from "@playwright/test";
import { SEL } from "./selectors";
import { bodyTextExcludingLanguageSwitcher, containsCJK, longestLatinWordRun } from "./localePurity";
import { assertNoHorizontalOverflow } from "./mobileAudit";
import questionBank from "../../src/data/generated/ask-question-bank.json";
import presetAnswers from "../../src/data/generated/ask-preset-answers.json";
import recordedExample from "../../src/data/generated/ask-recorded-example.json";

// Task L5 [CLAUDE]: /projects/ask-portfolio, the user-approved dialogue-genre
// "Ask Portfolio" page (output/design-genres/genre-ask-dialogue.html is the
// design authority). This route was previously routeEnabled: false (404);
// this task enables it and builds the full-page conversation surface as a
// standalone route (src/app/projects/ask-portfolio/page.tsx), reusing the
// floating panel's own ask/submit/citation machinery (extracted to
// src/lib/use-assistant-conversation.ts, also now used by
// AssistantWidget.tsx) rather than forking a second copy of it.

const ROUTE = "/projects/ask-portfolio";

type QuestionBank = Record<string, { questions: Array<{ id: string; q_en: string; q_zh: string }> }>;
const bank = questionBank as QuestionBank;

// /projects/ask-portfolio has no route-specific entry in the generated bank (task
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

  // Task R9c (B5-c): references are a navigation index. The recorded
  // citation is a portfolio-site-internal chunk (its sourceId is
  // "portfolio-site:<routeKey>:<path>:Lx-Ly"), so the index must map it to
  // a route on this site -- never the raw portfolio-site repo file link or
  // a config-file path dump.
  expect(recordedExample.citation.sourceId.startsWith("portfolio-site:")).toBe(true);
  const recordedIndex = exhibit01.getByTestId("ask-go-index");
  await expect(recordedIndex).toContainText("References and destinations", { ignoreCase: true });
  await expect(recordedIndex).toContainText("PROJECT INDEX");
  await expect(recordedIndex.getByRole("link", { name: "Browse the full project index" })).toHaveAttribute("href", "/");
  await expect(recordedIndex.locator(`a[href="${recordedExample.citation.url}"]`)).toHaveCount(0);
  await expect(recordedIndex).not.toContainText("site-config.ts");

  const openers = exhibit01.locator(".ask-opener");
  await expect(openers).toHaveCount(3);
  const prompts = bankPrompts("en");
  for (const [index, prompt] of prompts.entries()) {
    await expect(openers.nth(index)).toContainText(prompt);
  }

  await expect(exhibit01.locator(".ask-ratelimit")).toContainText("Rate limit is shown here once you ask");
});

// Task R14 (owner ruling): clicking a bank preset returns its AUTHORED
// preset answer instantly -- no inference on click. The answer is committed
// prose (src/data/generated/ask-preset-answers.json), written by the author
// and grounded number-by-number against named source files at generation
// time, rendered under truthful preset labeling (预置回答 -- never claimed
// to be retrieval output), with its citations mapped through the B5-c
// navigation index. Route interception proves no /api/assistant request
// fires.
for (const locale of ["en", "zh"] as const) {
  test(`clicking a preset (${locale}) renders its authored answer instantly with no assistant API call`, async ({ page }) => {
    let assistantRequests = 0;
    await page.route("**/api/assistant", async (route) => {
      assistantRequests += 1;
      await route.abort();
    });
    if (locale === "zh") {
      await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "zh"));
    } else {
      await page.addInitScript(() => window.localStorage.setItem("portfolio-locale", "en"));
    }
    await page.goto(ROUTE, { waitUntil: "networkidle" });

    const firstQuestion = bank["/"].questions[0];
    const prompt = locale === "en" ? firstQuestion.q_en : firstQuestion.q_zh;
    const record = (presetAnswers.answers as Record<string, { citations: Array<{ sourceId: string; url?: string }>; en: { segments: Array<{ text: string; ref: number }> }; zh: { segments: Array<{ text: string; ref: number }> } }>)[firstQuestion.id];
    const preset = record[locale];
    expect(preset.segments.length).toBeGreaterThan(0);

    await page.getByRole("button", { name: prompt, exact: false }).click();

    const liveTurn = page.locator(".ask-turn-folio").last();
    for (const segment of preset.segments) {
      await expect(liveTurn).toContainText(segment.text);
    }
    // The truthful preset labeling, on the appended turn itself: an
    // authored answer must never carry the retrieval-provenance label.
    await expect(liveTurn.locator(".ask-who small")).toHaveText(
      locale === "en" ? "preset answer" : "预置回答",
    );

    // The reviewed feedback contract routes overview answers to project homes.
    // Detailed questions retain pinned evidence files (covered below).
    const index = liveTurn.getByTestId("ask-go-index");
    await expect(index).toBeVisible();
    for (const citation of record.citations) {
      if (citation.url) await expect(index.locator(`a[href="${citation.url}"]`)).toHaveCount(0);
    }
    for (const path of ["/", "/projects/frontier-forge", "/projects/release-guardian"]) {
      const href = locale === "zh" ? `${path}?lang=zh` : path;
      await expect(index.locator(`a[href="${href}"]`)).toHaveCount(1);
    }
    const indexLinks = index.locator("a");
    expect(await indexLinks.count()).toBeGreaterThan(0);
    for (const href of await indexLinks.evaluateAll((anchors) => anchors.map((anchor) => anchor.getAttribute("href")))) {
      expect(href === null || href.startsWith("/") || /^https:\/\/github\.com\/LucisZhang\//u.test(href)).toBe(true);
    }

    expect(assistantRequests).toBe(0);
  });
}

// Task B6: an authored citation's section anchor (scripts/lib/ask-authored-answers.mjs
// spec.anchor, spread onto a {site} citation) must survive rendering as a
// "#exhibit-NN" fragment on the destination link, not just land on the bare
// project page. "home-tech-stack" (bank["/"].questions[2]) cites Triage
// Router's exhibit-01 this way.
test("an overview preset keeps project-level destinations even when its evidence has an exhibit anchor", async ({ page }) => {
  await page.route("**/api/assistant", async (route) => {
    await route.abort();
  });
  await page.goto(ROUTE, { waitUntil: "networkidle" });

  const anchoredQuestion = bank["/"].questions[2];
  expect(anchoredQuestion.id).toBe("home-tech-stack");
  const record = (presetAnswers.answers as Record<string, { citations: Array<{ sourceId: string; url?: string; anchor?: string }> }>)[anchoredQuestion.id];
  const anchoredCitation = record.citations.find((citation) => citation.anchor);
  expect(anchoredCitation?.anchor).toBe("exhibit-01");

  await page.getByRole("button", { name: anchoredQuestion.q_en, exact: false }).click();

  const liveTurn = page.locator(".ask-turn-folio").last();
  const index = liveTurn.getByTestId("ask-go-index");
  await expect(index).toBeVisible();
  await expect(index.locator(`a[href$="#${anchoredCitation!.anchor}"]`)).toHaveCount(0);
  await expect(index.locator('a[href="/projects/triage-router"]')).toHaveCount(1);
});

test("submitting a typed question produces a live answer whose references index maps internals to routes and keeps external deep links", async ({ page }) => {
  // Task R9c (B5-c): a portfolio-site-internal chunk (site-config.ts /
  // projects.ts style) must surface as a site route link, never its raw
  // repo file link; an external project-repo chunk must keep its pinned
  // GitHub line-range link under a human label, not a path dump.
  const internalUrl = "https://github.com/LucisZhang/portfolio-site/blob/e8821702bfe69ee5846a617aa178486f216b5346/src/lib/projects.ts#L1-L20";
  const externalUrl = "https://github.com/LucisZhang/release-guardian/blob/1be4af55301b6d4a2c1c98b1850a820b698208bb/README.md#L1-L27";
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
        sources: [
          {
            sourceId: "portfolio-site:ai-frontier-forge:src/lib/projects.ts:L1-L20",
            kind: "public-github",
            label: { en: "Xiangguo Zhang portfolio · src/lib/projects.ts · lines 1-20", zh: "章向国作品集 · src/lib/projects.ts · 第 1-20 行" },
            url: internalUrl,
          },
          {
            sourceId: "release-guardian:README.md:L1-L27",
            kind: "public-github",
            label: { en: "Release Guardian · README.md · lines 1-27", zh: "Release Guardian · README.md · 第 1-27 行" },
            url: externalUrl,
          },
        ],
      }),
    });
  });

  await page.goto(ROUTE, { waitUntil: "networkidle" });
  // Task R14: presets answer from the committed authored artifact without
  // touching /api/assistant, so the live-path contract is exercised the way
  // it still happens in production -- a typed free-form question.
  await page.locator(".ask-turn-next input").fill("How does Frontier Forge demonstrate applied AI delivery?");
  await page.locator(".ask-turn-next button").click();

  // Scoped to the ask region: the sitewide colophon "Index of work" (task
  // R9a circuit/colophon navigation) also carries a Release Guardian link,
  // so the page-level locator is ambiguous. The assertion target is the
  // answer's project chip, unchanged.
  await expect(page.getByTestId("ask-portfolio").getByRole("link", { name: "Release Guardian", exact: true })).toHaveAttribute("href", "/projects/release-guardian");

  const liveIndex = page.getByTestId("ask-go-index").last();
  // Internal chunk -> project-page route link, and the raw file link is gone.
  const routeLink = liveIndex.getByRole("link", { name: "Explore Frontier Forge" });
  await expect(routeLink).toHaveAttribute("href", "/projects/frontier-forge");
  await expect(liveIndex.locator(`a[href="${internalUrl}"]`)).toHaveCount(0);
  await expect(liveIndex).not.toContainText("src/lib/projects.ts");
  // External chunk -> the pinned GitHub deep link survives, human-labeled.
  const deepLink = liveIndex.getByRole("link", { name: "See the README's verified claims in Release Guardian" });
  await expect(deepLink).toHaveAttribute("href", externalUrl);
  await expect(deepLink).toHaveAttribute("target", "_blank");
  await expect(liveIndex).not.toContainText("github.com/LucisZhang/release-guardian");
  await expect(liveIndex).not.toContainText("project page");

  await expect(page.locator(".ask-ratelimit")).toContainText("7 requests left this minute");
  await expect(page.locator(".ask-ratelimit")).toContainText("42 left today");
});

test("layered policy explanation and report both render the two verbatim refusals", async ({ page }) => {
  // Task R9c (B5-a): the two recorded refusals are data, not quotations --
  // no border-left bar, no italics, and the recorded texts stay verbatim.
  await page.goto(ROUTE, { waitUntil: "networkidle" });
  const exhibit02 = page.locator(SEL.exhibit("02"));
  const results = page.locator('[data-report-section="results"]');
  const refusals = results.locator(".ask-refusal");
  await expect(exhibit02.locator(".ask-refusal")).toHaveCount(2);
  await expect(refusals).toHaveCount(2);
  await expect(page.locator(".ask-guard-example")).toHaveCount(4);
  await expect(results.locator("blockquote")).toHaveCount(0);

  await expect(exhibit02).toContainText("external AI guard");
  await expect(exhibit02).toContainText("local policy screen");
  await expect(exhibit02).toContainText("Only an allowed question reaches retrieval and the answer model");
  await expect(refusals.nth(0)).toContainText("OFF-TOPIC · POLICY STOP");
  await expect(refusals.nth(0)).toContainText("I focus on Xiangguo Zhang's background, projects, skills, working style, and role fit. Ask me about any of those.");
  await expect(refusals.nth(1)).toContainText("PROMPT INJECTION · POLICY STOP");
  await expect(refusals.nth(1)).toContainText("I cannot change or reveal my internal instructions or knowledge files. I can still explain Xiangguo Zhang's work and candidacy.");
  await expect(refusals.nth(0)).toContainText("no retrieval or answer-model call");

  for (const index of [0, 1]) {
    const styles = await refusals.nth(index).locator(".ask-refusal-text").evaluate((element) => {
      const computed = window.getComputedStyle(element);
      return { borderLeftWidth: computed.borderLeftWidth, fontStyle: computed.fontStyle };
    });
    expect(styles.borderLeftWidth).toBe("0px");
    expect(styles.fontStyle).toBe("normal");
    const rowStyles = await refusals.nth(index).evaluate((element) => {
      const computed = window.getComputedStyle(element);
      return { borderLeftWidth: computed.borderLeftWidth };
    });
    expect(rowStyles.borderLeftWidth).toBe("0px");
  }
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
  // Task R14: the failure path is a live-path behavior, so it is
  // exercised through a typed question (presets never hit the API).
  await page.locator(".ask-turn-next input").fill("What makes this portfolio's evidence trustworthy?");
  await page.locator(".ask-turn-next button").click();

  // .ask-turn-folio matches both the always-present static recorded example
  // and the newly rendered live reply -- .last() targets the live one.
  await expect(page.locator(".ask-turn-folio").last()).toContainText("The assistant could not complete a grounded answer.");
  const fallback = page.locator(".ask-fallback");
  await expect(fallback).toBeVisible();
  await expect(fallback).toContainText("Honest fallback");
  await expect(fallback.getByRole("link", { name: "Frontier Forge" })).toHaveAttribute("href", "/projects/frontier-forge");
  await expect(fallback.getByRole("link", { name: "Crossover Study" })).toHaveAttribute("href", "/projects/crossover-study");
  await expect(fallback.getByRole("link", { name: "Credit Policy Desk" })).toHaveAttribute("href", "/projects/credit-policy-desk");
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


test("global opener references lead to project homes in both languages", async ({ page }) => {
  for (const locale of ["en", "zh"] as const) {
    await page.goto(`${ROUTE}${locale === "zh" ? "?lang=zh" : ""}`, { waitUntil: "networkidle" });
    for (const question of bank["/"].questions) {
      await page.locator(".ask-openers").getByRole("button", { name: question[locale === "en" ? "q_en" : "q_zh"], exact: false }).click();
      const index = page.locator("#ask-opener-answer").getByTestId("ask-go-index");
      await expect(index).toBeVisible();
      await expect(index.locator('a[href*="/blob/"]')).toHaveCount(0);
      await expect(index.locator('a[href*="/projects/"]').first()).toBeVisible();
    }
  }
});
