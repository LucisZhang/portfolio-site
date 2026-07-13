# Phase 2 plan v2 — release_guardian (shortlist #1, ai track)

Status: **APPROVED at GATE 2b (human, 2026-07-12) — execution authorized for W1–W4 only.**
GATE 2b answers (verbatim intent): (1) W1–W4 approved, order W1→W2→W3→W4, one checkpoint
commit per task. (2) W5 DECLINED — workstation evidence is sufficient; do NOT install
PostgreSQL/pgvector on this Mac. (3) Working-copy location `~/release-guardian-portfolio`
approved. (4) CONDITIONAL approval: metric numbers and claim text may live ONLY in the
current no-remote local portfolio-site; original source, screenshots, and eval files stay
private (never copied into portfolio-site). Before ANY remote, push, publication, or public
git history, company/repository-owner approval AND legal review must be obtained again.
Hard stops restated by the human: no W5, no push/publish/deploy, no copying private raw
evidence into portfolio-site.
Drafted: 2026-07-12 by Fable5. Supersedes docs/phase2-plan-release-guardian.md (2026-07-09
historical draft, written when the project was judged incomplete and lived only in
`~/release_guardian`).

## What changed since the v1 draft

1. **The project is now complete.** The human executed the full migration on the company
   workstation (phases V/E/S/R/C/O/L per MIGRATION_PROGRESS.md) and returned a verified
   handoff. The v1 plan's premise ("not fully done, defer") no longer holds.
2. **Authoritative evidence exists and was independently validated this session** (see
   STATE.md Update 2026-07-12): full-history clone at
   `ca2ef58dfc1a6dc188ccb9e87525c9537ab8e11d` (27 commits, fsck-clean, bundle sha256 matches
   SHA256SUMS), plus a materials archive (README/ARCHITECTURE/DECISIONS/EVAL/
   INTERVIEW_DEFENSE/MIGRATION_PROGRESS/PORTFOLIO_GUIDE, 3 UI screenshots, 4 eval reports,
   cost report). The funded post-L live eval was re-parsed directly: **132/132 graph runs,
   zero failures, all eight gates PASS** (missed dep 0.1742, false impact 0.1232, risk
   accuracy 0.7273, plan completeness 0.9598, citation fidelity 1.000, tool misuse 0.000,
   step efficiency 1.0011, injection defense 1.000; $8.1213547 total, ~35.1 s avg/run).
3. **Publication is hard-gated.** PORTFOLIO_GUIDE.md is binding: the repo has NO LICENSE and
   no publication grant. Source, docs, eval materials, screenshots, and the ShopFabric
   scenarios are private/non-publishable until **written company/repository-owner approval
   AND legal review**. The v1 centerpiece (create GitHub repo + push + external CI) is
   therefore OFF this plan entirely — no push even to a private remote without explicit
   human approval.
4. **The old headline numbers are superseded.** The v1 draft quoted the 2026-07-08 xAI-era
   5-metric stub eval (missed dep 0.081, risk accuracy 0.773, ...). The portfolio must quote
   the post-migration evidence set: the 8-metric funded live run (authoritative), the
   stub before/after pair (deterministic, unchanged across Phase L), and the pre-L live
   baseline only as a disclosed operational delta. Claim discipline from PORTFOLIO_GUIDE.md:
   present strict all-trials residuals (30/44 scenarios flagged) alongside aggregate gates;
   the rationale judge is a diagnostic, not a gate; cost-report values keep their
   measured / estimated / modeled labels and dated price snapshots.

## Real current state (verified 2026-07-12)

- Production-shaped change-impact & risk-gatekeeper agent: LangGraph graph runtime + FastAPI,
  Go change-gateway, Java approval-audit (RBAC, hash-chained audit), Next.js dashboard,
  Postgres+pgvector, OTel tracing. Deterministic stub mode by default; live mode now routes
  through OpenRouter (strong `openai/gpt-5.6-terra`, cheap `qwen/qwen3.5-9b`) with local
  vLLM reranking (Qwen3-Reranker-0.6B) — migrated from the xAI/Ollama-era setup in phases C/O.
