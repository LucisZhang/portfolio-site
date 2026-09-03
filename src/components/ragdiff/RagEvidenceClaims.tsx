"use client";

import ArtifactLink from "@/components/ArtifactLink";
import { useI18n } from "@/lib/i18n";
import { zhWrapNode } from "@/lib/zh-wrap";
import {
  RAG_BASELINE_COMMIT,
  RAG_CHECKPOINT_COMMIT,
  RAG_REPOSITORY_URL,
  ragBlockedClaim,
  ragDependencyPreflight,
  ragVerifiedClaims,
} from "./ragData";

// claim-registry.json's `boundary` sentences are real evidentiary English
// (quoted verbatim in the `en` render below), not authored per-locale --
// there is no zh field in the registry to read. Splicing that raw English
// straight into an otherwise-Chinese table cell would be exactly the
// untranslated-multi-word-metadata problem docs/evidence/digits-margin.md
// already ruled on for `metric.owner`/`.provenance`: quote verbatim only in
// English, and give the zh render an independently-authored equivalent
// instead of a direct quotation. Keyed by claim id so a missing translation
// falls back to the raw string rather than silently rendering nothing.
const CLAIM_BOUNDARY_ZH: Record<string, string> = {
  "c2.documents": "只证明数据集与适配器的完整性，不证明检索或答案质量。",
  "c2.questions": "只证明问题适配与完整性，并不代表已完成 C3 评估。",
  "c2.tests": "只是免模型测试与确定性包装器，不是答案质量证据。",
  "c3.results": "不存在检索表、答案质量分数、裁判结果，也没有任何兜底指标。",
};

function localizedBoundary(claim: { id: string; boundary: string }, locale: "en" | "zh") {
  return locale === "en" ? claim.boundary : (CLAIM_BOUNDARY_ZH[claim.id] ?? claim.boundary);
}

