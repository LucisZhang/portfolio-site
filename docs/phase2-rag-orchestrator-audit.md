# Phase 2 RAG Track A/B — Orchestrator audit (Claude/Fable5, 2026-07-11)

Context: the human asked Fable5 (as primary orchestrator) to re-audit the RAG handling done so far
(A1, A2, A3-partial, B0) without assuming the prior decisions were correct, and to decide keep /
revise / redo, fixing forward with new commits only. This document records the verdicts, the
evidence used, one revised disposition (A3), and the exact gate questions now pending.

## Audit scope and its limits (read this first)

This Claude session is sandboxed to `/Users/hsiangkuochang/portfolio-site` only. Access to
`/Users/hsiangkuochang/rag-quality-lab-portfolio` (the Track A working copy) and to
WebSearch/WebFetch was not grantable in this non-interactive session. Therefore:

- **Could audit:** all records in STATE.md and docs/, the GATE 2b plan, the B0 comparison, this
  repo's git history, GitHub state via the allowlisted `gh` CLI (including one live fetch of the
  official Exa MCP README through the GitHub API).
- **Could NOT audit at file level this session:** the contents of the RAG working copy
  (A1 exclusion list on disk, A2 lockfile, `scripts/verify_a3.py`, `evidence/verified-2026-07/`).
  A file-level spot-check is queued for the next session that has directory access (see §Gates).
  No workaround was used to bypass the sandbox; the source folder `~/rag-quality-lab` was not touched.

## Verdicts

### A1 — clean working copy: KEEP
The recorded procedure is what I would have specified: rsync copy excluding venv/caches/Chroma
stores/`Code/` duplicate/generated outputs/191 MB KB; secret-pattern and ≥100 MB scans before
first commit; git init on `main`; source folder untouched; 2.4 MB result. Internally consistent
across STATE.md, A1 notes reference, and the RAG repo commit hashes recorded (`20fc53d`,
`78d8148`). Nothing to redo. Residual item: 5-minute file-level spot-check (exclusions actually
absent, no large blobs in history) next session with access.

### A2 — environment pin + smoke test: KEEP, one labeled caveat
Python 3.11 pin, lockfile, documented install paths, headless Streamlit smoke with HTTP 200 —
sound baseline. Caveat to carry forward honestly: `requirements-lock-py311.txt` was generated
**from the previously working venv**, not proven by a from-scratch install. A6's CI (fresh
`pip install` in a clean runner) will be the real test; until then A2 counts as "environment
recorded", not "fresh install verified". No redo needed — A6 covers it structurally.

### A3 — verification run: KEEP artifacts, REVISE disposition (decision made below)
What Codex got right: deterministic checks are genuinely done (KB/eval-set counts, 191 MB corpus
absent by design, saved A/B metrics re-parsed 0.8093 → 0.9438, regression re-parsed 4/0/8, Ollama
models present), and the failed fresh judged run was honestly reported as NOT complete.
What was wrong: treating the Mac-local `gemma4:e4b` judge as the path of record and leaving A3
in limbo blocking A4. A 1-question smoke already showed the local fallback judge stalling >6 min;
a 12-question × 2-pipeline A/B plus a 12-pair regression re-judge on this path is not a sane use
of an M4/16 GB laptop, and repeating the attempt would be forcing a known-bad configuration.

**Orchestrator decision (no new approval needed, no spend):**
1. A3 is re-scoped as **"A3-lite: deterministic re-verification — COMPLETE"**. Its artifacts
   (`scripts/verify_a3.py`, `evidence/verified-2026-07/`, RAG repo commit `63073b6`) stand.
2. The **fresh LLM-judged 12-question A/B + V1→V2 regression re-run moves to the workstation
   path**, folded into Track C0 intake as the first workstation job — it doubles as the
   validation that the workstation environment reproduces the Mac baseline before anything scales.
   Track C is already gated at GATE 2c, so this adds no new approval surface and costs nothing.
