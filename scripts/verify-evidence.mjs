import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function json(path) {
  return JSON.parse(await readFile(join(root, path), "utf8"));
}

async function sha256(path) {
  const data = await readFile(join(root, path));
  return createHash("sha256").update(data).digest("hex");
}

async function verifyManifest(manifestPath) {
  const manifest = await json(manifestPath);
  const base = dirname(manifestPath);
  for (const asset of manifest.assets) {
    const actual = await sha256(join(base, asset.path));
    assert(actual === asset.sha256, `${manifestPath}: hash mismatch for ${asset.path}`);
  }
  return manifest;
}

const release = await verifyManifest("public/case-studies/release-guardian/manifest.json");
assert(release.status === "candidate_for_human_review", "Release package must remain publication-gated");
assert(release.approval.publication_or_deploy === "not approved", "Release publication gate changed unexpectedly");

const p1 = await verifyManifest("public/case-studies/p1-reliability-lab/results/u6-local-mac/manifest.json");
assert(p1.result.failure_classes.length === 5, "p1 must retain all five induced failure classes");
assert(p1.result.passed && p1.result.all_snapshot_diffs_zero && p1.result.all_event_id_audits_consistent, "p1 U6 result contract failed");
const p1Index = await json("public/case-studies/p1-reliability-lab/results/index.json");
assert(p1Index.artifacts.length === 5, "p1 historical artifact index must retain all five exports");
const reproductionGuide = await readFile(join(root, "public/case-studies/p1-reliability-lab/workstation-reproduction-guide.md"), "utf8");
assert(reproductionGuide.includes("make eo-verify ARGS=\"--failure all\""), "p1 reproduction guide is incomplete");

const privacy = await verifyManifest("public/case-studies/privacy-preflight/manifest.json");
assert(privacy.fixture_policy.includes("fictional"), "Privacy demo fixture is not marked fictional");
const pdf = await json("public/case-studies/privacy-preflight/pdf-redaction-result.json");
assert(pdf.validation.safe && pdf.post_export_text_layer_empty, "Privacy PDF red-line validation failed");

const rag = await json("public/case-studies/rag-quality-lab/c3-timebox/dependency-preflight.json");
assert(rag.results_generated === false && rag.status === "blocked", "RAG C3 must not imply generated metrics");

const analytics = await json("public/case-studies/analytics-tandem/links.json");
assert(analytics.projects.length === 3 && analytics.projects.every((item) => item.reachable), "Analytics public-link record is incomplete");
assert(analytics.claim_policy.includes("no dashboard or model metric"), "Analytics metric boundary is missing");

const sourceFiles = (await readdir(join(root, "src"), { recursive: true }))
  .filter((path) => /\.(ts|tsx|css)$/.test(path));
const source = (await Promise.all(sourceFiles.map((path) => readFile(join(root, "src", path), "utf8")))).join("\n");
assert((source.match(/audience:/g) ?? []).length >= 5, "Every project must define an audience");
for (const forbidden of ["498,725", "0.809", "0.944", "Private GitHub", "Sample interface data only", "Telemetry sample"]) {
  assert(!source.includes(forbidden), `Forbidden stale claim remains in src: ${forbidden}`);
}

console.log("Evidence verification passed: Release, p1, RAG, Privacy, Analytics, and source claim boundaries.");
