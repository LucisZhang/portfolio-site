## A. Site IA

### 路由决策

- **保留** `/`、现有 9 个可访问项目 URL、两个 archive 项目页及 `/artifact`。项目 URL 不扁平化，避免破坏既有分享链接、搜索索引和 assistant grounding：
  - `/ai/frontier-forge`
  - `/ai/release-guardian`
  - `/ai/triage-router`
  - `/ai/privacy-preflight-mac`
  - `/ai/rag-quality-lab`
  - `/engineering/exactly-once-drills`
  - `/engineering/crossover-study`
  - `/analytics/margin-control-tower`
  - `/analytics/credit-policy-desk`
- **删除 3 个 track 聚合页**。`/ai`、`/engineering`、`/analytics` 是 Round-1 “PPT 目录页”遗留，与新首页展览叙事重复：
  - `/ai` → `308 /#agent-systems`
  - `/engineering` → `308 /#systems`
  - `/analytics` → `308 /#archive`
- **删除 legacy `/analytics/analytics-tandem` 页面**。它当前已 `noindex`，只承担迁移说明；改为 `308 /#archive`，由 archive exhibit 同时露出两个继任项目。
- **Ask Portfolio 继续作为 launcher-only 产品**，不新建自我解释式项目页；在首页安排一个可直接提问的 exhibit，并保留全站入口。
- `/artifact` 继续作为 evidence viewer，不进入主 rail 编号，只从 receipt、SHA、report 链接进入。
- 保留已有 `/engineering/p1-reliability-lab`、`/analytics/credit-policy-lab` redirects；为所有 killed routes 加 redirect tests、canonical 检查和 link audit。
- “删除外链 demo”仅针对 GitHub Pages、Streamlit、HF Space 等产品入口；GitHub source 可留在最后一个 `SOURCE / RECEIPTS` exhibit，不能再承担产品体验。

### Rail 模型

- reference 已实际采用固定 `260px` rail、`main { margin-left:260px }`、右对齐 mono 编号与 hairline nav；见 [styles.css](</private/tmp/claude-501/-/0b9af4b4-589f-494b-9967-aae94141b7a4/scratchpad/design-final/assets/styles.css>)。
- **全站只有一个 rail fabric，但目录内容按页面实例化**：
  - 首页 rail：wordmark、双支柱定位、`00–06` 首页 exhibits、`SEARCH / ASK / EN·ZH / RESUME`。
  - 项目 rail：wordmark、项目英文名、独立 zh gloss、当前页 `00–0N` exhibits、`ALL WORK / SOURCE`。
  - `/artifact`：精简 rail，只显示 `BACK TO PROJECT / FILE / HASH`。
- RootLayout 只保留 font、locale、assistant/provider；删除强制全站 top header/footer。`ExhibitionShell` 由首页和项目模板各渲染一次，防止 Next.js nested layout 叠出双 rail。
- Footer 改成每页最后一个 full-bleed exhibit，不再脱离展览序列。

### Mobile rail

- `>980px`：固定 `260px`。
- `641–980px`：变成页面顶部静态 masthead；下方保留两列编号目录，`main` 取消左 margin。
- `≤640px`：56px sticky text bar，只显示 `XGZ / 03 OF 06 / MENU`；点击 `MENU` 展开文档流内的全宽目录，不用 floating drawer、icon 或毛玻璃。
- anchor 统一 `scroll-margin-top:72px`；切换语言后保持当前 exhibit hash。
- 无 JS 时目录全部展开，所有锚点仍可工作。

---

## B. Homepage exhibit script

### 00 — Personal assertion｜Paper｜94vh

- Eyebrow：**Pick** `AI AGENTS / LLM APPLICATIONS / MEASURED SYSTEMS`；Alt `2027 CAMPUS HIRE / AGENTS / BACKEND SYSTEMS`。选前者，因为是能力主张，不把毕业年份变成第一视觉信号。
- Title：从下面三条中选第一条。
- 内容：两行巨型 assertion、独立中文 narrative、双支柱方向、3 个 hash-gated headline receipts、联系与简历文字链接；不放头像、skills wall、图标。
- Headline candidates：
  - **Pick** `I build the whole path.` / *`Then show where it breaks.`*
  - Alt `Build what ships.` / *`Measure what breaks.`*
  - Alt `Agents that act.` / *`Systems that answer for them.`*
- 选择理由：第一条最像个人陈述，同时把 Agent、systems、负结果纪律连成一句，不绑死某个项目。

### 01 — Agent systems｜White｜`#agent-systems`

- Eyebrow：**Pick** `13-NODE GRAPH / TOOL GUARDS / HUMAN APPROVAL`；Alt `AGENT SYSTEMS / RETRIES / AUDIT`。
- Title：**Pick** `An agent earns trust after the model call.`；Alt `The workflow is the product.`；Alt `Automation stops at the approval line.`  
  选择理由：直接把差异化落在 model call 之后的工程环节。
