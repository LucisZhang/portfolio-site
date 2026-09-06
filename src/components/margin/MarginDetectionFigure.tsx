"use client";

import { useMemo } from "react";
import ScrollRegion from "@/components/ScrollRegion";
import { StatGrid } from "@/components/exhibition/StatGrid";
import { useI18n } from "@/lib/i18n";
import { zhWrapDisplay, zhWrapText } from "@/lib/zh-wrap";
import { getProject } from "@/lib/projects";
import { calendarEndWeek, detectionReport, elasticityReport, metricRegistry, totalWeeks, weekIndex } from "./marginData";

const marginProject = getProject("analytics", "margin-control-tower");

const WIDTH = 1080;
const HEIGHT = 340;
const PAD_X = 60;
const BASELINE_Y = 56;
const PLOT_HEIGHT = HEIGHT - BASELINE_Y - 56;

function fmtPrecision(value: number) {
  // Matches the user-approved mock's ".316" style (no leading zero) --
  // spec-authority output/design-legacy/legacy-5-margin-control-tower.html.
  return value.toFixed(3).replace(/^0\./, ".");
}

function fmtRecall(value: number) {
  return value.toFixed(2);
}

// Fixed vocabulary mapping (dataset field name -> display label), not a
// computed number -- reuses the "贡献毛利" term projects.ts already coined
// for this project, so the zh-purity localization gate (body-prose scan,
// scripts/check-localization.mjs's PROSE_CHECK_ROUTES) never sees a
// multi-word untranslated English metric list on the zh page.
const METRIC_LABELS_ZH: Record<string, string> = {
  gross_revenue: "毛收入",
  net_revenue: "净收入",
  contribution_margin: "贡献毛利",
  contribution_margin_rate: "贡献毛利率",
};

function useDetectionGeometry() {
  return useMemo(() => {
    const zValues = detectionReport.labeled_weeks.map((row) => row.robust_z_score);
    const zAbsMax = Math.max(...zValues.map(Math.abs)) * 1.08;
    const toX = (index: number) => PAD_X + (index / (totalWeeks - 1)) * (WIDTH - PAD_X * 2);
    const toY = (z: number) => BASELINE_Y + (Math.abs(z) / zAbsMax) * PLOT_HEIGHT;
    const thresholdY = toY(detectionReport.threshold);
    const zAbsValues = zValues.map(Math.abs);
    const multipleLow = Math.floor(Math.min(...zAbsValues) / detectionReport.threshold);
    const multipleHigh = Math.floor(Math.max(...zAbsValues) / detectionReport.threshold);
    return { toX, toY, thresholdY, multipleLow, multipleHigh };
  }, []);
}

