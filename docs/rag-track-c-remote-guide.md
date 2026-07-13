# RAG Quality Lab — Track C C0/C1 remote workstation execution guide

Date: 2026-07-11 · Author: Claude/Fable5 · For: human operator on the company Linux workstation
Scope: **C0 (workstation intake) + C1 (dataset acquisition) + first smoke run only.**
Everything beyond that (C2 eval-set adaptation, C3 full-corpus indexing, C4/C5 experiments and
judged runs at scale) is planned but NOT covered — it starts only after C0/C1 evidence comes back.

Decisions this guide executes (GATE 2c, 2026-07-11): EnterpriseRAG-Bench primary (ESCI optional
later; FinanceBench dropped); two-lane judge, API lane capped at USD 20–30 and **stopped before
any call**; two-pipeline architecture (third deferred); MS MARCO remediation approved.

> **Execution mode (updated 2026-07-11): Codex CLI handoff — see
> `docs/rag-codex-cli-workstation-handoff.md`.** Per operator direction, the human no longer
> pastes these blocks by hand. The human performs only Part 1 of the handoff doc (workstation
> login; Codex CLI sign-in kept out of the shared home; paste the prompt), then hands off to
> Codex CLI, which clones the clean public repo `https://github.com/LucisZhang/rag-quality-lab`
> and runs the handoff doc's Part 3 prompt. That prompt embeds this guide's commands and
> expected values.
> This guide remains the authoritative command/expectation reference; the HARD STOPS below
> bind Codex CLI exactly as they bind a human operator.

---

## HARD STOPS — read before anything else

Stop and report back (do not improvise past these):

1. **No paid API call and no API key entry** — the API judge lane, and the EnterpriseRAG-Bench
   official evaluation harness (`metrics_based_eval`), both require an LLM API key. Setting
   `LLM_API_KEY`, `ANTHROPIC_API_KEY`, or similar is a separate, explicitly approved step that
   has NOT happened. Everything in this guide runs with zero spend.
2. **No full 500K-corpus run** — this guide downloads and indexes subsets only (§C1). The
   1.26 GB `all_documents.zip` full-corpus path is a later, explicitly approved step.
3. **No public release of anything** — the portfolio repo stays private (it contains
   MS MARCO-derived `data/large_eval_questions.json`, private-use only per DATA.md §3).
4. **Shared machine discipline** — do not kill processes you did not start, do not write to
   `/home/luban` beyond what login itself does, do not run `conda init`, do not store
   credentials in shared config. If GPU 1 is busy, pick another free GPU (§C0-1); if all are
   busy, stop and report.
5. **Any license doubt → halt before download.** (EnterpriseRAG-Bench is clear — MIT verified
   on both the GitHub repo and the HF dataset card, see §C1-1 — so this should not trigger.)

---

## Part 0 — Conventions and session bootstrap

Facts this guide is built on (verified 2026-07-11): Ubuntu 22.04 container on
`ml-a6000-ser001.us01`, shared user `luban`; 4× RTX A6000 (44.56 GiB each); torch 2.7.1+cu118
working in the path-based conda env; `nproc` misleadingly prints 1 but CPUs 0–127 are allowed;
~1.0 TiB RAM, ~2.3 TiB free local disk; GitHub/HF/PyPI reachable. JupyterLab terminals can look
stuck or concatenate prompts — paste **one block at a time**, and `tee` every long run to a log.

### C0-0. Create the bootstrap file once, then source it in every fresh terminal

