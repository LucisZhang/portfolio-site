"use client";

import { Check, CircleAlert, Database, Download, RotateCcw, ShieldCheck, SlidersHorizontal, TrendingDown } from "lucide-react";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import ArtifactLink from "@/components/ArtifactLink";
import { useI18n } from "@/lib/i18n";

const DATA_URL = "/case-studies/margin-control-tower/synthetic-margin-data.json";
const CSV_URL = "/case-studies/margin-control-tower/synthetic-margin-data.csv";
const PARQUET_URL = "/case-studies/margin-control-tower/synthetic-margin-data.parquet";
const SAMPLE_URL = "/case-studies/margin-control-tower/synthetic-margin-sample.csv";
const CONTRACT_URL = "/case-studies/margin-control-tower/data-contract.json";
const REGISTRY_URL = "/case-studies/margin-control-tower/metric-registry.json";

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
  dataset_version: string;
  seed: number;
  classification: string;
  license: string;
  grain: string;
  date_range: { start: string; end: string };
  dimensions: { weeks: number; categories: number; products: number; regions: number; channels: number };
  analysis_period: { start: string; end: string };
  holdout_period: { start: string; end: string };
  guided_scenario: { week: string; category: string; region: string; channel: string };
  assumptions: string[];
  rows_sha256: string;
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

function checksFor(rows: MarginRow[]): CheckResult[] {
  const required = ["week", "period_split", "category", "product_id", "region", "channel", "order_count", "gross_revenue", "discounts", "returns", "net_revenue", "cogs", "fulfillment", "contribution_margin", "provenance"];
  const grains = rows.map((row) => `${row.week}|${row.product_id}|${row.region}|${row.channel}`);
  return [
    { name: "schema fields present", pass: rows.every((row) => required.every((field) => field in row)) },
    { name: "week-product-region-channel grain unique", pass: new Set(grains).size === grains.length },
    { name: "no null dimension keys", pass: rows.every((row) => [row.week, row.category, row.product_id, row.region, row.channel].every(Boolean)) },
    { name: "numeric costs and revenue non-negative", pass: rows.every((row) => [row.order_count, row.units, row.gross_revenue, row.discounts, row.returns, row.cogs, row.fulfillment].every((value) => value >= 0)) },
    { name: "promotion and return rates bounded", pass: rows.every((row) => row.promo_depth >= 0 && row.promo_depth <= 0.5 && row.return_rate >= 0 && row.return_rate <= 0.5) },
    { name: "gross revenue identity", pass: rows.every((row) => near(row.gross_revenue, row.units * row.unit_price)) },
    { name: "net revenue identity", pass: rows.every((row) => near(row.net_revenue, row.gross_revenue - row.discounts - row.returns)) },
    { name: "contribution identity", pass: rows.every((row) => near(row.contribution_margin, row.net_revenue - row.cogs - row.fulfillment)) },
    { name: "analysis and holdout are disjoint", pass: rows.every((row) => ["analysis", "holdout"].includes(row.period_split)) },
    { name: "synthetic provenance", pass: rows.every((row) => row.provenance === "synthetic") },
  ];
}

function matches(row: MarginRow, category: string, region: string, channel: string) {
  return row.category === category && (region === "All" || row.region === region) && (channel === "All" || row.channel === channel);
}

