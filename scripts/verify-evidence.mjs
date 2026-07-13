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
const releaseReplay = await json("public/case-studies/release-guardian/replay/synthetic-scenarios.json");
assert(releaseReplay.fixed_disclosure === "Sanitized deterministic replay — not connected to the private repository or a live model.", "Release replay disclosure drifted");
assert(releaseReplay.seed === "release-guardian-synthetic-replay-v2", "Release synthetic replay seed drifted");
assert(
  JSON.stringify(releaseReplay.scenarios.map((scenario) => scenario.id)) === JSON.stringify(["SYN-AUTH-01", "SYN-SCHEMA-02", "SYN-API-03", "SYN-DEP-04"]),
  "Release synthetic replay fixtures are incomplete",
);
assert(["synthetic", "sanitized", "presentation-layer derivative", "not source evidence"].every((label) => releaseReplay.classification.includes(label)), "Release replay classification is incomplete");
const releaseReplayText = JSON.stringify(releaseReplay);
for (const forbidden of ["/Users/", "/home/", "hsiangkuochang", "scenario_id", "raw_prompt", "private_repository"]) {
  assert(!releaseReplayText.toLowerCase().includes(forbidden.toLowerCase()), `Release synthetic replay contains forbidden private marker: ${forbidden}`);
}

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
const privacyWeb = await json("public/case-studies/privacy-preflight/web-implementation.json");
assert(privacyWeb.status === "presentation_layer_implementation" && privacyWeb.source_evidence === false, "Privacy Web must remain separate from source evidence");
assert(privacyWeb.evidence_modes.includes("synthetic_sandbox") && privacyWeb.evidence_modes.includes("deterministic_verifier"), "Privacy Web evidence modes are incomplete");
assert(Object.values(privacyWeb.processing_boundary).every((value) => value === false || value === "same_origin_get_only"), "Privacy Web processing boundary permits content egress");
assert(privacyWeb.pdf_export.fail_closed && privacyWeb.pdf_export.requires_all_pages_reviewed, "Privacy Web PDF gate must fail closed");
assert(privacyWeb.pdf_export.checks.length === 7, "Privacy Web PDF verification contract is incomplete");
const packageJson = await json("package.json");
for (const [name, version] of Object.entries(privacyWeb.runtime_packages)) {
  assert(packageJson.dependencies[name] === `^${version}`, `Privacy Web runtime version drift: ${name}`);
}

const rag = await json("public/case-studies/rag-quality-lab/c3-timebox/dependency-preflight.json");
assert(rag.results_generated === false && rag.status === "blocked", "RAG C3 must not imply generated metrics");
const ragRegistry = await json("public/case-studies/rag-quality-lab/claim-registry.json");
const ragBaseline = ragRegistry.baseline_manifest;
assert(ragRegistry.evidence_mode === "Deterministic Verifier", "RAG evidence mode drifted");
assert(ragRegistry.public_repository.baseline_commit === "0fc1433" && ragRegistry.public_repository.c2_sync_status === "pending", "RAG public-code sync boundary drifted");
assert(ragRegistry.evidence_checkpoint.commit === "6c887a1", "RAG evidence checkpoint drifted");
assert(ragBaseline.documents === 11309 && ragBaseline.questions === 130 && ragBaseline.tests_passed === 68, "RAG C2 claim floor drifted");
assert(ragBaseline.answer_quality_metrics === null && ragBaseline.c3_results_generated === false && ragBaseline.fallback_metrics_substituted === false, "RAG registry must not imply C3 or answer-quality metrics");
assert(ragBaseline.public_c2_code_synced === false, "RAG public C2 sync must remain pending until the external repository is updated");
const ragC3Claim = ragRegistry.claims.find((claim) => claim.id === "c3.results");
assert(ragC3Claim?.source_sha256 === await sha256("public/case-studies/rag-quality-lab/c3-timebox/dependency-preflight.json"), "RAG C3 registry source hash drifted");
const ragReadmePatch = await readFile(join(root, "docs/external-rag-readme-claim-reconciliation.patch"), "utf8");
assert(ragReadmePatch.includes("From: LucisZhang <179360645+LucisZhang@users.noreply.github.com>"), "RAG README patch author is not sanitized");
assert(!ragReadmePatch.includes("/Users/") && !ragReadmePatch.includes("MacBook-Air.local"), "RAG README patch leaks local identity or paths");

