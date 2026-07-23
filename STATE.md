# Public Portfolio state

Updated: 2026-07-23 21:34 (Asia/Shanghai) / 2026-07-23 13:34 UTC

This file records the recruiter-safe state of the current release candidate. It contains no
credentials, raw private candidate material, local source paths, or browser-session data.

Overall status: `V15_RELEASE_CANDIDATE`. The currently verified Production baseline remains
merge commit `468f31ba1ce196348caa5e30a76b11ed46a609d4`, deployed as
`dpl_8U7hHXby6Az4iwLrM81n84Ga2CcP` at
<https://portfolio-site-seven-murex.vercel.app>. The fixes3 candidate has not yet replaced that
Production deployment.

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
- RAG Quality Lab: `bed604bb3ca49e641ba75e2999de29fa68b75754`
- Privacy Preflight Web: `47eef37aa2aa39198c26f10fd5480c90274091ff`
- Margin Control Tower: `16ad870cd4a7a81ca919831e7b881a8462912773`
- Credit Policy Lab: `53dfd853c9b2d70476ed3b9250a7acdf01777887`

Release Guardian's English homepage was rebuilt after source-and-evidence review, then aligned in
Chinese. RAG publishes the C2 adapters, 11,309-document manifest path, 130-question evaluation
path, runner, and tests without committing the generated knowledge base or claiming a C3 metric.
Margin and Credit are self-contained, real-data-first repositories with their pipeline,
provenance, source lock, validation code, derived artifacts, and optional synthetic fixtures.
Streaming's current narration uses the final repository name; old `p1-reliability-lab` strings
remain only where immutable historical logs, package names, or source namespaces require the
original evidence identity.

## Candidate delivery

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

- Policy: `hybrid-portfolio-rag-v15-llm-guard`.
- Evidence mode: `pinned-github-plus-private-candidate-rag`.
- Dedicated scope guard: `openai/gpt-5-mini`.
- English primary: `anthropic/claude-sonnet-4.6`; Chinese primary:
  `moonshotai/kimi-k3`.
- The guard receives only the latest question, locale, and sanitized portfolio route. It receives
  no evidence, private material, conversation history, source path, citation, or provider
  credential. Timeout, malformed output, returned-model mismatch, unavailable routing, sensitive
  scope, injection, ambiguity, and off-topic scope fail closed before retrieval and generation.
- Public knowledge is pinned to 9 exact-commit repositories, 66 reviewed text files, and 531
  bounded chunks with SHA-256
  `10f43c583473a1a42bdda972f4de8c5d253091c3c380b82772f01f0d5ad019d9`.
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
- Assistant policy/unit verification passes 37 tests. TypeScript, ESLint, production build,
  evidence verification, localization, dependency audit, and the complete Playwright matrix pass
  locally. The clean full browser run completed with 218 tests passed, 52 intentional skips, and
  zero failures across the desktop, tablet, and mobile route matrix, including the three-page
  Privacy PDF workflow.
- Browser inspection confirmed that all 12 primary English/Chinese GitHub homepages render an
  article, language switch, headings, and expected tables without a not-found page or raw emphasis
  marker.

## Remaining release gates

The candidate must still pass the static-client disclosure scan, Preview deployment, desktop/
tablet/mobile and bilingual Preview review, homepage Lighthouse Performance at or above 90, and one
bounded English Claude Sonnet 4.6 plus one bounded Chinese Kimi K3 Preview acceptance. Only after
those pass may the website PR merge and Production deployment proceed. Production must then pass
the exact-SHA route, security-header, assistant, browser, PDF, and Lighthouse checks before this
status changes to a deployed state.

No direct push to `main`, force push, history rewrite, visibility change, tag, release, or
unrelated-branch mutation is authorized or planned.