export default function MarginControlTower() {
  const { locale } = useI18n();
  const [dataset, setDataset] = useState<MarginDataset | null>(null);
  const [week, setWeek] = useState("");
  const [category, setCategory] = useState("");
  const [region, setRegion] = useState("All");
  const [channel, setChannel] = useState("All");
  const [promoPercent, setPromoPercent] = useState(12);
  const [explorerTab, setExplorerTab] = useState<ExplorerTab>("sample");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    fetch(DATA_URL).then((response) => {
      if (!response.ok) throw new Error(`Margin dataset returned ${response.status}`);
      return response.json() as Promise<MarginDataset>;
    }).then((next) => {
      if (!active) return;
      setDataset(next);
      setWeek(next.guided_scenario.week);
      setCategory(next.guided_scenario.category);
      setRegion(next.guided_scenario.region);
      setChannel(next.guided_scenario.channel);
      const selected = next.rows.filter((row) => row.week === next.guided_scenario.week && matches(row, next.guided_scenario.category, next.guided_scenario.region, next.guided_scenario.channel));
      setPromoPercent(Math.round(aggregate(selected).promo_depth * 100));
    }).catch((reason: unknown) => { if (active) setLoadError(reason instanceof Error ? reason.message : "Dataset unavailable."); });
    return () => { active = false; };
  }, []);

  const contractChecks = useMemo(() => dataset ? checksFor(dataset.rows) : [], [dataset]);
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
  const products = useMemo(() => {
    const ids = [...new Set(selectedRows.map((row) => row.product_id))];
    return ids.map((id) => ({ id, name: selectedRows.find((row) => row.product_id === id)?.product_name ?? id, total: aggregate(selectedRows.filter((row) => row.product_id === id)) })).sort((left, right) => left.total.contribution_margin - right.total.contribution_margin);
  }, [selectedRows]);

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
    <section className="analytics-lab margin-lab" data-testid="margin-control-tower" aria-labelledby="margin-lab-title">
      <header className="analytics-lab-header"><div><p className="eyebrow">{locale === "en" ? "Synthetic dataset / linked decision workspace" : "合成数据集 / 联动决策工作区"}</p><h3 id="margin-lab-title">Margin Control Tower</h3><p>{locale === "en" ? "Find where contribution margin breaks, trace the cost driver, and test one bounded operating change against a held-out synthetic period." : "定位贡献毛利异常，追查成本驱动因素，再用留出的合成周期检验一项有边界的运营调整。"}</p></div><div className="analytics-boundary"><ShieldCheck aria-hidden="true" /><strong>{locale === "en" ? "Fixed-seed synthetic data only" : "仅使用固定 seed 的合成数据"}</strong><span>{locale === "en" ? "No real order, customer, commercial result, or inherited dashboard value appears here." : "这里不包含真实订单、客户、商业结果或继承自旧面板的数值。"}</span></div></header>

      <section className="analytics-dataset-context" aria-label={locale === "en" ? "Dataset context" : "数据集说明"}>
        <div className="analytics-context-title"><Database aria-hidden="true" /><div><span>{locale === "en" ? "Dataset and decision context" : "数据集与决策背景"}</span><strong>Margin Synthetic v2</strong><code>{dataset.dataset_version}</code></div></div>
        <dl><div><dt>{locale === "en" ? "Coverage" : "覆盖范围"}</dt><dd>{dataset.dimensions.weeks} {locale === "en" ? "weeks" : "周"} · {dataset.date_range.start} → {dataset.date_range.end}</dd></div><div><dt>{locale === "en" ? "Grain" : "粒度"}</dt><dd>{locale === "en" ? "week × product × region × channel" : "周 × 商品 × 区域 × 渠道"}</dd></div><div><dt>{locale === "en" ? "Scale" : "规模"}</dt><dd>{integer.format(dataset.rows.length)} {locale === "en" ? "rows" : "行"} · {integer.format(totalOrders)} {locale === "en" ? "synthetic orders" : "笔合成订单"}</dd></div><div><dt>{locale === "en" ? "Dimensions" : "维度"}</dt><dd>{dataset.dimensions.products} {locale === "en" ? "products" : "个商品"} · {dataset.dimensions.categories} {locale === "en" ? "categories" : "个品类"} · {dataset.dimensions.regions} {locale === "en" ? "regions" : "个区域"} · {dataset.dimensions.channels} {locale === "en" ? "channels" : "个渠道"}</dd></div><div><dt>Holdout</dt><dd>{dataset.holdout_period.start} → {dataset.holdout_period.end}</dd></div><div><dt>{locale === "en" ? "Injected anomaly" : "注入异常"}</dt><dd>{dataset.guided_scenario.week} · Electronics · West</dd></div></dl>
        <p>{locale === "en" ? "Versioned generator, fixed rules, and fixed seed. The final eight weeks are excluded from diagnosis and kept for verification." : "生成器有版本记录，规则和 seed 固定。最后八周不参与诊断，仅用于验证。"}</p>
        <div className="analytics-download-row"><ArtifactLink href={DATA_URL}>{locale === "en" ? "Explore full JSON" : "浏览完整 JSON"}</ArtifactLink><a href={CSV_URL} download><Download aria-hidden="true" />{locale === "en" ? "Download full CSV" : "下载完整 CSV"}</a><a href={PARQUET_URL} download><Download aria-hidden="true" />{locale === "en" ? "Download Parquet" : "下载 Parquet"}</a><ArtifactLink href={SAMPLE_URL}>{locale === "en" ? "Browse CSV sample" : "浏览 CSV 样本"}</ArtifactLink><span>{locale === "en" ? "Generator source: publication pending" : "生成器源码：等待发布"}</span></div>
      </section>

      <section className="analytics-explorer" aria-label={locale === "en" ? "Dataset explorer" : "数据集浏览器"}>
        <div className="analytics-explorer-tabs" role="tablist">{(["sample", "schema", "quality"] as ExplorerTab[]).map((tab) => <button key={tab} type="button" role="tab" aria-selected={explorerTab === tab} onClick={() => setExplorerTab(tab)}>{tab === "sample" ? (locale === "en" ? "Sample rows" : "样本记录") : tab === "schema" ? (locale === "en" ? "Schema and dictionary" : "Schema 与字段说明") : (locale === "en" ? "Quality checks" : "质量检查")}</button>)}</div>
        {explorerTab === "sample" ? <div className="analytics-sample-table"><table><thead><tr><th>{locale === "en" ? "product" : "商品"}</th><th>{locale === "en" ? "region" : "区域"}</th><th>{locale === "en" ? "channel" : "渠道"}</th><th>{locale === "en" ? "orders" : "订单数"}</th><th>{locale === "en" ? "gross" : "毛收入"}</th><th>{locale === "en" ? "margin" : "毛利"}</th></tr></thead><tbody>{sampleRows.map((row) => <tr key={`${row.product_id}-${row.region}-${row.channel}`}><td>{row.product_id} · {row.product_name}</td><td>{row.region}</td><td>{row.channel}</td><td>{row.order_count}</td><td>{money.format(row.gross_revenue)}</td><td>{money.format(row.contribution_margin)}</td></tr>)}</tbody></table></div> : null}
        {explorerTab === "schema" ? <div className="analytics-field-grid">{dataFields.map((field) => <div key={field}><code>{field}</code><span>{field.includes("revenue") || ["discounts", "returns", "cogs", "fulfillment", "contribution_margin"].includes(field) ? (locale === "en" ? "synthetic currency" : "合成货币") : field.includes("rate") || field === "promo_depth" ? (locale === "en" ? "bounded ratio" : "有界比率") : ["order_count", "units"].includes(field) ? (locale === "en" ? "count" : "计数") : (locale === "en" ? "dimension or flag" : "维度或标记")}</span></div>)}</div> : null}
        {explorerTab === "quality" ? <div className="analytics-quality-list">{contractChecks.map((check) => <p key={check.name} className={check.pass ? "pass" : "fail"}>{check.pass ? <Check aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}{check.name}</p>)}</div> : null}
      </section>

      <div className="analytics-controlbar"><label><span>{locale === "en" ? "Week" : "周"}</span><select value={week} onChange={(event) => { setWeek(event.target.value); const rows = filteredRows.filter((row) => row.week === event.target.value); setPromoPercent(Math.round(aggregate(rows).promo_depth * 100)); }}>{[...new Set(dataset.rows.map((row) => row.week))].map((value) => <option key={value}>{value}</option>)}</select></label><label><span>{locale === "en" ? "Category" : "品类"}</span><select value={category} onChange={(event) => setCategory(event.target.value)}>{[...new Set(dataset.rows.map((row) => row.category))].map((value) => <option key={value}>{value}</option>)}</select></label><label><span>{locale === "en" ? "Region" : "区域"}</span><select value={region} onChange={(event) => setRegion(event.target.value)}>{["All", ...new Set(dataset.rows.map((row) => row.region))].map((value) => <option key={value}>{value}</option>)}</select></label><label><span>{locale === "en" ? "Channel" : "渠道"}</span><select value={channel} onChange={(event) => setChannel(event.target.value)}>{["All", ...new Set(dataset.rows.map((row) => row.channel))].map((value) => <option key={value}>{value}</option>)}</select></label><button type="button" onClick={reset}><RotateCcw aria-hidden="true" />{locale === "en" ? "Guided scenario" : "引导案例"}</button><strong className={allPass ? "pass" : "fail"}>{allPass ? <Check aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}{allPass ? (locale === "en" ? "10 / 10 contracts pass" : "10 / 10 项契约通过") : (locale === "en" ? "Contract failure — output blocked" : "契约失败，输出已阻断")}</strong></div>

      <div className="margin-kpis"><div><span>{locale === "en" ? "Contribution margin" : "贡献毛利"}</span><strong>{money.format(selected.contribution_margin)}</strong></div><div><span>{locale === "en" ? "Margin rate" : "毛利率"}</span><strong>{(marginRate * 100).toFixed(1)}%</strong></div><div className={baselineDelta < 0 ? "negative" : "positive"}><span>{locale === "en" ? "vs prior 8-week mean" : "较前八周均值"}</span><strong>{baselineDelta >= 0 ? "+" : ""}{money.format(baselineDelta)}</strong></div></div>

      <div className="margin-analysis-grid">
        <section className="margin-waterfall"><div className="analytics-pane-heading"><span>{locale === "en" ? "Margin bridge" : "毛利桥"}</span><code>{week}</code></div>{[[locale === "en" ? "Gross revenue" : "毛收入", selected.gross_revenue], [locale === "en" ? "Discounts" : "折扣", -selected.discounts], [locale === "en" ? "Returns" : "退货", -selected.returns], [locale === "en" ? "Net revenue" : "净收入", selected.net_revenue], [locale === "en" ? "COGS" : "销货成本", -selected.cogs], [locale === "en" ? "Fulfillment" : "履约成本", -selected.fulfillment], [locale === "en" ? "Contribution margin" : "贡献毛利", selected.contribution_margin]].map(([label, value]) => <div className={Number(value) < 0 ? "cost" : "value"} key={String(label)}><span>{label}</span><i style={{ width: `${Math.max(4, Math.abs(Number(value)) / Math.max(1, selected.gross_revenue) * 100)}%` }} /><strong>{Number(value) >= 0 ? "" : "−"}{money.format(Math.abs(Number(value)))}</strong></div>)}</section>
        <section className="margin-heatmap"><div className="analytics-pane-heading"><span>{locale === "en" ? "Category × region" : "品类 × 区域"}</span><code>{locale === "en" ? "click to filter" : "点击筛选"}</code></div><div className="margin-heatmap-grid">{heatmap.map((cell) => <button type="button" key={`${cell.category}-${cell.region}`} title={`${cell.category} / ${cell.region}: ${money.format(cell.margin)}`} className={cell.margin < 0 ? "negative" : "positive"} style={{ "--heat-level": `${Math.max(12, Math.abs(cell.margin) / heatMax * 100)}%` } as CSSProperties} onClick={() => { setCategory(cell.category); setRegion(cell.region); }}><span>{cell.category}</span><small>{cell.region}</small><strong>{money.format(cell.margin)}</strong></button>)}</div></section>
      </div>

      <section className="margin-trend-panel"><div className="analytics-pane-heading"><span>{locale === "en" ? "52-week trend and holdout" : "52 周趋势与 holdout"}</span><code>{locale === "en" ? "bars are linked to the selected week" : "柱形图与所选周联动"}</code></div><div className="margin-week-bars" aria-label={locale === "en" ? "Weekly contribution margin" : "周度贡献毛利"}>{categoryWeeks.map((item) => <button type="button" title={`${item.week}: ${money.format(item.total.contribution_margin)}`} key={item.week} className={`${item.week === week ? "active" : ""} ${item.anomaly ? "anomaly" : ""} ${item.split === "holdout" ? "holdout" : ""}`} onClick={() => { setWeek(item.week); setPromoPercent(Math.round(item.total.promo_depth * 100)); }}><span style={{ height: `${Math.max(6, Math.abs(item.total.contribution_margin) / maxMagnitude * 100)}%` }} /><code>{item.week.slice(5)}</code></button>)}</div><div className="margin-trend-legend"><span><i className="analysis" />{locale === "en" ? "Analysis" : "分析期"}</span><span><i className="holdout" />{locale === "en" ? "Holdout" : "留出期"}</span><span><i className="anomaly" />{locale === "en" ? "Injected anomaly" : "注入异常"}</span></div></section>

      <div className="margin-decision-grid">
        <div className="margin-diagnosis"><div className="analytics-pane-heading"><span>{locale === "en" ? "Linked cost drivers" : "联动成本驱动"}</span><code>{selectedRows.some((row) => row.injected_anomaly) ? (locale === "en" ? "fixed-seed anomaly" : "固定 seed 异常") : (locale === "en" ? "comparison" : "对比态")}</code></div><div className="margin-driver-grid">{[[locale === "en" ? "Discounts" : "折扣", selected.discounts, selected.promo_depth], [locale === "en" ? "Returns" : "退货", selected.returns, selected.return_rate], [locale === "en" ? "Fulfillment" : "履约成本", selected.fulfillment, selected.fulfillment / Math.max(1, selected.gross_revenue)]].map(([label, value, ratio]) => <div key={String(label)}><span>{label}</span><strong>{money.format(Number(value))}</strong><i><b style={{ width: `${Math.min(100, Number(ratio) * 300)}%` }} /></i><small>{(Number(ratio) * 100).toFixed(1)}% {locale === "en" ? "of gross" : "占 gross"}</small></div>)}</div><div className="margin-root-cause"><TrendingDown aria-hidden="true" /><div><span>{selectedRows.some((row) => row.injected_anomaly) ? (locale === "en" ? "fixed-seed injected anomaly" : "固定 seed 注入异常") : (locale === "en" ? "deterministic comparison" : "确定性对比")}</span><strong>{selectedRows.some((row) => row.injected_anomaly) ? (locale === "en" ? "Promotion, returns, and fulfillment moved together" : "促销、退货与履约成本同时变动") : (locale === "en" ? "No injected anomaly in this slice" : "该切片没有注入异常")}</strong><p>{locale === "en" ? "Use the product view below to find the largest contributor; this is descriptive diagnosis, not causal proof." : "通过下方商品视图定位影响最大的项目；这是描述性诊断，不构成因果证明。"}</p></div></div><div className="margin-product-multiples">{products.map((product) => <div key={product.id}><span>{product.id} · {product.name}</span><i><b style={{ width: `${Math.max(3, Math.abs(product.total.contribution_margin) / Math.max(1, ...products.map((item) => Math.abs(item.total.contribution_margin))) * 100)}%` }} /></i><strong>{money.format(product.total.contribution_margin)}</strong></div>)}</div></div>
        <div className="margin-scenario"><div className="analytics-pane-heading"><span>{locale === "en" ? "Bounded action scenario" : "有边界行动情景"}</span><code>{locale === "en" ? "assumption, not forecast" : "假设，非预测"}</code></div><div className="margin-slider"><SlidersHorizontal aria-hidden="true" /><label><span>{locale === "en" ? "Promotion depth" : "促销深度"}</span><strong>{promoPercent}%</strong><input aria-label={locale === "en" ? "Promotion depth" : "促销深度"} type="range" min="4" max="30" value={promoPercent} onChange={(event) => setPromoPercent(Number(event.target.value))} /></label></div><p className="analytics-assumption">{locale === "en" ? "Assumption: each 1 percentage-point promotion change moves units by 0.8% in the same direction; return rate and unit economics stay fixed." : "假设：促销每变动 1 个百分点，销量同向变动 0.8%；退货率与单位经济保持不变。"}</p><div className="margin-before-after"><div><span>{locale === "en" ? "Before" : "调整前"}</span><strong>{money.format(selected.contribution_margin)}</strong><small>{integer.format(selected.units)} {locale === "en" ? "units" : "件"}</small></div><div><span>{locale === "en" ? "Scenario" : "情景结果"}</span><strong>{money.format(scenario.margin)}</strong><small>{integer.format(scenario.units)} {locale === "en" ? "units" : "件"}</small></div><div className={scenario.delta < 0 ? "negative" : "positive"}><span>Delta</span><strong>{scenario.delta >= 0 ? "+" : ""}{money.format(scenario.delta)}</strong><small>{(scenario.assumedUnitChange * 100).toFixed(1)}% {locale === "en" ? "assumed unit change" : "假设销量变化"}</small></div></div><div className="margin-holdout"><span>{locale === "en" ? "Synthetic holdout check" : "合成 holdout 检查"}</span>{holdout ? <><p>{holdout.week}: <strong>{money.format(holdout.total.contribution_margin)}</strong></p><p>{locale === "en" ? "Held-out synthetic observation; a comparison prompt, not causal validation." : "留出的合成观察，仅用于比较提示，不是因果验证。"}</p></> : <p>{locale === "en" ? "No later held-out week for this selection." : "当前选择没有更晚的 holdout 周。"}</p>}</div><div className="margin-action"><span>{locale === "en" ? "Action queue" : "行动队列"}</span><strong>{scenario.delta > 0.5 ? (locale === "en" ? "Test the lower-cost promotion setting; assign return and fulfillment checks before rollout." : "测试成本更低的促销设置；发布前安排退货与履约检查。") : (locale === "en" ? "Hold the change; scenario margin does not improve." : "暂停变更；情景毛利没有改善。")}</strong><code>{`SYN-ACTION-${week}-${category}-${promoPercent}`}</code></div></div>
      </div>

      <div className="analytics-contract-grid"><div><span>{locale === "en" ? "Contract status" : "契约状态"}</span><p className={allPass ? "pass" : "fail"}>{allPass ? <Check aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}{allPass ? (locale === "en" ? "All ten checks pass" : "十项检查全部通过") : (locale === "en" ? "Output is blocked" : "输出已阻断")}</p><p>{locale === "en" ? "No null dimension keys; no duplicate grain; accounting identities reconcile." : "维度键无空值、粒度无重复、会计恒等式对账一致。"}</p></div><div><span>{locale === "en" ? "Metric semantics" : "指标语义"}</span><code>gross → discounts → returns → net → COGS → fulfillment → contribution margin</code><p>{dataset.grain}</p><p>{dataset.license}</p></div></div>
      <footer className="analytics-lab-footer"><div><span>Seed / version</span><code>{dataset.seed} / {dataset.dataset_version}</code></div><div><span>Rows SHA-256</span><code>{dataset.rows_sha256}</code></div><div><ArtifactLink href={CONTRACT_URL}>{locale === "en" ? "Open contract" : "查看契约"}</ArtifactLink><ArtifactLink href={REGISTRY_URL}>{locale === "en" ? "Metric definitions" : "指标定义"}</ArtifactLink></div></footer>
    </section>
  );
}
