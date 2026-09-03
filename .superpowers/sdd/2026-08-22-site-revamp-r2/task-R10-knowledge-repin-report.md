# Task R10 — assistant knowledge re-pin to current site and repo heads

Date: 2026-09-02 · Branch: `codex/site-revamp-r2-20260822` · Author: Claude (background job)

## What changed

Wholesale re-pin of `assistant-knowledge/manifest.json` (snapshotId
`public-github-portfolio-20260829-r2-v1` → `public-github-portfolio-20260902-r3-v1`),
regeneration of the public snapshot, question bank and recorded example, and
truthful retargets of the tests that pin those artifacts. Positioning content is
now AI-led ("I build LLM agents and applications, fine-tune and serve the models
myself…"); the old "Applied AI / data engineering / data analytics" trio is gone
from aliases and from the snapshot (0 occurrences).

## Per-repo pins (old → new, all = origin/main HEAD on 2026-09-02)

| Manifest repo | Old commit | New commit | Notes |
| --- | --- | --- | --- |
| release-guardian | `1be4af55…` | `bc7e7fdc6125019ceb6c7aa6e8a7af1084e775fc` | |
| streaming-reliability-lab | `eda2a7c1…` | `f323090c36e6b3f84e8cf8e5a1152addedde3410` | Repo name kept per standing hash-pinned-pack rule (GitHub redirects to exactly-once-drills; raw fetch verified 200). The frozen legacy pack `assistant-public-sources.ts` (`streaming-public-github-20260723-v1`, pinned `eda2a7c1…`) is self-contained and untouched. |
| rag-quality-lab | `88879a28…` | `6e3d6a2b040cc9fe4acb7dd4a61295405138f296` | |
| privacy-preflight-web → **privacy-preflight** | `47eef37a…` | `510454c2393d274168be0d605d938a8abeb7862d` | Renamed to canonical repo name (task instruction); historical-name aliases added. |
| margin-control-tower | `bd68e65b…` | `c84559f1f141bc86b728d5a8133b926ad8529273` | |
| credit-policy-lab → **credit-policy-desk** | `53dfd853…` | `bbad7e0dbf997d7fb64caad5ed3c8bf09e74658e` | Renamed to canonical repo name (2026-08-15 rename; no hash-pinned constant rule protects it — only streaming-reliability-lab is protected). Historical alias already present. In-repo paths (`public/case-studies/credit-policy-lab/…`) unchanged — they still exist at the new HEAD. |
| Voice-in-Security | `24b7e3c9…` | `8e92f0d10f9d04351d1c11f75837a839a582e9ae` | |
| siteRepository portfolio-site | `e8821702…` | `cbbd371747f73df34d0bc21dbdaeff55ca8ab42b` | Branch tip at task start; later commits (if any) not chased. |

All 52 remote pinned files verified present at the new commits via the GitHub
trees API before pinning; raw.githubusercontent fetches verified 200 across
renames.

## Selector / file-selection repairs

External repos (6 removals):
- `README.zh-CN.md` removed from release-guardian, streaming-reliability-lab,
  rag-quality-lab, privacy-preflight, margin-control-tower, credit-policy-desk —
  the file no longer exists at any new HEAD. Equivalent content: the new
  `README.md` in each repo is bilingual (EN body + zh blockquotes), so zh
  coverage is preserved by the existing `README.md` pin.

Site sources (the "4 removed release-guardian files + 15 line ranges" debt):
- The 4 removed files were site files under the `/ai/release-guardian` route:
  `src/components/ReleaseGuardianProof.tsx`, `src/components/release/ReleaseChangeReplay.tsx`,
  `src/components/release/README.md`, `src/components/release/README.zh-CN.md`.
  The page is now implemented by `src/components/guardian/*`. Replaced with:
  `guardian/GuardianPage.tsx`, `guardian/guardianRail.ts`, `guardian/guardianData.ts`,
  `docs/evidence/digits-guardian.md` (all verified present at cbbd371).
- `src/lib/structural-copy.ts` was regenerated into a flat zh-localization map
  (no per-project blocks), so its 4 per-project line-range selectors were
  replaced by the files that now hold each route's substantive copy:
  - `/ai/release-guardian` `L651–L1582` → guardian files above
  - `/ai/rag-quality-lab` `L535–L650` → `src/components/ragdiff/RagDiffLab.tsx`
  - `/analytics/margin-control-tower` `L123–L458` → `src/components/margin/MarginDetectionFigure.tsx`
  - `/analytics/credit-policy-desk` `L13–L122` → `src/components/credit/CreditPolicyFrontier.tsx`
- `src/components/ProjectProof.tsx` `L37–L120` → `L35–L121` (6 occurrences) and
  `L24–L35` → `L22–L33` (AnalyticsMigrationProof).
- `src/lib/site-config.ts` `L1–L37` re-validated and **kept** — an initial
  attempt to widen it to L1–L58 was reverted because lines 38–45 hold the
  private `profiles` contact block; the L37 boundary is a deliberate privacy
  cut and still lands exactly before it (the contact-exclusion test enforces
  this). `L60–L69` (siteMetadata description) unchanged and correct.
- Verified unchanged/correct: `src/lib/i18n.ts` `L64–L156`,
  `src/components/CaseStudyBlock.tsx` `L6–L17`.

Content fixes:
- Home-route aliases: dropped "Applied AI/AI 应用/data engineering/数据工程/
  data analytics/数据分析"; added "AI agents/AI Agent/LLM applications/LLM 应用/
  fine-tuning/微调/inference serving/推理服务/job direction/求职方向".
- `/ai/privacy-preflight` `projectSlug`: `privacy-preflight-mac` → `privacy-preflight`
  (the only slug defined in `src/lib/projects.ts`).

## Code/test retargets (each verified truthful against the rebuilt snapshot)

- `src/lib/assistant-project-references.ts`: project ids
  `privacy-preflight-web` → `privacy-preflight`, `credit-policy-lab` →
  `credit-policy-desk` (array + catalog keys; hrefs unchanged).
- `tests/assistant/assistant-policy.test.mjs`: same two ids in the response-schema
  enum expectation.
- `tests/assistant/assistant-retrieval.test.mjs`:
  - `finalRepositoryCommits` map → the 7 new pins; `siteCommit` → `cbbd371…`.
  - Route/source table: 4 `structural-copy.ts` rows → `guardian/GuardianPage.tsx`,
    `ragdiff/RagDiffLab.tsx`, `margin/MarginDetectionFigure.tsx`,
    `credit/CreditPolicyFrontier.tsx`.
  - Digits-audit list: added `docs/evidence/digits-guardian.md` (new register).
  - Cache self-test expectation: `58 files, 449 chunks` → `52 files, 496 chunks`
    (6 zh READMEs removed; new bilingual READMEs chunk larger).
- `tests/assistant/ask-question-bank.test.mjs`:
  - `release-overview` expected paths → `projects.ts` + `guardian/guardianData.ts`
    + `digits-guardian.md`; `release-human-approval` → `guardian/GuardianPage.tsx`
    + `digits-guardian.md` (old `src/components/release/*` paths are gone).
    Both verified retrieved-and-claim-matching in en and zh.
  - `home-tech-stack`: expected paths + claim widened to the Stack exhibit's real
    sources (`src/lib/i18n.ts`, `src/data/generated/home-stats.json`; claim adds
    `stack|Gateway|Serving`) — the retrieved README chunks at the new tip no
    longer name Next.js/TypeScript directly.
- `assistant-knowledge/question-bank.json`: `triage-boundaries` `q_zh`
  reworded "看 Triage Router 的结果时，最重要的四条限制是什么？" →
  "Triage Router 的结果有哪些局限与边界？" — matches the page's own boundary
  vocabulary ("局限与边界" heading, TriagePage L94–L140) so zh retrieval
  surfaces the actual limitations section; the old wording surfaced no
  claim-matching chunk.
- `scripts/generate-ask-recorded-example.mjs`: `QUESTION_ID`
  `home-site-overview` → `home-background` — the re-chunked snapshot no longer
  ranks a `site-config.ts` chunk for the old question; `home-background` ranks
  `site-config.ts:L60–L69`, which holds the same frozen `description` literal
  (now the AI-led wording). Same mechanism, same source file, documented in the
  script comment.
- Docs: `docs/evidence/r2-source-map.md` rows for the knowledge snapshot and
  question bank re-registered (new sha256s + new site commit in the source
  column); `docs/assistant-operations.md` site-commit reference updated.

## Regeneration results

- Snapshot: 8 repos, 198 files, 1445 chunks,
  sha256 `b04f6d7c41d11543bdd07866da231219d91553621972487f27735f747d9185c2`
  (build-reported content hash `a17abf8e…` deterministic across reruns).
- Question bank: 11 routes, 33 questions.
- Recorded example: cites real chunk
  `portfolio-site:home:src/lib/site-config.ts:L60-L69` at `cbbd371…`; answer is
  the verbatim AI-led siteMetadata description (en + zh).
- Snapshot content checks: 0 × old positioning phrases, 0 × `Applied AI`,
  AI-led `directionLine`/`校招方向` present. 2 remaining `privacy-preflight-mac`
  strings are inside `docs/evidence/digits-home.md` chunks — stale prose in the
  site's own committed register (flagged as a follow-up chip), not knowledge
  citations; no chunk cites a privacy-preflight-mac path.

## Gates

- `npm run verify:assistant-public-sources` — PASS (8 repos, 198 files, 1445 chunks).
- `npm run verify:assistant` — **113 pass / 0 fail** (final run after commit
  `25d737c`; the offline-cache self-test reads the snapshot committed at git
  HEAD, so intermediate pre-commit runs showed it red by construction —
  52 remote files / 496 remote chunks now expected).
- `npm run verify:r2-sources` — PASS (41 verified, 16 skipped, 57 total).
- `node scripts/verify-performance-budget.mjs` — PASS 12/12, run twice (before
  and after the font re-subset); `/artifact` measured 230,252–230,253 against
  its 230,253 ceiling — within the pin, no R13 re-pin needed.
- `npx tsc --noEmit` — PASS.
- `npm run check:localization` — PASS after a required consequence-fix: the new
  snapshot content (the re-pinned bilingual READMEs) introduced 30 codepoints
  (28 Han, e.g. 幂/驳/馆, plus `°` and `≠`) that the shipped zh serif subset
  did not carry — all 30 verified absent from the previous snapshot, i.e. this
  task's own footprint. Re-ran
  `node scripts/subset-zh-serif.mjs --source ~/Downloads/NotoSerifSC[wght].ttf`
  per the established F4 pattern (Han glyphs go into the physical subset):
  `public/fonts/display-serif-zh.woff2` regenerated, 1386 glyphs, 245.5KB;
  `verify-zh-glyphs` PASS. The `check-localization` numeric-parity step
  reported only the 11 pre-existing non-blocking warnings (untranslated
  control labels); `lint-copy` PASS (150 files). The globals.css
  `unicode-range` declaration was left as-is: it declares a subset of what the
  font carries, and the new symbols render through non-serif surfaces
  (assistant widget CSS), matching the existing allowlist rationale.

## Sanity probes (offline retrieval through the rebuilt snapshot)

1. "他现在的求职方向是什么" → top chunks: `projects.ts`, `i18n.ts:L102–L156`
   ("LLM training & inference"), … — AI-led, no data-led description anywhere.
2. "他做过哪些 LLM Agent 相关的项目？" → surfaces
   `site-config.ts:L60–L69` ("LLM agents and applied-AI systems…").
3. "校招求职方向 Open to 哪些岗位" → `i18n.ts:L102–L156`, `digits-home.md`,
   `projects.ts` — AI-led directionLine content present in snapshot
   ("AI agent & LLM application engineering").

Verdict: positioning questions surface AI-led content; the old data-led
description no longer exists in the snapshot.

## Concerns / follow-ups

- Site-visible GitHub links still use `privacy-preflight-web`
  (`src/lib/projects.ts`, `PrivacyPage.tsx`, privacy e2e spec) — redirects hold;
  chip spawned.
- `docs/evidence/digits-home.md` still references the retired
  `privacy-preflight-mac` slug in two historical rows — chip spawned; reaching
  the snapshot requires a future site re-pin after that fix lands.
- The frozen legacy pack `assistant-public-sources.ts` stays pinned at
  `eda2a7c1…` by design (packId frozen until re-review); its commit-pinned
  citation URLs remain valid.
- `tests/e2e/ask-r2.spec.ts` uses the old site commit inside a mocked API
  fixture URL — inert (mock), left unchanged.
