# Portfolio Repositories Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish six recruiter-ready, bilingual, evidence-grounded project repositories before the portfolio site consumes their final URLs and commit hashes.

**Architecture:** Use one isolated clone per repository plus a private review workspace. In one invocation per repository, Fable5 first performs a senior-GitHub-user benchmark/gap phase and then a target-role recruiter phase on the resulting English homepage. Kimi K3 writes Chinese once from the accepted English; local deterministic checks and an independent Codex review replace post-Kimi Fable5 review and revision loops. Existing repositories publish through green PRs; Release Guardian is initialized from the approved sanitized portfolio package.

**Tech Stack:** Git/GitHub CLI, Claude Code `claude-fable-5`, OpenRouter `moonshotai/kimi-k3`, Node.js 25, Python 3.11, Next.js 16, Playwright, GitHub Actions.

## Global Constraints

- Work under `/private/tmp/portfolio-repository-release-20260722`; do not modify the user's existing checkouts.
- Existing repositories use `codex/recruiter-homepage-v2` branches and PRs; do not direct-push their default branches.
- `README.md` is English and `README.zh-CN.md` is Simplified Chinese; both start with `[English](README.md) | [简体中文](README.zh-CN.md)`.
- Fable5 identity must be exactly `claude-fable-5`; Kimi identity must be exactly `moonshotai/kimi-k3`. Fail closed on mismatch or unavailability.
- Each repository gets one Fable5 invocation with two ordered, separately recorded English verdicts: `github_user_phase` and `recruiter_phase`. Require `COMBINED_ENGLISH_PASS_ACCEPTED` only when both pass.
- Fable5 never edits or reviews Chinese after Kimi. Kimi writes Chinese once from final accepted English; no automatic Kimi revision or post-Kimi Fable5 call is allowed.
- The owner's Claude monthly spend limit is USD 70. Record actual outer-runtime cost after every Fable5 call and stop before knowingly exceeding the configured limit.
- Never alter committed evidence artifacts merely to make tests pass. Restore generated evidence noise before commit.
- Preserve RAG C2 as the evaluation floor; C3 produced no metric.
- Preserve Privacy's two disclosed benchmark definitions until owner reconciliation.
- Release Guardian pairs eight aggregate live gates with the 30/44 strict residual and keeps live and deterministic-stub evidence separate.
- Use `Streaming Reliability Lab` / `流式可靠性实验室` publicly. Do not rewrite historical logs, hashes, Java package paths, Docker compatibility IDs, or marker paths.
- No model output may add unsupported results, licenses, employment facts, production claims, or metrics.

## Working Files

Private review files are never committed publicly:

```text
/private/tmp/portfolio-repository-release-20260722/
  review/github-homepage-benchmark.{md,json}
  review/receipts/{rag-quality-lab,privacy-preflight-web,streaming-reliability-lab,margin-control-tower,credit-policy-lab,release-guardian}/{combined-english-pass,kimi-draft,bilingual-local-review}.json
  review/scopes/{rag-quality-lab,privacy-preflight-web,streaming-reliability-lab,margin-control-tower,credit-policy-lab,release-guardian}.md
  tools/{run-kimi.mjs,run-kimi.test.mjs,verify-readme-pair.mjs}
  repos/{rag-quality-lab,privacy-preflight-web,streaming-reliability-lab,margin-control-tower,credit-policy-lab,release-guardian}/
  final-repository-manifest.json
```

---

### Task 1: Build isolated inputs and reconcile existing PRs

**Files:**
- Create: `/private/tmp/portfolio-repository-release-20260722/review/scopes/rag-quality-lab.md`
- Create: `/private/tmp/portfolio-repository-release-20260722/review/scopes/privacy-preflight-web.md`
- Create: `/private/tmp/portfolio-repository-release-20260722/review/scopes/streaming-reliability-lab.md`
- Create: `/private/tmp/portfolio-repository-release-20260722/review/scopes/margin-control-tower.md`
- Create: `/private/tmp/portfolio-repository-release-20260722/review/scopes/credit-policy-lab.md`
- Create: `/private/tmp/portfolio-repository-release-20260722/review/scopes/release-guardian.md`

**Interfaces:**
- Consumes: current GitHub default branches and open PR heads.
- Produces: clean isolated branches and evidence scopes consumed by the combined Fable5 English task and the single Kimi writer task.

- [ ] **Step 1: Recheck capacity and remote truth**

