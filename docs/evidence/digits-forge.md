# Frontier Forge digits — number → file → path → SHA-256

G2 register for the Round-2 Frontier Forge release console (task 2.2,
`/ai/frontier-forge`, the standard-scroll reference implementation, spec
§6.0/§6.1). Every number rendered by `src/components/forge/*.tsx` traces to
one of these files:

- `public/case-studies/frontier-forge/release.json` — 29,330 bytes, sha256
  `9e547b3418ce1f633914e8dfe7b818fa6f7e064a891cee8e4c73837e6ce45f4d`.
- `public/case-studies/frontier-forge/phase7_1_sustained_gateway_bench.json`
  — 1,526,788 bytes, sha256
  `d132ebece698c98ab996b154067679ea1d74b52e9528834ed19a21a132137929` (fetched
  only after the exhibit 05 "LOAD RECORDED REPLAY" click).
- `public/case-studies/frontier-forge/manifest.json` — asset registry (sha256
  values above are copied from here and independently re-verified by
  `scripts/generate-forge-receipts.mjs`, which hashes the files itself
  rather than trusting the copy).
- `public/case-studies/frontier-forge/claim-commands.json` — the three real
  `make reproduce-headline` command strings.
- `public/case-studies/frontier-forge/phase7_1_gpu_ledger.jsonl` /
  `phase7_2_gpu_ledger.jsonl` — GPU spend receipts, summed for the hero's
  total-measured-spend tile.
- `src/data/generated/forge-receipts.json` — this task's adapter
  (`scripts/generate-forge-receipts.mjs`), hashing `release.json` and the
  overload receipt directly and summing the two GPU ledgers plus
  `release.json`'s own `project_spend.total_usd` for the `$35.68` figure.
- `src/lib/frontier-project-detail.ts` — pre-existing, previously-reviewed
  narrative content (architecture steps, outcome, field notes, boundaries)
  reused verbatim for the report layer; no new numbers originate here beyond
  what release.json already backs (14.2 pp, GRPO CI, cold-start seconds).

Regenerate before re-auditing:

```
node scripts/generate-forge-receipts.mjs   # forge-receipts.json (this task)
```

No component in `src/components/forge/` contains a literal benchmark number
typed directly into a `.tsx` file; every value below is read from one of the
files above at import time or computed from them with a pure formatter in
`src/components/forge/forgeFormat.ts`. One exception is registered below and
nowhere else: `ForgeConsole.tsx`'s `SERVING_HARDWARE_LABEL` constant, a
hardware *name string* (not a computable number) documented immediately
below with its cross-file provenance rather than being read from JSON at
runtime, because the only file that carries that field as a queryable JSON
path is the 1.49MB overload receipt this instrument must not import (it
would defeat the "no heavy asset in the initial load" budget — that file
loads only after an explicit click, in `OverloadReplay.tsx`).

## Hero (3-cell stat checkerboard)

| Value | Label | Source file | JSON path |
| --- | --- | --- | --- |
| `99.05%` | task success | `release.json` | `$.training.headline.task_success` |
| `$35.68` | measured spend through Phase 7.2 | `release.json` + `phase7_1_gpu_ledger.jsonl` + `phase7_2_gpu_ledger.jsonl` | `$.project_spend.total_usd` + Σ`$[*].usd` (phase7.1) + Σ`$[*].usd` (phase7.2), computed in `scripts/generate-forge-receipts.mjs` → `forge-receipts.json`.`totalMeasuredSpendUsd` |
| `0` (`@ 3× overload`) | upstream 5xx @ 3× overload | `release.json` | `$.phase7_1.gate.sustained_overload_cells[?(@.multiplier==3)].gateway_upstream_5xx_rate` |

