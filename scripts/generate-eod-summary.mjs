import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const resultsRoot = "public/case-studies/exactly-once-drills/results";
const outputPath = "public/case-studies/exactly-once-drills/index.summary.json";

async function readReceipt(filename) {
  return JSON.parse(await readFile(path.join(repositoryRoot, resultsRoot, filename), "utf8"));
}

function requireZero(value, label) {
  if (value !== 0) throw new Error(`${label} must be zero; received ${value}`);
  return value;
}

function requirePass(value, label) {
  if (value !== true) throw new Error(`${label} must be true; received ${value}`);
}

function receiptHref(filename) {
  return `/case-studies/exactly-once-drills/results/${filename}`;
}

function emptyTimings() {
  return { injectMs: null, detectMs: null, recoverMs: null, verifyMs: null };
}

async function main() {
  const [
    reconciliation,
    restart,
    duplicate,
    ordering,
    offset,
    poison,
    parity,
    slo,
    schema,
    smallFile,
  ] = await Promise.all([
    readReceipt("eo_reconciliation.json"),
    readReceipt("broker_restart_drill.json"),
    readReceipt("duplicate_redelivery_drill.json"),
    readReceipt("ordering_miskey_drill.json"),
    readReceipt("offset_replay_drill.json"),
    readReceipt("poison_dlq_drill.json"),
    readReceipt("broker_parity.json"),
    readReceipt("broker_slo.json"),
    readReceipt("schema_contract_drill.json"),
    readReceipt("iceberg_small_file_rewrite.json"),
  ]);

  const brokerRows = [
    ["duplicate-redelivery", "DUP", "duplicate_redelivery_drill.json", duplicate, "duplicate-redelivery"],
    ["ordering-miskey", "ORD", "ordering_miskey_drill.json", ordering, "mis-keying"],
    ["poison-dlq", "POISON", "poison_dlq_drill.json", poison, "poison-dlq"],
    ["broker-restart", "RESTART", "broker_restart_drill.json", restart, "broker-restart"],
    ["offset-replay", "OFFSET", "offset_replay_drill.json", offset, "offset-replay"],
  ].map(([id, abbr, filename, receipt, sloKey]) => {
    requirePass(receipt.summary?.passed, `${filename} summary.passed`);
    const diff = requireZero(receipt.summary?.snapshot_diff_count, `${filename} summary.snapshot_diff_count`);
    const recoverySeconds = slo.summary?.recovery_seconds?.[sloKey];
    if (!Number.isFinite(recoverySeconds)) {
      throw new Error(`broker_slo.json is missing summary.recovery_seconds.${sloKey}`);
    }
    const measurement = slo.recovery_measurements?.find(({ failure_class: failureClass }) => failureClass === sloKey);
    if (!measurement || measurement.recovery_seconds !== recoverySeconds) {
      throw new Error(`broker_slo.json recovery cross-check failed for ${sloKey}`);
    }
    requireZero(measurement.snapshot_diff_count, `broker_slo.json ${sloKey} snapshot_diff_count`);
    return {
      id,
      abbr,
      injectMs: null,
      detectMs: null,
      recoverMs: recoverySeconds * 1_000,
      verifyMs: null,
      diff,
      file: receiptHref(filename),
    };
  });

  requirePass(schema.summary?.passed, "schema_contract_drill.json summary.passed");
  requirePass(schema.checks?.post_rejection_source_iceberg_diff_zero, "schema contract reconciliation check");
  requirePass(smallFile.summary?.passed, "iceberg_small_file_rewrite.json summary.passed");
  requirePass(parity.summary?.passed, "broker_parity.json summary.passed");
  requirePass(parity.summary?.path_a_path_b_row_level_diff_zero, "broker parity path A/B check");
  requirePass(slo.summary?.passed, "broker_slo.json summary.passed");
  requireZero(slo.summary?.snapshot_diff_count, "broker_slo.json summary.snapshot_diff_count");
  if (!Array.isArray(reconciliation.results) || reconciliation.results.length !== 5) {
    throw new Error("eo_reconciliation.json must contain exactly five Flink-class drills");
  }
  for (const result of reconciliation.results) {
    requirePass(result.passed, `eo_reconciliation.json ${result.failure_class} passed`);
    requireZero(result.snapshot_diff_count, `eo_reconciliation.json ${result.failure_class} snapshot_diff_count`);
  }

  const rows = [
    ...brokerRows,
    { id: "schema-contract", abbr: "SCHEMA", ...emptyTimings(), diff: 0, file: receiptHref("schema_contract_drill.json") },
    { id: "small-file-rewrite", abbr: "SMALLFILE", ...emptyTimings(), diff: 0, file: receiptHref("iceberg_small_file_rewrite.json") },
    { id: "eo-reconciliation", abbr: "RECON", ...emptyTimings(), diff: 0, file: receiptHref("eo_reconciliation.json") },
    { id: "broker-parity", abbr: "PARITY", ...emptyTimings(), diff: 0, file: receiptHref("broker_parity.json") },
    { id: "broker-slo", abbr: "SLO", ...emptyTimings(), diff: 0, file: receiptHref("broker_slo.json") },
  ];

  await mkdir(path.dirname(path.join(repositoryRoot, outputPath)), { recursive: true });
  await writeFile(path.join(repositoryRoot, outputPath), `${JSON.stringify(rows, null, 2)}\n`);
  const outputBytes = (await stat(path.join(repositoryRoot, outputPath))).size;
  if (outputBytes >= 12 * 1_024) throw new Error(`${outputPath} is ${outputBytes} bytes; expected less than 12 KiB`);
  console.log(`Generated ${outputPath}: ${rows.length} rows, ${outputBytes} bytes`);
}

await main();
