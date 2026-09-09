"use client";

import { useMemo } from "react";
import ScrollRegion from "@/components/ScrollRegion";
import { StatGrid } from "@/components/exhibition/StatGrid";
import { useI18n } from "@/lib/i18n";
import { zhWrapDisplay, zhWrapText } from "@/lib/zh-wrap";
import { CREDIT_BACKTEST_FULL_ROW_COUNT } from "@/lib/credit-backtest-identity";
import { getProject } from "@/lib/projects";
import { activePolicyPoint, backtestReport, policyFrontierReport } from "./creditData";

const creditProject = getProject("analytics", "credit-policy-desk");

const WIDTH = 1080;
const HEIGHT = 372;
const PAD_LEFT = 90;
const PAD_RIGHT = 70;
const BASELINE_Y = 330;
const TOP_Y = 40;

function pct(value: number, digits = 0) {
  return `${(value * 100).toFixed(digits)}%`;
}

function noLeadingZero(value: number, digits: number) {
  return value.toFixed(digits).replace(/^(-?)0\./, "$1.");
}

function thousandsK(count: number) {
  return `${Math.round(count / 1000)}k`;
}

function useFrontierGeometry() {
  return useMemo(() => {
    const points = policyFrontierReport.points;
    const overallDefaultRate = policyFrontierReport.approve_everyone_default_rate_preview;
    const yMax = Math.max(...points.map((point) => point.default_rate), overallDefaultRate) * 1.12;
    const toX = (approvalRate: number) => PAD_LEFT + approvalRate * (WIDTH - PAD_LEFT - PAD_RIGHT);
    const toY = (defaultRate: number) => BASELINE_Y - (defaultRate / yMax) * (BASELINE_Y - TOP_Y);
    const polyline = points.map((point) => `${toX(point.approval_rate).toFixed(1)},${toY(point.default_rate).toFixed(1)}`).join(" ");
    return { toX, toY, polyline, yMax, overallDefaultRate };
  }, []);
}

