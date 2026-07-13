# U6 record — p1-reliability-lab heavy-stack reproduction attempt (2026-07-09)

Outcome: **NOT REPRODUCIBLE ON THIS MACHINE TODAY — disk exhaustion / Docker daemon
unresponsive.** Decision by human operator: stop after attempt 2, no retry, no deletion of
non-session data. The site must therefore rely on the repo's committed May 2026 artifacts
(whose internal consistency was verified read-only in U2/plan drafting) and must **not**
claim "reproduced on demand".

## Timeline (UTC)

- 08:49:23 — 3-hour cap started (`cap-start.txt`). `make doctor` ok (pinned Java 11 /
  Python 3.11 / Node 20 all present). All Docker images already in local cache.
- 08:50 — `make up-core` first try failed: host port 8081 held by another session's
  release_guardian gateway (left untouched). Fixed via lab's own parameterization:
  `FLINK_REST_PORT=18081` in local gitignored `.env`. Second try: all 4 core services healthy.
- 08:56 — Attempt 1: `make eo-verify ARGS="--failure all"` (exact claims-doc command).
  Result (`attempt1-eo_reconciliation.json`, run `20260709T090108Z-0cd0e03c`):
  **4 of 5 failure classes PASSED with snapshot_diff_count=0**
  (task-crash, checkpoint-restore, savepoint-restore, sink-commit-fault);
  **jobmanager-restart FAILED** — `FileNotFoundException` for retained checkpoint
  `chk-3` at restore (full trace in `attempt1-eo-verify.log`).
- 09:05 — Attempt 2 launched unmodified. Shortly after, the **host disk hit 100%**
  (462 MiB free of 460 GiB; ~432 GiB was already used before this session). Attempt 2 was
  stopped by targeted PID kill during its reset phase — it modified **no tracked files**
  (verified: clean `git status`). Attempt 1's overwrites of
  `showcase/results/eo_reconciliation.json` and `showcase/logs/phase-2.1-eo-verify.log`
  had already been restored from git.
- 09:30–09:40 — Teardown of the session's p1 stack could not complete: `make down` and a
  direct compose down both timed out / were halted because the Docker daemon is
  unresponsive under ENOSPC. Per operator: no further Docker commands.

## Interpretation (honest)

- The attempt-1 jobmanager-restart failure has two candidate causes and they cannot be
  distinguished after the fact: (a) the checkpoint-retention race the repo's own RUNBOOK
  warns about ("a REST-reported checkpoint can be superseded by a later retained checkpoint"),
  or (b) checkpoint persistence failing silently as the host disk approached 100%.
- 4/5 classes independently reproduced zero-diff on 2026-07-09 hardware **is supporting
  evidence, not a full reproduction**. The gated claim in the repo continues to rest on the
  May 2026 committed artifact (run `20260527T151754Z-ef73a5a5`), which passed all 5 classes
  and whose provenance (run_id ↔ claims doc, git_sha ↔ commit `b2434d1`) was re-verified
  read-only this session.

## Pending cleanup (after Docker/disk recovery — not done, awaiting operator)

- p1 compose stack from this session may still exist (containers + volumes
  `p1_reliability_lab-*`, project volumes incl. `flink_checkpoints`); tear down with
  `make down` in `~/p1-reliability-lab` once the daemon responds.
- Local gitignored `~/p1-reliability-lab/.env` has `FLINK_REST_PORT=18081` (kept to avoid
  the 8081 conflict with the release_guardian gateway; harmless to keep).
- Session build dirs were cleaned after the stop decision (~760 MB, all gitignored, all
  recreatable): `.m2/`, `flink-jobs/target/`, `.venv/`, `dashboard/node_modules/`,
  `dashboard/dist/`, and pytest/mypy/ruff caches.
- Root cause of the full disk was NOT identified (out of scope; ~432 GiB used before the
  session began) — operator to investigate.

## Follow-up mitigation (2026-07-09)

- p1 was updated to make local laptop operation no-Docker by default: `make local-verify`.
- Heavy Docker targets now run `make preflight-heavy` first, refusing to start when disk is
  below the configured threshold or Docker is not responsive.
- Full U6 reproduction moved to a larger workstation/company-computer path; see
  `docs/p1-workstation-reproduction-guide.md` in the portfolio repo.

## Files here

- `attempt1-eo_reconciliation.json` — full attempt-1 result artifact (run
  `20260709T090108Z-0cd0e03c`, summary.passed=false, 4/5 zero-diff).
- `attempt1-eo-verify.log` — attempt-1 harness log incl. the jobmanager-restart trace.
- `attempt2-eo-verify.log` — attempt-2 partial log (killed in reset phase at ENOSPC).
- `cap-start.txt` — cap start timestamp.
