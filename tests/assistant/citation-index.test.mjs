// Task B3: siteEntry() emits the anchor fragment for authored site citations.
// Per amendment Q1, the anchor is an AUTHORED-CITATION field (spec.anchor,
// spread by scripts/lib/ask-authored-answers.mjs expandCitation's {site}
// branch), never a manifest/snapshot field — these tests exercise
// buildCitationIndex()/siteEntry() directly with hand-built AssistantCitation
// objects, the same shape expandCitation() and ask-preset-answers.json carry.
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { buildCitationIndex } from "../../src/lib/assistant-citation-index.ts";

const base = {
  kind: "public-github",
  url: `https://github.com/LucisZhang/portfolio-site/blob/${"a".repeat(40)}/src/lib/projects.ts`,
};
const label = { en: "Frontier Forge", zh: "Frontier Forge" };

test("an anchored site citation deep-links to the exhibit section", () => {
  const [entry] = buildCitationIndex([{
    ...base,
    sourceId: "portfolio-site:projects-frontier-forge:src/components/forge/OverloadReplay.tsx",
    anchor: "exhibit-05",
    label,
  }]);
  assert.equal(entry.kind, "site");
  assert.equal(entry.href, "/projects/frontier-forge#exhibit-05");
});

test("an unanchored site citation lands on the bare page with no stray fragment", () => {
  const [entry] = buildCitationIndex([{
    ...base,
    sourceId: "portfolio-site:projects-frontier-forge:src/lib/projects.ts",
    label,
  }]);
  assert.equal(entry.href, "/projects/frontier-forge");
  assert.equal(entry.href.includes("#"), false);
});

test("two anchored citations to different sections of one page stay separate entries", () => {
  const entries = buildCitationIndex([
    { ...base, sourceId: "portfolio-site:projects-frontier-forge:a.tsx", anchor: "exhibit-03", label },
    { ...base, sourceId: "portfolio-site:projects-frontier-forge:b.tsx", anchor: "exhibit-05", label },
  ]);
  assert.equal(entries.length, 2);
  assert.deepEqual(entries.map((entry) => entry.href).sort(), [
    "/projects/frontier-forge#exhibit-03",
    "/projects/frontier-forge#exhibit-05",
  ]);
  assert.deepEqual(entries.map((entry) => entry.refs), [[1], [2]]);
});

test("an anchored citation still merges with a same-anchor sibling instead of duplicating", () => {
  const entries = buildCitationIndex([
    { ...base, sourceId: "portfolio-site:projects-frontier-forge:a.tsx", anchor: "exhibit-05", label },
    { ...base, sourceId: "portfolio-site:projects-frontier-forge:b.tsx", anchor: "exhibit-05", label },
  ]);
  assert.equal(entries.length, 1);
  assert.deepEqual(entries[0].refs, [1, 2]);
  assert.equal(entries[0].href, "/projects/frontier-forge#exhibit-05");
});

// Task B4 fix round: the authored-answer gate accepts an anchored {site:"/"}
// citation (homeRail.ts declares exhibit-01…06), so the home destination must
// honor the fragment too — otherwise the gate approves a deep link that lands
// on the bare index.
test("an anchored home citation deep-links to the home section", () => {
  const [entry] = buildCitationIndex([{
    ...base,
    sourceId: "portfolio-site:home:README.md",
    anchor: "exhibit-02",
    label: { en: "Xiangguo Zhang portfolio", zh: "章向国作品集" },
  }]);
  assert.equal(entry.kind, "site");
  assert.equal(entry.href, "/#exhibit-02");
  assert.equal(entry.route.en, "/#exhibit-02 · exhibit section");
});

test("an unanchored home citation still lands on the bare index", () => {
  // Also guards the shared home constant: the anchored case above must build
  // a new object rather than write a fragment into it.
  const [entry] = buildCitationIndex([{
    ...base,
    sourceId: "portfolio-site:home:README.md",
    label: { en: "Xiangguo Zhang portfolio", zh: "章向国作品集" },
  }]);
  assert.equal(entry.href, "/");
  assert.equal(entry.route.en, "/ · project index");
});

test("an anchored citation does not merge with an unanchored citation to the same page", () => {
  const entries = buildCitationIndex([
    { ...base, sourceId: "portfolio-site:projects-frontier-forge:a.tsx", anchor: "exhibit-05", label },
    { ...base, sourceId: "portfolio-site:projects-frontier-forge:b.tsx", label },
  ]);
  assert.equal(entries.length, 2);
  assert.deepEqual(entries.map((entry) => entry.href).sort(), [
    "/projects/frontier-forge",
    "/projects/frontier-forge#exhibit-05",
  ]);
});

