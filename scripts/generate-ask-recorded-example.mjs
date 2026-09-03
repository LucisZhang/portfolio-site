import { writeFile } from "node:fs/promises";
import questionBankData from "../src/data/generated/ask-question-bank.json" with { type: "json" };
import { retrieveAssistantKnowledge } from "../src/lib/assistant-retrieval.ts";

// Task L5 [CLAUDE]: /ai/ask-portfolio (the dialogue-genre "Ask Portfolio"
// page) opens on a pre-filled example exchange, matching the user-approved
// mock (output/design-genres/genre-ask-dialogue.html). Two honest options
// were on the table for that pre-filled turn (see task-L5-report.md):
// (a) freeze one real retrieval run at build/dev time behind a "RECORDED"
// label, or (b) fire a live model call client-side on every page load. (b)
// also fails the no-JS requirement (tests/e2e/ask-r2.spec.ts asserts the
// example still renders with JavaScript disabled) and would spend a real
// OpenRouter call — and rate-limit budget — on every visit with no user
// intent behind it. This script implements (a), and only (a): it calls the
// SAME retrieval function the live /api/assistant route calls
// (src/lib/assistant-retrieval.ts's retrieveAssistantKnowledge, a local
// keyword/BM25 ranking over the committed public knowledge snapshot --
// no network, no model, no API key needed), for one real verified bank
// question, and freezes the result. No prose is synthesized: the "answer"
// is the verbatim siteMetadata.description string this ranks to the top
// of its own committed source (src/lib/site-config.ts), not a generated
// sentence -- so there is nothing here an LLM invented.
//
// Rerun `npm run generate:ask-recorded-example` after `npm run
// build:assistant-knowledge` regenerates src/data/assistant-knowledge.generated.json,
// so the frozen excerpt and its citation (including the pinned commit SHA
// in citation.url) stay in sync with the live retrieval index. If the
// expected chunk disappears (the source file moved/changed enough to
// re-chunk), this script throws instead of silently freezing something
// stale -- update QUESTION_ID/EXPECTED_PATH_FRAGMENT by hand and re-run.

const outputUrl = new URL("../src/data/generated/ask-recorded-example.json", import.meta.url);
// Task R10 (2026-09-02 knowledge re-pin): after re-pinning the site to
// cbbd371 the re-chunked snapshot no longer ranks a site-config.ts chunk in
// the top results for "home-site-overview"; "home-background" still ranks
// the siteMetadata chunk (src/lib/site-config.ts:L60-L69, which holds the
// description literal frozen below), so the recorded example now freezes
// that question's run instead -- same mechanism, same source file.
const QUESTION_ID = "home-background";
const EXPECTED_PATH_FRAGMENT = "src/lib/site-config.ts";

const homeEntry = questionBankData["/"];
if (!homeEntry) throw new Error('ask-question-bank.json is missing its "/" route');
const question = homeEntry.questions.find((candidate) => candidate.id === QUESTION_ID);
if (!question) throw new Error(`ask-question-bank.json's "/" route no longer has question id "${QUESTION_ID}"`);

const result = retrieveAssistantKnowledge(question.q_en);
if (!result) throw new Error(`retrieveAssistantKnowledge returned no result for "${question.q_en}"`);

const chunk = result.chunks.find((candidate) => candidate.citation.label.en.includes(EXPECTED_PATH_FRAGMENT));
if (!chunk) {
  throw new Error(`retrieval for "${question.q_en}" no longer surfaces a ${EXPECTED_PATH_FRAGMENT} chunk -- update this script's QUESTION_ID/EXPECTED_PATH_FRAGMENT to a still-real, still-retrieved chunk instead of hand-editing the output JSON`);
}

const descriptionMatch = chunk.content.match(/description:\s*\{\s*en:\s*"([^"]+)",\s*zh:\s*"([^"]+)"/u);
if (!descriptionMatch) {
  throw new Error(`could not find a description: { en: "...", zh: "..." } literal inside the retrieved ${EXPECTED_PATH_FRAGMENT} chunk -- the source shape changed, update this script's extraction regex`);
}
const [, answerEn, answerZh] = descriptionMatch;

const record = {
  generator: "scripts/generate-ask-recorded-example.mjs",
  mechanism: "offline retrieval only (src/lib/assistant-retrieval.ts retrieveAssistantKnowledge) -- no model call, no network request, reproducible with no API key",
  question: { id: question.id, q_en: question.q_en, q_zh: question.q_zh },
  answer: { en: answerEn, zh: answerZh },
  citation: chunk.citation,
  publicSnapshotSha256: result.publicSnapshotSha256,
};

const serialized = `${JSON.stringify(record, null, 2)}\n`;

if (process.argv.includes("--check")) {
  const { readFile } = await import("node:fs/promises");
  const existing = await readFile(outputUrl, "utf8").catch(() => null);
  if (existing !== serialized) {
    console.error("src/data/generated/ask-recorded-example.json is stale -- run `npm run generate:ask-recorded-example`.");
    process.exit(1);
  }
  console.log("ask-recorded-example.json is up to date.");
} else {
  await writeFile(outputUrl, serialized);
  console.log(`Wrote ${outputUrl.pathname}`);
}
