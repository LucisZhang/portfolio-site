# Crossover Study digits — number → file → jsonPath → SHA-256

G2 register for the Round-2 Crossover Study notebook/workbench page (task
L6 [CLAUDE], `/engineering/crossover-study`, spec §6.6's cached-state SQL
workbench mapped onto output/design-legacy/legacy-4-crossover-study.html).
Every VERIFIED number rendered by `src/components/crossover/*.tsx` traces
to one of the eight files below, all statically imported and build-time-
validated by `crossoverWorkbenchData.ts` / `crossoverCurvesData.ts` — an
invalid or missing-field source fails `npm run build`, not a client
render. None of these files is re-typed literally as a number in a `.tsx`
file (the query-02 index blurb's "1.61M-item catalog" figure is computed
live from `data-scale.json`'s own `silver.items` row count, not a second
hardcoded copy of it).

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `public/case-studies/crossover-study/workbench/queries.json` | 3,793 | `108a89d1eda3b7f30efaff2b85ebbcff563b9ebbd7431df13d49a0db0edfc67e` |
| `public/case-studies/crossover-study/workbench/iceberg-plate.json` | 168 | `0c0798c6e83b2f1000209af828ea73cb4a094be9da8dacec4ac10ccadc8c1a5f` |
| `public/case-studies/crossover-study/workbench/results/data-scale.json` | 381 | `a8efc4f0530b222e721400ddd642b2aa549c65c0e32c163c1185ea32b114cce9` |
| `public/case-studies/crossover-study/workbench/results/category-distribution.json` | 2,150 | `59d6eeb0d3874dd5b1c269273cc26ec63c959367fdd174b828efbd72fba953e9` |
| `public/case-studies/crossover-study/workbench/results/cross-purchase.json` | 2,634 | `dd8b9b2d546dae1707db2d0c8bce412fac49cd320a13385b747c5ce0d492fd26` |
| `public/case-studies/crossover-study/workbench/results/amazon-null-test.json` | 3,632 | `c2178dfc2524688c03df321455bc6f9b74a9575cbac768a108c99201df928172` |
| `public/case-studies/crossover-study/workbench/results/ml32m-counterexample.json` | 948 | `8d1d3d1b08a89d6d05d610fcc7ebd6b5b5ecd20353a39c2dd857f1fe76ac0ae2` |
| `public/case-studies/crossover-study/workbench/results/counterexample-caveat.json` | 1,367 | `6e5d68a9d8a03142ad884d404a0f0364e6660e9f5102f444135fadbcf92936b3` |
| `public/case-studies/crossover-study/exhibits.json` | 14,822 | `f99a5827046edfee5b6bc7a4f2dc7fb5550eefdcfc6757361148c28b781f78aa` |

All eight rows re-register the same bytes/SHA-256 `docs/evidence/r2-source-
map.md` already carries for these files (Task 5.0 [CODEX]'s DuckDB export
+ the pre-existing `extract-crossover-case-study.mjs` projection) — this
file does not re-derive them, it maps each rendered number back to a
`jsonPath` inside a file whose hash is already tracked by `npm run
verify:r2-sources`. Hashes re-verified via `shasum -a 256 <file>` / `wc -c
< <file>` on 2026-08-30.

## 01 — SQL workbench (`SqlWorkbench.tsx`)

| Rendered value | Source | jsonPath |
| --- | --- | --- |
| The six curated queries + each one's SQL text and research-question comment | `queries.json` | `.queries[].id/.title/.sql/.comment` |
| The active query's results table (rows, right-aligned numerics) | `results/<id>.json` | `.rows[]` |
| The active query's telemetry line (rows scanned, elapsed ms, build date) | `results/<id>.json` | `.telemetry.rowsScanned`, `.telemetry.elapsedMs`, `.builtAt` |
| The download link's target file | `results/<id>.json` | n/a (the file itself, served verbatim from `public/`) |
| Iceberg nameplate: committedAt, schema version, rowCount, files, bytes | `iceberg-plate.json` | `.committedAt`, `.schemaVersion`, `.rowCount`, `.files`, `.bytes` |
| Iceberg nameplate: snapshotId (`884031112460958161`) | `iceberg-plate.json`'s raw text, read by `src/app/engineering/crossover-study/page.tsx` | regex `"snapshotId"\s*:\s*(\d+)` against the file's raw bytes, **not** `.snapshotId` via `JSON.parse` |
| Query-02 index blurb's top-3 categories + percentages | `results/category-distribution.json` | `.rows[0..2].category`, `.rows[0..2].catalog_pct` |
| Query-02 index blurb's "1.61M-item catalog" figure | `results/data-scale.json` | `.rows[].row_count` where `dataset === "silver.items"` |
| Query-05 index blurb's "n*=20" figure | `exhibits.json` (via `crossoverCurvesData.ts`'s `ml32mNStar`, imported into `SqlWorkbench.tsx`) | `.ml32m_crossover.n_star` |

