# Task F13a — Ask Portfolio Round-2 knowledge rebuild

Date: 2026-08-29 (Asia/Shanghai)
Branch: `codex/site-revamp-r2-20260822`
Pinned site revision: `e8821702bfe69ee5846a617aa178486f216b5346`
Scope: knowledge/generation pipeline only; no push, deploy, launcher work, or edits under `src/components/privacy/**`.

## Outcome

Ask Portfolio now has a commit-pinned Round-2 site layer covering the homepage and all ten routable project pages while retaining the seven existing upstream project repositories. The regenerated server-only snapshot contains 8 repositories, 206 reviewed source selections, 1,410 bounded chunks, and 1,926,122 selected source bytes. Its stable snapshot SHA-256 is `de5ef8b12c853264e170a40a9c35aee3edea395bce59addc039ebfd89fdbb139`.

A deterministic per-route question bank now provides three simple first-touch questions for every route. The source has 33 bilingual question pairs; the generated frontend artifact has the requested shape, and all 66 independently written English/Chinese prompts retrieve question-relevant Round-2 evidence plus a structured citation through the production retriever.

## Pipeline survey

### Inputs and generation

- `assistant-knowledge/manifest.json` is the reviewed source registry. Before F13a it described seven public GitHub repositories, each pinned to an exact 40-character commit and a bounded file list.
- `scripts/build-assistant-knowledge.mjs` fetched each pinned raw file, rejected oversized/non-text material, chunked it with bounded line overlap, and wrote `src/data/assistant-knowledge.generated.json`.
- F13a keeps those upstream pins and adds `siteRepository` plus 11 `siteSources`. Site inputs are read from the pinned local Git object with `git show e882170:<path>`, so unrelated working-tree edits cannot enter the snapshot. This cutline includes the concurrent F12 privacy sample commit and its launcher-test follow-up without editing either frontend domain.
- The seven upstream repositories still prefer a fresh raw-GitHub fetch. When the failure is limited to DNS, timeout, or network transport, the builder may reuse only the upstream part of the last committed snapshot, loaded from the Git blob at `HEAD:src/data/assistant-knowledge.generated.json`. It recomputes the committed envelope hash, requires exact manifest repository/commit/path membership, and validates record bounds plus every chunk's file-hash link, ID, aliases, line range, and citation URL. This trust is anchored in the committed Git blob; it does not claim a fresh comparison with unavailable remote bytes. HTTP and integrity failures still stop the build.
- `assistant-knowledge/question-bank.json` is the reviewed source for the presets. `scripts/generate-ask-question-bank.mjs` requires exact route parity with `manifest.siteSources`, exactly three questions per route, exact object keys, unique IDs, English text, and independently supplied Han-script text. It writes `src/data/generated/ask-question-bank.json` and supports `--check`.
- `scripts/generate-portfolio-search-aliases.mjs` remains an independent pipeline from `src/data/portfolio-search-vocabulary.ts` to `src/data/portfolio-search-aliases.generated.json`. F13a regenerated it but did not change its source or output.

### Output contract

The existing assistant snapshot remains version 1. Its established top-level contract is unchanged:

`version`, `snapshotId`, `manifestSha256`, `repositoryCount`, `fileCount`, `chunkCount`, `totalSourceBytes`, `files`, `chunks`, `generatedAt`, and `snapshotSha256`.

The runtime chunk fields are unchanged. Existing full-file fields in `files` retain their meanings. For sliced sources, F13a conservatively extends only the file record with optional `selectionBytes` and `selectionSha256`, keeping `bytes`, `sha256`, and each chunk's `fileSha256` tied to the complete cited file. Other changes are content and identity only:

- adds `LucisZhang/portfolio-site` as repository 8;
- updates the snapshot identity and hashes;
- namespaces site chunk IDs by route (`portfolio-site:<route-namespace>:...`) so a shared path selected for several pages remains globally unique;
- slices each selected `src/lib/projects.ts` entry and shared multi-route wrapper to exact reviewed source lines rather than duplicating or misattributing page copy;
- derives `generatedAt` from the pinned site commit's committer timestamp, so it is a deterministic source-cutline time rather than the local build time.

The new question-bank artifact is deliberately separate from the runtime knowledge schema:

