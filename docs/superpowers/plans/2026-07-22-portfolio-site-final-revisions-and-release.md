# Portfolio Site Final Revisions and Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the portfolio from the six verified repository releases, fix Privacy and Assistant behavior, pass every local/live gate, and deploy a Production build for owner review.

**Architecture:** Consume the exact repository-release manifest, then update one canonical project catalog and the pinned assistant knowledge snapshot. Replace assistant string matching with typed answer blocks, allocate fallback time explicitly, and split PDF page rendering from document-level processing. Publish only after local tests, live-model acceptance, Preview inspection, PR merge, and Production recheck.

**Tech Stack:** Next.js 16 App Router, TypeScript, React 19, CSS, PDF.js, pdf-lib, Tesseract.js, Node test runner, Playwright, OpenRouter, Vercel.

## Global Constraints

- Execute in `/private/tmp/portfolio-rag-assistant-20260721` on branch `codex/portfolio-site-fixes2-20260722`; preserve the dirty primary checkout.
- Consume only `/private/tmp/portfolio-repository-release-20260722/final-repository-manifest.json` after it validates.
- Existing site locale auto-detection, manual switching, and displayed Streaming Reliability Lab name are regression targets, not new feature work.
- Keep all fixed content routes statically generated.
- Preserve reproduction/verification sections and bottom `What this does not prove`; remove only redundant boundary copy elsewhere.
- Keep Release Guardian live/stub separation, 30/44 residual, and exact-hash gating.
- Keep Privacy fictional fixtures and separate browser behavior, source, packaging, signing, notarization, and compatibility claims.
- Do not expose secrets, private knowledge, prompts, or full questions in logs or client code.
- Homepage Lighthouse performance must remain at least 90.
- Required final commands: `npm run typecheck`, `npm run lint`, `npm run verify:evidence`, `npm run test:e2e`, `npm audit --omit=dev`.

## File Structure

New focused assistant files:

```text
src/lib/assistant-project-references.ts
src/components/assistant/AssistantRichAnswer.tsx
tests/assistant/assistant-project-references.test.mjs
```

New focused Privacy file:

```text
src/components/privacy/PrivacyPdfPage.tsx
src/components/privacy/privacy-pdf-types.ts
```

Modified primary files:

```text
assistant-knowledge/manifest.json
src/data/assistant-knowledge.generated.json
src/app/page.tsx
src/app/api/assistant/route.ts
src/app/globals.css
src/components/OptionalMedia.tsx
src/components/PrivacyProof.tsx
src/components/assistant/AssistantWidget.tsx
src/components/privacy/PrivacyPdfLab.tsx
src/components/privacy/PrivacyPdfResultPreview.tsx
src/lib/assistant-policy.ts
src/lib/assistant-public-sources.ts
src/lib/projects.ts
tests/assistant/assistant-policy.test.mjs
tests/assistant/assistant-public-sources.test.mjs
tests/e2e/assistant.spec.ts
tests/e2e/portfolio.spec.ts
docs/assistant-operations.md
STATE.md
PUBLICATION.md
docs/PUBLICATION_CHECKLIST.md
```

---

### Task 1: Bind final repositories and correct recruiter copy

**Files:**
- Modify: `src/lib/projects.ts`
- Modify: `src/app/page.tsx`
- Modify: `tests/e2e/portfolio.spec.ts`

**Interfaces:**
- Consumes: validated final repository manifest.
- Produces: correct Release Guardian/Streaming URLs and recruiter-first homepage copy.

- [ ] **Step 1: Write failing E2E assertions**

Add assertions that:

```ts
await expect(page.locator('.index-heading p')).toHaveText(
  locale === "en"
    ? "Open any project to see what I built, how it works, and how to verify it."
    : "打开任意项目，了解我做了什么、项目如何运作，以及如何验证结果。",
);
await expect(releasePage.locator('a[href="https://github.com/LucisZhang/release-guardian"]')).toBeVisible();
await expect(streamingPage.locator('a[href="https://github.com/LucisZhang/streaming-reliability-lab"]')).toBeVisible();
```

Retain the existing assertion that the bottom boundary heading is visible.

- [ ] **Step 2: Run the focused tests and confirm failure**

Run `npx playwright test tests/e2e/portfolio.spec.ts --grep "repository links|project index|boundary" --workers=1`. Expected: old homepage sentence and old repository URLs fail.

- [ ] **Step 3: Make the minimal copy/link change**