3. Claims discipline consequence, binding for A5/README and Phase 3: every LLM-judged metric is
   labeled **"saved run 2026-04, deterministically re-parsed 2026-07; fresh judged re-verification
   pending (workstation)"**. Deterministic facts (counts, file hashes, latency timings) may be
   stated as re-verified.
4. An optional accelerator exists but is **not required and not default**: a capped API-judge
   re-run on the Mac. It costs real money → recorded as gate question Q4 below, default NO.
5. **A4 is unblocked** by this decision (its precondition was "saved metrics labeled + fresh
   re-verification marked pending", both now satisfied) — execution still needs session access
   to the working copy (Q3).

### B0 — search-MCP comparison: KEEP, corroborated today on the load-bearing claim
The report's structure and recommendation (Exa first, Tavily backup, Brave raw-search fallback,
Perplexity reserved for synthesis) are sound for this project's discovery-heavy research.
Live re-verification done this session (2026-07-11), within allowlisted tooling:

- Official `exa-labs/exa-mcp-server` README fetched via GitHub API: hosted remote MCP
  `https://mcp.exa.ai/mcp`; Claude Code setup is a keyless one-liner
  (`claude mcp add --transport http exa https://mcp.exa.ai/mcp`); API key optional (npm-local
  mode, Exa Agent tools, explicit `?exaApiKey=` param). This corroborates B0's "no API key
  required for remote setup" claim from the official source of truth.
- NOT re-verified this session (web fetch unavailable): the pricing-page numbers (20K free
  requests/month etc.). B0 already requires re-checking these at setup time; that stands.
- Unchanged caveat: keyless usage limits/quotas are not stated in the README; observe during the
  approved 5-query pilot.

An addendum recording this was appended to docs/phase2-search-mcp-comparison.md.

### Cross-checks that all passed
- portfolio-site clean at `9c43022`, history matches STATE.md's account of A1→A3/B0.
- `gh repo list LucisZhang`: no `rag-quality-lab` repo on GitHub — consistent with A7 not yet
  claimed. p1-reliability-lab PUBLIC as recorded.
- No STATE.md claim found that overstates A3 (the "must not be claimed" guard is present). No
  fabrication found in any audited record.

## Why Track B (B1–B4) was NOT executed this session
B1's definition is **live** discovery with per-source license reading; the GATE 2b plan itself
says naming finalists without live verification is fabrication. In this session both the built-in
web tools (permission not grantable non-interactively) and the Exa MCP (human approval still
pending) were unavailable, so a memo could only have been written from training data (cutoff
2026-01). I declined to do that. B1–B4 start as soon as either Q1 or Q2 below is granted.

One prior Codex framing is revised, though: B1 is **not hard-blocked on Exa specifically**.
If the human prefers, granting built-in WebSearch/WebFetch (Q2) is enough to run B1–B4 at
reduced discovery depth, with Exa as an optional deepening pass later. Recommended: approve Q1
(Exa, still first choice); Q2 is the fallback; either unblocks Track B.

## Gate questions now pending (exact wording, answer by number)

**Q1 — Exa MCP setup (small approval; recommended YES):**
"Approve configuring Exa MCP for Claude Code research only, via the official hosted endpoint:
`claude mcp add --transport http exa https://mcp.exa.ai/mcp` (keyless per the official README,
re-verified 2026-07-11). No paid usage, no API key, no secrets in any repo; abort if setup asks
for billing or a key. On approval: 5-query pilot, record observed quality/limits, then B1."

**Q2 — built-in web tools fallback (only needed if Q1 declined, or additionally):**
"Grant this Claude Code project WebSearch + WebFetch permission (add `\"WebSearch\"` and
`\"WebFetch\"` to `permissions.allow` in `.claude/settings.json`, or approve the prompts in an
interactive session) so Track B can run with built-in tools at reduced discovery depth."
Fable does not self-edit the permission config; this is the human's control surface.

