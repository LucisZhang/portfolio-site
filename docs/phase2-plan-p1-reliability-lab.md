# Phase 2 upgrade plan — p1-reliability-lab (shortlist #2, engineering track)

Status: **CLOSED 2026-07-09 — GATE 2b approved; U1–U5 COMPLETE, U6 attempted and BLOCKED
(partial: 4/5 failure classes reproduced zero-diff; run not completable due to host disk
exhaustion / unresponsive Docker daemon — see docs/p1-u6-attempts/RECORD.md). Site must not
claim "reproduced on demand"; committed May 2026 artifacts remain the evidence. Post-close
decision: local Mac is light/no-Docker only; full U6 reproduction moves to the workstation path
in docs/p1-workstation-reproduction-guide.md.**
Drafted: 2026-07-09. Sources: INVENTORY.md row 17 (Phase 0 deep read) + fresh read-only re-inspection today via `gh` (file tree, README, RUNBOOK, Makefile, claims doc, results JSON, commit list, workflow-run list).

## Post-close local/workstation split (2026-07-09)

The full p1 stack is too heavy for this local Mac's current disk envelope. After U6 exhausted
disk and made Docker unresponsive, the project was changed to a split operating model:

- **Local Mac:** run no-Docker checks only (`make local-verify`, dashboard build, committed
  artifacts/results-contract verification). Do not start p1 Docker unless the human first
  recovers disk/Docker and explicitly asks for it.
- **Larger workstation/company computer:** run the full `make eo-verify ARGS="--failure all"`
  reproduction after `make preflight-heavy` passes. Bring back the evidence bundle listed in
  docs/p1-workstation-reproduction-guide.md.
- **Portfolio wording:** until a workstation run passes all five classes and its evidence is
  imported, say "committed May 2026 artifacts are the evidence; local Mac reproduction was
  blocked/partial". Do not say "reproduced on demand".

## Real current state (verified read-only, 2026-07-09)

