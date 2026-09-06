import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { resolveProjectIdentity } from "../src/lib/project-identities.ts";
import {
  buildAuthoredAnswers,
  verifyAuthoredBank,
} from "./lib/ask-authored-answers.mjs";

// Task R14 [CLAUDE]: the Ask Portfolio presets are AUTHORED answers.
// Owner ruling (2026-09-03): "预置问题的答案，你就直接根据对项目的了解去写"
// — the answers in assistant-knowledge/question-bank.json are prose written
// by the author from the projects' committed evidence, not retrieval
// extracts (which the R11 mechanism assembled before this ruling). What is
// machine-enforced instead of the verbatim-extract property:
//   - every numeric claim in every answer (both locales) must trace to a
//     named committed source file via the per-answer grounding notes, and
//     --check re-verifies each string against the file content;
//   - en and zh carry an identical numeric-token set;
//   - citations are 2-4 curated destinations (site project routes, or
//     pinned files of manifest-pinned repositories) in the exact
//     AssistantCitation shape the B5-c navigation index maps.
// Clicking a preset still performs no model call and no network request —
// the answer is committed, rendered instantly, and labeled as a preset
// answer (预置回答), never as retrieval output.

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceUrl = new URL("../assistant-knowledge/question-bank.json", import.meta.url);
const manifestUrl = new URL("../assistant-knowledge/manifest.json", import.meta.url);
const outputUrl = new URL("../src/data/generated/ask-question-bank.json", import.meta.url);
const answersOutputUrl = new URL("../src/data/generated/ask-preset-answers.json", import.meta.url);
const reviewDocUrl = new URL("../output/r3-align/b5b-authored-answers.md", import.meta.url);

function questionBankProjection(bank) {
  // Ship just route aliases beside the preset chips. Full name matching stays
  // in the assistant chunk, outside the homepage's initial payload.
  const projection = {};
  for (const [route, entry] of Object.entries(bank)) {
    projection[route] = {
      aliases: [...(resolveProjectIdentity(route)?.routeAliases ?? [])],
      questions: entry.questions.map(({ id, q_en, q_zh }) => ({ q_en, q_zh, id })),
    };
  }
  return projection;
}

function reviewDoc(bank, answers) {
  const lines = [
    "# Authored Ask Portfolio preset answers — owner record (task R14)",
    "",
    "Written directly from project knowledge per the owner ruling; every numeric claim is",
    "machine-verified against the committed source files named in each answer's grounding",
    "notes (`scripts/generate-ask-question-bank.mjs --check` re-runs that gate).",
    "",
    "Question rewording log:",
    "- `eod-failures` (zh): 「演练了哪十类故障？」 → 「演练了哪些故障？」 — the question",
    "  presupposed the reader wants the full enumeration; simplified per the owner's",
    "  \"预设问题要简单\" direction. No other question changed.",
    "",
  ];
  for (const [route, entry] of Object.entries(bank)) {
    lines.push(`## ${route}`, "");
    for (const question of entry.questions) {
      const record = answers[question.id];
      lines.push(`### ${question.id}`, "");
      for (const locale of ["en", "zh"]) {
        lines.push(`- **Q (${locale})** ${locale === "en" ? question.q_en : question.q_zh}`);
        for (const segment of record[locale].segments) {
          lines.push(`  - [${segment.ref}] ${segment.text}`);
        }
      }
      lines.push("- **Destinations**");
      for (const citation of record.citations) {
        lines.push(`  - ${citation.sourceId.startsWith("portfolio-site:") ? `site route (${citation.sourceId})` : citation.url}`);
      }
      lines.push("- **Grounding**");
      for (const note of question.answer.grounding) {
        lines.push(`  - ${note.file}: ${note.contains.map((needle) => `"${needle}"`).join(", ")}`);
      }
      lines.push("");
    }
  }
  return lines.join("\n");
}

const bank = JSON.parse(await readFile(sourceUrl, "utf8"));
const manifest = JSON.parse(await readFile(manifestUrl, "utf8"));

const failures = verifyAuthoredBank(bank, manifest, repositoryRoot);
if (failures.length > 0) {
  console.error(`Authored question bank failed the grounding gate (${failures.length} failure${failures.length === 1 ? "" : "s"}):`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

const answers = buildAuthoredAnswers(bank, manifest);
const serialized = `${JSON.stringify(questionBankProjection(bank), null, 2)}\n`;
const answersRecord = {
  generator: "scripts/generate-ask-question-bank.mjs",
  mechanism: "authored preset answers (assistant-knowledge/question-bank.json) -- written by the author from the projects' committed evidence; every numeric claim is machine-verified against its named source file by the generator's grounding gate; citations are curated pinned destinations; no model call, no network request on click",
  answers,
};
const answersSerialized = `${JSON.stringify(answersRecord, null, 2)}\n`;

if (process.argv.includes("--check")) {
  const current = await readFile(outputUrl, "utf8").catch(() => "");
  if (current !== serialized) {
    console.error("Generated Ask Portfolio question bank is stale. Run npm run generate:ask-question-bank.");
    process.exitCode = 1;
  }
  const currentAnswers = await readFile(answersOutputUrl, "utf8").catch(() => "");
  if (currentAnswers !== answersSerialized) {
    console.error("Generated Ask Portfolio preset answers are stale. Run npm run generate:ask-question-bank.");
    process.exitCode = 1;
  }
  if (process.exitCode !== 1) {
    console.log(`Ask Portfolio authored bank verified: ${Object.keys(bank).length} routes, ${Object.keys(answers).length} presets, grounding gate green.`);
  }
} else {
  await writeFile(outputUrl, serialized, "utf8");
  await writeFile(answersOutputUrl, answersSerialized, "utf8");
  if (!process.argv.includes("--skip-review")) {
    await mkdir(new URL(".", reviewDocUrl), { recursive: true });
    await writeFile(reviewDocUrl, reviewDoc(bank, answers), "utf8");
  }
  console.log(`Wrote ${outputUrl.pathname}: ${Object.keys(bank).length} routes, ${Object.keys(bank).length * 3} questions`);
  console.log(`Wrote ${answersOutputUrl.pathname}: ${Object.keys(answers).length} presets × 2 locales, grounding gate green`);
  if (!process.argv.includes("--skip-review")) console.log(`Wrote ${reviewDocUrl.pathname} (owner review artifact, gitignored)`);
}
