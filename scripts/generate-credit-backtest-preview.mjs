import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import duckdb from "@duckdb/duckdb-wasm/dist/duckdb-node-blocking.cjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const artifactPath = join(root, "public/case-studies/credit-policy-desk/scored-backtest.parquet");
const outputPath = join(root, "public/case-studies/credit-policy-desk/credit-backtest-compact.json");
const EXPECTED_SHA256 = "2bbc97350d28123a1b056e4d475cdc90000954df1e6226d54d4fa35f2e7e0b95";
const EXPECTED_PREVIEW_ROWS_SHA256 = "144ad0853a9b80f8e3ad5c5880a3f8e327fa49ebccb5de9af353a26535282013";
const EXPECTED_COMPACT_SHA256 = "1ee47e3e636f8bf04d92707123bc11190848740d6c506171efff32cee210dc0d";
const ROWS_PER_VINTAGE = 24;
const TUPLE_FIELDS = [
  "application_id", "loan_id", "vintage", "split", "utilization", "late_payments",
  "debt_to_income", "bureau_age_months", "income_band", "audit_group", "channel",
  "raw_pd", "calibrated_pd", "challenger_pd", "lgd", "ead", "observed_default",
  "reason_codes", "provenance",
];
const DIRECTIONAL_REASON_CODE = /^[A-Z0-9_]+_(?:INCREASES_PD|DECREASES_PD|NEUTRAL)$/;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function plain(value) {
  if (typeof value === "bigint") return Number(value);
  if (Array.isArray(value)) return value.map(plain);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, plain(entry)]));
  }
  return value;
}

function normalizeRow(raw, index) {
  const reasonCodes = typeof raw.reason_codes === "string" ? JSON.parse(raw.reason_codes) : raw.reason_codes;
  assert(Array.isArray(reasonCodes), `Credit row ${index} has invalid reason_codes.`);
  return {
    ...raw,
    loan_id: raw.loan_id ?? null,
    observed_default: raw.observed_default === true || raw.observed_default === 1 || raw.observed_default === "1",
    reason_codes: reasonCodes,
  };
}

function contractChecks(rows) {
  const ids = rows.map((row) => row.application_id);
  const splits = new Set(rows.map((row) => row.split));
  return [
    { name: "application ID unique", pass: new Set(ids).size === ids.length },
    { name: "application grain and all splits present", pass: rows.every((row) => row.application_id && row.vintage) && ["train", "calibration", "backtest"].every((split) => splits.has(split)) },
    { name: "probabilities bounded", pass: rows.every((row) => [row.raw_pd, row.calibrated_pd, row.challenger_pd].every((value) => value >= 0 && value <= 1)) },
    { name: "LGD bounded and EAD positive", pass: rows.every((row) => row.lgd >= 0 && row.lgd <= 1 && row.ead > 0) },
    { name: "observed outcome present", pass: rows.every((row) => typeof row.observed_default === "boolean") },
    { name: "directional reason codes valid", pass: rows.every((row) => row.reason_codes.length === 3 && new Set(row.reason_codes).size === 3 && row.reason_codes.every((code) => DIRECTIONAL_REASON_CODE.test(code))) },
    { name: "expected loss non-negative", pass: rows.every((row) => row.calibrated_pd * row.lgd * row.ead >= 0) },
    { name: "source provenance present", pass: rows.every((row) => typeof row.provenance === "string" && row.provenance.length > 0) },
    { name: "monthly vintage keys valid", pass: rows.every((row) => /^\d{4}-\d{2}$/.test(row.vintage)) },
    { name: "recorded full row count", pass: rows.length === 120_000 },
  ];
}

function dictionary(values) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function encodeRows(rows) {
  const dictionaries = {
    application_ids: dictionary(rows.map((row) => row.application_id)),
    loan_ids: dictionary(rows.map((row) => row.loan_id ?? "")),
    vintages: dictionary(rows.map((row) => row.vintage)),
    income_bands: dictionary(rows.map((row) => row.income_band)),
    audit_groups: dictionary(rows.map((row) => row.audit_group)),
    channels: dictionary(rows.map((row) => row.channel)),
    reason_code_sets: dictionary(rows.map((row) => JSON.stringify(row.reason_codes))),
    provenances: dictionary(rows.map((row) => row.provenance)),
  };
  const indexes = Object.fromEntries(Object.entries(dictionaries).map(([key, values]) => [key, new Map(values.map((value, index) => [value, index]))]));
  const splitIndex = { train: 0, calibration: 1, backtest: 2 };
  const tuples = rows.map((row) => [
    indexes.application_ids.get(row.application_id),
    indexes.loan_ids.get(row.loan_id ?? ""),
    indexes.vintages.get(row.vintage),
    splitIndex[row.split],
    row.utilization,
    row.late_payments,
    row.debt_to_income,
    row.bureau_age_months,
    indexes.income_bands.get(row.income_band),
    indexes.audit_groups.get(row.audit_group),
    indexes.channels.get(row.channel),
    row.raw_pd,
    row.calibrated_pd,
    row.challenger_pd,
    row.lgd,
    row.ead,
    row.observed_default ? 1 : 0,
    indexes.reason_code_sets.get(JSON.stringify(row.reason_codes)),
    indexes.provenances.get(row.provenance),
  ]);
  return { dictionaries, tuples };
}

