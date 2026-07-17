# Release Guardian — claims-and-evidence matrix (W2 + W3 audit)

Status: ACTIVE - W2 evidence matrix and W3 consistency audit complete; legal/ownership gate
human-confirmed complete on 2026-07-12. This is the single quotable source for Phase 3. Every
value below was re-derived directly from the artifacts listed in §1 - nothing is quoted from
memory or from prior plans. Section 8 overrides any less-conservative wording elsewhere in
this document or in the private source docs.

**Usage rule (binding):** Phase 3 case-study text may state ONLY claims that appear in this
document, with their labels and caveats. The human confirmed on 2026-07-12 that the prior
company/repository-owner and legal gate is complete. Underlying artifacts may be used only if
they are within the privately recorded approval scope and pass the W4 allowlist, sanitization,
scan, and final artifact-sign-off workflow. No raw artifact has been copied or published yet.

## 1. Evidence artifacts (public paths + integrity anchors)

This public candidate intentionally omits the private source repository, source bundle,
materials archive, raw evaluation JSON, and private source documentation. No local storage or
coordination path is part of the public provenance contract. Public review must use the
sanitized derivatives below together with the boundaries recorded in the evidence manifest.

| Public artifact | Purpose / boundary | SHA-256 |
|---|---|---|
| `public/case-studies/release-guardian/manifest.json` | Authoritative public inventory, provenance labels, approval state, and per-asset boundaries | `f37967289db4816cfd5f23bdad7ca281b979f52420c4bf65b34b0383a6796eb8` |
| `public/case-studies/release-guardian/data/evaluation-live.csv` | Sanitized funded-live aggregate metrics; must be paired with the 30/44 strict residual | `29eca7eddbc8885c0eb96705af46883c5986f61dda46f6a34c261e86aa49a892` |
| `public/case-studies/release-guardian/data/evaluation-stub.csv` | Deterministic-stub metrics; not live performance; must be paired with the 15/44 strict residual | `a312feb6599f7e63732ad36387c3bb390bc73f18a67695e9437182dcd01b1bfe` |
| `public/case-studies/release-guardian/data/cost-evidence.csv` | Sanitized measured, estimated, projected, and modeled cost evidence with labels retained | `3eb3ac2908f8e7b9aec9b725e8f757dcca1fb89010022ba6643f83ac3532201c` |
| `public/case-studies/release-guardian/data/findings.csv` | Sanitized consistency findings derived from this claims matrix | `8f479171837a543ff8e8439ac983d37fc4b3bb1ccb3792486e037a828d7f9b95` |
| `public/case-studies/release-guardian/replay/synthetic-scenarios.json` | Fictional deterministic replay inputs only | `9e28c710e63191ac37f9b015e52f3a41a5f848d7286dd93ed94fcb4d7d506541` |
| `public/case-studies/release-guardian/architecture.mmd` | Public diagram source written from the approved claim boundary | `ca53cb3aab82d1d02ad14a11f6e394a710be81a0ff3f5c48feefac093d70ddba` |
| `public/case-studies/release-guardian/screenshots/risk-guardrail.png` | Sanitized deterministic risk-factor crop; candidate for exact-asset review | `0df0b05fdd99188946c594462f9beb84dc8efd69dee5de147f408707acc582a9` |
| `public/case-studies/release-guardian/screenshots/pipeline-trace-stub.png` | Sanitized stub design trace; not a live latency benchmark | `22de4890f08b961dee8e7c234f843d702a7833a6f825a199d9cc708db645acff` |
| `public/case-studies/release-guardian/screenshots/evaluation-stub.png` | Sanitized deterministic-stub evaluation crop; not live performance | `f534a133d5bc2a0cf6b0aed3425446127537b1a72e6ce14c8c3978486719eff9` |

Private raw-source integrity anchors are retained only to make derivation auditable; the files
themselves are not distributed in this repository:

| Private source artifact | Boundary | SHA-256 |
|---|---|---|
| `post-l-live-funded.json` | Authoritative funded-live source for §2 | `0e07cefc977279471b5b37189d05f5de91bd7ea67c16a294f26dd8c5ca4102c6` |
| `post-l-stub.json` | Deterministic post-L source for §3 | `b1cf95f202dc12ab3ff709e3f978159936902fd7a9a09b278f9852f7c0d346fb` |
| `pre-l-stub.json` | Deterministic pre-L comparison source for §3 | `ef157b1be85a5f185543b0067001611cf4c47491f63161ed50f00a17e14d8e9f` |
| `pre-l-live.json` | Known-failure operational baseline for §4; not a clean causal baseline | `dc5fa6dc3fe43f239c55a6c892058da6369d604087eb33b217f05abb16c0a6a7` |
| `cost_report.json` | 2026-07-08 pre-migration snapshot; source for §5 | `5008a039aace2bea0731dd68e7cd4c33f94b043c9e476640601ab3ea00caaafc` |

The private source commit anchor is
`ca2ef58dfc1a6dc188ccb9e87525c9537ab8e11d`; its pre-migration ancestor is `9c338c5`.

**Provenance note (important):** the four Phase-L eval reports (run 2026-07-11) are NOT
tracked files in the repo at `ca2ef58` — the repo's tracked `eval/results/` holds only the
2026-07-08 stub-era reports (`latest.json` == `eval-20260708-140546.json`, hash-identical).
The Phase-L raw JSON exists only in the retained private source archive; commit `ca2ef58`
("docs: record funded Phase L evaluation") records the same values as text in EVAL.md and
MIGRATION_PROGRESS.md. Cite the archive as the raw-data source for all Phase-L numbers.

## 2. Authoritative final evaluation (funded post-L live rerun)

Label for all rows: **measured, live mode, 2026-07-11, OpenRouter-routed models.**
Source: `post-l-live-funded.json`. JSON paths given per row. 44 scenarios × 3 trials
(`$.trials`) = 132 graph runs (`$.totals.graph_runs`), `$.regression_pass = true`,
zero graph failures. σ = population standard deviation across trials (`$.metrics.<m>.stddev`).

| Metric (`$.metrics.<name>`) | Value | σ | Threshold (direction) | Pass |
|---|---:|---:|---|---|
| missed_dependency_rate | 0.17424242424242434 | 0.012274130110620953 | ≤ 0.25 (min) | true |
| false_impact_rate | 0.12323232323232321 | 0.007307977842670581 | ≤ 0.25 (min) | true |
| risk_grade_accuracy | 0.7272727272727272 | 0.01855674047563012 | ≥ 0.70 (max) | true |
| plan_completeness | 0.9598484848484846 | 0.007086472323435558 | ≥ 0.90 (max) | true |
| citation_fidelity | 1.0 | 0.0 | ≥ 0.999 (max) | true |
| tool_misuse_rate | 0.0 | 0.0 | ≤ 1e-09 (min) | true |
| step_efficiency | 1.001082251082251 | 0.0015305341584123495 | ≤ 1.35 (min) | true |
| injection_defense_rate | 1.0 | 0.0 | ≥ 0.999 (max) | true |

- Total run cost: `$8.121354700000003` (`$.totals.total_cost_usd`). Average graph-run
  latency: `35079.69071708333 ms` (`$.totals.avg_latency_ms`).
- **Strict all-trials residual view (MUST accompany any aggregate-gate claim):** 30/44
  scenarios have `outcome_pass: false` in `$.per_scenario[*]` (re-derived 2026-07-12; the
  same 30 constitute all any-criterion failures). One scenario (`scn-013`) additionally has
  `trajectory_pass: false`; `step_pass` is true for all 44. Residual classes (EVAL.md §6):
  cross-service/event recall, resource naming granularity, conservative risk-band
  mismatches (band moved UP, never down), plan wording variance, explicit-unverifiable
  pruning/renaming.
- **Rationale judge (diagnostic, NEVER a gate):** `$.rationale_judge` — `non_gating: true`,
  mean `0.6594736842105262`, 114/132 available, judge cost `$2.0187350000000004`; all 18
  unavailable results have error `"LLM response failed validation after retry"`
  (structured-response validation failures; zero HTTP 402, zero missing reports).

## 3. Deterministic stub evidence (before/after Phase L)