Run:

```bash
df -h /private/tmp
gh repo view LucisZhang/rag-quality-lab --json defaultBranchRef,url,description
gh repo view LucisZhang/privacy-preflight-web --json defaultBranchRef,url,description
gh repo view LucisZhang/p1-reliability-lab --json defaultBranchRef,url,description
gh repo view LucisZhang/margin-control-tower --json defaultBranchRef,url,description
gh repo view LucisZhang/credit-policy-lab --json defaultBranchRef,url,description
```

Expected: at least 4 GiB free and all five repositories public on `main`.

- [ ] **Step 2: Clone five repositories shallowly**

Run:

```bash
mkdir -p /private/tmp/portfolio-repository-release-20260722/{repos,review/receipts,review/scopes,review/prompts,tools}
gh repo clone LucisZhang/rag-quality-lab /private/tmp/portfolio-repository-release-20260722/repos/rag-quality-lab -- --depth 1
gh repo clone LucisZhang/privacy-preflight-web /private/tmp/portfolio-repository-release-20260722/repos/privacy-preflight-web -- --depth 1
gh repo clone LucisZhang/p1-reliability-lab /private/tmp/portfolio-repository-release-20260722/repos/streaming-reliability-lab -- --depth 1
gh repo clone LucisZhang/margin-control-tower /private/tmp/portfolio-repository-release-20260722/repos/margin-control-tower -- --depth 1
gh repo clone LucisZhang/credit-policy-lab /private/tmp/portfolio-repository-release-20260722/repos/credit-policy-lab -- --depth 1
```

- [ ] **Step 3: Fetch verified prior PR heads without merging them**

In each repository fetch `codex/readme-and-hygiene` to `review/readme-and-hygiene`. Also fetch RAG `codex/c2-claim-reconciliation` and Streaming `codex/portfolio-readme` to local `review/*` branches.

- [ ] **Step 4: Start `codex/recruiter-homepage-v2` from `review/readme-and-hygiene`**

For RAG, compare the C2 branch across `README.md DATA.md docs evidence`. For Streaming, compare the older portfolio branch across `README.md RUNBOOK.md docs showcase`. Record non-overlapping factual corrections in the scope; never merge duplicate prose blindly.

- [ ] **Step 5: Write exact evidence scopes with `apply_patch`**

Each scope states the repository, target roles, immutable files, forbidden claims, and required bilingual/model verdicts. Evidence lists are:

- RAG: `DATA.md`, `evidence/verified-2026-07/README.md`, `docs/A1_COPY_NOTES.md`, `docs/A2_ENVIRONMENT.md`.
- Privacy: `manifest.json`, `ocr-fixture-benchmark.json`, and current README files.
- Streaming: `showcase/results/README.md`, `showcase/results/*.json`, local-Mac `SUMMARY.md`, resume-claim gate.
- Margin: case-study `README.md`, `data-contract.json`, `metric-registry.json`.
- Credit: case-study `README.md`, `policy-contract.json`.
- Release Guardian: portfolio claims matrix and sanitized manifest.

- [ ] **Step 6: Verify all existing branches are clean**

Run:

```bash
git -C /private/tmp/portfolio-repository-release-20260722/repos/rag-quality-lab status --short --branch
git -C /private/tmp/portfolio-repository-release-20260722/repos/privacy-preflight-web status --short --branch
git -C /private/tmp/portfolio-repository-release-20260722/repos/streaming-reliability-lab status --short --branch
git -C /private/tmp/portfolio-repository-release-20260722/repos/margin-control-tower status --short --branch
git -C /private/tmp/portfolio-repository-release-20260722/repos/credit-policy-lab status --short --branch
```

Expected: each output names `codex/recruiter-homepage-v2` and contains no changed path.

---

### Task 2: Build the shared senior-GitHub-user benchmark with Fable5

**Files:**
- Create: `/private/tmp/portfolio-repository-release-20260722/review/github-homepage-benchmark.md`
- Create: `/private/tmp/portfolio-repository-release-20260722/review/github-homepage-benchmark.json`
- Create: `/private/tmp/portfolio-repository-release-20260722/review/receipts/benchmark-fable5.json`

**Interfaces:**
- Consumes: 4-6 public GitHub repository homepages selected by Fable5.
- Produces: a traceable benchmark with `references`, `criteria`, and `anti_patterns`.

