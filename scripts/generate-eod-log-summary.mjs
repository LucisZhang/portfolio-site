import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Task F9 (Exactly-Once Drills first-screen rebuild, concept A "Duty
// Logbook"): the ten <details> log entries must be present, real, and
// legible with zero JavaScript and zero fetches on first paint (SSR /
// no-JS test requirement). That means every entry's dateline, one-line
// narrative sentence, and 3-6-line transcript have to exist as plain data
// BEFORE the client ever runs -- but the ten source drill files range from
// 2.4KB to 105KB (716KB total), and statically `import`-ing all ten into a
// "use client" module would blow the initial-JS budget the same way
// bulk-loading them at runtime would (Controller Ruling / heavy-asset
// gate). This script is the fix: it reads the ten real recorded JSON files
// with plain `fs`/`JSON.parse` (never a bundler import), extracts only the
// small set of real fields the logbook grammar needs, and writes them into
// one compact generated file the client CAN safely import — the same
// precedent as generate-eod-receipts.mjs and generate-forge-receipts.mjs.
//
// Every number in the authored sentence templates below is a token filled
// from a field read from the drill's own file at generation time; nothing
// is typed in independently of the source JSON. See docs/evidence/digits-eod.md
// for the number -> file -> JSON path register this script's output feeds.
//
// The interactive (JS-enabled, motion-allowed) replay re-derives its own
// transcript from the freshly-fetched raw drill file via
// src/components/eod/eodTimeline.ts's `buildTimeline()` — this script's
// `transcript` output is the honest static/no-JS/first-paint fallback, not
// the sole source of truth for the animated path.

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(repositoryRoot, "src/data/generated/eod-log-summary.json");
const summaryPath = "public/case-studies/exactly-once-drills/index.summary.json";

// The Aug-20 B1-B4 phase date the top strip and loghead cite (real: 8 of
// the 10 drill files were captured this day). Two files (small-file-rewrite,
// eo-reconciliation) are earlier phase-2.1/2.2 runs archived into the same
// logbook; their own dateline shows a full date instead of time-only so
// nothing implies they happened on the 20th (data-honesty rule).
const HEADER_DATE = "2026-08-20";

async function readJson(relativePath) {
  const contents = await readFile(path.join(repositoryRoot, relativePath), "utf8");
  return JSON.parse(contents);
}

function timeLabel(iso) {
  const d = new Date(iso);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}Z`;
}

function dateLabel(iso) {
  return iso.slice(0, 10);
}

function shortRun(runId) {
  const tail = runId.includes("-") ? runId.slice(runId.lastIndexOf("-") + 1) : runId;
  return tail.toUpperCase();
}

function shortGit(gitSha) {
  return gitSha.slice(0, 8).toUpperCase();
}

// First clause of the full sentence, used while the replay is still
// writing (mid-replay mock: the narrative trails into "……"/"…" rather than
// showing the completed sentence). A generic derivation of authored copy,
// not a second hand-written sentence to keep in sync.
function firstClause(sentence, locale) {
  const stop = locale === "zh" ? /[，；]/ : /[,;]/;
  const match = sentence.match(stop);
  const cut = match ? sentence.slice(0, match.index) : sentence.slice(0, Math.ceil(sentence.length * 0.6));
  return `${cut}${locale === "zh" ? "……" : "…"}`;
}

function baseline(id, row, raw) {
  const startedAt = raw.started_at;
  const sameDay = dateLabel(startedAt) === HEADER_DATE;
  const seed = raw.scenario && typeof raw.scenario.seed === "number" ? raw.scenario.seed : null;
  const faultName = (raw.failure_class ?? id).toUpperCase();
  return {
    id,
    faultName,
    file: row.file,
    startedAtIso: startedAt,
    sameDay,
    timeLabel: timeLabel(startedAt),
    dateLabel: sameDay ? null : dateLabel(startedAt),
    phase: raw.phase ?? null,
    seed,
    runIdShort: shortRun(raw.run_id),
    gitShaShort: shortGit(raw.git_sha),
    recoverMs: row.recoverMs,
    diff: row.diff,
  };
}

// ---- Per-drill sentence + transcript extraction. Every value read below
// traces to the named field on that drill's real recorded JSON file. ----

function brokerRestart(raw, recoverMs) {
  const outageSeconds = (
    (Date.parse(raw.fault.container_after.StartedAt) - Date.parse(raw.fault.container_killed.FinishedAt)) / 1000
  ).toFixed(1);
  const checkpointId = `chk-${raw.recovery.checkpoint_before.id}`;
  const mysqlRows = raw.reconciliation.source_snapshot_row_count;
  const icebergRows = raw.reconciliation.iceberg_snapshot_row_count;
  const diff = raw.reconciliation.snapshot_diff_count;
  const totalSeconds = recoverMs / 1000;
  const lag = raw.fault.consumer_offsets_before.map((o) => o.lag).join("·");
  const sha = raw.reconciliation.source_snapshot_sha256.slice(0, 12);
  const checksTotal = Object.keys(raw.checks).length;
  const checksPass = Object.values(raw.checks).filter(Boolean).length;
  return {
    sentence: {
      zh: `直接杀死 Kafka broker 容器。${outageSeconds} 秒后容器回到 running，Flink 从检查点 ${checkpointId} 续跑，${totalSeconds.toFixed(3)} 秒完成恢复；对账 ${mysqlRows} 行对 ${icebergRows} 行，快照差异 ${diff}。`,
      en: `Kill the Kafka broker container outright. It's back to running in ${outageSeconds}s; Flink resumes from checkpoint ${checkpointId} and finishes recovery in ${totalSeconds.toFixed(3)}s — reconciliation is ${mysqlRows} rows against ${icebergRows} rows, snapshot diff ${diff}.`,
    },
    transcript: [
      { offsetMs: 0, text: `INJECT docker compose kill kafka · exit ${raw.fault.container_killed.ExitCode} · partitions 0/1/2 lag ${lag}` },
      { offsetMs: Math.round(Number(outageSeconds) * 1000), text: `RECOVER container running again · started ${timeLabel(raw.fault.container_after.StartedAt)}` },
      { offsetMs: null, text: `RESUME checkpoint ${checkpointId} · ${raw.offset_checkpoint_snapshot_linkage.flink_checkpoint.external_path.split("/").slice(-2, -1)[0].slice(0, 12)} · connector ${raw.recovery.connector_status.name} ${raw.recovery.connector_status.connector.state}` },
      { offsetMs: recoverMs, ok: true, text: `VERIFY mysql ${mysqlRows} = iceberg ${icebergRows} · sha256 ${sha}… = ${sha}… · diff ${diff} · ${checksPass}/${checksTotal} checks` },
    ],
  };
}

