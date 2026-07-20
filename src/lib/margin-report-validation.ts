export interface DetectionReport {
  report_version: "detection-report-v2";
  dataset_id: string;
  artifact_sha256: string;
  evaluated_at: string;
  method: "STL + robust z-score";
  label_source: string;
  label_source_localized: { en: string; zh: string };
  precision: number;
  recall: number;
  true_positives: number;
  false_positives: number;
  false_negatives: number;
  threshold: number;
  stl_period_weeks: number;
  labeled_weeks: Array<{
    week: string;
    label: string;
    label_localized: { en: string; zh: string };
    detected: boolean;
    status: "detected" | "missed";
    injected_delta: number;
    robust_z_score: number;
  }>;
  boundary_localized: { en: string; zh: string };
}

export interface ElasticityReport {
  report_version: "elasticity-report-v1";
  dataset_id: string;
  artifact_sha256: string;
  evaluated_at: string;
  method: "HC3 log-log OLS with category, region, and payment-channel fixed effects; fit excludes final 8 weeks";
  coefficient: number;
  confidence_interval_95: [number, number];
  holdout_mape: number;
  analysis_rows: number;
  holdout_rows: number;
}

export type MarginReports = {
  detection: DetectionReport;
  elasticity: ElasticityReport;
};

export type MarginReportKind = keyof MarginReports;
export type MarginReportFailureStatus = "pending" | "invalid";

export class MarginReportValidationError extends Error {
  readonly status: MarginReportFailureStatus;
  readonly report: MarginReportKind;

  constructor(status: MarginReportFailureStatus, report: MarginReportKind) {
    super(`${report} report ${status}`);
    this.name = "MarginReportValidationError";
    this.status = status;
    this.report = report;
  }
}

function localized(entry: unknown): entry is { en: string; zh: string } {
  return Boolean(entry && typeof entry === "object"
    && typeof (entry as { en?: unknown }).en === "string" && Boolean((entry as { en: string }).en.trim())
    && typeof (entry as { zh?: unknown }).zh === "string" && Boolean((entry as { zh: string }).zh.trim()));
}

export function isDetectionReport(value: unknown, artifactSha256: string): value is DetectionReport {
  if (!value || typeof value !== "object") return false;
  const report = value as Partial<DetectionReport>;
  if (report.report_version !== "detection-report-v2" || report.method !== "STL + robust z-score") return false;
  if (![report.dataset_id, report.evaluated_at, report.label_source].every((entry) => typeof entry === "string" && Boolean(entry.trim()))) return false;
  if (typeof report.artifact_sha256 !== "string" || !/^[a-f0-9]{64}$/.test(report.artifact_sha256) || report.artifact_sha256 !== artifactSha256) return false;
  if (!localized(report.label_source_localized) || !localized(report.boundary_localized)) return false;
  const precisionValue = report.precision;
  const recallValue = report.recall;
  const truePositives = report.true_positives;
  const falsePositives = report.false_positives;
  const falseNegatives = report.false_negatives;
  if (![precisionValue, recallValue].every((metric) => typeof metric === "number" && Number.isFinite(metric) && metric >= 0 && metric <= 1)) return false;
  if (![truePositives, falsePositives, falseNegatives].every((metric) => typeof metric === "number" && Number.isInteger(metric) && metric >= 0)) return false;
  if (typeof precisionValue !== "number" || typeof recallValue !== "number" || typeof truePositives !== "number" || typeof falsePositives !== "number" || typeof falseNegatives !== "number") return false;
  if (typeof report.threshold !== "number" || !Number.isFinite(report.threshold) || report.threshold <= 0) return false;
  if (typeof report.stl_period_weeks !== "number" || !Number.isInteger(report.stl_period_weeks) || report.stl_period_weeks < 2) return false;
  if (!Array.isArray(report.labeled_weeks) || report.labeled_weeks.length !== truePositives + falseNegatives) return false;
  const rowsValid = report.labeled_weeks.every((row) => Boolean(row && typeof row === "object" && /^\d{4}-\d{2}-\d{2}$/.test(row.week)
    && typeof row.label === "string" && Boolean(row.label.trim()) && localized(row.label_localized)
    && typeof row.detected === "boolean" && row.status === (row.detected ? "detected" : "missed")
    && Number.isFinite(row.injected_delta) && Number.isFinite(row.robust_z_score)));
  if (!rowsValid || new Set(report.labeled_weeks.map((row) => row.week)).size !== report.labeled_weeks.length) return false;
  const detected = report.labeled_weeks.filter((row) => row.detected).length;
  if (detected !== truePositives || report.labeled_weeks.length - detected !== falseNegatives) return false;
  const precision = truePositives / Math.max(1, truePositives + falsePositives);
  const recall = truePositives / Math.max(1, truePositives + falseNegatives);
  return Math.abs(precisionValue - precision) <= 0.000001 && Math.abs(recallValue - recall) <= 0.000001;
}

export function isElasticityReport(value: unknown, artifactSha256: string): value is ElasticityReport {
  if (!value || typeof value !== "object") return false;
  const report = value as Partial<ElasticityReport>;
  return report.report_version === "elasticity-report-v1"
    && report.method === "HC3 log-log OLS with category, region, and payment-channel fixed effects; fit excludes final 8 weeks"
    && [report.dataset_id, report.evaluated_at].every((entry) => typeof entry === "string" && Boolean(entry.trim()))
    && typeof report.artifact_sha256 === "string" && /^[a-f0-9]{64}$/.test(report.artifact_sha256) && report.artifact_sha256 === artifactSha256
    && typeof report.coefficient === "number" && Number.isFinite(report.coefficient)
    && Array.isArray(report.confidence_interval_95) && report.confidence_interval_95.length === 2
    && report.confidence_interval_95.every((metric) => typeof metric === "number" && Number.isFinite(metric))
    && report.confidence_interval_95[0] <= report.coefficient && report.coefficient <= report.confidence_interval_95[1]
    && typeof report.holdout_mape === "number" && Number.isFinite(report.holdout_mape) && report.holdout_mape >= 0
    && [report.analysis_rows, report.holdout_rows].every((count) => typeof count === "number" && Number.isInteger(count) && count > 0);
}

async function fetchReport<T>(
  report: MarginReportKind,
  url: string,
  artifactSha256: string,
  validate: (value: unknown, sha256: string) => value is T,
) {
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new MarginReportValidationError("pending", report);
  }
  if (!response.ok) throw new MarginReportValidationError("pending", report);

  let value: unknown;
  try {
    value = await response.json();
  } catch {
    throw new MarginReportValidationError("invalid", report);
  }
  if (!validate(value, artifactSha256)) throw new MarginReportValidationError("invalid", report);
  return value;
}

export async function loadMarginReports(artifactSha256: string): Promise<MarginReports> {
  const results = await Promise.allSettled([
    fetchReport("detection", "/case-studies/margin-control-tower/detection-report.json", artifactSha256, isDetectionReport),
    fetchReport("elasticity", "/case-studies/margin-control-tower/elasticity-report.json", artifactSha256, isElasticityReport),
  ] as const);
  const errors = results.flatMap((result) => result.status === "rejected" && result.reason instanceof MarginReportValidationError ? [result.reason] : []);
  const failure = errors.find((error) => error.status === "invalid") ?? errors[0];
  if (failure) throw failure;
  if (results[0].status !== "fulfilled" || results[1].status !== "fulfilled") throw new MarginReportValidationError("pending", "detection");
  return { detection: results[0].value, elasticity: results[1].value };
}