```bash
mkdir -p /nfs/dataset-ofs-algo/zhangxiangguo/{repos,data,logs,tools,cache,pip-cache,conda-pkgs}
cat > /nfs/dataset-ofs-algo/zhangxiangguo/raglab-env.sh <<'EOF'
# RAG Quality Lab workstation bootstrap — source this in every fresh terminal
export WORK=/nfs/dataset-ofs-algo/zhangxiangguo

# conda: shared home is NOT conda-initialized; hook manually (never `conda init`)
eval "$(/home/luban/miniforge3/bin/conda shell.bash hook)" \
  && conda activate "$WORK/envs/raglab-py311" \
  || source /home/luban/miniforge3/bin/activate "$WORK/envs/raglab-py311"

# caches on NFS, never in /home/luban
export CONDA_PKGS_DIRS=$WORK/conda-pkgs
export PIP_CACHE_DIR=$WORK/pip-cache
export HF_HOME=$WORK/cache/huggingface
export OLLAMA_MODELS=$WORK/cache/ollama-models

# CPU: nproc lies (prints 1); affinity is really 0-127. Start conservative.
export OMP_NUM_THREADS=16 MKL_NUM_THREADS=16 NUMEXPR_NUM_THREADS=16
export TOKENIZERS_PARALLELISM=false

# GPU: default to physical GPU 1 (freest at probe time). Inside Python it appears as cuda:0.
export CUDA_VISIBLE_DEVICES=1
EOF
source /nfs/dataset-ofs-algo/zhangxiangguo/raglab-env.sh
python -c "import torch; print(torch.__version__, torch.cuda.is_available(), torch.cuda.device_count())"
```

Expected: `2.7.1+cu118 True 1` (one visible device because of `CUDA_VISIBLE_DEVICES=1`).

### C0-1. Re-check GPU choice at the start of every session (shared machine)

```bash
nvidia-smi --query-gpu=index,name,memory.used,memory.free,utilization.gpu --format=csv | tee $WORK/logs/gpu-$(date +%Y%m%d-%H%M%S).csv
```

If GPU 1 is no longer the free one, edit `CUDA_VISIBLE_DEVICES` in the current shell
(`export CUDA_VISIBLE_DEVICES=<free index>`). Need ≥ ~10 GiB free for everything in this guide.

---

## Part 1 — C0: workstation intake

### C0-2. Clone the clean public repo — Codex CLI step

The clean public repo is `https://github.com/LucisZhang/rag-quality-lab`. It was created from a
single public-safe snapshot, not from the private repo history, so it does not expose the removed
MS MARCO-derived eval file from old commits. No GitHub PAT is needed on the shared workstation.

```bash
cd $WORK/repos
git clone https://github.com/LucisZhang/rag-quality-lab.git
cd rag-quality-lab && git log --oneline -3
```

Head should be `0fc1433` (or newer if the Mac/public repo advanced since). Evidence goes back
to the Mac as a tarball (§Part 6), so no write credentials are needed on the shared machine.

### C0-3. Install Python deps into raglab-py311 — with torch protection

**Trap:** `requirements-lock-py311.txt` pins `torch==2.11.0` (from the Mac venv). Installing it
verbatim would replace the verified `2.7.1+cu118` build. Filter torch out; everything else in
the lock is platform-neutral.

```bash
cd $WORK/repos/rag-quality-lab
pip install -r requirements-ci.txt 2>&1 | tee $WORK/logs/pip-ci.log
grep -vE '^torch==' requirements-lock-py311.txt > /tmp/req-lock-notorch.txt
pip install --dry-run -r /tmp/req-lock-notorch.txt 2>&1 | tee $WORK/logs/pip-dryrun.log
grep -i torch $WORK/logs/pip-dryrun.log   # MUST print nothing torch-related
```

If the dry run is torch-clean, install for real; then re-verify CUDA:

```bash
pip install -r /tmp/req-lock-notorch.txt 2>&1 | tee $WORK/logs/pip-lock.log
python -c "import torch; print(torch.__version__, torch.cuda.is_available())"
```

Recovery if torch ever gets clobbered anyway:
`pip install torch==2.7.1 --index-url https://download.pytorch.org/whl/cu118`.
If PyPI stalls, retry with `-i https://mirrors.aliyun.com/pypi/simple/` (flag only, no config
edits — same pattern used on the Mac).

### C0-4. CI-equivalent checks (mirror .github/workflows/ci.yml exactly)

```bash
cd $WORK/repos/rag-quality-lab
{ python -m ruff check . \
  && python -m pytest \
  && python scripts/verify_data.py \
  && python scripts/ci/run_verify_a3_deterministic.py ; } 2>&1 | tee $WORK/logs/c0-ci-equiv.log
echo "exit=$?"
```

