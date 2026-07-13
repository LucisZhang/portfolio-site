"use client";

import { Check, CircleAlert, ClipboardCheck, Database, Download, RotateCcw, Scale, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ArtifactLink from "@/components/ArtifactLink";
import { useI18n } from "@/lib/i18n";

const DATA_URL = "/case-studies/credit-policy-lab/synthetic-credit-data.json";
const CSV_URL = "/case-studies/credit-policy-lab/synthetic-credit-data.csv";
const PARQUET_URL = "/case-studies/credit-policy-lab/synthetic-credit-data.parquet";
const SAMPLE_URL = "/case-studies/credit-policy-lab/synthetic-credit-sample.csv";
const CONTRACT_URL = "/case-studies/credit-policy-lab/policy-contract.json";

type CreditRow = {
  application_id: string;
  loan_id: string | null;
  vintage: string;
  split: "train" | "calibration" | "backtest";
  utilization: number;
  late_payments: number;
  debt_to_income: number;
  bureau_age_months: number;
  income_band: string;
  audit_group: string;
  channel: string;
  raw_pd: number;
  calibrated_pd: number;
  challenger_pd: number;
  lgd: number;
  ead: number;
  observed_default: boolean;
  reason_codes: string[];
  provenance: string;
};

type CreditDataset = {
  dataset_version: string;
  seed: number;
  classification: string;
  license: string;
  grain: string;
  entity_boundary: string;
  model_boundary: string;
  date_range: { start: string; end: string };
  dimensions: { applications: number; loans: number; vintages: number; channels: number; income_bands: number; audit_groups: number; feature_count: number };
  splits: { train: number; calibration: number; backtest: number };
  assumptions: string[];
  rows_sha256: string;
  rows: CreditRow[];
};

type Decision = "approve" | "manual_review" | "decline";
type ExplorerTab = "sample" | "schema" | "quality";
type ModelMode = "baseline" | "challenger";

const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

function probability(row: CreditRow, mode: ModelMode) {
  return mode === "baseline" ? row.calibrated_pd : row.challenger_pd;
}

function decisionFor(pd: number, approve: number, review: number): Decision {
  if (pd <= approve) return "approve";
  if (pd <= review) return "manual_review";
  return "decline";
}

function brier(rows: CreditRow[], field: "raw_pd" | "calibrated_pd" | "challenger_pd") {
  return rows.reduce((sum, row) => sum + (row[field] - Number(row.observed_default)) ** 2, 0) / Math.max(1, rows.length);
}

function psi(reference: CreditRow[], current: CreditRow[]) {
  const bins = [0, 0.05, 0.1, 0.2, 0.35, 1.01];
  return bins.slice(0, -1).reduce((sum, lower, index) => {
    const upper = bins[index + 1];
    const expected = Math.max(0.0001, reference.filter((row) => row.calibrated_pd >= lower && row.calibrated_pd < upper).length / Math.max(1, reference.length));
    const actual = Math.max(0.0001, current.filter((row) => row.calibrated_pd >= lower && row.calibrated_pd < upper).length / Math.max(1, current.length));
    return sum + (actual - expected) * Math.log(actual / expected);
  }, 0);
}

function qualityChecks(rows: CreditRow[], approve: number, review: number) {
  const ids = rows.map((row) => row.application_id);
  return [
    ["application ID unique", new Set(ids).size === ids.length],
    ["entity grain and split present", rows.every((row) => row.application_id && row.vintage && ["train", "calibration", "backtest"].includes(row.split))],
    ["probabilities bounded", rows.every((row) => [row.raw_pd, row.calibrated_pd, row.challenger_pd].every((value) => value >= 0 && value <= 1))],
    ["LGD bounded and EAD positive", rows.every((row) => row.lgd >= 0 && row.lgd <= 1 && row.ead > 0)],
    ["threshold order valid", approve < review],
    ["decision bands exhaustive", rows.every((row) => ["approve", "manual_review", "decline"].includes(decisionFor(row.calibrated_pd, approve, review)))],
    ["observed synthetic outcome present", rows.every((row) => typeof row.observed_default === "boolean")],
    ["reason codes populated", rows.every((row) => row.reason_codes.length > 0)],
    ["expected loss non-negative", rows.every((row) => row.calibrated_pd * row.lgd * row.ead >= 0)],
    ["synthetic provenance", rows.every((row) => row.provenance === "synthetic")],
  ] as const;
}

export default function CreditPolicyLab() {
  const { locale } = useI18n();
  const [dataset, setDataset] = useState<CreditDataset | null>(null);
  const [vintage, setVintage] = useState("2030-06");
  const [approveThreshold, setApproveThreshold] = useState(12);
  const [reviewThreshold, setReviewThreshold] = useState(28);
  const [capacity, setCapacity] = useState(180);
  const [modelMode, setModelMode] = useState<ModelMode>("baseline");
  const [selectedId, setSelectedId] = useState("");
  const [audit, setAudit] = useState("");
  const [explorerTab, setExplorerTab] = useState<ExplorerTab>("sample");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    fetch(DATA_URL).then((response) => {
      if (!response.ok) throw new Error(`Credit dataset returned ${response.status}`);
      return response.json() as Promise<CreditDataset>;
    }).then((next) => {
      if (!active) return;
      setDataset(next);
      const finalVintage = next.date_range.end;
      setVintage(finalVintage);
      setSelectedId(next.rows.find((row) => row.vintage === finalVintage)?.application_id ?? next.rows[0]?.application_id ?? "");
    }).catch((reason: unknown) => { if (active) setLoadError(reason instanceof Error ? reason.message : "Dataset unavailable."); });
    return () => { active = false; };
  }, []);

  const approve = approveThreshold / 100;
  const review = reviewThreshold / 100;
  const vintageRows = useMemo(() => dataset?.rows.filter((row) => row.vintage === vintage) ?? [], [dataset, vintage]);
  const decisions = useMemo(() => vintageRows.map((row) => {
    const pd = probability(row, modelMode);
    return { row, pd, decision: decisionFor(pd, approve, review), expectedLoss: pd * row.lgd * row.ead };
  }), [approve, modelMode, review, vintageRows]);
  const counts = useMemo(() => ({ approve: decisions.filter((item) => item.decision === "approve").length, review: decisions.filter((item) => item.decision === "manual_review").length, decline: decisions.filter((item) => item.decision === "decline").length }), [decisions]);
  const approvedExpectedLoss = decisions.filter((item) => item.decision === "approve").reduce((sum, item) => sum + item.expectedLoss, 0);
  const policyCost = decisions.reduce((sum, item) => sum + (item.decision === "approve" ? item.expectedLoss : item.decision === "manual_review" ? 35 + item.expectedLoss * 0.45 : item.row.ead * 0.018), 0);
  const selected = dataset?.rows.find((row) => row.application_id === selectedId) ?? vintageRows[0] ?? null;
  const checks = dataset ? qualityChecks(dataset.rows, approve, review) : [];
  const allPass = checks.every(([, pass]) => pass);
  const firstVintage = dataset?.rows.filter((row) => row.vintage === dataset.date_range.start) ?? [];
  const lastVintage = dataset?.rows.filter((row) => row.vintage === dataset.date_range.end) ?? [];
  const psiValue = firstVintage.length && lastVintage.length ? psi(firstVintage, lastVintage) : 0;
  const backtestRows = useMemo(() => dataset?.rows.filter((row) => row.split === "backtest") ?? [], [dataset]);
  const rawBrier = brier(backtestRows, "raw_pd");
  const calibratedBrier = brier(backtestRows, "calibrated_pd");
  const challengerBrier = brier(backtestRows, "challenger_pd");
  const calibrationBins = useMemo(() => Array.from({ length: 10 }, (_, index) => {
    const lower = index / 10;
    const upper = (index + 1) / 10;
    const rows = backtestRows.filter((row) => probability(row, modelMode) >= lower && probability(row, modelMode) < upper);
    return { label: `${index * 10}-${(index + 1) * 10}%`, count: rows.length, predicted: rows.length ? rows.reduce((sum, row) => sum + probability(row, modelMode), 0) / rows.length : 0, observed: rows.length ? rows.filter((row) => row.observed_default).length / rows.length : 0 };
  }), [backtestRows, modelMode]);
  const frontier = useMemo(() => [6, 10, 14, 18, 22, 26, 30].map((threshold) => {
    const approved = vintageRows.filter((row) => probability(row, modelMode) <= threshold / 100);
    return { threshold, approvalRate: approved.length / Math.max(1, vintageRows.length), expectedLoss: approved.reduce((sum, row) => sum + probability(row, modelMode) * row.lgd * row.ead, 0) };
  }), [modelMode, vintageRows]);
  const vintageStats = useMemo(() => {
    if (!dataset) return [];
    return [...new Set(dataset.rows.map((row) => row.vintage))].map((value) => {
      const rows = dataset.rows.filter((row) => row.vintage === value);
      return { vintage: value, defaultRate: rows.filter((row) => row.observed_default).length / rows.length, meanPd: rows.reduce((sum, row) => sum + probability(row, modelMode), 0) / rows.length, split: rows[0].split };
    });
  }, [dataset, modelMode]);
  const riskBands = useMemo(() => [["0-5%", 0, .05], ["5-10%", .05, .1], ["10-20%", .1, .2], ["20-35%", .2, .35], ["35%+", .35, 1.01]].map(([label, lower, upper]) => ({ label: String(label), count: vintageRows.filter((row) => probability(row, modelMode) >= Number(lower) && probability(row, modelMode) < Number(upper)).length })), [modelMode, vintageRows]);
  const reasonCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of decisions) for (const code of item.row.reason_codes) counts.set(code, (counts.get(code) ?? 0) + 1);
    return [...counts].sort((left, right) => right[1] - left[1]).slice(0, 6);
  }, [decisions]);

  if (loadError) return <div className="analytics-lab-loading error"><CircleAlert aria-hidden="true" />{loadError}</div>;
  if (!dataset || !selected) return <div className="analytics-lab-loading" aria-live="polite">{locale === "en" ? "Loading synthetic credit portfolio..." : "正在载入合成信贷组合……"}</div>;

  const selectedPd = probability(selected, modelMode);
  const selectedDecision = decisionFor(selectedPd, approve, review);
  const groupStats = ["Synthetic group A", "Synthetic group B", "Synthetic group C"].map((group) => {
    const items = decisions.filter((item) => item.row.audit_group === group);
    return { group, count: items.length, approvalRate: items.length ? items.filter((item) => item.decision === "approve").length / items.length : 0 };
  });
  const maxRiskBand = Math.max(1, ...riskBands.map((item) => item.count));
  const reviewQueue = decisions.filter((item) => item.decision === "manual_review").sort((left, right) => right.expectedLoss - left.expectedLoss).slice(0, 8);
  const sampleRows = vintageRows.slice(0, 6);
  const schemaFields = Object.keys(dataset.rows[0] ?? {});
  const reset = () => { setApproveThreshold(12); setReviewThreshold(28); setCapacity(180); setVintage(dataset.date_range.end); setModelMode("baseline"); setAudit(""); setSelectedId(dataset.rows.find((row) => row.vintage === dataset.date_range.end)?.application_id ?? ""); };

  return (
    <section className="analytics-lab credit-lab" data-testid="credit-policy-lab" aria-labelledby="credit-lab-title">
      <header className="analytics-lab-header"><div><p className="eyebrow">{locale === "en" ? "Synthetic portfolio / deterministic policy engine" : "合成投资组合 / 确定性策略引擎"}</p><h3 id="credit-lab-title">Credit Policy Lab</h3><p>{locale === "en" ? "Move from a synthetic score to calibrated probability, expected loss, policy thresholds, a capacity-limited review queue, and an audit record." : "从合成分数出发，依次经过概率校准、预期损失、策略阈值、受容量限制的人工队列，最终生成审计记录。"}</p></div><div className="analytics-boundary"><ShieldCheck aria-hidden="true" /><strong>{locale === "en" ? "No real applicant and no recovered production model" : "无真实申请人，也无恢复的生产模型"}</strong><span>{locale === "en" ? "All identities, scores, loans, and outcomes are deterministic synthetic backtest inputs." : "所有身份、分数、贷款和结果都是确定性合成回测输入。"}</span></div></header>

      <section className="analytics-dataset-context" aria-label={locale === "en" ? "Dataset context" : "数据集说明"}><div className="analytics-context-title"><Database aria-hidden="true" /><div><span>{locale === "en" ? "Dataset and decision context" : "数据集与决策背景"}</span><strong>Credit Synthetic v2</strong><code>{dataset.dataset_version}</code></div></div><dl><div><dt>{locale === "en" ? "Portfolio" : "组合规模"}</dt><dd>{number.format(dataset.dimensions.applications)} applications · {number.format(dataset.dimensions.loans)} loans</dd></div><div><dt>Vintages</dt><dd>{dataset.dimensions.vintages} · {dataset.date_range.start} → {dataset.date_range.end}</dd></div><div><dt>{locale === "en" ? "Splits" : "数据划分"}</dt><dd>{number.format(dataset.splits.train)} train · {number.format(dataset.splits.calibration)} calibration · {number.format(dataset.splits.backtest)} backtest</dd></div><div><dt>{locale === "en" ? "Dimensions" : "维度"}</dt><dd>{dataset.dimensions.channels} channels · {dataset.dimensions.income_bands} income bands · {dataset.dimensions.audit_groups} audit groups</dd></div><div><dt>{locale === "en" ? "Features" : "特征"}</dt><dd>{dataset.dimensions.feature_count} {locale === "en" ? "generated decision features" : "个生成的决策特征"}</dd></div><div><dt>{locale === "en" ? "Observed outcome" : "观察结果"}</dt><dd>{(dataset.rows.filter((row) => row.observed_default).length / dataset.rows.length * 100).toFixed(1)}% {locale === "en" ? "synthetic default rate" : "合成违约率"}</dd></div></dl><p>{locale === "en" ? "Applicant, application, booked loan, observed outcome, model score, and policy decision are separate fields and stages." : "申请人概念、application、已入账 loan、观察结果、模型分数与策略决策均为独立字段和阶段。"}</p><div className="analytics-download-row"><ArtifactLink href={DATA_URL}>{locale === "en" ? "Explore full JSON" : "浏览完整 JSON"}</ArtifactLink><a href={CSV_URL} download><Download aria-hidden="true" />{locale === "en" ? "Download full CSV" : "下载完整 CSV"}</a><a href={PARQUET_URL} download><Download aria-hidden="true" />{locale === "en" ? "Download Parquet" : "下载 Parquet"}</a><ArtifactLink href={SAMPLE_URL}>{locale === "en" ? "Browse CSV sample" : "浏览 CSV 样本"}</ArtifactLink><span>{locale === "en" ? "Generator source: publication pending" : "生成器源码：等待发布"}</span></div></section>

      <section className="analytics-explorer" aria-label={locale === "en" ? "Dataset explorer" : "数据集浏览器"}><div className="analytics-explorer-tabs" role="tablist">{(["sample", "schema", "quality"] as ExplorerTab[]).map((tab) => <button key={tab} type="button" role="tab" aria-selected={explorerTab === tab} onClick={() => setExplorerTab(tab)}>{tab === "sample" ? (locale === "en" ? "Sample applications" : "申请样本") : tab === "schema" ? (locale === "en" ? "Schema and dictionary" : "Schema 与字段说明") : (locale === "en" ? "Quality checks" : "质量检查")}</button>)}</div>{explorerTab === "sample" ? <div className="analytics-sample-table"><table><thead><tr><th>{locale === "en" ? "application" : "申请"}</th><th>{locale === "en" ? "loan" : "贷款"}</th><th>{locale === "en" ? "channel" : "渠道"}</th><th>{locale === "en" ? "split" : "数据划分"}</th><th>PD</th><th>{locale === "en" ? "outcome" : "结果"}</th></tr></thead><tbody>{sampleRows.map((row) => <tr key={row.application_id}><td>{row.application_id}</td><td>{row.loan_id ?? (locale === "en" ? "not booked" : "未入账")}</td><td>{row.channel}</td><td>{row.split}</td><td>{(probability(row, modelMode) * 100).toFixed(1)}%</td><td>{row.observed_default ? (locale === "en" ? "default" : "违约") : (locale === "en" ? "no default" : "未违约")}</td></tr>)}</tbody></table></div> : null}{explorerTab === "schema" ? <div className="analytics-field-grid">{schemaFields.map((field) => <div key={field}><code>{field}</code><span>{field.endsWith("_pd") ? (locale === "en" ? "synthetic probability" : "合成概率") : field === "observed_default" ? (locale === "en" ? "generated outcome" : "生成的观察结果") : field.endsWith("_id") ? (locale === "en" ? "synthetic identifier" : "合成标识符") : (locale === "en" ? "feature, dimension, or policy input" : "特征、维度或策略输入")}</span></div>)}</div> : null}{explorerTab === "quality" ? <div className="analytics-quality-list">{checks.map(([name, pass]) => <p key={name} className={pass ? "pass" : "fail"}>{pass ? <Check aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}{name}</p>)}</div> : null}</section>

      <div className="credit-layer-strip"><div><span>01</span><strong>{locale === "en" ? "Raw score" : "原始分数"}</strong><p>{locale === "en" ? "raw PD" : "原始 PD"}</p></div><div><span>02</span><strong>{locale === "en" ? "Calibrated probability" : "校准概率"}</strong><p>{locale === "en" ? "baseline / challenger" : "baseline / challenger 对比"}</p></div><div><span>03</span><strong>{locale === "en" ? "Expected loss" : "预期损失"}</strong><p>PD × LGD × EAD</p></div><div><span>04</span><strong>{locale === "en" ? "Policy and human queue" : "策略与人工队列"}</strong><p>{locale === "en" ? "approve / review / decline" : "批准 / 复核 / 拒绝"}</p></div><div><span>05</span><strong>{locale === "en" ? "Audit record" : "审计记录"}</strong><p>{locale === "en" ? "thresholds / capacity / outcome" : "阈值 / 容量 / 结果"}</p></div></div><p className="credit-decision-boundary">{locale === "en" ? "Model probability is not the final business decision." : "模型给出的风险概率，并不等同于最终审批结果。最终决策还要经过成本、策略阈值和人工复核。"}</p>

      <div className="credit-model-tabs" role="tablist" aria-label={locale === "en" ? "Policy model" : "策略模型"}>{(["baseline", "challenger"] as ModelMode[]).map((mode) => <button key={mode} type="button" role="tab" aria-selected={modelMode === mode} onClick={() => { setModelMode(mode); setAudit(""); }}>{mode === "baseline" ? (locale === "en" ? "Baseline calibrated PD" : "Baseline 校准 PD") : (locale === "en" ? "Challenger synthetic PD" : "Challenger 合成 PD")}</button>)}</div>
      <div className="credit-policy-controls"><label><span>{locale === "en" ? "Approve <=" : "批准 <="}</span><strong>{approveThreshold}%</strong><input aria-label={locale === "en" ? "Approve threshold" : "批准阈值"} type="range" min="4" max="24" value={approveThreshold} onChange={(event) => { setApproveThreshold(Math.min(Number(event.target.value), reviewThreshold - 2)); setAudit(""); }} /></label><label><span>{locale === "en" ? "Review <=" : "复核 <="}</span><strong>{reviewThreshold}%</strong><input aria-label={locale === "en" ? "Review threshold" : "复核阈值"} type="range" min="10" max="50" value={reviewThreshold} onChange={(event) => { setReviewThreshold(Math.max(Number(event.target.value), approveThreshold + 2)); setAudit(""); }} /></label><label><span>{locale === "en" ? "Analyst capacity" : "分析师容量"}</span><strong>{capacity}</strong><input aria-label={locale === "en" ? "Review capacity" : "复核容量"} type="range" min="40" max="360" step="10" value={capacity} onChange={(event) => { setCapacity(Number(event.target.value)); setAudit(""); }} /></label><button type="button" onClick={reset}><RotateCcw aria-hidden="true" />{locale === "en" ? "Reset" : "重置"}</button></div>

      <div className="credit-policy-grid"><div className="credit-policy-summary"><div className="analytics-pane-heading"><span>{locale === "en" ? "Policy simulation" : "策略模拟"}</span><select aria-label={locale === "en" ? "Backtest vintage" : "回测 vintage"} value={vintage} onChange={(event) => { setVintage(event.target.value); setSelectedId(dataset.rows.find((row) => row.vintage === event.target.value)?.application_id ?? ""); setAudit(""); }}>{[...new Set(dataset.rows.map((row) => row.vintage))].map((value) => <option key={value}>{value}</option>)}</select></div><div className="credit-decision-bands"><div className="approve"><span>{locale === "en" ? "Approve" : "批准"}</span><strong>{counts.approve}</strong><p>{(counts.approve / vintageRows.length * 100).toFixed(1)}%</p></div><div className="review"><span>{locale === "en" ? "Manual review" : "人工复核"}</span><strong>{counts.review}</strong><p className={counts.review > capacity ? "overflow" : ""}>{counts.review > capacity ? `${counts.review - capacity} ${locale === "en" ? "over capacity" : "超出容量"}` : (locale === "en" ? "within capacity" : "容量内")}</p></div><div className="decline"><span>{locale === "en" ? "Decline" : "拒绝"}</span><strong>{counts.decline}</strong><p>{(counts.decline / vintageRows.length * 100).toFixed(1)}%</p></div></div><div className="credit-economics"><div><span>{locale === "en" ? "Approved expected loss" : "批准预期损失"}</span><strong>{number.format(approvedExpectedLoss)}</strong></div><div><span>{locale === "en" ? "Policy cost surface" : "策略成本曲面"}</span><strong>{number.format(policyCost)}</strong></div><p>{locale === "en" ? "Synthetic currency. Review cost = 35 + 45% of EL; decline opportunity cost = 1.8% of EAD." : "合成货币。复核成本 = 35 + 45% EL；拒绝机会成本 = EAD 的 1.8%。"}</p></div><button className="credit-publish-policy" type="button" disabled={!allPass || counts.review > capacity} onClick={() => setAudit(`SYN-POLICY-${vintage}-${modelMode}-${approveThreshold}-${reviewThreshold}-${capacity}`)}><ClipboardCheck aria-hidden="true" />{counts.review > capacity ? (locale === "en" ? "Resolve queue overflow" : "先解决队列溢出") : (locale === "en" ? "Record policy decision" : "记录策略决策")}</button>{audit && <div className="credit-audit-record"><Check aria-hidden="true" /><div><span>{locale === "en" ? "Synthetic audit record" : "合成审计记录"}</span><strong>{audit}</strong><p>{counts.approve}/{counts.review}/{counts.decline} · EL {number.format(approvedExpectedLoss)}</p></div></div>}</div>
        <div className="credit-application-review"><div className="analytics-pane-heading"><span>{locale === "en" ? "Application review" : "申请复核"}</span><select aria-label={locale === "en" ? "Synthetic application" : "合成申请"} value={selected.application_id} onChange={(event) => setSelectedId(event.target.value)}>{vintageRows.map((row) => <option key={row.application_id}>{row.application_id}</option>)}</select></div><div className="credit-score-chain"><div><span>{locale === "en" ? "Raw synthetic PD" : "原始合成 PD"}</span><strong>{(selected.raw_pd * 100).toFixed(1)}%</strong></div><div><span>{modelMode === "baseline" ? (locale === "en" ? "Calibrated PD" : "校准 PD") : (locale === "en" ? "Challenger PD" : "Challenger PD")}</span><strong>{(selectedPd * 100).toFixed(1)}%</strong></div><div><span>{locale === "en" ? "Expected loss" : "预期损失"}</span><strong>{number.format(selectedPd * selected.lgd * selected.ead)}</strong><code>PD × {selected.lgd.toFixed(2)} LGD × {number.format(selected.ead)} EAD</code></div><div className={`decision ${selectedDecision}`}><span>{locale === "en" ? "Policy decision" : "策略决策"}</span><strong>{selectedDecision.replace("_", " ")}</strong></div></div><div className="credit-entity-ledger"><div><span>Application</span><code>{selected.application_id}</code></div><div><span>Loan</span><code>{selected.loan_id ?? (locale === "en" ? "not booked in synthetic observed book" : "未进入合成观察账簿")}</code></div><div><span>{locale === "en" ? "Observed outcome" : "观察结果"}</span><strong>{selected.observed_default ? (locale === "en" ? "synthetic default" : "合成违约") : (locale === "en" ? "synthetic no default" : "合成未违约")}</strong></div></div><div className="credit-reason-codes"><span>{locale === "en" ? "Deterministic reason codes" : "确定性原因码"}</span>{selected.reason_codes.map((reason) => <code key={reason}>{reason}</code>)}</div></div></div>

      <div className="credit-chart-grid"><section className="credit-calibration"><div className="analytics-pane-heading"><span>{locale === "en" ? "Calibration curve" : "校准曲线"}</span><code>{modelMode} · backtest</code></div><div>{calibrationBins.map((bin) => <div key={bin.label} title={`${bin.label}; n=${bin.count}; predicted=${(bin.predicted * 100).toFixed(1)}%; observed=${(bin.observed * 100).toFixed(1)}%`}><span>{bin.label}</span><i className="predicted" style={{ height: `${Math.max(2, bin.predicted * 100)}%` }} /><i className="observed" style={{ height: `${Math.max(2, bin.observed * 100)}%` }} /><small>{bin.count}</small></div>)}</div><p><span><i className="predicted" />{locale === "en" ? "Predicted" : "预测"}</span><span><i className="observed" />{locale === "en" ? "Observed synthetic outcome" : "合成观察结果"}</span></p></section><section className="credit-frontier"><div className="analytics-pane-heading"><span>{locale === "en" ? "Approval vs expected-loss frontier" : "批准率与预期损失前沿"}</span><code>{vintage}</code></div>{frontier.map((point) => <button type="button" key={point.threshold} className={point.threshold === approveThreshold ? "active" : ""} onClick={() => { setApproveThreshold(Math.min(point.threshold, reviewThreshold - 2)); setAudit(""); }}><span>{point.threshold}%</span><i><b style={{ width: `${point.approvalRate * 100}%` }} /></i><strong>{(point.approvalRate * 100).toFixed(1)}%</strong><small>EL {number.format(point.expectedLoss)}</small></button>)}</section></div>

      <div className="credit-chart-grid"><section className="credit-risk-bands"><div className="analytics-pane-heading"><span>{locale === "en" ? "Risk-band distribution" : "风险带分布"}</span><code>{vintage}</code></div>{riskBands.map((band) => <div key={band.label}><span>{band.label}</span><i><b style={{ width: `${band.count / maxRiskBand * 100}%` }} /></i><strong>{band.count}</strong></div>)}</section><section className="credit-vintages"><div className="analytics-pane-heading"><span>{locale === "en" ? "Vintage performance and drift" : "Vintage 表现与漂移"}</span><code>mean PD / observed</code></div><div>{vintageStats.map((item) => <button type="button" className={item.vintage === vintage ? "active" : ""} title={`${item.vintage}: PD ${(item.meanPd * 100).toFixed(1)}%; observed ${(item.defaultRate * 100).toFixed(1)}%`} key={item.vintage} onClick={() => setVintage(item.vintage)}><i style={{ height: `${Math.max(5, item.meanPd * 180)}%` }} /><b style={{ height: `${Math.max(5, item.defaultRate * 180)}%` }} /><span>{item.vintage.slice(2)}</span><small>{item.split.slice(0, 1).toUpperCase()}</small></button>)}</div></section></div>

      <div className="credit-monitor-grid"><div><span>{locale === "en" ? "Backtest score comparison" : "回测分数比较"}</span><p><strong>{rawBrier.toFixed(4)}</strong>{locale === "en" ? " raw Brier" : " 原始 Brier"}</p><p><strong>{calibratedBrier.toFixed(4)}</strong> baseline</p><p><strong>{challengerBrier.toFixed(4)}</strong> challenger</p><small>{locale === "en" ? "Fixed synthetic backtest only; not real model validation." : "仅适用于固定合成回测；不是真实模型验证。"}</small></div><div className={psiValue >= 0.1 ? "alert" : ""}><span>{locale === "en" ? "Vintage score drift" : "Vintage 分数漂移"}</span><p><strong>{psiValue.toFixed(3)}</strong> PSI</p><small>{dataset.date_range.start} vs {dataset.date_range.end}; {locale === "en" ? "synthetic alert threshold 0.10" : "合成告警阈值 0.10"}.</small></div><div><span>{locale === "en" ? "Descriptive audit slices" : "描述性审计切片"}</span>{groupStats.map((item) => <p key={item.group}><strong>{(item.approvalRate * 100).toFixed(1)}%</strong> {item.group} ({item.count})</p>)}<small>{locale === "en" ? "Synthetic groups; no fairness or compliance conclusion." : "合成群组；不作公平性或合规结论。"}</small></div></div>

      <div className="credit-queue-grid"><section><div className="analytics-pane-heading"><span>{locale === "en" ? "Manual review queue" : "人工复核队列"}</span><code>{counts.review} / {capacity}</code></div>{reviewQueue.map((item, index) => <button type="button" key={item.row.application_id} onClick={() => setSelectedId(item.row.application_id)}><span>{String(index + 1).padStart(2, "0")}</span><code>{item.row.application_id}</code><strong>{(item.pd * 100).toFixed(1)}%</strong><small>EL {number.format(item.expectedLoss)}</small></button>)}</section><section><div className="analytics-pane-heading"><span>{locale === "en" ? "Reason-code mix" : "原因码分布"}</span><code>{vintage}</code></div>{reasonCounts.map(([reason, count]) => <div key={reason}><code>{reason}</code><i><b style={{ width: `${count / Math.max(1, reasonCounts[0]?.[1] ?? 1) * 100}%` }} /></i><strong>{count}</strong></div>)}</section></div>

      <div className="analytics-contract-grid"><div><span>{locale === "en" ? "Policy contract" : "策略契约"}</span><p className={allPass ? "pass" : "fail"}>{allPass ? <Check aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}{allPass ? (locale === "en" ? "All ten checks pass" : "十项检查全部通过") : (locale === "en" ? "Policy output blocked" : "策略输出已阻断")}</p><p>{locale === "en" ? "Application grain, thresholds, probabilities, outcomes, reason codes, and entity boundaries are checked." : "已检查 application 粒度、阈值、概率、结果、原因码和实体边界。"}</p></div><div><span>{locale === "en" ? "Governance boundary" : "治理边界"}</span><p><Scale aria-hidden="true" />{locale === "en" ? "Prediction, calibration, economics, policy, human review, and audit remain separate stages." : "预测、校准、经济、策略、人工复核和审计保持为独立阶段。"}</p><p><CircleAlert aria-hidden="true" />{locale === "en" ? "No regulatory, real-world fairness, or production accuracy claim." : "不声明监管合规、真实世界公平性或生产准确率。"}</p></div></div>
      <footer className="analytics-lab-footer"><div><span>Seed / version</span><code>{dataset.seed} / {dataset.dataset_version}</code></div><div><span>Rows SHA-256</span><code>{dataset.rows_sha256}</code></div><div><ArtifactLink href={CONTRACT_URL}>{locale === "en" ? "Open policy contract" : "查看策略契约"}</ArtifactLink></div></footer>
    </section>
  );
}
