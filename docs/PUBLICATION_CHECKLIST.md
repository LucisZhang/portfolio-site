# Portfolio publication checklist

Updated: 2026-08-17 (Asia/Shanghai)

This is the release procedure for the complete portfolio and the bilingual hybrid-RAG
assistant. It is also the stop-condition list: any unexplained diff, failed check, moved remote,
missing secret, incorrect deployment SHA, private-data leak, or unsupported evidence claim blocks
publication.

## 2026-09-09 accepted preview release

- [x] Owner accepted the preview and authorized publication after the Guardian button correction.
- [x] Exact candidate Preview and normal PR #24 merge verified.
- [x] Final focused regression resolved all six minimum-height failures from the full browser matrix.
- [x] Typecheck, lint, evidence, source reproduction, glyph, asset, dependency, and route performance gates passed.
- [x] Canonical runtime commit and service health independently read back.
- [x] English/Chinese Guardian button verified on the canonical site at desktop and mobile widths.
- [x] Fallback build provisioning PR #25 published; all four Triage inputs verified byte-for-byte.

See [the complete receipt](releases/2026-09-09-accepted-preview.md) for exact commits, test counts, and measurement boundaries.

## 0. 2026-08-17 Crossover Study withdrawal receipt — verified

- [x] Owner authorized removing Crossover Study from all portfolio discovery surfaces, the
  canonical site, and the Vercel fallback. DNS, proxy, server configuration, billing, and
  unrelated changes remained outside scope.
- [x] Public candidate `6960093e5c871a5f92b8efa2812b5986043106d8` descended from recorded
  `public/main` `47cd8181fa1dcc26f9bcee4bb8b0b76107c3d2f6` and contained only the
  withdrawal, authorization record, and regression coverage.
- [x] Typecheck, lint, evidence, 37 assistant tests, dependency audit, Gitleaks, and TruffleHog
  passed. The complete exact-candidate browser matrix recorded 244 passed, 84 intentional skips,
  and 0 failed.
- [x] Localization completed with no finding. Link traversal verified all 51 internal targets;
  its only error was the unchanged public-main `Risk-Control-Portfolio` GitHub 404, plus the
  expected LinkedIn HTTP 999 automation warning.
- [x] Lighthouse 13.4.0 scored 96 Performance and 100 for Accessibility, Best Practices, and SEO.
  The raw CSS budget remained 146,939 bytes, exactly equal to a clean unchanged-`main` build and
  unrelated to this no-CSS diff.
- [x] PR #19 merged normally at `653b76ef4193fd902ff75766876ee517a01f41a7`. Vercel Preview
  deployment `5942914064` and Production deployment `5943024610` reached success for their
  exact SHAs. Production returns 404 for the old route and 200 for a seven-project homepage.
- [x] The canonical-host release of candidate `90d97b0649826291a0601d123f63c06f3745581f`
  completed and was independently audited. Host provisioning, transport, and release-helper
  detail are operational material and are not recorded in this public repository.
- [x] `/engineering/crossover-study` returns HTTP 404 on apex, canonical Preview, and Vercel Production.
  All three homepages return HTTP 200. Canonical English/Chinese browser checks show seven case
  studies and no withdrawn-project entry; the engineering page is clean and the representative
  `/ai/release-guardian?lang=zh` route returns HTTP 200.
- [x] `www` returns a 308 redirect to the apex. CSP, HSTS, Referrer-Policy, nosniff, frame denial,
  and assistant `Cache-Control: no-store` remain present. Production Lighthouse 13.4.0 scored
  91/100/100/100. No paid-model request was made.
- [x] Final receipt: 2026-08-17 19:51:41 Asia/Shanghai / 2026-08-17 11:51:41 UTC.

## 1. Freeze a clean public candidate

1. Fetch and record the current SHA of `LucisZhang/portfolio-site:main` without changing the user's
   primary checkout.
2. Create a separate worktree and branch from that exact public `main` SHA. The candidate must be a
   normal descendant of public `main`; do not merge unrelated histories and do not force-push.
3. Apply the audited public tree delta from the verified integration candidate. Exclude untracked
   owner files, `.env*`, `.assistant-private/`, raw resumes, private dossiers, local paths, browser
   state, downloaded raw datasets, and coordination notes.