- 内容：
  - Release Guardian 占 60%：一段可播放 recorded trace，默认展示 destructive schema scenario。
  - Triage Router、Privacy Preflight 作为两条 de-boxed product rows。
  - Ask Portfolio 就地提供输入框与 3 个建议问题，不跳页。
  - 中文另起 narrative block，不在 English label 内拼接。

### 02 — Frontier Forge｜Ink navy

- Eyebrow：**Pick** `QWEN3.5-4B / VLLM / SAME-BOX A10`；Alt `SFT / SERVING / BOUNDED OVERLOAD`。
- Title：**Pick** `The model is only half the system.`；Alt `Quality moved. The boundary moved with it.`；Alt `Training ends where serving begins.`  
  选择理由：同时服务 AI Agent/LLM 与后端/系统两类 recruiter。
- 内容：release.json 驱动的 4 条 claim preview、training ladder mini-chart、5× overload 对照；入口只进站内 Evidence Explorer。
- 不展示尚未落地的 live inference；预留 `LIVE LAYER / NOT ACTIVE` hairline row，而不是 disabled 彩色卡。

### 03 — Backend and distributed systems｜Paper｜`#systems`

- Eyebrow：**Pick** `MYSQL CDC / KAFKA / FLINK / ICEBERG`；Alt `10 FAILURE CLASSES / 0 SNAPSHOT DIFFS`。
- Title：**Pick** `Break the pipeline. Reconcile the state.`；Alt `Recovery ends at zero diff.`；Alt `The happy path proves almost nothing.`  
  选择理由：第一条既是操作动作，也是 Exactly-Once Drills 的验证标准。
- 内容：双路径 DOM 架构、10 格 failure matrix、默认 broker-restart replay、`1,791 events/s` 与环境边界。

### 04 — Evaluation and data systems｜White

- Eyebrow：**Pick** `43.9M REVIEWS / 11,309 DOCS / PRE-REGISTERED TESTS`；Alt `RAG REGRESSION / RECSYS REGIME CONTRAST`。
- Title：**Pick** `The result changes when the regime changes.`；Alt `A benchmark needs a boundary.`；Alt `Null results still change the design.`  
  选择理由：统一 Crossover 与 RAG Quality Lab，而不把二者压成“数据项目”卡片。
- 内容：Crossover 的 Amazon null vs ML-32M `n*=20` 对照；RAG manifest-drift preview；两条均进入站内页面。

### 05 — Operating method｜Paper-alt

- Eyebrow：**Pick** `N / CI / COMMAND / SHA-256`；Alt `COST / NEGATIVE RUNS / REPRODUCTION`。
- Title：**Pick** `Every claim keeps its receipt.`；Alt `The failed run stays in the record.`；Alt `Evidence is part of the interface.`  
  选择理由：概括全站最稳定、最可信的人设。
- 内容：三个无卡片 finding：
  - number → n/CI → command → hash；
  - cost changes architecture；
  - negative results are retained。
- 用 hairline top rules，不沿用 Round-1 左侧朱砂粗条。

### 06 — Archive and contact｜Ink navy

- Eyebrow：**Pick** `DECISION WORKBENCHES / ARCHIVE`；Alt `ANALYTICS DEPTH / EARLIER SYSTEMS`。
- Title：**Pick** `Two more systems, kept in context.`；Alt `Breadth, without stealing the thesis.`；Alt `Earlier work. Same evidence discipline.`  
  选择理由：明确降权但不贬低项目。
- 内容：Margin Control Tower、Credit Policy Desk 两行；联系、简历、GitHub、更新时间作为同一 exhibit 的结尾。

### 10 项 tiering

- **Tier 0 — Flagship**：Frontier Forge。
- **Tier 1 — Priority products**：Release Guardian、Triage Router、Privacy Preflight、Exactly-Once Drills。
- **Tier 2 — Supporting systems**：Crossover Study、RAG Quality Lab、Ask Portfolio。
- **Archive**：Margin Control Tower、Credit Policy Desk。
- 首页不再出现 2×2 card grid；Tier 只是编辑权重，不渲染成徽章或筛选器。

---

## C. Per-project exhibit scripts

### Frontier Forge

**前 10 秒**

- 首屏左侧是项目 assertion；右侧直接是 `Evidence Explorer` 的 4 个维度筛选。Recruiter 点击 `GATEWAY`，立即看到 3×/5× overload、n、HTTP counts、SHA，而不是先读背景报告。
- “Wake the model”只保留窄状态行和接口边界；Evidence Explorer 永远是核心。

**Exhibit sequence**