// Exhibit 01: the chart-led first screen, per the user-approved analytics
// exception mock (output/design-legacy/legacy-6-credit-policy-desk.html) --
// the "A score is not a policy." assertion, stat band, and full policy-
// frontier figure sit together as one continuous first screen, matching
// the Margin Control Tower precedent of folding hero content into exhibit
// 01 rather than a separate exhibit 00. Unlike the mock's own lede text
// ("Slide it and the browser recomputes..."), this rebuild renders the
// frontier as a static figure computed once from the real committed data
// (policyFrontierReport, derived by scripts/generate-credit-policy-
// frontier.mjs from the 624 real backtest-split preview rows) rather than
// claiming a live in-browser slider that the chart-led Evidence composition
// does not actually have -- see that script's header comment.
export function CreditPolicyFrontier() {
  const { locale } = useI18n();
  const { toX, toY, polyline, yMax, overallDefaultRate } = useFrontierGeometry();
  const pd15 = policyFrontierReport.reference_points.pd_15;
  const pd30 = policyFrontierReport.reference_points.pd_30;
  const baseline = backtestReport.models.baseline_isotonic;
  const challenger = backtestReport.models.challenger_isotonic;

  const stats = [
    { value: `${thousandsK(backtestReport.splits.train)}/${thousandsK(backtestReport.splits.calibration)}/${thousandsK(backtestReport.splits.backtest)}`, label: locale === "en" ? "train / calibration / backtest" : "训练 / 校准 / 回测" },
    { value: noLeadingZero(baseline.brier, 4), label: locale === "en" ? "brier · baseline isotonic" : "brier · 基线保序校准" },
    { value: noLeadingZero(baseline.roc_auc, 4), label: locale === "en" ? "auc · baseline" : "auc · 基线模型" },
    { value: noLeadingZero(challenger.roc_auc, 4), label: locale === "en" ? "auc · challenger" : "auc · 挑战者模型" },
    { value: CREDIT_BACKTEST_FULL_ROW_COUNT.toLocaleString(), label: locale === "en" ? "applications" : "笔申请" },
    { value: backtestReport.backtest_default_rate.toFixed(3), label: locale === "en" ? "backtest default rate" : "回测违约率" },
  ];

  const referenceRows: Array<{ key: string; label: string; point: typeof pd15 }> = [
    { key: "pd15", label: "pd ≤ .15", point: pd15 },
    { key: "pd20", label: "pd ≤ .20", point: activePolicyPoint },
    { key: "pd30", label: "pd ≤ .30", point: pd30 },
  ];

  return (
    <section id="exhibit-01" className="exhibit credit-frontier" data-exhibit="01" data-bg="paper" aria-labelledby="exhibit-01-title">
      <div className="exhibit-opening-row">
        <span className="exhibit-number" aria-hidden="true">01</span>
        <ul className="exhibit-meta" aria-label={locale === "en" ? "Evidence context" : "证据上下文"}>
          <li>CREDIT-BACKTEST-PARQUET-V1</li>
          <li>CALIBRATED PD → POLICY</li>
          <li>EVALUATED {backtestReport.evaluated_at}</li>
        </ul>
      </div>
      <h1 id="exhibit-01-title" className="exhibit-title">
        {locale === "en" ? <>A score is not <em>a policy.</em></> : zhWrapDisplay("分数不是策略。")}
      </h1>
      {locale === "zh" && creditProject ? <p className="cn-gloss" lang="zh">{zhWrapDisplay(creditProject.glossZh)}</p> : null}
      <p className="exhibit-intro">
        {locale === "en"
          ? "The same calibrated score column supports any portfolio you like — the decision lives in the threshold below it. The figure recomputes approval share against realized defaults from the published backtest rows; no model runs here, and the scores are offline and frozen."
          : "同一列校准分数，可以支撑任何你想要的组合策略——决策真正落在分数之下的那道阈值上。下图根据已发布的回测记录，重新计算批准比例与实际违约之间的关系；这里不运行任何模型，分数本身是离线且冻结的。"}
      </p>

      <StatGrid items={stats} />

      <div className="credit-frontier-figure" data-testid="credit-policy-frontier-figure">
        <div className="exhibit-opening-row credit-frontier-figure-head">
          <span className="exhibit-eyebrow">{locale === "en" ? "EXHIBIT 01 · THE POLICY FRONTIER — APPROVAL SHARE VS REALIZED DEFAULT" : zhWrapText("展品 01 · 策略前沿——批准比例与实际违约的关系")}</span>
          <span className="exhibit-eyebrow">{locale === "en" ? `COMPUTED FROM PUBLISHED PREVIEW ROWS · ${policyFrontierReport.backtest_preview_row_count} BACKTEST APPLICATIONS` : zhWrapText(`根据已发布的预览记录计算 · ${policyFrontierReport.backtest_preview_row_count} 笔回测申请`)}</span>
        </div>
        <svg className="credit-frontier-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-hidden="true">
          <line className="credit-frontier-axis" x1={PAD_LEFT} y1={BASELINE_Y} x2={WIDTH - PAD_RIGHT} y2={BASELINE_Y} />
          <line className="credit-frontier-axis" x1={PAD_LEFT} y1={TOP_Y} x2={PAD_LEFT} y2={BASELINE_Y} />
          <text className="credit-frontier-lbl" x={WIDTH - PAD_RIGHT} y={BASELINE_Y + 20} textAnchor="end">{locale === "en" ? "share of applications approved →" : "批准比例 →"}</text>
          <text className="credit-frontier-lbl" x={PAD_LEFT} y={BASELINE_Y + 20}>0%</text>
          <text className="credit-frontier-lbl" x={(PAD_LEFT + WIDTH - PAD_RIGHT) / 2} y={BASELINE_Y + 20} textAnchor="middle">50%</text>
          <text className="credit-frontier-lbl" x={PAD_LEFT - 10} y={TOP_Y + 4} textAnchor="end">{pct(yMax)}</text>
          <text className="credit-frontier-lbl" x={PAD_LEFT - 10} y={BASELINE_Y + 4} textAnchor="end">0%</text>
          <text className="credit-frontier-lbl" x={PAD_LEFT} y={TOP_Y - 14}>{locale === "en" ? "default rate among approved" : "已批准群体中的违约率"}</text>

          <line className="credit-frontier-reference" x1={PAD_LEFT} y1={toY(overallDefaultRate)} x2={WIDTH - PAD_RIGHT} y2={toY(overallDefaultRate)} />
          <text className="credit-frontier-lbl credit-frontier-lbl-ink" x={WIDTH - PAD_RIGHT} y={toY(overallDefaultRate) - 6} textAnchor="end">
            {locale === "en"
              ? `approve everyone · ${pct(overallDefaultRate, 1)} default (preview) · ${pct(backtestReport.backtest_default_rate, 1)} full backtest`
              : `全部批准 · 预览集违约率 ${pct(overallDefaultRate, 1)} · 完整回测集 ${pct(backtestReport.backtest_default_rate, 1)}`}
          </text>

          <polyline className="credit-frontier-line" fill="none" points={polyline} />

          <circle className="credit-frontier-alt-mark" cx={toX(pd15.approval_rate)} cy={toY(pd15.default_rate)} r={3.5} />
          <text className="credit-frontier-alt-lbl" x={toX(pd15.approval_rate)} y={toY(pd15.default_rate) + 22} textAnchor="middle">
            pd ≤ .15 · {pct(pd15.approval_rate)} / {pct(pd15.default_rate, 1)}
          </text>
          <circle className="credit-frontier-alt-mark" cx={toX(pd30.approval_rate)} cy={toY(pd30.default_rate)} r={3.5} />
          <text className="credit-frontier-alt-lbl" x={toX(pd30.approval_rate) - 16} y={toY(pd30.default_rate) - 14} textAnchor="end">
            pd ≤ .30 · {pct(pd30.approval_rate)} / {pct(pd30.default_rate, 1)}
          </text>

          <line className="credit-frontier-active-guide" x1={toX(activePolicyPoint.approval_rate)} y1={toY(activePolicyPoint.default_rate)} x2={toX(activePolicyPoint.approval_rate)} y2={BASELINE_Y} />
          <circle className="credit-frontier-active-dot" cx={toX(activePolicyPoint.approval_rate)} cy={toY(activePolicyPoint.default_rate)} r={6} />
          <text className="credit-frontier-active-lbl" x={toX(activePolicyPoint.approval_rate) + 12} y={toY(activePolicyPoint.default_rate) - 6}>
            {locale === "en" ? "policy · approve pd ≤ .20" : "策略 · 批准 pd ≤ .20"}
          </text>
          <text className="credit-frontier-active-lbl" x={toX(activePolicyPoint.approval_rate) + 12} y={toY(activePolicyPoint.default_rate) + 10}>
            {locale === "en"
              ? `${pct(activePolicyPoint.approval_rate, 1)} approved · ${pct(activePolicyPoint.default_rate, 1)} default`
              : `批准 ${pct(activePolicyPoint.approval_rate, 1)} · 违约 ${pct(activePolicyPoint.default_rate, 1)}`}
          </text>
        </svg>

        {/* No-JS static fallback: the same reference points the SVG plots
            above, server-rendered regardless of hydration (margin's
            data-detection-table precedent) -- read straight from the
            build-time-imported policyFrontierReport, so it renders with
            zero client JavaScript. */}
        <ScrollRegion className="credit-table-scroll" label={{ en: "Policy frontier reference table", zh: "政策前沿参考表" }}>
          <table className="credit-frontier-table" data-frontier-table>
            <thead>
              <tr>
                <th>{locale === "en" ? "Threshold" : "阈值"}</th>
                <th>{locale === "en" ? "Approved" : "批准比例"}</th>
                <th>{locale === "en" ? "Default rate" : "违约率"}</th>
              </tr>
            </thead>
            <tbody>
              <tr data-frontier-row="approve-everyone">
                <td>{locale === "en" ? "approve everyone" : "全部批准"}</td>
                <td>100%</td>
                <td>{pct(overallDefaultRate, 1)}</td>
              </tr>
              {referenceRows.map((row) => (
                <tr key={row.key} data-frontier-row={row.key} data-active={row.key === "pd20" ? "true" : undefined}>
                  <td>{row.label}</td>
                  <td>{pct(row.point.approval_rate, 1)}</td>
                  <td>{pct(row.point.default_rate, 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollRegion>
      </div>

      <div className="credit-frontier-foot">
        <p className="credit-frontier-story">
          {locale === "en" ? (
            <>Baseline logistic and challenger XGBoost tie at <b>{noLeadingZero(baseline.brier, 4)}</b> Brier; AUC moves <b>{noLeadingZero(baseline.roc_auc, 4)} → {noLeadingZero(challenger.roc_auc, 4)}</b>. The model race shifts the third decimal — <em>the threshold above moves the whole portfolio.</em></>
          ) : (
            <>基线逻辑回归与挑战者 XGBoost 在 Brier <b>{noLeadingZero(baseline.brier, 4)}</b> 上打平；AUC 从 <b>{noLeadingZero(baseline.roc_auc, 4)} 移到 {noLeadingZero(challenger.roc_auc, 4)}</b>。模型之争只挪动了小数点后第三位——<em>真正挪动整个组合的，是上面那道阈值。</em></>
          )}
        </p>
        <p className="credit-frontier-boundary">
          {locale === "en" ? "granted-loan-only offline association · rejected applicants absent" : "仅含已授信贷款的离线关联分析 · 不含被拒申请人"}
          <br />
          {locale === "en" ? "no production, causal, regulatory, or fairness claim" : "不构成生产、因果、监管或公平性声明"}
        </p>
      </div>
    </section>
  );
}

export default CreditPolicyFrontier;
