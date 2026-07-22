"use client";

import { Check, CircleAlert, FileCheck2, RefreshCw, ScanSearch, ShieldCheck, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ArtifactLink from "@/components/ArtifactLink";
import { useI18n } from "@/lib/i18n";
import { canonicalizeStructuralValue, localizeStructuralValue } from "@/lib/structural-copy";
import { userFacingError } from "@/lib/user-facing-error";

const REGISTRY_URL = "/case-studies/rag-quality-lab/claim-registry.json";

type BaselineManifest = {
  dataset: string;
  documents: number;
  questions: number;
  tests_passed: number;
  answer_quality_metrics: Record<string, number> | null;
  c3_results_generated: boolean;
  fallback_metrics_substituted: boolean;
  public_c2_code_synced: boolean;
};

type Claim = {
  id: string;
  display: string;
  status: string;
  source: string;
  source_sha256: string | null;
  boundary: string;
};

type Registry = {
  evidence_mode: string;
  public_repository: {
    url: string;
    baseline_commit: string;
    c2_sync_status: string;
    boundary: string;
  };
  evidence_checkpoint: {
    commit: string;
    visibility: string;
    verification_date: string;
  };
  baseline_manifest: BaselineManifest;
  claims: Claim[];
  forbidden_current_claims: string[];
};

type Difference = {
  key: keyof BaselineManifest;
  baseline: unknown;
  candidate: unknown;
  severity: "critical" | "error" | "warning";
};

type SyntheticDocument = {
  document_id: string;
  title: string;
  content: string;
  source_type: string;
};

type DocumentVerification = {
  normalized: Partial<SyntheticDocument> | null;
  manifest: Record<string, unknown> | null;
  actualFields: string[];
  reasons: string[];
  parseError: string;
};

const baselineDocument: SyntheticDocument = {
  document_id: "SYN-DOC-001",
  title: "  Fictional support policy  ",
  content: "Synthetic returns are accepted within 30 days.\n",
  source_type: "HANDBOOK",
};
const expectedDocumentFields = ["content", "document_id", "source_type", "title"];
const expectedBackendContract = "retrieval-contract-v1";

class CandidateValidationError extends Error {
  readonly displayMessage: string;

  constructor(displayMessage: string) {
    super("Candidate manifest validation failed.");
    this.name = "CandidateValidationError";
    this.displayMessage = displayMessage;
  }
}

const orderedKeys: (keyof BaselineManifest)[] = [
  "dataset",
  "documents",
  "questions",
  "tests_passed",
  "answer_quality_metrics",
  "c3_results_generated",
  "fallback_metrics_substituted",
  "public_c2_code_synced",
];

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, stableValue(child)]));
  }
  return value;
}

function stableJson(value: unknown) {
  return JSON.stringify(stableValue(value));
}

