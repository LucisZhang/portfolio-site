# Claim-to-evidence index

Updated: 2026-08-30

## Round-2 evidence set (current)

The Round-2 rebuild moved the primary number-to-artifact discipline into three
machine-checked registers; start there for any number the current site renders:

- [`evidence/r2-source-map.md`](evidence/r2-source-map.md) — the frozen source
  contract: every upstream artifact as
  `source path → site target → SHA-256 → generating command`, re-hashed by
  `npm run verify:r2-sources`.
- [`evidence/digits-*.md`](evidence/) — ten per-page digits audits
  (`digits-home.md`, `digits-forge.md`, `digits-guardian.md`, `digits-rag.md`,
  `digits-triage.md`, `digits-privacy.md`, `digits-eod.md`,
  `digits-crossover.md`, `digits-margin.md`, `digits-credit.md`), each listing
  every rendered number's file, JSON path, and hash.
- [`evidence/receipt-interface.md`](evidence/receipt-interface.md) — the two-level
  receipt interface and anonymously validated, commit-pinned public file links.
- [`../heavy-assets.json`](../heavy-assets.json) — the measured byte ledger for
  every large download, asserted against disk and UI-advertised sizes by
  `npm run verify:heavy-assets`.

The full gate list and commands are summarized in the repository
[`README.md`](../README.md).

## Phase-2 claim register (preserved)

The tables below are the Phase-2 claim-to-artifact register. Their claim rows
are preserved unchanged because `src/lib/projects.ts`'s audited catalog and the
digits audits above cite them; only artifact paths were repaired to the
post-rename locations, and components deleted by the rebuild are marked
retired. Project naming reflects Phase 2, before the 2026-08 route renames
(Streaming Reliability Lab → Exactly-Once Drills at
`/engineering/exactly-once-drills`; Credit Policy Lab → Credit Policy Desk at
`/analytics/credit-policy-desk`). “Source” means the implementation or
reproduction path; it does not turn a synthetic fixture into measured
production evidence. Remote links describe the last anonymously verified public
state. Local pipeline links become anonymously public only after the
owner-gated publication checklist is completed.

## Public resumes

This repository publishes no resume artifact. The owner-approved English and Chinese PDFs are
private material, are served only from the deployment host, and are excluded from the assistant's
knowledge package, retrieval index, prompts, and model payloads. `siteIdentity.resume` here is an
unrendered placeholder; `tests/e2e/portfolio.spec.ts` asserts that the public build links no
resume and serves no resume path.

## Release Guardian

