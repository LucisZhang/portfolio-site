"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import ScrollRegion from "@/components/ScrollRegion";
import { zhWrapDisplay } from "@/lib/zh-wrap";
import driftJson from "../../../public/case-studies/triage-router/drift.compact.json";
import { macroF1 as fmtMacroF1 } from "./triageFormat";

type DriftPoint = { ci?: [number, number]; period: string; value: number };
type DriftSeries = { points: DriftPoint[]; status: "measured" | "pending"; tier: string };
type DriftPayload = { meta: { metric: string; note?: string }; series: DriftSeries[] };

const drift = driftJson as DriftPayload;

// Friendly labels, matching frontier.compact.json's own tier labeling
// convention (FrontierPareto.tsx) rather than re-deriving from the bare
// `tier` key.
const TIER_LABELS: Record<string, string> = {
  tier_a: "Tier A — TF-IDF LogReg",
  tier_b1: "Tier B1 — ModernBERT-base",
  tier_b2: "Tier B2 — DistilBERT",
  tier_c_haiku: "Tier C — Claude Haiku 4.5",
  tier_c_sonnet: "Tier C — Claude Sonnet 5",
};

function tierLabel(tier: string): string {
  return TIER_LABELS[tier] ?? tier;
}

// Ink-lightness ramp (spec §2.2: "图表默认墨色明度阶(100/70/45/25%)，选中才
// 上朱砂" — chart series default to a ramp of ink opacities; only the
// selected series turns vermilion). Assigned by array order among the
// MEASURED series only — the pending series never draws a line at all.
const INK_RAMP = [1, 0.7, 0.45, 0.25];

const WIDTH = 620;
const HEIGHT = 220;
const PAD_X = 40;
const PAD_Y = 24;

function useDriftGeometry() {
  return useMemo(() => {
    const measured = drift.series.filter((series) => series.status === "measured");
    const periods = measured[0]?.points.map((point) => point.period) ?? [];
    const allValues = measured.flatMap((series) => series.points.flatMap((point) => (point.ci ? point.ci : [point.value])));
    const yMin = Math.min(...allValues);
    const yMax = Math.max(...allValues);
    const ySpan = yMax - yMin || 1;
    const toX = (periodIndex: number) => PAD_X + (periodIndex / Math.max(periods.length - 1, 1)) * (WIDTH - PAD_X * 2);
    const toY = (value: number) => HEIGHT - PAD_Y - ((value - yMin) / ySpan) * (HEIGHT - PAD_Y * 2);
    return { measured, periods, toX, toY };
  }, []);
}

