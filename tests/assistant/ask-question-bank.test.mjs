import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { resolveProjectIdentity } from "../../src/lib/project-identities.ts";
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
  expandCitation,
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
// Sorted, because the coverage test compares it against a sorted key list.
const expectedRoutes = [
  "/",
  "/projects/analytics-tandem",
  "/projects/credit-policy-desk",
  "/projects/crossover-study",
  "/projects/exactly-once-drills",
  "/projects/frontier-forge",
  "/projects/groupconv-atlas",
  "/projects/margin-control-tower",
  "/projects/privacy-preflight",
  "/projects/rag-quality-lab",
  "/projects/release-guardian",
  "/projects/triage-router",
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
    assert.equal(questionBank[route].questions.length, route === "/projects/groupconv-atlas" ? 4 : 3, route);
  }
});

test("authored bank passes the grounding gate: every number traces to its named committed source", () => {
  const failures = verifyAuthoredBank(sourceBank, manifest, REPO_ROOT);
  assert.deepEqual(failures, [], failures.join("\n"));
});

// Task B4 [CLAUDE]: the destination rule. verifyAuthoredBank RETURNS its
// failures (it never throws) and its early return demands that the bank's key
// set equal the manifest's eleven routes exactly, so a hand-built one-route
// fixture would be rejected before reaching the rule under test. Clone the
// real bank and swap ONE citation in place instead: the key set, the
// per-answer citation count, the segment refs and the grounding notes all
// stay valid, and only the destination under test changes.
//
// forge-overview is the mutation site for every case below. Both of its
// citations are {site, file} evidence pins today, so it contributes no
// destination failure of its own, and its prose names no project at all
// (mentionedProjectIds returns []), which is what the sibling rule needs.
const FORGE_ROUTE = "/projects/frontier-forge";

function destinationFailures(citation) {
  const bank = structuredClone(sourceBank);
  const question = bank[FORGE_ROUTE].questions.find((entry) => entry.id === "forge-overview");
  question.answer.citations[0] = citation;
  return verifyAuthoredBank(bank, manifest, REPO_ROOT);
}

test("destination rule: a page-level self-citation is rejected", () => {
  const failures = destinationFailures({ site: FORGE_ROUTE });
  assert.ok(
    failures.includes("forge-overview: cites its own page with no section anchor"),
    failures.join("\n"),
  );
});

test("destination rule: an anchored same-page citation is accepted", () => {
  // deepEqual, not "no failure mentioning forge-overview": a rule that
  // over-rejects a legitimate deep link has to fail here. Asserted on the
  // DELTA against the untouched bank, because the bank still carries Task
  // B5's backlog of destination failures — deepEqual on the raw array would
  // be red no matter what this rule does, which is an assertion that cannot
  // tell pass from fail. The delta is falsifiable today and stays exactly as
  // strict about over-rejection once B5 clears the backlog.
  const baseline = verifyAuthoredBank(sourceBank, manifest, REPO_ROOT);
  const failures = destinationFailures({ site: FORGE_ROUTE, anchor: "exhibit-05" });
  const introduced = failures.filter((failure) => !baseline.includes(failure));
  assert.deepEqual(introduced, [], introduced.join("\n"));
});

test("destination rule: an unearned sibling citation is rejected", () => {
  const failures = destinationFailures({ site: "/projects/triage-router" });
  assert.ok(
    failures.includes("forge-overview: links to /projects/triage-router, which is not named in the answer"),
    failures.join("\n"),
  );
});

test("destination rule: an anchor that is not a section of the destination rail is rejected", () => {
  // forgeRail.ts declares exhibit-01 through exhibit-07.
  const failures = destinationFailures({ site: FORGE_ROUTE, anchor: "exhibit-09" });
  assert.ok(
    failures.includes(`forge-overview: anchor "exhibit-09" is not a section of ${FORGE_ROUTE}`),
    failures.join("\n"),
  );
});

test("destination rule: a bare home-index citation from a project route is rejected", () => {
  // The hole the other rules miss: the route differs, so the self-citation
  // rule stays quiet, and resolveProjectIdentity("/") is null, so the sibling
  // rule stays quiet too.
  const failures = destinationFailures({ site: "/" });
  assert.ok(
    failures.includes("forge-overview: links to the home index, which answers no project question"),
    failures.join("\n"),
  );
});