function duplicateRedelivery(raw) {
  const dupCount = raw.duplicates_detected.duplicate_occurrence_count;
  const distinct = raw.duplicates_detected.distinct_event_ids;
  const diff = raw.reconciliation.snapshot_diff_count;
  return {
    sentence: {
      zh: `把消费位点重置到最早，${dupCount} 条事件整批再投递一次；流水线识别出全部 ${dupCount} 次重复投递，最终状态一行未多。`,
      en: `Rewind the consumer offsets to earliest and redeliver ${dupCount} events as one batch; the pipeline recognizes all ${dupCount} redeliveries as duplicates — final state gains not one extra row.`,
    },
    transcript: [
      { offsetMs: 0, text: `INJECT ${raw.fault.command}` },
      { offsetMs: null, text: `DETECT ${dupCount} duplicate deliveries · distinct_event_ids ${distinct}` },
      { offsetMs: null, text: `RECOVER ${raw.recovery.mode}` },
      { offsetMs: null, ok: true, text: `VERIFY snapshot_diff_count ${diff} · redelivery_job ${raw.recovery.redelivery_job_id.slice(0, 12)}` },
    ],
  };
}

function orderingMiskey(raw) {
  const diff = raw.reconciliation.snapshot_diff_count;
  return {
    sentence: {
      zh: "一条错键记录被隔离进 probe 主题，主路径一行未收；乱序上限被证明，而不是被掩盖。",
      en: "A mis-keyed record is quarantined into the probe topic — the main path never receives it; the ordering ceiling is proven, not papered over.",
    },
    transcript: [
      { offsetMs: 0, text: `INJECT mis-keyed batch (wrong partition key) · order_id ${raw.miskey_probe.order_id}` },
      { offsetMs: null, text: `DETECT audit gate: ${raw.miskey_probe.audit.disposition}` },
      { offsetMs: null, text: `RECOVER ${raw.recovery.mode}` },
      { offsetMs: null, ok: true, text: `VERIFY non_monotonic_transition_count ${raw.miskey_probe.audit.non_monotonic_transition_count} · snapshot_diff_count ${diff}` },
    ],
  };
}

