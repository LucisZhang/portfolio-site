import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument } from "pdf-lib";

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

async function verifyFileRecord(record, context) {
  const projectPath = record.path.startsWith("/")
    ? join("public", record.path.slice(1))
    : record.path;
  const data = await readFile(join(root, projectPath));
  assert(data.byteLength === record.bytes, `${context}: byte-length mismatch for ${record.path}`);
  const actual = createHash("sha256").update(data).digest("hex");
  assert(actual === record.sha256, `${context}: hash mismatch for ${record.path}`);
}

async function verifyManifest(manifestPath) {
  const manifest = await json(manifestPath);
  const base = dirname(manifestPath);
  for (const asset of manifest.assets) {
    const data = await readFile(join(root, base, asset.path));
    const actual = createHash("sha256").update(data).digest("hex");
    assert(actual === asset.sha256, `${manifestPath}: hash mismatch for ${asset.path}`);
    if (asset.bytes !== undefined) {
      assert(data.byteLength === asset.bytes, `${manifestPath}: byte-length mismatch for ${asset.path}`);
    }
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
assert(!("source_commit" in privacy), "Privacy manifest must not mislabel the source snapshot as a committed source state");
assert(!("source_base_commit" in privacy), "Privacy manifest must not expose an unrelated portfolio base as source provenance");
assert(privacy.source_snapshot === "runtime-matching metadata-stripped public source; exact identity is the source ZIP SHA-256 in downloads/release-manifest.json", "Privacy source-snapshot identity boundary drifted");
assert(privacy.source_sanitization === "internal coordination files, caches, build outputs, editable-install provenance, and first-party Swift debug paths are excluded", "Privacy source-sanitization boundary drifted");
const requiredPrivacyAssets = [
  "ocr-fixture-benchmark.json",
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
const privacyAssetsByPath = new Map(privacy.assets.map((asset) => [asset.path, asset]));
for (const path of requiredPrivacyAssets) {
  const asset = privacyAssetsByPath.get(path);
  assert(asset, `Privacy manifest is missing browser fixture identity: ${path}`);
  assert(Number.isInteger(asset.bytes) && asset.bytes > 0, `Privacy manifest is missing byte identity: ${path}`);
  assert(/^[a-f0-9]{64}$/.test(asset.sha256), `Privacy manifest has an invalid hash identity: ${path}`);
  assert(typeof asset.generated_at === "string" && asset.generated_at.length > 0, `Privacy manifest is missing generation date: ${path}`);
  assert(typeof asset.source === "string" && asset.source.length > 0, `Privacy manifest is missing generation source: ${path}`);
}
const privacyBenchmark = await json("public/case-studies/privacy-preflight/ocr-fixture-benchmark.json");
assert(privacyBenchmark.fixedFixtureSet === true, "Privacy OCR benchmark fixture set must remain fixed");
assert(privacyBenchmark.preprocessing.includes("complete multi-pass union"), "Privacy OCR benchmark no longer records the complete multi-pass union");
assert(
  JSON.stringify(privacyBenchmark.summary) === JSON.stringify({
    fixtures: 7,
    expectedCount: 19,
    hitCount: 19,
    detectedCount: 21,
    falsePositiveCount: 2,
    recall: 1,
    precision: 0.9047619047619048,
  }),
  "Privacy OCR benchmark summary drifted",
);
for (const fixture of privacyBenchmark.fixtures) {
  const expectedPasses = fixture.id === "rotated"
    ? ["0:contrast", "0:threshold", "270:contrast", "270:threshold"]
    : ["0:contrast", "0:threshold"];
  assert(
    JSON.stringify(fixture.passes.map((pass) => `${pass.rotation}:${pass.mode}`)) === JSON.stringify(expectedPasses),
    `Privacy OCR benchmark pass matrix is incomplete for ${fixture.id}`,
  );
  const completeUnion = [...new Set(fixture.passes.flatMap((pass) => pass.detected))];
  assert(JSON.stringify(fixture.detected) === JSON.stringify(completeUnion), `Privacy OCR benchmark did not persist the full pass union for ${fixture.id}`);
}
assert(
  JSON.stringify(privacy.browser_fixture_identity?.benchmark_summary) === JSON.stringify(privacyBenchmark.summary),
  "Privacy manifest benchmark summary does not match the benchmark artifact",
);
const privacyPdfPageCounts = {
  "pdf-example-text-layer.pdf": 1,
  "pdf-example-scanned.pdf": 1,
  "pdf-example-multipage.pdf": 3,
};
for (const [path, expectedPages] of Object.entries(privacyPdfPageCounts)) {
  const document = await PDFDocument.load(await readFile(join(root, "public/case-studies/privacy-preflight", path)));
  assert(document.getPageCount() === expectedPages, `Privacy PDF fixture page count drifted: ${path}`);
}
const privacyRelease = await json("public/case-studies/privacy-preflight/downloads/release-manifest.json");
assert(privacyRelease.schemaVersion === 2, "Privacy release manifest schema drifted");
assert(privacyRelease.artifacts.length === 2, "Privacy release manifest must identify both app and source archives");
const expectedPrivacyCompanions = [
  "CPython-LICENSE.txt",
  "DEPENDENCIES.lock",
  "PRIVACY.md",
  "README.md",
  "THIRD_PARTY_NOTICES.md",
  "sbom.spdx.json",
];
assert(
  JSON.stringify(privacyRelease.companionFiles.map((record) => record.path.split("/").at(-1)).sort()) === JSON.stringify(expectedPrivacyCompanions),
  "Privacy release companion-file inventory drifted",
);
for (const record of [...privacyRelease.artifacts, ...privacyRelease.companionFiles]) {
  await verifyFileRecord(record, "Privacy release manifest");
}
assert(privacyRelease.verification.ocrFixtureBenchmark.includes("19/19 exact expected values; 2 false positives"), "Privacy release manifest benchmark claim drifted");
const privacySbom = await json("public/case-studies/privacy-preflight/downloads/sbom.spdx.json");
assert(privacySbom.spdxVersion === "SPDX-2.3", "Privacy runtime SBOM format drifted");
assert(privacySbom.packages.length === 26 && privacySbom.relationships.length === 26, "Privacy runtime SBOM inventory is incomplete");
const privacySbomPackages = new Map(privacySbom.packages.map((item) => [item.name, item]));
assert(privacySbomPackages.get("CPython")?.versionInfo === "3.12.13", "Privacy runtime SBOM CPython identity drifted");
assert(privacySbomPackages.has("pypdfium2") && privacySbomPackages.has("PDFium"), "Privacy runtime SBOM is missing the replacement PDF engine");
assert(!privacySbomPackages.has("PyMuPDF") && !privacySbomPackages.has("fitz"), "Privacy runtime SBOM contains the removed PDF engine");
const normalizePackageName = (value) => value.toLocaleLowerCase().replace(/[_. ]+/g, "-");
const privacyLockedDependencies = (await readFile(join(root, "public/case-studies/privacy-preflight/downloads/DEPENDENCIES.lock"), "utf8"))
  .trim()
  .split(/\r?\n/)
  .map((line) => line.split("=="));
assert(privacyLockedDependencies.length === privacySbom.packages.length, "Privacy runtime SBOM does not cover the dependency lock");
const normalizedSbomPackages = new Map(privacySbom.packages.map((item) => [normalizePackageName(item.name), item]));
for (const [name, version] of privacyLockedDependencies) {
  const item = normalizedSbomPackages.get(normalizePackageName(name));
  assert(item?.versionInfo === version, `Privacy runtime SBOM does not match the lock for ${name}`);
  assert(typeof item.licenseDeclared === "string" && item.licenseDeclared.length > 0, `Privacy runtime SBOM is missing license metadata for ${name}`);
  if (normalizePackageName(name) !== "privacy-preflight-worker") {
    assert(item.licenseDeclared !== "NOASSERTION", `Privacy runtime SBOM has no declared dependency license for ${name}`);
  }
}
assert(
  privacyRelease.sbom.path === "/case-studies/privacy-preflight/downloads/sbom.spdx.json"
    && privacyRelease.sbom.format === privacySbom.spdxVersion
    && privacyRelease.sbom.packages === privacySbom.packages.length,
  "Privacy release manifest SBOM summary drifted",
);
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
for (const forbidden of ["498,725", "0.944", "Private GitHub", "Sample interface data only", "Telemetry sample"]) {
  assert(!source.includes(forbidden), `Forbidden stale claim remains in src: ${forbidden}`);
}
const proofSource = await readFile(join(root, "src/components/ProjectProof.tsx"), "utf8");
assert(proofSource.includes("Historical small-scale result") && proofSource.includes("0.8093 → 0.9438"), "RAG historical result is missing or altered");
assert(
  proofSource.includes("Historical 12-question corpus only; does not transfer to the 11,309-document S1 checkpoint."),
  "RAG historical result is missing its non-transfer boundary",
);

console.log("Evidence verification passed: Release, p1, RAG, Privacy, Analytics, and source claim boundaries.");
