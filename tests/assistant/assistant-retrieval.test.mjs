import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import test from "node:test";
import { gunzipSync, gzipSync } from "node:zlib";
import { readFileSync } from "node:fs";
import {
  citationsForChunkIds,
  loadPrivateAssistantKnowledge,
  retrieveAssistantKnowledge,
} from "../../src/lib/assistant-retrieval.ts";

const finalRepositoryCommits = new Map([
  ["LucisZhang/release-guardian", "bc7e7fdc6125019ceb6c7aa6e8a7af1084e775fc"],
  ["LucisZhang/rag-quality-lab", "6e3d6a2b040cc9fe4acb7dd4a61295405138f296"],
  ["LucisZhang/privacy-preflight", "510454c2393d274168be0d605d938a8abeb7862d"],
  ["LucisZhang/streaming-reliability-lab", "f323090c36e6b3f84e8cf8e5a1152addedde3410"],
  ["LucisZhang/margin-control-tower", "c84559f1f141bc86b728d5a8133b926ad8529273"],
  ["LucisZhang/credit-policy-desk", "bbad7e0dbf997d7fb64caad5ed3c8bf09e74658e"],
  ["LucisZhang/Voice-in-Security", "81a40142d0f79e8bd8f90db150cd4ffbd4c1a1d8"],
]);
const siteCommit = "346b8a81cbf9a238081ef179eb622ea8f0614466";

test("generated public knowledge is pinned to final releases and the R2 site revision", () => {
  const snapshot = JSON.parse(readFileSync("src/data/assistant-knowledge.generated.json", "utf8"));
  const manifest = JSON.parse(readFileSync("assistant-knowledge/manifest.json", "utf8"));
  for (const [repository, commit] of finalRepositoryCommits) {
    const files = snapshot.files.filter((file) => file.repository === repository);
    const manifestRepository = manifest.repositories.find((candidate) => (
      `${candidate.owner}/${candidate.repo}` === repository
    ));
    assert.ok(manifestRepository, repository);
    assert.deepEqual(files.map((file) => file.path).sort(), [...manifestRepository.files].sort(), repository);
    assert.ok(files.every((file) => file.commit === commit), repository);
  }
  assert.equal(snapshot.files.some((file) => file.repository === "LucisZhang/p1-reliability-lab"), false);
  const siteFiles = snapshot.files.filter((file) => file.repository === "LucisZhang/portfolio-site");
  assert.ok(siteFiles.length >= 100);
  assert.ok(siteFiles.every((file) => file.commit === siteCommit));
  for (const route of [
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
  ]) {
    assert.ok(snapshot.chunks.some((chunk) => chunk.repository === "LucisZhang/portfolio-site" && chunk.aliases.includes(route)), route);
  }
  for (const [route, sourcePath] of [
    ["/", "src/lib/home-stats.ts"],
    ["/", "src/lib/i18n.ts"],
    ["/ai/frontier-forge", "src/lib/frontier-project-detail.ts"],
    ["/ai/release-guardian", "src/components/guardian/GuardianPage.tsx"],
    ["/ai/release-guardian", "public/case-studies/release-guardian/replay/synthetic-scenarios.json"],
    ["/ai/rag-quality-lab", "src/components/ragdiff/RagDiffLab.tsx"],
    ["/ai/privacy-preflight", "src/lib/privacy-localization.ts"],
    ["/analytics/margin-control-tower", "src/components/margin/MarginDetectionFigure.tsx"],
    ["/analytics/credit-policy-desk", "src/components/analytics/AnalyticsMethods.tsx"],
    ["/analytics/credit-policy-desk", "src/components/credit/CreditPolicyFrontier.tsx"],
    ["/analytics/analytics-tandem", "src/components/CaseStudyBlock.tsx"],
  ]) {
    assert.ok(snapshot.chunks.some((chunk) => (
      chunk.repository === "LucisZhang/portfolio-site"
      && chunk.path === sourcePath
      && chunk.aliases.includes(route)
    )), `${route}:${sourcePath}`);
  }
  const tandemMigrationChunks = snapshot.chunks.filter((chunk) => (
    chunk.repository === "LucisZhang/portfolio-site"
    && chunk.content.includes("Analytics Tandem has been split")
  ));
  assert.ok(tandemMigrationChunks.length > 0);
  assert.ok(tandemMigrationChunks.every((chunk) => chunk.aliases.includes("/analytics/analytics-tandem")));
  assert.ok(tandemMigrationChunks.every((chunk) => !chunk.aliases.some((alias) => (
    alias.startsWith("/") && alias !== "/analytics/analytics-tandem"
  ))));
  assert.deepEqual(
    [...new Set(siteFiles.map((file) => file.path).filter((file) => /^docs\/evidence\/digits-[a-z-]+\.md$/u.test(file)))].sort(),
    [
      "docs/evidence/digits-eod.md",
      "docs/evidence/digits-forge.md",
      "docs/evidence/digits-guardian.md",
      "docs/evidence/digits-home.md",
      "docs/evidence/digits-privacy.md",
      "docs/evidence/digits-triage.md",
    ],
  );
});

