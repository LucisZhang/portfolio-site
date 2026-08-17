# Public Portfolio state

Updated: 2026-07-25 10:57 (Asia/Shanghai) / 2026-07-25 02:57 UTC

This file records the recruiter-safe state of the current release candidate. It contains no
credentials, raw private candidate material, local source paths, or browser-session data.

## 2026-08-17 Crossover Study withdrawal authorization

Status: `OWNER_AUTHORIZED_FOR_PREVIEW_AND_PRODUCTION`.

On 2026-08-17 Asia/Shanghai, the owner explicitly directed that Crossover Study be withdrawn from
the online portfolio. The authorized release scope is limited to removing the project from the
homepage, engineering track, static project routes, local portfolio search, recruiter prompts,
the canonical ECS-hosted site, and the Vercel fallback. The authorization does not include DNS,
firewall, proxy, unrelated-service, project-repository, billing, or paid-model changes.

The immutable candidate, Preview, Production, Vercel fallback, and public-route verification
receipts remain pending until those actions complete.

## Privacy Safari stream compatibility hotfix

Status: `PRIVACY_SAFARI_STREAM_HOTFIX_PRODUCTION_VERIFIED_MAC_SAFARI`. Runtime PR #16 merged
normally as commit `1a0027654495a2af1f490377a06dde521ba6498c`; no direct push to `main` occurred.
Vercel Production deployment `dpl_46sgy7ZdgQyLnrjXzkcmk2W9pkL3` reached Ready and the canonical
alias <https://portfolio-site-seven-murex.vercel.app> serves the merged runtime. GitHub recorded
Production deployment `5597922541` for the same merge SHA.

The preceding compatibility release fixed missing newer PDF.js APIs but still did not reproduce
real Safari's stream surface. Real macOS Safari reproduced the owner report after the loading
indicator: PDF.js failed in `getTextContent()` because `ReadableStream` did not expose `values()`
or `Symbol.asyncIterator`. Playwright's bundled WebKit already supplied the iterator, so its prior
success was not sufficient evidence for Safari.

The shared window/worker bootstrap now adds the two stream iteration methods only when absent.
The regression deliberately removes both methods alongside the previously covered PDF.js APIs in
page and worker contexts. Load errors also remain beside the mobile action controls instead of
appearing only below the review rail.

Candidate Preview `dpl_GddsP51qYurNcaLGVK5ZQv4P5WML` and Production loaded the text-layer,
scanned, and multi-page fixtures as 1/1/3 pages. Real Safari 26.5.2 passed all three on Production
in both normal and Private windows. The full local matrix passed 236 tests with 80 intentional
skips and no failures; typecheck, lint, evidence, localization, links, dependency audit, build,
and performance gates passed. Production Lighthouse scored 97 Performance and 100 for
Accessibility, Best Practices, and SEO.

The originally affected physical iPhone remains an owner manual-acceptance gate in both Safari
and Chrome. This record confirms real Mac Safari and public Production, but does not convert the
unobserved iPhone retest into a pass.

## Mobile search and recruiter prompts verified release

Status: `MOBILE_SEARCH_PRODUCTION_VERIFIED`. Runtime PR #12 merged normally as commit
`8f76b8219c13c4f5210503edd91e0c68546e0146`; no direct push to `main` occurred. Vercel
Production deployment `dpl_J2bjEc1Dx7jj2tpcg3A16Wh4WTbg` reached Ready and the canonical alias
<https://portfolio-site-seven-murex.vercel.app> served the merged runtime. The immutable build URL
is <https://portfolio-site-qqai1fimj-luciszhangs-projects.vercel.app>.

The release repairs all three bundled Privacy PDF buttons on mobile WebKit and gives immediate
local loading/ready feedback. The assistant no longer focuses its textarea on narrow viewports, so
opening it does not zoom the page. Ten primary routes now expose four bilingual, recruiter-reviewed
questions each. Suggested questions retain their visible wording while the submitted question is
explicitly contextualized to Xiangguo's portfolio before the independent scope gate.

Search now updates while typing and supports English, Simplified and Traditional Chinese,
tone-free spaced/joined pinyin, initials, and mixed input. Twelve recruiter-reviewed suggestions
have deterministic bilingual result contracts. Browser-local, versioned history keeps at most 20
validated entries and personalizes suggestions without entering analytics or assistant requests.
The top-right X clears a populated query first and closes only when the query is already empty.

