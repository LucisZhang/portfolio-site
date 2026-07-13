# Portfolio Phase 2 release candidate

Updated: 2026-07-13

## Review entry points

- Public baseline: <https://portfolio-site-gpt-review.vercel.app>
- New anonymous Phase 2 Preview: pending final candidate deployment
- English home: pending
- Chinese home: pending (`?lang=zh`)
- Production remains unchanged: <https://portfolio-site-seven-murex.vercel.app>

## Six direct project routes

The final Preview origin will be combined with these routes:

- `/ai/release-guardian`
- `/engineering/p1-reliability-lab`
- `/ai/rag-quality-lab`
- `/ai/privacy-preflight-mac`
- `/analytics/margin-control-tower`
- `/analytics/credit-policy-lab`

Append `?lang=zh` to any route for the shareable Chinese version. The old
`/analytics/analytics-tandem` URL is a migration page, not a seventh project.

## Before and after review evidence

- Baseline screenshots: `docs/phase2-public-review-artifacts/baseline/screenshots/`
- Final screenshots: pending under `docs/phase2-public-review-artifacts/final/screenshots/`
- Baseline audit: `docs/phase2-public-review-audit.md`
- Final anonymous audit: pending candidate deployment

## Repository candidates

| Repository | State |
| --- | --- |
| Portfolio Site | `codex/portfolio-phase2`; public PR pending |
| RAG Quality Lab | `codex/c2-claim-reconciliation`; [PR #1](https://github.com/LucisZhang/rag-quality-lab/pull/1) open, not merged |
| p1 Reliability Lab | `codex/portfolio-readme`; [PR #3](https://github.com/LucisZhang/p1-reliability-lab/pull/3) open, not merged |
| Risk-Control-Portfolio | `codex/legacy-label`; [PR #1](https://github.com/LucisZhang/Risk-Control-Portfolio/pull/1) open, not merged |
| privacy-preflight-web | Private candidate at `0063e0f`; publication not authorized |
| margin-control-tower | Private candidate at `68ef751`; publication not authorized |
| credit-policy-lab | Private candidate at `639fbc0`; publication not authorized |

See `docs/github-publication-manifest.md` for license, data, source-label, scan, and publication
boundaries.

## Verification status

Completed on the current local candidate:

- TypeScript: passed.
- ESLint: passed.
- Evidence verifier: passed after updating assertions to the Phase 2 fixture dimensions.
- Production build: passed outside the restricted sandbox; Turbopack required an internal local port.
- Performance budget: 152,262 JavaScript bytes and 138,807 CSS bytes, uncompressed; passed.
- Localization checker: 30 dictionary keys, 11 routes x English/Chinese, no findings.
- Playwright: 112 passed, 14 intentional viewport-specific skips, zero failed.

Still required after the final commit and public Preview:

- local and public link checks;
- second full public browser audit and screenshots;
- npm audit, Gitleaks, TruffleHog, and Lighthouse;
- anonymous access verification and normal-browser checks for rate-limited profile links.

## License and macOS state

Portfolio content remains all rights reserved. The three private candidate repositories have no
chosen publication license and cannot be made public as an implied license decision. Synthetic data
sources and assumptions are documented in each candidate README.

No formal macOS download is included. The captured source checkpoint built and passed 95 worker
tests, but the candidate is thin arm64, ad hoc signed, not notarized or stapled, does not bundle its
runtime/dependencies, and has an unresolved PyMuPDF AGPL/commercial licensing gate. See
`docs/privacy-macos-release-audit.md`.

## Production publication actions

After candidate acceptance and an explicit final authorization, the release operator would:

1. Merge the reviewed Portfolio, RAG, p1, and legacy disclosure PRs specified in the publication manifest.
2. Decide licenses, then separately authorize any visibility changes for the three private candidates.
3. Replace the three pending Source states only after those repositories are anonymously accessible.
4. Archive `Risk-Control-Portfolio` only if explicitly authorized after its disclosure PR merges.
5. Keep macOS Release creation blocked until licensing, packaging, signing, notarization, stapling, entitlements, SHA-256, and anonymous-download checks pass.
6. Deploy Portfolio production only with a separate production authorization; do not reuse the Preview command with `--prod` implicitly.

The only requested human action at this stage is candidate acceptance. No merge, visibility change,
legacy archive, macOS Release, or production deployment is part of this review build.