test("selected project entries preserve full-file integrity metadata", () => {
  const snapshot = JSON.parse(readFileSync("src/data/assistant-knowledge.generated.json", "utf8"));
  const fullProjectsFile = execFileSync("git", ["show", `${siteCommit}:src/lib/projects.ts`], { encoding: "utf8" });
  const fullFileSha256 = createHash("sha256").update(fullProjectsFile).digest("hex");
  const selections = snapshot.files.filter((file) => (
    file.repository === "LucisZhang/portfolio-site" && file.path === "src/lib/projects.ts"
  ));
  assert.equal(selections.length, 11);
  assert.equal(selections.filter((file) => file.selectionSha256 === undefined).length, 1);
  for (const selection of selections) {
    assert.equal(selection.bytes, Buffer.byteLength(fullProjectsFile, "utf8"));
    assert.equal(selection.sha256, fullFileSha256);
    if (selection.selectionSha256 !== undefined) {
      assert.match(selection.selectionSha256, /^[a-f0-9]{64}$/u);
      assert.ok(selection.selectionBytes > 0 && selection.selectionBytes < selection.bytes);
    }
  }
  const chunks = snapshot.chunks.filter((chunk) => (
    chunk.repository === "LucisZhang/portfolio-site" && chunk.path === "src/lib/projects.ts"
  ));
  assert.ok(chunks.every((chunk) => chunk.fileSha256 === fullFileSha256));
  const commitTimestamp = execFileSync("git", ["show", "-s", "--format=%cI", siteCommit, "--"], { encoding: "utf8" }).trim();
  assert.equal(snapshot.generatedAt, new Date(commitTimestamp).toISOString());
});

test("site identity grounding excludes private contact values", () => {
  const snapshot = JSON.parse(readFileSync("src/data/assistant-knowledge.generated.json", "utf8"));
  const siteConfig = execFileSync("git", ["show", `${siteCommit}:src/lib/site-config.ts`], { encoding: "utf8" });
  const profileBlock = siteConfig.match(/profiles:\s*\{([\s\S]*?)\n\s*\},\n\s*resume:/u)?.[1];
  assert.ok(profileBlock);
  const contactValues = [...profileBlock.matchAll(/^\s*(?:linkedin|email|phone|phoneHref|wechat):\s*"([^"]+)"/gmu)]
    .map((match) => match[1]);
  assert.equal(contactValues.length, 5);
  const siteContent = snapshot.chunks
    .filter((chunk) => chunk.repository === "LucisZhang/portfolio-site")
    .map((chunk) => chunk.content)
    .join("\n");
  const result = retrieveAssistantKnowledge("Who is Xiangguo Zhang, and what kind of work does he do?");
  assert.ok(result);
  for (const value of contactValues) {
    assert.equal(siteContent.includes(value), false);
    assert.equal(result.grounding.includes(value), false);
  }
});

