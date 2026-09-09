import { expect, test } from "@playwright/test";
import { SEL } from "./selectors";
import { recruiterQuestionsByRoute, recruiterSearchSuggestions } from "../../src/data/recruiter-content";
import { searchPortfolio } from "../../src/lib/portfolio-search";
import { rankPortfolioSearchSuggestions } from "../../src/lib/portfolio-search-suggestions";
import { featuredProjects, tracks } from "../../src/lib/projects";
import type { Locale } from "../../src/lib/i18n";

const cases: Array<{ query: string; locale: Locale; first: string; includes?: string[] }> = [
  { query: "CUDA grouped convolution", locale: "en", first: "groupconv-atlas" },
  { query: "分组卷积", locale: "zh", first: "groupconv-atlas" },
  { query: "vLLM token-aware gateway", locale: "en", first: "frontier-forge" },
  { query: "大模型微调推理网关", locale: "zh", first: "frontier-forge" },
  { query: "agent", locale: "en", first: "release-guardian", includes: ["rag-quality-lab"] },
  { query: "金融", locale: "zh", first: "credit-policy-desk", includes: ["margin-control-tower"] },
  { query: "release approval", locale: "en", first: "release-guardian" },
  { query: "发布审批", locale: "zh", first: "release-guardian" },
  { query: "Flink checkpoint", locale: "en", first: "exactly-once-drills" },
  { query: "流式故障恢复", locale: "zh", first: "exactly-once-drills" },
  { query: "retrieval regression", locale: "en", first: "rag-quality-lab" },
  { query: "知识库评估", locale: "zh", first: "rag-quality-lab" },
  { query: "complaint classification cost", locale: "en", first: "triage-router" },
  { query: "投诉分流", locale: "zh", first: "triage-router" },
  { query: "model routing cascade", locale: "en", first: "triage-router" },
  { query: "OCR PDF", locale: "en", first: "privacy-preflight" },
  { query: "隐私脱敏", locale: "zh", first: "privacy-preflight" },
  { query: "ecommerce profit", locale: "en", first: "margin-control-tower" },
  { query: "电商毛利", locale: "zh", first: "margin-control-tower" },
  { query: "credit default risk", locale: "en", first: "credit-policy-desk" },
  { query: "信贷回测", locale: "zh", first: "credit-policy-desk" },
  { query: "local document sanitizer", locale: "en", first: "privacy-preflight" },
  { query: "promotion elasticity", locale: "en", first: "margin-control-tower" },
  { query: "expected loss", locale: "en", first: "credit-policy-desk" },
  { query: "schema evolution", locale: "en", first: "exactly-once-drills" },
  { query: "personalization catalog churn", locale: "en", first: "crossover-study" },
  { query: "推荐系统目录换血", locale: "zh", first: "crossover-study" },
  { query: "prompt injection", locale: "en", first: "release-guardian" },
  { query: "retrval", locale: "en", first: "rag-quality-lab" },
  { query: "relese gate", locale: "en", first: "release-guardian" },
  { query: "dian", locale: "en", first: "margin-control-tower" },
  { query: "dianshang", locale: "zh", first: "margin-control-tower" },
  { query: "maoli", locale: "zh", first: "margin-control-tower" },
  { query: "shujuguandaohuifu", locale: "zh", first: "exactly-once-drills" },
  { query: "sjgc", locale: "zh", first: "track-engineering", includes: ["exactly-once-drills"] },
  { query: "電商", locale: "zh", first: "margin-control-tower" },
  { query: "信貸", locale: "zh", first: "credit-policy-desk" },
  { query: "資料管線", locale: "zh", first: "exactly-once-drills" },
  { query: "dian商毛利", locale: "zh", first: "margin-control-tower" },
];

test("hybrid bilingual search ranks project meaning instead of hard-coded example queries", async ({}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The deterministic search index only needs one runtime matrix pass.");
  const covered = new Set<string>();
  for (const item of cases) {
    const results = searchPortfolio(item.query, tracks, featuredProjects, item.locale);
    expect(results[0]?.id, item.query).toBe(item.first);
    expect(results.length, item.query).toBeGreaterThan(0);
    expect(results.length, item.query).toBeLessThanOrEqual(5);
    expect(results.every((result) => result.reason.length > 0), item.query).toBe(true);
    for (const expected of item.includes ?? []) expect(results.map((result) => result.id), item.query).toContain(expected);
    results.filter((result) => !result.id.startsWith("track-")).forEach((result) => covered.add(result.id));
  }
  expect(covered).toEqual(new Set(featuredProjects.map((project) => project.slug)));
});

test("published Crossover Study is searchable in both languages", async ({}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The catalog publication contract only needs one runtime pass.");
  expect(featuredProjects.some((project) => project.slug === "crossover-study")).toBe(true);

  for (const query of ["Crossover Study", "Spark Iceberg lakehouse", "推荐系统评估"]) {
    expect(searchPortfolio(query, tracks, featuredProjects, "en").some((result) => result.id === "crossover-study")).toBe(true);
    expect(searchPortfolio(query, tracks, featuredProjects, "zh").some((result) => result.id === "crossover-study")).toBe(true);
  }
});

