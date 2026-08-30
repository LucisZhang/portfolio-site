# Task F14: rail chrome trio on standalone project pages

Branch `codex/site-revamp-r2-20260822`, starting HEAD `1d9fc43`. Goal: give all 10 standalone
project pages' rails the SEARCH ⌘K / EN·中 / contact trio home's rail already ships, without
repeating task-suite-reconcile's reverted attempt.

## The failed attempt, re-examined

task-suite-reconcile tried `railTools={<LegacyRailTools />}` on all 10 routes. It built and
typechecked clean, but `node scripts/verify-performance-budget.mjs` showed it pushed `/`'s
route-own bundle from 45,193 to 50,707 gzip bytes — over Ruling R11's hard, never-loosened 50,000
ceiling — via an apparent webpack shared-chunk shift. It was reverted in full.

Reading `LegacyRailTools.tsx`: it renders four things — `<LocaleLink href="/">Home</LocaleLink>`,
`CommandPaletteLauncher`, `LanguageSwitcher`, `FooterContactLink`. Home's own `HomeRailTools.tsx`
already mounts the latter three directly (not through `LegacyRailTools`). The one piece
`LegacyRailTools` adds that home's own bundle doesn't already pay for is the `LocaleLink` Home
link — which pulls in `next/link`'s client runtime (`useLinkStatus`) plus `react-dom`'s
`createPortal` for its pending-navigation indicator. That import graph was the prime suspect for
why extending `LegacyRailTools`'s consumer set from ~3 routes to 13 disturbed webpack's automatic
chunk-splitting decisions enough to land new bytes on `/`.

## Approach chosen

New component `src/components/exhibition/ProjectRailTools.tsx` mounts **only** the three leaf
client modules `HomeRailTools` already mounts — `CommandPaletteLauncher`, `LanguageSwitcher`,
`FooterContactLink` — via `@/lib/projects`' `tracks`/`featuredProjects` (the same data home's own
rail tools already pull in). No `LocaleLink`, no extra "Home" link: every project rail already
carries `{ label: "← ALL WORK", href: "/" }` in its own `rail.footer`, so a second Home link would
be a duplicate, not a fix. ASK/RESUME stay homepage-only per spec §2.1, so this is a plain
three-item trio, not a copy of `HomeRailTools`.

Wired via `railTools={<ProjectRailTools />}` into all 10 standalone `page.tsx` files (9 in
`mode="auto"`, one — `ai/privacy-preflight-mac` — in the default `mode="fixed"`). Neither
`src/app/page.tsx`, `HomeRailTools.tsx`, nor `home.css` was touched.

CSS lives entirely in `src/components/exhibition/exhibition.css` as a new `.project-rail-tools`
block — a duplicate (not a shared reference) of `home.css`'s `.home-rail-tools` visual grammar
(mono, uppercase, ink-invert background/foreground, border-top hairline, 44px touch targets under
980px), re-parented into the rail's bottom band the same way `home.css`'s
`.exhibit-rail-tools:has(.home-rail-tools)` rule re-parents `HomeRailTools`. Deliberately kept out
of `home.css` so this task never had to touch the one file most implicated in the prior
regression.

Locale-preserving behavior (spec §2.5) needed no new code: `LanguageSwitcher`'s `setLocale` already
resolves to `src/lib/i18n.ts`'s `setStoredLocale`, which rewrites only the `lang` query param via
`window.history.replaceState(..., url.pathname + url.search + url.hash)` — pathname and hash
always round-trip untouched, on every route, with zero per-page wiring.

## Why this avoided the regression

Both attempts add the same three shared leaf modules to the same 10 new routes. The difference is
that `ProjectRailTools` and `HomeRailTools` are now **structurally identical consumers** of those
three modules (same imports, no extra module unique to one side), so webpack's automatic
chunk-splitting settled on putting `CommandPaletteLauncher`/`LanguageSwitcher`/`FooterContactLink`
into the **globally shared** chunk (referenced by all 12 measured routes — home, all 10 projects,
and `/artifact`, which already used `LegacyRailTools`) instead of shifting bytes onto any one
route's own bundle. `verify-performance-budget.mjs` computes each route's "route-own" bytes as its
JS minus the intersection across all routes, so once a module is in that intersection it stops
counting against anyone's route-own — including home's.

## Budget: before → after (gzip bytes)

