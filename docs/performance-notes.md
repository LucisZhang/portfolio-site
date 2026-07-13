# Performance notes

Updated: 2026-07-13

The production build generates 14 static pages. `npm run verify:performance` reads the generated
Next.js client-reference manifest rather than relying on source estimates and fails if the homepage
exceeds 200,000 uncompressed JavaScript bytes or 125,000 uncompressed CSS bytes.

Current production-build result:

- homepage JavaScript entries: 150,307 bytes uncompressed;
- shared homepage CSS: 106,977 bytes uncompressed;
- complete static chunk directory: approximately 2.0 MB;
- browser-local Privacy runtime assets: 17,774,467 bytes, fetched only after the relevant OCR/PDF
  workflow is opened or run;
- React Flow is dynamically loaded only by the p1 replay desktop diagram;
- project fixtures and evidence files are fetched by their project surfaces, not by the homepage.

The main homepage JavaScript sources are the Next.js runtime, bilingual state, command palette,
project index, and icon components. The largest growth sources outside the homepage are local OCR
and PDF runtimes, React Flow, and project-specific interactive labs. These remain route- or
interaction-scoped; the site has no always-on model or backend connection.

A local production-mode Lighthouse 13.4.0 audit using mobile defaults passed the 0.90 performance
gate: Performance 96, Accessibility 100, Best Practices 100, SEO 100; FCP 0.9 s, LCP 2.8 s,
TBT 0 ms, CLS 0, and no run warnings. The compact audit record is stored in
`docs/lighthouse-homepage-operable-20260713.json`.

The protected Vercel Preview was sampled three times through Vercel's authenticated automation
bypass. All responses were HTTP 200 and 51,324 bytes; TTFB ranged from 0.604 to 0.918 seconds and
total response time from 0.628 to 0.940 seconds. A second Lighthouse score is not reported because
the Preview remains behind Vercel Authentication; the local production-mode Lighthouse run is the
comparable browser audit, while remote route/asset/header checks validate the deployed output.
