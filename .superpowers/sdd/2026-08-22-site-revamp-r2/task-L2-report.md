# Task L2 [CLAUDE] report — Margin Control Tower rebuild

## What shipped

`/analytics/margin-control-tower` is now a standalone literal route
(`src/app/analytics/margin-control-tower/page.tsx`, added to
`[track]/[project]/page.tsx`'s `STANDALONE_ROUTE_SLUGS`) rendering
`MarginPage.tsx`: a 4-exhibit chart-led Evidence page per spec §6.7
("Margin/Credit(归档)") and the user-approved mock
(`output/design-legacy/legacy-5-margin-control-tower.html`):

- **01 Detection** (`MarginDetectionFigure.tsx`) — the mock's first screen
  folded into one exhibit (assertion, stat line, SVG lollipop figure of the
  6 injected leaks + 11 zero-filled missing weeks, no-JS static table,
  elasticity honesty footer), plus a `cn-gloss` paragraph.
- **02 Decision boundary + metric registry** (`MarginDecisionBoundary.tsx`)
  — STL/robust-z method explanation, a threshold ruler, and the 4-metric
  governed registry table.
- **03 Negative results** (`MarginNegativeResults.tsx`) — TP/FP composition
  bar + `Finding` components for the 13-false-positive "counted, not
  hidden" disclosure and the holdout-MAPE 0.759 honesty.
- **04 Source & receipts** (`MarginPage.tsx`'s `SourceReceipts`) — receipts
  `<dl>`, a click-gated `MarginVerify.tsx` (DuckDB-WASM re-verification of
  `olist-margin.parquet`, dynamically imported only on click), a `<details>`
  "view SQL" panel, reproduce commands from `pipelines/olist-margin/
  README.md`, and the existing `AnalyticsMethods` component (unchanged,
  keeps its own e2e coverage intact).
- Report layer (Architecture / Results & negatives / Limitations) reads
  `project.role/.architecture/.outcome/.fieldNotes/.boundaries` from the
  existing, unmodified `projects.ts` entry.

All numbers trace to `public/case-studies/margin-control-tower/
{detection-report,elasticity-report,metric-registry}.json` via
`src/components/margin/marginData.ts`, which **statically imports and
build-time-validates** the three files (using the existing
`margin-report-validation.ts` schema checks) — an invalid or
hash-mismatched report now fails `npm run build`, not a client render.
Full traceability in `docs/evidence/digits-margin.md`.

Rail: `marginRail.ts`, auto-rail v3 (`mode="auto"`), 4 nav entries, zh gloss
= existing `project.glossZh` (already ≤20 chars), `← ALL WORK`, and a mono
status tag — `stamp: { label: "ARCHIVED", tone: "offline" }` — reusing
`ExhibitShell`'s existing rail-stamp slot (the same one Forge's live-status
badge uses) since `margin-control-tower`'s `projects.ts` `tier` is
`"archive"`.

The pre-rebuild interactive workbench
(`src/components/analytics/MarginControlTower.tsx`, `MarginProof.tsx`) is
**not deleted**, only unrouted — see "Old-assertion inventory" below.

## Old-assertion → new-assertion inventory (replace, not silently drop)

`tests/e2e/margin-r2.spec.ts` is the new equivalent-or-stronger coverage.
Margin-only tests removed from the two files below (Credit's tests in both
files are untouched):

- **`tests/e2e/analytics-phase2.spec.ts`**: removed "Margin Control Tower
  uses the expanded dataset..." (heatmap/scenario-slider/waterfall/CSV
  download UI that no longer exists) → covered by margin-r2's stat-line and
  detection-figure tests.
