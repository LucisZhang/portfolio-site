import assert from "node:assert/strict";
import test from "node:test";

// tests/assistant/ts-loader.mjs: extensionless relative imports resolve .ts
// first and fall back to .tsx only when the .ts file does not exist; every
// other resolution error must surface unchanged.
test("extensionless import resolves a .tsx module through the loader", async () => {
  const wrap = await import("../src/lib/zh-wrap");
  assert.equal(typeof wrap.zhWrapText, "function");
  const phrase = await import("../src/lib/zh-phrase");
  assert.equal(typeof phrase.zhPhraseTokens, "function");
});

test("a missing module still reports ERR_MODULE_NOT_FOUND", async () => {
  await assert.rejects(() => import("../src/lib/does-not-exist"), (error) => error.code === "ERR_MODULE_NOT_FOUND");
});
