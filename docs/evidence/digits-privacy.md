# Privacy Preflight digits — number → file → path → SHA-256

G2 register for the Round-2 Privacy Preflight restraint-first reflow (task
3.2, `/ai/privacy-preflight`, spec §6.0 standard-scroll template / §6.4
exhibit script). Every number rendered by `src/components/privacy/*.tsx`
traces to one of these files:

- `public/case-studies/privacy-preflight/ocr-fixture-benchmark.json` —
  11,615 bytes, sha256
  `a783351c3262b70b65a59daf04df0531e8d3756aa6b9f79e7a0f10baad52aeb9`.
  Independently re-verified against `manifest.json`'s own recorded hash for
  the same file.
- `public/case-studies/privacy-preflight/worker-tests-goal-candidate.json` —
  3,061 bytes, sha256
  `97b66536d10ae24186fffe4725e7f10809d0473bd87a486c8068b560ade626c4`.
- `public/case-studies/privacy-preflight/goal-candidate-e2e.json` — 2,949
  bytes, sha256
  `81be1ab28f2d0df8f01cc3df36a423546191334d3b1a0dc908b36da83d9d6c7a` (not a
  `manifest.json`-tracked UI asset — the workbench never fetches it — so
  this hash is a direct `shasum -a 256` result, not cross-checked against a
  second recorded copy).
- `public/case-studies/privacy-preflight/manifest.json` — 6,379 bytes,
  sha256 `cfa56cd3ba453227863bb997c937bfcb41cd6e01e339cf806ac00689eac3aebe`.
- `src/components/privacy/privacyReceipts.ts` — this task's frozen-constant
  adapter (`PRIVACY_RECEIPTS`), mirroring
  `src/components/triage/triageReceipts.ts`'s approach: literal strings
  hand-verified with `shasum -a 256 <path>` rather than a runtime hash, so
  the SOURCE/RECEIPTS exhibit stays a plain static import.
- `src/lib/projects.ts`'s `privacy-preflight` entry — pre-existing,
  previously reviewed content (`role`, `outcome`, `fieldNotes`,
  `boundaries`, `architecture`, `glossZh`) reused verbatim for the hero,
  exhibit 02, exhibit 05, and the report layer; no new numbers originate
  here.

Regenerate/re-verify before re-auditing:

```
shasum -a 256 public/case-studies/privacy-preflight/ocr-fixture-benchmark.json
shasum -a 256 public/case-studies/privacy-preflight/worker-tests-goal-candidate.json
shasum -a 256 public/case-studies/privacy-preflight/goal-candidate-e2e.json
shasum -a 256 public/case-studies/privacy-preflight/manifest.json
node scripts/verify-heavy-assets.mjs
node scripts/verify-r2-sources.mjs
```

No component in `src/components/privacy/` contains a literal OCR benchmark
number typed directly into a `.tsx` file. `PrivacyOcrBenchmark.tsx`,
`PrivacyCompactPreview.tsx`, and `PrivacyPage.tsx`'s hero stat grid all read
`ocr-fixture-benchmark.json`'s `summary` object directly via a static
import (like `src/components/forge/ForgePage.tsx` importing
`release.json`) — this task converted `PrivacyOcrBenchmark.tsx` from a
client-side `fetch()` to this static import specifically so the figures are
also server-rendered with JavaScript disabled (see "No-JS" section below).

## Hero (3-cell stat checkerboard)

| Value | Label | Source file | JSON path |
| --- | --- | --- | --- |
| `96/96` | worker tests passed | `worker-tests-goal-candidate.json` | `$.results.{passed,collected}` |
| `19/19` | OCR fixture hits | `ocr-fixture-benchmark.json` | `$.summary.{hitCount,expectedCount}` |
| `2` | OCR false positives | `ocr-fixture-benchmark.json` | `$.summary.falsePositiveCount` |