- `00` Eyebrow：**Pick** `RELEASE.JSON / CLAIM REGISTRY`；Alt `TRAINING / INFERENCE / GATEWAY / ELASTICITY`。Title：**Pick** `Inspect the claim before the story.`；Alt `Every number opens to a receipt.`。选择理由：先建立可用产品，再开始叙述。
- `01` Eyebrow：**Pick** `1,450 → 20,000 RULE LABELS`；Alt `FROZEN EVAL / N=2,000 / SEED 0`。Title：**Pick** `Free labels moved the frontier.`；Alt `Scaling the data beat changing the objective.`。选择理由：准确承载主要正结果。
- `02` Eyebrow：**Pick** `0.25–4.00 QPS / NATIVE MTP`；Alt `4 QPS / BF16 / GPTQ-INT4`。Title：**Pick** `Serving is a boundary, not a badge.`；Alt `The fastest variant depends on load.`。选择理由：沿用 reference 中最强且有数据支撑的断言。
- `03` Eyebrow：**Pick** `SAME-BOX A10 / 120 S PER CELL`；Alt `2× / 3× / 5× SUSTAINED OVERLOAD`。Title：**Pick** `Reject the work before it becomes a crash.`；Alt `A bounded queue changes the failure mode.`。选择理由：把 C++ gateway 讲成 backend product。
- `04` Eyebrow：**Pick** `1→3→1 / GPU COLD START`；Alt `ELASTICITY / OPTIONAL LIVE LAYER`。Title：**Pick** `Scale-to-zero has a human-visible cost.`；Alt `Live inference may wake later.`。选择理由：给未来 live layer 留接口，同时保留冷启动边界。
- `05` Eyebrow：**Pick** `SOURCE MANIFEST / EXPORT HASHES`；Alt `NEGATIVE RUNS / REPRODUCTION`。Title：**Pick** `The release includes what did not work.`；Alt `One chain from raw run to public claim.`。选择理由：用负结果收束，不用 marketing CTA 收束。

**Data**

- 核心：`/Users/hsiangkuochang/frontier-forge/demo/data/release.json`；当前大小 `29,330 bytes`。
- Overload 原始 receipt：`/Users/hsiangkuochang/frontier-forge/results/phase7_1/raw/phase7_1_sustained_gateway_bench.json`。
- GPU ledgers：
  - `results/phase7_1/gpu_ledger.jsonl`
  - `results/phase7_2/gpu_ledger.jsonl`
- 站内现有 hash-gated copies：
  - `public/case-studies/frontier-forge/release.json`
  - `public/case-studies/frontier-forge/manifest.json`
  - `public/case-studies/frontier-forge/phase7_1_sustained_gateway_bench.json`
- 复用现有 `EvidenceExplorer`、`OverloadReplay`，但去掉 table-card 外壳，改为 exhibit-native sections。

**Weight / degradation**

- `release.json` server-import/pre-render；筛选器仅小型 client island。
- Overload JSON 进入 `03` 时 lazy fetch；不用 Recharts。
- Live layer 单独 dynamic import，只有点击 `WAKE MODEL` 才加载及联网。
- JS disabled：全部 claim rows、training ladder、最高负载 counts 静态可读；slider 退化成 2×/3×/5× 三张 anchor table。

---

### Release Guardian

**前 10 秒**

- 默认选中一个 destructive schema scenario；点击 `RUN RECORDED TRACE`，13-node strip 逐步推进，四路 evidence collector 并行出现，随后 validator、approval、publish 分支可见。
- 必须标注 `RECORDED / DETERMINISTIC STUB`，不能把 replay 冒充 funded live run。

**Exhibit sequence**

- `00` Eyebrow：**Pick** `13 NODES / 4 COLLECTORS / RECORDED STUB`；Alt `LANGGRAPH TRACE / APPROVAL PAUSE`。Title：**Pick** `Run the release gate before reading about it.`；Alt `Watch the decision assemble itself.`。选择理由：满足 product-first。
- `01` Eyebrow：**Pick** `CODE / SCHEMA / API / RUNBOOK`；Alt `PARALLEL EVIDENCE COLLECTION`。Title：**Pick** `Evidence arrives from four different failures of memory.`；Alt `One change, four evidence paths.`。选择理由：强调 collector 的职责差异，不误称四路 RAG。
- `02` Eyebrow：**Pick** `BOUNDED RETRY / DETERMINISTIC VALIDATORS`；Alt `CITATION / RISK FLOOR / PLAN CHECKS`。Title：**Pick** `The model may retry. The rule does not move.`；Alt `Validation owns the last machine decision.`。选择理由：突出工程 guardrail。
- `03` Eyebrow：**Pick** `HUMAN APPROVAL / HASH-CHAINED AUDIT`；Alt `PROCESS KILL / RESUMABLE STATE`。Title：**Pick** `Approval survives the process that asked for it.`；Alt `A pause is part of the graph.`。选择理由：这是最像真实平台能力的产品差异。
- `04` Eyebrow：**Pick** `DOCKER INSTALL / MCP TOOLS`；Alt `CLAUDE CODE / CURSOR / LOCAL STUB`。Title：**Pick** `Bring the gate to the developer.`；Alt `The agent belongs in the release workflow.`。选择理由：把新 MCP packaging 放在使用场景，而非技术清单。
- `05` Eyebrow：**Pick** `44 SCENARIOS / 132 GRAPH RUNS`；Alt `AGGREGATE GATES / STRICT FAILURES`。Title：**Pick** `Aggregate pass does not erase 30 strict failures.`；Alt `The green gate keeps its denominator.`。选择理由：保留最重要的披露边界。