// Exhibit 01: the chart-led first screen, per the user-approved analytics
// exception (output/design-legacy/legacy-5-margin-control-tower.html) --
// the assertion, stat line, and full detection figure sit together as one
// continuous first screen rather than a split hero+compact/full-instrument
// pair, matching the mock and the Triage Router precedent of folding hero
// content into exhibit 01 rather than a separate exhibit 00.
export function MarginDetectionFigure() {
  const { locale } = useI18n();
  const { toX, toY, thresholdY, multipleLow, multipleHigh } = useDetectionGeometry();
  const metricNames = locale === "en"
    ? metricRegistry.metrics.map((metric) => metric.id.replaceAll("_", " ")).join(" / ")
    : metricRegistry.metrics.map((metric) => METRIC_LABELS_ZH[metric.id] ?? metric.id).join("、");
  const labelSource = detectionReport.label_source_localized[locale];

  const stats = [
    { value: fmtRecall(detectionReport.recall), label: locale === "en" ? "recall · 0 missed" : "召回率 · 0 次漏检" },
    { value: fmtPrecision(detectionReport.precision), label: locale === "en" ? `precision · ${detectionReport.true_positives} tp / ${detectionReport.false_positives} fp` : `精确率 · ${detectionReport.true_positives} 真阳性 / ${detectionReport.false_positives} 假阳性` },
    { value: String(totalWeeks), label: locale === "en" ? `weeks · ${detectionReport.missing_week_count} missing, declared` : `周 · 已声明 ${detectionReport.missing_week_count} 周缺失` },
    // copy-lint: allow robust -- statistical method name (STL + robust z-score, DetectionPanel.tsx precedent)
    { value: `±${detectionReport.threshold}`, label: locale === "en" ? "robust-z alarm threshold" : "稳健 z 值告警阈值" },
  ];

  return (
    <section id="exhibit-01" className="exhibit margin-detection" data-exhibit="01" data-bg="paper" aria-labelledby="exhibit-01-title">
      <p className="exhibit-opening-row">
        <span className="exhibit-number" aria-hidden="true">01</span>
        {/* copy-lint: allow robust -- statistical method name (STL + robust z-score, DetectionPanel.tsx precedent) */}
        <span className="exhibit-eyebrow">OLIST-MARGIN-PARQUET-V1 / STL + ROBUST Z-SCORE / EVALUATED {detectionReport.evaluated_at}</span>
      </p>
      <h1 id="exhibit-01-title" className="exhibit-title">
        {locale === "en" ? (
          <>Six injected leaks. Six alarms.<br /><em>Thirteen false ones — counted, not hidden.</em></>
        ) : (
          zhWrapDisplay(<>六次注入的泄漏，六次告警。<br /><em>还有十三次假阳性——如实计入，不是藏起来。</em></>)
        )}
      </h1>
      {locale === "zh" && marginProject ? <p className="cn-gloss" lang="zh">{zhWrapDisplay(marginProject.glossZh)}</p> : null}
      <p className="exhibit-intro">
        {locale === "en"
          // copy-lint: allow robust -- statistical method name (STL + robust z-score, DetectionPanel.tsx precedent)
          ? "Deterministic margin leaks were replayed into 106 weeks of real Olist contribution margin; STL plus a robust z-score had to find them. It found all six — at the cost of thirteen false alarms, which stay on the record."
          : "确定性的毛利泄漏被重放进 106 周真实的 Olist 贡献毛利序列；STL 加稳健 z 值检测必须把它们找出来。六次全部找到——代价是十三次假阳性告警，同样留在记录里。"}
      </p>

      <StatGrid items={stats} />

      <div className="margin-detection-figure" data-testid="margin-detection-figure">
        <div className="exhibit-opening-row margin-detection-figure-head">
          {/* copy-lint: allow robust -- statistical method name (STL + robust z-score, DetectionPanel.tsx precedent) */}
          <span className="exhibit-eyebrow">{locale === "en" ? "EXHIBIT 01 · ROBUST Z AT EACH INJECTED LEAK WEEK" : zhWrapText("展品 01 · 每个注入泄漏周的稳健 Z 值")}</span>
          <span className="exhibit-eyebrow">{locale === "en" ? `WEEKLY CONTRIBUTION MARGIN · STL PERIOD ${detectionReport.stl_period_weeks} WK` : zhWrapText(`周度贡献毛利 · STL 周期 ${detectionReport.stl_period_weeks} 周`)}</span>
        </div>
        <svg className="margin-detection-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-hidden="true">
          <line className="margin-detection-axis" x1={PAD_X} y1={BASELINE_Y} x2={WIDTH - PAD_X} y2={BASELINE_Y} />
          <text className="margin-detection-lbl" x={PAD_X - 40} y={BASELINE_Y + 4}>z 0</text>

          <line className="margin-detection-threshold" x1={PAD_X} y1={thresholdY} x2={WIDTH - PAD_X} y2={thresholdY} />
          <text className="margin-detection-lbl margin-detection-lbl-ink" x={PAD_X - 40} y={thresholdY + 4}>−{detectionReport.threshold}</text>
          <text className="margin-detection-lbl" x={WIDTH - PAD_X} y={thresholdY - 6} textAnchor="end">alarm |z| ≥ {detectionReport.threshold}</text>

          <g className="margin-detection-missing-ticks">
            {detectionReport.missing_weeks.map((week) => {
              const x = toX(weekIndex(week));
              return <line key={week} x1={x} y1={BASELINE_Y - 8} x2={x} y2={BASELINE_Y} />;
            })}
          </g>
          <text className="margin-detection-lbl" x={PAD_X} y={BASELINE_Y - 16}>
            {locale === "en"
              ? `${detectionReport.missing_week_count} missing weeks · excluded by rule, not imputed`
              : `缺失 ${detectionReport.missing_week_count} 周 · 按规则剔除，未做插值`}
          </text>

          {detectionReport.labeled_weeks.map((row) => {
            const x = toX(weekIndex(row.week));
            const y = toY(row.robust_z_score);
            return (
              <g key={row.week}>
                <line className="margin-detection-line" x1={x} y1={BASELINE_Y} x2={x} y2={y} />
                <circle className="margin-detection-dot" data-detection-dot="true" cx={x} cy={y} r={4.5} />
                <text className="margin-detection-zlabel" x={x} y={y + 18} textAnchor="middle">{row.robust_z_score.toFixed(1)}</text>
                <text className="margin-detection-wklabel" x={x} y={y + 32} textAnchor="middle">{row.week}</text>
              </g>
            );
          })}

          <text className="margin-detection-lbl" x={PAD_X} y={HEIGHT - 8}>{detectionReport.missing_weeks[0]?.slice(0, 7)}</text>
          <text className="margin-detection-lbl" x={WIDTH - PAD_X} y={HEIGHT - 8} textAnchor="end">
            {calendarEndWeek.slice(0, 7)} · {totalWeeks} {locale === "en" ? "weeks" : "周"}
          </text>
          <text className="margin-detection-lbl" x={WIDTH - PAD_X} y={HEIGHT / 2} textAnchor="end">
            {locale === "en"
              ? `every injected leak lands ${multipleLow}–${multipleHigh}× past the alarm line`
              : `每次注入的泄漏都超出告警线 ${multipleLow}–${multipleHigh} 倍`}
          </text>
        </svg>

        {/* No-JS static fallback: the same 6 rows the SVG plots above,
            server-rendered regardless of hydration (tests/e2e/no-js.spec.ts
            precedent -- DriftChart.tsx's identical table-under-chart
            pattern). */}
        <ScrollRegion className="margin-table-scroll" label={{ en: "Detection weeks table", zh: "检出周表" }}>
          <table className="margin-detection-table" data-detection-table>
            <thead>
              <tr>
                <th>{locale === "en" ? "Week" : "周"}</th>
                {/* copy-lint: allow robust -- statistical method name (STL + robust z-score, DetectionPanel.tsx precedent) */}
                <th>{locale === "en" ? "Robust z" : "稳健 z 值"}</th>
                <th>{locale === "en" ? "Injected Δ" : "注入 Δ"}</th>
                <th>{locale === "en" ? "Status" : "状态"}</th>
              </tr>
            </thead>
            <tbody>
              {detectionReport.labeled_weeks.map((row) => (
                <tr key={row.week} data-detection-row data-detected={row.detected}>
                  <td>{row.week}</td>
                  <td>{row.robust_z_score.toFixed(2)}</td>
                  <td>{row.injected_delta.toFixed(2)}</td>
                  <td>{row.detected ? (locale === "en" ? "Detected" : "已检出") : (locale === "en" ? "Missed" : "漏检")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollRegion>
      </div>

      <div className="margin-detection-foot">
        <p className="margin-detection-elasticity">
          {locale === "en" ? (
            <>Promotion depth moves volume by <b>{elasticityReport.coefficient.toFixed(4)}</b> [{elasticityReport.confidence_interval_95[0].toFixed(4)}, {elasticityReport.confidence_interval_95[1].toFixed(4)}] per log unit — but holdout MAPE is <b>{elasticityReport.holdout_mape.toFixed(3)}</b>, so the elasticity is reported as descriptive association, not a forecasting tool.</>
          ) : (
            <>促销折扣深度每变化一个对数单位，销量随之变化 <b>{elasticityReport.coefficient.toFixed(4)}</b>[{elasticityReport.confidence_interval_95[0].toFixed(4)}, {elasticityReport.confidence_interval_95[1].toFixed(4)}]——但留出期 MAPE 高达 <b>{elasticityReport.holdout_mape.toFixed(3)}</b>，因此这一系数只作为描述性关联披露，不作为预测工具。</>
          )}
        </p>
        <p className="margin-detection-boundary">
          {locale === "en" ? `${metricRegistry.metrics.length} governed metrics · ${metricNames}` : `受治理指标 ${metricRegistry.metrics.length} 个 · ${metricNames}`}
          <br />
          {locale === "en" ? "label source" : "标签来源"}: {labelSource}
        </p>
      </div>
    </section>
  );
}

export default MarginDetectionFigure;