In `src/app/page.tsx`, use the exact strings in Step 1. In `src/lib/projects.ts`, change only Release Guardian's repository URL and Streaming Reliability Lab's GitHub URL. Keep the current site route slug for backward compatibility.

- [ ] **Step 4: Run focused tests**

Expected: the focused tests pass in English and Chinese; reproduction/provenance sections and bottom boundary remain present.

- [ ] **Step 5: Commit**

Commit `fix: bind final project repositories`.

---

### Task 2: Replace assistant string matching with typed project segments

**Files:**
- Create: `src/lib/assistant-project-references.ts`
- Create: `src/components/assistant/AssistantRichAnswer.tsx`
- Create: `tests/assistant/assistant-project-references.test.mjs`
- Modify: `src/lib/assistant-policy.ts`
- Modify: `src/components/assistant/AssistantWidget.tsx`
- Modify: `src/app/api/assistant/route.ts`
- Modify: `tests/assistant/assistant-policy.test.mjs`
- Modify: `tests/e2e/assistant.spec.ts`

**Interfaces:**
- Produces: `AssistantAnswerBlock[]`, `validateAssistantAnswerBlocks(value, locale)`, and `AssistantRichAnswer`.
- Consumes: canonical project IDs from the reference catalog and final repository URLs.

- [ ] **Step 1: Write failing catalog tests**

Define expected catalog cases:

```js
assert.deepEqual(projectReference("margin-control-tower", "zh"), {
  id: "margin-control-tower",
  label: "毛利控制塔",
  href: "/analytics/margin-control-tower?lang=zh",
  kind: "portfolio",
});
assert.equal(projectReference("ex-solver", "zh").href, "https://github.com/LucisZhang/ex-solver");
assert.equal(projectReference("unknown", "en"), null);
```

Include local portfolio IDs for the six featured projects and GitHub-only IDs for `ex-solver`, `Voice-in-Security`, and `Risk-Control-Portfolio`.

- [ ] **Step 2: Run the tests and confirm failure**

Run `node --import ./tests/assistant/register-loader.mjs --test tests/assistant/assistant-project-references.test.mjs`. Expected: module-not-found.

- [ ] **Step 3: Implement the canonical catalog**

Export:

```ts
export type AssistantProjectId = "release-guardian" | "streaming-reliability-lab" | "rag-quality-lab" | "privacy-preflight-web" | "margin-control-tower" | "credit-policy-lab" | "ex-solver" | "Voice-in-Security" | "Risk-Control-Portfolio";
export interface AssistantProjectReference { id: AssistantProjectId; label: string; href: string; kind: "portfolio" | "github"; }
export function projectReference(id: string, locale: "en" | "zh"): AssistantProjectReference | null;
```

Use this exact destination map; append `?lang=zh` to local destinations only for Chinese:

```ts
const destinationByProject = {
  "release-guardian": { kind: "portfolio", href: "/ai/release-guardian" },
  "streaming-reliability-lab": { kind: "portfolio", href: "/engineering/p1-reliability-lab" },
  "rag-quality-lab": { kind: "portfolio", href: "/ai/rag-quality-lab" },
  "privacy-preflight-web": { kind: "portfolio", href: "/ai/privacy-preflight-mac" },
  "margin-control-tower": { kind: "portfolio", href: "/analytics/margin-control-tower" },
  "credit-policy-lab": { kind: "portfolio", href: "/analytics/credit-policy-lab" },
  "ex-solver": { kind: "github", href: "https://github.com/LucisZhang/ex-solver" },
  "Voice-in-Security": { kind: "github", href: "https://github.com/LucisZhang/Voice-in-Security" },
  "Risk-Control-Portfolio": { kind: "github", href: "https://github.com/LucisZhang/Risk-Control-Portfolio" },
} as const;
```

- [ ] **Step 4: Change the model output schema to structured blocks**

Use:

```ts
export type AssistantAnswerSegment =
  | { type: "text"; text: string; strong?: boolean }
  | { type: "project"; projectId: AssistantProjectId; strong?: boolean };
export interface AssistantAnswerBlock {
  type: "paragraph" | "heading" | "bullet";
  segments: AssistantAnswerSegment[];
}
```

Update OpenRouter JSON schema to return `blocks`, `citation_ids`, and `confidence`. Project segments contain only allowed enum IDs; text segments cannot contain raw URLs. Update the system prompt to require a project segment whenever a known project is mentioned.

- [ ] **Step 5: Validate and protect structured output**

