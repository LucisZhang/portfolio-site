# Credit Policy Desk digits — number → file → jsonPath → SHA-256

G2 register for the Round-2 Credit Policy Desk "chart-led Evidence" page
(task L4 [CLAUDE], `/analytics/credit-policy-desk`, spec §6.7 "Margin /
Credit(归档): 4 exhibits, Evidence 形态"). Every number rendered by
`src/components/credit/*.tsx` traces to one of the files below.
`src/components/credit/creditData.ts` statically imports and
build-time-validates `backtest-report.json`, `policy-frontier-report.json`,
and `policy-contract.json` — an invalid or hash-mismatched report fails the
build, not a client render.

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `public/case-studies/credit-policy-desk/backtest-report.json` | 969 | `615db22426cb120e40b2eaf8cd4f7ffef61eac59ae46e408ed39e316f0ffffb2` |
| `public/case-studies/credit-policy-desk/methods-evidence.json` | 7,711 | `aed9bf83bfd71a914fd0da70a3425180ac468e437d0e50ff6a778aa9e7c54f0b` |
| `public/case-studies/credit-policy-desk/credit-backtest-compact.json` | 627,957 | `77637de537299d3e19dbfb8fecc8ac644aaa13f253a46f71f63418ca6843d3b6` |
| `public/case-studies/credit-policy-desk/policy-frontier-report.json` | 6,417 | `bba03c36b0b2923bc9c6250593eeb695a7e25eaae2c2c093005eb779b4c230cb` |
| `public/case-studies/credit-policy-desk/scored-backtest.parquet` | 4,931,892 | `2bbc97350d28123a1b056e4d475cdc90000954df1e6226d54d4fa35f2e7e0b95` |

`backtest-report.json`, `methods-evidence.json`, and `scored-backtest.parquet`
predate this task (produced by `pipelines/credit-backtest/build.py` — see
that pipeline's own README/PROVENANCE.md). `credit-backtest-compact.json`
predates this task too (`scripts/generate-credit-backtest-preview.mjs`).
**`policy-frontier-report.json` is new** (`scripts/generate-credit-policy-
frontier.mjs`, added by this task): it derives the exhibit 01 figure from
the 624 backtest-split rows already inside the compact preview above,
without re-touching the Parquet or re-running any model — see that
script's header comment for why a derived, build-time-importable report
(rather than shipping the full 627 KB compact preview to the client) was
the right call, matching the `detection-report.json`/`elasticity-report.json`
precedent from Margin Control Tower's own rebuild (task L2).

## 01 — Policy frontier (`CreditPolicyFrontier.tsx`)

| Rendered value | Source | jsonPath |
| --- | --- | --- |
| Stat band: train/calibration/backtest split | `backtest-report.json` | `.splits.train`, `.calibration`, `.backtest` |
| Stat band: Brier · baseline isotonic (`.1593`) | `backtest-report.json` | `.models.baseline_isotonic.brier` |
| Stat band: AUC · baseline (`.6746`) | `backtest-report.json` | `.models.baseline_isotonic.roc_auc` |
| Stat band: AUC · challenger (`.6753`) | `backtest-report.json` | `.models.challenger_isotonic.roc_auc` |
| Stat band: applications (`120,000`) | `src/lib/credit-backtest-identity.ts` | `CREDIT_BACKTEST_FULL_ROW_COUNT` (also asserted equal to `backtest-report.json`'s `.splits` sum by `creditData.ts`) |
| Stat band: backtest default rate (`0.218`) | `backtest-report.json` | `.backtest_default_rate` |
| Frontier polyline (40 points) | `policy-frontier-report.json` | `.points[].threshold`, `.approval_rate`, `.default_rate` |
| "Approve everyone" reference line (preview + full-backtest) | `policy-frontier-report.json` + `backtest-report.json` | `.approve_everyone_default_rate_preview`; `.backtest_default_rate` |
| Alternate-threshold marks (pd ≤ .15, pd ≤ .30) | `policy-frontier-report.json` | `.reference_points.pd_15`, `.reference_points.pd_30` |
| Active policy point (pd ≤ .20) | `policy-frontier-report.json` | `.reference_points.pd_20` (`.active_policy_reference`) |
| No-JS static fallback table (4 rows) | `policy-frontier-report.json` | `.approve_everyone_default_rate_preview`, `.reference_points.{pd_15,pd_20,pd_30}` |
| "624 backtest applications" | `policy-frontier-report.json` | `.backtest_preview_row_count` |
| Model-race footer sentence | `backtest-report.json` | `.models.baseline_isotonic.{brier,roc_auc}`, `.models.challenger_isotonic.roc_auc` |

**Frontier derivation (not a metric, a computed curve):** `scripts/generate-
credit-policy-frontier.mjs` sorts the 624 backtest-split rows inside
`credit-backtest-compact.json` by `calibrated_pd` ascending and walks the
cumulative "approve at or below this score" curve, emitting one point per
distinct `calibrated_pd` value (40 distinct values across 624 rows, since
isotonic calibration produces a step function with limited output levels).
The three reference points (pd ≤ .15/.20/.30) and the "approve everyone"
row are computed the same way, independently, inside the same script —
verified against the mock's own annotated numbers (31%/7.2%, 50.6%/10.8%,
82%/13.9%, 19.2% preview / 21.8% full backtest) during development.

## 02 — Decision boundary (`CreditDecisionBoundary.tsx`)

| Rendered value | Source | jsonPath |
| --- | --- | --- |
| Approve / review / decline band rules | `policy-contract.json` | `.policy.approve_when`, `.review_when`, `.decline_when` |
| Expected-loss formula | `policy-contract.json` | `.policy.expected_loss` |
| Disclosed LGD assumption (45%) | `src/components/credit/creditData.ts` | `DISCLOSED_LGD_ASSUMPTION` (copied verbatim from `methods-evidence.json`'s `modeling` notes / the case study's own README — not a stored per-application field in either committed report, same "documented pipeline metadata" treatment as `marginData.ts`'s `CALENDAR_ANCHOR_ISO`) |
| Three-threshold decision table (pd ≤ .15/.20/.30) | `policy-frontier-report.json` | `.reference_points.{pd_15,pd_20,pd_30}` |
| "vs. approve everyone" multiplier column | derived: `default_rate / approve_everyone_default_rate_preview` | computed, not stored |

## 03 — Model-comparison honesty (`CreditNegativeResults.tsx`)

| Rendered value | Source | jsonPath |
| --- | --- | --- |
| Baseline vs challenger comparison table (Brier/log-loss/AUC) | `backtest-report.json` | `.models.baseline_isotonic`, `.models.challenger_isotonic` |
| "Wins N of 3 metrics" | derived: per-metric winner comparison | computed, not stored |
| Negative-result finding (near-identical performance) | `backtest-report.json` | same fields, independently re-derived from `.models.*` (not copied from `projects.ts`'s `fieldNotes`, so the two can never silently drift) |
| LGD / boundaries limitation finding | `src/components/credit/creditData.ts` + `backtest-report.json` | `DISCLOSED_LGD_ASSUMPTION`; `.backtest_default_rate`; `.boundaries` |

## 04 — Source & receipts

`src/components/credit/creditReceipts.ts`'s `CREDIT_RECEIPTS` duplicates
the five-row table at the top of this file as literal strings (same
convention as `marginReceipts.ts`'s `MARGIN_RECEIPTS` — the receipts
exhibit is a plain static import like every other exhibit; this file plus
`pipelines/credit-backtest/README.md`/`PROVENANCE.md` are what keep them
honest, not a build-time re-hash of the exhibit itself).
`CREDIT_REPRODUCE_COMMANDS` chains the existing pipeline's own venv/build
commands with the two npm scripts that derive the two JSON preview/report
files from that Parquet. `CreditVerify.tsx`'s click-gated DuckDB-WASM
button re-reads `scored-backtest.parquet` in the visitor's own browser and
reports the row count against `CREDIT_BACKTEST_FULL_ROW_COUNT` (`src/lib/
credit-backtest-identity.ts`, `120,000`) and the recomputed SHA-256 against
`CREDIT_BACKTEST_ARTIFACT_SHA256` — `@/lib/duckdb` (and therefore
`duckdb-mvp.wasm`, the `heavy-assets.json`-registered heavy asset shared
with Margin) is dynamically imported only inside that button's click
handler, so no DuckDB network request fires before an explicit click.

## Report layer (Architecture / Results & negatives / Limitations)

Reads `project.role`, `.architecture`, `.outcome`, `.fieldNotes`, and
`.boundaries` straight from `src/lib/projects.ts`'s existing
`credit-policy-desk` entry (unmodified by this task) — the same
already-fact-checked bilingual content the pre-rebuild page rendered via
`CaseStudyBlock.tsx`/`CreditProof.tsx`, now rendered directly by
`CreditPage.tsx` per the Margin Control Tower / Triage Router / EOD / Forge
report-layer precedent. Note that `fieldNotes[0]`'s prose states the same
Brier/log-loss/AUC comparison exhibit 03 states independently (both trace
to the same `backtest-report.json` fields, but neither copies the other).

## Superseded: the pre-rebuild interactive workbench

`src/components/analytics/CreditPolicyLab.tsx` (644 lines: source toggle,
vintage picker, capacity slider, application search, calibration/PSI/
reason-code panels, swap-set comparison) and `src/components/CreditProof.tsx`
are **not deleted** by this task, but are no longer routed —
`/analytics/credit-policy-desk` now resolves to
`src/app/analytics/credit-policy-desk/page.tsx` (`CreditPage.tsx`), added
to the `[track]/[project]/page.tsx` catch-all's `STANDALONE_ROUTE_SLUGS`
set. See `task-L4-report.md` for the full old-assertion → new-assertion
replacement inventory required by the task brief ("replace old assertions
equivalent-or-stronger, documented").