The clean local browser matrix completed 235 passes, 80 intentional project/device skips, and no
failures, including a real WebKit engine with an iPhone 13 device profile. Focused PDF/artifact
regression added 19 further passes after moving PDF.js to a same-origin runtime module. Typecheck,
lint, evidence, 37 assistant tests, source reproduction, build, localization, links, production
dependency audit, Gitleaks, TruffleHog, client-bundle path disclosure, and performance gates passed.
Homepage initial JavaScript was reduced to 164,052 estimated gzip bytes against the 200,000-byte
budget.

Exact candidate Preview deployment `dpl_Fu6cPLmNTg5AXVRHiQSHXNNR17a1` served candidate
`69af3866631c073dcfc0bc847f55664672d388c7`. Preview and Production each passed English
`anthropic/claude-sonnet-4.6` and Chinese `moonshotai/kimi-k3` acceptance after exact
`anthropic/claude-haiku-4.5` scope approval. Every accepted request used one model attempt and 9
retrieved bounded chunks. Production mobile Chromium and WebKit verified live pinyin/Traditional/
mixed search, two-stage X behavior, 16 px unfocused assistant input at scale 1, and all three PDF
fixtures with 1/1/3 pages and no console errors. Ten representative routes returned HTTP 200 with
CSP, HSTS, nosniff, and frame denial. Production Lighthouse scored 92 Performance and 100 for
Accessibility, Best Practices, and SEO; see
[`docs/lighthouse-homepage-20260725-mobile-search.md`](docs/lighthouse-homepage-20260725-mobile-search.md).

## Fixes5 verified release

Status: `FIXES5_PRODUCTION_VERIFIED`. Runtime PR #10 merged normally as commit
`29466dd7e0f11f9a69db3d87694929e03287ceb1`; no direct push to `main` occurred. Vercel
Production deployment `dpl_8twyKAbaEJMiqUgFKx8Pwb18xgLV` reached Ready at
`2026-07-24 23:53:54 Asia/Shanghai` / `2026-07-24 15:53:54 UTC`, and the canonical alias
<https://portfolio-site-seven-murex.vercel.app> served the merged runtime. The immutable build URL
is <https://portfolio-site-qeil86ae7-luciszhangs-projects.vercel.app>.

The final local browser matrix passed all 300 cases (228 executed and 72 intentional
project/device skips), with no failures. Type, lint, evidence, assistant, localization, link,
build, dependency-audit, security, and performance gates passed at candidate commit
`18ab7a49753b33aa62171f742b8be8a71afc3846` before the Preview gate.

The owner reviewed and retained the hybrid Lucis Orbit entrance. The fixes5 release also makes the
footer contact action land on the actual homepage contact region, including from the homepage
itself; removes upper-right arrows from the full contact row for one consistent icon treatment;
adds an explicit phone contact dialog; improves bilingual whole-catalog search ranking; and
clarifies the transient Privacy PDF clean-preview state before scanning.

The owner explicitly authorized this release's repository and website branches, ready pull
requests, exact-SHA Preview, normal PR merges, exact-SHA Production deployment, and all English
Claude Sonnet 4.6 and Chinese Kimi K3 calls needed for Preview and Production acceptance. Model
authorization is limited to OpenRouter ZDR routes and the retrieved, bounded candidate excerpts
needed for the question. It does not authorize a non-ZDR route, another provider, raw-file,
credential, full-packet, or unrelated-task disclosure.

## Repository publication state

The six recruiter-facing project repositories now resolve through normal PR merges:

- Release Guardian: `1be4af55301b6d4a2c1c98b1850a820b698208bb`
- Streaming Reliability Lab: `eda2a7c156059678ecae8c57f4452ef98bd9ae89`
- RAG Quality Lab: `88879a286104d4fe0941c07d75230610093996d3`
- Privacy Preflight Web: `47eef37aa2aa39198c26f10fd5480c90274091ff`
- Margin Control Tower: `bd68e65b676593dff46c5fec41a8f4879ce5066c`
- Credit Policy Lab: `53dfd853c9b2d70476ed3b9250a7acdf01777887`

Release Guardian's English homepage was rebuilt after source-and-evidence review, then aligned in
Chinese. RAG publishes the C2 adapters, 11,309-document manifest path, 130-question evaluation
path, runner, and tests without committing the generated knowledge base or claiming a C3 metric.
Margin and Credit are self-contained, real-data-first repositories with their pipeline,
provenance, source lock, validation code, derived artifacts, and optional synthetic fixtures.
Margin follow-up PR #4 also corrected its browser-artifact README, data contract, and metric
registry so Olist measurements and source-specific BRL semantics cannot be mistaken for the
separate fixed-seed synthetic fixture.
Streaming's current narration uses the final repository name; old `p1-reliability-lab` strings
remain only where immutable historical logs, package names, or source namespaces require the
original evidence identity.

