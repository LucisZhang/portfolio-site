import compactPreview from "@/lib/generated/olist-margin-compact.json";
import {
  OLIST_MARGIN_ARTIFACT_SHA256,
  OLIST_MARGIN_COMPACT_SHA256,
  OLIST_MARGIN_FULL_ROW_COUNT,
  OLIST_MARGIN_PREVIEW_ROW_COUNT,
  OLIST_MARGIN_PREVIEW_ROWS_SHA256,
} from "@/lib/olist-margin-identity";

const TUPLE_FIELDS = [
  "week", "period_split", "category", "product_id", "product_name", "region", "channel",
  "order_count", "units", "unit_price", "gross_revenue", "promo_depth", "discounts",
  "return_rate", "returns", "net_revenue", "cogs", "fulfillment", "contribution_margin",
  "provenance", "injected_anomaly", "anomaly_reason",
] as const;
const PREVIEW_STRATEGY = "guided week union guided category";

export type OlistMarginPreviewRow = {
  week: string;
  period_split: "analysis" | "holdout";
  category: string;
  product_id: string;
  product_name: string;
  region: string;
  channel: string;
  order_count: number;
  units: number;
  unit_price: number;
  gross_revenue: number;
  promo_depth: number;
  discounts: number;
  return_rate: number;
  returns: number;
  net_revenue: number;
  cogs: number;
  fulfillment: number;
  contribution_margin: number;
  provenance: string;
  injected_anomaly: boolean;
  anomaly_reason: string;
};

type CompactPreview = {
  schema_version: number;
  source_sha256: string;
  tuple_fields: string[];
  preview_strategy: string;
  preview_rows_sha256: string;
  preview_row_count: number;
  full_row_count: number;
  dataset: {
    dataset_version: string;
    classification: string;
    license: string;
    grain: string;
    date_range: { start: string; end: string };
    dimensions: { weeks: number; categories: number; products: number; regions: number; channels: number };
    source_order_count: number;
    analysis_period: { start: string; end: string };
    holdout_period: { start: string; end: string };
    guided_scenario: { week: string; category: string; region: string; channel: string };
    assumptions: string[];
  };
  full_contract_checks: Array<{ name: string; pass: boolean }>;
  dictionaries: {
    weeks: string[];
    categories: string[];
    product_ids: string[];
    product_names: string[];
    regions: string[];
    channels: string[];
    provenances: string[];
    anomaly_reasons: string[];
  };
  tuples: number[][];
};

const compact = compactPreview as CompactPreview;

function dictionaryValue(values: string[], index: number, field: string) {
  if (!Number.isInteger(index) || index < 0) throw new Error(`Olist compact preview has an invalid ${field} dictionary index.`);
  const value = values[index];
  if (typeof value !== "string") throw new Error(`Olist compact preview has an invalid ${field} dictionary index.`);
  return value;
}

function binaryFlag(tuple: number[], index: number, field: string) {
  const value = tuple[index];
  if (value !== 0 && value !== 1) throw new Error(`Olist compact preview has an invalid ${field} flag.`);
  return value;
}

function finite(tuple: number[], index: number, field: string) {
  const value = tuple[index];
  if (!Number.isFinite(value)) throw new Error(`Olist compact preview has an invalid ${field} value.`);
  return value;
}

