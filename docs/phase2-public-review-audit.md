# Phase 2 public Review audit

Updated: 2026-07-18 08:10 Asia/Shanghai (00:10 UTC)

## Baseline

- Review origin: <https://portfolio-site-gpt-review.vercel.app>
- Captured: 2026-07-13 13:39 Asia/Shanghai (05:39 UTC)
- Coverage: 11 routes, 66 route/locale/viewport states, 49 public files, 8 external links, 104 screenshots
- Raw report: [baseline/audit.json](phase2-public-review-artifacts/baseline/audit.json)

The baseline established the original information hierarchy, raw-file experience, shallow Analytics fixtures, URL-localization gap, mobile density, and Vercel Preview Toolbar console error. GitHub HTTP 429 and LinkedIn HTTP 999 were treated as automation limits rather than confirmed broken links.

## Final Review

- Review origin: <https://portfolio-site-gpt-review.vercel.app>
- Isolated Vercel project: `prj_HB6kn3PkGaIcNWB0BwC2SE6x1gDW`
- Preview deployment: `dpl_GHCdY6nEZQLSUCMDDCqnedrs3xAf`, `READY`, target Preview
- Access: public HTTP 200 with no Vercel Authentication, cookie, password, or query secret
- Browser: Google Chrome through Playwright, fresh contexts, service workers blocked
- Viewports: 1440 x 1000, 1024 x 900, 390 x 844
- Locales: English and Chinese, including shareable `?lang=zh` navigation and refresh
- Coverage: 11 routes, 66 page states, 65 public artifacts, 8 external links, 104 referenced screenshots
- Raw report: [final/audit.json](phase2-public-review-artifacts/final/audit.json)
- Link report: [final-link-check.json](phase2-public-review-artifacts/final-link-check.json)
- Lighthouse report: [final/lighthouse-mobile.json](phase2-public-review-artifacts/final/lighthouse-mobile.json)

All 66 page states and all 65 public artifacts returned HTTP 200. The final report records zero critical, high, medium, or low issues; zero document-level horizontal overflow; zero application console errors; zero page exceptions; and successful project interactions. Next.js ArtifactViewer prefetches cancelled when an audited page closed are excluded as expected browser lifecycle events.

The link checker covered 68 internal targets and 8 external targets with zero errors. LinkedIn returned HTTP 999 to the automated request and remains a recorded anti-bot warning. Mobile Lighthouse scored Performance 96, Accessibility 100, Best Practices 100, and SEO 100; LCP was 2.6 seconds, TBT 30 milliseconds, and CLS 0.

## Finding resolution

| ID | Final status | Verification |
| --- | --- | --- |
| A01 | Fixed | Recruiter-facing copy now leads with the problem, audience, build, and result; audit vocabulary is kept in provenance and boundary sections. |
| A02 | Fixed | Chinese is represented by `?lang=zh`, survives navigation and refresh, and sets `html lang="zh-CN"`; 30 dictionary keys have parity. |
| A03 | Fixed | `ArtifactViewer` handles PNG/JPEG/SVG, PDF, JSON, CSV, Markdown, and Mermaid with context and return paths; Parquet and explicit full-data exports remain downloads. |
| A04 | Fixed | Privacy image export and the two-page PDF review completed in the final desktop interaction without black compositing regions or runtime errors. See [PDF review](phase2-public-review-artifacts/final/screenshots/en-desktop-ai-privacy-preflight-mac-pdf-review.png). |
| A05 | Fixed | Mobile layouts expose step lists, stable controls, readable tables/graphs, and project-specific primary interactions with zero horizontal overflow. |
| A06 | Fixed | Release links to sanitized public component source; p1 and RAG link to public repositories/PRs; the three private candidates render non-clickable publication-pending states. |
| A07 | Fixed | Each project leads into an operable lab and keeps the latest decision/result visible in the interaction workflow. |
| A08 | Fixed | Release Guardian presents four synthetic replay scenarios, approval state, evidence classes, and the immutable 132-run aggregate / 30-of-44 strict residual boundary. |
| A09 | Fixed | p1 uses a full-width React Flow graph on desktop, a mobile step list, failure replay, node detail, and original/download controls. |
| A10 | Fixed | RAG copy now frames the lab as deterministic data-contract regression detection and separates current C2 facts from archived historical claims. |
| A11 | Fixed | Margin uses fixed seed `2026071301`, 9,360 rows, 52 weeks, 20 products, 5 categories, 3 regions, 3 channels, and an 8-week holdout. |
| A12 | Fixed | Credit uses fixed seed `2026071302`, 12,000 applications, 9,945 loans, 12 vintages, 6,000/3,000/3,000 splits, capacity-aware review, drift, economics, and an audit record. |
| A13 | Fixed | `/analytics/analytics-tandem` is an explicit migration page linking to the two independent greenfield replacements, not a seventh featured project. |
| A14 | Fixed | Vercel Preview Feedback is disabled for new Preview builds; the final audit records no injected `vercel.live` console error without weakening the application CSP. |
| A15 | Verified with automation caveat | All project, GitHub, Hugging Face, and mail destinations passed; LinkedIn HTTP 999 remains classified as anti-bot warning, not a site error. |
| A16 | Fixed | Home project rows preserve project-specific status and action meaning on mobile; pending source/resume states are non-clickable text. |

## Boundaries

- The final Review is a Preview deployment created with explicit `--target=preview`; it was not promoted and no `--prod` command was used.
- Vercel initially defaulted the first deployment in the isolated project to target Production despite no `--prod`; `dpl_DxeptbuYPQ16sDkJnP3bG7q23MjU` was cancelled while building and never reached READY.
- Production remains `dpl_3Z6REfn6jCR9BXvyBQ4qSP1yChAw`; its ETag remains `b34f9f7eceba45aa1138c766998f440c`.
- Public access is isolated to `portfolio-site-phase2-public-review`; the existing production project and its protected Preview policy were not opened globally.
- Privacy, Margin, and Credit repositories remain private. Their Portfolio source labels do not imply publication authorization.
- No formal macOS binary is published; licensing, packaging, signing, notarization, and stapling gates remain open.

## 2026-07-17 Goal candidate local audit — pre-deployment

- Review origin: `http://127.0.0.1:4173/`; this is local evidence, not deployed-preview D4.
- Captured: 2026-07-18 07:39 Asia/Shanghai (2026-07-17 23:39 UTC).
- Coverage: 11 routes, 66 bilingual viewport pages, 83 artifacts, 16 external links, and 104
  screenshots.
- Raw report and screenshots:
  [`goal-candidate-local-20260717/`](phase2-public-review-artifacts/goal-candidate-local-20260717/).
- Fresh link check: 84 internal targets and 16 external targets; the only two errors are the future
  public-branch `pipelines/olist-margin` and `pipelines/credit-backtest` URLs returning HTTP 404
  before the owner-authorized push. LinkedIn HTTP 999 is retained as an automation warning.
- The historical `baseline/` directory remains byte-for-byte at public checkpoint `234da138`; it
  was not repurposed for this candidate. The candidate report's embedded `label` and browser string
  are disclosed in its companion README rather than silently rewriting the raw report.
