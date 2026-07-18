"use client";

import { CircleAlert, Radar } from "lucide-react";
import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";

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

type ReportState = { kind: "idle" | "loading" | "pending" | "invalid" } | { kind: "ready"; report: DetectionReport };

function isReport(value: unknown, artifactSha256: string): value is DetectionReport {
  if (!value || typeof value !== "object") return false;
  const report = value as Partial<DetectionReport>;
  const localized = (entry: unknown): entry is { en: string; zh: string } => Boolean(entry && typeof entry === "object"
    && typeof (entry as { en?: unknown }).en === "string" && Boolean((entry as { en: string }).en.trim())
    && typeof (entry as { zh?: unknown }).zh === "string" && Boolean((entry as { zh: string }).zh.trim()));
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

function DetectionReportBody({ locale, artifactSha256 }: { locale: Locale; artifactSha256: string }) {
  const [state, setState] = useState<ReportState>({ kind: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    fetch("/case-studies/margin-control-tower/detection-report.json", { signal: controller.signal })
      .then(async (response) => {
        if (response.status === 404) return setState({ kind: "pending" });
        if (!response.ok) throw new Error(`Detection report returned ${response.status}`);
        const value: unknown = await response.json();
        setState(isReport(value, artifactSha256) ? { kind: "ready", report: value } : { kind: "invalid" });
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) setState({ kind: "pending" });
    });
    return () => controller.abort();
  }, [artifactSha256]);

  return state.kind === "ready" ? <div className="offline-report-values"><div><span>Precision</span><strong>{state.report.precision.toFixed(3)}</strong></div><div><span>Recall</span><strong>{state.report.recall.toFixed(3)}</strong></div><p>{state.report.true_positives} TP · {state.report.false_positives} FP · {state.report.false_negatives} FN</p><small>{state.report.dataset_id} · {state.report.evaluated_at} · {state.report.label_source_localized[locale]}</small><details className="detection-week-drilldown" data-testid="detection-week-drilldown"><summary>{locale === "en" ? `${state.report.labeled_weeks.length} labeled replay weeks` : `${state.report.labeled_weeks.length} 个带标签的重放周`}</summary><div>{state.report.labeled_weeks.map((row) => <article className={row.detected ? "detected" : "missed"} key={row.week}><div><strong>{row.week}</strong><small>{row.label_localized[locale]}</small></div><span>{row.detected ? (locale === "en" ? "Detected" : "已检出") : (locale === "en" ? "Missed" : "未检出")}</span><code>z {row.robust_z_score.toFixed(2)}</code></article>)}</div><p>{state.report.boundary_localized[locale]}</p></details></div> : <div className={`offline-report-pending ${state.kind === "invalid" ? "invalid" : ""}`}><CircleAlert aria-hidden="true" /><div><strong>{state.kind === "invalid" ? (locale === "en" ? "Report blocked: invalid contract" : "报告已阻断：契约无效") : state.kind === "loading" ? (locale === "en" ? "Loading offline report…" : "正在载入离线报告……") : (locale === "en" ? "Detection report pending" : "检测报告待提交")}</strong><p>{locale === "en" ? "No precision or recall is shown until the active Parquet and detection-report.json both validate." : "只有当前 Parquet 与 detection-report.json 均通过校验后，才会显示 precision 与 recall。"}</p></div></div>;
}

function PendingDetectionReport({ locale }: { locale: Locale }) {
  return <div className="offline-report-pending"><CircleAlert aria-hidden="true" /><div><strong>{locale === "en" ? "Detection report pending" : "检测报告待提交"}</strong><p>{locale === "en" ? "No precision or recall is shown until the active Parquet and detection-report.json both validate." : "只有当前 Parquet 与 detection-report.json 均通过校验后，才会显示 precision 与 recall。"}</p></div></div>;
}

export default function DetectionPanel({ locale, artifactReady = false, artifactSha256 = null }: { locale: Locale; artifactReady?: boolean; artifactSha256?: string | null }) {
  const canValidateReport = artifactReady && typeof artifactSha256 === "string" && /^[a-f0-9]{64}$/.test(artifactSha256);
  return <section className="analytics-offline-panel"><div className="analytics-pane-heading"><span><Radar aria-hidden="true" />{locale === "en" ? "Anomaly detection" : "异常检测"}</span><code>STL + robust z-score</code></div>{canValidateReport ? <DetectionReportBody locale={locale} artifactSha256={artifactSha256} /> : <PendingDetectionReport locale={locale} />}</section>;
}
