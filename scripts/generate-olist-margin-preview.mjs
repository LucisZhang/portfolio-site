import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import duckdb from "@duckdb/duckdb-wasm/dist/duckdb-node-blocking.cjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const artifactPath = join(root, "public/case-studies/margin-control-tower/olist-margin.parquet");
const outputPath = join(root, "src/lib/generated/olist-margin-compact.json");
const EXPECTED_SHA256 = "6921b7ed790367fe9d9ade878a7b97e6d7c2879b9488eef51b326ad9775722fb";
const EXPECTED_PREVIEW_ROWS_SHA256 = "52a475641b394a709b3bf8bec3e5ce1b6459150ae858ed5d62d81d7e1ff545d7";
const EXPECTED_COMPACT_SHA256 = "aca2103ac50b6ed0f2a1c6a200c0eee70c418c96cce4d2adb5728d13c43f164f";
const TUPLE_FIELDS = [
  "week", "period_split", "category", "product_id", "product_name", "region", "channel",
  "order_count", "units", "unit_price", "gross_revenue", "promo_depth", "discounts",
  "return_rate", "returns", "net_revenue", "cogs", "fulfillment", "contribution_margin",
  "provenance", "injected_anomaly", "anomaly_reason",
];

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

function near(left, right) {
  return Math.abs(left - right) <= 0.02;
}

function contractChecks(rows) {
  const required = ["week", "period_split", "category", "product_id", "region", "channel", "order_count", "gross_revenue", "discounts", "returns", "net_revenue", "cogs", "fulfillment", "contribution_margin", "provenance"];
  const grains = rows.map((row) => `${row.week}|${row.category}|${row.region}|${row.channel}`);
  const weeks = [...new Set(rows.map((row) => row.week))].sort();
  const holdoutWeeks = [...new Set(rows.filter((row) => row.period_split === "holdout").map((row) => row.week))].sort();
  const splitByWeek = new Map();
  for (const row of rows) splitByWeek.set(row.week, new Set([...(splitByWeek.get(row.week) ?? []), row.period_split]));
  const exactHoldout = holdoutWeeks.length === 8
    && weeks.slice(-8).every((value, index) => value === holdoutWeeks[index])
    && [...splitByWeek.values()].every((splits) => splits.size === 1);
  return [
    { name: "schema fields present", pass: rows.every((row) => required.every((field) => field in row)) },
    { name: "week-category-region-channel grain unique", pass: new Set(grains).size === grains.length },
    { name: "no null dimension keys", pass: rows.every((row) => [row.week, row.category, row.product_id, row.region, row.channel].every(Boolean)) },
    { name: "numeric costs and revenue non-negative", pass: rows.every((row) => [row.order_count, row.units, row.gross_revenue, row.discounts, row.returns, row.cogs, row.fulfillment].every((value) => value >= 0)) },
    { name: "promotion and return rates bounded", pass: rows.every((row) => row.promo_depth >= 0 && row.promo_depth <= 0.5 && row.return_rate >= 0 && row.return_rate <= 0.5) },
    { name: "gross revenue identity", pass: rows.every((row) => near(row.gross_revenue, row.units * row.unit_price)) },
    { name: "net revenue identity", pass: rows.every((row) => near(row.net_revenue, row.gross_revenue - row.discounts - row.returns)) },
    { name: "contribution identity", pass: rows.every((row) => near(row.contribution_margin, row.net_revenue - row.cogs - row.fulfillment)) },
    { name: "exact final-eight-week holdout without leakage", pass: exactHoldout },
    { name: "source provenance present", pass: rows.every((row) => Boolean(row.provenance)) },
  ];
}

function dictionary(values) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function encodeRows(rows) {
  const dictionaries = {
    weeks: dictionary(rows.map((row) => row.week)),
    categories: dictionary(rows.map((row) => row.category)),
    product_ids: dictionary(rows.map((row) => row.product_id)),
    product_names: dictionary(rows.map((row) => row.product_name)),
    regions: dictionary(rows.map((row) => row.region)),
    channels: dictionary(rows.map((row) => row.channel)),
    provenances: dictionary(rows.map((row) => row.provenance)),
    anomaly_reasons: dictionary(rows.map((row) => row.anomaly_reason)),
  };
  const indexes = Object.fromEntries(Object.entries(dictionaries).map(([key, values]) => [key, new Map(values.map((value, index) => [value, index]))]));
  const tuples = rows.map((row) => [
    indexes.weeks.get(row.week),
    row.period_split === "holdout" ? 1 : 0,
    indexes.categories.get(row.category),
    indexes.product_ids.get(row.product_id),
    indexes.product_names.get(row.product_name),
    indexes.regions.get(row.region),
    indexes.channels.get(row.channel),
    row.order_count,
    row.units,
    row.unit_price,
    row.gross_revenue,
    row.promo_depth,
    row.discounts,
    row.return_rate,
    row.returns,
    row.net_revenue,
    row.cogs,
    row.fulfillment,
    row.contribution_margin,
    indexes.provenances.get(row.provenance),
    row.injected_anomaly ? 1 : 0,
    indexes.anomaly_reasons.get(row.anomaly_reason),
  ]);
  return { dictionaries, tuples };
}

