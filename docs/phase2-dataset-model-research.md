# Phase 2 / RAG Quality Lab — Track B research memo (B1–B4)

Date: 2026-07-11 · Author: Claude/Fable5 (orchestrated session) · Status: **STOPPED at GATE 2c**

## 0. Method and evidence status — read first

**Exa MCP could not be used in this session.** The server connects, but the `mcp__exa__*`
tools are not in the project permission allowlist, and this non-interactive session cannot
grant permissions (the same mechanism previously recorded for WebSearch/WebFetch). Per Q1/Q2
discipline, no self-granting and no unapproved web fallback was used.

Research therefore ran on the **approved live-check path: the GitHub API via allowlisted
`gh api`** — which turned out to cover the primary sources (license texts, READMEs, release
assets) for every dataset finalist. Labels used throughout:

- **[LIVE]** — read on 2026-07-11 from the named GitHub repo via API (primary source).
- **[HYPOTHESIS]** — from training data (cutoff Jan 2026); must be live-verified before any
  commitment or publication.
- **[BLOCKED-EXA]** — requires web-wide search/fetch; deferred until Exa access is granted
  (see §6 unblock options).

Known coverage limit: dataset discovery was GitHub-only (`gh api search/repositories`,
benchmarks created ≥2025 sorted by stars). A 2025–2026 benchmark living only on Hugging Face
or an academic site could have been missed. [BLOCKED-EXA]

## 1. B1+B3 — Dataset candidates with verified licenses

| # | Candidate | Domain | Scale | Ground truth | License (verified how) | Verdict |
|---|-----------|--------|-------|--------------|------------------------|---------|
| 1 | **EnterpriseRAG-Bench** (`onyx-dot-app/EnterpriseRAG-Bench`) | Company-internal docs (simulated) | ~500K docs, 1.2 GB zipped | 500 Q + ground-truth doc ids, 10 categories | **MIT** — LICENSE file read [LIVE]; HF dataset-card license double-check [BLOCKED-EXA] | **Recommend #1** |
| 2 | **Amazon ESCI Shopping Queries** (`amazon-science/esci-data`) | E-commerce product search | 130,652 queries / 2,621,738 graded judgements (large); 48,300 / 1,118,011 (reduced); EN/JP/ES | E/S/C/I graded relevance per query-product pair | **Apache-2.0** — repo license via API [LIVE] | **Recommend #2** |
| 3 | **FinanceBench** (`patronus-ai/financebench`) | Finance QA over SEC filings | 10,231 Q total, **only 150 open-source**; filings PDFs | gold answers + evidence strings | **No license file** (API `license: null`) [LIVE] — terms unclear | **#3, license-flagged** |
| 4 | CRAG (`facebookresearch/CRAG`, KDD Cup 2024) | Web/KG QA | 5 domains | Q/A + mock APIs | **CC-BY-NC-4.0** — LICENSE read [LIVE] | **Excluded** (non-commercial) |
| 5 | MS MARCO v2 class | Web passages | 10M+ passages | qrels | **"non-commercial research purposes only … without extending any license or other IP rights"** — `microsoft/msmarco` `Notice.md` [LIVE] | **Excluded for public use** (see §3) |
| 6 | CUAD (`TheAtticusProject/cuad`) | Legal contracts | 500 contracts, 13K annotations | expert clause labels | Repo has **no LICENSE file** [LIVE]; CC-BY-4.0 claim on project site [HYPOTHESIS] | Deprioritized (2021, saturated, narrower fit) |

GitHub-side discovery also surfaced (not shortlisted): GraphRAG-Bench (MIT, 2025-06, graph-RAG
focus), supermemoryai/memorybench (MIT, 2025-09, conversational memory focus). [LIVE]

### 1.1 EnterpriseRAG-Bench details [LIVE]

- Simulates one company ("Redwood Inference", AI-inference SaaS). Sources and volumes:
  Slack 275K, Gmail 120K, Linear 35K, Google Drive 25K, Hubspot CRM 15K, Fireflies meeting
  transcripts 10K, GitHub PRs 8K, Jira 6K, Confluence 5K — realistic enterprise noise,
  near-duplicates, informal text, cross-document reasoning.
- 500 questions in 10 categories (Basic 175, Semantic 125, Intra-Document Reasoning 40,
  Project-Related 40, Constrained 30, Conflicting-Info 20, Completeness 20, Misc 20,
  High-Level 10, Info-Not-Found 20) + 100 extra metadata-aware questions. Categories like
  Conflicting-Info and Info-Not-Found map directly onto this lab's faithfulness/regression
  story.
- Distribution: GitHub release v1.0.0 (2026-03-29): `all_documents.zip` = 1,197 MB, plus
  per-source slices (≤5,000 docs each) — the slice structure allows a *subset-first* intake
  (e.g., Confluence+Jira+Drive ≈ 36K docs) before committing to the full 500K.