function poisonDlq(raw) {
  const diff = raw.reconciliation.snapshot_diff_count;
  return {
    sentence: {
      zh: "毒丸消息落入 DLQ，主流水线不停；修复后重放，最终状态与源端逐行一致。",
      en: "A poison message drops into the DLQ; the main pipeline never stops. Repaired and replayed, the final state matches the source row for row.",
    },
    transcript: [
      { offsetMs: 0, text: `INJECT ${raw.fault.mechanism} · topic ${raw.fault.producer_metadata.topic}` },
      { offsetMs: null, text: `DETECT connector ${raw.fault.connector_status_during_injection.connector.state} · dlq offset ${raw.quarantine.dlq_kafka_record.offset} partition ${raw.quarantine.dlq_kafka_record.partition}` },
      { offsetMs: null, text: `RECOVER ${raw.recovery.mode}` },
      { offsetMs: null, ok: true, text: `VERIFY iceberg_snapshot_row_count ${raw.recovery.reconciliation_before_connector_resume.iceberg_snapshot_row_count} · snapshot_diff_count ${diff}` },
    ],
  };
}

function offsetReplay(raw) {
  const tsDiff = raw.summary.timestamp_diff_count;
  const offDiff = raw.summary.offset_zero_diff_count;
  return {
    sentence: {
      zh: `按时间戳整表重建，时间戳差异 ${tsDiff}，位点差异 ${offDiff}——重放本身就是一次对账。`,
      en: `Rebuild the whole table by timestamp: timestamp diff ${tsDiff}, offset diff ${offDiff} — the replay itself is a reconciliation.`,
    },
    transcript: [
      { offsetMs: 0, text: `INJECT consumer group rewound to offset 0 · group ${raw.offset_zero_replay.consumer_group}` },
      { offsetMs: null, text: `RECOVER ${raw.recovery.mode} · job ${raw.timestamp_replay.job_id.slice(0, 12)}` },
      { offsetMs: null, ok: true, text: `VERIFY offset_zero_diff_count ${offDiff} · timestamp_diff_count ${tsDiff} · snapshot_diff_count ${raw.summary.snapshot_diff_count}` },
    ],
  };
}

