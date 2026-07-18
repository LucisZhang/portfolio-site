"use client";

import { Check, CircleAlert, ClipboardCheck, Database, Download, RotateCcw, Scale, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ArtifactLink from "@/components/ArtifactLink";
import SwapSetPanel from "@/components/analytics/SwapSetPanel";
import { useI18n } from "@/lib/i18n";
import styles from "./AnalyticsUpgrade.module.css";

const DATA_URL = "/case-studies/credit-policy-lab/synthetic-credit-data.json";
const CSV_URL = "/case-studies/credit-policy-lab/synthetic-credit-data.csv";
const PARQUET_URL = "/case-studies/credit-policy-lab/synthetic-credit-data.parquet";
const SAMPLE_URL = "/case-studies/credit-policy-lab/synthetic-credit-sample.csv";
const CONTRACT_URL = "/case-studies/credit-policy-lab/policy-contract.json";
const REAL_PARQUET_URL = "/case-studies/credit-policy-lab/scored-backtest.parquet";
const PUBLIC_FIXTURE_GENERATOR_URL = "https://github.com/LucisZhang/portfolio-site/blob/codex/portfolio-phase2/scripts/generate-analytics-fixtures.mjs";

type DatasetSource = "synthetic" | "real";
type RealArtifactStatus = "idle" | "loading" | "loaded" | "pending" | "invalid";

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
  source: DatasetSource;
  dataset_version: string;
  seed: number | null;
  classification: string;
  license: string;
  grain: string;
  entity_boundary: string;
  model_boundary: string;
  date_range: { start: string; end: string };
  dimensions: { applications: number; loans: number; vintages: number; channels: number; income_bands: number; audit_groups: number; feature_count: number };
  splits: { train: number; calibration: number; backtest: number };
  assumptions: string[];
  rows_sha256: string | null;
  rows: CreditRow[];
};

type Decision = "approve" | "manual_review" | "decline";
type ExplorerTab = "sample" | "schema" | "quality";
type ModelMode = "baseline" | "challenger";
type QualityCheckKey = "application_id_unique" | "entity_grain_and_split_present" | "probabilities_bounded" | "lgd_bounded_and_ead_positive" | "threshold_order_valid" | "decision_bands_exhaustive" | "observed_outcome_present" | "reason_codes_populated" | "expected_loss_non_negative" | "source_provenance_valid";

const DECISION_LABELS: Record<Decision, { en: string; zh: string }> = {
  approve: { en: "Approve", zh: "批准" },
  manual_review: { en: "Manual review", zh: "人工复核" },
  decline: { en: "Decline", zh: "拒绝" },
};

const QUALITY_CHECK_LABELS: Record<QualityCheckKey, { en: string; zh: string }> = {
  application_id_unique: { en: "Application ID unique", zh: "申请 ID 唯一" },
  entity_grain_and_split_present: { en: "Entity grain and split present", zh: "实体粒度与数据划分完整" },
  probabilities_bounded: { en: "Probabilities bounded", zh: "概率在有效范围内" },
  lgd_bounded_and_ead_positive: { en: "LGD bounded and EAD positive", zh: "LGD 在有效范围内且 EAD 为正" },
  threshold_order_valid: { en: "Threshold order valid", zh: "阈值顺序有效" },
  decision_bands_exhaustive: { en: "Decision bands exhaustive", zh: "决策区间完整覆盖" },
  observed_outcome_present: { en: "Observed outcome present", zh: "观察结果完整" },
  reason_codes_populated: { en: "Reason codes populated", zh: "原因码完整" },
  expected_loss_non_negative: { en: "Expected loss non-negative", zh: "预期损失非负" },
  source_provenance_valid: { en: "Source provenance valid", zh: "来源溯源有效" },
};

const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const DIRECTIONAL_REASON_CODE = /^[A-Z0-9_]+_(?:INCREASES_PD|DECREASES_PD|NEUTRAL)$/;

function requiredText(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`Scored backtest is missing ${field}.`);
  return value;
}

function requiredNumber(value: unknown, field: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`Scored backtest has an invalid ${field}.`);
  return parsed;
}

function booleanValue(value: unknown) {
  if (value === true || value === 1 || value === "1" || value === "true") return true;
  if (value === false || value === 0 || value === "0" || value === "false") return false;
  throw new Error("Scored backtest has an invalid observed_default value.");
}

function reasonCodes(value: unknown, index: number) {
  const parsed: unknown = typeof value === "string" ? (() => {
    try { return JSON.parse(value) as unknown; } catch { return null; }
  })() : value;
  if (
    !Array.isArray(parsed)
    || parsed.length !== 3
    || !parsed.every((item) => typeof item === "string" && DIRECTIONAL_REASON_CODE.test(item))
    || new Set(parsed).size !== 3
  ) {
    throw new Error(`Scored backtest has invalid reason_codes at row ${index}.`);
  }
  return parsed;
}