- Public leaderboard exists (HF space) → external comparability for our numbers.
- Repo created 2026-02-19; 454 stars; arXiv 2605.05253; MIT license (c) 2026 DanswerAI, Inc.
- **Honest cons:** data is synthetic (LLM-generated simulation — "realism" is designed, not
  organic); single fictional company; only 500 core questions; generator-family bias in the
  corpus is unknown; README badge says "Code License: MIT" so the HF dataset-card license
  needs the [BLOCKED-EXA] double-check before public sample republication.

### 1.2 Amazon ESCI details [LIVE]

- Real (not synthetic) shopping queries with 4-level graded relevance — upgrades our
  retrieval metrics from binary hit/recall to NDCG-style graded evaluation; multilingual
  (EN/JP/ES) is an optional extra story.
- Fields include product title/description/bullet points/brand/color — short-document corpus.
- **Honest cons:** ranking dataset, not QA — no gold *answers*, so the generation/judge story
  needs a constructed eval set (defensible but extra work); documents are short (weak fit for
  the "long docs" realism criterion); introduced 2022 (KDD Cup) — solid but not novel.

### 1.3 FinanceBench details [LIVE]

- Open subset: 150 annotated Q/A/evidence triples over public-company filings (SEC PDFs —
  public-domain primary documents); full 10,231-question set requires contacting Patronus.
- **Honest cons:** no license file on the open subset repo — must be clarified before any
  use beyond private experimentation; 150 questions is small for headline claims; PDF
  parsing pipeline is real work (though it *adds* production realism); repo last pushed
  2024-12 (not actively maintained).

## 2. B2 — Model & evaluator scan (workstation tier)

Workstation specs are unknown until GATE 2c, so this section proposes *tiers with a live
verification step at C0*, per the plan's claims discipline.

- **Generator.** Current lab: `gemma4:e4b` (local Ollama). Upgrade tiers by VRAM class:
  ~12–14B, ~27–32B, 70B-class only if VRAM allows. Specific "current strongest open-weight
  per class" [BLOCKED-EXA — verify at C0 against live sources; naming one from training data
  here would violate the plan's own rule]. Serving: Ollama first (matches existing tooling),
  vLLM if the workstation policy prefers it.
- **Embeddings.** Current: `nomic-embed-text`. Re-embedding the full corpus is the dominant
  compute cost, so this is a decide-once choice made at C0 against the **live MTEB retrieval
  leaderboard** [BLOCKED-EXA]. Candidate classes from training data (bge-m3-class,
  gte-class, nomic v2-class) are [HYPOTHESIS] only.
- **Reranker.** Current: `cross-encoder/ms-marco-MiniLM-L-6-v2` (2021-era, tiny). Upgrade
  class: modern multilingual cross-encoder (bge-reranker-v2-class) or LLM-reranker;
  verify current options live at C0 [BLOCKED-EXA]. Note: the *model* being trained on MS
  MARCO does not inherit the dataset redistribution restriction for our use; using the
  reranker stays within non-commercial research use regardless.
- **Judge.** Two-lane discipline stays: pinned frontier API judge for headline metrics +
  local judge as the free re-verification lane; one judge version per experiment; lanes
  never mixed in one table. Current Claude model IDs confirmed from the Claude Code runtime
  (2026-07-11): `claude-sonnet-5` (recommended default judge), `claude-haiku-4-5-20251001`
  (cheap lane), `claude-opus-4-8` / `claude-fable-5` (heavyweight; likely unnecessary for
  rubric scoring). **Per-token pricing is deliberately not quoted here** — it gets verified
  live and projected against the eval set (order of magnitude: 500 questions × 5 metrics ×
  ~1–2K tokens/call ≈ 2.5–5M tokens/run) **before the first call**, against the human's Q6
  cap. Q4 (2026-07-11) already ruled: no API judge on the Mac; judge runs belong to Track C.

## 3. Consequences already applied to the current repo (Track A working copy)

The MS MARCO verification (§1 row 5) closed DATA.md's open license item — commit `f8cef06`
(pushed): DATA.md §3 now quotes the verified terms with a dated source; the pre-public-release
remediation for `data/large_eval_questions.json` is fixed to *replace with regeneration
instructions + checksum* (the "license permits republication" branch is closed); README
licensing summary + limitations updated. The repo is private, so nothing is currently exposed.

## 4. B4 — Ranked recommendation

1. **EnterpriseRAG-Bench** as the Track C dataset. Only candidate scoring on all six §6.1
   criteria (business-adjacent ✓, 500K docs/multi-GB ✓, realistic structure ✓ (by design),
   ground-truth path ✓, MIT ✓ (card check pending), 2026-novel ✓). Its question categories
   extend the lab's existing regression narrative, and the public leaderboard gives external
   comparability. Start with per-source slices; scale to the full 500K on the workstation.