test("offline assistant cache fails closed on identity and manifest tampering", () => {
  const result = spawnSync(process.execPath, ["scripts/build-assistant-knowledge.mjs", "--self-test-cache"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /assistant knowledge cache self-test passed: 52 files, 496 chunks/u);
});

test("generated public knowledge has globally unique chunk IDs", () => {
  const snapshot = JSON.parse(readFileSync("src/data/assistant-knowledge.generated.json", "utf8"));
  assert.equal(new Set(snapshot.chunks.map((chunk) => chunk.id)).size, snapshot.chunks.length);
});

function privatePacket() {
  const withoutHash = {
    version: 1,
    sourceCount: 2,
    chunkCount: 3,
    sources: [
      { sourceId: "private-1", label: "candidate-profile", contentSha256: "a".repeat(64), chunks: 2 },
      { sourceId: "private-2", label: "internship-evidence", contentSha256: "b".repeat(64), chunks: 1 },
    ],
    chunks: [
      {
        id: "private-1:L1-L10",
        sourceId: "private-1",
        label: "candidate-profile",
        lineStart: 1,
        lineEnd: 10,
        content: "Xiangguo Zhang studies Data Science and Big Data Technology at Beijing Institute of Technology and targets Applied AI and data roles.",
      },
      {
        id: "private-1:L8-L20",
        sourceId: "private-1",
        label: "candidate-profile",
        lineStart: 8,
        lineEnd: 20,
        content: "章向国重视证据、自动化和端到端交付，适合 AI 应用、数据工程与数据分析岗位。",
      },
      {
        id: "private-2:L1-L8",
        sourceId: "private-2",
        label: "internship-evidence",
        lineStart: 1,
        lineEnd: 8,
        content: "DiDi Fintech AI-safety internship: red-team experiments and an automated adversarial-sample pipeline, with scope and duration stated separately.",
      },
    ],
  };
  const payload = {
    ...withoutHash,
    snapshotSha256: createHash("sha256").update(JSON.stringify(withoutHash)).digest("hex"),
  };
  return gzipSync(Buffer.from(JSON.stringify(payload))).toString("base64");
}

test("private candidate packet is bounded, hash-checked, and never exposes a path citation", () => {
  const encoded = privatePacket();
  const decoded = loadPrivateAssistantKnowledge(encoded);
  assert.equal(decoded.chunkCount, 3);
  assert.match(decoded.snapshotSha256, /^[a-f0-9]{64}$/u);
  const tampered = JSON.parse(gunzipSync(Buffer.from(encoded, "base64")).toString("utf8"));
  tampered.chunks[0].content += " tampered";
  assert.throws(() => loadPrivateAssistantKnowledge(
    gzipSync(Buffer.from(JSON.stringify(tampered))).toString("base64"),
  ));

  const result = retrieveAssistantKnowledge("Why should we hire Xiangguo for an Applied AI role?", encoded);
  assert.ok(result);
  assert.ok(result.chunks.some((chunk) => chunk.kind === "private-profile"));
  assert.ok(result.chunks.some((chunk) => /DiDi Fintech AI-safety internship/u.test(chunk.content)));
  const privateChunk = result.chunks.find((chunk) => chunk.kind === "private-profile");
  assert.equal(privateChunk.citation.url, undefined);
  assert.equal(privateChunk.citation.label.en, "Verified private candidate materials");
});

test("retrieval handles English and Chinese project questions with pinned GitHub citations", () => {
  for (const question of [
    "How did the streaming reliability lab verify Flink recovery?",
    "RAG Quality Lab 如何做确定性评估？",
    "Margin Control Tower 如何使用 Olist 数据？",
  ]) {
    const result = retrieveAssistantKnowledge(question);
    assert.ok(result, question);
    assert.ok(result.chunks.length >= 1);
    assert.ok(result.chunks.some((chunk) => chunk.kind === "public-github"));
    for (const chunk of result.chunks.filter((candidate) => candidate.kind === "public-github")) {
      assert.match(chunk.citation.url, /^https:\/\/github\.com\/LucisZhang\/[A-Za-z0-9._-]+\/blob\/[a-f0-9]{40}\//u);
      assert.doesNotMatch(chunk.citation.url, /\/blob\/main\//u);
    }
  }
});

test("retrieval refuses unrelated questions and citation mapping accepts only retrieved IDs", () => {
  assert.equal(retrieveAssistantKnowledge("What is the weather on Neptune tomorrow?"), null);
  const result = retrieveAssistantKnowledge("Tell me about Privacy Preflight.");
  assert.ok(result);
  assert.equal(result.chunks.some((chunk) => /macOS|SwiftUI|Gatekeeper|notari[sz]|Mac (?:app|download|version)|Mac 版/iu.test(chunk.content)), false);
  const citations = citationsForChunkIds(result.chunks, [result.chunks[0].id, "unknown", result.chunks[0].id]);
  assert.equal(citations.length, 1);
});
