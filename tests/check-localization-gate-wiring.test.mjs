import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

// F4 wired `verify:zh-glyphs` into the `check:localization` npm script chain so
// the release gate cannot silently ship a stale zh font subset. This test
// guards against that wiring being dropped or reordered in a future edit.
test("check:localization chain includes lint-copy, check-localization, and verify-zh-glyphs in order", async () => {
  const packageJsonPath = path.resolve("package.json");
  const pkg = JSON.parse(await readFile(packageJsonPath, "utf8"));
  const chain = pkg.scripts?.["check:localization"] ?? "";

  const lintIndex = chain.indexOf("scripts/lint-copy.mjs");
  const localizationIndex = chain.indexOf("scripts/check-localization.mjs");
  const glyphsIndex = chain.indexOf("scripts/verify-zh-glyphs.mjs");

  assert.notEqual(lintIndex, -1, "check:localization must run scripts/lint-copy.mjs");
  assert.notEqual(localizationIndex, -1, "check:localization must run scripts/check-localization.mjs");
  assert.notEqual(glyphsIndex, -1, "check:localization must run scripts/verify-zh-glyphs.mjs");

  assert.ok(lintIndex < localizationIndex, "lint-copy must run before check-localization");
  assert.ok(localizationIndex < glyphsIndex, "check-localization must run before verify-zh-glyphs");

  assert.match(chain, /&&/, "check:localization steps must be chained with && so a failure short-circuits the gate");
});