test("destination rule: an evidence pin may not carry a section anchor", () => {
  // {site, file} and {site, anchor} differ by one key, and expandCitation
  // routes the former through the GitHub branch, which never reads .anchor.
  // Authoring both keys must fail rather than silently drop the anchor.
  const failures = destinationFailures({
    site: FORGE_ROUTE,
    file: "src/components/forge/ForgePage.tsx",
    anchor: "exhibit-05",
  });
  assert.ok(
    failures.includes("forge-overview: {site, file} citations are evidence links and cannot carry an anchor"),
    failures.join("\n"),
  );
});

test("destination rule: a self-citation through a retired route alias is rejected", () => {
  // resolveProjectIdentity() accepts each page's routeAliases, so the old
  // /ai/frontier-forge URL is the same page as /projects/frontier-forge and
  // citing it from that page is a self-citation, not a sibling link.
  const failures = destinationFailures({ site: "/ai/frontier-forge" });
  assert.ok(
    failures.includes("forge-overview: cites its own page with no section anchor"),
    failures.join("\n"),
  );
});

// D03: project claims prefer the project's own immutable evidence. A site-specific
// metric remains separately cited when the reviewed upstream version differs.
for (const [route, id, file] of [
  ["/projects/credit-policy-desk", "credit-thresholds", "src/components/analytics/CreditPolicyLab.tsx"],
  ["/projects/margin-control-tower", "margin-overview", "README.md"],
]) {
  test(`${id}: first citation opens the project's pinned evidence`, () => {
    const { answer } = sourceBank[route].questions.find((question) => question.id === id);
    const repo = route.split("/").at(-1);
    assert.deepEqual(answer.citations[0], { repo, file });
    const pin = manifest.repositories.find((entry) => entry.repo === repo);
    assert.equal(expandCitation(answer.citations[0], manifest).url,
      `https://github.com/${pin.owner}/${repo}/blob/${pin.commit}/${file}`);
  });
}

test("site-specific fixture and OCR figures retain their distinct evidence", () => {
  const credit = sourceBank["/projects/credit-policy-desk"].questions.find((q) => q.id === "credit-thresholds").answer;
  assert.deepEqual(credit.citations[1], { site: "/projects/credit-policy-desk", file: "src/lib/projects.ts" });
  assert.match(credit.en.find((segment) => segment.ref === 2).text, /345.*165/);
  assert.deepEqual(credit.citations[2], { repo: "credit-policy-desk", file: "README.md" });
  const privacy = sourceBank["/projects/privacy-preflight"].questions.find((q) => q.id === "privacy-ocr").answer;
  assert.equal(privacy.citations[0].file, "public/case-studies/privacy-preflight/ocr-fixture-benchmark.json");
});

test("margin scenario remains separate from the fitted observational coefficient", () => {
  const { answer } = sourceBank["/projects/margin-control-tower"].questions.find((q) => q.id === "margin-boundaries");
  assert.match(answer.en[0].text, /does not use the separately fitted elasticity coefficient/);
  assert.match(answer.zh[0].text, /不使用单独拟合的弹性系数/);
  assert.ok(answer.grounding.some((note) => note.file === "src/components/analytics/MarginControlTower.tsx"));
});

test("Forge teacher cost and training outcomes cite their own supporting files", () => {
  const { answer } = sourceBank["/projects/frontier-forge"].questions.find((q) => q.id === "forge-training-result");
  assert.deepEqual(answer.citations[1], { site: "/", file: "src/lib/site-config.ts" });
  assert.deepEqual(answer.citations[2], { repo: "frontier-forge", file: "MODEL_CARD.md" });
  for (const locale of ["en", "zh"]) {
    assert.match(answer[locale].find((segment) => segment.ref === 2).text, /12\.7/);
    assert.match(answer[locale].find((segment) => segment.ref === 3).text, /14\.2/);
  }
});

