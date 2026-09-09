"use client";

import { useEffect, useState } from "react";
import ScrollRegion from "@/components/ScrollRegion";
import { useI18n, type Locale } from "@/lib/i18n";
import { zhWrapDisplay } from "@/lib/zh-wrap";
import styles from "./AnalyticsMethods.module.css";

type Project = "margin" | "credit";
type Localized = { en: string; zh: string };
type LocalizedList = { en: string[]; zh: string[] };

interface MethodsEvidence {
  report_version: "analytics-methods-v1";
  project: Project;
  dataset: {
    name: string;
    source_url: string;
    license: string;
    retrieval_date: string;
    raw_records: number;
    derived_rows: number;
    date_range: [string, string];
    artifact_sha256: string;
  };
  acquisition_and_cleaning: LocalizedList;
  modeling: LocalizedList;
  split_and_leakage: LocalizedList;
  labels: LocalizedList;
  trust: LocalizedList;
  changed: Localized;
  metrics: Array<{ label: Localized; value: string }>;
  reproduction: string[];
  boundaries: Localized;
}

type EvidenceState = { kind: "loading" | "pending" | "invalid" } | { kind: "ready"; evidence: MethodsEvidence };

const PATHS: Record<Project, string> = {
  margin: "/case-studies/margin-control-tower/methods-evidence.json",
  credit: "/case-studies/credit-policy-desk/methods-evidence.json",
};

function isLocalized(value: unknown): value is Localized {
  return Boolean(value && typeof value === "object"
    && typeof (value as { en?: unknown }).en === "string" && Boolean((value as { en: string }).en.trim())
    && typeof (value as { zh?: unknown }).zh === "string" && Boolean((value as { zh: string }).zh.trim()));
}

function isLocalizedList(value: unknown): value is LocalizedList {
  return Boolean(value && typeof value === "object"
    && ["en", "zh"].every((locale) => Array.isArray((value as Record<string, unknown>)[locale])
      && ((value as Record<string, unknown[]>)[locale]).length > 0
      && ((value as Record<string, unknown[]>)[locale]).every((entry) => typeof entry === "string" && Boolean(entry.trim()))));
}

function isEvidence(value: unknown, project: Project): value is MethodsEvidence {
  if (!value || typeof value !== "object") return false;
  const evidence = value as Partial<MethodsEvidence>;
  const dataset = evidence.dataset as Partial<MethodsEvidence["dataset"]> | undefined;
  return evidence.report_version === "analytics-methods-v1" && evidence.project === project
    && Boolean(dataset && [dataset.name, dataset.source_url, dataset.license, dataset.retrieval_date].every((entry) => typeof entry === "string" && Boolean(entry.trim())))
    && Boolean(dataset && typeof dataset.artifact_sha256 === "string" && /^[a-f0-9]{64}$/.test(dataset.artifact_sha256))
    && Boolean(dataset && typeof dataset.raw_records === "number" && Number.isInteger(dataset.raw_records) && dataset.raw_records > 0)
    && Boolean(dataset && typeof dataset.derived_rows === "number" && Number.isInteger(dataset.derived_rows) && dataset.derived_rows > 0)
    && Boolean(dataset && Array.isArray(dataset.date_range) && dataset.date_range.length === 2 && dataset.date_range.every((entry) => typeof entry === "string" && Boolean(entry.trim())))
    && [evidence.acquisition_and_cleaning, evidence.modeling, evidence.split_and_leakage, evidence.labels, evidence.trust].every(isLocalizedList)
    && isLocalized(evidence.changed) && isLocalized(evidence.boundaries)
    && Array.isArray(evidence.metrics) && evidence.metrics.length > 0 && evidence.metrics.every((metric) => Boolean(metric && typeof metric === "object" && isLocalized(metric.label) && typeof metric.value === "string" && Boolean(metric.value.trim())))
    && Array.isArray(evidence.reproduction) && evidence.reproduction.length > 0 && evidence.reproduction.every((command) => typeof command === "string" && Boolean(command.trim()));
}

function MethodBlock({ num, title, items, locale }: { num: string; title: Localized; items: LocalizedList; locale: Locale }) {
  return <article><span className={styles.mnum} aria-hidden="true">{num}</span><h4>{title[locale]}</h4><ol>{items[locale].map((item) => <li key={item}>{item}</li>)}</ol></article>;
}

