# Portfolio Repository and Site Revision Design

**Date:** 2026-07-22
**Status:** Approved in conversation; awaiting written-spec review
**Target:** Public GitHub portfolio repositories and the deployed bilingual portfolio site

## 1. Objective

Deliver a recruiter-facing, evidence-grounded release across the public project repositories and
the portfolio site. The release must make the projects easier to evaluate for AI application,
data engineering, and data analysis roles without weakening reproducibility or inventing claims.

The public repositories are released first. The portfolio site is updated only after the final
repository names, URLs, and commit hashes are known. Production deployment is the final gate.

## 2. Confirmed decisions

- Use an evidence-first coordinated release train rather than website-first or direct-to-`main`
  publication.
- Existing repositories are changed on isolated branches, verified in pull requests, and merged
  into their default branches only after checks pass. Recruiters therefore see the merged final
  state on the default branch.
- Static GitHub README files use an English default `README.md` and a Chinese
  `README.zh-CN.md`, with a prominent `English | 简体中文` switch at the top of both files.
- The portfolio site's existing automatic locale detection and manual language switch are already
  implemented. They are regression-tested, not reimplemented.
- Create `LucisZhang/release-guardian` as a dedicated public repository containing a sanitized,
  runnable evidence and deterministic replay package. It must not claim to contain the complete
  private production workflow.
- Rename `LucisZhang/p1-reliability-lab` to
  `LucisZhang/streaming-reliability-lab`. Update all current repository narration and metadata to
  **Streaming Reliability Lab** / **流式可靠性实验室**.
- Claude Code must invoke Fable5 as the recruiter reviewer. Kimi K3 must write the Chinese
  recruiter-facing prose. Neither model may be silently substituted.
- After every repository and site gate passes, the approved pull requests may be merged and the
  site may be deployed to Production without another per-repository approval request.

## 3. Scope

### 3.1 Portfolio-linked public repositories

The coordinated pass covers these dedicated project repositories:

1. Release Guardian (new repository)
2. RAG Quality Lab
3. Privacy Preflight Web
4. Streaming Reliability Lab (renamed repository)
5. Margin Control Tower
6. Credit Policy Lab

Before editing, the implementation inventory must resolve the canonical owner, default branch,
open pull requests, current CI state, and portfolio destination for each repository. Existing open
README/hygiene pull requests must be incorporated or explicitly superseded; their verified work
must not be lost or merged twice.

### 3.2 Portfolio site

The site pass covers:

- removal of redundant evidence-boundary copy outside the bottom boundary section;
- Release Guardian's dedicated repository link;
- the Privacy image comparison and multi-page PDF experience;
- assistant failure recovery and structured project linking;
- recruiter-facing bilingual consistency; and
- regression verification of the already-completed locale behavior and site-wide Streaming
  Reliability Lab rename.

### 3.3 Out of scope

- Rewriting Git history or changing historical commit hashes.
- Publishing private source material, private evidence packets, secrets, or proprietary workflow
  internals.
- Creating GitHub Pages solely to auto-detect README language.
- Removing the existing reproduction, verification, provenance, or bottom
  `What this does not prove` sections.
- Claiming that external model calls can never fail.
- Further broad disk cleanup. The confirmed unused Chrome code-sign clones have already been
  removed; user data was not touched.

## 4. Recruiter model workflow

### 4.1 Fable5 role contract

Every Fable5 prompt assigns the following role:

> You are a recruiter who screens candidates for AI application, data engineering, and data
> analysis roles. Evaluate whether this repository communicates technical depth, business value,
> credible evidence, and role fit within a short recruiter scan. Do not invent claims or request
> evidence that is not present in the supplied dossier.

Fable5 reviews:

- the first 30-second repository impression;
- English README and recruiter-facing documentation;
- repository information hierarchy and navigation;
- technical credibility, outcome clarity, and role relevance;
- evidence-to-claim alignment;
- Chinese readability and English/Chinese factual consistency; and
- structural or code changes that would materially improve recruiter evaluation.

Fable5 directly edits English text-heavy files. For structural or code recommendations, it returns
specific guidance; Codex applies only the evidence-safe, in-scope changes and verifies them.

### 4.2 Kimi K3 Chinese writing contract

Kimi K3 receives the same evidence dossier and the final evidence-safe English content. It writes
Chinese recruiter-facing material as natural Chinese, not as a sentence-by-sentence mechanical
translation. It must preserve metrics, limitations, links, provenance, and role relevance.

### 4.3 Chinese review loop

