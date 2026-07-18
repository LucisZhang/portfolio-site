"use client";

import {
  Background,
  Controls,
  ReactFlow,
  type Edge,
  type Node,
  Position,
  type ReactFlowInstance,
} from "@xyflow/react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Database,
  Download,
  FileJson,
  Focus,
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import ArtifactLink from "@/components/ArtifactLink";
import { useI18n } from "@/lib/i18n";

const EVIDENCE_ROOT = "/case-studies/p1-reliability-lab/results/u6-local-mac";
const RESULT_URL = `${EVIDENCE_ROOT}/eo_reconciliation-all.json`;
const MANIFEST_URL = `${EVIDENCE_ROOT}/manifest.json`;
const LAST_STEP = 7;

type Checkpoint = {
  id?: number;
  status?: string;
  external_path?: string;
};

type Recovery = {
  mode: string;
  savepoint?: string;
  checkpoint?: Checkpoint;
  checkpoint_before_stop?: Checkpoint;
  checkpoint_before_restart?: Checkpoint;
  checkpoint_before_savepoint?: Checkpoint;
  pre_crash_checkpoint?: Checkpoint;
  pre_fault_checkpoint?: Checkpoint;
  taskmanager_recovery?: string;
};

type FailureResult = {
  failure_class: string;
  trigger: string;
  recovery: Recovery;
  restored_job_id?: string;
  job_id: string;
  source_snapshot_row_count: number;
  iceberg_snapshot_row_count: number;
  snapshot_diff_count: number;
  event_id_audit: {
    consistent: boolean;
    changelog_row_count_match: boolean;
    changelog_set_match: boolean;
    current_sets_match: boolean;
    expected_changelog_row_count: number;
    iceberg_changelog_row_count: number;
    source_current_event_ids: number[];
    iceberg_current_event_ids: number[];
    iceberg_changelog_distinct_event_ids: number[];
  };
  fault_injection?: {
    mechanism: string;
    trigger_event_id: number;
  };
};

type Reconciliation = {
  command: string;
  started_at: string;
  finished_at: string;
  git_sha: string;
  run_id: string;
  results: FailureResult[];
  summary: {
    passed: boolean;
    all_event_id_audits_consistent: boolean;
    all_snapshot_diffs_zero: boolean;
  };
};

type Manifest = {
  run_id: string;
  source_evidence_commit: string;
  baseline_commit: string;
  environment_boundary: string;
};

type Stage = {
  title: string;
  detail: string;
  evidence: Record<string, unknown>;
};

const scenarioNames: Record<string, { en: string; zh: string }> = {
  "task-crash": { en: "Task crash", zh: "任务崩溃" },
  "checkpoint-restore": { en: "Checkpoint restore", zh: "检查点恢复" },
  "jobmanager-restart": { en: "JobManager restart", zh: "JobManager 重启" },
  "savepoint-restore": { en: "Savepoint restore", zh: "保存点恢复" },
  "sink-commit-fault": { en: "Sink commit fault", zh: "Sink 提交故障" },
};

function getCheckpoint(recovery: Recovery): Checkpoint | undefined {
  return recovery.checkpoint
    ?? recovery.checkpoint_before_stop
    ?? recovery.checkpoint_before_restart
    ?? recovery.checkpoint_before_savepoint
    ?? recovery.pre_crash_checkpoint
    ?? recovery.pre_fault_checkpoint;
}

function compactId(value: string) {
  return value.length > 16 ? `${value.slice(0, 12)}...` : value;
}

function formatTimestamp(value: string) {
  return value.replace("T", " ").replace("Z", " UTC");
}

