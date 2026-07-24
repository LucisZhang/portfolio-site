import { expect, test } from "@playwright/test";
import { searchPortfolio } from "../../src/lib/portfolio-search";
import { featuredProjects, tracks } from "../../src/lib/projects";
import type { Locale } from "../../src/lib/i18n";

const cases: Array<{ query: string; locale: Locale; first: string; includes?: string[] }> = [
  { query: "agent", locale: "en", first: "release-guardian", includes: ["rag-quality-lab"] },
  { query: "金融", locale: "zh", first: "credit-policy-lab", includes: ["margin-control-tower"] },
  { query: "release approval", locale: "en", first: "release-guardian" },
  { query: "发布审批", locale: "zh", first: "release-guardian" },
  { query: "Flink checkpoint", locale: "en", first: "p1-reliability-lab" },
  { query: "流式故障恢复", locale: "zh", first: "p1-reliability-lab" },
  { query: "retrieval regression", locale: "en", first: "rag-quality-lab" },
  { query: "知识库评估", locale: "zh", first: "rag-quality-lab" },
  { query: "OCR PDF", locale: "en", first: "privacy-preflight-mac" },
  { query: "隐私脱敏", locale: "zh", first: "privacy-preflight-mac" },
  { query: "ecommerce profit", locale: "en", first: "margin-control-tower" },
  { query: "电商毛利", locale: "zh", first: "margin-control-tower" },
  { query: "credit default risk", locale: "en", first: "credit-policy-lab" },
  { query: "信贷回测", locale: "zh", first: "credit-policy-lab" },
  { query: "local document sanitizer", locale: "en", first: "privacy-preflight-mac" },
  { query: "promotion elasticity", locale: "en", first: "margin-control-tower" },
  { query: "expected loss", locale: "en", first: "credit-policy-lab" },
  { query: "schema evolution", locale: "en", first: "p1-reliability-lab" },
  { query: "prompt injection", locale: "en", first: "release-guardian" },
  { query: "retrval", locale: "en", first: "rag-quality-lab" },
  { query: "relese gate", locale: "en", first: "release-guardian" },
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

test("discipline pages require explicit discipline queries and irrelevant text does not produce filler", async ({}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The deterministic search index only needs one runtime matrix pass.");
  for (const item of [
    { query: "data engineering", locale: "en" as const, track: "track-engineering", project: "p1-reliability-lab" },
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
