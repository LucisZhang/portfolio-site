# Task R8 — phrase-aware zh line breaking for display type (checklist A2)

Owner problem: default CJK wrapping breaks between any two han characters, so
display-type zh (serif headings, hero lines, stat labels) split words across
lines (同一个词拆成两行).

## Approach

- `src/lib/zh-phrase.ts` — pure chunker over `Intl.Segmenter("zh-Hans",
  { granularity: "word" })`. Rules on top of raw segments:
  - closing punctuation / `%` / dashes merge LEFT (never start a line);
    opening brackets/quotes attach RIGHT (never end a line);
  - latin/digit runs with no interior whitespace stay ONE chunk (`1,450`,
    `66.35%`, `verify:r2-sources` gain no new break points; whitespace keeps
    normal inter-word breaks);
  - single-han-char chunks (ICU emits 这/条/出/再… as words) merge into the
    following chunk — 这条 / 链路 / 出问题 / 再修—— stay whole. The pass only
    removes break opportunities, never adds one;
  - guard: any chunk > 8 code points passes through unwrapped (browser-default
    breaking; no overflow at 390w).
  - No CJK, or no `Intl.Segmenter` in the runtime → original string returned
    unchanged (en byte-identity + graceful old-browser fallback).
- `src/lib/zh-wrap.tsx` — React layer: `zhWrapText(string)` and
  `zhWrapNode(node)` (walks the `<>…<br/><em>…</em></>` title pattern; only
  Fragment/em/strong/b/i/span/mark/small recursed; code/a/components left
  alone). No hooks, no client JS of its own; zh renders only post-hydration
  (`useSyncExternalStore` server snapshot is en), so no SSR mismatch.
- CSS (`src/app/globals.css`): `.zh-seg { display: inline-block !important; }`
  (important is load-bearing: `.forge-hero-metric span` et al. style all
  descendant spans `display:block|flex` at 0,1,1 and stacked segments
  vertically without it — caught at 390w); `:lang(zh) { line-break: strict; }`
  for remaining zh body prose; `text-wrap: pretty` on zh
  `.exhibit-intro/.exhibit-finding-body/.cn-gloss/.home-hero-zh`.
  `.exhibit-title` keeps its existing `text-wrap: balance` (right shape for
  2–3-line display assertions; verified working with inline-block segments).

## Where applied

Shared components (site-wide coverage): `Exhibit` (title + eyebrow),
`Finding` (children), `StatGrid` (labels), `ProjectProofSection` (title).
Raw `exhibit-title`/gloss/eyebrow sites (zh branch only): Hero (home-hero-zh),
ForgePage, TriagePage, CreditPage + triage/credit sub-exhibits
(KnownFailures, FrontierPareto, DriftChart, CreditPolicyFrontier,
CreditDecisionBoundary, CreditNegativeResults), PrivacyPage, GuardianPage,
EodPage, Margin* (4), Ragdiff* (3), Crossover*/SqlWorkbench (3).
Deliberately NOT applied: `LocalizedText` in `src/lib/i18n.ts` — it sits in
the layout-level chunk every route pays for; wrapping there pushed /artifact
initial over its 226,500 ceiling (+634 gzip B) to benefit only the single
remaining legacy slug (analytics-tandem). Reverted with a comment in place.

## Gates (final tree)

- `npx tsc --noEmit` PASS; `npm run lint` PASS (0 errors; 11 pre-existing
  warnings, all in untracked scripts/tmp helpers).
- `npm run build` PASS.
- `node scripts/verify-performance-budget.mjs` PASS 12/12 — home route-own
  17,037 ≤ 50,000 hard; note /artifact initial 226,498 vs 226,500 ceiling
  (2 gzip bytes headroom; pre-existing tightness, and the clean 35fb2df
  baseline worktree measured over-ceiling at 227,016 in this environment).
- `npm run check:localization` PASS (numeric parity holds — wrapper changes
  wrapping only, textContent identical; reassembly asserted in unit harness).
  Two operational findings: (a) the gate needs a server already listening on
  127.0.0.1:4173 (check-localization.mjs does not start one; earlier green
  runs rode on the e2e webServer being up); (b) verify-zh-glyphs scans
  src/**/*.ts(x) BYTES, so the first version of zh-phrase.ts failed the gate
  — its OPENERS literal and comments introduced 9 codepoints (angle/corner
  brackets, U+6C49...) the subset font never carried. Fixed by writing all
  han/CJK-punctuation in these lib files as \u escapes / ASCII comments
  (runtime-identical; program data must not inflate the font corpus).
- e2e `home-r2.spec.ts` + `triage-r2.spec.ts` PASS.

## en locale unchanged

Hydrated DOM of `/` and `/ai/triage-router` (en), baseline 35fb2df build vs
this build: `<body>` byte-identical (scripts stripped, since flight payload
embeds content-hashed chunk names). Only head change: one additional
`<link rel="stylesheet">` — Next split the edited CSS into one more chunk;
inherent to any CSS change, plus routine hashed-asset/buildId churn.

## Visual verification

`output/r3-align/zh-wrap-shots/` — {home,forge,triage,credit}-{390w,1440w}.png
(zh locale, full page; lang=zh-CN and .zh-seg presence asserted per shot:
76/188/289/340 segments after the single-char merge pass). Element-level crops inspected at 390w + 1440w:
no mid-word splits in titles/hero/gloss/findings/stat labels; punctuation
never opens a line; numbers and latin runs intact; no overflow, no stretched
gaps; found + fixed the forge metric-band vertical-stack regression.
Residual: blind pair-merge can form cross-word units in long body-ish finding
prose (e.g. 率从) — those breaks existed pre-change; net break-set is a
strict subset of before.