- [ ] **Step 1: Write the exact benchmark prompt**

Use this assignment:

```text
You are a senior GitHub user and open-source repository maintainer. This is NOT a recruiter review.
Study 4-6 mature public repository homepages relevant to AI applications, data engineering, or data analysis. Do not rank by stars alone. Record each exact GitHub URL and one concrete pattern learned from it. Prefer positioning, visual scan order, truthful demos, navigation, setup, evidence presentation, and maintenance signals. Do not copy prose.
Create github-homepage-benchmark.md and github-homepage-benchmark.json. Each criterion has id, question, required_when, and failure_example. Exclude irrelevant open-source conventions. Finish with GITHUB_BENCHMARK_ACCEPTED only if every source is traceable.
```

- [ ] **Step 2: Invoke exact Fable5**

Run from the review directory:

```bash
claude -p --model claude-fable-5 --permission-mode acceptEdits --allowedTools "Read,Write,Edit,Glob,Grep,WebSearch,WebFetch" --output-format json < benchmark.prompt.md
```

Expected: model `claude-fable-5`, terminal token `GITHUB_BENCHMARK_ACCEPTED`, and both benchmark files.

- [ ] **Step 3: Validate the benchmark**

Parse the JSON and require at least four `https://github.com/` references and six criteria. Save the raw Claude JSON privately after scanning it for credentials and private paths.

---

### Task 3: Build and test the Kimi writer and README-pair verifier

**Files:**
- Create: `/private/tmp/portfolio-repository-release-20260722/tools/run-kimi.mjs`
- Create: `/private/tmp/portfolio-repository-release-20260722/tools/run-kimi.test.mjs`
- Create: `/private/tmp/portfolio-repository-release-20260722/tools/verify-readme-pair.mjs`

**Interfaces:**
- Consumes: `OPENROUTER_API_KEY`, scope, accepted English README, optional recruiter feedback.
- Produces: `{ model, chinese_markdown, evidence_notes }`; exits nonzero unless the returned model is `moonshotai/kimi-k3`.

- [ ] **Step 1: Write failing identity/schema tests**

Test `parseKimiResponse(value)` with one valid Kimi response, a mismatched model, missing content, and invalid JSON. Expected mismatch message: `Kimi model mismatch`.

- [ ] **Step 2: Run the test and see it fail**

Run `node --test tools/run-kimi.test.mjs`. Expected: module-not-found failure.

- [ ] **Step 3: Implement the parser and OpenRouter call**

Implement:

```js
export const KIMI_MODEL = "moonshotai/kimi-k3";
export function parseKimiResponse(value) {
  if (value?.model !== KIMI_MODEL) throw new Error("Kimi model mismatch");
  const raw = value?.choices?.[0]?.message?.content;
  if (value?.choices?.[0]?.finish_reason !== "stop" || typeof raw !== "string") throw new Error("Kimi output incomplete");
  const parsed = JSON.parse(raw);
  if (typeof parsed.chinese_markdown !== "string" || !Array.isArray(parsed.evidence_notes)) throw new Error("Kimi output schema invalid");
  return { model: value.model, chinese_markdown: parsed.chinese_markdown, evidence_notes: parsed.evidence_notes };
}
```

Post to OpenRouter with `model: KIMI_MODEL`, `data_collection: "deny"`, `zdr: true`, `require_parameters: true`, JSON-schema output, and `max_tokens: 5000`. Never print the API key.

- [ ] **Step 4: Implement README assertions**

Require both files to start with:

```js
const SWITCH = "[English](README.md) | [简体中文](README.zh-CN.md)";
```

Also require a title and reject `TBD`, `TODO`, and `placeholder`.

- [ ] **Step 5: Run tests**

Run `node --test tools/run-kimi.test.mjs`. Expected: PASS.

### Task 4: Release RAG Quality Lab

**Files:**
- Modify: `README.md`
- Create: `README.zh-CN.md`
- Preserve: `DATA.md`, `results/**`, `evidence/**`

**Interfaces:**
- Consumes: shared benchmark, RAG scope, prior PRs #1/#2.
- Produces: merged bilingual PR retaining C2 as the floor and stating C3 produced no metric.

- [ ] **Step 1: Run the combined Fable5 English pass**