2. **ESCI** as an optional retrieval-metrics extension (graded relevance/NDCG at 2.6M
   judgements, clean Apache-2.0, real behavioral data complementing #1's synthetic corpus).
   Take only if the human wants the extra scope at GATE 2c.
3. **FinanceBench (open 150)** only if a finance-domain story matters more than license
   cleanliness — requires a license clarification first. Otherwise drop.

MS MARCO v2-scale and CRAG are ruled out for anything public by verified non-commercial
terms; current MS MARCO-derived assets stay private-only under DATA.md §3 rules.

## 5. Blocked items ledger (what Exa would still add)

1. HF dataset-card license confirmation for EnterpriseRAG-Bench (and its arXiv paper read).
2. Live MTEB leaderboard → embedding pick; current open-weight generator landscape per VRAM
   class; reranker options. (All C0-timed anyway.)
3. Claude API pricing page → judge cost projection against the Q6 cap.
4. Web-wide sweep for non-GitHub 2025–2026 benchmarks (residual discovery risk, §0).
5. Exa keyless quota observation (B0 pilot item) — untested since tools never fired.

## 5.1 Ledger addendum — Exa MCP live checks, 2026-07-11 (post-GATE 2c session)

The approved Exa MCP allowlist took effect; `mcp__exa__*` tools worked keyless in this session
(several search + fetch calls, no key or billing prompt — closes item 5's pilot observation).
Ledger status update:

1. **CLOSED — EnterpriseRAG-Bench HF card license = MIT.** Verified via the HF API
   (`cardData.license: "mit"`, tag `license:mit`) on dataset `onyx-dot-app/EnterpriseRAG-Bench`
   (created 2026-04-21, last modified 2026-05-08, ~1.41 GB storage; `questions`/`documents`
   parquet configs loadable via `datasets`). Combined with the GitHub LICENSE [LIVE] read, the
   license question on the primary dataset is fully closed. Two new facts: (a) the official
   evaluation harness requires an LLM API key (OpenAI or Anthropic; leaderboard judge is
   GPT-5.4) — so official scoring sits behind the spend gate; (b) the HF card and GitHub
   quickstart disagree on per-category question counts (Basic 175 vs 200; both total 500) —
   derive counts from `questions.jsonl` at C2.
2. **PARTIALLY CLOSED — model/embedding/reranker candidates live-corroborated** from multiple
   independent 2026 secondary sources (MTEB-derived roundups, A6000-specific benchmarks):
   embeddings BGE-M3 (MIT) / Qwen3-Embedding family; reranker bge-reranker-v2-m3 /
   Qwen3-Reranker; generator 27–32B GGUF class on the A6000 (Ampere: no FP8 → Ollama/GGUF,
   not vLLM-FP8). Sources conflict on Qwen3-family licensing → final picks still require an
   HF model-card read at C3 intake, as planned.
3. **CLOSED — Claude API pricing** verified live from docs.claude.com: `claude-sonnet-5`
   $2/$10 per MTok in/out through 2026-08-31 (then $3/$15); `claude-haiku-4-5` $1/$5. Claude
   5-family tokenizer yields ~30% more tokens for the same text. Projection: a full
   500-question judged run ≈ $14–31 on Sonnet 5 — approximately the whole Q6 cap → first paid
   run must be a 12–50-question pilot (~$0.5–3), still gated on explicit approval.
4. **OPEN — web-wide non-GitHub benchmark sweep** (residual discovery risk): not re-run;
   moot unless the primary path fails.
5. **CLOSED — Exa keyless quota**: worked in practice this session (see above).

Operational consequences are written into `docs/rag-track-c-remote-guide.md` (Track C C0/C1).

## 6. GATE 2c — decisions requested from the human

1. **Dataset:** approve EnterpriseRAG-Bench as Track C primary? Include ESCI as secondary
   scope, or keep C focused? (FinanceBench: pursue license clarification or drop?)
2. **Workstation:** confirm specs (GPU/VRAM, RAM, disk, install policy) so C0 can size the
   generator tier and embedding choice.
3. **Judge + budget:** approve the two-lane judge protocol with `claude-sonnet-5` as the
   pinned API judge candidate, and set the Q6 spend cap (pricing verified live before first
   call; no spend before that).
4. **Third pipeline architecture** (GATE 2b answer 7): add one (e.g., a query-rewrite or
   parent-document variant) in Track C, or keep the A/B pair?
5. **Exa access for the §5 ledger:** (a) run a future session interactively and grant
   `mcp__exa__*` when prompted, (b) human adds `mcp__exa__*` to the project allowlist, or
   (c) approve Q2 WebSearch/WebFetch fallback. Fable will not self-grant any of these.
6. **Confirm the MS MARCO remediation path** recorded in DATA.md §3 (replace
   `large_eval_questions.json` before any public release — a Phase 3/4 gate item).