Hero paragraph: `project.summary` (`src/lib/projects.ts`, `frontier-forge`
entry, pre-existing sitewide-audited catalog — same text used by the
homepage's exhibit 01, already registered in `docs/EVIDENCE_INDEX.md`). Rail
zh gloss: `project.glossZh`, same entry.

## Exhibit 01 / Hero instrument — ForgeConsole (`ForgeConsole.tsx`)

Chips and readout read `release.json`'s `$.serving.serving_at_4_qps[]`
(three entries: `R1b BF16`, `R1b GPTQ-int4`, `R1b BF16 + native MTP`).
Default-selected chip: `R1b BF16 + native MTP` (index found by `label`
match).

| Field shown | JSON path (per selected run) |
| --- | --- |
| Readout duration (`{n}s`) | `$.serving.serving_at_4_qps[i].e2e_p50_s` |
| `{n} tok/s` | `$.serving.serving_at_4_qps[i].output_tokens_per_s` |
| `{n} reqs` | `$.serving.serving_at_4_qps[i].requests` |
| `{n}% success` | `$.serving.serving_at_4_qps[i].task_success` |
| Run id / SHA line | `$.serving.serving_at_4_qps[i].run_id`, `$.serving.serving_at_4_qps[i].artifact_sha256` |
| cURL/Python/JSON request body | `run_id` and `artifact_sha256` as above, `precision` field maps to the shown `model` string |
| `RTX 4090` (readout hardware label) | Not a field on `$.serving.serving_at_4_qps[i]` itself — see provenance note below |

**`RTX 4090` cross-file provenance:** the `serving_at_4_qps` records carry
precision/artifact/timing fields but no hardware string. The label is real
and independently confirmed by two other files in this task's evidence set:
`release.json`'s own `$.training.headline.statement` ("...using 15.236
measured RTX 4090 GPU-hours...", read verbatim by `TrainingLadder.tsx`'s
English intro) and `phase7_1_sustained_gateway_bench.json`'s
`$.disclosure.comparison_scope.archived_hardware` field (= `"RTX 4090"`,
explicitly distinguishing these Phase 4/5 RTX 4090 serving runs from Phase
7.1's later NVIDIA A10 overload runs — see that same file's
`$.disclosure.hardware_change`). `ForgeConsole.tsx` holds this as a named
`SERVING_HARDWARE_LABEL` constant with the same provenance comment rather
than importing the 1.49MB receipt just to read one field.

**Absent data, honestly labeled:** spec §6.1 asks for "a COMPLETED real
inference lying on screen: complaint text → JSON output → readout". The
frozen evidence set for this page (the seven files listed above) does not
ship a single-request complaint transcript or per-request JSON output —
`release.json`'s `serving_at_4_qps` entries are aggregate benchmarks over 20
requests per precision, not one completed inference. Rather than invent
complaint text, the instrument shows the real aggregate serving run per
precision and marks the missing piece with a one-line `COMPLAINT
TRANSCRIPT — NOT RECORDED` note (`ForgeConsole.tsx`, `.forge-console-transcript-note`).
Listed again in the "Absent data" section below.

## Exhibit 02 — Evidence Explorer (`EvidenceExplorer.tsx`)

Unchanged claim-derivation logic from the pre-Round-2 component (kept
because it was already correct), restyled to exhibition grammar and wired
to `claim-commands.json` for the three claims that have a real command. 10
claims, all sourced from `release.json` unless noted:

| Claim id | JSON path(s) | Command source |
| --- | --- | --- |
| `training-headline` | `$.training.headline.{task_success,ci95,paired_delta_vs_r1.paired_rows}` | `claim-commands.json`.`task-success` |
| `training-distillation` | `$.training.ladder[label="R2 distilled SFT"]`, `$.training.ladder[label="R1 rule SFT (1,450)"]` | `claim-commands.json`.`distilled-sft-delta` |
| `training-grpo` | `$.training.r4_seed_deltas[0]` | — (no command in the receipt) |
| `training-backend` | `$.training.backend_agreement.*` | `config: {config_path}` (`$.training.backend_agreement.config_path`) |
| `inference-gptq` | `$.serving.serving_at_4_qps[label="R1b GPTQ-int4"]` | — |
| `inference-mtp-boundary` | `$.serving.speculative_boundary.transition` | — |
| `gateway-three-x` | `$.phase7_1.gate.sustained_overload_cells[multiplier=3]` | — |
| `gateway-five-x` | `$.phase7_1.highest_load.*` | `claim-commands.json`.`sustained-overload` |
| `elasticity-gateway` | `$.phase7_2.gateway_scaling.*` | — |
| `elasticity-cold-start` | `$.phase7_2.gpu_cold_start.distribution_s.{p50,p95}`, `.iterations_completed` | — |

SHA-256 column: `release.json`'s hash for every row except `training-backend`
(`config_hash` from the record itself, a different real hash — the training
config's hash, not the release file's).

## Exhibit 03 — Training Ladder (`TrainingLadder.tsx`)

