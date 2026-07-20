# GitHub publication manifest

Updated: 2026-07-18

This manifest separates code that an anonymous reviewer can open from private publication
candidates. A private URL must never be rendered as a clickable Portfolio source link.

The remote states in this table are a dated pre-publication snapshot captured on 2026-07-18 08:03
Asia/Shanghai. They are not timeless claims. After any authorized push, inspect the live branch,
PR, and deployment rather than reading `234da138` below as the current head.

| Project | Repository and state | Branch / PR | Code license | Data license | Secrets scan | Portfolio label / URL | Blocker before publication |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio Site | [`LucisZhang/portfolio-site`](https://github.com/LucisZhang/portfolio-site), **PUBLIC**, default `main` at verified audit SHA `e6c97f5` | Pre-publication snapshot: `codex/portfolio-phase2` at `234da138`; [PR #1](https://github.com/LucisZhang/portfolio-site/pull/1) open, mergeable, not merged | All rights reserved; `NOTICE.md` | Project-specific derived, synthetic, fictional, or approved sanitized files only | Exact local candidate history and expanded archives passed the recorded final Gitleaks/TruffleHog boundary | `Portfolio source`; live branch identity must be checked before calling the candidate anonymous | Authorize the exact push and expected Git-triggered Preview, then verify anonymously; merge/production/alias actions remain separate gates |
| Release Guardian demo | Actual component inside Portfolio public candidate | Same Portfolio branch / PR | Portfolio rights apply | Four deterministic synthetic scenarios; approved historical files retain exact manifest hashes | Covered by Portfolio scans | `Public sanitized demo source`; `src/components/release/` | Do not describe as private production source |
| p1 Reliability Lab | `LucisZhang/p1-reliability-lab`, public | `codex/portfolio-readme`; [PR #3](https://github.com/LucisZhang/p1-reliability-lab/pull/3) | No license file found | Captured evidence retains repository terms | Staged README diff passed; existing synthetic `business_key` values trigger repository-wide generic-key heuristics | `GitHub repository`; public baseline until PR merges | README PR review; keep environment boundary |
| RAG Quality Lab | `LucisZhang/rag-quality-lab`, public | `codex/c2-claim-reconciliation`; [PR #1](https://github.com/LucisZhang/rag-quality-lab/pull/1) | No license file found | Existing repository datasets retain their recorded sources/terms | Working tree scan passed | `Current claim reconciliation PR` | PR review; current C2 implementation is still not claimed public |
| Privacy Preflight Web | Browser implementation is public inside the Portfolio review branch | Same Portfolio branch / PR | Portfolio rights apply | Fictional generated fixtures only | Covered by Portfolio scans | `Public browser implementation`; `src/components/privacy/` | Keep browser workflow, Mac source build, and distributable status separate |
| Privacy Preflight Mac | Private upstream source remains separate; this candidate commit carries the scoped app ZIP, matching source snapshot, notices, CPython license, dependency lock, and SPDX SBOM | Candidate-relative distribution set; no GitHub Release claim | The candidate replaces PyMuPDF with a permissive PDF stack and includes a matching source snapshot plus dependency/license inventory; this is not legal advice | Fictional examples only | App/source hashes, archive smoke, arm64 inventory, ad-hoc signature, and companion identities are locally verified; Gatekeeper acceptance is not established because local `spctl`/`stapler` checks returned subsystem errors | Open-section links target files in this commit; live anonymous availability must be verified | Authorize the exact push and expected Git-triggered Preview, then verify all release links and unnotarized opening instructions anonymously |
| Margin Control Tower | This candidate commit contains the browser implementation, real-data pipeline, provenance, and derived artifacts | Intended destination is `codex/portfolio-phase2` / PR #1; live head must be checked after push | Portfolio rights apply; Olist dataset terms and immutable provenance are recorded separately | Fixed-seed fixture plus derived-only public-data artifact; raw source excluded | Exact frozen candidate/history passed the recorded final publication scans | Candidate prewires the destination-branch pipeline URL; commit presence does not prove live anonymous resolution | Authorize the exact push and expected Git-triggered Preview together, then verify source and deployment identities |
| Credit Policy Lab | This candidate commit contains the browser implementation, real-data pipeline, provenance, and derived artifacts | Intended destination is `codex/portfolio-phase2` / PR #1; live head must be checked after push | Portfolio rights apply; Zenodo dataset terms, DOI, and immutable provenance are recorded separately | Fixed-seed fixture plus derived-only public-data artifact; raw source excluded | Exact frozen candidate/history passed the recorded final publication scans | Candidate prewires the destination-branch pipeline URL; commit presence does not prove live anonymous resolution | Authorize the exact push and expected Git-triggered Preview together, then verify source and deployment identities |
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

The Privacy Preflight Mac upstream source repository remains private. This candidate commit carries
a scoped distribution set with a matching source snapshot, permissive replacement PDF stack,
dependency notices, exact CPython license, SPDX SBOM, SHA-256 identities,
arm64/ad-hoc/unnotarized labels, and opening instructions. Presence in a commit does not by itself
prove that the commit or downloads are anonymously reachable; verify the live branch after the
owner gate. Publishing this candidate does not make the upstream private repository public or
authorize a GitHub Release.
