# INVENTORY (v1.0 — PHASE 0 COMPLETE)

> Status: Phase 0 complete (2026-07-09). All 19 source paths located, scanned, and read
> (KB digests / READMEs / git logs / gh API); GitHub account fully reconciled; online
> artifacts reachability-checked. This file is the GATE 2a decision input. Metrics that
> could not be traced to inspectable artifacts remain `[NEEDS-HUMAN-VERIFY]` and are
> excluded from any publishable claim until verified.

## Path corrections (spec → actual on disk)

| Spec path fragment | Actual |
|---|---|
| `大三下 (UM)` / `大三上 (UM)` / `大三下 (BIT)` | No space: `大三下(UM)`, `大三上(UM)`, `大三下(BIT)` |
| `Web dev/记忆的回响 3` | `Web dev/记忆的回响3` (no space) |

All 19 folders exist and are readable (read-only, untouched).

## Duplicate / version clusters detected

1. **career-ops cluster (4 folders → 1 project):** `~/career-ops` (canonical git repo → GitHub `career-ops-private`); `~/career-ops-job-scanner` is a **git worktree** of the same repo; `~/Codex-career-ops` and `~/Codex-career-ops-projectgen` are gitless working copies for Codex agents. ✅ INTEGRITY boundary RESOLVED (see row 3): base system is Santiago's OSS Career-Ops; own work = 14 commits (+25.6K lines, Workday subsystem). Remaining at GATE 2a: human framing decision only (honest OSS-extension case study vs archive-only, default archive-only).
2. **RAG Quality Lab (2 folders → 1 project):** `~/rag-quality-lab` (working code) + BIT `大数据处理技术/Project` (course archive: report, demo video `RAG_Quaility_Lab_Demo.mov`, code zip, KB digest). Canonical: local folder; course folder supplies report/video artifacts.
3. **"Self-done Project" folder = 2 distinct resume projects** (proposal/outcome txt only; artifacts live online): E-commerce RFM/funnel (Tableau Public dashboard) and Credit-risk/fraud detection (HF Space `Luciss007/Risk-Control-Portfolio` ↔ public GitHub repo `Risk-Control-Portfolio`).

## Project summaries (evidence gathered so far)

