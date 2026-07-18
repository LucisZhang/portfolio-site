# Claim-to-evidence index

Updated: 2026-07-18

This index maps the portfolio's principal visible claims to inspectable evidence. “Source” means
the implementation or reproduction path; it does not turn a synthetic fixture into measured
production evidence. Remote links describe the last anonymously verified public state. Local
pipeline links become anonymously public only after the owner-gated publication checklist is
completed.

## Release Guardian

| Visible claim | Artifact | Source / reproduction path | Boundary |
| --- | --- | --- | --- |
| 8/8 aggregate gates passed across 132 funded live graph runs | [`evaluation-live.csv`](../public/case-studies/release-guardian/data/evaluation-live.csv) | [`ProjectProof.tsx`](../src/components/ProjectProof.tsx), [`manifest.json`](../public/case-studies/release-guardian/manifest.json) | Aggregate thresholds; not a statement that every scenario passed every trial |
| 30/44 strict residual | [`evaluation-live.csv`](../public/case-studies/release-guardian/data/evaluation-live.csv) | Strict definition is rendered immediately above the metric | A scenario is flagged when any criterion fails in any of its three trials |
| 13 sanitized findings | [`findings.csv`](../public/case-studies/release-guardian/data/findings.csv) | [`ReleaseChangeReplay.tsx`](../src/components/release/ReleaseChangeReplay.tsx) | Sanitized derivative only; private source and raw report are excluded |
| Synthetic review workflow | [`synthetic-scenarios.json`](../public/case-studies/release-guardian/replay/synthetic-scenarios.json) | [Public replay components](https://github.com/LucisZhang/portfolio-site/tree/codex/portfolio-phase2/src/components/release) | Presentation derivative; it inherits no funded-live or stub metric |

## RAG Quality Lab

| Visible claim | Artifact | Source / reproduction path | Boundary |
| --- | --- | --- | --- |
| 11,309 hashed S1 documents, 130 answerable questions, 68 passing tests | [`claim-registry.json`](../public/case-studies/rag-quality-lab/claim-registry.json) | [Claim-reconciliation PR](https://github.com/LucisZhang/rag-quality-lab/pull/1) | Evaluation-foundation evidence, not answer-quality evidence |
| C3 produced no metric | [`c3-timebox/README.md`](../public/case-studies/rag-quality-lab/c3-timebox/README.md), [`dependency-preflight.json`](../public/case-studies/rag-quality-lab/c3-timebox/dependency-preflight.json) | [`RagManifestDriftLab.tsx`](../src/components/rag/RagManifestDriftLab.tsx) | No fallback comparison or inferred result |

## Privacy Preflight

| Visible claim | Artifact | Source / reproduction path | Boundary |
| --- | --- | --- | --- |
| 96 final-snapshot worker tests with the exact app ZIP's CPython 3.12.13 interpreter and runtime dependencies | [`worker-tests-goal-candidate.json`](../public/case-studies/privacy-preflight/worker-tests-goal-candidate.json), [`release-manifest.json`](../public/case-studies/privacy-preflight/downloads/release-manifest.json) | [`privacy-macos-release-audit.md`](privacy-macos-release-audit.md), [`privacy-preflight-build-from-source.md`](privacy-preflight-build-from-source.md) | Pytest 8.4.2 frontend was supplied separately as test harness; worker/build-Mac evidence only, not broad app compatibility evidence |
| Current clean-candidate browser regression: 143 passed, 22 intentional viewport skips, 0 failed | [`goal-candidate-e2e.json`](../public/case-studies/privacy-preflight/goal-candidate-e2e.json) | [`portfolio.spec.ts`](../tests/e2e/portfolio.spec.ts), [`analytics-real-data.spec.ts`](../tests/e2e/analytics-real-data.spec.ts) | Exact local runtime-tree fingerprint; not deployed-preview D4 or anonymous-download evidence |
| 67 recorded end-to-end browser cases at the 2026-07-13 checkpoint | [`browser-e2e-checkpoint.json`](../public/case-studies/privacy-preflight/browser-e2e-checkpoint.json) | [`tests/e2e/portfolio.spec.ts`](../tests/e2e/portfolio.spec.ts), committed `STATE.md` at `fca4a852b68d72d6f08769944669037e3f3954fa` | Transparent transcription of the committed checkpoint; the raw reporter file was not retained, and later candidates rerun the full suite separately |
| OCR fixed fixtures: 19/19 expected values hit, 21 detections, 2 false positives (90.5% precision) | [`ocr-fixture-benchmark.json`](../public/case-studies/privacy-preflight/ocr-fixture-benchmark.json) | [`run-privacy-ocr-benchmark.mjs`](../scripts/run-privacy-ocr-benchmark.mjs) | Seven fixed fictional fixtures using the complete browser-equivalent multi-pass union; not a general OCR accuracy claim |
| Redacted PDF has a destructive image-only output path | [`pdf-redaction-result.json`](../public/case-studies/privacy-preflight/pdf-redaction-result.json), [`pdf-synthetic-redacted.pdf`](../public/case-studies/privacy-preflight/pdf-synthetic-redacted.pdf) | [`PrivacyPdfLab.tsx`](../src/components/privacy/PrivacyPdfLab.tsx) | Removes search, selection, links, and accessibility structure; human review remains required |
| Staged 0.1.0 macOS arm64 preview and runtime-matching source | [`Privacy-Preflight-0.1.0-macOS-arm64-unnotarized.zip`](../public/case-studies/privacy-preflight/downloads/Privacy-Preflight-0.1.0-macOS-arm64-unnotarized.zip), [`Privacy-Preflight-0.1.0-source.zip`](../public/case-studies/privacy-preflight/downloads/Privacy-Preflight-0.1.0-source.zip), [`release-manifest.json`](../public/case-studies/privacy-preflight/downloads/release-manifest.json) | [`privacy-macos-release-audit.md`](privacy-macos-release-audit.md) | App ZIP: 33,930,369 bytes, SHA-256 `360083a7fab6b60600f597b28a32c533a9df932766c21b80cba80e6c56350911`; source ZIP: 202,613 bytes, SHA-256 `4138cd3b61a17b4f7b36a5e104389aa229f5e638c3d3a019ce6aa26171624295`; arm64/macOS 14+, ad-hoc signed only, not Developer ID signed or notarized |
| SPDX 2.3 runtime inventory and exact CPython license | [`sbom.spdx.json`](../public/case-studies/privacy-preflight/downloads/sbom.spdx.json), [`CPython-LICENSE.txt`](../public/case-studies/privacy-preflight/downloads/CPython-LICENSE.txt), [`THIRD_PARTY_NOTICES.md`](../public/case-studies/privacy-preflight/downloads/THIRD_PARTY_NOTICES.md) | [`release-manifest.json`](../public/case-studies/privacy-preflight/downloads/release-manifest.json) | 26-package runtime inventory; the source snapshot declares no separate project-wide open-source license; not legal advice |

## Streaming Reliability Lab

| Visible claim | Artifact | Source / reproduction path | Boundary |
| --- | --- | --- | --- |
| Five induced failure classes, zero snapshot differences after recovery | [`index.json`](../public/case-studies/p1-reliability-lab/results/index.json), [`eo_reconciliation.json`](../public/case-studies/p1-reliability-lab/results/eo_reconciliation.json) | [Public lab repository](https://github.com/LucisZhang/p1-reliability-lab), [`workstation-reproduction-guide.md`](../public/case-studies/p1-reliability-lab/workstation-reproduction-guide.md) | July U6 result applies only to its recorded local-Mac environment |
| Checkpoint duration 55 ms → 19,022 ms; commit lag 320 → 0; one checkpoint failure | [`checkpoint_metrics.json`](../public/case-studies/p1-reliability-lab/results/checkpoint_metrics.json) | [`ProjectProof.tsx`](../src/components/ProjectProof.tsx) | Recorded historical experiment, not a universal performance benchmark |
| Small-file rewrite evidence | [`iceberg_small_file_rewrite.json`](../public/case-studies/p1-reliability-lab/results/iceberg_small_file_rewrite.json), [`phase-2.2-small-file-rewrite.svg`](../public/case-studies/p1-reliability-lab/media/phase-2.2-small-file-rewrite.svg) | [`runbook-incidents.md`](../public/case-studies/p1-reliability-lab/runbook-incidents.md) | Historical May artifact set; separate from the July reproduction |

## Margin Control Tower

| Visible claim | Artifact | Source / reproduction path | Boundary |
| --- | --- | --- | --- |
| Synthetic fixture: 9,360 rows and guided −10.3K anomaly | [`synthetic-margin-data.json`](../public/case-studies/margin-control-tower/synthetic-margin-data.json) | [`MarginControlTower.tsx`](../src/components/analytics/MarginControlTower.tsx), [`data-contract.json`](../public/case-studies/margin-control-tower/data-contract.json) | Fixed-seed fictional result; not real lift, detection accuracy, or causal impact |
| Ten fail-closed contract checks | [`data-contract.json`](../public/case-studies/margin-control-tower/data-contract.json), [`metric-registry.json`](../public/case-studies/margin-control-tower/metric-registry.json) | [`MarginControlTower.tsx`](../src/components/analytics/MarginControlTower.tsx) | Contract validity does not establish business validity |
| Pipeline-derived Olist margin, anomaly, and elasticity results | [`olist-margin.parquet`](../public/case-studies/margin-control-tower/olist-margin.parquet), [`detection-report.json`](../public/case-studies/margin-control-tower/detection-report.json), [`elasticity-report.json`](../public/case-studies/margin-control-tower/elasticity-report.json), [`methods-evidence.json`](../public/case-studies/margin-control-tower/methods-evidence.json) | [`README.md`](../pipelines/olist-margin/README.md), [`PROVENANCE.md`](../pipelines/olist-margin/PROVENANCE.md) | Derived category-grain aggregates only; raw Olist rows excluded; STL uses a disclosed complete Monday calendar with no-cell weeks zero-filled, replay labels stay on observed Mondays, and economics remain disclosed proxies |

## Credit Policy Lab

| Visible claim | Artifact | Source / reproduction path | Boundary |
| --- | --- | --- | --- |
| Synthetic fixture: 12,000 applications and capacity-gated policy audit | [`synthetic-credit-data.json`](../public/case-studies/credit-policy-lab/synthetic-credit-data.json) | [`CreditPolicyLab.tsx`](../src/components/analytics/CreditPolicyLab.tsx), [`policy-contract.json`](../public/case-studies/credit-policy-lab/policy-contract.json) | Fictional fixture; not deployed accuracy, fairness, compliance, or a real applicant decision |
| Baseline↔challenger swap set and expected-loss delta | Synthetic data above; pipeline-derived backtest when present | [`SwapSetPanel.tsx`](../src/components/analytics/SwapSetPanel.tsx) | Policy comparison unless a validated observed-outcome artifact is loaded; not model superiority |
| Time-ordered calibrated credit backtest | [`scored-backtest.parquet`](../public/case-studies/credit-policy-lab/scored-backtest.parquet), [`backtest-report.json`](../public/case-studies/credit-policy-lab/backtest-report.json), [`methods-evidence.json`](../public/case-studies/credit-policy-lab/methods-evidence.json) | [`README.md`](../pipelines/credit-backtest/README.md), [`PROVENANCE.md`](../pipelines/credit-backtest/PROVENANCE.md) | Metrics exactly recompute from final float64-score Parquet; granted-loan-only artifact with no rejected-applicant representation, causal policy effect, production decisioning, regulatory validation, or fairness claim |

## Publication state

This commit contains the complete upgrade evidence indexed above. At the pre-publication snapshot
recorded on 2026-07-18 08:03 Asia/Shanghai, the public review branch still pointed to `234da138`,
not this candidate. Anonymous availability is time-dependent and cannot be proven by this immutable
file: verify the current remote branch and exact commit, then follow
[`PUBLICATION_CHECKLIST.md`](PUBLICATION_CHECKLIST.md) and
[`github-publication-manifest.md`](github-publication-manifest.md) before describing any source or
artifact as anonymously public.
