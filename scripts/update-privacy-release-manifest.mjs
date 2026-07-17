import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const releaseRoot = resolve(import.meta.dirname, "../public/case-studies/privacy-preflight/downloads");
const benchmarkPath = resolve(import.meta.dirname, "../public/case-studies/privacy-preflight/ocr-fixture-benchmark.json");
const publicPrefix = "/case-studies/privacy-preflight/downloads/";

async function fileRecord(name) {
  const bytes = await readFile(resolve(releaseRoot, name));
  return {
    path: publicPrefix + name,
    bytes: bytes.byteLength,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}

const appArchive = "Privacy-Preflight-0.1.0-macOS-arm64-unnotarized.zip";
const sourceArchive = "Privacy-Preflight-0.1.0-source.zip";
const companionNames = [
  "README.md",
  "PRIVACY.md",
  "THIRD_PARTY_NOTICES.md",
  "DEPENDENCIES.lock",
  "CPython-LICENSE.txt",
  "sbom.spdx.json",
];
const benchmark = JSON.parse(await readFile(benchmarkPath, "utf8"));
const sbom = JSON.parse(await readFile(resolve(releaseRoot, "sbom.spdx.json"), "utf8"));
const manifestGeneratedAt = "2026-07-17T10:57:47.470Z";

const report = {
  schemaVersion: 2,
  release: "0.1.0",
  generatedAt: manifestGeneratedAt,
  scope: "Local unnotarized Apple-silicon preview; not a general OCR or legal-grade redaction claim.",
  artifacts: await Promise.all([fileRecord(appArchive), fileRecord(sourceArchive)]),
  bundle: {
    minimumMacOS: "14.0",
    architecture: "arm64",
    rawAppDiskUsageKiB: 94840,
    machOFiles: 37,
    allMachOThinArm64: true,
    embeddedPython: "3.12.13",
    compiledVisionHelper: true,
    signature: "ad-hoc",
    developerIdSigned: false,
    notarized: false,
    stapledTicket: false,
    staplerValidation: "kLSDataUnavailableErr (ticket validation unavailable in this environment)",
    gatekeeperAcceptanceEstablished: false,
    spctlAssessment: "Code Signing subsystem internal error; no accept/reject result",
  },
  verification: {
    workerTests: "95 passed under the exact embedded runtime before release pruning",
    ocrFixtureBenchmark: benchmark.summary.hitCount + "/" + benchmark.summary.expectedCount + " exact expected values; " + benchmark.summary.falsePositiveCount + " false positives across " + benchmark.summary.fixtures + " fixed synthetic fixtures using the complete browser-equivalent multi-pass union",
    isolatedPathSmoke: "PATH=/bin; bundled Vision OCR found EMAIL, PHONE, and LOCAL_PATH in the Chinese fixture; scanned PDF produced three OCR regions",
    archiveSmoke: "zip extracted, deep strict codesign verified, app launched, bundled worker returned health ok",
  },
  companionFiles: await Promise.all(companionNames.map(fileRecord)),
  sbom: {
    path: publicPrefix + "sbom.spdx.json",
    format: sbom.spdxVersion,
    packages: sbom.packages.length,
    documentNamespace: sbom.documentNamespace,
  },
  manifestSelfIdentity: {
    hashExcluded: true,
    reason: "A file cannot contain a stable hash of its own final bytes; every distributable and companion beside it is size-and-hash identified above.",
  },
};

await writeFile(resolve(releaseRoot, "release-manifest.json"), JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({
  artifacts: report.artifacts,
  companionFiles: report.companionFiles,
  benchmark: report.verification.ocrFixtureBenchmark,
}));