export default function P1FailureReplay() {
  const { locale } = useI18n();
  const [report, setReport] = useState<Reconciliation | null>(null);
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [selectedClass, setSelectedClass] = useState("task-crash");
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState("mysql");
  const [flowInstance, setFlowInstance] = useState<ReactFlowInstance | null>(null);
  const flowPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch(RESULT_URL).then((response) => {
        if (!response.ok) throw new Error(`Result evidence returned ${response.status}`);
        return response.json() as Promise<Reconciliation>;
      }),
      fetch(MANIFEST_URL).then((response) => {
        if (!response.ok) throw new Error(`Manifest returned ${response.status}`);
        return response.json() as Promise<Manifest>;
      }),
    ]).then(([nextReport, nextManifest]) => {
      if (!active) return;
      setReport(nextReport);
      setManifest(nextManifest);
      setSelectedClass(nextReport.results[0]?.failure_class ?? "task-crash");
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Evidence could not be loaded.");
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setStep((current) => {
        if (current >= LAST_STEP) {
          setPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 1100);
    return () => window.clearInterval(timer);
  }, [playing]);

  const selected = report?.results.find((result) => result.failure_class === selectedClass) ?? report?.results[0];
  const stages = useMemo<Stage[]>(() => {
    if (!selected) return [];
    const checkpoint = getCheckpoint(selected.recovery);
    const ids = selected.event_id_audit.source_current_event_ids.join(", ");
    const changelogIds = selected.event_id_audit.iceberg_changelog_distinct_event_ids.join(", ");
    const stateReference = selected.recovery.savepoint
      ? selected.recovery.savepoint
      : checkpoint
        ? `checkpoint ${checkpoint.id ?? "?"} ${checkpoint.status ?? "captured"}; ${checkpoint.external_path ?? "path not recorded"}`
        : "No checkpoint reference recorded";
    return [
      {
        title: locale === "en" ? "Source snapshot" : "源端快照",
        detail: locale === "en" ? `${selected.source_snapshot_row_count} MySQL rows; current Event IDs ${ids}.` : `${selected.source_snapshot_row_count} 条 MySQL 记录；当前 Event ID：${ids}。`,
        evidence: { source_snapshot_row_count: selected.source_snapshot_row_count, source_current_event_ids: selected.event_id_audit.source_current_event_ids },
      },
      {
        title: locale === "en" ? "CDC changelog" : "CDC 变更日志",
        detail: locale === "en" ? `${selected.event_id_audit.iceberg_changelog_row_count} changelog rows across IDs ${changelogIds}.` : `${selected.event_id_audit.iceberg_changelog_row_count} 条 changelog 记录，覆盖 ID：${changelogIds}。`,
        evidence: { expected_rows: selected.event_id_audit.expected_changelog_row_count, recorded_rows: selected.event_id_audit.iceberg_changelog_row_count, distinct_event_ids: selected.event_id_audit.iceberg_changelog_distinct_event_ids },
      },
      {
        title: locale === "en" ? "Recovery state captured" : "恢复状态已捕获",
        detail: stateReference,
        evidence: { checkpoint, savepoint: selected.recovery.savepoint ?? null },
      },
      {
        title: locale === "en" ? "Failure induced" : "故障已注入",
        detail: selected.trigger,
        evidence: { trigger: selected.trigger, fault_injection: selected.fault_injection ? { trigger_event_id: selected.fault_injection.trigger_event_id, mechanism: selected.fault_injection.mechanism } : null },
      },
      {
        title: locale === "en" ? "Recovery observed" : "恢复已观测",
        detail: `${selected.recovery.mode}${selected.restored_job_id ? `; restored job ${selected.restored_job_id}` : `; job ${selected.job_id}`}${selected.recovery.taskmanager_recovery ? `; ${selected.recovery.taskmanager_recovery}` : ""}`,
        evidence: { recovery_mode: selected.recovery.mode, original_job_id: selected.job_id, restored_job_id: selected.restored_job_id ?? null, taskmanager_recovery: selected.recovery.taskmanager_recovery ?? null },
      },
      {
        title: locale === "en" ? "Iceberg snapshot" : "Iceberg 快照",
        detail: locale === "en" ? `${selected.iceberg_snapshot_row_count} Iceberg rows; current Event IDs ${selected.event_id_audit.iceberg_current_event_ids.join(", ")}.` : `${selected.iceberg_snapshot_row_count} 条 Iceberg 记录；当前 Event ID：${selected.event_id_audit.iceberg_current_event_ids.join(", ")}。`,
        evidence: { iceberg_snapshot_row_count: selected.iceberg_snapshot_row_count, iceberg_current_event_ids: selected.event_id_audit.iceberg_current_event_ids },
      },
      {
        title: locale === "en" ? "Snapshot reconciled" : "快照对账完成",
        detail: locale === "en" ? `${selected.snapshot_diff_count} missing or unexpected rows.` : `${selected.snapshot_diff_count} 条缺失或意外记录。`,
        evidence: { snapshot_diff_count: selected.snapshot_diff_count },
      },
      {
        title: locale === "en" ? "Event-ID audit passed" : "Event-ID 审计通过",
        detail: locale === "en" ? "Current sets, changelog sets, and changelog row counts all match." : "当前集合、变更集合与变更记录数全部一致。",
        evidence: selected.event_id_audit,
      },
    ];
  }, [locale, selected]);

  const nodes = useMemo<Node[]>(() => {
    const specs = [
      ["mysql", locale === "en" ? "MySQL source" : "MySQL 源端", 0, 0, 0],
      ["cdc", "Flink CDC", 1, 190, 0],
      ["state", locale === "en" ? "Recovery state" : "恢复状态", 2, 380, 0],
      ["iceberg", "Iceberg", 5, 570, 0],
      ["audit", locale === "en" ? "Reconciliation" : "确定性对账", 6, 760, 0],
    ] as const;
    return specs.map(([id, label, beginsAt, x, y], index) => {
      const active = step >= beginsAt && (index === specs.length - 1 || step < specs[index + 1][2]);
      const complete = step > (index === specs.length - 1 ? LAST_STEP : specs[index + 1][2] - 1);
      const status = complete ? (locale === "en" ? "verified" : "已核验") : active ? (locale === "en" ? "current" : "当前") : (locale === "en" ? "queued" : "待回放");
      return {
        id,
        position: { x, y },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        draggable: false,
        selectable: true,
        data: { label: <span className={`p1-node-label ${complete ? "complete" : active ? "active" : ""}`}><strong>{label}</strong><small>{complete ? <Check aria-hidden="true" /> : <Database aria-hidden="true" />}{status}</small></span> },
        className: `p1-flow-node ${complete ? "complete" : active ? "active" : ""}`,
      };
    });
  }, [locale, step]);

  const edges = useMemo<Edge[]>(() => [
    ["mysql", "cdc"], ["cdc", "state"], ["state", "iceberg"], ["iceberg", "audit"],
  ].map(([source, target], index) => ({
    id: `${source}-${target}`,
    source,
    target,
    ariaLabel: locale === "en" ? `Data flow from ${source} to ${target}` : `从 ${source} 到 ${target} 的数据流`,
    style: { stroke: step > [0, 1, 4, 5][index] ? "#166534" : "#a9b1ad", strokeWidth: 2 },
  })), [locale, step]);

  function chooseScenario(value: string) {
    setSelectedClass(value);
    setStep(0);
    setPlaying(false);
  }

  async function toggleFullscreen() {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await flowPanelRef.current?.requestFullscreen();
  }

  if (error) {
    return <div className="p1-replay-error"><CircleAlert aria-hidden="true" /><strong>{locale === "en" ? "Recorded evidence unavailable" : "录制证据不可用"}</strong><span>{error}</span></div>;
  }

  if (!report || !manifest || !selected || stages.length === 0) {
    return <div className="p1-replay-loading" aria-live="polite">{locale === "en" ? "Loading recorded evidence..." : "正在载入录制证据……"}</div>;
  }

  const currentStage = stages[step];
  const nodeStageIndex: Record<string, number> = { mysql: 0, cdc: 1, state: 2, iceberg: 5, audit: 6 };
  const selectedNodeStage = stages[nodeStageIndex[selectedNodeId] ?? 0];

  return (
    <section className="p1-replay" data-testid="p1-failure-replay" aria-labelledby="p1-replay-title">
      <header className="p1-replay-header">
        <div>
          <p className="eyebrow">{locale === "en" ? "Captured Run" : "已记录运行"}</p>
          <h3 id="p1-replay-title">Failure Replay Console</h3>
          <p>{locale === "en" ? "Step through the recorded source, recovery, sink, and reconciliation evidence for each induced failure." : "逐步查看每类注入故障的源端、恢复、sink 与对账证据。"}</p>
        </div>
        <div className="p1-disclosure"><CircleAlert aria-hidden="true" /><strong>{locale === "en" ? "Recorded evidence, not a live cluster." : "这是已记录的证据，不是在线集群。"}</strong><span>{locale === "en" ? "This deterministic viewer reads the published U6 JSON package only." : "这个确定性查看器只读取已发布的 U6 JSON 包。"}</span></div>
      </header>

      <div className="p1-scenario-tabs" role="tablist" aria-label={locale === "en" ? "Failure scenario" : "故障场景"}>
        {report.results.map((result) => <button key={result.failure_class} type="button" role="tab" aria-selected={result.failure_class === selected.failure_class} onClick={() => chooseScenario(result.failure_class)}><span>{scenarioNames[result.failure_class]?.[locale] ?? result.failure_class}</span><code>{result.failure_class}</code></button>)}
      </div>

      <div className="p1-console-grid">
        <div className="p1-flow-panel" ref={flowPanelRef} aria-label={locale === "en" ? "Recorded data flow" : "录制数据流"}>
          <div className="p1-graph-toolbar">
            <div><strong>{locale === "en" ? "Recorded system graph" : "录制系统图"}</strong><span>{locale === "en" ? "Select a node to inspect its linked evidence." : "选择节点可查看关联证据。"}</span></div>
            <div><button type="button" title={locale === "en" ? "Reset view" : "复位视图"} onClick={() => void flowInstance?.fitView({ padding: .12, duration: 250 })}><Focus aria-hidden="true" />{locale === "en" ? "Reset view" : "复位"}</button><button type="button" title={locale === "en" ? "Fullscreen graph" : "全屏查看"} onClick={() => void toggleFullscreen()}><Maximize2 aria-hidden="true" />{locale === "en" ? "Fullscreen" : "全屏"}</button><ArtifactLink href={RESULT_URL}>{locale === "en" ? "Open original JSON" : "查看原始 JSON"}</ArtifactLink><a href={RESULT_URL} download="eo_reconciliation-all.json"><Download aria-hidden="true" />{locale === "en" ? "Download" : "下载"}</a></div>
          </div>
          <div className="p1-flow-canvas">
            <ReactFlow nodes={nodes} edges={edges} fitView fitViewOptions={{ padding: 0.12 }} onInit={setFlowInstance} onNodeClick={(_event, node) => setSelectedNodeId(node.id)} nodesConnectable={false} nodesDraggable={false} elementsSelectable zoomOnScroll zoomOnPinch panOnDrag preventScrolling proOptions={{ hideAttribution: true }} minZoom={.45} maxZoom={2.2}>
              <Background color="#d9dedb" gap={18} size={1} />
              <Controls position="bottom-right" showInteractive={false} aria-label={locale === "en" ? "Graph zoom and fit controls" : "图形缩放与适配控制"} />
            </ReactFlow>
          </div>
          <div className="p1-graph-footer">
            <aside className="p1-node-detail" aria-live="polite"><p className="eyebrow">{locale === "en" ? "Node detail" : "节点详情"}</p><h4>{selectedNodeStage.title}</h4><p>{selectedNodeStage.detail}</p><code>{Object.keys(selectedNodeStage.evidence).join(" · ")}</code></aside>
            <div className="p1-graph-legend" aria-label={locale === "en" ? "Graph legend" : "图例"}><strong>{locale === "en" ? "Legend" : "图例"}</strong><span><i className="queued" />{locale === "en" ? "Queued" : "待回放"}</span><span><i className="current" />{locale === "en" ? "Current" : "当前"}</span><span><i className="verified" />{locale === "en" ? "Verified" : "已核验"}</span><small>{locale === "en" ? "Status is written inside every node; color is secondary." : "每个节点内都有文字状态，颜色仅作辅助。"}</small></div>
          </div>
        </div>
        <ol className="p1-mobile-flow" aria-label={locale === "en" ? "Recorded replay stages" : "录制回放阶段"}>
          {stages.map((stage, index) => <li key={stage.title} className={index < step ? "complete" : index === step ? "active" : ""}><span>{index < step ? <Check aria-hidden="true" /> : String(index + 1).padStart(2, "0")}</span><strong>{stage.title}</strong></li>)}
        </ol>

        <aside className="p1-stage-panel" aria-live="polite">
          <div className="p1-stage-count"><span>{locale === "en" ? "Recorded stage" : "录制阶段"}</span><strong>{String(step + 1).padStart(2, "0")} / 08</strong></div>
          <h4>{currentStage.title}</h4>
          <p>{currentStage.detail}</p>
          <pre data-testid="p1-evidence-excerpt">{JSON.stringify(currentStage.evidence, null, 2)}</pre>
          <span className="p1-not-log"><FileJson aria-hidden="true" />{locale === "en" ? "Structured excerpt from the recorded JSON; not generated logs." : "来自录制 JSON 的结构化摘录；不是生成日志。"}</span>
        </aside>
      </div>

      <div className="p1-replay-controls">
        <div>
          <button type="button" title={locale === "en" ? "Previous stage" : "上一步"} aria-label={locale === "en" ? "Previous stage" : "上一步"} onClick={() => { setPlaying(false); setStep((value) => Math.max(0, value - 1)); }} disabled={step === 0}><ChevronLeft aria-hidden="true" /></button>
          <button type="button" className="primary" title={playing ? (locale === "en" ? "Pause replay" : "暂停回放") : (locale === "en" ? "Play replay" : "播放回放")} aria-label={playing ? (locale === "en" ? "Pause replay" : "暂停回放") : (locale === "en" ? "Play replay" : "播放回放")} onClick={() => { if (step === LAST_STEP) setStep(0); setPlaying((value) => !value); }}>{playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}</button>
          <button type="button" title={locale === "en" ? "Next stage" : "下一步"} aria-label={locale === "en" ? "Next stage" : "下一步"} onClick={() => { setPlaying(false); setStep((value) => Math.min(LAST_STEP, value + 1)); }} disabled={step === LAST_STEP}><ChevronRight aria-hidden="true" /></button>
          <button type="button" title={locale === "en" ? "Reset replay" : "重置回放"} aria-label={locale === "en" ? "Reset replay" : "重置回放"} onClick={() => { setPlaying(false); setStep(0); }}><RotateCcw aria-hidden="true" /></button>
        </div>
        <label><span>{locale === "en" ? "Timeline" : "时间线"}</span><input aria-label={locale === "en" ? "Replay timeline" : "回放时间线"} type="range" min="0" max={LAST_STEP} value={step} onChange={(event) => { setPlaying(false); setStep(Number(event.target.value)); }} /></label>
        <strong><ShieldCheck aria-hidden="true" />{locale === "en" ? "Recorded result: pass" : "录制结果：通过"}</strong>
      </div>

      <div className="p1-run-metadata">
        <div><span>{locale === "en" ? "Export package run ID" : "导出包 Run ID"}</span><code>{manifest.run_id}</code></div>
        <div><span>{locale === "en" ? "Reconciliation run ID" : "对账 Run ID"}</span><code>{report.run_id}</code></div>
        <div><span>{locale === "en" ? "Source evidence commit" : "源证据提交"}</span><code title={manifest.source_evidence_commit}>{compactId(manifest.source_evidence_commit)}</code></div>
        <div><span>{locale === "en" ? "Baseline / execution SHA" : "基线 / 执行 SHA"}</span><code>{compactId(manifest.baseline_commit)} / {report.git_sha}</code></div>
        <div><span>{locale === "en" ? "Recorded window" : "录制时间"}</span><code>{formatTimestamp(report.started_at)} - {formatTimestamp(report.finished_at)}</code></div>
        <div className="wide"><span>{locale === "en" ? "Recorded command" : "录制命令"}</span><code>{report.command}</code></div>
        <div className="wide"><span>{locale === "en" ? "Environment boundary" : "环境边界"}</span><strong>{manifest.environment_boundary}</strong></div>
      </div>
      <p className="p1-limitation"><CircleAlert aria-hidden="true" /><span>{locale === "en" ? "This replay shows one recorded Apple Silicon / Docker Desktop run. It is not a live cluster and does not establish universal reproducibility." : "限制：本回放只证明一次已录制的 Apple Silicon / Docker Desktop 运行；不表示当前有集群在线，也不声明普遍可复现。"}</span><ArtifactLink href={RESULT_URL}>{locale === "en" ? "View recorded JSON" : "查看源 JSON"}</ArtifactLink></p>
    </section>
  );
}
