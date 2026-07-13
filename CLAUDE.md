# Portfolio build - project conventions

- Authoritative pipeline spec: docs/fable-portfolio-pipeline-prompt.md. Design spec: docs/portfolio-build-plan.md. Follow both.
- A newer operable-portfolio upgrade authorized one final Fable call for Analytics North Stars.
  That call completed once on 2026-07-13 with no retry and is recorded in
  `docs/fable5-analytics-direction.md`. Do not call Fable again. The older v1 cutline in
  `docs/portfolio-direction-freeze.md` still governs published evidence and claim boundaries.
- Codex (GPT-5.6 Sol) owns all subsequent implementation, testing, checkpointing, evidence review, and integration work.
- `STATE.md` is the global portfolio dashboard and integration ledger. It must not serialize independent project lanes.
- Each project lane owns exactly one authoritative resume file under `docs/project-state/<lane>.md`. The active lane is selected with `PORTFOLIO_LANE=<lane>`.
- One Claude session works on one lane only. After finishing a lane task, update that lane's state file and commit on its dedicated lane branch/worktree before starting the next task.
- Do not edit another lane's state file. Do not edit shared integration files (`STATE.md`, shared site components, registry, lockfiles) from a lane session unless the task explicitly grants shared-file ownership.
- Independent lanes may run in parallel. A blocked, paused, or rate-limited lane does not change another lane's next action.
- The integration session alone merges lane branches and refreshes the summary table in `STATE.md`.
- Stop at every HUMAN GATE in the pipeline spec and wait for approval.
- Hardware: MacBook Air M4, 16 GB. No local large-model training; flag GPU work as [NEEDS-GPU].
- Never run destructive git/GitHub ops (delete/archive/make-private/force-push); propose for human approval instead.
- If low on budget or context: checkpoint the active lane state + commit, print concise lane-specific resume instructions, then stop.
