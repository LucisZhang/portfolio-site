"use client";

import methodsEvidence from "../../../public/case-studies/margin-control-tower/methods-evidence.json";
import { EvidenceDisclosure } from "@/components/exhibition/EvidenceDisclosure";
import { EvidenceFileLink } from "@/components/exhibition/EvidenceFileLink";
import AnalyticsMethods from "@/components/analytics/AnalyticsMethods";
import { ProjectReport } from "@/components/report/ProjectReport";
import LocaleDocumentMetadata from "@/components/LocaleDocumentMetadata";
import ScrollRegion from "@/components/ScrollRegion";
import { useI18n } from "@/lib/i18n";
import { zhGroup, zhWrapDisplay } from "@/lib/zh-wrap";
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

      <ProjectReport project={project} />
    </div>
  );
}

function SourceReceipts() {
  const { locale } = useI18n();
  return (
    <section id="exhibit-04" className="exhibit margin-receipts" data-exhibit="04" data-bg="ink" aria-labelledby="exhibit-04-title">
      <p className="exhibit-opening-row">
        <span className="exhibit-number" aria-hidden="true">04</span>
        <span className="exhibit-eyebrow">SOURCE · RECEIPTS</span>
      </p>
      <h2 id="exhibit-04-title" className="exhibit-title">
        {locale === "en" ? (
          <>Every number opens<br /><em>the same file.</em></>
        ) : (
          zhWrapDisplay(<>每个数字，<br /><em>{zhGroup("都能点开", "同一份文件。")}</em></>)
        )}
      </h2>
      <div className="exhibit-body">
        <EvidenceDisclosure project="margin">
        <dl className="margin-receipts-dl">
          {Object.entries(MARGIN_RECEIPTS).map(([key, receipt]) => (
            <div key={key}>
              <dt><EvidenceFileLink source={receipt.path} /></dt>
              <dd><code>sha256:{receipt.sha256}</code></dd>
            </div>
          ))}
        </dl>

        <MarginVerify />

        <details className="margin-verify-sql">
          <summary>{locale === "en" ? "View verification SQL" : "查看验证 SQL"}</summary>
          <ScrollRegion as="pre" label={{ en: "Verification SQL", zh: "验证 SQL" }}><code>{MARGIN_VERIFY_SQL}</code></ScrollRegion>
          <p>
            {locale === "en"
              // copy-lint: allow robust -- statistical method name (STL + robust z-score, DetectionPanel.tsx precedent)
              ? "This query re-reads the exact committed Parquet bytes in your browser and checks their SHA-256. The STL decomposition and robust z-scoring behind exhibit 01 run offline in Python (reproduce commands below), not live in this SQL."
              : "这条查询会在你的浏览器里重新读取完全相同的已提交 Parquet 字节，并核对其 SHA-256。展品 01 背后的 STL 分解与稳健 z 值计算是在离线的 Python 环境中完成的（复现命令见下），不是这条 SQL 现场算出来的。"}
          </p>
        </details>

        <p className="margin-pipe-note">
          {locale === "en"
            ? "olist-margin.parquet, detection-report.json, and elasticity-report.json are produced by the pipeline below from a licensed Olist source lock; metric-registry.json is a hand-authored governance file. docs/evidence/digits-margin.md pins every number on this page to one of these files."
            : "olist-margin.parquet、detection-report.json 与 elasticity-report.json 均由下方流水线从已授权的 Olist 源锁定生成；metric-registry.json 为人工撰写的治理文件。docs/evidence/digits-margin.md 把本页每个数字都固定映射到其中一个文件。"}
        </p>
        <ScrollRegion as="p" className="margin-reproduce-command" label={{ en: "Reproduce commands", zh: "复现命令" }}>
          {MARGIN_REPRODUCE_COMMANDS.map((command) => <code key={command}>{command}</code>)}
        </ScrollRegion>

        <p><EvidenceFileLink source="public/case-studies/margin-control-tower/methods-evidence.json" /></p>
        <AnalyticsMethods project="margin" committedEvidence={methodsEvidence} />
        </EvidenceDisclosure>
      </div>
    </section>
  );
}