| Visible claim | Artifact | Source / reproduction path | Boundary |
| --- | --- | --- | --- |
| 8/8 aggregate gates passed across 132 funded live graph runs | [`evaluation-live.csv`](../public/case-studies/release-guardian/data/evaluation-live.csv) | `ReleaseGuardianProof.tsx` (retired in the Round-2 rebuild), [`manifest.json`](../public/case-studies/release-guardian/manifest.json) | Aggregate thresholds; not a statement that every scenario passed every trial |
| 30/44 strict residual | [`evaluation-live.csv`](../public/case-studies/release-guardian/data/evaluation-live.csv) | Strict definition is rendered immediately above the metric | A scenario is flagged when any criterion fails in any of its three trials |
| 13 sanitized findings | [`findings.csv`](../public/case-studies/release-guardian/data/findings.csv) | `ReleaseChangeReplay.tsx` (retired in the Round-2 rebuild) | Sanitized derivative only; private source and raw report are excluded |
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
| Superseded d8bc Goal2 local browser regression: 203 passed, 52 intentional skips, 0 failed, 0 flaky in installed Google Chrome | [`playwright-summary.json`](phase2-public-review-artifacts/goal2-final/playwright-summary.json), [`manual-audit.json`](phase2-public-review-artifacts/goal2-final/chrome/manual-audit.json), [`screenshot-manifest.json`](phase2-public-review-artifacts/goal2-final/chrome/screenshot-manifest.json) | [`portfolio.spec.ts`](../tests/e2e/portfolio.spec.ts), [`analytics-real-data.spec.ts`](../tests/e2e/analytics-real-data.spec.ts), [`assistant.spec.ts`](../tests/e2e/assistant.spec.ts), [`localized-error-paths.spec.ts`](../tests/e2e/localized-error-paths.spec.ts), [`quality.spec.ts`](../tests/e2e/quality.spec.ts) | Historical exact local runtime-tree digest `d8bc8492…` across 221 files; retained for provenance only and superseded by the v12 assistant runtime change |
| Superseded eb08 Goal2 local browser regression: 203 passed, 52 intentional skips, 0 failed, 0 flaky in installed Google Chrome | [`playwright-summary-eb08-superseded.json`](phase2-public-review-artifacts/goal2-final/playwright-summary-eb08-superseded.json), [`manual-audit-eb08-superseded.json`](phase2-public-review-artifacts/goal2-final/chrome/manual-audit-eb08-superseded.json) | Same test-source families above | Historical exact local runtime-tree digest `eb08c00…`; retained for provenance only and not current-candidate evidence |
| Prior pre-Goal2 clean-candidate browser regression: 143 passed, 22 intentional viewport skips, 0 failed | [`goal-candidate-e2e.json`](../public/case-studies/privacy-preflight/goal-candidate-e2e.json) | [`portfolio.spec.ts`](../tests/e2e/portfolio.spec.ts), [`analytics-real-data.spec.ts`](../tests/e2e/analytics-real-data.spec.ts) | Historical 2026-07-17 exact local runtime-tree fingerprint; not current Goal2 evidence |
| 67 recorded end-to-end browser cases at the 2026-07-13 checkpoint | [`browser-e2e-checkpoint.json`](../public/case-studies/privacy-preflight/browser-e2e-checkpoint.json) | [`tests/e2e/portfolio.spec.ts`](../tests/e2e/portfolio.spec.ts), committed `STATE.md` at `fca4a852b68d72d6f08769944669037e3f3954fa` | Transparent transcription of the committed checkpoint; the raw reporter file was not retained, and later candidates rerun the full suite separately |
| OCR fixed fixtures: 19/19 expected values hit, 21 detections, 2 false positives (90.5% precision) | [`ocr-fixture-benchmark.json`](../public/case-studies/privacy-preflight/ocr-fixture-benchmark.json) | [`run-privacy-ocr-benchmark.mjs`](../scripts/run-privacy-ocr-benchmark.mjs) | Seven fixed fictional fixtures using the complete browser-equivalent multi-pass union; not a general OCR accuracy claim |
| Redacted PDF has a destructive image-only output path | [`pdf-redaction-result.json`](../public/case-studies/privacy-preflight/pdf-redaction-result.json), [`pdf-synthetic-redacted.pdf`](../public/case-studies/privacy-preflight/pdf-synthetic-redacted.pdf) | [`PrivacyPdfLab.tsx`](../src/components/privacy/PrivacyPdfLab.tsx) | Removes search, selection, links, and accessibility structure; human review remains required |
| Chinese proof-gallery inputs and redacted previews are locale-specific | [`image-synthetic-input-zh.svg`](../public/case-studies/privacy-preflight/image-synthetic-input-zh.svg), [`image-synthetic-redacted-zh.svg`](../public/case-studies/privacy-preflight/image-synthetic-redacted-zh.svg), [`pdf-synthetic-input-preview-zh.svg`](../public/case-studies/privacy-preflight/pdf-synthetic-input-preview-zh.svg), [`pdf-synthetic-redacted-preview-zh.svg`](../public/case-studies/privacy-preflight/pdf-synthetic-redacted-preview-zh.svg), [`manifest.json`](../public/case-studies/privacy-preflight/manifest.json) | [`generate-privacy-localized-proof-assets.mjs`](../scripts/generate-privacy-localized-proof-assets.mjs), [`privacy-web-parity.md`](privacy-web-parity.md) | Fictional deterministic SVG presentation derivatives with independently burn-in-verified embedded raster pixels and source/output hashes; not fresh runtime redaction evidence |
| Staged 0.1.0 macOS arm64 preview and runtime-matching source | [`Privacy-Preflight-0.1.0-macOS-arm64-unnotarized.zip`](../public/case-studies/privacy-preflight/downloads/Privacy-Preflight-0.1.0-macOS-arm64-unnotarized.zip), [`Privacy-Preflight-0.1.0-source.zip`](../public/case-studies/privacy-preflight/downloads/Privacy-Preflight-0.1.0-source.zip), [`release-manifest.json`](../public/case-studies/privacy-preflight/downloads/release-manifest.json) | [`privacy-macos-release-audit.md`](privacy-macos-release-audit.md) | App ZIP: 33,930,369 bytes, SHA-256 `360083a7fab6b60600f597b28a32c533a9df932766c21b80cba80e6c56350911`; source ZIP: 202,613 bytes, SHA-256 `4138cd3b61a17b4f7b36a5e104389aa229f5e638c3d3a019ce6aa26171624295`; arm64/macOS 14+, ad-hoc signed only, not Developer ID signed or notarized |
| SPDX 2.3 runtime inventory and exact CPython license | [`sbom.spdx.json`](../public/case-studies/privacy-preflight/downloads/sbom.spdx.json), [`CPython-LICENSE.txt`](../public/case-studies/privacy-preflight/downloads/CPython-LICENSE.txt), [`THIRD_PARTY_NOTICES.md`](../public/case-studies/privacy-preflight/downloads/THIRD_PARTY_NOTICES.md) | [`release-manifest.json`](../public/case-studies/privacy-preflight/downloads/release-manifest.json) | 26-package runtime inventory; the source snapshot declares no separate project-wide open-source license; not legal advice |

