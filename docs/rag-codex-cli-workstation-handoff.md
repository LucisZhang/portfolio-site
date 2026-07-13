# RAG Quality Lab — Track C C0/C1: Codex CLI handoff (company workstation)

Date: 2026-07-11 · Author: Claude/Fable5 · For: human operator + Codex CLI on the workstation
Companion to: `docs/rag-track-c-remote-guide.md` (the authoritative command/expectation
reference — this doc does not change WHAT runs, only WHO runs it).

**Execution model:** the human performs only the unavoidable manual steps in Part 1 (minutes,
not hours), then hands off to Codex CLI on the workstation with the Part 3 prompt. Codex clones
the clean public repo itself and runs C0 (workstation intake) + C1 (S1 dataset acquisition +
smoke) end-to-end, stopping only at the Part 4 gates. Scope is unchanged from the remote guide:
**S1 = confluence+jira subset only; zero spend; no remote pushes; full 500K corpus STOPPED.**

---

## Part 1 — Human manual steps (minimal; do in order; ~5 minutes plus one download wait)

Every step below is human-only for the stated reason. Everything not listed here is Codex work.

**H1. Log into the workstation and open a terminal (JupyterLab).**
*Why human:* company VPN/JupyterLab authentication and 2FA are your credentials; no agent
exists on the box until you are in.

**H2. Install/verify Codex CLI and sign in — with its config OUT of the shared home.**
Shared user `luban` means `~/.codex` is shared config; a sign-in credential must not live
there. Route Codex's home to the NFS work area:

```bash
# HUMAN runs:
export WORK=/nfs/dataset-ofs-algo/zhangxiangguo
mkdir -p $WORK/tools/codex-home $WORK/handoff $WORK/repos $WORK/logs
export CODEX_HOME=$WORK/tools/codex-home
codex --version   # install first if missing, per your Codex CLI distribution
codex login       # use your account's headless/device flow
```

If your Codex CLI version ignores `CODEX_HOME`, sign in anyway and remember H7 removes the
credential afterwards. Note: this sign-in is your own coding-agent account, done by you; it is
NOT the STOP-gated LLM-judge API key — Codex itself never enters any API key (Part 4, G1).
*Why human:* an agent cannot bootstrap or authenticate itself, and the credential is yours.

**H3. Launch Codex CLI from the work area and paste the Part 3 prompt as the first message.**

```bash
# HUMAN runs:
cd $WORK && CODEX_HOME=$WORK/tools/codex-home codex
```

Stay reachable: Codex will ask at most a handful of times — at its own command-approval
prompts, at the one optional ASK-GATE (large-KB regeneration, STEP 8), and whenever a Part 4
gate trips.
*Why human:* supervising the gates is the point of the gates.