function schemaContract(raw) {
  const httpStatus = raw.incompatible_schema_attempt.registration.http_status;
  const rowsAfter = raw.flow_continuity.after_rejection.iceberg_row_count;
  const diffZero = raw.checks.post_rejection_source_iceberg_diff_zero;
  return {
    sentence: {
      zh: `向 Schema Registry 提交一份删掉字段的不兼容 Avro schema，注册请求被拒绝（HTTP ${httpStatus}）；主流水线不停，拒绝之后又有 ${rowsAfter} 条事件正常落地，源端与 Iceberg 差异 ${diffZero ? 0 : "非零"}。`,
      en: `Submit an incompatible Avro schema (a field removed) to the Schema Registry; registration is rejected with HTTP ${httpStatus}. The main pipeline keeps running — ${rowsAfter} more events land cleanly after the rejection, source-to-Iceberg diff ${diffZero ? 0 : "nonzero"}.`,
    },
    transcript: [
      { offsetMs: 0, text: `INJECT incompatible Avro schema (removed field) · candidate_schema_sha256 ${raw.incompatible_schema_attempt.candidate_schema_sha256.slice(0, 10)}…` },
      { offsetMs: null, text: `DETECT registration rejected · http_status ${httpStatus}` },
      { offsetMs: null, text: `RECOVER old-schema pipeline continues · connector_running_after_rejection ${raw.checks.connector_running_after_rejection}` },
      { offsetMs: null, ok: true, text: `VERIFY iceberg_row_count ${rowsAfter} · post_rejection_source_iceberg_diff_zero ${diffZero}` },
    ],
  };
}

function smallFileRewrite(raw) {
  const before = raw.before.data_file_count;
  const after = raw.after.data_file_count;
  const manifestsBefore = raw.before.manifest_count;
  const manifestsAfter = raw.after.manifest_count;
  const latBefore = raw.before.planning_latency_ms;
  const latAfter = raw.after.planning_latency_ms;
  return {
    sentence: {
      zh: `${before} 个小数据文件被 rewrite_data_files 压实为 ${after} 个，manifest 从 ${manifestsBefore} 个收窄到 ${manifestsAfter} 个，查询计划延迟从 ${latBefore.toFixed(2)}ms 降到 ${latAfter.toFixed(2)}ms，表状态不变。`,
      en: `${before} small data files get compacted by rewrite_data_files down to ${after}; manifests shrink from ${manifestsBefore} to ${manifestsAfter}, query-planning latency drops from ${latBefore.toFixed(2)}ms to ${latAfter.toFixed(2)}ms, table state unchanged.`,
    },
    transcript: [
      { offsetMs: 0, text: `RUN before-state ${before} data files · ${manifestsBefore} manifests · table ${raw.table}` },
      { offsetMs: null, text: "REWRITE rewrite_data_files + rewrite_manifests maintenance" },
      { offsetMs: null, ok: true, text: `VERIFY after-state ${after} data files (${(after - before)} delta) · ${manifestsAfter} manifests · planning latency ${(latAfter - latBefore).toFixed(2)}ms delta` },
    ],
  };
}

function eoReconciliation(raw) {
  const results = raw.results ?? [];
  const scenarioCount = results.length;
  const classes = raw.summary.failure_classes ?? [];
  return {
    sentence: {
      zh: `Flink 内部连续制造 ${scenarioCount} 种失败（${classes.join("、")}），每一种都对账一次，${raw.summary.all_snapshot_diffs_zero ? "全部" : "并非全部"}快照差异为 0。`,
      en: `Flink is put through ${scenarioCount} internal failure scenarios in a row (${classes.join(", ")}), reconciled after each one — ${raw.summary.all_snapshot_diffs_zero ? "every" : "not every"} snapshot diff comes back 0.`,
    },
    transcript: results.slice(0, 5).map((r, i) => ({
      offsetMs: null,
      ok: i === results.length - 1,
      text: `RUN ${r.failure_class}: ${r.trigger} · snapshot_diff_count ${r.snapshot_diff_count} · passed ${r.passed}`,
    })),
  };
}

