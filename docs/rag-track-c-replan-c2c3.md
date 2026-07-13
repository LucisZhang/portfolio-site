# RAG Quality Lab — Track C re-plan after the Ollama driver blocker (C2/C3 plan)

Date: 2026-07-12 · Author: Claude/Fable5 · Status: **DRAFT — STOPPED at GATE C2-replan**
Supersedes the C2 next-step sketch in `docs/rag-track-c-remote-guide.md` §Part 2 tail
(the guide itself remains the authoritative record of what C0/C1 ran and why).

---

## 0. Ground truth this plan is built on (no pretending)

From the imported workstation evidence (`rag-quality-lab-portfolio` commit `47c2403`,
`evidence/workstation-c0c1-20260711/`), the 2026-07-11 C0/C1 run is **PARTIAL**:

**Proven on the workstation:**
- Steps 1–5 PASS: env bootstrap, GPU selection, public-repo clone, torch-protected dep
  install, CI-equivalent (ruff clean, 44 tests, `verify_data.py`, deterministic A3).
- EnterpriseRAG-Bench S1 acquisition PASS with checksums: confluence 5,189 files,
  jira 6,120 files, questions 500, **S1-answerable pool 130**.
- PyTorch/HF CUDA path PASS: `BAAI/bge-base-en-v1.5` embedded 1,000 docs at
  **15.73 s/1K** on an RTX A6000, peak CUDA memory 1.011 GB. (Explicitly **not**
  comparable to the Mac 13.82 s/1K `nomic-embed-text`/Ollama number — different model,
  different runtime. It proves capability, not speedup.)

**Blocked / not done:**
- Ollama on the workstation: current Ollama requires a newer NVIDIA driver than the host's
  **driver 470**; it fell back to CPU with 0 B VRAM, the server did not stay reachable on
  11434, and it wrote accidental key files into the shared home (`/home/luban/.ollama/`),
  which were quarantined. **The fresh Ollama-judged A3 re-run did NOT happen.**
- No API keys, no paid calls, no 500K corpus, no pushes from the workstation. Large
  MS MARCO KB regeneration skipped (MANIFEST sha256 still null).

**Standing consequence:** every LLM-judged number in the repo still carries the label
"saved run 2026-04, deterministically re-parsed 2026-07, fresh judged re-verification
pending" — and the *specific* pending plan (same `gemma4:e4b` judge via Ollama on the
workstation) is no longer executable as designed. That is what this re-plan fixes.

---

## 1. Decision 1 — runtime for the workstation judged/model lane

### Options considered

**A. Pin an older Ollama compatible with driver 470.** Driver 470 is CUDA-11-class
(torch 2.7.1+cu118 works via CUDA 11 minor-version compatibility — proven). Current Ollama
ships CUDA-12-class runners, hence the failure. An Ollama old enough to still carry
CUDA-11 GPU runners would need live version archaeology, and carries three risks:
(a) a build that old plausibly predates `gemma4:e4b` model/architecture support — the one
thing we need it for; (b) Ollama writes its identity keypair to `~/.ollama` regardless of
`OLLAMA_MODELS` (that is exactly the shared-home incident we just quarantined; only a
`HOME` override works around it — a workaround stacked on a workaround); (c) even on
success, an old GGUF runtime is not the saved Mac baseline runtime, so "same judge" was
never going to be bit-faithful anyway. **Verdict: reject as primary; do not retry without
explicit human request.**

**B. Move the workstation lane to the PyTorch/HF stack.** This is the recommendation:
- **Proven on this exact box** — the one smoke that passed end-to-end on GPU is the HF one
  (torch 2.7.1+cu118, `sentence-transformers`/`transformers` path, caches already routed
  to `$WORK`). No new driver dependency: HF inherits torch's working CUDA 11.8.
- **Small code seam, not a rewrite** — verified in the repo this session: the entire model
  stack is behind `get_llm()` / `get_embeddings()` in `src/utils.py`; `RAGEvaluator`
  already accepts injected `llm`/`embeddings`; `langchain-huggingface==0.2.0` is already
  in `requirements-lock-py311.txt`. The work is a backend switch plus tests, not new
  architecture. (One extra touchpoint: `scripts/verify_a3.py --mode fresh` calls
  `check_ollama_models()` — the fresh runner needs the same backend awareness.)
