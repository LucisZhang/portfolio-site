# Phase 2 upgrade plan — RAG Quality Lab

**Status:** REGENERATED (v3) for GATE 2b approval, replacing the prior draft per human direction of 2026-07-10. The prior draft only packaged existing work; this one adds a research sprint and a workstation-scale upgrade path. Nothing below executes until the human answers §9. The canonical source folder `/Users/hsiangkuochang/rag-quality-lab` stays read-only throughout — all work happens in a fresh copy.

---

## 1. What changed in this draft

Human direction: the current dataset (a 498K-record local KB) and model (small local `gemma4:e4b`) may be too standard and too small for a portfolio that should read as production-facing. Production RAG runs at larger scale, on more carefully chosen, business-relevant corpora, with stronger models. Scaling may justify moving heavy runs to the company workstation. Choosing *what* to scale to requires real research — and the human has judged the built-in web search too weak for deep dataset discovery, so a dedicated search MCP should be considered first.

This plan responds with three tracks:

| Track | Purpose | Machine | Starts when |
|---|---|---|---|
| **A — Preserve & package** | Lock in the existing verified evidence as a baseline repo | Mac | GATE 2b approval |
| **B — Research sprint** | Live search for frontier, business-adjacent dataset + model candidates; produce a ranked, license-checked recommendation | Mac (research only) | GATE 2b approval (can overlap A) |
| **C — Workstation-scale upgrade** | Re-run the lab at production-adjacent scale with a stronger stack | Company workstation | **GATE 2c** — a new checkpoint after Track B, where the human picks the dataset/model from evidence |

Track A is not optional: whatever C becomes, the regression catch and A/B numbers already in hand are portfolio assets and must be preserved and reproducible first. Track C never proceeds on guesses — its concrete dataset and model choices are made at GATE 2c from Track B's researched shortlist, not from this document.

## 2. Positioning — production-facing evaluation lab

The portfolio artifact is an **evaluation harness and its findings**, upgraded to answer the question a hiring reviewer actually asks: *does this person understand RAG at production scale, or only on a class-sized corpus?* The target end-state:

