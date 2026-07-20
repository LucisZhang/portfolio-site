import assert from "node:assert/strict";
import test from "node:test";
import { USER_FACING_ERROR_KEYS, userFacingError } from "../../src/lib/user-facing-error.ts";

test("finite runtime error copy is paired in English and Chinese", () => {
  for (const key of USER_FACING_ERROR_KEYS) {
    const en = userFacingError(key, "en");
    const zh = userFacingError(key, "zh");
    assert.ok(en.length > 0, `${key} needs English copy`);
    assert.match(zh, /[\u3400-\u9fff]/u, `${key} needs Chinese copy`);
    assert.doesNotMatch(zh, /Failed|NetworkError|returned|Unexpected token/iu);
  }
});

test("unknown technical messages fail closed to a stable domain fallback", () => {
  const raw = "NetworkError: Failed to fetch; endpoint returned 503";
  assert.equal(userFacingError(raw, "en", "dataset"), "Dataset unavailable.");
  assert.equal(userFacingError(raw, "zh", "dataset"), "数据集不可用。");
  assert.equal(userFacingError(raw, "zh"), "证据加载失败。");
});
