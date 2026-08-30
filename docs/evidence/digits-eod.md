# Exactly-Once Drills digits — number → file → JSON path → SHA-256

G2 register for the Round-2 Exactly-Once Drills fault-chessboard rebuild
(task 2.3, `/engineering/exactly-once-drills`, spec §6.5). Every number
rendered by `src/components/eod/*.tsx` traces to one of these files:

- `public/case-studies/exactly-once-drills/index.summary.json` — 2,446
  bytes, sha256
  `c008972eaf6da3e53c1b5419177b608e46b6dd4f31dd1629ca1a0af2308008ee`. Built
  by `scripts/generate-eod-summary.mjs` (a prior task's adapter, registered
  in `docs/evidence/r2-source-map.md`); treated here as the SSR source of
  truth for the chessboard's 10 rows.
- `public/case-studies/exactly-once-drills/results/broker_restart_drill.json`
  — 79,102 bytes, sha256
  `78896060dfa5b32a1717d8add8e2fe01447c2fd84c3f0d05fcd207eb0ac821f1`. The
  default-selected drill; statically imported so exhibit 01 shows a
  complete demo with zero clicks (Instrument Commandment #2).
- `public/case-studies/exactly-once-drills/results/broker_parity.json` —
  4,699 bytes, sha256
  `48be70bbe064112add6478c5beecf896149bf48d3bef867cfc2ece09a15b88d2`. Path
  A/B traffic and the dual-path parity exhibit (03).
- `public/case-studies/exactly-once-drills/results/broker_slo.json` —
  105,652 bytes, sha256
  `5176dd0ac38d977813693de85fa2a6fc3fcfb9307048cc149b0408237488e200`. The
  hero/counter-line sustained-throughput figure, and the SLO chessboard
  cell's rich 16-sample lag time series.
- `public/case-studies/exactly-once-drills/results/checkpoint_metrics.json`
  — 22,126 bytes, sha256
  `6410dc9fe5af084e3412b9b668d0fe7712647dc68cefe90469f52895e77099ed`.
  Checkpoint-pressure exhibit (04).
- `public/case-studies/exactly-once-drills/results/manifest.json` — 3,252
  bytes, sha256
  `7867fb1ec1f91787ada2bb9141426b29273324f8d84b3eac6968572085120d32`.
  Receipts exhibit "result manifest" line.
- The other 9 files under `public/case-studies/exactly-once-drills/results/`
  — one per remaining chessboard row — fetched client-side only after the
  visitor clicks that row's cell. Their sha256/byte values are computed by
  `scripts/generate-eod-receipts.mjs` (independently, not copied from
  `manifest.json`) into `eod-receipts.json`'s `drillFileHashes`, and shown
  per-row in the exhibit 02 static `<details>` tables and download links.
- `src/data/generated/eod-receipts.json` — this task's adapter
  (`scripts/generate-eod-receipts.mjs`, `npm run generate:eod-receipts`),
  hashing `index.summary.json`, `broker_slo.json`, `manifest.json`, and all
  10 result files directly, and reading `broker_slo.json`'s own
  `summary.sustained_throughput_events_per_second` rather than typing
  `1791.665` into a component.

Regenerate before re-auditing:

```
node scripts/generate-eod-receipts.mjs
```

No component in `src/components/eod/` contains a literal benchmark number
typed directly into a `.tsx`/`.ts` file; every value is read from one of the
files above at import time (`eodData.ts`), fetched at click time and
normalized by `eodTimeline.ts`, or computed from them with a pure formatter
in `eodFormat.ts`.

## Hero (3-cell stat checkerboard + counter line)

| Value | Label | Source file | JSON path |
| --- | --- | --- | --- |
| `10` | failure classes drilled | `eod-receipts.json` | `$.drillCount` (`= index.summary.json.length`) |
| `0` | snapshot diffs | `eod-receipts.json` | `$.allDiffsZero` (`= every row.diff === 0` in `index.summary.json`) |
| `1791/s` | sustained throughput | `eod-receipts.json` | `$.sustainedThroughputEventsPerSecond` (`= broker_slo.json $.summary.sustained_throughput_events_per_second`, truncated via `eodData.ts`'s `formattedThroughput()`, to match the phrasing already used in `src/lib/projects.ts`'s eod entry) |

Counter line `NNNN events/s · drill NN/10 · diff = N` (`eodData.ts`,
`counterLine()`): throughput as above; `drill NN/10` = 1-indexed position of
the currently-selected row in `index.summary.json` (`EOD_ROWS`); `diff = N`
= that row's own `diff` field. All three update live as a different cell is
selected — not a static caption.

**Fix-round correction (review finding, Critical)**: the hero stat tile
(`EodPage.tsx`) originally called `.toFixed(0)` on the raw
`sustainedThroughputEventsPerSecond` independently of `counterLine()`,
which *rounds* 1791.665 to "1792" instead of *truncating* to "1791" —
visibly contradicting this doc, the counter line, and the report-layer
text on the same page. Both call sites now go through the single
`formattedThroughput()` helper (`eodData.ts`), and
`eod-r2.spec.ts` asserts the hero tile's exact rendered text so this
cannot regress silently again.

## Exhibit 01 / Hero instrument — DrillBoard + PipelineMap + DrillTimeline + ThroughputStrip + Scrubber

**DrillBoard** (`DrillBoard.tsx`): 10 rows, each 6 cells (FAULT/INJECT/
DETECT/RECOVER/VERIFY/DIFF), read directly from `index.summary.json`'s 10
entries — `id`, `abbr`, `injectMs`, `detectMs`, `recoverMs`, `verifyMs`,
`diff`, `file`. `injectMs`/`detectMs`/`verifyMs` are `null` for every row in
the shipped summary (the upstream adapter only populated `recoverMs`, for
the 5 broker-class rows) — rendered as `—`, never fabricated.

**PipelineMap** (`PipelineMap.tsx`): 5 nodes (MySQL/Fork/Kafka/Flink/
Iceberg). Edge thicknesses:

| Edge | Source file | JSON path |
| --- | --- | --- |
| Path A | `broker_parity.json` | `$.path_a.row_count` (1,000) |
| Path B | `broker_parity.json` | `$.path_b.row_count` (1,000) |
| Trunk (Kafka→Flink→Iceberg) | `eod-receipts.json` | `$.sustainedThroughputEventsPerSecond` |

Hover mini-cards show the same real numbers plus the file's own
`path_a.delivery_chain` / `path_b.delivery_chain` strings, read verbatim
via `eodData.ts`'s `pipelineTraffic.pathADeliveryChain`/
`pathBDeliveryChain` (**fix-round correction, review finding Important**:
these were previously hand-written summary strings in `PipelineMap.tsx`
that were not actually sourced from the field despite this doc's prior
claim, and the Path B summary silently dropped the real chain's
"-> Flink -> Iceberg" leg, implying Path B stops at Kafka. Both tooltips
now render the real field directly, so they cannot drift from it again).
Blast-radius highlighting
(`eodTimeline.ts`'s `blastRadius()`) is an editorial mapping of each drill
id to the pipeline node(s) its `claim_boundary`/mechanism most directly
damages (e.g. `broker-restart` → `kafka`, `small-file-rewrite` →
`iceberg`, `eo-reconciliation` → `flink`, `broker-parity` → `fork`) — a
documented interpretation, not a value read from a JSON field (no file
records "which topology node" a drill hits).

**DrillTimeline** (`DrillTimeline.tsx` via `eodTimeline.ts`'s
`buildTimeline()`): per-drill-id normalizer reading each result file's own
real fields. Per-drill source fields:

| Drill id | INJECT | DETECT | RECOVER | VERIFY |
| --- | --- | --- | --- | --- |
| `broker-restart` | `fault.started_at`, `fault.command` | `fault.container_killed.{ExitCode,Status,FinishedAt}` | `fault.recovered_at`, `recovery.{mode,command}` | `reconciliation.snapshot_diff_count`, `.{source,iceberg}_snapshot_sha256` |
| `poison-dlq` | `fault.mechanism`, `fault.producer_metadata` | `fault.connector_status_during_injection`, `quarantine.dlq_kafka_record` | `recovery.mode` | same as above |
| `duplicate-redelivery` | `fault.command`, `fault.mechanism` | `duplicates_detected.{duplicate_occurrence_count,distinct_event_ids}` | `recovery.mode` | same as above |
| `ordering-miskey` | `started_at` | `miskey_probe.audit.{disposition,non_monotonic_transition_count}` | `recovery.mode` | same as above |
| `offset-replay` | `started_at`, `offset_zero_replay.{consumer_group,job_id}` | NOT RECORDED (no separate detection timestamp in this file) | `recovery.mode`, `timestamp_replay.job_id` | same as above |
| `schema-contract` | `incompatible_schema_attempt.{candidate_schema_sha256,compatibility_check.http_status}` | `compatibility_check.is_compatible`, `checks.registration_rejected_http_409` | `flow_continuity.after_rejection`, `checks.connector_running_after_rejection` | `summary.passed`, `checks.post_rejection_source_iceberg_diff_zero` |
| `small-file-rewrite` | `before.data_file_count`, `table`, `command` (stage: RUN) | — | `rewrite_data_files`/`rewrite_manifests` presence (stage: RECOVER) | `after.data_file_count`, `deltas.{data_file_count,planning_latency_ms}`, `checks.*` |
| `eo-reconciliation` | per-scenario `results[].trigger` (5 real Flink scenarios) | — | per-scenario `results[].recovery.mode` | `results[].snapshot_diff_count`, `summary.all_snapshot_diffs_zero` |
| `broker-parity` | `path_a.row_count`, `path_b.row_count`, `.delivery_chain` (stage: RUN) | — | — | `parity.snapshot_digests_match`, `.row_level_diff_count`, `path_{a,b}.snapshot_sha256` |
| `broker-slo` | per-measurement `recovery_measurements[].details.fault_started_at` (5 real broker-class measurements) | — | `recovery_measurements[].details.pipeline_recovered_at` | `summary.{sustained_throughput_events_per_second,freshness_p50_ms,freshness_p95_ms,max_consumer_group_lag}` |

Every "—" above is rendered `recorded: false` / `NOT RECORDED` in the UI,
per the task brief's explicit fallback rule — never a fabricated timestamp.

**ThroughputStrip** (`ThroughputStrip.tsx` via `buildThroughputSeries()`):

- `broker-slo`: the real 16-sample `observability.time_series[]` (1s
  sample interval; `kafka_consumer_group_lag.sum` per sample), aligned to
  `recovery_measurements[broker-restart].details.{fault_started_at,
  pipeline_recovered_at}` as the t=0 / recovery markers.
- `broker-restart` (and any drill with `fault.started_at`/`recovered_at`
  and both partition-lag snapshots): a 2-point sparse curve —
  `fault.consumer_offsets_before[].lag` (summed) at t=0,
  `offset_checkpoint_snapshot_linkage.kafka_offsets[].lag` (summed, = 0) at
  recovery — explicitly labeled "2 recorded samples ... not a continuous
  measurement".
- All other drills: no time-ordered signal exists in their file; rendered
  "Throughput curve — NOT RECORDED for this drill."

## Exhibit 02 — Verification proposition (`EodPage.tsx`, `DrillBoard.tsx`'s `DrillDetailsStatic`)

`∀ drill ∈ {eod-receipts.json:$.drillCount} faults: iceberg_snapshot(path_A)
≡ iceberg_snapshot(path_B)` — 10 PASS rows, one per `index.summary.json`
row, verdict = `PASS` iff `row.diff === 0` (true for all 10 in the shipped
summary — `eod-receipts.json`'s `$.allDiffsZero`). The no-JS `<details>`
fallback shows each row's 4 timing columns + diff + a truncated sha256 from
`eod-receipts.json`'s `$.drillFileHashes[id]` + a real download link to
`index.summary.json`'s `file` field (verified live by `eod-r2.spec.ts`'s
HEAD-request test).

## Exhibit 03 — Dual-path parity (`EodPage.tsx`'s `DualPathParity`)

All values from `broker_parity.json`: `$.scenario.events` (1,000),
`$.path_a.{delivery_chain,row_count,snapshot_sha256}`,
`$.path_b.{delivery_chain,row_count,snapshot_sha256}`,
`$.parity.{snapshot_digests_match,row_level_diff_count}`.

## Exhibit 04 — Checkpoint pressure (`EodPage.tsx`'s `CheckpointPressure`)

All values from `checkpoint_metrics.json` (same real run as the pre-rebuild
page's `.p1-pressure-evidence`, re-sourced from the file rather than the
old component's own literals): `$.summary.baseline.max_checkpoint_duration_ms`
(55), `$.summary.under_backpressure.max_checkpoint_duration_ms` (19,022),
`$.summary.under_backpressure.max_iceberg_commit_lag_events` (320),
`$.summary.final.iceberg_commit_lag_events` (0),
`$.summary.final.checkpoint_failure_count` (1).

## Exhibit 05 — Source & receipts

`eod-receipts.json`'s `$.summary.sha256`, `$.brokerSlo.sha256`,
`$.manifest.sha256`, `$.generatedAt`. Boundary statement (English UI
fabric; zh independently authored, not translated) states what the page
does and does not prove.

## Absent data (honest NOT RECORDED, never fabricated)

1. **Raw multi-line log text** for the timeline's "key entries expand to
   3-5 real log lines" (spec §6.5's literal wording). The `.log` files
   referenced by every result file's `logs` field (e.g.
   `showcase/logs/phase-b3-broker-restart-broker-verify-*.log`) are not
   part of the frozen `public/case-studies/exactly-once-drills/` asset set
   this task is scoped to draw from (confirmed against
   `docs/evidence/r2-source-map.md`: only the `results/*.json` files and
   `index.summary.json` are registered). Expanded timeline entries instead
   show real structured fields from the same JSON file (container-inspect
   snapshots, probe audit objects, connector state, checkpoint metadata) —
   genuinely recorded data, not free-text log lines.
2. **`injectMs`/`detectMs`/`verifyMs`** for all 10 chessboard rows, and
   **`recoverMs`** for 5 of them (RECON/PARITY/SLO/SCHEMA/SMALLFILE) —
   `null` in the upstream-generated `index.summary.json`; rendered `—`.
3. **A single continuous throughput/events-per-second time series** for 8
   of the 10 drills (only `broker-slo` ships one). The other drills'
   ThroughputStrip either falls back to the 2-point sparse lag delta
   (5 broker-class files with both offset snapshots) or renders "NOT
   RECORDED".

Both are also cross-referenced in `docs/evidence/r2-source-map.md`'s EOD
rows.

## Task F9 — Duty Logbook first screen (2026-08)

The register above describes the retired fault-chessboard instrument
(DrillBoard's interactive board, PipelineMap, ThroughputStrip, Scrubber) and
still applies verbatim to what it kept powering: exhibit 02's static
`DrillDetailsStatic` appendix, the hero's `formattedThroughput()` stat, and
exhibits 03-05 — none of that is touched by this task.

The first screen (hero + former exhibit 01) is rebuilt to the user-approved
concept A mock (`output/design-align-r2/concept-a-logbook.html/.png`) as
`src/components/eod/EodLog.tsx` — ten native `<details>` log entries, each
server-rendered from a new generated file:

- `src/data/generated/eod-log-summary.json` — 17,702 bytes, sha256
  `bd96c9fda1940d79a09c863e850bd502e01fb4db35e1475f5f2de9aef0592543`. Built
  by `scripts/generate-eod-log-summary.mjs` (`npm run generate:eod-log-summary`),
  which reads `public/case-studies/exactly-once-drills/index.summary.json`
  and all ten `results/*.json` files with plain `fs.readFileSync`/
  `JSON.parse` (never a bundler `import`, so the 716KB corpus never enters
  a JS chunk) and extracts, per drill: `startedAtIso`/`timeLabel`/
  `dateLabel` (`started_at`), `phase` (`phase`), `seed` (`scenario.seed`),
  `runIdShort` (last 8 chars of `run_id`, uppercased), `gitShaShort` (first
  8 chars of `git_sha`, uppercased), `faultName` (`failure_class`, or the
  drill id uppercased when the file doesn't carry one), `recoverMs`/`diff`
  (from `index.summary.json`, unchanged), a bilingual authored `sentence`
  with every number token filled from the fields below, and a `transcript`
  of 2-6 real lines. This file is small enough to import safely from the
  client component (unlike the raw per-drill files) and is what makes the
  no-JS/first-paint requirement possible without bulk-loading the corpus.

Per-entry number sources (all ten; only the fields the sentence/transcript
actually render are listed — see `scripts/generate-eod-log-summary.mjs`'s
per-drill extractor function for the exact field paths):

| Drill id | Sentence numbers | Source file → JSON path |
| --- | --- | --- |
| `broker-restart` | 5.8s outage, `chk-1`, 47.688s, 120/120 rows, diff 0 | `broker_restart_drill.json` → `fault.container_killed.FinishedAt`/`fault.container_after.StartedAt` (outage), `recovery.checkpoint_before.id`, `index.summary.json`'s `recoverMs`, `reconciliation.{source,iceberg}_snapshot_row_count`/`snapshot_diff_count` |
| `duplicate-redelivery` | 36 duplicates | `duplicate_redelivery_drill.json` → `duplicates_detected.duplicate_occurrence_count` |
| `ordering-miskey` | (no embedded numbers, matching the mock) | `ordering_miskey_drill.json` → `miskey_probe.audit.*` (transcript only) |
| `poison-dlq` | (no embedded numbers, matching the mock) | `poison_dlq_drill.json` → `quarantine.dlq_kafka_record.*` (transcript only) |
| `offset-replay` | timestamp diff 0, offset diff 0 | `offset_replay_drill.json` → `summary.{timestamp_diff_count,offset_zero_diff_count}` |
| `schema-contract` | HTTP 409, 3 events | `schema_contract_drill.json` → `incompatible_schema_attempt.registration.http_status`, `flow_continuity.after_rejection.iceberg_row_count` |
| `small-file-rewrite` | 48→2 files, 24→1 manifests, 54.92ms→44.57ms | `iceberg_small_file_rewrite.json` → `before.{data_file_count,manifest_count,planning_latency_ms}`, `after.{data_file_count,manifest_count,planning_latency_ms}` |
| `eo-reconciliation` | 5 scenarios | `eo_reconciliation.json` → `results.length`, `summary.failure_classes` |
| `broker-parity` | 1,000 rows | `broker_parity.json` → `path_a.row_count`, `parity.{snapshot_digests_match,row_level_diff_count}` |
| `broker-slo` | 1,791 events/s, p50 15.2s, p95 20.6s | `broker_slo.json` → `summary.{sustained_throughput_events_per_second,freshness_p50_ms,freshness_p95_ms,snapshot_diff_count}` |

Hero stat line and honesty note (unchanged source, new plain-mono markup
per the mock — "NO StatGrid cells here"): `10`/`0`/`1,791` from
`eod-receipts.json` exactly as before (`formattedThroughput()`,
`eodReceiptsData.drillCount`/`allDiffsZero`).

**Fix-round correction (review finding, Critical)**: the first two cells
(`10`, `0`) were briefly typed as literal JSX text in `EodLog.tsx` — a
regression from the deleted StatGrid markup that actually read
`eodReceiptsData.drillCount`/`allDiffsZero`, and this doc's claim above was
therefore false against the shipped code at that point. Both cells now
read `eodReceiptsData.drillCount` / `eodReceiptsData.allDiffsZero ? "0" :
"—"` directly in `EodLog.tsx`, matching the third (throughput) cell's
existing `formattedThroughput()` binding; `eod-r2.spec.ts`'s stat-line test
now asserts all three cells' exact rendered values against
`eod-receipts.json`, not just the throughput one, so this cannot regress
silently again.

The `55.814` second
end-to-end honesty figure is `broker_slo.json`'s own
`benchmark.throughput.end_to_end_seconds`, added to
`scripts/generate-eod-receipts.mjs`'s output this task
(`eodReceiptsData.endToEndSeconds`, read via `eodData.ts`'s new
`formattedEndToEndSeconds()` helper — no literal in `EodLog.tsx`).

The **animated replay** (opening an entry with motion allowed) does not
read `eod-log-summary.json`'s `transcript` at all — it fetches that
drill's real file client-side (same fetch-gating contract as the retired
instrument) and re-derives the transcript via the pre-existing
`eodTimeline.ts`'s `buildTimeline()`, so the two extraction paths
(build-time generator, runtime `buildTimeline`) are independently written
against the same source files rather than one trusting the other's output
uncritically.

Blast-radius highlighting (a station name set vermilion inside the
sentence/transcript text, replacing the retired PipelineMap diagram) reuses
`eodTimeline.ts`'s existing `blastRadius()` editorial mapping verbatim — no
new interpretation was added for this task.