**Data**

- Scenario library：`/Users/hsiangkuochang/release_guardian/mockworld/data/scenarios/scenarios.json`，真实为 object 内 `44` 个 scenarios。
- 13-node topology：`agent/src/release_guardian/graph/build.py`。
- 当前 deterministic eval：`eval/results/latest.json`，文件明确标为 `llm_mode: "stub"`、44 scenarios、132 runs。
- Mockworld hash manifest：`mockworld/data/MANIFEST.json`。
- Approval/audit source：
  - `agent/src/release_guardian/graph/nodes/approval_gate.py`
  - `services/approval-audit/.../audit/HashChain.java`
- 站内已有 replay fixture：`public/case-studies/release-guardian/replay/synthetic-scenarios.json`；只能当 presentation fixture。
- **缺口**：repo 当前没有 exported recorded trace JSON。新增生成物应明确落为 `release_guardian/exhibits/recorded-stub-runs.json`，由真实 stub execution export，禁止手写节点时序。
- **另一缺口**：repo 中没有 MCP 文件；MCP server 是新 deliverable。
- **Docker 差异**：当前 `docker-compose.yml` 只含 Postgres 与 Phoenix，`make up` 不是完整六服务安装。新的 one-command packaging 必须新增完整 Compose profile，再宣传“一条命令”。

**Weight / degradation**

- 首屏只载入一个已导出的 trace，其他 43 个 scenario 点击后 fetch。
- 13-node graph 用 CSS grid/lines，不引入 React Flow。
- MCP 文档、tool schemas 静态渲染；不在浏览器运行 MCP。
- JS disabled：默认 trace 展开成 ordered ledger，四 collector 显示为并列 `<ol>`；approval 分支显示为静态状态机。

---

### Triage Router

**前 10 秒**

- 首屏是一体化 `Routing Workbench`：
  - 选择一条 recorded complaint；
  - 调整 `MISROUTE COST / HUMAN COST / CONFIDENCE`;
  - 即刻看到 `A → B2` path、expected cost 与 recorded label。
- `RUN YOUR OWN TEXT LOCALLY` 是第二步，明确显示下载量后才加载模型。

**Exhibit sequence**

- `00` Eyebrow：**Pick** `A→B2 / COST-AWARE ROUTING`；Alt `CONFIDENCE / ESCALATION / HUMAN COST`。Title：**Pick** `Route the complaint before choosing the model.`；Alt `The expensive model is not the default.`。选择理由：先让 recruiter 使用路由决策。
- `01` Eyebrow：**Pick** `MACRO-F1 / COST PER 1K`；Alt `12 FRONTIER POINTS / 95% CI`。Title：**Pick** `Accuracy and cost share the same axis.`；Alt `The frontier is a decision surface.`。选择理由：直接产品化 Pareto 数据。
- `02` Eyebrow：**Pick** `2015–2026 / CFPB DRIFT`；Alt `CLASS MIX / WITHIN-CLASS DECAY`。Title：**Pick** `Drift changed which tier earned its price.`；Alt `The class mix moved before the vocabulary did.`。选择理由：避免泛泛讲“模型抗漂移”。
- `03` Eyebrow：**Pick** `256 THRESHOLDS / CALIBRATION ONLY`；Alt `MISROUTE COST / HUMAN QUEUE`。Title：**Pick** `A threshold is a policy, not a score.`；Alt `Change the cost, then watch the route move.`。选择理由：把 slider 变成真实 policy workbench。
- `04` Eyebrow：**Pick** `INT8 ONNX / BROWSER-LOCAL`；Alt `DISTILBERT / WASM / NO API CALL`。Title：**Pick** `Run the trained tier on this device.`；Alt `Local inference, with its payload disclosed.`。选择理由：诚实暴露产品成本。
- `05` Eyebrow：**Pick** `RUN IDS / APPEND-ONLY LOG`；Alt `27/27 OUTPUTS / REPRODUCTION`。Title：**Pick** `Every routed number opens to its run.`；Alt `The demo ends at the receipt.`。选择理由：把 report 移到产品之后。

