# Project names and semantic destinations

`src/lib/project-identities.ts` owns public project identities, names, historical
aliases, and navigation destinations. The project catalog types, homepage stack generator,
assistant answer rendering, citation index, question routing, retrieval priority,
and search/home generators consume this map. An exact identity or a bounded name
mention is required; topic vocabulary does not itself create a project link.

| Current name | Additional public names | Destination (English) |
| --- | --- | --- |
| Frontier Forge | frontier-forge | `/ai/frontier-forge` |
| Release Guardian | release-guardian | `/ai/release-guardian` |
| Exactly-Once Drills | Streaming Reliability Lab; p1-reliability-lab; p1 Reliability Lab; p1 可靠性实验室; 流式可靠性实验室; 流式可靠性项目; 可靠性实验室; reliability lab | `/engineering/exactly-once-drills` |
| RAG Quality Lab | rag-quality-lab | `/ai/rag-quality-lab` |
| Triage Router | NLP Eval Lab; nlp-eval-lab | `/ai/triage-router` |
| Privacy Preflight | 隐私预检; 隱私預檢; privacy-preflight-web | `/ai/privacy-preflight` |
| Margin Control Tower | margin-control-tower | `/analytics/margin-control-tower` |
| Crossover Study | Batch Recsys Lab; batch-recsys-lab | `/engineering/crossover-study` |
| Ask Portfolio | ask-portfolio | `/ai/ask-portfolio` |
| Credit Policy Desk | Credit Policy Lab; credit-policy-lab; 信贷策略实验室; 信貸策略實驗室 | `/analytics/credit-policy-desk` |
| Analytics Tandem | analytics-tandem | `/#archive` (existing compatibility action) |
| Voice-in-Security | Voice in Security; 语音安全; 語音安全 | `https://github.com/LucisZhang/Voice-in-Security` |

All canonical IDs also resolve as names. English names match case-insensitively,
with spaces, hyphens, underscores, and typographic dashes normalized. Chinese
prose may directly abut an English name. Matching chooses the longest name first
and preserves the order of distinct projects in comparisons. Chinese links append
`?lang=zh` before any fragment; the GitHub destination is locale-independent.

Historical route keys for p1/streaming, Credit Policy Lab, and Privacy Preflight
resolve to their current identities, including in the citation navigation index
and preset lookup. The existing Mac compatibility URL is a navigation alias only;
the assistant's current Web-only evidence policy and immutable historical source
pack remain in force. Analytics Tandem retains the archive action already
established by `next.config.ts`; it is not treated as an unknown source.

The audit covers 12 identities, 45 names (29 after normalization), all 196 alias
entries in the committed knowledge manifest, and 33 presets in both English and
Chinese. Manifest aliases include retrieval topics as well as names: words such
as RAG, Flink, Iceberg, Gateway, Serving, and Storage stay text. Every matched
manifest name must belong to its own source identity. Private or ambiguous names
such as `Risk-Control-Portfolio`, `ex-solver`, and bare `p1` are not assigned to a
different project. Unknown names remain unresolved.

Preset prose and citation numbers are preserved. The preset generator checks
that every project question names its own route's identity, rejects duplicate
prompts, and refuses unknown site citations or raw URLs in answer text. Search
aliases are regenerated from their vocabulary source plus the identity map;
the home generator reads project labels from the same map. The pinned knowledge
snapshot, source URLs, evidence hashes, answer facts, and model safety gates are
unchanged. Named live-question failures offer the named project destinations;
the existing general suggestions apply only to questions without a known name.

Coverage lives in `tests/assistant/project-identities.test.mjs` and
`tests/e2e/semantic-project-links.spec.ts`: all names and locales, historical
routes and citations, preset rendering, multi-project actions, typed and plain
answer names, unsafe URL rejection, keyboard navigation, mobile layout, and
homepage anchors with JavaScript disabled. The latter retain the site's existing
static English document until locale hydration.

## Local verification, 2026-09-05

- Starting commit: `beb57ee9f77f9e4ed1e3a06b35e32202df831b58`.
- Dedicated branch: `codex/notes-g06-semantic-project-links`.
- Assistant suite: 230 passed; catalog suite: 3 passed.
- Focused homepage/launcher/Ask/semantic browser suite: 213 passed, 39
  device-specific skips. The final build also passed the existing desktop
  homepage/assistant/Ask checks during the integration run before it was stopped.
- Typecheck, production build, evidence verification, assistant source/preset
  reproduction, and localization/font checks passed. Lint has three existing
  warnings in unrelated recording scripts; localization has eleven existing
  advisory findings for project controls.
- Production dependency audit: zero vulnerabilities.
- Homepage Lighthouse 13.4.1: performance 97, accessibility 100, best practices
  100, SEO 100. Fixed content routes remain static prerenders.
- The full browser matrix is assigned to the integration task by the owner's
  final instruction. The stopped local run exposed an existing hard-coded
  `127.0.0.1:4173` in `tests/e2e/eod-r2.spec.ts:312`; it fails when the isolated
  test server uses 4188. That test file is unchanged.

The additional payload-budget check still reports two inherited ceiling
violations. An untouched temporary copy of the starting commit reproduced both;
ceilings were not changed. Measurements are initial JavaScript bytes after gzip:

| Route | Starting commit | Final build | Change | Existing ceiling |
| --- | ---: | ---: | ---: | ---: |
| `/` | 185,317 | 185,396 | +79 | 183,605 |
| `/artifact` | 231,005 | 230,799 | -206 | 230,358 |
| `/ai/ask-portfolio` | 188,599 | 189,451 | +852 | 200,000 |

Every route-owned budget passes. The other ten initial-route budgets pass.
The name/alias matcher stays out of the homepage's initial code: homepage names
come from the shared generator and the catalog, while preset routing ships only
the small generated route-alias lists.

Changed files are limited to these surfaces:

- Identity and routing: `project-identities.ts`, `projects.ts`,
  `assistant-project-references.ts`, `assistant-citation-index.ts`,
  `assistant-retrieval.ts`, `assistant-public-sources.ts`, `ask-question-bank.ts`,
  and `use-assistant-conversation.ts` under `src/lib`.
- Rendering: `StackExhibit.tsx`/`home.css`, `ProjectMentionText.tsx`,
  `AssistantRichAnswer.tsx`, `AssistantWidget.tsx`/`AssistantWidget.module.css`,
  and `AskPage.tsx`/`ask.css` in their existing component directories.
- Generators: `generate-home-data.mjs`, `generate-portfolio-search-aliases.mjs`,
  `generate-ask-question-bank.mjs`, and `lib/ask-authored-answers.mjs` under
  `scripts`; regenerated `ask-question-bank.json` and
  `portfolio-search-aliases.generated.json` under `src/data`.
- Tests: the new identity and semantic browser suites plus the existing assistant
  question-bank, policy-schema, and project-reference expectations; this report.

The knowledge snapshot and preset answer prose/citations are byte-unchanged.
Protected owner files, publication state, and remote repositories are untouched.
