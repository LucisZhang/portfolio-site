# Case-study inputs — p1-reliability-lab

Copied verbatim on 2026-07-09 from `LucisZhang/p1-reliability-lab` (private GitHub repo,
main after PR #2); all evidence files below are unchanged since repo commit
`47b4268` (2026-05-27) — the Phase 2 packaging work (merged 2026-07-09) added CI and
README only.
These are inputs for the Phase 3 case-study page (PipelineGraph / DataExplorer /
CaseStudyBlock); do not edit them by hand.

The `results/u6-local-mac/` directory is a separate, later evidence import from source
commit `7eab9c3` (2026-07-11). It must not be conflated with the May dashboard or charts.

## Contents

- `results/` — the five auditable result artifacts (JSON contract: `run_id`, `git_sha`,
  `started_at`, `finished_at`, `stack_versions`, `command`, `logs`) plus the generated
  dashboard manifest `index.json`:
  - `eo_reconciliation.json` — exactly-once final-state reconciliation across 5 induced
    failure classes, run `20260527T151754Z-ef73a5a5`, all `snapshot_diff_count=0`,
    `summary.passed=true` (backs the gated resume claim).
  - `phase-1.2-cdc-smoke.json` — CDC correctness smoke incl. update/delete parity and
    equality-delete metadata evidence.
  - `iceberg_small_file_rewrite.json` — small-file maintenance before/after metrics.
  - `checkpoint_metrics.json` — checkpoint/backpressure/commit-lag time series under a
    deterministic input spike.
  - `phase-1.1-smoke.json` — toolchain/core-stack smoke baseline.
- `media/` — `phase-2.2-small-file-rewrite.svg`, `phase-2.3-checkpoint-metrics.svg`
  (charts captured from the runs), `phase-1.4-dashboard.jpg` (evidence-dashboard screenshot).
- `runbook-incidents.md` — verbatim copy of the repo RUNBOOK.md: one incident entry per
  induced failure (trigger, symptom, detection/recovery commands, validation, artifacts).
- `results/u6-local-mac/` — July heavy local-Mac reproduction at run
  `20260711T034018Z-local-mac`, baseline `05738dd`, across all five induced failure classes.
  The final reconciliation records `passed=true`, zero snapshot differences, consistent
  event-ID audits, and no errors. The evidence is specific to the documented Apple Silicon,
  16 GiB Mac and Docker Desktop environment; it is not a universal reproducibility claim.