function buildRealCreditDataset(rawRows: Record<string, unknown>[]): CreditDataset {
  if (!rawRows.length) throw new Error("Scored backtest contains no rows.");
  const rows = rawRows.map((raw, index): CreditRow => {
    const splitValue = requiredText(raw.split, `split at row ${index}`);
    if (!(["train", "calibration", "backtest"] as string[]).includes(splitValue)) throw new Error(`Scored backtest has an invalid split at row ${index}.`);
    return {
      application_id: requiredText(raw.application_id, `application_id at row ${index}`),
      loan_id: raw.loan_id == null ? null : requiredText(raw.loan_id, `loan_id at row ${index}`),
      vintage: requiredText(raw.vintage, `vintage at row ${index}`),
      split: splitValue as CreditRow["split"],
      utilization: requiredNumber(raw.utilization, `utilization at row ${index}`),
      late_payments: requiredNumber(raw.late_payments, `late_payments at row ${index}`),
      debt_to_income: requiredNumber(raw.debt_to_income, `debt_to_income at row ${index}`),
      bureau_age_months: requiredNumber(raw.bureau_age_months, `bureau_age_months at row ${index}`),
      income_band: requiredText(raw.income_band, `income_band at row ${index}`),
      audit_group: requiredText(raw.audit_group, `audit_group at row ${index}`),
      channel: requiredText(raw.channel, `channel at row ${index}`),
      raw_pd: requiredNumber(raw.raw_pd, `raw_pd at row ${index}`),
      calibrated_pd: requiredNumber(raw.calibrated_pd, `calibrated_pd at row ${index}`),
      challenger_pd: requiredNumber(raw.challenger_pd, `challenger_pd at row ${index}`),
      lgd: requiredNumber(raw.lgd, `lgd at row ${index}`),
      ead: requiredNumber(raw.ead, `ead at row ${index}`),
      observed_default: booleanValue(raw.observed_default),
      reason_codes: reasonCodes(raw.reason_codes, index),
      provenance: requiredText(raw.provenance, `provenance at row ${index}`),
    };
  });
  const vintages = [...new Set(rows.map((row) => row.vintage))].sort();
  const splitCount = (split: CreditRow["split"]) => rows.filter((row) => row.split === split).length;
  return {
    source: "real",
    dataset_version: "scored-backtest-parquet-v1",
    seed: null,
    classification: "offline real-data backtest artifact",
    license: "Artifact metadata and upstream terms must accompany the offline pipeline output.",
    grain: "one row per application",
    entity_boundary: "application, optional booked loan, observed outcome, score, and policy decision remain separate",
    model_boundary: "offline scored backtest only; no model executes in the browser",
    date_range: { start: vintages[0], end: vintages.at(-1)! },
    dimensions: {
      applications: rows.length,
      loans: rows.filter((row) => row.loan_id).length,
      vintages: vintages.length,
      channels: new Set(rows.map((row) => row.channel)).size,
      income_bands: new Set(rows.map((row) => row.income_band)).size,
      audit_groups: new Set(rows.map((row) => row.audit_group)).size,
      feature_count: 9,
    },
    splits: { train: splitCount("train"), calibration: splitCount("calibration"), backtest: splitCount("backtest") },
    assumptions: ["The browser applies policy thresholds to offline scores and does not retrain a model."],
    rows_sha256: null,
    rows,
  };
}

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

function qualityChecks(rows: CreditRow[], approve: number, review: number, source: DatasetSource) {
  const ids = rows.map((row) => row.application_id);
  const splits = new Set(rows.map((row) => row.split));
  return [
    { key: "application_id_unique", pass: new Set(ids).size === ids.length },
    { key: "entity_grain_and_split_present", pass: rows.every((row) => row.application_id && row.vintage && ["train", "calibration", "backtest"].includes(row.split)) && (source === "synthetic" || ["train", "calibration", "backtest"].every((split) => splits.has(split as CreditRow["split"]))) },
    { key: "probabilities_bounded", pass: rows.every((row) => [row.raw_pd, row.calibrated_pd, row.challenger_pd].every((value) => value >= 0 && value <= 1)) },
    { key: "lgd_bounded_and_ead_positive", pass: rows.every((row) => row.lgd >= 0 && row.lgd <= 1 && row.ead > 0) },
    { key: "threshold_order_valid", pass: approve < review },
    { key: "decision_bands_exhaustive", pass: rows.every((row) => ["approve", "manual_review", "decline"].includes(decisionFor(row.calibrated_pd, approve, review))) },
    { key: "observed_outcome_present", pass: rows.every((row) => typeof row.observed_default === "boolean") },
    { key: "reason_codes_populated", pass: rows.every((row) => source === "synthetic"
      ? row.reason_codes.length > 0
      : row.reason_codes.length === 3 && new Set(row.reason_codes).size === 3 && row.reason_codes.every((code) => DIRECTIONAL_REASON_CODE.test(code))) },
    { key: "expected_loss_non_negative", pass: rows.every((row) => row.calibrated_pd * row.lgd * row.ead >= 0) },
    { key: "source_provenance_valid", pass: source === "synthetic" ? rows.every((row) => row.provenance === "synthetic") : rows.every((row) => Boolean(row.provenance)) },
  ] satisfies Array<{ key: QualityCheckKey; pass: boolean }>;
}

