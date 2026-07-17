# Portfolio Phase 2 release candidate

Updated: 2026-07-13 18:23 Asia/Shanghai (10:23 UTC)

> Historical 2026-07-13 deployment snapshot. Its verification counts and Privacy benchmark below
> describe that checkpoint only. For the current local Goal candidate, use `docs/EVIDENCE_INDEX.md`,
> `docs/PUBLICATION_CHECKLIST.md`, and the current machine-gate output; no new deployment is implied.

## Review entry points

- Phase 2 Review origin: <https://portfolio-site-gpt-review.vercel.app>
- English home: <https://portfolio-site-gpt-review.vercel.app/>
- Chinese home: <https://portfolio-site-gpt-review.vercel.app/?lang=zh>
- Isolated Vercel project: `prj_HB6kn3PkGaIcNWB0BwC2SE6x1gDW`
- Preview deployment: `dpl_GHCdY6nEZQLSUCMDDCqnedrs3xAf`, `READY`, target Preview
- External access: public HTTP 200; no login, cookie, password, or query secret
- Production, unchanged: <https://portfolio-site-seven-murex.vercel.app>

## Six direct project routes

- [Release Guardian](https://portfolio-site-gpt-review.vercel.app/ai/release-guardian)
- [p1 Reliability Lab](https://portfolio-site-gpt-review.vercel.app/engineering/p1-reliability-lab)
- [RAG Quality Lab](https://portfolio-site-gpt-review.vercel.app/ai/rag-quality-lab)
- [Privacy Preflight](https://portfolio-site-gpt-review.vercel.app/ai/privacy-preflight-mac)
- [Margin Control Tower](https://portfolio-site-gpt-review.vercel.app/analytics/margin-control-tower)
- [Credit Policy Lab](https://portfolio-site-gpt-review.vercel.app/analytics/credit-policy-lab)

Append `?lang=zh` to any route for the shareable Chinese version. `/analytics/analytics-tandem` is a migration page, not a seventh project.

## Review evidence

- Baseline screenshots: `docs/phase2-public-review-artifacts/baseline/screenshots/`
- Final screenshots: `docs/phase2-public-review-artifacts/final/screenshots/`
- Baseline and final resolution: `docs/phase2-public-review-audit.md`
- Final machine report: `docs/phase2-public-review-artifacts/final/audit.json`
- Final link report: `docs/phase2-public-review-artifacts/final-link-check.json`
- Sanitized Lighthouse report: `docs/phase2-public-review-artifacts/final/lighthouse-mobile.json`

## Repository state

| Repository | State |
| --- | --- |
| Portfolio Site | `codex/portfolio-phase2`; [PR #1](https://github.com/LucisZhang/portfolio-site/pull/1) open, not merged |
| RAG Quality Lab | `codex/c2-claim-reconciliation`; [PR #1](https://github.com/LucisZhang/rag-quality-lab/pull/1) open, not merged |
| p1 Reliability Lab | `codex/portfolio-readme`; [PR #3](https://github.com/LucisZhang/p1-reliability-lab/pull/3) open, not merged |
| Risk-Control-Portfolio | `codex/legacy-label`; [PR #1](https://github.com/LucisZhang/Risk-Control-Portfolio/pull/1) open, not merged |
| privacy-preflight-web | Private candidate at `0063e0f`; publication not authorized |
| margin-control-tower | Private candidate at `68ef751`; publication not authorized |
| credit-policy-lab | Private candidate at `639fbc0`; publication not authorized |

## Verification

Local candidate:

- TypeScript, ESLint, evidence verification, production build, and performance budget passed.
- Playwright: 112 passed, 14 intentional viewport-specific skips, 0 failed.
- Performance budget: 152,262 JavaScript bytes and 138,807 CSS bytes uncompressed.
- Privacy benchmark: 7 fixtures, 19 expected, 18 hit, 0 false positives, 94.7% recall, 100% precision.
- `npm audit --omit=dev --audit-level=high`: 0 vulnerabilities.
- Candidate Gitleaks and TruffleHog scans: 0 leaks; 0 verified and 0 unverified secrets.

Review deployment:

- Localization: 30 dictionary keys, 11 routes in English and Chinese, 0 findings.
- Links: 11 routes, 68 internal targets, 8 external targets, 0 errors; LinkedIn HTTP 999 is one anti-bot warning.
- Browser matrix: 11 routes, 66 states, 65 artifacts, 104 referenced screenshots, 0 issues.
- Lighthouse mobile: Performance 96, Accessibility 100, Best Practices 100, SEO 100; LCP 2.6s, TBT 30ms, CLS 0.
- Review access is public on an isolated Vercel project; the saved reports contain no access token because none is required.
- Production remains `dpl_3Z6REfn6jCR9BXvyBQ4qSP1yChAw`, READY, with unchanged ETag `b34f9f7eceba45aa1138c766998f440c`.
- Vercel's first-deployment default briefly created `dpl_DxeptbuYPQ16sDkJnP3bG7q23MjU` with target Production in the isolated project; it was cancelled while building. The final deployment explicitly used `--target=preview`.

## License and macOS state

Portfolio content remains all rights reserved. The three private candidate repositories have no chosen publication license and cannot be made public as an implied license decision. Synthetic data sources and assumptions are documented in each candidate README.

No formal macOS download is included. The captured source checkpoint built and passed 95 worker tests, but the candidate is thin arm64, ad hoc signed, not notarized or stapled, does not bundle its runtime/dependencies, and has an unresolved PyMuPDF AGPL/commercial licensing gate. See `docs/privacy-macos-release-audit.md`.

## Final publishing actions

After candidate acceptance and separate explicit authorization:

1. Merge the reviewed Portfolio, RAG, p1, and legacy disclosure PRs.
2. Decide licenses, then separately authorize any visibility changes for the three private candidates.
3. Replace the three pending Source states only after those repositories are anonymously accessible.
4. Archive `Risk-Control-Portfolio` only if separately authorized after its disclosure PR merges.
5. Keep macOS Release creation blocked until licensing, packaging, signing, notarization, stapling, entitlements, SHA-256, and anonymous-download checks pass.
6. Deploy Portfolio production only with separate production authorization; this Review did not use `--prod`.

No merge, visibility change, legacy archive, macOS Release, or production deployment is part of this Review candidate.
