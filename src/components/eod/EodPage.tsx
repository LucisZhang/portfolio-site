"use client";

import { Finding } from "@/components/exhibition/Finding";
import LocaleDocumentMetadata from "@/components/LocaleDocumentMetadata";
import OptionalMedia from "@/components/OptionalMedia";
import { useI18n } from "@/lib/i18n";
import type { Project } from "@/lib/projects";
import { siteIdentity } from "@/lib/site-config";
import brokerParityJson from "../../../public/case-studies/exactly-once-drills/results/broker_parity.json";
import checkpointMetricsJson from "../../../public/case-studies/exactly-once-drills/results/checkpoint_metrics.json";
import "./eod.css";
import { DrillDetailsStatic } from "./DrillBoard";
import { EOD_ROWS, eodReceiptsData } from "./eodData";
import { EodLog } from "./EodLog";

const brokerParity = brokerParityJson as {
  path_a: { row_count: number; delivery_chain: string; snapshot_sha256: string };
  path_b: { row_count: number; delivery_chain: string; snapshot_sha256: string };
  parity: { snapshot_digests_match: boolean; row_level_diff_count: number };
  scenario: { events: number };
};
const checkpointMetrics = checkpointMetricsJson as {
  summary: {
    baseline: { max_checkpoint_duration_ms: number };
    under_backpressure: { max_checkpoint_duration_ms: number; max_iceberg_commit_lag_events: number };
    final: { checkpoint_failure_count: number; iceberg_commit_lag_events: number };
    passed: boolean;
  };
  run_id: string;
};

