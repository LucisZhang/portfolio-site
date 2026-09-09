"use client";

import { EvidenceDisclosure } from "@/components/exhibition/EvidenceDisclosure";
import { EvidenceFileLink } from "@/components/exhibition/EvidenceFileLink";

import { Finding } from "@/components/exhibition/Finding";
import { ProjectReport } from "@/components/report/ProjectReport";
import LocaleDocumentMetadata from "@/components/LocaleDocumentMetadata";
import ScrollRegion from "@/components/ScrollRegion";
import { useI18n } from "@/lib/i18n";
import { zhGroup, zhWrapDisplay, zhWrapText } from "@/lib/zh-wrap";
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
    under_backpressure: { max_checkpoint_duration_ms: number; max_iceberg_commit_lag_events: number; max_backpressure_indicator: number };
    final: { checkpoint_failure_count: number; iceberg_commit_lag_events: number };
    passed: boolean;
  };
  run_id: string;
  time_series: Array<{
    sample_index: number;
    elapsed_ms: number;
    phase: string;
    checkpoint: {
      duration_ms: number;
      alignment_time_ms: number;
      latest_completed_id: number;
    };
    backpressure: { indicator: number };
    iceberg_commit_lag: { lag_events: number };
  }>;
};

const PRESSURE_WIDTH = 960;
const PRESSURE_HEIGHT = 300;
const PRESSURE_LEFT = 74;
const PRESSURE_RIGHT = 28;
const DURATION_TOP = 32;
const DURATION_BOTTOM = 126;
const LAG_TOP = 158;
const LAG_BOTTOM = 226;

function pressureX(index: number, sampleCount: number) {
  return PRESSURE_LEFT + (index / Math.max(1, sampleCount - 1)) * (PRESSURE_WIDTH - PRESSURE_LEFT - PRESSURE_RIGHT);
}

function durationY(durationMs: number, maximumDurationMs: number) {
  const minLog = 1;
  const maxLog = Math.log10(Math.max(100, maximumDurationMs * 1.25));
  const normalized = (Math.log10(Math.max(10, durationMs)) - minLog) / (maxLog - minLog);
  return DURATION_BOTTOM - normalized * (DURATION_BOTTOM - DURATION_TOP);
}

function lagY(lagEvents: number, maximumLagEvents: number) {
  return LAG_BOTTOM - (lagEvents / Math.max(1, maximumLagEvents)) * (LAG_BOTTOM - LAG_TOP);
}

function stepPath(points: Array<{ x: number; y: number }>) {
  if (!points.length) return "";
  return points.slice(1).reduce((path, point) => `${path} H ${point.x.toFixed(1)} V ${point.y.toFixed(1)}`, `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`);
}

// Exactly-Once Drills: duty log -> verification proposition -> dual-path
// parity -> recorded checkpoint trace -> sources/receipts -> report. Every
// displayed measurement is read from committed case-study data at import.
export default function EodPage({ project }: { project: Project }) {

  return (
    <div className="eod-page">
      <LocaleDocumentMetadata
        title={{ en: `${project.title.en} | ${siteIdentity.name}`, zh: `${project.title.zh} | ${siteIdentity.chineseName}` }}
        description={project.summary}
      />
      {/* The Duty Logbook is the first project surface. */}
      <EodLog glossZh={project.glossZh} />
      <VerificationProposition />
      <DualPathParity />
      <CheckpointPressure />
      <SourceReceipts />

      <ProjectReport project={project} />
    </div>
  );
}