| Route | route-own before | route-own after | initial before | initial after | ceiling notes |
|---|---:|---:|---:|---:|---|
| `/` | 45,193 | **16,456** | 180,775 | 180,744 | hard 50,000 ceiling — now 33,544 bytes of headroom, not zero |
| `/ai/frontier-forge` | 21,802 | 23,047 | 157,384 | 187,335 | target policy, well under 80,000/240,000 |
| `/ai/release-guardian` | 16,143 | 16,835 | 151,725 | 181,123 | provisional ceiling 93,028 — huge headroom now |
| `/ai/rag-quality-lab` | 45,113 | 17,627 | 180,695 | 181,915 | provisional ceiling 91,348 |
| `/ai/triage-router` | 28,414 | 29,587 | 163,996 | 193,875 | target route-own (80,000) |
| `/ai/privacy-preflight-mac` (fixed rail) | 35,090 | 35,697 | 170,672 | 199,985 | target route-own (80,000) |
| `/engineering/exactly-once-drills` | 21,030 | 22,279 | 156,612 | 186,567 | target policy |
| `/analytics/margin-control-tower` | 70,354 | 43,139 | 205,936 | 207,427 | provisional ceiling 132,667 |
| `/engineering/crossover-study` | 43,733 | 16,322 | 179,315 | 180,610 | provisional ceiling 59,407 |
| `/analytics/credit-policy-desk` | 70,911 | 43,497 | 206,493 | 207,785 | provisional ceiling 101,257 |
| `/ai/ask-portfolio` | 45,498 | 17,976 | 181,080 | 182,264 | target policy |
| `/artifact` | 90,890 | 62,212 | 226,472 | **226,500** | re-pinned, see below |

`/`'s route-own **fell** 45,193 → 16,456 — the fix, not a regression. Every provisional
project-route `routeOwnCeiling` still passes with new headroom; none needed tightening (ratchet
convention: "may only tighten, never loosen" — leaving them as-is is compliant, tightening them is
optional cleanup out of this task's scope).

One legitimate bystander: `/artifact`'s **initial** (not route-own — that fell 90,890 → 62,212)
grew 226,472 → 226,500 (28 bytes) at an already-zero-headroom pin, from the same global
shared-chunk reshuffle (`/artifact` already used `LegacyRailTools`, so it wasn't touched by
`ProjectRailTools.tsx`'s new import graph directly — just a bystander of the chunk-boundary shift).
Reproduced identically across two consecutive clean runs before re-pinning
`scripts/verify-performance-budget.mjs`'s `/artifact` `initialCeiling` 226,472 → 226,500 (R13
pattern, applied a fourth time in this script's history; purely provisional policy, never home,
never a plan-target route).

Final `node scripts/verify-performance-budget.mjs`: **passed, 12/12 routes.**

## Tests added

New `tests/e2e/rail-tools-r2.spec.ts` (13 tests × 3 viewport projects = 39 runs, all green):
- One iterating test across all 10 standalone routes asserting `.project-rail-tools` mounts
  exactly once and exposes visible Search/EN/中/Contact controls — runs across the
  desktop/tablet/mobile Playwright projects, which is what actually exercises the fixed sidebar
  (>=980px), the auto-rail slide-out, and the <980px flowed-in-place mobile placement (all three
  share the same DOM node; only CSS decides visibility per viewport).
- Two dedicated "palette opens" tests — one from the fixed-rail route (`privacy-preflight-mac`),
  one from an auto-rail route (`credit-policy-desk`) — covering both rail modes explicitly.
- One "EN·中 preserves path and hash" test on `/ai/triage-router#exhibit-02`: asserts the URL
  becomes `?lang=zh#exhibit-02` (same path, same hash) and that the toggle is functionally live
  (button label switches to `搜索`), then round-trips back to English on the same page/hash.

Also added `SEL.projectRailTools` (`tests/e2e/selectors.ts`) alongside the existing
`SEL.homeRailTools`.

Restored `tests/e2e/search-ranking.spec.ts`'s "search history stays local, bounded, persistent,
and isolated by browser context" test to reopen search by reloading the actual destination project
page (`/analytics/credit-policy-desk`) again, undoing task-suite-reconcile's workaround (which had
retargeted it to reopen from `/` because no project route had a Search button at all). Trimmed the
now-resolved explanatory comment to a one-line pointer at this task.

## Final verification

- `npx tsc --noEmit`: clean.
- `npm run lint`: clean (0 errors, same 11 pre-existing scratch-script warnings, none in `src/` or
  `tests/`).