```json
{
  "<route>": {
    "questions": [
      { "q_en": "...", "q_zh": "...", "id": "..." }
    ]
  }
}
```

No existing assistant consumer needs a schema migration.

### Runtime consumption and citations

- `src/lib/assistant-retrieval.ts` imports the generated knowledge server-side, normalizes English and Chinese terms, expands reviewed aliases, calculates deterministic lexical scores, and returns at most nine diverse chunks with at most three from one source.
- F13a reserves the top two matching current-site chunks when the question explicitly names a route/project alias, then continues normal ranking and per-source diversity. It does not force a generic catalog chunk. Candidate/private-material ordering and existing limits remain intact.
- `src/lib/assistant-policy.ts` sends only retrieved blocks to the model and requires returned citation IDs. `citationsForChunkIds` accepts only IDs in that retrieval result.
- Public citations carry repository, label, and an exact GitHub `blob/<40-character-commit>/<path>#Lx-Ly` URL assembled during generation. The question harness calls the same retriever and citation mapper and requires a non-empty, route-matched, question-relevant `LucisZhang/portfolio-site` citation.
- `scripts/check-links.mjs` crawls rendered anchor/link state through Playwright and does not import or inspect the assistant snapshot, search aliases, or question bank. `npm run check:links` is therefore not an applicable F13a artifact gate.

## Round-2 coverage inventory

The retained upstream layer contributes 58 source selections / 449 chunks. The new site layer contributes 148 source selections / 961 chunks.

| Route | Selections | Chunks | Current-site coverage |
| --- | ---: | ---: | --- |
| `/` | 20 | 99 | EN/ZH recruiter entry copy, safely sliced site identity/config and shared dictionary, localized homepage claim/boundary text, full project catalog, all seven homepage exhibits, digits audit, stats and receipt summaries |
| `/ai/frontier-forge` | 16 | 85 | Exact project entry and owner/detail module, console/live-slot/page/rail copy, evidence explorer, training ladder, serving and overload boundaries, digits audit, release manifest, commands, and receipts |
| `/ai/release-guardian` | 11 | 87 | Exact project entry, full four-scenario replay payload, route-scoped Chinese replay copy, shared page wrapper without other routes' copy, dedicated proof/replay UI, EN/ZH component readmes, manifest, deterministic-stub runs, funded-live aggregate CSV |
| `/ai/rag-quality-lab` | 8 | 42 | Exact project entry, route-scoped Chinese evidence labels, shared page wrapper without other routes' copy, dedicated proof/drift lab, claim registry, C3 README and dependency preflight; preserves C2 as floor and records that C3 produced no metric |
| `/ai/triage-router` | 17 | 66 | Exact project entry, page/terminal/failure/frontier/drift/inference/drawer/rail/receipt copy, digits audit, compact frontier, policy, curated-sample, strategy, drift, and failure payloads including the four evidence caveats |
| `/ai/privacy-preflight-mac` | 21 | 137 | Exact project entry, pinned proof-galley/compact-preview/lab/PDF/review/benchmark/fail-closed/rail/receipt copy, current Chinese detector/source labels, digits audit, manifest, OCR benchmark, worker and browser checkpoints |
| `/engineering/exactly-once-drills` | 16 | 184 | Exact project entry, duty logbook/page/data/timeline/board/rail copy, digits audit, ten-row summary, receipts, checkpoint metrics, reconciliation, parity, and SLO outcomes |
| `/engineering/crossover-study` | 9 | 34 | Exact project entry, route-safe shared wrapper, dedicated proof/exhibit copy, ML-32M counterexample, Amazon null result, caveat, and scale payloads |
| `/analytics/margin-control-tower` | 15 | 110 | Exact project entry, route-scoped Chinese dynamic labels, route-safe shared wrapper, proof/control-tower/panel/method copy, public data README, detection/elasticity/metric/method summaries and non-causal boundaries |
| `/analytics/credit-policy-desk` | 11 | 106 | Exact project entry, route-scoped Chinese dynamic labels, route-safe shared wrapper, proof/policy-desk/swap-set/method copy, data README, backtest, threshold contract, methods and granted-loan-only limitations |
| `/analytics/analytics-tandem` | 4 | 11 | Exact legacy catalog entry, hero metrics, migration proof and shared wrapper; preserves the two successor links, paired analysis scope, zero carried-over figures, and explicit non-claims |

