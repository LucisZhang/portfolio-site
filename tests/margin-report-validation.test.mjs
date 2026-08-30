import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  assertDetectionReport,
  assertElasticityReport,
  MarginDetectionReportContractError,
  MarginElasticityReportContractError,
} from "../src/lib/margin-report-validation.ts";
import { OLIST_MARGIN_ARTIFACT_SHA256 } from "../src/lib/olist-margin-identity.ts";

// Task L2 review finding (Important): the build-time fail-closed contract
// check src/components/margin/marginData.ts relies on
// (assertDetectionReport/assertElasticityReport, src/lib/
// margin-report-validation.ts) had zero automated coverage of its NEGATIVE
// path -- nothing proved the throw actually fires on malformed or
// stale-hash data, so a future validator refactor could silently break the
// guarantee. This file corrupts real fixtures in-memory and asserts each
// corruption is rejected, mirroring check-localization-gate-wiring.test.mjs's
// plain node:test + node:assert pattern. Wired into `npm run verify:evidence`
// (package.json) so it runs routinely, not just when someone remembers to.
//
// The validators themselves are NOT weakened by this task -- only two
// throwing wrapper functions were extracted out of marginData.ts's inline
// `if (!isDetectionReport(...)) throw ...` so they are importable here
// without needing to resolve marginData.ts's own `@/lib/...` path aliases
// under plain `node --test` (no bundler in this test runtime). The thrown
// messages are unchanged from the original inline checks.

const repoRoot = path.resolve(import.meta.dirname, "..");

async function loadRealFixture(name) {
  const filePath = path.join(repoRoot, "public/case-studies/margin-control-tower", name);
  return JSON.parse(await readFile(filePath, "utf8"));
}

test("assertDetectionReport accepts the real committed detection-report.json unchanged", async () => {
  const real = await loadRealFixture("detection-report.json");
  const result = assertDetectionReport(real, OLIST_MARGIN_ARTIFACT_SHA256);
  assert.equal(result, real);
  assert.equal(result.true_positives, 6);
});

test("assertElasticityReport accepts the real committed elasticity-report.json unchanged", async () => {
  const real = await loadRealFixture("elasticity-report.json");
  const result = assertElasticityReport(real, OLIST_MARGIN_ARTIFACT_SHA256);
  assert.equal(result, real);
});

test("assertDetectionReport throws on a precision/recall value that no longer matches the labeled weeks", async () => {
  const corrupted = await loadRealFixture("detection-report.json");
  corrupted.precision = 0.999999; // real value is 0.315789 (6 tp / 19 alarms)
  assert.throws(
    () => assertDetectionReport(corrupted, OLIST_MARGIN_ARTIFACT_SHA256),
    MarginDetectionReportContractError,
  );
  assert.throws(
    () => assertDetectionReport(corrupted, OLIST_MARGIN_ARTIFACT_SHA256),
    { message: /detection-report\.json failed its build-time contract check/ },
  );
});

test("assertDetectionReport throws when true_positives/false_negatives no longer matches the labeled_weeks rows", async () => {
  const corrupted = await loadRealFixture("detection-report.json");
  corrupted.labeled_weeks[0].detected = false;
  corrupted.labeled_weeks[0].status = "missed";
  assert.throws(() => assertDetectionReport(corrupted, OLIST_MARGIN_ARTIFACT_SHA256), MarginDetectionReportContractError);
});

test("assertDetectionReport throws on a stale/mismatched artifact_sha256 (the exact 'stale hash' failure mode)", async () => {
  const corrupted = await loadRealFixture("detection-report.json");
  corrupted.artifact_sha256 = "0".repeat(64);
  assert.throws(() => assertDetectionReport(corrupted, OLIST_MARGIN_ARTIFACT_SHA256), MarginDetectionReportContractError);
});

test("assertDetectionReport throws on a missing required field", async () => {
  const corrupted = await loadRealFixture("detection-report.json");
  delete corrupted.method;
  assert.throws(() => assertDetectionReport(corrupted, OLIST_MARGIN_ARTIFACT_SHA256), MarginDetectionReportContractError);
});

test("assertDetectionReport throws on a structurally wrong shape (not an object)", () => {
  assert.throws(() => assertDetectionReport(null, OLIST_MARGIN_ARTIFACT_SHA256), MarginDetectionReportContractError);
  assert.throws(() => assertDetectionReport("not a report", OLIST_MARGIN_ARTIFACT_SHA256), MarginDetectionReportContractError);
});

test("assertElasticityReport throws on a non-numeric coefficient", async () => {
  const corrupted = await loadRealFixture("elasticity-report.json");
  corrupted.coefficient = "not-a-number";
  assert.throws(
    () => assertElasticityReport(corrupted, OLIST_MARGIN_ARTIFACT_SHA256),
    MarginElasticityReportContractError,
  );
  assert.throws(
    () => assertElasticityReport(corrupted, OLIST_MARGIN_ARTIFACT_SHA256),
    { message: /elasticity-report\.json failed its build-time contract check/ },
  );
});

test("assertElasticityReport throws on a stale/mismatched artifact_sha256", async () => {
  const corrupted = await loadRealFixture("elasticity-report.json");
  corrupted.artifact_sha256 = "f".repeat(64);
  assert.throws(() => assertElasticityReport(corrupted, OLIST_MARGIN_ARTIFACT_SHA256), MarginElasticityReportContractError);
});

test("assertElasticityReport throws when the coefficient falls outside its own confidence interval", async () => {
  const corrupted = await loadRealFixture("elasticity-report.json");
  corrupted.coefficient = corrupted.confidence_interval_95[1] + 1;
  assert.throws(() => assertElasticityReport(corrupted, OLIST_MARGIN_ARTIFACT_SHA256), MarginElasticityReportContractError);
});

test("assertElasticityReport throws on a missing required field", async () => {
  const corrupted = await loadRealFixture("elasticity-report.json");
  delete corrupted.holdout_mape;
  assert.throws(() => assertElasticityReport(corrupted, OLIST_MARGIN_ARTIFACT_SHA256), MarginElasticityReportContractError);
});