- **`tests/e2e/analytics-real-data.spec.ts`**: removed 11 margin-only tests
  (compact-preview painting, in-flight materialization join, region/
  channel/week selection, DuckDB-runtime-failure fallback, heatmap
  selection, cached-source-switch timing, panel alignment, malformed/
  stale-hash report fail-closed ×2) and trimmed 3 mixed margin+credit tests
  down to their credit-only halves (renamed with "(Credit)" suffix). The
  "both project pages mount the dedicated methods section" test is
  **unchanged** — `AnalyticsMethods` still renders identically on the new
  page. Malformed/stale-hash report coverage is now a **build-time**
  guarantee (`marginData.ts` throws at module load), stronger than the old
  runtime pending/invalid client states.
- `decodedParquetFixture()`'s `"margin"` variant and `measureCachedSwitch`'s
  margin literal are removed from the shared helpers (credit-only now);
  `tests/e2e/analytics-invalid-margin.parquet.b64` is left in place,
  unreferenced.

`scripts/check-localization.mjs`: added `/analytics/margin-control-tower`
to `PROSE_CHECK_ROUTES` (the stricter zh body-prose scan every other
rebuilt R2 page already joined) and allowlisted the Kaggle dataset's own
title ("Brazilian E-Commerce Public Dataset by Olist", rendered verbatim by
the shared `AnalyticsMethods` component) as a proper-noun citation, same
treatment as the existing RouteLLM citation.

## Verify

- `npx tsc --noEmit` — clean.
- `npx eslint` (margin dir + touched files) — clean.
- `npm run build` — succeeds; `/analytics/margin-control-tower` is its own
  static route.
- `node scripts/verify-heavy-assets.mjs` — all 3 assertions pass;
  `duckdb-mvp.wasm` absent from every route's initial resources (`@/lib/
  duckdb` stays dynamically imported inside `MarginVerify`'s click handler).
- `npx playwright test margin-r2 --project=desktop --project=mobile` — **14
  passed, 2 skipped** (viewport-idiom skips: rail test is desktop-only,
  overflow test is mobile-only).
- `npx playwright test analytics-real-data analytics-phase2
  --project=desktop` — **10 passed** (Credit's full suite, confirming the
  surgery didn't regress it).
- `npm run check:localization` (full chain: gate-wiring test, lint-copy,
  check-localization, verify-zh-glyphs) — **0 errors**, 10 pre-existing
  unrelated warnings (Forge/EOD/Guardian/Privacy/Triage control-text
  warnings, not touched by this task). Two transient "document language"
  errors on unrelated routes (`/analytics/credit-policy-desk`,
  `/analytics/analytics-tandem`) appeared once under concurrent
  filesystem/port load from the parallel L1 (release-guardian) task's own
  build/test cycle and disappeared on immediate re-run — not a real
  regression (those routes are untouched by this task).
- Screenshots: `output/l2-margin/{en,zh}-{desktop,mobile}.png`.
- `docs/evidence/digits-margin.md` — new digits register.

## Concerns

1. **`lint-copy.mjs`'s "robust" blacklist term** collided with the genuine
   statistical method name ("robust z-score") in 7 spots; resolved with the
   existing `// copy-lint: allow robust -- statistical method name`
   escape-comment convention (precedent: `DetectionPanel.tsx`). Comments had
   to sit on the line immediately before the flagged template-literal/JSX
   line specifically (the linter only looks one line back).
2. **Locale-purity retrofit**: because this route is *newly* added to
   `PROSE_CHECK_ROUTES`, several previously-unscanned strings needed fixes
   that a from-scratch page wouldn't have hit: a metric-registry `grain`
   field's literal `"week x product x region x channel"` (fixed by
   displaying `"×"` instead of `"x"`), two unconditional English SVG
   caption spans that combined into a 10-word run across sibling elements,
   `metricRegistry.provenance`'s raw English value spliced into zh prose,
   and the Kaggle dataset title from the shared `methods-evidence.json`
   (allowlisted). None of these affect the rendered *numbers* — only how
   surrounding prose/labels are localized.
