import exhibitsJson from "../../../public/case-studies/crossover-study/exhibits.json";

// Task L6 [CLAUDE]: exhibit 02's typed view of the pre-rebuild exhibits.json
// projection (unchanged by this task -- scripts/generate-home-data.mjs and
// scripts/verify-evidence.mjs both read this same committed file directly,
// so it stays exactly as-is; only the React presentation around it is
// rebuilt). Ports CrossoverExhibit.tsx's own types verbatim.

export type CurvePoint = {
  segment: string;
  n_users: number;
  value: number;
  ci_lo: number;
  ci_hi: number;
};

export type CurveSeries = {
  key: string;
  label: string;
  run_id: string;
  model_name: string;
  points: CurvePoint[];
};

export type CrossoverReceipt = {
  run_id: string;
  kind: string;
  run_ts: string;
  git_sha: string;
  config_path?: string;
  config_hash: string;
  dataset_manifest_hash: string;
  splits: { version: number; frozen_at: string; file_hash: string };
  seeds?: { bootstrap?: number; model?: number | null };
  model?: { name: string; params: Record<string, unknown> } | null;
  wall_clock_s: number;
  hardware: string;
};

const data = exhibitsJson;

export const amazonNull = data.amazon_null;
export const ml32mCrossover = data.ml32m_crossover;
export const crossoverReceipts = data.receipts as CrossoverReceipt[];

// Fix (task review, Important): "n*=20" and "6.40% catalog churn" used to
// be literal strings in CrossoverCurves.tsx/SqlWorkbench.tsx -- contrary
// to the zero-hardcoded-numbers gate and CrossoverSourceReceipts.tsx's own
// "every number on this page pins to one of these files" claim. Both now
// derive from this same exhibits.json projection, the same live-
// computation pattern SqlWorkbench.tsx's query-02 index blurb already
// uses for its "1.61M-item catalog" figure.
if (typeof ml32mCrossover.n_star !== "number") throw new Error("crossoverCurvesData: ml32m_crossover.n_star is missing or not a number");
export const ml32mNStar = ml32mCrossover.n_star;
export const ml32mChurnPercent = (data.catalog_churn.ml32m.churn_share * 100).toFixed(2);

// The chart marker's segment index used to be a bare positional literal
// (markerAt={4}) -- derived here instead, so a change to the segment
// bucketing (e.g. a new "15-19" bucket inserted before "20+") can't
// silently misplace the marker against a stale index. Finds the first
// segment whose label starts with the n*-threshold's own digits (e.g.
// "20+" for n_star=20); throws rather than silently rendering no marker
// if the committed data ever stops agreeing with itself.
export const ml32mMarkerIndex = ml32mCrossover.segments.findIndex((segment) => segment.startsWith(String(ml32mNStar)));
if (ml32mMarkerIndex < 0) throw new Error(`crossoverCurvesData: no ml32m_crossover.segments entry starts with n_star ${ml32mNStar}`);