Prompt one exact `claude-fable-5` invocation to read the benchmark, RAG scope, current English README, `DATA.md`, A1/A2 notes, prior diffs, and immutable evidence. Phase A acts only as a senior GitHub user and records the gap matrix before editing English. Phase B then acts only as an AI application/data engineering/data analysis recruiter and reviews the resulting English for 30-second scan, technical depth, outcome credibility, and role fit. Record `github_user_phase` and `recruiter_phase` separately in `combined-english-pass.json`; require exact terminal token `COMBINED_ENGLISH_PASS_ACCEPTED` only when both pass.

- [ ] **Step 2: Reconcile the existing Kimi output once**

If the combined pass leaves `README.md` byte-identical to the English input that produced the existing Kimi artifact, retain the byte-bound `README.zh-CN.md`. If English changes, run the tested writer exactly once with the RAG scope and final accepted English README, then apply `chinese_markdown` to `README.zh-CN.md` with `apply_patch`. Require exact Kimi model identity `moonshotai/kimi-k3`. Do not run a Fable5 Chinese review or Kimi revision round.

- [ ] **Step 3: Run local bilingual and evidence review**

Verify the exact language switch, section/table/link/path coverage, all numbers and dates, C2 evaluation-floor wording, C3 no-metric wording, historical-versus-current status, licenses, and protected hashes. Dispatch an independent Codex task reviewer. Any material defect blocks publication for owner review; do not start another paid Fable5 call automatically.

- [ ] **Step 4: Verify**

Run:

```bash
node ../../tools/verify-readme-pair.mjs .
python -m pytest -q
python -m ruff check .
python scripts/verify_data.py
python scripts/ci/run_verify_a3_deterministic.py
git diff --check
```

Expected: all pass; no result/evidence bytes changed.

- [ ] **Step 5: Publish**

Commit `docs: publish bilingual recruiter homepage`, push, open a PR to `main`, require `lint-test-verify`, merge, then close superseded PRs #1/#2 with the merged PR link.

---

### Task 5: Release Privacy Preflight Web

**Files:**
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify only when the recorded Fable5 gap matrix requires a repository-homepage structure correction: `docs/architecture.mmd`, `src/app/page.tsx`
- Preserve: `public/case-studies/privacy-preflight/*.json`

**Interfaces:**
- Consumes: shared benchmark, Privacy scope, prior PR #1.
- Produces: merged bilingual PR preserving local-only browser and fictional-fixture claims.

- [ ] **Step 1: Run the combined Fable5 English pass**

Supply the benchmark, Privacy scope, repository, PR #1 diff, and immutable fictional-fixture evidence to one exact `claude-fable-5` invocation. Record a senior-GitHub-user gap/edit phase followed by a separate AI application/data engineering/data analysis recruiter phase on final English. Require both receipt verdicts and `COMBINED_ENGLISH_PASS_ACCEPTED`; Fable5 directly edits English, while Codex applies only accepted structural guidance.

- [ ] **Step 2: Run Kimi once and review locally**

Generate Chinese once from final accepted English with exact `moonshotai/kimi-k3`. Do not invoke Fable5 after Kimi and do not revise Chinese automatically. Verify browser-local behavior, fictional fixtures, source/app/package/notarization/clean-Mac boundaries, bilingual structure, and protected case-study hashes with deterministic checks plus an independent Codex task review.

- [ ] **Step 3: Verify**

Run:

```bash
node ../../tools/verify-readme-pair.mjs .
npm ci
npm run typecheck
npm run lint
npm run benchmark:privacy-ocr
npm run test:e2e -- --workers=1
npm audit --omit=dev
git diff --check
```

Expected: all pass; no claim of upload, notarization, clean-Mac compatibility, or real-person fixtures.

- [ ] **Step 4: Publish**

Commit `docs: refine bilingual repository homepage`, open PR, require both `build` checks, merge, and close superseded PR #1.

---

### Task 6: Rename and release Streaming Reliability Lab

**Files:**
- Modify: `README.md`
- Create: `README.zh-CN.md`
- Modify: `dashboard/index.html`
- Modify: `dashboard/src/main.js`
- Modify when narrative: `RUNBOOK.md`, `docs/version-matrix.md`, `docs/local-lite-and-workstation.md`, `docs/resume-claims-after-verification.md`, `showcase/results/README.md`, `.github/workflows/ci.yml`
- Preserve exactly: `docs/workstation-run/**`, `showcase/logs/**`, Java `com/p1/**`, Docker image/project IDs, marker paths, immutable run IDs.