`protectAssistantOutput` validates exact keys, block/segment limits, catalog IDs, citation IDs, total flattened length, sensitive patterns, and long grounding copies. It returns both safe blocks and a plain-text `reply` flattened with the locale's canonical project names for conversation history.

- [ ] **Step 6: Render structured links**

Move rich rendering to `AssistantRichAnswer.tsx`. Text segments render as text/`strong`; project segments resolve through `projectReference` and render one canonical localized link. Remove `projectDestinations`, `renderProjectLinks`, and regex splitting from `AssistantWidget.tsx`.

- [ ] **Step 7: Extend route and client parsers**

Return `{ reply, blocks, sources }` on successful model answers. `replyFromUnknown` accepts blocks only after strict shape validation; controlled non-model replies continue to render plain `reply`.

- [ ] **Step 8: Run unit and E2E tests**

Run:

```bash
npm run verify:assistant
npx playwright test tests/e2e/assistant.spec.ts --workers=1
```

Expected: Chinese links use one Chinese-first name, portfolio projects go local, GitHub-only projects go to GitHub, unknown IDs fail closed.

- [ ] **Step 9: Commit**

Commit `feat: render structured assistant project links`.

### Task 3: Guarantee fallback receives a real time budget

**Files:**
- Modify: `src/lib/assistant-policy.ts`
- Modify: `src/app/api/assistant/route.ts`
- Modify: `src/components/assistant/AssistantWidget.tsx`
- Modify: `src/components/assistant/AssistantWidget.module.css`
- Modify: `tests/assistant/assistant-policy.test.mjs`
- Modify: `tests/e2e/assistant.spec.ts`
- Modify: `docs/assistant-operations.md`

**Interfaces:**
- Produces: `AssistantAttemptRecord`, `AssistantFailureReason`, `retryable`, `attemptCount`.
- Consumes: primary/fallback model configuration and the existing 40-second policy deadline.

- [ ] **Step 1: Write regression tests for the observed failure mechanism**

The current sequence `[primary, primary, ...fallbacks]` can spend 25 seconds plus 14 seconds on the primary and leave less than one second, so fallback is skipped. Add a fake fetcher/clock test asserting:

```js
assert.deepEqual(result.attemptedModels, [DEFAULT_ASSISTANT_MODEL_ZH, DEFAULT_ASSISTANT_FALLBACK_MODELS_ZH[0]]);
assert.equal(result.attemptCount, 2);
assert.equal(result.responseReturnedModel, DEFAULT_ASSISTANT_FALLBACK_MODELS_ZH[0]);
```

Also test permanent 4xx stops, transient 5xx falls back, unsafe output stops, and total failure returns a retryable typed reason.

- [ ] **Step 2: Run the focused unit test and confirm failure**

Run `node --import ./tests/assistant/register-loader.mjs --test tests/assistant/assistant-policy.test.mjs --test-name-pattern "fallback budget"`. Expected: fallback was not reached under the old schedule.

- [ ] **Step 3: Implement explicit attempt planning**

Export:

```ts
export type AssistantFailureReason = "timeout" | "http_transient" | "http_permanent" | "invalid_json" | "model_mismatch" | "invalid_output" | "unsafe_output";
export interface AssistantAttemptPlan { model: string; timeoutMs: number; }
export interface AssistantAttemptRecord {
  model: string;
  timeoutMs: number;
  outcome: "success" | AssistantFailureReason;
}
export function assistantAttemptPlan(primary: string, fallbacks: readonly string[]): AssistantAttemptPlan[] {
  return [
    { model: primary, timeoutMs: 18_000 },
    ...fallbacks.slice(0, 2).map((model, index) => ({ model, timeoutMs: index === 0 ? 11_000 : 8_000 })),
  ];
}
```

Add `attempts?: readonly AssistantAttemptRecord[]`, `failureReason?: AssistantFailureReason`, `attemptCount?: number`, and `retryable?: boolean` to `AssistantExecutionResult`. Remove the duplicate primary attempt. Retry only `timeout`, `http_transient`, `invalid_json`, and `model_mismatch`; stop on `http_permanent`, `invalid_output`, and `unsafe_output`. Preserve the overall 40-second deadline and provider privacy controls.

- [ ] **Step 4: Return safe diagnostics**

Add `failureReason`, `attemptCount`, and `retryable` to `AssistantExecutionResult`. Expose safe headers `X-Assistant-Attempt-Count` and `X-Assistant-Failure-Reason`; do not expose questions, evidence, or keys. Successful responses include attempt count but no failure reason.

