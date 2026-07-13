# Phase 1 verification record — 2026-07-09

All quality gates from the pipeline spec (docs/fable-portfolio-pipeline-prompt.md, Phase 1) were run locally and passed.

## Dependency install (previously BLOCKED, now resolved)

- Root cause of the earlier "hung" installs: npm traffic routes through a local VPN/proxy tunnel (fake-IP range 198.18.0.x). The tunnel's path to registry.npmjs.org intermittently stalled — individual metadata fetches measured 30–92 s (npm debug logs, 2026-07-09).
- Fix: safely terminated the stalled install (SIGTERM, confirmed exit), re-ran with `--registry=https://registry.npmmirror.com` as a command-line flag only (no .npmrc changes). Measured ~8× faster metadata and ~1.8 MB/s tarballs through that CDN.
- Result: `added 569 packages in 4m`, exit code 0. `node_modules/` (703 MB) and `package-lock.json` present.
- Note: `package-lock.json` `resolved` URLs point at registry.npmmirror.com (same tarballs, identical `integrity` hashes; publicly reachable, so CI/Vercel installs work). Can be normalized to registry.npmjs.org URLs later on a healthy network if desired.

## Quality gates

| Gate | Command | Result |
|---|---|---|
| TypeScript | `npm run typecheck` (`tsc --noEmit`) | PASS (clean) |
| Lint | `npm run lint` (`eslint`) | PASS (clean, after 1 fix below) |
| Build | `npm run build` (`next build`, Next.js 16.2.10/Turbopack) | PASS — compiled 3.3 s; 12/12 pages prerendered static/SSG |
| Lighthouse (homepage) | `npx lighthouse http://localhost:3100/` (headless Chrome, prod build via `next start`) | Performance **91** (gate ≥ 90) · Accessibility 96 · Best practices 100 · SEO 100 |

Lighthouse key metrics (homepage): FCP 0.8 s · LCP 3.5 s · TBT 10 ms · CLS 0 · Speed Index 1.6 s. Full report JSON was produced in the session scratchpad (not committed; re-runnable with the command above).

## Lint fix applied

`src/lib/i18n.ts` — `react-hooks/set-state-in-effect` error: locale detection called `setState` synchronously inside `useEffect`. Rewrote locale state as a small external store read via `useSyncExternalStore` (server snapshot `"en"`, client snapshot from localStorage/`navigator.language`), which is SSR/hydration-safe and lint-clean. Behavior unchanged: EN default on server, detected locale applied on hydration, switcher persists to localStorage.

## Route smoke test (prod server, port 3100)

`/`, `/analytics`, `/engineering`, `/ai`, `/ai/release-guardian`, `/engineering/p1-reliability-lab` → all HTTP 200; unknown route → 404. Server stopped after the checks (no listener left on port 3100).

## Deferred (not blocking Phase 1 closure per operator instruction 2026-07-09)

- **Vercel preview deploy** — operator instructed local preview/Lighthouse as the feasible check and no publishing of URLs. Preview deploy remains a pre-Phase-3 item, to be done when the human approves connecting the repo to Vercel.