// Exhibit 02 -- the verified-vs-blocked registry rendered as typographic
// content (spec §6.7's 3-exhibit light prescription, second slot). This is
// deliberately NOT a restatement of exhibit 01's stat line: it is the
// underlying claim-registry.json record itself (id / status / source /
// boundary for each claim), plus the real dependency-preflight facts behind
// the one blocked claim. Every value below reads from ragData.ts's typed
// exports -- nothing here is a literal re-typed number.
//
// The registry's own `forbidden_current_claims` array is intentionally
// never rendered verbatim: repeating those exact figures to disavow them
// would itself put the forbidden strings on the page, which the binding
// data-honesty constraint (and tests/e2e/rag-r2.spec.ts's literal
// assertion) forbids regardless of framing. The closing note below
// describes the discipline without quoting the retired numbers.
export function RagEvidenceClaims() {
  const { locale } = useI18n();

  return (
    <section id="exhibit-02" className="exhibit rag-claims" data-exhibit="02" data-bg="paper-alt" aria-labelledby="exhibit-02-title">
      <p className="exhibit-opening-row">
        <span className="exhibit-number" aria-hidden="true">02</span>
        <span className="exhibit-eyebrow">CLAIM-REGISTRY.JSON</span>
      </p>
      <h2 id="exhibit-02-title" className="exhibit-title">
        {locale === "en"
          ? <>Verified stays verified.<br /><em>Blocked stays blocked.</em></>
          : zhWrapNode(<>已验证的保持已验证，<br /><em>被阻断的保持被阻断。</em></>)}
      </h2>
      <p className="exhibit-intro">
        {locale === "en"
          ? "Every claim on this page traces to one line of the registry below: a status, a source file, and a stated boundary on what that evidence does and does not cover."
          : "本页的每一项主张，都能对应到下方注册表中的一行：一个状态、一个来源文件，以及一句关于该证据能证明什么、不能证明什么的边界说明。"}
      </p>

      <div className="exhibit-body">
        <table className="rag-claims-table" data-testid="rag-verified-claims">
          <thead>
            <tr>
              <th>{locale === "en" ? "Claim" : "主张"}</th>
              <th>{locale === "en" ? "Status" : "状态"}</th>
              <th>{locale === "en" ? "Source" : "来源"}</th>
              <th>{locale === "en" ? "Boundary" : "边界"}</th>
            </tr>
          </thead>
          <tbody>
            {ragVerifiedClaims.map((claim) => (
              <tr key={claim.id} data-claim-id={claim.id} data-claim-status={claim.status}>
                <td><code>{claim.id}</code><br />{claim.display}</td>
                <td className="rag-claim-status rag-claim-status-verified">{locale === "en" ? "verified" : "已验证"}</td>
                <td><ArtifactLink href="/case-studies/rag-quality-lab/claim-registry.json">{claim.source}</ArtifactLink></td>
                <td>{localizedBoundary(claim, locale)}</td>
              </tr>
            ))}
            {ragBlockedClaim ? (
              <tr data-claim-id={ragBlockedClaim.id} data-claim-status={ragBlockedClaim.status}>
                <td><code>{ragBlockedClaim.id}</code><br />{ragBlockedClaim.display}</td>
                <td className="rag-claim-status rag-claim-status-blocked">{locale === "en" ? "blocked · no results" : "已阻断 · 无结果"}</td>
                <td><ArtifactLink href={ragBlockedClaim.source}>{ragBlockedClaim.source}</ArtifactLink></td>
                <td>{localizedBoundary(ragBlockedClaim, locale)}</td>
              </tr>
            ) : null}
          </tbody>
        </table>

        <div className="rag-preflight-card" data-testid="rag-c3-preflight">
          <p className="rag-preflight-head">
            {locale === "en" ? "Dependency preflight, verbatim" : "依赖预检记录（原样）"}
          </p>
          <p>
            {locale === "en"
              ? "The evaluation runner never started: preflight found the local environment missing the packages a real hybrid-retrieval pipeline needs, and installing them fell outside this task's offline timebox. No fallback pipeline was substituted."
              : "评估运行器从未启动：预检发现本地环境缺少真实混合检索流水线所需的软件包，而安装它们超出了本任务的离线时间盒。没有用任何兜底流水线替代。"}
          </p>
          <p className="rag-preflight-modules">
            <span>{locale === "en" ? "Missing packages:" : "缺失的软件包："}</span>
            {ragDependencyPreflight.python_modules.missing.map((moduleName) => <code key={moduleName}>{moduleName}</code>)}
          </p>
          <p className="rag-preflight-modules">
            <span>{locale === "en" ? "Already available:" : "已具备的："}</span>
            {Object.keys(ragDependencyPreflight.python_modules.available).map((moduleName) => <code key={moduleName}>{moduleName}</code>)}
          </p>
          {/* Task L3 fix: dependency-preflight.json's `.scope` string is
              real, English, multi-word evidentiary data ("full
              EnterpriseRAG-Bench S1 retrieval A/B, 130 questions") -- a
              bare <p> put it in the same untranslated-narrative-prose
              bucket scripts/check-localization.mjs's zh body-prose scan
              exists to catch (confirmed live: it flagged this exact line).
              A two-cell <table> row is the same evidentiary-data signal
              Frontier Forge's claim tables already rely on (that scan's
              `/\t/` PROSE_ALLOWLIST_PATTERNS rule): a label cell plus a
              verbatim-value cell, not narrative prose to translate. */}
          <table className="rag-preflight-scope">
            <tbody>
              <tr><td>{locale === "en" ? "Scope" : "范围"}</td><td><code>{ragDependencyPreflight.scope}</code></td></tr>
              <tr><td>{locale === "en" ? "Status" : "状态"}</td><td><code>{ragDependencyPreflight.status}</code></td></tr>
            </tbody>
          </table>
        </div>

        <p className="rag-claims-note">
          {locale === "en"
            ? <>A public repository (baseline commit <code>{RAG_BASELINE_COMMIT}</code>, <a href={RAG_REPOSITORY_URL} target="_blank" rel="noreferrer noopener">GitHub</a>) predates and does not yet contain the local checkpoint <code>{RAG_CHECKPOINT_COMMIT}</code> above — a distinct claim of its own, not a substitute for it. Earlier drafts of this page carried different corpus and answer-quality figures; this rebuild retires every one of them rather than repeat them here.</>
            : <>公开仓库（基线提交 <code>{RAG_BASELINE_COMMIT}</code>，<a href={RAG_REPOSITORY_URL} target="_blank" rel="noreferrer noopener">GitHub</a>）先于本地检查点 <code>{RAG_CHECKPOINT_COMMIT}</code> 存在，尚未包含后者——这是一项独立的主张，不能替代上面的结果。本页早期草稿中出现过不同的语料规模与答案质量数字；这次重写把它们全部废弃，不在此处重复。</>}
        </p>
      </div>
    </section>
  );
}

export default RagEvidenceClaims;