4. Review `git diff --name-status`, `git diff --stat`, new binaries, and the complete commit diff.
   Require `git diff --check` and a clean tracked worktree.
5. Confirm the public knowledge manifest contains only intended public GitHub repositories, exact
   40-character commits, and reviewed source paths. The generated corpus is permitted in the
   server bundle; the private packet is not tracked anywhere.

## 2. Verify evidence, build, browser, and dependencies

From the exact clean candidate run:

```sh
npm ci
npm run typecheck
npm run lint
npm run verify:evidence
npm run verify:assistant
npm run verify:assistant-public-sources
npm run build
npm run verify:performance
npm run test:e2e -- --workers=1
npm audit --omit=dev
git diff --check
```

Then require all of the following:

- Homepage Lighthouse Performance is at least 90; record Accessibility, Best Practices, and SEO as
  well. Exercise representative project routes rather than relying on the homepage alone.
- Gitleaks and TruffleHog report no verified secret in the candidate diff and public history.
- A static-client scan finds no private packet text/path, public corpus content, knowledge snapshot
  hash, OpenRouter key, Upstash token, or HMAC secret in browser JavaScript.
- Release Guardian still shows the funded-live/deterministic-stub distinction and 30/44 strict
  residual. RAG Quality Lab still states C2 is the floor and C3 produced no metric. Privacy and
  Analytics preserve their documented claim boundaries and provenance.
- Every public GitHub citation target resolves anonymously at the exact pinned commit.
- Fixed routes remain statically generated; only `/api/assistant` and the intended artifact route
  are dynamic.

## 3. Verify assistant v17 locally

Require policy `hybrid-portfolio-rag-v17-claim-contradiction-guard`, evidence mode
`pinned-github-plus-private-candidate-rag`, and public snapshot SHA-256
`99127978b4aeb74d182610ad0ae3554181b1dbd81392dae520a41bf4468978a3`.

Check that:

1. Public generation covers 9 repositories, 66 reviewed files, and 532 chunks. Runtime performs no
   GitHub fetch.
2. The owner-selected private builder removes contact/secret-shaped values and superseded RAG
   metrics, produces a bounded gzip/base64 packet below the Git-ignored `.assistant-private/`
   directory, and never records local paths in browser citations.
3. Retrieval returns at most 9 blocks with source diversity and works for personal-background,
   single-project, cross-project, and role-fit questions in both English and Chinese.
4. English resolves to `anthropic/claude-sonnet-4.6`; Chinese resolves to
   `moonshotai/kimi-k3`. Overrides, if any, must be explicit valid provider/model identifiers.
5. The dedicated scope guard receives only the latest question, locale, and sanitized portfolio
   page path. It receives no public/private evidence or conversation history, uses one strict JSON
   decision with no fallback, and fails closed before retrieval on timeout, invalid output, model
   mismatch, ambiguous scope, or provider failure.
6. Every outbound model request enforces `data_collection: deny`, `zdr: true`, and
   `require_parameters: true`, contains only retrieved evidence plus at most 6 recent messages,
   stays inside the 58-second request deadline, and advances through the configured distinct-model
   fallback order only for retryable failures.
7. Output JSON is server-validated. Unknown/duplicate citation IDs, sensitive output, long copied
   evidence, malformed JSON, non-stop completion, returned-model mismatch, and oversized upstream
   bodies fail closed.
8. Request gates enforce JSON, same-origin browser use, 24 KB streamed bytes, a 3-second body-read
   deadline, 2,500 characters per newest user message, and local refusal of prompt injection,
   knowledge/system-prompt exfiltration, explicit secret/contact requests, and explicit off-topic
   work.
9. Upstash applies 10/minute and 50/day sliding windows to an `ip-hmac-v2` HMAC pseudonym. The raw
   IP, HMAC secret, and Upstash token never enter logs or Redis keys. Limiter failure returns 503
   before any model call.

Perform one real request per locale using the exact final private packet. When deployment secrets
are Vercel Sensitive and cannot be downloaded, this live pair must run against the exact-SHA
Preview before merge rather than weakening or extracting the secrets. Each must return HTTP 200,
the exact expected model, a complete persuasive answer, non-empty validated citations, public and
private knowledge hashes, retrieval count, outbound payload hash, and `upstash-redis` limiter mode.
Reject any result containing a superseded RAG corpus/latency/quality/regression figure, private
path, contact detail, secret, fabricated metric, or unsupported present-tense claim.