Expected: ruff clean, **44 passed**, verify_data exit 0, deterministic A3 wrapper exit 0
(re-parsing saved metrics: A/B 0.8093 → 0.9438, regression 4 degraded / 0 improved / 8 stable).
Any failure here = environment problem; fix before touching models or data.

### C0-5. Ollama in user space (no root, no /home/luban)

Check for an existing server first — **never kill someone else's**:

```bash
curl -s --max-time 5 http://127.0.0.1:11434/api/tags || echo "NO-SERVER"
```

- If `NO-SERVER`: install to NFS and start your own (get the current Linux tarball link from
  https://ollama.com/download — the amd64 tarball URL below is the documented pattern):

```bash
mkdir -p $WORK/tools/ollama && cd $WORK/tools/ollama
curl -fL -o ollama-linux-amd64.tgz https://ollama.com/download/ollama-linux-amd64.tgz
tar xzf ollama-linux-amd64.tgz
nohup env CUDA_VISIBLE_DEVICES=$CUDA_VISIBLE_DEVICES OLLAMA_MODELS=$OLLAMA_MODELS \
  $WORK/tools/ollama/bin/ollama serve > $WORK/logs/ollama-serve.log 2>&1 &
sleep 3 && curl -s http://127.0.0.1:11434/api/tags
```

- If a server already responds: check whose it is (`ps aux | grep ollama`); if you can't add
  models to it, STOP and report — the repo's scripts hard-code `127.0.0.1:11434`.

Pull exactly the two models the repo pins (src/utils.py):

```bash
export PATH=$WORK/tools/ollama/bin:$PATH
ollama pull gemma4:e4b 2>&1 | tee $WORK/logs/ollama-pull-llm.log
ollama pull nomic-embed-text 2>&1 | tee $WORK/logs/ollama-pull-embed.log
ollama list
```

### C0-6. The fresh LLM-judged re-run (the decided A3 closure — first real GPU job)

This is the run that was decided onto the workstation (audit 2026-07-11): fresh 12-question
A/B + V1→V2 regression, judged by the **same local judge version as the saved Mac baseline**
(`gemma4:e4b`), now on hardware that can actually finish it. Zero spend, zero new approvals.

```bash
cd $WORK/repos/rag-quality-lab
nohup python scripts/verify_a3.py --mode fresh --max-questions 12 \
  > $WORK/logs/c0-fresh-a3-$(date +%Y%m%d-%H%M%S).log 2>&1 &
tail -f $WORK/logs/c0-fresh-a3-*.log   # Ctrl-C detaches from tail only, run continues
```

Notes: it builds its own runtime vector stores; the cross-encoder
(`cross-encoder/ms-marco-MiniLM-L-6-v2`) downloads from HF into `$HF_HOME` on first use.
Expect tens of minutes, not the >6 min/question Mac stall. Output lands in
`evidence/verified-2026-07/fresh-<UTC>/` + `latest-fresh-summary.json`.

**Reporting discipline:** whatever the numbers are, they are reported as
"fresh judged re-run, workstation, 2026-07, judge gemma4:e4b" next to (never blended with) the
"saved run 2026-04" columns. If they contradict the saved story, we publish the contradiction.

### C0-7 (optional, time-permitting). Regenerate the 191 MB corpus + record its sha256

`data/MANIFEST.json` carries `records=498725, sha256=null` for the excluded-by-design large
corpus. The workstation can regenerate it from MS MARCO v2.1 (HF) — **private research use
only, never republished** (DATA.md §3):

```bash
cd $WORK/repos/rag-quality-lab
nohup python scale_up_dataset.py > $WORK/logs/c0-scaleup.log 2>&1 &
# after it finishes:
python scripts/verify_data.py 2>&1 | tee $WORK/logs/c0-verify-after-scaleup.log
sha256sum data/large_knowledge_base.json | tee $WORK/logs/large-kb-sha256.txt
```

Caveat, recorded honestly: a regenerated file may not be byte-identical to the 2026-04 Mac
original (HF dataset revision drift). Record the hash as "workstation regeneration 2026-07";
if record count ≠ 498,725, report the difference rather than forcing the manifest.

---

## Part 2 — C1: EnterpriseRAG-Bench acquisition (subset-first)

### C1-0. License + provenance status (already live-verified 2026-07-11, no re-check needed)

- GitHub repo `onyx-dot-app/EnterpriseRAG-Bench`: LICENSE = **MIT** (© 2026 DanswerAI, Inc.).
- HF dataset card `onyx-dot-app/EnterpriseRAG-Bench`: `license: mit` in card metadata (HF API).
  This closes the Track B memo's last [BLOCKED-EXA] doubt on the primary dataset.
- Release v1.0.0 (2026-03-29) assets, exact sizes from the GitHub API: `all_documents.zip`
  1,256,181,062 B; per-source slices ≤5,000 docs each; `questions.jsonl` 764,927 B;
  `extra_questions.jsonl` 57,726 B.
- Known docs discrepancy: the HF card and GitHub quickstart disagree on per-category question
  counts (e.g., Basic 175 vs 200; both total 500). At C2, derive counts from `questions.jsonl`
  itself, never from either doc.

### C1-1. Smoke-run scope decision (this guide's answer to "how big is the first run")

**Stage S1 — smoke (this guide): confluence + jira = 11,309 docs, ~41 MB zipped.**
Rationale: two smallest sources; wiki/runbook + ticket text is the closest match to the lab's
existing enterprise-RAG story; big enough to exercise chunking/indexing/retrieval realistically,
small enough that any mistake costs minutes.
**Stage S2 — next session, no new approval needed: + google_drive → 36,417 docs (~90 MB).**
**Stage S3 — full 500K (`all_documents.zip`): STOPPED — needs explicit human go-ahead.**

### C1-2. Download the S1 bundle + questions, record checksums

```bash
mkdir -p $WORK/data/enterpriserag-bench/v1.0.0 && cd $WORK/data/enterpriserag-bench/v1.0.0
BASE=https://github.com/onyx-dot-app/EnterpriseRAG-Bench/releases/download/v1.0.0
for f in confluence_slice_0001.zip confluence_slice_0002.zip \
         jira_slice_0001.zip jira_slice_0002.zip \
         questions.jsonl extra_questions.jsonl; do
  curl -fL -o "$f" "$BASE/$f"
done
sha256sum * | tee SHA256SUMS.workstation-$(date +%Y%m%d).txt
```

Provenance record (commit this file back with the evidence): dataset name, v1.0.0 tag,
download date, URLs, the SHA256SUMS file, license = MIT (verified on repo LICENSE + HF card
2026-07-11), and "synthetic corpus (LLM-generated 'Redwood Inference' simulation)".

### C1-3. Extract and sanity-check against the published counts

```bash
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
```

The last number is the S1-answerable question pool for C2. Record all counts in the evidence
log; mismatches vs the HF card are findings, not errors to hide.

### C1-4. First model+data smoke: workstation embedding-throughput baseline

Purpose: one directly comparable number. Mac baseline: **13.82 s per 1K docs** with
`nomic-embed-text`. Same model, same measurement, workstation GPU:

```bash
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
```

This is the quantified "why the workstation" datapoint for the case study. Full S1 indexing
through the repo's own pipelines is **C2/C3 work** (the pipeline code expects the lab's KB JSON
format, so an adapter script comes first — next session, on the Mac, after this evidence
returns).

