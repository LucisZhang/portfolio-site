# Task R14 — Authored Ask Portfolio preset answers

Owner ruling (2026-09-03): 「预置问题的答案，你就直接根据对项目的了解去写」 — preset
answers are written by the author from project knowledge, replacing the R11 (B5-b)
retrieval-assembled verbatim-extract mechanism. Free-form typed questions keep the
live retrieval → guard → generate path unchanged.

## What changed

### Source of truth: `assistant-knowledge/question-bank.json`
Each of the 33 presets (11 routes × 3) now carries an `answer` object:
- `en` / `zh`: authored prose as ordered segments (`{text, ref}`, 2-3 segments,
  3-6 sentences), leading with the answer, recruiter-facing, zh written natively
  (not translated), IDENTICAL numeric-token sets between locales;
- `citations`: 2-4 curated destinations — `{site: "<route>"}` (mapped by the B5-c
  navigation index to the project page; the pinned portfolio-site URL is never
  surfaced as a link) or `{repo, file}` (deep GitHub links, only into files listed
  in `assistant-knowledge/manifest.json` at the pinned SHAs; frontier-forge /
  triage-router / crossover-study are not manifest-pinned, so those routes cite
  site routes only);
- `grounding`: machine-checkable source notes `{file, contains: [...]}` anchoring
  every number to a committed file (projects.ts, site-config.ts, README.md,
  digits audits, case-study JSONs, home-stats.json).

### Grounding gate (a real gate)
`scripts/lib/ask-authored-answers.mjs` (shared by generator and test suite):
- every `contains` string must literally appear in its named committed file;
- every numeric token in every answer (both locales) must be covered by a
  verified source string — an untraceable number fails generation AND `--check`;
- en/zh numeric parity enforced as set equality;
- citations validated against the pinned manifest (40-hex commit URLs; unpinned
  repos rejected; 2-4 per answer; every citation referenced by a segment ref).
`scripts/generate-ask-question-bank.mjs --check` (run by
`verify:assistant-public-sources`) re-derives both artifacts and re-runs the gate.

### Generated artifacts
- `src/data/generated/ask-question-bank.json` — unchanged shape (id/q_en/q_zh).
- `src/data/generated/ask-preset-answers.json` — NEW (replaces
  `ask-recorded-answers.json`, deleted): per-preset locale segments + one shared
  citations array (labels are bilingual, so citations are stored once).
- `scripts/lib/ask-recorded-composition.mjs`, `src/lib/ask-recorded-answers.ts`
  deleted with the mechanism; `assistant-knowledge/question-bank-relevance.mjs`
  kept (still drives the retrieval-relevance gate for the questions themselves).

### Honest labeling (UI)
Preset answers are no longer labeled as retrieval output:
- AskPage preset turn: "preset answer · authored, cited · no model call" /
  「预置回答 · 附引用 · 未调用模型」; new note under the openers explaining that
  the three openers return build-time-verified preset answers and that typed
  questions get the live model path; receipts list adds
  `scripts/generate-ask-question-bank.mjs` ("checks every number against its
  committed source").
- AssistantWidget tag: "PRESET · authored answer · cited · no model call" /
  「预置回答 · 附引用 · 未调用模型」.
- The opening RECORDED example (a genuine frozen retrieval run,
  `generate-ask-recorded-example.mjs`) keeps its truthful RECORDED labeling —
  unchanged, because it still is what it says it is.
- `recordedSegments`/`sendRecorded` renamed `presetSegments`/`sendPreset`.

### Payload architecture (budget)
The 80KB authored artifact statically imported pushed `/ai/ask-portfolio` over its
HARD 200,000 initial ratchet (206,267). Fix: the artifact is content, not app
code — `src/lib/ask-preset-answers.ts` now decides prompt-vs-preset synchronously
from the small bank and lazily imports the answers as their own chunk
(prefetched on preset hover/focus; loaded at click otherwise; on chunk-load
failure the UI states unavailability honestly and never silently falls through
to a model call). `/ai/ask-portfolio` initial: 206,267 → 187,791 (hard target
untouched). Shared wiring cost: +7 gzip bytes on "/", +13 on /artifact — the two
zero-headroom provisional pins re-pinned per the R13 pattern (ninth
application, documented in `scripts/verify-performance-budget.mjs`): "/"
183,597 → 183,604; /artifact 230,344 → 230,357; reproduced identically across
three consecutive clean runs.

### Question rewordings (logged)
1 of 33: `eod-failures` zh 「演练了哪十类故障？」→「演练了哪些故障？」(simpler, per
「预设问题要简单」; the en question was already general). No other question changed.

### Previously flagged weak presets (12)
home-background/en, home-site-overview/en, release-gate-results/en, rag-c2/zh,
triage-overview/en+zh, triage-tradeoff/en+zh(none), privacy-ocr/zh(none),
eod-failures/en, crossover-overview/en, credit-thresholds/zh — the weakness was a
property of extract composition, not of the questions; all 12 now carry strong
authored answers. The `support` field is retired (all presets always answer;
"none → live fallback" no longer exists).

### Tests retargeted (documented)
- `tests/assistant/ask-question-bank.test.mjs`: retrieval-relevance assertions
  kept verbatim (70 tests); the R11 recomposition assertions replaced by the
  grounding gate (`verifyAuthoredBank` must return zero failures), artifact
  freshness (committed JSON == fresh derivation), schema/refs/citation-pinning
  checks, and the manifest-pinned-repo rule for external citations.
- `tests/e2e/ask-r2.spec.ts`: label assertions retargeted to the preset labels;
  imports `ask-preset-answers.json`; zero-`/api/assistant`-request assertion and
  navigation-index mapping assertions unchanged.
- `tests/e2e/assistant.spec.ts`: widget tag assertion retargeted to
  "PRESET · authored answer · cited · no model call".

### Evidence registers
`docs/evidence/r2-source-map.md`: question-bank row re-hashed
(c0ed8be5…), R11 recorded-answers row replaced by the R14 authored-answers row
(target `ask-preset-answers.json`, sha 8f02f46f…, inputs = bank + manifest +
`ask-authored-answers.mjs`). `verify:r2-sources`: 42 verified / 0 failed.

## Gate results (all on the moved branch, post-849b7b8)
- `verify:assistant` 116/116 · `verify:assistant-question-bank` 70/70 ·
  `verify:assistant-public-sources` green (snapshot a17abf8e…, grounding gate green)
- `tsc` clean · `lint` 0 errors (11 pre-existing warnings)
- `check:localization` full chain green (copy lint 150 files, browser purity +
  numeric parity, zh glyph coverage PASS — three zh phrases reworded to stay
  inside the shipped serif subset: 旗舰→主打项目, 贯穿→同一种口径, 老链接→旧链接)
- `build` clean · `verify:performance` 12/12 (see re-pin above)
- Playwright ask-r2 + assistant: 62 passed / 4 skipped / 0 failed
- `verify:r2-sources` 42 verified / 0 failed
- Owner answer-set dump: `output/r3-align/b5b-authored-answers.md` (66 answers,
  destinations, grounding strings; gitignored owner record)

## Boundaries
- The grounding gate proves presence-of-number-in-source, not semantic truth of
  every sentence; sentence-level honesty relied on authoring directly from the
  already-audited bilingual copy in `projects.ts` and the digit registers.
- Grounding strings anchored in `projects.ts`/`site-config.ts` will fail loudly
  (generator + test) if a later copy edit removes an anchored phrase — that is
  intended ratchet behavior, same as the digits audits.
