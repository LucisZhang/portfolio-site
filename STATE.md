# Public Portfolio state

Updated: 2026-07-23 16:56 (Asia/Shanghai) / 2026-07-23 08:56 UTC

This file records the recruiter-safe state of the current public release. It contains no
credentials, raw private candidate material, local source paths, or browser-session data.

Overall status: `V15_DEPLOYED_VERIFIED`. The verified runtime release is merge commit
`468f31ba1ce196348caa5e30a76b11ed46a609d4`, deployed as
`dpl_8U7hHXby6Az4iwLrM81n84Ga2CcP` and attached to the Production alias
<https://portfolio-site-seven-murex.vercel.app>.

The owner explicitly authorized the current branch push, ready pull request, exact-SHA Preview,
normal PR merge to public `main`, and exact-SHA Production deployment. For this portfolio release
task, the owner also granted standing authorization for all English Claude Sonnet 4.6 and Chinese
Kimi K3 calls necessary to complete Preview and Production acceptance, without per-call
reconfirmation. That authorization includes sending only the retrieved, bounded private-candidate
excerpts to OpenRouter's ZDR route and the selected Claude/Kimi provider. It does not authorize a
non-ZDR route, another provider, raw-file, credential, full-packet, or unrelated-task disclosure.

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
- Transient, timeout, model-route 404, malformed-JSON, and model-mismatch failures advance through
  distinct models inside one 58-second request deadline; permanent or unsafe failures stop immediately.
- Public knowledge is pinned to 9 exact-commit GitHub repositories, 49 reviewed files, and 344
  chunks with SHA-256
  `43628d6deaae5f0d24db05a35c40ae27e2321be0f3b9ea4878baa4dbd59eb660`.
- Private candidate material remains Git-ignored and server-only. Browser citations describe it
  generically, and withdrawn Privacy Mac material is filtered from retrieval and output.
- The assistant uses page-specific prompts and server-validated typed answer segments. Recognized
  project IDs resolve only to canonical local or reviewed GitHub destinations.

## Verification

- Assistant policy/unit verification: 36 passed, 0 failed, including a regression test proving that
  the primary model can complete after 14 seconds without being aborted and canonicalization tests
  for known project names returned as plain text.
- Complete Playwright run: 218 passed, 52 intentional device-inapplicable skips, 0 failed.
- TypeScript, ESLint, evidence verification, production build, performance budget,
  `git diff --check`, and production dependency audit passed; the audit reported 0 vulnerabilities.
- The public knowledge snapshot reproduced exactly from the nine commit-pinned remote repositories.
- Exact-SHA protected Preview
  <https://portfolio-site-nt23qsn3s-luciszhangs-projects.vercel.app> passed one bounded English
  Claude Sonnet 4.6 request and one bounded Chinese Kimi K3 request. Both returned HTTP 200 on the
  expected model with Upstash limiting, nine retrieved chunks, validated citations, all knowledge
  and payload hashes, and no sensitive-output exposure.
- Production deployment `dpl_8U7hHXby6Az4iwLrM81n84Ga2CcP` is Ready. Its `/api/assistant`
  function has the intended 60-second timeout, and the three Production aliases resolve to it.
- Final Production acceptance returned HTTP 200 in one attempt from exact model
  `anthropic/claude-sonnet-4.6` in English and exact model `moonshotai/kimi-k3` in Chinese. Both used
  policy v14, Upstash limiting, nine retrieved chunks, complete typed answers, grounded citations,
  public/private/combined/payload hashes, and exposed no system marker, private path, secret, or
  contact data.
- Browser acceptance verified the desktop and 390 × 844 mobile layouts, automatic Chinese locale,
  manual English/Chinese switching, the Streaming Reliability Lab wording, Web-only Privacy media
  and multi-page PDF workflow, assistant ZDR disclosure, and a clean warning/error console.
- All 11 public routes returned HTTP 200 in both English and Chinese. The Production response
  includes CSP, HSTS, `nosniff`, `DENY` framing, referrer, and permissions-policy headers.
- Production homepage Lighthouse 13.4.1: Performance 98, Accessibility 100, Best Practices 100,
  SEO 100, FCP 1.3 s, LCP 2.2 s, TBT 50 ms, CLS 0, Speed Index 2.1 s. Report SHA-256:
  `669b7fee14bb7ff7fb0f7a43343446b27cc489639847c84127b5b6a9bd486fbd`; see
  [`docs/lighthouse-homepage-20260723.md`](docs/lighthouse-homepage-20260723.md).

## Publication state

- Runtime changes reached public `main` through normal pull-request merges: PR #3 established the
  release and PR #4 added deterministic canonical project-link rendering and the fresh-request
  retry behavior. No direct push to `main` was used.
- The release branch is `codex/portfolio-site-fixes2-20260722`; the user's primary checkout and
  untracked inventory remained untouched.
- Preview and Production retain the five encrypted server values already required by v13.
  Optional fallback-model variables may override the validated defaults but must remain server-only.
- No force push, history rewrite, repository visibility change, tag, release, or unrelated-branch
  mutation was performed.
