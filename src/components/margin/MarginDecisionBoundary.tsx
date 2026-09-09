"use client";

import { useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import ScrollRegion from "@/components/ScrollRegion";
import { zhWrapDisplay } from "@/lib/zh-wrap";
import { detectionReport, metricRegistry } from "./marginData";

const RULER_WIDTH = 640;
const RULER_MAX_MULTIPLE = 4; // ruler spans 0..4x the alarm threshold

function useRulerGeometry() {
  return useMemo(() => {
    const scaleMax = detectionReport.threshold * RULER_MAX_MULTIPLE;
    const toX = (z: number) => (Math.min(z, scaleMax) / scaleMax) * RULER_WIDTH;
    const thresholdX = toX(detectionReport.threshold);
    const marks = detectionReport.labeled_weeks.map((row) => ({ week: row.week, x: toX(Math.abs(row.robust_z_score)) }));
    return { toX, thresholdX, marks, scaleMax };
  }, []);
}

// Exhibit 02: the decision boundary (what actually fires an alarm) plus the
// governed metric registry the whole page's numbers are defined against --
// spec §6.7's "02 decision-boundary/metric-registry content".
export function MarginDecisionBoundary() {
  const { locale } = useI18n();
  const { thresholdX, marks, scaleMax } = useRulerGeometry();

  return (
    <section id="exhibit-02" className="exhibit margin-boundary" data-exhibit="02" data-bg="paper-alt" aria-labelledby="exhibit-02-title">
      <p className="exhibit-opening-row">
        <span className="exhibit-number" aria-hidden="true">02</span>
        <span className="exhibit-eyebrow">{detectionReport.method.toUpperCase()} · {detectionReport.stl_period_weeks}-WEEK PERIOD</span>
      </p>
      <h2 id="exhibit-02-title" className="exhibit-title">
        {locale === "en" ? (
          <>One number decides<br /><em>every alarm.</em></>
        ) : (
          zhWrapDisplay(<>一个数字，<br /><em>决定每一次告警。</em></>)
        )}
      </h2>
      <p className="exhibit-intro">
        {locale === "en"
          // copy-lint: allow robust -- statistical method name (STL + robust z-score, DetectionPanel.tsx precedent)
          ? `Contribution margin is first decomposed by STL (a ${detectionReport.stl_period_weeks}-week seasonal period); the residual is converted to a robust z-score (median and MAD, not mean and standard deviation, so a handful of already-anomalous weeks cannot drag the yardstick). Any week where |z| crosses ${detectionReport.threshold} fires an alarm — nothing else about the week matters to the detector.`
          : `贡献毛利先由 STL 分解（季节周期 ${detectionReport.stl_period_weeks} 周）；残差再换算成稳健 z 值（用中位数和 MAD，不用均值和标准差，这样少数几个已经异常的周不会把量尺本身拖歪）。只要某一周的 |z| 越过 ${detectionReport.threshold}，就会触发告警——检测器不看这周的其他任何信息。`}
      </p>

      <div className="margin-ruler">
        <svg className="margin-ruler-chart" viewBox={`0 0 ${RULER_WIDTH} 64`} role="img" aria-hidden="true">
          <line className="margin-ruler-axis" x1={0} y1={40} x2={RULER_WIDTH} y2={40} />
          <text className="margin-ruler-lbl" x={0} y={58}>0</text>
          <text className="margin-ruler-lbl" x={RULER_WIDTH} y={58} textAnchor="end">{scaleMax.toFixed(1)}</text>
          <line className="margin-ruler-threshold" x1={thresholdX} y1={24} x2={thresholdX} y2={40} />
          <text className="margin-ruler-lbl margin-ruler-lbl-ink" x={thresholdX} y={16} textAnchor="middle">ALARM |z| ≥ {detectionReport.threshold}</text>
          {marks.map((mark) => (
            <circle key={mark.week} className="margin-ruler-mark" data-detection-dot="true" cx={mark.x} cy={40} r={4} />
          ))}
        </svg>
        <p className="margin-ruler-caption">
          {locale === "en"
            ? "Every one of the six injected leaks (vermilion) lands well past the alarm line; none of the ruler's remaining headroom is occupied by a false negative."
            : "六次注入的泄漏（朱砂色）全都远远越过了告警线；标尺剩下的空间里没有一次漏检。"}
        </p>
      </div>

      <div className="margin-registry">
        <h3 className="margin-registry-title">{locale === "en" ? "Governed metric registry" : "受治理的指标注册表"}</h3>
        <ScrollRegion className="margin-table-scroll" label={{ en: "Governed metric registry table", zh: "受治理指标注册表" }}>
          <table className="margin-registry-table">
            <thead>
              <tr>
                <th>{locale === "en" ? "Metric" : "指标"}</th>
                <th>{locale === "en" ? "Formula" : "公式"}</th>
                <th>{locale === "en" ? "Grain" : "粒度"}</th>
                <th>{locale === "en" ? "Unit" : "单位"}</th>
              </tr>
            </thead>
            <tbody>
              {metricRegistry.metrics.map((metric) => (
                <tr key={metric.id}>
                  <td><code>{metric.id}</code></td>
                  <td><code>{metric.formula}</code></td>
                  {/* " x " -> " × " (multiplication sign): cosmetic only,
                      matches this same project's own grain phrasing already
                      in projects.ts ("week × product category × region ×
                      dominant payment channel"). Also keeps the zh-purity
                      body-prose scan from reading "week x product x region
                      x channel" as a 4-plain-word English run (localePurity.ts's
                      LATIN_WORD matches a bare "x" as its own word). */}
                  <td>{metric.grain.replaceAll(" x ", " × ")}</td>
                  <td>{metric.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollRegion>
        <p className="margin-registry-note">
          {locale === "en" ? (
            <>{metricRegistry.metrics.length} metrics, one owner, one provenance line (<code>{metricRegistry.provenance}</code>). Nothing on this page computes a number outside this registry.</>
          ) : (
            // The raw provenance string is metadata, not user-facing prose --
            // shown verbatim only in English (its own recorded value) and
            // referenced without direct quotation here so this line stays
            // fully Chinese, per the localization gate's body-prose scan
            // (scripts/check-localization.mjs's PROSE_CHECK_ROUTES, which
            // this rebuilt page joins).
            <>{metricRegistry.metrics.length} 个指标、一个负责人，来源已记录在案（见英文版原文）。本页任何数字都不会在这张注册表之外另行计算。</>
          )}
        </p>
      </div>
    </section>
  );
}

export default MarginDecisionBoundary;
