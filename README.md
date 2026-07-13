# Hsiang Kuo Chang - Portfolio

A bilingual, recruiter-operable portfolio for the data systems, decision tools, and applied-AI
work I build. The Next.js site has three discipline indexes, six current case studies, and one
legacy migration route. Every current project includes an interaction, a source/publication state,
and the files needed to check the claims shown on the page.

## Current case studies

| Track | Project | What a reviewer can do |
| --- | --- | --- |
| Applied AI | Release Guardian | Replay four synthetic change classes, make an approval decision, and compare the walkthrough with separately dated historical evidence. |
| Data engineering | p1 Reliability Lab | Step through five captured failure classes and inspect the recorded recovery graph and reconciliation JSON. |
| Applied AI | RAG Quality Lab | Introduce manifest and backend-contract drift, then run the deterministic verifier. |
| Applied AI | Privacy Preflight | Scan fictional text, images, and PDFs locally in the browser; review regions and verify the generated redacted output. |
| Data analytics | Margin Control Tower | Diagnose a synthetic margin change, adjust a promotion assumption, and compare it with the fixed holdout. |
| Data analytics | Credit Policy Lab | Move from calibrated synthetic probability through expected loss, thresholds, review capacity, and an audit record. |

`/analytics/analytics-tandem` is retained only as a migration route to the two rebuilt analytics
projects. It is not a seventh current case study.

## Review build

The Phase 2 review URL is recorded in [`docs/phase2-release-candidate.md`](docs/phase2-release-candidate.md).
It is a public Vercel Preview, not the production deployment. Add `?lang=zh` to any route for the
Chinese version.

## Local verification

```sh
npm ci
npm run typecheck
npm run lint
npm run verify:evidence
npm run build
npm run verify:performance
npm run test:e2e
npm run check:localization -- --url http://127.0.0.1:3000
npm run check:links -- --url http://127.0.0.1:3000
```

`verify:evidence` checks evidence manifests, hashes, fixed-seed dataset dimensions, and claim
boundaries. `verify:performance` checks the built homepage against its uncompressed JS/CSS budgets.
The browser suite currently passes 112 tests with 14 intentional viewport-specific skips. It
covers English and Chinese at desktop, tablet, and mobile sizes, including the primary interaction
in each project. `ArtifactViewer` provides contextual previews for image, PDF,
JSON, CSV, Markdown, and Mermaid files; Parquet remains an explicitly labelled download.

## Evidence boundaries

- Release Guardian includes only the approved sanitized derivative package. It does not contain
  the private source repository, raw reports, prompts, private scenarios, traces, or original
  screenshots. The public component source is only the synthetic presentation layer.
- p1 Reliability Lab separates historical exports from the environment-specific workstation run.
- RAG Quality Lab reports the verified C2 floor and records the C3 timebox without inventing a
  result for the unavailable stack.
- Privacy Preflight uses fictional demo data and does not distribute a signed application binary.
- Margin Control Tower uses 9,360 synthetic rows generated with seed `2026071301`.
- Credit Policy Lab uses 12,000 synthetic applications generated with seed `2026071302`.
- The analytics fixture results are not real business, model-performance, fairness, or compliance
  claims. Their candidate repositories remain private until a separate publication approval.
- The legacy Analytics Tandem URL remains a migration page and its external demos are prior work.

## Rights

No open-source license is granted for this repository or its portfolio content. See
[`NOTICE.md`](NOTICE.md). The exact public release scope and Release Guardian hash approval are
recorded in [`PUBLICATION.md`](PUBLICATION.md). Linked external repositories and services retain
their own licenses and terms.
