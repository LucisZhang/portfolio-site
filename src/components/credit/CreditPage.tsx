"use client";

import methodsEvidence from "../../../public/case-studies/credit-policy-desk/methods-evidence.json";
import { EvidenceDisclosure } from "@/components/exhibition/EvidenceDisclosure";
import { EvidenceFileLink } from "@/components/exhibition/EvidenceFileLink";
import AnalyticsMethods from "@/components/analytics/AnalyticsMethods";
import { ProjectReport, ProjectReportContents } from "@/components/report/ProjectReport";
import LocaleDocumentMetadata from "@/components/LocaleDocumentMetadata";
import ScrollRegion from "@/components/ScrollRegion";
import { useI18n } from "@/lib/i18n";
import type { Project } from "@/lib/projects";
import { siteIdentity } from "@/lib/site-config";
import { zhGroup, zhWrapDisplay } from "@/lib/zh-wrap";
import "./credit.css";
import { CreditDecisionBoundary } from "./CreditDecisionBoundary";
import { CreditNegativeResults } from "./CreditNegativeResults";
import { CreditPolicyFrontier } from "./CreditPolicyFrontier";
import { CREDIT_RECEIPTS, CREDIT_REPRODUCE_COMMANDS, CREDIT_VERIFY_SQL } from "./creditReceipts";
import { CreditVerify } from "./CreditVerify";

// Credit Policy Desk — chart-led Evidence page (task L4 [CLAUDE], spec
// §6.7 "Margin/Credit(归档)": 4 exhibits capped, Evidence 形态 not
// workbench 形态). Composition mirrors src/components/margin/MarginPage.tsx
// exactly: exhibit 01 (policy frontier, folds the hero assertion/stat-band/
// figure into one first screen per the user-approved mock output/
// design-legacy/legacy-6-credit-policy-desk.html) -> 02 decision boundary +
// policy contract -> 03 negative-result/LGD honesty -> 04 source & receipts
// (click-gated DuckDB verify, methods report) -> report layer (Architecture
// / Results & negatives / Limitations, read straight from projects.ts like
// every other rebuilt page). The pre-rebuild interactive workbench
// (src/components/analytics/CreditPolicyLab.tsx: source toggle, vintage
// picker, capacity slider, calibration/PSI/reason-code panels) is unrouted
// by this task, not deleted -- see task-L4-report.md for the old-assertion
// replacement inventory.
export default function CreditPage({ project }: { project: Project }) {

  return (
    <div className="credit-page" data-testid="credit-policy-desk">
      <LocaleDocumentMetadata
        title={{ en: `${project.title.en} | ${siteIdentity.name}`, zh: `${project.title.zh} | ${siteIdentity.chineseName}` }}
        description={project.summary}
      />
      <ProjectReportContents />

      <CreditPolicyFrontier />
      <CreditDecisionBoundary />
      <CreditNegativeResults />
      <SourceReceipts />

      <ProjectReport project={project} />
    </div>
  );
}

function SourceReceipts() {
  const { locale } = useI18n();
  return (
    <section id="exhibit-04" className="exhibit credit-receipts" data-exhibit="04" data-bg="ink" aria-labelledby="exhibit-04-title">
      <p className="exhibit-opening-row">
        <span className="exhibit-number" aria-hidden="true">04</span>
        <span className="exhibit-eyebrow">SOURCE / RECEIPTS</span>
      </p>
      <h2 id="exhibit-04-title" className="exhibit-title">
        {locale === "en" ? (
          <>Every number opens<br /><em>the same file.</em></>
        ) : (
          zhWrapDisplay(<>每个数字，<br /><em>{zhGroup("都能点开", "同一份文件。")}</em></>)
        )}
      </h2>
      <div className="exhibit-body">
        <EvidenceDisclosure project="credit">
        <dl className="credit-receipts-dl">
          {Object.entries(CREDIT_RECEIPTS).map(([key, receipt]) => (
            <div key={key}>
              <dt><EvidenceFileLink source={receipt.path} /></dt>
              <dd><code>sha256:{receipt.sha256}</code></dd>
            </div>
          ))}
        </dl>

        <CreditVerify />

        <details className="credit-verify-sql">
          <summary>{locale === "en" ? "View verification SQL" : "查看验证 SQL"}</summary>
          <ScrollRegion as="pre" label={{ en: "Verification SQL", zh: "验证 SQL" }}><code>{CREDIT_VERIFY_SQL}</code></ScrollRegion>
          <p>
            {locale === "en"
              ? "This query re-reads the exact committed Parquet bytes in your browser and checks their SHA-256. The logistic/XGBoost training, isotonic calibration, and policy-frontier derivation behind exhibits 01–03 run offline in Python (reproduce commands below), not live in this SQL."
              : "这条查询会在你的浏览器里重新读取完全相同的已提交 Parquet 字节，并核对其 SHA-256。展品 01–03 背后的逻辑回归/XGBoost 训练、保序校准与策略前沿推导，均在离线的 Python 环境中完成（复现命令见下），不是这条 SQL 现场算出来的。"}
          </p>
        </details>

        <p className="credit-pipe-note">
          {locale === "en"
            ? "scored-backtest.parquet, backtest-report.json, and methods-evidence.json are produced by the pipeline below from a licensed Lending Club source lock; credit-backtest-compact.json and policy-frontier-report.json are derived from that same committed artifact by two npm scripts. docs/evidence/digits-credit.md pins every number on this page to one of these files."
            : "scored-backtest.parquet、backtest-report.json 与 methods-evidence.json 均由下方流水线从已授权的 Lending Club 源锁定生成；credit-backtest-compact.json 与 policy-frontier-report.json 则由两个 npm 脚本从同一份已提交产物派生而来。docs/evidence/digits-credit.md 把本页每个数字都固定映射到其中一个文件。"}
        </p>
        <ScrollRegion as="p" className="credit-reproduce-command" label={{ en: "Reproduce commands", zh: "复现命令" }}>
          {CREDIT_REPRODUCE_COMMANDS.map((command) => <code key={command}>{command}</code>)}
        </ScrollRegion>

        <p><EvidenceFileLink source="public/case-studies/credit-policy-desk/methods-evidence.json" /></p>
        <AnalyticsMethods project="credit" committedEvidence={methodsEvidence} />
        </EvidenceDisclosure>
      </div>
    </section>
  );
}
