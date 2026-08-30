# Task F13b — Route-aware Ask Portfolio preset questions

Date: 2026-08-29 (Asia/Shanghai)
Branch: `codex/site-revamp-r2-20260822`, synced to HEAD `f0620dc` (already current on this branch when work started).
Scope: wire the F13a verified question bank (`src/data/generated/ask-question-bank.json`) into the Ask Portfolio launcher/panel and the homepage inline surface. No edits under `src/components/forge/**` or `src/components/triage/**`.

## Outcome

The floating Ask Portfolio launcher/panel (`AssistantWidget`) and the homepage inline "Ask Portfolio" surface (`AskPortfolioInline`) now both read their preset chips from the single F13a-generated question bank instead of two separate hardcoded copy sources. Route resolution is exact-path with a home (`/`) fallback for any route the bank doesn't carry (track index pages, `/artifact`, future pages). No restyle; no new copy was added, so the localization glyph gate is unaffected.

## Wiring approach

New module: `src/lib/ask-question-bank.ts`. This is the one place in the app that reads `src/data/generated/ask-question-bank.json` for UI presets:

- `getRouteQuestionBankEntries(pathname)` — exact-path lookup into the bank, falling back to the `"/"` entry when the route isn't present. Throws at module load if the bank is ever missing its own `"/"` fallback (defensive; the F13a generator guarantees it).
- `getRouteQuestions(pathname, locale)` — same lookup, mapped to `q_en`/`q_zh` per locale.
- `getHomeQuestions(locale)` — convenience wrapper for the home route specifically (used by the homepage inline surface, which only ever needs the `"/"` set).

Both consumers import this module via the `@/lib/...` alias (safe inside Next.js/webpack bundling); Playwright specs import the JSON bank directly by relative path instead, matching this repo's existing test convention (`tests/e2e/search-ranking.spec.ts` and `home-r2.spec.ts` already import generated JSON/TS data by relative path rather than the `@/` alias, which the Playwright TS loader doesn't resolve).

### `src/components/assistant/AssistantWidget.tsx`

- Removed the `recruiterQuestionsByRoute` import and the hardcoded `copy.en.prompts` / `copy.zh.prompts` fallback arrays (they only existed to backstop `contextualCopy`'s prompt lookup; the bank's own home fallback now fills that role).
- `contextualCopy(pathname, locale, defaults)` now sources `prompts` via `getRouteQuestions(pathname, locale)`. The placeholder-text logic (project/track-specific "Ask how X demonstrates…" copy) is untouched — that's unrelated to the preset-question bank.
- No JSX/CSS change: the existing `styles.prompts` button row (rendered only while `messages.length === 0`) still maps over `context.prompts` and calls `send(prompt)` on click, i.e. clicking a panel preset submits it exactly as typing would — this was already the panel's behavior; only the data source changed.

### `src/components/home/AskPortfolioInline.tsx`