Label: **deterministic stub mode, no API keys, no GPU.** Sources: `pre-l-stub.json`
(run_at 2026-07-11T06:58Z) and `post-l-stub.json` (run_at 2026-07-11T07:59Z). All eight
`$.metrics.*.value` entries are IDENTICAL between the two reports (diff-verified on parsed
values 2026-07-12), proving Phase L did not change deterministic behavior:
missed_dependency_rate 0.08143939393939403, false_impact_rate 0.06893939393939386,
risk_grade_accuracy 0.7727272727272728, plan_completeness 0.9954545454545455,
citation_fidelity 1.0, tool_misuse_rate 0.0, step_efficiency 1.0,
injection_defense_rate 1.0 — all gates pass, all σ = 0.0 (expected: fully deterministic;
nonzero σ in stub is itself a regression signal, EVAL.md §4).

- Strict stub view: 15/44 scenarios flagged (re-derived from `post-l-stub.json`
  `$.per_scenario`; matches EVAL.md §6).
- These stub values also match the repo's tracked 2026-07-08 `latest.json` — the stub
  surface has been stable since 2026-07-08. When quoting stub numbers, ALWAYS label the
  mode; never present them as live results (see §7).
- CAUTION: stub reports carry nonzero `$.totals.total_cost_usd` (≈2.99) and small
  latencies (~258–271 ms avg). These are stub-proxy accounting values, NOT real API spend —
  do not quote stub cost/latency as money spent or live latency.

## 4. Pre-L live baseline (operational delta only — NOT a clean causal baseline)

Label: **measured, live mode, 2026-07-11, known defects disclosed.** Source: `pre-l-live.json`.
`$.regression_pass = false`; failing gates: risk_grade_accuracy 0.6969696969696969 (< 0.70)
and citation_fidelity 0.9848484848484849 (< 0.999). Contains the `scn-031` failures — the
report's scn-031 notes record `run error: 'NoneType' object has no attribute 'strip'` plus
missing report/nodes: OpenRouter returned null `choices[0].message.content`, subsequently
fixed by routing null content through the structured validation retry (MIGRATION_PROGRESS
Phase L residual diagnosis). Usable claims: the raw Phase-L deltas as in EVAL.md §4 table
(e.g. false_impact 0.169949 → 0.123232, risk accuracy 0.696970 → 0.727273, citation fidelity
0.984848 → 1.000000), ALWAYS framed as "raw operational comparison, not an isolated causal
estimate" because of the fixed scn-031 defect. Pre-L live totals: cost `$6.066130950000002`,
avg latency `26597.79 ms`.

Audit history: the first post-L live attempt exhausted OpenRouter credits (three graph
failures, citation fidelity 0.977, 42 judge HTTP 402s; EVAL.md §4). It is superseded by the
funded rerun, was deliberately excluded from the handoff archive, and is NOT tracked in the
repo at ca2ef58 — never present it as a final result or a cost/latency improvement.

## 5. Cost/latency engineering evidence (cost_report.json — dated 2026-07-08, PRE-migration)

The report predates the OpenRouter migration (phases C/O, 2026-07-11): its prices and models
are the xAI-era stack's, a point-in-time snapshot. Preserve the per-section labels verbatim
(PORTFOLIO_GUIDE "Interpreting the cost report"):

| Claim | Label | Source (JSON path) | Value |
|---|---|---|---|
| Routed vs all-strong: same tokens, marginally cheaper | **measured** | `$.sections.routed_vs_strong` | routed $0.3140303 vs all_strong $0.31482300 over 12 runs / 37 LLM calls each; `savings.cost_pct = 0.2517922769302051` (i.e. ~0.25% — NOT 25%), `savings.tokens_pct = 0.0` |
| ~3 LLM calls per graph run | **measured** | `$.sections.routed_vs_strong.configurations.*.llm_calls` / `runs` | 37 calls / 12 runs ≈ 3.08 (supports README "~3 LLM calls per run") |
| Local rerank latency | **measured** | `$.sections.rerank_bench.modes` | embed median 262 ms, lexical ~0 ms, api_judge median 6305 ms at est $0.226/1000 reranks; local LLM-judge rerank timed out at 25 s (fell back to lexical; direct call 38.6 s) |
| Evidence-prompt pruning −49.5% | **estimated** (token counts are estimates) | `$.sections.context_pruning` | scn-001: 4551 → 2296 chars (est 1137 → 574 tokens), `reduction_pct = 49.51627088830255` |
| Prompt-cache savings | **projected** (assumption-dependent) | `$.sections.prompt_cache` | assumes cached input bills at 10%; cacheable share 6.09%, projected savings $0.000674898… on scn-001 — quote only with the assumption |
| ReAct comparison ~4× | **modeled, not measured** | `$.sections.react_modeled` | actual 37 calls/$0.3140 vs modeled 149 decision calls/$1.37475; ratios: calls 4.027×, cost 4.378×; report's own note: "MODELED from real per-run trajectory lengths; not measured." |

