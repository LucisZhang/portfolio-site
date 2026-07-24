# Public Portfolio state

Updated: 2026-07-24 16:30 (Asia/Shanghai) / 2026-07-24 08:30 UTC

This file records the recruiter-safe state of the current release candidate. It contains no
credentials, raw private candidate material, local source paths, or browser-session data.

## Fixes4 verified release

Status: `FIXES4_PRODUCTION_VERIFIED`. Runtime PR #8 merged normally as commit
`c1c5a11bfc6057b92e521c19270f569a880d69c2`; no direct push to `main` occurred. GitHub
Production deployment `5585933491` reached success at `2026-07-24T08:22:13Z`, and the canonical
alias <https://portfolio-site-seven-murex.vercel.app> served the merged runtime. The immutable
Vercel build URL is
<https://portfolio-site-oxvhbt0iz-luciszhangs-projects.vercel.app>.

The final local browser matrix passed all 276 cases (220 executed and 56 intentional
project/device skips), with no failed tests. Type, lint, evidence, assistant, localization, link,
build, dependency-audit, and performance gates passed at candidate commit
`7da0a70fbacd340b65491284c982ada849c8a981` before the Preview gate.

The owner explicitly authorized the fixes4 website branch, ready pull request, exact-SHA Preview,
normal PR merge, Git-triggered Production deployment, and one English Claude Sonnet 4.6 plus one
Chinese Kimi K3 live acceptance on both final Preview and Production. Model calls remain limited
to OpenRouter ZDR routes and retrieval-selected bounded candidate excerpts. The owner separately
authorized the exact RAG Contributor history cleanup; that narrow rewrite and the subsequent normal
content PR are complete. No direct content push to either repository's `main` was used.

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

## Fixes4 Preview and Production verification

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
