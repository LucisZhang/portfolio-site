# GitHub publication manifest

Updated: 2026-07-18

This manifest separates code that an anonymous reviewer can open from private publication
candidates. A private URL must never be rendered as a clickable Portfolio source link.

| Project | Repository and state | Branch / PR | Code license | Data license | Secrets scan | Portfolio label / URL | Blocker before publication |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio Site | [`LucisZhang/portfolio-site`](https://github.com/LucisZhang/portfolio-site), **PUBLIC**, default `main` at verified audit SHA `e6c97f5` | `codex/portfolio-phase2` at `234da138`; [PR #1](https://github.com/LucisZhang/portfolio-site/pull/1) open, mergeable, not merged | All rights reserved; `NOTICE.md` | Project-specific derived, synthetic, fictional, or approved sanitized files only | Exact local candidate history and expanded archives passed the recorded final Gitleaks/TruffleHog boundary; the remote branch remains unchanged | `Portfolio source`; anonymously verified branch URL | Authorize the exact push and expected Git-triggered Preview, then verify anonymously; merge/production/alias actions remain separate gates |
| Release Guardian demo | Actual component inside Portfolio public candidate | Same Portfolio branch / PR | Portfolio rights apply | Four deterministic synthetic scenarios; approved historical files retain exact manifest hashes | Covered by Portfolio scans | `Public sanitized demo source`; `src/components/release/` | Do not describe as private production source |
| p1 Reliability Lab | `LucisZhang/p1-reliability-lab`, public | `codex/portfolio-readme`; [PR #3](https://github.com/LucisZhang/p1-reliability-lab/pull/3) | No license file found | Captured evidence retains repository terms | Staged README diff passed; existing synthetic `business_key` values trigger repository-wide generic-key heuristics | `GitHub repository`; public baseline until PR merges | README PR review; keep environment boundary |
| RAG Quality Lab | `LucisZhang/rag-quality-lab`, public | `codex/c2-claim-reconciliation`; [PR #1](https://github.com/LucisZhang/rag-quality-lab/pull/1) | No license file found | Existing repository datasets retain their recorded sources/terms | Working tree scan passed | `Current claim reconciliation PR` | PR review; current C2 implementation is still not claimed public |
| Privacy Preflight Web | Browser implementation is public inside the Portfolio review branch | Same Portfolio branch / PR | Portfolio rights apply | Fictional generated fixtures only | Covered by Portfolio scans | `Public browser implementation`; `src/components/privacy/` | Keep browser workflow, Mac source build, and distributable status separate |
| Privacy Preflight Mac | Current source remains private; the app ZIP, matching source, notices, CPython license, dependency lock, and SPDX SBOM are staged only in the local Portfolio candidate | No external public release verified | The local preview replaces PyMuPDF with a permissive PDF stack and publishes a matching source snapshot plus dependency/license inventory; this is not legal advice | Fictional examples only | App/source hashes, archive smoke, arm64 inventory, ad-hoc signature, and companion identities are locally verified; Gatekeeper acceptance is not established because local `spctl`/`stapler` checks returned subsystem errors | Local Open-section links are wired; external anonymous availability remains owner-gated and unverified | Authorize the exact Portfolio candidate, push/deploy it, then verify all release links and unnotarized opening instructions anonymously |
| Margin Control Tower | Browser implementation is public inside the Portfolio review branch; the real-data pipeline upgrade is staged only in the clean local Portfolio candidate | Exact destination is the same `codex/portfolio-phase2` branch / PR; candidate SHA is recorded in the gated handoff | Portfolio rights apply; Olist dataset terms and immutable provenance are recorded separately | Fixed-seed fixture plus derived-only public-data artifact; raw source excluded | Exact frozen candidate/history passed the recorded final publication scans | Candidate prewires the exact destination-branch pipeline URL; anonymous resolution is not yet verified | Authorize the exact push and expected Git-triggered Preview together, then verify source and deployment identities |
| Credit Policy Lab | Browser implementation is public inside the Portfolio review branch; the real-data pipeline upgrade is staged only in the clean local Portfolio candidate | Exact destination is the same `codex/portfolio-phase2` branch / PR; candidate SHA is recorded in the gated handoff | Portfolio rights apply; Zenodo dataset terms, DOI, and immutable provenance are recorded separately | Fixed-seed fixture plus derived-only public-data artifact; raw source excluded | Exact frozen candidate/history passed the recorded final publication scans | Candidate prewires the exact destination-branch pipeline URL; anonymous resolution is not yet verified | Authorize the exact push and expected Git-triggered Preview together, then verify source and deployment identities |
| Risk-Control-Portfolio | `LucisZhang/Risk-Control-Portfolio`, public legacy repo | `codex/legacy-label`; [PR #1](https://github.com/LucisZhang/Risk-Control-Portfolio/pull/1) | No license file found | Existing historical repository terms unchanged | Staged README diff passed | `Legacy / earlier experiment` only | Merge disclosure PR; archive only after final authorization |

## Candidate checks and current boundary

The current clean local candidate passed its recorded TypeScript, ESLint, production-build,
Playwright, evidence, Gitleaks, expanded-archive, and bounded TruffleHog checks. The exact results
and exclusions are recorded in `STATE.md`; [`PUBLICATION_CHECKLIST.md`](PUBLICATION_CHECKLIST.md)
remains the required owner-gated path. Passing checks and an already-public repository do not
authorize publishing a new commit or creating a new Preview.

The public Portfolio Review deployment is `dpl_GHCdY6nEZQLSUCMDDCqnedrs3xAf` in isolated project
`prj_HB6kn3PkGaIcNWB0BwC2SE6x1gDW`, at `portfolio-site-gpt-review.vercel.app`. It returns HTTP 200
without a login or secret. The final deployment explicitly targets Preview; production remains
unchanged.

## macOS source boundary

The Privacy Preflight Mac source remains private. The local scoped distribution set now carries a
matching source snapshot, permissive replacement PDF stack, dependency notices, exact CPython
license, SPDX SBOM, SHA-256 identities, arm64/ad-hoc/unnotarized labels, and opening instructions.
Those local files are not public evidence until the exact Portfolio candidate is authorized,
published, and anonymously verified; publication does not imply the private source repository was
made public. No GitHub Release or public binary is currently represented as authorized by this
manifest.
