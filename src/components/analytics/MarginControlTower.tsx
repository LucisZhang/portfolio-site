"use client";

import { Check, CircleAlert, Database, Download, RotateCcw, ShieldCheck, SlidersHorizontal, TrendingDown } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import ArtifactLink from "@/components/ArtifactLink";
import DetectionPanel from "@/components/analytics/DetectionPanel";
import ElasticityPanel from "@/components/analytics/ElasticityPanel";
import MarginWaterfall from "@/components/analytics/MarginWaterfall";
import { getAnalyticsDatasetCacheState, materializeAnalyticsDataset, peekAnalyticsDataset, scheduleAnalyticsDatasetWarm } from "@/lib/analytics-data-cache";
import { useI18n } from "@/lib/i18n";
import { loadMarginReports, MarginReportValidationError, type MarginReports } from "@/lib/margin-report-validation";
import { OLIST_MARGIN_ARTIFACT_SHA256 } from "@/lib/olist-margin-identity";
import { localizeStructuralValue } from "@/lib/structural-copy";
import { userFacingError } from "@/lib/user-facing-error";
import type { ParquetArtifactIdentity } from "@/lib/duckdb";
import styles from "./AnalyticsUpgrade.module.css";

const DATA_URL = "/case-studies/margin-control-tower/synthetic-margin-data.json";
const CSV_URL = "/case-studies/margin-control-tower/synthetic-margin-data.csv";
const PARQUET_URL = "/case-studies/margin-control-tower/synthetic-margin-data.parquet";
const SAMPLE_URL = "/case-studies/margin-control-tower/synthetic-margin-sample.csv";
const CONTRACT_URL = "/case-studies/margin-control-tower/data-contract.json";
const REGISTRY_URL = "/case-studies/margin-control-tower/metric-registry.json";
const REAL_PARQUET_URL = "/case-studies/margin-control-tower/olist-margin.parquet";
const SYNTHETIC_CACHE_KEY = "margin:synthetic:v2";
const REAL_PREVIEW_CACHE_KEY = "margin:real-preview:olist-margin-evidence-bundle-v1";
const REAL_CACHE_KEY = "margin:real-full:olist-margin-evidence-bundle-v1";
const HEATMAP_REGIONS = ["North", "South", "West"] as const;

type DatasetSource = "synthetic" | "real";
type RealArtifactStatus = "idle" | "loading" | "loaded" | "pending" | "invalid";
type RealMaterializationStatus = "idle" | "preview" | "loading" | "full" | "unavailable";
type RealFullWarmStatus = "scheduled" | "loading" | "ready" | "unavailable";
type DatasetActivationOptions = { preservePromo?: boolean };

type MarginRow = {
  week: string;
  period_split: "analysis" | "holdout";
  category: string;
  product_id: string;
  product_name: string;
  region: string;
  channel: string;
  order_count: number;
  units: number;
  unit_price: number;
  gross_revenue: number;
  promo_depth: number;
  discounts: number;
  return_rate: number;
  returns: number;
  net_revenue: number;
  cogs: number;
  fulfillment: number;
  contribution_margin: number;
  provenance: string;
  injected_anomaly: boolean;
  anomaly_reason: string;
};

type MarginDataset = {
  source: DatasetSource;
  dataset_version: string;
  seed: number | null;
  classification: string;
  license: string;
  grain: string;
  date_range: { start: string; end: string };
  dimensions: { weeks: number; categories: number; products: number; regions: number; channels: number };
  source_order_count?: number;
  analysis_period: { start: string; end: string };
  holdout_period: { start: string; end: string };
  guided_scenario: { week: string; category: string; region: string; channel: string };
  assumptions: string[];
  rows_sha256: string | null;
  full_row_count?: number;
  recorded_contract_checks?: CheckResult[];
  rows: MarginRow[];
};

type Total = Pick<MarginRow, "order_count" | "units" | "gross_revenue" | "discounts" | "returns" | "net_revenue" | "cogs" | "fulfillment" | "contribution_margin"> & {
  promo_depth: number;
  return_rate: number;
};

type CheckResult = { name: string; pass: boolean };
type ExplorerTab = "sample" | "schema" | "quality";

const money = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const integer = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const marginChecksCache = new WeakMap<MarginRow[], Map<DatasetSource, CheckResult[]>>();

function requiredText(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`Olist Parquet is missing ${field}.`);
  return value;
}

function requiredNumber(value: unknown, field: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`Olist Parquet has an invalid ${field}.`);
  return parsed;
}

function booleanValue(value: unknown) {
  return value === true || value === 1 || value === "1" || value === "true";
}

function buildRealMarginDataset(rawRows: Record<string, unknown>[]): MarginDataset {
  if (!rawRows.length) throw new Error("Olist Parquet contains no rows.");
  const rows = rawRows.map((raw, index): MarginRow => {
    const split = requiredText(raw.period_split, `period_split at row ${index}`);
    if (split !== "analysis" && split !== "holdout") throw new Error(`Olist Parquet has an invalid period_split at row ${index}.`);
    return {
      week: requiredText(raw.week, `week at row ${index}`),
      period_split: split,
      category: requiredText(raw.category, `category at row ${index}`),
      product_id: requiredText(raw.product_id, `product_id at row ${index}`),
      product_name: requiredText(raw.product_name, `product_name at row ${index}`),
      region: requiredText(raw.region, `region at row ${index}`),
      channel: requiredText(raw.channel, `channel at row ${index}`),
      order_count: requiredNumber(raw.order_count, `order_count at row ${index}`),
      units: requiredNumber(raw.units, `units at row ${index}`),
      unit_price: requiredNumber(raw.unit_price, `unit_price at row ${index}`),
      gross_revenue: requiredNumber(raw.gross_revenue, `gross_revenue at row ${index}`),
      promo_depth: requiredNumber(raw.promo_depth, `promo_depth at row ${index}`),
      discounts: requiredNumber(raw.discounts, `discounts at row ${index}`),
      return_rate: requiredNumber(raw.return_rate, `return_rate at row ${index}`),
      returns: requiredNumber(raw.returns, `returns at row ${index}`),
      net_revenue: requiredNumber(raw.net_revenue, `net_revenue at row ${index}`),
      cogs: requiredNumber(raw.cogs, `cogs at row ${index}`),
      fulfillment: requiredNumber(raw.fulfillment, `fulfillment at row ${index}`),
      contribution_margin: requiredNumber(raw.contribution_margin, `contribution_margin at row ${index}`),
      provenance: requiredText(raw.provenance, `provenance at row ${index}`),
      injected_anomaly: booleanValue(raw.injected_anomaly),
      anomaly_reason: typeof raw.anomaly_reason === "string" ? raw.anomaly_reason : "",
    };
  });
  const weeks = [...new Set(rows.map((row) => row.week))].sort();
  const analysisWeeks = [...new Set(rows.filter((row) => row.period_split === "analysis").map((row) => row.week))].sort();
  const holdoutWeeks = [...new Set(rows.filter((row) => row.period_split === "holdout").map((row) => row.week))].sort();
  const splitByWeek = new Map<string, Set<MarginRow["period_split"]>>();
  for (const row of rows) splitByWeek.set(row.week, new Set([...(splitByWeek.get(row.week) ?? []), row.period_split]));
  const finalEightWeeks = weeks.slice(-8);
  if (weeks.some((value) => !/^\d{4}-\d{2}-\d{2}$/.test(value))) throw new Error("Olist Parquet has an invalid week key.");
  if ([...splitByWeek.values()].some((splits) => splits.size !== 1)) throw new Error("Olist Parquet has a week assigned to multiple splits.");
  if (!analysisWeeks.length || holdoutWeeks.length !== 8 || analysisWeeks.at(-1)! >= holdoutWeeks[0] || finalEightWeeks.some((value, index) => value !== holdoutWeeks[index])) {
    throw new Error("Olist Parquet must reserve exactly the final eight observed weeks as holdout.");
  }
  const analysisWeekCounts = new Map<string, number>();
  for (const row of rows) {
    if (row.period_split === "analysis") analysisWeekCounts.set(row.week, (analysisWeekCounts.get(row.week) ?? 0) + 1);
  }
  const populatedAnalysisWeek = [...analysisWeekCounts].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))[0]?.[0];
  const guided = rows.find((row) => row.injected_anomaly)
    ?? rows.filter((row) => row.week === populatedAnalysisWeek).sort((left, right) => left.contribution_margin - right.contribution_margin)[0]
    ?? rows.find((row) => row.period_split === "analysis")
    ?? rows[0];
  return {
    source: "real",
    dataset_version: "olist-margin-parquet-v1",
    seed: null,
    classification: "offline real-data Parquet artifact",
    license: "Olist-derived aggregate · CC BY-NC-SA 4.0",
    grain: "week × product category × region × dominant payment channel",
    date_range: { start: weeks[0], end: weeks.at(-1)! },
    dimensions: {
      weeks: weeks.length,
      categories: new Set(rows.map((row) => row.category)).size,
      products: 0,
      regions: new Set(rows.map((row) => row.region)).size,
      channels: new Set(rows.map((row) => row.channel)).size,
    },
    source_order_count: 99_441,
    analysis_period: { start: analysisWeeks[0], end: analysisWeeks.at(-1)! },
    holdout_period: { start: holdoutWeeks[0], end: holdoutWeeks.at(-1)! },
    guided_scenario: { week: guided.week, category: guided.category, region: guided.region, channel: guided.channel },
    assumptions: ["First category observation falls back to current price, producing zero proxy discount; scenario output remains an assumption, not a causal estimate."],
    rows_sha256: null,
    rows,
  };
}

