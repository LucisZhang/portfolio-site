"use client";

import { Check, CircleAlert, Database, Download, RotateCcw, ShieldCheck, SlidersHorizontal, TrendingDown } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import ArtifactLink from "@/components/ArtifactLink";
import DetectionPanel from "@/components/analytics/DetectionPanel";
import ElasticityPanel from "@/components/analytics/ElasticityPanel";
import MarginWaterfall from "@/components/analytics/MarginWaterfall";
import { useI18n } from "@/lib/i18n";
import styles from "./AnalyticsUpgrade.module.css";

const DATA_URL = "/case-studies/margin-control-tower/synthetic-margin-data.json";
const CSV_URL = "/case-studies/margin-control-tower/synthetic-margin-data.csv";
const PARQUET_URL = "/case-studies/margin-control-tower/synthetic-margin-data.parquet";
const SAMPLE_URL = "/case-studies/margin-control-tower/synthetic-margin-sample.csv";
const CONTRACT_URL = "/case-studies/margin-control-tower/data-contract.json";
const REGISTRY_URL = "/case-studies/margin-control-tower/metric-registry.json";
const REAL_PARQUET_URL = "/case-studies/margin-control-tower/olist-margin.parquet";

type DatasetSource = "synthetic" | "real";
type RealArtifactStatus = "idle" | "loading" | "loaded" | "pending" | "invalid";

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
  const guided = rows.find((row) => row.injected_anomaly) ?? rows.find((row) => row.period_split === "analysis") ?? rows[0];
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
  return [
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
}

function matches(row: MarginRow, category: string, region: string, channel: string) {
  return row.category === category && (region === "All" || row.region === region) && (channel === "All" || row.channel === channel);
}