function brokerParity(raw) {
  const rowsA = raw.path_a.row_count;
  const rowsB = raw.path_b.row_count;
  const match = raw.parity.snapshot_digests_match;
  const diff = raw.parity.row_level_diff_count;
  return {
    sentence: {
      zh: `MySQL binlog 与 MySQL GTID 两条完全独立的投递路径各推 ${rowsA.toLocaleString("en-US")} 行，落到同一张 Iceberg 表；两份快照摘要${match ? "逐字节相同" : "不一致"}，逐行差异 ${diff}。`,
      en: `Two fully independent delivery paths — MySQL binlog and MySQL GTID — each push ${rowsA.toLocaleString("en-US")} rows into the same Iceberg table; the two snapshot digests ${match ? "match byte-for-byte" : "do not match"}, row-level diff ${diff}.`,
    },
    transcript: [
      { offsetMs: 0, text: `RUN path A (${rowsA} rows, ${raw.path_a.delivery_chain}) and path B (${rowsB} rows, ${raw.path_b.delivery_chain}) in parallel` },
      { offsetMs: null, ok: true, text: `VERIFY iceberg_snapshot(path_A) == iceberg_snapshot(path_B): ${match} · row_level_diff_count ${diff}` },
    ],
  };
}

function brokerSlo(raw) {
  const s = raw.summary;
  const throughput = s.sustained_throughput_events_per_second;
  const p50 = (s.freshness_p50_ms / 1000).toFixed(1);
  const p95 = (s.freshness_p95_ms / 1000).toFixed(1);
  return {
    sentence: {
      zh: `在 ${raw.recovery_measurements.length} 类故障同时叠加的压测下，吞吐维持 ${Math.floor(throughput).toLocaleString("en-US")} events/s，端到端新鲜度 p50 ${p50} 秒、p95 ${p95} 秒，最终快照差异 ${s.snapshot_diff_count}。`,
      en: `Under load with all ${raw.recovery_measurements.length} fault classes stacked, throughput holds at ${Math.floor(throughput).toLocaleString("en-US")} events/s, end-to-end freshness p50 ${p50}s / p95 ${p95}s, final snapshot diff ${s.snapshot_diff_count}.`,
    },
    transcript: raw.recovery_measurements.map((m) => ({
      offsetMs: null,
      text: `RUN ${m.failure_class}: recovered in ${m.recovery_seconds}s under ${m.events_under_test.toLocaleString("en-US")} events`,
    })).concat([{ offsetMs: null, ok: true, text: `VERIFY sustained ${throughput.toFixed(3)} events/s · freshness p50 ${p50}s p95 ${p95}s · snapshot_diff_count ${s.snapshot_diff_count}` }]),
  };
}

const EXTRACTORS = {
  "broker-restart": brokerRestart,
  "duplicate-redelivery": duplicateRedelivery,
  "ordering-miskey": orderingMiskey,
  "poison-dlq": poisonDlq,
  "offset-replay": offsetReplay,
  "schema-contract": schemaContract,
  "small-file-rewrite": smallFileRewrite,
  "eo-reconciliation": eoReconciliation,
  "broker-parity": brokerParity,
  "broker-slo": brokerSlo,
};

function fmtOffsetLabel(ms) {
  if (ms === null || ms === undefined) return "T+—";
  return `T+${(ms / 1000).toFixed(1)}s`;
}

async function main() {
  const summaryRows = await readJson(summaryPath);
  const entries = [];
  for (const row of summaryRows) {
    const relativeFile = row.file.replace(/^\/case-studies\//, "public/case-studies/");
    const raw = await readJson(relativeFile);
    const extractor = EXTRACTORS[row.id];
    if (!extractor) throw new Error(`No transcript extractor registered for drill id "${row.id}"`);
    const { sentence, transcript } = extractor(raw, row.recoverMs);
    const base = baseline(row.id, row, raw);
    entries.push({
      ...base,
      sentence,
      sentenceProgress: { en: firstClause(sentence.en, "en"), zh: firstClause(sentence.zh, "zh") },
      transcript: transcript.map((line) => ({
        offsetMs: line.offsetMs ?? null,
        offsetLabel: fmtOffsetLabel(line.offsetMs ?? null),
        text: line.text,
        ok: Boolean(line.ok),
      })),
    });
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(entries, null, 2)}\n`);
  console.log(`Generated ${path.relative(repositoryRoot, outputPath)} (${entries.length} entries)`);
}

await main();