- Deleted the hardcoded `PRESETS` object (3 EN + 3 ZH strings, "Which of the three disciplines…", "What actually broke…", "How is every number…" / their ZH counterparts).
- The `variant === "chips"` preset row now maps over `getHomeQuestions(locale)`.
- Interaction unchanged: clicking a homepage preset still dispatches `portfolio:open-assistant` with `detail.prompt`, which `AssistantLauncher` uses to prefill (never auto-send) the panel's textarea — this is the homepage's pre-existing, deliberate "review before sending" contract (see the file's own header comment), not something F13b's requirements asked to change. The `variant === "compact"` branch (exhibit 06) never rendered presets and still doesn't; it shares the same component/import for one-source-of-truth purposes but has no behavioral change.

## Route resolution logic

Exact `pathname` string match against the bank's keys, else the bank's `"/"` entry. No trailing-slash normalization or alias table is needed because:

- `usePathname()` always returns the fully resolved route regardless of whether it's served by a literal `src/app/<route>/page.tsx` folder (e.g. `/ai/frontier-forge`, `/engineering/exactly-once-drills`) or by the shared dynamic `src/app/[track]/[project]/page.tsx` (e.g. `/ai/release-guardian`, `/analytics/analytics-tandem` — there is no `src/app/analytics` folder at all).
- The bank's keys are the same literal route strings the F13a generator derived from `assistant-knowledge/manifest.json`'s `siteSources`, which already match `pathname` 1:1 for every route it covers (11 routes: `/` + 10 project pages).
- Track index pages (`/ai`, `/engineering`, `/analytics`) and anything else outside those 11 routes (`/artifact`, `/dev/exhibition-fixture`, future pages) fall back to the home set — this is a deliberate, spec-mandated fallback, not a bug: F13a's bank only covers `"/"` plus the 11 leaf/project routes.

## Data left untouched

`src/data/recruiter-content.ts` (`recruiterQuestionsByRoute`, `recruiterSearchSuggestions`) was **not** touched or deleted. `recruiterQuestionsByRoute` is still directly imported and asserted against by `tests/e2e/search-ranking.spec.ts` ("every primary recruiter route exposes four distinct bilingual questions") — a pre-existing data-integrity test for a different, out-of-scope feature area (search suggestion ranking), not the Ask Portfolio panel. Once this change lands, `recruiterQuestionsByRoute` is no longer consumed by `AssistantWidget`; it remains live only for that unrelated search test, which was out of this task's focused-test scope and untouched.

## Deleted hardcoded presets inventory

| File | What was removed |
| --- | --- |
| `src/components/home/AskPortfolioInline.tsx` | `PRESETS` object: 3 EN strings ("Which of the three disciplines is his strongest fit?", "What actually broke, and how was it caught?", "How is every number on this page verified?") + 3 ZH strings ("三个方向里，他最擅长哪一个？", "到底哪里跑砸了，又是怎么被发现的？", "这页上每个数字是怎么验证的？") |
| `src/components/assistant/AssistantWidget.tsx` | `copy.en.prompts` (3 strings) and `copy.zh.prompts` (3 strings) — the old generic fallback prompts used only when `recruiterQuestionsByRoute` had no entry for the route |

`recruiterQuestionsByRoute` itself (in `src/data/recruiter-content.ts`) was left in place per the "data left untouched" note above.

## Test changes

`tests/e2e/assistant.spec.ts`:
- Added a `questionBank` import (relative path to the generated JSON) and a local `bankPrompts(route, locale)` helper mirroring `src/lib/ask-question-bank.ts`'s exact-path/home-fallback resolution, used for text assertions throughout.
- Updated **"assistant prompts follow the page context…"**: preset-button count assertion changed from 4 → 3 (routes `/ai`, `/engineering`, `/analytics` are unbanked and now fall back to the home set instead of carrying their own 4-question `recruiterQuestionsByRoute` list); added an exact-text assertion (`toHaveText(bankPrompts(path))`) for every context route. The later `/ai/rag-quality-lab` click now targets the bank's own `rag-overview` question text instead of the retired recruiter-content wording.
- Added **"assistant panel presets resolve per route from the verified question bank, including a dynamic legacy route, with a home fallback for unbanked routes"**: visits `/ai/frontier-forge` (static route folder) and `/analytics/analytics-tandem` (legacy project served only through the shared `[track]/[project]` dynamic route — no `src/app/analytics` folder exists) and asserts each panel's 3 preset texts exactly match that route's bank entries; then visits `/artifact` (unbanked) and asserts it shows the home set.
- Added **"assistant panel presets stay locale-pure in Chinese for a banked route"**: zh locale on `/ai/frontier-forge` renders exactly the bank's `q_zh` texts (locale-purity requirement).

`tests/e2e/home-r2.spec.ts`:
- Added a `questionBank` import and `homeAskQuestionsEn` derived from `questionBank["/"]`.
- Strengthened **exhibit 02's Ask Portfolio inline test** (renamed to reflect the new assertions): now asserts the 3 preset buttons' exact text equals the bank's home `q_en` set (previously only asserted a count of 3), and asserts clicking the first preset populates the opened panel's textarea with that exact question text without submitting it (`expect(widget.locator("textarea")).toHaveValue(...)` + `expect(widget.locator(SEL.article)).toHaveCount(0)` — no message log entries were created), verifying the "populates, never auto-sends" contract explicitly instead of only checking the panel opened.

No `test.skip` was added beyond the pre-existing viewport idiom (`test.skip(testInfo.project.name !== "desktop", ...)` pattern already used elsewhere in these files; not touched by this change).

## Verify

| Command | Result |
| --- | --- |
| `npm run typecheck` | PASS |
| `npx eslint <touched files> --max-warnings=0` | PASS, 0 errors/warnings |
| `npm run build` | PASS — 19 static/SSG/dynamic routes generated |
| `npx playwright test assistant home-r2 --project=desktop` (isolated config on port 4279; default 4173 was transiently occupied by a concurrent implementer's run on this shared branch, so a temporary `playwright.config.f13b.ts` clone was used and deleted immediately after the run — no file left behind) | PASS — 33 passed, 5 skipped (pre-existing viewport-idiom mobile skips unrelated to this change) |
| `npm run verify:assistant-question-bank` | PASS — 67/67 (F13a's harness, unaffected by UI wiring) |
| `npm run check:localization` (glyph step; route-check step run manually against a locally started production server on port 4279 via `PORTFOLIO_URL`, since the script's hardcoded default port 4173 wasn't guaranteed free) | PASS — `node scripts/check-localization.mjs` exit 0, 9 pre-existing warnings all on untouched routes/components (`/ai/frontier-forge`, `/ai/triage-router`, `/ai/privacy-preflight-mac`, `/engineering/exactly-once-drills` — proper nouns/model names/URLs, not this task's files); `node scripts/verify-zh-glyphs.mjs` PASS — no new zh strings were added, confirming this is a no-op as expected |

## Concerns

- `recruiterQuestionsByRoute` (`src/data/recruiter-content.ts`) is now dead from the Ask Portfolio panel's perspective — its only remaining consumer is `tests/e2e/search-ranking.spec.ts`'s own data-integrity assertion. Left untouched per this task's scope (search ranking is a separate, unaffected feature); a future cleanup task could fold or retire it if that search test is ever revisited.
- The isolated Playwright port (4279) and its temporary config file were used only transiently for this verification run and are not committed; the default `playwright.config.ts` (port 4173) is unchanged.
