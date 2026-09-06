"use client";

import { EvidenceDisclosure } from "@/components/exhibition/EvidenceDisclosure";
import { EvidenceFileLink } from "@/components/exhibition/EvidenceFileLink";
import { StatGrid } from "@/components/exhibition/StatGrid";
import { ProjectReport, ProjectReportContents } from "@/components/report/ProjectReport";
import LocaleDocumentMetadata from "@/components/LocaleDocumentMetadata";
import ScrollRegion from "@/components/ScrollRegion";
import { useI18n } from "@/lib/i18n";
import type { Project } from "@/lib/projects";
import { siteIdentity } from "@/lib/site-config";
import { zhGroup, zhWrapDisplay } from "@/lib/zh-wrap";
import "./triage.css";
import { DriftChart } from "./DriftChart";
import { FrontierPareto } from "./FrontierPareto";
import { KnownFailures } from "./KnownFailures";
import { PolicyTerminal } from "./PolicyTerminal";
import { TriageHeroFigure } from "./TriageHeroFigure";
import { TRIAGE_RECEIPTS, TRIAGE_REPRODUCE_COMMAND } from "./triageReceipts";
import { metricsCells } from "./triageFormat";

// Triage Router "market terminal" page (task 3.1, spec section 6.3).
// Standard-scroll composition: hero -> 01 instrument full -> 02 known
// misroutes -> 03 tier frontier -> 04 drift (DriftChart, landed in fix
// round 1 once drift.compact.json shipped) -> 05 SOURCE/RECEIPTS -> report
// layer. Every number on this page traces to
// public/case-studies/triage-router/*.json (imported by PolicyTerminal /
// KnownFailures / FrontierPareto / DriftChart) or
// docs/evidence/digits-triage.md. Case-study/agreement (also named in spec
// section 6.3's "later exhibits" list) remains out of scope: case_study.json
// is still a "TBD" row in docs/evidence/r2-source-map.md, so this page has
// no exhibit for it rather than fabricating one.
export default function TriagePage({ project }: { project: Project }) {
  const { locale } = useI18n();
  // Fix round 1: derived from project.metrics.en (parsed by
  // triageFormat.ts's metricsCells()) instead of re-typed literals — see
  // that file's comment for why this field, not a compact JSON payload,
  // is the source (the router-vs-baseline delta and the cost delta are not
  // present in any of this page's five compact payloads). English mono
  // labels regardless of locale, matching ForgePage.tsx's own StatGrid
  // precedent (its labels are unconditional English UI fabric too).
  const metricCells = metricsCells(project.metrics.en);

  return (
    <div className="triage-page">
      <LocaleDocumentMetadata
        title={{ en: `${project.title.en} | ${siteIdentity.name}`, zh: `${project.title.zh} | ${siteIdentity.chineseName}` }}
        description={project.summary}
      />
      <ProjectReportContents />

      <section id="hero" data-project-section="hero" className="exhibit triage-hero" data-bg="paper">
        <p className="exhibit-opening-row">
          <span className="exhibit-eyebrow">COST-ACCURACY CASCADE / OFFLINE REPLAY</span>
        </p>
        <div className="triage-hero-grid">
          <div className="triage-hero-copy">
            <h1 id="project-title" className="exhibit-title">
              {locale === "en" ? (
                <>The expensive model<br /><em>was the wrong default.</em></>
              ) : (
                zhWrapDisplay(<>贵的模型，<br /><em>{zhGroup("本就不该是", "默认选项。")}</em></>)
              )}
            </h1>
            {locale === "zh" ? <p className="cn-gloss" lang="zh">{zhWrapDisplay(project.glossZh)}</p> : null}
            <p className="exhibit-intro">{locale === "en" ? project.summary.en : project.summary.zh}</p>
            <StatGrid items={metricCells} />
          </div>
          <div className="triage-hero-instrument">
            <TriageHeroFigure />
          </div>
        </div>
      </section>

      <TriageFullInstrument />
      <KnownFailures />
      <FrontierPareto />
      <DriftChart />
      <SourceReceipts />

      <ProjectReport project={project} />
    </div>
  );
}

function TriageFullInstrument() {
  const { locale } = useI18n();
  return (
    <section id="exhibit-01" className="exhibit" data-exhibit="01" data-bg="paper" aria-labelledby="exhibit-01-title">
      <p className="exhibit-opening-row">
        <span className="exhibit-number" aria-hidden="true">01</span>
        <span className="exhibit-eyebrow">MISROUTE COST / CONFIDENCE THRESHOLD / PRECOMPUTED GRID</span>
      </p>
      <h2 id="exhibit-01-title" className="exhibit-title">
        {locale === "en" ? (
          <>Move the sliders.<br /><em>The strategy rewrites itself.</em></>
        ) : (
          zhWrapDisplay(<>拖动滑块，<br /><em>策略当场重写。</em></>)
        )}
      </h2>
      <div className="exhibit-body">
        <PolicyTerminal variant="full" />
      </div>
    </section>
  );
}

function SourceReceipts() {
  const { locale } = useI18n();
  return (
    <section id="exhibit-05" className="exhibit" data-exhibit="05" data-bg="ink" aria-labelledby="exhibit-05-title">
      <p className="exhibit-opening-row">
        <span className="exhibit-number" aria-hidden="true">05</span>
        <span className="exhibit-eyebrow">SOURCE / RECEIPTS</span>
      </p>
      <h2 id="exhibit-05-title" className="exhibit-title">
        {locale === "en" ? (
          <>Every number opens<br /><em>the same file.</em></>
        ) : (
          zhWrapDisplay(<>每个数字，<br /><em>{zhGroup("都能点开", "同一份文件。")}</em></>)
        )}
      </h2>
      <div className="exhibit-body">
        <EvidenceDisclosure project="triage">
        <dl className="triage-receipts-dl">
          {Object.entries(TRIAGE_RECEIPTS).map(([key, receipt]) => (
            <div key={key}>
              <dt><EvidenceFileLink source={receipt.path} /></dt>
              <dd><code>sha256:{receipt.sha256}</code></dd>
            </div>
          ))}
        </dl>
        <p>
          {locale === "en"
            ? "The compact payloads above are built by Triage Router's export_site_payloads.py from real recorded triage runs; the model file is copied on-site and never enters git. docs/evidence/r2-source-map.md pins every path and hash; npm run verify:r2-sources re-checks them on every run."
            : "以上精简数据均由 Triage Router 项目的 export_site_payloads.py 从真实录得的分流运行构建；模型文件另行拷贝到站内，不进入 git。docs/evidence/r2-source-map.md 固定了每个路径与哈希，npm run verify:r2-sources 每次都会复核。"}
        </p>
        <ScrollRegion as="p" className="triage-reproduce-command" label={{ en: "Reproduce command", zh: "复现命令" }}>
          <code>{TRIAGE_REPRODUCE_COMMAND}</code>
        </ScrollRegion>
        </EvidenceDisclosure>
      </div>
    </section>
  );
}
