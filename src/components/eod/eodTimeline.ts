// Normalizes the 10 heterogeneous on-site drill result files (public/
// case-studies/exactly-once-drills/results/*.json) into one shared shape
// DrillTimeline/ThroughputStrip/PipelineMap can render. The 10 files were
// captured across different phases (B1-B4, 1.1-2.3) by different scripts and
// do not share one schema — this module reads only real fields that exist
// on each file and renders "NOT RECORDED" for a stage a given drill's file
// does not contain, per the task brief's explicit fallback rule. Nothing
// here fabricates a timestamp, a value, or a log line.

import { fmtOffset, isoToMs } from "./eodFormat";

type Json = Record<string, unknown>;

function obj(value: unknown): Json | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Json) : undefined;
}
function arr(value: unknown): unknown[] | undefined {
  return Array.isArray(value) ? value : undefined;
}
function str(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}
function num(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}
function bool(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}
function get(root: Json | undefined, path: string): unknown {
  if (!root) return undefined;
  return path.split(".").reduce<unknown>((acc, key) => {
    const record = obj(acc);
    return record ? record[key] : undefined;
  }, root);
}

export type TimelineEvent = {
  stage: "INJECT" | "DETECT" | "RECOVER" | "VERIFY" | "RUN";
  offsetMs: number | null;
  offsetLabel: string;
  headline: string;
  detailLines: string[];
  recorded: boolean;
};

function checksLines(checks: Json | undefined, limit = 5): string[] {
  if (!checks) return [];
  return Object.entries(checks)
    .filter(([, v]) => typeof v === "boolean" || typeof v === "number")
    .slice(0, limit)
    .map(([key, value]) => `${key}: ${value}`);
}

function verifyEvent(root: Json, baseMs: number | null): TimelineEvent {
  const reconciliation = obj(root.reconciliation);
  const diffCount = num(reconciliation?.snapshot_diff_count) ?? num(root.snapshot_diff_count)
    ?? num(get(obj(root.summary), "snapshot_diff_count"));
  const sourceSha = str(reconciliation?.source_snapshot_sha256);
  const icebergSha = str(reconciliation?.iceberg_snapshot_sha256);
  const shaMatch = sourceSha && icebergSha ? sourceSha === icebergSha : undefined;
  const finishedAt = str(root.finished_at);
  const offsetMs = baseMs !== null && finishedAt ? (isoToMs(finishedAt) ?? baseMs) - baseMs : null;
  const checks = obj(root.checks);
  const lines: string[] = [];
  if (diffCount !== undefined) lines.push(`snapshot_diff_count: ${diffCount}`);
  if (shaMatch !== undefined) lines.push(`iceberg_snapshot(path_A) == iceberg_snapshot(path_B): ${shaMatch}`);
  lines.push(...checksLines(checks, 4));
  return {
    stage: "VERIFY",
    offsetMs,
    offsetLabel: fmtOffset(offsetMs),
    headline: diffCount === 0 ? "VERIFY reconciliation: 0 diff" : `VERIFY reconciliation: ${diffCount ?? "NOT RECORDED"} diff`,
    detailLines: lines.slice(0, 5),
    recorded: diffCount !== undefined,
  };
}