async function sha256(value: unknown) {
  const bytes = new TextEncoder().encode(stableJson(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function mapStructuralStrings(value: unknown, transform: (value: string) => string): unknown {
  if (Array.isArray(value)) return value.map((item) => mapStructuralStrings(item, transform));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .map(([key, child]) => [key, mapStructuralStrings(child, transform)]));
  }
  return typeof value === "string" ? transform(value) : value;
}

function localizedJson(value: unknown, locale: "en" | "zh") {
  return JSON.stringify(mapStructuralStrings(value, (item) => localizeStructuralValue(item, locale)), null, 2);
}

function transformJsonText(text: string, transform: (value: string) => string) {
  try {
    const replacements = new Map<string, string>();
    mapStructuralStrings(JSON.parse(text) as unknown, (value) => {
      const transformed = transform(value);
      if (transformed !== value) replacements.set(JSON.stringify(value), JSON.stringify(transformed));
      return transformed;
    });
    return Array.from(replacements).reduce((current, [source, target]) => current.replaceAll(source, target), text);
  } catch {
    return text;
  }
}

function localizeJsonText(text: string, locale: "en" | "zh") {
  return transformJsonText(text, (value) => localizeStructuralValue(value, locale));
}

function canonicalizeJsonText(text: string) {
  return transformJsonText(text, canonicalizeStructuralValue);
}

function localizeParseError(value: string, locale: "en" | "zh") {
  const localized = localizeStructuralValue(value, locale);
  return locale === "zh" && value && localized === value
    ? userFacingError("invalidJson", locale)
    : localized;
}

function displayValue(value: unknown, locale: "en" | "zh") {
  if (value === null) return "null";
  if (typeof value === "object") return JSON.stringify(mapStructuralStrings(value, (item) => localizeStructuralValue(item, locale)));
  return typeof value === "string" ? localizeStructuralValue(value, locale) : String(value);
}

function normalizeDocument(document: Partial<SyntheticDocument>): Partial<SyntheticDocument> {
  return {
    ...(typeof document.document_id === "string" ? { document_id: document.document_id.trim() } : {}),
    ...(typeof document.title === "string" ? { title: document.title.trim().replace(/\s+/g, " ") } : {}),
    ...(typeof document.content === "string" ? { content: document.content.trim().replace(/\s+/g, " ") } : {}),
    ...(typeof document.source_type === "string" ? { source_type: document.source_type.trim().toLowerCase() } : {}),
  };
}

async function verifySyntheticDocument(text: string, backend: string, baselineContentHash: string): Promise<DocumentVerification> {
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    const actualFields = Object.keys(parsed).sort();
    const normalized = normalizeDocument(parsed as Partial<SyntheticDocument>);
    const missing = expectedDocumentFields.filter((field) => !actualFields.includes(field));
    const contentHash = typeof normalized.content === "string" ? await sha256(normalized.content) : "unavailable";
    const reasons = [
      ...(missing.length ? [`Contract drift: missing ${missing.join(", ")}.`] : []),
      ...(normalized.document_id !== "SYN-DOC-001" ? ["Document ID drift: expected SYN-DOC-001."] : []),
      ...(contentHash !== baselineContentHash ? ["Hash drift: normalized content SHA-256 changed."] : []),
      ...(backend !== expectedBackendContract ? [`Backend contract drift: expected ${expectedBackendContract}.`] : []),
    ];
    const manifest = {
      document_id: normalized.document_id ?? null,
      title: normalized.title ?? null,
      source_type: normalized.source_type ?? null,
      content_bytes: typeof normalized.content === "string" ? new TextEncoder().encode(normalized.content).byteLength : null,
      content_sha256: contentHash,
      backend_contract: backend,
    };
    return { normalized, manifest, actualFields, reasons, parseError: "" };
  } catch (reason) {
    console.error("RAG synthetic document JSON could not be parsed.", reason);
    return { normalized: null, manifest: null, actualFields: [], reasons: [], parseError: "Invalid JSON." };
  }
}

function severityFor(key: keyof BaselineManifest): Difference["severity"] {
  if (["answer_quality_metrics", "c3_results_generated", "fallback_metrics_substituted", "public_c2_code_synced"].includes(key)) return "critical";
  if (key === "tests_passed") return "warning";
  return "error";
}