**Data**

- Narrative/number registry：`/Users/hsiangkuochang/nlp-eval-lab/demo/data/case_study.json`
- Pareto：`demo/data/frontier.json`
- Drift：`demo/data/drift.json`
- Threshold/cost policy：`demo/data/policies.json`
- Recorded samples：`demo/data/samples.json`
- Receipts：`demo/data/receipts.json`、`demo/data/runs_index.json`
- Tier A engine：`demo/live/tier_a/tier_a_live.json`，当前 `19,255,406 bytes`。
- Tier B2：
  - `demo/live/tier_b2/model.int8.onnx`：`67,575,183 bytes`
  - `demo/live/tier_b2/tokenizer.json`：`711,494 bytes`
  - `demo/vendor/ort/ort-wasm-simd-threaded.wasm`：`13,479,978 bytes`
- Runtime implementation：`demo/assets/live.js`；其中 `loadTierB2()` 已有 progress fetch 与 `InferenceSession.create()`。
- 删除 `projects.ts` 中 Triage Router 的 GitHub Pages `Live demo` 链接；站内页面成为唯一 demo。

**Weight / degradation**

- `frontier.json`、`policies.json` 首屏按需裁剪到一个 generated compact payload；完整 receipt drawer 再 fetch。
- 19.3MB Tier A 和约 81.8MB Tier B2 runtime 都不得自动加载。按钮写明实际 bytes；缓存成功后显示 `CACHED ON THIS DEVICE`。
- 首屏 recorded sample/policy workbench必须无需模型权重即可操作。
- JS disabled 或 WASM 不可用：保留 sample replay、policy simulator、drift tables；自定义输入区显示 `LOCAL MODEL UNAVAILABLE`，不伪造 prediction。
- `drift.json` 确有一个明确 pending 的 Tier B1 yearly series，必须原样显示为未测量。

---

### Privacy Preflight

**前 10 秒**

- 保持当前产品 bar：首屏直接预填 synthetic text；点击 `SCAN`，选择实体，再 `PREVIEW REDACTION`。Image/PDF 是同一工作台的 tabs，不先展示项目介绍。

**Exhibit sequence**

- `00` Eyebrow：**Pick** `BROWSER-LOCAL / NO UPLOAD`；Alt `TEXT / IMAGE / PDF`。Title：**Pick** `Remove the data, then prove it is gone.`；Alt `A black box is not redaction.`。选择理由：第一条更完整地覆盖产品闭环。
- `01` Eyebrow：**Pick** `DETECT / REVIEW / DESTROY`；Alt `EDITABLE REGIONS / PIXEL BURN-IN`。Title：**Pick** `Detection proposes. The reviewer decides.`；Alt `Every region stays editable.`。选择理由：明确 human-in-the-loop。
- `02` Eyebrow：**Pick** `7 FIXTURES / 19 OF 19 HITS / 2 FP`；Alt `ENGLISH / SIMPLIFIED CHINESE OCR`。Title：**Pick** `Perfect recall still produced two wrong boxes.`；Alt `The benchmark explains the review step.`。选择理由：负结果直接解释产品设计。
- `03` Eyebrow：**Pick** `REOPEN / VERIFY / BLOCK EXPORT`；Alt `HASH / TEXT LAYER / ANNOTATIONS`。Title：**Pick** `Export is earned by a second read.`；Alt `The output must pass its own inspection.`。选择理由：抓住 fail-closed 核心。
- `04` Eyebrow：**Pick** `96 WORKER TESTS / 67 BROWSER CASES`；Alt `SYNTHETIC FIXTURES / CLAIM BOUNDARY`。Title：**Pick** `Local does not mean infallible.`；Alt `The browser boundary stays explicit.`。选择理由：避免把 local-only 等同于法律级安全。

**Data**

- 当前真实站内 sources：
  - `public/case-studies/privacy-preflight/ocr-fixture-benchmark.json`
  - `worker-tests-goal-candidate.json`
  - `goal-candidate-e2e.json`
  - `browser-e2e-checkpoint.json`
  - `image-redaction-result.json`
  - `pdf-redaction-result.json`
  - `text-redaction-result.json`
  - `manifest.json`
- 复用 `PrivacyPreflightLab`、`PrivacyTextLab`、`PrivacyImageLab`、`PrivacyPdfLab`，只改变其在页面的位置与 exhibition chrome。

**Weight / degradation**

- Text workspace 首屏可交互；OCR、PDF.js、Tesseract workers 只在选择 Image/PDF 或点击 OCR 后加载。
- 每个重型动作显示 local processing 与 progress，不显示虚假的 spinning “AI” 状态。
- Worker 失败时保留 manual rectangle/redaction path；export verifier 失败必须 block，不能自动降级为未验证下载。
- 无 JS 页面提供 workflow、benchmark 和 downloadable verified fixture，但不提供伪工作台。

