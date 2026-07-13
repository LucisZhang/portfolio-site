# Portfolio build rules

## Sources of truth

- Operable-portfolio upgrade status: `docs/operable-portfolio-execution.md`
- Analytics North Stars: `docs/fable5-analytics-direction.md`
- Privacy Web parity: `docs/privacy-web-parity.md`
- Published v1 evidence cutline: `docs/portfolio-direction-freeze.md`
- Current pipeline/gates: `STATE.md` and `docs/RUNBOOK.md`
- Project evidence boundaries: `docs/project-state/*.md`
- Local v1 audit: `docs/v1-local-completion-report.md`

The operable-portfolio upgrade supersedes the old v1 implementation stop, while the v1 evidence
cutline remains authoritative for claims. Do not reintroduce fabricated
sample telemetry, unverified analytics figures, legacy RAG claims, or a heavyweight project run.

## Architecture

- Next.js App Router + TypeScript + Tailwind CSS.
- Routes: `/`, `/[track]`, and `/[track]/[project]`; tracks are `engineering`, `analytics`, and
  `ai`.
- All fixed content routes must remain statically generated.
- The visible evidence surface is project-specific. Shared components must not flatten differing
  provenance or claim boundaries into generic sample data.
- English and Chinese must cover every meaningful visible string.

## Quality gates

A site change is not complete until all applicable checks pass:

```bash
npm run typecheck
npm run lint
npm run verify:evidence
npm run test:e2e
npm audit --omit=dev
```

The homepage Lighthouse performance score must remain at least 90. The verified 2026-07-12
baseline is recorded at `docs/lighthouse-homepage-20260712.json`.

## Evidence discipline

- Release Guardian: keep funded-live and deterministic-stub evidence separate; always show the
  30/44 strict residual beside the live aggregate gates. Publication remains exact-hash gated.
- p1: separate the historical May artifacts from the July U6 local-Mac reproduction and preserve
  the environment boundary.
- RAG: v1 is the C2 evaluation floor; C3 produced no metric. Never add a fallback comparison.
- Privacy: fictional fixtures only; source-plus-demo, not a distributable/notarized binary.
- Analytics: qualitative public links only; no unverified number in text or media.

## External actions

Do not create a remote, push, deploy, publish, spend money, or perform destructive Git/GitHub
operations without the matching human gate in `STATE.md`.
