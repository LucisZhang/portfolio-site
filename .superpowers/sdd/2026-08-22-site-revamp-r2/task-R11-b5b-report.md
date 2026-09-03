# Task R11 (B5-b) — recorded preset answers for Ask Portfolio

Owner ruling: clicking a bank preset returns a recorded answer instantly — no
inference on click. Implemented as deterministic retrieval-grounded
compositions in the same honesty class as the existing recorded dialogue
("检索结果 · 未经生成" / RECORDED), built offline from the freshly re-pinned
knowledge snapshot (commit 88e5d16 baseline; snapshot
`a17abf8e2388940dbfb378b2856b9d0a437000f520677ac52e07e4f07c38dc45`).

## Mechanism (honesty grammar)

- `scripts/generate-ask-question-bank.mjs` (extended) runs, per preset and per
  locale, the SAME retrieval the live `/api/assistant` route runs
  (`src/lib/assistant-retrieval.ts` `retrieveAssistantKnowledge` — local
  BM25-style ranking over the committed public snapshot; no model call, no
  network, no API key), then assembles VERBATIM extracts via
  `scripts/lib/ask-recorded-composition.mjs`. No prose is generated: the only
  transformations are markdown display stripping, string-literal unescaping,
  and whitespace normalization (zh hard-wrap joins). Candidate selection is
  steered by the reviewed per-question relevance maps extracted from the
  retrieval-gate test into `assistant-knowledge/question-bank-relevance.mjs`
  (single source of truth; the test imports the same maps).
- Output: `src/data/generated/ask-recorded-answers.json` (sha256
  `836069573b0fe0a01b7680a56940b3fa8d0584f6fc87ef000d649adfac3b8d15`,
  registered in `docs/evidence/r2-source-map.md`), reproducible byte-for-byte;
  `--check` re-derives everything (wired into `verify:assistant-public-sources`
  and `build:assistant-knowledge`, now run under the assistant TS loader).
- `src/data/generated/ask-question-bank.json` regenerated: byte-identical
  (source questions unchanged); recorded answers live in the sibling artifact
  so the bank JSON, which home-route surfaces import statically, stays small.

## Counts

- 11 routes × 3 presets × 2 locales = 66 recorded locale-answers:
  54 strong / 10 weak / 2 none.
- Weak/none presets (candidates for question REWORDING — listed, not reworded;
  full text in the gitignored review doc
  `output/r3-align/b5b-recorded-answers.md`, regenerate via
  `npm run generate:ask-question-bank`): home-background[en],
  home-site-overview[en], release-gate-results[en], rag-c2[zh],
  triage-overview[en,zh], triage-tradeoff[en], eod-failures[en],
  crossover-overview[en], credit-thresholds[zh] — weak;
  triage-tradeoff[zh], privacy-ocr[zh] — none (no extractable zh support in
  the top-ranked chunks of either locale's run; the UI keeps the live path
  for exactly those two presets, disclosed here rather than papered over).

## UI wiring

- `src/lib/ask-recorded-answers.ts` — lookup (preset text + route + locale →
  recorded answer); returns null for support "none" so callers fall back to
  the live path.
- `src/lib/use-assistant-conversation.ts` — `sendRecorded()`: appends the
  preset Q and its recorded answer locally, no `/api/assistant` request, no
  busy state; recorded turns join history (the preset user turn still reaches
  the API with the page-context prefix on a later typed question).
- `src/components/ask/AskPage.tsx` — opener click prefers recorded; recorded
  turns render with the frozen-example grammar (`ask-who` small label
  "retrieved evidence · no generation" / "检索结果 · 未经生成", `<em>`
  extracts with superscripts, B5-c `AssistantSourcesIndex` navigation index);
  zh through `zhWrapText`. No new boxes; no new CSS on the ask page.
- `src/components/assistant/AssistantWidget.tsx` — prompts-grid click prefers
  recorded; compact "RECORDED · retrieved evidence · no generation" microlabel
  (one small text rule in the widget CSS module), compact sources index.
- Homepage inline Ask chips keep their reviewed prefill-never-auto-send
  contract (no inference on click there either); typed free-form questions
  keep the live path untouched everywhere.

## Verification

- `verify:assistant` 114/114; `verify:assistant-question-bank` 68/68 —
  extended to re-derive every recorded answer from a fresh retrieval run and
  assert byte-equality (verbatim/citation/pinning honesty gate).
- `verify:assistant-public-sources` green (snapshot verify + generator
  `--check`).
- `verify:r2-sources` green: 42 verified (new registered row for
  ask-recorded-answers.json).
- e2e: `tests/e2e/ask-r2.spec.ts` — new preset-click tests (en+zh) assert the
  recorded answer renders instantly with ZERO `/api/assistant` requests
  (route interception), the RECORDED labeling, and that every index entry
  resolves (site chunks → route links, never raw repo file links; external →
  pinned GitHub deep links). Live-path and failure-path tests re-targeted to
  typed questions. `tests/e2e/assistant.spec.ts` — widget preset click →
  recorded + zero requests; typed follow-up exercises the live path, loading
  state, and the page-context prefix on the preset history turn.
  Results: ask-r2.spec.ts 29 passed / 0 failed / 4 skipped (deliberate
  viewport gates); assistant.spec.ts 33 passed / 0 failed (one locator
  retargeted truthfully: the destination now legitimately links twice —
  inline canonical link + index entry — asserted in their own regions).
- tsc clean; eslint 0 errors (12 pre-existing warnings in tmp/ scripts).
- `check:localization` green (0 errors; 11 pre-existing warnings; zh glyph
  gate passes — recorded zh answer strings reuse snapshot text already
  covered by the committed display-serif-zh subset).
- Budget: 12/12 after R13 re-pin (seventh application), documented inline in
  `scripts/verify-performance-budget.mjs`: shared-chunk growth from the
  B5-b wiring tipped the two zero-headroom PROVISIONAL pins — "/"
  183,513 → 183,523 (+10 gzip B) and /artifact 230,253 → 230,256 (+3 gzip B) —
  reproduced identically across three consecutive clean runs before
  re-pinning. The 90,653-byte recorded-answers JSON itself stays OUT of every
  route's initial payload (widget async chunk / ask route own);
  /ai/ask-portfolio absorbs it inside its hard target (199,156 vs 200,000).

## Files

- scripts/generate-ask-question-bank.mjs, scripts/lib/ask-recorded-composition.mjs (new)
- assistant-knowledge/question-bank-relevance.mjs (new, extracted from test)
- src/data/generated/ask-recorded-answers.json (new, registered)
- src/lib/ask-recorded-answers.ts (new), src/lib/use-assistant-conversation.ts
- src/components/ask/AskPage.tsx, src/components/assistant/AssistantWidget.tsx,
  src/components/assistant/AssistantWidget.module.css
- tests/assistant/ask-question-bank.test.mjs, tests/e2e/ask-r2.spec.ts,
  tests/e2e/assistant.spec.ts
- docs/evidence/r2-source-map.md, scripts/verify-performance-budget.mjs,
  package.json

## Concerns / follow-ups

- 12 flagged presets (10 weak + 2 none) are rewording candidates for the
  owner; the two "none" zh presets intentionally keep the live path.
- Recorded answers change whenever the knowledge snapshot is re-pinned;
  `generate:ask-question-bank` must re-run after `build:assistant-knowledge`
  (already chained in that npm script) and the source-map hash re-registered.