// Exhibit 04: drift 2015-2026 narrative (spec §6.3's "later exhibits" list;
// task 3.0's export_site_payloads.py landed drift.compact.json in a fix
// round after this page's first pass shipped an honest "pending" note in
// its place). Pending tiers (tier_b1) render as unmeasured — no fabricated
// value is ever drawn for them.
export function DriftChart() {
  const { locale } = useI18n();
  const { measured, periods, toX, toY } = useDriftGeometry();
  const [selected, setSelected] = useState<string>(measured[0]?.tier ?? "");
  const pending = drift.series.filter((series) => series.status === "pending");

  return (
    <section id="exhibit-04" className="exhibit triage-drift" data-exhibit="04" data-bg="paper-alt" aria-labelledby="exhibit-04-title">
      <p className="exhibit-opening-row">
        <span className="exhibit-number" aria-hidden="true">04</span>
        <span className="exhibit-eyebrow">DRIFT 2022-H2 – 2026-H1 / {drift.meta.metric.toUpperCase()}</span>
      </p>
      <h2 id="exhibit-04-title" className="exhibit-title">
        {locale === "en" ? (
          <>The model<br /><em>aged out.</em></>
        ) : (
          zhWrapDisplay(<>模型，<br /><em>在时间里过期了。</em></>)
        )}
      </h2>
      <div className="exhibit-body">
        <p className="triage-drift-narrative">
          {locale === "en"
            ? "Every trained tier loses ground as the complaint mix moves past its training window; the two Claude tiers, scored zero-shot with no fitted vocabulary, do not. Tier B1's yearly series is not in the source yet and is shown as pending, not zero."
            : "每个训练出来的分类器都会随着投诉分布走出训练窗口而掉分；两个 Claude 层是零样本打分、没有会过期的拟合词表，所以没有这个问题。Tier B1 的逐年序列在源数据里还没有，这里如实标为待测，不是零。"}
        </p>

        <svg className="triage-drift-chart" data-drift-chart viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-hidden="true">
          {measured.map((series, seriesIndex) => {
            const isSelected = series.tier === selected;
            const opacity = isSelected ? 1 : INK_RAMP[seriesIndex % INK_RAMP.length];
            const path = series.points.map((point, index) => `${toX(index).toFixed(1)},${toY(point.value).toFixed(1)}`).join(" ");
            return (
              <g key={series.tier} data-drift-series={series.tier} data-selected={isSelected}>
                {isSelected ? series.points.map((point, index) => (point.ci ? (
                  <line
                    key={`ci-${point.period}`}
                    className="triage-drift-whisker"
                    x1={toX(index)}
                    x2={toX(index)}
                    y1={toY(point.ci[1])}
                    y2={toY(point.ci[0])}
                  />
                ) : null)) : null}
                <polyline
                  className={isSelected ? "triage-drift-line triage-drift-line-selected" : "triage-drift-line"}
                  style={{ opacity: isSelected ? 1 : opacity }}
                  points={path}
                  fill="none"
                />
              </g>
            );
          })}
        </svg>

        <div className="triage-drift-legend" role="tablist" aria-label={locale === "en" ? "Select a tier" : "选择层级"}>
          {measured.map((series) => (
            <button
              key={series.tier}
              type="button"
              role="tab"
              data-drift-legend-item={series.tier}
              aria-selected={series.tier === selected}
              onClick={() => setSelected(series.tier)}
            >
              {tierLabel(series.tier)}
            </button>
          ))}
          {pending.map((series) => (
            <span key={series.tier} className="triage-drift-legend-pending" data-drift-legend-pending={series.tier}>
              {tierLabel(series.tier)} — {locale === "en" ? "UNMEASURED" : "未测量"}
            </span>
          ))}
        </div>

        {/* no-JS static table: every measured value + CI, plus the pending
            tier rendered as an honest unmeasured row -- never a fabricated
            number. Task F1: wrapped in the shared triage-table-scroll
            pattern (see KnownFailures.tsx) -- 5 measured periods + CI
            subranges per cell overflow 390px without it. */}
        <ScrollRegion className="triage-table-scroll" label={{ en: "Drift over time table", zh: "漂移趋势表" }}>
          <table className="triage-drift-table" data-drift-table>
            <thead>
              <tr>
                <th>{locale === "en" ? "Tier" : "层级"}</th>
                {periods.map((period) => <th key={period}>{period}</th>)}
              </tr>
            </thead>
            <tbody>
              {measured.map((series) => (
                <tr key={series.tier} data-drift-row data-tier={series.tier}>
                  <td>{tierLabel(series.tier)}</td>
                  {series.points.map((point) => (
                    <td key={point.period}>
                      {fmtMacroF1(point.value)}
                      {point.ci ? <small> [{fmtMacroF1(point.ci[0])}, {fmtMacroF1(point.ci[1])}]</small> : null}
                    </td>
                  ))}
                </tr>
              ))}
              {pending.map((series) => (
                <tr key={series.tier} data-drift-row data-tier={series.tier} data-drift-pending="true">
                  <td>{tierLabel(series.tier)}</td>
                  {periods.map((period) => <td key={period}>{locale === "en" ? "PENDING — NOT MEASURED" : "待测——未测量"}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollRegion>
        {drift.meta.note ? (
          <p className="triage-drift-source-note">
            {locale === "en"
              ? `Source note: ${drift.meta.note}`
              : "来源说明：Tier B1 的逐年漂移数据在源数据里尚未测量。"}
          </p>
        ) : null}
      </div>
    </section>
  );
}

export default DriftChart;
