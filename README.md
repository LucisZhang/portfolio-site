# Hsiang Kuo Chang — Portfolio

[![CI](https://github.com/LucisZhang/portfolio-site/actions/workflows/ci.yml/badge.svg)](https://github.com/LucisZhang/portfolio-site/actions/workflows/ci.yml)

Bilingual (English / 简体中文) portfolio covering applied AI, streaming reliability
engineering, privacy tooling, retrieval evaluation, and analytics — built as a piece of
evidence engineering, not just a website. Every case study is backed by a machine-checked
evidence contract, and the repository publishes exactly the allowlisted public surface: site
source, tests, and approved public evidence, with no inherited internal history.

Live: https://portfolio-site-nsam734g0-luciszhangs-projects.vercel.app

## What's engineered here

- **Next.js App Router with static generation** for the home page, discipline track indexes,
  and evidence-backed case-study routes, all driven by one typed project registry
  (`src/lib/projects.ts`).
- **A full bilingual content system** (`src/lib/i18n.ts`): navigation, registry copy,
  interactive labels, proof panels, errors, and metadata exist in both English and Simplified
  Chinese — not a translated afterthought bolted onto an English site.
- **Evidence contracts** (`scripts/verify-evidence.mjs`, run as `npm run verify:evidence`):
  the manifests, hashes, and claim boundaries that case studies cite are verified locally
  before publication. A case study cannot silently claim evidence the repository doesn't
  carry.
- **Proof presentation as a component** (`src/components/ProjectProof.tsx`): each project
  page renders its evidence boundary — what is proven, by which artifact, and what the page
  alone cannot prove — as structured UI rather than fine print.
- **A command palette** (`src/components/CommandPalette.tsx`) for keyboard navigation across
  tracks, projects, and languages.
- On the analytics integration branch
  ([`codex/portfolio-phase2`](https://github.com/LucisZhang/portfolio-site/tree/codex/portfolio-phase2)),
  the Margin Control Tower and Credit Policy Lab pages add **lazy same-origin DuckDB-WASM**
  querying of committed, hash-verified Parquet derivatives of licensed public datasets (Olist,
  Lending Club), with fail-closed pending states when artifacts are absent — plus the offline
  Python pipelines that produced them.

## Local verification

```bash
npm ci
npm run typecheck
npm run lint
npm run verify:evidence
npm run test:e2e
```

`verify:evidence` checks the local evidence manifests, hashes, and claim boundaries used by
the case studies. The browser suite covers English and Chinese at desktop, tablet, and mobile
sizes.

## Evidence boundaries

The site is explicit about what each page can and cannot prove:

- **Release Guardian** ships only the approved sanitized derivative package — a deterministic
  replay and selected evidence. The private source repository, raw reports, prompts,
  scenarios, traces, and original screenshots are excluded; the exact approved manifest and
  screenshot hashes are recorded in [`PUBLICATION.md`](PUBLICATION.md).
- **p1 Reliability Lab** separates historical exports from the environment-specific
  workstation run; the public source is
  [LucisZhang/p1-reliability-lab](https://github.com/LucisZhang/p1-reliability-lab).
- **RAG Quality Lab** reports the verified floor and records timeboxed no-result outcomes
  rather than inventing metrics for an unavailable stack.
- **Privacy Preflight** uses fictional demo data throughout and does not distribute a signed,
  notarized application binary.
- **Analytics** pages prove committed derived artifacts, hash-bound offline reports, and
  browser behavior — not raw-source downloads, scheduled warehouse jobs, causal impact, or
  production adoption.

## Rights

No open-source license is granted for this repository or its portfolio content. See
[`NOTICE.md`](NOTICE.md). The exact public release scope and the Release Guardian hash
approval are recorded in [`PUBLICATION.md`](PUBLICATION.md). Linked external repositories and
services retain their own licenses and terms.
