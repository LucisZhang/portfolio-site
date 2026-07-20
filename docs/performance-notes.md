# Performance notes

Updated: 2026-07-19

The production build prerenders 15/15 pages for the fixed route set; `/api/assistant` and
`/artifact` remain intentionally dynamic. `npm run verify:performance` reads the generated
Next.js client-reference and build manifests rather than relying on source estimates. It fails if
the complete homepage initial JavaScript exceeds a 200,000-byte gzip transfer estimate, if the
route-owned JavaScript exceeds 200,000 raw bytes, or if shared CSS exceeds 145,000 raw bytes.
The complete JavaScript measurement includes Next.js `rootMainFiles`; the route-only number is kept
separately so a framework upgrade cannot hide application-bundle growth.

Current production-build result:

- complete initial JavaScript: 549,510 bytes raw / 173,802-byte gzip transfer estimate;
- route-owned homepage JavaScript: 119,339 bytes raw;
- shared homepage CSS: 137,039 bytes raw;
- complete static chunk directory: 6,284,000 bytes;
- browser-local Privacy runtime assets: 17,774,467 bytes, fetched only after the relevant OCR/PDF
  workflow is opened or run;
- React Flow is dynamically loaded only by the p1 replay desktop diagram;
- project fixtures and evidence files are fetched by their project surfaces, not by the homepage.

The main homepage JavaScript sources are the Next.js runtime, bilingual state, command palette,
project index, and icon components. The largest growth sources outside the homepage are local OCR
and PDF runtimes, React Flow, and project-specific interactive labs. These remain route- or
interaction-scoped; the site has no always-on model or backend connection.

The exact `d8bc8492…` local production-mode Lighthouse 13.4.0 run passed the 0.90 performance gate
on all four routes. Performance was home 98, Margin 97, Privacy 91, and Release 92; Accessibility,
Best Practices, and SEO were 100 throughout. The homepage recorded FCP 1.057 s, LCP 2.497 s,
TBT 40 ms, and CLS 0, with no runtime error or run warning. The current machine record is
`docs/phase2-public-review-artifacts/goal2-final/lighthouse-summary.json`, SHA-256
`5afdbd888c145c6532418f85dc5b11ccd7b8723e8e20183ffedf3a7f4fb62949`. This is exact local
candidate evidence, not a deployed-Preview or field-performance claim. The earlier `eb08c00…`
record remains separately archived as historical evidence.

The protected Vercel Preview was sampled three times through Vercel's authenticated automation
bypass. All responses were HTTP 200 and 51,324 bytes; TTFB ranged from 0.604 to 0.918 seconds and
total response time from 0.628 to 0.940 seconds. A second Lighthouse score is not reported because
the Preview remains behind Vercel Authentication; the local production-mode Lighthouse run is the
comparable browser audit. Those remote samples describe an earlier protected Preview, not the
current d8bc candidate; no current-candidate commit, push, PR, or deployment was performed.
