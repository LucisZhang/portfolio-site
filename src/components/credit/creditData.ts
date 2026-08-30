import backtestReportJson from "../../../public/case-studies/credit-policy-desk/backtest-report.json";
import policyContractJson from "../../../public/case-studies/credit-policy-desk/policy-contract.json";
import policyFrontierReportJson from "../../../public/case-studies/credit-policy-desk/policy-frontier-report.json";
import { CREDIT_BACKTEST_ARTIFACT_SHA256, CREDIT_BACKTEST_COMPACT_SHA256, CREDIT_BACKTEST_FULL_ROW_COUNT } from "@/lib/credit-backtest-identity";

// Task L4 [CLAUDE] rebuild (spec §6.7 "Margin/Credit(归档): Evidence 形态") --
// mirrors src/components/margin/marginData.ts's precedent exactly: these two
// committed JSON files are statically imported and build-time-validated, not
// fetched at runtime against a swappable artifact the way the pre-rebuild
// interactive workbench (src/components/analytics/CreditPolicyLab.tsx, now
// unrouted) did. An invalid or hash-mismatched report fails `npm run build`
// outright. "Zero hardcoded numbers" downstream of this module means every
// rendered figure/stat/table cell is read from these typed exports.
//
// backtest-report.json is the pipeline's own committed summary (Brier/AUC/
// log-loss/split sizes/default rate) -- unchanged by this task.
// policy-frontier-report.json is new: scripts/generate-credit-policy-
// frontier.mjs derives it from the already-locked, already-hash-checked
// credit-backtest-compact.json (the same 624 backtest-split preview rows
// the pre-rebuild page's own `frontier` useMemo filtered at runtime), so
// the chart-led exhibit 01 figure can render at build/SSR time with no
// client fetch and no DuckDB -- see that script's header comment for why.

interface ModelMetrics {
  brier: number;
  log_loss: number;
  roc_auc: number;
}

export interface CreditBacktestReport {
  report_version: "credit-backtest-report-v1";
  dataset_id: string;
  artifact_sha256: string;
  evaluated_at: string;
  splits: { train: number; calibration: number; backtest: number };
  time_cutoffs: { train_end: string; calibration_end: string };
  models: {
    baseline_raw: ModelMetrics;
    baseline_isotonic: ModelMetrics;
    challenger_isotonic: ModelMetrics;
  };
  backtest_default_rate: number;
  boundaries: string;
}

export interface CreditFrontierPoint {
  threshold: number;
  approval_rate: number;
  default_rate: number;
}

export interface CreditFrontierReferencePoint extends CreditFrontierPoint {
  approved_count: number;
}

export interface CreditPolicyFrontierReport {
  report_version: "credit-policy-frontier-report-v1";
  generated_by: string;
  source_artifact_sha256: string;
  source_compact_sha256: string;
  model: "calibrated_pd";
  backtest_preview_row_count: number;
  approve_everyone_default_rate_preview: number;
  active_policy_reference: string;
  reference_points: Record<string, CreditFrontierReferencePoint>;
  points: CreditFrontierPoint[];
}

function isModelMetrics(value: unknown): value is ModelMetrics {
  if (!value || typeof value !== "object") return false;
  const metrics = value as Partial<ModelMetrics>;
  return [metrics.brier, metrics.log_loss, metrics.roc_auc].every((entry) => typeof entry === "number" && Number.isFinite(entry) && entry >= 0);
}

function isBacktestReport(value: unknown): value is CreditBacktestReport {
  if (!value || typeof value !== "object") return false;
  const report = value as Partial<CreditBacktestReport>;
  if (report.report_version !== "credit-backtest-report-v1") return false;
  if (typeof report.dataset_id !== "string" || !report.dataset_id.trim()) return false;
  if (report.artifact_sha256 !== CREDIT_BACKTEST_ARTIFACT_SHA256) return false;
  if (typeof report.evaluated_at !== "string" || !report.evaluated_at.trim()) return false;
  const splits = report.splits;
  if (!splits || ![splits.train, splits.calibration, splits.backtest].every((count) => typeof count === "number" && Number.isInteger(count) && count > 0)) return false;
  if (splits.train + splits.calibration + splits.backtest !== CREDIT_BACKTEST_FULL_ROW_COUNT) return false;
  const cutoffs = report.time_cutoffs;
  if (!cutoffs || typeof cutoffs.train_end !== "string" || typeof cutoffs.calibration_end !== "string") return false;
  const models = report.models;
  if (!models || !isModelMetrics(models.baseline_raw) || !isModelMetrics(models.baseline_isotonic) || !isModelMetrics(models.challenger_isotonic)) return false;
  if (typeof report.backtest_default_rate !== "number" || report.backtest_default_rate < 0 || report.backtest_default_rate > 1) return false;
  return typeof report.boundaries === "string" && Boolean(report.boundaries.trim());
}