**Q3 — session directory access for A4–A7 (needed to continue Track A):**
"Start the next Claude session with the RAG working copy reachable, e.g.
`claude --add-dir /Users/hsiangkuochang/rag-quality-lab-portfolio` from portfolio-site (or add
the directory when prompted). Then A4 (data manifest + DATA.md skeleton), A5 (README), A6
(tests + CI), A7 (private push — already approved in the GATE 2b bundle) proceed in order."

**Q4 — optional paid judge accelerator (default NO; skip unless you want fresh judged numbers
before the workstation):**
"Approve a capped API-judge re-run of the 12-question A/B + V1→V2 regression on the Mac using a
single pinned Claude model, with a hard spend cap you name (a single-digit USD cap should be
ample for ~36 judged items; exact model + current per-token pricing verified live and projected
against the eval set before the first call; run halts at the cap). If declined, the fresh judged
re-run simply happens at Track C0 workstation intake."

Also still open from before (unchanged): DATA.md exact source/license text for the current
498K KB + 500-question set (GATE 2b answer 3) — needed before real samples publish; workstation
specs (needed at GATE 2c); GATE 2c itself after the B4 memo.

## Addendum — A1 file-level spot-check executed (2026-07-11, session with Q3 access)

Human answers received 2026-07-11: **Q1 APPROVED** (Exa MCP configured via official hosted
endpoint, keyless), **Q2 NOT approved** (no settings.json edit, unused unless Q1 fails and human
later approves), **Q3 APPROVED** (`--add-dir /Users/hsiangkuochang/rag-quality-lab-portfolio`),
**Q4 NOT approved** (fresh judged re-run stays at Track C0 workstation intake).

The A1 residual spot-check queued in the verdict above was executed with direct file access.
**Result: PASS on all items.**

- Working tree clean at `63073b6`; the 4-commit history matches STATE.md exactly
  (`20fc53d` → `78d8148` → `ae01030` → `63073b6`).
- Exclusions absent on disk: no `venv/`/`.venv/`, `node_modules`, `Code/`, `outputs/`,
  `benchmark_artifacts/`, `chroma_db*`, `kb_subsets`; `data/large_knowledge_base.json` absent.
  Only gitignored runtime residue exists (`src/__pycache__/`, the A3 fresh-attempt Chroma stores
  under `evidence/verified-2026-07/fresh-*/runtime/`, empty `results/regression_smoke/`) — none
  tracked (verified via `git ls-files`).
- No large blobs in history: the entire `.git` directory is **1.5 MB** (working copy 4.1 MB
  total), so a ≥100 MB blob is impossible anywhere in history.
- Tracked set is 55 files and matches `docs/A1_COPY_NOTES.md`'s inclusion list exactly
  (code, small `data/` files ≤73 KB each, saved `results/`, docs, A3-lite evidence).
- Secret scan on the working copy: no token-shaped strings (`sk-`, `ghp_`, `github_pat_`,
  `hf_`, `AKIA…`, `PRIVATE KEY`) anywhere; no `api_key`/`password`/`authorization` keyword in
  any code file.
- A3-lite artifacts present as recorded: `scripts/verify_a3.py`,
  `evidence/verified-2026-07/{README.md, deterministic-checks.json, fresh-20260710T093425Z/ATTEMPT.md}`.
- The source folder `/Users/hsiangkuochang/rag-quality-lab` is outside this session's allowed
  directories (blocked by the sandbox), so it cannot be touched from here at all.

A1 is now fully closed: procedure KEEP (prior session) + file-level verification PASS (this session).

## Resume order once answers arrive
1. With Q3: A4 → A5 → A6 → A7 (each with STATE.md update + commit; A1 file-level spot-check first).
2. With Q1 (or Q2): B1 → B2 → B3 → B4 memo → STOP at GATE 2c.
3. A-track and B-track can interleave; nothing else is pending on this Mac. Track C and the p1
   remote-Linux run remain workstation items.