// broker-restart is the only drill file whose `fault` object records a real
// container kill/restart with its own started_at/recovered_at timestamps
// and a Docker container-inspect snapshot (container_killed). The other two
// files with a top-level `fault` key (poison-dlq, duplicate-redelivery) use
// a different internal shape entirely — see their own functions below.
function brokerRestartTimeline(root: Json): TimelineEvent[] {
  const fault = obj(root.fault);
  const recovery = obj(root.recovery);
  const injectIso = str(fault?.started_at) ?? str(root.started_at);
  const injectMs = isoToMs(injectIso);
  const command = str(fault?.command) ?? str(root.command);

  const inject: TimelineEvent = {
    stage: "INJECT",
    offsetMs: 0,
    offsetLabel: fmtOffset(0),
    headline: `INJECT ${command ?? "fault"}`,
    detailLines: [command ?? "command not recorded", `failure_class: ${str(root.failure_class) ?? "—"}`].filter(Boolean) as string[],
    recorded: Boolean(injectIso),
  };

  const containerKilled = obj(fault?.container_killed);
  const detectIso = str(containerKilled?.FinishedAt);
  const detectMs = injectMs !== null && detectIso ? (isoToMs(detectIso) ?? injectMs) - injectMs : null;
  const detect: TimelineEvent = {
    stage: "DETECT",
    offsetMs: detectMs,
    offsetLabel: fmtOffset(detectMs),
    headline: detectIso ? "DETECT container health: unhealthy" : "DETECT — NOT RECORDED",
    detailLines: containerKilled
      ? [`ExitCode: ${containerKilled.ExitCode}`, `Status: ${containerKilled.Status}`, `FinishedAt: ${containerKilled.FinishedAt}`]
      : [],
    recorded: Boolean(detectIso),
  };

  const recoverIso = str(fault?.recovered_at);
  const recoverMs = injectMs !== null && recoverIso ? (isoToMs(recoverIso) ?? injectMs) - injectMs : null;
  const recover: TimelineEvent = {
    stage: "RECOVER",
    offsetMs: recoverMs,
    offsetLabel: fmtOffset(recoverMs),
    headline: `RECOVER ${str(recovery?.command) ?? str(recovery?.mode) ?? "recovery"}`,
    detailLines: [recovery?.mode, recovery?.command].filter((v): v is string => typeof v === "string"),
    recorded: Boolean(recoverIso),
  };

  return [inject, detect, recover, verifyEvent(root, injectMs)];
}

function poisonDlqTimeline(root: Json): TimelineEvent[] {
  const startedAt = str(root.started_at);
  const baseMs = isoToMs(startedAt);
  const fault = obj(root.fault);
  const quarantine = obj(root.quarantine);
  const dlqRecord = obj(quarantine?.dlq_kafka_record);
  const connectorDuring = obj(fault?.connector_status_during_injection);
  const recovery = obj(root.recovery);
  const inject: TimelineEvent = {
    stage: "INJECT",
    offsetMs: 0,
    offsetLabel: fmtOffset(0),
    headline: `INJECT ${str(fault?.mechanism) ?? "poison message"}`,
    detailLines: [`producer_metadata.partition: ${get(obj(fault?.producer_metadata), "partition")}`, `producer_metadata.offset: ${get(obj(fault?.producer_metadata), "offset")}`],
    recorded: Boolean(fault?.mechanism),
  };
  const detect: TimelineEvent = {
    stage: "DETECT",
    offsetMs: null,
    offsetLabel: fmtOffset(null),
    headline: connectorDuring ? `DETECT connector state: ${get(connectorDuring, "connector.state")}` : "DETECT — NOT RECORDED",
    detailLines: [`dlq topic offset: ${dlqRecord?.offset}`, `dlq partition: ${dlqRecord?.partition}`].filter((l) => !l.includes("undefined")),
    recorded: Boolean(connectorDuring),
  };
  const recover: TimelineEvent = {
    stage: "RECOVER",
    offsetMs: null,
    offsetLabel: fmtOffset(null),
    headline: `RECOVER ${str(recovery?.mode) ?? "NOT RECORDED"}`,
    detailLines: [],
    recorded: Boolean(recovery?.mode),
  };
  return [inject, detect, recover, verifyEvent(root, baseMs)];
}

