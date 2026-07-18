"use client";

import { CircleAlert, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";

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

type ReportState = { kind: "idle" | "loading" | "pending" | "invalid" } | { kind: "ready"; report: ElasticityReport };

function isReport(value: unknown, artifactSha256: string): value is ElasticityReport {
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

function ElasticityReportBody({ locale, artifactSha256 }: { locale: Locale; artifactSha256: string }) {
  const [state, setState] = useState<ReportState>({ kind: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    fetch("/case-studies/margin-control-tower/elasticity-report.json", { signal: controller.signal })
      .then(async (response) => {
        if (response.status === 404) return setState({ kind: "pending" });
        if (!response.ok) throw new Error(`Elasticity report returned ${response.status}`);
        const value: unknown = await response.json();
        setState(isReport(value, artifactSha256) ? { kind: "ready", report: value } : { kind: "invalid" });
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) setState({ kind: "pending" });
    });
    return () => controller.abort();
  }, [artifactSha256]);

  return state.kind === "ready" ? <div className="offline-report-values"><div><span>{locale === "en" ? "Coefficient" : "系数"}</span><strong>{state.report.coefficient.toFixed(3)}</strong></div><div><span>95% CI</span><strong>[{state.report.confidence_interval_95.map((value) => value.toFixed(3)).join(", ")}]</strong></div><p>Holdout MAPE · {(state.report.holdout_mape * 100).toFixed(2)}%</p><small>{state.report.dataset_id} · {state.report.evaluated_at} · {state.report.method}</small></div> : <div className={`offline-report-pending ${state.kind === "invalid" ? "invalid" : ""}`}><CircleAlert aria-hidden="true" /><div><strong>{state.kind === "invalid" ? (locale === "en" ? "Report blocked: invalid contract" : "报告已阻断：契约无效") : state.kind === "loading" ? (locale === "en" ? "Loading offline report…" : "正在载入离线报告……") : (locale === "en" ? "Elasticity report pending" : "弹性报告待提交")}</strong><p>{locale === "en" ? "No coefficient, interval, or holdout MAPE is shown until the active Parquet and elasticity-report.json both validate." : "只有当前 Parquet 与 elasticity-report.json 均通过校验后，才会显示系数、置信区间与 holdout MAPE。"}</p></div></div>;
}

function PendingElasticityReport({ locale }: { locale: Locale }) {
  return <div className="offline-report-pending"><CircleAlert aria-hidden="true" /><div><strong>{locale === "en" ? "Elasticity report pending" : "弹性报告待提交"}</strong><p>{locale === "en" ? "No coefficient, interval, or holdout MAPE is shown until the active Parquet and elasticity-report.json both validate." : "只有当前 Parquet 与 elasticity-report.json 均通过校验后，才会显示系数、置信区间与 holdout MAPE。"}</p></div></div>;
}

export default function ElasticityPanel({ locale, artifactReady = false, artifactSha256 = null }: { locale: Locale; artifactReady?: boolean; artifactSha256?: string | null }) {
  // TODO(real-data): add segment-level estimates only after the pipeline emits multiplicity-adjusted intervals.
  const canValidateReport = artifactReady && typeof artifactSha256 === "string" && /^[a-f0-9]{64}$/.test(artifactSha256);
  return <section className="analytics-offline-panel"><div className="analytics-pane-heading"><span><TrendingUp aria-hidden="true" />{locale === "en" ? "Price elasticity" : "价格弹性"}</span><code>{locale === "en" ? "offline estimate" : "离线估计"}</code></div>{canValidateReport ? <ElasticityReportBody locale={locale} artifactSha256={artifactSha256} /> : <PendingElasticityReport locale={locale} />}</section>;
}
