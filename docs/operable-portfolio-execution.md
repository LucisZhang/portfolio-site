# Operable portfolio execution

Updated: 2026-07-13
Branch: `codex/operable-portfolio`

The public v1 remains the evidence baseline. This branch upgrades the portfolio from static case-study archives to recruiter-operable project surfaces without weakening provenance, limitations, or public/private boundaries.

## Evidence modes

- **Captured Run**: replay of a real, public, recorded run. p1 only.
- **Synthetic Sandbox**: visibly fictional user-controlled scenarios. Privacy examples, Release Guardian, Analytics.
- **Deterministic Verifier**: browser-executed hash, contract, rule, drift, or reconciliation logic. Privacy, RAG, Analytics.
- **Live Demo**: reserved for a real connected runtime. No current upgrade module uses this label.

## Execution status

| Priority | Deliverable | Current status |
| --- | --- | --- |
| 1 | One Analytics-only Fable direction call | Complete once; no retry; no further Fable use |
| 2 | Privacy Preflight Web | Scoped text/image/PDF vertical slice complete and verified; broader OCR/performance hardening deferred |
| 3 | p1 Failure Replay Console | Complete: five real U6 scenarios, eight deterministic stages, controls, provenance, and environment limitation |
| 4 | RAG claim reconciliation + Manifest & Drift Lab | Complete: claim registry, browser verifier, public-sync boundary, and unpushed README patch |
| 5 | Release Guardian Sanitized Change Review Replay | Complete: four synthetic scenarios, deterministic retrievers/risk/plans, approval/audit, and balanced live/strict evidence |
| 6 | Margin Control Tower + Credit Policy Lab | Complete: two greenfield fixed-seed vertical slices, contracts, registries, monitoring, README/architecture, and route split |
| 7 | Homepage identity/contact/navigation | Complete: verified name/contact profiles, three-discipline entry points, and an explicit pending-resume boundary |
| 8 | Preview deployment | Complete: READY Preview from a clean no-history source; scoped Shareable Link, remote routes, assets, headers, and production isolation verified |
| 9 | Public GPT review copy | Complete: isolated READY Preview with fixed anonymous alias; 11 routes and eight exact assets verified without credentials |

## Current verification

- `npm run typecheck`: pass
- `npm run lint`: pass
- `npm run verify:evidence`: pass
- `npm run verify:performance`: pass, homepage 150,307 JS bytes and 106,977 CSS bytes uncompressed
- `npm run build`: pass, 14 static pages
- `npx playwright test`: 102 pass, 6 intentional duplicate skips across desktop, tablet, and mobile
- Lighthouse mobile defaults: Performance 96, Accessibility 100, Best Practices 100, SEO 100
- Automated accessibility: no serious or critical Axe violations on seven core operable routes
- Security headers: CSP, frame denial, MIME sniffing protection, referrer policy, and permissions policy pass in production mode
- Dependency audit: 0 vulnerabilities
- Preview: `dpl_3pA2zqENc1qbcfJZJP8MoogBpr54`, target `preview`, 11/11 routes HTTP 200 via authenticated verification and anonymous Shareable Link session
- Preview assets: eight evidence/runtime samples HTTP 200 and byte-identical to local authoritative files
- Public review: `https://portfolio-site-gpt-review.vercel.app` points to isolated deployment `dpl_9YRycNS9bx7XQq4SWVWgYZb8NcCx`, target `preview`; 11/11 routes HTTP 200 anonymously
- Production isolation: production ETag remained `b34f9f7eceba45aa1138c766998f440c`

Detailed Privacy coverage and limitations are maintained in `docs/privacy-web-parity.md`.