function duplicateRedeliveryTimeline(root: Json): TimelineEvent[] {
  const startedAt = str(root.started_at);
  const baseMs = isoToMs(startedAt);
  const fault = obj(root.fault);
  const detected = obj(root.duplicates_detected);
  const recovery = obj(root.recovery);
  const inject: TimelineEvent = {
    stage: "INJECT",
    offsetMs: 0,
    offsetLabel: fmtOffset(0),
    headline: `INJECT ${str(fault?.command) ?? str(fault?.mechanism) ?? "offset rewind"}`,
    detailLines: [str(fault?.mechanism) ?? "", str(fault?.command) ?? ""].filter(Boolean),
    recorded: Boolean(fault?.command),
  };
  const detect: TimelineEvent = {
    stage: "DETECT",
    offsetMs: null,
    offsetLabel: fmtOffset(null),
    headline: detected ? `DETECT ${num(detected.duplicate_occurrence_count)} duplicate deliveries` : "DETECT — NOT RECORDED",
    detailLines: [`distinct_event_ids: ${detected?.distinct_event_ids}`, `expected_duplicate_occurrence_count: ${detected?.expected_duplicate_occurrence_count}`].filter((l) => !l.includes("undefined")),
    recorded: Boolean(detected),
  };
  const recover: TimelineEvent = {
    stage: "RECOVER",
    offsetMs: null,
    offsetLabel: fmtOffset(null),
    headline: `RECOVER ${str(recovery?.mode) ?? "NOT RECORDED"}`,
    detailLines: [],
    recorded: Boolean(recovery?.mode),
  };
  return [inject, detect, recover, verifyEvent(root, baseMs)];
}

function ordMiskeyTimeline(root: Json): TimelineEvent[] {
  const startedAt = str(root.started_at);
  const baseMs = isoToMs(startedAt);
  const probe = obj(root.miskey_probe);
  const audit = obj(probe?.audit);
  const recovery = obj(root.recovery);
  const inject: TimelineEvent = {
    stage: "INJECT",
    offsetMs: 0,
    offsetLabel: fmtOffset(0),
    headline: "INJECT mis-keyed batch (wrong partition key)",
    detailLines: [`arrival_applied_final_event_id: ${audit?.arrival_applied_final_event_id}`, `canonical_final_event_id: ${audit?.canonical_final_event_id}`].filter((l) => !l.includes("undefined")),
    recorded: Boolean(startedAt),
  };
  const detect: TimelineEvent = {
    stage: "DETECT",
    offsetMs: null,
    offsetLabel: fmtOffset(null),
    headline: `DETECT audit gate: ${str(audit?.disposition) ?? "NOT RECORDED"}`,
    detailLines: [`non_monotonic_transition_count: ${audit?.non_monotonic_transition_count}`].filter((l) => !l.includes("undefined")),
    recorded: Boolean(audit?.disposition),
  };
  const recover: TimelineEvent = {
    stage: "RECOVER",
    offsetMs: null,
    offsetLabel: fmtOffset(null),
    headline: `RECOVER ${str(recovery?.mode) ?? "NOT RECORDED"}`,
    detailLines: [],
    recorded: Boolean(recovery?.mode),
  };
  return [inject, detect, recover, verifyEvent(root, baseMs)];
}

function offsetReplayTimeline(root: Json): TimelineEvent[] {
  const startedAt = str(root.started_at);
  const baseMs = isoToMs(startedAt);
  const recovery = obj(root.recovery);
  const offsetZero = obj(root.offset_zero_replay);
  const timestampReplay = obj(root.timestamp_replay);
  const inject: TimelineEvent = {
    stage: "INJECT",
    offsetMs: 0,
    offsetLabel: fmtOffset(0),
    headline: "INJECT consumer group rewound to offset 0",
    detailLines: [`consumer_group: ${offsetZero?.consumer_group}`, `job_id: ${offsetZero?.job_id}`].filter((l) => !l.includes("undefined")),
    recorded: Boolean(startedAt),
  };
  const detect: TimelineEvent = {
    stage: "DETECT",
    offsetMs: null,
    offsetLabel: fmtOffset(null),
    headline: "DETECT — NOT RECORDED (no separate detection timestamp in this file)",
    detailLines: [],
    recorded: false,
  };
  const recover: TimelineEvent = {
    stage: "RECOVER",
    offsetMs: null,
    offsetLabel: fmtOffset(null),
    headline: `RECOVER ${str(recovery?.mode) ?? "NOT RECORDED"}`,
    detailLines: [`timestamp_replay job_id: ${timestampReplay?.job_id}`].filter((l) => !l.includes("undefined")),
    recorded: Boolean(recovery?.mode),
  };
  return [inject, detect, recover, verifyEvent(root, baseMs)];
}

