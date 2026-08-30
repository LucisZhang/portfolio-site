import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Task L4 [CLAUDE]: derives the Credit Policy Desk chart-led Evidence
// page's exhibit 01 policy-frontier figure from the already-committed,
// already-verified compact backtest preview (credit-backtest-compact.json,
// itself produced and hash-pinned by generate-credit-backtest-preview.mjs
// from scored-backtest.parquet). This script does NOT re-touch the
// Parquet or re-run any model -- it only reads the 624 backtest-split rows
// out of the compact preview's tuple encoding, sorts them by calibrated_pd,
// and walks the resulting cumulative "approve at or below this score"
// curve. The output is a small, build-time-importable JSON report (the
// margin-control-tower detection-report.json / elasticity-report.json
// precedent: a curated report file, not a re-shipped copy of the raw
// dataset) so the frontier figure can render at build/SSR time with zero
// client-side fetch or WASM -- satisfying the "no-JS renders real content"
// requirement the same way margin's committed reports do.
//
// Reproduce: node scripts/generate-credit-policy-frontier.mjs

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const compactPath = join(root, "public/case-studies/credit-policy-desk/credit-backtest-compact.json");
const backtestReportPath = join(root, "public/case-studies/credit-policy-desk/backtest-report.json");
const outputPath = join(root, "public/case-studies/credit-policy-desk/policy-frontier-report.json");

const EXPECTED_ARTIFACT_SHA256 = "2bbc97350d28123a1b056e4d475cdc90000954df1e6226d54d4fa35f2e7e0b95";
const EXPECTED_COMPACT_SHA256 = "1ee47e3e636f8bf04d92707123bc11190848740d6c506171efff32cee210dc0d";
// Mirrors the mock's own three annotated points (output/design-legacy/
// legacy-6-credit-policy-desk.html): the active published policy (pd<=.20)
// plus two alternate thresholds shown for contrast (pd<=.15, pd<=.30).
const REFERENCE_THRESHOLDS = [
  { id: "pd_15", threshold: 0.15 },
  { id: "pd_20", threshold: 0.20 },
  { id: "pd_30", threshold: 0.30 },
];
const ACTIVE_POLICY_ID = "pd_20";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(text) {
  return createHash("sha256").update(text).digest("hex");
}

function stat(rows, threshold) {
  const approved = rows.filter((row) => row.pd <= threshold);
  const defaults = approved.filter((row) => row.observedDefault).length;
  return {
    threshold,
    approval_rate: approved.length / rows.length,
    default_rate: approved.length ? defaults / approved.length : 0,
    approved_count: approved.length,
  };
}

async function main() {
  const [compactRaw, backtestReportRaw] = await Promise.all([
    readFile(compactPath, "utf8"),
    readFile(backtestReportPath, "utf8"),
  ]);
  const compact = JSON.parse(compactRaw);
  // Matches src/lib/credit-backtest-compact.ts's own browser-side check
  // (sha256Text(JSON.stringify(compact))), not a raw-file-bytes hash --
  // JSON.parse+JSON.stringify is stable here because this file was itself
  // written by JSON.stringify (generate-credit-backtest-preview.mjs).
  const compactSha256 = sha256(JSON.stringify(compact));
  assert(compactSha256 === EXPECTED_COMPACT_SHA256, `credit-backtest-compact.json SHA-256 drifted: ${compactSha256}`);
  assert(compact.source_sha256 === EXPECTED_ARTIFACT_SHA256, "compact preview is not bound to the recorded scored-backtest.parquet SHA-256.");
  const backtestReport = JSON.parse(backtestReportRaw);
  assert(backtestReport.artifact_sha256 === EXPECTED_ARTIFACT_SHA256, "backtest-report.json is not bound to the recorded scored-backtest.parquet SHA-256.");

  const fields = compact.tuple_fields;
  const idx = Object.fromEntries(fields.map((field, i) => [field, i]));
  for (const required of ["split", "calibrated_pd", "observed_default"]) {
    assert(idx[required] !== undefined, `credit-backtest-compact.json tuples are missing the "${required}" field.`);
  }
  const backtestRows = compact.tuples
    .filter((tuple) => tuple[idx.split] === 2) // 0=train, 1=calibration, 2=backtest
    .map((tuple) => ({ pd: tuple[idx.calibrated_pd], observedDefault: tuple[idx.observed_default] === 1 }));
  assert(backtestRows.length > 0, "No backtest-split rows found in the compact preview.");

  const sorted = [...backtestRows].sort((a, b) => a.pd - b.pd);
  const points = [];
  let cumulativeDefaults = 0;
  for (let i = 0; i < sorted.length; i += 1) {
    cumulativeDefaults += sorted[i].observedDefault ? 1 : 0;
    const next = sorted[i + 1];
    // Emit one point per distinct calibrated_pd value (ties at the same
    // score approve/decline together, so the curve is a valid step
    // function of the threshold, not an artifact of row order).
    if (next && next.pd === sorted[i].pd) continue;
    points.push({
      threshold: sorted[i].pd,
      approval_rate: (i + 1) / sorted.length,
      default_rate: cumulativeDefaults / (i + 1),
    });
  }

  const approveEveryone = stat(backtestRows, 1);
  const referencePoints = Object.fromEntries(
    REFERENCE_THRESHOLDS.map(({ id, threshold }) => [id, stat(backtestRows, threshold)]),
  );

  const report = {
    report_version: "credit-policy-frontier-report-v1",
    generated_by: "scripts/generate-credit-policy-frontier.mjs",
    source_artifact_sha256: EXPECTED_ARTIFACT_SHA256,
    source_compact_sha256: EXPECTED_COMPACT_SHA256,
    model: "calibrated_pd",
    backtest_preview_row_count: backtestRows.length,
    approve_everyone_default_rate_preview: approveEveryone.default_rate,
    active_policy_reference: ACTIVE_POLICY_ID,
    reference_points: referencePoints,
    points,
  };

  const generated = `${JSON.stringify(report, null, 2)}\n`;
  if (process.argv.includes("--check")) {
    const committed = await readFile(outputPath, "utf8");
    assert(committed === generated, "Generated policy-frontier-report.json is stale; run npm run generate:credit-policy-frontier.");
    console.log("Credit policy-frontier report verified against the exact compact-preview bytes.");
  } else {
    await writeFile(outputPath, generated);
    console.log(`Wrote ${outputPath} (${Buffer.byteLength(generated)} bytes, ${points.length} frontier points, ${backtestRows.length} backtest rows).`);
    console.log(`SHA-256: ${sha256(generated)}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
