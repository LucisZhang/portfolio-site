"use client";

import { CircleAlert, Radar } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { DetectionReport } from "@/lib/margin-report-validation";

type ReportState = "loading" | "pending" | "invalid" | "ready";

function DetectionReportBody({ locale, report }: { locale: Locale; report: DetectionReport }) {
  return <div className="offline-report-values"><div><span>{locale === "en" ? "Precision" : "精确率"}</span><strong>{report.precision.toFixed(3)}</strong></div><div><span>{locale === "en" ? "Recall" : "召回率"}</span><strong>{report.recall.toFixed(3)}</strong></div><p>{locale === "en" ? `${report.true_positives} TP · ${report.false_positives} FP · ${report.false_negatives} FN` : `${report.true_positives} 真阳性（TP）· ${report.false_positives} 假阳性（FP）· ${report.false_negatives} 假阴性（FN）`}</p><small>{report.dataset_id} · {report.evaluated_at} · {report.label_source_localized[locale]}</small><details className="detection-week-drilldown" data-testid="detection-week-drilldown"><summary>{locale === "en" ? `${report.labeled_weeks.length} labeled replay weeks` : `${report.labeled_weeks.length} 个带标签的重放周`}</summary><div>{report.labeled_weeks.map((row) => <article className={row.detected ? "detected" : "missed"} key={row.week}><div><strong>{row.week}</strong><small>{row.label_localized[locale]}</small></div><span>{row.detected ? (locale === "en" ? "Detected" : "已检出") : (locale === "en" ? "Missed" : "未检出")}</span><code>z {row.robust_z_score.toFixed(2)}</code></article>)}</div><p>{report.boundary_localized[locale]}</p></details></div>;
}

function PendingDetectionReport({ locale, state }: { locale: Locale; state: Exclude<ReportState, "ready"> }) {
  return <div className={`offline-report-pending ${state === "invalid" ? "invalid" : ""}`}><CircleAlert aria-hidden="true" /><div><strong>{state === "invalid" ? (locale === "en" ? "Report blocked: invalid contract" : "因契约无效，报告已拦截") : state === "loading" ? (locale === "en" ? "Loading offline report…" : "正在载入离线报告……") : (locale === "en" ? "Detection report pending" : "检测报告待提交")}</strong><p>{locale === "en" ? "No precision or recall is shown until the active Parquet and detection-report.json both validate." : "只有当前 Parquet 与 detection-report.json 均通过校验后，才会显示精确率与召回率。"}</p></div></div>;
}

export default function DetectionPanel({ locale, state, report = null }: { locale: Locale; state: ReportState; report?: DetectionReport | null }) {
  return <section className="analytics-offline-panel"><div className="analytics-pane-heading"><span><Radar aria-hidden="true" />{locale === "en" ? "Anomaly detection" : "异常检测"}</span><code>{locale === "en" ? "STL + robust z-score" : "STL + 稳健 z 分数"}</code></div>{state === "ready" && report ? <DetectionReportBody locale={locale} report={report} /> : <PendingDetectionReport locale={locale} state={state === "ready" ? "invalid" : state} />}</section>;
}
