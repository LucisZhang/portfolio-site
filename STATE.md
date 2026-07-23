# Public Portfolio state

Updated: 2026-07-23 14:22 (Asia/Shanghai) / 2026-07-23 06:22 UTC

This file records the recruiter-safe state of the current public release. It contains no
credentials, raw private candidate material, local source paths, or browser-session data.

Overall status: `V15_RELEASE_CANDIDATE`. Production remains the previously verified runtime release
`0cbc90edd57b06e3fed42a946b1f5009f5160026`; the current candidate has not yet been merged or
attached to the Production alias.

The owner explicitly authorized the current branch push, ready pull request, exact-SHA Preview,
one bounded English and one bounded Chinese assistant request in Preview and Production, normal PR
merge to public `main`, and exact-SHA Production deployment. That authorization includes sending
only the retrieved, bounded private-candidate excerpts to OpenRouter's ZDR route and the selected
Claude/Kimi provider. It does not authorize raw-file, credential, or full-packet disclosure.

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
- Transient, timeout, malformed-JSON, and model-mismatch failures advance through distinct models
  inside one 40-second request deadline; permanent or unsafe failures stop immediately.
- Public knowledge is pinned to 9 exact-commit GitHub repositories, 49 reviewed files, and 344
  chunks with SHA-256
  `43628d6deaae5f0d24db05a35c40ae27e2321be0f3b9ea4878baa4dbd59eb660`.
- Private candidate material remains Git-ignored and server-only. Browser citations describe it
  generically, and withdrawn Privacy Mac material is filtered from retrieval and output.
- The assistant uses page-specific prompts and server-validated typed answer segments. Recognized
  project IDs resolve only to canonical local or reviewed GitHub destinations.

## Verification

- Assistant policy/unit verification: 35 passed, 0 failed, including a regression test proving that
  the primary model can complete after 14 seconds without being aborted.
- Complete Playwright run: 218 passed, 52 intentional device-inapplicable skips, 0 failed.
- TypeScript, ESLint, evidence verification, production build, performance budget,
  `git diff --check`, and production dependency audit passed; the audit reported 0 vulnerabilities.
- The public knowledge snapshot reproduced exactly from the nine commit-pinned remote repositories.
- Vercel Sensitive variables intentionally cannot be downloaded as plaintext. The local live probe
  therefore failed closed at limiter configuration before retrieval or any model request; exact
  live acceptance is required on the candidate's Vercel Preview before merge.

The remaining receipts in this section describe the previous Production baseline only; they are
not acceptance evidence for the current candidate:

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

- The currently deployed public `main` was fast-forwarded without force from
  `ff31909fb62b7defd088ea7eb0a6f37e54515ae0` to the verified runtime release
  `0cbc90edd57b06e3fed42a946b1f5009f5160026`.
- The current release branch is `codex/portfolio-site-fixes2-20260722`; the user's primary checkout and
  untracked inventory remain untouched.
- Preview and Production retain the five encrypted server values already required by v13.
  Optional fallback-model variables may override the validated defaults but must remain server-only.
- No force push, history rewrite, repository visibility change, tag, release, or unrelated-branch
  mutation was performed.