All five extant Round-2 per-page digits audits (`digits-home`, `digits-forge`, `digits-triage`, `digits-privacy`, and `digits-eod`) are ingested. Legacy pages keep their existing upstream repository content and receive their current site catalog/copy or compact payload layer where present. Large raw/preview payloads are represented by compact reports and boundary documents rather than inflating the corpus with row-level data.

## Question bank and per-question verification

Harness: `tests/assistant/ask-question-bank.test.mjs`
Command: `npm run verify:assistant-question-bank`
Assertion per language variant: the production retriever returns a route-matched Round-2 chunk, an allowlisted question-relevant source path, and a non-empty structured citation pinned to `LucisZhang/portfolio-site@e882170`.

| Route | ID | English preset | 中文预设 | EN | ZH |
| --- | --- | --- | --- | --- | --- |
| `/` | `home-background` | Who is Xiangguo Zhang, and what kind of work does he do? | 章向国主要在做什么，求职方向是什么？ | PASS | PASS |
| `/` | `home-site-overview` | What can I explore on this portfolio site? | 这个作品集里最值得先看哪些内容？ | PASS | PASS |
| `/` | `home-tech-stack` | What technologies power this site and its projects? | 整个网站和这些项目主要用了哪些技术？ | PASS | PASS |
| `/ai/frontier-forge` | `forge-overview` | How does Frontier Forge connect training, serving, and the gateway? | Frontier Forge 怎样把训练、推理服务和网关串成完整链路？ | PASS | PASS |
| `/ai/frontier-forge` | `forge-training-result` | What was Frontier Forge's biggest training result? | Frontier Forge 最醒目的训练结果是什么？ | PASS | PASS |
| `/ai/frontier-forge` | `forge-overload` | How does the Frontier Forge gateway handle overload? | Frontier Forge 的网关遇到过载时会怎样？ | PASS | PASS |
| `/ai/release-guardian` | `release-overview` | What does Release Guardian do before a release? | Release Guardian 为什么要在发布前停下来？ | PASS | PASS |
| `/ai/release-guardian` | `release-human-approval` | Where does human approval fit into Release Guardian? | 人工审批具体放在 Release Guardian 的哪一步？ | PASS | PASS |
| `/ai/release-guardian` | `release-gate-results` | What do Release Guardian's 8/8 and 30/44 results mean? | Release Guardian 的 8/8 和 30/44 两个数字是什么意思？ | PASS | PASS |
| `/ai/rag-quality-lab` | `rag-overview` | What kind of problem does RAG Quality Lab catch? | RAG Quality Lab 主要防哪类检索回归？ | PASS | PASS |
| `/ai/rag-quality-lab` | `rag-c2` | What did the RAG Quality Lab C2 stage verify? | RAG Quality Lab 的 C2 阶段到底验证了什么？ | PASS | PASS |
| `/ai/rag-quality-lab` | `rag-c3` | What happened during the RAG Quality Lab C3 timebox? | RAG Quality Lab 的 C3 为什么没有给出新指标？ | PASS | PASS |
| `/ai/triage-router` | `triage-overview` | What does Triage Router route? | Triage Router 会把投诉分到哪里？ | PASS | PASS |
| `/ai/triage-router` | `triage-tradeoff` | How does Triage Router balance cost and accuracy? | Triage Router 怎么在成本和准确率之间做选择？ | PASS | PASS |
| `/ai/triage-router` | `triage-boundaries` | What are the main limits of the Triage Router evidence? | 看 Triage Router 的结果时，最重要的四条限制是什么？ | PASS | PASS |
| `/ai/privacy-preflight-mac` | `privacy-overview` | What can Privacy Preflight redact? | Privacy Preflight 能处理文本、图片和 PDF 吗？ | PASS | PASS |
| `/ai/privacy-preflight-mac` | `privacy-local-processing` | Does Privacy Preflight process files locally, or upload them elsewhere? | 用 Privacy Preflight 时，数据会不会离开浏览器？ | PASS | PASS |
| `/ai/privacy-preflight-mac` | `privacy-ocr` | How should I read Privacy Preflight's OCR results? | Privacy Preflight 的 OCR 19/19 和 2 个误报该怎么理解？ | PASS | PASS |
| `/engineering/exactly-once-drills` | `eod-overview` | Why does Exactly-Once Drills inject failures and reconcile the pipeline afterward? | Exactly-Once Drills 为什么要注入故障，再对管道做对账？ | PASS | PASS |
| `/engineering/exactly-once-drills` | `eod-failures` | Which failures does Exactly-Once Drills test? | Exactly-Once Drills 演练了哪十类故障？ | PASS | PASS |
| `/engineering/exactly-once-drills` | `eod-recovery-proof` | How does Exactly-Once Drills know recovery was correct? | Exactly-Once Drills 怎样用快照差异和事件 ID 确认没有丢数或重复？ | PASS | PASS |
| `/engineering/crossover-study` | `crossover-overview` | What question does Crossover Study investigate? | Crossover Study 到底在比较什么？ | PASS | PASS |
| `/engineering/crossover-study` | `crossover-ml32m` | What did Crossover Study find in ML-32M? | Crossover Study 的 ML-32M 交叉点说明什么？ | PASS | PASS |
| `/engineering/crossover-study` | `crossover-amazon-null` | Why was Crossover Study's Amazon null result still useful? | Crossover Study 的 Amazon 线没有显著结果，为什么仍值得保留？ | PASS | PASS |
| `/analytics/margin-control-tower` | `margin-overview` | What decision does Margin Control Tower help someone make? | Margin Control Tower 能帮品类经理做什么决定？ | PASS | PASS |
| `/analytics/margin-control-tower` | `margin-data` | Does Margin Control Tower use Olist data or synthetic data? | Margin Control Tower 用的是 Olist 数据还是合成数据？ | PASS | PASS |
| `/analytics/margin-control-tower` | `margin-boundaries` | Is Margin Control Tower's promotion elasticity a forecast or an assumption? | Margin Control Tower 的促销弹性是预测结果，还是公开假设？ | PASS | PASS |
| `/analytics/credit-policy-desk` | `credit-overview` | How does Credit Policy Desk turn a score into a policy decision? | Credit Policy Desk 为什么说一个分数还不是策略？ | PASS | PASS |
| `/analytics/credit-policy-desk` | `credit-thresholds` | How does Credit Policy Desk choose approval and review thresholds? | Credit Policy Desk 的批准、复核、拒绝三段阈值怎么定？ | PASS | PASS |
| `/analytics/credit-policy-desk` | `credit-boundaries` | What does granted-loan-only data limit in Credit Policy Desk? | Credit Policy Desk 只有已授信样本，会带来什么限制？ | PASS | PASS |
| `/analytics/analytics-tandem` | `tandem-overview` | What is the Analytics Tandem page? | Analytics Tandem 这个旧入口现在保留来做什么？ | PASS | PASS |
| `/analytics/analytics-tandem` | `tandem-combination` | What kinds of analysis did Analytics Tandem combine? | Analytics Tandem 原来把哪两类分析放在一起？ | PASS | PASS |
| `/analytics/analytics-tandem` | `tandem-boundaries` | What results should I not infer from Analytics Tandem? | Analytics Tandem 这个旧案例明确不主张哪些效果？ | PASS | PASS |