## Streaming Reliability Lab

| Visible claim | Artifact | Source / reproduction path | Boundary |
| --- | --- | --- | --- |
| Five induced failure classes, zero snapshot differences after recovery | [`index.json`](../public/case-studies/exactly-once-drills/results/index.json), [`eo_reconciliation.json`](../public/case-studies/exactly-once-drills/results/eo_reconciliation.json) | [Public lab repository](https://github.com/LucisZhang/streaming-reliability-lab), [`workstation-reproduction-guide.md`](../public/case-studies/exactly-once-drills/workstation-reproduction-guide.md) | July U6 result applies only to its recorded local-Mac environment; the site route retains its historical slug |
| Checkpoint duration 55 ms → 19,022 ms; commit lag 320 → 0; one checkpoint failure | [`checkpoint_metrics.json`](../public/case-studies/exactly-once-drills/results/checkpoint_metrics.json) | `P1Proof.tsx` (retired in the Round-2 rebuild) | Recorded historical experiment, not a universal performance benchmark |
| Small-file rewrite evidence | [`iceberg_small_file_rewrite.json`](../public/case-studies/exactly-once-drills/results/iceberg_small_file_rewrite.json), [`phase-2.2-small-file-rewrite.svg`](../public/case-studies/exactly-once-drills/media/phase-2.2-small-file-rewrite.svg) | [`runbook-incidents.md`](../public/case-studies/exactly-once-drills/runbook-incidents.md) | Historical May artifact set; separate from the July reproduction |
| Current v15 compatibility pack is grounded in three verified public-GitHub blobs at the final Streaming repository commit | [`assistant-public-sources.ts`](../src/lib/assistant-public-sources.ts) | Repository `LucisZhang/streaming-reliability-lab`, commit `eda2a7c156059678ecae8c57f4452ef98bd9ae89`; source-pack SHA-256 `81973c062f133225ad817cf97b1673aca4ee61e84450515c6d2dbf0774fa0452`; fact-catalog SHA-256 `804ffa4dd7e06850351af20421799903d589f259181e0618e42d40a651f59b90` | Offline compatibility source only; the old P1 repository name is retained solely as a historical alias. One recorded single-node Mac/Docker lab run does not prove production readiness, cloud scale, multi-node behavior, general hardware compatibility, continuous operation, or one-command reproduction |

## Margin Control Tower

| Visible claim | Artifact | Source / reproduction path | Boundary |
| --- | --- | --- | --- |
| Synthetic fixture: 9,360 rows and guided −10.3K anomaly | [`synthetic-margin-data.json`](../public/case-studies/margin-control-tower/synthetic-margin-data.json) | [`MarginControlTower.tsx`](../src/components/analytics/MarginControlTower.tsx), [`data-contract.json`](../public/case-studies/margin-control-tower/data-contract.json) | Fixed-seed fictional result; not real lift, detection accuracy, or causal impact |
| Ten fail-closed contract checks | [`data-contract.json`](../public/case-studies/margin-control-tower/data-contract.json), [`metric-registry.json`](../public/case-studies/margin-control-tower/metric-registry.json) | [`MarginControlTower.tsx`](../src/components/analytics/MarginControlTower.tsx) | Contract validity does not establish business validity |
| Pipeline-derived Olist margin, anomaly, and elasticity results | [`olist-margin.parquet`](../public/case-studies/margin-control-tower/olist-margin.parquet), [`detection-report.json`](../public/case-studies/margin-control-tower/detection-report.json), [`elasticity-report.json`](../public/case-studies/margin-control-tower/elasticity-report.json), [`methods-evidence.json`](../public/case-studies/margin-control-tower/methods-evidence.json) | [`README.md`](../pipelines/olist-margin/README.md), [`PROVENANCE.md`](../pipelines/olist-margin/PROVENANCE.md) | Derived category-grain aggregates only; raw Olist rows excluded; STL uses a disclosed complete Monday calendar with no-cell weeks zero-filled, replay labels stay on observed Mondays, and economics remain disclosed proxies |
| Real is requested by default; a verified compact preview promotes to full DuckDB-WASM after the eight-second warm or earlier qualifying interaction, with one Parquet GET and cache rejoin across remount | [`MarginControlTower.tsx`](../src/components/analytics/MarginControlTower.tsx), [`duckdb.ts`](../src/lib/duckdb.ts), [`analytics-data-cache.ts`](../src/lib/analytics-data-cache.ts) | [`analytics-real-data.spec.ts`](../tests/e2e/analytics-real-data.spec.ts), [`playwright-summary.json`](phase2-public-review-artifacts/goal2-final/playwright-summary.json) | Missing or invalid real evidence fails closed; synthetic remains separately labeled; runtime behavior does not establish business validity |

## Credit Policy Lab

| Visible claim | Artifact | Source / reproduction path | Boundary |
| --- | --- | --- | --- |
| Synthetic fixture: 12,000 applications and capacity-gated policy audit | [`synthetic-credit-data.json`](../public/case-studies/credit-policy-desk/synthetic-credit-data.json) | [`CreditPolicyLab.tsx`](../src/components/analytics/CreditPolicyLab.tsx), [`policy-contract.json`](../public/case-studies/credit-policy-desk/policy-contract.json) | Fictional fixture; not deployed accuracy, fairness, compliance, or a real applicant decision |
| Baseline↔challenger swap set and expected-loss delta | Synthetic data above; pipeline-derived backtest when present | [`SwapSetPanel.tsx`](../src/components/analytics/SwapSetPanel.tsx) | Policy comparison unless a validated observed-outcome artifact is loaded; not model superiority |
| Time-ordered calibrated credit backtest | [`scored-backtest.parquet`](../public/case-studies/credit-policy-desk/scored-backtest.parquet), [`backtest-report.json`](../public/case-studies/credit-policy-desk/backtest-report.json), [`methods-evidence.json`](../public/case-studies/credit-policy-desk/methods-evidence.json) | [`README.md`](../pipelines/credit-backtest/README.md), [`PROVENANCE.md`](../pipelines/credit-backtest/PROVENANCE.md) | Metrics exactly recompute from final float64-score Parquet; granted-loan-only artifact with no rejected-applicant representation, causal policy effect, production decisioning, regulatory validation, or fairness claim |

## Publication state

### Goal2 localization and final local QA

| Claim | Artifact | Boundary |
| --- | --- | --- |
| Historical v12 p1 public-GitHub assistant bridge passed its complete local checks | [`assistant-public-github-v12-local-verification.json`](phase2-public-review-artifacts/goal2-final/assistant-public-github-v12-local-verification.json) | Policy 37/37; focused installed Chrome 18/18; full installed-Chrome E2E 209 passed, 52 intentionally skipped, 0 failed; build/typecheck/lint/evidence/performance-budget/audit/static-client public-source-hash scan/diff check passed. Record SHA-256 `869d8f20764574e0afe914295898a77d5545679bcaad2fb35c1d367904753669`; superseded by the v14 final-repository corpus |
| Historical 2026-08-29 Round-2 server-only assistant candidate corpus | Git object `d98941e49abeb6c5bc78659c6a06dc2661515a17:src/data/assistant-knowledge.generated.json`; [`legacy-risk-control-public-boundary.md`](legacy-risk-control-public-boundary.md) | The immutable R2 snapshot covered 8 repositories, 206 reviewed source selections, and 1,410 bounded chunks; snapshot SHA-256 `de5ef8b12c853264e170a40a9c35aee3edea395bce59addc039ebfd89fdbb139`. Its portfolio-site layer contributed 148 selections / 961 chunks at local commit `e8821702bfe69ee5846a617aa178486f216b5346`. This row is retained for provenance and is superseded for HEAD-currentness by the generated ledger below. |
| HEAD-generated Round-3 assistant source ledger | [`manifest.json`](../assistant-knowledge/manifest.json), [`assistant-knowledge.generated.json`](../src/data/assistant-knowledge.generated.json), [`evidence-index-currentness.test.mjs`](../tests/assistant/evidence-index-currentness.test.mjs) | Commit-local ledger: 8 repositories, 198 reviewed source selections, and 1,443 bounded chunks; snapshot SHA-256 `d00e99264013f70b6754279673ca7b80068b60824fa4756ea9d0816fc7d9d144`; generated ledger file SHA-256 `4de538be511f2570904cb75493650c4fe4fb120836ca1e104df27e8fa01d21fa`. The portfolio-site selection contributes 146 selections / 947 chunks at commit `346b8a81cbf9a238081ef179eb622ea8f0614466`. Counts and hashes describe the committed source ledger, not anonymous availability; citation reachability remains a separate publication gate. Risk Control and `ex-solver` remain private and excluded. |
| Historical 2026-08-29 Round-2 Ask Portfolio retrieval preset bank | Git objects `d98941e49abeb6c5bc78659c6a06dc2661515a17:assistant-knowledge/question-bank.json` and `d98941e49abeb6c5bc78659c6a06dc2661515a17:src/data/generated/ask-question-bank.json` | 11 routes × 3 bilingual questions produced 33 presets / 66 localized prompts. Both historical artifacts had SHA-256 `dfcf55df60a0b2f3bd16d1e8104ec97450e2e21013989e858d22fe790dae30c9`; this retrieval-era row is superseded for HEAD-currentness by the authored preset artifacts below. |
| HEAD-generated Round-3 authored Ask Portfolio presets | [`question-bank.json`](../assistant-knowledge/question-bank.json), [`ask-question-bank.json`](../src/data/generated/ask-question-bank.json), [`ask-preset-answers.json`](../src/data/generated/ask-preset-answers.json), [`ask-question-bank.test.mjs`](../tests/assistant/ask-question-bank.test.mjs) | 11 routes × 3 bilingual questions produce 33 presets / 66 localized authored answers. Generated question projection SHA-256 `0be0821d6fd0d6c4624576f67744947b7e0a1e0786eab317ca8948f9f8f3287f`; generated answer artifact SHA-256 `f3b7769191889c8f71c43ce2f266f2b0b44df6dd5a57d2e909bb755eacbfb938`. Numeric grounding and citation destinations are machine-checked; the committed artifacts do not establish live-model or anonymous-public availability. |
| Current v12 four-route Lighthouse passed the Goal2 category gates | [`lighthouse-summary-v12-local.json`](phase2-public-review-artifacts/goal2-final/lighthouse-summary-v12-local.json) | Exact 225-file runtime tree `a49d5abb…`; home, Margin, Privacy, and Release each scored Performance / Accessibility / Best Practices / SEO `100 / 100 / 100 / 100`. Summary SHA-256 `7a4b65a40acbad35360a1061c8968c65bc440a96c290c70c27f7a06d45f6a114`; local production runtime only, not deployed-Preview evidence |
| 447 copy targets fully accounted; 446 eligible outputs passed; one target was source-superseded; the later nine-string Chinese factual repair passed 9/9 key, old-value, new-value, English-source, and response-SHA checks | [`copy-writeback-audit.json`](phase2-public-review-artifacts/goal2-final/copy-writeback-audit.json), [`copy-writeback-post-runtime-alignment.json`](phase2-public-review-artifacts/goal2-final/copy-writeback-post-runtime-alignment.json) | The first record remains the immutable writeback-time audit. The second records the separately authorized one-call/no-retry Kimi repair and exact current source bindings without relabeling the original audit scope. |
| Historical d8bc installed-Chrome regression passed 203 tests with 52 intentional viewport skips, 0 failures, and 0 flaky tests | [`playwright-summary.json`](phase2-public-review-artifacts/goal2-final/playwright-summary.json) | Summary SHA-256 `796bbbfa2d0b1a4bd8382da805a47851e06388611346c3f741deb4e76d820d35`; bound to historical local runtime digest `d8bc8492…` and superseded by the v12 assistant runtime change |
| Historical d8bc installed-Chrome bilingual review passed all eight explicit routes, constrained layouts, interactive proof flows, and then-current assistant guardrails | [`manual-audit.json`](phase2-public-review-artifacts/goal2-final/chrome/manual-audit.json), [`screenshot-manifest.json`](phase2-public-review-artifacts/goal2-final/chrome/screenshot-manifest.json), [`binary-manifest.json`](phase2-public-review-artifacts/goal2-final/binary-manifest.json) | Audit SHA-256 `0ab4f1f8d821ba328e5ec7a889fc19b35cc9b320509f9c7db4564218a7b0f9df`; screenshot manifest `3495920f…`; binary manifest `d94e1b17…`; immutable historical evidence only |
| Historical d8bc four-route Lighthouse run scored Performance 98 / 97 / 91 / 92 for home / Margin / Privacy / Release, with Accessibility, Best Practices, and SEO 100 throughout | [`lighthouse-summary.json`](phase2-public-review-artifacts/goal2-final/lighthouse-summary.json) | Summary SHA-256 `5afdbd888c145c6532418f85dc5b11ccd7b8723e8e20183ffedf3a7f4fb62949`; bound to historical d8bc, not the current v12 runtime and not a deployed-Preview result |
| Historical consent-bound local assistant acceptance passed one English v5 and one Chinese v6 in-scope question with the requested Kimi model and Upstash | [`assistant-live-acceptance.json`](phase2-public-review-artifacts/goal2-final/assistant-live-acceptance.json) | Historical local server evidence only; it does not establish live acceptance for v12 |
| Historical assistant v9 passed 32/32 local tests and replayed both saved live replies against its regenerated grounding | [`assistant-policy-v9-local-replay.json`](phase2-public-review-artifacts/goal2-final/assistant-policy-v9-local-replay.json) | Superseded offline replay only, with zero network/model calls; it does not establish v12 behavior or acceptance |
| Historical assistant v9 live packet was exactly authorized but gated before process creation | [`assistant-v9-live-gate.json`](phase2-public-review-artifacts/goal2-final/assistant-v9-live-gate.json) | `GATED`: zero model requests attempted, no payload reached OpenRouter or its downstream provider, and this is not a provider failure or a live-v9/v12 pass |

The v14 final-repository corpus is the current local candidate. Overall status remains
`PARTIAL_EXTERNAL_GATE` until the current live-model, Git, PR, Preview, deployment, and Production
acceptance gates complete. The v12 p1 bridge, d8bc browser, visual, and Lighthouse records and all
v5/v6/v9 assistant records are immutable historical evidence superseded for current-runtime claims. At the
pre-publication snapshot
recorded on 2026-07-18 08:03 Asia/Shanghai, the public review branch still pointed to `234da138`,
not this candidate. Anonymous availability is time-dependent and cannot be proven by this immutable
file: verify the current remote branch and exact commit, then follow
[`PUBLICATION_CHECKLIST.md`](PUBLICATION_CHECKLIST.md) and
[`github-publication-manifest.md`](github-publication-manifest.md) before describing any source or
artifact as anonymously public.