---

## Part 3 — Model-stack candidates for C3+ (decide at intake, not now)

Live-corroborated 2026-07-11 via Exa from multiple independent 2026 sources — but these are
**secondary aggregations**, so the binding step is: before any download, open the HF model card
and verify license + size yourself. Sources disagree on Qwen3-family licensing (Apache-2.0 vs
custom), which is exactly why card verification is mandatory.

| Slot | Current (lab) | Default upgrade candidate | Higher-quality option | Verify on card |
|------|---------------|---------------------------|------------------------|----------------|
| Embeddings | nomic-embed-text | **BGE-M3** (568M, MIT, dense+sparse — fits our hybrid story) | Qwen3-Embedding-4B/8B | license, VRAM, dims |
| Reranker | ms-marco-MiniLM-L-6-v2 (2021) | **bge-reranker-v2-m3** | Qwen3-Reranker-4B | license, 512-token ctx limit |
| Generator | gemma4:e4b | 27B-class GGUF Q5–Q8 via Ollama (fits A6000 with room) | 70B-class Q4 (~40 GiB — only on an idle GPU) | license, quant availability |

Hardware constraint that shapes serving choice: A6000 is Ampere — **no FP8**; GGUF/Ollama is
the right path, not vLLM-FP8. Also do NOT pip-install vLLM into raglab-py311 (it would replace
torch); if vLLM is ever wanted, that's a separate env, separate session.
Re-embedding the corpus is the dominant compute cost — the embedding choice is made **once**,
at C3, against measured S1/S2 numbers, not vibes.

