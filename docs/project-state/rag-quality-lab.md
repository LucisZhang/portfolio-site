# Project state - RAG Quality Lab

Last updated: 2026-07-13
Lane key: `rag-quality-lab`
Execution owner: Codex (GPT-5.6 Sol)
Portfolio branch: `lane/rag-quality-lab`
Portfolio worktree: `~/portfolio-site-lanes/rag-quality-lab`
Project working copy: `~/rag-quality-lab-portfolio`
Status: V1 C2 PAGE PUBLISHED; CLAIM REGISTRY AND DRIFT LAB COMPLETE; PUBLIC C2 CODE SYNC STILL PENDING

## Next action on resume

Preserve the locked registry and explicit C3 no-results boundary. The public repository is still
baseline `0fc1433`, while the evidence checkpoint is local `6c887a1`; never label the linked public
code as C2-complete until a separately approved sync actually lands.

## C2 completed checkpoints

- `d7c5b30` - C2-1: Mac S1 mirror integrity record, 6/6 hashes match workstation acquisition.
- `e3383e0` - C2-2/3: 11,309-document corpus adapter, 130-question eval adapter, manifest and tests.
- `c6ee656` - C2-4/5: Ollama/HF backend seam, backend-aware deterministic verifier, judge-free S1 retrieval runner and tests.
- `5944232` - C2-6: DATA/README documentation, Lane L2 labels and backend quick start.
- `6c887a1` - C3 timebox: dependency preflight, stronger runner provenance/output hashes, and
  an explicit no-results record; no retrieval metric was generated.
- Prerequisites also present locally: `a92e953` raw-data gitignore guard and `47c2403` sanitized workstation C0/C1 evidence.

The private working copy is clean and eight commits ahead of private `origin/main`; neither that
private remote nor the public repository received these local commits in the monitored run.

## Codex verification - 2026-07-12

- Ruff: PASS.
- Pytest after C3 provenance work: 68 passed.
- `scripts/verify_data.py`: PASS, including 11,309 S1 documents and 130 S1 questions.
- Deterministic A3 wrapper: PASS with dependency stubs.
- Verification-only timestamp churn was restored; working tree remains clean.

The prior Fable-monitored run also passed CI-equivalent in a temporary public clone and prepared
a sanitized uncommitted diff against public commit `0fc1433`. That scratch clone is evidence of
readiness, not a durable checkpoint and not proof of a completed push.

## C3 timebox outcome

- Intended real comparison: existing `NaiveVectorRAG` versus existing `HybridRerankRAG` over
  11,309 S1 documents and all 130 S1-answerable questions, deterministic retrieval metrics only.
- Blocker: Chroma, PyTorch, Transformers, sentence-transformers, LangChain integrations, and the
  required uncached cross-encoder were not available in the project environment or local caches.
- Installing/downloading the heavy stack exceeded the offline/no-multi-GB timebox. Substituting a
  toy lexical pipeline would invalidate the comparison, so no metrics were produced.
- Public-safe record: `public/case-studies/rag-quality-lab/c3-timebox/`.

## Still not done

- No C2 commit or push to public `LucisZhang/rag-quality-lab`.
- No final portfolio integration checkpoint for the public sync.
- No C3 retrieval A/B results, Lane L2 judged run, or C3 evidence tarball.
- No full 500K run, paid API-judge call, or public deployment.

## Operable claim-verifier checkpoint

- `public/case-studies/rag-quality-lab/claim-registry.json` is the machine-readable authority for
  the current C2/C3 portfolio claims and records public baseline versus local evidence state.
- Manifest & Drift Lab canonicalizes and SHA-256 hashes an editable candidate manifest in-browser.
  It detects count changes, answer-metric leakage, C3/fallback overclaims, and premature public-sync
  claims without running retrieval, generation, or a judge.
- Its document lane normalizes a fixed fictional document, generates a Web Crypto manifest entry,
  compares expected and actual fields/backend contract, and exposes exact failures for content-hash,
  document-ID, missing-field, backend-contract, and malformed-JSON drift. Reset restores the baseline.
- `docs/external-rag-readme-claim-reconciliation.patch` applies to public commit `0fc1433`. It was
  generated from a sanitized noreply-author commit, passed reverse `git apply --check`, and was not
  pushed.
- Playwright covers aligned, corpus-drift, metric/fallback-leak, sync-overclaim, and malformed JSON
  paths in desktop, tablet, and mobile projects.

## Gates and boundaries

- Public push is an external action and remains at the explicit human confirmation point recorded
  by Codex session `019f428f-aad3-78e3-bb44-8c16505e5fdd`.
- Direction freeze selected C3 option (b): deterministic S1 A/B only. Lane L2 is v1.1.
- Codex performs all implementation, verification, sync, and checkpoint work.
- Raw EnterpriseRAG-Bench mirror remains untracked/private. S3 full 500K remains STOPPED.
- Lane A paid judge remains STOPPED. No API key entry or paid call without a fresh gate.

## Lane isolation

This lane is independent of Release Guardian and every other portfolio project. Their pause,
rate limit, gate, or checkpoint does not alter this file or this lane's next action.
