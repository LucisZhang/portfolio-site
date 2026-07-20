import assert from "node:assert/strict";
import fs from "node:fs/promises";

const moduleSource = await fs.readFile(new URL("./structural-copy.ts", import.meta.url), "utf8");
const overlay = await import(`data:text/javascript;base64,${Buffer.from(moduleSource).toString("base64")}`);
const fixture = JSON.parse(await fs.readFile(new URL("./structural-copy.test-fixture.json", import.meta.url), "utf8"));
assert.equal(overlay.STRUCTURAL_COPY_METADATA.recordCount, 392);
assert.equal(overlay.STRUCTURAL_COPY_METADATA.templateCount, 29);
for (const item of fixture.exact_cases) {
  assert.equal(overlay.localizeStructuralValue(item.en, "zh"), item.zh, item.en);
  assert.equal(overlay.localizeStructuralValue(item.en, "en"), item.en, item.en);
}
for (const item of fixture.reverse_cases) assert.equal(overlay.canonicalizeStructuralValue(item.zh), item.en, item.zh);
for (const item of fixture.template_cases) assert.equal(overlay.localizeStructuralValue(item.runtime_en, "zh"), item.expected_zh, item.key);
for (const item of fixture.capture_cases) assert.equal(overlay.localizeStructuralCapture(item.value, item.locale), item.expected, item.value);
console.log(`STRUCTURAL_COPY_TEST_PASS exact=${fixture.exact_cases.length} templates=${fixture.template_cases.length} reverse=${fixture.reverse_cases.length}`);
