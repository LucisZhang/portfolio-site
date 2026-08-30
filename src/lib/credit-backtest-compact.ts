import {
  CREDIT_BACKTEST_ARTIFACT_SHA256,
  CREDIT_BACKTEST_COMPACT_SHA256,
  CREDIT_BACKTEST_FULL_ROW_COUNT,
  CREDIT_BACKTEST_PREVIEW_ROW_COUNT,
  CREDIT_BACKTEST_PREVIEW_ROWS_SHA256,
} from "@/lib/credit-backtest-identity";

const TUPLE_FIELDS = [
  "application_id", "loan_id", "vintage", "split", "utilization", "late_payments",
  "debt_to_income", "bureau_age_months", "income_band", "audit_group", "channel",
  "raw_pd", "calibrated_pd", "challenger_pd", "lgd", "ead", "observed_default",
  "reason_codes", "provenance",
] as const;
const PREVIEW_STRATEGY = "first 24 application IDs per vintage";
export const CREDIT_BACKTEST_COMPACT_URL = "/case-studies/credit-policy-desk/credit-backtest-compact.json";

export type CreditBacktestPreviewRow = {
  application_id: string;
  loan_id: string | null;
  vintage: string;
  split: "train" | "calibration" | "backtest";
  utilization: number;
  late_payments: number;
  debt_to_income: number;
  bureau_age_months: number;
  income_band: string;
  audit_group: string;
  channel: string;
  raw_pd: number;
  calibrated_pd: number;
  challenger_pd: number;
  lgd: number;
  ead: number;
  observed_default: boolean;
  reason_codes: string[];
  provenance: string;
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
    entity_boundary: string;
    model_boundary: string;
    date_range: { start: string; end: string };
    dimensions: { applications: number; loans: number; vintages: number; channels: number; income_bands: number; audit_groups: number; feature_count: number };
    splits: { train: number; calibration: number; backtest: number };
    assumptions: string[];
  };
  full_contract_checks: Array<{ name: string; pass: boolean }>;
  dictionaries: {
    application_ids: string[];
    loan_ids: string[];
    vintages: string[];
    income_bands: string[];
    audit_groups: string[];
    channels: string[];
    reason_code_sets: string[];
    provenances: string[];
  };
  tuples: number[][];
};

let compactPreviewPromise: Promise<CompactPreview> | null = null;

async function loadCompactPreview() {
  if (!compactPreviewPromise) {
    compactPreviewPromise = fetch(CREDIT_BACKTEST_COMPACT_URL, { cache: "force-cache" }).then(async (response) => {
      if (!response.ok) throw new Error(`Credit compact preview returned ${response.status}.`);
      return JSON.parse(await response.text()) as CompactPreview;
    }).catch((error) => {
      compactPreviewPromise = null;
      throw error;
    });
  }
  return compactPreviewPromise;
}

function dictionaryValue(values: string[], index: number, field: string) {
  if (!Number.isInteger(index) || index < 0 || typeof values[index] !== "string") {
    throw new Error(`Credit compact preview has an invalid ${field} dictionary index.`);
  }
  return values[index];
}

function finite(tuple: number[], index: number, field: string) {
  const value = tuple[index];
  if (!Number.isFinite(value)) throw new Error(`Credit compact preview has an invalid ${field} value.`);
  return value;
}