All 7 rungs read `release.json`'s `$.training.ladder[]` verbatim (`label`,
`run_id`, `status`, `task_success`, `ci95`, `gpu_hours`, `usd`). Bar width is
computed as `task_success / max(task_success across all rungs)` — a pure
function of the same field, no separate number. Intro paragraph (EN):
`$.training.headline.statement` verbatim. Intro paragraph (ZH): an
independent narrative sentence (spec §2.6 — not a translation) that
interpolates the same fields the EN statement draws on —
`$.training.ladder[run_id="r1_sft_rule_s0"].task_success`,
`$.training.headline.task_success`,
`$.training.headline.paired_delta_vs_r1.{mean_task_success_delta,ci95,paired_rows}`,
`$.training.headline.training_seeds[0]`, `$.training.headline.gpu_hours`,
`$.training.headline.usd` — via `forgeFormat.ts`'s `percent`/`points`/
`interval`/`usd` helpers, not typed in literally. The two
`Finding kind="negative"` blocks render `src/lib/frontier-project-detail.ts`'s
`fieldNotes[]` array directly (`.map()`, not retyped text) — same numbers
(distillation −14.2 pp, GRPO CI includes zero) as ForgePage.tsx's "Results &
negatives" report-layer section, one source rendered twice.

## Exhibit 04 — Serving Boundary (`ServingBoundary.tsx`)

Segmented control + metric checkerboard: `$.serving.serving_at_4_qps[i]` for
the selected precision (`e2e_p50_s`, `e2e_p95_s`, `ttft_p50_s`,
`output_tokens_per_s`, `task_success`, `cost_per_1k_successful_tasks_usd`,
`vram_peak_mib`, `requests`). Win/lose bars: `$.serving.speculative_boundary.points[]`
(5 entries, `qps`/`verdict`/`p95_delta_s`); bar width normalized against the
max `|p95_delta_s|` across the 5 points. Intro sentence's transition string:
`$.serving.speculative_boundary.transition` verbatim.

## Exhibit 05 — Overload Replay (`OverloadReplay.tsx`)

**Static (no-JS) part**, always server-rendered from `release.json`:

| Column | JSON path |
| --- | --- |
| Multiplier / offered QPS / requests | `$.phase7_1.gate.sustained_overload_cells[i].{multiplier,offered_qps,gateway_requests}` |
| HTTP 429 | `$.phase7_1.gate.sustained_overload_cells[i].http_429_count` |
| Gateway / bare vLLM upstream 5xx | `$.phase7_1.gate.sustained_overload_cells[i].{gateway_upstream_5xx_rate,bare_vllm_upstream_5xx_rate}` |
| Gate pass/fail | `$.phase7_1.gate.sustained_overload_cells[i].pass` |
| Highest-load sentence (651 transport errors, 687 HTTP 429) | `$.phase7_1.highest_load.{bare_vllm_http_status_counts.transport_error,gateway_http_status_counts.429,multiplier,offered_qps}` |