- [ ] **Step 5: Add user-triggered retry**

When the API returns `retryable: true`, store the failed user message and show a localized Retry button. A retry makes a fresh request with the same visible question and existing six-message history; it never appends duplicate user bubbles.

- [ ] **Step 6: Verify**

Run:

```bash
npm run verify:assistant
npx playwright test tests/e2e/assistant.spec.ts --workers=1
```

Expected: primary success, first fallback success, permanent rejection, unsafe output, and total retryable failure all pass.

- [ ] **Step 7: Commit**

Commit `fix: reserve assistant fallback budget`.

---

### Task 4: Restore paired Privacy before/after evidence layout

**Files:**
- Modify: `src/components/OptionalMedia.tsx`
- Modify: `src/components/PrivacyProof.tsx`
- Modify: `src/app/globals.css`
- Modify: `tests/e2e/portfolio.spec.ts`

**Interfaces:**
- Produces: `.privacy-comparison-grid` with two ordered before/after pairs.
- Consumes: the existing four Privacy media candidates in input/output order.

- [ ] **Step 1: Write failing layout assertions**

Assert four figures are arranged as:

```ts
await expect(figures.nth(0)).toContainText(locale === "en" ? "Before" : "处理前");
await expect(figures.nth(1)).toContainText(locale === "en" ? "After" : "处理后");
await expect(figures.nth(2)).toContainText(locale === "en" ? "Before" : "处理前");
await expect(figures.nth(3)).toContainText(locale === "en" ? "After" : "处理后");
```

On desktop, compare bounding boxes: figures 0/1 share a row and 2/3 share a row; before has smaller `x`. On mobile, each pair stacks before then after.

- [ ] **Step 2: Run and confirm failure**

Run the focused Privacy media test. Expected: the current `media-spacer` creates the irregular arrangement.

- [ ] **Step 3: Implement pair-aware rendering**

For `privacy-comparison`, render:

```tsx
<div className="privacy-comparison-grid">
  {available.map((item, index) => (
    <div className="privacy-comparison-item" data-phase={index % 2 === 0 ? "before" : "after"} key={item.resolvedSrc}>
      <strong>{index % 2 === 0 ? beforeLabel : afterLabel}</strong>
      {figure(item)}
    </div>
  ))}
</div>
```

Remove `.media-spacer`. CSS uses two equal desktop columns and one mobile column; captions align within each pair.

- [ ] **Step 4: Verify desktop and mobile**

Run `npx playwright test tests/e2e/portfolio.spec.ts --grep "before.*after" --workers=1`. Expected: all locales/viewports pass.

- [ ] **Step 5: Commit**

Commit `fix: pair Privacy evidence comparisons`.

### Task 5: Make Privacy PDF review continuous and document-level

**Files:**
- Create: `src/components/privacy/privacy-pdf-types.ts`
- Create: `src/components/privacy/PrivacyPdfPage.tsx`
- Modify: `src/components/privacy/PrivacyPdfLab.tsx`
- Modify: `src/components/privacy/PrivacyPdfResultPreview.tsx`
- Modify: `src/app/globals.css`
- Modify: `tests/e2e/portfolio.spec.ts`

**Interfaces:**
- Produces: `PrivacyPdfPage`, `scanDocument()`, continuous source/result page stacks.
- Consumes: existing `PdfRegion` page coordinates, PDF.js document, pdf-lib export validation.

- [ ] **Step 1: Write failing continuous-view tests**

Load `pdf-example-multipage.pdf` and assert:

```ts
await expect(page.getByTestId("privacy-pdf-source-pages").locator('[data-pdf-page]')).toHaveCount(3);
await expect(page.locator(".privacy-page-tabs")).toHaveCount(0);
await page.getByRole("button", { name: locale === "en" ? "Scan entire PDF" : "扫描整份 PDF" }).click();
await expect(page.getByTestId("privacy-pdf-scan-progress")).toContainText("3 / 3");
```

After review/export, require three visible result pages without clicking page navigation.

- [ ] **Step 2: Run and confirm failure**

Run `npx playwright test tests/e2e/portfolio.spec.ts --grep "multi-page PDF" --workers=1`. Expected: only the selected page canvas exists and page tabs are present.

- [ ] **Step 3: Extract shared PDF types and a focused page renderer**

Move `PdfRegion` and `ActivePdfDocument` from `PrivacyPdfLab.tsx` into `privacy-pdf-types.ts`, export both interfaces, and import them into the lab and page renderer. Keep `PDFDocumentProxy` as a type-only import in the new types file.