---

### Exactly-Once Drills

**前 10 秒**

- 默认打开 `broker-restart`：点击 `INDUCE FAILURE` 后回放 Kafka restart、lag peak、recovery、最终 snapshot diff；可立刻切换 10 个 failure classes。

**Exhibit sequence**

- `00` Eyebrow：**Pick** `10 FAILURES / 0 SNAPSHOT DIFFS`；Alt `RECORDED RECOVERY CONSOLE`。Title：**Pick** `Choose a failure. Watch the state return.`；Alt `Break the pipeline on purpose.`。选择理由：明确首屏行为。
- `01` Eyebrow：**Pick** `PATH A / PATH B / ROW-LEVEL PARITY`；Alt `MYSQL CDC / DEBEZIUM / AVRO / KAFKA`。Title：**Pick** `Two delivery paths must land on the same state.`；Alt `Different offsets. One reconciled table.`。选择理由：承载 co-pillar 的架构深度。
- `02` Eyebrow：**Pick** `CHECKPOINT / BROKER / OFFSET / DLQ`；Alt `FIVE FLINK + FIVE KAFKA DRILLS`。Title：**Pick** `Recovery has ten different failure shapes.`；Alt `Zero diff came back ten different ways.`。选择理由：避免把十类故障压成一个 headline。
- `03` Eyebrow：**Pick** `1,791 EVENTS/S / LAG 75,000`；Alt `FRESHNESS P95 20,614 MS`。Title：**Pick** `Throughput keeps the recovery cost visible.`；Alt `The SLO includes the queue that had to drain.`。选择理由：补足性能而不掩盖 lag/freshness。
- `04` Eyebrow：**Pick** `RUN ID / COMMAND / STACK VERSIONS`；Alt `CHECKPOINT / OFFSET / SNAPSHOT LINKAGE`。Title：**Pick** `Exactly-once ends at reconciliation.`；Alt `The receipt joins source, offset, and snapshot.`。选择理由：给 exactly-once 一个可核验定义。

**Data**

- 五个 Flink failures：`showcase/results/eo_reconciliation.json`，其中实际列出 `task-crash`、`checkpoint-restore`、`jobmanager-restart`、`savepoint-restore`、`sink-commit-fault`。
- 五个 broker failures：
  - `broker_restart_drill.json`
  - `duplicate_redelivery_drill.json`
  - `ordering_miskey_drill.json`
  - `offset_replay_drill.json`
  - `poison_dlq_drill.json`
- 双路径：`showcase/results/broker_parity.json`
- SLO/lag：`showcase/results/broker_slo.json`
- Schema：`showcase/results/schema_contract_drill.json`
- 双路径 SVG：`showcase/media/phase-b1-path-a-b.svg`
- 站内已有相同 result copies 位于 `public/case-studies/exactly-once-drills/results/`。

**Weight / degradation**

- 默认 failure JSON 预载；其余 9 个点击后加载。
- lag chart 用 SVG/DOM，不引入 Recharts。
- 低端设备关闭逐帧动画，直接用 stage buttons 切换。
- 无 JS：10 行 reconciliation table、双路径 SVG、SLO summary 完整显示；“replay”退化为 ordered event ledger。

### Lighter-touch pages

- **Crossover Study**
  - 首屏保留 crossover explorer；第二展品 shopper trajectory；第三展品 DQ/lineage；可选 SQL Workbench 仅在点击后载 DuckDB。
  - 实际 demo 当前不是任务所述 6 surface：`index.html` 列出 crossover、regime map、regime contrast、shopper、semantic search、DQ、lineage、receipts 共 8 个；Round-2 只选与论点相关的 4 组。
  - 真实 sources：`demo/data/crossover.json`、`contrast.json`、`phase8.json`、`shoppers.json`、`dq.json`、`lineage.json`、`timetravel.json`、`receipts.json`。
  - repo 当前没有可供 SQL workbench 使用的 warehouse Parquet，只看到 test fixtures；必须先生成 hash-gated curated slice，不能拿 `3.44MB trace_manifest.json` 当数据库。
  - 删除外部 semantic-search/demo 入口；79MB 类 embedding 功能不移植。
- **RAG Quality Lab**
  - 首屏直接打开 `Manifest Drift Lab`：编辑一段受控文档，运行 deterministic comparison，看到 4/12 degradation。
  - 后续才展示 11,309-document corpus 的 integrity boundary、quality/latency trade-off 与 receipts。
- **Ask Portfolio**
  - 首页 exhibit 和固定 `ASK` 入口就是产品；提供 recruiter-oriented starter prompts、citation links、rate-limit state。
  - 不新建项目详情页；assistant failure 时显示静态 suggested routes，不伪造 LLM response。
