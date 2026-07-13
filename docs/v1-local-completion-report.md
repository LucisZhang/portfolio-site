# Portfolio v1 local completion report

Date: 2026-07-12
Status: superseded by completed sanitized publication on 2026-07-12

## Delivered pages

- `/ai/release-guardian`
- `/engineering/p1-reliability-lab`
- `/ai/rag-quality-lab`
- `/ai/privacy-preflight-mac`
- `/analytics/analytics-tandem`

The home page, three discipline indexes, and five project pages are statically generated. Every
page supports English and Chinese through the shared locale control. Every case study now renders
an explicit audience field in addition to the problem, role, constraints, architecture, evidence,
and limits required by the portfolio specification.

## Evidence boundaries

- Release Guardian presents funded-live aggregate gates beside the 30/44 strict residual, renders
  five high-priority sanitized W3 consistency findings, and links the full 13-finding CSV. Its
  three candidate screenshots identify deterministic/stub context. Exact manifest approval is
  still required before publication.
- p1 renders all five historical U1-U5 artifact rows with phase, run ID, SHA256, command, and
  direct JSON links. It separately presents run `20260711T034018Z-local-mac`, links the workstation
  reproduction guide, and limits the reproduction claim to the recorded environment.
- RAG uses the verified C2 data/evaluation floor. C3 is explicitly recorded as closed without
  metrics because the real hybrid stack was unavailable inside the offline timebox.
- Privacy uses only fictional demo data, actual local worker outputs, a current SwiftUI app
  capture, and visible red-line validation results for text replacement, raster image redaction,
  and the image-only PDF export. Binary distribution remains out of scope.
- Analytics uses direct public links and qualitative workflow descriptions without displaying or
  quoting unverified dashboard or model numbers.

## Verification

```text
npm run typecheck       PASS
npm run lint            PASS
npm run verify:evidence PASS
npm run test:e2e        PASS, 54/54
npm audit               PASS, 0 vulnerabilities
```

The production build pre-generates all 12 app routes. Browser QA covers 1440x900, 1024x768, and
390x844 in EN/ZH and checks HTTP success, visible main content, horizontal overflow, broken media,
browser errors, and forbidden stale claims.

The production Lighthouse audit of the home page scored Performance 97, Accessibility 100,
Best Practices 100, and SEO 100. The concise machine-readable result is recorded in
`docs/lighthouse-homepage-20260712.json`.

## GATE 2c

GATE 2c was subsequently approved. The final public outputs are:

- Source: `https://github.com/LucisZhang/portfolio-site`, single clean commit `e6c97f5`
- Production: `https://portfolio-site-seven-murex.vercel.app`
- Internal audit history: private repository `LucisZhang/portfolio-site-internal`

The public repository was rebuilt from a strict allowlist after an initial publication audit found
that the integration repository contained internal pipeline documents. No internal history was
carried into the replacement public repository.

Historical gate requirements before approval were:

Before any remote, public Git history, upload, deployment, or publication:

1. Approve or reject the five local pages and their claim boundaries.
2. Approve or reject Release Guardian manifest
   `f37967289db4816cfd5f23bdad7ca281b979f52420c4bf65b34b0383a6796eb8` and the three screenshot
   hashes in `docs/release-guardian-v1-release-record.md`.
3. Record the Release Guardian license/notice treatment, or confirm that no notice is required.
4. Explicitly authorize the intended remote, RAG public-code sync choice, and deployment target.
