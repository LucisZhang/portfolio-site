import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const evidenceRoot = resolve(import.meta.dirname, "../public/case-studies/privacy-preflight");
const manifestPath = resolve(evidenceRoot, "manifest.json");
const benchmarkPath = resolve(evidenceRoot, "ocr-fixture-benchmark.json");
const benchmark = JSON.parse(await readFile(benchmarkPath, "utf8"));

const generatedFixtures = [
  "image-example-english.png",
  "image-example-chinese.png",
  "ocr-fixture-small-font.png",
  "ocr-fixture-low-contrast.png",
  "ocr-fixture-multiline.png",
  "ocr-fixture-rotated.png",
  "pdf-example-text-layer.pdf",
  "pdf-example-scanned.pdf",
  "pdf-example-multipage.pdf",
];
const identities = [
  {
    path: "ocr-fixture-benchmark.json",
    generated_at: benchmark.generatedAt,
    source: "scripts/run-privacy-ocr-benchmark.mjs",
  },
  ...generatedFixtures.map((path) => ({
    path,
    generated_at: "2026-07-17",
    source: "scripts/generate-privacy-examples.mjs",
  })),
];

async function withIdentity(identity) {
  const bytes = await readFile(resolve(evidenceRoot, identity.path));
  return {
    ...identity,
    bytes: bytes.byteLength,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const identityPaths = new Set(identities.map((identity) => identity.path));
manifest.assets = [
  ...manifest.assets.filter((asset) => !identityPaths.has(asset.path)),
  ...await Promise.all(identities.map(withIdentity)),
];
manifest.generated_at = "2026-07-17";
delete manifest.source_commit;
delete manifest.source_base_commit;
delete manifest.source_state;
manifest.source_snapshot = "runtime-matching metadata-stripped public source; exact identity is the source ZIP SHA-256 in downloads/release-manifest.json";
manifest.source_sanitization = "internal coordination files, caches, build outputs, editable-install provenance, and first-party Swift debug paths are excluded";
manifest.browser_fixture_identity = {
  generated_examples_source: "scripts/generate-privacy-examples.mjs",
  benchmark_source: "scripts/run-privacy-ocr-benchmark.mjs",
  benchmark_generated_at: benchmark.generatedAt,
  benchmark_summary: benchmark.summary,
  boundary: benchmark.scope,
};

await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
console.log(JSON.stringify(manifest.browser_fixture_identity));
