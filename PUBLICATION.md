# Portfolio v1 publication record

Published: 2026-07-23

- Production site: <https://portfolio-site-seven-murex.vercel.app>
- Public source: <https://github.com/LucisZhang/portfolio-site>
- Rights: all rights reserved; no open-source license is granted. See `NOTICE.md`.
- Public repository construction: allowlisted site source, tests, and public evidence only, with
  no inherited internal pipeline history.
- Pre-publication checks: TypeScript, ESLint, evidence contracts, production build, 54 browser
  tests, npm audit, Gitleaks, and TruffleHog passed.

## Release Guardian approval

The Release Guardian evidence manifest was generated while the package was still a candidate and
is intentionally immutable. Final human approval was granted afterward for this exact manifest and
the three exact screenshot hashes below. The candidate-status text inside the manifest therefore
records package chronology; it is not the current publication status.

- Manifest SHA256:
  `f37967289db4816cfd5f23bdad7ca281b979f52420c4bf65b34b0383a6796eb8`
- `risk-guardrail.png`:
  `0df0b05fdd99188946c594462f9beb84dc8efd69dee5de147f408707acc582a9`
- `pipeline-trace-stub.png`:
  `22de4890f08b961dee8e7c234f843d702a7833a6f825a199d9cc708db645acff`
- `evaluation-stub.png`:
  `f534a133d5bc2a0cf6b0aed3425446127537b1a72e6ce14c8c3978486719eff9`

Approval does not extend to the private source repository, raw reports, prompts, scenarios,
traces, datasets, original screenshots, or any substituted asset hash.

## Current verified release

Runtime merge commit `468f31ba1ce196348caa5e30a76b11ed46a609d4` is deployed to Production as
`dpl_8U7hHXby6Az4iwLrM81n84Ga2CcP`. It retains six bilingual
case studies, contextual artifact viewers, two pipeline-backed Analytics workflows, the Web-only
Privacy Preflight workspace, and the legacy Analytics Tandem migration route. Assistant policy
`hybrid-portfolio-rag-v14` uses a bounded distinct-model fallback budget, page-aware prompts,
server-validated typed answer segments, and canonical local/GitHub project links. The public corpus
is pinned to 9 repositories, 49 files, and 344 chunks with SHA-256
`43628d6deaae5f0d24db05a35c40ae27e2321be0f3b9ea4878baa4dbd59eb660`.

On 2026-07-23 the owner authorized the branch push, ready PR, exact-SHA Preview, bounded live model
acceptance (including the retrieved private-candidate excerpt boundary), normal merge, and
Production deployment. PRs #3 and #4 were merged normally; no direct push to `main` occurred.
Exact-SHA Preview and Production acceptance passed for both `anthropic/claude-sonnet-4.6` and
`moonshotai/kimi-k3` through OpenRouter ZDR.

The final Production browser audit passed at desktop and mobile sizes with automatic locale
detection, manual language switching, representative project workflows, assistant privacy
disclosure, and no console warnings or errors. All 11 public routes returned HTTP 200 for both
language variants. Lighthouse 13.4.1 scored 98 Performance and 100 for Accessibility, Best
Practices, and SEO; the public-safe receipt is in
[`docs/lighthouse-homepage-20260723.md`](docs/lighthouse-homepage-20260723.md).

Commit-local evidence is indexed in [`docs/EVIDENCE_INDEX.md`](docs/EVIDENCE_INDEX.md); the
publication gates are in [`docs/PUBLICATION_CHECKLIST.md`](docs/PUBLICATION_CHECKLIST.md). This
publication does not:

- modify any approved Release Guardian asset or hash;
- publish a private candidate repository;
- restore or republish any withdrawn Mac application surface;
- authorize force pushes, history rewrites, visibility changes, tags, releases, or unrelated
  repository mutations.
