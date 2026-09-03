import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  citationsForChunkIds,
  retrieveAssistantKnowledge,
} from "../../src/lib/assistant-retrieval.ts";

import {
  relevantClaimsByQuestion,
  relevantPathsByQuestion,
} from "../../assistant-knowledge/question-bank-relevance.mjs";
import {
  buildAuthoredAnswers,
  verifyAuthoredBank,
} from "../../scripts/lib/ask-authored-answers.mjs";

// Task R14 [CLAUDE]: the presets are AUTHORED answers (owner ruling:
// "预置问题的答案，你就直接根据对项目的了解去写"). The recomposition
// assertions of the R11 verbatim-extract mechanism are retired with the
// mechanism itself; what this suite enforces instead:
//   - the routed question set still retrieves route-relevant, reviewed
//     evidence with pinned public citations (the live typed-question path
//     depends on that retrieval, and it keeps every preset honest as a
//     question the knowledge base can actually support);
//   - the authored bank passes the grounding gate (every numeric claim in
//     both locales traces to a named committed source file; en/zh numeric
//     parity; 2-4 curated, commit-pinned citations per answer);
//   - the committed generated artifacts are exactly what the bank + the
//     pinned manifest re-derive right now.

const REPO_ROOT = path.resolve(import.meta.dirname, "../..");
const QUESTION_BANK_PATH = "src/data/generated/ask-question-bank.json";
const PRESET_ANSWERS_PATH = "src/data/generated/ask-preset-answers.json";
const SOURCE_BANK_PATH = "assistant-knowledge/question-bank.json";
const MANIFEST_PATH = "assistant-knowledge/manifest.json";
const expectedRoutes = [
  "/",
  "/ai/frontier-forge",
  "/ai/privacy-preflight",
  "/ai/rag-quality-lab",
  "/ai/release-guardian",
  "/ai/triage-router",
  "/analytics/analytics-tandem",
  "/analytics/credit-policy-desk",
  "/analytics/margin-control-tower",
  "/engineering/crossover-study",
  "/engineering/exactly-once-drills",
];

function loadJson(relativePath) {
  return JSON.parse(readFileSync(path.join(REPO_ROOT, relativePath), "utf8"));
}

const questionBank = loadJson(QUESTION_BANK_PATH);
const presetAnswers = loadJson(PRESET_ANSWERS_PATH);
const sourceBank = loadJson(SOURCE_BANK_PATH);
const manifest = loadJson(MANIFEST_PATH);

test("generated question bank covers home and every routable project page", () => {
  assert.deepEqual(Object.keys(questionBank).sort(), expectedRoutes);
  for (const route of expectedRoutes) {
    assert.equal(questionBank[route].questions.length, 3, route);
  }
});

test("authored bank passes the grounding gate: every number traces to its named committed source", () => {
  const failures = verifyAuthoredBank(sourceBank, manifest, REPO_ROOT);
  assert.deepEqual(failures, [], failures.join("\n"));
});

test("committed generated artifacts match a fresh derivation from the authored bank", () => {
  const derivedAnswers = buildAuthoredAnswers(sourceBank, manifest);
  assert.deepEqual(presetAnswers.answers, derivedAnswers, "ask-preset-answers.json is stale — run npm run generate:ask-question-bank");
  const derivedBank = Object.fromEntries(Object.entries(sourceBank).map(([route, entry]) => [
    route,
    { questions: entry.questions.map(({ id, q_en, q_zh }) => ({ q_en, q_zh, id })) },
  ]));
  assert.deepEqual(questionBank, derivedBank, "ask-question-bank.json is stale — run npm run generate:ask-question-bank");
});

for (const route of expectedRoutes) {
  const questions = questionBank[route]?.questions ?? [];
  for (const question of questions) {
    for (const locale of ["en", "zh"]) {
      const text = question[`q_${locale}`];
      test(`${route} ${question.id} ${locale} retrieves route-relevant cited knowledge`, () => {
        assert.deepEqual(Object.keys(question).sort(), ["id", "q_en", "q_zh"]);
        assert.equal(typeof text, "string");
        assert.ok(text.trim().length >= 8);

        const result = retrieveAssistantKnowledge(text);
        assert.ok(result, `${route} ${locale}: ${text}`);
        const relevantChunks = result.chunks.filter((chunk) => (
          chunk.repository === "LucisZhang/portfolio-site"
          && chunk.aliases.includes(route)
        ));
        assert.ok(relevantChunks.length > 0, `${route} ${locale} retrieved no route-matched R2 site chunk`);
        const expectedPaths = relevantPathsByQuestion[question.id];
        assert.ok(expectedPaths, `${question.id} has no reviewed relevance expectation`);
        const expectedClaim = relevantClaimsByQuestion[question.id];
        assert.ok(expectedClaim, `${question.id} has no reviewed claim expectation`);
        const evidenceChunks = relevantChunks.filter((chunk) => expectedPaths.some((chunkPath) => (
          chunk.citation.label.en.includes(` · ${chunkPath} · `)
        )) && expectedClaim.test(chunk.content));
        assert.ok(evidenceChunks.length > 0, `${route} ${locale} retrieved no question-relevant R2 source`);

        const citations = citationsForChunkIds(result.chunks, evidenceChunks.map((chunk) => chunk.id));
        assert.ok(citations.length > 0, `${route} ${locale} produced no citation`);
        assert.ok(citations.every((citation) => (
          citation.kind === "public-github"
          && typeof citation.url === "string"
          && citation.url.startsWith(`https://github.com/LucisZhang/portfolio-site/blob/${manifest.siteRepository.commit}/`)
        )), `${route} ${locale} produced a non-public or unpinned citation`);

        // Task R14: the committed authored answer for this preset+locale.
        const record = presetAnswers.answers?.[question.id];
        const preset = record?.[locale];
        assert.ok(preset, `${question.id} ${locale} has no authored preset answer`);
        assert.ok(preset.segments.length > 0 && preset.segments.length <= 4);
        assert.ok(record.citations.length >= 2 && record.citations.length <= 4);
        for (const segment of preset.segments) {
          assert.ok(Number.isInteger(segment.ref) && segment.ref >= 1 && segment.ref <= record.citations.length,
            `${question.id} ${locale} segment ref outside its citation range`);
        }
        assert.ok(record.citations.every((citation) => (
          citation.kind === "public-github"
          && typeof citation.url === "string"
          && /^https:\/\/github\.com\/LucisZhang\/[A-Za-z0-9._-]+\/blob\/[a-f0-9]{40}\//u.test(citation.url)
        )), `${question.id} ${locale} carries a non-public or unpinned citation`);
        // Destination-mapping rules (task B5-c): external citations must be
        // pinned to a manifest repository commit; internal ones must carry
        // the portfolio-site sourceId shape the navigation index maps to a
        // site route (never surfaced as a raw portfolio-site file link).
        for (const citation of record.citations) {
          if (citation.sourceId.startsWith("portfolio-site:")) {
            assert.match(citation.sourceId, /^portfolio-site:[a-z0-9-]+:/u);
          } else {
            const repository = manifest.repositories.find((entry) => citation.url.startsWith(
              `https://github.com/${entry.owner}/${entry.repo}/blob/${entry.commit}/`,
            ));
            assert.ok(repository, `${question.id} ${locale} cites a repository not pinned in the manifest: ${citation.url}`);
          }
        }
      });
    }
  }
}

test("preset answers artifact covers exactly the bank's question ids", () => {
  assert.deepEqual(
    Object.keys(presetAnswers.answers).sort(),
    Object.values(questionBank).flatMap((entry) => entry.questions.map((question) => question.id)).sort(),
  );
});