- `npm run build`: clean, 21 routes.
- `node scripts/verify-performance-budget.mjs`: passed, 12/12 routes (home route-own 16,456 —
  comfortably under the hard 50,000 ceiling).
- `npm run check:localization`: exit 0, 0 errors (11 pre-existing warnings, unrelated to this
  task's files — model/tier-label names on frontier-forge/exactly-once-drills/crossover-study/
  release-guardian/privacy-preflight-mac/triage-router, none touching `ProjectRailTools` or its
  copy).
- Full `npx playwright test`: **639 passed, 198 skipped, 0 failed** (10.9m).

## Files changed

- `src/components/exhibition/ProjectRailTools.tsx` — new.
- `src/components/exhibition/exhibition.css` — new `.project-rail-tools` block + comment.
- `src/app/ai/{ask-portfolio,frontier-forge,privacy-preflight-mac,rag-quality-lab,
  release-guardian,triage-router}/page.tsx`,
  `src/app/analytics/{credit-policy-desk,margin-control-tower}/page.tsx`,
  `src/app/engineering/{crossover-study,exactly-once-drills}/page.tsx` — import +
  `railTools={<ProjectRailTools />}`.
- `scripts/verify-performance-budget.mjs` — `/artifact` `initialCeiling` re-pin (226,472 →
  226,500) with inline justification.
- `tests/e2e/rail-tools-r2.spec.ts` — new.
- `tests/e2e/selectors.ts` — `SEL.projectRailTools`.
- `tests/e2e/search-ranking.spec.ts` — restored the search-history test's original reload-in-place
  flow now that the gap is fixed.

Not touched: `src/app/page.tsx`, `src/components/home/HomeRailTools.tsx`, `src/components/home/
home.css`, `src/components/exhibition/LegacyRailTools.tsx`.

## Fix round 1 (review verdict: NEEDS FIXES — one Critical, one Important)

Landed on top of `c28664d`, no amend/rebase (concurrent commits `981060d`/`4d48ffd` from the
docs-only agent already sat between this task's starting HEAD and `c28664d`).

### Critical: orphaned floating trio after auto-rail retract

`ExhibitShell.tsx` renders `railTools` as a **sibling** of `.exhibit-rail-fixed`, both children of
`<nav class="exhibit-rail">` — not a descendant of `.exhibit-rail-fixed`. `RailAuto.tsx`'s
`.rail-collapsed` class only ever `translateX(-100%)`s `.exhibit-rail-fixed` itself. The trio's own
wrapper (`.exhibit-rail-tools`, `position: fixed; bottom:0; left:0`) was never touched by that
class, so on any of RailAuto's documented off-rail signals (content click, accumulated scroll,
Esc, hover-out) the rail panel slid away while the trio stayed exactly where it was — a solid
ink-invert rectangle floating over page copy, clipping text and intercepting clicks on content
underneath it. Reviewer reproduced live on `/ai/frontier-forge` with a single content click.
Reproduced independently the same way before fixing.

**Approach considered and rejected:** nesting `railTools` inside `.exhibit-rail-fixed` so it
inherits the same transform automatically. Rejected because `.exhibit-rail-fixed` only carries a
real `transform` value while `.rail-collapsed` (none otherwise), and CSS makes a transformed
element the containing block for its `position: fixed` descendants — a nested fixed child would
silently flip between "fixed to the viewport" (open, no transform on the ancestor) and "fixed to
the rail's own box" (collapsed, ancestor has a transform), a subtle, cross-browser-fragile
behavior not worth depending on for a production fix, and one that would have required touching
`ExhibitShell.tsx`'s JSX (shared by all 12 pages including home) rather than staying purely
additive CSS.

**Fix shipped:** gave the trio's own wrapper (`.exhibit-rail-tools:has(.project-rail-tools)`) the
identical `transform`/`transition` treatment `.exhibit-rail-fixed` already uses — same custom
properties (`--rail-out-duration`/`--rail-ease-out` for retract, `--rail-in-duration`/
`--rail-ease-in` for reveal), scoped to `.exhibit-shell[data-rail-mode="auto"]` only (home and
`ai/privacy-preflight-mac` are `mode="fixed"`, no collapse mechanic, unaffected) and additionally
wrapped in `@media (min-width: 980px)` — belt-and-braces against a stray `.rail-collapsed` class
surviving into a resize-to-mobile race, where this same selector switches to `position: static`
and a `translateX(-100%)` would shift a static full-width block off-canvas instead of being the
harmless no-op it is on the fixed-positioned desktop/tablet box. Added `pointer-events: none` while
collapsed too — redundant with being genuinely off-screen, but a direct, cheap answer to the
reviewer's "intercepting clicks" wording. Deliberately did **not** add the trio to the existing
`.rail-cascade` opacity/rise keyframe group: that keyframe also animates `transform` (translateY),
and layering a CSS `animation` on top of the `transition` this fix already drives on the same
property would have the two mechanisms fight over one property value. The trio isn't one of the
rail's own cascading children (wordmark/nav/footer); sliding in perfectly synchronized with the
panel via the identical transition already satisfies "returns with the rail's re-expand exactly
like the rest of the rail content" without that risk.