- Evidence lives in three places, all local: the verified handoff (canonical), the originals
  in `~/Downloads` (bundle + tarball), and the pre-migration `~/release_guardian` folder
  (read-only reference; per MIGRATION_PROGRESS.md its HEAD is a fast-forward ancestor of
  `ca2ef58`).
- 99-test suite passing on the workstation; `make test`/`make eval-gate` need Postgres+
  pgvector locally, which this Mac currently lacks (Docker was intentionally reset).

## Proposed tasks (all local, all private, laptop-friendly; no push/publish/keys/paid/GPU)

| # | Task | Menu fit | Effort |
|---|---|---|---|
| W1 | **Local working copy.** Clone from the bundle into `~/release-guardian-portfolio` (private, no remote). Verify: HEAD `ca2ef58`, fsck clean, and that `~/release_guardian` HEAD is a fast-forward ancestor (confirms the handoff strictly extends the original). Handoff dir and originals stay untouched. | 5 | ~0.5 h |
| W2 | **Claims-and-evidence matrix.** `docs/release-guardian-claims.md` in portfolio-site: every number/claim the future case study could state, mapped to its exact artifact (report file + JSON path), with the PORTFOLIO_GUIDE claim-discipline labels baked in. This becomes the single source Phase 3 MDX is allowed to quote. | 4 | ~1.5 h |
| W3 | **Doc-consistency pass.** Cross-check README/ARCHITECTURE/EVAL/DECISIONS/INTERVIEW_DEFENSE at `ca2ef58` against the eval reports and MIGRATION_PROGRESS (stale pre-migration references, metric drift, model names). Output = discrepancy list in W2's doc; fixes, if any, proposed as a local branch for separate approval — no silent edits. | 4 | ~1 h |
| W4 | **Sanitization-prep checklist.** `docs/release-guardian-sanitization-checklist.md`: exact redaction inventory for a future purpose-built sanitized export (git author identity, host/GPU/proxy/absolute-path/internal-infra metadata incl. specs-*.txt and MIGRATION_PROGRESS host details, screenshot review items). Prepare only — publication still requires company/owner approval + legal review. | 5 | ~1 h |

**Total time-box: ≤ half a working day.** Stop condition = Publish-Ready Bar minus
publication: evidence verified and mapped (W2), docs consistent (W3), sanitized-export path
ready to execute on approval (W4).

**W5 (optional, human decision):** local stub-mode reproduction (`make venv/seed/test/
eval-gate`) on this Mac. Requires installing Postgres+pgvector (Homebrew, no Docker) —
time-box 2 h, abort on friction. NOT required: the workstation evidence is authoritative and
the stub reports are deterministic; this only adds a "reproduces on a second machine" line.

## Explicitly out of scope / hard stops

- No GitHub repo creation, no push (private or public), no deploy, no public URLs.
- No API keys, no paid calls, no live-mode runs, no GPU/heavyweight eval on this Mac.
- No edits to the handoff, the originals in ~/Downloads, or `~/release_guardian`.
- Case-study MDX and site page are Phase 3, behind its own gate; publication of anything
  release_guardian-derived additionally requires the company/legal gate above.

## GATE 2b — decision requested

1. Approve tasks W1–W4 (order W1→W2→W3→W4, checkpoint commit per task)?
2. W5 local stub reproduction: yes (2 h box, Homebrew Postgres) or no?
3. Confirm working-copy location `~/release-guardian-portfolio`?
4. Confirm: portfolio-site planning docs may hold release_guardian claim text and metric
   numbers (as STATE.md already does), while source/screenshots/eval files themselves stay
   only in the handoff/working copy until the company/legal gate clears?