export default function AnalyticsMethods({ project, committedEvidence }: { project: Project; committedEvidence?: unknown }) {
  const { locale } = useI18n();
  const [remoteState, setState] = useState<EvidenceState>({ kind: "loading" });
  const state: EvidenceState = committedEvidence === undefined ? remoteState
    : isEvidence(committedEvidence, project) ? { kind: "ready", evidence: committedEvidence } : { kind: "invalid" };

  useEffect(() => {
    if (committedEvidence !== undefined) return;
    const controller = new AbortController();
    fetch(PATHS[project], { signal: controller.signal }).then(async (response) => {
      if (response.status === 404) return setState({ kind: "pending" });
      if (!response.ok) throw new Error(`Methods evidence returned ${response.status}`);
      const value: unknown = await response.json();
      setState(isEvidence(value, project) ? { kind: "ready", evidence: value } : { kind: "invalid" });
    }).catch((error: unknown) => {
      if (!(error instanceof DOMException && error.name === "AbortError")) setState({ kind: "pending" });
    });
    return () => controller.abort();
  }, [project, committedEvidence]);

  if (state.kind !== "ready") {
    return <section className={styles.methods} data-testid={`analytics-methods-${project}`}><div className={styles.pending}><h3>{locale === "en" ? "Methods / Results / Real-data analysis" : "方法 / 结果 / 真实数据分析"}</h3><p>{state.kind === "invalid" ? (locale === "en" ? "The methods report is unavailable because its data contract did not pass." : "方法报告的数据契约未通过，暂不可用。") : state.kind === "loading" ? (locale === "en" ? "Loading the pipeline-backed methods report…" : "正在载入由流水线支持的方法报告……") : (locale === "en" ? "The methods report is being prepared with the real-data artifact." : "正在基于真实数据产物准备方法报告。")}</p></div></section>;
  }

  const evidence = state.evidence;
  return <section className={styles.methods} data-testid={`analytics-methods-${project}`} aria-labelledby={`${project}-methods-title`}>
    <header className={styles.head}>
      <p className={styles.eyebrow}>{locale === "en" ? "Pipeline-backed analysis" : "由流水线支持的分析"}</p>
      <a className={styles.openRecord} href={evidence.dataset.source_url} target="_blank" rel="noreferrer">{locale === "en" ? "Open source record" : "打开来源记录"}</a>
    </header>
    <h3 id={`${project}-methods-title`} className={styles.title} data-zh-display>{locale === "en" ? <>Methods / Results / <em>Real-data analysis.</em></> : zhWrapDisplay(<>方法 / 结果 / <em>真实数据分析。</em></>)}</h3>
    <div className={styles.meta}>
      {/* The literal space after each .k label keeps innerText from fusing the
          uppercase Latin label onto the value ("DERIVED547,593"), which erases
          the \b word boundary the numeric-parity extractor needs in en. */}
      <div><span className={styles.k}>{locale === "en" ? "Dataset" : "数据集"}</span>{" "}{evidence.dataset.name} · {evidence.dataset.license} · {locale === "en" ? "retrieved" : "获取于"} {evidence.dataset.retrieval_date}</div>
      <div><span className={styles.k}>{locale === "en" ? "Source → derived" : "来源 → 派生"}</span>{" "}{evidence.dataset.raw_records.toLocaleString()} → {evidence.dataset.derived_rows.toLocaleString()} · {evidence.dataset.date_range.join(" → ")}</div>
      <div><span className={styles.k}>{locale === "en" ? "Artifact SHA-256" : "产物 SHA-256"}</span>{" "}<code title={evidence.dataset.artifact_sha256}>{evidence.dataset.artifact_sha256}</code></div>
    </div>
    <div className={styles.statRow}>{evidence.metrics.map((metric) => <div key={metric.label.en} className={styles.stat}><strong>{metric.value}</strong><span>{metric.label[locale]}</span></div>)}</div>
    <div className={styles.grid}>
      <MethodBlock num="01" title={{ en: "Acquire and clean", zh: "获取与清洗" }} items={evidence.acquisition_and_cleaning} locale={locale} />
      <MethodBlock num="02" title={{ en: "Train and estimate", zh: "训练与估计" }} items={evidence.modeling} locale={locale} />
      <MethodBlock num="03" title={{ en: "Split and prevent leakage", zh: "切分与防止泄漏" }} items={evidence.split_and_leakage} locale={locale} />
      <MethodBlock num="04" title={{ en: "Outcome / anomaly labels", zh: "结果 / 异常标签" }} items={evidence.labels} locale={locale} />
      <MethodBlock num="05" title={{ en: "Quality controls", zh: "质量控制" }} items={evidence.trust} locale={locale} />
    </div>
    <div className={styles.finding}><span className={styles.flabel}>{locale === "en" ? "What changed with real data" : "真实数据带来的变化"}</span><p>{evidence.changed[locale]}</p></div>
    <div className={styles.repro}><span className={styles.flabel}>{locale === "en" ? "Reproduce" : "复现"}</span><ScrollRegion className={styles.cmds} label={{ en: "Reproduce commands", zh: "复现命令" }}>{evidence.reproduction.map((command) => <code key={command}>{command}</code>)}</ScrollRegion></div>
  </section>;
}