const analytics = await json("public/case-studies/analytics-tandem/links.json");
assert(analytics.projects.length === 3 && analytics.projects.every((item) => item.reachable), "Analytics public-link record is incomplete");
assert(analytics.claim_policy.includes("no dashboard or model metric"), "Analytics metric boundary is missing");
const marginFixture = await json("public/case-studies/margin-control-tower/synthetic-margin-data.json");
const marginContract = await json("public/case-studies/margin-control-tower/data-contract.json");
const marginRegistry = await json("public/case-studies/margin-control-tower/metric-registry.json");
assert(marginFixture.seed === 2026071301 && marginFixture.rows.length === 9_360 && marginFixture.rows.every((row) => row.provenance === "synthetic"), "Margin Control Tower fixture boundary failed");
assert(
  JSON.stringify(marginFixture.dimensions) === JSON.stringify({ weeks: 52, categories: 5, products: 20, regions: 3, channels: 3 }),
  "Margin fixture dimensions drifted",
);
assert(marginFixture.rows.filter((row) => row.period_split === "analysis").length === 7_920, "Margin analysis split drifted");
assert(marginFixture.rows.filter((row) => row.period_split === "holdout").length === 1_440, "Margin holdout split drifted");
assert(marginFixture.rows_sha256 === createHash("sha256").update(JSON.stringify(marginFixture.rows)).digest("hex"), "Margin fixture row hash drifted");
assert(marginContract.checks.length === 10 && marginContract.failure_policy.includes("fails closed"), "Margin data contract is incomplete");
assert(marginRegistry.metrics.length === 4, "Margin metric registry is incomplete");
const creditFixture = await json("public/case-studies/credit-policy-lab/synthetic-credit-data.json");
const creditContract = await json("public/case-studies/credit-policy-lab/policy-contract.json");
assert(creditFixture.seed === 2026071302 && creditFixture.rows.length === 12_000 && creditFixture.rows.every((row) => row.provenance === "synthetic"), "Credit Policy Lab fixture boundary failed");
assert(
  JSON.stringify(creditFixture.dimensions) === JSON.stringify({ applications: 12_000, loans: 9_945, vintages: 12, channels: 3, income_bands: 4, audit_groups: 3, feature_count: 8 }),
  "Credit fixture dimensions drifted",
);
assert(
  JSON.stringify(creditFixture.splits) === JSON.stringify({ train: 6_000, calibration: 3_000, backtest: 3_000 }),
  "Credit fixture splits drifted",
);
assert(creditFixture.rows_sha256 === createHash("sha256").update(JSON.stringify(creditFixture.rows)).digest("hex"), "Credit fixture row hash drifted");
assert(creditContract.checks.length === 10 && creditContract.policy.expected_loss === "selected_pd * lgd * ead", "Credit policy contract is incomplete");

const sourceFiles = (await readdir(join(root, "src"), { recursive: true }))
  .filter((path) => /\.(ts|tsx|css)$/.test(path));
const source = (await Promise.all(sourceFiles.map((path) => readFile(join(root, "src", path), "utf8")))).join("\n");
assert((source.match(/audience:/g) ?? []).length >= 5, "Every project must define an audience");
for (const forbidden of ["498,725", "0.809", "0.944", "Private GitHub", "Sample interface data only", "Telemetry sample"]) {
  assert(!source.includes(forbidden), `Forbidden stale claim remains in src: ${forbidden}`);
}

console.log("Evidence verification passed: Release, p1, RAG, Privacy, Analytics, and source claim boundaries.");