The "`▶ LOAD RECORDED REPLAY (n MB)`" button's byte count reads
`manifest.json`'s `$.assets[path="phase7_1_sustained_gateway_bench.json"].bytes`
(`OverloadReplay.tsx`'s `receiptAsset.bytes`), not a typed-in number — this
is also what `scripts/verify-heavy-assets.mjs` assertion (b) would catch if
the two ever diverged (this page currently ships no `data-bytes` attribute,
so that assertion has nothing to check yet; the underlying number is still
read from JSON, not hardcoded).

**Click-gated part**, fetched only after `[data-forge-load-replay]` is
clicked: `phase7_1_sustained_gateway_bench.json`'s
`$.metrics.sustained_overload.pairs[]` (per-multiplier direct/gateway HTTP
status counts, fast-reject p95, queue high-watermark) and
`$.gate.sustained_overload_cells[i].gateway_upstream_5xx_rate`. Footer SHA:
`manifest.json`'s recorded hash for `phase7_1_sustained_gateway_bench.json`,
independently re-verified in `forge-receipts.json`.`overloadReceipt.sha256`.

## Exhibit 06 — GPU replicas and distributed training (`GpuScaling.tsx`)

`GpuScaling.tsx` reads `public/case-studies/frontier-forge/gpu-scaling-evidence.json` (sha256 `18b6eacc26fb3033c51758f61044953f351c86f41bc7d432cf42639687748644`) directly. The projection is
pinned to public source commit `34e857b417bb9d2767340332ddc1580b7381f334`; each input's bytes and SHA-256 are recorded in the
projection's `.source.inputs` and registered as `frontier-forge:<path>` links in
`docs/evidence/receipt-link-sources.json` (anonymously re-verified with
`node scripts/generate-evidence-links.mjs --write --verify-remote`).

| Rendered value | jsonPath | Source file:line at `34e857b` |
| --- | --- | --- |
| 1.748× / 1.795× success throughput, +37.40 / +19.34 pp success rate, 0.408× / 0.420× TTFT p95 (QPS 4 / 8) | `.phase7_3_replicas.two_vs_one[qps=4,8].{successful_throughput_ratio,success_rate_delta_pp,ttft_p95_ratio}` | `results/phase7_3_summary.md:41-42` |
| seed 731, 180 s per cell, QPS 1/2/4/8, one RTX 4090, time-slicing, GPTQ-int4 | `.phase7_3_replicas.{seed,cell_duration_s,qps,gpu,gpu_sharing,model_artifact}` | `results/phase7_3_summary.md:7` |
| Observer all-request E2E p95 4.472s → 4.546s (+1.65%) | `.phase7_3_replicas.isolation.{observer_e2e_p95_baseline_s,observer_e2e_p95_disturbed_s,observer_e2e_p95_change_percent}` | `results/phase7_3_summary.md:63-64,67` |
| 1,353 of 1,505 attacker requests timed out after HTTP 200; 151 verified; attacker at 8 QPS | `.phase7_3_replicas.isolation.{attacker_timeouts_after_http_200,attacker_requests,attacker_verified_successes,attacker_qps}` | `results/phase7_3_summary.md:59,65,67` |
| 10 cycles of 0→1→2→1→0, 40 transitions, staged PASS | `.phase7_3_replicas.scaling.{cycles,transitions,sequence}`, `.audit_status`, `.single_continuous_run` | `results/phase7_3_summary.md:3,101` |
| 1→2 Ready p50 85.37s | `.phase7_3_replicas.scaling.one_to_two_ready_p50_s` | `results/phase7_3_summary.md:106` |
| TP=2 / TP=1: 0.830× success throughput, 7.268× TTFT p95, 1.205× cost per 1K successful tasks | `.phase7_3_tp.tp2_vs_tp1.*` | `results/phase7_3_summary.md:97` (raw cells: `results/phase7_3_tp_reviewed_report.md:11-12`) |
| 2×RTX 4090, QPS 2, 180 s, n=372 per TP setting | `.phase7_3_tp.{gpu_count,gpu,qps,duration_s,requests_per_cell}` | `results/phase7_3_tp_reviewed_report.md:6,11-12` |
| Qwen3.5-0.8B-Base, 752,393,024 parameters, 1,250 steps, 20,000 training rows, 2,000 evaluation rows | `.phase8_distributed.{model,trainable_parameters,optimizer_steps,train_rows,eval_rows}` | `results/phase8_distributed_report.md:23`; model name `results/phase8/final-publication/supplement.md` receipts (README Phase 8 section) |
| 1,706.90 / 3,366.58 / 2,309.85 input tok/s | `.phase8_distributed.variants[].input_tokens_per_s` | `results/phase8_distributed_report.md:7-9` |
| Scaling efficiency 98.62% (DDP) / 67.66% (FSDP) | `.phase8_distributed.variants[].scaling_efficiency_percent` (98.6169 / 67.6622, rendered to 2 dp) | `results/phase8_distributed_report.md:11,13` |
| Peak allocated per GPU 14.26 / 17.07 / 7.58 GiB | `max(.phase8_distributed.variants[].peak_allocated_bytes_per_gpu) / 2^30` | `results/phase8_distributed_report.md:7-9` (bytes) |
| −55.61% FSDP vs DDP peak allocated per GPU | `1 − max(C bytes) / max(B bytes)`, computed in the component | `results/phase8_distributed_report.md:8-9` (derived) |
| hard-AND 98.45% / 98.40% / 98.55%, n=2,000 | `.phase8_distributed.variants[].hard_and_percent`, `.eval_rows` | `results/phase8/final-publication/supplement.md:21,24,27` |
| DDP − single −0.05 pp [−0.30, +0.20]; FSDP − single +0.10 pp [−0.10, +0.30] | `.phase8_distributed.paired_differences[]` | `results/phase8/final-publication/supplement.md:32,35` |
| PCIe NODE topology, no NVLink, communication not profiled | `.phase8_distributed.{interconnect,nvlink,communication_profiled}` | `results/phase8_distributed_report.md:25` |

The TP end-to-end p95 ratio is deliberately not rendered: the source states throughput, TTFT p95, and
cost ratios (`results/phase7_3_summary.md:97`) but no E2E ratio. The page states the cutlines beside the
numbers: time-sliced replicas share one card (no hard isolation, not multi-GPU scaling); the Phase 7.3
PASS is staged; the TP result is one operating point; and both Phase 8 paired intervals include zero,
which is read as "no detected quality difference", not proven equivalence.

## Exhibit 07 — Model Boundary (`BoundaryMatrix.tsx`)

Nine ✓/✗ items (4 yes, 5 no — satisfies spec's "✗ ≥ ✓"):

| # | Verdict | JSON path(s) |
| --- | --- | --- |
| 1 | ✓ | `$.training.headline.{task_success,ci95}`; `n=` reads `$.training.headline.paired_delta_vs_r1.paired_rows` |
| 2 | ✓ | `$.serving.structured_output[*].simultaneous_schema_tool_call_rate` (both backends = 1.0) |
| 3 | ✓ | `max($.phase7_1.gate.sustained_overload_cells[*].gateway_upstream_5xx_rate)`, `max($.phase7_1.gate.sustained_overload_cells[*].multiplier)` |
| 4 | ✓ | `$.serving.speculative_boundary.transition` |
| 5 | ✗ | `$.serving.structured_output[*].simultaneous_task_success` (both backends = 0.0) |
| 6 | ✗ | `$.training.ladder[run_id="r2_sft_distilled_s0"].task_success` vs `$.training.ladder[run_id="r1_sft_rule_s0"].task_success` |
| 7 | ✗ | `$.training.r4_seed_deltas[*]`, `$.training.r4_v2.*` |
| 8 | ✗ | `$.serving.speculative_boundary.points[verdict="lose"]` (qps 0.25) |
| 9 | ✗ | `$.training.backend_agreement.{mean_task_success_delta_unsloth_minus_trl,paired_delta_ci95}` |

Known-failures zone: `$.serving.structured_output[*]` (`run_id`, `backend`,
`simultaneous_task_success`, `requests`, `two_pass_task_success`,
`latency_delta_p50_s`) — the closest real, citable failure mode, used
because no per-sample misclassified-complaint record exists in the frozen
evidence set (see "Absent data" below). Snapshot line:
`forge-receipts.json`.`snapshotId` (= `ff-qwen3.5-4b-` + `release.json`'s
`$.training.headline.run_id`) and `forge-receipts.json`.`releaseJson.sha256`.

## Exhibit 08 — Source & Receipts

`<dl>` reads `forge-receipts.json` (`releaseJson.sha256`,
`overloadReceipt.sha256`, `gpuScalingEvidence.sha256`, `generatedAt`) and `claim-commands.json`.`task-success`
for the `make reproduce-headline` line.

## Report layer (Architecture / Results & negatives / Limitations)

All content reused verbatim from `src/lib/frontier-project-detail.ts`
(previously reviewed, unchanged by this task): `architecture[]` (5 steps),
`outcome`, `fieldNotes[]` (2 negative findings — same numbers as exhibit 03's
findings, restated once more in the report layer per spec §6.0's template),
`boundaries[]` (3 limitations). Every figure inside these strings (14.2 pp, GRPO CI, 125s cold
start, "1→3→1") is independently traceable to `release.json` paths registered above; the Phase 7.2
A10, Phase 7.3 "10 cycles of 0→1→2→1→0", and Phase 8 "2×RTX 4090" references in `boundaries[0-1]`
and `role` trace to the exhibit 06 projection rows above.

## Absent data (honest `NOT RECORDED` treatment, not fabricated)

Per the task brief's explicit escape hatch ("if release.json lacks a
§6.1-required item ... mark the absent piece with an honest one-line `NOT
RECORDED` treatment"), two pieces of §6.1's literal content are not present
anywhere in the frozen `public/case-studies/frontier-forge/*` evidence set
(confirmed by grepping `release.json`, `manifest.json`, and the overload
receipt for `narrative`/`complaint`/`misclassif` — no hits):

1. **A completed single-request inference transcript** (real complaint text
   → JSON output → per-request readout). Present instead: real aggregate
   serving benchmarks per precision (§6.1's "3 chips" become 3 real serving
   configurations, not 3 complaint samples). Labeled `COMPLAINT TRANSCRIPT —
   NOT RECORDED` in `ForgeConsole.tsx`.
2. **2–3 real misclassified complaint samples** for exhibit 06's
   known-failures zone. Present instead: the real, citable structured-output
   failure (`simultaneous_task_success: 0.0` for both xgrammar and outlines)
   with exact `run_id`s, labeled `Per-sample misclassified complaints — NOT
   RECORDED` in `BoundaryMatrix.tsx`.

Both are also documented in `.superpowers/sdd/2026-08-22-site-revamp-r2/task-2.2-report.md`.