// D04: badges and titles describe the destination, across both client surfaces.
test("project homes, sections, archive sections and evidence files have distinct labels", () => {
  const [home, section, archive, evidence, index] = buildCitationIndex([
    { ...base, label, sourceId: "portfolio-site:projects-credit-policy-desk:src/lib/projects.ts" },
    { ...base, label, sourceId: "portfolio-site:projects-credit-policy-desk:src/lib/projects.ts", anchor: "exhibit-03" },
    { ...base, label, sourceId: "portfolio-site:projects-analytics-tandem:src/lib/projects.ts" },
    { ...base, label, sourceId: "credit-policy-desk:README.md", url: `https://github.com/LucisZhang/credit-policy-desk/blob/${"a".repeat(40)}/README.md` },
    { ...base, label, sourceId: "portfolio-site:home:README.md" },
  ]);
  assert.deepEqual(home.badge, { en: "PROJECT HOME", zh: "项目首页" });
  assert.deepEqual(section.badge, { en: "EXHIBIT SECTION", zh: "具体展区" });
  assert.match(section.title.en, /Negative results/);
  assert.match(section.title.zh, /负结果/);
  assert.equal(section.href, "/projects/credit-policy-desk#exhibit-03");
  assert.deepEqual(archive.badge, section.badge);
  assert.match(archive.title.zh, /项目归档/);
  assert.deepEqual(evidence.badge, { en: "EVIDENCE FILE", zh: "证据文件" });
  assert.deepEqual(index.badge, { en: "PROJECT INDEX", zh: "项目索引" });
});

test("section destination labels match every mounted rail section", async () => {
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const { buildCitationSections } = await import("../../scripts/lib/ask-authored-answers.mjs");
  const root = fileURLToPath(new URL("../../", import.meta.url)).replace(/\/$/u, "");
  const committed = JSON.parse(readFileSync(`${root}/src/data/generated/assistant-citation-sections.json`, "utf8"));
  assert.deepEqual(committed, buildCitationSections(root));
});

test("retired route aliases use the canonical project's section title", () => {
  for (const [routeKey, id, anchor] of [
    ["analytics-credit-policy-lab", "credit-policy-desk", "exhibit-03"],
    ["ai-privacy-preflight-mac", "privacy-preflight", "exhibit-03"],
    ["engineering-p1-reliability-lab", "exactly-once-drills", "exhibit-02"],
  ]) {
    const [legacy] = buildCitationIndex([{ ...base, label, sourceId: `portfolio-site:${routeKey}:src/lib/projects.ts`, anchor }]);
    const [canonical] = buildCitationIndex([{ ...base, label, sourceId: `portfolio-site:projects-${id}:src/lib/projects.ts`, anchor }]);
    assert.deepEqual(legacy, canonical);
  }
});


const presetAnswers = JSON.parse(readFileSync(new URL("../../src/data/generated/ask-preset-answers.json", import.meta.url), "utf8")).answers;
const overviewQuestions = JSON.parse(readFileSync(new URL("../../src/data/generated/ask-question-bank.json", import.meta.url), "utf8"))["/"].questions;

test("all three bilingual global presets navigate to project homes rather than evidence files", () => {
  for (const question of overviewQuestions) {
    for (const locale of ["en", "zh"]) {
      const entries = buildCitationIndex(presetAnswers[question.id].citations, question[`q_${locale}`]);
      assert.ok(entries.length > 1, `${question.id} preserves distinct project destinations`);
      for (const entry of entries) {
        assert.ok(!entry.href?.includes("/blob/"), `${question.id}: ${entry.href}`);
        assert.ok(!entry.href?.includes("#exhibit-"));
      }
    }
  }
  const entries = buildCitationIndex(presetAnswers["home-background"].citations, overviewQuestions[0].q_zh);
  assert.deepEqual(entries.map(entry => entry.href), ["/", "/projects/frontier-forge", "/projects/release-guardian"]);
});

test("free-form overview questions use the same navigation and merge same-project references", () => {
  const citations = presetAnswers["home-background"].citations.slice(1);
  const entries = buildCitationIndex([...citations, citations[0]], "介绍一下这些项目，应该先看什么？");
  assert.deepEqual(entries.map(entry => entry.href), ["/projects/frontier-forge", "/projects/release-guardian"]);
  assert.deepEqual(entries[0].refs, [1, 3]);
});

test("implementation questions preserve exact evidence even when they also mention an overview", () => {
  const citations = presetAnswers["home-background"].citations.slice(1);
  for (const question of ["Frontier Forge 的网关具体如何实现过载保护？", "Show the implementation source code after the overview"]) {
    assert.deepEqual(buildCitationIndex(citations, question).map(entry => entry.href), citations.map(citation => citation.url));
  }
});

test("an overview strips site section depth but preserves private-source treatment", () => {
  const entries = buildCitationIndex([
    { ...base, sourceId: "portfolio-site:projects-frontier-forge:src/lib/projects.ts", anchor: "exhibit-03", label },
    { kind: "private-profile", sourceId: "private", label },
  ], "Give me an overview");
  assert.equal(entries[0].href, "/projects/frontier-forge");
  assert.equal(entries[1].kind, "private");
  assert.equal(entries[1].href, undefined);
});


