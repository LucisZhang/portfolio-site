# Public Portfolio state

Updated: 2026-07-18

This file is the public, recruiter-safe status of the `codex/portfolio-phase2` feature branch. It
does not contain private workspace paths, internal coordination history, credentials, raw source
datasets, or a production-deployment claim.

## Commit-local delivery

- Six bilingual project pages and the legacy `/analytics/analytics-tandem` compatibility route are
  statically generated. Homepage order is Release Guardian, RAG Quality Lab, Privacy Preflight,
  Margin Control Tower, Streaming Reliability Lab, and Credit Policy Lab.
- Margin Control Tower includes the reproducible Olist pipeline, a derived-only Parquet artifact,
  versioned anomaly drill-down, elasticity evidence, ten fail-closed runtime checks, and a dedicated
  Methods / Evidence / What changed with real data section.
- Credit Policy Lab includes the reproducible time-ordered credit pipeline, calibrated baseline and
  challenger models, per-row SHAP reason codes, a derived-only scored artifact, observed-outcome
  swap-set rates, ten fail-closed runtime checks, and its own Methods / Evidence / What changed with
  real data section.
- Privacy Preflight includes the corrected Chinese phone rule, merged/deduplicated PDF regions,
  aligned scanned-PDF overlays, a genuine three-page fixture, in-page reconstructed-PDF preview,
  and an arm64 standalone app preview. The app inside the ZIP is ad-hoc signed only, not Developer
  ID signed or notarized; a runtime-matching source ZIP, notices, CPython license, lockfile, and SPDX
  SBOM are included.
- The metadata-stripped source ZIP is 202,613 bytes at SHA-256
  `4138cd3b61a17b4f7b36a5e104389aa229f5e638c3d3a019ce6aa26171624295`; it excludes internal
  coordination files, caches, build outputs, editable-install provenance, and first-party Swift
  debug paths. The app ZIP rebuilt from it is 33,930,369 bytes at SHA-256
  `360083a7fab6b60600f597b28a32c533a9df932766c21b80cba80e6c56350911`.
- Release Guardian preserves funded-live, deterministic-stub, and synthetic evidence as separate
  classes; p1 keeps historical and local-reproduction boundaries separate; RAG remains at its C2
  evaluation floor and does not invent a C3 result.

## Evidence and reproducibility

- Start with [`README.md`](README.md), [`docs/EVIDENCE_INDEX.md`](docs/EVIDENCE_INDEX.md), and
  [`docs/PUBLICATION_CHECKLIST.md`](docs/PUBLICATION_CHECKLIST.md).
- Pipeline inputs, retrieval dates, licenses, hashes, commands, cleaning decisions, split rules,
  and output identities are documented under `pipelines/olist-margin/` and
  `pipelines/credit-backtest/`. Raw Olist and credit rows are excluded from Git.
- Runtime failures remain fail-closed: missing, malformed, stale-hash, or contract-invalid real-data
  artifacts leave the governed synthetic source active and show an explicit pending/blocked state.
- The current candidate browser summary is published at
  `public/case-studies/privacy-preflight/goal-candidate-e2e.json`; historical reports are labeled as
  historical and are not substitutes for the exact-candidate result.
- Exact-artifact worker replay passed 96/96 tests. The clean serialized browser run passed 143
  cases, skipped 22 intentional duplicate/fallback cases, and failed 0 across desktop, tablet, and
  mobile using the locally selected Edge Chromium test channel; the tracked browser default remains
  Chrome. TypeScript, lint, evidence verification, production build, performance budget, and offline
  dependency audit also passed, with 0 known production-dependency vulnerabilities.
- The local public-review audit covered 11 routes, 66 bilingual viewport pages, 83 artifacts, and
  104 screenshots. Its only two high findings—and the independent link check's only two errors—are
  the future public-branch analytics pipeline URLs, which remain HTTP 404 until the owner-authorized
  branch push. They must be rerun anonymously after that gate.

## Publication gates

This commit intentionally makes no claim that it has already been pushed or deployed. Push and
Preview remain separate owner decisions, but the current Vercel Git connection couples their
execution: the `portfolio-site` project watches this GitHub repository, uses `main` as production,
has no Ignored Build Step, and previously created a Preview automatically for this feature branch.
Therefore a branch push is expected to create a new non-production Preview.

1. Obtain explicit owner authorization for the exact frozen candidate SHA and destination branch.
2. Independently obtain explicit owner authorization for the expected automatic non-production
   Preview before pushing. If only the push is authorized, stop; suppressing the automatic Preview
   would itself require a separately reviewed Vercel configuration change.
3. After both authorizations, fast-forward only
   `LucisZhang/portfolio-site:codex/portfolio-phase2`. Do not force-push or merge PR #1.
4. Verify the branch, pipeline source links, evidence links, and downloads anonymously. Confirm the
   Git-triggered deployment is Preview—not production—and records the exact candidate SHA.
5. Run the required real-browser deployed-preview verification. A local browser pass or an older
   Preview does not satisfy this gate.
6. PR merge, production deployment, alias changes, repository-visibility changes, GitHub Releases,
   and paid actions each require their own explicit authorization.

The immutable commit can record only its pre-publication boundary. Anonymous URLs, deployment ID,
timestamps, and post-push hash checks must be recorded after those owner-gated actions occur.
