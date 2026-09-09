"use client";

import { EvidenceDisclosure } from "@/components/exhibition/EvidenceDisclosure";
import { EvidenceFileLink } from "@/components/exhibition/EvidenceFileLink";

import { useI18n } from "@/lib/i18n";
import type { Project } from "@/lib/projects";
import { zhGroup, zhWrapDisplay } from "@/lib/zh-wrap";
import { RAG_BASELINE_COMMIT, RAG_RECEIPTS } from "./ragData";

// Exhibit 03 -- SOURCE / RECEIPTS (spec §6.7's 3-exhibit light
// prescription, third slot). Same convention as MarginPage.tsx's
// SourceReceipts: a plain receipts <dl> of path + sha256 for the two files
// every number and every honesty claim on this page traces back to, read
// straight from ragData.ts's RAG_RECEIPTS (docs/evidence/digits-rag.md is
// the audit trail for how those three hashes were computed). There is no
// click-gated re-verification step here the way Margin's DuckDB button
// re-hashes a multi-hundred-KB Parquet file in-browser -- these two JSON
// files are small enough that the receipts table plus a direct artifact-
// viewer link (which renders and lets a visitor download the exact bytes)
// is the proportionate amount of proof, not a redundant second hashing
// pass over content this small.
export function RagSourceReceipts({ repository }: Pick<Project, "repository">) {
  const { locale } = useI18n();

  return (
    <section id="exhibit-03" className="exhibit rag-receipts" data-exhibit="03" data-bg="ink" aria-labelledby="exhibit-03-title">
      <p className="exhibit-opening-row">
        <span className="exhibit-number" aria-hidden="true">03</span>
        <span className="exhibit-eyebrow">SOURCE · RECEIPTS</span>
      </p>
      <h2 id="exhibit-03-title" className="exhibit-title">
        {locale === "en"
          ? <>Every number opens<br /><em>the same file.</em></>
          : zhWrapDisplay(<>每个数字，<br /><em>{zhGroup("都能点开", "同一份文件。")}</em></>)}
      </h2>
      <div className="exhibit-body">
        <EvidenceDisclosure project="rag">
        <dl className="rag-receipts-dl" data-testid="rag-receipts-list">
          {RAG_RECEIPTS.map((receipt) => (
            <div key={receipt.path}>
              <dt><EvidenceFileLink source={receipt.path} /></dt>
              <dd><code>sha256:{receipt.sha256}</code></dd>
            </div>
          ))}
        </dl>

        <p>
          {locale === "en"
            ? "claim-registry.json carries every verified and blocked claim on this page; dependency-preflight.json and its README are the record of why C3 closed without metrics. docs/evidence/digits-rag.md pins every number on this page to one of these files."
            : "claim-registry.json 记录了本页每一项已验证与被阻断的主张；dependency-preflight.json 及其 README 记录了 C3 为何在没有产出指标的情况下关闭。docs/evidence/digits-rag.md 把本页每个数字都固定映射到其中一份文件。"}
        </p>
        <p className="rag-repo-link">
          {repository.status === "public" ? (
            <a href={`${repository.href}/tree/${RAG_BASELINE_COMMIT}`} target="_blank" rel="noreferrer noopener">
              {locale === "en" ? "Published baseline" : "已发布的基线"}
            </a>
          ) : (locale === "en" ? "Published baseline" : "已发布的基线")}
          {locale === "en"
            ? <> — baseline commit <code>{RAG_BASELINE_COMMIT}</code>, published ahead of the local evidence checkpoint above.</>
            : <>——基线提交 <span className="zh-inline-atomic" data-zh-raw><code>{RAG_BASELINE_COMMIT}</code>，</span>先于上方的本地证据检查点发布。</>}
        </p>
        </EvidenceDisclosure>
      </div>
    </section>
  );
}

export default RagSourceReceipts;
