import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { gzipSync } from "node:zlib";
import {
  citationsForChunkIds,
  loadPrivateAssistantKnowledge,
  retrieveAssistantKnowledge,
} from "../../src/lib/assistant-retrieval.ts";

function privatePacket() {
  const withoutHash = {
    version: 1,
    sourceCount: 1,
    chunkCount: 2,
    sources: [{ sourceId: "private-1", label: "candidate-profile", contentSha256: "a".repeat(64), chunks: 2 }],
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
  assert.equal(decoded.chunkCount, 2);
  assert.match(decoded.snapshotSha256, /^[a-f0-9]{64}$/u);
  assert.throws(() => loadPrivateAssistantKnowledge(`${encoded.slice(0, -4)}AAAA`));

  const result = retrieveAssistantKnowledge("Why should we hire Xiangguo for an Applied AI role?", encoded);
  assert.ok(result);
  assert.ok(result.chunks.some((chunk) => chunk.kind === "private-profile"));
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
  const citations = citationsForChunkIds(result.chunks, [result.chunks[0].id, "unknown", result.chunks[0].id]);
  assert.equal(citations.length, 1);
});