function isFrontierPoint(value: unknown): value is CreditFrontierPoint {
  if (!value || typeof value !== "object") return false;
  const point = value as Partial<CreditFrontierPoint>;
  return [point.threshold, point.approval_rate, point.default_rate].every((entry) => typeof entry === "number" && Number.isFinite(entry) && entry >= 0);
}

function isPolicyFrontierReport(value: unknown): value is CreditPolicyFrontierReport {
  if (!value || typeof value !== "object") return false;
  const report = value as Partial<CreditPolicyFrontierReport>;
  if (report.report_version !== "credit-policy-frontier-report-v1") return false;
  if (report.source_artifact_sha256 !== CREDIT_BACKTEST_ARTIFACT_SHA256) return false;
  if (report.source_compact_sha256 !== CREDIT_BACKTEST_COMPACT_SHA256) return false;
  if (report.model !== "calibrated_pd") return false;
  if (typeof report.backtest_preview_row_count !== "number" || report.backtest_preview_row_count <= 0) return false;
  if (typeof report.approve_everyone_default_rate_preview !== "number") return false;
  if (typeof report.active_policy_reference !== "string" || !report.reference_points || !(report.active_policy_reference in report.reference_points)) return false;
  if (!Object.values(report.reference_points).every((point) => isFrontierPoint(point) && typeof (point as CreditFrontierReferencePoint).approved_count === "number")) return false;
  if (!Array.isArray(report.points) || report.points.length < 2) return false;
  if (!report.points.every(isFrontierPoint)) return false;
  // The curve must be a valid step function of an increasing threshold --
  // fail closed rather than silently render a scrambled polyline.
  return report.points.every((point, index) => index === 0 || point.threshold > report.points![index - 1].threshold);
}

export interface CreditPolicyContract {
  schema_version: number;
  policy: {
    decision_order: string[];
    approve_when: string;
    review_when: string;
    decline_when: string;
    expected_loss: string;
    capacity_rule: string;
  };
}

function isPolicyContract(value: unknown): value is CreditPolicyContract {
  if (!value || typeof value !== "object") return false;
  const contract = value as Partial<CreditPolicyContract>;
  const policy = contract.policy;
  if (!policy || typeof policy !== "object") return false;
  return Array.isArray(policy.decision_order) && policy.decision_order.length === 3
    && [policy.approve_when, policy.review_when, policy.decline_when, policy.expected_loss, policy.capacity_rule].every((entry) => typeof entry === "string" && Boolean(entry.trim()));
}

if (!isBacktestReport(backtestReportJson)) {
  throw new Error("public/case-studies/credit-policy-desk/backtest-report.json failed its build-time contract check.");
}
if (!isPolicyFrontierReport(policyFrontierReportJson)) {
  throw new Error("public/case-studies/credit-policy-desk/policy-frontier-report.json failed its build-time contract check.");
}
if (!isPolicyContract(policyContractJson)) {
  throw new Error("public/case-studies/credit-policy-desk/policy-contract.json failed its build-time contract check.");
}

export const backtestReport = backtestReportJson as unknown as CreditBacktestReport;
export const policyFrontierReport = policyFrontierReportJson as unknown as CreditPolicyFrontierReport;
export const policyContract = policyContractJson as unknown as CreditPolicyContract;

export const activePolicyPoint = policyFrontierReport.reference_points[policyFrontierReport.active_policy_reference];

// LGD is a disclosed 45% assumption (methods-evidence.json's `modeling`
// notes / public/case-studies/credit-policy-desk/README.md), not a stored
// per-application field in either committed report -- copied here as
// documented pipeline metadata (like marginData.ts's CALENDAR_ANCHOR_ISO),
// not re-derived from a number this module could instead read.
export const DISCLOSED_LGD_ASSUMPTION = 0.45;
