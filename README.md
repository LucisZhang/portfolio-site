# Hsiang Kuo Chang - Portfolio

Bilingual portfolio covering applied AI, reliability engineering, privacy tooling, retrieval
evaluation, and analytics. The site is built with Next.js and statically generates the home page,
three discipline indexes, and five evidence-backed case studies.

## Local verification

```sh
npm ci
npm run typecheck
npm run lint
npm run verify:evidence
npm run test:e2e
```

`verify:evidence` checks the local evidence manifests, hashes, and claim boundaries used by the
case studies. The browser suite covers English and Chinese at desktop, tablet, and mobile sizes.

## Evidence boundaries

- Release Guardian includes only the approved sanitized derivative package. It does not contain
  the private source repository, raw reports, prompts, scenarios, traces, or original screenshots.
- p1 Reliability Lab separates historical exports from the environment-specific workstation run.
- RAG Quality Lab reports the verified C2 floor and records the C3 timebox without inventing a
  result for the unavailable stack.
- Privacy Preflight uses fictional demo data and does not distribute a signed application binary.
- Analytics Tandem links public demos and avoids unverified performance figures.

## Rights

No open-source license is granted for this repository or its portfolio content. See
[`NOTICE.md`](NOTICE.md). The exact public release scope and Release Guardian hash approval are
recorded in [`PUBLICATION.md`](PUBLICATION.md). Linked external repositories and services retain
their own licenses and terms.
