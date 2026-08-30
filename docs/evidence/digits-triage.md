# Triage Router digits — number → file → jsonPath → SHA-256

G2 register for the Round-2 Triage Router "market terminal" page (task 3.1,
`/ai/triage-router`, spec §6.3). Every number rendered by
`src/components/triage/*.tsx` traces to one of these compact payloads
(task 3.0's output, exported from `nlp-eval-lab` by
`scripts/export_site_payloads.py`) or to the copied Tier B2 model files —
none of them are typed literally into a `.tsx` file as a benchmark result.
(Fix round 1 landed `drift.compact.json` and copied the Python parity
fixture on-site; see "Fix round 1" at the end of this file.)

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `public/case-studies/triage-router/frontier.compact.json` | 2,503 | `c7e6555d3b03d988da30403f6052abf5e0be778e17f26b6eaa9c6696fc5eefcc` |
| `public/case-studies/triage-router/policies.compact.json` | 55,455 | `9c2992c53dd62c7412a396e5c175e68068235a37548f74898b5858f258dc5c12` |
| `public/case-studies/triage-router/strategy-cards.json` | 1,121 | `a26dd35e2c911aed93894bf7044be9c3a167ff9ea874cfbd4b432570ca6a868a` |
| `public/case-studies/triage-router/known-failures.json` | 9,919 | `fdcadaafa15e885890984cbab4b5320b46eadf6a3f374f2dcb7d76bf70e35218` |
| `public/case-studies/triage-router/samples.curated.json` | 5,125 | `3c6771b65f44c567082857acd4db08a30004be2c4dc562974bef7a80cb386e4b` |
| `public/case-studies/triage-router/drift.compact.json` | 1,843 | `ea70d32187602f644e895a151e3320991dd1dfc187441bf101c2e49587dc307f` |
| `public/case-studies/triage-router/python_int8_curated.json` | 24,239 | `484b21fab582af7a8b00c98abd89ecb575a5b1330dc7af791bde333b59953486` |

All seven are registered in `docs/evidence/r2-source-map.md` and
re-verified on every `npm run verify:r2-sources` run.

## 01 — PolicyTerminal instrument (hero compact + exhibit 01 full)

`src/components/triage/policyGrid.ts` reshapes `policies.compact.json`'s
flat 384-row `grid` array (6 misroute-cost values × 64 threshold values,
verified identical thresholds across all 6 slices — confirmed by hand while
implementing `buildPolicyMatrix`) into `rows[misrouteCostIndex]
[thresholdIndex]`. Every number the sliders display is one field of the
selected `PolicyRow`:

| Rendered value | Source | jsonPath (per selected row) |
| --- | --- | --- |
| `MISROUTE COST` slider value | `policies.compact.json` | `$.grid[i].misrouteCostCny` (6 distinct values: 0.75, 1.5, 3.0, 6.0, 12.0, 24.0) |
| `CONFIDENCE THRESHOLD` slider value | `policies.compact.json` | `$.grid[i].threshold` (64 distinct values, 0.188542558125–0.978916089421) |
| Strategy-card prose (tokens filled) | `strategy-cards.json` + `policies.compact.json` | `$.ranges[j].copyEn`/`copyZh` with `{threshold}`→`grid[i].threshold`, `{escalatePct}`→`grid[i].escalatePct`, `{monthlyCostCny}`→`grid[i].monthlyCostCny`, `{macroF1}`→`grid[i].macroF1` |
| `triage:<slug>` syntax line | `strategy-cards.json` | `$.ranges[j].name`, kebab-cased by `triageFormat.ts`'s `strategySlug()` |
| Readout row: threshold / escalate / macro-F1 (+ CI) / monthly cost | `policies.compact.json` | `$.grid[i].threshold`, `.escalatePct`, `.macroF1`, `.ci[0..1]`, `.monthlyCostCny` |
| Headcount line ("≈ N of every 1,000 complaints/month…") | `policies.compact.json` | derived: `Math.round(grid[i].escalatePct / 100 * 1000)` — see "Concerns" below for why this is a ticket count, not a literal FTE headcount |
| Frontier chart (hairline curve + CI whiskers + vermilion point) | `policies.compact.json` | all 64 rows of the selected misroute-cost slice: x = `.monthlyCostCny`, y = `.macroF1`, whisker = `.ci[0..1]` |
| Default operating point (initial slider positions) | `strategy-cards.json` + `policies.compact.json` | `DEFAULT_THRESHOLD_INDEX` = nearest grid threshold to the midpoint of `$.ranges[name="Balanced queue"].min`/`.max`; `DEFAULT_MISROUTE_INDEX` = the middle of the 6 sorted misroute-cost values (index 2 → 3.0) |