function near(a: number, b: number) {
  return Math.abs(a - b) <= 0.02;
}

function aggregate(rows: MarginRow[]): Total {
  const total = rows.reduce((current, row) => ({
    order_count: current.order_count + row.order_count,
    units: current.units + row.units,
    gross_revenue: current.gross_revenue + row.gross_revenue,
    discounts: current.discounts + row.discounts,
    returns: current.returns + row.returns,
    net_revenue: current.net_revenue + row.net_revenue,
    cogs: current.cogs + row.cogs,
    fulfillment: current.fulfillment + row.fulfillment,
    contribution_margin: current.contribution_margin + row.contribution_margin,
    promo_depth: 0,
    return_rate: 0,
  }), { order_count: 0, units: 0, gross_revenue: 0, discounts: 0, returns: 0, net_revenue: 0, cogs: 0, fulfillment: 0, contribution_margin: 0, promo_depth: 0, return_rate: 0 });
  total.promo_depth = total.gross_revenue ? total.discounts / total.gross_revenue : 0;
  total.return_rate = total.gross_revenue ? total.returns / total.gross_revenue : 0;
  return total;
}

function checksFor(rows: MarginRow[], source: DatasetSource): CheckResult[] {
  const cached = marginChecksCache.get(rows)?.get(source);
  if (cached) return cached;
  const required = ["week", "period_split", "category", "product_id", "region", "channel", "order_count", "gross_revenue", "discounts", "returns", "net_revenue", "cogs", "fulfillment", "contribution_margin", "provenance"];
  const grains = rows.map((row) => source === "real"
    ? `${row.week}|${row.category}|${row.region}|${row.channel}`
    : `${row.week}|${row.product_id}|${row.region}|${row.channel}`);
  const weeks = [...new Set(rows.map((row) => row.week))].sort();
  const holdoutWeeks = [...new Set(rows.filter((row) => row.period_split === "holdout").map((row) => row.week))].sort();
  const splitByWeek = new Map<string, Set<MarginRow["period_split"]>>();
  for (const row of rows) splitByWeek.set(row.week, new Set([...(splitByWeek.get(row.week) ?? []), row.period_split]));
  const exactHoldout = holdoutWeeks.length === 8
    && weeks.slice(-8).every((value, index) => value === holdoutWeeks[index])
    && [...splitByWeek.values()].every((splits) => splits.size === 1);
  const checks = [
    { name: "schema fields present", pass: rows.every((row) => required.every((field) => field in row)) },
    { name: source === "real" ? "week-category-region-channel grain unique" : "week-product-region-channel grain unique", pass: new Set(grains).size === grains.length },
    { name: "no null dimension keys", pass: rows.every((row) => [row.week, row.category, row.product_id, row.region, row.channel].every(Boolean)) },
    { name: "numeric costs and revenue non-negative", pass: rows.every((row) => [row.order_count, row.units, row.gross_revenue, row.discounts, row.returns, row.cogs, row.fulfillment].every((value) => value >= 0)) },
    { name: "promotion and return rates bounded", pass: rows.every((row) => row.promo_depth >= 0 && row.promo_depth <= 0.5 && row.return_rate >= 0 && row.return_rate <= 0.5) },
    { name: "gross revenue identity", pass: rows.every((row) => near(row.gross_revenue, row.units * row.unit_price)) },
    { name: "net revenue identity", pass: rows.every((row) => near(row.net_revenue, row.gross_revenue - row.discounts - row.returns)) },
    { name: "contribution identity", pass: rows.every((row) => near(row.contribution_margin, row.net_revenue - row.cogs - row.fulfillment)) },
    { name: "exact final-eight-week holdout without leakage", pass: exactHoldout },
    { name: source === "synthetic" ? "synthetic provenance" : "source provenance present", pass: source === "synthetic" ? rows.every((row) => row.provenance === "synthetic") : rows.every((row) => Boolean(row.provenance)) },
  ];
  const sourceCache = marginChecksCache.get(rows) ?? new Map<DatasetSource, CheckResult[]>();
  sourceCache.set(source, checks);
  marginChecksCache.set(rows, sourceCache);
  return checks;
}

type RealMarginMaterialization = {
  dataset: MarginDataset;
  sha256: string;
  reports: MarginReports;
  artifactIdentity: ParquetArtifactIdentity;
};

function loadRealMarginPreview() {
  return materializeAnalyticsDataset<RealMarginMaterialization>(REAL_PREVIEW_CACHE_KEY, async () => {
    const { fetchParquetArtifactIdentity } = await import("@/lib/duckdb");
    const artifact = await fetchParquetArtifactIdentity(REAL_PARQUET_URL);
    if (artifact.sha256 !== OLIST_MARGIN_ARTIFACT_SHA256) throw new Error("Olist Parquet contract failed: artifact_sha256 does not match the recorded SHA-256.");
    const [{ buildOlistMarginCompactPreview }, reports] = await Promise.all([
      import("@/lib/olist-margin-compact"),
      loadMarginReports(artifact.sha256),
    ]);
    const preview = await buildOlistMarginCompactPreview();
    if (preview.sourceSha256 !== artifact.sha256) throw new Error("Olist compact preview source identity does not match the fetched artifact.");
    return {
      sha256: artifact.sha256,
      artifactIdentity: artifact,
      reports,
      dataset: {
        ...preview.dataset,
        source: "real",
        seed: null,
        rows_sha256: null,
        full_row_count: preview.fullRowCount,
        recorded_contract_checks: preview.fullContractChecks,
        rows: preview.rows,
      },
    };
  });
}

function loadSyntheticMarginDataset() {
  return materializeAnalyticsDataset(SYNTHETIC_CACHE_KEY, async () => {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error(`Margin dataset returned ${response.status}`);
    const next = await response.json() as Omit<MarginDataset, "source">;
    return { ...next, source: "synthetic" } satisfies MarginDataset;
  });
}