1. Kimi K3 writes or revises `README.zh-CN.md` and other approved Chinese reading material.
2. Fable5 reviews the Chinese output from the recruiter perspective.
3. Fable5's concrete feedback is passed verbatim to Kimi K3.
4. Kimi K3 revises the content.
5. Fable5 re-reviews it.

The loop runs for at most three revision rounds. Acceptance requires an explicit Fable5 recruiter
verdict plus Codex factual verification. If a requested revision would add an unsupported claim,
the evidence dossier wins and the suggestion is rejected. If either requested model is unavailable
or its identity cannot be verified, that repository fails closed and is not published.

Model prompts, responses, model identifiers, and acceptance verdicts are retained as private
execution evidence. They are not automatically committed to public repositories.

## 5. Repository design

### 5.1 Shared bilingual README pattern

Each repository has:

- `README.md` as the default English recruiter entry point;
- `README.zh-CN.md` as the Simplified Chinese entry point;
- mirrored language links at the top of both files;
- consistent project identity, links, metrics, evidence boundaries, and quickstart claims; and
- no browser-locale claim that GitHub static Markdown cannot satisfy.

The English and Chinese versions may differ idiomatically, but facts and evidence boundaries must
remain equivalent.

### 5.2 Release Guardian

The new public repository is a sanitized recruiter-facing evidence package, not a reconstructed
fictional production system. Its minimum public surface is:

- bilingual recruiter README files;
- a concise architecture and decision narrative;
- deterministic replay code and fictional or sanitized fixtures that can be run publicly;
- exact verification instructions;
- funded-live versus deterministic-stub separation;
- the 30/44 strict residual shown beside live aggregate gates;
- exact-hash publication gating; and
- a bottom `What this does not prove` boundary.

Only assets whose public provenance is already approved may be moved or copied from the portfolio.
The repository must disclose that the complete private workflow is not included.

### 5.3 Streaming Reliability Lab

The GitHub repository slug becomes `streaming-reliability-lab`. The current repository state is
audited for old project names and updated across:

- GitHub repository description and relevant metadata;
- English and Chinese README files;
- documentation and current UI copy;
- badges, internal and external links, image alternative text, and diagram labels;
- package or application display metadata;
- CI workflow display names; and
- current code comments or sample output that function as project narration.

Historical commits are not rewritten. A legacy identifier may remain only when it is required for
compatibility, an immutable artifact, or historical evidence. Such occurrences must be explicitly
labeled as historical and must not be presented as the current project name.

### 5.4 Other repository reviews

RAG Quality Lab, Privacy Preflight Web, Margin Control Tower, and Credit Policy Lab receive the same
Fable5/Kimi K3 bilingual recruiter pass. Existing evidence cutlines, benchmark definitions,
licenses, exact hashes, proxy disclosures, and non-production boundaries remain authoritative.

## 6. Portfolio site design

### 6.1 Recruiter copy and evidence boundary

Remove repeated or introductory phrases whose only purpose is to restate what a result cannot
prove, including the homepage phrase identified in the supplied screenshot. Preserve:

- reproduction and verification instructions;
- provenance and environment distinctions needed to understand the evidence;
- project-specific validation surfaces; and
- the bottom `What this does not prove` section on each applicable project page.

Copy should lead with candidate capability, decisions, implementation, and results while remaining
truthful.

### 6.2 Project destinations

Release Guardian's repository action links to the new dedicated repository. Portfolio assistant
project destinations follow one rule:

- projects with a portfolio detail page link to that local detail page;
- projects absent from the portfolio but present publicly on GitHub link to their GitHub repository.

All destinations are held in one canonical project catalog with stable project IDs, localized
display names, local routes, and optional GitHub URLs.

### 6.3 Privacy evidence comparison

The four supplied examples are rendered as two before/after pairs. On desktop, each pair is a
two-column row with **Before** on the left and **After** on the right. On narrow screens, each pair
stacks vertically while preserving before-then-after reading order. Captions and image sizing remain
aligned across a pair.

### 6.4 Privacy multi-page PDF lab

The lab behaves like a lightweight macOS Preview surface:

- the main document area renders every PDF page in a continuous vertical scroll;
- users do not switch pages with page tabs;
- an optional thumbnail navigator may scroll the main view to a selected page;
- page rendering is lazy enough to preserve performance while maintaining continuous navigation;
- regions are stored with their page identity so coordinates never leak across pages; and
- mobile layouts omit or collapse secondary navigation rather than shrinking pages excessively.

Detection, redaction, and export are document-level actions. One action processes all pages and the
resulting export contains the complete PDF. Progress may report page-level status, but the user is
not required to process pages individually.