test("free-form profile, role-fit and technology summaries use project-level destinations", () => {
  const citations = presetAnswers["home-background"].citations.slice(1);
  for (const question of [
    "他的背景是什么？", "他的主要工作是什么？", "他擅长什么？", "他适合哪些岗位？", "他的职业目标是什么？",
    "网站有哪些技术？", "这个网站的技术栈是什么？", "具体说说他的求职方向？",
    "Tell me about his background", "What are his strongest skills?", "Can you assess his role fit?",
    "What is his career focus?", "Give me a high-level summary", "What is the website tech stack?",
  ]) {
    assert.deepEqual(buildCitationIndex(citations, question).map(entry => entry.href),
      ["/projects/frontier-forge", "/projects/release-guardian"], question);
  }
});

test("explicit evidence requests take precedence over broad profile and technology terms", () => {
  const citations = presetAnswers["home-background"].citations.slice(1);
  for (const question of [
    "技术栈中网关的源码在哪个文件？", "他的背景描述对应哪一行？", "职业方向的证据行号是什么？",
    "Give a tech stack summary with implementation details", "Which source code proves those skills?",
    "Show the files and line numbers behind his background claims", "网站技术栈的实现细节是什么？",
  ]) {
    assert.deepEqual(buildCitationIndex(citations, question).map(entry => entry.href), citations.map(citation => citation.url), question);
  }
});

test("GroupConv evidence destinations have distinct topics and preserve pinned line ranges", () => {
  const prefix = `https://github.com/LucisZhang/groupconv-atlas/blob/${"a".repeat(40)}/results/rtx4090/session-20260908-vast-03/`;
  const files = [
    "analysis-atlas/summary.zh-CN.md#L9-L24",
    "analysis-atlas/summary.zh-CN.md#L21-L30",
    "analysis-supplemental/summary.zh-CN.md#L19-L28",
    "analysis-supplemental/summary.zh-CN.md#L28-L32",
  ];
  const citations = files.map(file => ({
    kind: "public-github", sourceId: `groupconv-atlas:${file}`, url: prefix + file,
    label: { en: "GroupConv Atlas · summary.zh-CN.md · lines 1-32", zh: "GroupConv Atlas · summary.zh-CN.md · 第 1-32 行" },
  }));
  const entries = buildCitationIndex(citations);
  assert.equal(entries.length, 4);
  assert.equal(new Set(entries.map(entry => entry.title.zh)).size, 4);
  assert.deepEqual(entries.map(entry => entry.href), citations.map(citation => citation.url));
  assert.match(entries[0].title.zh, /直接 CUDA/);
  assert.match(entries[1].title.zh, /调优 PyTorch/);
  assert.match(entries[2].title.zh, /MobileNetV2/);
  assert.match(entries[3].title.zh, /插桩/);
  assert.equal(buildCitationIndex([citations[0], citations[0]]).length, 1);
});

test("a GroupConv chunk spanning several sections gets a broad truthful title", () => {
  const [entry] = buildCitationIndex([{
    kind: "public-github", sourceId: "groupconv-atlas:atlas:L1-L30",
    url: `https://github.com/LucisZhang/groupconv-atlas/blob/${"a".repeat(40)}/results/rtx4090/session-20260908-vast-03/analysis-atlas/summary.zh-CN.md#L1-L30`,
    label: { en: "GroupConv Atlas · summary.zh-CN.md · lines 1-30", zh: "GroupConv Atlas · summary.zh-CN.md · 第 1-30 行" },
  }]);
  assert.match(entry.title.zh, /基线对照与采样范围/);
  assert.ok(!entry.title.zh.includes("直接 CUDA 对照"));
  assert.ok(entry.href.endsWith("#L1-L30"));
});

test("overlapping GroupConv evidence ranges do not assign an arbitrary section title", () => {
  const [entry] = buildCitationIndex([{
    kind: "public-github", sourceId: "groupconv-atlas:atlas:L21-L24",
    url: `https://github.com/LucisZhang/groupconv-atlas/blob/${"a".repeat(40)}/results/rtx4090/session-20260908-vast-03/analysis-atlas/summary.zh-CN.md#L21-L24`,
    label: { en: "GroupConv Atlas · summary.zh-CN.md · lines 21-24", zh: "GroupConv Atlas · summary.zh-CN.md · 第 21-24 行" },
  }]);
  assert.match(entry.title.zh, /基线对照与采样范围/);
  assert.ok(!entry.title.zh.includes("直接 CUDA 对照"));
  assert.ok(!entry.title.zh.includes("调优 PyTorch 对照"));
  assert.ok(entry.href.endsWith("#L21-L24"));
});
