# Task: home route-own JS budget trim

## Failure

`node scripts/verify-performance-budget.mjs`:

```
/ initial gzip 186288 > 182544 (provisional ceiling)
/ route-owned gzip 50707 > 50000 (HARD plan target, Ruling R11, not loosenable)
```

All other routes passed at diagnosis time.

## Diagnosis: byte attribution

Ran the route's own capture methodology standalone (same intersection-of-15-routes
logic `verify-performance-budget.mjs` uses) to get the exact file list behind
`/`'s measured numbers. `/`'s family ("home") is a singleton, so its
"route-own" bucket is *everything not shared by all 15 measured routes*:

| file | gzip | raw | role |
|---|---:|---:|---|
| `static/chunks/8465-*.js` | 28,706 | 67,499 | project catalog data (`src/lib/projects.ts`) — shared with `/ai`, `/artifact`, `/ai/rag-quality-lab`, etc. |
| `static/chunks/app/page-*.js` | 12,435 | 35,216 | home page's own component tree, incl. `home-stats.ts` (STAT_TEXT_ZH) and `ask-question-bank.json` |
| `static/chunks/1819-*.js` | 6,032 | 15,885 | **next/image runtime** — pulled in solely by `WeChatContact.tsx` |
| `static/chunks/8500-*.js` | 3,534 | 8,734 | next/navigation internals |
| **total route-own** | **50,707** | | matches the failing measurement exactly |

Needed trim: both constraints reduce to the same requirement once you note
`initial ⊇ route-own` for these four files — cutting *X* gzip bytes from
route-own cuts *X* from initial too. `initial` needed ≥3,744B cut;
`route-own` needed ≥707B. Binding constraint: **≥3,744 gzip bytes**, sourced
from the route-own set.

### Candidates investigated and ruled out