export default function CreditPolicyLab() {
  const { locale } = useI18n();
  const [dataset, setDataset] = useState<CreditDataset | null>(null);
  const [syntheticDataset, setSyntheticDataset] = useState<CreditDataset | null>(null);
  const [requestedSource, setRequestedSource] = useState<DatasetSource>("synthetic");
  const [activeSource, setActiveSource] = useState<DatasetSource>("synthetic");
  const [realArtifactStatus, setRealArtifactStatus] = useState<RealArtifactStatus>("idle");
  const [realArtifactDetail, setRealArtifactDetail] = useState("");
  const sourceRequest = useRef(0);
  const [vintage, setVintage] = useState("2030-06");
  const [approveThreshold, setApproveThreshold] = useState(12);
  const [reviewThreshold, setReviewThreshold] = useState(28);
  const [capacity, setCapacity] = useState(180);
  const [modelMode, setModelMode] = useState<ModelMode>("baseline");
  const [selectedId, setSelectedId] = useState("");
  const [audit, setAudit] = useState("");
  const [explorerTab, setExplorerTab] = useState<ExplorerTab>("sample");
  const [loadError, setLoadError] = useState("");

  const activateDataset = useCallback((next: CreditDataset) => {
    setDataset(next);
    setActiveSource(next.source);
    const finalVintage = next.date_range.end;
    setVintage(finalVintage);
    setSelectedId(next.rows.find((row) => row.vintage === finalVintage)?.application_id ?? next.rows[0]?.application_id ?? "");
    setAudit("");
  }, []);

  useEffect(() => {
    let active = true;
    fetch(DATA_URL).then((response) => {
      if (!response.ok) throw new Error(`Credit dataset returned ${response.status}`);
      return response.json() as Promise<Omit<CreditDataset, "source">>;
    }).then((next) => {
      if (!active) return;
      const governedFixture: CreditDataset = { ...next, source: "synthetic" };
      setSyntheticDataset(governedFixture);
      activateDataset(governedFixture);
    }).catch((reason: unknown) => { if (active) setLoadError(reason instanceof Error ? reason.message : "Dataset unavailable."); });
    return () => { active = false; };
  }, [activateDataset]);

  const selectDatasetSource = (source: DatasetSource) => {
    const requestId = sourceRequest.current += 1;
    setRequestedSource(source);
    setRealArtifactDetail("");
    if (source === "synthetic") {
      setRealArtifactStatus("idle");
      if (syntheticDataset) activateDataset(syntheticDataset);
      return;
    }

    setRealArtifactStatus("loading");
    void (async () => {
      const { queryParquetFile } = await import("@/lib/duckdb");
      const rows = await queryParquetFile<Record<string, unknown>>(REAL_PARQUET_URL);
      const realDataset = buildRealCreditDataset(rows);
      const failedChecks = qualityChecks(realDataset.rows, approveThreshold / 100, reviewThreshold / 100, "real").filter(({ pass }) => !pass);
      if (failedChecks.length) throw new Error(`Scored backtest contract failed: ${failedChecks.map(({ key }) => key).join(", ")}.`);
      if (sourceRequest.current !== requestId) return;
      setRealArtifactStatus("loaded");
      activateDataset(realDataset);
    })().catch((reason: unknown) => {
      if (sourceRequest.current !== requestId) return;
      const error = reason instanceof Error ? reason : new Error("Real backtest artifact unavailable.");
      setRealArtifactStatus(error.name === "ParquetArtifactUnavailableError" ? "pending" : "invalid");
      setRealArtifactDetail(error.message);
      if (syntheticDataset) activateDataset(syntheticDataset);
    });
  };

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
  const checks = dataset ? qualityChecks(dataset.rows, approve, review, activeSource) : [];
  const allPass = checks.every(({ pass }) => pass);
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
  const groupNames = activeSource === "synthetic" ? ["Synthetic group A", "Synthetic group B", "Synthetic group C"] : [...new Set(dataset.rows.map((row) => row.audit_group))];
  const groupStats = groupNames.map((group) => {
    const items = decisions.filter((item) => item.row.audit_group === group);
    return { group, count: items.length, approvalRate: items.length ? items.filter((item) => item.decision === "approve").length / items.length : 0 };
  });
  const maxRiskBand = Math.max(1, ...riskBands.map((item) => item.count));
  const reviewQueue = decisions.filter((item) => item.decision === "manual_review").sort((left, right) => right.expectedLoss - left.expectedLoss).slice(0, 8);
  const sampleRows = vintageRows.slice(0, 6);
  const schemaFields = Object.keys(dataset.rows[0] ?? {});
  const reset = () => { setApproveThreshold(12); setReviewThreshold(28); setCapacity(180); setVintage(dataset.date_range.end); setModelMode("baseline"); setAudit(""); setSelectedId(dataset.rows.find((row) => row.vintage === dataset.date_range.end)?.application_id ?? ""); };
  const showPublishablePolicy = () => {
    const nextApprove = 10;
    const reviewCandidates = [22, 20, 18, 16, 14, 12];
    const nextReview = reviewCandidates.find((candidate) => vintageRows.filter((row) => {
      const pd = probability(row, modelMode);
      return pd > nextApprove / 100 && pd <= candidate / 100;
    }).length <= 360) ?? 12;
    const nextQueue = vintageRows.filter((row) => {
      const pd = probability(row, modelMode);
      return pd > nextApprove / 100 && pd <= nextReview / 100;
    }).length;
    setApproveThreshold(nextApprove);
    setReviewThreshold(nextReview);
    setCapacity(Math.min(360, Math.max(220, Math.ceil(nextQueue / 10) * 10)));
    setAudit("");
  };

  return (
    <section className={`${styles.upgrade} analytics-lab credit-lab`} data-testid="credit-policy-lab" aria-labelledby="credit-lab-title">
      <header className="analytics-lab-header"><div><p className="eyebrow">{activeSource === "synthetic" ? (locale === "en" ? "Synthetic portfolio / deterministic policy engine" : "合成投资组合 / 确定性策略引擎") : (locale === "en" ? "Scored real-data backtest / deterministic policy engine" : "真实数据评分回测 / 确定性策略引擎")}</p><h3 id="credit-lab-title">Credit Policy Lab</h3><p>{activeSource === "synthetic" ? (locale === "en" ? "Move from a synthetic score to calibrated probability, expected loss, policy thresholds, a capacity-limited review queue, and an audit record." : "从合成分数出发，依次经过概率校准、预期损失、策略阈值、受容量限制的人工队列，最终生成审计记录。") : (locale === "en" ? "Apply the existing score-to-policy, frontier, Brier, PSI, and vintage computations to a committed offline scored backtest." : "将既有的评分到策略、前沿、Brier、PSI 与 vintage 计算应用于已提交的离线评分回测。")}</p></div><div className="analytics-boundary"><ShieldCheck aria-hidden="true" /><strong>{activeSource === "synthetic" ? (locale === "en" ? "No real applicant and no recovered production model" : "无真实申请人，也无恢复的生产模型") : (locale === "en" ? "Offline backtest, not live decisioning" : "离线回测，不是在线决策")}</strong><span>{activeSource === "synthetic" ? (locale === "en" ? "All identities, scores, loans, and outcomes are deterministic synthetic backtest inputs." : "所有身份、分数、贷款和结果都是确定性合成回测输入。") : (locale === "en" ? "The browser loads pre-scored rows; it does not train a model, process a live applicant, or establish regulatory compliance." : "浏览器只载入预评分记录；不训练模型、不处理在线申请，也不证明监管合规。")}</span></div></header>

      <div className="dataset-source-row"><div className="dataset-source-toggle" role="group" aria-label={locale === "en" ? "Credit dataset source" : "信贷数据源"}><button type="button" aria-pressed={requestedSource === "synthetic"} onClick={() => selectDatasetSource("synthetic")}>{locale === "en" ? "Synthetic fixture" : "合成夹具"}</button><button type="button" aria-pressed={requestedSource === "real"} onClick={() => selectDatasetSource("real")}>{locale === "en" ? "Real backtest" : "真实回测"}</button></div><span>{locale === "en" ? "Synthetic fixture / Real backtest" : "合成夹具 / 真实回测"}</span></div>
      {requestedSource === "real" && realArtifactStatus !== "loaded" ? <div className={`real-artifact-state ${realArtifactStatus === "invalid" ? "invalid" : ""}`} role="status"><CircleAlert aria-hidden="true" /><div><strong>{realArtifactStatus === "loading" ? (locale === "en" ? "Checking real backtest artifact…" : "正在检查真实回测产物……") : realArtifactStatus === "invalid" ? (locale === "en" ? "real backtest artifact blocked" : "真实回测产物已阻断") : (locale === "en" ? "real-data artifact pending" : "真实数据产物待提交")}</strong><p>{realArtifactStatus === "invalid" ? realArtifactDetail : (locale === "en" ? "scored-backtest.parquet is not committed; the governed synthetic fixture remains active." : "scored-backtest.parquet 尚未提交；当前继续使用受治理的合成夹具。")}</p></div></div> : null}

      <section className="analytics-dataset-context" aria-label={locale === "en" ? "Dataset context" : "数据集说明"}>
        <div className="analytics-context-title"><Database aria-hidden="true" /><div><span>{locale === "en" ? "Dataset and decision context" : "数据集与决策背景"}</span><strong>{activeSource === "synthetic" ? (locale === "en" ? "Credit Synthetic v2" : "信贷合成数据 v2") : (locale === "en" ? "Scored backtest artifact" : "评分回测产物")}</strong><code>{dataset.dataset_version}</code></div></div>
        <dl>
          <div><dt>{locale === "en" ? "Portfolio" : "组合规模"}</dt><dd>{number.format(dataset.dimensions.applications)} {locale === "en" ? "applications" : "条申请"} · {number.format(dataset.dimensions.loans)} {locale === "en" ? "loans" : "笔贷款"}</dd></div>
          <div><dt>{locale === "en" ? "Vintages" : "批次"}</dt><dd>{dataset.dimensions.vintages} · {dataset.date_range.start} → {dataset.date_range.end}</dd></div>
          <div><dt>{locale === "en" ? "Splits" : "数据划分"}</dt><dd>{number.format(dataset.splits.train)} {locale === "en" ? "train" : "训练"} · {number.format(dataset.splits.calibration)} {locale === "en" ? "calibration" : "校准"} · {number.format(dataset.splits.backtest)} {locale === "en" ? "backtest" : "回测"}</dd></div>
          <div><dt>{locale === "en" ? "Dimensions" : "维度"}</dt><dd>{dataset.dimensions.channels} {locale === "en" ? "channels" : "个渠道"} · {dataset.dimensions.income_bands} {locale === "en" ? "income bands" : "个收入带"} · {dataset.dimensions.audit_groups} {locale === "en" ? "audit groups" : "个审计组"}</dd></div>
          <div><dt>{locale === "en" ? "Features" : "特征"}</dt><dd>{dataset.dimensions.feature_count} {activeSource === "synthetic" ? (locale === "en" ? "generated decision features" : "个生成的决策特征") : (locale === "en" ? "normalized backtest features" : "个规范化回测特征")}</dd></div>
          <div><dt>{locale === "en" ? "Observed outcome" : "观察结果"}</dt><dd>{(dataset.rows.filter((row) => row.observed_default).length / dataset.rows.length * 100).toFixed(1)}% {activeSource === "synthetic" ? (locale === "en" ? "synthetic default rate" : "合成违约率") : (locale === "en" ? "artifact default rate" : "产物违约率")}</dd></div>
        </dl>
        <p>{locale === "en" ? "Applicant, application, booked loan, observed outcome, model score, and policy decision are separate fields and stages." : "申请人概念、申请记录、已入账贷款、观察结果、模型分数与策略决策均为独立字段和阶段。"}</p>
        <div className="analytics-download-row"><ArtifactLink href={DATA_URL}>{locale === "en" ? "Explore full JSON" : "浏览完整 JSON"}</ArtifactLink><a href={CSV_URL} download><Download aria-hidden="true" />{locale === "en" ? "Download full CSV" : "下载完整 CSV"}</a><a href={PARQUET_URL} download><Download aria-hidden="true" />{locale === "en" ? "Download Parquet" : "下载 Parquet"}</a><ArtifactLink href={SAMPLE_URL}>{locale === "en" ? "Browse CSV sample" : "浏览 CSV 样本"}</ArtifactLink><a href={PUBLIC_FIXTURE_GENERATOR_URL} target="_blank" rel="noreferrer">{locale === "en" ? "Open public fixture generator" : "查看公开夹具生成器"}</a></div>
      </section>

      <section className="analytics-explorer" aria-label={locale === "en" ? "Dataset explorer" : "数据集浏览器"}>
        <div className="analytics-explorer-tabs" role="tablist">{(["sample", "schema", "quality"] as ExplorerTab[]).map((tab) => <button key={tab} type="button" role="tab" aria-selected={explorerTab === tab} onClick={() => setExplorerTab(tab)}>{tab === "sample" ? (locale === "en" ? "Sample applications" : "申请样本") : tab === "schema" ? (locale === "en" ? "Schema and dictionary" : "Schema 与字段说明") : (locale === "en" ? "Quality checks" : "质量检查")}</button>)}</div>
        {explorerTab === "sample" ? <div className="analytics-sample-table"><table><thead><tr><th>{locale === "en" ? "application" : "申请"}</th><th>{locale === "en" ? "loan" : "贷款"}</th><th>{locale === "en" ? "channel" : "渠道"}</th><th>{locale === "en" ? "split" : "数据划分"}</th><th>PD</th><th>{locale === "en" ? "outcome" : "结果"}</th></tr></thead><tbody>{sampleRows.map((row) => <tr key={row.application_id}><td>{row.application_id}</td><td>{row.loan_id ?? (locale === "en" ? "not booked" : "未入账")}</td><td>{row.channel}</td><td>{row.split}</td><td>{(probability(row, modelMode) * 100).toFixed(1)}%</td><td>{row.observed_default ? (locale === "en" ? "default" : "违约") : (locale === "en" ? "no default" : "未违约")}</td></tr>)}</tbody></table></div> : null}
        {explorerTab === "schema" ? <div className="analytics-field-grid">{schemaFields.map((field) => <div key={field}><code>{field}</code><span>{field.endsWith("_pd") ? (activeSource === "synthetic" ? (locale === "en" ? "synthetic probability" : "合成概率") : (locale === "en" ? "offline scored probability" : "离线评分概率")) : field === "observed_default" ? (activeSource === "synthetic" ? (locale === "en" ? "generated outcome" : "生成的观察结果") : (locale === "en" ? "backtest outcome" : "回测结果")) : field.endsWith("_id") ? (activeSource === "synthetic" ? (locale === "en" ? "synthetic identifier" : "合成标识符") : (locale === "en" ? "artifact identifier" : "产物标识符")) : (locale === "en" ? "feature, dimension, or policy input" : "特征、维度或策略输入")}</span></div>)}</div> : null}
        {explorerTab === "quality" ? <div className="analytics-quality-list">{checks.map(({ key, pass }) => <p key={key} className={pass ? "pass" : "fail"}>{pass ? <Check aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}{QUALITY_CHECK_LABELS[key][locale]}</p>)}</div> : null}
      </section>

      <div className="credit-layer-strip"><div><span>01</span><strong>{locale === "en" ? "Raw score" : "原始分数"}</strong><p>{locale === "en" ? "raw PD" : "原始 PD"}</p></div><div><span>02</span><strong>{locale === "en" ? "Calibrated probability" : "校准概率"}</strong><p>{locale === "en" ? "baseline / challenger" : "baseline / challenger 对比"}</p></div><div><span>03</span><strong>{locale === "en" ? "Expected loss" : "预期损失"}</strong><p>PD × LGD × EAD</p></div><div><span>04</span><strong>{locale === "en" ? "Policy and human queue" : "策略与人工队列"}</strong><p>{locale === "en" ? "approve / review / decline" : "批准 / 复核 / 拒绝"}</p></div><div><span>05</span><strong>{locale === "en" ? "Audit record" : "审计记录"}</strong><p>{locale === "en" ? "thresholds / capacity / outcome" : "阈值 / 容量 / 结果"}</p></div></div><p className="credit-decision-boundary">{locale === "en" ? "Model probability is not the final business decision." : "模型给出的风险概率，并不等同于最终审批结果。最终决策还要经过成本、策略阈值和人工复核。"}</p>

      <div className="credit-model-tabs" role="tablist" aria-label={locale === "en" ? "Policy model" : "策略模型"}>{(["baseline", "challenger"] as ModelMode[]).map((mode) => <button key={mode} type="button" role="tab" aria-selected={modelMode === mode} onClick={() => { setModelMode(mode); setAudit(""); }}>{mode === "baseline" ? (locale === "en" ? "Baseline calibrated PD" : "Baseline 校准 PD") : activeSource === "synthetic" ? (locale === "en" ? "Challenger synthetic PD" : "Challenger 合成 PD") : (locale === "en" ? "Challenger scored PD" : "Challenger 评分 PD")}</button>)}</div>
      <SwapSetPanel rows={vintageRows} approveThreshold={approve} locale={locale} sourceLabel={activeSource === "synthetic" ? (locale === "en" ? "governed synthetic fixture" : "受治理合成夹具") : (locale === "en" ? "loaded scored backtest" : "已载入评分回测")} showObservedOutcomes={activeSource === "real"} />
      <div className="credit-policy-controls"><label><span>{locale === "en" ? "Approve <=" : "批准 <="}</span><strong>{approveThreshold}%</strong><input aria-label={locale === "en" ? "Approve threshold" : "批准阈值"} type="range" min="4" max="24" value={approveThreshold} onChange={(event) => { setApproveThreshold(Math.min(Number(event.target.value), reviewThreshold - 2)); setAudit(""); }} /></label><label><span>{locale === "en" ? "Review <=" : "复核 <="}</span><strong>{reviewThreshold}%</strong><input aria-label={locale === "en" ? "Review threshold" : "复核阈值"} type="range" min="10" max="50" value={reviewThreshold} onChange={(event) => { setReviewThreshold(Math.max(Number(event.target.value), approveThreshold + 2)); setAudit(""); }} /></label><label><span>{locale === "en" ? "Analyst capacity" : "分析师容量"}</span><strong>{capacity}</strong><input aria-label={locale === "en" ? "Review capacity" : "复核容量"} type="range" min="40" max="360" step="10" value={capacity} onChange={(event) => { setCapacity(Number(event.target.value)); setAudit(""); }} /></label><button type="button" onClick={reset}><RotateCcw aria-hidden="true" />{locale === "en" ? "Reset" : "重置"}</button></div>

      <div className="credit-policy-grid"><div className="credit-policy-summary"><div className="analytics-pane-heading"><span>{locale === "en" ? "Policy simulation" : "策略模拟"}</span><select aria-label={locale === "en" ? "Backtest vintage" : "回测 vintage"} value={vintage} onChange={(event) => { setVintage(event.target.value); setSelectedId(dataset.rows.find((row) => row.vintage === event.target.value)?.application_id ?? ""); setAudit(""); }}>{[...new Set(dataset.rows.map((row) => row.vintage))].map((value) => <option key={value}>{value}</option>)}</select></div><div className="credit-decision-bands"><div className="approve"><span>{locale === "en" ? "Approve" : "批准"}</span><strong>{counts.approve}</strong><p>{(counts.approve / vintageRows.length * 100).toFixed(1)}%</p></div><div className="review"><span>{locale === "en" ? "Manual review" : "人工复核"}</span><strong>{counts.review}</strong><p className={counts.review > capacity ? "overflow" : ""}>{counts.review > capacity ? `${counts.review - capacity} ${locale === "en" ? "over capacity" : "超出容量"}` : (locale === "en" ? "within capacity" : "容量内")}</p></div><div className="decline"><span>{locale === "en" ? "Decline" : "拒绝"}</span><strong>{counts.decline}</strong><p>{(counts.decline / vintageRows.length * 100).toFixed(1)}%</p></div></div><div className="credit-economics"><div><span>{locale === "en" ? "Approved expected loss" : "批准预期损失"}</span><strong>{number.format(approvedExpectedLoss)}</strong></div><div><span>{locale === "en" ? "Policy cost surface" : "策略成本曲面"}</span><strong>{number.format(policyCost)}</strong></div><p>{activeSource === "synthetic" ? (locale === "en" ? "Synthetic currency. Review cost = 35 + 45% of EL; decline opportunity cost = 1.8% of EAD." : "合成货币。复核成本 = 35 + 45% EL；拒绝机会成本 = EAD 的 1.8%。") : (locale === "en" ? "Artifact currency. Review and decline cost assumptions remain policy inputs, not measured outcomes." : "产物货币。复核与拒绝成本仍是策略输入，不是实测结果。")}</p></div><div className="credit-policy-actions analytics-controlbar"><button className="credit-publish-policy" type="button" disabled={!allPass || counts.review > capacity} onClick={() => setAudit(`${activeSource === "synthetic" ? "SYN" : "BACKTEST"}-POLICY-${vintage}-${modelMode}-${approveThreshold}-${reviewThreshold}-${capacity}`)}><ClipboardCheck aria-hidden="true" />{counts.review > capacity ? (locale === "en" ? "Resolve queue overflow" : "先解决队列溢出") : (locale === "en" ? "Record policy decision" : "记录策略决策")}</button><button className="credit-publishable-preset" data-testid="publishable-policy-preset" type="button" onClick={showPublishablePolicy}>{locale === "en" ? "Show a publishable policy" : "显示可发布策略"}</button>{counts.review > capacity ? <p className="credit-policy-guidance">{locale === "en" ? "The lab opens with a deliberately overloaded review queue. Narrow the review band or raise analyst capacity to unblock publication." : "实验室默认有意让复核队列超载。缩窄复核区间或提高分析师容量，均可解除发布阻断。"}</p> : null}</div>{audit && <div className="credit-audit-record"><Check aria-hidden="true" /><div><span>{activeSource === "synthetic" ? (locale === "en" ? "Synthetic audit record" : "合成审计记录") : (locale === "en" ? "Backtest policy record" : "回测策略记录")}</span><strong>{audit}</strong><p>{counts.approve}/{counts.review}/{counts.decline} · EL {number.format(approvedExpectedLoss)}</p></div></div>}</div>
        <div className="credit-application-review">
          <div className="analytics-pane-heading"><span>{locale === "en" ? "Application review" : "申请复核"}</span><select aria-label={activeSource === "synthetic" ? (locale === "en" ? "Synthetic application" : "合成申请") : (locale === "en" ? "Backtest application" : "回测申请")} value={selected.application_id} onChange={(event) => setSelectedId(event.target.value)}>{vintageRows.map((row) => <option key={row.application_id}>{row.application_id}</option>)}</select></div>
          <div className="credit-score-chain"><div><span>{activeSource === "synthetic" ? (locale === "en" ? "Raw synthetic PD" : "原始合成 PD") : (locale === "en" ? "Raw scored PD" : "原始评分 PD")}</span><strong>{(selected.raw_pd * 100).toFixed(1)}%</strong></div><div><span>{modelMode === "baseline" ? (locale === "en" ? "Calibrated PD" : "校准 PD") : (locale === "en" ? "Challenger PD" : "挑战者 PD")}</span><strong>{(selectedPd * 100).toFixed(1)}%</strong></div><div><span>{locale === "en" ? "Expected loss" : "预期损失"}</span><strong>{number.format(selectedPd * selected.lgd * selected.ead)}</strong><code>PD × {selected.lgd.toFixed(2)} LGD × {number.format(selected.ead)} EAD</code></div><div className={`decision ${selectedDecision}`}><span>{locale === "en" ? "Policy decision" : "策略决策"}</span><strong>{DECISION_LABELS[selectedDecision][locale]}</strong></div></div>
          <div className="credit-entity-ledger"><div><span>{locale === "en" ? "Application" : "申请"}</span><code>{selected.application_id}</code></div><div><span>{locale === "en" ? "Loan" : "贷款"}</span><code>{selected.loan_id ?? (activeSource === "synthetic" ? (locale === "en" ? "not booked in synthetic observed book" : "未进入合成观察账簿") : (locale === "en" ? "not supplied in backtest artifact" : "回测产物未提供"))}</code></div><div><span>{locale === "en" ? "Observed outcome" : "观察结果"}</span><strong>{selected.observed_default ? (activeSource === "synthetic" ? (locale === "en" ? "synthetic default" : "合成违约") : (locale === "en" ? "observed default" : "观察到违约")) : (activeSource === "synthetic" ? (locale === "en" ? "synthetic no default" : "合成未违约") : (locale === "en" ? "observed no default" : "观察到未违约"))}</strong></div></div>
          <div className="credit-reason-codes"><span>{activeSource === "synthetic" ? (locale === "en" ? "Deterministic reason codes" : "确定性原因码") : (locale === "en" ? "Loaded reason codes" : "已载入原因码")}</span>{selected.reason_codes.map((reason) => <code key={reason}>{reason}</code>)}</div>
        </div>
      </div>

      <div className="credit-chart-grid"><section className="credit-calibration"><div className="analytics-pane-heading"><span>{locale === "en" ? "Calibration curve" : "校准曲线"}</span><code>{modelMode} · backtest</code></div><div>{calibrationBins.map((bin) => <div key={bin.label} title={`${bin.label}; n=${bin.count}; predicted=${(bin.predicted * 100).toFixed(1)}%; observed=${(bin.observed * 100).toFixed(1)}%`}><span>{bin.label}</span><i className="predicted" style={{ height: `${Math.max(2, bin.predicted * 100)}%` }} /><i className="observed" style={{ height: `${Math.max(2, bin.observed * 100)}%` }} /><small>{bin.count}</small></div>)}</div><p><span><i className="predicted" />{locale === "en" ? "Predicted" : "预测"}</span><span><i className="observed" />{activeSource === "synthetic" ? (locale === "en" ? "Observed synthetic outcome" : "合成观察结果") : (locale === "en" ? "Observed backtest outcome" : "回测观察结果")}</span></p></section><section className="credit-frontier"><div className="analytics-pane-heading"><span>{locale === "en" ? "Approval vs expected-loss frontier" : "批准率与预期损失前沿"}</span><code>{vintage}</code></div>{frontier.map((point) => <button type="button" key={point.threshold} className={point.threshold === approveThreshold ? "active" : ""} onClick={() => { setApproveThreshold(Math.min(point.threshold, reviewThreshold - 2)); setAudit(""); }}><span>{point.threshold}%</span><i><b style={{ width: `${point.approvalRate * 100}%` }} /></i><strong>{(point.approvalRate * 100).toFixed(1)}%</strong><small>EL {number.format(point.expectedLoss)}</small></button>)}</section></div>

      <div className="credit-chart-grid"><section className="credit-risk-bands"><div className="analytics-pane-heading"><span>{locale === "en" ? "Risk-band distribution" : "风险带分布"}</span><code>{vintage}</code></div>{riskBands.map((band) => <div key={band.label}><span>{band.label}</span><i><b style={{ width: `${band.count / maxRiskBand * 100}%` }} /></i><strong>{band.count}</strong></div>)}</section><section className="credit-vintages"><div className="analytics-pane-heading"><span>{locale === "en" ? "Vintage performance and drift" : "Vintage 表现与漂移"}</span><code>mean PD / observed</code></div><div>{vintageStats.map((item) => <button type="button" className={item.vintage === vintage ? "active" : ""} title={`${item.vintage}: PD ${(item.meanPd * 100).toFixed(1)}%; observed ${(item.defaultRate * 100).toFixed(1)}%`} key={item.vintage} onClick={() => setVintage(item.vintage)}><i style={{ height: `${Math.max(5, item.meanPd * 180)}%` }} /><b style={{ height: `${Math.max(5, item.defaultRate * 180)}%` }} /><span>{item.vintage.slice(2)}</span><small>{item.split.slice(0, 1).toUpperCase()}</small></button>)}</div></section></div>

      <div className="credit-monitor-grid"><div><span>{locale === "en" ? "Backtest score comparison" : "回测分数比较"}</span><p><strong>{rawBrier.toFixed(4)}</strong>{locale === "en" ? " raw Brier" : " 原始 Brier"}</p><p><strong>{calibratedBrier.toFixed(4)}</strong> baseline</p><p><strong>{challengerBrier.toFixed(4)}</strong> challenger</p><small>{activeSource === "synthetic" ? (locale === "en" ? "Fixed synthetic backtest only; not real model validation." : "仅适用于固定合成回测；不是真实模型验证。") : (locale === "en" ? "Computed from the loaded offline backtest; not live production validation." : "由已载入的离线回测计算；不是在线生产验证。")}</small></div><div className={psiValue >= 0.1 ? "alert" : ""}><span>{locale === "en" ? "Vintage score drift" : "Vintage 分数漂移"}</span><p><strong>{psiValue.toFixed(3)}</strong> PSI</p><small>{dataset.date_range.start} vs {dataset.date_range.end}; {activeSource === "synthetic" ? (locale === "en" ? "synthetic alert threshold 0.10" : "合成告警阈值 0.10") : (locale === "en" ? "display alert threshold 0.10" : "展示告警阈值 0.10")}.</small></div><div><span>{locale === "en" ? "Descriptive audit slices" : "描述性审计切片"}</span>{groupStats.map((item) => <p key={item.group}><strong>{(item.approvalRate * 100).toFixed(1)}%</strong> {item.group} ({item.count})</p>)}<small>{activeSource === "synthetic" ? (locale === "en" ? "Synthetic groups; no fairness or compliance conclusion." : "合成群组；不作公平性或合规结论。") : (locale === "en" ? "Artifact groups; descriptive only, with no fairness or compliance conclusion." : "产物群组；仅作描述，不作公平性或合规结论。")}</small></div></div>

      <div className="credit-queue-grid"><section><div className="analytics-pane-heading"><span>{locale === "en" ? "Manual review queue" : "人工复核队列"}</span><code>{counts.review} / {capacity}</code></div>{reviewQueue.map((item, index) => <button type="button" key={item.row.application_id} onClick={() => setSelectedId(item.row.application_id)}><span>{String(index + 1).padStart(2, "0")}</span><code>{item.row.application_id}</code><strong>{(item.pd * 100).toFixed(1)}%</strong><small>EL {number.format(item.expectedLoss)}</small></button>)}</section><section><div className="analytics-pane-heading"><span>{locale === "en" ? "Reason-code mix" : "原因码分布"}</span><code>{vintage}</code></div>{reasonCounts.map(([reason, count]) => <div key={reason}><code>{reason}</code><i><b style={{ width: `${count / Math.max(1, reasonCounts[0]?.[1] ?? 1) * 100}%` }} /></i><strong>{count}</strong></div>)}</section></div>

      <div className="analytics-contract-grid"><div><span>{locale === "en" ? "Policy contract" : "策略契约"}</span><p className={allPass ? "pass" : "fail"}>{allPass ? <Check aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}{allPass ? (locale === "en" ? "All ten checks pass" : "十项检查全部通过") : (locale === "en" ? "Policy output blocked" : "策略输出已阻断")}</p><p>{locale === "en" ? "Application grain, thresholds, probabilities, outcomes, reason codes, and entity boundaries are checked." : "已检查 application 粒度、阈值、概率、结果、原因码和实体边界。"}</p></div><div><span>{locale === "en" ? "Governance boundary" : "治理边界"}</span><p><Scale aria-hidden="true" />{locale === "en" ? "Prediction, calibration, economics, policy, human review, and audit remain separate stages." : "预测、校准、经济、策略、人工复核和审计保持为独立阶段。"}</p><p><CircleAlert aria-hidden="true" />{locale === "en" ? "No regulatory, real-world fairness, or production accuracy claim." : "不声明监管合规、真实世界公平性或生产准确率。"}</p></div></div>
      <footer className="analytics-lab-footer"><div><span>{activeSource === "synthetic" ? (locale === "en" ? "Seed / version" : "种子 / 版本") : (locale === "en" ? "Artifact / version" : "产物 / 版本")}</span><code>{activeSource === "synthetic" ? `${dataset.seed} / ${dataset.dataset_version}` : `scored-backtest.parquet / ${dataset.dataset_version}`}</code></div><div><span>{activeSource === "synthetic" ? (locale === "en" ? "Rows SHA-256" : "行数据 SHA-256") : (locale === "en" ? "Runtime source" : "运行时来源")}</span><code>{dataset.rows_sha256 ?? REAL_PARQUET_URL}</code></div><div><ArtifactLink href={CONTRACT_URL}>{locale === "en" ? "Open policy contract" : "查看策略契约"}</ArtifactLink></div></footer>
    </section>
  );
}