### 6.5 Assistant structured project links

The assistant no longer relies on brittle client-side string matching. The response contract uses
validated project reference tokens or equivalent structured segments keyed by the canonical
project catalog. The server validates every requested project ID and the client renders the
localized canonical name as the link text.

Consequences:

- every recognized project mention has a deterministic destination;
- Chinese replies use one Chinese-first canonical name rather than repeating English and Chinese;
- a link never covers an inconsistent bilingual span; and
- unsupported or unknown destinations remain plain text rather than receiving a guessed URL.

### 6.6 Assistant reliability and failure handling

The observed controlled failure is treated as an external-provider timeout or unavailability until
runtime evidence establishes a different cause. A fallback cannot guarantee success when attempts
share a bounded request budget or upstream providers are unavailable.

The revised server policy is failure-class aware:

- validate input and retrieval before any provider call;
- attempt the locale's primary model within an explicit per-attempt budget;
- retry only errors classified as transient and only within the overall request budget;
- switch to an approved locale-compatible fallback after a primary transient failure;
- preserve the existing provider privacy controls for every attempt;
- return a typed controlled failure if all allowed attempts fail; and
- expose a user-triggered retry without presenting failure as success.

Operational records include model ID, provider, attempt count, duration, status class, and error
category. They exclude full private evidence, secrets, and complete user questions. The site does
not promise zero failures; it promises bounded recovery, honest status, and a clear retry path.

## 7. Data and publication flow

1. Inventory each public repository and establish its current default-branch truth.
2. Build evidence dossiers and run the Fable5/Kimi K3 review workflow.
3. Implement repository changes on isolated branches and open pull requests.
4. Run repository-specific tests and CI; merge only accepted, green changes.
5. Complete the repository rename and create Release Guardian at the controlled publication gate.
6. Record final public URLs and exact commit hashes.
7. Update the portfolio's pinned public evidence, project catalog, content, Privacy lab, and
   assistant behavior from those final repository states.
8. Run all local portfolio gates and live-model acceptance.
9. Deploy and inspect a Vercel Preview.
10. Merge the portfolio pull request, deploy Production, and repeat critical tests against the
    public domain.
11. Hand the verified Production site to the owner for manual review.

No site deployment proceeds while any required repository, model-review, evidence, or site gate is
unresolved.

## 8. Verification and acceptance

### 8.1 Repository acceptance

For every repository:

- the default branch exposes the final bilingual README entry points;
- language links work from GitHub's rendered README;
- Fable5's recruiter verdict and Kimi K3's model identity are verified;
- English and Chinese facts match the approved evidence dossier;
- quickstart and CI claims are executed where the host environment allows them;
- exact links, badges, images, and repository metadata resolve;
- no secrets, private material, generated noise, or unrelated changes are committed; and
- the merged default branch is clean and publicly readable.

Release Guardian additionally passes its deterministic replay and evidence-boundary checks.
Streaming Reliability Lab additionally passes a current-tree and GitHub-metadata search for stale
narrative names.

### 8.2 Portfolio acceptance

The required project gates remain:

```bash
npm run typecheck
npm run lint
npm run verify:evidence
npm run test:e2e
npm audit --omit=dev
```

The acceptance matrix also covers:

- desktop and mobile before/after image layout;
- multi-page continuous scrolling and whole-document processing/export;
- primary-model success, fallback success, and controlled total failure;
- correct inline links for portfolio and GitHub-only projects;
- Chinese-first single project names;
- English and Chinese live-model queries;
- browser/system locale selection, manual override, and persistence;
- all public routes and outbound links;
- static generation requirements; and
- homepage Lighthouse performance of at least 90.

Production is accepted only after the same critical user journeys pass on the public deployment.

## 9. Safety and rollback

- Preserve the user's dirty primary checkout and use isolated workspaces.
- Do not direct-push existing default branches.
- Do not merge a pull request whose checks, evidence review, or model receipt is incomplete.
- Use commit-pinned portfolio evidence so repository changes cannot silently alter runtime answers.
- Keep previous Vercel deployments available for rollback until Production acceptance passes.
- If a repository rename causes a broken consumer despite GitHub redirects, update that consumer
  before completing the portfolio release.
- Treat local checks, external model calls, Git publication, Preview deployment, Production
  deployment, and manual owner acceptance as separate recorded gates.

## 10. Success condition

The task is complete when all six portfolio-linked repositories present their verified final public
state, the portfolio Production deployment passes the defined automated and live-model checks, and
the owner receives the Production URL for manual review. Chrome residual cleanup is already
complete and is reported separately from the software release.