function decodeTuple(tuple, dictionaries) {
  return {
    week: dictionaries.weeks[tuple[0]],
    period_split: tuple[1] ? "holdout" : "analysis",
    category: dictionaries.categories[tuple[2]],
    product_id: dictionaries.product_ids[tuple[3]],
    product_name: dictionaries.product_names[tuple[4]],
    region: dictionaries.regions[tuple[5]],
    channel: dictionaries.channels[tuple[6]],
    order_count: tuple[7],
    units: tuple[8],
    unit_price: tuple[9],
    gross_revenue: tuple[10],
    promo_depth: tuple[11],
    discounts: tuple[12],
    return_rate: tuple[13],
    returns: tuple[14],
    net_revenue: tuple[15],
    cogs: tuple[16],
    fulfillment: tuple[17],
    contribution_margin: tuple[18],
    provenance: dictionaries.provenances[tuple[19]],
    injected_anomaly: Boolean(tuple[20]),
    anomaly_reason: dictionaries.anomaly_reasons[tuple[21]],
  };
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
  database.registerFileBuffer("olist-margin.parquet", new Uint8Array(bytes));
  const connection = database.connect();
  try {
    return connection.query("SELECT * FROM read_parquet('olist-margin.parquet')").toArray().map((row) => plain(row.toJSON()));
  } finally {
    connection.close();
    database.dropFiles();
  }
}

async function buildPreview() {
  const bytes = await readFile(artifactPath);
  const sourceSha256 = createHash("sha256").update(bytes).digest("hex");
  assert(sourceSha256 === EXPECTED_SHA256, `Olist source SHA-256 drifted: ${sourceSha256}`);
  const rows = await queryRows(bytes);
  const checks = contractChecks(rows);
  assert(checks.length === 10 && checks.every((check) => check.pass), `Olist full-row contract failed: ${checks.filter((check) => !check.pass).map((check) => check.name).join(", ")}`);

  const weeks = dictionary(rows.map((row) => row.week));
  const analysisWeeks = dictionary(rows.filter((row) => row.period_split === "analysis").map((row) => row.week));
  const holdoutWeeks = dictionary(rows.filter((row) => row.period_split === "holdout").map((row) => row.week));
  const analysisWeekCounts = new Map();
  for (const row of rows) {
    if (row.period_split === "analysis") analysisWeekCounts.set(row.week, (analysisWeekCounts.get(row.week) ?? 0) + 1);
  }
  const populatedAnalysisWeek = [...analysisWeekCounts].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))[0]?.[0];
  const guided = rows.find((row) => row.injected_anomaly)
    ?? rows.filter((row) => row.week === populatedAnalysisWeek).sort((left, right) => left.contribution_margin - right.contribution_margin)[0]
    ?? rows.find((row) => row.period_split === "analysis")
    ?? rows[0];
  const previewRows = rows.filter((row) => row.week === guided.week || row.category === guided.category);
  const encoded = encodeRows(previewRows);
  const decoded = encoded.tuples.map((tuple) => decodeTuple(tuple, encoded.dictionaries));
  assert(JSON.stringify(decoded) === JSON.stringify(previewRows), "Olist compact tuple round-trip failed.");
  const previewRowsSha256 = createHash("sha256").update(JSON.stringify(previewRows)).digest("hex");
  assert(previewRowsSha256 === EXPECTED_PREVIEW_ROWS_SHA256, `Olist compact preview-row SHA-256 drifted: ${previewRowsSha256}`);

  return {
    schema_version: 1,
    source_sha256: sourceSha256,
    tuple_fields: TUPLE_FIELDS,
    preview_strategy: "guided week union guided category",
    full_row_count: rows.length,
    preview_row_count: previewRows.length,
    preview_rows_sha256: previewRowsSha256,
    dataset: {
      dataset_version: "olist-margin-parquet-v1",
      classification: "offline real-data Parquet artifact",
      license: "Olist-derived aggregate · CC BY-NC-SA 4.0",
      grain: "week × product category × region × dominant payment channel",
      date_range: { start: weeks[0], end: weeks.at(-1) },
      dimensions: {
        weeks: weeks.length,
        categories: new Set(rows.map((row) => row.category)).size,
        products: 0,
        regions: new Set(rows.map((row) => row.region)).size,
        channels: new Set(rows.map((row) => row.channel)).size,
      },
      source_order_count: 99_441,
      analysis_period: { start: analysisWeeks[0], end: analysisWeeks.at(-1) },
      holdout_period: { start: holdoutWeeks[0], end: holdoutWeeks.at(-1) },
      guided_scenario: { week: guided.week, category: guided.category, region: guided.region, channel: guided.channel },
      assumptions: ["First category observation falls back to current price, producing zero proxy discount; scenario output remains an assumption, not a causal estimate."],
    },
    full_contract_checks: checks,
    ...encoded,
  };
}

const compactJson = JSON.stringify(await buildPreview());
const compactSha256 = createHash("sha256").update(compactJson).digest("hex");
assert(compactSha256 === EXPECTED_COMPACT_SHA256, `Olist compact payload SHA-256 drifted: ${compactSha256}`);
const generated = `${compactJson}\n`;
if (process.argv.includes("--check")) {
  const committed = await readFile(outputPath, "utf8");
  assert(committed === generated, "Generated Olist compact preview is stale; run npm run generate:olist-preview.");
  console.log("Olist compact preview verified against the exact Parquet bytes and full-row contract.");
} else {
  await writeFile(outputPath, generated);
  console.log(`Wrote ${outputPath}`);
}
