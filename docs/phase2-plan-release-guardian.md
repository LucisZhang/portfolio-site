# Phase 2 upgrade plan — release_guardian (shortlist #1, ai track)

Status: **HISTORICAL DRAFT — GATE 2b decision 2026-07-09: DEFERRED / NOT APPROVED.** Human judged the project not fully done yet; execution postponed. No upgrade work was started. Do not act on this plan without a fresh human approval.
Drafted: 2026-07-09. Sources: INVENTORY.md row 1 (Phase 0 deep read, EVAL.md verified) + read-only re-inspection of `~/release_guardian` today.

## Real current state (verified)

- **What it is:** production-shaped change-impact & risk-gatekeeper agent. LangGraph graph runtime + FastAPI (Python), Go change-gateway, Java approval-audit service (RBAC, hash-chained audit), Next.js dashboard, Postgres+pgvector, OTel → Phoenix tracing. Offline-deterministic by default (`RG_LLM_MODE=stub`); `live` mode swaps in real API tiers without code changes.
- **Evidence in repo:** README (architecture diagram, one-command demo, port/stack table); ARCHITECTURE.md; DECISIONS.md; EVAL.md; INTERVIEW_DEFENSE.md; docs/screenshots; Makefile targets `up/venv/seed/test/eval/eval-gate/cost-report/demo`; `.github/workflows/ci.yml` (pgvector service container, stub mode, eval gate); pytest suite; 30+ commits Jul 7–8 2026.
- **Verified eval results (EVAL.md, 2026-07-08, stub mode, exit 0):** 44 labeled scenarios × 3 trials = 132 runs — missed-dependency 0.081, false-impact 0.069, risk-grade accuracy 0.773, plan completeness 0.995, citation fidelity 1.000; all thresholds passed; 3 grading levels incl. trajectory + injection defense.
- **Gaps:** (1) **No GitHub remote** — the repo exists only locally, so the CI workflow has never executed on GitHub Actions and the "CI-gated" claim is not yet externally auditable; (2) eval/trace/cost artifacts are not yet exported in a form the portfolio site components (TraceViewer, CaseStudyBlock) can consume; (3) working files that don't belong in a published repo sit in the tree (`release_guardian_review.zip` 6 MB, `release_guardian_gitlog.txt`, `.scratch/`, `.DS_Store`).

INVENTORY.md recommendation (human-approved at GATE 2a): **feature-as-is (flagship)** — needs a GitHub repo + README polish only. Accordingly this plan is packaging/verifiability work, not feature development.

## Proposed upgrades (upgrade-menu items 4 & 5: expose the process; production signals)

All work on a branch or copy; the local folder is never mutated irreversibly. All runs are stub-mode (offline, deterministic, laptop-friendly). Nothing here is [NEEDS-GPU].

| # | Task | Menu fit | Effort |
|---|---|---|---|
| U1 | Create **private** GitHub repo `LucisZhang/release-guardian`; add remote; push. Before pushing, add the junk/working files above to `.gitignore` on a branch (no history rewrite; the zip/txt are untracked working files — verify, then simply exclude). Confirm GitHub Actions CI runs green, making "tests + eval gate in CI" an externally auditable claim. | 5 | ~1.5 h |
| U2 | Reproducibility check: fresh `make venv && make seed && make test && make eval-gate` on this machine; confirm EVAL.md numbers reproduce (deterministic stub). If any number drifts, record the actual result and update EVAL.md honestly — the site quotes only reproduced numbers. | 4 | ~1 h (mostly waiting) |
| U3 | Export real artifacts for the site: (a) eval summary JSON (per-metric, per-scenario) from the U2 run; (b) one real OTel trace from a `make demo` run exported to portable JSON for the portfolio TraceViewer; (c) cost/latency report output (`make cost-report`: stub-run latency + real rerank benchmark). Store under the portfolio repo as case-study inputs. | 4 | ~2 h |
| U4 | README/docs final pass for external readers (it is already strong): add badge for CI once U1 is green; verify all internal doc links; no content invention. | 6 | ~0.5 h |

**Total time-box: ≤ 1 working day.** Stop condition = Publish-Ready Bar: runnable artifact ✓ (already), claims verified & reproduced (U2), interactive/visual proof inputs exported (U3), solid README ✓/U4, zero unverified claims.

## Explicitly out of scope

- No new features, no architecture changes — the project is feature-as-is per GATE 2a.
- No live-API (`RG_LLM_MODE=live`) runs by default; if a live-mode screenshot is ever wanted, that's a separate human decision (API key + cost).
- No public repo, no public URLs — repo stays private until Phase 3/4 gates.
- Case-study MDX writing is Phase 3, not this plan.

## Risks / notes

- `make up` needs Docker (Postgres+pgvector, Phoenix) — lightweight containers, within the 16 GB envelope; eval harness runs offline-stub and is CI-proven at pgvector-only.
- Creating a private repo + pushing is additive and reversible; no destructive git/GitHub operation is proposed. If any history cleanup turns out to be needed (e.g. tracked junk file), it will be proposed separately for human approval, not executed.

## GATE 2b — decision requested

Approve this plan (or adjust tasks/time-box), and confirm:
1. Repo name `release-guardian` under `LucisZhang`, private — OK?
2. U2's rule "site quotes only reproduced numbers" — OK?
3. Proceed order after approval: U1 → U2 → U3 → U4, single branch, checkpoint commit per task.