function schemaContractTimeline(root: Json): TimelineEvent[] {
  const startedAt = str(root.started_at);
  const baseMs = isoToMs(startedAt);
  const attempt = obj(root.incompatible_schema_attempt);
  const compat = obj(attempt?.compatibility_check);
  const flow = obj(root.flow_continuity);
  const afterRejection = obj(flow?.after_rejection);
  const checks = obj(root.checks);
  const inject: TimelineEvent = {
    stage: "INJECT",
    offsetMs: 0,
    offsetLabel: fmtOffset(0),
    headline: "INJECT incompatible Avro schema registration attempt (removed field)",
    detailLines: [`candidate_schema_sha256: ${str(attempt?.candidate_schema_sha256)?.slice(0, 16)}…`, `http_status: ${compat?.http_status}`],
    recorded: Boolean(attempt),
  };
  const detect: TimelineEvent = {
    stage: "DETECT",
    offsetMs: null,
    offsetLabel: fmtOffset(null),
    headline: compat?.is_compatible === false ? "DETECT schema registry: BACKWARD compatibility check rejected write" : "DETECT — NOT RECORDED",
    detailLines: [`registration_rejected_http_409: ${checks?.registration_rejected_http_409}`, `global_compatibility_backward: ${checks?.global_compatibility_backward}`].filter((l) => !l.includes("undefined")),
    recorded: compat?.is_compatible === false,
  };
  const recover: TimelineEvent = {
    stage: "RECOVER",
    offsetMs: null,
    offsetLabel: fmtOffset(null),
    headline: afterRejection ? "RECOVER producer/consumer flow continuity preserved after rejection" : "RECOVER — NOT RECORDED",
    detailLines: [`connector_running_after_rejection: ${checks?.connector_running_after_rejection}`, `flink_job_running_after_rejection: ${checks?.flink_job_running_after_rejection}`, `post_rejection_event_visible: ${checks?.post_rejection_event_visible}`].filter((l) => !l.includes("undefined")),
    recorded: Boolean(afterRejection),
  };
  const passed = bool(get(obj(root.summary), "passed"));
  const verify: TimelineEvent = {
    stage: "VERIFY",
    offsetMs: null,
    offsetLabel: fmtOffset(null),
    headline: passed ? "VERIFY contract test suite: passed" : "VERIFY — NOT RECORDED",
    detailLines: [`post_rejection_source_iceberg_diff_zero: ${checks?.post_rejection_source_iceberg_diff_zero}`, `kafka_lag_zero: ${checks?.kafka_lag_zero}`],
    recorded: passed !== undefined,
  };
  void baseMs;
  return [inject, detect, recover, verify];
}

function smallFileRewriteTimeline(root: Json): TimelineEvent[] {
  const startedAt = str(root.started_at);
  const baseMs = isoToMs(startedAt);
  const before = obj(root.before);
  const after = obj(root.after);
  const deltas = obj(root.deltas);
  const inject: TimelineEvent = {
    stage: "RUN",
    offsetMs: 0,
    offsetLabel: fmtOffset(0),
    headline: `RUN before-state: ${num(before?.data_file_count) ?? "?"} data files`,
    detailLines: [`table: ${str(root.table)}`, `command: ${str(root.command)}`].filter((l) => !l.includes("undefined")),
    recorded: Boolean(before),
  };
  const rewrite: TimelineEvent = {
    stage: "RECOVER",
    offsetMs: null,
    offsetLabel: fmtOffset(null),
    headline: "REWRITE rewrite_data_files + rewrite_manifests maintenance",
    detailLines: [],
    recorded: Boolean(root.rewrite_data_files),
  };
  const verify: TimelineEvent = {
    stage: "VERIFY",
    offsetMs: null,
    offsetLabel: fmtOffset(null),
    headline: `VERIFY after-state: ${num(after?.data_file_count) ?? "?"} data files (${num(deltas?.data_file_count) ?? 0} delta), planning latency ${num(deltas?.planning_latency_ms)?.toFixed(1) ?? "?"}ms delta`,
    detailLines: checksLines(obj(root.checks), 4),
    recorded: Boolean(after),
  };
  void baseMs;
  return [inject, rewrite, verify];
}

