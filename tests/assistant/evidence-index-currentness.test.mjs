import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../../", import.meta.url);

async function bytes(path) {
  return readFile(new URL(path, root));
}

async function json(path) {
  return JSON.parse(await bytes(path));
}

async function sha256(path) {
  return createHash("sha256").update(await bytes(path)).digest("hex");
}

function uniqueRow(index, title) {
  const rows = index.split("\n").filter((line) => line.startsWith(`| ${title} |`));
  assert.equal(rows.length, 1, `EVIDENCE_INDEX.md must contain exactly one ${title} row`);
  return rows[0];
}

test("evidence index HEAD rows match the committed assistant ledger and preset artifacts", async () => {
  const [index, snapshot, questions, answers] = await Promise.all([
    bytes("docs/EVIDENCE_INDEX.md").then(String),
    json("src/data/assistant-knowledge.generated.json"),
    json("src/data/generated/ask-question-bank.json"),
    json("src/data/generated/ask-preset-answers.json"),
  ]);

  const siteRepository = "LucisZhang/portfolio-site";
  const siteFiles = snapshot.files.filter((file) => file.repository === siteRepository);
  const siteChunks = snapshot.chunks.filter((chunk) => chunk.repository === siteRepository);
  const siteCommits = [...new Set(siteFiles.map((file) => file.commit))];
  const questionCount = Object.values(questions)
    .reduce((total, entry) => total + entry.questions.length, 0);
  const answerCount = Object.keys(answers.answers).length;
  const ledgerRow = uniqueRow(index, "HEAD-generated Round-3 assistant source ledger");
  const presetRow = uniqueRow(index, "HEAD-generated Round-3 authored Ask Portfolio presets");

  const ledgerClaim = [
    `Commit-local ledger: ${snapshot.repositoryCount} repositories, ${snapshot.fileCount} reviewed source selections, and ${snapshot.chunkCount.toLocaleString("en-US")} bounded chunks`,
    `snapshot SHA-256 \`${snapshot.snapshotSha256}\``,
    `generated ledger file SHA-256 \`${await sha256("src/data/assistant-knowledge.generated.json")}\``,
    `The portfolio-site selection contributes ${siteFiles.length} selections / ${siteChunks.length} chunks at commit \`${siteCommits[0]}\``,
  ];
  assert.equal(siteCommits.length, 1, "portfolio-site ledger entries must share one pinned commit");
  for (const claim of ledgerClaim) assert.ok(ledgerRow.includes(claim), `EVIDENCE_INDEX.md is stale: ${claim}`);

  const presetClaim = [
    `${Object.keys(questions).length} routes × ${questionCount / Object.keys(questions).length} bilingual questions produce ${questionCount} presets / ${answerCount * 2} localized authored answers`,
    `Generated question projection SHA-256 \`${await sha256("src/data/generated/ask-question-bank.json")}\``,
    `generated answer artifact SHA-256 \`${await sha256("src/data/generated/ask-preset-answers.json")}\``,
  ];
  assert.equal(questionCount, answerCount, "every generated preset question must have one authored answer record");
  for (const claim of presetClaim) assert.ok(presetRow.includes(claim), `EVIDENCE_INDEX.md is stale: ${claim}`);
});
