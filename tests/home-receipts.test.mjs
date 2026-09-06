import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const receipts = JSON.parse(await readFile(new URL("../src/data/generated/home-receipts.json", import.meta.url), "utf8"));
const generator = await readFile(new URL("../scripts/generate-home-receipts.mjs", import.meta.url), "utf8");

test("home receipts carry an explicit reviewed-content date, not a build clock", () => {
  assert.equal(receipts.contentUpdatedAt, "2026-09-06");
  assert.equal("buildDate" in receipts, false);
  assert.match(receipts.contentUpdatedAt, /^\d{4}-\d{2}-\d{2}$/u);
  assert.match(generator, /--content-updated-at/u);
  assert.match(generator, /timeZone: "Asia\/Shanghai"/u);
  assert.doesNotMatch(generator, /toISOString\(\)/u);
});