`iceberg-plate.json`'s `snapshotId` (884031112460958161) is a real 64-bit
Iceberg snapshot ID that exceeds `Number.MAX_SAFE_INTEGER` — parsing it as
a JS `number` (the path every other field on this page uses) silently
rounds it to the nearest representable double. The route's Server
Component reads the file's raw text and regex-extracts the digit string
before any `JSON.parse` ever touches it, and passes the exact string down
as a prop, the same reason `tests/e2e/crossover-r2.spec.ts` does its own
raw-text extraction rather than trusting a parsed comparison value.

The RUN button's `data-asset="/duckdb/duckdb-mvp.wasm"` / `data-bytes=
"39362651"` is not a claim number from this project's own data — it is the
sitewide `heavy-assets.json` ledger's disk-verified size for the shared
DuckDB-WASM runtime (also carried by Margin/Credit's click-gated verify),
advertised here as the honest "what R6's live engine will cost" label;
`node scripts/verify-heavy-assets.mjs` checks the literal attribute against
the ledger and the ledger against the file on disk. This page never
fetches that asset (RUN only shows `ENGINE ARRIVES WITH R6`).

## 02 — The two main curves (`CrossoverCurves.tsx`)

| Rendered value | Source | jsonPath |
| --- | --- | --- |
| Amazon null curve (segments, series points, CI bands, run IDs) | `exhibits.json` | `.amazon_null.segments`, `.amazon_null.series[]` |
| ML-32M n*=20 curve (segments, series points, CI bands, run IDs) | `exhibits.json` | `.ml32m_crossover.segments`, `.ml32m_crossover.series[]` |
| No-JS static fallback tables under each chart | `exhibits.json` | same `.series[].points[].value` |

Every literal `20` this page shows for the ML-32M threshold — the exhibit-02
title ("crosses at n*=20"), its h2 ("The crossover appears at n*=20"), the
chart's own marker label and marker position, and the query-05 curated-
query-index blurb ("n*=20 NDCG@10 counterexample", `SqlWorkbench.tsx`) — is
the same `ml32mNStar` constant (`crossoverCurvesData.ts`), which reads
`.ml32m_crossover.n_star` once. The chart marker's *position* (which
segment index the vertical line lands on) is derived from that same value
independently, via `ml32mMarkerIndex` = the first entry in
`.ml32m_crossover.segments` whose label starts with `ml32mNStar`'s own
digits — not a second, separately-typed `4` — so a change to the segment
bucketing can't silently misplace the marker against a stale index.

Every "6.40%" this page shows (the exhibit-02 caption, both locales) is
`ml32mChurnPercent` (`crossoverCurvesData.ts`), `(catalog_churn.ml32m
.churn_share * 100).toFixed(2)` — not a second, separately-typed copy of
the same figure.

This is the same `exhibits.json` projection `scripts/generate-home-data.mjs`
and `scripts/verify-evidence.mjs` already read directly and independently —
unmodified by this task; only the React presentation around it (de-boxed
Evidence grammar instead of the retired `CrossoverExhibit.module.css` grid)
is rebuilt. The catalog-churn mechanism panel the pre-rebuild page carried
alongside these two curves is not reproduced here as its own instrument;
its one load-bearing number (41.11% churn — the Amazon side of the same
`catalog_churn` object, not the ML-32M side these derived exhibit-02
figures use) stays in the Results & negatives / Provenance report-layer
text below (`projects.ts`, unchanged) — see the kept/dropped inventory in
`task-L6-report.md`.

## 03 — Source & receipts (`CrossoverSourceReceipts.tsx`)

The six-run receipts list (`crossoverReceipts`, `crossoverCurvesData.ts`)
is `exhibits.json`'s own `.receipts[]` array, rendered directly — the same
"receipts exhibit is a plain static import" convention as
`MARGIN_RECEIPTS`/`CREDIT_RECEIPTS`/`RAG_RECEIPTS`. The provenance
narrative above the receipts list reads `project.provenance` straight from
`src/lib/projects.ts`'s existing `crossover-study` entry (unmodified by
this task), which is why it can name the exact run IDs
(`20260805T172047Z-035042b`, `20260806T082441Z-2f2f26d`,
`20260817T095926Z-633d454`, `20260820T221055Z-20d8ff9`,
`20260820T221701Z-20d8ff9`) each receipt below makes independently
inspectable.

## Report layer (Results & negatives / Limitations)

Reads `project.outcome`, `.fieldNotes`, and `.boundaries` straight from
`src/lib/projects.ts`'s existing `crossover-study` entry (unmodified by
this task) — the same already-fact-checked bilingual content the
pre-rebuild page rendered via `CrossoverProof.tsx`/`ProjectPageView`, now
rendered directly by `CrossoverPage.tsx` per the Triage Router / Margin /
Credit / RAG report-layer precedent. `role` and `architecture` are the two
of the eight `projects.ts` fields this page does not render (see
`CrossoverPage.tsx`'s own header comment for why: the SQL workbench's six
curated queries already narrate the Freeze → Rank → Route → Measure →
Falsify pipeline as runnable queries, so a second prose restatement would
be redundant rather than load-bearing) — `problem`/`audience` remain
unrendered everywhere on the site, unchanged precedent.