test("committed generated artifacts match a fresh derivation from the authored bank", () => {
  const derivedAnswers = buildAuthoredAnswers(sourceBank, manifest);
  assert.deepEqual(presetAnswers.answers, derivedAnswers, "ask-preset-answers.json is stale — run npm run generate:ask-question-bank");
  const derivedBank = Object.fromEntries(Object.entries(sourceBank).map(([route, entry]) => [
    route,
    { aliases: [...(resolveProjectIdentity(route)?.routeAliases ?? [])], questions: entry.questions.map(({ id, q_en, q_zh }) => ({ q_en, q_zh, id })) },
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
          chunk.repository === (route === "/projects/groupconv-atlas" ? "LucisZhang/groupconv-atlas" : "LucisZhang/portfolio-site")
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
          && citation.url.startsWith(route === "/projects/groupconv-atlas" ? `https://github.com/LucisZhang/groupconv-atlas/blob/${manifest.repositories.find(r => r.repo === "groupconv-atlas").commit}/` : `https://github.com/LucisZhang/portfolio-site/blob/${manifest.siteRepository.commit}/`)
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
          } else if (citation.sourceId.startsWith("portfolio-evidence:")) {
            assert.ok(citation.url.startsWith(
              `https://github.com/${manifest.siteRepository.owner}/${manifest.siteRepository.repo}/blob/${manifest.siteRepository.commit}/`,
            ), `${question.id} ${locale} carries unpinned portfolio evidence: ${citation.url}`);
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

test("GroupConv presets cite distinct experiments rather than two README translations", () => {
  const bank = JSON.parse(readFileSync("assistant-knowledge/question-bank.json", "utf8"));
  const manifest = JSON.parse(readFileSync("assistant-knowledge/manifest.json", "utf8"));
  const repository = manifest.repositories.find(entry => entry.repo === "groupconv-atlas");
  assert.ok(!repository.files.includes("README.zh-CN.md"));
  assert.ok(!repository.files.includes("docs/CONTRIBUTIONS.md"));
  for (const question of bank["/projects/groupconv-atlas"].questions) {
    const citations = question.answer.citations.map(spec => expandCitation(spec, manifest));
    assert.equal(new Set(citations.map(citation => citation.url + (citation.anchor ?? ""))).size, citations.length);
    assert.ok(citations.every(citation => !citation.label.en.includes("README")));
    for (const spec of question.answer.citations.filter(spec => spec.repo)) {
      assert.ok(spec.evidence, `${question.id}: repository evidence must target reviewed lines`);
      assert.match(expandCitation(spec, manifest).url, /#L\d+-L\d+$/);
    }
    assert.ok(!question.answer.en.some(segment => /bilingual source documentation/i.test(segment.text)));
  }
});

test("GroupConv reviewed citation rejects an unrelated path or unknown evidence key", () => {
  const manifest = JSON.parse(readFileSync("assistant-knowledge/manifest.json", "utf8"));
  assert.throws(() => expandCitation({ repo: "groupconv-atlas", file: "README.md", evidence: "atlas-direct" }, manifest), /Unknown GroupConv/);
  assert.throws(() => expandCitation({ repo: "groupconv-atlas", file: "README.md", evidence: "invented" }, manifest), /Unknown GroupConv/);
});

test("GroupConv evidence anchors retain their reviewed source bytes and boundary text", () => {
  const evidence = JSON.parse(readFileSync("src/data/groupconv-citation-evidence.json", "utf8"));
  const snapshot = JSON.parse(readFileSync("src/data/assistant-knowledge.generated.json", "utf8"));
  const manifest = JSON.parse(readFileSync("assistant-knowledge/manifest.json", "utf8"));
  const commit = manifest.repositories.find(entry => entry.repo === "groupconv-atlas").commit;
  for (const [id, entry] of Object.entries(evidence)) {
    const file = snapshot.files.find(file => file.repository === "LucisZhang/groupconv-atlas" && file.path === entry.path);
    assert.ok(file, `${id}: rebuild the public knowledge snapshot to include the reviewed evidence`);
    assert.equal(file.commit, commit, `${id}: evidence must use the current manifest commit`);
    // A changed byte invalidates the manually reviewed line anchors, even if
    // the document happens to retain the same heading elsewhere.
    assert.equal(file.sha256, entry.sourceSha256, `${id}: source changed; review the line anchors`);
    const chunks = snapshot.chunks.filter(chunk => chunk.repository === file.repository && chunk.path === entry.path);
    for (const [line, text] of [[entry.lineStart, entry.startText], [entry.lineEnd, entry.endText]]) {
      assert.ok(chunks.some(chunk => chunk.lineStart <= line && chunk.lineEnd >= line && chunk.content.includes(text)), `${id}: missing boundary text at line ${line}`);
    }
  }
});