**Interfaces:**
- Consumes: shared benchmark, Streaming scope, prior PRs #3/#4.
- Produces: public `LucisZhang/streaming-reliability-lab` with a merged bilingual PR.

- [ ] **Step 1: Write a failing narrative-name verifier**

Scan current narrative files and reject:

```js
const forbidden = [/P1 Reliability Evidence/gu, /^# Reliability Lab\b/gmu, /github\.com\/LucisZhang\/p1-reliability-lab/gu];
```

Exclude historical logs/captures, compatibility IDs, Java package paths, and immutable artifacts.

- [ ] **Step 2: Confirm the verifier fails**

Expected: failures in README badge/title and dashboard headings.

- [ ] **Step 3: Run the combined Fable5 English pass and apply narrative rename**

One exact `claude-fable-5` invocation first audits the repository homepage as a senior GitHub user, then reviews final English as an AI application/data engineering/data analysis recruiter. Record both phase verdicts and require `COMBINED_ENGLISH_PASS_ACCEPTED`. Codex changes current narration to `Streaming Reliability Lab` / `流式可靠性实验室` and updates current links; compatibility/history stays byte-identical.

- [ ] **Step 4: Generate Chinese once and review locally**

Kimi creates `README.zh-CN.md` once from final accepted English with exact `moonshotai/kimi-k3`. Do not invoke Fable5 after Kimi and do not revise Chinese automatically. The name verifier, README-pair verifier, immutable-path hashes, and an independent Codex task review must confirm bilingual fidelity and historical compatibility boundaries.

- [ ] **Step 5: Verify locally**

Run:

```bash
node ../../tools/verify-readme-pair.mjs .
node ../../tools/verify-streaming-name.mjs .
make local-verify
git diff --check
```

Expected: harness tests, Ruff/Black/Mypy/Maven, dashboard build, and narrative-name verifier pass. Do not run heavy Docker reproduction below its documented 25 GiB free-space floor.

- [ ] **Step 6: Open the PR before remote rename**

Commit `docs: rename Streaming Reliability Lab`, push, open a PR, and require both `lint-test` and `dashboard` checks.

- [ ] **Step 7: Rename remote, merge, and update metadata**

Run:

```bash
gh repo rename streaming-reliability-lab --repo LucisZhang/p1-reliability-lab --yes
git remote set-url origin https://github.com/LucisZhang/streaming-reliability-lab.git
```

Verify old-URL redirect, merge the green PR, close superseded PRs #3/#4, and update the description while preserving MySQL CDC → Flink → Iceberg and five-failure evidence.

---

### Task 7: Release Margin Control Tower

**Files:**
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify only when the recorded Fable5 gap matrix requires a repository-homepage structure correction: `public/case-studies/margin-control-tower/README.md`, `src/app/page.tsx`

**Interfaces:**
- Consumes: shared benchmark, Margin scope, prior PR #1.
- Produces: merged bilingual PR with governed-synthetic and proxy disclosures intact.

- [ ] **Step 1: Run the combined Fable5 English pass**

One exact `claude-fable-5` invocation reads the data contract and metric registry, records a senior-GitHub-user gap/edit phase, then records an AI application/data engineering/data analysis recruiter phase on final English. The recruiter phase checks analytics/business decision signal and proxy disclosures. Require both verdicts and `COMBINED_ENGLISH_PASS_ACCEPTED`.

- [ ] **Step 2: Run Kimi once and review locally**

Kimi writes Chinese once from final accepted English with exact `moonshotai/kimi-k3`. Do not invoke Fable5 after Kimi and do not revise Chinese automatically. Deterministic checks and an independent Codex task review verify proxy disclosures, metrics, governed-synthetic boundaries, links, and bilingual fidelity.

- [ ] **Step 3: Verify**

Run:

```bash
node ../../tools/verify-readme-pair.mjs .
npm ci
npm run generate:data
npm run generate:analytics-parquet
npm run typecheck
npm run lint
npm run test:e2e -- --workers=1
npm audit --omit=dev
git diff --check
```

Expected: all pass; restore generated fixture changes unless intentionally approved.

- [ ] **Step 4: Publish**

Commit `docs: refine bilingual analytics homepage`, open PR, require `verify`, merge, and close superseded PR #1.

---

### Task 8: Release Credit Policy Lab

**Files:**
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify only when the recorded Fable5 gap matrix requires a repository-homepage structure correction: `public/case-studies/credit-policy-lab/README.md`, `src/app/page.tsx`