**H4. After Codex's final report: retrieve the evidence tarball (Part 5) and remove the Codex
credential** (`codex logout`, or delete `$WORK/tools/codex-home/auth.json`; if H2's
`CODEX_HOME` didn't take, also check and clean `~/.codex`). Leave `$WORK/data`,
`$WORK/cache`, and the conda env in place — S2/C3 sessions reuse them.
*Why human:* credential cleanup on a shared machine is your accountability, and the tarball
travels over your authenticated session.

---

## Part 2 — Materials the human prepares for Codex CLI

1. **The public repo URL**: `https://github.com/LucisZhang/rag-quality-lab.git`. Codex clones
   this itself into `$WORK/repos/rag-quality-lab`; no GitHub token is needed.
2. **The Part 3 prompt** — paste directly, or upload as `$WORK/handoff/codex-prompt.md` and
   tell Codex to read it.
3. **Nothing else.** Expected values (44 tests, 0.8093 → 0.9438, 4/0/8 regression, dataset
   counts, the 13.82 s/1K Mac baseline) are embedded in the prompt; the conda env
   `raglab-py311` already exists; no PAT or private GitHub credential is involved.

---

## Part 3 — The exact Codex CLI prompt (copy-paste as the first message)

```text
You are Codex CLI on a shared company Linux workstation (Ubuntu 22.04 container on host
ml-a6000-ser001.us01, shared user luban). Execute Track C C0/C1 of the RAG Quality Lab —
workstation intake + subset-first dataset acquisition + smoke runs — exactly as specified
below. Work one step at a time, in order; do not skip, reorder, parallelize across steps, or
improvise around failures. This prompt is self-contained; if local files or observed machine
state contradict it, STOP and report the conflict instead of choosing.

MACHINE FACTS (verified 2026-07-11; trust these over your own assumptions):
- Work area: WORK=/nfs/dataset-ofs-algo/zhangxiangguo. NEVER write to /home/luban (shared
  home) beyond what login itself does.
- Conda env already exists at $WORK/envs/raglab-py311 with torch 2.7.1+cu118 (CUDA works).
  NEVER run `conda init`. Activate only via:
    eval "$(/home/luban/miniforge3/bin/conda shell.bash hook)" && conda activate $WORK/envs/raglab-py311
  fallback: source /home/luban/miniforge3/bin/activate $WORK/envs/raglab-py311
- GPUs: 4x RTX A6000 (~44.5 GiB each), shared machine. Default CUDA_VISIBLE_DEVICES=1; after
  that export, Python sees exactly one device as cuda:0.
- `nproc` prints 1 but CPU affinity really allows CPUs 0-127; use 16 threads
  (OMP/MKL/NUMEXPR) initially.
- All caches go under $WORK (conda-pkgs, pip-cache, cache/huggingface, cache/ollama-models).
- Public repo to clone yourself: https://github.com/LucisZhang/rag-quality-lab.git into
  $WORK/repos/rag-quality-lab. No push credentials exist and none may be created.
- Terminals here can look stuck or concatenate output: run long jobs with nohup + a log file
  and poll the log; never assume a quiet job is dead without checking its PID and nvidia-smi.

HARD STOPS — if any would be violated, stop that step and report; do not work around:
G1. No API key entry and no paid API call. Never set or ask for ANTHROPIC_API_KEY,
    OPENAI_API_KEY, LLM_API_KEY or similar; never run the EnterpriseRAG-Bench official
    eval harness (metrics_based_eval) — it requires an LLM key. Everything here is zero-spend.
G2. No full 500K corpus. Never download all_documents.zip (1.26 GB). Scope is S1 =
    confluence + jira slices only. S2/S3 need a new human instruction.
G3. Nothing pushed from the workstation. No git push, no git commit in the workstation clone,
    no repo creation, no uploads to HF or anywhere. Evidence returns by tarball; the Mac
    commits/imports results.
G4. Shared-machine discipline: never kill or signal (except kill -0 on your own PIDs)
    processes you did not start; no sudo/root; no system package installs; no writes outside
    $WORK and /tmp; never run `conda init`; if port 11434 is served by a process that is not
    yours and you cannot pull models into it, STOP and report (the repo hard-codes the port).
G5. No credential storage: never write tokens/keys into files, env exports, git config, or
    shared config; never ask the human to paste a secret into this chat.
G6. Stop on uncertain access or license: if the public repo clone fails or its head is not
    0fc1433-or-newer, stop. Dataset license is already
    verified (EnterpriseRAG-Bench = MIT on both GitHub LICENSE and HF card, 2026-07-11); if
    any downloaded asset's name/size/content contradicts what this prompt expects, stop and
    report rather than substituting sources.
G7. GPU etiquette: pick the freest GPU at STEP 2; need >= ~10 GiB free. If no GPU qualifies,
    stop and report.
G8. If the same step fails twice for the same reason, stop and write it up; no destructive
    "fixes", no deleting or modifying files you did not create. Never modify tracked files in
    the repo; the only in-repo writes allowed are outputs its own scripts generate
    (evidence/verified-2026-07/..., and data/large_knowledge_base.json only if STEP 8 is
    approved).

EXECUTION RULES:
- Every shell/command block you run must FIRST do:
    source /nfs/dataset-ofs-algo/zhangxiangguo/raglab-env.sh
  (created in STEP 1), because each of your shells may start fresh.
- tee every meaningful command's output to a file under $WORK/logs/.
- Keep a journal at $WORK/logs/codex-journal.md: after each step append: step id, UTC
  timestamp, what ran, exit status, key numbers, deviations. The journal ships in the
  evidence tarball.
- Report progress to the human briefly after each step; ask questions ONLY at the ASK-GATE
  (STEP 8) or when a hard stop trips.

STEP 1 — bootstrap file + env check
  mkdir -p /nfs/dataset-ofs-algo/zhangxiangguo/{repos,data,logs,tools,cache,pip-cache,conda-pkgs}
  cat > /nfs/dataset-ofs-algo/zhangxiangguo/raglab-env.sh <<'EOF'
  # RAG Quality Lab workstation bootstrap — source this in every fresh terminal
  export WORK=/nfs/dataset-ofs-algo/zhangxiangguo
  eval "$(/home/luban/miniforge3/bin/conda shell.bash hook)" \
    && conda activate "$WORK/envs/raglab-py311" \
    || source /home/luban/miniforge3/bin/activate "$WORK/envs/raglab-py311"
  export CONDA_PKGS_DIRS=$WORK/conda-pkgs
  export PIP_CACHE_DIR=$WORK/pip-cache
  export HF_HOME=$WORK/cache/huggingface
  export OLLAMA_MODELS=$WORK/cache/ollama-models
  export OMP_NUM_THREADS=16 MKL_NUM_THREADS=16 NUMEXPR_NUM_THREADS=16
  export TOKENIZERS_PARALLELISM=false
  export CUDA_VISIBLE_DEVICES=1
  EOF
  source /nfs/dataset-ofs-algo/zhangxiangguo/raglab-env.sh
  python -c "import torch; print(torch.__version__, torch.cuda.is_available(), torch.cuda.device_count())"
  Expected: "2.7.1+cu118 True 1". Anything else: stop (G8).

STEP 2 — GPU snapshot + selection
  nvidia-smi --query-gpu=index,name,memory.used,memory.free,utilization.gpu --format=csv \
    | tee $WORK/logs/gpu-$(date +%Y%m%d-%H%M%S).csv
  If GPU 1 is not the freest (need >= ~10 GiB free), pick a freer index and update the
  CUDA_VISIBLE_DEVICES line in $WORK/raglab-env.sh (your file — sed -i is fine), then
  re-source and re-run the STEP 1 torch check. If no GPU qualifies: G7 stop.

STEP 3 — clone and verify the public repo
  cd $WORK/repos
  if [ ! -d rag-quality-lab/.git ]; then
    git clone https://github.com/LucisZhang/rag-quality-lab.git
  fi
  cd $WORK/repos/rag-quality-lab
  git fetch origin main
  git checkout main
  git pull --ff-only origin main
  git log --oneline -3
  git status --short
  Head must be 0fc1433 or newer and the tree clean. Missing/mismatched: G6 stop.

STEP 4 — Python deps with torch protection
  TRAP: requirements-lock-py311.txt pins torch==2.11.0 (Mac venv); installing it verbatim
  would clobber the verified 2.7.1+cu118. Filter torch out and dry-run first:
    cd $WORK/repos/rag-quality-lab
    pip install -r requirements-ci.txt 2>&1 | tee $WORK/logs/pip-ci.log
    grep -vE '^torch==' requirements-lock-py311.txt > /tmp/req-lock-notorch.txt
    pip install --dry-run -r /tmp/req-lock-notorch.txt 2>&1 | tee $WORK/logs/pip-dryrun.log
    grep -i torch $WORK/logs/pip-dryrun.log
  The last grep MUST print nothing torch-related; if it does, stop and report which package
  drags torch in. If clean:
    pip install -r /tmp/req-lock-notorch.txt 2>&1 | tee $WORK/logs/pip-lock.log
    python -c "import torch; print(torch.__version__, torch.cuda.is_available())"
  Must still print 2.7.1+cu118 True. Recovery if torch got clobbered anyway:
    pip install torch==2.7.1 --index-url https://download.pytorch.org/whl/cu118
  If PyPI stalls, retry that one command with -i https://mirrors.aliyun.com/pypi/simple/
  (flag only — no pip config edits, G5).

STEP 5 — CI-equivalent checks (mirrors .github/workflows/ci.yml)
    cd $WORK/repos/rag-quality-lab
    { python -m ruff check . \
      && python -m pytest \
      && python scripts/verify_data.py \
      && python scripts/ci/run_verify_a3_deterministic.py ; } 2>&1 | tee $WORK/logs/c0-ci-equiv.log
    echo "exit=${PIPESTATUS[0]}"
  Expected: ruff clean, 44 passed, verify_data exit 0, deterministic A3 wrapper exit 0
  (re-parses saved metrics: A/B 0.8093 -> 0.9438; regression 4 degraded / 0 improved /
  8 stable). Any failure = environment problem: fix within G1-G8 or stop. Do NOT proceed to
  models/data on a red STEP 5.

STEP 6 — Ollama in user space (no root, no /home/luban)
  Check for an existing server first — never kill someone else's (G4):
    curl -s --max-time 5 http://127.0.0.1:11434/api/tags || echo "NO-SERVER"
  If NO-SERVER:
    mkdir -p $WORK/tools/ollama && cd $WORK/tools/ollama
    curl -fL -o ollama-linux-amd64.tgz https://ollama.com/download/ollama-linux-amd64.tgz
    tar xzf ollama-linux-amd64.tgz
    nohup env CUDA_VISIBLE_DEVICES=$CUDA_VISIBLE_DEVICES OLLAMA_MODELS=$OLLAMA_MODELS \
      $WORK/tools/ollama/bin/ollama serve > $WORK/logs/ollama-serve.log 2>&1 &
    sleep 3 && curl -s http://127.0.0.1:11434/api/tags
  If a server already responds: ps aux | grep ollama to see whose it is; if you cannot pull
  models into it, G4 stop (the repo hard-codes 127.0.0.1:11434).
  Then pull exactly the two pinned models (src/utils.py):
    export PATH=$WORK/tools/ollama/bin:$PATH
    ollama pull gemma4:e4b 2>&1 | tee $WORK/logs/ollama-pull-llm.log
    ollama pull nomic-embed-text 2>&1 | tee $WORK/logs/ollama-pull-embed.log
    ollama list

STEP 7 — fresh LLM-judged A3 re-run (the decided A3 closure; first real GPU job)
  Fresh 12-question A/B + V1->V2 regression, judged by gemma4:e4b (same judge version as the
  saved 2026-04 Mac baseline). Zero spend.
    cd $WORK/repos/rag-quality-lab
    LOG=$WORK/logs/c0-fresh-a3-$(date +%Y%m%d-%H%M%S).log
    nohup python scripts/verify_a3.py --mode fresh --max-questions 12 > $LOG 2>&1 &
    echo $! > $WORK/logs/c0-fresh-a3.pid
  Poll every few minutes: tail -n 30 $LOG; kill -0 $(cat $WORK/logs/c0-fresh-a3.pid) to see
  if it is alive; nvidia-smi for GPU activity. Expect tens of minutes (first run also
  downloads cross-encoder/ms-marco-MiniLM-L-6-v2 into $HF_HOME). A quiet log is not a dead
  job. Output: evidence/verified-2026-07/fresh-<UTC>/ + latest-fresh-summary.json.
  REPORTING DISCIPLINE: whatever the numbers are, record them as "fresh judged re-run,
  workstation, 2026-07, judge gemma4:e4b" — never blended with the "saved run 2026-04"
  numbers. If they contradict the saved story, report the contradiction; never tune or rerun
  to make numbers match.

STEP 8 — ASK-GATE (optional): regenerate the 191 MB corpus + record sha256
  Ask the human exactly: "Optional STEP 8: regenerate large_knowledge_base.json from MS MARCO
  (~private research use only) to fill MANIFEST sha256 — yes or skip?" If skip, journal it
  and go to STEP 9. If yes:
    cd $WORK/repos/rag-quality-lab
    nohup python scale_up_dataset.py > $WORK/logs/c0-scaleup.log 2>&1 &
  then after completion:
    python scripts/verify_data.py 2>&1 | tee $WORK/logs/c0-verify-after-scaleup.log
    sha256sum data/large_knowledge_base.json | tee $WORK/logs/large-kb-sha256.txt
  Record the hash as "workstation regeneration 2026-07"; if record count != 498,725, report
  the difference — do not force the manifest. This data stays private (MS MARCO terms).

STEP 9 — C1: download S1 (confluence + jira) + questions, record checksums
    mkdir -p $WORK/data/enterpriserag-bench/v1.0.0 && cd $WORK/data/enterpriserag-bench/v1.0.0
    BASE=https://github.com/onyx-dot-app/EnterpriseRAG-Bench/releases/download/v1.0.0
    for f in confluence_slice_0001.zip confluence_slice_0002.zip \
             jira_slice_0001.zip jira_slice_0002.zip \
             questions.jsonl extra_questions.jsonl; do
      curl -fL -o "$f" "$BASE/$f"
    done
    sha256sum * | tee SHA256SUMS.workstation-$(date +%Y%m%d).txt
  Sanity: questions.jsonl should be 764,927 bytes and extra_questions.jsonl 57,726 bytes
  (GitHub API, 2026-07-11); the four zips total ~41 MB. Large deviations: G6 stop.
  Also write PROVENANCE.txt in that directory: dataset name, v1.0.0 tag, download date, the
  six URLs, license = MIT (verified on GitHub LICENSE + HF card 2026-07-11), and "synthetic
  corpus (LLM-generated 'Redwood Inference' simulation)".

STEP 10 — extract + sanity-check counts
    cd $WORK/data/enterpriserag-bench/v1.0.0
    mkdir -p extracted/confluence extracted/jira
    unzip -q confluence_slice_0001.zip -d extracted/confluence
    unzip -q confluence_slice_0002.zip -d extracted/confluence
    unzip -q jira_slice_0001.zip -d extracted/jira
    unzip -q jira_slice_0002.zip -d extracted/jira
    find extracted/confluence -type f | wc -l   # expect 5,189 (HF card)
    find extracted/jira -type f | wc -l         # expect 6,120 (HF card)
    wc -l questions.jsonl                        # expect 500
    python - <<'PY'
    import json, collections
    qs=[json.loads(l) for l in open('questions.jsonl')]
    cats=collections.Counter(q['question_type'] for q in qs)
    s1=[q for q in qs if set(q.get('source_types',[])) <= {'confluence','jira'} and q.get('source_types')]
    print('total', len(qs)); print(dict(cats)); print('answerable within S1 subset:', len(s1))
    PY
  Tee all of this to $WORK/logs/c1-counts.log. Count mismatches vs the HF card are FINDINGS
  to record (the card and GitHub quickstart already disagree on per-category counts), not
  errors to hide and not reasons to re-download.

STEP 11 — embedding-throughput smoke (the one directly comparable number)
  Mac baseline: 13.82 s per 1K docs with nomic-embed-text. Same model, same measurement:
    cd $WORK/data/enterpriserag-bench/v1.0.0
    python - <<'PY' 2>&1 | tee $WORK/logs/c1-embed-smoke-$(date +%Y%m%d-%H%M%S).log
    import json, pathlib, time
    from langchain_ollama import OllamaEmbeddings
    docs = sorted(pathlib.Path('extracted/confluence').rglob('*.txt'))[:1000]
    texts = [p.read_text(errors='replace')[:2000] for p in docs]
    emb = OllamaEmbeddings(model='nomic-embed-text')
    emb.embed_query('warmup')
    t0 = time.time(); vecs = emb.embed_documents(texts); dt = time.time() - t0
    out = {'docs': len(texts), 'seconds': round(dt,2), 'sec_per_1k': round(dt*1000/len(texts),2),
           'dim': len(vecs[0]), 'mac_baseline_sec_per_1k': 13.82,
           'speedup_x': round(13.82/(dt*1000/len(texts)),1)}
    print(json.dumps(out, indent=2))
    json.dump(out, open('embed_smoke_result.json','w'), indent=2)
    PY
  If rglob('*.txt') finds no files (extraction layout differs), inspect the extracted tree,
  adapt ONLY the glob pattern, and journal the actual layout — do not change the measurement.
  NOTE: full S1 indexing through the repo's own pipelines is C2/C3 work (needs a format
  adapter, written later on the Mac) — do NOT attempt it here.

STEP 12 — evidence tarball + final report
    cd $WORK && tar czf rag-c0c1-evidence-$(date +%Y%m%d).tgz \
      logs/ \
      repos/rag-quality-lab/evidence/verified-2026-07/ \
      data/enterpriserag-bench/v1.0.0/SHA256SUMS.workstation-*.txt \
      data/enterpriserag-bench/v1.0.0/PROVENANCE.txt \
      data/enterpriserag-bench/v1.0.0/embed_smoke_result.json
    sha256sum rag-c0c1-evidence-*.tgz && ls -la rag-c0c1-evidence-*.tgz
  Also run git status --short in the repo clone and include it in the report (expected: only
  untracked/changed files under evidence/, plus data/large_knowledge_base.json if STEP 8 ran).
  Then post the FINAL REPORT in exactly this shape:

  === C0/C1 FINAL REPORT (workstation, <UTC timestamp>) ===
  Steps 1-12: PASS / FAIL / SKIPPED (one line each; why, if not PASS)
  CI-equivalent: <ruff / N tests passed / verify_data / A3-deterministic results>
  Fresh judged A3 (workstation 2026-07, judge gemma4:e4b): naive mean=<>, hybrid mean=<>,
    regression <degraded/improved/stable>; contradictions vs saved 2026-04 baseline: <none|...>
  Dataset S1: confluence files=<> (expect 5,189), jira=<> (expect 6,120), questions=<>
    (expect 500), S1-answerable pool=<>
  Embedding smoke: <sec_per_1k> s/1K vs Mac 13.82 -> <x>x
  STEP 8 large-KB: <sha256 + record count | SKIPPED>
  GPU used / peak memory seen: <>
  Deviations & findings: <numbered list>
  Evidence tarball: $WORK/rag-c0c1-evidence-<date>.tgz, sha256=<>, size=<>
  Hard stops tripped: <none | which and where>
```

---

## Part 4 — Stop gates Codex CLI must obey (the contract, restated for the human)

These are embedded in the prompt as G1–G8; Codex stops and reports rather than working around:

1. **No API key entry, no paid API call** — no `ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/
   `LLM_API_KEY`, no official EnterpriseRAG-Bench eval harness (it requires an LLM key).
   The human's own Codex CLI sign-in (H2) is outside this gate and outside Codex's hands.
2. **No full 500K run** — `all_documents.zip` is never downloaded; scope is S1 only.
3. **No public release/deploy/push** — no git push/commit from the workstation, no repo
   creation, no uploads anywhere; evidence returns by tarball and the Mac commits it.
4. **No destructive shared-machine actions** — no killing/signaling processes it didn't start,
   no sudo, no system installs, no writes outside `$WORK` and `/tmp`, never `conda init`;
   foreign server on port 11434 → stop.
5. **No credential storage in shared config** — no tokens in files/env/git config; Codex never
   asks the human to paste a secret into the chat.
6. **Stop if repo access or licenses are uncertain** — failed public clone / wrong head / any asset
   that contradicts the verified expectations (license already verified MIT 2026-07-11).
7. **GPU etiquette** — freest GPU, ≥ ~10 GiB free, else stop.
8. **Two strikes** — same failure twice → stop and write up; never modify tracked repo files
   or anything it didn't create.

## Part 5 — Evidence bundle and the return path to the Mac

**What Codex produces** (STEP 12 tarball `$WORK/rag-c0c1-evidence-<date>.tgz`):
all `$WORK/logs/` (GPU snapshots, pip logs proving torch survived, CI-equivalent log with 44
green tests, fresh-A3 run log, dataset count log, embed smoke log, ollama logs, and
`codex-journal.md`), the repo's `evidence/verified-2026-07/` fresh-run outputs, dataset
`SHA256SUMS` + `PROVENANCE.txt`, `embed_smoke_result.json`, and — if STEP 8 ran — the
large-KB sha256 record. Plus the FINAL REPORT text in the chat.

**How the human brings it back:**
1. Download the tarball via the JupyterLab file browser (or `scp`) to the Mac, e.g.
   `~/Downloads/`. Copy Codex's FINAL REPORT text too (paste into a file next to the tarball).
2. Verify the tarball's sha256 on the Mac matches the one Codex printed.
3. Start the next Mac session with the local RAG working copy, for example
   `claude --add-dir /Users/hsiangkuochang/rag-quality-lab-portfolio`, and hand it the tarball
   path + FINAL REPORT. That session: extracts the evidence into the RAG working copy
   (fresh-A3 outputs under `evidence/verified-2026-07/`), records the large-KB sha256 in
   `data/MANIFEST.json` if produced, commits with the workstation labels ("fresh judged
   re-run, workstation, 2026-07, judge gemma4:e4b"), updates portfolio-site `STATE.md`, and
   starts **C2** (eval-set adaptation for the confluence+jira subset).
4. Leave the workstation's `$WORK/data`, caches, and env in place for S2/C3.
