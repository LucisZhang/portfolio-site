# Public Portfolio state

Updated: 2026-07-22 12:40 (Asia/Shanghai) / 2026-07-22 04:40 UTC

This file records the recruiter-safe state of the current public release. It contains no
credentials, raw private candidate material, local source paths, or browser-session data.

Overall status: `DEPLOYED_VERIFIED`. The bilingual portfolio and hybrid-RAG assistant passed local,
Preview, and Production acceptance for runtime release commit
`0cbc90edd57b06e3fed42a946b1f5009f5160026`.

## Candidate delivery

- Xiangguo Zhang / 章向国 / XGZ is used consistently across the bilingual runtime identity.
- Six bilingual project pages and the legacy Analytics compatibility route remain available.
- Project pages keep one consolidated bottom section for limitations while the main narrative,
  media captions, and interactive surfaces focus on the candidate's work, decisions, and results.
- Privacy Preflight is presented as a Web-only project. The withdrawn Mac application, download,
  packaging, signing, notarization, and Gatekeeper surfaces are not linked or rendered.
- Every primary project link opens the corresponding GitHub repository homepage.

## Assistant release state

- Policy: `hybrid-portfolio-rag-v14`.
- Evidence mode: `pinned-github-plus-private-candidate-rag`.
- English primary model: `anthropic/claude-sonnet-4.6`; default fallbacks:
  `openai/gpt-5.4`, then `qwen/qwen3.5-397b-a17b`.
- Chinese primary model: `moonshotai/kimi-k3`; default fallbacks:
  `qwen/qwen3.5-397b-a17b`, then `openai/gpt-5.4`.
- Transient and network failures retry the primary once, then advance through the configured
  locale-specific fallback list inside one bounded request deadline.
- Public knowledge remains pinned to 9 exact-commit GitHub repositories, 44 reviewed files, and
  364 chunks with SHA-256
  `b8cc614034bb0b0fc4b878553d08141471a8cb548698809f70f8f1819d97a777`.
- Private candidate material remains Git-ignored and server-only. Browser citations describe it
  generically, and withdrawn Privacy Mac material is filtered from retrieval and output.
- The assistant uses page-specific prompts, renders bounded Markdown, links recognized project
  names to local project pages, and keeps recruiter-facing answers concise and persuasive.

## Verification

- Assistant policy/unit verification: 31 passed, 0 failed, including a regression test proving that
  the primary model can complete after 14 seconds without being aborted.
- Complete Playwright run: 212 passed, 52 intentional device-inapplicable skips, 0 failed.
- TypeScript, ESLint, evidence verification, production build, performance budget,
  `git diff --check`, and production dependency audit passed; the audit reported 0 vulnerabilities.
- Production homepage Lighthouse 13.4.0: Performance 99, Accessibility 100, Best Practices 100,
  SEO 100, FCP 1.30 s, LCP 2.20 s, TBT 39 ms, CLS 0. Report SHA-256:
  `f3f33262471b7d856838b07cb0009482cc41246be911995d6d255d6360f43b2c`.
- Browser regression covers English and Chinese, desktop/tablet/mobile layouts, contextual assistant
  prompts, Markdown and project links, P1 scroll behavior, and the Web-only Privacy workflows.
- Preview deployment `dpl_CRMf61ED9QD4MQvgSV4ohSWT2XMm` passed protected-deployment acceptance.
- Production deployment `dpl_4uVnBKvHSxKRiAAC1QtwNBLTm3bN` was Ready and attached to
  `https://portfolio-site-seven-murex.vercel.app`; all 11 public routes returned HTTP 200 with the
  expected security headers.
- Bounded Production model acceptance returned HTTP 200 from `anthropic/claude-sonnet-4.6` in
  English and `moonshotai/kimi-k3` in Chinese. Both used the v14 policy, Upstash rate limiting, nine
  retrieved chunks, grounded citations, and exposed no system marker, private path, or contact data.

## Publication state

- Public `main` was fast-forwarded without force from
  `ff31909fb62b7defd088ea7eb0a6f37e54515ae0` to the verified runtime release
  `0cbc90edd57b06e3fed42a946b1f5009f5160026`.
- The release branch is `codex/portfolio-site-fixes-20260722`; the user's primary checkout and
  untracked inventory remain untouched.
- Preview and Production retain the five encrypted server values already required by v13.
  Optional fallback-model variables may override the validated defaults but must remain server-only.
- No force push, history rewrite, repository visibility change, tag, release, or unrelated-branch
  mutation was performed.