**Interfaces:**
- Consumes: shared benchmark, Credit scope, prior PR #1.
- Produces: merged bilingual PR preserving license, granted-loan-only, non-causal, and non-production boundaries.

- [ ] **Step 1: Run the combined Fable5 English pass**

One exact `claude-fable-5` invocation reads the policy contract, records a senior-GitHub-user gap/edit phase, then records an AI application/data engineering/data analysis recruiter phase on final English. The recruiter phase checks data-analysis signal and policy-decision clarity without upgrading offline backtest evidence into live decisioning. Require both verdicts and `COMBINED_ENGLISH_PASS_ACCEPTED`.

- [ ] **Step 2: Run Kimi once and review locally**

Kimi writes Chinese once from final accepted English with exact `moonshotai/kimi-k3`. Do not invoke Fable5 after Kimi and do not revise Chinese automatically. Deterministic checks and an independent Codex task review verify granted-loan-only, non-causal, non-production, licensing, cutoff, metric, and bilingual-fidelity boundaries.

- [ ] **Step 3: Verify**

Run:

```bash
node ../../tools/verify-readme-pair.mjs .
npm ci
npm run generate:data
npm run generate:analytics-parquet
npm run typecheck
npm run lint
npm run test:e2e -- --workers=1
npm audit --omit=dev
git diff --check
```

Expected: all pass; real-data citations, hashes, license labels, and cutoffs remain exact.

- [ ] **Step 4: Publish**

Commit `docs: refine bilingual credit-policy homepage`, open PR, require `verify`, merge, and close superseded PR #1.

### Task 9: Create the dedicated Release Guardian repository

**Files:**
- Create: `README.md`, `README.zh-CN.md`, `package.json`
- Create: `.github/workflows/ci.yml`
- Create: `docs/architecture.mmd`
- Create: `evidence/manifest.json`
- Create: `evidence/data/{evaluation-live,evaluation-stub,cost-evidence,findings}.csv`
- Create: `replay/synthetic-scenarios.json`
- Create: `scripts/replay.mjs`, `scripts/verify-evidence.mjs`
- Create: `tests/replay.test.mjs`

**Interfaces:**
- Consumes: portfolio `docs/release-guardian-claims.md` and approved sanitized assets.
- Produces: public `LucisZhang/release-guardian`, a deterministic replay, and exact-hash verification; never claims full private source.

- [ ] **Step 1: Initialize locally without a remote**

Run:

```bash
mkdir -p /private/tmp/portfolio-repository-release-20260722/repos/release-guardian
git init -b main /private/tmp/portfolio-repository-release-20260722/repos/release-guardian
```

- [ ] **Step 2: Copy only approved sanitized assets**

Copy the architecture, four CSV files, manifest, and synthetic scenarios from `portfolio-site/public/case-studies/release-guardian/`. Do not copy private source, raw Phase-L reports, workstation metadata, or screenshot candidates. Add a new publication record dated 2026-07-22 without rewriting the historical source manifest.

- [ ] **Step 3: Write failing replay tests**

Test this interface:

```js
import { scoreScenario } from "../scripts/replay.mjs";
assert.deepEqual(scoreScenario(authScenario, rules), { score: 25, level: "medium", blockers: [] });
assert.equal(scoreScenario(schemaScenario, rules).level, "critical");
assert.match(fixture.fixed_disclosure, /not connected to the private repository or a live model/iu);
```

Run `node --test tests/replay.test.mjs`. Expected: module-not-found failure.

- [ ] **Step 4: Implement deterministic replay**

`scoreScenario(scenario, rules)` sums only rule weights present in the public fixture, caps at 100, derives the fixture's bands, and emits deterministic blockers. The CLI accepts a scenario ID and prints `scenario_id`, `score`, `level`, `blockers`, and `fixed_disclosure`. It must not emulate or claim private LangGraph execution.

- [ ] **Step 5: Implement evidence verification**

`scripts/verify-evidence.mjs` verifies every copied asset's SHA-256 against `evidence/manifest.json`, asserts live/stub separation, and requires both READMEs to place `30/44` beside any aggregate live-gate claim and `15/44` beside any aggregate stub-gate claim.

- [ ] **Step 6: Run the combined Fable5 English pass, then Kimi once**