## 6. System, delivery, and design claims (docs @ ca2ef58)

| Claim | Source |
|---|---|
| Production-shaped change-impact & risk-gatekeeper agent: intake → classify → parse → 4 parallel evidence retrievers → aggregate → grade → plan → validate → approval_gate (interrupt) → publish; pauses for human approval before publishing | README.md §Architecture; ARCHITECTURE.md |
| Stack: Python LangGraph+FastAPI agent (port 8000), Go stdlib change-gateway (8081), Java Spring Boot approval-audit with RBAC + hash-chained audit log + independent verify endpoint (8082), Next.js 3-view dashboard (3000), Postgres+pgvector (5433, user-space source build, Docker optional), optional Phoenix OTel (6006) | README.md port/stack table |
| Durable HITL: LangGraph `interrupt()` + Postgres checkpoints; kill the process at the gate, decide via the Java service later, graph resumes | README.md "What makes it defensible" |
| Untrusted-input posture: injected instructions detected/quarantined; risk floors are code the model cannot lower; publish unreachable except through the approved gate branch; 6/6 injection scenarios defended | README.md; EVAL.md §1,§3 |
| Offline-deterministic by default (`RG_LLM_MODE=stub`); live mode switches strong/cheap tiers without touching node code | README.md |
| Eval harness: code-first, in-process LangGraph execution, isolated MemorySaver per trial, 3 grading levels (outcome/trajectory/single-step), N=3 trials, CI regression gate `make eval-gate` (exit code = gate), `--baseline` drift check >5 points absolute | EVAL.md §2,§3,§7 |
| Golden set: 44 labeled ShopFabric scenarios (17 code_diff / 15 schema_migration / 12 config_change; 9 destructive; 6 injection; ≥8 low-risk-by-design; 3–4 insufficient-evidence), referential integrity enforced by `mockworld/validate.py` | EVAL.md §1 |
| Honest iteration history: first full harness run FAILED the gate 3/8 (missed-dep 0.44, false-impact 0.42, risk acc 0.57, plan 0.85, injection 0.33); fixed via generic policy/structure classes in commit `186687d`; scenario-id hardcoding forbidden and audited; injection 0.33 → 1.00 via risk rules alone | EVAL.md §5 |
| Migration delivery: phases V/E/S/R/C/O/L complete on the company workstation; per-phase commits; latest documented full-suite result is 99 tests before Phase L, followed by 19 focused Phase-L tests; bundle handoff with fast-forward ancestry | MIGRATION_PROGRESS.md (status table + validation log); git log ca2ef58 |
| Workstation live selection: OpenRouter strong `openai/gpt-5.6-terra` (2026-07-11 price $2.50/$15 per 1M in/out), cheap `qwen/qwen3.5-9b` ($0.10/$0.15); DeepSeek V4 Pro rejected on measurement (46 s / 2,699 tokens vs Terra valid structured JSON in 1.2 s). These were environment-selected on the workstation; the tracked Settings defaults at ca2ef58 still name legacy Grok models. | MIGRATION_PROGRESS Phase C3/O; DECISIONS.md; `agent/src/release_guardian/config/settings.py` |
| Local reranking: vLLM 0.24.0 serving pinned `tomaarsen/Qwen3-Reranker-0.6B-seq-cls` rev `6a5829f5…`, loopback-only; live `/v1/rerank` ranked the relevant doc at 0.9997994 vs 0.0000183 | MIGRATION_PROGRESS Phase R |
| Test counts: `make test` 83 → 94 (post C1/C2) → 99 with no skips before Phase L; Phase L then passed 19 focused tests plus Ruff and `git diff --check`. No post-L full-suite rerun is explicitly recorded. | MIGRATION_PROGRESS validation log |
| Delivery history: 27 commits from scaffold (2026-07-07) to funded-eval docs (ca2ef58, 2026-07-11) | `git log` in working copy |

