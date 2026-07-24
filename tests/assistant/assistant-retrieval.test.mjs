import assert from "node:assert/strict";
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
  ["LucisZhang/release-guardian", "1be4af55301b6d4a2c1c98b1850a820b698208bb"],
  ["LucisZhang/rag-quality-lab", "88879a286104d4fe0941c07d75230610093996d3"],
  ["LucisZhang/privacy-preflight-web", "47eef37aa2aa39198c26f10fd5480c90274091ff"],
  ["LucisZhang/streaming-reliability-lab", "eda2a7c156059678ecae8c57f4452ef98bd9ae89"],
  ["LucisZhang/margin-control-tower", "bd68e65b676593dff46c5fec41a8f4879ce5066c"],
  ["LucisZhang/credit-policy-lab", "53dfd853c9b2d70476ed3b9250a7acdf01777887"],
]);

test("generated public knowledge is pinned to all six final repository releases", () => {
  const snapshot = JSON.parse(readFileSync("src/data/assistant-knowledge.generated.json", "utf8"));
  for (const [repository, commit] of finalRepositoryCommits) {
    const files = snapshot.files.filter((file) => file.repository === repository);
    assert.ok(files.length >= 2, repository);
    assert.ok(files.every((file) => file.commit === commit), repository);
    assert.ok(files.some((file) => file.path === "README.md"), repository);
    assert.ok(files.some((file) => file.path === "README.zh-CN.md"), repository);
  }
  assert.equal(snapshot.files.some((file) => file.repository === "LucisZhang/p1-reliability-lab"), false);
  assert.equal(snapshot.files.some((file) => file.repository === "LucisZhang/portfolio-site"), false);
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
    "RAG 质量实验室如何做确定性评估？",
    "毛利控制塔如何使用 Olist 数据？",
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
