"use client";

import { useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import ScrollRegion from "@/components/ScrollRegion";
import { zhWrapDisplay } from "@/lib/zh-wrap";
import frontierJson from "../../../public/case-studies/triage-router/frontier.compact.json";
import { macroF1 as fmtMacroF1, shortHash } from "./triageFormat";

type FrontierPoint = {
  ci: [number, number];
  costCiUsdPer1k: [number, number];
  costPer1kUsd: number;
  key: string;
  kind: string;
  label: string;
  macroF1: number;
  runId: string;
};

const points = (frontierJson as { points: FrontierPoint[] }).points;

const WIDTH = 560;
const HEIGHT = 220;
const PAD = 32;

// Exhibit 03: every single-tier point the compact frontier payload carries
// (Tier A x2, Tier B1 x3 seeds, Tier B2, Tier C x2) plotted cost-per-1k vs
// macro-F1 with both axes' bootstrap CIs -- the eight real recorded model
// checkpoints the cascade in exhibit 01 is built out of. This is a
// different chart from PolicyTerminal's frontier (which sweeps ONE model's
// threshold), so it lives as its own exhibit rather than a second variant
// of the same component.
export function FrontierPareto() {
  const { locale } = useI18n();
  const geometry = useMemo(() => {
    const xs = points.flatMap((p) => p.costCiUsdPer1k);
    const ys = points.flatMap((p) => p.ci);
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    const yMin = Math.min(...ys);
    const yMax = Math.max(...ys);
    const xSpan = xMax - xMin || 1;
    const ySpan = yMax - yMin || 1;
    const toX = (v: number) => PAD + ((v - xMin) / xSpan) * (WIDTH - PAD * 2);
    const toY = (v: number) => HEIGHT - PAD - ((v - yMin) / ySpan) * (HEIGHT - PAD * 2);
    return points.map((p) => ({
      point: p,
      x: toX(p.costPer1kUsd),
      y: toY(p.macroF1),
      xLowX: toX(p.costCiUsdPer1k[0]),
      xHighX: toX(p.costCiUsdPer1k[1]),
      yLowY: toY(p.ci[0]),
      yHighY: toY(p.ci[1]),
    }));
  }, []);

  return (
    <section id="exhibit-03" className="exhibit" data-exhibit="03" data-bg="white" aria-labelledby="exhibit-03-title">
      <p className="exhibit-opening-row">
        <span className="exhibit-number" aria-hidden="true">03</span>
        <span className="exhibit-eyebrow">8 RECORDED TIERS / COST vs MACRO-F1</span>
      </p>
      <h2 id="exhibit-03-title" className="exhibit-title">
        {locale === "en" ? (
          <>Accuracy and cost<br /><em>share the same axis.</em></>
        ) : (
          zhWrapDisplay(<>准确率和成本，<br /><em>共用同一根轴。</em></>)
        )}
      </h2>
      <div className="exhibit-body">
        <svg className="triage-pareto-chart" data-pareto-chart viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-hidden="true">
          {geometry.map((g) => (
            <g key={g.point.key}>
              <line className="triage-pareto-whisker" x1={g.xLowX} x2={g.xHighX} y1={g.y} y2={g.y} />
              <line className="triage-pareto-whisker" x1={g.x} x2={g.x} y1={g.yLowY} y2={g.yHighY} />
              <circle className="triage-pareto-point" cx={g.x} cy={g.y} r={4} />
            </g>
          ))}
        </svg>
        {/* Task F1: same triage-table-scroll pattern as exhibits 02/04 --
            the macro-F1 + CI-range cell alone runs past a 390px viewport. */}
        <ScrollRegion className="triage-table-scroll" label={{ en: "Frontier pareto table", zh: "策略前沿表" }}>
          <table className="triage-pareto-table" data-pareto-table>
            <thead>
              <tr>
                <th>{locale === "en" ? "Tier" : "层级"}</th>
                <th>macro-F1</th>
                <th>{locale === "en" ? "Cost / 1k" : "每千条成本"}</th>
                <th>{locale === "en" ? "Run" : "运行"}</th>
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr key={point.key} data-pareto-row>
                  <td>{point.label}</td>
                  <td>{fmtMacroF1(point.macroF1)} [{fmtMacroF1(point.ci[0])}, {fmtMacroF1(point.ci[1])}]</td>
                  <td>${point.costPer1kUsd.toFixed(2)}</td>
                  <td><code title={point.runId}>{shortHash(point.runId, 10)}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollRegion>
      </div>
    </section>
  );
}

export default FrontierPareto;
