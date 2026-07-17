"use client";

import { CircleAlert, Database, FileCheck2, FlaskConical, GitCompareArrows, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useI18n, type Locale } from "@/lib/i18n";
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
  credit: "/case-studies/credit-policy-lab/methods-evidence.json",
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

function MethodBlock({ title, items, locale, icon }: { title: Localized; items: LocalizedList; locale: Locale; icon: React.ReactNode }) {
  return <article><header>{icon}<h4>{title[locale]}</h4></header><ol>{items[locale].map((item) => <li key={item}>{item}</li>)}</ol></article>;
}

export default function AnalyticsMethods({ project }: { project: Project }) {
  const { locale } = useI18n();
  const [state, setState] = useState<EvidenceState>({ kind: "loading" });

  useEffect(() => {
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
  }, [project]);

  if (state.kind !== "ready") {
    return <section className={styles.methods} data-testid={`analytics-methods-${project}`}><div className={styles.pending}><CircleAlert aria-hidden="true" /><div><h3>{locale === "en" ? "Methods / Evidence / What changed with real data" : "方法 / 证据 / 真实数据带来的变化"}</h3><p>{state.kind === "invalid" ? (locale === "en" ? "Methods evidence is blocked because its contract is invalid." : "方法证据因契约无效而被阻断。") : state.kind === "loading" ? (locale === "en" ? "Loading pipeline-backed methods evidence…" : "正在载入由流水线支持的方法证据……") : (locale === "en" ? "Methods evidence is pending with the real-data artifact." : "方法证据正等待真实数据产物。")}</p></div></div></section>;
  }

  const evidence = state.evidence;
  return <section className={styles.methods} data-testid={`analytics-methods-${project}`} aria-labelledby={`${project}-methods-title`}><header className={styles.heading}><div><p>{locale === "en" ? "Pipeline-backed disclosure" : "由流水线支持的披露"}</p><h3 id={`${project}-methods-title`}>{locale === "en" ? "Methods / Evidence / What changed with real data" : "方法 / 证据 / 真实数据带来的变化"}</h3></div><a href={evidence.dataset.source_url} target="_blank" rel="noreferrer">{locale === "en" ? "Open source record" : "打开来源记录"}</a></header><div className={styles.dataset}><div><span>{locale === "en" ? "Dataset" : "数据集"}</span><strong>{evidence.dataset.name}</strong><small>{evidence.dataset.license} · {locale === "en" ? "retrieved" : "获取于"} {evidence.dataset.retrieval_date}</small></div><div><span>{locale === "en" ? "Source → derived" : "来源 → 派生"}</span><strong>{evidence.dataset.raw_records.toLocaleString()} → {evidence.dataset.derived_rows.toLocaleString()}</strong><small>{evidence.dataset.date_range.join(" → ")}</small></div><div><span>Artifact SHA-256</span><code title={evidence.dataset.artifact_sha256}>{evidence.dataset.artifact_sha256}</code></div></div><div className={styles.metrics}>{evidence.metrics.map((metric) => <div key={metric.label.en}><span>{metric.label[locale]}</span><strong>{metric.value}</strong></div>)}</div><div className={styles.grid}><MethodBlock title={{ en: "Acquire and clean", zh: "获取与清洗" }} items={evidence.acquisition_and_cleaning} locale={locale} icon={<Database aria-hidden="true" />} /><MethodBlock title={{ en: "Train and estimate", zh: "训练与估计" }} items={evidence.modeling} locale={locale} icon={<FlaskConical aria-hidden="true" />} /><MethodBlock title={{ en: "Split and prevent leakage", zh: "切分与防止泄漏" }} items={evidence.split_and_leakage} locale={locale} icon={<GitCompareArrows aria-hidden="true" />} /><MethodBlock title={{ en: "Outcome / anomaly labels", zh: "结果 / 异常标签" }} items={evidence.labels} locale={locale} icon={<FileCheck2 aria-hidden="true" />} /><MethodBlock title={{ en: "Why this evidence is trustworthy", zh: "为何这份证据可信" }} items={evidence.trust} locale={locale} icon={<ShieldCheck aria-hidden="true" />} /></div><div className={styles.changed}><span>{locale === "en" ? "What changed with real data" : "真实数据带来的变化"}</span><p>{evidence.changed[locale]}</p></div><div className={styles.reproduce}><div><span>{locale === "en" ? "Reproduce" : "复现"}</span>{evidence.reproduction.map((command) => <code key={command}>{command}</code>)}</div><p><strong>{locale === "en" ? "Claim boundary" : "声明边界"}</strong>{evidence.boundaries[locale]}</p></div></section>;
}