- **Margin Control Tower / Credit Policy Desk**
  - 保留两个 archive URLs，各自仍以可操作 workbench 开屏，但 rail、exhibit title、finding rules 与主项目一致。
  - DuckDB 只在进入 workbench 或点击 `LOAD VERIFIED DATA` 后加载；archive 不进入 homepage initial JS。
  - 两页各控制在 4 个 exhibits：workbench、decision boundary、negative finding、receipts。

---

## D. Accent/semantic color migration plan

### Tokens

```css
--accent: #9d2b26;
--accent-hover: #b9463e;
--accent-on-dark: #e5a39c;

--danger: #a64033;
--danger-on-dark: #e28d82;

--negative-label: #6d554f;
--negative-rule: rgba(109, 85, 79, .48);

--pass: #2f6b52;
--pass-on-dark: #91c2aa;

--ink: #14202c;
--ink-invert: #0f2236;
--paper: #f5f1e8;
--paper-bright: #fffdf8;
--muted: #5a6472;
```

### 使用纪律

- **Cinnabar accent**
  - 只表示作者选择与视觉焦点：hero 第二行 italic、active rail number、文本链接、focus underline、primary text CTA。
  - 不表示 success、error、negative result。
  - 不铺大面积底色，不做红色卡片。
- **Danger red**
  - 只用于当前不可继续或真实失败状态：`BLOCKED`、`FAILED`、`UNSAFE TO EXPORT`、budget fuse。
  - 必须同时带 mono 状态词与 `2px` top rule；不能只靠颜色。
- **Negative finding**
  - 表示实验负结果或被推翻假设，不等于系统故障。
  - 正文仍用 ink；`NEGATIVE FINDING` label 使用 `--negative-label`，配 `1px` hairline top rule。
  - 禁止沿用当前 `.negative-finding { border-left:3px solid var(--accent) }`，否则品牌强调、实验负结果、错误状态无法区分。
- **Pass green**
  - 仅用于 `PASS`、`VERIFIED`、`HASH MATCH`、`0 DIFF CONFIRMED`。
  - 不用于普通增长、chart series、hover 或装饰。
- **Charts**
  - series identity 继续使用 Okabe–Ito palette；结论用 `WIN/LOSE/PASS/BLOCKED` 文本和 line pattern，不把 cinnabar/green 当普通 series。
- **Dark exhibits**
  - `#9d2b26` 不直接承担小字；使用 `--accent-on-dark`，但 token identity和使用规则不变。
- Human Gate：Mac、Windows、iPhone 真机同时检查；补 WCAG contrast snapshot test。近邻色的主要区分来自语义词、线型和位置，不靠人为放大 hue 差异。

---

## E. Execution phasing with human gates

### Phase 0 — Evidence freeze

- 为五个 priority projects 建 source→public manifest map；记录 source path、SHA-256、schema、生成命令。
- 先修正已发现的 asset discrepancies：Crossover surface 数量、Release Guardian incomplete Docker/MCP、Triage pending series。
- Gate：**digit audit**。逐项对照 source JSON；禁止从 Round-1 copy 手工抄数字。

### Phase 1 — Shell、rail、routes

- RootLayout 去 top header/footer；建立单实例 `ExhibitionShell`、desktop/tablet/mobile rail。
- 加 track/legacy redirects、canonical、route/link tests。
- 保持旧项目 URL，避免同时做视觉和 URL migration。
- Gate：1440×900、1024×768、390×844、iPhone WebKit rail 截图确认。

### Phase 2 — Homepage

- 先做 00–06 full-bleed structure，再接项目数据；彻底删除 `.page-shell 1180px` 作为全局上限、2×2 card grid、icon CTA。
- Gate：**device-color check**；确认 cinnabar 不像 error，danger/pass 在 paper 和 ink 上均可辨。

### Phase 3 — Priority product pages

- 顺序：
  1. Frontier Forge + Exactly-Once Drills：现有数据最完整，先验证通用 exhibit primitives。
  2. Privacy Preflight：搬首屏位置，尽量不重写已验证 processing logic。
  3. Triage Router：先 recorded policy workbench，再接 explicit weight loading。
  4. Release Guardian：最后接新 trace exporter、full Docker profile、MCP；三者设独立 gates。
- 每页完成后立即跑该 route 的 en/zh、no-JS、a11y、overflow 与 evidence tests。

### Phase 4 — Supporting/archive

- Crossover、RAG、两个 archive 共享 rail/section-head/findings；交互不共享业务 state。
- Ask Portfolio 只调整 homepage exhibit 与 launcher fabric。
- Gate：**zh-copy reading pass**。由非撰写者朗读中文 narrative；UI fabric 保持 English，不做 inline EN+ZH glue。

### Phase 5 — Release gate

