import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { PROJECT_IDENTITIES, findProjectMentions, mentionedProjectIds, normalizeProjectAlias, projectIdentityNames, resolveProjectIdentity } from "../../src/lib/project-identities.ts";
import { assistantProjectActions, canonicalizeAssistantProjectMentions, projectReference, validateAssistantAnswerBlocks } from "../../src/lib/assistant-project-references.ts";
import { getRouteQuestionBankEntries } from "../../src/lib/ask-question-bank.ts";
import { buildCitationIndex } from "../../src/lib/assistant-citation-index.ts";
import { retrieveAssistantKnowledge } from "../../src/lib/assistant-retrieval.ts";
import { resolveAssistantPublicProject } from "../../src/lib/assistant-public-sources.ts";
import { protectAssistantOutput } from "../../src/lib/assistant-policy.ts";
import { routableProjects } from "../../src/lib/projects.ts";
import { verifyAuthoredBank } from "../../scripts/lib/ask-authored-answers.mjs";

const read = (file) => JSON.parse(readFileSync(new URL(`../../${file}`, import.meta.url), "utf8"));
const manifest = read("assistant-knowledge/manifest.json");
const bank = read("assistant-knowledge/question-bank.json");
const answers = read("src/data/generated/ask-preset-answers.json").answers;
const matrix = {
  "frontier-forge": "/ai/frontier-forge",
  "release-guardian": "/ai/release-guardian",
  "exactly-once-drills": "/engineering/exactly-once-drills",
  "rag-quality-lab": "/ai/rag-quality-lab",
  "triage-router": "/ai/triage-router",
  "privacy-preflight": "/ai/privacy-preflight",
  "margin-control-tower": "/analytics/margin-control-tower",
  "crossover-study": "/engineering/crossover-study",
  "ask-portfolio": "/ai/ask-portfolio",
  "credit-policy-desk": "/analytics/credit-policy-desk",
  "analytics-tandem": "/#archive",
  "Voice-in-Security": "https://github.com/LucisZhang/Voice-in-Security",
};
const localized = (href, locale) => locale === "en" || href.startsWith("https:") ? href : href.replace(/(?=#|$)/u, "?lang=zh");

test("every published project has one reviewed semantic identity and catalog title", () => {
  assert.deepEqual(Object.keys(PROJECT_IDENTITIES).sort(), Object.keys(matrix).sort());
  assert.deepEqual(routableProjects.map((p) => p.slug).sort(), Object.keys(matrix).filter((id) => id !== "Voice-in-Security").sort());
  for (const project of routableProjects) {
    const identity = resolveProjectIdentity(project.slug);
    assert.equal(identity.route, `/${project.track}/${project.slug}`);
    assert.deepEqual(identity.label, project.title);
  }
});

const owners = new Map();
for (const [id, href] of Object.entries(matrix)) {
  for (const name of projectIdentityNames(id)) {
    for (const locale of ["en", "zh"]) {
      test(`${locale} identity ${name} resolves to ${id} in answers, actions and references`, () => {
        const key = normalizeProjectAlias(name);
        assert.ok(!owners.has(key) || owners.get(key) === id, `collision: ${name}`);
        owners.set(key, id);
        for (const variant of new Set([name, name.toUpperCase(), name.replace(/[ _-]+/gu, "—")])) {
          const question = locale === "en" ? `Explain ${variant}.` : `请介绍${variant}。`;
          assert.equal(resolveProjectIdentity(variant)?.id, id);
          assert.deepEqual(mentionedProjectIds(question), [id]);
          assert.equal(projectReference(variant, locale)?.href, localized(href, locale));
          const actions = assistantProjectActions(question, locale);
          assert.deepEqual(actions.map((a) => a.href), [localized(href, locale)]);
          const blocks = canonicalizeAssistantProjectMentions([{ type: "paragraph", segments: [{ type: "text", text: question }] }]);
          assert.deepEqual(blocks[0].segments.filter((s) => s.type === "project").map((s) => s.projectId), [id]);
          assert.equal(validateAssistantAnswerBlocks([{ type: "paragraph", segments: [{ type: "project", projectId: variant }] }], locale)?.[0].segments[0].projectId, id);
        }
      });
    }
  }
  for (const route of [PROJECT_IDENTITIES[id].route, ...PROJECT_IDENTITIES[id].routeAliases].filter(Boolean)) {
    test(`route and citation key ${route} preserve the known identity`, () => {
      for (const suffix of ["", "/", "?lang=zh", "#evidence"]) {
        assert.equal(resolveProjectIdentity(`${route}${suffix}`)?.id, id);
        assert.equal(projectReference(`${route}${suffix}`, "zh")?.href, localized(href, "zh"));
        assert.deepEqual(getRouteQuestionBankEntries(`${route}${suffix}`), getRouteQuestionBankEntries(PROJECT_IDENTITIES[id].route));
      }
      const entry = buildCitationIndex([{
        sourceId: `portfolio-site:${route.slice(1).replaceAll("/", "-")}:src/lib/projects.ts:L1-L20`,
        kind: "public-github", label: { en: "Internal source", zh: "内部来源" },
        url: `https://github.com/LucisZhang/portfolio-site/blob/${manifest.siteRepository.commit}/src/lib/projects.ts#L1-L20`,
      }]);
      assert.equal(entry[0].href, href);
      assert.equal(entry[0].kind, "site");
    });
  }
}

test("every manifest alias is either its own identity or topic vocabulary, never another project", () => {
  for (const source of [...manifest.siteSources, ...manifest.repositories]) {
    const expected = resolveProjectIdentity(source.route ?? source.repo)?.id;
    if (!expected) continue; // The site-wide source is not a project identity.
    for (const alias of [source.label.en, source.label.zh, ...source.aliases]) {
      const mentions = mentionedProjectIds(alias);
      assert.ok(mentions.length === 0 || (mentions.length === 1 && mentions[0] === expected), `${alias} collides with ${expected}`);
      const exact = resolveProjectIdentity(alias);
      if (exact) assert.equal(exact.id, expected, alias);
    }
  }
});

test("all existing bilingual preset questions, answer names and citations have deterministic destinations", () => {
  for (const [route, entry] of Object.entries(bank)) {
    for (const question of entry.questions) {
      const answer = answers[question.id];
      assert.equal(answer.route, route);
      assert.ok(getRouteQuestionBankEntries(route).some((q) => q.id === question.id));
      for (const locale of ["en", "zh"]) {
        if (route !== "/") {
          const id = resolveProjectIdentity(route).id;
          assert.deepEqual(mentionedProjectIds(question[`q_${locale}`]), [id]);
          assert.deepEqual(assistantProjectActions(question[`q_${locale}`], locale).map((a) => a.href), [localized(matrix[id], locale)]);
        }
        for (const segment of answer[locale].segments) {
          for (const mention of findProjectMentions(segment.text)) {
            assert.equal(projectReference(mention.text, locale)?.href, localized(matrix[mention.id], locale));
          }
        }
      }
      const index = buildCitationIndex(answer.citations);
      for (const citation of question.answer.citations) {
        if (citation.site) {
          const href = citation.site === "/" ? "/" : matrix[resolveProjectIdentity(citation.site).id];
          assert.ok(index.some((item) => item.href === href), `${question.id}: ${citation.site}`);
        }
      }
    }
  }
});

test("generator rejects misrouted names, duplicate presets, unknown citations and raw answer URLs", () => {
  const badBanks = [
    (copy) => { copy["/ai/triage-router"].questions[0].q_en = "What does Release Guardian do?"; },
    (copy) => { copy["/ai/triage-router"].questions[0].q_zh = "Credit Policy Lab 为什么说一个分数还不是策略？"; },
    (copy) => { copy["/"].questions[1].q_en = copy["/"].questions[0].q_en; },
    (copy) => { copy["/"].questions[0].answer.citations[0].site = "/ai/unknown"; },
    (copy) => { copy["/"].questions[0].answer.en[0].text += " https://unsafe.example"; },
  ];
  for (const mutate of badBanks) {
    const copy = structuredClone(bank);
    mutate(copy);
    assert.ok(verifyAuthoredBank(copy, manifest, new URL("../..", import.meta.url).pathname).length > 0);
  }
});

test("technical labels and ambiguous/private names remain text", () => {
  for (const text of ["Gateway", "Serving", "Stream", "Storage", "Orchestration", "RAG", "Iceberg", "Flink", "p1", "Risk-Control-Portfolio", "ex-solver", "Frontier", "credits", "XFrontier Forge", "Release Guardians", "frontier-forged"]) {
    assert.equal(resolveProjectIdentity(text), null, text);
    assert.deepEqual(mentionedProjectIds(text), [], text);
  }
  for (const url of ["https://evil.example/ai/frontier-forge", "//evil.example", "javascript:alert(1)"]) assert.equal(projectReference(url, "en"), null);
});

test("comparisons preserve every named project in order and the historical pack rejects cross-project ambiguity", () => {
  assert.deepEqual(assistantProjectActions("Compare p1-reliability-lab with Triage Router, then Streaming Reliability Lab.", "en").map((a) => a.id), ["exactly-once-drills", "triage-router"]);
  for (const id of Object.keys(matrix).filter((id) => id !== "exactly-once-drills")) {
    assert.equal(resolveAssistantPublicProject(`Compare Streaming Reliability Lab and ${PROJECT_IDENTITIES[id].label.en}.`), "ambiguous", id);
  }
});

test("all historical names prioritize the corresponding pinned project evidence", () => {
  for (const id of Object.keys(matrix).filter((id) => id !== "ask-portfolio")) {
    for (const alias of projectIdentityNames(id)) {
      const result = retrieveAssistantKnowledge(`Explain ${alias}.`);
      assert.ok(result, alias);
      assert.equal(result.chunks[0].projectId, id, alias);
      assert.match(result.chunks[0].citation.url, /\/blob\/[a-f0-9]{40}\//u);
    }
  }
});

test("expanded model identities keep unsafe URLs and unpinned citations rejected", () => {
  const chunks = retrieveAssistantKnowledge("Explain Frontier Forge.").chunks;
  for (const [id, href] of Object.entries(matrix)) {
    for (const locale of ["en", "zh"]) {
      const response = { blocks: [{ type: "paragraph", segments: [{ type: "project", projectId: id }] }], citation_ids: [chunks[0].id], confidence: "partial" };
      const protectedAnswer = protectAssistantOutput(JSON.stringify(response), chunks, locale);
      assert.equal(protectedAnswer.ok, true, id);
      assert.equal(projectReference(protectedAnswer.blocks[0].segments[0].projectId, locale)?.href, localized(href, locale));
      response.blocks[0].segments.push({ type: "text", text: " https://unsafe.example" });
      assert.equal(protectAssistantOutput(JSON.stringify(response), chunks, locale).ok, false);
      response.blocks[0].segments.pop();
      response.citation_ids = ["unknown-source"];
      assert.deepEqual(protectAssistantOutput(JSON.stringify(response), chunks, locale), { ok: false, rejection: "invalid_citations" });
    }
  }
});