- **Production-realistic and portfolio-stronger** — serving evaluation workloads through
  transformers/sentence-transformers on a shared CUDA box is closer to how teams actually
  run this than a desktop-oriented Ollama install; and "hit a real driver-compat wall,
  diagnosed it, quarantined the fallout, re-platformed the lane" is itself a credible
  case-study beat.
- **No new hygiene risk** — no daemon, no port etiquette, no home-directory key writes.

**C. Require a newer-driver runtime.** The driver is host-level on a shared company box;
upgrading it is an IT/root action outside our control, and a container cannot bring its
own driver. **Verdict: do not block on it.** Optionally the human may *ask* IT whether a
newer-driver host exists; if one appears later, Option A's simplicity returns for free —
but nothing in this plan waits for that.

### What this means for the "fresh judged re-verification" claim — re-scoped honestly

Exact same-judge replication of the 2026-04 `gemma4:e4b`/Ollama baseline is **CLOSED as
blocked on this hardware** (Mac too slow — already decided; workstation driver — now
proven). The judged lane becomes **Lane L2: HF-runtime local judge**:

- Preferred judge: the **same model family** (`gemma4` e4b-class) via HF weights, full
  precision, **if** the mandatory HF card check at C3 intake passes (license, VRAM);
  otherwise select from the Track B shortlist with the same card discipline.
- The question Lane L2 answers changes from "do the scores replicate?" to **"do the
  findings replicate under an independent judge runtime?"** — does Pipeline B still beat
  A across metrics, and does V1→V2 still degrade B? If the findings replicate, that is
  *stronger* evidence than same-runtime score replication; if they don't, we publish the
  contradiction (standing reporting discipline).
- Lane L2 scores are **never blended** into the 2026-04 columns. Every table gets its own
  label: "fresh judged run, workstation 2026-07, judge <model> via transformers".
- README/DATA wording changes from "fresh judged re-verification pending (workstation)"
  to name the two lanes explicitly and record the Ollama-path closure with the driver
  reason. No number changes — only labels.

---

## 2. Decision 2 — C2/C3 implementation path for EnterpriseRAG-Bench S1

Two stages, matching where each kind of work is cheap and safe: **C2 = Mac, code + tests,
zero GPU, zero spend** (the adapter layer is deterministic and CI-testable); **C3 =
workstation, models + data at S1 scale** via a new Codex CLI handoff.

### C2 (Mac, this working copy, after GATE approval) — "make S1 a first-class dataset"

- **C2-1. Mirror S1 locally + cross-machine integrity check.** Download the same four
  slices + `questions.jsonl` + `extra_questions.jsonl` (~41 MB, MIT — license verified
  2026-07-11 on GitHub LICENSE + HF card) to the Mac; verify sha256 against the
  workstation's `SHA256SUMS.workstation-20260711.txt` already in evidence. Two machines,
  independent downloads, matching hashes — record it.
- **C2-2. Corpus adapter.** `scripts/adapters/enterpriserag_s1_to_kb.py`: extracted S1
  files → the lab's KB JSON schema (`id`/`title`/`content`, the format
  `load_knowledge_base()` already consumes). Deterministic ordering; counts + sha256
  recorded in `data/MANIFEST.json` (new section; the S1-derived KB JSON itself follows
  the existing out-of-git policy for generated corpora — regenerate-from-source, manifest
  carries integrity).
- **C2-3. Eval-set adapter.** `questions.jsonl` → the lab's eval schema (`question`,
  `ground_truth`, `relevant_doc_ids`) for the **130-question S1-answerable pool**. Derive
  every count from the file itself, never from the HF card or GitHub quickstart (the two
  disagree on per-category counts — known finding). Preserve `question_type` metadata for
  per-category reporting.
- **C2-4. Backend seam.** Config/env-selected model factories in `src/utils.py`
  (e.g. `RAG_MODEL_BACKEND=ollama|hf`), Ollama remaining the default so the existing Mac
  story and all saved evidence semantics are untouched; make `verify_a3.py --mode fresh`
  backend-aware. Unit tests with scripted fakes for the HF branch; CI stays model-free
  and green (same stubbing pattern as `tests/dependency_stubs.py`).
