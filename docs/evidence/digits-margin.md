# Margin Control Tower digits — number → file → jsonPath → SHA-256

G2 register for the Round-2 Margin Control Tower "chart-led Evidence" page
(task L2 [CLAUDE], `/analytics/margin-control-tower`, spec §6.7 "Margin /
Credit(归档): 4 exhibits, Evidence 形态"). Every number rendered by
`src/components/margin/*.tsx` traces to one of the three committed JSON
files below (built by `pipelines/olist-margin/build.py`, except
`metric-registry.json`, hand-authored) — none is typed literally into a
`.tsx` file. `src/components/margin/marginData.ts` statically imports and
build-time-validates all three; an invalid or hash-mismatched report fails
the build, not a client render.

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `public/case-studies/margin-control-tower/detection-report.json` | 4,571 | `71f9a444f3cc916056142f3ef128174cf7c0f0f8d598eedd9e1a8393e4653580` |
| `public/case-studies/margin-control-tower/elasticity-report.json` | 681 | `8f5cf741575d5dfe290ecb7422f304eaf7065f6157b664b4ac36b367dcc4c10d` |
| `public/case-studies/margin-control-tower/metric-registry.json` | 1,048 | `4eada1504cd4088a7986283c68a5f02a75b298305e423de467f326d916640ae9` |
| `public/case-studies/margin-control-tower/olist-margin.parquet` | 672,410 | `6921b7ed790367fe9d9ade878a7b97e6d7c2879b9488eef51b326ad9775722fb` |

The first, second, and fourth rows exactly match
`pipelines/olist-margin/README.md`'s own "Verified 2026-07-17" table — this
file does not re-derive them, it re-registers the same committed values for
the site's own G2 convention.

## 01 — Detection figure (`MarginDetectionFigure.tsx`)

| Rendered value | Source | jsonPath |
| --- | --- | --- |
| Assertion stat tiles (recall / precision / weeks / threshold) | `detection-report.json` | `.recall`, `.precision`, `.true_positives`, `.false_positives`, `.evaluated_week_count`, `.missing_week_count`, `.threshold` |
| 6 vermilion lollipops (x = week, y = |z|) | `detection-report.json` | `.labeled_weeks[0..5].week`, `.robust_z_score`, `.injected_delta` |
| 11 missing-week ticks | `detection-report.json` | `.missing_weeks[0..10]` |
| "lands N–M× past the alarm line" | derived: `floor(min(|z|)/threshold)`–`floor(max(|z|)/threshold)` | computed from `.labeled_weeks[].robust_z_score` and `.threshold`, not a stored field |
| No-JS static table (same 6 rows) | `detection-report.json` | `.labeled_weeks[]` |
| Elasticity footer sentence | `elasticity-report.json` | `.coefficient`, `.confidence_interval_95[0..1]`, `.holdout_mape` |
| Boundary line metric list + count | `metric-registry.json` | `.metrics[].id`, `.metrics.length` |
| Boundary line label source | `detection-report.json` | `.label_source_localized.{en,zh}` (already bilingual in the source file) |

**Week-grid geometry (not a metric, structural calendar metadata):** the
report gives only the 11 missing weeks and 6 labeled weeks, not an explicit
array of all 106 calendar weeks. The x-axis anchor date `2016-08-29` in
`marginData.ts`'s `CALENDAR_ANCHOR_ISO` is copied verbatim from
`pipelines/olist-margin/README.md` ("reindexed to every Monday from
2016-08-29 through 2018-09-03") — it is not re-derivable from
`detection-report.json` alone (the earliest *labeled* week is 3 weeks after
the true anchor). `marginData.ts` asserts at module load that every known
week (missing + labeled) resolves inside `[0, evaluated_week_count - 1]`
under that anchor, failing the build if the pipeline's calendar ever
changes without this file being updated.

## 02 — Decision boundary + metric registry (`MarginDecisionBoundary.tsx`)

| Rendered value | Source | jsonPath |
| --- | --- | --- |
| Method / period prose | `detection-report.json` | `.method`, `.stl_period_weeks`, `.threshold` |
| Threshold ruler (6 marks + alarm line) | `detection-report.json` | `.labeled_weeks[].robust_z_score`, `.threshold` |
| Metric registry table (id / formula / grain / unit) | `metric-registry.json` | `.metrics[]` |
| Registry note (count, owner/provenance code line) | `metric-registry.json` | `.metrics.length`, `.owner`, `.provenance` |

`metric.grain` values containing the literal `" x "` separator (e.g. `week
x product x region x channel`) are displayed with `" × "` (multiplication
sign) instead — a cosmetic substitution matching this same project's own
`grain` phrasing already in `projects.ts` ("week × product category ×
region × dominant payment channel"), and incidentally what keeps
`scripts/check-localization.mjs`'s zh body-prose scan (this page is newly
added to `PROSE_CHECK_ROUTES` by this task) from reading a bare `x` as a
4th consecutive "English word" in an otherwise data-only table cell.

`metric.owner`/`.provenance` are quoted verbatim only in the English render
(`<code>{metricRegistry.provenance}</code>`); the zh render references them
without direct quotation rather than splicing an untranslated multi-word
English metadata string into otherwise-Chinese prose.

## 03 — Negative results (`MarginNegativeResults.tsx`)

| Rendered value | Source | jsonPath |
| --- | --- | --- |
| TP/FP composition bar + caption | `detection-report.json` | `.true_positives`, `.false_positives` |
| "N of M alarms (P%) are false positives" | derived: `false_positives / (true_positives + false_positives)` | computed, not stored |
| Precision/recall/false-negatives sentence | `detection-report.json` | `.precision`, `.recall`, `.false_negatives`, `.threshold` |
| Elasticity holdout-honesty sentence | `elasticity-report.json` | `.coefficient`, `.confidence_interval_95[0..1]`, `.analysis_rows`, `.holdout_rows`, `.holdout_mape` |

## 04 — Source & receipts

`src/components/margin/marginReceipts.ts`'s `MARGIN_RECEIPTS` duplicates
the four-row table at the top of this file as literal strings (same
convention as `triageReceipts.ts`'s `TRIAGE_RECEIPTS` — the receipts
exhibit is a plain static import like every other exhibit; this file plus
`pipelines/olist-margin/README.md` are what keep them honest, not a
build-time re-hash of the exhibit itself). `MARGIN_REPRODUCE_COMMANDS`
copies `pipelines/olist-margin/README.md`'s own "Reproduce" section
verbatim. `MarginVerify.tsx`'s click-gated DuckDB-WASM button re-reads
`olist-margin.parquet` in the visitor's own browser and reports the row
count against `OLIST_MARGIN_FULL_ROW_COUNT` (`src/lib/
olist-margin-identity.ts`, `15,809`) and the recomputed SHA-256 against
`OLIST_MARGIN_ARTIFACT_SHA256` — `@/lib/duckdb` (and therefore
`duckdb-mvp.wasm`, the `heavy-assets.json`-registered heavy asset shared
with Credit Policy Desk) is dynamically imported only inside that button's
click handler, so no DuckDB network request fires before an explicit click.

`metric-registry.json` is not a `pipelines/olist-margin/build.py` output
(unlike the other three files) — it predates this task and is described on
the page as hand-authored governance content, not pipeline-reproduced; no
reproduce command is claimed for it.

## Report layer (Architecture / Results & negatives / Limitations)

Reads `project.role`, `.architecture`, `.outcome`, `.fieldNotes`, and
`.boundaries` straight from `src/lib/projects.ts`'s existing
`margin-control-tower` entry (unmodified by this task) — the same
already-fact-checked bilingual content the pre-rebuild page rendered via
`CaseStudyBlock.tsx`, now rendered directly by `MarginPage.tsx` per the
Triage Router / EOD / Forge report-layer precedent.

## Superseded: the pre-rebuild interactive workbench

`src/components/analytics/MarginControlTower.tsx` (676 lines: source
toggle, scenario slider, category/region/channel heatmap, contribution
waterfall) and `src/components/MarginProof.tsx` are **not deleted** by this
task, but are no longer routed — `/analytics/margin-control-tower` now
resolves to `src/app/analytics/margin-control-tower/page.tsx`
(`MarginPage.tsx`), added to the `[track]/[project]/page.tsx` catch-all's
`STANDALONE_ROUTE_SLUGS` set. See `task-L2-report.md` for the full
old-assertion → new-assertion replacement inventory required by the task
brief ("replace old assertions equivalent-or-stronger, documented").