## Part 4 — Judge lanes and the budget boundary (verified pricing; STOP applies)

Two-lane protocol (approved): **Lane L (local, free)** — workstation Ollama judge; this guide's
C0-6 uses `gemma4:e4b` for baseline comparability; a stronger local judge (27B-class) may be
added later as its own lane, never mixed in one table. **Lane A (API, capped USD 20–30)** —
pinned frontier judge, `claude-sonnet-5` recommended.

Pricing verified live 2026-07-11 (docs.claude.com/en/docs/about-claude/pricing):

| Model | Input /MTok | Output /MTok | Note |
|-------|-------------|--------------|------|
| claude-sonnet-5 | $2 (→ $3 from 2026-09-01) | $10 (→ $15) | intro pricing window |
| claude-haiku-4-5 | $1 | $5 | cheap lane |

Projection at the memo's call shape (500 q × 5 metrics × ~1–2K tok/call ≈ 2.5–5M tok, ~80%
input), **plus ~30% tokenizer uplift** (Claude 5-family tokenizer produces ~30% more tokens for
the same text): a full 500-question Sonnet-5 run lands roughly **$14–31** — i.e., the whole cap
in one run. Therefore the first paid run, when approved, must be a pilot: **12–50 questions ≈
$0.5–3**, projected precisely against measured token counts from Lane L transcripts **before
the first call**. None of this executes now: no key entry, no call, until an explicit go with
the exact pilot size.

---

## Part 5 — What to bring back (evidence bundle)

From the workstation, tar and copy back to the Mac (no pushing from the shared box — the Mac
commits/imports it):

```bash
cd $WORK && tar czf rag-c0c1-evidence-$(date +%Y%m%d).tgz \
  logs/ \
  repos/rag-quality-lab/evidence/verified-2026-07/ \
  data/enterpriserag-bench/v1.0.0/SHA256SUMS.workstation-*.txt \
  data/enterpriserag-bench/v1.0.0/embed_smoke_result.json
ls -la rag-c0c1-evidence-*.tgz
```

Checklist: C0 CI-equivalent log (44 tests green) · fresh A3 judged summary + per-question CSVs ·
GPU/`nvidia-smi` snapshot log · pip logs (proof torch survived) · dataset SHA256SUMS + counts ·
embedding smoke JSON · (optional) large-KB sha256 + record count. Every results table carries
the machine spec and the run date.

## Appendix — quirk cheatsheet

| Symptom | Fix |
|---------|-----|
| `conda: command not found` | re-source `$WORK/raglab-env.sh` (hook line) |
| activate fails under hook | fallback: `source /home/luban/miniforge3/bin/activate $WORK/envs/raglab-py311` |
| tools read `nproc`=1 | it's a lie; affinity is 0–127. Thread env vars already set to 16 |
| JupyterLab terminal "stuck" | it's usually still running — check the tee'd log file from a second terminal |
| torch broken after a pip install | `pip install torch==2.7.1 --index-url https://download.pytorch.org/whl/cu118` |
| PyPI stalls | add `-i https://mirrors.aliyun.com/pypi/simple/` to that one command |
| GPU 1 busy | `export CUDA_VISIBLE_DEVICES=<other free index>`; restart `ollama serve` with it |
| port 11434 taken by someone else | do not kill it; STOP and report (repo hard-codes the port) |
