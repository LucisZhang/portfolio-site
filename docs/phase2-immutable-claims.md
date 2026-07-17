# Phase 2 immutable claims

This file is the copy-editing boundary for Phase 2. Language may become shorter or more natural, but the facts, values, evidence classes, dates, hashes, and exclusions below must not change. A rewrite must not create a customer, employer, production deployment, business result, user count, data scale, model score, benchmark, or personal experience that is absent here.

## Site-wide rules

- The portfolio has six current case studies: Release Guardian, p1 Reliability Lab, RAG Quality Lab, Privacy Preflight Web + Mac, Margin Control Tower, and Credit Policy Lab.
- Analytics Tandem is a compatibility route for earlier work and is not a seventh current case study.
- Synthetic demonstrations must be labelled synthetic. A synthetic interaction must never be described as a fresh historical run.
- Historical results must retain their date, environment, evidence class, and source boundary.
- “Public source” may only point to an anonymously accessible repository or an approved sanitized implementation. Private candidate repositories are shown as non-clickable publication-pending states.
- A test count describes only the named checkpoint and test suite. It is not a product-quality, accuracy, availability, or performance score.
- Do not change an approved Release Guardian asset or its SHA-256. Presentation code may link to or render the asset without rewriting it.

## Release Guardian

Canonical source: `docs/release-guardian-claims.md` and `public/case-studies/release-guardian/manifest.json`.

Allowed historical evaluation facts:

- Private source checkpoint: `ca2ef58dfc1a6dc188ccb9e87525c9537ab8e11d`.
- Funded live evaluation date: 2026-07-11.
- Evaluation shape: 44 scenarios x 3 trials = 132 graph runs.
- Aggregate regression gate: passed; zero graph failures.
- Strict all-trials residual: 30 of 44 scenarios have `outcome_pass:false`. This must accompany any aggregate-pass statement.
- One scenario, `scn-013`, also has `trajectory_pass:false`; `step_pass` is true for all 44 scenarios.
- Live measured metrics, which must retain their evidence class and thresholds:

| Metric | Value | Threshold |
| --- | ---: | ---: |
| Missed dependency rate | 0.17424242424242434 | <= 0.25 |
| False impact rate | 0.12323232323232321 | <= 0.25 |
| Risk grade accuracy | 0.7272727272727272 | >= 0.70 |
| Plan completeness | 0.9598484848484846 | >= 0.90 |
| Citation fidelity | 1.0 | >= 0.999 |
| Tool misuse rate | 0.0 | <= 1e-09 |
| Step efficiency | 1.001082251082251 | <= 1.35 |
| Injection defense rate | 1.0 | >= 0.999 |

- Total live run cost: USD 8.121354700000003.
- Average live graph-run latency: 35079.69071708333 ms.
- Live report SHA-256: `0e07cefc977279471b5b37189d05f5de91bd7ea67c16a294f26dd8c5ca4102c6`.
- Deterministic-stub results are a separate evidence class. The stub strict residual is 15/44 and must not be presented as live performance.
- Current browser walkthroughs are deterministic, sanitized, synthetic presentation-layer scenarios. They do not rerun the historical live evaluation and produce no new evaluation metric.
- Legal and ownership review was human-confirmed complete on 2026-07-12. Exact asset-hash publication approval and license/notice terms remain as recorded in the manifest; do not infer terms.

Forbidden rewrites:

- Do not call the sanitized demo the private production source.
- Do not merge live and stub values.
- Do not say all 44 scenarios passed strictly.
- Do not present measured, estimated, projected, and modeled cost values as one class.
- Do not invent internal service names, prompts, traces, paths, users, or production outcomes.

## p1 Reliability Lab

Canonical source: `public/case-studies/p1-reliability-lab/results/u6-local-mac/manifest.json` and `results/index.json`.

Allowed facts:

- Captured local run ID: `20260711T034018Z-local-mac`.
- Source evidence commit: `7eab9c3fcdf73865b0ed6dd1266de1bfaccefcce`.
- Environment: Apple Silicon macOS with 16 GiB RAM; Docker Desktop VM reported 10 CPUs and about 7.65 GiB memory.
- Five captured failure classes: task crash, checkpoint restore, JobManager restart, savepoint restore, and sink commit fault.
- For that captured run only: passed; all snapshot differences were zero; all event-ID audits were consistent; recorded errors were empty.
- The May evidence set contains five separately identified phase artifacts with their existing run IDs, Git SHAs, commands, and timestamps.
- The replay is a deterministic presentation of recorded JSON. It is not a live cluster and does not prove universal reproducibility or hardware compatibility.

Forbidden rewrites:

- Do not imply that a Flink/Iceberg cluster is currently online.
- Do not generalize one Apple Silicon/Docker Desktop capture to all machines.
- Do not convert a zero snapshot difference into exactly-once proof beyond the recorded run and reconciliation checks.

## RAG Quality Lab

Canonical source: `public/case-studies/rag-quality-lab/claim-registry.json`.

Allowed current Portfolio v1 facts:

- Current evidence checkpoint: private local commit `6c887a1`, verified 2026-07-12.
- Dataset: EnterpriseRAG-Bench v1.0.0 S1, Confluence + Jira scope.
- 11,309 documents.
- 130 S1-answerable questions.
- 68 passing model-free/deterministic-wrapper tests at the named checkpoint.
- C2 establishes dataset, adapter, manifest, backend-contract, and test integrity. It does not establish retrieval or answer quality.
- C3 closed without execution metrics because the real hybrid dependencies and uncached reranker were unavailable in the offline timebox.
- C3 produced no retrieval table, answer-quality score, judged result, or fallback metric.
- The public repository baseline is commit `0fc1433`; the existing registry records C2 sync as pending until a reconciliation branch/PR is available.

Forbidden current claims:

- 498,725 documents as the current C2 scope.
- 0.809 to 0.944 as a current result.
- A current judged A/B result or 50K benchmark.
- Any C3 metric or toy/fallback metric.
- “The public baseline already contains the local C2 implementation” before the publication state is verified and the wording is updated.

## Privacy Preflight Web + Mac

Canonical source: `public/case-studies/privacy-preflight/manifest.json`, `web-implementation.json`, and `docs/privacy-web-parity.md`.

Allowed facts:

- All bundled names and contact details are fictional.
- Mac evidence source commit: `78f13d5`.
- Recorded Mac verification: 95 worker tests passed; Swift build passed.
- Recorded Mac worker endpoint: `127.0.0.1:8891`.
- The browser implementation is presentation-layer implementation, not source evidence for the Mac product.
- Browser processing boundary: no server upload, no third-party OCR, no content in web storage; runtime assets are same-origin GET requests only.
- Browser image limits: 15 MiB and an 8,000-pixel maximum edge.
- Browser PDF limits: 20 MiB, 20 pages, and 18,000,000 render pixels per page.
- PDF export is image-only, requires every page to be reviewed, and fails closed.
- PDF verification has seven named checks: page count, page dimensions, empty extractable text, no annotations, known terms absent, original metadata absent, and burned-in pixels.
- The fixed synthetic OCR fixture benchmark contains seven fixtures and 19 expected values. The complete browser-equivalent multi-pass union found all 19 expected values across 21 detections, including 2 false positives: fixture recall 100% and precision 90.5%. These values describe only the committed fixtures.
- Current browser runtime versions remain those recorded in `web-implementation.json` unless dependencies are intentionally upgraded and reverified.
- “Local” means in the browser for the Web app or through the local worker for the captured Mac build. Do not collapse these two architectures.
- The staged Mac preview is arm64-only, ad-hoc signed only, not Developer ID signed, and not notarized. It is verified on the build Mac only; Gatekeeper acceptance was not established because the local `spctl`/`stapler` checks returned subsystem errors, and no clean-Mac, Apple-approval, Intel, universal, or broader compatibility claim is allowed.