Implement:

```ts
interface PrivacyPdfPageProps {
  document: ActivePdfDocument;
  pageIndex: number;
  regions: PdfRegion[];
  scanned: boolean;
  active: boolean;
  onActivate(pageIndex: number): void;
  onRegionsChange(pageIndex: number, regions: PdfRegion[]): void;
}
```

Each instance renders its own page and overlay canvases, keeps normalized coordinates scoped to `pageIndex`, and lazily renders through `IntersectionObserver` while reserving page aspect-ratio space.

- [ ] **Step 4: Render every source page in one scroll container**

Replace previous/next controls and `.privacy-page-tabs` with:

```tsx
<div className="privacy-pdf-page-stream" data-testid="privacy-pdf-source-pages">
  {Array.from({ length: pageCount }, (_, pageIndex) => (
    <PrivacyPdfPage key={pageIndex} pageIndex={pageIndex} ... />
  ))}
</div>
```

The optional thumbnail rail calls `scrollIntoView()` and never swaps page components. Mobile collapses the rail.

- [ ] **Step 5: Replace page OCR with `scanDocument()`**

Use one OCR worker per document scan. Iterate page indices in order. Use existing text-layer regions when available; render and OCR pages requiring OCR; update `scannedPages`, `pageMethods`, `regions`, and progress after every page. Terminate the worker in `finally` and preserve already-completed page results if a later page fails, while blocking export until the whole scan completes.

- [ ] **Step 6: Keep review state page-scoped**

The active page controls the sidebar region editor, but scan/export buttons are document-level. `canExport` requires all pages scanned, at least one accepted region, and no active scan. Manual regions retain `pageIndex`.

- [ ] **Step 7: Render all output pages continuously**

Change `PrivacyPdfResultPreview` to accept `{ bytes, locale }` and render every output page into `.privacy-pdf-page-stream`. The Before/After control switches the entire stream, not a single selected page.

- [ ] **Step 8: Run focused tests**

Run:

```bash
npx playwright test tests/e2e/portfolio.spec.ts --grep "PDF" --workers=1
npm run typecheck
npm run lint
```

Expected: single-page, text-layer, scanned, oversized, multi-page, manual-region, compare, validation, and download cases pass.

- [ ] **Step 9: Commit**

Commit `feat: process Privacy PDFs as documents`.

---

### Task 6: Repin assistant knowledge to final repositories

**Files:**
- Modify: `assistant-knowledge/manifest.json`
- Modify: `src/data/assistant-knowledge.generated.json`
- Modify: `src/lib/assistant-public-sources.ts`
- Modify: `tests/assistant/assistant-public-sources.test.mjs`
- Modify: `docs/EVIDENCE_INDEX.md`

**Interfaces:**
- Consumes: final repository manifest from the repository plan.
- Produces: exact-commit assistant corpus and updated legacy p1 source-pack compatibility checks.

- [ ] **Step 1: Write failing source assertions**

Update tests to require repository names `release-guardian` and `streaming-reliability-lab`, the observed final commits, and no current source URL containing `/p1-reliability-lab/` or Release Guardian pointing to `portfolio-site`.

- [ ] **Step 2: Run and confirm failure**

Run `npm run verify:assistant`. Expected: old pinned repository identities/hashes fail.

- [ ] **Step 3: Update the manifest**

Replace six project entries with final repository names/commits. Keep the other reviewed GitHub-only sources pinned. Add Release Guardian's README, Chinese README, evidence manifest, architecture, and replay script within size/safety caps.

- [ ] **Step 4: Rebuild and inspect the corpus**

Run:

```bash
npm run build:assistant-knowledge
npm run verify:assistant-public-sources
npm run verify:assistant
```

Expected: deterministic snapshot metadata, safe file limits, valid exact-commit citation URLs, and no private paths/secrets.

- [ ] **Step 5: Update the compatibility pack**

Repin `src/lib/assistant-public-sources.ts` from old repo `p1-reliability-lab` to `streaming-reliability-lab`, update reviewed excerpts/hashes from the final public commit, and retain old name only as an explicitly historical alias.

- [ ] **Step 6: Commit**

Commit `chore: repin assistant public evidence`.

### Task 7: Run complete local and live-model acceptance

**Files:**
- Modify only if evidence is produced intentionally: `docs/EVIDENCE_INDEX.md`, `docs/assistant-operations.md`