function loadRealMarginDataset() {
  return materializeAnalyticsDataset<RealMarginMaterialization>(REAL_CACHE_KEY, async () => {
    const preview = await loadRealMarginPreview();
    const { queryParquetArtifact } = await import("@/lib/duckdb");
    const artifact = await queryParquetArtifact<Record<string, unknown>>(
      REAL_PARQUET_URL,
      OLIST_MARGIN_ARTIFACT_SHA256,
      preview.artifactIdentity,
    );
    if (artifact.sha256 !== OLIST_MARGIN_ARTIFACT_SHA256) throw new Error("Olist Parquet contract failed: artifact_sha256.");
    const dataset = buildRealMarginDataset(artifact.rows);
    const failedChecks = checksFor(dataset.rows, "real").filter(({ pass }) => !pass);
    if (failedChecks.length) throw new Error(`Olist Parquet contract failed: ${failedChecks.map(({ name }) => name).join(", ")}.`);
    return {
      dataset: { ...dataset, full_row_count: dataset.rows.length },
      sha256: artifact.sha256,
      reports: preview.reports,
      artifactIdentity: preview.artifactIdentity,
    };
  });
}

function matches(row: MarginRow, category: string, region: string, channel: string) {
  return row.category === category && (region === "All" || row.region === region) && (channel === "All" || row.channel === channel);
}