| # | Project (canonical) | What it is (verified) | Track (prelim) | Notes / state |
|---|---|---|---|---|
| 1 | **release_guardian** (`~/release_guardian`) | Change-impact & risk-gatekeeper agent: LangGraph graph runtime + FastAPI, Go gateway, Java approval-audit (RBAC, hash-chained), Next.js dashboard, pgvector, OTel→Phoenix tracing, code-first eval harness w/ CI gate, offline stub mode. Built Jul 7–8 2026; local git, no remote. EVAL.md verified: 44 labeled scenarios × 3 trials = 132 runs (2026-07-08, stub, exit 0) — missed-dependency 0.081, false-impact 0.069, risk-grade acc 0.773, plan completeness 0.995, citation fidelity 1.000, all thresholds passed; 3 grading levels incl. trajectory + injection defense. | ai-app | **feature-as-is** (flagship). Complete: runnable offline (`make demo`), tests/CI-gated evals, docs (EVAL/ARCHITECTURE/DECISIONS/INTERVIEW_DEFENSE), screenshots. Differentiation: exposed traces + deterministic eval discipline — exactly the "2026 divider" per design doc. Needs: GitHub repo (none yet) + README polish only. |
| 2 | **RAG Quality Lab** | Local Streamlit RAG eval platform (LangChain, ChromaDB, Ollama, RAGAS, BM25+CrossEncoder): A/B compare, regression test, scale bench. README verified: 498,725 MS MARCO passages, 186,190 vectors; A/B result naive 0.809 → hybrid+rerank 0.944 overall (+16.7%), five RAGAS metrics, saved artifacts under `results/`. No git. | ai-app | **upgrade-then-feature** (strong candidate): init git, verify results re-runnable, tests/CI; demo video + report in BIT course folder. |
| 3 | **career-ops** (cluster of 4) | ⚠️ RESOLVED boundary: this is Santiago's open-source **Career-Ops** (MIT, multi-agent job-search system; upstream 136 commits). Own work = 14 commits, +25.6K/−1.1K lines on top: **Workday auto-submission subsystem** (component engine, answer resolver, wizard runner, submission executor, autonomous queue), Telegram artifact delivery, materials-review workflow. Later work continues on branch `codex/materials-loop-closure`. | ai-app / data-eng | **Cannot be featured as own project.** Options for human: (i) honest "extensions I built on OSS Career-Ops" case study (attribution required; note Workday *autonomous submission* is itself sensitive to show recruiters), or (ii) archive-only. Default: archive-only. |
| 4 | **ex-solver** (`~/ex-solver` → GitHub `ex-solver`) | README read: "exam-solver" — self-hosted FastAPI service that solves exam questions (vision preprocessing, AnythingLLM RAG, two-stage solve/verify via OpenRouter) plus a live **interview-assistant** pipeline (fast/planner/deep/verifier model routing, personal-material RAG, OpenAI-compatible bridge). Tests + question bank (251 dirs). | ai-app | ⚠️ **Ethics-sensitive**: a live exam/interview answering tool is a negative signal to employers if shown as-is. Technically strong (multi-model routing, fallbacks, SSE, anti-fabrication RAG). Options for human: keep private (default) or extract/reframe the neutral RAG-verification architecture into a different domain. Local ahead of remote. |
| 5 | **Privacy Preflight for Mac** (→ GitHub `privacy-preflight-for-mac`) | README read in depth: local-first macOS privacy redaction product — SwiftUI app + local FastAPI worker; deterministic text redaction, OCR image redaction, **destructive PDF redaction with extraction validation**, Chinese/mixed-language detectors, optional Presidio/HanLP/OpenAI-Privacy-Filter adapters, local OpenAI-compatible preflight gateway, profile rules with learn-from-sample, backend tests incl. privacy red-lines. Not yet: signing/notarization, bundled runtime, hotkeys. | ai-app | **feature (likely upgrade-then-feature)**: real product thinking + privacy engineering; genuinely differentiating personal tool. Upgrade menu fit: production signals (packaging/CI), demo GIF. |
| 6 | **E-commerce RFM & funnel analysis** | Python/SQL/Tableau; AARRR funnel + K-Means RFM. Metrics (437K logs, 77.6% drop-off, 30K VIP@$2,559) `[NEEDS-HUMAN-VERIFY]` — dashboard reachable, numbers not yet matched. | analytics | **feature-as-is** (after metric verification). Complete: live Tableau Public dashboard; no local code found (only proposal/outcome txt) — case study must link dashboard + honestly note code location. Differentiation: real BI artifact; dataset origin needs disclosure to avoid generic-project smell. |
| 7 | **Credit risk / fraud detection** | XGBoost + SMOTE + Isolation Forest; Streamlit-style `app.py` + model pkls in public repo. Metrics (285K txns, 1:578, 0.96 ROC-AUC) `[NEEDS-HUMAN-VERIFY]`. | analytics | **upgrade-then-feature**: live HF Space + public repo exist, but repo has NO README and pkl-only models — needs README, training notebook/script provenance, metric re-verification. Differentiation: deployed live demo beats notebook-only fraud projects; dataset likely standard (disclose). |
| 8 | **Voice in Security** (UM InfoSec) | Flask + SpeechBrain ECAPA-TDNN speaker-verification classroom demo (~7.5K LOC); enrollment/verification/robustness/PCA-t-SNE views. ↔ public GitHub repo `Voice-in-Security`. | other (security) | **Other/Selected Work** candidate (feature-as-is there): working interactive demo, unusual domain (voice biometrics + spoofing awareness) adds range; prototype-grade (no tests/CI) so not a main-track flagship. Reframe option: none clean into 3 tracks. |
| 9 | **Hybrid Amazon Recommendation Bot** (UM Cloud) | PySpark 4 + MLlib ALS + SentenceTransformers on Amazon Electronics 2023; CLI bot, Telegram scaffolded only. Archived, no git, no manifests. | data-eng | **upgrade-then-feature (secondary)** if DE track needs a 2nd project: real multi-GB ETL under 3GB-RAM constraint is an honest DE story; needs reproducible env, git, and de-clichéing. Otherwise archive-only. |
| 10 | **Wound Area Location Prediction** (UM ML) | scikit-learn RF/MLP multi-output regression on wound images (~880 LOC). Dormant course submission, no git. | foundational-cs | **drop** (archive locally). Small, coursework-shaped, no artifact story beyond report. |
| 11 | **NLP Project ×3** (UM NLP) | Skimmed Task1 report: Books-to-Scrape crawl (200 books) + NLTK preprocessing — competent but tutorial-site material; Task2 Naive Bayes classifier; Project3 group MEMM NER (Kaggle). | foundational-cs | **drop** (archive locally). books.toscrape.com is a practice site = generic signal; group NER has unclear individual attribution. |
| 12 | **Global Happiness Index analysis** (大数据导论) | 3 Python scripts + choropleth HTML + xlsx + large report/PPT. | analytics (weak) | **drop** (archive locally). Public-dataset coursework; weaker than rows 6–7 in every dimension. |
| 13 | **homework spider** (python homework_project) | Scrapy/Selenium BIT-Lexue assignment scraper → CSV → email; iCloud calendar planning loop. 1 commit, dormant; hard-coded accounts. | other | **archive-only**. Personal-tool spirit but stale, unrunnable outside campus, credentials-laden. Could be one line in an "automation background" sentence, not a page. |
| 14 | **记忆的回响3** (Web dev) | Static browser visual novel (HTML/JS/jQuery/Canvas/localStorage, ~6.2K LOC), group coursework, partially broken links/scenes. | other | **Other/Selected Work (optional)**: adds personality/range (narrative + Canvas games); honest framing = team coursework, partial. Human taste call — default drop if "Other" gets crowded. |
| 15 | **Airline Booking System** (C++ OOP) | Single `main.cpp` + CMake + report docx. | foundational-cs | **drop** (archive locally). |
| 16 | **exam-prep** (`~/exam-prep`) | CONFIRMED out of scope: personal Obsidian-vault + Claude Code exam-revision system (quickstart read) — study workflow, not engineering work product. | other | **drop** (out of scope; not portfolio material). |
| 17 | **p1-reliability-lab** (GitHub-only, private; no local folder) | Deep-read via gh: **MySQL CDC → Flink → Iceberg reliability lab** — single-node Docker Compose (MySQL, Flink JM/TM, MinIO, Iceberg JDBC catalog; StarRocks reserved), pinned toolchain, deterministic source generator, Makefile-driven ops, incident RUNBOOK with induced failures (e.g. Flink task crash), `showcase/{logs,media,results}`. Gated claims doc: **verified exactly-once reconciliation across 5 failure classes** with auditable JSON (`eo_reconciliation.json`, run 20260527T151754Z). 6 commits, all 2026-05-27. | data-engineering | **feature (likely upgrade-then-feature)**: flagship DE candidate — evidence-first design matches this pipeline's integrity bar. Deployable slice = static dashboard over exported JSON (laptop-friendly). Heavy stack runs are [NEEDS-HUMAN-VERIFY] on 16 GB if re-run needed. |

