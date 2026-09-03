"use client";

import { LocalizedText, useI18n } from "@/lib/i18n";
import { zhWrapNode } from "@/lib/zh-wrap";
import { getProject } from "@/lib/projects";
import { crossoverReceipts, type CrossoverReceipt } from "./crossoverCurvesData";

const crossoverProject = getProject("engineering", "crossover-study");

// Task L6 [CLAUDE]: exhibit 03, SOURCE/RECEIPTS -- the six source-run
// receipts the pre-rebuild CrossoverExhibit.tsx already carried (ported
// verbatim, restyled to the plain hairline-list Evidence grammar instead
// of the retired ink-box grid), plus `projects.ts`'s own `provenance` field
// as the narrative that names which receipt backs which exhibit-02 curve --
// one of this task's 4-of-8 report-layer modules (see task-L6-report.md).
function ReceiptDetails({ receipt }: { receipt: CrossoverReceipt }) {
  const { locale } = useI18n();
  return (
    <details className="crossover-receipt" data-receipt={receipt.run_id}>
      <summary><code>{receipt.run_id}</code><span>{receipt.model?.name ?? receipt.kind}</span></summary>
      <dl>
        <div><dt>git SHA</dt><dd><code>{receipt.git_sha}</code></dd></div>
        <div><dt>{locale === "en" ? "Recorded" : "记录时间"}</dt><dd>{receipt.run_ts}</dd></div>
        <div><dt>{locale === "en" ? "Config" : "配置"}</dt><dd><code>{receipt.config_path ?? "—"}</code></dd></div>
        <div><dt>config SHA-256</dt><dd><code>{receipt.config_hash}</code></dd></div>
        <div><dt>dataset SHA-256</dt><dd><code>{receipt.dataset_manifest_hash}</code></dd></div>
        <div><dt>{locale === "en" ? "Frozen split" : "冻结切分"}</dt><dd>{receipt.splits.frozen_at}</dd></div>
        <div><dt>{locale === "en" ? "Runtime" : "运行耗时"}</dt><dd>{receipt.wall_clock_s.toFixed(3)} s · {receipt.hardware}</dd></div>
      </dl>
    </details>
  );
}

export function CrossoverSourceReceipts() {
  const { locale } = useI18n();
  if (!crossoverProject) return null;

  return (
    <section id="exhibit-03" className="exhibit crossover-receipts" data-exhibit="03" data-bg="ink" aria-labelledby="exhibit-03-title">
      <p className="exhibit-opening-row">
        <span className="exhibit-number" aria-hidden="true">03</span>
        <span className="exhibit-eyebrow">SOURCE / RECEIPTS</span>
      </p>
      <h1 id="exhibit-03-title" className="exhibit-title">
        {locale === "en" ? <>Every curve opens<br /><em>the same six runs.</em></> : zhWrapNode(<>每条曲线，<br /><em>都能点开同样六次运行。</em></>)}
      </h1>

      <div className="crossover-provenance">
        {crossoverProject.provenance.map((item) => <p key={item.en}><LocalizedText text={item} /></p>)}
      </div>

      <div className="crossover-receipts-list" data-testid="crossover-receipts-list">
        {crossoverReceipts.map((receipt) => <ReceiptDetails receipt={receipt} key={receipt.run_id} />)}
      </div>

      <p className="crossover-digits-note">
        {locale === "en"
          ? "docs/evidence/digits-crossover.md pins every number on this page to one of these six runs or to the cached workbench's own committed JSON files."
          : "docs/evidence/digits-crossover.md 把本页每个数字都固定映射到这六次运行之一，或缓存工作台自身已提交的 JSON 文件。"}
      </p>

      <p className="crossover-links">
        {crossoverProject.links.map((link, index) => link.href ? (
          <a key={link.href} href={link.href} target="_blank" rel="noreferrer noopener">
            <LocalizedText text={link.label} />
          </a>
        ) : <span key={`pending-${index}`} aria-disabled="true"><LocalizedText text={link.label} /></span>)}
      </p>
    </section>
  );
}

export default CrossoverSourceReceipts;