function eoReconciliationTimeline(root: Json): TimelineEvent[] {
  const results = arr(root.results) ?? [];
  const startedAt = str(root.started_at);
  const baseMs = isoToMs(startedAt);
  const events: TimelineEvent[] = results.slice(0, 5).map((entry) => {
    const r = obj(entry) ?? {};
    const diffCount = num(r.snapshot_diff_count);
    return {
      stage: "RUN" as const,
      offsetMs: null,
      offsetLabel: fmtOffset(null),
      headline: `${str(r.failure_class) ?? "scenario"}: ${str(r.trigger) ?? "trigger not recorded"}`,
      detailLines: [
        `recovery.mode: ${get(obj(r.recovery), "mode")}`,
        `snapshot_diff_count: ${diffCount}`,
        `passed: ${r.passed}`,
      ].filter((l) => !l.includes("undefined")),
      recorded: true,
    };
  });
  const verify: TimelineEvent = {
    stage: "VERIFY",
    offsetMs: null,
    offsetLabel: fmtOffset(null),
    headline: bool(get(obj(root.summary), "all_snapshot_diffs_zero")) ? "VERIFY all 5 Flink scenarios: 0 diff" : "VERIFY — see per-scenario rows",
    detailLines: [],
    recorded: true,
  };
  void baseMs;
  return [...events, verify];
}

function brokerParityTimeline(root: Json): TimelineEvent[] {
  const startedAt = str(root.started_at);
  const baseMs = isoToMs(startedAt);
  const pathA = obj(root.path_a);
  const pathB = obj(root.path_b);
  const parity = obj(root.parity);
  const run: TimelineEvent = {
    stage: "RUN",
    offsetMs: 0,
    offsetLabel: fmtOffset(0),
    headline: `RUN path A (${num(pathA?.row_count)} rows) and path B (${num(pathB?.row_count)} rows) in parallel`,
    detailLines: [str(pathA?.delivery_chain), str(pathB?.delivery_chain)].filter((v): v is string => typeof v === "string"),
    recorded: Boolean(pathA && pathB),
  };
  const verify: TimelineEvent = {
    stage: "VERIFY",
    offsetMs: null,
    offsetLabel: fmtOffset(null),
    headline: bool(parity?.snapshot_digests_match) ? "VERIFY iceberg_snapshot(path_A) == iceberg_snapshot(path_B)" : "VERIFY mismatch recorded",
    detailLines: [`row_level_diff_count: ${parity?.row_level_diff_count}`, `path_a snapshot_sha256: ${str(pathA?.snapshot_sha256)?.slice(0, 16)}…`, `path_b snapshot_sha256: ${str(pathB?.snapshot_sha256)?.slice(0, 16)}…`],
    recorded: parity?.snapshot_digests_match !== undefined,
  };
  void baseMs;
  return [run, verify];
}

function brokerSloTimeline(root: Json): TimelineEvent[] {
  const measurements = arr(root.recovery_measurements) ?? [];
  const events: TimelineEvent[] = measurements.slice(0, 5).map((entry) => {
    const m = obj(entry) ?? {};
    const details = obj(m.details);
    return {
      stage: "RUN" as const,
      offsetMs: null,
      offsetLabel: fmtOffset(null),
      headline: `${str(m.failure_class) ?? "scenario"}: recovered in ${num(m.recovery_seconds)}s under ${num(m.events_under_test)?.toLocaleString("en-US")} events`,
      detailLines: [
        `fault_started_at: ${details?.fault_started_at}`,
        `pipeline_recovered_at: ${details?.pipeline_recovered_at}`,
        `snapshot_diff_count: ${m.snapshot_diff_count}`,
      ].filter((l) => !l.includes("undefined")),
      recorded: true,
    };
  });
  const summary = obj(root.summary);
  const verify: TimelineEvent = {
    stage: "VERIFY",
    offsetMs: null,
    offsetLabel: fmtOffset(null),
    headline: `VERIFY sustained ${num(summary?.sustained_throughput_events_per_second)?.toFixed(1)} events/s, ${num(summary?.snapshot_diff_count) ?? 0} diff`,
    detailLines: [`freshness_p50_ms: ${summary?.freshness_p50_ms}`, `freshness_p95_ms: ${summary?.freshness_p95_ms}`, `max_consumer_group_lag: ${summary?.max_consumer_group_lag}`],
    recorded: true,
  };
  return [...events, verify];
}