function VerificationProposition() {
  const { locale } = useI18n();
  return (
    <section id="exhibit-02" className="exhibit" data-exhibit="02" data-bg="ink" aria-labelledby="exhibit-02-title">
      <p className="exhibit-opening-row">
        <span className="exhibit-number" aria-hidden="true">02</span>
        <span className="exhibit-eyebrow">{locale === "en" ? "RECONCILIATION · SNAPSHOT DIGEST EQUALITY" : zhWrapText("RECONCILIATION · 快照摘要一致性")}</span>
      </p>
      <h2 id="exhibit-02-title" className="exhibit-title">
        {locale === "en" ? (
          <>Exactly-once ends<br /><em>at reconciliation.</em></>
        ) : (
          zhWrapDisplay(<>Exactly-once 的终点，<br /><em>是对账。</em></>)
        )}
      </h2>
      <div className="exhibit-body">
        <p className="eod-proposition" data-eod-proposition>
          ∀ drill ∈ {eodReceiptsData.drillCount} faults: iceberg_snapshot(path_A) ≡ iceberg_snapshot(path_B)
        </p>
        <div className="eod-pass-table" role="table" aria-label={locale === "en" ? "Per-drill verification verdict" : "逐项演练验证结论"} data-eod-pass-table>
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
        <span className="exhibit-eyebrow">PATH A · PATH B · {brokerParity.scenario.events} EVENTS</span>
      </p>
      <h2 id="exhibit-03-title" className="exhibit-title">
        {locale === "en" ? (
          <>Two delivery paths<br /><em>must land on the same state.</em></>
        ) : (
          zhWrapDisplay(<>两条投递路径，<br /><em>{zhGroup("必须落到", "同一个状态。")}</em></>)
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
  const samples = checkpointMetrics.time_series;
  const maximumDuration = s.under_backpressure.max_checkpoint_duration_ms;
  const maximumLag = s.under_backpressure.max_iceberg_commit_lag_events;
  const durationPoints = samples.map((sample, index) => ({ x: pressureX(index, samples.length), y: durationY(sample.checkpoint.duration_ms, maximumDuration) }));
  const lagPoints = samples.map((sample, index) => ({ x: pressureX(index, samples.length), y: lagY(sample.iceberg_commit_lag.lag_events, maximumLag) }));
  const lagArea = `${stepPath(lagPoints)} L ${lagPoints.at(-1)!.x.toFixed(1)} ${LAG_BOTTOM} L ${lagPoints[0].x.toFixed(1)} ${LAG_BOTTOM} Z`;
  const phaseBands = samples.reduce<Array<{ phase: string; start: number; end: number }>>((bands, sample, index) => {
    const current = bands.at(-1);
    if (current?.phase === sample.phase) current.end = index;
    else bands.push({ phase: sample.phase, start: index, end: index });
    return bands;
  }, []);
  const baselineIndex = Math.max(0, samples.findIndex((sample) => sample.checkpoint.duration_ms === s.baseline.max_checkpoint_duration_ms));
  const spikeIndex = Math.max(0, samples.findIndex((sample) => sample.checkpoint.duration_ms === maximumDuration));
  const lagPeakIndex = Math.max(0, samples.findIndex((sample) => sample.iceberg_commit_lag.lag_events === maximumLag));
  const lagRecoveryCandidate = samples.findIndex((sample, index) => index > lagPeakIndex && sample.iceberg_commit_lag.lag_events === s.final.iceberg_commit_lag_events);
  const lagRecoveryIndex = lagRecoveryCandidate >= 0 ? lagRecoveryCandidate : samples.length - 1;
  const indicatorIndex = Math.max(0, samples.findIndex((sample) => sample.backpressure.indicator === s.under_backpressure.max_backpressure_indicator));
  const phaseLabelsZh: Record<string, string> = { baseline: "基线", backpressure: "背压", recovery: "恢复" };
  const phaseLabel = (phase: string) => locale === "en" ? phase : (phaseLabelsZh[phase] ?? phase);
  return (
    <section id="exhibit-04" className="exhibit" data-exhibit="04" data-bg="white" aria-labelledby="exhibit-04-title">
      <p className="exhibit-opening-row">
        <span className="exhibit-number" aria-hidden="true">04</span>
        <span className="exhibit-eyebrow">{locale === "en" ? "CHECKPOINT DURATION · ICEBERG COMMIT LAG" : zhWrapText("CHECKPOINT DURATION · ICEBERG 提交延迟")}</span>
      </p>
      <h2 id="exhibit-04-title" className="exhibit-title">
        {locale === "en" ? (
          <>Recovery has<br /><em>ten different failure shapes.</em></>
        ) : (
          zhWrapDisplay(<>十种故障，<br /><em>{zhGroup("十种不同的", "恢复形状。")}</em></>)
        )}
      </h2>
      <div className="exhibit-body">
        <figure className="eod-pressure-trace" data-eod-pressure-trace>
          <svg
            viewBox={`0 0 ${PRESSURE_WIDTH} ${PRESSURE_HEIGHT}`}
            role="img"
            aria-label={locale === "en" ? `Recorded checkpoint duration, Iceberg commit lag and backpressure across ${samples.length} samples` : `${samples.length} 个采样点的检查点时长、Iceberg 提交延迟与背压记录`}
          >
            <title>{locale === "en" ? "Checkpoint pressure recorded-run trace" : "检查点压力运行轨迹"}</title>

            {[10, 100, 1_000, 10_000].map((tick) => {
              const y = durationY(tick, maximumDuration);
              return (
                <g key={tick}>
                  <line className="eod-pressure-gridline" x1={PRESSURE_LEFT} x2={PRESSURE_WIDTH - PRESSURE_RIGHT} y1={y} y2={y} />
                  <text className="eod-pressure-axis-label" x={PRESSURE_LEFT - 10} y={y + 3} textAnchor="end">{tick >= 1_000 ? `${tick / 1_000}k` : tick} ms</text>
                </g>
              );
            })}
            <text className="eod-pressure-lane-label" x={PRESSURE_LEFT} y={22}>{locale === "en" ? "CHECKPOINT DURATION · LOG SCALE" : "检查点时长 · 对数刻度"}</text>
            {samples.map((sample, index) => (
              <text key={`checkpoint-${sample.sample_index}`} className="eod-pressure-checkpoint-id" x={pressureX(index, samples.length)} y={138} textAnchor="middle">
                ckpt {sample.checkpoint.latest_completed_id}
              </text>
            ))}
            <path className="eod-pressure-duration-line" d={stepPath(durationPoints)} />
            {durationPoints.map((point, index) => <circle key={`duration-${samples[index].sample_index}`} className="eod-pressure-duration-dot" cx={point.x} cy={point.y} r={3.5} />)}
            <text className="eod-pressure-callout" x={durationPoints[baselineIndex].x + 8} y={durationPoints[baselineIndex].y - 8}>{s.baseline.max_checkpoint_duration_ms.toLocaleString("en-US")} ms</text>
            <line className="eod-pressure-spike" x1={durationPoints[spikeIndex].x} x2={durationPoints[spikeIndex].x} y1={DURATION_TOP} y2={LAG_BOTTOM} />
            <text className="eod-pressure-spike-label" x={durationPoints[spikeIndex].x + 8} y={DURATION_TOP + 12}>{locale === "en" ? "checkpoint" : "检查点"} {samples[spikeIndex].checkpoint.latest_completed_id}</text>
            <text className="eod-pressure-callout" x={durationPoints[spikeIndex].x} y={durationPoints[spikeIndex].y - 9} textAnchor="middle">{maximumDuration.toLocaleString("en-US")} ms</text>

            {[0, maximumLag / 2, maximumLag].map((tick) => {
              const y = lagY(tick, maximumLag);
              return (
                <g key={tick}>
                  <line className="eod-pressure-gridline" x1={PRESSURE_LEFT} x2={PRESSURE_WIDTH - PRESSURE_RIGHT} y1={y} y2={y} />
                  <text className="eod-pressure-axis-label" x={PRESSURE_LEFT - 10} y={y + 3} textAnchor="end">{tick}</text>
                </g>
              );
            })}
            <text className="eod-pressure-lane-label" x={PRESSURE_LEFT} y={LAG_TOP - 10}>{locale === "en" ? "ICEBERG COMMIT LAG · EVENTS" : "ICEBERG 提交延迟 · 事件数"}</text>
            <path className="eod-pressure-lag-area" d={lagArea} />
            <path className="eod-pressure-lag-line" d={stepPath(lagPoints)} />
            <text className="eod-pressure-callout" x={lagPoints[lagPeakIndex].x + 7} y={lagPoints[lagPeakIndex].y - 8}>{maximumLag.toLocaleString("en-US")}</text>
            <text className="eod-pressure-callout" x={lagPoints[lagRecoveryIndex].x + 7} y={lagPoints[lagRecoveryIndex].y - 8}>{s.final.iceberg_commit_lag_events.toLocaleString("en-US")}</text>

            <line className="eod-pressure-indicator-base" x1={PRESSURE_LEFT} x2={PRESSURE_WIDTH - PRESSURE_RIGHT} y1={256} y2={256} />
            {samples.map((sample, index) => {
              const x = pressureX(index, samples.length);
              const height = Math.max(1, sample.backpressure.indicator * 18);
              return <line key={`bp-${sample.sample_index}`} className="eod-pressure-indicator" x1={x} x2={x} y1={256} y2={256 - height} />;
            })}
            <text className="eod-pressure-axis-label" x={PRESSURE_LEFT} y={270}>{locale === "en" ? "BACKPRESSURE INDICATOR" : "背压指标"}</text>
            <text className="eod-pressure-callout" x={pressureX(indicatorIndex, samples.length)} y={244} textAnchor="middle">{s.under_backpressure.max_backpressure_indicator.toFixed(3)}</text>

            {phaseBands.map((band) => {
              const start = pressureX(band.start, samples.length);
              const end = pressureX(band.end, samples.length);
              return (
                <g key={band.phase}>
                  <line className="eod-pressure-phase-line" x1={start} x2={end} y1={282} y2={282} />
                  <text className="eod-pressure-phase-label" x={(start + end) / 2} y={296} textAnchor="middle">{phaseLabel(band.phase)}</text>
                </g>
              );
            })}
          </svg>
          <figcaption>
            {locale === "en"
              ? `${samples.length} recorded samples show the checkpoint spike, commit-lag backlog and recovery in one shared timeline.`
              : `${samples.length} 个已记录采样点，把检查点尖峰、提交积压与恢复放在同一条时间线上。`}
          </figcaption>
        </figure>

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
        <ScrollRegion className="eod-pressure-table-scroll" label={{ en: "Recorded checkpoint samples", zh: "检查点采样记录" }}>
          <table className="eod-pressure-table" data-eod-pressure-table>
            <thead>
              <tr>
                <th>{locale === "en" ? "Sample" : "采样"}</th>
                <th>{locale === "en" ? "Phase" : "阶段"}</th>
                <th>{locale === "en" ? "Checkpoint" : "检查点"}</th>
                <th>{locale === "en" ? "Duration" : "时长"}</th>
                <th>{locale === "en" ? "Commit lag" : "提交延迟"}</th>
                <th>{locale === "en" ? "Backpressure" : "背压"}</th>
              </tr>
            </thead>
            <tbody>
              {samples.map((sample) => (
                <tr key={sample.sample_index}>
                  <td>{sample.sample_index}</td>
                  <td>{phaseLabel(sample.phase)}</td>
                  <td>{sample.checkpoint.latest_completed_id}</td>
                  <td>{sample.checkpoint.duration_ms.toLocaleString("en-US")} ms</td>
                  <td>{sample.iceberg_commit_lag.lag_events}</td>
                  <td>{sample.backpressure.indicator.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollRegion>
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
        <span className="exhibit-eyebrow">{locale === "en" ? "HOW THIS WAS VERIFIED" : zhWrapText("如何验证")}</span>
      </p>
      <h2 id="exhibit-05-title" className="exhibit-title">
        {locale === "en" ? (
          <>Every drill opens<br /><em>the same raw file.</em></>
        ) : (
          zhWrapDisplay(<>每场演练，<br /><em>{zhGroup("都能打开同一份", "原始记录。")}</em></>)
        )}
      </h2>
      <div className="exhibit-body">
        <EvidenceDisclosure project="eod">
        <dl className="eod-receipts-dl">
          <dt><EvidenceFileLink source="public/case-studies/exactly-once-drills/index.summary.json">index.summary.json</EvidenceFileLink></dt>
          <dd><code>sha256:{eodReceiptsData.summary.sha256}</code></dd>
          <dt><EvidenceFileLink source="public/case-studies/exactly-once-drills/results/broker_slo.json">broker_slo.json</EvidenceFileLink></dt>
          <dd><code>sha256:{eodReceiptsData.brokerSlo.sha256}</code></dd>
          <dt><EvidenceFileLink source="public/case-studies/exactly-once-drills/results/manifest.json">{locale === "en" ? "Result manifest" : "结果清单"}</EvidenceFileLink></dt>
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
        </EvidenceDisclosure>
      </div>
    </section>
  );
}
