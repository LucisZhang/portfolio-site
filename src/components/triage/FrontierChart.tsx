"use client";

import { useMemo } from "react";
import policiesJson from "../../../public/case-studies/triage-router/policies.compact.json";
import strategyCardsJson from "../../../public/case-studies/triage-router/strategy-cards.json";
import { buildPolicyMatrix, cardForThreshold, fillCardTokens, nearestIndex, normalizeStrategyCards, type PolicyRowPayload, type StrategyCardRangePayload } from "./policyGrid";

// Shared frontier-curve data + chart internals for the Triage Router page.
// Both PolicyTerminal (the interactive "market terminal", exhibit 01's full
// variant) and the hero's naked frontier figure (task W2, Option B) plot the
// SAME threshold sweep against the SAME precomputed policy grid -- this
// module is the single place that reshapes the grid, derives the default
// operating point, and does the cost/macro-F1 -> SVG-coordinate math, so
// neither caller re-derives or forks that logic.
export const matrix = buildPolicyMatrix((policiesJson as { grid: PolicyRowPayload[] }).grid);
export const cards = normalizeStrategyCards((strategyCardsJson as { ranges: StrategyCardRangePayload[] }).ranges);

export { cardForThreshold, fillCardTokens };

// Default operating point: the midpoint threshold of the "Balanced queue"
// strategy card, at the middle misroute-cost value (index 2 of 6: 3.0).
// Both defaults are derived from the payload's own axes, not typed in.
const balancedCard = cards.find((card) => card.name === "Balanced queue") ?? cards[Math.floor(cards.length / 2)];
export const DEFAULT_THRESHOLD_INDEX = nearestIndex(matrix.thresholds, (balancedCard.min + balancedCard.max) / 2);
export const DEFAULT_MISROUTE_INDEX = Math.floor(matrix.misrouteCosts.length / 2);

// SVG frontier chart geometry. Points are plotted in threshold order (the
// cascade's natural axis) rather than re-sorted by cost, so the same
// on-screen position always means the same threshold as the slider moves.
export const CHART_WIDTH = 560;
export const CHART_HEIGHT = 200;
export const CHART_PAD = 28;

export function useFrontierGeometry(misrouteIndex: number) {
  return useMemo(() => {
    const rows = matrix.rows[misrouteIndex];
    const costs = rows.map((row) => row.monthlyCostUsd);
    const ciLows = rows.map((row) => row.ci[0]);
    const ciHighs = rows.map((row) => row.ci[1]);
    const xMin = Math.min(...costs);
    const xMax = Math.max(...costs);
    const yMin = Math.min(...ciLows);
    const yMax = Math.max(...ciHighs);
    const xSpan = xMax - xMin || 1;
    const ySpan = yMax - yMin || 1;
    const toX = (cost: number) => CHART_PAD + ((cost - xMin) / xSpan) * (CHART_WIDTH - CHART_PAD * 2);
    const toY = (value: number) => CHART_HEIGHT - CHART_PAD - ((value - yMin) / ySpan) * (CHART_HEIGHT - CHART_PAD * 2);
    const points = rows.map((row) => ({
      row,
      x: toX(row.monthlyCostUsd),
      y: toY(row.macroF1),
      ciTopY: toY(row.ci[1]),
      ciBottomY: toY(row.ci[0]),
    }));
    return { points, toX, toY };
  }, [misrouteIndex]);
}

export function FrontierChart({ misrouteIndex, thresholdIndex }: { misrouteIndex: number; thresholdIndex: number }) {
  const { points } = useFrontierGeometry(misrouteIndex);
  const current = points[thresholdIndex];
  const path = points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");

  return (
    <svg
      className="triage-frontier-chart"
      data-frontier-chart
      viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
      role="img"
      aria-hidden="true"
    >
      {points.map((point) => (
        <line
          key={`ci-${point.row.threshold}`}
          className="triage-frontier-whisker"
          x1={point.x}
          x2={point.x}
          y1={point.ciTopY}
          y2={point.ciBottomY}
        />
      ))}
      <polyline className="triage-frontier-line" points={path} fill="none" />
      {current ? <circle className="triage-frontier-point" cx={current.x} cy={current.y} r={4.5} /> : null}
    </svg>
  );
}

export default FrontierChart;