- **What it is:** a single-node reliability lab for `MySQL CDC → Flink 1.20 → Apache Iceberg v2 (upsert)`. Not a wiring demo — the differentiator is **auditable correctness-under-failure evidence**: a Python harness induces real failures (task crash, retained-checkpoint restore, JobManager restart, savepoint restore, checkpoint-complete sink-commit fault) and proves exactly-once by final source-snapshot vs Iceberg-snapshot reconciliation, read through Flink SQL batch (pyiceberg deliberately restricted to metadata because it can't correctly read v2 equality deletes).
- **Where it lives:** GitHub-only, **private**, `LucisZhang/p1-reliability-lab`, default branch `main`, 6 commits all on 2026-05-27, **no local clone on this machine**, empty repo description, no topics.
- **Structure:** Java/Maven Flink CDC job (`flink-jobs/`, incl. test-only fault-injection operators); Python 3.11 harness (`harness/` — generator, eo_verify, checkpoint_metrics, small_file_rewrite, doctor, provenance; pytest unit tests; ruff/black/mypy via `make lint`); Docker Compose infra (`core` profile: MySQL, Flink JM/TM, MinIO, Iceberg JDBC catalog; `olap`/StarRocks reserved for an **M3 milestone that was never started**); Vite **static evidence dashboard** over exported results JSON (no backend calls); `showcase/{logs,media,results}`; RUNBOOK.md with 5 real incident entries; docs/version-matrix.md (pinned toolchain + known incompatibilities); docs/resume-claims-after-verification.md (**gated claims file** — claims added only after the proving phase passes).
- **Evidence integrity spot-check (done today, read-only):** every results JSON must carry `run_id/git_sha/command/logs` per the contract in `showcase/results/README.md`, enforced by the dashboard sync script. `eo_reconciliation.json`: run `20260527T151754Z-ef73a5a5` matches the claims doc exactly; `git_sha b2434d1a9e31` matches real repo commit `b2434d1`; all 5 failure classes present with `snapshot_diff_count=0`; `summary.passed=true`, `errors=[]`. RUNBOOK incident entries cross-reference the same run IDs. The claims discipline here is genuinely strong.
- **Gaps:**
  1. **README is 782 bytes and stale** — still says "Phase 1.1 … is being built"; none of the completed Phase 1.2–2.3 evidence (5-failure-class EO verification, small-file rewrite, checkpoint metrics under load) is surfaced. Weakest README-to-substance ratio in the whole portfolio.
  2. **No CI** — `.github/workflows/` does not exist; `gh run list` is empty. `make test` / `make lint` / `make dashboard-build` exist but have never run anywhere externally auditable.
  3. **Empty repo description and no topics** (also flagged in Phase 4 cleanup list).
  4. **The "deployable slice" (static dashboard) has never been built for anyone to see** — only a screenshot (`phase-1.4-dashboard.jpg`) exists.
  5. Heavy-stack results were produced once, on 2026-05-27, on whatever machine ran them; **reproduction feasibility on this 16 GB MacBook Air is unverified** (INVENTORY [NEEDS-HUMAN-VERIFY]).
  6. `AGENTS.md` (15.7 KB internal agent/Codex knowledge base) sits in the repo root — fine while private; whether it stays if the repo ever goes public is a Phase 4 human decision, noted here so it isn't lost.

INVENTORY.md recommendation (human-approved at GATE 2a): **feature (likely upgrade-then-feature)** — flagship data-engineering candidate; deployable slice = static dashboard over exported JSON. This plan is accordingly packaging/verifiability work (upgrade-menu items 4 & 5), not feature development.

## Proposed upgrades

All work happens on a local clone + branch, merged via PR; the GitHub repo is never modified destructively (no force-push, no history rewrite). Everything below is laptop-friendly and offline-capable except image/dependency downloads. Nothing is [NEEDS-GPU].

| # | Task | Menu fit | Effort |
|---|---|---|---|
| U1 | Clone the repo locally (additive); create work branch. Set repo **description** + topics via `gh` (additive metadata; proposed text in gate Q3). | 5 | ~0.5 h |
| U2 | **Lightweight verification pass, no Docker:** `make test` (harness pytest), `make lint` (ruff/black/mypy + Maven verify → builds the Flink job jar), `make dashboard-build` (validates every results JSON against the contract, then builds the static dashboard); open the built dashboard locally and confirm all 5 result artifacts render with provenance. Record actual outcomes; if anything fails, fix honestly or record the failure — no claims edited otherwise. | 4 | ~1.5 h |
| U3 | **Add GitHub Actions CI for the light paths only:** lint + harness unit tests + Maven package + dashboard build incl. JSON-contract validation. The heavy Docker integration (eo-verify) stays explicitly out of CI (single-node Docker lab; documented as manual-with-committed-artifacts). Push branch, confirm first-ever green run, merge via PR. | 5 | ~1 h |
| U4 | **README overhaul** for external readers: what/why, architecture, the verified-claims table (sourced from docs/resume-claims-after-verification.md + results JSON — no invention), how the evidence gating works (results contract + RUNBOOK), dashboard slice, quickstart, version-matrix link, honest scope note ("StarRocks/M3 milestone not started"). Add CI badge once U3 is green. | 6 | ~2 h |
| U5 | **Export case-study inputs to the portfolio repo:** the 5 results JSON, 2 SVG charts, dashboard screenshot, and RUNBOOK incident narratives — feed PipelineGraph / DataExplorer / CaseStudyBlock in Phase 3. | 4 | ~1 h |
| U6 (OPTIONAL — gate decision) | **Full heavy-stack reproduction** of `make eo-verify ARGS="--failure all"` on this machine (Docker: MySQL, Flink JM/TM, MinIO; `RESOURCE_PROFILE=small` exists). Strongest possible verification, but 16 GB feasibility is unverified and image pulls over the local VPN may be slow. If approved: time-boxed **3 h**; on success, commit the fresh artifact alongside the old one; on infeasibility, stop, record why, and the site relies on U2's integrity checks + the existing committed artifacts, stated honestly. | 4 | ≤3 h (time-boxed) |

**Total time-box: ≤ 1 working day** (excluding optional U6). Stop condition = Publish-Ready Bar: claims verified against committed artifacts (U2), externally auditable checks (U3), solid README (U4), interactive/visual proof inputs exported (U5), zero unverified claims.

## Explicitly out of scope

- No M3/StarRocks work, no new failure classes, no feature or architecture changes.
- Repo stays **private**; no public URLs, no dashboard deployment (Phase 3+ human gates).
- No history rewrite / force-push / branch deletion; AGENTS.md left untouched (Phase 4 decision).
- Case-study MDX writing is Phase 3, not this plan.

## Risks / notes

- Local toolchain needed: Java 11 + Maven 3.9 + Python 3.11 + Node 20 (repo pins via mise/.tool-versions). If Maven/Java aren't present, U2's Maven step moves into U3's CI (which provisions them) and that is recorded.
- npm/Maven downloads may stall over the local VPN tunnel; the known npmmirror flag workaround applies to the dashboard's `npm ci` if needed (flag-only, no config edits).
- CI Maven build downloads Flink/Iceberg dependencies (~large) — first run may be slow but is cache-able; no secrets required, everything runs offline-deterministic.

## GATE 2b — decision requested

1. Approve this plan (or adjust tasks/time-box)? Proceed order U1 → U2 → U3 → U4 → U5, single branch, checkpoint commit per task.
2. **U6 heavy-stack reproduction: attempt (time-boxed 3 h) or skip?** My recommendation: attempt — it converts the strongest resume claim from "reproduced once in May" to "reproduced on demand", and the time-box caps the cost.
3. Repo description to set (additive): *"Reliability lab: MySQL CDC → Flink → Iceberg with induced-failure exactly-once verification and auditable JSON evidence."* — OK as written?