3. **Shared-port/shared-`.next` concurrency** with the parallel L1 task
   (same working directory, no worktree isolation): `playwright test`'s
   `webServer` (port 4173, `reuseExistingServer: false`) collided twice with
   L1's own server; resolved by waiting for the port to free rather than
   killing another session's process. For `check:localization` (which
   expects an already-running server, no built-in `webServer`), I ran a
   second `next start` on port 4174 to avoid the shared port entirely — the
   one transient double-error mentioned above happened before I switched to
   the isolated port. `[track]/[project]/page.tsx`'s
   `STANDALONE_ROUTE_SLUGS` edit ended up folded into L1's own commit
   (3139706) since both edits landed in the same shared file before either
   side committed; the merged result (both `margin-control-tower` and
   `release-guardian` present) is correct and verified.
4. **Scope boundary on old fail-closed tests**: the two removed
   malformed-report / stale-Parquet-hash tests are not reproduced 1:1 in
   `margin-r2.spec.ts` (the task's TDD list didn't require them). The
   underlying safety property is now enforced more strongly at build time
   instead (see `marginData.ts`); flagging this explicitly per the task's
   "documented" requirement rather than silently narrowing coverage.
5. `metric-registry.json` predates this task and is not a
   `pipelines/olist-margin/build.py` output — no reproduce command is
   claimed for it on the page (stated plainly in exhibit 04's prose and in
   `digits-margin.md`).

## Report path

`.superpowers/sdd/2026-08-22-site-revamp-r2/task-L2-report.md` (this file).

## Fix round 1 (review finding, Important)

**Finding:** `marginData.ts`'s build-time fail-closed contract check
(malformed/stale report data throws instead of silently rendering) had
zero automated coverage of its *negative* path — nothing proved the throw
actually fired; a future validator refactor could silently break the
guarantee.

**Fix:** Extracted the two throwing wrappers out of `marginData.ts`'s
inline `if (!isDetectionReport(...)) throw new Error(...)` checks into
`src/lib/margin-report-validation.ts` (a zero-import file) as
`assertDetectionReport`/`assertElasticityReport`, throwing the new
`MarginDetectionReportContractError`/`MarginElasticityReportContractError`
with the **exact same messages** the inline checks used — this is a
refactor for testability, not a behavior change, and the underlying
`isDetectionReport`/`isElasticityReport` validators are untouched (per the
controller's "do not weaken the validators" instruction). `marginData.ts`
now calls these two functions instead of duplicating the check inline.

Added `tests/margin-report-validation.test.mjs` (plain `node --test` +
`node:assert/strict`, mirroring `check-localization-gate-wiring.test.mjs`'s
no-framework pattern) — **11 tests**: the two real committed fixtures pass
unchanged; then in-memory-corrupted clones of those same real fixtures
(wrong precision, a labeled-week's `detected` flipped without updating
`true_positives`/`false_negatives`, a stale/mismatched `artifact_sha256`
on both reports, a missing required field on both reports, a
non-numeric coefficient, a coefficient outside its own confidence
interval, and non-object input) each assert the specific contract-error
class is thrown. Imports the validator file and `olist-margin-identity.ts`
by relative path (both have zero `@/...` alias imports), so the test needs
no bundler/loader.

Wired into `npm run verify:evidence` (`package.json`): `node --test
tests/margin-report-validation.test.mjs &&` now runs first in that chain,
so it executes on every `verify:evidence` run, not just when someone
remembers to run it manually.

**Re-ran covering check:** `npm run verify:evidence` — all 11 new tests
pass, followed by the existing olist/credit preview-contract and
`verify-evidence.mjs` checks (all still passing, unaffected). Also
re-verified the full margin surface end-to-end wasn't regressed by the
refactor: `npx tsc --noEmit` clean, `npx eslint` clean, `npm run build`
succeeds (proves the real committed files still satisfy the now-relocated
build-time assertion), `node scripts/verify-heavy-assets.mjs` 3/3 pass,
`npx playwright test margin-r2 --project=desktop --project=mobile` 14
passed / 2 skipped (same as before this fix).

Commit: `test(r2): self-test margin data validators' fail-closed path`.
