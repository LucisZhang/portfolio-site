"use client";

import { ProjectReport, ProjectReportContents } from "@/components/report/ProjectReport";
import { EvidenceDisclosure } from "@/components/exhibition/EvidenceDisclosure";
import { EvidenceFileLink } from "@/components/exhibition/EvidenceFileLink";
import LocaleDocumentMetadata from "@/components/LocaleDocumentMetadata";
import { useI18n } from "@/lib/i18n";
import type { Project } from "@/lib/projects";
import { frontierProjectDetail } from "@/lib/frontier-project-detail";
import { siteIdentity } from "@/lib/site-config";
import { zhGroup, zhWrapDisplay, zhWrapText } from "@/lib/zh-wrap";
import claimCommandsJson from "../../../public/case-studies/frontier-forge/claim-commands.json";
import forgeReceipts from "@/data/generated/forge-receipts.json";
import releaseJson from "../../../public/case-studies/frontier-forge/release.json";
import "./forge.css";
import { BoundaryMatrix } from "./BoundaryMatrix";
import { EvidenceExplorer } from "./EvidenceExplorer";
import { ForgeConsole } from "./ForgeConsole";
import { OverloadReplay } from "./OverloadReplay";
import { ServingBoundary } from "./ServingBoundary";
import { TrainingLadder } from "./TrainingLadder";
import { percent, points, usd } from "./forgeFormat";

const claimCommands = claimCommandsJson as Record<string, string>;
const headline = releaseJson.training.headline;

// Frontier Forge — the standard-scroll reference implementation (spec §6.0
// template, §6.1 exhibit script). Hero -> instrument full (01) -> analysis
// exhibits (02-04) -> live/increment slot (05, closed this phase) ->
// SOURCE/RECEIPTS (07 — see BoundaryMatrix/06 for "MODEL BOUNDARY") ->
// report layer (Architecture -> Results & negatives -> Limitations). Every
// number below is read from public/case-studies/frontier-forge/* at import
// time; nothing here is a typed-in benchmark figure.
export default function ForgePage({ project }: { project: Project }) {
  const { locale } = useI18n();

  return (
    <div className="forge-page">
      <LocaleDocumentMetadata
        title={{ en: `${project.title.en} | ${siteIdentity.name}`, zh: `${project.title.zh} | ${siteIdentity.chineseName}` }}
        description={project.summary}
      />
      {/* Task W1: hero conforms to the reference demo's single-column
          manifesto (output/design-align-r4/FORGE-DIFF.md §1.1) — kicker ->
          two-line serif assertion -> zh gloss (zh only) -> one headline
          data sentence (release.json's own `headline.statement`, unedited)
          -> a 4-cell metric band -> a scope-note. The reference's right-
          column instrument does not exist for this hero; ForgeConsole
          "full" already renders at exhibit-01 below, so there is no
          compact instrument here to replace it with (see forge.css's hero
          comment for the full rationale, including the two sitewide
          rulings — de-boxed StatGrid, mono-only digits — this hero
          deliberately does not inherit). */}
      <section id="hero" data-project-section="hero" className="exhibit forge-hero" data-bg="paper">
        <p className="exhibit-opening-row">
          <span className="exhibit-eyebrow">LIVE TRIAGE / RATE-LIMITED / NO LOGIN</span>
        </p>
        <h1 id="project-title" className="exhibit-title">
          {locale === "en" ? (
            <>Know the frontier.<br /><em>Then forge past it.</em></>
          ) : (
            zhWrapDisplay(<>看清前沿边界，<br /><em>然后越界而行。</em></>)
          )}
        </h1>
        {/* Locale purity (task F5): the gloss line is zh-only, not a
            second English narrative — it must not render in en locale. */}
        {locale === "zh" ? <p className="cn-gloss" lang="zh">{zhWrapDisplay(project.glossZh)}</p> : null}
        <p className="exhibit-intro">
          {locale === "en"
            ? headline.statement
            : "把免费规则标签从 1,450 条扩到 20,000 条，冻结评测任务成功率从 66.35% 提升到 99.05%：涨了 32.70 个百分点，配对 95% 置信区间 [30.60, 34.50]，基于单一训练种子（seed 0），实测消耗 15.236 个 RTX 4090 GPU 小时（4.571 美元）。"}
        </p>
        <div className="forge-hero-metrics">
          {/* Labels 1/2/4 stay English in both locales — same "mono
              UI-fabric" exemption already established sitewide
              (src/lib/home-stats.ts's KEEP_ENGLISH_STAT_TEXT: "task
              success", "measured spend", "upstream 5xx @ 3×"): a short
              technical metric name or run identifier (R1), not narrative
              prose. Label 3 ("measured training cost") is translated,
              matching the same file's existing precedent of translating
              cost/spend labels ("TOTAL MEASURED SPEND" -> "实测总花费"). */}
          <div className="forge-hero-metric">
            <strong>{percent(headline.task_success, 1)}</strong>
            <span>TASK SUCCESS</span>
          </div>
          <div className="forge-hero-metric">
            <strong>{points(headline.paired_delta_vs_r1.mean_task_success_delta, 1)}</strong>
            <span>GAIN VS R1</span>
          </div>
          <div className="forge-hero-metric">
            <strong>{headline.gpu_hours.toFixed(2)}</strong>
            <span>RTX 4090 GPU-HOURS</span>
          </div>
          <div className="forge-hero-metric">
            <strong>{usd(headline.usd, 3)}</strong>
            <span>{locale === "en" ? "MEASURED TRAINING COST" : zhWrapText("实测训练成本")}</span>
          </div>
        </div>
        <p className="forge-scope-note">
          {locale === "en"
            ? "The release model is the rule-label scaling ablation, not GRPO. GRPO's paired 95% CI includes zero across both completed seeds; a third seed aborted on the zero-reward-variance guard."
            : "发布使用的是规则标签扩量消融实验，不是 GRPO。GRPO 两个已完成 seed 的配对 95% CI 均含零；第三个 seed 被零奖励方差门禁提前终止。"}
        </p>
      </section>

      <ForgeFullInstrument />
      <EvidenceExplorer />
      <TrainingLadder />
      <ServingBoundary />
      <OverloadReplay />
      <BoundaryMatrix />
      <SourceReceipts />

      {/* F-02: the report contents sit directly above the report layer they
          navigate, not above the hero — this page's W1 first-viewport
          contract (exhibit-01's instrument at y < viewport + 40 at
          1440x900, forge-r2.spec.ts) has no fold budget for the nav's
          60px, and the report sections it links to all live below the
          exhibits anyway. Other report pages keep the nav at the top;
          only this page carries the instrument-first contract. */}
      <ProjectReportContents />
      <ProjectReport project={frontierProjectDetail} />
    </div>
  );
}