- 顺序固定：`typecheck → lint → verify:evidence → build → per-route budget → Playwright matrix → Lighthouse → link/redirect audit`。
- 重新生成 assistant knowledge/search aliases，确认 killed track URLs 不再进入建议结果。
- 不把 local pass、Preview、Production、custom-domain freshness 合并为一个“已发布”声明。

### 可并行工作

- Rail/layout 与 evidence adapters 可并行，但项目页面必须等 rail API 稳定。
- 独立 lanes：
  - shell/routes/SEO；
  - source adapters/manifests；
  - Frontier + Exactly-Once；
  - Privacy + Triage；
  - Release Guardian exporter/Docker/MCP。
- 合流点只有三个：`ExhibitionShell` contract、semantic tokens、generated evidence schema。

### Concrete JS budget policy

| 页面类型 | Initial total JS | Route-owned initial JS | 重型 runtime |
|---|---:|---:|---|
| Homepage | ≤180KB gzip | ≤50KB gzip | 禁止 |
| 普通项目页 | ≤200KB gzip | ≤70KB gzip | 禁止自动加载 |
| Priority product base | ≤200KB gzip | ≤80KB gzip | 只在明确点击后加载 |
| `/artifact` | ≤200KB gzip | ≤80KB gzip | 按文件类型加载 |

- 把现有 `verify-performance-budget.mjs` 从 homepage-only 扩为 route manifest matrix。
- ONNX、DuckDB、PDF.js、Tesseract workers 单独记入 `deferredAssetBytes`，不能因“不属于 JS chunk”而从报告消失。
- Triage 显式记录当前可选下载约 `19.3MB` Tier A 或 `81.8MB` Tier B2 runtime；DuckDB 当前 public payload约 `43.1MB raw`。
- Playwright 新增：
  - initial request 中不得出现 ONNX/DuckDB/OCR worker；
  - 点击后只加载选中的 runtime；
  - no-JS 内容完整；
  - rail 只有一个；
  - 所有项目第一 viewport 内存在可操作 product control；
  - `prefers-reduced-motion` 不自动播放 replay。

---

## F. Top 10 risks with concrete mitigations

1. **Rail 与 Next.js layout nesting 产生双 rail**
   - RootLayout 不渲染 shell；首页、项目模板、artifact template 各自只实例化一次。Playwright 断言 `[data-exhibition-rail]` count 恒为 1。

2. **ONNX 在中国网络上首开过慢**
   - 不自动下载；首屏先提供 compact recorded policy workbench。显示精确 bytes、progress、cancel、cache status；失败后继续使用 recorded data，不切换到远程 API。

3. **DuckDB-WASM payload 侵入首页或非数据页**
   - dynamic import + click gate；网络测试断言 homepage、priority non-SQL pages 不请求 DuckDB。Crossover 没有 hash-gated Parquet 前不发布 SQL tab。

4. **Windows serif fallback 破坏 7rem headline**
   - English：Iowan → Baskerville → Georgia；zh：Songti SC → Noto Serif CJK SC → SimSun。对 Georgia/SimSun 单独做 1366px screenshot；用 `text-wrap:balance`、受控两行和 `overflow-wrap`，不依赖某一字体 metrics。

5. **删除 track routes 造成 SEO、简历与旧链接损失**
   - 308 redirects、self-canonical 项目页、更新 sitemap/assistant/search aliases；上线前抓取所有内部 href，保留 redirect regression tests。

6. **Release Guardian MCP scope creep**
   - v1 只暴露 3 个 read/assess tools：`assess_change`、`get_run`、`list_scenarios`；默认 deterministic stub，不含 deploy、approve、write 工具。MCP packaging、full Docker install、site replay 分三份验收。

7. **Frontier live inference layer引入安全与成本风险**
   - Evidence Explorer 永远可独立工作；live endpoint 采用固定 task schema、input/output caps、per-IP rate limit、daily fuse、no prompt freedom、no visitor-input logging。安全 gate 未过时 UI 只显示 `NOT ACTIVE`。

8. **数据复制后数字或 schema 漂移**
   - 所有 public payload 由 source adapter 生成并附 hash；build 时验证 schema、source SHA、headline digits。页面组件不得硬编码 benchmark number。

9. **English UI 与中文 narrative 在 rail/移动端互相污染**
   - labels、nav、units、status 固定 English；中文只进入独立 narrative container。语言切换不改 DOM ordering，避免两套 rail 和 hydration drift。

10. **结构改版打破现有 Playwright、a11y 与性能门**
   - 不保留失效 selector 来“骗绿”；每个 phase 同步把测试改成语义契约：route、exhibit order、product control、receipt、no overflow、no console error、axe。先让单页矩阵绿，再合并全站；重型页面继续单 worker，避免 DuckDB/PDF/OCR teardown race。