async function queryRows(bytes) {
  const dist = join(root, "node_modules/@duckdb/duckdb-wasm/dist");
  const bundles = {
    mvp: { mainModule: join(dist, "duckdb-mvp.wasm"), mainWorker: join(dist, "duckdb-node-mvp.worker.cjs") },
    eh: { mainModule: join(dist, "duckdb-eh.wasm"), mainWorker: join(dist, "duckdb-node-eh.worker.cjs") },
  };
  const database = await duckdb.createDuckDB(bundles, new duckdb.VoidLogger(), duckdb.NODE_RUNTIME);
  await database.instantiate();
  database.open({});
  database.registerFileBuffer("credit.parquet", new Uint8Array(bytes));
  const connection = database.connect();
  try {
    return connection.query("SELECT * FROM read_parquet('credit.parquet') ORDER BY vintage, application_id").toArray().map((row, index) => normalizeRow(plain(row.toJSON()), index));
  } finally {
    connection.close();
    database.dropFiles();
  }
}

async function buildPreview() {
  const bytes = await readFile(artifactPath);
  const sourceSha256 = createHash("sha256").update(bytes).digest("hex");
  assert(sourceSha256 === EXPECTED_SHA256, `Credit source SHA-256 drifted: ${sourceSha256}`);
  const rows = await queryRows(bytes);
  const checks = contractChecks(rows);
  assert(checks.length === 10 && checks.every((check) => check.pass), `Credit full-row contract failed: ${checks.filter((check) => !check.pass).map((check) => check.name).join(", ")}`);

  const byVintage = new Map();
  for (const row of rows) {
    const group = byVintage.get(row.vintage) ?? [];
    if (group.length < ROWS_PER_VINTAGE) group.push(row);
    byVintage.set(row.vintage, group);
  }
  const previewRows = [...byVintage.values()].flat();
  const previewRowsSha256 = createHash("sha256").update(JSON.stringify(previewRows)).digest("hex");
  if (EXPECTED_PREVIEW_ROWS_SHA256 !== "UNLOCKED") {
    assert(previewRowsSha256 === EXPECTED_PREVIEW_ROWS_SHA256, `Credit compact preview-row SHA-256 drifted: ${previewRowsSha256}`);
  }
  const vintages = dictionary(rows.map((row) => row.vintage));
  const splitCount = (split) => rows.filter((row) => row.split === split).length;
  const encoded = encodeRows(previewRows);
  return {
    schema_version: 1,
    source_sha256: sourceSha256,
    tuple_fields: TUPLE_FIELDS,
    preview_strategy: `first ${ROWS_PER_VINTAGE} application IDs per vintage`,
    full_row_count: rows.length,
    preview_row_count: previewRows.length,
    preview_rows_sha256: previewRowsSha256,
    dataset: {
      dataset_version: "scored-backtest-parquet-v1",
      classification: "offline real-data backtest artifact",
      license: "Artifact metadata and upstream terms must accompany the offline pipeline output.",
      grain: "one row per application",
      entity_boundary: "application, optional booked loan, observed outcome, score, and policy decision remain separate",
      model_boundary: "offline scored backtest only; no model executes in the browser",
      date_range: { start: vintages[0], end: vintages.at(-1) },
      dimensions: {
        applications: rows.length,
        loans: rows.filter((row) => row.loan_id).length,
        vintages: vintages.length,
        channels: new Set(rows.map((row) => row.channel)).size,
        income_bands: new Set(rows.map((row) => row.income_band)).size,
        audit_groups: new Set(rows.map((row) => row.audit_group)).size,
        feature_count: 9,
      },
      splits: { train: splitCount("train"), calibration: splitCount("calibration"), backtest: splitCount("backtest") },
      assumptions: ["The browser applies policy thresholds to offline scores and does not retrain a model."],
    },
    full_contract_checks: checks,
    ...encoded,
  };
}

const compactJson = JSON.stringify(await buildPreview());
const compactSha256 = createHash("sha256").update(compactJson).digest("hex");
if (EXPECTED_COMPACT_SHA256 !== "UNLOCKED") {
  assert(compactSha256 === EXPECTED_COMPACT_SHA256, `Credit compact payload SHA-256 drifted: ${compactSha256}`);
}
const generated = `${compactJson}\n`;
if (process.argv.includes("--check")) {
  assert(EXPECTED_PREVIEW_ROWS_SHA256 !== "UNLOCKED" && EXPECTED_COMPACT_SHA256 !== "UNLOCKED", "Credit compact identity constants are not locked.");
  const committed = await readFile(outputPath, "utf8");
  assert(committed === generated, "Generated Credit compact preview is stale; run npm run generate:credit-preview.");
  console.log("Credit compact preview verified against the exact Parquet bytes and full-row contract.");
} else {
  await writeFile(outputPath, generated);
  const generatedPreview = JSON.parse(compactJson);
  console.log(JSON.stringify({ outputPath, previewRowsSha256: generatedPreview.preview_rows_sha256, compactSha256, previewRowCount: generatedPreview.preview_row_count }));
}