Caveat for every row above: workstation-verified claims (test chronology, latency, GPU
serving) are from the company workstation environment; nothing has been re-run on this Mac
(W5 declined). Do not claim local reproduction. Host/GPU/path/internal-infra details in
MIGRATION_PROGRESS (and `specs-20260711-193833.txt` in the handoff root) are PRIVATE and
must be redacted per the W4 checklist before any approved external use.

## 7. DO-NOT-CLAIM list (binding)

1. Do NOT publish or link any artifact merely because the governance gate is cleared. First
   record its approved scope and license/notice terms, complete the W4 sanitized-export scans,
   obtain sign-off on the exact artifact hash, and receive explicit approval to publish it.
2. Do NOT claim all strict scenarios pass — aggregate gates pass while the strict all-trials
   view flags 30/44 (live funded) and 15/44 (stub). Always present both together.
3. Do NOT present the rationale judge as a release gate — it is a non-gating diagnostic.
4. Do NOT present the credit-exhausted post-L attempt as a final result or improvement.
5. Do NOT quote the 2026-07-08 stub numbers ("0.081 missed dep, 77.3% risk accuracy") as
   current live performance — label stub vs live explicitly everywhere (README's
   "Current: all 8 metrics pass (missed-dependency 8.1% …)" bullet needs a mode label if
   ever quoted; see W3 findings).
6. Do NOT drop the measured / estimated / projected / modeled labels on cost-report values,
   and always date them (prices are 2026-07-08 xAI-era snapshots; OpenRouter prices are
   2026-07-11 snapshots).
7. Do NOT claim "reproduces on this Mac" or any local re-run (W5 declined); do not claim the
   Phase-L raw reports are in the repo — they are archive-only (see §1 provenance note).
8. Do NOT expose git author identity, host names (e.g. the workstation host), GPU/CUDA/proxy
   details, absolute paths, or internal-infrastructure metadata in any public text.
9. Do NOT round `savings.cost_pct = 0.2518` into "25% cheaper" — the measured routed-vs-strong
   saving is ~0.25% at identical tokens; the honest cost story is routing + pruning + caching
   + local inference as engineering discipline, with the modeled ReAct comparison clearly
   labeled as modeled.
10. Do NOT call 99 tests a post-Phase-L or final full-suite result. The latest documented full
    suite is 99 before Phase L; Phase L records 19 focused tests, Ruff, and `git diff --check`.
11. Do NOT claim Terra/Qwen are repository code defaults at `ca2ef58`. They were the verified
    workstation live selection through ignored environment configuration; tracked Settings
    still default to legacy Grok model names.

## 8. W3 doc-consistency findings

Audit scope: README, ARCHITECTURE, EVAL, DECISIONS, INTERVIEW_DEFENSE, MIGRATION_PROGRESS,
tracked eval results, the four archive-only Phase-L reports, and current model/reranker
configuration at source commit `ca2ef58`. This was a read-only audit of the private source.
No source-doc or application-code edits were made. Any future fix requires a separately
approved local source branch.

