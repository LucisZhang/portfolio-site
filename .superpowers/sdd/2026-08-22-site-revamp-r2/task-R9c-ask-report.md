# Task R9c — Ask Portfolio B5-a + B5-c (guard refusals re-set, citation navigation index)

Status: COMPLETE. Mocks reproduced faithfully (b5-a-guard-refusals.html, b5-c-reference-index.html); owner mapping rulings implemented; all owned gates green; one pre-existing cross-workstream gate failure flagged below.

## B5-a — guard refusal quotes re-set
- `AskPage.tsx` exhibit 02: the two `blockquote.ask-guard-example` bar-quotes are gone. Refusals now render as ledger rows (`.ask-refusals`/`.ask-refusal`): mono record label (`R1 OFF-TOPIC · REFUSED LOCALLY` / zh `偏离主题 · 本地拒答`), roman serif refusal text between hairlines with typographic quotes (「」 in zh, zh-wrap phrase segmentation applied), mono meta line `recorded verbatim — no model reached` / `逐字记录——未调用任何模型`. The recorded refusal texts are byte-identical to before (verbatim data, asserted in the spec).
- Refusal rules are scoped `.ask-refusal > .ask-refusal-*` to outrank `.ask-how-block p`; no shared css touched.

## B5-c — references as a navigation index
- New destination-mapping layer `src/lib/assistant-citation-index.ts` (`buildCitationIndex`):
  - external project-repo chunk → keeps the pinned GitHub line-range URL; title is a human "what you'll find" label (path-dump labels `{project} · {path} · lines a-b` are re-labeled from the file's role: README→verified claims, RUNBOOK, evidence JSON, script, diagram, docs; already-human labels e.g. the streaming pack pass through); route line `github.com/{owner}/{repo} · {path} · La–Lb`, badge `GITHUB · PINNED COMMIT`.
  - portfolio-site internal chunk → parsed route key from the chunk id (`portfolio-site:<routeKey>:<path>:Lx-Ly`, the id scheme in assistant-knowledge.generated.json) → LocaleLink to the project page (`ai|engineering|analytics`-prefixed keys via `getProject`), title `Open the {title} project page` / `打开「{title}」项目页`, badge `THIS SITE`/`本站页面`. `home` and any unrecognized key collapse to the home page-level destination (`/ · project index`). The raw portfolio-site file URL never renders.
  - private profile chunk → label-only, badge `PRIVATE · CITED BY LABEL ONLY`/`私有材料 · 仅标注来源` (unchanged rule).
  - Same-destination citations merge into one entry carrying all citation numbers; every entry derives from an actual retrieved citation (nothing fabricated).
- Shared renderer `src/components/assistant/AssistantSourcesIndex.tsx` + `assistant-sources.css` (`.ask-go-*`, quiet hairline index per mock, `GO SEE FOR YOURSELF`/`亲自去看`, serif dest + mono route + kind badge, overflow-wrap guard). Used by: recorded conversation on /ai/ask-portfolio, live answers there, and AssistantWidget (compact variant; widget's old raw-label list + dead `.sources` css removed).
- zh: labels Chinese, route/repo names English; serif zh through zh-wrap; all new zh glyphs verified present in display-serif-zh.woff2 before wording was finalized (avoided uncovered 揽).

## Verification
- Specs (tests/e2e/ask-r2.spec.ts): new "guard refusals render as ledger records" test (count 2, `.ask-guard-example`/blockquote absent, computed border-left-width 0px + font-style normal, verbatim texts); recorded-example test asserts the internal citation maps to `/` with the raw github file link absent and no `site-config.ts` text; live-answer test mocks one internal (`portfolio-site:ai-frontier-forge:...` → `/ai/frontier-forge` route link, `src/lib/projects.ts` never rendered) + one external (`release-guardian` README → pinned deep link kept, human label, target=_blank).
- ask-r2 + assistant specs: 56 passed / 4 skipped / 0 failed (desktop+tablet+mobile).
- `npx tsc --noEmit` PASS; `npm run lint` 0 errors (11 pre-existing warnings in scripts/tmp only); `npm run build` PASS.
- Performance budget: 12/12 PASS after an R13 sixth-application re-pin — the shared index (+262 gzip bytes in the widget's shared chunk) tipped the two zero-headroom provisional pins: `/` 183,250 → 183,513, `/artifact` 229,990 → 230,253 (route-own untouched everywhere; values reproduced identically across 3 consecutive clean runs; documented in the script's comment block).
- check:localization: lint-copy PASS; check-localization.mjs exit 0 (11 warnings, none on ask/assistant surfaces); verify-zh-glyphs **FAILS at HEAD on pre-existing U+25CE (◎)** from `src/components/privacy/PrivacyPdfLab.tsx:701` / `PrivacyImageLab.tsx:467` (committed in df7e6b1, still present after fc262e6). Not this task's files; my additions contribute zero missing codepoints (the FAIL lists exactly that one). Owner: privacy workstream — allowlist it in zh-glyph-corpus or re-subset.
- Shots: output/r3-align/b5-impl-shots/ — before-/after- × {exhibit02, answer-refs} × {en, zh} × {desktop, mobile} (16 files; output/ is gitignored, local deliverables).

## Concerns
- verify-zh-glyphs red at HEAD (◎, privacy files) — pre-existing, flagged above; blocks a fully green check:localization for everyone until the privacy workstream resolves it.
- The two re-pinned budget ceilings are zero-headroom again; the next shared-chunk growth by any workstream will tip them (expected under the R13 ratchet convention).
- Budget measured with the concurrent workstream's then-uncommitted (since committed) site-config/privacy edits on disk, same convention as the fifth R13 application.