## GitHub reconciliation (COMPLETE — verified via gh, 2026-07-09)

Account `LucisZhang` has exactly 7 repos (list below is exhaustive; none archived, none marked fork on GitHub).

| Repo | Vis. | Last push | Local match | Notes |
|---|---|---|---|---|
| `career-ops-private` | private | 2026-05-31 | `~/career-ops` (+worktree +2 copies) | 32 MB; Python/JS/Go. GitHub says `isFork:false`, but local remote `upstream=santifer/career-ops`. ✅ Own-work boundary RESOLVED (row 3): OSS base by Santiago, own work = Workday subsystem (14 commits). Only the GATE 2a framing decision remains. |
| `privacy-preflight-for-mac` | private | 2026-05-30 | `~/Privacy Preflight for Mac` | Python+Swift; has README + AGENTS. Desc: "Local-first macOS privacy redaction app". |
| `p1-reliability-lab` | private | 2026-05-27 | **none of the 19 spec folders** | 🆕 Original MySQL CDC → Flink → Iceberg "Reliability Lab" (Python/Java/Flink, Makefile, RUNBOOK.md, dashboard/, harness/, infra/). Strong **data-engineering** candidate; ✅ deep-read DONE — full detail card at row 17 (flagship DE, gated auditable claims). |
| `ex-solver` | private | 2026-05-18 | `~/ex-solver` | Python only. ⚠️ Local git has June commits (phases 9–15) not pushed → local ahead of remote. |
| `Voice-in-Security` | public | 2026-04-11 | UM InfoSec project folder | Has README; repo description empty. |
| `Risk-Control-Portfolio` | public | 2026-03-14 | "Self-done" #7 (docs only) | Streamlit-style `app.py` + `lr_model.pkl`/`xgb_model.pkl`. **No README**, no description. |
| `my_viewer` | private | 2025-04-16 | none (intentionally) | ⚠️ = **LibreTV clone** ("本项目基于 github.com/bestK/tv") — not original work. NEVER feature; archive/keep-private candidate (human decides, Phase 4). |
| `LucisZhang/LucisZhang` (profile) | — | — | n/a | **Does not exist** — no profile README anywhere. |

### Online artifacts (reachability checked 2026-07-09, read-only)

- **HF Space `Luciss007/Risk-Control-Portfolio`**: ✅ exists, public, Docker SDK, last modified 2026-03-17, runtime `SLEEPING` (normal free-tier; wakes on visit). Reachable ≠ verified: the claimed metrics (285K txns, 1:578, 0.96 ROC-AUC) are **still `[NEEDS-HUMAN-VERIFY]`** — remaining work: open the Space / run repo code and match numbers.
- **Tableau Public** profile `lucis.zhang` and viz `Ecommerce_RFM_and_Funnel_Analysis/Dashboard1`: ✅ both HTTP 200. Metrics (437K logs, 77.6% drop-off, 30K VIP@$2,559) **still `[NEEDS-HUMAN-VERIFY]`** — remaining work: visually confirm dashboard figures match the resume claims.

