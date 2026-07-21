# Public Portfolio state

Updated: 2026-07-22 (Asia/Shanghai)

This file records the recruiter-safe state of the current public-release candidate. It contains no
credentials, raw private candidate material, local source paths, or browser-session data.

Overall status: `LOCAL_VERIFIED_AWAITING_PUBLICATION`. The portfolio and bilingual hybrid-RAG
assistant have passed local code, evidence, build, browser, dependency, performance, and direct
live-model acceptance. Clean public-main lineage, secret scanning, Preview, and Production
verification remain required before this status can be changed to deployed.

## Candidate delivery

- Xiangguo Zhang / 章向国 / XGZ is used consistently across the bilingual runtime identity.
  Six bilingual project pages and the legacy Analytics compatibility route remain available.
- Release Guardian preserves funded-live, deterministic-stub, synthetic, and 30/44 strict-residual
  boundaries. RAG Quality Lab keeps C2 as the evaluation floor and reports no C3 metric. Privacy
  Preflight keeps browser behavior, source, app packaging, ad-hoc signing, notarization, and clean-
  Mac compatibility as distinct evidence classes. Analytics keeps licensed pipeline derivatives
  separate from governed synthetic fallback fixtures.
- The assistant is no longer the v12 one-project selector pilot. Current policy
  `hybrid-portfolio-rag-v13` performs bilingual retrieval over a server-only public snapshot plus
  an optional reviewed private candidate packet, then asks a locale-specific explanatory model to
  produce persuasive but evidence-bounded recruiter-facing copy.

## Assistant candidate state

- Evidence mode: `pinned-github-plus-private-candidate-rag`.
- English default model: `anthropic/claude-sonnet-4.6`.
- Chinese default model: `moonshotai/kimi-k3`.
- Public knowledge: 9 exact-commit GitHub repositories, 44 reviewed files, 364 chunks; SHA-256
  `b8cc614034bb0b0fc4b878553d08141471a8cb548698809f70f8f1819d97a777`.
- Current local private packet: 7 owner-selected files and 74 redacted chunks. The packet is ignored
  by Git, capped before decoding/decompression, and represented to the browser only by a generic
  private-evidence citation.
- Runtime requests never fetch GitHub. At most 9 diverse chunks and 6 recent conversation messages
  are sent to OpenRouter. Routing requires `data_collection: deny`, `zdr: true`, and
  `require_parameters: true`; automatic retries remain disabled.
- Current public project evidence overrides any conflicting or superseded metric in private
  materials. Legacy RAG corpus-size, latency, quality, and regression claims are filtered and
  forbidden by the model policy.

## Local live acceptance

- A direct English live request completed with HTTP-equivalent status 200 on
  `anthropic/claude-sonnet-4.6`, using 9 retrieved blocks and public plus private citations.
- A direct Chinese live request completed with status 200 on `moonshotai/kimi-k3`, using 9
  retrieved blocks and public plus private citations. It connected the candidate's DiDi AI-safety
  internship and automation work to the public evidence discipline without overstating the RAG
  Quality Lab boundary.
- A production-build `/api/assistant` English request completed through the real Upstash limiter
  with policy/evidence headers, 9 retrieved blocks, and exact public/private knowledge hashes.
  A Chinese system-prompt/knowledge-exfiltration request was refused locally without retrieval or
  model metadata.
- An additional stale-metric audit found a legacy `498K` wording in an earlier private resume
  block. That smoke result is rejected as acceptance evidence. The private builder and authority
  prompt were tightened, the packet was rebuilt, and the legacy claim patterns are absent from the
  rebuilt packet. Final route and browser acceptance must use only this rebuilt packet.
- Final assistant policy/unit verification passed 30/30. The complete Playwright run passed 209
  cases, intentionally skipped 52 device-inapplicable cases, and failed 0 across 261 cases. The
  assistant subset passed 18/18 across desktop, tablet, and mobile.
- TypeScript, ESLint with zero warnings, evidence verification, public-source exact rebuild,
  production build, performance budget, client static leak scan, `git diff --check`, and production
  dependency audit all passed; the dependency audit reported 0 vulnerabilities.
- Lighthouse 13.4.0 scored Performance / Accessibility / Best Practices / SEO as follows: home
  `96 / 100 / 100 / 100`, Margin `96 / 100 / 100 / 100`, Privacy `91 / 100 / 100 / 100`, and
  Release `93 / 100 / 100 / 100`. The homepage remains above the required Performance floor of 90.

## External-action state

- The current work is isolated from the user's primary checkout and untracked local inventory.
- The public repository's `main` still reflects the earlier v1 history at the start of this work;
  the richer public portfolio branch is on a separate history. Publication must therefore create a
  clean normal descendant of the current public `main`, apply the audited public tree delta, and
  use a non-force fast-forward update only after all gates pass.
- Preview and Production must receive the five required server secrets/values by name and target:
  OpenRouter key, Upstash URL/token, independent assistant HMAC secret, and private knowledge
  packet. Values must never be printed or committed.
- No v13 push, Preview deployment, Production deployment, alias change, tag, or release is
  claimed by this file yet. The owner has authorized merge and deployment after successful audit;
  a failed or ambiguous gate still blocks publication.