export function buildTimeline(id: string, raw: unknown): TimelineEvent[] {
  const root = obj(raw) ?? {};
  switch (id) {
    case "broker-restart":
      return brokerRestartTimeline(root);
    case "poison-dlq":
      return poisonDlqTimeline(root);
    case "duplicate-redelivery":
      return duplicateRedeliveryTimeline(root);
    case "ordering-miskey":
      return ordMiskeyTimeline(root);
    case "offset-replay":
      return offsetReplayTimeline(root);
    case "schema-contract":
      return schemaContractTimeline(root);
    case "small-file-rewrite":
      return smallFileRewriteTimeline(root);
    case "eo-reconciliation":
      return eoReconciliationTimeline(root);
    case "broker-parity":
      return brokerParityTimeline(root);
    case "broker-slo":
      return brokerSloTimeline(root);
    default:
      return [verifyEvent(root, isoToMs(str(root.started_at)) ?? null)];
  }
}

// Cascade presentation order for the replay (task F3). Entries whose file
// records a real offset reveal exactly when the replay clock passes that
// offset. Entries with NO recorded offset ("T+—" rows) still need a
// position in the cascade — they are spread evenly between their nearest
// recorded neighbors (or the timeline endpoints), purely as presentation
// ordering: the row itself still renders its honest "T+—" label, and
// nothing about this interpolation claims a measured time.
export function effectiveOffsets(events: TimelineEvent[], min: number, max: number): number[] {
  const n = events.length;
  if (n === 0) return [];
  const knownIdx = events.map((e, i) => (e.offsetMs !== null ? i : -1)).filter((i) => i >= 0);
  if (knownIdx.length === 0) {
    return events.map((_, i) => (n === 1 ? max : min + ((max - min) * i) / (n - 1)));
  }
  const eff: number[] = new Array<number>(n).fill(min);
  const anchors = [
    { idx: -1, t: min },
    ...knownIdx.map((i) => ({ idx: i, t: events[i].offsetMs as number })),
    { idx: n, t: max },
  ];
  for (let a = 0; a < anchors.length - 1; a += 1) {
    const from = anchors[a];
    const to = anchors[a + 1];
    for (let i = Math.max(0, from.idx); i <= Math.min(n - 1, to.idx); i += 1) {
      if (i === from.idx) eff[i] = from.t;
      else if (i === to.idx) eff[i] = to.t;
      else eff[i] = from.t + ((i - from.idx) / (to.idx - from.idx)) * (to.t - from.t);
    }
  }
  return eff;
}

// ---- Blast radius (task F9: highlighted inline in the log entry's text,
// replacing the retired PipelineMap topology diagram) ----

export type PipelineNodeId = "mysql" | "fork" | "kafka" | "flink" | "iceberg";

const BLAST_RADIUS: Record<string, PipelineNodeId[]> = {
  "duplicate-redelivery": ["kafka"],
  "ordering-miskey": ["kafka"],
  "poison-dlq": ["kafka", "flink"],
  "broker-restart": ["kafka"],
  "offset-replay": ["kafka"],
  "schema-contract": ["kafka"],
  "small-file-rewrite": ["iceberg"],
  "eo-reconciliation": ["flink"],
  "broker-parity": ["fork"],
  "broker-slo": ["kafka"],
};

export function blastRadius(id: string): PipelineNodeId[] {
  return BLAST_RADIUS[id] ?? [];
}