**Interfaces:**
- Consumes: all site implementation commits and configured server-only environment values.
- Produces: a clean candidate commit with local and per-locale live-model evidence.

- [ ] **Step 1: Confirm clean source and available disk**

Run `git status --short`, `git diff --check`, and `df -h`. Expected: only intentional task changes and enough capacity for one serialized browser build.

- [ ] **Step 2: Run deterministic gates**

Run:

```bash
npm ci
npm run typecheck
npm run lint
npm run verify:evidence
npm run verify:assistant
npm run verify:assistant-public-sources
npm run build
npm run verify:performance
npm run test:e2e -- --workers=1
npm audit --omit=dev
git diff --check
```

Expected: every command exits 0; generated-only changes are restored unless they are the intentionally repinned assistant corpus.

- [ ] **Step 3: Run one bounded live request per locale**

Use the exact candidate configuration. For English require model `anthropic/claude-sonnet-4.6`; for Chinese require `moonshotai/kimi-k3`. For each require HTTP 200, structured project blocks, non-empty citations, correct model header, policy/evidence hashes, retrieval count, payload hash, and `upstash-redis` limiter mode.

- [ ] **Step 4: Exercise live project links**

Ask one English and one Chinese comparison question that names both a portfolio project and GitHub-only `ex-solver`. Verify local project links, GitHub destination, Chinese-first names, no duplicate English/Chinese title, and complete final sentence.

- [ ] **Step 5: Exercise security and total-failure paths without external leakage**

Run injection, exfiltration, oversized-body, and locally mocked total-provider-failure tests. Expected: no model metadata on locally refused requests; total failure exposes only safe reason and Retry.

- [ ] **Step 6: Commit the verified candidate**

Commit `fix: complete portfolio review revisions` and record the candidate SHA. The working tree must be clean.

---

### Task 8: Publish Preview, merge, deploy Production, and record acceptance

**Files:**
- Modify: `STATE.md`
- Modify: `PUBLICATION.md`
- Modify: `docs/PUBLICATION_CHECKLIST.md`

**Interfaces:**
- Consumes: clean candidate SHA and existing encrypted Vercel server values.
- Produces: merged public `main`, verified Production deployment, and owner review URL.

- [ ] **Step 1: Push branch and open the site PR**

Push `codex/portfolio-site-fixes2-20260722` to the public remote. Open a ready PR to public `main` with repository release manifest, local gates, live-model receipts, and explicit evidence boundaries. Do not include secrets or private model transcripts.

- [ ] **Step 2: Deploy an exact-SHA Preview**

Run the repository's Vercel deployment procedure without printing environment values. Record Preview deployment ID, URL, Git SHA, and readiness. Verify the Preview uses the candidate SHA.

- [ ] **Step 3: Inspect Preview user journeys**

Using the in-app browser, verify English/Chinese desktop and mobile pages, language auto-detection/manual override, Release Guardian link, Streaming repository link, Privacy paired media, continuous three-page PDF, one-click whole-document processing, Assistant primary/fallback/retry UI, and all project links.

- [ ] **Step 4: Run Preview acceptance**

Require all public routes HTTP 200, one live request per locale, safe headers, Upstash mode, injection refusal, and homepage Lighthouse Performance at least 90.

- [ ] **Step 5: Merge the green PR**

Re-read public `main` and require it is still the candidate's parent. Merge the PR using GitHub's recorded merge operation; do not direct-push main.

- [ ] **Step 6: Verify Production exact SHA**

Wait for the Git-triggered Production deployment or deploy Production according to the existing Vercel gate. Require the production alias `https://portfolio-site-seven-murex.vercel.app` to point at the merged SHA.

- [ ] **Step 7: Repeat critical Production acceptance**

Repeat route checks, one English and one Chinese model query, project-link checks, Privacy desktop/mobile flow, locale behavior, security refusals, and homepage Lighthouse. A Preview pass is not a Production pass.

- [ ] **Step 8: Update state documents**

Record final repository commits, site merge SHA, Preview/Production IDs, URLs, test counts, live returned models, corpus hash, Lighthouse score, and any honest residual risk. Commit `docs: record verified portfolio revision release`.

- [ ] **Step 9: Push state record and verify final public truth**

Push the state-doc commit through the same controlled public-main path. Confirm the production site still serves the runtime release and the repository default branch includes the state record.

- [ ] **Step 10: Hand off for manual review**

Provide the Production URL, exact deployed SHA, six repository URLs, verification summary, and any known external-provider risk. Do not claim manual acceptance until the owner responds.
