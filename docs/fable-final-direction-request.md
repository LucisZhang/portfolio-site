# Fable final direction-freeze request

Status: COMPLETE - decision recorded in `docs/portfolio-direction-freeze.md`.
Prepared: 2026-07-12

## Budget contract

This is Fable's final portfolio task before execution transfers fully to Codex (GPT-5.6 Sol).
Use a fresh short session. Read this file only; the facts below are already curated from the
repository and current Git state.

- Return one decision memo in chat, maximum 1,200 words and roughly 120 lines.
- Do not edit files, run commands/tests, browse, research, invoke subagents, commit, push, deploy,
  or operate any project repository.
- Do not re-derive metrics or invent scope. Treat all hard gates below as binding.
- Make decisions, state tradeoffs, and stop. Codex will record and execute approved decisions.

## Current portfolio facts

- Phase 1 site skeleton is complete. Phase 3 case-study/page work has not started.
- The approved v1 shortlist is: Release Guardian, p1-reliability-lab, RAG Quality Lab,
  Privacy Preflight for Mac, and one analytics tandem (E-commerce RFM/funnel + credit-risk/fraud).
- Project lanes are independent and may execute in parallel. Priority tiers are not dependencies.

### Release Guardian

- Company-workstation migration is complete and verified.
- Portfolio W1-W4 are complete locally. W3 recorded 13 consistency findings and W4 prepared
  the sanitization inventory; no export or publication has occurred.
- Legal review and ownership authorization were human-confirmed complete on 2026-07-12.
- Decide the v1 Phase 3 proof surface and the smallest approved sanitized asset set needed for
  the case study; the project no longer needs to be deferred for legal/ownership reasons.
- W5 local PostgreSQL/pgvector reproduction was declined.
- Source, screenshots and eval files remain private until they pass the W4 allowlist and
  sanitization workflow. Record approval scope/license terms privately and obtain explicit
  approval for the final artifact before any remote, publication, or public Git history.

### p1-reliability-lab

- U1-U5 are complete with exported case-study evidence.
- U6 heavy local reproduction was attempted and closed as blocked/partial on this Mac; a remote
  Linux reproduction guide exists.
- Decide whether v1 should accept the existing audited evidence and disclose the reproduction
  boundary, or require another remote run before Phase 3.

### RAG Quality Lab

- C2-1 through C2-6 are complete locally in a clean private working copy.
- Codex independently verified Ruff PASS, 66 tests PASS, manifest PASS for 11,309 S1 documents
  and 130 questions, and deterministic A3 PASS.
- A sanitized public sync was prepared and CI-checked in a temporary clone, but no public commit
  or push occurred. The actual push remains a human action gate.
- C3 has not started. Candidate scope: S1 GPU indexing, judge-free deterministic retrieval A/B,
  and optional Lane L2 independent HF-runtime judged replication. Full 500K and paid API judge
  remain stopped.

### Privacy Preflight for Mac

- Strong local-first SwiftUI + FastAPI privacy product with text/image/destructive-PDF redaction
  and privacy red-line tests.
- Phase 2 upgrade plan has not been frozen. Signing, notarization, bundled runtime and hotkeys are
  incomplete. Decide the minimum credible v1 upgrade; avoid turning packaging into an open-ended project.

### Analytics tandem

- Tableau e-commerce dashboard and public credit-risk/fraud demo are reachable.
- Claimed dashboard/model figures remain `[NEEDS-HUMAN-VERIFY]`; no Phase 2 verification plan is frozen.
- Decide whether these remain one combined analytics case study or become separate pages, and set
  the minimum evidence bar needed before any metric appears.

## Decisions required from Fable

1. **v1 cutline:** Which projects/pages must ship in the first public version, and which may be
   staged for v1.1? Preserve credible coverage of Data Engineering, Analytics and AI Applications.
2. **Per-project stop condition:** For each of the five entries, state the smallest honest point at
   which Codex should stop upgrading and move to Phase 3.
3. **RAG scope:** Recommend one of: (a) publish C2 and defer C3, (b) C3 deterministic S1 retrieval
   only, or (c) deterministic S1 plus Lane L2 judged replication. Explain why. Do not authorize push.
4. **Phase 3 evidence design:** Name the one primary proof surface for each project (for example,
   PipelineGraph, DataExplorer, TraceViewer, static evidence table, or demo media) and the key claim
   boundary that prevents overlap or exaggeration.
5. **Codex backlog:** Produce P0/P1/P2 priority tiers with measurable acceptance criteria. These are
   scheduling priorities, not cross-lane dependencies.
6. **Cuts:** Explicitly list work to defer or drop so Codex does not spend time polishing optional
   infrastructure, new features, broad GitHub cleanup, or deployment before the v1 evidence pages exist.

## Required output format

1. `Portfolio north star` - one short paragraph.
2. `v1 cutline` - table: project, ship in v1/v1.1, reason.
3. `Lane decisions` - table: project, do now, stop when, defer/drop, claim boundary.
4. `Phase 3 proof map` - one line per project.
5. `Codex execution tiers` - P0/P1/P2 with acceptance criteria.
6. `Human gates still required` - maximum five bullets.

Do not end with implementation. End with `DIRECTION FREEZE COMPLETE`.
