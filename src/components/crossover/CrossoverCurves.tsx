"use client";

import { useI18n } from "@/lib/i18n";
import ScrollRegion from "@/components/ScrollRegion";
import { zhWrapDisplay } from "@/lib/zh-wrap";
import { amazonNull, ml32mChurnPercent, ml32mCrossover, ml32mMarkerIndex, ml32mNStar, type CurveSeries } from "./crossoverCurvesData";

// Task L6 [CLAUDE]: exhibit 02, the two main curves the task brief keeps
// from the pre-rebuild CrossoverExhibit.tsx (Amazon null vs ML-32M
// n*=20) -- restyled to the site's de-boxed Evidence grammar (hairlines
// only, no panel backgrounds/borders, per margin.css/credit.css
// precedent) instead of the retired component's boxed "crossover-panel"
// grid. The catalog-churn mechanism panel that used to sit alongside
// these two curves is deliberately dropped here: its one load-bearing
// number (41.11% catalog churn) is preserved verbatim in the report
// layer's Results & negatives / Provenance copy (projects.ts `outcome`/
// `provenance`, unchanged), so nothing the argument depends on is lost --
// see task-L6-report.md's kept/dropped inventory.

const CHART = { width: 640, height: 260, left: 56, right: 14, top: 16, bottom: 40 };

function formatMetric(value: number, maximum: number) {
  return maximum < 0.02 ? value.toFixed(4) : value.toFixed(2);
}

function CurveChart({ title, regionLabel, segments, series, markerAt, markerLabel }: { title: string; regionLabel: { en: string; zh: string }; segments: string[]; series: CurveSeries[]; markerAt?: number; markerLabel?: string }) {
  const values = series.flatMap((item) => item.points.flatMap((point) => [point.value, point.ci_hi]));
  const maximum = Math.max(...values) * 1.08;
  const innerWidth = CHART.width - CHART.left - CHART.right;
  const innerHeight = CHART.height - CHART.top - CHART.bottom;
  const x = (index: number) => CHART.left + (segments.length === 1 ? 0 : (index * innerWidth) / (segments.length - 1));
  const y = (value: number) => CHART.top + innerHeight - (value / maximum) * innerHeight;
  const ticks = [0, 0.5, 1].map((ratio) => ratio * maximum);

  return (
    <ScrollRegion className="crossover-curve-scroll" label={regionLabel}>
      <svg className="crossover-curve-chart" viewBox={`0 0 ${CHART.width} ${CHART.height}`} role="img" aria-label={title}>
        <title>{title}</title>
        {ticks.map((tick) => (
          <g className="crossover-curve-gridline" key={tick}>
            <line x1={CHART.left} x2={CHART.width - CHART.right} y1={y(tick)} y2={y(tick)} />
            <text x={CHART.left - 8} y={y(tick) + 4}>{formatMetric(tick, maximum)}</text>
          </g>
        ))}
        {markerAt !== undefined ? (
          <g className="crossover-curve-marker">
            <line x1={x(markerAt)} x2={x(markerAt)} y1={CHART.top} y2={CHART.top + innerHeight} />
            {markerLabel ? <text x={x(markerAt) + 6} y={CHART.top + 12}>{markerLabel}</text> : null}
          </g>
        ) : null}
        {series.map((item, seriesIndex) => {
          const path = item.points.map((point, index) => `${index === 0 ? "M" : "L"}${x(index)},${y(point.value)}`).join(" ");
          return (
            <g className={`crossover-curve-series series-${seriesIndex + 1}`} data-series={item.key} key={item.key}>
              {item.points.map((point, index) => (
                <g className="crossover-curve-ci" key={point.segment}>
                  <line x1={x(index)} x2={x(index)} y1={y(point.ci_hi)} y2={y(point.ci_lo)} />
                  <line x1={x(index) - 3} x2={x(index) + 3} y1={y(point.ci_hi)} y2={y(point.ci_hi)} />
                  <line x1={x(index) - 3} x2={x(index) + 3} y1={y(point.ci_lo)} y2={y(point.ci_lo)} />
                </g>
              ))}
              <path d={path} />
              {item.points.map((point, index) => <circle cx={x(index)} cy={y(point.value)} r={3} key={point.segment} />)}
            </g>
          );
        })}
        {segments.map((segment, index) => (
          <text className="crossover-curve-axis-label" textAnchor="middle" x={x(index)} y={CHART.height - 14} key={segment}>{segment}</text>
        ))}
      </svg>
    </ScrollRegion>
  );
}

function CurveLegend({ series }: { series: CurveSeries[] }) {
  return (
    <div className="crossover-curve-legend">
      {series.map((item, index) => (
        <span className={`series-${index + 1}`} key={item.key}>
          <i aria-hidden="true" />{item.label}<code>{item.run_id}</code>
        </span>
      ))}
    </div>
  );
}

