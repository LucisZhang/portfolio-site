# GitHub publication manifest

Updated: 2026-07-13

This manifest separates code that an anonymous reviewer can open from private publication
candidates. A private URL must never be rendered as a clickable Portfolio source link.

| Project | Repository and state | Branch / PR | Code license | Data license | Secrets scan | Portfolio label / URL | Blocker before publication |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio Site | `LucisZhang/portfolio-site`, public | `codex/portfolio-phase2`; [PR #1](https://github.com/LucisZhang/portfolio-site/pull/1) open, not merged | All rights reserved; `NOTICE.md` | Project-specific synthetic or approved sanitized files only | Candidate Gitleaks and TruffleHog scans passed; final follow-up diff is rescanned before push | `Portfolio source`; feature-branch URL during review | PR review and final production authorization |
| Release Guardian demo | Actual component inside Portfolio public candidate | Same Portfolio branch / PR | Portfolio rights apply | Four deterministic synthetic scenarios; approved historical files retain exact manifest hashes | Covered by Portfolio scans | `Public sanitized demo source`; `src/components/release/` | Do not describe as private production source |
| p1 Reliability Lab | `LucisZhang/p1-reliability-lab`, public | `codex/portfolio-readme`; [PR #3](https://github.com/LucisZhang/p1-reliability-lab/pull/3) | No license file found | Captured evidence retains repository terms | Staged README diff passed; existing synthetic `business_key` values trigger repository-wide generic-key heuristics | `GitHub repository`; public baseline until PR merges | README PR review; keep environment boundary |
| RAG Quality Lab | `LucisZhang/rag-quality-lab`, public | `codex/c2-claim-reconciliation`; [PR #1](https://github.com/LucisZhang/rag-quality-lab/pull/1) | No license file found | Existing repository datasets retain their recorded sources/terms | Working tree scan passed | `Current claim reconciliation PR` | PR review; current C2 implementation is still not claimed public |
| Privacy Preflight Web | `LucisZhang/privacy-preflight-web`, **private** at `0063e0f` | `main`; no public PR | No license file; publication license undecided | Fictional generated fixtures only | Gitleaks and TruffleHog passed on candidate | Non-clickable `Source publication pending` | Decide code license and explicitly authorize repository visibility change |
| Margin Control Tower | `LucisZhang/margin-control-tower`, **private** at `68ef751` | `main`; no public PR | No license file; publication license undecided | Fixed-seed original synthetic data, seed `2026071301`; no external dataset license asserted | Gitleaks and TruffleHog passed on candidate | Non-clickable `Source publication pending` | Decide code/data license and explicitly authorize repository visibility change |
| Credit Policy Lab | `LucisZhang/credit-policy-lab`, **private** at `639fbc0` | `main`; no public PR | No license file; publication license undecided | Fixed-seed original synthetic data, seed `2026071302`; no inherited pickle is used | Gitleaks and TruffleHog passed on candidate | Non-clickable `Source publication pending` | Decide code/data license and explicitly authorize repository visibility change |
| Risk-Control-Portfolio | `LucisZhang/Risk-Control-Portfolio`, public legacy repo | `codex/legacy-label`; [PR #1](https://github.com/LucisZhang/Risk-Control-Portfolio/pull/1) | No license file found | Existing historical repository terms unchanged | Staged README diff passed | `Legacy / earlier experiment` only | Merge disclosure PR; archive only after final authorization |

## Candidate repository checks already completed

The three private candidates each passed TypeScript, ESLint, production build, and desktop/tablet/
mobile Playwright checks. Privacy additionally passed its fixed seven-fixture OCR benchmark. Margin
and Credit regenerated their JSON/CSV/Parquet outputs from the scoped fixed-seed generators. Gitleaks
reported no leaks, and TruffleHog reported zero verified and zero unverified secrets for all three
candidates. These checks do not authorize making a repository public.

The Portfolio Review deployment is `dpl_E4UoaJLJzk1GDgL5WPBGYDMoWwu9` at
`portfolio-site-phase2-review.vercel.app`. Access uses a Vercel Shareable Link whose secure
parameter is distributed out of band and is not stored in this manifest, Git history, screenshots,
or machine reports. The deployment is Preview-only; production remains unchanged.

## macOS source boundary

The Privacy Preflight Mac source remains private. It is not part of the Web candidate because its
Python dependency licensing, runtime packaging, signing, notarization, stapling, entitlements, and
release approval are unresolved. No GitHub Release or public binary is authorized.