export default function MarginControlTower() {
  const { locale } = useI18n();
  const [dataset, setDataset] = useState<MarginDataset | null>(null);
  const [requestedSource, setRequestedSource] = useState<DatasetSource>("real");
  const [activeSource, setActiveSource] = useState<DatasetSource>("synthetic");
  const [realArtifactStatus, setRealArtifactStatus] = useState<RealArtifactStatus>("loading");
  const [realMaterializationStatus, setRealMaterializationStatus] = useState<RealMaterializationStatus>("idle");
  const [realFullWarmStatus, setRealFullWarmStatus] = useState<RealFullWarmStatus>(() => {
    const cacheState = getAnalyticsDatasetCacheState(REAL_CACHE_KEY);
    return cacheState === "ready" ? "ready" : cacheState === "loading" ? "loading" : "scheduled";
  });
  const [realArtifactDetail, setRealArtifactDetail] = useState("");
  const [realArtifactSha256, setRealArtifactSha256] = useState<string | null>(null);
  const [realReports, setRealReports] = useState<MarginReports | null>(null);
  const [realFailureScope, setRealFailureScope] = useState<"parquet" | "report" | null>(null);
  const sourceRequest = useRef(0);
  const activeSourceRef = useRef<DatasetSource>("synthetic");
  const realPreviewVerifiedRef = useRef(false);
  const selectionRef = useRef<Partial<Pick<MarginRow, "week" | "category" | "region" | "channel">>>({});
  const [week, setWeek] = useState("");
  const [category, setCategory] = useState("");
  const [region, setRegion] = useState("All");
  const [channel, setChannel] = useState("All");
  const [promoPercent, setPromoPercent] = useState(12);
  const [explorerTab, setExplorerTab] = useState<ExplorerTab>("sample");
  const [loadError, setLoadError] = useState(false);
  const [syntheticWarmReady, setSyntheticWarmReady] = useState(() => Boolean(peekAnalyticsDataset<MarginDataset>(SYNTHETIC_CACHE_KEY)));

  const activateDataset = useCallback((
    next: MarginDataset,
    selection?: Partial<Pick<MarginRow, "week" | "category" | "region" | "channel">>,
    options: DatasetActivationOptions = {},
  ) => {
    const nextWeek = selection?.week ?? next.guided_scenario.week;
    const nextCategory = selection?.category ?? next.guided_scenario.category;
    const nextRegion = selection?.region ?? next.guided_scenario.region;
    const nextChannel = selection?.channel ?? next.guided_scenario.channel;
    setDataset(next);
    activeSourceRef.current = next.source;
    setActiveSource(next.source);
    setWeek(nextWeek);
    setCategory(nextCategory);
    setRegion(nextRegion);
    setChannel(nextChannel);
    if (!options.preservePromo) {
      const selected = next.rows.filter((row) => row.week === nextWeek && matches(row, nextCategory, nextRegion, nextChannel));
      setPromoPercent(Math.round(aggregate(selected).promo_depth * 100));
    }
  }, []);

  useEffect(() => {
    selectionRef.current = { week, category, region, channel };
  }, [category, channel, region, week]);

  const selectDatasetSource = useCallback((
    source: DatasetSource,
    realMode: "preview" | "full" = "full",
    selection?: Partial<Pick<MarginRow, "week" | "category" | "region" | "channel">>,
  ) => {
    const requestId = sourceRequest.current += 1;
    setRequestedSource(source);
    setRealArtifactDetail("");
    setRealFailureScope(null);
    if (source === "synthetic") {
      setRealArtifactStatus("idle");
      setRealMaterializationStatus("idle");
      const cached = peekAnalyticsDataset<MarginDataset>(SYNTHETIC_CACHE_KEY);
      if (cached) {
        setSyntheticWarmReady(true);
        activateDataset(cached);
        return;
      }
      void loadSyntheticMarginDataset().then((next) => {
        setSyntheticWarmReady(true);
        if (sourceRequest.current === requestId) activateDataset(next);
      }).catch((reason: unknown) => {
        console.error("Margin synthetic dataset could not load.", reason);
        if (sourceRequest.current === requestId) setLoadError(true);
      });
      return;
    }

    const cacheKey = realMode === "full" ? REAL_CACHE_KEY : REAL_PREVIEW_CACHE_KEY;
    const loadReal = realMode === "full" ? loadRealMarginDataset : loadRealMarginPreview;
    const alreadyShowingVerifiedPreview = realMode === "full" && activeSourceRef.current === "real" && realPreviewVerifiedRef.current;
    if (realMode === "full") {
      setRealFullWarmStatus("loading");
    } else {
      const fullCacheState = getAnalyticsDatasetCacheState(REAL_CACHE_KEY);
      setRealFullWarmStatus(fullCacheState === "ready" ? "ready" : fullCacheState === "loading" ? "loading" : "scheduled");
    }
    if (!alreadyShowingVerifiedPreview) {
      setRealArtifactStatus("loading");
      setRealReports(null);
    }
    setRealMaterializationStatus("loading");
    const cached = peekAnalyticsDataset<RealMarginMaterialization>(cacheKey);
    if (cached) {
      setRealArtifactSha256(cached.sha256);
      setRealReports(cached.reports);
      setRealArtifactStatus("loaded");
      realPreviewVerifiedRef.current = true;
      setRealMaterializationStatus(realMode === "full" ? "full" : "preview");
      if (realMode === "full") setRealFullWarmStatus("ready");
      activateDataset(cached.dataset, selection, { preservePromo: alreadyShowingVerifiedPreview });
      return;
    }
    void loadReal().then((next) => {
      if (sourceRequest.current !== requestId) return;
      setRealArtifactSha256(next.sha256);
      setRealReports(next.reports);
      setRealArtifactStatus("loaded");
      realPreviewVerifiedRef.current = true;
      setRealMaterializationStatus(realMode === "full" ? "full" : "preview");
      if (realMode === "full") setRealFullWarmStatus("ready");
      activateDataset(next.dataset, selection, { preservePromo: alreadyShowingVerifiedPreview });
    }).catch((reason: unknown) => {
      if (sourceRequest.current !== requestId) return;
      const error = reason instanceof Error ? reason : null;
      const fullRuntimeFailure = realMode === "full"
        && error?.name === "DuckDBMaterializationError"
        && activeSourceRef.current === "real"
        && realPreviewVerifiedRef.current;
      if (fullRuntimeFailure) {
        console.error("Margin full-artifact materialization could not finish.", reason);
        setRealArtifactStatus("loaded");
        setRealMaterializationStatus("unavailable");
        setRealFullWarmStatus("unavailable");
        return;
      }
      const reportFailure = reason instanceof MarginReportValidationError;
      const expectedPending = error?.name === "ParquetArtifactUnavailableError" || (reportFailure && reason.status === "pending");
      if (!expectedPending) console.error("Margin real-data artifact could not be verified.", reason);
      setRealArtifactStatus(reportFailure ? reason.status : error?.name === "ParquetArtifactUnavailableError" ? "pending" : "invalid");
      setRealArtifactDetail(reportFailure ? `${reason.report}-${reason.status}` : "");
      setRealFailureScope(reportFailure ? "report" : "parquet");
      setRealArtifactSha256(null);
      setRealReports(null);
      setRealMaterializationStatus("unavailable");
      if (realMode === "full") setRealFullWarmStatus("unavailable");
      if (realMode === "preview") realPreviewVerifiedRef.current = false;
      void loadSyntheticMarginDataset().then((fallback) => {
        setSyntheticWarmReady(true);
        if (sourceRequest.current === requestId) activateDataset(fallback);
      }).catch((fallbackReason: unknown) => {
        console.error("Margin fallback dataset could not load.", fallbackReason);
        if (sourceRequest.current === requestId) setLoadError(true);
      });
    });
  }, [activateDataset]);

  useEffect(() => {
    let mounted = true;
    const cancelSyntheticWarm = scheduleAnalyticsDatasetWarm(SYNTHETIC_CACHE_KEY, async () => {
      const warmed = await loadSyntheticMarginDataset();
      if (mounted) setSyntheticWarmReady(true);
      return warmed;
    }, { startAfterMs: 8_000, idleTimeoutMs: 2_000 });
    const initialRealMode = getAnalyticsDatasetCacheState(REAL_CACHE_KEY) === "ready" ? "full" : "preview";
    const initialRequest = window.setTimeout(() => selectDatasetSource("real", initialRealMode), 0);
    return () => {
      mounted = false;
      window.clearTimeout(initialRequest);
      cancelSyntheticWarm();
      sourceRequest.current += 1;
    };
  }, [selectDatasetSource]);

  useEffect(() => {
    if (requestedSource !== "real" || realMaterializationStatus !== "preview") return;

    let mounted = true;
    const promoteFullMaterialization = async () => {
      if (mounted) setRealFullWarmStatus("loading");
      try {
        const warmed = await loadRealMarginDataset();
        if (mounted) {
          setRealFullWarmStatus("ready");
          if (activeSourceRef.current === "real" && realPreviewVerifiedRef.current) {
            setRealArtifactSha256(warmed.sha256);
            setRealReports(warmed.reports);
            setRealArtifactStatus("loaded");
            setRealMaterializationStatus("full");
            activateDataset(warmed.dataset, selectionRef.current, { preservePromo: true });
          }
        }
        return warmed;
      } catch (error) {
        if (mounted) setRealFullWarmStatus("unavailable");
        throw error;
      }
    };

    const cacheState = getAnalyticsDatasetCacheState(REAL_CACHE_KEY);
    if (cacheState === "loading" || cacheState === "ready") {
      void promoteFullMaterialization().catch(() => undefined);
      return () => {
        mounted = false;
      };
    }

    const cancelRealFullWarm = scheduleAnalyticsDatasetWarm(
      REAL_CACHE_KEY,
      promoteFullMaterialization,
      { startAfterMs: 8_000, idleTimeoutMs: 2_000 },
    );
    return () => {
      mounted = false;
      cancelRealFullWarm();
    };
  }, [activateDataset, realMaterializationStatus, requestedSource]);

  const contractChecks = useMemo(() => dataset ? dataset.recorded_contract_checks ?? checksFor(dataset.rows, activeSource) : [], [activeSource, dataset]);
  const allPass = contractChecks.every((check) => check.pass);
  const datasetIndex = useMemo(() => {
    const byCategory = new Map<string, MarginRow[]>();
    for (const row of dataset?.rows ?? []) {
      const rows = byCategory.get(row.category);
      if (rows) rows.push(row);
      else byCategory.set(row.category, [row]);
    }
    return {
      byCategory,
      categories: [...byCategory.keys()],
      regions: [...new Set((dataset?.rows ?? []).map((row) => row.region))],
      channels: [...new Set((dataset?.rows ?? []).map((row) => row.channel))],
      weeks: [...new Set((dataset?.rows ?? []).map((row) => row.week))],
    };
  }, [dataset]);
  const filteredRows = useMemo(() => (datasetIndex.byCategory.get(category) ?? []).filter((row) => (region === "All" || row.region === region) && (channel === "All" || row.channel === channel)), [category, channel, datasetIndex, region]);
  const selectedRows = useMemo(() => filteredRows.filter((row) => row.week === week), [filteredRows, week]);
  const selected = useMemo(() => aggregate(selectedRows), [selectedRows]);
  const categoryWeeks = useMemo(() => {
    const byWeek = new Map<string, MarginRow[]>();
    for (const row of filteredRows) byWeek.set(row.week, [...(byWeek.get(row.week) ?? []), row]);
    return [...byWeek].map(([date, rows]) => ({ week: date, total: aggregate(rows), anomaly: rows.some((row) => row.injected_anomaly), split: rows[0]?.period_split ?? "analysis" })).sort((left, right) => left.week.localeCompare(right.week));
  }, [filteredRows]);
  const baseline = useMemo(() => {
    const prior = categoryWeeks.filter((item) => item.week < week && item.split === "analysis").slice(-8);
    return prior.length ? prior.reduce((sum, item) => sum + item.total.contribution_margin, 0) / prior.length : 0;
  }, [categoryWeeks, week]);
  const scenario = useMemo(() => {
    if (!selected.units) return null;
    const pointDelta = promoPercent - selected.promo_depth * 100;
    const assumedUnitChange = pointDelta * 0.008;
    const units = Math.max(0, Math.round(selected.units * (1 + assumedUnitChange)));
    const unitPrice = selected.gross_revenue / selected.units;
    const gross = units * unitPrice;
    const discounts = gross * (promoPercent / 100);
    const returns = gross * selected.return_rate;
    const cogs = units * (selected.cogs / selected.units);
    const fulfillment = units * (selected.fulfillment / selected.units);
    const margin = gross - discounts - returns - cogs - fulfillment;
    return { units, gross, discounts, returns, cogs, fulfillment, margin, delta: margin - selected.contribution_margin, assumedUnitChange };
  }, [promoPercent, selected]);
  const holdout = categoryWeeks.find((item) => item.week > week && item.split === "holdout") ?? null;
  const maxMagnitude = Math.max(1, ...categoryWeeks.map((item) => Math.abs(item.total.contribution_margin)));
  const totalOrders = useMemo(() => dataset?.rows.reduce((sum, row) => sum + row.order_count, 0) ?? 0, [dataset]);
  const heatmap = useMemo(() => {
    if (!dataset) return [];
    const totals = new Map<string, { margin: number; rows: number }>();
    for (const row of dataset.rows) {
      if (row.week !== week || (channel !== "All" && row.channel !== channel)) continue;
      const key = `${row.category}\u0000${row.region}`;
      const current = totals.get(key);
      totals.set(key, { margin: (current?.margin ?? 0) + row.contribution_margin, rows: (current?.rows ?? 0) + 1 });
    }
    return datasetIndex.categories.flatMap((categoryName) => HEATMAP_REGIONS.map((regionName) => {
      const cell = totals.get(`${categoryName}\u0000${regionName}`);
      return { category: categoryName, region: regionName, margin: cell?.margin ?? 0, rows: cell?.rows ?? 0 };
    }));
  }, [channel, dataset, datasetIndex.categories, week]);
  const heatMax = Math.max(1, ...heatmap.map((item) => Math.abs(item.margin)));
  const contributionBreakdown = useMemo(() => {
    if (!dataset) return [];
    if (activeSource === "real") {
      const comparisonRows = dataset.rows.filter((row) => row.week === week && (region === "All" || row.region === region) && (channel === "All" || row.channel === channel));
      const grouped = new Map<string, MarginRow[]>();
      for (const row of comparisonRows) {
        const rows = grouped.get(row.category);
        if (rows) rows.push(row);
        else grouped.set(row.category, [row]);
      }
      return [...grouped].map(([value, rows]) => ({ id: value, name: value.replaceAll("_", " "), total: aggregate(rows) })).sort((left, right) => left.total.contribution_margin - right.total.contribution_margin);
    }
    const ids = [...new Set(selectedRows.map((row) => row.product_id))];
    return ids.map((id) => ({ id, name: selectedRows.find((row) => row.product_id === id)?.product_name ?? id, total: aggregate(selectedRows.filter((row) => row.product_id === id)) })).sort((left, right) => left.total.contribution_margin - right.total.contribution_margin);
  }, [activeSource, channel, dataset, region, selectedRows, week]);

  if (loadError) return <div className="analytics-lab-loading error"><CircleAlert aria-hidden="true" />{userFacingError("dataset", locale)}</div>;
  if (!dataset || !scenario || !week || !category) return <div className="analytics-lab-loading" aria-live="polite">{locale === "en" ? "Loading the requested margin source..." : "正在载入所请求的毛利数据源……"}</div>;

  const marginRate = selected.gross_revenue ? selected.contribution_margin / selected.gross_revenue : 0;
  const baselineDelta = selected.contribution_margin - baseline;
  const dataFields = Object.keys(dataset.rows[0] ?? {});
  const sampleRows = selectedRows.slice(0, 6);
  const compactRealVisible = activeSource === "real" && realMaterializationStatus !== "full";
  const realRowCount = dataset.full_row_count ?? dataset.rows.length;
  const reportPanelState = realArtifactStatus === "loaded" && realReports ? "ready" : realArtifactStatus === "loading" ? "loading" : realFailureScope === "report" && realArtifactStatus === "invalid" ? "invalid" : "pending";
  const realStatusDetail = realFailureScope === "report"
    ? realArtifactStatus === "invalid"
      ? (locale === "en" ? "Report blocked: invalid contract" : "因契约无效，报告已拦截")
      : realArtifactDetail.startsWith("elasticity")
        ? (locale === "en" ? "Elasticity report pending" : "弹性报告待提交")
        : (locale === "en" ? "Detection report pending" : "检测报告待提交")
    : realArtifactStatus === "invalid"
      ? userFacingError("dataset", locale)
      : (locale === "en" ? "olist-margin.parquet is not committed; the governed synthetic fixture remains active." : "olist-margin.parquet 尚未提交；当前仍使用受控的合成数据作为替代。");
  const realBoundaryTitle = realMaterializationStatus === "full"
    ? (locale === "en" ? "Complete DuckDB materialization" : "DuckDB 完整物化")
    : realMaterializationStatus === "loading"
      ? (locale === "en" ? "Completing DuckDB materialization…" : "正在完成 DuckDB 物化……")
      : (locale === "en" ? "Verified compact real preview" : "已验证的轻量真实预览");
  const realBoundaryDetail = realMaterializationStatus === "full"
    ? (locale === "en" ? "All artifact rows were queried in-browser and are ready for interactive scenario comparison." : "浏览器内已查询全部产物行，可用于交互式情景比较。")
    : (locale === "en" ? "Exact Parquet bytes and linked reports are verified; the compact cells were generated under the recorded full-artifact contract, while the full browser query remains deferred." : "Parquet 精确字节与关联报告已验证；轻量单元格基于已记录的完整产物契约生成，浏览器端完整查询仍保持挂起。");
  const reset = () => {
    setWeek(dataset.guided_scenario.week);
    setCategory(dataset.guided_scenario.category);
    setRegion(dataset.guided_scenario.region);
    setChannel(dataset.guided_scenario.channel);
    const rows = dataset.rows.filter((row) => row.week === dataset.guided_scenario.week && matches(row, dataset.guided_scenario.category, dataset.guided_scenario.region, dataset.guided_scenario.channel));
    setPromoPercent(Math.round(aggregate(rows).promo_depth * 100));
  };
  const selectOlistSource = () => {
    const explicitFullRequest = requestedSource === "real" && activeSource === "real";
    const cachedFullMaterialization = peekAnalyticsDataset<RealMarginMaterialization>(REAL_CACHE_KEY);
    selectDatasetSource(
      "real",
      explicitFullRequest || cachedFullMaterialization ? "full" : "preview",
      explicitFullRequest ? { week, category, region, channel } : undefined,
    );
  };
  const selectVisibleSlice = (selection: Partial<Pick<MarginRow, "week" | "category" | "region" | "channel">>) => {
    const nextWeek = selection.week ?? week;
    const nextCategory = selection.category ?? category;
    const nextRegion = selection.region ?? region;
    const nextChannel = selection.channel ?? channel;
    setWeek(nextWeek);
    setCategory(nextCategory);
    setRegion(nextRegion);
    setChannel(nextChannel);
    const visibleRows = dataset.rows.filter((row) => row.week === nextWeek && matches(row, nextCategory, nextRegion, nextChannel));
    setPromoPercent(Math.round(aggregate(visibleRows).promo_depth * 100));
    if (compactRealVisible) {
      selectDatasetSource("real", "full", {
        week: nextWeek,
        category: nextCategory,
        region: nextRegion,
        channel: nextChannel,
      });
    }
  };

  return (
    <section className={`${styles.upgrade} analytics-lab margin-lab`} data-testid="margin-control-tower" data-requested-source={requestedSource} data-active-source={activeSource} data-real-artifact-status={realArtifactStatus} data-real-materialization-status={realMaterializationStatus} data-real-full-warm-status={realFullWarmStatus} data-synthetic-cache-ready={syntheticWarmReady} aria-labelledby="margin-lab-title">
      <header className="analytics-lab-header">
        <div>
          <p className="eyebrow">{activeSource === "synthetic" ? (locale === "en" ? "Synthetic dataset / linked decision workspace" : "合成数据集 / 联动决策工作区") : (locale === "en" ? "Olist Parquet / browser-native decision workspace" : "Olist Parquet / 浏览器原生决策工作区")}</p>
          <h3 id="margin-lab-title">{locale === "en" ? "Margin Control Tower" : "毛利控制塔"}</h3>
          <p>{activeSource === "synthetic"
            ? (locale === "en" ? "Find where contribution margin breaks, trace the cost driver, and test one bounded operating change against a held-out synthetic period." : "定位贡献毛利异常点，追溯成本驱动因素，并以预留的合成周期验证一项有限运营调整。")
            : compactRealVisible
              ? (locale === "en" ? "Explore a hash-bound compact view generated from the exact Olist artifact; full browser DuckDB materialization is deferred." : "探索由精确 Olist 产物生成的哈希绑定轻量视图，浏览器端 DuckDB 的完整物化将延后执行。")
              : (locale === "en" ? "Query the committed offline Olist artifact in-browser, trace margin drivers, and keep scenario assumptions separate from measured data." : "在浏览器内查询已提交的离线 Olist 产物，追查毛利驱动，并将情景假设与实测数据分开。")}</p>
        </div>
        <div className="analytics-boundary">
          <ShieldCheck aria-hidden="true" />
          <strong>{activeSource === "synthetic" ? (locale === "en" ? "Fixed-seed scenario ready" : "固定 seed 情景已就绪") : realBoundaryTitle}</strong>
          <span>{activeSource === "synthetic" ? (locale === "en" ? "Repeatable inputs make it easy to trace every margin driver and compare actions." : "可重复输入便于追踪每个毛利驱动项并比较行动方案。") : realBoundaryDetail}</span>
        </div>
      </header>

      <div className="dataset-source-row"><div className="dataset-source-toggle" role="group" aria-label={locale === "en" ? "Margin dataset source" : "毛利数据源"}><button type="button" aria-pressed={requestedSource === "real"} onClick={selectOlistSource}>{locale === "en" ? "Olist (real)" : "Olist（真实）"}</button><button type="button" aria-pressed={requestedSource === "synthetic"} onClick={() => selectDatasetSource("synthetic")}>{locale === "en" ? "Synthetic fixture" : "合成夹具"}</button></div><span>{locale === "en" ? "Synthetic fixture / Olist (real)" : "合成夹具 / Olist（真实）"}</span></div>
      {requestedSource === "real" && realArtifactStatus !== "loaded" ? <div className={`real-artifact-state ${realArtifactStatus === "invalid" ? "invalid" : ""}`} role="status"><CircleAlert aria-hidden="true" /><div><strong>{realArtifactStatus === "loading" ? (locale === "en" ? "Checking real-data artifact…" : "正在检查真实数据产物……") : realArtifactStatus === "invalid" ? (locale === "en" ? "real-data artifact blocked" : "真实数据产物已拦截") : (locale === "en" ? "real-data artifact pending" : "真实数据产物待处理")}</strong><p>{realStatusDetail}</p></div></div> : null}

      <section className="analytics-dataset-context" aria-label={locale === "en" ? "Dataset context" : "数据集说明"}>
        <div className="analytics-context-title"><Database aria-hidden="true" /><div><span>{locale === "en" ? "Dataset and decision context" : "数据集与决策背景"}</span><strong>{activeSource === "synthetic" ? (locale === "en" ? "Margin Synthetic v2" : "Margin Synthetic v2（合成数据集）") : (locale === "en" ? "Olist margin artifact" : "Olist 毛利数据产物")}</strong><code>{dataset.dataset_version}</code></div></div>
        <dl><div><dt>{locale === "en" ? "Coverage" : "覆盖范围"}</dt><dd>{dataset.dimensions.weeks} {locale === "en" ? "weeks" : "周"} · {dataset.date_range.start} → {dataset.date_range.end}</dd></div><div><dt>{locale === "en" ? "Grain" : "粒度"}</dt><dd>{activeSource === "synthetic" ? (locale === "en" ? "week × product × region × channel" : "周 × 商品 × 区域 × 渠道") : (locale === "en" ? "week × product category × region × dominant payment channel" : "周 × 商品品类 × 区域 × 主支付渠道")}</dd></div><div><dt>{locale === "en" ? "Scale" : "规模"}</dt><dd>{activeSource === "synthetic" ? <>{integer.format(dataset.rows.length)} {locale === "en" ? "rows" : "行"} · {integer.format(totalOrders)} {locale === "en" ? "synthetic orders" : "笔合成订单"}</> : <>{integer.format(realRowCount)} {locale === "en" ? "derived category cells" : "派生品类单元格"} · {integer.format(dataset.source_order_count ?? 0)} {locale === "en" ? "source orders" : "笔源订单"}{compactRealVisible ? <> · {integer.format(dataset.rows.length)} {locale === "en" ? "preview cells loaded" : "个预览单元已载入"}</> : null}</>}</dd></div><div><dt>{locale === "en" ? "Dimensions" : "维度"}</dt><dd>{activeSource === "synthetic" ? <>{dataset.dimensions.products} {locale === "en" ? "products" : "个商品"} · {dataset.dimensions.categories} {locale === "en" ? "categories" : "个品类"} · {dataset.dimensions.regions} {locale === "en" ? "regions" : "个区域"} · {dataset.dimensions.channels} {locale === "en" ? "channels" : "个渠道"}</> : <>{dataset.dimensions.categories} {locale === "en" ? "product categories" : "个商品品类"} · {dataset.dimensions.regions} {locale === "en" ? "mapped regions" : "个映射区域"} · {dataset.dimensions.channels} {locale === "en" ? "payment channels" : "个支付渠道"}</>}</dd></div><div><dt>{locale === "en" ? "Holdout" : "留出期"}</dt><dd>8 {locale === "en" ? "observed weeks" : "个观测周"} · {dataset.holdout_period.start} → {dataset.holdout_period.end}</dd></div><div><dt>{activeSource === "synthetic" ? (locale === "en" ? "Injected anomaly" : "注入异常") : (locale === "en" ? "Guided category slice" : "引导品类切片")}</dt><dd>{dataset.guided_scenario.week} · {localizeStructuralValue(dataset.guided_scenario.category, locale)} · {localizeStructuralValue(dataset.guided_scenario.region, locale)}</dd></div></dl>
        <p>{activeSource === "synthetic"
          ? (locale === "en" ? "Versioned generator, fixed rules, and fixed seed. The final eight weeks are excluded from diagnosis and kept for verification." : "生成器有版本记录，规则和 seed 固定。最后八周不参与诊断，仅用于验证。")
          : compactRealVisible
            ? (locale === "en" ? "The browser verifies the served Parquet SHA-256 and both linked reports before showing this compact slice. The full ten-check artifact contract was recorded at build time; DuckDB has not queried every row yet." : "浏览器会先验证当前 Parquet 的 SHA-256 与两份关联报告，再显示轻量切片。完整十项产物契约在构建时记录；DuckDB 尚未查询全部行。")
            : (locale === "en" ? "The browser verifies the exact final-eight-week split and SHA-256 of the committed category-level Parquet before any linked report can render." : "浏览器会校验已提交品类级 Parquet 的最后八周切分与实际 SHA-256；只有通过后才会显示关联报告。")}</p>
        {activeSource === "synthetic" ? <div className="analytics-download-row"><ArtifactLink href={DATA_URL}>{locale === "en" ? "Explore full JSON" : "浏览完整 JSON"}</ArtifactLink><a href={CSV_URL} download><Download aria-hidden="true" />{locale === "en" ? "Download full CSV" : "下载完整 CSV"}</a><a href={PARQUET_URL} download><Download aria-hidden="true" />{locale === "en" ? "Download synthetic Parquet" : "下载合成 Parquet"}</a><ArtifactLink href={SAMPLE_URL}>{locale === "en" ? "Browse CSV sample" : "浏览 CSV 样本"}</ArtifactLink></div> : <div className="analytics-download-row"><a href={REAL_PARQUET_URL} download><Download aria-hidden="true" />{locale === "en" ? "Download Olist aggregate" : "下载 Olist 聚合产物"}</a><ArtifactLink href="/case-studies/margin-control-tower/methods-evidence.json">{locale === "en" ? "Open methods evidence" : "查看方法证据"}</ArtifactLink><ArtifactLink href="/case-studies/margin-control-tower/README.md">{locale === "en" ? "Artifact notes" : "产物说明"}</ArtifactLink></div>}
      </section>

      <section className="analytics-explorer" aria-label={locale === "en" ? "Dataset explorer" : "数据集浏览器"}>
        <div className="analytics-explorer-tabs" role="tablist">{(["sample", "schema", "quality"] as ExplorerTab[]).map((tab) => <button key={tab} type="button" role="tab" aria-selected={explorerTab === tab} onClick={() => setExplorerTab(tab)}>{tab === "sample" ? (locale === "en" ? "Sample rows" : "样本记录") : tab === "schema" ? (locale === "en" ? "Schema and dictionary" : "数据结构与字段说明") : (locale === "en" ? "Quality checks" : "质量检查")}</button>)}</div>
        {explorerTab === "sample" ? <div className="analytics-sample-table"><table><thead><tr><th>{activeSource === "synthetic" ? (locale === "en" ? "product" : "商品") : (locale === "en" ? "product category" : "商品品类")}</th><th>{locale === "en" ? "region" : "区域"}</th><th>{activeSource === "synthetic" ? (locale === "en" ? "channel" : "渠道") : (locale === "en" ? "payment channel" : "支付渠道")}</th><th>{locale === "en" ? "orders" : "订单数"}</th><th>{locale === "en" ? "gross" : "毛收入"}</th><th>{locale === "en" ? "margin" : "毛利"}</th></tr></thead><tbody>{sampleRows.map((row) => <tr key={`${row.product_id}-${row.region}-${row.channel}`}><td>{activeSource === "synthetic" ? <>{row.product_id} · {localizeStructuralValue(row.product_name, locale)}</> : localizeStructuralValue(row.category, locale)}</td><td>{localizeStructuralValue(row.region, locale)}</td><td>{localizeStructuralValue(row.channel, locale)}</td><td>{row.order_count}</td><td>{money.format(row.gross_revenue)}</td><td>{money.format(row.contribution_margin)}</td></tr>)}</tbody></table></div> : null}
        {explorerTab === "schema" ? <div className="analytics-field-grid">{dataFields.map((field) => <div key={field}><code>{field}</code><span>{activeSource === "real" && ["product_id", "product_name"].includes(field) ? (locale === "en" ? "category compatibility surrogate" : "品类兼容字段") : field.includes("revenue") || ["discounts", "returns", "cogs", "fulfillment", "contribution_margin"].includes(field) ? (activeSource === "synthetic" ? (locale === "en" ? "synthetic currency" : "合成货币") : (locale === "en" ? "artifact currency" : "产物中的货币口径")) : field.includes("rate") || field === "promo_depth" ? (locale === "en" ? "bounded ratio" : "有界比率") : ["order_count", "units"].includes(field) ? (locale === "en" ? "count" : "计数") : (locale === "en" ? "dimension or flag" : "维度或标记")}</span></div>)}</div> : null}
        {explorerTab === "quality" ? <div className="analytics-quality-list" data-contract-origin={compactRealVisible ? "recorded-build-time" : "browser-materialized"}>{compactRealVisible ? <p>{locale === "en" ? "Recorded at build time against all 15,809 exact-hash artifact rows." : "构建时已针对该精确哈希绑定产物的全部 15,809 行完成记录。"}</p> : null}{contractChecks.map((check) => <p key={check.name} className={check.pass ? "pass" : "fail"}>{check.pass ? <Check aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}{localizeStructuralValue(check.name, locale)}</p>)}</div> : null}
      </section>

      <div className="analytics-controlbar"><label><span>{locale === "en" ? "Week" : "周"}</span><select value={week} onChange={(event) => selectVisibleSlice({ week: event.target.value })}>{datasetIndex.weeks.map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label><span>{locale === "en" ? "Category" : "品类"}</span><select value={category} onChange={(event) => selectVisibleSlice({ category: event.target.value })}>{datasetIndex.categories.map((value) => <option key={value} value={value}>{localizeStructuralValue(value, locale)}</option>)}</select></label><label><span>{locale === "en" ? "Region" : "区域"}</span><select value={region} onChange={(event) => setRegion(event.target.value)}>{["All", ...datasetIndex.regions].map((value) => <option key={value} value={value}>{value === "All" ? (locale === "en" ? "All" : "全部") : localizeStructuralValue(value, locale)}</option>)}</select></label><label><span>{locale === "en" ? "Channel" : "渠道"}</span><select value={channel} onChange={(event) => setChannel(event.target.value)}>{["All", ...datasetIndex.channels].map((value) => <option key={value} value={value}>{value === "All" ? (locale === "en" ? "All" : "全部") : localizeStructuralValue(value, locale)}</option>)}</select></label><button type="button" onClick={reset}><RotateCcw aria-hidden="true" />{locale === "en" ? "Guided scenario" : "引导案例"}</button><strong className={allPass ? "pass" : "fail"}>{allPass ? <Check aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}{allPass ? compactRealVisible ? (locale === "en" ? "Recorded full-artifact contract: 10 / 10" : "已记录的完整产物契约：10 / 10") : (locale === "en" ? "10 / 10 contracts pass" : "10 / 10 项契约通过") : (locale === "en" ? "Contract failure — output blocked" : "契约校验失败——输出已拦截")}</strong></div>

      <div className="margin-kpis"><div><span>{locale === "en" ? "Contribution margin" : "贡献毛利"}</span><strong>{money.format(selected.contribution_margin)}</strong></div><div><span>{locale === "en" ? "Margin rate" : "毛利率"}</span><strong>{(marginRate * 100).toFixed(1)}%</strong></div><div className={baselineDelta < 0 ? "negative" : "positive"}><span>{locale === "en" ? "vs prior 8-week mean" : "较前八周均值"}</span><strong>{baselineDelta >= 0 ? "+" : ""}{money.format(baselineDelta)}</strong></div></div>

      <div className="margin-analysis-grid">
        <section className="margin-waterfall"><div className="analytics-pane-heading"><span>{locale === "en" ? "Margin bridge" : "毛利桥"}</span><code>{week}</code></div><MarginWaterfall locale={locale} steps={[
          { label: locale === "en" ? "Gross" : "毛收入", value: selected.gross_revenue, kind: "total" },
          { label: locale === "en" ? "Discounts" : "折扣", value: -selected.discounts, kind: "delta" },
          { label: locale === "en" ? "Returns" : "退货", value: -selected.returns, kind: "delta" },
          { label: locale === "en" ? "Net" : "净收入", value: selected.net_revenue, kind: "total" },
          { label: "COGS", value: -selected.cogs, kind: "delta" },
          { label: locale === "en" ? "Fulfillment" : "履约", value: -selected.fulfillment, kind: "delta" },
          { label: locale === "en" ? "Margin" : "贡献毛利", value: selected.contribution_margin, kind: "total" },
        ]} /></section>
        <section className="margin-heatmap"><div className="analytics-pane-heading"><span>{locale === "en" ? "Category × region" : "品类 × 区域"}</span><button className="margin-filter-reset" data-testid="margin-filter-reset" type="button" aria-pressed={region !== "All"} disabled={region === "All"} onClick={() => setRegion("All")}><RotateCcw aria-hidden="true" />{locale === "en" ? "Clear filter" : "清除筛选"}</button></div><div className="margin-heatmap-grid">{heatmap.map((cell) => <button type="button" key={`${cell.category}-${cell.region}`} title={`${localizeStructuralValue(cell.category, locale)} / ${localizeStructuralValue(cell.region, locale)}: ${cell.rows ? money.format(cell.margin) : (locale === "en" ? "no row in this slice" : "当前切片无记录")}`} disabled={!cell.rows} aria-pressed={category === cell.category && region === cell.region} className={`${cell.margin < 0 ? "negative" : "positive"} ${category === cell.category && region === cell.region ? "active" : ""}`} style={{ "--heat-level": `${Math.max(12, Math.abs(cell.margin) / heatMax * 100)}%` } as CSSProperties} onClick={() => selectVisibleSlice({ category: cell.category, region: cell.region })}><span>{localizeStructuralValue(cell.category, locale)}</span><small>{localizeStructuralValue(cell.region, locale)}</small><strong>{cell.rows ? money.format(cell.margin) : "—"}</strong></button>)}</div></section>
      </div>

      <section className="margin-trend-panel"><div className="analytics-pane-heading"><span>{activeSource === "synthetic" ? (locale === "en" ? "52-week trend and holdout" : "52 周趋势与留出期") : (locale === "en" ? `${dataset.dimensions.weeks}-week category trend and final-eight-week holdout` : `${dataset.dimensions.weeks} 周品类趋势与最后八周留出期`)}</span><code>{locale === "en" ? "bars are linked to the selected week" : "柱形图与所选周联动"}</code></div><div className="margin-week-bars" aria-label={locale === "en" ? "Weekly contribution margin" : "周度贡献毛利"}>{categoryWeeks.map((item) => <button type="button" title={`${item.week}: ${money.format(item.total.contribution_margin)}`} key={item.week} className={`${item.week === week ? "active" : ""} ${item.anomaly ? "anomaly" : ""} ${item.split === "holdout" ? "holdout" : ""}`} onClick={() => selectVisibleSlice({ week: item.week })}><span style={{ height: `${Math.max(6, Math.abs(item.total.contribution_margin) / maxMagnitude * 100)}%` }} /><code>{item.week.slice(5)}</code></button>)}</div><div className="margin-trend-legend"><span><i className="analysis" />{locale === "en" ? "Analysis" : "分析期"}</span><span><i className="holdout" />{locale === "en" ? "Holdout" : "留出期"}</span>{activeSource === "synthetic" ? <span><i className="anomaly" />{locale === "en" ? "Injected anomaly" : "注入异常"}</span> : <span>{locale === "en" ? "Replay labels stay outside Parquet" : "重放标签始终留在 Parquet 外"}</span>}</div></section>

      <div className="margin-decision-grid">
        <div className="margin-diagnosis"><div className="analytics-pane-heading"><span>{locale === "en" ? "Linked cost drivers" : "联动成本驱动"}</span><code>{selectedRows.some((row) => row.injected_anomaly) ? (activeSource === "synthetic" ? (locale === "en" ? "fixed-seed anomaly" : "固定 seed 异常") : (locale === "en" ? "artifact label" : "产物标签")) : (locale === "en" ? "comparison" : "对比态")}</code></div><div className="margin-driver-grid">{[[locale === "en" ? "Discounts" : "折扣", selected.discounts, selected.promo_depth], [locale === "en" ? "Returns" : "退货", selected.returns, selected.return_rate], [locale === "en" ? "Fulfillment" : "履约成本", selected.fulfillment, selected.fulfillment / Math.max(1, selected.gross_revenue)]].map(([label, value, ratio]) => <div key={String(label)}><span>{label}</span><strong>{money.format(Number(value))}</strong><i><b style={{ width: `${Math.min(100, Number(ratio) * 300)}%` }} /></i><small>{(Number(ratio) * 100).toFixed(1)}% {locale === "en" ? "of gross" : "占毛收入"}</small></div>)}</div><div className="margin-root-cause"><TrendingDown aria-hidden="true" /><div><span>{selectedRows.some((row) => row.injected_anomaly) ? (activeSource === "synthetic" ? (locale === "en" ? "fixed-seed injected anomaly" : "固定 seed 注入异常") : (locale === "en" ? "offline artifact label" : "离线产物标签")) : (locale === "en" ? "deterministic comparison" : "确定性对比")}</span><strong>{selectedRows.some((row) => row.injected_anomaly) ? (locale === "en" ? "Promotion, returns, and fulfillment moved together" : "促销、退货与履约成本同时变动") : (locale === "en" ? "No anomaly label in this slice" : "该切片没有异常标签")}</strong><p>{activeSource === "synthetic" ? (locale === "en" ? "Use the product view below to rank the largest contributors and turn the diagnosis into an action plan." : "通过下方商品视图排列主要影响项，并把诊断转化为行动计划。") : (locale === "en" ? "Use the category comparison below to place this slice among other categories and prioritize the most actionable driver." : "通过下方品类对比判断该切片的位置，并优先处理最具行动价值的驱动项。")}</p></div></div><div className="margin-product-multiples">{contributionBreakdown.map((item) => <div key={item.id}><span>{activeSource === "synthetic" ? <>{item.id} · {localizeStructuralValue(item.name, locale)}</> : localizeStructuralValue(item.name, locale)}</span><i><b style={{ width: `${Math.max(3, Math.abs(item.total.contribution_margin) / Math.max(1, ...contributionBreakdown.map((entry) => Math.abs(entry.total.contribution_margin))) * 100)}%` }} /></i><strong>{money.format(item.total.contribution_margin)}</strong></div>)}</div></div>
        <div className="margin-scenario"><div className="analytics-pane-heading"><span>{locale === "en" ? "Action scenario" : "可调行动情景"}</span><code>{locale === "en" ? "interactive assumption" : "可调假设"}</code></div><div className="margin-slider"><SlidersHorizontal aria-hidden="true" /><label><span>{locale === "en" ? "Promotion depth" : "促销深度"}</span><strong>{promoPercent}%</strong><input aria-label={locale === "en" ? "Promotion depth" : "促销深度"} type="range" min="4" max="30" value={promoPercent} onChange={(event) => setPromoPercent(Number(event.target.value))} /></label></div><p className="analytics-assumption">{locale === "en" ? "Assumption: each 1 percentage-point promotion change moves units by 0.8% in the same direction; return rate and unit economics stay fixed." : "假设：促销每变动 1 个百分点，销量同向变动 0.8%；退货率与单位经济保持不变。"}</p><div className="margin-before-after"><div><span>{locale === "en" ? "Before" : "调整前"}</span><strong>{money.format(selected.contribution_margin)}</strong><small>{integer.format(selected.units)} {locale === "en" ? "units" : "件"}</small></div><div><span>{locale === "en" ? "Scenario" : "情景结果"}</span><strong>{money.format(scenario.margin)}</strong><small>{integer.format(scenario.units)} {locale === "en" ? "units" : "件"}</small></div><div className={scenario.delta < 0 ? "negative" : "positive"}><span>{locale === "en" ? "Delta" : "差额"}</span><strong>{scenario.delta >= 0 ? "+" : ""}{money.format(scenario.delta)}</strong><small>{(scenario.assumedUnitChange * 100).toFixed(1)}% {locale === "en" ? "assumed unit change" : "假设销量变化"}</small></div></div><div className="margin-holdout"><span>{activeSource === "synthetic" ? (locale === "en" ? "Synthetic holdout check" : "合成留出期检查") : (locale === "en" ? "Offline holdout check" : "离线留出期检查")}</span>{holdout ? <><p>{holdout.week}: <strong>{money.format(holdout.total.contribution_margin)}</strong></p><p>{activeSource === "synthetic" ? (locale === "en" ? "Held-out synthetic observation for checking whether the selected action direction persists." : "留出的合成观察用于检查所选行动方向能否保持。") : (locale === "en" ? "Held-out artifact observation for checking whether the selected action direction persists." : "留出的产物观察用于检查所选行动方向能否保持。")}</p></> : <p>{locale === "en" ? "No later held-out week for this selection." : "该选择在留出期内已无更晚的观测周。"}</p>}</div><div className="margin-action"><span>{locale === "en" ? "Action queue" : "行动队列"}</span><strong>{scenario.delta > 0.5 ? (locale === "en" ? "Test the lower-cost promotion setting; assign return and fulfillment checks before rollout." : "测试成本更低的促销设置；发布前安排退货与履约检查。") : (locale === "en" ? "Hold the change; scenario margin does not improve." : "暂停变更；情景毛利没有改善。")}</strong><code>{`${activeSource === "synthetic" ? "SYN" : "OLIST"}-ACTION-${week}-${category}-${promoPercent}`}</code></div></div>
      </div>

      {requestedSource === "real" ? <div className="analytics-offline-grid"><DetectionPanel locale={locale} state={reportPanelState} report={realReports?.detection} /><ElasticityPanel locale={locale} state={reportPanelState} report={realReports?.elasticity} /></div> : null}

      <div className="analytics-contract-grid"><div><span>{locale === "en" ? "Contract status" : "契约状态"}</span><p className={allPass ? "pass" : "fail"}>{allPass ? <Check aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}{allPass ? compactRealVisible ? (locale === "en" ? "All ten checks recorded at build time" : "构建时已记录全部十项检查") : (locale === "en" ? "All ten checks pass" : "十项检查全部通过") : (locale === "en" ? "Output is blocked" : "输出已拦截")}</p><p>{compactRealVisible ? (locale === "en" ? "The exact-hash full artifact passed null-key, unique-grain, holdout, and accounting checks during preview generation." : "精确哈希绑定的完整产物在预览生成阶段通过了空键、唯一粒度、留出期和会计检查。") : (locale === "en" ? "No null dimension keys; no duplicate grain; accounting identities reconcile." : "维度键无空值、粒度无重复、会计恒等式对账一致。")}</p></div><div><span>{locale === "en" ? "Metric semantics" : "指标语义"}</span><code>gross → discounts → returns → net → COGS → fulfillment → contribution margin</code><p>{localizeStructuralValue(dataset.grain, locale)}</p><p>{localizeStructuralValue(dataset.license, locale)}</p></div></div>
      <footer className="analytics-lab-footer"><div><span>{activeSource === "synthetic" ? (locale === "en" ? "Seed / version" : "种子 / 版本") : (locale === "en" ? "Artifact / version" : "产物 / 版本")}</span><code>{activeSource === "synthetic" ? `${dataset.seed} / ${dataset.dataset_version}` : `olist-margin.parquet / ${dataset.dataset_version}`}</code></div><div><span>{activeSource === "synthetic" ? (locale === "en" ? "Rows SHA-256" : "行数据 SHA-256") : (locale === "en" ? "Artifact SHA-256" : "产物 SHA-256")}</span><code>{activeSource === "synthetic" ? dataset.rows_sha256 : realArtifactSha256}</code></div><div><ArtifactLink href={CONTRACT_URL}>{locale === "en" ? "Open contract" : "查看契约"}</ArtifactLink><ArtifactLink href={REGISTRY_URL}>{locale === "en" ? "Metric definitions" : "指标定义"}</ArtifactLink></div></footer>
    </section>
  );
}
