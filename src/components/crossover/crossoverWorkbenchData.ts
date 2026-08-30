import queriesJson from "../../../public/case-studies/crossover-study/workbench/queries.json";
import icebergPlateJson from "../../../public/case-studies/crossover-study/workbench/iceberg-plate.json";
import dataScaleJson from "../../../public/case-studies/crossover-study/workbench/results/data-scale.json";
import categoryDistributionJson from "../../../public/case-studies/crossover-study/workbench/results/category-distribution.json";
import crossPurchaseJson from "../../../public/case-studies/crossover-study/workbench/results/cross-purchase.json";
import amazonNullTestJson from "../../../public/case-studies/crossover-study/workbench/results/amazon-null-test.json";
import ml32mCounterexampleJson from "../../../public/case-studies/crossover-study/workbench/results/ml32m-counterexample.json";
import counterexampleCaveatJson from "../../../public/case-studies/crossover-study/workbench/results/counterexample-caveat.json";

// Task L6 [CLAUDE]: build-time source of truth for the cached-state SQL
// workbench (SqlWorkbench.tsx), Task 5.0's real DuckDB export --
// public/case-studies/crossover-study/workbench/{queries.json,iceberg-
// plate.json,results/*.json} -- registered in docs/evidence/r2-source-
// map.md and cited number-by-number in docs/evidence/digits-crossover.md.
// Every one of the 6 curated queries and its result is a static import
// (not a client fetch): clicking a different curated query in the index
// swaps already-loaded state, so the R6 live-engine test requirement
// ("query-index click swaps cached content, still no engine fetch") holds
// structurally, not just by convention.

export type WorkbenchQuery = {
  id: string;
  title: string;
  sql: string;
  comment: string;
};

export type WorkbenchResultRow = Record<string, string | number | boolean>;

export type WorkbenchTelemetry = {
  rowsScanned: number;
  elapsedMs: number;
  bytesScanned: number;
};

export type WorkbenchResult = {
  rows: WorkbenchResultRow[];
  telemetry: WorkbenchTelemetry;
  builtAt: string;
};

export type IcebergPlate = {
  snapshotId: number;
  committedAt: string;
  schemaVersion: number;
  rowCount: number;
  files: number;
  bytes: number;
};

export const workbenchQueries: WorkbenchQuery[] = (queriesJson as { queries: WorkbenchQuery[] }).queries;
export const icebergPlate: IcebergPlate = icebergPlateJson as IcebergPlate;

const RESULTS_BY_ID: Record<string, WorkbenchResult> = {
  "data-scale": dataScaleJson as WorkbenchResult,
  "category-distribution": categoryDistributionJson as WorkbenchResult,
  "cross-purchase": crossPurchaseJson as WorkbenchResult,
  "amazon-null-test": amazonNullTestJson as WorkbenchResult,
  "ml32m-counterexample": ml32mCounterexampleJson as WorkbenchResult,
  "counterexample-caveat": counterexampleCaveatJson as WorkbenchResult,
};

// Fails the build (module-eval time, not a client render) if the curated
// query list and the committed result set ever drift apart -- the same
// "invalid/missing registry fails npm run build" discipline creditData.ts/
// marginData.ts/ragData.ts already use for their own JSON imports.
for (const query of workbenchQueries) {
  if (!RESULTS_BY_ID[query.id]) throw new Error(`crossoverWorkbenchData: no committed result for query id "${query.id}"`);
  if (!query.comment.includes("\n")) throw new Error(`crossoverWorkbenchData: query "${query.id}" comment must carry a research-question line and a why-it-matters line`);
}
if (!Number.isSafeInteger(icebergPlate.rowCount) || icebergPlate.rowCount <= 0) throw new Error("crossoverWorkbenchData: iceberg-plate.json rowCount is missing or invalid");

export function resultForQuery(id: string): WorkbenchResult {
  const result = RESULTS_BY_ID[id];
  if (!result) throw new Error(`crossoverWorkbenchData: no committed result for query id "${id}"`);
  return result;
}

export function workbenchResultHref(id: string): string {
  return `/case-studies/crossover-study/workbench/results/${id}.json`;
}

// The data-scale result's own row for the item catalog -- used to derive
// the "1.61M-item catalog" figure in the query-02 index blurb without a
// hardcoded literal (see SqlWorkbench.tsx).
export function catalogItemCount(): number {
  const row = RESULTS_BY_ID["data-scale"].rows.find((candidate) => candidate.dataset === "silver.items");
  if (!row || typeof row.row_count !== "number") throw new Error("crossoverWorkbenchData: data-scale result is missing the silver.items row_count");
  return row.row_count;
}