Sample drawer (`SampleDrawer.tsx`, opened by clicking any readout number):
3 real `tier_a_logreg` rows from `samples.curated.json`
(`$.configs[key="tier_a_logreg"].samples[0..2]` — `complaintId`,
`confidence`, `correct`, `narrative`, `predicted`, `truth`). STOP/ESCALATE
per sample is computed live as `sample.confidence >= currentThreshold`, not
stored — the drawer is the current slider position applied to a real,
frozen sample set. Tier A is used (not `tier_b2`/`haiku`/`sonnet`) because
it is the only config in `samples.curated.json` with a non-null
`confidence` field comparable to the threshold axis.

## Academic anchor and disclosure numbers (exhibit 01 full only)

`cascade threshold, cf. RouteLLM (Ong et al., 2024)` — a fixed citation
string, not a computed number.

The disclosure paragraph (`src/components/triage/PolicyTerminal.tsx`) cites
three numbers that are **not** fields inside the five registered compact
payloads above — they are cross-file provenance from the `nlp-eval-lab`
source repository, documented inline in the component with the same
convention as `ForgeConsole.tsx`'s `SERVING_HARDWARE_LABEL` constant:

| Number | Source (outside this task's registered payloads) | Field |
| --- | --- | --- |
| `86,972` | `/Users/hsiangkuochang/nlp-eval-lab/demo/data/calibration.json` | `$.exhibits[0].n` (`label`: "Tier A LogReg — raw probabilities (CAL)", `slice`: `"cal"`) — the calibration-slice size the threshold sweep behind `policies.compact.json` (task 3.0's `a_to_human__full_cal__…` source, registered in `r2-source-map.md` row 11) was fit on |
| `104,443` | same file | `$.exhibits[2].n` (`slice`: `"test_iid"`) — corroborated independently in `frontier.json`, `case_study.json`, and `drift.json`'s own TEST-IID slice counts; this is what per-threshold macro-F1 would need to be computed on the full sweep instead of the 200-sample curated proxy this page actually uses |
| `2026-08-12` | `/Users/hsiangkuochang/nlp-eval-lab/demo/data/meta.json` `$.headline_router.note` ("Owner decision 2026-08-12") and `drift.json`'s own `$.generated_at` (`2026-08-12T12:21:24.484273Z`) | same evidence-generation batch as the grid |

## 02 — Known misroutes table

`public/case-studies/triage-router/known-failures.json`, `$.failures[0..7]`
(8 rows, deterministic real `a_to_b`-route misroutes) — `complaintId`,
`route`, `predicted`, `truth`, `confidence`, `attribution`, rendered
verbatim by `KnownFailures.tsx` in a server-rendered `<table>`.

## 03 — Tier frontier (Pareto)

`public/case-studies/triage-router/frontier.compact.json`, `$.points[0..7]`
(8 recorded single-tier checkpoints: Tier A ×2, Tier B1 ×3 seeds, Tier B2,
Tier C ×2) — `label`, `macroF1`, `ci`, `costPer1kUsd`, `costCiUsdPer1k`,
`runId`, rendered by `FrontierPareto.tsx` as both an SVG scatter (with both
axes' CI whiskers) and a plain `<table>`.

## 04 — Drift (`DriftChart.tsx`)

`public/case-studies/triage-router/drift.compact.json` — `$.series[]`, 5
tiers:

| Tier | Status | Periods | jsonPath |
| --- | --- | --- | --- |
| `tier_a` | measured | 2022-H2, 2023, 2024, 2025, 2026-H1 | `$.series[tier="tier_a"].points[].value`/`.ci` |
| `tier_b2` | measured | same 5 periods | `$.series[tier="tier_b2"].points[].value`/`.ci` |
| `tier_c_haiku` | measured | same 5 periods | `$.series[tier="tier_c_haiku"].points[].value`/`.ci` |
| `tier_c_sonnet` | measured | same 5 periods | `$.series[tier="tier_c_sonnet"].points[].value`/`.ci` |
| `tier_b1` | **pending** | none (`points: []`) | `$.series[tier="tier_b1"].status` — rendered as an honest "UNMEASURED"/"PENDING — NOT MEASURED" row/legend entry, never a fabricated line or value |

Chart (SVG) and the no-JS `<table>` both read the same 4 measured series;
the pending tier renders in the legend as inert text (no `<button>`, no
clickable chip — there is nothing to select) and in the table as a
distinct `data-drift-pending="true"` row. Selecting a legend chip
(`aria-selected`) turns that one line's stroke vermilion (`--accent`) and
draws its CI whiskers; unselected lines stay on the ink-lightness ramp
(spec §2.2: 100/70/45/25% opacity, `INK_RAMP` in `DriftChart.tsx`) with no
whiskers drawn — matching "chart default ink lightness ramp, vermilion
only for selection." `$.meta.note` ("Tier B1 yearly drift is pending in
the source; no values were measured.") is rendered verbatim as the
exhibit's own source note.

Case study/agreement (also named in spec §6.3's "later exhibits" list)
remains out of scope: `case_study.json` is still a `TBD` row in
`docs/evidence/r2-source-map.md`, so this page has no exhibit for it.

## Hero stat board (3-cell checkerboard)

**Fix round 1 (review finding, Important):** the three cells were
previously re-typed literals ("+0.037", "−$120.58", "2015–2026") — a
silent-drift risk against `projects.ts`'s `metrics.en`, and it falsified
this file's own "zero literal benchmark numbers" claim. They are now
derived at render time by `triageFormat.ts`'s `metricsCells()`, which
splits `project.metrics.en` on "·" and structurally recovers each
segment's value/label (a value token is a run starting with an optional
`+`/`-`/`−`/`$` sign followed by digits, found either leading — `"+0.037
macro-F1"` — or trailing — `"drift 2015–2026"`). `project.metrics.en` is
still the source (not a compact JSON payload): the router-vs-baseline
macro-F1 delta and the cost delta are not present in any of this page's
compact payloads — `frontier.compact.json` only carries single-tier
points, never a combined cascade/router point. `project.metrics.en`/`.zh`
themselves are pre-existing, previously fact-checked `projects.ts` content
(unmodified by task 3.1); this fix removes the duplicate-literal copy, not
the underlying source.

## RUN THE MODEL IN THIS TAB — heavy-asset bytes

Real, measured on-disk file sizes (`ls -la` at copy time, cross-checked by
`scripts/verify-heavy-assets.mjs`'s ledger-vs-disk assertion on every run):

| File | Bytes | SHA-256 | Registered in |
| --- | ---: | ---: | --- |
| `public/models/triage-tier-b2/model.int8.onnx` | 67,575,183 | `da931ec8310cf1280747e22fc6ebfd30fd5f92e312ede6544042e1190764bb4a` | `heavy-assets.json` `/ai/triage-router`; `LocalInference.tsx`'s manifest `<li data-bytes="67575183">` |
| `public/models/triage-tier-b2/tokenizer.json` | 711,494 | `8b79639ec74b46604e730f505186eaafb1006d2fd00f2c4930d168bb7f894680` | same ledger entry; `<li data-bytes="711494">` |
| `public/models/triage-tier-b2/ort/ort-wasm-simd-threaded.wasm` | 13,479,978 | `d1ab1b94b16a65b29d710d0b587b29e7bed336827577623913479b8afe8113e6` | same ledger entry; `<li data-bytes="13479978">` |
| **Sum (RUN button `data-bytes`)** | **81,766,655** | — | `LocalInference.tsx`'s `[data-run-model]`, set via `useEffect` from `TRIAGE_MODEL_TOTAL_BYTES` (`triageAssets.ts`) |

Also copied on-site and registered in `heavy-assets.json` (not part of the
82 MB advertised total — small config files the loader either does not
fetch, or fetches without a progress bar):

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `public/models/triage-tier-b2/tokenizer_config.json` | 351 | `e1c2a61a99bda00f6c55303a210b30e2f92dcf8b555e215812e2eb583e177ffd` |
| `public/models/triage-tier-b2/live_config.json` | 1,623 | `c29f674e12272033ac08f88236d2c3229818f74d37e79bd2bdfbdf1f09ad37bd` |
| `public/models/triage-tier-b2/ort/ort.wasm.min.js` | 50,139 | `ea3a767b15df7dbe3d695ec9c182ca0f15b2ce7750156c6b70276e11c28997f0` |
| `public/models/triage-tier-b2/ort/ort-wasm-simd-threaded.mjs` | 24,180 | `0a1e718d99c41b22c21f2520ff4f9e883a6b5533856e398d21816ee8eb8185d3` |

`heavy-assets.json`'s own SHA-256 (registered in `r2-source-map.md`'s
"Heavy-assets measured ledger" row): `68d66c84369263049f33a1a212418096ef0d9953c818946607a4f80966c0d9a6`.

These seven files are **gitignored** (`.gitignore`'s new `/public/models/`
entry) and never enter git — they are copied by hand from
`/Users/hsiangkuochang/nlp-eval-lab/demo/live/tier_b2/` (the four
model/tokenizer/config files) and by `scripts/sync-triage-ort-assets.mjs`
(the three onnxruntime-web files, wired into `predev`/`prebuild`) into
`public/models/triage-tier-b2/`. **The release archive does not yet provision
them — that is a Task 5.2/R7 item.** Until then, a fresh `npm run build` on
a machine without the manual model copy will fail
`scripts/verify-heavy-assets.mjs`'s assertion (a) (ledger says 67,575,183
bytes; the file does not exist). This mirrors the existing precedent for
`public/duckdb/duckdb-mvp.wasm` and
`public/generated/privacy-ocr/lang/chi_sim.traineddata.gz`, both likewise
gitignored and regenerated by a `predev`/`prebuild` script or a manual
provisioning step, not committed.

`docs/evidence/r2-source-map.md` rows for "Tier B2 live config" / "Tier B2
ONNX model" / "Tier B2 tokenizer" / "Tier B2 tokenizer config" were updated
this task from a stale `TBD (Task 2.5)` to `TBD (Task 3.1 — …)`, still
`TBD`-prefixed (so `verify:r2-sources` still skips them, correctly, since
the target files never enter git) but now pointing at the real
`public/models/triage-tier-b2/…` paths and the real `cp` commands used.

## LOCAL inference result (exhibit 01, after clicking RUN)

**Fix round 1:** all 3 real curated `tier_b2` complaints are run on-device
(not just one) — `samples.curated.json`'s
`$.configs[key="tier_b2"].samples[0..2]` (`complaintId`: 5729765, 5729934,
5773141) — each full `narrative` field fed to `tierB2Engine.ts`'s ported
`loadTierB2().predict()`, sequentially. The recorded comparison row shown
alongside each (`RECORDED · OFFLINE REPLAY`) is that same sample's
`predicted`/`confidence` fields, unchanged. `LOCAL · <ms> · WASM`'s label
and confidence are the real `predict()` return value for that complaint —
not read from any JSON file, since each is a live on-device computation.

**Independently verified against a Python reference this round** (review
finding, Important, "PREFERRED fix"): `python_int8_curated.json`'s
`$.predictions[]` carries the same model's real Python int8 output for 200
curated complaints, generated batch_size=1/no-padding — "matches a single
example browser call" per the fixture's own `$.provenance.batching` field.
`tests/e2e/triage-r2.spec.ts`'s dedicated parity test drives a real click
(no mocked/aborted download), waits for a real ~82 MB download + WASM
warm-up, and asserts the 3 rendered `LOCAL` predictions
(`data-local-label`/`data-local-pmax` on each `[data-parity-row]`) match
the fixture's `label` exactly and `p_max` within 0.02 (the fixture's own
`$.provenance.batching_sensitivity` note records up to ~0.018 max
probability delta between legitimate batching variants of the same model;
this browser call matches the reference's exact batch/pad condition, so
0.02 catches a real regression without chasing quantization noise).
Manually re-verified outside the test suite too (network trace + rendered
values, one throwaway run): all 3 labels matched exactly
(`debt_collection`/`credit_reporting`/`deposit_account`), `p_max` deltas
were 0.0018 / 0.0058 / 0.0132 — well inside tolerance, and the
`model.int8.onnx` response carried `Content-Length: 67575183` (the full
file, not a truncated/cached stub).

## Concerns (honest disclosure boundary, carried forward from task 3.0)

1. **Headcount line is a ticket count, not a literal FTE conversion.**
   Spec §6.3 asks for "一行等价人力换算" (one equivalent-headcount line).
   No file in this task's evidence set carries a reviewer-throughput
   assumption (complaints per reviewer per month) that would let this page
   honestly convert `escalatePct` into a literal headcount number without
   fabricating a rate. `triage-headcount-line` instead states the count of
   complaints per 1,000/month that reach a human reviewer
   (`Math.round(escalatePct / 100 * 1000)`), which is the closest concrete,
   non-fabricated translation of the same field. No FTE number is claimed.
2. **`misrouteCostCny`/`monthlyCostCny` naming vs. disclosed USD basis.**
   `strategy-cards.json`'s own `copyEn`/`copyZh` templates literally say
   "CNY {monthlyCostCny}" (frozen task-3.0 content, rendered verbatim per
   this task's "strategy-card copy comes from the payload" instruction).
   The page's own disclosure paragraph — required, exact-wording content
   per this task's brief — states plainly that these are recorded USD
   sensitivity values, not converted CNY. The two coexist on the page
   deliberately: the strategy card is rendered as authored by the data
   task; the disclosure is what corrects the reader's understanding of
   what the number actually is.
3. **Case study/agreement remains out of scope.** `case_study.json` is
   still a `TBD` row in `r2-source-map.md` and has no exhibit on this page
   — drift (originally grouped with it under one deferred note) now has
   its own real exhibit 04 as of fix round 1; case study does not yet.
4. **RESOLVED in fix round 1** (was: "`LOCAL` inference correctness is a
   straight port, not independently re-verified against Python"). See
   "LOCAL inference result" above — a dedicated e2e parity test now runs
   the real model and checks its output against the Python reference for 3
   curated samples; it passed, with `p_max` deltas of 0.0018–0.0132.

## Fix round 1 (review findings)

1. **Hero StatGrid literals → derived.** See "Hero stat board" above.
2. **LOCAL inference parity unverified → verified.** Copied
   `python_int8_curated.json` on-site (registered in `r2-source-map.md`,
   real path, real sha256 — no longer `TBD`), extended `LocalInference.tsx`
   to run and render all 3 curated `tier_b2` complaints (not 1), and added
   `tests/e2e/triage-r2.spec.ts`'s real-download parity test (desktop only,
   120s test timeout, no mocked network). Result: PASS, no UI caveat
   needed — the "PREFERRED fix" path, not the fallback.
3. **Drift exhibit built.** `drift.compact.json` landed upstream;
   `DriftChart.tsx` replaces the old deferred-note exhibit 04 with a real
   DOM/CSS chart (ink-lightness ramp default, vermilion-on-select, CI
   whiskers on the selected series only) + no-JS static table + an
   independently-written zh narrative. Tier B1 (`status: "pending"`)
   renders as an honest unmeasured entry, never a fabricated line.