## GitHub cleanup needs (input for Phase 4 — proposals only, no action taken)

1. **No profile README** — create `LucisZhang/LucisZhang` pointing to the portfolio site (Phase 4 auto-draft).
2. **`Risk-Control-Portfolio` (public) has no README and no description** — weakest public-facing repo; needs strong README (it's a portfolio-named repo recruiters can already see).
3. **Empty descriptions** on `ex-solver`, `Voice-in-Security`, `Risk-Control-Portfolio`, `p1-reliability-lab`, `my_viewer`.
4. **No pinned repos strategy yet** — only 2 public repos exist; pinning plan depends on GATE 2a shortlist + which private repos go public (human gate).
5. **`my_viewer`** — LibreTV clone; propose keep-private or archive (destructive-ish → GATE 2d, human approves).
6. **`ex-solver` local ahead of remote** (June commits unpushed) — sync before featuring (non-destructive push, but note it).

## Phase 0 closure

All inventory TODOs are done (gh scan; deep reads incl. p1-reliability-lab; artifact
reachability; NLP/release_guardian/exam-prep skims). Items that remain are **not
inventory gaps** — they are verification or human decisions:

- `[NEEDS-HUMAN-VERIFY]` metrics: rows 6 and 7 (Tableau dashboard figures; HF Space / repo numbers).
- Human decisions at GATE 2a: ex-solver featuring, career-ops framing, 记忆的回响3 taste call, GitHub cleanup approvals (Phase 4).

## ⭐ Suggested top 5 v1 candidates (for GATE 2a)

| Rank | Project | Track | Why |
|---|---|---|---|
| 1 | **release_guardian** | ai-app | Strongest artifact in the portfolio: production-shaped multi-service agent (LangGraph + Go + Java + Next.js) with deterministic CI-gated evals (132 runs, all thresholds passed), OTel traces, injection defense. Maps 1:1 onto the site's TraceViewer/eval differentiators. Feature-as-is; only needs a repo + README. |
| 2 | **p1-reliability-lab** | data-engineering | Flagship DE proof: CDC→Flink→Iceberg with induced-failure RUNBOOK and gated, auditable claims (verified exactly-once reconciliation across 5 failure classes, JSON evidence). Rare correctness-engineering signal; deployable slice (static dashboard over exported JSON) fits PipelineGraph + telemetry perfectly. |
| 3 | **RAG Quality Lab** | ai-app | RAG *evaluation* platform (not another chatbot): A/B 0.809→0.944 (+16.7%) across 5 RAGAS metrics from saved artifacts, 498K-passage scale bench, fully local. Complements #1 (evals) without duplicating it (retrieval focus). Upgrade: init git, verify re-runnability, publish repo. |
| 4 | **Privacy Preflight for Mac** | ai-app (product) | Real personal product with privacy engineering: local-first SwiftUI + FastAPI redaction (text/image/destructive PDF with extraction validation), Chinese-language detectors, red-line tests. Shows product judgment + Swift range beyond Python. Upgrade: packaging/CI + demo GIF. |
| 5 | **E-commerce RFM & funnel** + **Credit-risk/fraud** (pair) | analytics | The analytics track needs coverage; these are the only two with live public artifacts (Tableau dashboard; HF Space + public repo). Pair them as the analytics tandem — feature after `[NEEDS-HUMAN-VERIFY]` metrics are confirmed; credit-risk repo needs a README regardless. |

Rationale for the cut: #1–#4 are all personal (non-coursework), runnable, evidence-backed,
and each proves a *different* competence (agent orchestration / data correctness / eval
discipline / product). The analytics pair (#5) closes the third track with real public
artifacts. Everything else is drop/archive or "Other / Selected Work" (Voice in Security
strongest there; 记忆的回响3 optional for personality).

## GATE 2a — decisions requested from the human

1. Approve/adjust the top-5 shortlist and per-project recommendations above (feature / upgrade / merge / drop per row).
2. Track assignments + priority order (suggested: 1→5 as ranked).
3. ex-solver: keep private (default) or reframe-and-feature?
4. career-ops: archive-only (default) or honest "OSS extension" case study?
5. Voice in Security / 记忆的回响3: include in "Other / Selected Work"?
6. Verify the row 6/7 metrics (open Tableau + HF Space and confirm the numbers) or tell me to plan verification via repo code in Phase 2.