Hero paragraph: `project.summary` (`src/lib/projects.ts`,
`privacy-preflight` entry, pre-existing sitewide-audited catalog — same
text used by the homepage's exhibit 02 agent row). Rail zh gloss:
`project.glossZh`, same entry (15 characters, within spec §2.1's
<=20-character rail-gloss budget).

## Exhibit 01 / Hero instrument — PrivacyPreflightLab (reused, pared down)

No new numbers: this exhibit is the live interactive workbench itself
(`PrivacyTextLab.tsx` / `PrivacyImageLab.tsx` / `PrivacyPdfLab.tsx`,
pre-existing, deterministic redaction/validation logic unchanged by this
task — only chrome was pared and the `input` textarea is now prefilled on
mount). Every number a visitor sees here (entity counts, detected-region
counts, hash prefixes) is computed live from the visitor's own input by
`src/lib/privacy-redaction.ts`'s pure functions, the same functions the
worker-test suite covers (96 tests, cited above).

The hero's compact preview (`PrivacyCompactPreview.tsx`) shows the same
`ocr-fixture-benchmark.json` `summary.{hitCount,expectedCount,
falsePositiveCount}` fields as the hero stat grid and exhibit 03 — one
source rendered three times on this page (same pattern
`docs/evidence/digits-forge.md` documents for Frontier Forge's fieldNotes).

## Exhibit 02 — Detect, review, destroy (`PrivacyDetectReviewDestroy.tsx`)

Five pipeline steps read `project.architecture` (`src/lib/projects.ts`)
verbatim via `.map()` — Review / Detect / Redact / Validate / Export, each
with its pre-existing `label`/`detail` pair. No numbers.

## Exhibit 03 — OCR benchmark (`PrivacyOcrBenchmark.tsx`)

All figures read `ocr-fixture-benchmark.json` directly (static import, no
fetch):

| Field shown | JSON path |
| --- | --- |
| Fixture recall (`100.0%`, `19 / 19`) | `$.summary.{recall,hitCount,expectedCount}` |
| Fixture precision (`90.5%`, `2 false positives`) | `$.summary.{precision,falsePositiveCount}` |
| Fixtures (`7`) | `$.summary.fixtures` |
| Per-fixture recall/precision/misses | `$.fixtures[i].{recall,precision,misses}` |

Exhibit eyebrow (`19/19 HITS · 2 FP`) and title assertion both read the
same `$.summary.hitCount` / `$.summary.expectedCount` /
`$.summary.falsePositiveCount` fields via template-literal interpolation in
`PrivacyPage.tsx`, not a typed-in string.

## Exhibit 04 — Fail-closed export (`PrivacyFailClosedExhibit.tsx`)

No numbers from a data file — this exhibit's whole point is a
deterministic, always-failing crafted demonstration. It calls the same
`validateRedaction` / `applyRedactions` functions
(`src/lib/privacy-redaction.ts`) the real workbench uses, against a fixed
input (`"...Contact ada@example.com immediately; ... also
ada@example.com."`) with a hand-built `SensitiveEntity` covering only the
first occurrence. `validateRedaction`'s residual-value check (a real,
pre-existing function, not new logic written for this exhibit) is what
produces `safe: false`, `appliedCount: 1`,
`residualOriginalValues: ["ada@example.com"]` — the "UNSAFE TO EXPORT"
status word and the `--danger` 2px-top-line treatment are read from that
same `craftedValidation.safe` boolean, exactly like the live workbench's
own validation state in exhibit 01.

## Exhibit 05 — Boundary (`BoundaryExhibit` in `PrivacyPage.tsx`)

Three `Finding kind="limitation"` blocks render `project.boundaries[]`
verbatim (same array the report layer's Limitations section renders again
below — spec §6.0's "one source rendered twice" pattern). No new numbers;
the OCR-miss/PDF-limit language already cites the same figures registered
above and in `project.boundaries` itself (20 MB / 20 pages).

## Exhibit 06 — Source & Receipts

`<dl>` reads `PRIVACY_RECEIPTS` (`src/components/privacy/privacyReceipts.ts`)
for the three sha256 lines (`ocrFixtureBenchmark`, `workerTests`,
`browserE2e`) and `PRIVACY_REPRODUCE_COMMAND` for the one reproduction
command shown.

## Report layer (Architecture / Results & negatives / Limitations)

All content reused verbatim from `project` (`src/lib/projects.ts`,
`privacy-preflight` entry, previously reviewed, unchanged by this
task): `architecture[]` (5 steps, same as exhibit 02), `outcome`,
`fieldNotes[]` (2 negative findings — the 19/19-hits-but-21-detections OCR
finding and the macOS-test-count/PyMuPDF-license finding), `boundaries[]`
(3 limitations, same as exhibit 05). No new numbers introduced.

## Absent data (honest `NOT RECORDED` treatment, not fabricated)

None identified for this task. Every figure spec §6.4 asks for (19/19
hits, 2 FP, the fail-closed gate, the detect/review/destroy pipeline) is
present in the frozen `public/case-studies/privacy-preflight/*` evidence
set already shipped by earlier phases — this task's job was reflow and
pare-down of existing, already-verified data, not sourcing new evidence.

## Heavy-asset route/action audit (spec §6.4 byte discipline)

Two heavy-asset roots exist on disk: `public/case-studies/privacy-preflight`
(34 MB — fixture images/PDFs, fetched individually and only on demand by
the workbench's own "Choose file" / sample-load actions, never as a single
bundle) and `public/generated/privacy-ocr` (16 MB — tesseract runtime,
including all three selectable WASM core variants, ~11.7 MB of that 16 MB
root by itself) plus `public/generated/privacy-pdf` (1.7 MB — PDF.js
runtime, not counted in the spec's "16MB" figure but audited here too since
it is the second heavy runtime this page loads).

`heavy-assets.json`'s `/ai/privacy-preflight` entry was extended from
one file (chi_sim) to the full set of files actually requested by an OCR
run or a PDF open, with real on-disk byte counts. Fix (reviewer finding,
Important): the first pass of this audit registered only the SIMD WASM
core variant and described the other two as "not independently registered"
— that undercounted the audited root by ~7.8 MB, roughly half of it. All
three selectable variants are now registered:

| File | Bytes | Loads when |
| --- | --- | --- |
| `public/generated/privacy-ocr/lang/chi_sim.traineddata.gz` | 1,718,768 | Bilingual (English + 简体中文) OCR run only |
| `public/generated/privacy-ocr/lang/eng.traineddata.gz` | 2,952,873 | Any OCR run (English is always included) |
| `public/generated/privacy-ocr/worker.min.js` | 111,307 | Any OCR run (tesseract.js worker script) |
| `public/generated/privacy-ocr/core/tesseract-core-lstm.wasm.js` | 3,896,484 | Any OCR run — the plain (no SIMD) WASM core variant, selected when the browser lacks WASM SIMD support |
| `public/generated/privacy-ocr/core/tesseract-core-relaxedsimd-lstm.wasm.js` | 3,905,767 | Any OCR run — the relaxed-SIMD WASM core variant |
| `public/generated/privacy-ocr/core/tesseract-core-simd-lstm.wasm.js` | 3,899,472 | Any OCR run — the SIMD WASM core variant (the one Playwright's Chromium loads; exercised directly by this task's own network assertions) |
| `public/generated/privacy-pdf/pdf.min.mjs` | 454,669 | Any PDF opened (file picker, drag-drop, or a sample load) |
| `public/generated/privacy-pdf/pdf.runtime-compat.mjs` | 4,033 | Same as above (loaded first, by `loadPdfJs()`) |
| `public/generated/privacy-pdf/pdf.worker.core.min.mjs` | 1,262,398 | Same as above (PDF.js worker core) |
| `public/generated/privacy-pdf/pdf.worker.compat.mjs` | 151 | Same as above (thin worker shim `PDFJS_WORKER_URL` points at) |

tesseract.js selects exactly one of the three WASM core variants per
browser via runtime feature detection (WebAssembly SIMD / relaxed-SIMD
support), so a single OCR run only ever fetches one of the three rows
above, never all three — all three are registered because all three are
real, reachable code paths for some visitor's browser, not because one run
loads all of them.

Verified click-gated, not auto-loaded, by code inspection and by
`tests/e2e/privacy-r2.spec.ts`'s "Privacy Preflight heavy-asset gating"
test group:

- `src/lib/privacy-ocr-worker.ts`'s `getWorker()` — the only call site of
  `import("tesseract.js")` — runs only inside `withPrivacyOcrWorker()`,
  itself called only from `PrivacyImageLab.tsx`'s `runOcr()` (the "Scan for
  sensitive information" button handler) and the equivalent per-page scan
  path in `PrivacyPdfLab.tsx`. Switching to the Image or PDF tab alone
  mounts the component but does not call this path.
- `src/lib/load-pdfjs.ts`'s `loadPdfJs()` is called only inside
  `PrivacyPdfLab.tsx`'s `loadPdfBytes()`, itself called only from
  `loadExample()` (a sample-load button) or `loadFile()` (the file
  picker's `onChange` handler) — never from a mount-time `useEffect`.
- `tests/e2e/privacy-r2.spec.ts`'s "no tesseract or PDF.js request fires on
  initial load" test asserts zero matching requests through
  `waitUntil: "networkidle"`; "tesseract loads only after the Image tab's
  scan action" and "PDF.js loads only after a PDF is chosen on the PDF
  tab" each assert zero matching requests immediately after the tab click,
  then a real matching request only after the click that actually loads a
  file / runs OCR.

Nothing in this audit required a code change to the loading behavior
itself — `import("tesseract.js")` and `loadPdfJs()` were already
click/action-gated before this task; the change was registering the real
byte costs those actions carry in `heavy-assets.json` (previously only one
of ten real files was registered) and adding the test coverage that proves
the gating.

`scripts/verify-heavy-assets.mjs` passes with 18 total ledger entries
(10 for privacy, plus the pre-existing DuckDB and Triage entries); assertion
(c) confirms all 18 are absent from the 23 initial-route JS/CSS resources
across every static page manifest in `.next/server/app/`.
`docs/evidence/r2-source-map.md`'s "Heavy-assets measured ledger" row was
updated to the new `heavy-assets.json` sha256
(`c2f8ab20ffb6772224522ad81a627511b6681efa1124ec477ef3eb691671d497`) and its
source-path description extended to list the new files;
`node scripts/verify-r2-sources.mjs` passes.