function decodeRow(tuple: number[]): OlistMarginPreviewRow {
  if (!Array.isArray(tuple) || tuple.length !== TUPLE_FIELDS.length) throw new Error("Olist compact preview tuple width drifted.");
  const periodSplit = binaryFlag(tuple, 1, "period_split");
  const injectedAnomaly = binaryFlag(tuple, 20, "injected_anomaly");
  return {
    week: dictionaryValue(compact.dictionaries.weeks, tuple[0], "week"),
    period_split: periodSplit === 1 ? "holdout" : "analysis",
    category: dictionaryValue(compact.dictionaries.categories, tuple[2], "category"),
    product_id: dictionaryValue(compact.dictionaries.product_ids, tuple[3], "product_id"),
    product_name: dictionaryValue(compact.dictionaries.product_names, tuple[4], "product_name"),
    region: dictionaryValue(compact.dictionaries.regions, tuple[5], "region"),
    channel: dictionaryValue(compact.dictionaries.channels, tuple[6], "channel"),
    order_count: finite(tuple, 7, "order_count"),
    units: finite(tuple, 8, "units"),
    unit_price: finite(tuple, 9, "unit_price"),
    gross_revenue: finite(tuple, 10, "gross_revenue"),
    promo_depth: finite(tuple, 11, "promo_depth"),
    discounts: finite(tuple, 12, "discounts"),
    return_rate: finite(tuple, 13, "return_rate"),
    returns: finite(tuple, 14, "returns"),
    net_revenue: finite(tuple, 15, "net_revenue"),
    cogs: finite(tuple, 16, "cogs"),
    fulfillment: finite(tuple, 17, "fulfillment"),
    contribution_margin: finite(tuple, 18, "contribution_margin"),
    provenance: dictionaryValue(compact.dictionaries.provenances, tuple[19], "provenance"),
    injected_anomaly: injectedAnomaly === 1,
    anomaly_reason: dictionaryValue(compact.dictionaries.anomaly_reasons, tuple[21], "anomaly_reason"),
  };
}

async function sha256Text(value: string) {
  const cryptoApi = globalThis.crypto?.subtle;
  if (!cryptoApi) throw new Error("Olist compact preview cannot verify its row identity in this browser.");
  const digest = await cryptoApi.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function buildOlistMarginCompactPreview() {
  if (await sha256Text(JSON.stringify(compact)) !== OLIST_MARGIN_COMPACT_SHA256) {
    throw new Error("Olist compact preview payload does not match its trusted SHA-256.");
  }
  if (compact.schema_version !== 1 || compact.source_sha256 !== OLIST_MARGIN_ARTIFACT_SHA256) {
    throw new Error("Olist compact preview is not bound to the recorded artifact SHA-256.");
  }
  if (compact.preview_rows_sha256 !== OLIST_MARGIN_PREVIEW_ROWS_SHA256) {
    throw new Error("Olist compact preview is not bound to the recorded preview-row SHA-256.");
  }
  if (compact.tuple_fields.length !== TUPLE_FIELDS.length || compact.tuple_fields.some((field, index) => field !== TUPLE_FIELDS[index])) {
    throw new Error("Olist compact preview tuple fields drifted.");
  }
  if (compact.preview_strategy !== PREVIEW_STRATEGY) throw new Error("Olist compact preview strategy drifted.");
  if (compact.full_row_count !== OLIST_MARGIN_FULL_ROW_COUNT || compact.preview_row_count !== OLIST_MARGIN_PREVIEW_ROW_COUNT) {
    throw new Error("Olist compact preview row counts drifted.");
  }
  if (compact.full_contract_checks.length !== 10 || compact.full_contract_checks.some(({ pass }) => !pass)) {
    throw new Error("Olist compact preview is missing the full-artifact contract evidence.");
  }
  const rows = compact.tuples.map(decodeRow);
  if (rows.length !== compact.preview_row_count) throw new Error("Olist compact preview row count drifted.");
  const guided = compact.dataset.guided_scenario;
  if (!rows.some((row) => row.week === guided.week && row.category === guided.category && row.region === guided.region && row.channel === guided.channel)) {
    throw new Error("Olist compact preview is missing its guided row.");
  }
  if (rows.some((row) => row.week !== guided.week && row.category !== guided.category)) {
    throw new Error("Olist compact preview contains rows outside its recorded strategy.");
  }
  if (await sha256Text(JSON.stringify(rows)) !== OLIST_MARGIN_PREVIEW_ROWS_SHA256) {
    throw new Error("Olist compact preview rows do not match their trusted SHA-256.");
  }
  return {
    sourceSha256: compact.source_sha256,
    fullRowCount: compact.full_row_count,
    fullContractChecks: compact.full_contract_checks,
    dataset: compact.dataset,
    rows,
  };
}