test("discipline pages require explicit discipline queries and irrelevant text does not produce filler", async ({}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The deterministic search index only needs one runtime matrix pass.");
  for (const item of [
    { query: "data engineering", locale: "en" as const, track: "track-engineering", project: "exactly-once-drills" },
    { query: "数据分析", locale: "zh" as const, track: "track-analytics", project: "margin-control-tower" },
    { query: "AI 应用", locale: "zh" as const, track: "track-ai", project: "release-guardian" },
  ]) {
    const results = searchPortfolio(item.query, tracks, featuredProjects, item.locale);
    expect(results[0]?.id).toBe(item.track);
    expect(results.map((result) => result.id)).toContain(item.project);
  }

  for (const query of ["agent", "金融", "OCR PDF", "expected loss"]) {
    expect(searchPortfolio(query, tracks, featuredProjects, "en").some((result) => result.id.startsWith("track-"))).toBe(false);
  }
  expect(searchPortfolio("a completely unrelated business phrase", tracks, featuredProjects, "en")).toEqual([]);
  expect(searchPortfolio("完全无关的内容", tracks, featuredProjects, "zh")).toEqual([]);
});

test("every recruiter-reviewed suggestion has a deterministic bilingual result", async ({}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The deterministic suggestion contract only needs one runtime pass.");
  for (const suggestion of recruiterSearchSuggestions) {
    for (const locale of ["en", "zh"] as const) {
      const results = searchPortfolio(suggestion.label[locale], tracks, featuredProjects, locale);
      expect(results.length, `${locale}: ${suggestion.label[locale]}`).toBeGreaterThan(0);
      expect(results[0]?.id, `${locale}: ${suggestion.label[locale]}`).toBe(suggestion.expectedId);
    }
  }
});

test("local selection history changes diverse suggestions and partial input yields relevant completions", async ({}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Suggestion ranking is deterministic and browser-local.");
  const cold = rankPortfolioSearchSuggestions({ locale: "en", history: [], query: "", results: [], limit: 3 });
  expect(new Set(cold.map((item) => item.expectedId)).size).toBe(3);

  const personalized = rankPortfolioSearchSuggestions({
    locale: "en",
    history: [{ query: "credit default risk", resultId: "credit-policy-desk", at: Date.now() }],
    query: "",
    results: [],
    limit: 3,
  });
  expect(personalized[0]?.expectedId).toBe("credit-policy-desk");

  const partialResults = searchPortfolio("dian", tracks, featuredProjects, "zh");
  const completions = rankPortfolioSearchSuggestions({ locale: "zh", history: [], query: "dian", results: partialResults, limit: 3 });
  expect(completions.some((item) => item.expectedId === "margin-control-tower")).toBe(true);
});

test("search history stays local, bounded, persistent, and isolated by browser context", async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Browser storage behavior only needs one runtime pass.");
  const baseURL = String(testInfo.project.use.baseURL);
  const context = await browser.newContext({ baseURL });
  await context.addInitScript(() => {
    window.localStorage.setItem("portfolio-locale", "en");
    if (!window.localStorage.getItem("portfolio-search-history-v2")) {
      window.localStorage.setItem("portfolio-search-history-v2", JSON.stringify(Array.from({ length: 30 }, (_, index) => ({
        query: `old query ${index}`,
        at: 30 - index,
      }))));
    }
  });
  const page = await context.newPage();
  const outboundBodies: string[] = [];
  page.on("request", (request) => {
    const body = request.postData();
    if (body) outboundBodies.push(body);
  });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Search/ }).click();
  await page.getByPlaceholder("Search projects, systems, or tools").fill("credit default risk");
  await page.locator(SEL.cmdkItem).filter({ hasText: "Credit Policy Desk" }).first().click();
  await expect(page).toHaveURL(/\/projects\/credit-policy-desk/);
  const stored = await page.evaluate(() => JSON.parse(window.localStorage.getItem("portfolio-search-history-v2") ?? "[]") as unknown[]);
  expect(stored).toHaveLength(20);
  expect(JSON.stringify(outboundBodies)).not.toContain("credit default risk");
  // Task-suite-reconcile (2026-08-30) had briefly retargeted this reload to
  // "/" instead of the destination project page: none of the ten standalone
  // project routes passed `railTools` into their <ExhibitShell>, so there
  // was no Search button anywhere on credit-policy-desk to click after a
  // reload there. Task F14 fixed that gap sitewide (ProjectRailTools.tsx),
  // so this reopens search from the actual destination page again, as it
  // did before that regression.
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Search/ }).click();
  await expect(page.locator(SEL.commandSuggestionsButton).first()).toHaveText("credit approval policy thresholds");
  await context.close();

  const freshContext = await browser.newContext({ baseURL });
  await freshContext.addInitScript(() => {
    window.localStorage.setItem("portfolio-locale", "en");
    window.localStorage.setItem("portfolio-search-history-v2", "{malformed");
  });
  const freshPage = await freshContext.newPage();
  await freshPage.goto("/", { waitUntil: "networkidle" });
  await freshPage.getByRole("button", { name: /Search/ }).click();
  await expect(freshPage.locator(SEL.commandSuggestionsButton).first()).toHaveText("RAG regression evaluation");
  await freshContext.close();
});

test("every primary recruiter route exposes four distinct bilingual questions", async ({}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Static recruiter content needs one deterministic pass.");
  const expectedRoutes = new Set([
    "/",
    ...tracks.map((track) => `/${track.id}`),
    ...featuredProjects.map((project) => `/projects/${project.slug}`),
  ]);
  expect(new Set(Object.keys(recruiterQuestionsByRoute))).toEqual(expectedRoutes);
  for (const [route, questions] of Object.entries(recruiterQuestionsByRoute)) {
    expect(questions.en, `${route} English`).toHaveLength(4);
    expect(questions.zh, `${route} Chinese`).toHaveLength(4);
    expect(new Set(questions.en).size, `${route} English unique`).toBe(4);
    expect(new Set(questions.zh).size, `${route} Chinese unique`).toBe(4);
  }
});