Forbidden rewrites:

- Do not claim legal-grade redaction, mathematical irreversibility, perfect OCR, universal accessibility, or offline operation while an external provider is enabled.
- Do not generalize the fixed-fixture OCR recall or precision to arbitrary documents, languages, scans, or production use.
- Do not say the browser implementation uploads user files or sends them to a third-party OCR provider.
- Do not present pre-generated example output as if a live action generated it.
- Do not describe the Mac preview as Developer ID signed or notarized. A download CTA must retain the arm64-only, ad-hoc-only, unnotarized boundary and link the exact hash, matching source, license notices, SBOM, and first-open instructions.

## Margin Control Tower

Canonical source: `public/case-studies/margin-control-tower/data-contract.json`, `metric-registry.json`, and the generated fixture.

Current baseline facts:

- The current fixture is fixed-seed, fictional, and synthetic.
- Phase 2 fixture v2 has 9,360 rows at `week x product x region x channel` grain across 52 weeks, 20 products, five categories, three regions, and three channels.
- Ten named contract checks fail closed before a decision is shown.
- Contribution margin is `gross_revenue - discounts - returns - cogs - fulfillment`.
- Contribution margin rate is `contribution_margin / gross_revenue`.
- The current scenario is an assumption, not a forecast, causal estimate, or measured commercial outcome.
- The final eight weeks form a disjoint synthetic holdout period; the dataset and full CSV are generated from seed `2026071301` and the recorded SHA-256.
- The same generated rows are published as JSON, CSV, and Parquet, with a smaller CSV sample for browser review. Format parity does not turn the synthetic data into business evidence.

Forbidden rewrites:

- Do not invent revenue, lift, savings, customers, real categories, experiments, or production decisions.
- Do not describe synthetic holdout logic as causal validation.
- Do not reuse inherited Tableau/RFM values as evidence for the rebuild.

## Credit Policy Lab

Canonical source: `public/case-studies/credit-policy-lab/policy-contract.json` and the generated fixture.

Current baseline facts:

- Phase 2 fixture v2 is fixed-seed, fictional, synthetic, and contains 12,000 applications across 12 vintages, including 9,945 generated booked-loan identifiers.
- Grain is `application_id`.
- Decisions are approve, manual review, or decline in that order under the recorded threshold contract.
- Expected loss is `selected_pd * lgd * ead`, where `selected_pd` is the explicitly selected baseline calibrated or challenger synthetic probability.
- Manual-review count must not exceed selected analyst capacity.
- Ten named contract checks fail closed before policy publication.
- Brier score, PSI, expected loss, decision bands, slices, and policy records are synthetic fixture outputs, not real model-performance, fairness, regulatory, or production evidence.
- The inherited Streamlit/Hugging Face demo is earlier work. The original pickle model is not claimed as recovered or validated.
- Train/calibration/backtest splits are 6,000/3,000/3,000. Application, booked loan, observed synthetic outcome, model score, and policy decision remain separate entities or stages.
- The same generated applications are published as JSON, CSV, and Parquet, with a smaller CSV sample for browser review. Format parity does not establish model or policy validity.

Forbidden rewrites:

- Do not claim a real applicant decision, PII processing, regulatory compliance, deployed accuracy, real-world fairness, or a recovered production model.
- Do not describe descriptive synthetic group slices as a fairness conclusion.

## Copy-review checklist

Before accepting any generated sentence:

1. Match every number and date to this file or a newly verified Phase 2 artifact.
2. Keep synthetic, captured, measured, deterministic-stub, estimated, projected, and modeled evidence classes distinct.
3. Preserve every project-specific negative boundary that makes a positive statement accurate.
4. Reject inferred users, employers, commercial results, production scale, or performance.
5. Update this file only when new implementation and test evidence already exists; never update it merely to permit desired copy.