## Candidate delivery

- The homepage keeps the established visual system and adds one isolated, session-once Lucis Orbit
  entrance symbol. The flourish is removed from the entry sequence under reduced-motion.
- English contact surfaces expose GitHub, LinkedIn, phone, email, and WeChat. Chinese surfaces
  expose GitHub, phone, email, and WeChat without LinkedIn. WeChat opens the locale-specific QR
  image and displays ID `ZJ_Lucis`.
- The command palette now performs bilingual local ranking with aliases, typo tolerance, recent
  items, suggested entries, and an explicit assistant handoff.
- Every project detail page ends with two distinct columns: how the result was verified and what it
  does not prove. Mobile layouts preserve that order while stacking the columns.
- Track project navigation applies relational hover, keyboard focus, sibling de-emphasis, and a
  reduced-motion-safe transition, matching the homepage project interaction.
- Privacy Preflight's multi-page PDF source and redacted result each occupy the complete left main
  preview region while the right review rail remains available.
- Margin and Credit default to their verified real-data artifacts. Synthetic generation remains an
  explicitly labeled fixture path rather than the recruiter entrypoint.
- The footer names the Applied AI, data engineering, and data analytics fit and provides a direct
  contact action.

## Assistant candidate

- Policy: `hybrid-portfolio-rag-v17-claim-contradiction-guard`.
- Evidence mode: `pinned-github-plus-private-candidate-rag`.
- Dedicated scope guard: `anthropic/claude-haiku-4.5` through an eligible ZDR route.
- English primary: `anthropic/claude-sonnet-4.6`; Chinese primary:
  `moonshotai/kimi-k3`.
- A strict-schema failure from Chinese Kimi K3 receives one bounded retry through the same model
  and ZDR route; repeated invalid output still fails closed. Typed text is normalized before UI
  rendering so model-emitted Markdown markers are not shown literally.
- The output guard rejects any answer that reverses Margin Control Tower's evidence boundary: the
  default artifact and measurements are real public Olist data; synthetic is fallback/test only.
- The guard receives only the latest question, locale, and sanitized portfolio route. It receives
  no evidence, private material, conversation history, source path, citation, or provider
  credential. Timeout, malformed output, returned-model mismatch, unavailable routing, sensitive
  scope, injection, ambiguity, and off-topic scope fail closed before retrieval and generation.
- Public knowledge is pinned to 9 exact-commit repositories, 66 reviewed text files, and 532
  bounded chunks with SHA-256
  `a47c5bbe603da3b3efb5497d50886960cf0323d1f885a9034052697bcfd9b6ad`.
- Private candidate material remains Git-ignored and server-only. Only retrieved bounded excerpts
  may be sent to the authorized ZDR provider route.

## Verification completed before Preview

- Release Guardian, Margin Control Tower, and Credit Policy Lab each completed one combined
  source-aware Fable 5 review covering senior GitHub-user quality and Applied AI/data
  engineering/data analytics recruiter review. Release, Margin, Credit, and RAG then completed one
  Kimi K3 Chinese pass; no redundant Chinese Fable review was added.
- All six repository PRs passed their remote CI before merge. Bilingual README pair checks,
  relative-link checks, emphasis checks, commit-range secret scans, and live GitHub rendering
  checks passed. One literal Chinese emphasis marker found only in GitHub rendering was fixed in
  Streaming PR #6.
- The public knowledge snapshot reproduced exactly from its pinned GitHub sources. The offline
  Streaming compatibility pack also reproduced at the merged commit.
- The dedicated guard payload was exercised against its configured Claude Haiku 4.5 ZDR route;
  the route returned the exact structured rejection schema without receiving evidence or private
  candidate material.
- Assistant policy/unit verification passes 37 tests. TypeScript, ESLint, production build,
  evidence verification, localization, dependency audit, and the complete Playwright matrix pass
  locally. The clean full browser run completed with 218 tests passed, 52 intentional skips, and
  zero failures across the desktop, tablet, and mobile route matrix, including the three-page
  Privacy PDF workflow.
- Browser inspection confirmed that all 12 primary English/Chinese GitHub homepages render an
  article, language switch, headings, and expected tables without a not-found page or raw emphasis
  marker.

## Fixes5 Preview and Production verification

- Exact candidate Preview deployment `dpl_2CkxyCRoZHN96eEkd1FjFHkxirz3` reached Ready at
  <https://portfolio-site-ebidtfwx5-luciszhangs-projects.vercel.app> for candidate
  `18ab7a49753b33aa62171f742b8be8a71afc3846`.