function decodeRow(compact: CompactPreview, tuple: number[]): CreditBacktestPreviewRow {
  if (!Array.isArray(tuple) || tuple.length !== TUPLE_FIELDS.length) throw new Error("Credit compact preview tuple width drifted.");
  const split = ["train", "calibration", "backtest"][finite(tuple, 3, "split")];
  if (!split) throw new Error("Credit compact preview has an invalid split.");
  const observed = finite(tuple, 16, "observed_default");
  if (observed !== 0 && observed !== 1) throw new Error("Credit compact preview has an invalid observed_default flag.");
  const loanId = dictionaryValue(compact.dictionaries.loan_ids, tuple[1], "loan_id");
  const reasonCodes = JSON.parse(dictionaryValue(compact.dictionaries.reason_code_sets, tuple[17], "reason_codes")) as unknown;
  if (!Array.isArray(reasonCodes) || !reasonCodes.every((value) => typeof value === "string")) {
    throw new Error("Credit compact preview has invalid reason codes.");
  }
  return {
    application_id: dictionaryValue(compact.dictionaries.application_ids, tuple[0], "application_id"),
    loan_id: loanId || null,
    vintage: dictionaryValue(compact.dictionaries.vintages, tuple[2], "vintage"),
    split: split as CreditBacktestPreviewRow["split"],
    utilization: finite(tuple, 4, "utilization"),
    late_payments: finite(tuple, 5, "late_payments"),
    debt_to_income: finite(tuple, 6, "debt_to_income"),
    bureau_age_months: finite(tuple, 7, "bureau_age_months"),
    income_band: dictionaryValue(compact.dictionaries.income_bands, tuple[8], "income_band"),
    audit_group: dictionaryValue(compact.dictionaries.audit_groups, tuple[9], "audit_group"),
    channel: dictionaryValue(compact.dictionaries.channels, tuple[10], "channel"),
    raw_pd: finite(tuple, 11, "raw_pd"),
    calibrated_pd: finite(tuple, 12, "calibrated_pd"),
    challenger_pd: finite(tuple, 13, "challenger_pd"),
    lgd: finite(tuple, 14, "lgd"),
    ead: finite(tuple, 15, "ead"),
    observed_default: observed === 1,
    reason_codes: reasonCodes,
    provenance: dictionaryValue(compact.dictionaries.provenances, tuple[18], "provenance"),
  };
}

async function sha256Text(value: string) {
  const cryptoApi = globalThis.crypto?.subtle;
  if (!cryptoApi) throw new Error("Credit compact preview cannot verify its row identity in this browser.");
  const digest = await cryptoApi.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function buildCreditBacktestCompactPreview() {
  const compact = await loadCompactPreview();
  if (await sha256Text(JSON.stringify(compact)) !== CREDIT_BACKTEST_COMPACT_SHA256) throw new Error("Credit compact preview payload does not match its trusted SHA-256.");
  if (compact.schema_version !== 1 || compact.source_sha256 !== CREDIT_BACKTEST_ARTIFACT_SHA256) throw new Error("Credit compact preview is not bound to the recorded artifact SHA-256.");
  if (compact.preview_rows_sha256 !== CREDIT_BACKTEST_PREVIEW_ROWS_SHA256) throw new Error("Credit compact preview is not bound to the recorded preview-row SHA-256.");
  if (compact.tuple_fields.length !== TUPLE_FIELDS.length || compact.tuple_fields.some((field, index) => field !== TUPLE_FIELDS[index])) throw new Error("Credit compact preview tuple fields drifted.");
  if (compact.preview_strategy !== PREVIEW_STRATEGY) throw new Error("Credit compact preview strategy drifted.");
  if (compact.full_row_count !== CREDIT_BACKTEST_FULL_ROW_COUNT || compact.preview_row_count !== CREDIT_BACKTEST_PREVIEW_ROW_COUNT) throw new Error("Credit compact preview row counts drifted.");
  if (compact.full_contract_checks.length !== 10 || compact.full_contract_checks.some(({ pass }) => !pass)) throw new Error("Credit compact preview is missing the full-artifact contract evidence.");
  const rows = compact.tuples.map((tuple) => decodeRow(compact, tuple));
  if (rows.length !== compact.preview_row_count || new Set(rows.map((row) => row.vintage)).size !== compact.dataset.dimensions.vintages) throw new Error("Credit compact preview coverage drifted.");
  if (await sha256Text(JSON.stringify(rows)) !== CREDIT_BACKTEST_PREVIEW_ROWS_SHA256) throw new Error("Credit compact preview rows do not match their trusted SHA-256.");
  return {
    sourceSha256: compact.source_sha256,
    fullRowCount: compact.full_row_count,
    fullContractChecks: compact.full_contract_checks,
    dataset: compact.dataset,
    rows,
  };
}