- **F11 (`STAT_TEXT_ZH` / `assertStatTextCoverage`, `src/lib/home-stats.ts`)**:
  genuinely small (the whole lookup table is a few hundred bytes of the
  12,435B page chunk) and the site does live client-side locale switching
  (`src/lib/i18n.ts`'s `LanguageProvider`, no page reload) — the table must
  ship client-side for the toggle to work. Not moveable server-side without
  breaking the instant-toggle feature. Left alone.
- **F13b (`src/lib/ask-question-bank.ts` / `AskPortfolioInline.tsx`)**: this
  module eagerly imports the *entire* 11-route `ask-question-bank.json`
  (7,333B raw) just so `AskPortfolioInline` can read home's 3 questions —
  a genuine "accidental over-import" (~2,000 gzip bytes wasted). Real, but
  not large enough alone, and splitting the generated JSON touches the
  question-bank generator/test surface. Not pursued once the next candidate
  supplied a full, single-file fix.
- **`artifactViewerHref` / homepage receipts (commit cb11fdc)**: verified as
  a build-time-only script change (`scripts/generate-home-data.mjs`) — it
  never touches client code, home components read `receiptHref` as a plain
  string. Ruled out; contributes 0 bytes to the client bundle.
- **`src/lib/projects.ts` catalog split** (moving `architecture` /
  `provenance` / `boundaries` / `fieldNotes` / `problem` / `audience` /
  `role` / `outcome` out of the client-shipped array): this is the single
  biggest chunk (28,706 gzip) and those fields genuinely aren't rendered by
  any home/track component. **Ruled out anyway**: `src/lib/portfolio-search.ts`
  (which powers the sitewide ⌘K command palette, reachable from every
  route including home) indexes those exact fields for full-text search.
  Stripping them would silently shrink search coverage — real feature loss,
  and a 50+-file blast radius outside "homepage + its data modules" besides.

### Root cause identified: `next/image` pulled in for a click-gated QR modal

`WeChatContact.tsx` (rendered unconditionally in `Hero.tsx`) was the *only*
reachable-from-home component importing `next/image` — confirmed by
grepping every home/exhibition component for `next/image`/`next/navigation`
usage (zero hits) and then finding `next/image` imported directly in
`WeChatContact.tsx`, used only inside a dialog that's gated behind
`{open ? (...) : null}` (opened by clicking the "WeChat" button). This forces
next/image's entire client runtime (chunk `1819`, 6,032 gzip / 15,885 raw)
into the home route's *initial* JS for a QR code nobody sees before an
explicit click — the textbook "ship an interaction-gated dependency eagerly"
bug.

## Fix attempted first, then reverted: `next/dynamic()` split

Split the modal into `WeChatModal.tsx` and loaded it via
`next/dynamic(() => import("./WeChatModal"), { ssr: false })` — the same
pattern already used by `AssistantLauncher.tsx` for `AssistantWidget`. This
fixed `/` (initial 181,586 / route-own 45,968, both under ceiling) but
**broke `/artifact`** by 37 gzip bytes over its own zero-headroom
`initialCeiling` (226,471). Root-caused precisely: any *new* webpack async
`import()` boundary adds one entry to the shared runtime chunk's `l.u()`
chunk-id-to-URL resolver (`webpack-*.js`), which is loaded by *every* route.
Diffed the two webpack runtime chunks byte-for-byte and confirmed the only
change was one new ternary branch for the new chunk id — +74 raw / +37 gzip
bytes, reproduced deterministically. Since `/artifact`'s ceiling carries
zero headroom by design (comment in `verify-performance-budget.mjs`: "pinned
at the exact route-own GZIP bytes measured at re-pin time"), *any* brand-new
split point anywhere in the app tips it over, and re-pinning it is out of
scope ("NO ceiling edits" — that decision belongs to the controller, per the
script's own documented R13 precedent for this exact class of incidental
shared-code movement).

## Fix shipped: drop `next/image`, plain `<img>` for the QR code

Reverted the dynamic-import split. Kept `WeChatContact.tsx` as one file,
removed the `next/image` import outright, and replaced `<Image>` with a
plain `<img>` carrying the same `src`/`alt`/`width`/`height` (no layout
shift; the modal is `priority`-loaded today anyway, i.e. never lazy). This
removes the entire next/image dependency from home's import graph — no new
async chunk, no runtime-table growth, zero measured side effect on any other
route (verified: full 15-route capture, and a byte-for-byte A/B rebuild of
`/artifact` with the fix present vs. reverted produced *identical* totals).

Only file changed: `src/components/WeChatContact.tsx`.

**What this costs**: next/image's automatic AVIF/WebP negotiation and
responsive `srcset` for this one JPEG. The feature itself (view + copy
WeChat ID via QR code, same dialog, same focus/Escape/copy behavior) is
byte-for-byte unchanged; verified against `tests/e2e/quality.spec.ts`'s
"homepage contacts and WeChat QR variants follow locale" test, which asserts
on the button labels, `alt` text, and `src` pattern — all preserved.

## Before / after

Measured via `node scripts/verify-performance-budget.mjs`, `/` row only
(the working tree has a second agent concurrently landing unrelated commits
across other routes throughout this task, so absolute numbers on *other*
routes drift run to run; the delta attributable to this fix was isolated
with a controlled rebuild — reverting only `WeChatContact.tsx` while holding
everything else in the tree fixed):

| | initial (gzip) | route-own (gzip) |
|---|---:|---:|
| Before (failing) | 186,288 (ceiling 182,544, **+3,744 over**) | 50,707 (ceiling 50,000, **+707 over**) |
| After (this fix) | 180,775 (margin 1,769) | 45,193 (margin 4,807) |
| Isolated delta from this one-file change | ~5,513 | ~5,514 |

Both home constraints now pass with real headroom, not a zero-headroom
squeak.

## Verification run

- `npm run build`: succeeds.
- `node scripts/verify-performance-budget.mjs`: `/` passes
  (initial 180,775 ≤ 182,544; route-own 45,193 ≤ 50,000). **One remaining
  failure, `/artifact` initial 226,472 > 226,471 (+1 byte)** — see below.
- `npx tsc --noEmit`: clean.
- `npx eslint src/components/WeChatContact.tsx`: clean.
- `npm run check:localization`: the chain-order test and `check-localization`/
  `verify-zh-glyphs` steps pass; `lint-copy.mjs` reports one pre-existing
  finding in `src/components/eod/EodPage.tsx` (a different agent's
  in-progress file, not touched by this task).
- `npx playwright test home-r2 --project=desktop --project=mobile`: **49
  passed, 7 skipped, 0 failed** on the final tree state. (An interim run
  mid-task showed 9 failures — reproduced as a transient state of the
  concurrently-edited tree, not caused by this change: re-running with
  `WeChatContact.tsx` reverted against that exact same interim tree state
  also passed all 49, and re-running with the fix applied against the
  now-settled tree also passes all 49.)

## Concern: `/artifact` fails by 1 byte, not caused by this fix

`node scripts/verify-performance-budget.mjs` currently reports one
remaining failure outside this task's scope:

```
/artifact initial gzip 226,472 > 226,471
```

Proven independent of this change by controlled A/B rebuild in the same
tree state (same node_modules, same generated data, only
`src/components/WeChatContact.tsx` toggled between the fixed and original
version): **`/artifact`'s total gzip byte count was identical (226,472) in
both cases**, and identical across 3 repeated rebuilds each way. `/artifact`
does not load any of the files this fix touches (its own chunk-by-chunk
byte listing is unchanged with vs. without the fix).

Working theory: another agent is concurrently landing changes across
`src/app/ai/frontier-forge/page.tsx`, `src/app/ai/privacy-preflight-mac/page.tsx`,
`src/app/ai/release-guardian/page.tsx`, `src/app/ai/triage-router/page.tsx`,
`src/app/engineering/exactly-once-drills/page.tsx`, and
`scripts/verify-performance-budget.mjs` itself throughout this task (none of
these were modified when this task started; all appeared mid-task per
repeated `git status` checks). `/artifact`'s `initialCeiling` (226,471) is a
zero-headroom pin per the script's own R13 precedent, and any unrelated
shift in the whole-app webpack module graph — which is exactly what
concurrent edits to five other route-entry files would cause — can tip a
zero-headroom pin by a byte or two without anyone touching `/artifact`
itself, the same class of side effect this task's own `next/dynamic()`
attempt (see above) demonstrated causes cross-route drift.

This is outside this task's domain (`/artifact` is not homepage code, and
the implicated files belong to the other agent's concurrent work — not
`src/components/analytics/**` or the named excluded test specs, but
adjacent enough that editing them was never this task's job). Not fixed
here; flagged for the controller to re-check once the other agent's work
lands and the tree settles, and to decide whether `/artifact`'s ceiling
needs a controller-authorized re-pin at that point (same R13 process already
used twice in this file's history).

## Commit

`perf(r2): trim home route-own under plan budget` — stages only
`src/components/WeChatContact.tsx` (exact-path).