One exact `claude-fable-5` invocation first builds the senior-GitHub-user gap matrix and directly writes English, then separately reviews final English as an AI application/data engineering/data analysis recruiter for AI application/release-engineering signal, truthfulness, and private-source boundaries. Require both receipt verdicts and `COMBINED_ENGLISH_PASS_ACCEPTED`. Kimi then writes Chinese once from final accepted English with exact `moonshotai/kimi-k3`; do not invoke Fable5 after Kimi and do not revise Chinese automatically. Deterministic evidence verification and an independent Codex task review validate bilingual fidelity and the sanitized-package boundary.

- [ ] **Step 7: Verify**

Run:

```bash
node ../../tools/verify-readme-pair.mjs .
npm test
npm run verify:evidence
git diff --check
```

Expected: replay and hashes pass; README states that this is a sanitized public package, not the complete private workflow.

- [ ] **Step 8: Commit and create the public repository**

Commit `feat: publish sanitized Release Guardian replay`, then run:

```bash
gh repo create LucisZhang/release-guardian --public --source . --remote origin --push --description "Sanitized deterministic release-review replay with evidence-gated live and stub evaluation records."
```

Expected: public `main`, rendered bilingual README, and passing CI.

---

### Task 10: Record final repository state

**Files:**
- Create: `/private/tmp/portfolio-repository-release-20260722/final-repository-manifest.json`

**Interfaces:**
- Consumes: six final default branches.
- Produces: six exact URLs and 40-character commits consumed by the site plan.

- [ ] **Step 1: Query final default branches**

Run:

```bash
gh repo view LucisZhang/release-guardian --json name,url,defaultBranchRef
gh repo view LucisZhang/rag-quality-lab --json name,url,defaultBranchRef
gh repo view LucisZhang/privacy-preflight-web --json name,url,defaultBranchRef
gh repo view LucisZhang/streaming-reliability-lab --json name,url,defaultBranchRef
gh repo view LucisZhang/margin-control-tower --json name,url,defaultBranchRef
gh repo view LucisZhang/credit-policy-lab --json name,url,defaultBranchRef
gh api repos/LucisZhang/release-guardian/commits/main --jq '{name:"release-guardian",commit:.sha}'
gh api repos/LucisZhang/rag-quality-lab/commits/main --jq '{name:"rag-quality-lab",commit:.sha}'
gh api repos/LucisZhang/privacy-preflight-web/commits/main --jq '{name:"privacy-preflight-web",commit:.sha}'
gh api repos/LucisZhang/streaming-reliability-lab/commits/main --jq '{name:"streaming-reliability-lab",commit:.sha}'
gh api repos/LucisZhang/margin-control-tower/commits/main --jq '{name:"margin-control-tower",commit:.sha}'
gh api repos/LucisZhang/credit-policy-lab/commits/main --jq '{name:"credit-policy-lab",commit:.sha}'
```

Expected: every default branch is `main`; save the six exact URLs and full commit SHAs for the next step.

- [ ] **Step 2: Write the manifest with `apply_patch`**

Create one JSON instance from the twelve exact values observed in Step 1. It must satisfy this schema; do not shorten a SHA or invent a value:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "additionalProperties": false,
  "required": ["generated_at", "repositories"],
  "properties": {
    "generated_at": { "type": "string", "format": "date-time" },
    "repositories": {
      "type": "array",
      "minItems": 6,
      "maxItems": 6,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["name", "url", "commit"],
        "properties": {
          "name": {
            "enum": [
              "release-guardian",
              "rag-quality-lab",
              "privacy-preflight-web",
              "streaming-reliability-lab",
              "margin-control-tower",
              "credit-policy-lab"
            ]
          },
          "url": { "type": "string", "pattern": "^https://github\\.com/LucisZhang/[a-z0-9-]+$" },
          "commit": { "type": "string", "pattern": "^[a-f0-9]{40}$" }
        }
      }
    }
  }
}
```

- [ ] **Step 3: Validate public state**

Run a Node assertion requiring six unique names, GitHub HTTPS URLs, and `/^[a-f0-9]{40}$/` commits. Open both README language links for every repository and require HTTP 200.

- [ ] **Step 4: Verify PR closure and checks**

Run `gh pr list --state open` and `gh pr view` across the six repositories. Expected: no superseded task PR remains open; every merged task PR was green.

- [ ] **Step 5: Hand off to the site plan**

Do not edit or deploy the portfolio until the final manifest passes.