export default function RagManifestDriftLab() {
  const { locale } = useI18n();
  const [registry, setRegistry] = useState<Registry | null>(null);
  const [candidateText, setCandidateText] = useState("");
  const [candidate, setCandidate] = useState<BaselineManifest | null>(null);
  const [parseError, setParseError] = useState("");
  const [baselineHash, setBaselineHash] = useState("");
  const [candidateHash, setCandidateHash] = useState("");
  const [loadError, setLoadError] = useState(false);
  const [documentText, setDocumentText] = useState(JSON.stringify(baselineDocument, null, 2));
  const [documentBackend, setDocumentBackend] = useState(expectedBackendContract);
  const [documentBaselineHash, setDocumentBaselineHash] = useState("");
  const [documentVerification, setDocumentVerification] = useState<DocumentVerification>({ normalized: null, manifest: null, actualFields: [], reasons: [], parseError: "" });

  useEffect(() => {
    let active = true;
    fetch(REGISTRY_URL).then((response) => {
      if (!response.ok) throw new Error(`Claim registry returned ${response.status}`);
      return response.json() as Promise<Registry>;
    }).then(async (nextRegistry) => {
      if (!active) return;
      const text = JSON.stringify(nextRegistry.baseline_manifest, null, 2);
      setRegistry(nextRegistry);
      setCandidateText(text);
      setCandidate(nextRegistry.baseline_manifest);
      setBaselineHash(await sha256(nextRegistry.baseline_manifest));
      setCandidateHash(await sha256(nextRegistry.baseline_manifest));
      const normalizedBaseline = normalizeDocument(baselineDocument);
      const contentHash = await sha256(normalizedBaseline.content);
      setDocumentBaselineHash(contentHash);
      setDocumentVerification(await verifySyntheticDocument(JSON.stringify(baselineDocument, null, 2), expectedBackendContract, contentHash));
    }).catch((reason: unknown) => {
      console.error("RAG claim registry could not load.", reason);
      if (active) setLoadError(true);
    });
    return () => { active = false; };
  }, []);

  const differences = useMemo<Difference[]>(() => {
    if (!registry || !candidate) return [];
    return orderedKeys.flatMap((key) => stableJson(registry.baseline_manifest[key]) === stableJson(candidate[key]) ? [] : [{ key, baseline: registry.baseline_manifest[key], candidate: candidate[key], severity: severityFor(key) }]);
  }, [candidate, registry]);

  async function verify(text = candidateText) {
    try {
      const parsed = JSON.parse(text) as Record<string, unknown>;
      const missing = orderedKeys.filter((key) => !(key in parsed));
      const extra = Object.keys(parsed).filter((key) => !orderedKeys.includes(key as keyof BaselineManifest));
      if (missing.length || extra.length) throw new CandidateValidationError(`Schema mismatch. Missing: ${missing.join(", ") || "none"}; extra: ${extra.join(", ") || "none"}.`);
      if (typeof parsed.documents !== "number" || typeof parsed.questions !== "number" || typeof parsed.tests_passed !== "number") throw new CandidateValidationError("documents, questions, and tests_passed must be numbers.");
      if (typeof parsed.c3_results_generated !== "boolean" || typeof parsed.fallback_metrics_substituted !== "boolean" || typeof parsed.public_c2_code_synced !== "boolean") throw new CandidateValidationError("Status fields must be booleans.");
      if (parsed.answer_quality_metrics !== null && (typeof parsed.answer_quality_metrics !== "object" || Array.isArray(parsed.answer_quality_metrics))) throw new CandidateValidationError("answer_quality_metrics must be null or an object.");
      const next = parsed as BaselineManifest;
      setCandidate(next);
      setCandidateHash(await sha256(next));
      setParseError("");
    } catch (reason) {
      setCandidate(null);
      setCandidateHash("");
      if (reason instanceof CandidateValidationError) setParseError(reason.displayMessage);
      else {
        console.error("RAG candidate manifest JSON could not be parsed.", reason);
        setParseError("Invalid JSON.");
      }
    }
  }

  function loadScenario(kind: "aligned" | "corpus" | "metric" | "sync") {
    if (!registry) return;
    const next: BaselineManifest = structuredClone(registry.baseline_manifest);
    if (kind === "corpus") next.documents = 11296;
    if (kind === "metric") {
      next.answer_quality_metrics = { synthetic_score: 0.91 };
      next.c3_results_generated = true;
      next.fallback_metrics_substituted = true;
    }
    if (kind === "sync") next.public_c2_code_synced = true;
    const text = JSON.stringify(next, null, 2);
    setCandidateText(text);
    void verify(text);
  }

  async function verifyDocument(text = documentText, backend = documentBackend) {
    const baselineHashValue = documentBaselineHash || await sha256(normalizeDocument(baselineDocument).content);
    setDocumentVerification(await verifySyntheticDocument(text, backend, baselineHashValue));
  }

  function mutateDocument(kind: "reset" | "character" | "id" | "field" | "backend") {
    const next: Partial<SyntheticDocument> = structuredClone(baselineDocument);
    let backend = expectedBackendContract;
    if (kind === "character") next.content = baselineDocument.content.replace("30 days", "31 days");
    if (kind === "id") next.document_id = "SYN-DOC-009";
    if (kind === "field") delete next.title;
    if (kind === "backend") backend = "generation-contract-v2";
    const text = JSON.stringify(next, null, 2);
    setDocumentText(text);
    setDocumentBackend(backend);
    void verifyDocument(text, backend);
  }

  if (loadError) return <div className="rag-lab-loading error"><CircleAlert aria-hidden="true" />{userFacingError("registry", locale)}</div>;
  if (!registry) return <div className="rag-lab-loading" aria-live="polite">{locale === "en" ? "Loading claim registry..." : "正在载入声明注册表……"}</div>;

  const passed = candidate !== null && differences.length === 0;
  const localizedCandidateText = localizeJsonText(candidateText, locale);
  const localizedDocumentText = localizeJsonText(documentText, locale);
  const localizedParseError = localizeParseError(parseError, locale);
  const localizedDocumentParseError = localizeParseError(documentVerification.parseError, locale);

  return (
    <section className="rag-drift-lab" data-testid="rag-drift-lab" aria-labelledby="rag-drift-title">
      <header className="rag-lab-header">
        <div><p className="eyebrow">{locale === "en" ? "Deterministic verifier" : "确定性校验"}</p><h3 id="rag-drift-title">{locale === "en" ? "Manifest & Drift Lab" : "清单与漂移实验室"}</h3><p>{locale === "en" ? "Compare a candidate public-claim manifest against the locked C2/C3 evaluation record." : "将候选公开声明清单与锁定的 C2/C3 评估记录进行比较。"}</p></div>
        <div className="rag-lab-disclosure"><ScanSearch aria-hidden="true" /><strong>{locale === "en" ? "Instant browser verification" : "浏览器即时校验"}</strong><span>{locale === "en" ? "Load a scenario and see every manifest difference highlighted deterministically." : "载入情景，即时查看确定性标出的每一项清单差异。"}</span></div>
      </header>

      <div className="rag-version-strip">
        <div><span>{locale === "en" ? "Public baseline" : "公开基线"}</span><code>{registry.public_repository.baseline_commit}</code><strong>{locale === "en" ? "C2 sync pending" : "C2 同步待完成"}</strong></div>
        <div><span>{locale === "en" ? "Evidence checkpoint" : "证据检查点"}</span><code>{registry.evidence_checkpoint.commit}</code><strong>{localizeStructuralValue(registry.evidence_checkpoint.visibility, locale)}</strong></div>
      </div>

      <div className="rag-scenario-bar" aria-label={locale === "en" ? "Candidate manifest scenarios" : "候选清单场景"}>
        <span>{locale === "en" ? "Load candidate" : "载入候选"}</span>
        <button type="button" onClick={() => loadScenario("aligned")}><Check aria-hidden="true" />{locale === "en" ? "Aligned" : "一致"}</button>
        <button type="button" onClick={() => loadScenario("corpus")}><TriangleAlert aria-hidden="true" />{locale === "en" ? "Corpus drift" : "语料漂移"}</button>
        <button type="button" onClick={() => loadScenario("metric")}><TriangleAlert aria-hidden="true" />{locale === "en" ? "Metric leak" : "指标泄漏"}</button>
        <button type="button" onClick={() => loadScenario("sync")}><TriangleAlert aria-hidden="true" />{locale === "en" ? "Sync overclaim" : "同步过度声明"}</button>
      </div>

      <div className="rag-lab-grid">
        <div className="rag-editor-pane">
          <div className="rag-pane-heading"><div><span>{locale === "en" ? "Candidate manifest" : "候选清单"}</span><code>{candidateHash ? `${candidateHash.slice(0, 12)}...` : (locale === "en" ? "invalid" : "无效")}</code></div><button type="button" onClick={() => void verify()}><RefreshCw aria-hidden="true" />{locale === "en" ? "Verify" : "校验"}</button></div>
          <textarea aria-label={locale === "en" ? "Candidate manifest JSON" : "候选清单 JSON"} spellCheck="false" value={localizedCandidateText} onChange={(event) => setCandidateText(canonicalizeJsonText(event.target.value))} />
          {parseError ? <p className="rag-parse-error"><CircleAlert aria-hidden="true" />{localizedParseError}</p> : <p className="rag-hash-note"><FileCheck2 aria-hidden="true" />SHA-256 {candidateHash}</p>}
        </div>

        <div className="rag-diff-pane">
          <div className={`rag-verdict ${passed ? "pass" : "fail"}`}>{passed ? <ShieldCheck aria-hidden="true" /> : <TriangleAlert aria-hidden="true" />}<div><span>{locale === "en" ? "Deterministic verdict" : "确定性结论"}</span><strong>{passed ? (locale === "en" ? "No claim drift" : "无声明漂移") : parseError ? (locale === "en" ? "Invalid candidate" : "候选无效") : (locale === "en" ? `${differences.length} drift item${differences.length === 1 ? "" : "s"}` : `${differences.length} 项漂移`)}</strong></div></div>
          <div className="rag-baseline-hash"><span>{locale === "en" ? "Locked baseline SHA-256" : "锁定基线 SHA-256"}</span><code>{baselineHash}</code></div>
          <div className="rag-diff-list" data-testid="rag-diff-list">
            {candidate && differences.length === 0 ? <p><Check aria-hidden="true" />{locale === "en" ? "Counts, result status, fallback status, and public-sync status match the registry." : "计数、结果状态、回退状态与公开同步状态均匹配注册表。"}</p> : differences.map((difference) => <article key={difference.key} className={difference.severity}><div><strong>{difference.key}</strong><span>{localizeStructuralValue(difference.severity, locale)}</span></div><code>{displayValue(difference.baseline, locale)}</code><span aria-hidden="true">→</span><code>{displayValue(difference.candidate, locale)}</code></article>)}
          </div>
        </div>
      </div>

      <div className="rag-document-lab" data-testid="rag-document-lab">
        <div className="rag-document-header"><div><span>{locale === "en" ? "Deterministic verifier" : "确定性校验"}</span><h4>{locale === "en" ? "Synthetic document normalization & drift" : "合成文档规范化与漂移"}</h4><p>{locale === "en" ? "Normalize one fictional document, build its manifest entry with Web Crypto, then mutate one contract surface." : "规范化一份虚构文档，以 Web Crypto 构建其清单条目，再对单一受契约约束的方面进行变更。"}</p></div><div><button type="button" onClick={() => mutateDocument("reset")}><RefreshCw aria-hidden="true" />{locale === "en" ? "Reset" : "重置"}</button><button type="button" onClick={() => mutateDocument("character")}>{locale === "en" ? "Edit one character" : "修改一个字符"}</button><button type="button" onClick={() => mutateDocument("id")}>{locale === "en" ? "Change document ID" : "修改文档 ID"}</button><button type="button" onClick={() => mutateDocument("field")}>{locale === "en" ? "Delete title field" : "删除标题字段"}</button><button type="button" onClick={() => mutateDocument("backend")}>{locale === "en" ? "Change backend contract" : "修改后端契约"}</button></div></div>
        <div className="rag-document-grid">
          <section><div className="rag-pane-heading"><div><span>{locale === "en" ? "Synthetic input" : "合成输入"}</span><code>{locale === "en" ? "fictional" : "虚构"}</code></div><button type="button" onClick={() => void verifyDocument()}><ScanSearch aria-hidden="true" />{locale === "en" ? "Normalize + verify" : "规范化 + 校验"}</button></div><textarea aria-label={locale === "en" ? "Synthetic document JSON" : "合成文档 JSON"} value={localizedDocumentText} spellCheck="false" onChange={(event) => setDocumentText(canonicalizeJsonText(event.target.value))} /><label className="rag-backend-contract"><span>{locale === "en" ? "Actual backend contract" : "实际后端契约"}</span><input aria-label={locale === "en" ? "Actual backend contract" : "实际后端契约"} value={documentBackend} onChange={(event) => setDocumentBackend(event.target.value)} /></label></section>
          <section><div className="rag-pane-heading"><div><span>{locale === "en" ? "Normalized output" : "规范化输出"}</span><code>{locale === "en" ? "trim + lowercase source" : "去除首尾空白 + 来源字段转小写"}</code></div></div><pre data-testid="rag-normalized-document">{documentVerification.normalized ? localizedJson(documentVerification.normalized, locale) : localizedDocumentParseError}</pre><div className="rag-contract-compare"><div><span>{locale === "en" ? "Expected contract" : "预期契约"}</span><code>{expectedDocumentFields.join(" · ")}</code><code>{expectedBackendContract}</code></div><div><span>{locale === "en" ? "Actual contract" : "实际契约"}</span><code>{documentVerification.actualFields.join(" · ") || (locale === "en" ? "invalid" : "无效")}</code><code>{documentBackend}</code></div></div></section>
          <section><div className="rag-pane-heading"><div><span>{locale === "en" ? "Manifest entry" : "清单条目"}</span><code>Web Crypto SHA-256</code></div></div><pre data-testid="rag-document-manifest">{documentVerification.manifest ? localizedJson(documentVerification.manifest, locale) : (locale === "en" ? "No manifest" : "暂无清单")}</pre><div className={`rag-document-verdict ${documentVerification.reasons.length || documentVerification.parseError ? "fail" : "pass"}`}>{documentVerification.reasons.length || documentVerification.parseError ? <TriangleAlert aria-hidden="true" /> : <ShieldCheck aria-hidden="true" />}<div><span>{locale === "en" ? "Verifier result" : "校验结果"}</span><strong>{documentVerification.parseError ? (locale === "en" ? "Invalid JSON" : "JSON 无效") : documentVerification.reasons.length ? (locale === "en" ? `${documentVerification.reasons.length} drift reason${documentVerification.reasons.length === 1 ? "" : "s"}` : `${documentVerification.reasons.length} 项漂移原因`) : (locale === "en" ? "Pass — no drift" : "通过 — 无漂移")}</strong>{documentVerification.parseError ? <p>{localizedDocumentParseError}</p> : documentVerification.reasons.map((reason) => <p key={reason}>{localizeStructuralValue(reason, locale)}</p>)}</div></div></section>
        </div>
        <p className="rag-document-baseline"><FileCheck2 aria-hidden="true" /><span>{locale === "en" ? "Expected normalized content SHA-256" : "预期规范化内容 SHA-256"}</span><code>{documentBaselineHash}</code></p>
      </div>

      <div className="rag-claim-registry">
        <div className="rag-registry-head"><strong>{locale === "en" ? "Current result registry" : "当前声明注册表"}</strong><ArtifactLink href={REGISTRY_URL}>{locale === "en" ? "View JSON" : "查看 JSON"}</ArtifactLink></div>
        {registry.claims.map((claim) => <article key={claim.id}><div><code>{claim.id}</code><strong>{localizeStructuralValue(claim.display, locale)}</strong></div><span>{localizeStructuralValue(claim.source, locale)}</span></article>)}
      </div>
    </section>
  );
}