Result: 33/33 question pairs and 66/66 language variants are answerable with relevant structured citations. The harness has 67 passing tests including the route/shape invariant.

## Registration and generated receipts

- `docs/evidence/r2-source-map.md` registers both generated targets with exact file SHA-256 values.
- `docs/EVIDENCE_INDEX.md` records the current corpus counts, stable snapshot hash, site pin, and the 66-prompt no-dead-end contract.
- `docs/assistant-operations.md` documents the Round-2 input layer, unchanged v1 runtime chunk contract, conservative selected-file metadata extension, cache-integrity fallback, question-bank pipeline, and verification commands.
- Knowledge artifact file SHA-256: `6ab9323fce679ef0aeb8f5760f448e904b5e7def47e28911dd40147e1302b4c9`.
- Question-bank artifact SHA-256: `dfcf55df60a0b2f3bd16d1e8104ec97450e2e21013989e858d22fe790dae30c9`.

## Verification evidence

| Command | Result |
| --- | --- |
| `npm run build:assistant-knowledge` | PASS — 8 repositories, 206 selections, 1,410 chunks; question bank generated with 11 routes / 33 pairs |
| `npm run generate:search-aliases` | PASS — deterministic existing alias artifact regenerated |
| `npm run verify:assistant-question-bank` | PASS — 67/67 tests; 66/66 language variants retrieve relevant cited evidence |
| `npm run verify:assistant` | PASS — 113/113 tests |
| `npm run verify:assistant-public-sources` | PASS — cache integrity and exact generated snapshot match |
| `npm run verify:r2-sources` | PASS — 40 verified / 16 pre-existing TBD skips / 56 total |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS exit code with 0 errors; 11 warnings remain in unrelated shared scripts/tmp files |
| F13a-path ESLint with `--max-warnings=0` | PASS |
| `npm run verify:evidence` | PASS |
| `npm run build` | PASS — compile, TypeScript, and 19-page static generation completed on the final tree |
| `npm run test:e2e -- --workers=1` | ENVIRONMENT-BLOCKED after its assistant tests and production build passed: Playwright web server bind failed with `listen EPERM 127.0.0.1:4173`; no browser cases ran |
| `npm audit --omit=dev` | Registry refresh blocked by sandbox proxy; `npm audit --omit=dev --offline` PASS — 0 vulnerabilities in the local advisory cache |
| `npm run check:links` | N/A — the link crawler does not consume the F13a artifacts |
| `git diff --check` on exact F13a paths | PASS |
| Independent code/corpus review | READY — no Critical, Important, or Minor findings; independent 148-selection site rebuild found 0 integrity, cross-route attribution, or sensitive-value errors |