// Exactly-Once Drills — the "fault chessboard" standard-scroll rebuild
// (spec §6.5, task 2.3). Hero -> instrument full (01) -> verification
// proposition (02) -> dual-path parity (03) -> checkpoint pressure (04) ->
// SOURCE/RECEIPTS (05) -> report layer. Every number below is read from
// public/case-studies/exactly-once-drills/* or the generated receipts file
// at import time — see docs/evidence/digits-eod.md.
export default function EodPage({ project }: { project: Project }) {
  const { locale } = useI18n();

  return (
    <div className="eod-page">
      <LocaleDocumentMetadata
        title={{ en: `${project.title.en} | ${siteIdentity.name}`, zh: `${project.title.zh} | ${siteIdentity.chineseName}` }}
        description={project.summary}
      />

      {/* Task F9: the hero and the old exhibit-01 fault chessboard merge
          into one first screen, the Duty Logbook (EodLog.tsx) — see
          output/design-align-r2/concept-a-logbook.html for the approved
          mock this replaces DrillBoard + PipelineMap + ThroughputStrip +
          Scrubber with. */}
      <EodLog glossZh={project.glossZh} />
      <VerificationProposition />
      <DualPathParity />
      <CheckpointPressure />
      <SourceReceipts />

      <section data-project-section="how" className="eod-report-section">
        <h2>{locale === "en" ? "Architecture" : "架构"}</h2>
        <p>{locale === "en" ? project.role?.en : project.role?.zh}</p>
        <ol className="eod-architecture-flow">
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

      <section data-project-section="results" className="eod-report-section">
        <h2>{locale === "en" ? "Results & negatives" : "结果与负结果"}</h2>
        <p className="project-outcome">{locale === "en" ? project.outcome?.en : project.outcome?.zh}</p>
        {project.fieldNotes?.map((note) => (
          <Finding kind="negative" key={note.en}>
            {locale === "en" ? note.en : note.zh}
          </Finding>
        ))}
      </section>

      <section data-project-section="limitations" className="eod-report-section">
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

function VerificationProposition() {
  const { locale } = useI18n();
  return (
    <section id="exhibit-02" className="exhibit" data-exhibit="02" data-bg="ink" aria-labelledby="exhibit-02-title">
      <p className="exhibit-opening-row">
        <span className="exhibit-number" aria-hidden="true">02</span>
        <span className="exhibit-eyebrow">{locale === "en" ? "RECONCILIATION · SNAPSHOT DIGEST EQUALITY" : "RECONCILIATION · 快照摘要一致性"}</span>
      </p>
      <h2 id="exhibit-02-title" className="exhibit-title">
        {locale === "en" ? (
          <>Exactly-once ends<br /><em>at reconciliation.</em></>
        ) : (
          <>Exactly-once 的终点，<em>是对账。</em></>
        )}
      </h2>
      <div className="exhibit-body">
        <p className="eod-proposition" data-eod-proposition>
          ∀ drill ∈ {eodReceiptsData.drillCount} faults: iceberg_snapshot(path_A) ≡ iceberg_snapshot(path_B)
        </p>
        <div className="eod-pass-table" role="table" aria-label="Per-drill verification verdict" data-eod-pass-table>
          <div className="eod-pass-row eod-pass-head" role="row">
            <span role="columnheader">drill</span>
            <span role="columnheader">diff</span>
            <span role="columnheader">threshold</span>
            <span role="columnheader">verdict</span>
          </div>
          {EOD_ROWS.map((row) => (
            <div className="eod-pass-row" role="row" key={row.id} data-eod-pass-row={row.id}>
              <code role="cell">{row.id}</code>
              <code role="cell">{row.diff}</code>
              <code role="cell">snapshot_diff_count{"<="}0</code>
              <code role="cell" className="eod-pass-verdict" data-verdict={row.diff === 0 ? "pass" : "fail"}>
                {row.diff === 0 ? "PASS" : "FAIL"}
              </code>
            </div>
          ))}
        </div>
        <p className="exhibit-intro">
          {locale === "en"
            ? "No JavaScript required: every drill below is a static table server-rendered from the same summary, with a link to its full recorded run."
            : "无需 JavaScript：以下每场演练都是从同一份摘要服务端渲染的静态表，并附完整运行记录的链接。"}
        </p>
        <DrillDetailsStatic />
      </div>
    </section>
  );
}

function DualPathParity() {
  const { locale } = useI18n();
  return (
    <section id="exhibit-03" className="exhibit" data-exhibit="03" data-bg="paper-alt" aria-labelledby="exhibit-03-title">
      <p className="exhibit-opening-row">
        <span className="exhibit-number" aria-hidden="true">03</span>
        <span className="exhibit-eyebrow">PATH A / PATH B · {brokerParity.scenario.events} EVENTS</span>
      </p>
      <h2 id="exhibit-03-title" className="exhibit-title">
        {locale === "en" ? (
          <>Two delivery paths<br /><em>must land on the same state.</em></>
        ) : (
          <>两条投递路径，<em>必须落到同一个状态。</em></>
        )}
      </h2>
      <div className="exhibit-body">
        <div className="eod-parity-grid" data-eod-parity>
          <div className="eod-parity-cell">
            <p className="eyebrow">PATH A</p>
            <p>{brokerParity.path_a.delivery_chain}</p>
            <strong>{brokerParity.path_a.row_count.toLocaleString("en-US")} rows</strong>
            <code>{brokerParity.path_a.snapshot_sha256.slice(0, 16)}…</code>
          </div>
          <div className="eod-parity-cell">
            <p className="eyebrow">PATH B</p>
            <p>{brokerParity.path_b.delivery_chain}</p>
            <strong>{brokerParity.path_b.row_count.toLocaleString("en-US")} rows</strong>
            <code>{brokerParity.path_b.snapshot_sha256.slice(0, 16)}…</code>
          </div>
        </div>
        <Finding kind={brokerParity.parity.snapshot_digests_match ? "pass" : "negative"}>
          {locale === "en"
            ? `Snapshot digests match: ${brokerParity.parity.snapshot_digests_match}. Row-level diff count: ${brokerParity.parity.row_level_diff_count}.`
            : `快照摘要一致：${brokerParity.parity.snapshot_digests_match}。逐行差异数：${brokerParity.parity.row_level_diff_count}。`}
        </Finding>
      </div>
    </section>
  );
}

function CheckpointPressure() {
  const { locale } = useI18n();
  const s = checkpointMetrics.summary;
  return (
    <section id="exhibit-04" className="exhibit" data-exhibit="04" data-bg="white" aria-labelledby="exhibit-04-title">
      <p className="exhibit-opening-row">
        <span className="exhibit-number" aria-hidden="true">04</span>
        <span className="exhibit-eyebrow">{locale === "en" ? "CHECKPOINT DURATION · ICEBERG COMMIT LAG" : "CHECKPOINT DURATION · ICEBERG 提交延迟"}</span>
      </p>
      <h2 id="exhibit-04-title" className="exhibit-title">
        {locale === "en" ? (
          <>Recovery has<br /><em>ten different failure shapes.</em></>
        ) : (
          <>十种故障，<em>十种不同的恢复形状。</em></>
        )}
      </h2>
      <div className="exhibit-body">
        <div className="eod-pressure-evidence" data-eod-pressure>
          <div>
            <span>{locale === "en" ? "Maximum checkpoint duration" : "最大检查点时长"}</span>
            <strong>{s.baseline.max_checkpoint_duration_ms.toFixed(0)} ms → {s.under_backpressure.max_checkpoint_duration_ms.toLocaleString("en-US")} ms</strong>
            <small>{locale === "en" ? "baseline → induced backpressure" : "基线 → 注入背压"}</small>
          </div>
          <div>
            <span>{locale === "en" ? "Maximum Iceberg commit lag" : "最大 Iceberg 提交延迟"}</span>
            <strong>{s.under_backpressure.max_iceberg_commit_lag_events.toFixed(0)} {locale === "en" ? "events" : "个事件"} → {s.final.iceberg_commit_lag_events.toFixed(0)}</strong>
            <small>{locale === "en" ? "recovered in the recorded run" : "在已记录运行中恢复"}</small>
          </div>
          <div>
            <span>{locale === "en" ? "Checkpoint failures" : "检查点失败次数"}</span>
            <strong>{s.final.checkpoint_failure_count.toFixed(0)}</strong>
            <small>{locale === "en" ? "captured in the run record" : "已写入运行记录"}</small>
          </div>
        </div>
        <OptionalMedia
          candidates={[
            {
              src: { en: "/case-studies/exactly-once-drills/media/phase-2.2-small-file-rewrite.svg", zh: "/case-studies/exactly-once-drills/media/phase-2.2-small-file-rewrite-zh.svg" },
              alt: { en: "Historical Iceberg small-file rewrite evidence", zh: "历史 Iceberg 小文件重写证据" },
              caption: { en: "The maintenance view shows how Iceberg data files were compacted while preserving table state.", zh: "维护视图展示 Iceberg 数据文件如何在保持表状态的同时完成合并压缩。" },
            },
          ]}
        />
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
        <span className="exhibit-eyebrow">{locale === "en" ? "HOW THIS WAS VERIFIED" : "如何验证"}</span>
      </p>
      <h2 id="exhibit-05-title" className="exhibit-title">
        {locale === "en" ? (
          <>Every drill opens<br /><em>the same raw file.</em></>
        ) : (
          <>每场演练，<em>都能打开同一份原始记录。</em></>
        )}
      </h2>
      <div className="exhibit-body">
        <dl className="eod-receipts-dl">
          <dt>index.summary.json</dt>
          <dd><code>sha256:{eodReceiptsData.summary.sha256}</code></dd>
          <dt>broker_slo.json</dt>
          <dd><code>sha256:{eodReceiptsData.brokerSlo.sha256}</code></dd>
          <dt>{locale === "en" ? "Result manifest" : "结果清单"}</dt>
          <dd><code>sha256:{eodReceiptsData.manifest.sha256}</code></dd>
          <dt>{locale === "en" ? "Generated" : "生成时间"}</dt>
          <dd>{eodReceiptsData.generatedAt}</dd>
        </dl>
        <p>
          {locale === "en"
            ? "Every number on this page is read from the JSON files linked above at build time; the chessboard's summary is generated from the ten full drill records, never typed in."
            : "本页所有数字均在构建期从上方链接的 JSON 文件读取；棋盘摘要由十份完整演练记录生成，不手写。"}
        </p>
        <Finding kind="limitation" label="BOUNDARY">
          {locale === "en"
            ? "This page proves that these ten fault classes recover with zero snapshot diff. It does not prove that no other fault class exists, or that every possible failure in a MySQL → Kafka → Flink → Iceberg pipeline has been drilled."
            : "这页证明的是：这十类故障能够零差异恢复。它不能证明不存在其他故障类别，也不能证明 MySQL → Kafka → Flink → Iceberg 这条链路上所有可能的失败都已经被演练过。"}
        </Finding>
        <p className="eod-repo-link">
          <a href="https://github.com/LucisZhang/exactly-once-drills" target="_blank" rel="noreferrer noopener">
            {locale === "en" ? "GitHub repository" : "GitHub 仓库"}
          </a>
        </p>
      </div>
    </section>
  );
}