- Preview and Production each passed one English Claude Sonnet 4.6 and one Chinese Kimi K3 live
  acceptance after the independent Claude Haiku 4.5 scope gate. Each accepted request retrieved 9
  bounded chunks, matched the configured model exactly, retained public/private/combined knowledge
  hashes and payload hashes, and exposed no forbidden candidate field.
- Production browser acceptance covered English and Chinese contact matrices, same-page and
  cross-page contact navigation, locale-specific QR dialogs, whole-catalog search examples, the
  retained Lucis Orbit, and the complete three-page Privacy scan/review/raster-export workflow.
  The result used the complete left main region, rendered all three pages, showed the verified
  export receipt, had no horizontal overflow, and emitted no browser warnings or errors.
- Fourteen representative English/Chinese routes returned HTTP 200 with CSP and frame-denial
  headers. The formal project route is `/engineering/p1-reliability-lab` while the visible and
  repository-facing name remains Streaming Reliability Lab.
- Production Lighthouse scored 98 Performance and 100 for Accessibility, Best Practices, and SEO.
  See [`docs/lighthouse-homepage-20260725-fixes5.md`](docs/lighthouse-homepage-20260725-fixes5.md).

## Previous fixes4 Preview and Production verification

- Exact candidate Preview GitHub deployment `5585781639` reached success with environment URL
  <https://portfolio-site-czmxqs9pw-luciszhangs-projects.vercel.app>. Signed-in browser acceptance
  covered English and Chinese desktop, Chinese mobile, locale-specific contacts and QR images,
  session-once/reduced-motion-safe entrance behavior, typo-tolerant local search, assistant
  handoff, the RAG page, and the complete three-page Privacy workflow.
- Preview live acceptance passed once per locale with the configured English Claude Sonnet 4.6
  and Chinese Kimi K3 generation paths after the independent Claude Haiku 4.5 scope gate. Each
  request used OpenRouter ZDR and only retrieval-selected bounded material.
- Production repeated one live acceptance per locale on the canonical alias. Both responses
  completed with validated citations against public snapshot
  `a47c5bbe603da3b3efb5497d50886960cf0323d1f885a9034052697bcfd9b6ad`.
- The Production three-page Privacy path completed load, scan, review, confirmation, validated
  raster export, and download. All three source and result canvases remained inside their outer
  page frames before and after export, with no console errors.
- Local Lighthouse 13.4.1 scored 97 Performance and 100 for Accessibility, Best Practices, and
  SEO. Canonical Production Lighthouse scored 92 Performance and 100 for the other three
  categories, remaining above the required 90 threshold. The public receipt is in
  `docs/lighthouse-homepage-20260724.md`.
- The final local suite passed 220 tests with 56 intentional skips and zero failures; assistant
  verification passed 37 tests. Typecheck, lint, evidence verification, public-source snapshot,
  production build, localization, link, dependency audit, client disclosure, performance budget,
  and security checks passed.

## Previous fixes3 Production verification

- Website PR #6 merged normally to runtime commit
  `0fccdcc4929718600f053221bdcef31faebd102f`; no direct push to `main` occurred.
- Production deployment `dpl_3w3vvQfFnuzFUBqhsnvjx5zxGMro` reached Ready and the canonical alias
  resolved to that exact commit during acceptance.
- The bilingual desktop/tablet/mobile review passed. The Production three-page Privacy PDF flow
  scanned all pages, generated a verified redacted PDF, kept the 340 px review rail, and rendered
  all three result canvases in the 838 px left main region without horizontal overflow.
- Production live acceptance passed once per locale: English returned exact
  `anthropic/claude-sonnet-4.6`, Chinese returned exact `moonshotai/kimi-k3`, and both used the
  independent `anthropic/claude-haiku-4.5` guard before retrieving 9 bounded chunks. Both responses
  were bound to public snapshot
  `99127978b4aeb74d182610ad0ae3554181b1dbd81392dae520a41bf4468978a3`.
- Homepage Lighthouse scored 99 Performance, 100 Accessibility, 100 Best Practices, and 100 SEO.
  Fixed routes returned HTTP 200 as static prerenders with the expected CSP, HSTS, permissions,
  referrer, content-type, and frame-denial headers.
- Typecheck, lint, evidence verification, production build, 37 assistant tests, dependency audit,
  client disclosure scan, localization and link checks, secret scans, and the full browser matrix
  passed. The formal browser run completed with 218 passed, 52 intentional skips, and zero errors.

No direct website push to `main`, website force push, visibility change, tag, release, or
unrelated-branch mutation occurred. The only history rewrite was the separately authorized,
narrow RAG contributor cleanup completed before RAG PR #5.