## TDD and retrieval checks

The question-bank suite was introduced red-first: it initially failed because the artifact and route set did not exist, then failed all 66 retrieval variants against the old corpus. After corpus generation, question-specific source/claim assertions exposed shallow matches; questions, bilingual expansions, route priority, and evidence coverage were tightened until all 66 variants hit hand-reviewed route-specific source paths and semantic claim patterns. A global chunk-ID assertion exposed 14 collisions from paths shared across route groups; route-namespaced site IDs resolved them. Review then found cross-route Analytics Tandem copy in whole-file `ProjectProof` selections; exact line selectors removed those misattributions and dedicated proof modules retained each route's visible copy.

## Concerns and handoff

1. The site layer and its structured GitHub URLs are pinned to local commit `e882170`. That revision is not present in the fetched public branches in this workspace, so those citations remain publication-gated and can return 404 until an authorized later push publishes the exact commit. F13a did not push.
2. Raw GitHub DNS was unavailable during regeneration. The builder used the fail-closed, Git-committed cache path for the unchanged 58 upstream selections; all 148 site selections were freshly rebuilt from the pinned Git object. An online refresh is recommended at the publication gate.
3. The 1,926,122-byte corpus uses 96.3% of the reviewed 2,000,000-byte cap, leaving 73,878 bytes of headroom. Future additions should prefer compact summaries or deliberately raise and review the bound.
4. The managed sandbox prevents local TCP binding, so the Playwright browser gate could not start. This needs a rerun in the normal local/CI environment; the production build and all assistant tests completed first.
5. The live npm advisory endpoint was also sandbox-blocked. The offline audit passed with zero known production vulnerabilities but is not a refreshed registry result.
6. Concurrent changes under `src/components/privacy/**` and assistant launcher/E2E wiring landed independently as `438f1e1` and `e882170`; F13a did not edit or stage those paths. The knowledge snapshot reads their committed page-copy cutline through `git show`, while other unrelated dirty/untracked paths remain excluded.

## F13a-owned files

- `assistant-knowledge/manifest.json`
- `assistant-knowledge/question-bank.json`
- `scripts/build-assistant-knowledge.mjs`
- `scripts/generate-ask-question-bank.mjs`
- `src/data/assistant-knowledge.generated.json`
- `src/data/generated/ask-question-bank.json`
- `src/lib/assistant-retrieval.ts`
- `tests/assistant/assistant-retrieval.test.mjs`
- `tests/assistant/ask-question-bank.test.mjs`
- `package.json`
- `docs/assistant-operations.md`
- `docs/EVIDENCE_INDEX.md`
- `docs/evidence/r2-source-map.md`
- `.superpowers/sdd/2026-08-22-site-revamp-r2/task-F13a-report.md`
