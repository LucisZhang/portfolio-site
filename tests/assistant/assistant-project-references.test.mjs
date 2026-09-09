import assert from "node:assert/strict";
import test from "node:test";
import {
  ASSISTANT_PROJECT_IDS,
  canonicalizeAssistantProjectMentions,
  projectReference,
  validateAssistantAnswerBlocks,
} from "../../src/lib/assistant-project-references.ts";

test("project references use canonical localized destinations", () => {
  assert.deepEqual(projectReference("margin-control-tower", "zh"), {
    id: "margin-control-tower",
    label: "Margin Control Tower",
    href: "/projects/margin-control-tower?lang=zh",
    kind: "portfolio",
  });
  assert.equal(projectReference("release-guardian", "en")?.href, "/projects/release-guardian");
  assert.equal(projectReference("streaming-reliability-lab", "en")?.href, "/projects/exactly-once-drills");
  assert.equal(projectReference("ex-solver", "zh"), null);
  assert.equal(projectReference("Voice-in-Security", "en")?.href, "https://github.com/LucisZhang/Voice-in-Security");
  assert.equal(projectReference("Risk-Control-Portfolio", "en"), null);
  assert.equal(projectReference("unknown", "en"), null);
  assert.equal(ASSISTANT_PROJECT_IDS.length, 13);
});

test("answer block validation accepts only bounded typed project segments", () => {
  assert.deepEqual(validateAssistantAnswerBlocks([
    { type: "heading", segments: [{ type: "text", text: "Strongest match" }] },
    { type: "bullet", segments: [
      { type: "project", projectId: "rag-quality-lab", strong: true },
      { type: "text", text: " provides repeatable evaluation." },
    ] },
  ], "en"), [
    { type: "heading", segments: [{ type: "text", text: "Strongest match" }] },
    { type: "bullet", segments: [
      { type: "project", projectId: "rag-quality-lab", strong: true },
      { type: "text", text: " provides repeatable evaluation." },
    ] },
  ]);
  assert.equal(validateAssistantAnswerBlocks([
    { type: "paragraph", segments: [{ type: "project", projectId: "unknown" }] },
  ], "en"), null);
  assert.equal(validateAssistantAnswerBlocks([
    { type: "paragraph", segments: [{ type: "text", text: "https://example.com" }] },
  ], "en"), null);
  assert.equal(validateAssistantAnswerBlocks(Array.from({ length: 20 }, () => ({
    type: "paragraph",
    segments: [{ type: "text", text: "Grounded evidence." }],
  })), "en")?.length, 20);
  assert.equal(validateAssistantAnswerBlocks(Array.from({ length: 21 }, () => ({
    type: "paragraph",
    segments: [{ type: "text", text: "Grounded evidence." }],
  })), "en"), null);
  assert.equal(validateAssistantAnswerBlocks([{
    type: "paragraph",
    segments: Array.from({ length: 24 }, () => ({ type: "text", text: "Evidence. " })),
  }], "en")?.[0].segments.length, 24);
  assert.equal(validateAssistantAnswerBlocks([{
    type: "paragraph",
    segments: Array.from({ length: 25 }, () => ({ type: "text", text: "Evidence. " })),
  }], "en"), null);
});

test("plain-text known project mentions become canonical project segments", () => {
  assert.deepEqual(canonicalizeAssistantProjectMentions([{
    type: "paragraph",
    segments: [{ type: "text", text: "Compare Release Guardian with Voice-in-Security, then inspect Margin Control Tower。", strong: true }],
  }]), [{
    type: "paragraph",
    segments: [
      { type: "text", text: "Compare ", strong: true },
      { type: "project", projectId: "release-guardian", strong: true },
      { type: "text", text: " with ", strong: true },
      { type: "project", projectId: "Voice-in-Security", strong: true },
      { type: "text", text: ", then inspect ", strong: true },
      { type: "project", projectId: "margin-control-tower", strong: true },
      { type: "text", text: "。", strong: true },
    ],
  }]);
  assert.deepEqual(canonicalizeAssistantProjectMentions([{
    type: "paragraph",
    segments: [{ type: "text", text: "unrelated text" }, { type: "project", projectId: "rag-quality-lab" }],
  }]), [{
    type: "paragraph",
    segments: [{ type: "text", text: "unrelated text" }, { type: "project", projectId: "rag-quality-lab" }],
  }]);
});