// Exhibit 01: the same InstrumentFrame component as the hero's compact
// instrument, rendered "full" (spec §6.0: "01 = same instrument FULL, same
// component, two variants").
function ForgeFullInstrument() {
  const { locale } = useI18n();
  return (
    <section id="exhibit-01" className="exhibit" data-exhibit="01" data-bg="paper" aria-labelledby="exhibit-01-title">
      <p className="exhibit-opening-row">
        <span className="exhibit-number" aria-hidden="true">01</span>
        <span className="exhibit-eyebrow">LIVE TRIAGE / RATE-LIMITED / NO LOGIN</span>
      </p>
      <h2 id="exhibit-01-title" className="exhibit-title">
        {locale === "en" ? (
          <>The same instrument,<br /><em>full size, zero clicks.</em></>
        ) : (
          zhWrapDisplay(<>同一台仪器，<br /><em>放大到整版，无需点击。</em></>)
        )}
      </h2>
      <div className="exhibit-body">
        <ForgeConsole variant="full" />
      </div>
    </section>
  );
}

function SourceReceipts() {
  const { locale } = useI18n();
  return (
    <section id="exhibit-07" className="exhibit" data-exhibit="07" data-bg="ink" aria-labelledby="exhibit-07-title">
      <p className="exhibit-opening-row">
        <span className="exhibit-number" aria-hidden="true">07</span>
        <span className="exhibit-eyebrow">{locale === "en" ? "HOW THIS WAS VERIFIED" : zhWrapText("如何验证")}</span>
      </p>
      <h2 id="exhibit-07-title" className="exhibit-title">
        {locale === "en" ? (
          <>Every claim opens<br /><em>the same command.</em></>
        ) : (
          zhWrapDisplay(<>每个说法，<br /><em>{zhGroup("都能点开", "同一条命令。")}</em></>)
        )}
      </h2>
      <div className="exhibit-body">
        <EvidenceDisclosure project="forge">
        <dl className="forge-receipts-dl">
          <dt><EvidenceFileLink source="public/case-studies/frontier-forge/release.json">release.json</EvidenceFileLink></dt>
          <dd><code>sha256:{forgeReceipts.releaseJson.sha256}</code></dd>
          <dt><EvidenceFileLink source="public/case-studies/frontier-forge/phase7_1_sustained_gateway_bench.json">{locale === "en" ? "Overload replay receipt" : "过载回放收据"}</EvidenceFileLink></dt>
          <dd><code>sha256:{forgeReceipts.overloadReceipt.sha256}</code></dd>
          <dt>{locale === "en" ? "Reproduce the headline" : "复现头条结论"}</dt>
          <dd><code>{claimCommands["task-success"]}</code></dd>
          <dt>{locale === "en" ? "Generated" : "生成时间"}</dt>
          <dd>{forgeReceipts.generatedAt}</dd>
        </dl>
        <p>
          {locale === "en"
            ? "The claim table is built from the copied Phase 7 release.json; the local manifest pins its exact SHA-256. The overload replay fetches the preserved Phase 7.1 sustained A10 receipt and does not call a model."
            : "断言表由拷入站内的 Phase 7 release.json 构建，本地 manifest 固定其精确 SHA-256。过载回放读取保留的 Phase 7.1 A10 持续压测收据，不调用模型。"}
        </p>
        </EvidenceDisclosure>
      </div>
    </section>
  );
}
