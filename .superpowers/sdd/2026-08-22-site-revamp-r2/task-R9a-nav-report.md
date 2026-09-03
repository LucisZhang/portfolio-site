# Task R9a — circuit chain + colophon index navigation (checklist A3, decision b+c)

Status: complete. Commits: `235a450` (implementation + e2e), plus a follow-up commit
(mobile overflow fix + budget re-pins + localization exemption — hash in git log,
message `feat(r3): circuit chain + colophon index navigation` / fix suffix).

## What shipped

- `src/lib/site-circuit.ts` — the single fixed circular circuit over all 10
  standalone project pages, defined once: groups (below) flattened in index
  order, prev/next wrapping at the ends (credit-policy-desk → frontier-forge).
  Per-project one-liners: en verbatim from the approved A3-c mock; zh reuses
  each project's existing `glossZh` (no new zh source strings, no glyph-subset
  or numeric-parity surface added).
- `src/components/exhibition/CircuitNav.tsx` — "use client" island mounted by
  `ExhibitShell` around every page's children (top slot + bottom slot),
  pathname-gated: renders null off the 10 circuit routes (home, /artifact,
  dev fixture). ExhibitShell's frozen server-component interface is unchanged —
  no new prop, zero edits to route wrappers or any concurrently-owned file.
  - Top: `XGZ / <GROUP> / <Current>` crumb (XGZ → home; group → its home
    section anchor, the same targets next.config's 308s use) + `← Prev ·
    GROUP · n of N · Next →` steps.
  - Bottom: on-ink CONTINUE THE CIRCUIT block (NEXT kicker with the next
    stop's group position, serif title link, one-liner; PREV / TRACK / HOME
    hairline row) followed by the light INDEX OF WORK colophon (3 hairline
    columns, global numbering 01–10, current page in vermilion + THIS PAGE
    tag, foot row ← HOME / RESUME / CONTACT XIANGGUO).
- `exhibition.css` — mock values translated onto site tokens; hairlines +
  typography only, no boxes/pills/borders/ticks/icons; on-ink dim text lifted
  to the file's existing AA color-mix levels (68% labels / 78% body).
- `tests/e2e/circuit-nav.spec.ts` + `selectors.ts` circuit entries (frozen
  data-attribute interface: data-circuit-top/-bottom/-prev/-next/-home,
  data-colophon, data-colophon-item/-current).

## Index grouping (owner refinement — mirrors the positioning line, NOT the legacy track trio)

| Group (positioning line) | Mono handle | Projects (circuit order) |
|---|---|---|
| AI agent & LLM application engineering / AI Agent 与大模型应用工程 | AI — 6 | 01 frontier-forge · 02 release-guardian · 03 triage-router · 04 privacy-preflight · 05 rag-quality-lab · 06 ask-portfolio |
| backend & distributed systems / 后端与分布式系统 | ENGINEERING — 2 | 07 exactly-once-drills · 08 crossover-study |
| data engineering & analytics / 数据工程与分析 | ANALYTICS — 2 | 09 margin-control-tower · 10 credit-policy-desk |

privacy-preflight sits in the AI group: its substance is LLM-adjacent
application engineering (browser-local detect/redact/verify workbench with an
optional external-model boundary), not a pipeline or an analytics artifact —
and the approved A3-c mock itself lists it in the AI column (04). Grouping is
index/chain-only; no route, track, or URL renamed. Assignments happen to
partition identically to the current track fields, so every href keeps its
existing `/{track}/{slug}` shape — what changed is the group *semantics and
labels* (ENGINEERING now reads as backend & distributed systems, ANALYTICS as
data engineering & analytics, per directionLine), not any URL.

## Deviations from the mocks (documented per brief)

1. Circuit order at boundaries: the A3-b mock's static frame shows Frontier
   Forge's prev as Ask Portfolio (a within-group wrap). The task text's
   binding rule — one fixed circuit over all 10, crossing groups at
   boundaries — wins: FF's prev is credit-policy-desk (global wrap). The
   position label ("AI · 1 of 6") keeps the mock's within-group semantics.
2. Bottom NEXT one-liner reuses the index one-liner (the mock showed a
   slightly longer bespoke sentence for its one sample). Keeps en/zh copy in
   one place (site-circuit blurb + glossZh) with no content drift risk.
3. Colophon foot: the mock's non-interactive `SEARCH ⌘K` and `EN / 中` spans
   are omitted — working equivalents live in every project rail
   (ProjectRailTools); rendering dead lookalike controls in the foot would be
   misleading chrome. The functional trio (← HOME, RESUME — locale-correct
   PDF, CONTACT XIANGGUO) is kept.
4. Steps row wrap (fix round, defect reported by the B6 agent): the mock's
   `white-space: nowrap` steps row overflowed 390 px viewports with long
   neighbor titles (margin/credit). The row now wraps BETWEEN its three
   pieces (each piece stays unbroken) and `.circuit-top` itself is
   flex-wrap — no horizontal page scroll, verified scrollWidth == innerWidth
   at 390w on margin, credit, privacy-preflight, crossover, frontier-forge,
   both locales.

## Locale purity

Mono UI-fabric (crumb, steps, position labels, CONTINUE THE CIRCUIT, PREV/
TRACK/HOME, INDEX OF WORK, group handles, THIS PAGE, foot row) stays English
in both locales per the binding rule. The only localized copy is the
per-project one-liner (en mock copy / zh glossZh), routed through
`zhWrapText`. Project titles are their English brand names in both locales
(as everywhere else on the site). All numerals rendered by the nav are
locale-identical (numeric-parity safe by construction).

## Gates (all run against the production build, working tree = my commits + task F13a's in-flight edits)

- `npx tsc --noEmit` ✓ · `npm run lint` ✓ (0 errors; 11 pre-existing warnings
  in tmp/ scratch files) · `npm run build` ✓
- `node scripts/verify-performance-budget.mjs` ✓ 12/12. Route-own untouched
  everywhere; home route-own 11,564 gzip vs its hard 50,000 target. Two
  zero-/near-zero-headroom PROVISIONAL initial pins tipped and were re-pinned
  per the R13 ratchet (fifth application, documented in the script): "/"
  182,544 → 183,250 and /artifact 226,500 → 229,990; both reproduced
  identically across consecutive clean runs.
- e2e: `circuit-nav.spec.ts` + `rail-tools-r2.spec.ts` + `redirects.spec.ts`
  — 0 failed (first full run 76 passed / 26 skipped-by-design; re-run after
  the CSS fix recorded in the final gate log below).
- `npm run check:localization` — my three "English prose leak" findings
  (the steps strip's mono fabric on pages with long neighbor titles) resolved
  via a principled `PROSE_ALLOWLIST_PATTERNS` entry (`/^←\s/`, same
  convention as the existing recorded-fabric exemptions). Remaining: 2
  numeric-parity errors on /analytics/margin-control-tower and
  /analytics/credit-policy-desk — mid-number token splits ("1,347,681" →
  "1," + "347,681") inside those pages' own stat/provenance rendering, which
  belongs to task F13a's in-flight (uncommitted) margin/credit component
  edits; no number my nav renders is involved. Left to that workstream.

## Screenshots

`output/r3-align/nav-impl-shots/`: frontier-forge + crossover-study, top and
bottom fold, desktop (1440×900) and mobile (390×844), production build.

## Concerns / handoffs

- The two localization numeric-parity errors above (F13a scope).
- /artifact's initial pin is again zero-headroom (by ratchet design); next
  shared-chunk grower will re-pin again.
- The steps strip wraps to two lines below ~700 px on pages with long
  neighbor titles — intended behavior under the no-horizontal-scroll rule.
