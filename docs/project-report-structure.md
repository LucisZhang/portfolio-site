# Project report structure

G-02 starts from integration commit `beb57ee9f77f9e4ed1e3a06b35e32202df831b58`
on `codex/notes-g02-report-structure`. This is a local presentation upgrade of
the existing ten standalone projects. The catalog, evidence assets, generated
knowledge, source locks and publication state retain their existing authority.

## Reading contract

Each substantive project has one region for Architecture, Results and
Limitations, in that document order. The stable fragment targets are
`#report-architecture`, `#report-results` and `#report-limitations`. They work
without JavaScript, and their target headings accept keyboard focus and clear
the mobile navigation bar. Existing exhibit IDs remain available.

`src/components/report/ProjectReport.tsx` owns the typed concepts, anchors,
section/heading primitive and catalog adapter. Its CSS module owns the centered
760 px reading column, responsive gutters, serif headings, paragraph spacing and
numbered findings. Results with field notes keep the “Results & negatives” /
“结果与负结果” title. A limitation list has one ink rule, following Frontier
Forge's consolidated hierarchy. Each project still owns its instruments,
receipts, provenance and the strength of its claims.

`ProjectReport` reads only the supplied project's role, architecture, outcome,
field notes and boundaries. Empty source fields create no report section.
`ProjectReportSection` accepts project-specific children and titles; its
instrument layout keeps a wide workbench inside its existing exhibit. A custom
title also carries the shared concept as a visible and accessible label.

## Route mapping

| Route | Architecture | Results | Limitations and evidence form |
| --- | --- | --- | --- |
| `/ai/frontier-forge` | `frontierProjectDetail` pipeline | Existing outcome and negative runs | The same complete boundary list; model-suitability matrix remains in exhibit 06, with no duplicated limitations list. |
| `/ai/release-guardian` | Catalog pipeline and role | Existing outcome and field notes | Catalog boundaries; funded-live/stub ledgers, aggregate gates, 30/44 strict residual and exact-hash receipts retain their separate surfaces. |
| `/ai/rag-quality-lab` | Catalog pipeline and role | Existing outcome and field notes | Catalog boundaries; diff lab and verified/blocked registry retain the C2 floor and C3 no-metric distinction. |
| `/ai/triage-router` | Catalog pipeline and role | Existing outcome and negative findings | Catalog boundaries; policy terminal, misroutes, frontier, drift and source receipts stay in their own exhibits. |
| `/ai/privacy-preflight` | Catalog pipeline and role, after export-gate exhibit 04 | Existing outcome and field notes | One boundary list at the preserved `#exhibit-05`, titled “Local does not mean infallible.” Its former duplicate tail is consolidated here. Fictional fixtures, browser/Mac, OCR and destructive-export qualifications remain distinct. |
| `/ai/ask-portfolio` | Existing five-step architecture list, moved from the source exhibit | The already-recorded offline retrieval scope and two verbatim local refusals, with a link back to the exchange/citation | The same two keyword-retrieval/source-scope limitations, moved from the source exhibit. There is no invented evaluation metric or empty catalog section. |
| `/engineering/exactly-once-drills` | Catalog pipeline and role | Existing outcome and field notes | Catalog boundaries; logbook, parity, media and raw run receipts retain the historical-May/local-July environment boundaries. |
| `/engineering/crossover-study` | The existing six-query SQL workbench within exhibit 01, using the shared heading and `instrument` layout | Existing outcome and field notes | Catalog boundaries; Amazon null, ML-32M counterexample, confidence intervals, metric guard and snapshot/receipt identities stay in their original forms. |
| `/analytics/margin-control-tower` | Catalog pipeline and role | Existing outcome and field notes | Catalog boundaries; Olist provenance, proxy economics, synthetic fixtures, detector errors and non-causal elasticity remain in their exhibits and methods. |
| `/analytics/credit-policy-desk` | Catalog pipeline and role | Existing outcome and field notes | Catalog boundaries; granted-loan selection, LGD assumption, calibration/backtest, synthetic policy fixture and methods remain independently inspectable. |

`/analytics/analytics-tandem` remains a compatibility redirect to `/#archive`.
The catch-all's build artifact is retained, but the redirect is not a substantive
report or a new empty project. Existing track and renamed-project redirects are
unchanged.

## Verification

`tests/e2e/project-report.spec.ts` derives its route set from the routable
catalog. It checks static HTML, the compatibility redirect, bilingual report
order, unique accessible headings, fragment-anchor navigation, reading-column
geometry, overflow, catalog boundary/outcome/negative text and no-JavaScript
fragment navigation. It separately checks Privacy's single boundary list,
Crossover's embedded SQL instrument and Ask's recorded refusals.

The existing route suites continue to verify each project's distinctive proof.
The EOD download check and Privacy request-origin checks use the configured test
origin so isolated worktrees can run their suites on separate ports.

The protected task-F13a report and four local-analytics review screenshots are
outside the edit set. No evidence file, metric, hash, pipeline or publication
gate is changed by this task.

### Local results — 2026-09-05

- Production build, typecheck, lint, evidence verification, R2 source verification,
  heavy-asset verification, localization, Chinese glyph coverage and link checks
  passed. Lint reports three warnings in unchanged recording scripts;
  localization reports eleven warnings in existing instrument controls; the
  link check reports LinkedIn's HTTP 999 response as one warning.
- The report suite passed **62 tests**, with **4 viewport-independent duplicates
  skipped**, across English/Chinese and 1440/1024/390 px viewports. Static HTML,
  native keyboard anchors and operation without JavaScript passed. The before
  and after screenshot matrices each cover 60 views; all measured views have
  no horizontal overflow. Visual review covered every project in desktop
  English and mobile Chinese.
- `npm audit --omit=dev` reports **0 vulnerabilities**. Homepage Lighthouse
  scores are **93 performance / 100 accessibility / 100 best practices /
  100 SEO**.
- All ten project routes pass their resource ceilings. `verify:performance`
  still fails on two inherited provisional initial-JavaScript ceilings; a
  clean build of the unchanged integration commit confirms both overages.
  The existing ceilings are retained:

  | Route | Ceiling, gzip bytes | Integration baseline | G-02 | Change |
  | --- | ---: | ---: | ---: | ---: |
  | `/` | 183,605 | 185,310 | 185,206 | −104 |
  | `/artifact` | 230,358 | 230,999 | 230,811 | −188 |

  Both routes pass their route-owned JavaScript ceilings. The remaining
  initial-budget gap belongs in the integration follow-up.
- The full existing end-to-end regression matrix is reserved for the
  integration branch, as directed by the coordinator. Local browser checks
  used the isolated port 4184; no shared 4173 server was used.
