"use client";

import { CircleAlert, TrendingUp } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { ElasticityReport } from "@/lib/margin-report-validation";
import { localizeStructuralValue } from "@/lib/structural-copy";

type ReportState = "loading" | "pending" | "invalid" | "ready";

function ElasticityReportBody({ locale, report }: { locale: Locale; report: ElasticityReport }) {
  return <div className="offline-report-values"><div><span>{locale === "en" ? "Coefficient" : "系数"}</span><strong>{report.coefficient.toFixed(3)}</strong></div><div><span>{locale === "en" ? "95% CI" : "95% 置信区间"}</span><strong>[{report.confidence_interval_95.map((value) => value.toFixed(3)).join(", ")}]</strong></div><p>{locale === "en" ? "Holdout MAPE" : "留出期 MAPE"} · {(report.holdout_mape * 100).toFixed(2)}%</p><small>{report.dataset_id} · {report.evaluated_at} · {localizeStructuralValue(report.method, locale)}</small></div>;
}

function PendingElasticityReport({ locale, state }: { locale: Locale; state: Exclude<ReportState, "ready"> }) {
  return <div className={`offline-report-pending ${state === "invalid" ? "invalid" : ""}`}><CircleAlert aria-hidden="true" /><div><strong>{state === "invalid" ? (locale === "en" ? "Report blocked: invalid contract" : "因契约无效，报告已拦截") : state === "loading" ? (locale === "en" ? "Loading offline report…" : "正在载入离线报告……") : (locale === "en" ? "Elasticity report pending" : "弹性报告待提交")}</strong><p>{locale === "en" ? "No coefficient, interval, or holdout MAPE is shown until the active Parquet and elasticity-report.json both validate." : "只有当前 Parquet 与 elasticity-report.json 均通过校验后，才会显示系数、置信区间与留出期 MAPE。"}</p></div></div>;
}

export default function ElasticityPanel({ locale, state, report = null }: { locale: Locale; state: ReportState; report?: ElasticityReport | null }) {
  // TODO(real-data): add segment-level estimates only after the pipeline emits multiplicity-adjusted intervals.
  return <section className="analytics-offline-panel"><div className="analytics-pane-heading"><span><TrendingUp aria-hidden="true" />{locale === "en" ? "Price elasticity" : "价格弹性"}</span><code>{locale === "en" ? "offline estimate" : "离线估计"}</code></div>{state === "ready" && report ? <ElasticityReportBody locale={locale} report={report} /> : <PendingElasticityReport locale={locale} state={state === "ready" ? "invalid" : state} />}</section>;
}