- **C2-5. Deterministic retrieval evaluation path.** The highest-value, lowest-risk S1
  result needs **no judge at all**: retrieval precision/recall/hit against
  `relevant_doc_ids` for the 130-question pool, Pipeline A vs Pipeline B. Wire the
  existing retrieval diagnostics into an S1 runner so C3 can produce a judged-free A/B
  retrieval table on day one. (Judged answer-quality on S1 comes later, Lane L2/Lane A.)
- **C2-6. Docs.** DATA.md gains the EnterpriseRAG-Bench section (MIT, synthetic "Redwood
  Inference" corpus, provenance + checksums); README evidence-status labels updated per
  §1; limitations updated (Ollama workstation path closed, why).

C2 exit criteria: CI green with the new tests; adapters run end-to-end on the Mac against
real S1 data; adapter output counts match the workstation evidence (5,189 / 6,120 / 500 /
130). Then commit + push to the public repo (normal fast-forward push, same as every
Track A push).

### C3 (workstation, new Codex CLI handoff) — "first S1 results + Lane L2"

Executed via a fresh handoff doc (`docs/rag-track-c3-workstation-handoff.md`, written
**after** C2 merges, because its exact commands must reference the C2 scripts). Same
contract as the C0/C1 handoff: human does sign-in only, Codex CLI executes, G1–G8 hard
stops carry over verbatim, evidence returns by tarball, nothing pushed from the box.
Planned steps, in order:

- **C3-1. Intake + mandatory HF card checks.** Re-bootstrap env; `git pull --ff-only` the
  public repo (now including C2); for each model to download — embeddings **BGE-M3**
  (Track B default; dense side first, sparse/hybrid later), the Lane L2 judge, and the
  generator — open the HF card and verify license + size/VRAM **before** download. Any
  doubt → stop (existing rule). A6000 is Ampere: no FP8; transformers/GGUF-free HF path.
- **C3-2. Index S1 through both pipelines** with HF embeddings on GPU; record measured
  throughput (this replaces the apples-to-oranges smoke number with a real, labeled
  workstation baseline for the chosen embedding model).
- **C3-3. Deterministic S1 retrieval A/B** over the 130-question pool via the C2-5 runner
  — first EnterpriseRAG-Bench result, zero judge, zero spend.
- **C3-4. Lane L2 judged runs:** (a) the legacy 12-question A/B + V1→V2 regression under
  the HF judge — the findings-replication test from §1; (b) if time permits, a judged
  subset of S1 answer quality (e.g. 25–50 questions) as the first judged S1 signal.
- **C3-5. Evidence tarball** (same Part 5 pattern), Mac imports + commits with full labels.

Scale ladder unchanged: S1 now → **S2 (+google_drive, ~36K docs)** next session, already
approved in principle → **S3 (full 500K) remains STOPPED** pending explicit approval.
Lane A (paid API judge) remains STOPPED; if later approved, the first call is still the
12–50-question pilot (~USD 0.5–3 against the 20–30 cap), sized from Lane L2 transcripts.

---

## 3. Exact repo changes (what happens when)

**portfolio-site — done this session (safe, docs-only):**
- This document (`docs/rag-track-c-replan-c2c3.md`).
- `STATE.md` updated: Track C re-plan drafted, gate recorded, next actions set.
- Committed per RUNBOOK checkpoint discipline.

**rag-quality-lab-portfolio — PROPOSED ONLY, executed after GATE C2-replan approval:**
- New: `scripts/adapters/enterpriserag_s1_to_kb.py`, eval-set adapter, S1 retrieval
  runner (C2-2/3/5), tests for each.
- Modified: `src/utils.py` (backend-selected factories), `scripts/verify_a3.py`
  (backend-aware fresh mode), `data/MANIFEST.json` (S1 section), `DATA.md`, `README.md`
  (§1 label changes + limitations), `.github/workflows/ci.yml` only if new test deps
  require it (expected: none — stubs suffice).
- Nothing history-rewriting, nothing deleted, normal commits + fast-forward push to the
  public repo after CI is green locally.

**Not created yet by design:** `docs/rag-track-c3-workstation-handoff.md` — written after
C2 merges so its command blocks reference real script paths and expected outputs.

---

## 4. Blocked until human approval (unchanged unless listed)

1. **Any API key entry or paid judge call** (Lane A) — first run, when approved, is the
   12–50-question pilot ~USD 0.5–3 under the USD 20–30 cap.
2. **S3 full 500K corpus** (`all_documents.zip`, 1.26 GB) — explicitly stopped.
3. **Any push/commit/upload from the workstation** — evidence returns by tarball only.
4. **Any public release beyond the existing clean code repo** — includes publishing new
   evidence, screenshots, deployment, and the portfolio site itself (Phase 3+ gates).
5. **Retrying any Ollama install on the workstation** — recommend formally dropping;
   requires explicit human request to reopen (Option A risks in §1).
6. **Asking company IT about a newer-driver host** — optional, human's own call, nothing
   blocks on it.
7. **C2 execution itself** — code changes to the RAG repo start only after GATE C2-replan
   below is answered.

Not blocked (already covered by standing approvals): S2 google_drive expansion after S1
is stable; HF model downloads at C3 gated by the card-check discipline, not by a new
human gate — except the judge model choice, which is surfaced in the gate questions
because it changes the claims story.

---

## 5. Case-study claims discipline (what the portfolio may and may not say)

**May say (each with its evidence label):**
- The lab's regression finding and A/B lift, labeled exactly as the README already does:
  saved run 2026-04, deterministically re-parsed 2026-07, judged lanes pending.
- The public repo reproduces on an independent machine: clean clone, 44 tests, data
  verifiers, deterministic A3 — CI-equivalent green on the workstation (2026-07-11).
- EnterpriseRAG-Bench S1 acquired with checksums and counts matching the dataset card
  (5,189 confluence / 6,120 jira / 500 questions / 130 S1-answerable), MIT license
  verified on both GitHub LICENSE and HF card.
- The workstation runs GPU-backed HF embedding workloads (bge-base-en-v1.5, 15.73 s/1K,
  1.011 GB peak, RTX A6000) — stated as a capability proof.
- The blocker itself, told straight: current Ollama needs a newer driver than the host's
  470; the failure was diagnosed, accidental shared-home key files were quarantined, and
  the judged lane was re-platformed to PyTorch/HF. Infrastructure judgment is a feature
  of the story, not an embarrassment to hide.

**Must NOT say (until the evidence exists):**
- That a fresh judged re-run happened, or that judged metrics were "re-verified" — they
  were re-parsed, not re-judged; the wording distinction is binding.
- Any speedup comparison between 15.73 s/1K (bge-base/HF/A6000) and 13.82 s/1K
  (nomic-embed-text/Ollama/Mac) — different models, different runtimes; not a comparison.
- Any EnterpriseRAG-Bench quality/retrieval result — none exists yet (counts only).
- Anything at 500K scale, anything implying Ollama ran on the workstation, anything
  blending Lane L2 (or future Lane A) scores into the 2026-04 tables.

---

## 6. GATE C2-replan — questions for the human (answer to unblock C2)

1. **Runtime decision (§1):** approve retiring the workstation Ollama path and adopting
   the PyTorch/HF stack as the workstation lane (Lane L2)? *(Recommended: yes.)*
2. **C2 scope (§2):** approve C2-1…C2-6 as Mac-side code work in the RAG working copy,
   with normal commit + fast-forward push to the public repo once CI is green?
   *(Recommended: yes, as specified.)*
3. **Lane L2 judge selection procedure:** same-family `gemma4` e4b-class HF weights if
   the card check passes, else Track B shortlist with mandatory card verification —
   approve the procedure (final pick still happens at C3 intake, on-card)?
   *(Recommended: yes.)*
4. **Old-Ollama fallback:** drop entirely (recommended), or keep as a documented
   last-resort with no execution?

After the gate: C2 executes on the Mac (needs a session with
`claude --add-dir /Users/hsiangkuochang/rag-quality-lab-portfolio`), then the C3 handoff
doc is written, then the human runs the workstation session. STOPPED here — no RAG-repo
code changes and no remote execution have been started.
