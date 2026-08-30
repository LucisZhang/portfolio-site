"use client";

import { Finding } from "@/components/exhibition/Finding";
import AnalyticsMethods from "@/components/analytics/AnalyticsMethods";
import LocaleDocumentMetadata from "@/components/LocaleDocumentMetadata";
import { useI18n } from "@/lib/i18n";
import type { Project } from "@/lib/projects";
import { siteIdentity } from "@/lib/site-config";
import "./margin.css";
import { MarginDecisionBoundary } from "./MarginDecisionBoundary";
import { MarginDetectionFigure } from "./MarginDetectionFigure";
import { MarginNegativeResults } from "./MarginNegativeResults";
import { MARGIN_RECEIPTS, MARGIN_REPRODUCE_COMMANDS, MARGIN_VERIFY_SQL } from "./marginReceipts";
import { MarginVerify } from "./MarginVerify";

// Margin Control Tower — chart-led Evidence page (task L2, spec §6.7
// "Margin/Credit(归档)": 4 exhibits capped, Evidence 形态 not workbench
// 形态). Composition: exhibit 01 (detection figure, folds the hero
// assertion/stat-line/figure into one first screen per the user-approved
// mock output/design-legacy/legacy-5-margin-control-tower.html and the
// Triage Router precedent of not splitting a separate hero exhibit) -> 02
// decision boundary + metric registry -> 03 negative-result/holdout
// honesty -> 04 source & receipts (click-gated DuckDB verify, methods
// report) -> report layer (Architecture / Results & negatives /
// Limitations, read straight from projects.ts like every other rebuilt
// page). The pre-rebuild interactive workbench
// (src/components/analytics/MarginControlTower.tsx: scenario slider,
// heatmap, source toggle, waterfall) is unrouted by this task, not deleted
// -- see task-L2-report.md for the old-assertion replacement inventory.
export default function MarginPage({ project }: { project: Project }) {
  const { locale } = useI18n();

  return (
    <div className="margin-page" data-testid="margin-control-tower">
      <LocaleDocumentMetadata
        title={{ en: `${project.title.en} | ${siteIdentity.name}`, zh: `${project.title.zh} | ${siteIdentity.chineseName}` }}
        description={project.summary}
      />

      <MarginDetectionFigure />
      <MarginDecisionBoundary />
      <MarginNegativeResults />
      <SourceReceipts />

      <section data-project-section="how" className="margin-report-section">
        <h2>{locale === "en" ? "Architecture" : "架构"}</h2>
        <p>{locale === "en" ? project.role.en : project.role.zh}</p>
        <ol className="margin-architecture-flow">
          {project.architecture.map((step, index) => (
            <li key={step.label.en}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong>{locale === "en" ? step.label.en : step.label.zh}</strong>
                <p>{locale === "en" ? step.detail.en : step.detail.zh}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section data-project-section="results" className="margin-report-section">
        <h2>{locale === "en" ? "Results & negatives" : "结果与负结果"}</h2>
        <p className="project-outcome">{locale === "en" ? project.outcome.en : project.outcome.zh}</p>
        {project.fieldNotes?.map((note) => (
          <Finding kind="negative" key={note.en}>
            {locale === "en" ? note.en : note.zh}
          </Finding>
        ))}
      </section>

      <section data-project-section="limitations" className="margin-report-section">
        <h2>{locale === "en" ? "Limitations" : "局限与边界"}</h2>
        {project.boundaries.map((boundary) => (
          <Finding kind="limitation" key={boundary.en}>
            {locale === "en" ? boundary.en : boundary.zh}
          </Finding>
        ))}
      </section>
    </div>
  );
}

function SourceReceipts() {
  const { locale } = useI18n();
  return (
    <section id="exhibit-04" className="exhibit margin-receipts" data-exhibit="04" data-bg="ink" aria-labelledby="exhibit-04-title">
      <p className="exhibit-opening-row">
        <span className="exhibit-number" aria-hidden="true">04</span>
        <span className="exhibit-eyebrow">SOURCE / RECEIPTS</span>
      </p>
      <h2 id="exhibit-04-title" className="exhibit-title">
        {locale === "en" ? (
          <>Every number opens<br /><em>the same file.</em></>
        ) : (
          <>每个数字，<em>都能点开同一份文件。</em></>
        )}
      </h2>
      <div className="exhibit-body">
        <dl className="margin-receipts-dl">
          {Object.entries(MARGIN_RECEIPTS).map(([key, receipt]) => (
            <div key={key}>
              <dt><code>{receipt.path}</code></dt>
              <dd><code>sha256:{receipt.sha256}</code></dd>
            </div>
          ))}
        </dl>

        <MarginVerify />

        <details className="margin-verify-sql">
          <summary>{locale === "en" ? "View verification SQL" : "查看验证 SQL"}</summary>
          <pre><code>{MARGIN_VERIFY_SQL}</code></pre>
          <p>
            {locale === "en"
              // copy-lint: allow robust -- statistical method name (STL + robust z-score, DetectionPanel.tsx precedent)
              ? "This query re-reads the exact committed Parquet bytes in your browser and checks their SHA-256. The STL decomposition and robust z-scoring behind exhibit 01 run offline in Python (reproduce commands below), not live in this SQL."
              : "这条查询会在你的浏览器里重新读取完全相同的已提交 Parquet 字节，并核对其 SHA-256。展品 01 背后的 STL 分解与稳健 z 值计算是在离线的 Python 环境中完成的（复现命令见下），不是这条 SQL 现场算出来的。"}
          </p>
        </details>

        <p>
          {locale === "en"
            ? "olist-margin.parquet, detection-report.json, and elasticity-report.json are produced by the pipeline below from a licensed Olist source lock; metric-registry.json is a hand-authored governance file. docs/evidence/digits-margin.md pins every number on this page to one of these files."
            : "olist-margin.parquet、detection-report.json 与 elasticity-report.json 均由下方流水线从已授权的 Olist 源锁定生成；metric-registry.json 为人工撰写的治理文件。docs/evidence/digits-margin.md 把本页每个数字都固定映射到其中一个文件。"}
        </p>
        <p className="margin-reproduce-command">
          {MARGIN_REPRODUCE_COMMANDS.map((command) => <code key={command}>{command}</code>)}
        </p>
        <p className="margin-repo-link">
          <a href="https://github.com/LucisZhang/margin-control-tower" target="_blank" rel="noreferrer noopener">
            {locale === "en" ? "GitHub repository" : "GitHub 仓库"}
          </a>
        </p>

        <AnalyticsMethods project="margin" />
      </div>
    </section>
  );
}
