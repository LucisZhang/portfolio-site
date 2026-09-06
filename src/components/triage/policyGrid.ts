// Typed access over the triage-router precomputed policy grid (task 3.0's
// output). This module does no fetching and runs no model: it only shapes
// the already-imported compact JSON payloads (public/case-studies/
// triage-router/*.json, imported at module load by the caller) into the
// lookups PolicyTerminal needs — grid[misrouteCost][threshold], the
// strategy-card range for a threshold, and the frontier-curve point list for
// one misroute-cost slice.
//
// Confirmed on the source payload (task 3.0-report.md, cross-checked here
// during implementation): 384 rows = 6 misroute-cost values x 64
// threshold values, and all 6 misroute-cost slices share the exact same 64
// threshold values in the exact same order. That is what makes a dense
// [misrouteCostIndex][thresholdIndex] matrix a safe, lossless reshape of the
// flat grid array.

export type PolicyRow = {
  ci: [number, number];
  escalatePct: number;
  macroF1: number;
  misrouteCostUsd: number;
  monthlyCostUsd: number;
  threshold: number;
};

// The copied task-3.0 payload predates the public disclosure that identifies
// these figures as recorded USD sensitivity values. Keep its byte-exact legacy
// keys at the evidence boundary, then map them once into truthful internal
// names. Supporting canonical keys as well lets a future evidence export fix
// the schema without another UI migration.
export type PolicyRowPayload = Omit<PolicyRow, "misrouteCostUsd" | "monthlyCostUsd"> & (
  | Pick<PolicyRow, "misrouteCostUsd" | "monthlyCostUsd">
  | { misrouteCostCny: number; monthlyCostCny: number }
);

export type StrategyCardRange = {
  copyEn: string;
  copyZh: string;
  max: number;
  min: number;
  name: string;
};

export type StrategyCardRangePayload = StrategyCardRange;

export type PolicyMatrix = {
  misrouteCosts: number[];
  thresholds: number[];
  rows: PolicyRow[][]; // rows[misrouteCostIndex][thresholdIndex]
};

function normalizePolicyRow(row: PolicyRowPayload): PolicyRow {
  const legacy = row as PolicyRowPayload & { misrouteCostCny?: number; monthlyCostCny?: number };
  return {
    ci: row.ci,
    escalatePct: row.escalatePct,
    macroF1: row.macroF1,
    misrouteCostUsd: "misrouteCostUsd" in row ? row.misrouteCostUsd : legacy.misrouteCostCny!,
    monthlyCostUsd: "monthlyCostUsd" in row ? row.monthlyCostUsd : legacy.monthlyCostCny!,
    threshold: row.threshold,
  };
}

export function buildPolicyMatrix(payload: PolicyRowPayload[]): PolicyMatrix {
  const grid = payload.map(normalizePolicyRow);
  const misrouteCosts = [...new Set(grid.map((row) => row.misrouteCostUsd))].sort((a, b) => a - b);
  const thresholds = [...new Set(grid.map((row) => row.threshold))].sort((a, b) => a - b);
  const misrouteIndex = new Map(misrouteCosts.map((value, index) => [value, index]));
  const thresholdIndex = new Map(thresholds.map((value, index) => [value, index]));

  const rows: PolicyRow[][] = misrouteCosts.map(() => new Array(thresholds.length));
  for (const row of grid) {
    const mi = misrouteIndex.get(row.misrouteCostUsd);
    const ti = thresholdIndex.get(row.threshold);
    if (mi === undefined || ti === undefined) {
      throw new Error(`policyGrid: row (${row.misrouteCostUsd}, ${row.threshold}) did not map onto the reshaped matrix`);
    }
    rows[mi][ti] = row;
  }
  for (let mi = 0; mi < rows.length; mi++) {
    for (let ti = 0; ti < thresholds.length; ti++) {
      if (!rows[mi][ti]) throw new Error(`policyGrid: matrix has a hole at [${mi}][${ti}] — the grid is not a dense product of its axes`);
    }
  }
  return { misrouteCosts, thresholds, rows };
}

export function nearestIndex(values: number[], target: number): number {
  let bestIndex = 0;
  let bestDistance = Infinity;
  for (let i = 0; i < values.length; i++) {
    const distance = Math.abs(values[i] - target);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = i;
    }
  }
  return bestIndex;
}

export function cardForThreshold(cards: StrategyCardRange[], threshold: number): StrategyCardRange {
  const hit = cards.find((card) => threshold >= card.min && threshold <= card.max);
  // The three ranges in strategy-cards.json are contiguous and span the full
  // threshold axis (task 3.0-report.md), so this fallback to the last card
  // only guards against a future data change, not a normal path.
  return hit ?? cards[cards.length - 1];
}

// Fills a strategy card's `{token}` placeholders from one grid row. Every
// token in strategy-cards.json's copyEn/copyZh strings is one of these
// fields — the card's prose is never edited here, only completed.
export function normalizeStrategyCards(cards: StrategyCardRangePayload[]): StrategyCardRange[] {
  return cards.map((card) => ({
    ...card,
    // Compatibility for the frozen payload's stale currency words and token
    // names. The value is not converted; only the unit is corrected to the USD
    // basis established by the public disclosure.
    copyEn: card.copyEn.replace("CNY {monthlyCostCny}", "USD {monthlyCostUsd}"),
    copyZh: card.copyZh.replace("{monthlyCostCny} 元", "USD {monthlyCostUsd}"),
  }));
}

export function fillCardTokens(template: string, row: PolicyRow): string {
  return template
    .replaceAll("{threshold}", row.threshold.toFixed(3))
    .replaceAll("{escalatePct}", row.escalatePct.toFixed(1))
    .replaceAll("{monthlyCostUsd}", row.monthlyCostUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
    // Accept the old placeholder if a future caller bypasses
    // normalizeStrategyCards; never reintroduce its stale currency label.
    .replaceAll("{monthlyCostCny}", row.monthlyCostUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
    .replaceAll("{macroF1}", row.macroF1.toFixed(3));
}