export default function MarginControlTower() {
  const { locale } = useI18n();
  const [dataset, setDataset] = useState<MarginDataset | null>(null);
  const [syntheticDataset, setSyntheticDataset] = useState<MarginDataset | null>(null);
  const [requestedSource, setRequestedSource] = useState<DatasetSource>("synthetic");
  const [activeSource, setActiveSource] = useState<DatasetSource>("synthetic");
  const [realArtifactStatus, setRealArtifactStatus] = useState<RealArtifactStatus>("idle");
  const [realArtifactDetail, setRealArtifactDetail] = useState("");
  const [realArtifactSha256, setRealArtifactSha256] = useState<string | null>(null);
  const sourceRequest = useRef(0);
  const [week, setWeek] = useState("");
  const [category, setCategory] = useState("");
  const [region, setRegion] = useState("All");
  const [channel, setChannel] = useState("All");
  const [promoPercent, setPromoPercent] = useState(12);
  const [explorerTab, setExplorerTab] = useState<ExplorerTab>("sample");
  const [loadError, setLoadError] = useState("");

  const activateDataset = useCallback((next: MarginDataset) => {
    setDataset(next);
    setActiveSource(next.source);
    setWeek(next.guided_scenario.week);
    setCategory(next.guided_scenario.category);
    setRegion(next.guided_scenario.region);
    setChannel(next.guided_scenario.channel);
    const selected = next.rows.filter((row) => row.week === next.guided_scenario.week && matches(row, next.guided_scenario.category, next.guided_scenario.region, next.guided_scenario.channel));
    setPromoPercent(Math.round(aggregate(selected).promo_depth * 100));
  }, []);

  useEffect(() => {
    let active = true;
    fetch(DATA_URL).then((response) => {
      if (!response.ok) throw new Error(`Margin dataset returned ${response.status}`);
      return response.json() as Promise<Omit<MarginDataset, "source">>;
    }).then((next) => {
      if (!active) return;
      const governedFixture: MarginDataset = { ...next, source: "synthetic" };
      setSyntheticDataset(governedFixture);
      activateDataset(governedFixture);
    }).catch((reason: unknown) => { if (active) setLoadError(reason instanceof Error ? reason.message : "Dataset unavailable."); });
    return () => { active = false; };
  }, [activateDataset]);

  const selectDatasetSource = (source: DatasetSource) => {
    const requestId = sourceRequest.current += 1;
    setRequestedSource(source);
    setRealArtifactDetail("");
    setRealArtifactSha256(null);
    if (source === "synthetic") {
      setRealArtifactStatus("idle");
      if (syntheticDataset) activateDataset(syntheticDataset);
      return;
    }

    setRealArtifactStatus("loading");
    void (async () => {
      const { queryParquetArtifact } = await import("@/lib/duckdb");
      const artifact = await queryParquetArtifact<Record<string, unknown>>(REAL_PARQUET_URL);
      const realDataset = buildRealMarginDataset(artifact.rows);
      const failedChecks = checksFor(realDataset.rows, "real").filter(({ pass }) => !pass);
      if (failedChecks.length) throw new Error(`Olist Parquet contract failed: ${failedChecks.map(({ name }) => name).join(", ")}.`);
      if (sourceRequest.current !== requestId) return;
      setRealArtifactSha256(artifact.sha256);
      setRealArtifactStatus("loaded");
      activateDataset(realDataset);
    })().catch((reason: unknown) => {
      if (sourceRequest.current !== requestId) return;
      const error = reason instanceof Error ? reason : new Error("Real-data artifact unavailable.");
      setRealArtifactStatus(error.name === "ParquetArtifactUnavailableError" ? "pending" : "invalid");
      setRealArtifactDetail(error.message);
      setRealArtifactSha256(null);
      if (syntheticDataset) activateDataset(syntheticDataset);
    });
  };

  const contractChecks = useMemo(() => dataset ? checksFor(dataset.rows, activeSource) : [], [activeSource, dataset]);
  const allPass = contractChecks.every((check) => check.pass);
  const filteredRows = useMemo(() => dataset?.rows.filter((row) => matches(row, category, region, channel)) ?? [], [category, channel, dataset, region]);
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
    const categories = [...new Set(dataset.rows.map((row) => row.category))];
    return categories.flatMap((categoryName) => ["North", "South", "West"].map((regionName) => {
      const rows = dataset.rows.filter((row) => row.week === week && row.category === categoryName && row.region === regionName && (channel === "All" || row.channel === channel));
      return { category: categoryName, region: regionName, margin: aggregate(rows).contribution_margin };
    }));
  }, [channel, dataset, week]);
  const heatMax = Math.max(1, ...heatmap.map((item) => Math.abs(item.margin)));
  const contributionBreakdown = useMemo(() => {
    if (!dataset) return [];
    if (activeSource === "real") {
      const comparisonRows = dataset.rows.filter((row) => row.week === week && (region === "All" || row.region === region) && (channel === "All" || row.channel === channel));
      const categories = [...new Set(comparisonRows.map((row) => row.category))];
      return categories.map((value) => ({ id: value, name: value.replaceAll("_", " "), total: aggregate(comparisonRows.filter((row) => row.category === value)) })).sort((left, right) => left.total.contribution_margin - right.total.contribution_margin);
    }
    const ids = [...new Set(selectedRows.map((row) => row.product_id))];
    return ids.map((id) => ({ id, name: selectedRows.find((row) => row.product_id === id)?.product_name ?? id, total: aggregate(selectedRows.filter((row) => row.product_id === id)) })).sort((left, right) => left.total.contribution_margin - right.total.contribution_margin);
  }, [activeSource, channel, dataset, region, selectedRows, week]);

  if (loadError) return <div className="analytics-lab-loading error"><CircleAlert aria-hidden="true" />{loadError}</div>;
  if (!dataset || !scenario || !week || !category) return <div className="analytics-lab-loading" aria-live="polite">{locale === "en" ? "Loading synthetic margin dataset..." : "正在载入合成毛利数据……"}</div>;

  const marginRate = selected.gross_revenue ? selected.contribution_margin / selected.gross_revenue : 0;
  const baselineDelta = selected.contribution_margin - baseline;
  const dataFields = Object.keys(dataset.rows[0] ?? {});
  const sampleRows = selectedRows.slice(0, 6);
  const reset = () => {
    setWeek(dataset.guided_scenario.week);
    setCategory(dataset.guided_scenario.category);
    setRegion(dataset.guided_scenario.region);
    setChannel(dataset.guided_scenario.channel);
    const rows = dataset.rows.filter((row) => row.week === dataset.guided_scenario.week && matches(row, dataset.guided_scenario.category, dataset.guided_scenario.region, dataset.guided_scenario.channel));
    setPromoPercent(Math.round(aggregate(rows).promo_depth * 100));
  };

  return (
    <section className={`${styles.upgrade} analytics-lab margin-lab`} data-testid="margin-control-tower" aria-labelledby="margin-lab-title">
      <header className="analytics-lab-header"><div><p className="eyebrow">{activeSource === "synthetic" ? (locale === "en" ? "Synthetic dataset / linked decision workspace" : "合成数据集 / 联动决策工作区") : (locale === "en" ? "Olist Parquet / browser-native decision workspace" : "Olist Parquet / 浏览器本地决策工作区")}</p><h3 id="margin-lab-title">Margin Control Tower</h3><p>{activeSource === "synthetic" ? (locale === "en" ? "Find where contribution margin breaks, trace the cost driver, and test one bounded operating change against a held-out synthetic period." : "定位贡献毛利异常，追查成本驱动因素，再用留出的合成周期检验一项有边界的运营调整。") : (locale === "en" ? "Query the committed offline Olist artifact in-browser, trace margin drivers, and keep scenario assumptions separate from measured data." : "在浏览器内查询已提交的离线 Olist 产物，追查毛利驱动，并将情景假设与实测数据分开。")}</p></div><div className="analytics-boundary"><ShieldCheck aria-hidden="true" /><strong>{activeSource === "synthetic" ? (locale === "en" ? "Fixed-seed synthetic data only" : "仅使用固定 seed 的合成数据") : (locale === "en" ? "Loaded offline artifact" : "已载入离线产物")}</strong><span>{activeSource === "synthetic" ? (locale === "en" ? "No real order, customer, commercial result, or inherited dashboard value appears here." : "这里不包含真实订单、客户、商业结果或继承自旧面板的数值。") : (locale === "en" ? "Metrics are computed from the committed Parquet rows; scenario outputs remain assumptions, not causal results." : "指标由已提交的 Parquet 行计算；情景输出仍是假设，不是因果结果。")}</span></div></header>

      <div className="dataset-source-row"><div className="dataset-source-toggle" role="group" aria-label={locale === "en" ? "Margin dataset source" : "毛利数据源"}><button type="button" aria-pressed={requestedSource === "synthetic"} onClick={() => selectDatasetSource("synthetic")}>{locale === "en" ? "Synthetic fixture" : "合成夹具"}</button><button type="button" aria-pressed={requestedSource === "real"} onClick={() => selectDatasetSource("real")}>{locale === "en" ? "Olist (real)" : "Olist（真实）"}</button></div><span>{locale === "en" ? "Synthetic fixture / Olist (real)" : "合成夹具 / Olist（真实）"}</span></div>
      {requestedSource === "real" && realArtifactStatus !== "loaded" ? <div className={`real-artifact-state ${realArtifactStatus === "invalid" ? "invalid" : ""}`} role="status"><CircleAlert aria-hidden="true" /><div><strong>{realArtifactStatus === "loading" ? (locale === "en" ? "Checking real-data artifact…" : "正在检查真实数据产物……") : realArtifactStatus === "invalid" ? (locale === "en" ? "real-data artifact blocked" : "真实数据产物已阻断") : (locale === "en" ? "real-data artifact pending" : "真实数据产物待提交")}</strong><p>{realArtifactStatus === "invalid" ? realArtifactDetail : (locale === "en" ? "olist-margin.parquet is not committed; the governed synthetic fixture remains active." : "olist-margin.parquet 尚未提交；当前继续使用受治理的合成夹具。")}</p></div></div> : null}

      <section className="analytics-dataset-context" aria-label={locale === "en" ? "Dataset context" : "数据集说明"}>
        <div className="analytics-context-title"><Database aria-hidden="true" /><div><span>{locale === "en" ? "Dataset and decision context" : "数据集与决策背景"}</span><strong>{activeSource === "synthetic" ? "Margin Synthetic v2" : "Olist margin artifact"}</strong><code>{dataset.dataset_version}</code></div></div>
        <dl><div><dt>{locale === "en" ? "Coverage" : "覆盖范围"}</dt><dd>{dataset.dimensions.weeks} {locale === "en" ? "weeks" : "周"} · {dataset.date_range.start} → {dataset.date_range.end}</dd></div><div><dt>{locale === "en" ? "Grain" : "粒度"}</dt><dd>{activeSource === "synthetic" ? (locale === "en" ? "week × product × region × channel" : "周 × 商品 × 区域 × 渠道") : (locale === "en" ? "week × product category × region × dominant payment channel" : "周 × 商品品类 × 区域 × 主支付渠道")}</dd></div><div><dt>{locale === "en" ? "Scale" : "规模"}</dt><dd>{activeSource === "synthetic" ? <>{integer.format(dataset.rows.length)} {locale === "en" ? "rows" : "行"} · {integer.format(totalOrders)} {locale === "en" ? "synthetic orders" : "笔合成订单"}</> : <>{integer.format(dataset.rows.length)} {locale === "en" ? "derived category cells" : "个派生品类单元"} · {integer.format(dataset.source_order_count ?? 0)} {locale === "en" ? "source orders" : "笔源订单"}</>}</dd></div><div><dt>{locale === "en" ? "Dimensions" : "维度"}</dt><dd>{activeSource === "synthetic" ? <>{dataset.dimensions.products} {locale === "en" ? "products" : "个商品"} · {dataset.dimensions.categories} {locale === "en" ? "categories" : "个品类"} · {dataset.dimensions.regions} {locale === "en" ? "regions" : "个区域"} · {dataset.dimensions.channels} {locale === "en" ? "channels" : "个渠道"}</> : <>{dataset.dimensions.categories} {locale === "en" ? "product categories" : "个商品品类"} · {dataset.dimensions.regions} {locale === "en" ? "mapped regions" : "个映射区域"} · {dataset.dimensions.channels} {locale === "en" ? "payment channels" : "个支付渠道"}</>}</dd></div><div><dt>Holdout</dt><dd>8 {locale === "en" ? "observed weeks" : "个观测周"} · {dataset.holdout_period.start} → {dataset.holdout_period.end}</dd></div><div><dt>{activeSource === "synthetic" ? (locale === "en" ? "Injected anomaly" : "注入异常") : (locale === "en" ? "Guided category slice" : "引导品类切片")}</dt><dd>{dataset.guided_scenario.week} · {dataset.guided_scenario.category} · {dataset.guided_scenario.region}</dd></div></dl>
        <p>{activeSource === "synthetic" ? (locale === "en" ? "Versioned generator, fixed rules, and fixed seed. The final eight weeks are excluded from diagnosis and kept for verification." : "生成器有版本记录，规则和 seed 固定。最后八周不参与诊断，仅用于验证。") : (locale === "en" ? "The browser verifies the exact final-eight-week split and SHA-256 of the committed category-level Parquet before any linked report can render." : "浏览器会校验已提交品类级 Parquet 的最后八周切分与实际 SHA-256；只有通过后才会显示关联报告。")}</p>
        {activeSource === "synthetic" ? <div className="analytics-download-row"><ArtifactLink href={DATA_URL}>{locale === "en" ? "Explore full JSON" : "浏览完整 JSON"}</ArtifactLink><a href={CSV_URL} download><Download aria-hidden="true" />{locale === "en" ? "Download full CSV" : "下载完整 CSV"}</a><a href={PARQUET_URL} download><Download aria-hidden="true" />{locale === "en" ? "Download synthetic Parquet" : "下载合成 Parquet"}</a><ArtifactLink href={SAMPLE_URL}>{locale === "en" ? "Browse CSV sample" : "浏览 CSV 样本"}</ArtifactLink></div> : <div className="analytics-download-row"><a href={REAL_PARQUET_URL} download><Download aria-hidden="true" />{locale === "en" ? "Download Olist aggregate" : "下载 Olist 聚合产物"}</a><ArtifactLink href="/case-studies/margin-control-tower/methods-evidence.json">{locale === "en" ? "Open methods evidence" : "查看方法证据"}</ArtifactLink><ArtifactLink href="/case-studies/margin-control-tower/README.md">{locale === "en" ? "Artifact notes" : "产物说明"}</ArtifactLink></div>}
      </section>

      <section className="analytics-explorer" aria-label={locale === "en" ? "Dataset explorer" : "数据集浏览器"}>
        <div className="analytics-explorer-tabs" role="tablist">{(["sample", "schema", "quality"] as ExplorerTab[]).map((tab) => <button key={tab} type="button" role="tab" aria-selected={explorerTab === tab} onClick={() => setExplorerTab(tab)}>{tab === "sample" ? (locale === "en" ? "Sample rows" : "样本记录") : tab === "schema" ? (locale === "en" ? "Schema and dictionary" : "Schema 与字段说明") : (locale === "en" ? "Quality checks" : "质量检查")}</button>)}</div>
        {explorerTab === "sample" ? <div className="analytics-sample-table"><table><thead><tr><th>{activeSource === "synthetic" ? (locale === "en" ? "product" : "商品") : (locale === "en" ? "product category" : "商品品类")}</th><th>{locale === "en" ? "region" : "区域"}</th><th>{activeSource === "synthetic" ? (locale === "en" ? "channel" : "渠道") : (locale === "en" ? "payment channel" : "支付渠道")}</th><th>{locale === "en" ? "orders" : "订单数"}</th><th>{locale === "en" ? "gross" : "毛收入"}</th><th>{locale === "en" ? "margin" : "毛利"}</th></tr></thead><tbody>{sampleRows.map((row) => <tr key={`${row.product_id}-${row.region}-${row.channel}`}><td>{activeSource === "synthetic" ? `${row.product_id} · ${row.product_name}` : row.category}</td><td>{row.region}</td><td>{row.channel}</td><td>{row.order_count}</td><td>{money.format(row.gross_revenue)}</td><td>{money.format(row.contribution_margin)}</td></tr>)}</tbody></table></div> : null}
        {explorerTab === "schema" ? <div className="analytics-field-grid">{dataFields.map((field) => <div key={field}><code>{field}</code><span>{activeSource === "real" && ["product_id", "product_name"].includes(field) ? (locale === "en" ? "category compatibility surrogate; not product-level evidence" : "品类兼容字段；不代表商品级证据") : field.includes("revenue") || ["discounts", "returns", "cogs", "fulfillment", "contribution_margin"].includes(field) ? (activeSource === "synthetic" ? (locale === "en" ? "synthetic currency" : "合成货币") : (locale === "en" ? "artifact currency" : "产物货币")) : field.includes("rate") || field === "promo_depth" ? (locale === "en" ? "bounded ratio" : "有界比率") : ["order_count", "units"].includes(field) ? (locale === "en" ? "count" : "计数") : (locale === "en" ? "dimension or flag" : "维度或标记")}</span></div>)}</div> : null}
        {explorerTab === "quality" ? <div className="analytics-quality-list">{contractChecks.map((check) => <p key={check.name} className={check.pass ? "pass" : "fail"}>{check.pass ? <Check aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}{check.name}</p>)}</div> : null}
      </section>

      <div className="analytics-controlbar"><label><span>{locale === "en" ? "Week" : "周"}</span><select value={week} onChange={(event) => { setWeek(event.target.value); const rows = filteredRows.filter((row) => row.week === event.target.value); setPromoPercent(Math.round(aggregate(rows).promo_depth * 100)); }}>{[...new Set(dataset.rows.map((row) => row.week))].map((value) => <option key={value}>{value}</option>)}</select></label><label><span>{locale === "en" ? "Category" : "品类"}</span><select value={category} onChange={(event) => setCategory(event.target.value)}>{[...new Set(dataset.rows.map((row) => row.category))].map((value) => <option key={value}>{value}</option>)}</select></label><label><span>{locale === "en" ? "Region" : "区域"}</span><select value={region} onChange={(event) => setRegion(event.target.value)}>{["All", ...new Set(dataset.rows.map((row) => row.region))].map((value) => <option key={value}>{value}</option>)}</select></label><label><span>{locale === "en" ? "Channel" : "渠道"}</span><select value={channel} onChange={(event) => setChannel(event.target.value)}>{["All", ...new Set(dataset.rows.map((row) => row.channel))].map((value) => <option key={value}>{value}</option>)}</select></label><button type="button" onClick={reset}><RotateCcw aria-hidden="true" />{locale === "en" ? "Guided scenario" : "引导案例"}</button><strong className={allPass ? "pass" : "fail"}>{allPass ? <Check aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}{allPass ? (locale === "en" ? "10 / 10 contracts pass" : "10 / 10 项契约通过") : (locale === "en" ? "Contract failure — output blocked" : "契约失败，输出已阻断")}</strong></div>

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
        <section className="margin-heatmap"><div className="analytics-pane-heading"><span>{locale === "en" ? "Category × region" : "品类 × 区域"}</span><code>{locale === "en" ? "click to filter" : "点击筛选"}</code></div><div className="margin-heatmap-grid">{heatmap.map((cell) => <button type="button" key={`${cell.category}-${cell.region}`} title={`${cell.category} / ${cell.region}: ${money.format(cell.margin)}`} className={cell.margin < 0 ? "negative" : "positive"} style={{ "--heat-level": `${Math.max(12, Math.abs(cell.margin) / heatMax * 100)}%` } as CSSProperties} onClick={() => { setCategory(cell.category); setRegion(cell.region); }}><span>{cell.category}</span><small>{cell.region}</small><strong>{money.format(cell.margin)}</strong></button>)}</div></section>
      </div>

      <section className="margin-trend-panel"><div className="analytics-pane-heading"><span>{activeSource === "synthetic" ? (locale === "en" ? "52-week trend and holdout" : "52 周趋势与 holdout") : (locale === "en" ? `${dataset.dimensions.weeks}-week category trend and final-eight-week holdout` : `${dataset.dimensions.weeks} 周品类趋势与最后八周 holdout`)}</span><code>{locale === "en" ? "bars are linked to the selected week" : "柱形图与所选周联动"}</code></div><div className="margin-week-bars" aria-label={locale === "en" ? "Weekly contribution margin" : "周度贡献毛利"}>{categoryWeeks.map((item) => <button type="button" title={`${item.week}: ${money.format(item.total.contribution_margin)}`} key={item.week} className={`${item.week === week ? "active" : ""} ${item.anomaly ? "anomaly" : ""} ${item.split === "holdout" ? "holdout" : ""}`} onClick={() => { setWeek(item.week); setPromoPercent(Math.round(item.total.promo_depth * 100)); }}><span style={{ height: `${Math.max(6, Math.abs(item.total.contribution_margin) / maxMagnitude * 100)}%` }} /><code>{item.week.slice(5)}</code></button>)}</div><div className="margin-trend-legend"><span><i className="analysis" />{locale === "en" ? "Analysis" : "分析期"}</span><span><i className="holdout" />{locale === "en" ? "Holdout" : "留出期"}</span>{activeSource === "synthetic" ? <span><i className="anomaly" />{locale === "en" ? "Injected anomaly" : "注入异常"}</span> : <span>{locale === "en" ? "Replay labels stay outside Parquet" : "重放标签不进入 Parquet"}</span>}</div></section>

      <div className="margin-decision-grid">
        <div className="margin-diagnosis"><div className="analytics-pane-heading"><span>{locale === "en" ? "Linked cost drivers" : "联动成本驱动"}</span><code>{selectedRows.some((row) => row.injected_anomaly) ? (activeSource === "synthetic" ? (locale === "en" ? "fixed-seed anomaly" : "固定 seed 异常") : (locale === "en" ? "artifact label" : "产物标签")) : (locale === "en" ? "comparison" : "对比态")}</code></div><div className="margin-driver-grid">{[[locale === "en" ? "Discounts" : "折扣", selected.discounts, selected.promo_depth], [locale === "en" ? "Returns" : "退货", selected.returns, selected.return_rate], [locale === "en" ? "Fulfillment" : "履约成本", selected.fulfillment, selected.fulfillment / Math.max(1, selected.gross_revenue)]].map(([label, value, ratio]) => <div key={String(label)}><span>{label}</span><strong>{money.format(Number(value))}</strong><i><b style={{ width: `${Math.min(100, Number(ratio) * 300)}%` }} /></i><small>{(Number(ratio) * 100).toFixed(1)}% {locale === "en" ? "of gross" : "占 gross"}</small></div>)}</div><div className="margin-root-cause"><TrendingDown aria-hidden="true" /><div><span>{selectedRows.some((row) => row.injected_anomaly) ? (activeSource === "synthetic" ? (locale === "en" ? "fixed-seed injected anomaly" : "固定 seed 注入异常") : (locale === "en" ? "offline artifact label" : "离线产物标签")) : (locale === "en" ? "deterministic comparison" : "确定性对比")}</span><strong>{selectedRows.some((row) => row.injected_anomaly) ? (locale === "en" ? "Promotion, returns, and fulfillment moved together" : "促销、退货与履约成本同时变动") : (locale === "en" ? "No anomaly label in this slice" : "该切片没有异常标签")}</strong><p>{activeSource === "synthetic" ? (locale === "en" ? "Use the product view below to find the largest contributor; this is descriptive diagnosis, not causal proof." : "通过下方商品视图定位影响最大的项目；这是描述性诊断，不构成因果证明。") : (locale === "en" ? "Use the category comparison below to place this slice among other categories; this is descriptive diagnosis, not causal proof." : "通过下方品类对比判断该切片在其他品类中的位置；这是描述性诊断，不构成因果证明。")}</p></div></div><div className="margin-product-multiples">{contributionBreakdown.map((item) => <div key={item.id}><span>{activeSource === "synthetic" ? `${item.id} · ${item.name}` : item.name}</span><i><b style={{ width: `${Math.max(3, Math.abs(item.total.contribution_margin) / Math.max(1, ...contributionBreakdown.map((entry) => Math.abs(entry.total.contribution_margin))) * 100)}%` }} /></i><strong>{money.format(item.total.contribution_margin)}</strong></div>)}</div></div>
        <div className="margin-scenario"><div className="analytics-pane-heading"><span>{locale === "en" ? "Bounded action scenario" : "有边界行动情景"}</span><code>{locale === "en" ? "assumption, not forecast" : "假设，非预测"}</code></div><div className="margin-slider"><SlidersHorizontal aria-hidden="true" /><label><span>{locale === "en" ? "Promotion depth" : "促销深度"}</span><strong>{promoPercent}%</strong><input aria-label={locale === "en" ? "Promotion depth" : "促销深度"} type="range" min="4" max="30" value={promoPercent} onChange={(event) => setPromoPercent(Number(event.target.value))} /></label></div><p className="analytics-assumption">{locale === "en" ? "Assumption: each 1 percentage-point promotion change moves units by 0.8% in the same direction; return rate and unit economics stay fixed." : "假设：促销每变动 1 个百分点，销量同向变动 0.8%；退货率与单位经济保持不变。"}</p><div className="margin-before-after"><div><span>{locale === "en" ? "Before" : "调整前"}</span><strong>{money.format(selected.contribution_margin)}</strong><small>{integer.format(selected.units)} {locale === "en" ? "units" : "件"}</small></div><div><span>{locale === "en" ? "Scenario" : "情景结果"}</span><strong>{money.format(scenario.margin)}</strong><small>{integer.format(scenario.units)} {locale === "en" ? "units" : "件"}</small></div><div className={scenario.delta < 0 ? "negative" : "positive"}><span>Delta</span><strong>{scenario.delta >= 0 ? "+" : ""}{money.format(scenario.delta)}</strong><small>{(scenario.assumedUnitChange * 100).toFixed(1)}% {locale === "en" ? "assumed unit change" : "假设销量变化"}</small></div></div><div className="margin-holdout"><span>{activeSource === "synthetic" ? (locale === "en" ? "Synthetic holdout check" : "合成 holdout 检查") : (locale === "en" ? "Offline holdout check" : "离线 holdout 检查")}</span>{holdout ? <><p>{holdout.week}: <strong>{money.format(holdout.total.contribution_margin)}</strong></p><p>{activeSource === "synthetic" ? (locale === "en" ? "Held-out synthetic observation; a comparison prompt, not causal validation." : "留出的合成观察，仅用于比较提示，不是因果验证。") : (locale === "en" ? "Held-out artifact observation; still not causal validation." : "留出的产物观察；仍不构成因果验证。")}</p></> : <p>{locale === "en" ? "No later held-out week for this selection." : "当前选择没有更晚的 holdout 周。"}</p>}</div><div className="margin-action"><span>{locale === "en" ? "Action queue" : "行动队列"}</span><strong>{scenario.delta > 0.5 ? (locale === "en" ? "Test the lower-cost promotion setting; assign return and fulfillment checks before rollout." : "测试成本更低的促销设置；发布前安排退货与履约检查。") : (locale === "en" ? "Hold the change; scenario margin does not improve." : "暂停变更；情景毛利没有改善。")}</strong><code>{`${activeSource === "synthetic" ? "SYN" : "OLIST"}-ACTION-${week}-${category}-${promoPercent}`}</code></div></div>
      </div>

      {requestedSource === "real" ? <div className="analytics-offline-grid"><DetectionPanel locale={locale} artifactReady={activeSource === "real" && realArtifactStatus === "loaded"} artifactSha256={realArtifactSha256} /><ElasticityPanel locale={locale} artifactReady={activeSource === "real" && realArtifactStatus === "loaded"} artifactSha256={realArtifactSha256} /></div> : null}

      <div className="analytics-contract-grid"><div><span>{locale === "en" ? "Contract status" : "契约状态"}</span><p className={allPass ? "pass" : "fail"}>{allPass ? <Check aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}{allPass ? (locale === "en" ? "All ten checks pass" : "十项检查全部通过") : (locale === "en" ? "Output is blocked" : "输出已阻断")}</p><p>{locale === "en" ? "No null dimension keys; no duplicate grain; accounting identities reconcile." : "维度键无空值、粒度无重复、会计恒等式对账一致。"}</p></div><div><span>{locale === "en" ? "Metric semantics" : "指标语义"}</span><code>gross → discounts → returns → net → COGS → fulfillment → contribution margin</code><p>{dataset.grain}</p><p>{dataset.license}</p></div></div>
      <footer className="analytics-lab-footer"><div><span>{activeSource === "synthetic" ? (locale === "en" ? "Seed / version" : "种子 / 版本") : (locale === "en" ? "Artifact / version" : "产物 / 版本")}</span><code>{activeSource === "synthetic" ? `${dataset.seed} / ${dataset.dataset_version}` : `olist-margin.parquet / ${dataset.dataset_version}`}</code></div><div><span>{activeSource === "synthetic" ? (locale === "en" ? "Rows SHA-256" : "行数据 SHA-256") : (locale === "en" ? "Artifact SHA-256" : "产物 SHA-256")}</span><code>{activeSource === "synthetic" ? dataset.rows_sha256 : realArtifactSha256}</code></div><div><ArtifactLink href={CONTRACT_URL}>{locale === "en" ? "Open contract" : "查看契约"}</ArtifactLink><ArtifactLink href={REGISTRY_URL}>{locale === "en" ? "Metric definitions" : "指标定义"}</ArtifactLink></div></footer>
    </section>
  );
}