All CSS, in `src/components/exhibition/exhibition.css` only — no JS/markup changes, `home.css`/
`HomeRailTools.tsx`/`ExhibitShell.tsx` still untouched.

**Verified live** (throwaway Playwright script, deleted before commit) at all three geometries the
mechanic can reach:

| Viewport | Rail width | Open `x` | Collapsed `x` | Re-expanded `x` | `pointer-events` collapsed |
|---|---:|---:|---:|---:|---|
| Desktop 1440 | 260px | 0 | -260 | 0 | none |
| Tablet 1024 | 208px | 0 | -208 | (not re-checked; same mechanism) | none |
| Mobile 390 | n/a (static, flowed) | 0, full-width | n/a — `.rail-collapsed` never applied | n/a | n/a |

Collapsed `x + width` is exactly 0 at both desktop and tablet — fully left of the viewport, the
same geometry `.exhibit-rail-fixed`'s own retract already relies on, correctly picking up each
breakpoint's own `--exhibit-rail-width` value since `translateX(-100%)` is relative to the
element's own computed width.

### Important: test gap — collapsed state was never exercised

Added a new test to `tests/e2e/rail-tools-r2.spec.ts`, "trio retracts fully off-screen with the
rail on collapse, and returns on re-expand": drives an auto-rail route (`/ai/frontier-forge`) into
`.rail-collapsed` via `page.mouse.wheel(0, 40)` (the same off-rail-signal idiom already used by
`exhibition-shell.spec.ts` and `triage-r2.spec.ts`'s own auto-rail tests), then asserts via
`expect.poll` (rides out the CSS transition rather than racing a fixed timeout):

- the trio's bounding box is fully left of the viewport (`x + width <= 0.5`);
- `pointer-events: none` while collapsed;
- `document.elementFromPoint` at the trio's old bottom-left footprint does **not** resolve inside
  `.project-rail-tools` — a direct regression guard for the reported "intercepting clicks on
  content beneath it" symptom;
- re-expanding via the hot-zone (`[data-rail-hotzone]` hover) returns the box to `x >= -0.5`,
  restores `pointer-events: auto`, and the Search control is visible and interactive again.

Skipped on the `mobile` Playwright project (`testInfo.project.name === "mobile"`) since RailAuto's
collapse mechanic never engages below 980px — matching the same skip pattern already used by
`triage-r2.spec.ts`'s auto-rail test — but **runs on both `desktop` and `tablet`**, which is what
actually exercises the two different rail widths (260px / 208px) and is the direct answer to
"check both desktop and mobile breakpoints — a mismatch is its own defect class."

### Re-verification after the fix

- `npx tsc --noEmit`: clean.
- `npm run build` + `node scripts/verify-performance-budget.mjs`: **passed, 12/12 routes**, all JS
  gzip numbers byte-identical to the pre-fix measurements (this fix is CSS-only) — home route-own
  still 16,456 gzip bytes (hard ceiling 50,000), `/artifact` initial still 226,500 (ceiling
  226,500). Only each route's CSS gzip total grew slightly (~38 bytes), which the script doesn't
  ceiling except for home's 120,000 cap (home CSS: 29,040, comfortably under).
- `tests/e2e/rail-tools-r2.spec.ts` across all three viewport projects: **41 passed, 1 skipped**
  (the new collapsed-state test skipped on `mobile` only, as designed).
- Full `npx playwright test`: **641 passed, 199 skipped, 0 failed** (10.9m) — exactly 2 more passed
  and 1 more skipped than the pre-fix run (639/198), matching the one new test running on
  desktop+tablet and skipping on mobile.

### Files changed (fix round 1)

- `src/components/exhibition/exhibition.css` — auto-rail collapse/reveal choreography for
  `.exhibit-rail-tools:has(.project-rail-tools)`.
- `tests/e2e/rail-tools-r2.spec.ts` — new collapsed-state regression test.