In a real browser, test desktop and mobile layouts, English and Chinese, multi-turn context, opening
a public exact-commit citation, the generic non-link private citation, Enter/Shift+Enter behavior,
loading/error states, and the OpenRouter/ZDR disclosure.

## 4. Configure Preview safely

Before a Preview build, verify variable name and target only—never print values:

- `OPENROUTER_API_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `ASSISTANT_RATE_LIMIT_HMAC_SECRET` (independent, at least 32 UTF-8 bytes)
- `ASSISTANT_PRIVATE_KNOWLEDGE_B64_GZIP`
- optional `ASSISTANT_GUARD_MODEL`
- optional `ASSISTANT_MODEL_EN` and `ASSISTANT_MODEL_ZH`
- optional `ASSISTANT_FALLBACK_MODELS_EN` and `ASSISTANT_FALLBACK_MODELS_ZH`

Check the aggregate deployment-environment size before upload. Use the deployment provider's secret
input/API mechanism so values never appear in process arguments, shell history, Git, CI output, or
PR text. Preview and Production may use the same reviewed knowledge packet but should use correctly
scoped secrets; never prefix server values with `NEXT_PUBLIC_`.

## 5. Push and inspect Preview

1. Re-read remote `main`. If it moved, rebuild/retest the candidate against the new base.
2. Push the exact candidate branch normally. The Git-connected Vercel project is expected to create
   a non-production Preview; verify the deployment metadata SHA exactly matches the candidate.
3. Inspect build logs for secret output and errors. Test the signed-out public site, all routes,
   downloads, source links, bilingual copy, mobile layout, and both assistant locales.
4. Verify the Preview API headers and Upstash mode. Run injection/exfiltration and oversized-body
   refusals without consuming model calls. Run one bounded live prompt per locale and retain only
   hashes/statuses/model IDs/citation IDs in the release record—not prompt packets or private text.
5. Run Preview Lighthouse and confirm homepage Performance remains at least 90.

## 6. Merge through a normal PR and verify Production

After Preview passes, re-read remote `main`, update the candidate normally if it moved, and merge a
ready pull request through the repository's normal GitHub merge workflow. Do not push directly to
`main`, force, rewrite history, change repository visibility, create a tag/release, or mutate
unrelated branches.

Confirm the Git-triggered Production deployment uses the exact main SHA. Re-run the anonymous route,
download, citation, bilingual assistant, injection refusal, Upstash header, client-bundle leak, and
homepage Lighthouse checks against the production alias. Record the production URL, deployment SHA,
Asia/Shanghai timestamp (and UTC equivalent), model IDs, knowledge hashes, and gate summary in a
public-safe final state update.

Only after those checks may `STATE.md` change from `V15_RELEASE_CANDIDATE` to a deployed status.

## 7.1 2026-07-25 Privacy Safari stream follow-up receipt

- [x] Website PR #16 merged normally without a direct `main` push.
- [x] Candidate commit: `98e3c17b4c044705a9a6e023ecc2298fc206caf5`; runtime merge commit:
  `1a0027654495a2af1f490377a06dde521ba6498c`.
- [x] Preview deployment `dpl_GddsP51qYurNcaLGVK5ZQv4P5WML` reached Ready at
  <https://portfolio-site-8i2imreob-luciszhangs-projects.vercel.app>.
- [x] Production deployment `dpl_46sgy7ZdgQyLnrjXzkcmk2W9pkL3` reached Ready at
  `2026-07-25 10:51:53 Asia/Shanghai` / `2026-07-25 02:51:53 UTC`; GitHub Production deployment
  `5597922541` records the same merge SHA and the canonical alias serves the runtime.
- [x] Real Safari reproduced the remaining failure at PDF.js `getTextContent()`: its
  `ReadableStream` lacked `values()` and `Symbol.asyncIterator`, while bundled WebKit exposed them.
- [x] The compatibility case now deliberately removes the stream methods in both page and worker
  contexts and still loads the text-layer, scanned, and multi-page fixtures as 1/1/3 pages.
- [x] Real Safari 26.5.2 passed all three fixtures on Preview and public Production; Production
  passed in both normal and Private windows without the prior local-open error.
- [x] Final local verification: 236 passed, 80 intentional skips, 0 failures; assistant policy:
  37 passed. Typecheck, lint, evidence, build, performance, localization, links, and production
  dependency audit passed.
- [x] Lighthouse: 97/100/100/100 for Performance, Accessibility, Best Practices, and SEO.
- [ ] Owner physical-device retest remains: repeat all three buttons on the originally affected
  iPhone in both Safari and Chrome. This Mac Safari verification does not replace that gate.

## 7. 2026-07-25 Privacy iOS PDF compatibility hotfix receipt

- [x] Website PR #14 merged normally without a direct `main` push.
- [x] Candidate commit: `37e7b4a8617edf37bb7fa983051e449f3fe7051d`; runtime merge commit:
  `c708f8cb0ae8d65995f3f47f43dd45631afc69a8`.
- [x] Preview deployment `dpl_J6mLtTJZWchuEJcWSHa4wn9qWxfT` reached Ready at
  <https://portfolio-site-hobic5lpf-luciszhangs-projects.vercel.app>.
- [x] Production deployment `dpl_BotoNKaZHiqRTbsmrNYszdx9yPoT` reached Ready at
  `2026-07-25 09:49:22 Asia/Shanghai` / `2026-07-25 01:49:22 UTC`; the canonical alias serves the
  runtime at <https://portfolio-site-seven-murex.vercel.app>.
- [x] Production reproduction with newer WebKit APIs unavailable captured the pre-hotfix failure
  `Promise.withResolvers is not a function` before any PDF could open.
- [x] The final compatibility bootstrap runs before PDF.js in both window and worker contexts and
  covers the newer APIs referenced by the locked runtime without replacing native implementations.
- [x] Exact-SHA Preview and Production loaded the text-layer, scanned, and multi-page fixtures as
  1/1/3 pages after the APIs were deliberately unavailable. Production WebKit and Chromium had
  zero console errors.
- [x] Final local verification: 236 passed, 80 intentional skips, 0 failures; assistant policy:
  37 passed. Typecheck, lint, evidence, build, performance, localization, links, production
  dependency audit, Gitleaks, TruffleHog, and build-machine-path scans passed.
- [x] Lighthouse: 97/100/100/100 for Performance, Accessibility, Best Practices, and SEO.
- [ ] Owner physical-device retest remains: repeat all three buttons on the originally affected
  iPhone in both Safari and Chrome. Record the iPhone model, iOS version, and browser versions if
  either shell still fails; do not mark physical-device acceptance complete before that check.

## 8. 2026-07-25 mobile search and recruiter prompts release receipt

- [x] Website PR #12 merged normally without a direct `main` push.
- [x] Candidate commit: `69af3866631c073dcfc0bc847f55664672d388c7`; runtime merge commit:
  `8f76b8219c13c4f5210503edd91e0c68546e0146`.
- [x] Preview deployment `dpl_Fu6cPLmNTg5AXVRHiQSHXNNR17a1` reached Ready at
  <https://portfolio-site-7wn3u1wbx-luciszhangs-projects.vercel.app>.
- [x] Production deployment `dpl_J2bjEc1Dx7jj2tpcg3A16Wh4WTbg` reached Ready at
  `2026-07-25 08:49:04 Asia/Shanghai` / `2026-07-25 00:49:04 UTC`; the canonical alias served the
  runtime at <https://portfolio-site-seven-murex.vercel.app>.
- [x] Preview and Production each passed exact English Claude Sonnet 4.6 and Chinese Kimi K3
  acceptance after exact Claude Haiku 4.5 scope approval. Each accepted request used one attempt,
  retrieved 9 bounded chunks, and retained validated knowledge and payload hashes.
- [x] Local verification: 235 passed, 80 intentional skips, 0 failures; focused post-loader PDF and
  artifact verification: 19 passed; assistant verification: 37 passed.
- [x] Typecheck, lint, evidence, source reproduction, build, localization, link, production
  dependency audit, Gitleaks, TruffleHog, client-bundle local-path scan, and performance budget
  passed. Initial homepage JavaScript measured 164,052 estimated gzip bytes against 200,000.
- [x] Production mobile Chromium verified pinyin search, live completions, two-stage X behavior,
  and a 16 px unfocused assistant input at viewport scale 1. Production WebKit loaded the bundled
  text-layer, scanned, and three-page PDF fixtures as 1/1/3 pages with immediate status and no
  console errors.
- [x] Traditional and mixed queries `電商`, `信貸`, `資料管線`, `dian商毛利`, and `dianshang`
  returned the intended project first. Ten representative routes returned HTTP 200 with CSP,
  HSTS, nosniff, and frame-denial headers.
- [x] Lighthouse 13.0.3: Production 92/100/100/100 for Performance, Accessibility, Best Practices,
  and SEO respectively.

## 9. 2026-07-25 fixes5 release receipt

- [x] Website PR #10 merged normally without a direct `main` push.
- [x] Candidate commit: `18ab7a49753b33aa62171f742b8be8a71afc3846`; runtime merge commit:
  `29466dd7e0f11f9a69db3d87694929e03287ceb1`.
- [x] Preview deployment `dpl_2CkxyCRoZHN96eEkd1FjFHkxirz3` reached Ready at
  <https://portfolio-site-ebidtfwx5-luciszhangs-projects.vercel.app>.
- [x] Production deployment `dpl_8twyKAbaEJMiqUgFKx8Pwb18xgLV` reached Ready at
  `2026-07-24 23:53:54 Asia/Shanghai` / `2026-07-24 15:53:54 UTC`; the canonical alias served the
  runtime at <https://portfolio-site-seven-murex.vercel.app>.
- [x] Preview and Production each passed one exact English Claude Sonnet 4.6 and one exact Chinese
  Kimi K3 acceptance after the independent Claude Haiku 4.5 portfolio-scope guard. Each accepted
  request retrieved 9 bounded chunks and retained validated knowledge, payload, and citation
  metadata without exposing forbidden candidate fields.
- [x] Public assistant snapshot: 9 repositories, 66 files, 532 chunks, SHA-256
  `a47c5bbe603da3b3efb5497d50886960cf0323d1f885a9034052697bcfd9b6ad`.
- [x] Local/browser verification: 228 passed, 72 intentional skips, 0 failures; assistant
  verification: 37 passed. Typecheck, lint, evidence, public-source reproduction, build,
  localization, link, dependency-audit, client-disclosure, secret, and performance-budget gates
  passed.
- [x] Owner-retained hybrid Lucis Orbit, locale-specific contact matrices and QR images, phone
  dialog, same-page/cross-page contact anchor, consistent no-upper-right-arrow contact row, and
  bilingual whole-catalog ranking passed browser acceptance.
- [x] Production Privacy acceptance completed the three-page scan, review, confirmation, verified
  pure-image export, and before/after presentation in the complete left main region, without
  horizontal overflow or browser warnings/errors.
- [x] Fourteen representative English/Chinese routes returned HTTP 200 with CSP and frame-denial
  headers.
- [x] Lighthouse 13.4.1: Production 98/100/100/100 for Performance, Accessibility, Best Practices,
  and SEO respectively.

## 10. 2026-07-24 fixes4 release receipt

- [x] Website PR #8 merged normally without a direct `main` push.
- [x] Candidate commit: `7da0a70fbacd340b65491284c982ada849c8a981`; runtime merge commit:
  `c1c5a11bfc6057b92e521c19270f569a880d69c2`.
- [x] Preview deployment `5585781639` reached success at
  <https://portfolio-site-czmxqs9pw-luciszhangs-projects.vercel.app>.
- [x] Production deployment `5585933491` reached success at `2026-07-24T08:22:13Z`; the canonical
  alias served the runtime at <https://portfolio-site-seven-murex.vercel.app>.
- [x] Exact-path Preview and Production acceptance passed once per locale: configured Claude
  Sonnet 4.6 for English and Kimi K3 for Chinese, after the independent Claude Haiku 4.5 scope
  guard, through OpenRouter ZDR with only bounded retrieved material.
- [x] Public assistant snapshot: 9 repositories, 66 files, 532 chunks, SHA-256
  `a47c5bbe603da3b3efb5497d50886960cf0323d1f885a9034052697bcfd9b6ad`.
- [x] Local/browser verification: 220 passed, 56 intentional skips, 0 failures; assistant
  verification: 37 passed. Typecheck, lint, evidence, snapshot reproduction, build, localization,
  link, dependency-audit, client-disclosure, security, and performance-budget gates passed.
- [x] English and Chinese contact matrices, locale-specific WeChat QR images, Chinese LinkedIn
  omission, session-once Lucis Orbit, reduced-motion behavior, bilingual typo-tolerant search, and
  assistant handoff passed browser acceptance.
- [x] Preview and Production Privacy audits completed the three-page scan, review, confirmation,
  validated export, and download with every source/result canvas contained by its page frame and
  no console errors.
- [x] RAG PR #5 merged normally at `88879a286104d4fe0941c07d75230610093996d3`
  after one combined Fable 5 senior-user/recruiter task and one Kimi K3 Chinese pass. The separately
  authorized contributor-history cleanup was completed before the content PR.
- [x] Lighthouse 13.4.1: local 97/100/100/100 and Production 92/100/100/100 for Performance,
  Accessibility, Best Practices, and SEO respectively.

## 11. 2026-07-23 fixes3 release receipt

- [x] Website PR #6 merged normally without a direct `main` push.
- [x] Runtime merge commit: `0fccdcc4929718600f053221bdcef31faebd102f`.
- [x] Production deployment: `dpl_3w3vvQfFnuzFUBqhsnvjx5zxGMro`, Ready and aliased to
  <https://portfolio-site-seven-murex.vercel.app> during acceptance.
- [x] Exact-model Preview and Production acceptance passed once per locale: Claude Sonnet 4.6 for
  English and Kimi K3 for Chinese, after an exact Claude Haiku 4.5 fail-closed scope guard, using
  OpenRouter ZDR and only bounded retrieved excerpts.
- [x] Public assistant snapshot: 9 repositories, 66 files, 532 chunks, SHA-256
  `99127978b4aeb74d182610ad0ae3554181b1dbd81392dae520a41bf4468978a3`.
- [x] Assistant verification: 37 passed; complete browser suite: 218 passed, 52 intentional skips,
  0 errors; typecheck, lint, evidence, build, performance budget, dependency audit, disclosure and
  secret scans passed.
- [x] Production Privacy PDF audit passed with 3/3 scanned and rendered pages, verified raster
  output, the result in the complete left main region, the right review rail preserved, and no
  horizontal overflow.
- [x] Production fixed routes returned HTTP 200 as static prerenders with the expected security
  headers.
- [x] Lighthouse 13.4.1: Performance 99, Accessibility 100, Best Practices 100, SEO 100.

## 12. 2026-07-23 v15 release receipt

- [x] PR #3 and follow-up PR #4 merged normally without a direct `main` push.
- [x] Runtime merge commit: `468f31ba1ce196348caa5e30a76b11ed46a609d4`.
- [x] Production deployment: `dpl_8U7hHXby6Az4iwLrM81n84Ga2CcP`, Ready and aliased to
  <https://portfolio-site-seven-murex.vercel.app>.
- [x] Exact-model Preview and Production acceptance passed once per locale: Claude Sonnet 4.6 for
  English and Kimi K3 for Chinese, using OpenRouter ZDR and only bounded retrieved excerpts.
- [x] Assistant verification: 36 passed; complete browser suite: 218 passed, 52 intentional skips,
  0 failed; typecheck, lint, evidence, build, performance budget, dependency audit, and secret scans
  passed.
- [x] Production browser audit passed for locale behavior, desktop/mobile layout, representative
  cases, assistant disclosure, and console cleanliness.
- [x] All 11 public routes returned HTTP 200 for both language variants with expected security
  headers.
- [x] Lighthouse 13.4.1: Performance 98, Accessibility 100, Best Practices 100, SEO 100.


## GroupConv Atlas local integration — 8 September 2026

The owner accepted the integrated website preview and authorized publication on 9 September 2026, superseding the earlier local-only boundary. Deployment verification is recorded in STATE.md. Canonical route: `/projects/groupconv-atlas`. Source: `LucisZhang/groupconv-atlas` at `6193482b66e2074643df114231da3cbdb49d2459`. Current RTX 4090 and historical RTX 4090 D data remain separate; data/figures CC-BY-4.0 and code MIT. `public/case-studies/groupconv-atlas/provenance.json` records hashes; `scripts/generate-groupconv-summary.mjs --check` verifies the current map. Local quality acceptance is recorded separately after checks complete.
