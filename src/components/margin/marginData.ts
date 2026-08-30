import detectionReportJson from "../../../public/case-studies/margin-control-tower/detection-report.json";
import elasticityReportJson from "../../../public/case-studies/margin-control-tower/elasticity-report.json";
import metricRegistryJson from "../../../public/case-studies/margin-control-tower/metric-registry.json";
import { assertDetectionReport, assertElasticityReport, type DetectionReport, type ElasticityReport } from "@/lib/margin-report-validation";
import { OLIST_MARGIN_ARTIFACT_SHA256 } from "@/lib/olist-margin-identity";

// Task L2 rebuild (spec §6.7 "Margin/Credit(归档): Evidence 形态") -- the
// three JSON files below are committed, versioned evidence, not fetched at
// runtime against a swappable Parquet artifact the way the pre-rebuild
// interactive workbench (src/components/analytics/MarginControlTower.tsx,
// now unrouted) treated them. A build-time static import + assertion is a
// STRONGER fail-closed guarantee than that workbench's client-side
// pending/invalid states: an invalid or hash-mismatched report fails the
// build outright rather than silently falling back to a different dataset
// at request time. "Zero hardcoded numbers" downstream of this module means
// every rendered figure/stat/table cell is read from these typed exports,
// never re-typed as a literal in a .tsx file.

// The interfaces in margin-report-validation.ts intentionally validate only
// the fields the pre-rebuild workbench needed; the committed JSON carries a
// few additional fields this rebuild's exhibit 01 figure needs (the
// zero-filled-calendar bookkeeping). Extend locally rather than widening the
// shared validator's contract.
export interface MarginDetectionReport extends DetectionReport {
  missing_weeks: string[];
  missing_week_count: number;
  evaluated_week_count: number;
  observed_week_count: number;
  calendar_frequency: string;
}

export interface MarginElasticityReport extends ElasticityReport {
  boundary: string;
}

// assertDetectionReport/assertElasticityReport (src/lib/margin-report-
// validation.ts) throw MarginDetectionReportContractError /
// MarginElasticityReportContractError on any malformed or hash-mismatched
// report -- the throwing wrappers live there (not inlined here) so the
// fail-closed guarantee has direct unit coverage
// (tests/margin-report-validation.test.mjs) without needing to resolve
// this file's own `@/lib/...` aliases under plain `node --test`.
export const detectionReport = assertDetectionReport(detectionReportJson, OLIST_MARGIN_ARTIFACT_SHA256) as unknown as MarginDetectionReport;
export const elasticityReport = assertElasticityReport(elasticityReportJson, OLIST_MARGIN_ARTIFACT_SHA256) as unknown as MarginElasticityReport;

export interface MetricRegistryEntry {
  id: string;
  formula: string;
  grain: string;
  unit: string;
  decision_use?: string;
}

export interface MetricRegistry {
  schema_version: number;
  metrics: MetricRegistryEntry[];
  owner: string;
  provenance: string;
}

export const metricRegistry = metricRegistryJson as MetricRegistry;

// ---- Detection-figure week grid ----
//
// detection-report.json records only the 11 zero-filled missing weeks and
// the 6 labeled (injected) weeks, not an explicit array of all
// `evaluated_week_count` calendar weeks. The pipeline's own README
// (pipelines/olist-margin/README.md, "The artifact has 95 observed Mondays
// across a 106-Monday calendar. Before STL, the weekly total is reindexed
// to every Monday from 2016-08-29 through 2018-09-03") is the authoritative
// source for the calendar anchor -- it is not re-derivable from the report
// JSON alone (the earliest *labeled* date is 3 weeks after the true
// anchor). This constant is calendar metadata copied verbatim from that
// committed pipeline document, not a metric: every number this page
// displays (precision, recall, z-scores, MAPE, coefficient, weeks-missing
// count) still reads from the JSON exports above.
const CALENDAR_ANCHOR_ISO = "2016-08-29";
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;
const anchorMs = Date.parse(`${CALENDAR_ANCHOR_ISO}T00:00:00Z`);

export function weekIndex(week: string): number {
  return Math.round((Date.parse(`${week}T00:00:00Z`) - anchorMs) / MS_PER_WEEK);
}

export const totalWeeks = detectionReport.evaluated_week_count;

// The true calendar end (last of `totalWeeks` weeks from the anchor above),
// for the figure's x-axis end label -- not the last *labeled* week's date,
// which is an earlier, unrelated field (the final injected leak happens to
// land partway through the calendar, not at its edge).
export const calendarEndWeek = new Date(anchorMs + (totalWeeks - 1) * MS_PER_WEEK).toISOString().slice(0, 10);

// Sanity check (not a metric, a structural assertion): every known week
// (missing + labeled) must resolve inside [0, totalWeeks - 1] under the
// anchor above, or the anchor documentation and this artifact have drifted
// apart -- fail the build rather than render a mispositioned figure.
const knownIndices = [
  ...detectionReport.missing_weeks.map(weekIndex),
  ...detectionReport.labeled_weeks.map((row) => weekIndex(row.week)),
];
if (knownIndices.some((index) => index < 0 || index >= totalWeeks)) {
  throw new Error("Margin detection week grid: a known week resolved outside the documented calendar range.");
}