1. **A quantified architecture decision** — HybridRerankRAG vs NaiveVectorRAG, quality vs latency, both sides measured (already have this at current scale; C re-establishes it at larger scale).
2. **A regression the lab caught** — the KB V1→V2 faithfulness drop (already have this; it stays the README's lead finding).
3. **Scale evidence with honest scope** — today that is 50K-doc indexing on a laptop; after C it should be a full corpus measured on workstation hardware, with a scale curve rather than a single point.
4. **A documented selection process** — Track B's research memo itself becomes a portfolio artifact: "here is how I chose a corpus and model stack, with criteria, candidates, licenses, and trade-offs" is production judgment made visible.

## 3. Evidence baseline

**Verified (2026-07-10):**
- Canonical source `/Users/hsiangkuochang/rag-quality-lab`: not a git repo, no CI; tree mixes app code, data, saved results, Chroma stores, a venv, a duplicate `Code/` snapshot.
- Pipelines `NaiveVectorRAG` and `HybridRerankRAG`; RAGAS path plus local Ollama-judge fallback; `RegressionTester` diffs KB versions.
- Saved metrics: five-metric mean **0.8093 → 0.9438** (A/B), retrieval **29.15 ms → 134.15 ms** mean; regression **4 degraded / 0 improved / 8 stable** with faithfulness **0.9875 → 0.8667**; 50K docs → 56,039 vectors in **691.17 s (13.82 s per 1K docs)**.
- Data: `large_knowledge_base.json` — **498,725 records, 191 MB** (over GitHub's 100 MB hard limit); 500-question large eval set; 12-question controlled set.
- Local models: `gemma4:e4b` + `nomic-embed-text` (Ollama). Project venv Python 3.11; system 3.14 → repo pins 3.11.

**Explicitly NOT verified — this plan does not pretend otherwise:**
- **Company workstation specs** (GPU, VRAM, RAM, disk, install and data policies). Track C cannot be sized until the human supplies these (§9 Q5).
- **The July 2026 frontier.** My training data ends January 2026. Which datasets/models are currently state-of-the-art, their exact licenses, sizes, and download terms all require **live search and per-source license reading** — that is Track B's job. Every dataset or model named below is a **candidate class to verify, not a selection.**
- **Search MCP pricing/tiers** — checked at install time, not asserted here.
- Provenance/license of the current 498K-record KB and 500-question set (open since the prior draft; §9 Q3).

## 4. Track A — preserve & package (baseline, Mac)

Carries over the prior draft's task plan, unchanged in substance, so the existing evidence survives regardless of what B and C decide. Summary:

| # | Task | Effort | Stop condition |
|---|------|--------|----------------|
| A1 | Clean rsync copy to `rag-quality-lab-portfolio` (exclude venv, Chroma stores, `Code/` duplicate, generated outputs); `git init`; scan for secrets and files ≥ 100 MB before first commit | S | Secret or unlicensed data found → halt, report |
| A2 | Pin Python 3.11, lockfile from working venv, quickstart, headless Streamlit smoke test | M | Unresolvable dependency → report, don't pin around silently |
| A3 | Verification run: deterministic checks; fresh 12-question A/B (Ollama judge) and fresh V1→V2 regression; two-column table (saved run / re-verified 2026-07) in `evidence/verified-2026-07/` | L | Fresh results contradict saved claims → publish discrepancy, halt |
| A4 | 191 MB KB: **Option A** — out of git; ~1,000-record sample + SHA-256 + `DATA.md` + checksum validator (LFS rejected: quota/clone friction, no history value) | S–M | Provenance unresolved → schema + synthetic sample only |
| A5 | README: regression finding first, architecture diagram, claim-labeled results tables, Limitations section, UI screenshots | M | — |
| A6 | Unit tests on model-free logic (chunking, BM25, regression diffing) + GitHub Actions (lint + tests, no model inference, LLM calls mocked) | M | — |
| A7 | **Private** GitHub repo, push, verify no blob ≥ 100 MB in history | S | Anything needing history rewrite/force-push → propose to human |

All of Track A fits the M4/16 GB Mac; nothing is [NEEDS-GPU]. Track C later extends this repo (new `evidence/` runs, updated README) rather than replacing it.

## 5. Track B — research sprint (Mac, research-only, no source changes)

Goal: replace guesswork with a ranked, evidence-linked shortlist of datasets and models. Timebox: **~1 day total.** Deliverable: `docs/phase2-dataset-model-research.md`. Ends at **GATE 2c** — no download, no install of finalists before the human picks.

**B0 — Search tooling decision (S).** Live discovery ("what RAG benchmarks appeared in 2025–2026? what licenses? what do practitioners use for enterprise-domain retrieval eval?") is search-heavy. Options, all requiring an API key whose current free tier/pricing gets verified at setup:

| Candidate MCP | Claimed strength (to verify) |
|---|---|
| **Tavily** | Research-oriented aggregation, good for survey-style questions |
| **Exa** | Neural/semantic search — strong for "find things like X" dataset discovery |
| **Brave Search** | Straightforward web index, generous free tier historically |
| **Perplexity (Sonar)** | Synthesized answers with citations |

Fallback if the human declines an MCP: built-in WebSearch/WebFetch. It exists and works; the human has judged it too shallow for this job, so the recommendation is to install **one** MCP (Fable compares current free tiers at setup and reports before configuring, unless the human names one in §9 Q4).

**B1 — Dataset landscape scan (M).** Apply the §6.1 criteria to candidate classes via live search. Record for each candidate: domain, size (records/GB), document realism (long docs? tables? noise?), eval-set availability or construction path, license (read the actual license text), download mechanics, disk footprint, and how recent/novel it is.

**B2 — Model & evaluator scan (M).** For the workstation tier (once specs known): current strongest open-weight generators per VRAM class; current top embedding models (check the live MTEB leaderboard, not memory); reranker upgrades; judge options — local large judge vs a pinned frontier API judge (e.g., a current Claude model — exact model ID and per-token pricing verified live, cost projected against the eval-set size before any commitment).

**B3 — License & policy verification of finalists (S–M).** Per finalist: license permits portfolio use and (ideally) public sample publication; no PII/sensitive content concerns; compatible with company workstation data policy. Anything non-commercial-only or ambiguous is flagged, not assumed. Known trap to check explicitly: several classic IR datasets (e.g., MS MARCO) have historically carried non-commercial research terms.

**B4 — Research memo + ranked recommendation (S).** Top-3 dataset candidates and a model stack proposal, each with evidence links and an honest cons column. **STOP at GATE 2c.**

## 6. Track C — workstation-scale upgrade (contingent on GATE 2c + specs)

This section defines *criteria, candidate classes, and protocol* — deliberately not final picks, because final picks without Track B's live research would be fabrication.

### 6.1 Dataset selection criteria

1. **Business-adjacent domain** — enterprise docs, finance, e-commerce, support, or legal; not another Wikipedia-flavored QA set.
2. **Materially larger than current** — target ≥ 1M records/passages or multi-GB raw text, so the scale story genuinely exceeds today's 498K/191 MB.
3. **Realistic document structure** — long documents, tables, near-duplicates, noise; the things that break naive RAG in production.
4. **Ground truth path** — ships an eval set with relevance judgments/answers, or supports building one defensibly.
5. **Clean license + documented provenance** — publishable at least in sample form; no "found it somewhere" data.
6. **Novelty** — benchmarks introduced ~2024–2026 preferred over saturated classics, verified live.

### 6.2 Candidate classes (examples are hypotheses for Track B to verify, including licenses)

- **E-commerce product search** — e.g., Amazon ESCI-class shopping-query datasets.
- **Finance/enterprise filings** — SEC 10-K/EDGAR-derived corpora; FinQA/FiQA-class eval sets over them.
- **Legal contracts** — CUAD-class or pile-of-law subsets.
- **Customer support / ticketing corpora** — closest to real enterprise RAG workloads if a licensable one exists.
- **Recent purpose-built RAG benchmarks** — CRAG (KDD Cup 2024), RAGBench-class, and whatever 2025–2026 produced that I cannot know without searching.
- **Web-scale passage ranking** — MS MARCO v2-class (tens of millions of passages) as the pure-scale option, with its license as the known risk.

### 6.3 Model & evaluator upgrade classes (sized to verified workstation specs at GATE 2c)

- **Generator:** step up from `gemma4:e4b` by VRAM tier — ~12–14B class, ~27–32B class, 70B class only if VRAM allows. Serving via Ollama or vLLM per workstation policy.
- **Embeddings:** current MTEB leaders in the practical tier — re-embedding the full corpus is the dominant compute cost, so this choice is made once, deliberately.
- **Reranker:** cross-encoder upgrade to keep the hybrid pipeline's edge honest at scale.
- **Judge:** pinned frontier API judge for headline metrics, with the local judge kept as the free re-verification path. Discipline: one judge version per experiment; API-judge and local-judge numbers never mixed in one table; total judge cost projected and capped before the first call (§9 Q6).

### 6.4 Resource plan (extrapolations from verified numbers, labeled as such)

- Measured on the Mac: 13.82 s per 1K docs with `nomic-embed-text`. Linear extrapolation: full current KB (498,725 records) ≈ **~1.9 h**; a 5M-passage corpus ≈ **~19 h** at laptop rate — this is the quantified argument for GPU embedding on the workstation. Workstation rates must be re-measured; linearity is an assumption to test, not a claim.
- Disk: current KB is ~0.4 KB/record raw; candidate corpora will be GB-scale raw plus a vector store whose overhead we have not measured at full scale — C measures and reports it rather than guessing.
- Full corpora never enter git anywhere (Option A discipline from A4 extends to C: samples + checksums + `DATA.md`).

### 6.5 Task sketch and evidence to bring back

C0 workstation intake (record machine spec, install toolchain, confirm policies) → C1 acquire dataset, record provenance + checksums → C2 build/adapt eval set → C3 index full corpus with timed scale curve (e.g., 50K / 250K / 1M / full) → C4 A/B experiment matrix across model upgrades, one variable at a time → C5 judged evaluation under the §6.3 judge protocol → C6 evidence bundle home.

The bundle mirrors the p1 workstation discipline (`docs/p1-workstation-reproduction-guide.md`): machine spec, pinned environment lockfile, configs, timed logs, raw metrics JSONs, dataset checksums and license record, and a results table distinguishing **saved Mac baseline / workstation re-run / workstation at new scale**. Stop conditions: any license doubt → halt before download; any result contradicting the baseline story → publish the contradiction, don't smooth it.

## 7. Claims discipline (extended)

Unchanged from the prior draft for Track A (deterministic checks binary; LLM-judged metrics re-measured and shown two-column; never claim production usage, generalization beyond the eval sets, cross-judge comparability, or undocumented provenance). Added for B/C: no dataset or model is described as "chosen" until GATE 2c; "frontier" and "state-of-the-art" appear in the repo only with a dated citation from Track B's live research; all scale projections are labeled extrapolations until measured; workstation results always carry the machine spec.

## 8. Sequencing

GATE 2b approval → **A1–A7** on the Mac (protects existing evidence; ~2–3 working days) with **B0–B4** overlapping once A1's clean copy exists → **GATE 2c** (human picks dataset + model stack from the research memo; workstation specs confirmed) → **C0–C6** on the workstation → final repo/README integration back on the Mac. STATE.md updated and committed after every task, as always.

## 9. Approval questions — GATE 2b

Answer with numbers; "approve 1, 2, 4 as recommended + answers to 3, 5, 6, 7" is the expected shape.

1. **Track structure** — Approve the A → B → (GATE 2c) → C structure, with Track C blocked until GATE 2c? *(Recommend: yes.)*
2. **Track A bundle** — Approve A1–A7 as specified: clean copy with read-only source, Option A for the 191 MB file, saved-run labeling with optional ~5K re-index sanity check, private-repo push at A7, BIT artifacts reference-only? *(Recommend: yes — identical to the previously drafted recommendations.)*
3. **Current-data provenance (still open)** — What is the origin/license of the 498,725-record KB and the 500-question set, and may real samples be published? Until answered, A4 ships schema + synthetic sample only. *(Needs your answer.)*
4. **Search MCP** — Install one? Options: (a) you name one of Tavily/Exa/Brave/Perplexity, (b) Fable compares current free tiers at setup and reports back before configuring, (c) decline — Track B uses built-in WebSearch with the caveat that discovery depth may suffer. *(Recommend: b.)*
5. **Workstation** — Provide specs (GPU model + VRAM, RAM, free disk) and confirm policy: may it download public datasets and open-weight models, run Ollama/vLLM, and export the evidence bundle back? *(Needed before GATE 2c can size Track C.)*
6. **Budget caps** — Set a cap for (a) search API spend in Track B and (b) API-judge spend in Track C (projected against eval-set size before first call, halted at the cap). *(Recommend naming a number now, e.g., a modest two-digit USD total, adjustable at GATE 2c.)*
7. **Ambition scope** — Track C keeps the current two-pipeline A/B design and upgrades data/models/scale, versus also adding a third pipeline architecture (e.g., multi-hop or agentic retrieval). *(Recommend: keep two pipelines for C; a third architecture is a separate decision at GATE 2c once the research memo shows what would be most credible.)*

**STOPPED at GATE 2b.** On approval: A1 begins immediately; B0 begins per the Q4 answer; C waits for GATE 2c.
