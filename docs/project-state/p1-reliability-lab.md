# Project state - p1-reliability-lab

Last updated: 2026-07-13
Lane key: `p1-reliability-lab`
Execution owner: Codex (GPT-5.6 Sol)
Source working copy: `~/p1-reliability-lab`
Portfolio evidence: `public/case-studies/p1-reliability-lab/`
Status: V1 PAGE PUBLISHED; CAPTURED RUN FAILURE REPLAY COMPLETE ON ISOLATED UPGRADE BRANCH

## Next action on resume

Preserve the historical-May versus July-U6 provenance split and the fixed disclosure
`Recorded evidence, not a live cluster.` The operable branch now replays the five U6 scenarios from
the public JSON with deterministic controls; do not run the heavy stack again.

## Acceptance and boundaries

- Every displayed figure traces to an exported U1-U5 artifact or the U6 run identified below.
- State that results are valid in the documented environment; this is one successful local-Mac
  reproduction, not a universal hardware or one-command reproducibility claim.
- Do not claim universal or one-command reproducibility.
- Do not repeat U6 or create a new remote run before v1.
- Never label the replay as a live demo or synthesize terminal logs. Structured excerpts must remain
  direct projections of the recorded JSON.

## U6 completion evidence

- Export package run ID: `20260711T034018Z-local-mac`
- Reconciliation run ID: `20260711T035242Z-b518d211`
- Evidence commit: `7eab9c3fcdf73865b0ed6dd1266de1bfaccefcce`
- Baseline commit: `05738dd80038ada6862dcdb8fee1ffc8f8c1e018`
- Environment: Apple Silicon macOS, 16 GiB RAM; Docker Desktop VM reported 10 CPUs and about
  7.65 GiB memory.
- Command path: `make doctor`, `make preflight-heavy`, `make up-core`, canary
  `make eo-verify ARGS=\"--failure task-crash\"`, full five-class `make eo-verify
  ARGS=\"--failure all\"`, then `make down` and storage cleanup.
- Result: all five induced failure classes completed; `passed=true`, all snapshot differences
  zero, all event-ID audits consistent, and no reported errors.
- Authoritative source: `~/p1-reliability-lab/docs/workstation-run/
  20260711T034018Z-local-mac/SUMMARY.md` and `eo_reconciliation-all.json`.

## Evidence anchors

- `public/case-studies/p1-reliability-lab/`
- `docs/phase2-plan-p1-reliability-lab.md`
- `docs/p1-u6-attempts/RECORD.md`
- `docs/p1-workstation-reproduction-guide.md`
- `public/case-studies/p1-reliability-lab/workstation-reproduction-guide.md`
- `~/p1-reliability-lab/docs/workstation-run/20260711T034018Z-local-mac/SUMMARY.md`

## Operable replay checkpoint

- Five selectable scenarios: task crash, checkpoint restore, JobManager restart, savepoint restore,
  and sink commit fault.
- Eight stages project source counts/IDs, CDC changelog, checkpoint/savepoint, actual trigger,
  recovery mode/job ID, Iceberg counts/IDs, snapshot diff, and Event-ID audit.
- Desktop/tablet use a five-node React Flow view; mobile uses an equivalent ordered step list.
- Play, pause, previous, next, reset, and range controls are covered by Playwright in all three
  viewport projects. No backend or simulated cluster process is involved.

## Lane isolation

This state is independent of every other project. Phase 3 integration may read this file but
must not reinterpret another project's blocker as a dependency.