// No-JS static fallback: the same rows the SVG plots, always server-
// rendered regardless of hydration (MarginDetectionFigure.tsx precedent).
function CurveTable({ regionLabel, segments, series }: { regionLabel: { en: string; zh: string }; segments: string[]; series: CurveSeries[] }) {
  return (
    <ScrollRegion className="crossover-table-scroll" label={regionLabel}>
      <table className="crossover-curve-table">
        <thead>
          <tr>
            <th>series</th>
            {segments.map((segment) => <th className="r" key={segment}>{segment}</th>)}
          </tr>
        </thead>
        <tbody>
          {series.map((item) => (
            <tr key={item.key}>
              <td>{item.label}</td>
              {item.points.map((point) => <td className="r" key={point.segment}>{point.value.toFixed(4)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollRegion>
  );
}

export function CrossoverCurves() {
  const { locale } = useI18n();

  return (
    <section id="exhibit-02" className="exhibit crossover-curves" data-exhibit="02" data-bg="paper" aria-labelledby="exhibit-02-title">
      <p className="exhibit-opening-row">
        <span className="exhibit-number" aria-hidden="true">02</span>
        <span className="exhibit-eyebrow">NDCG@10 BY HISTORY DEPTH · AMAZON ELECTRONICS + MOVIELENS-32M</span>
      </p>
      <h1 id="exhibit-02-title" className="exhibit-title">
        {locale === "en" ? <>One curve never crosses. <em>The other crosses at n*={ml32mNStar}.</em></> : zhWrapDisplay(<>一条曲线从未交叉，<em>{`另一条在 n*=${ml32mNStar} 处交叉。`}</em></>)}
      </h1>
      <p className="exhibit-intro">
        {locale === "en"
          ? "Same metric, same paired-bootstrap discipline, two catalogs. The gap between a personalized model and recency-weighted popularity either closes or it doesn't — these two panels are that comparison, not a summary of it."
          : "同一个指标、同一套配对自举检验，换了两份目录。个性化模型与近期热门榜之间的差距，要么收窄到头也没有归零，要么真的翻过去——下面两张图就是这场比较本身，不是它的转述。"}
      </p>

      <div className="crossover-curve-panel" data-exhibit="amazon-null">
        <p className="exhibit-opening-row crossover-curve-panel-head">
          <span className="exhibit-eyebrow">AMAZON ELECTRONICS · POPULARITY VS ALS</span>
        </p>
        <h2>{locale === "en" ? "No crossover on Amazon" : "Amazon 上没有交叉点"}</h2>
        <p className="crossover-curve-caption">
          {locale === "en"
            ? "ALS stays below recency-weighted popularity at every observed history depth. The gap narrows from 1–4 interactions to 20+, but never reaches zero."
            : "在每一个观测到的历史深度，ALS 都低于按近期加权的热门榜。差距从 1–4 次交互到 20+ 次在收窄，但从未走到零。"}
        </p>
        <CurveChart title={locale === "en" ? "Amazon NDCG at 10 by history depth" : "Amazon 各历史深度的 NDCG@10"} regionLabel={{ en: "Amazon results chart", zh: "Amazon 结果图表" }} segments={amazonNull.segments} series={amazonNull.series as CurveSeries[]} />
        <CurveLegend series={amazonNull.series as CurveSeries[]} />
        <CurveTable regionLabel={{ en: "Amazon results table", zh: "Amazon 结果表" }} segments={amazonNull.segments} series={amazonNull.series as CurveSeries[]} />
      </div>

      <div className="crossover-curve-panel" data-exhibit="ml32m-crossover">
        <p className="exhibit-opening-row crossover-curve-panel-head">
          <span className="exhibit-eyebrow">MOVIELENS-32M · POPULARITY VS ITEM-KNN</span>
        </p>
        <h2>{locale === "en" ? `The crossover appears at n*=${ml32mNStar}` : `交叉点出现在 n*=${ml32mNStar}`}</h2>
        <p className="crossover-curve-caption">
          {locale === "en"
            ? `With ${ml32mChurnPercent}% catalog churn, trailing-window item-kNN overtakes popularity from ${ml32mNStar} interactions onward on NDCG@10, after Benjamini–Hochberg correction.`
            : `目录换血率降到 ${ml32mChurnPercent}% 后，按时间窗训练的 item-kNN 从 ${ml32mNStar} 次历史交互起，在 NDCG@10 上超过热门榜——经 Benjamini–Hochberg 校正后仍然成立。`}
        </p>
        <CurveChart
          title={locale === "en" ? "MovieLens-32M NDCG at 10 by history depth" : "MovieLens-32M 各历史深度的 NDCG@10"}
          regionLabel={{ en: "ML-32M results chart", zh: "ML-32M 结果图表" }}
          segments={ml32mCrossover.segments}
          series={ml32mCrossover.series as CurveSeries[]}
          markerAt={ml32mMarkerIndex}
          markerLabel={`n*=${ml32mNStar}`}
        />
        <CurveLegend series={ml32mCrossover.series as CurveSeries[]} />
        <CurveTable regionLabel={{ en: "ML-32M results table", zh: "ML-32M 结果表" }} segments={ml32mCrossover.segments} series={ml32mCrossover.series as CurveSeries[]} />
      </div>
    </section>
  );
}

export default CrossoverCurves;