| ID | Severity | Source surface | Finding | Required disposition before Phase 3 quotation |
|---|---|---|---|---|
| W3-01 | High | README architecture diagram; ARCHITECTURE component map/model table; DECISIONS D-4/D-27/final self-audit; INTERVIEW_DEFENSE §6 | These present Ollama embedding rescoring and local classification as the current reranker/model boundary. Final migration state instead defaults reranking to loopback vLLM 0.24 with the pinned Qwen3 reranker. Ollama remains an embedding path and optional legacy judge path; classifier fallback is on the cheap LLM tier, not the reranker. | Treat the Ollama-only text as superseded history. Proposed source fix: split current Ollama embedding/optional-judge roles from the vLLM reranker, and describe classifier fallback as cheap-tier OpenRouter. |
| W3-02 | High | README "Current" eval bullet | The displayed 8.1%/6.9%/77.3% values are deterministic stub metrics, not current live metrics. The authoritative funded live run is §2 above and its 30/44 strict residual must accompany the aggregate pass. | Never quote the README bullet as live. Proposed source fix: label the old values as deterministic stub and add the funded-live aggregate plus strict-residual disclosure. |
| W3-03 | High | DECISIONS D-32; INTERVIEW_DEFENSE §8 | Both state 132/132 completion and eight passing aggregate gates without the mandatory 30/44 strict all-trials residual. | Phase 3 must pair aggregate success with 30/44 live and 15/44 stub strict residuals. Proposed source fix: add the live residual beside each aggregate-pass statement. |
| W3-04 | High | EVAL Phase-L section versus tracked `eval/results/` | EVAL correctly records the funded values but does not say that the raw Phase-L reports are archive-only. All tracked timestamped reports and `latest.json` are 2026-07-08 stub-era files. | Cite the handoff archive as raw provenance. Do not imply `post-l-live-funded.json` exists in the repo. Proposed source fix: add an explicit archive-only provenance sentence. |
| W3-05 | High | DECISIONS D-31; README/INTERVIEW cost language | The 2026-07-08 cost report mixes measured routed-vs-strong and rerank observations, estimated pruning, projected cache savings, and a modeled ReAct baseline. It predates the OpenRouter/vLLM migration. Stub dollar values are proxy accounting, not spend. | Preserve every evidence label and date. Do not use the old rerank benchmark as current vLLM evidence or describe the modeled ReAct side as measured. |
| W3-06 | High | DECISIONS D-24/MIGRATION provider claims versus tracked Settings | The workstation used Terra/Qwen via ignored environment configuration, but tracked Settings still default to `grok-4`/`grok-3-mini`. A fresh live run without overrides would not use the documented selection. | Do not claim code-default alignment. Proposed source fix: separately approve either changing defaults with tests or documenting mandatory model overrides. |
| W3-07 | Medium | ARCHITECTURE service table and DECISIONS D-5 | Postgres+pgvector is described as Docker-only/default, while the migrated default is the user-space PostgreSQL lifecycle and Docker is optional. | Treat D-5 as superseded history. Proposed source fix: show user-space PostgreSQL 16 + pgvector as default and Docker Compose as optional. |
| W3-08 | Medium | ARCHITECTURE model-call paragraph versus README/trace evidence | ARCHITECTURE says approximately 5-7 calls; the dated trace evidence observed 37 calls over 12 runs (3.08/run) because deterministic paths bypass model-capable stages. | Describe model-capable stages separately from observed calls; keep the ReAct comparator labeled modeled. |
| W3-09 | Medium | ARCHITECTURE environment variables | `LLM_MODE=stub/live` is stale; current Settings use `RG_LLM_MODE`. | Proposed source fix: use `RG_LLM_MODE` consistently. |
| W3-10 | Medium | EVAL threshold rationale and runtime sentence | The 8.1% threshold headroom is a stub result, and "132 runs in ~4 minutes" is only credible as the stub-mode workstation run; neither sentence labels that context locally. | Add explicit deterministic-stub and workstation labels; do not transfer the runtime to live mode or this Mac. |
| W3-11 | Medium | Claims/test history | The migration ledger records full-suite 99 before Phase L and only 19 focused tests after Phase L. "Final 99-test suite" overstates the recorded chronology. | Use the corrected §6 wording and DO-NOT-CLAIM #10 until a post-L full-suite artifact exists. |
| W3-12 | Medium | INTERVIEW_DEFENSE anti-ReAct and bigger-model answers | `$0.0299` is stub proxy accounting, while the 40k+ ReAct comparison is modeled. The separate "5-10x" strong-everywhere claim has no matching evaluation. | Label proxy/modeled values; remove or label 5-10x as an unvalidated estimate. |
| W3-13 | Low | MIGRATION_PROGRESS intermediate "pending" entries and import action | The ledger is chronological and valid as audit history, but a pending hardened retry was later resolved and bundle import has since been completed into the no-remote W1 copy. | Keep as private audit history; do not present those lines as current blockers in a case study. |

### W3 outcome

- The metric values in §§2-5 reconcile with their cited raw reports.
- The current source docs are not quotation-safe without the dispositions above; Phase 3 must
  use this matrix, not copy prose directly from the private source.
- No source-doc fix branch was created because W3 authorizes proposals only; no separate
  approval to edit the private source was requested or granted.
