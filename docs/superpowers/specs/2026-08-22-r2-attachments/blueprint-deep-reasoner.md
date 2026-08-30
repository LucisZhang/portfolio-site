已读完参考稿（index.html / styles.css / app.js）、现站的 `globals.css` / `page.tsx` / `layout.tsx` / 项目页模板 / `projects.ts` / perf 与 Playwright 基建、round-1 spec，以及五个源仓库的实际资产。以下是 ROUND-2 蓝图。

---

# ROUND-2 蓝图：xiangguozhang.com「展陈语法」重建

## 0. 三条前置判断（先说清楚，后面全部依赖它）

**判断一：round-1 失败的根因不是 token，是"容器"。** `page-shell { width: min(1180px) }` 这一行，把所有 token 关进了一个居中的报告框。参考稿的力量来自 **full-bleed 分区 + 每元素自己的 measure**（`section-head p { max-width: 760px }`），不是来自颜色。Round 2 的第一个不可协商动作：删除 `.page-shell` 作为布局容器，测宽下沉到元素级。

**判断二：参考稿的 hero 语法（94vh 居中大字）和"产品先行"是冲突的。** 参考稿是单项目 landing，94vh 纯声明 hero 成立。项目页若照抄，recruiter 第一屏只能读字，不能动手 —— 这直接违反 mandate #2。**我对参考语法做一处明确改写**：项目页 hero 降为 `min(680px, 78vh)`，`≥1180px` 时分两栏，左栏 = eyebrow + 巨衬线断言 + 一段话，右栏 = **仪器的冷启动面板**。首页 hero 保留参考稿的 94vh 单栏原样。这是本蓝图唯一一处偏离参考稿的结构性决定，理由与代价写在 C.0。

**判断三：本轮真正的技术风险不在设计，在字节。** ONNX int8 64 MB + ORT 13 MB、DuckDB-WASM 41 MB、privacy 资产 50 MB，全部要"不外链、留在站内"，而 CSP 是 `connect-src 'self'`（必须同源）。字节预算策略（E.3）和风险 2/3/11 是本蓝图里最容易被执行阶段忽略、也最容易翻车的部分。

---

# A. Site IA

## A.1 路由存亡

| 路由 | 处置 | 理由 |
|---|---|---|
| `/` | **重写**为展陈长卷（B 节） | 首页吸收 track 页的全部导航职能 |
| `/ai` `/engineering` `/analytics` | **作为页面死亡**，改为 308 → `/`；track 的 thesis 文案迁入首页 03 号展品 | 3 个 track 各挂 2–4 个项目，做成页面就是 2–4 张卡的列表 —— 这正是"PPT 感"的来源。rail 已经列出全部 10 个项目，track 页没有剩余工作 |
| `/[track]/[project]` ×10 | **URL 原样保留**，页面全部重建为「标准卷」 | 见下 |
| `/analytics/analytics-tandem` | 原样保留 noindex 迁移页，仅换壳 | 已有 `robots: {index:false}` |
| `/artifact` | 保留，套 rail 壳，rail 内容 = 返回来源页 | 工具页，不进展陈序列 |

**关键决定：`[track]` 作为 URL 段保留，作为页面废除。** 我拒绝了扁平化到 `/work/[project]` 或 `/[project]`。理由：10 条项目 URL 已被索引，且 `src/data/portfolio-search-aliases.generated.json`、`assistant-knowledge.generated.json`、274 条 Playwright、`check-links.mjs` 全部硬引用这些路径。为了 URL 好看而触发一次全站重定向 + 三套生成物再生成，收益不抵风险。`/ai/frontier-forge` 这个 URL 本身读起来没问题。

**什么会推翻这个决定：** 如果用户希望针对"数据工程 校招 portfolio"这类词做 topical landing（track 页是唯一的落点），那 track 页应该活下来，但必须重做成**展品页而不是列表页**（例：`/engineering` = "我怎么把管道弄坏" 的完整展陈，项目只是证据）。这是一次真实的取舍，我按"删"给方案，但这是本节唯一一处我认为用户可能有不同意见的地方。

## A.2 Rail 模型：双态，不是一态

```
RootLayout   → 只留 <html>/字体/LanguageProvider/AssistantLauncher/skip-link
             → 顶部 nav 整体删除（site-header 消失）
Page         → <ExhibitShell rail={…}>{exhibits}</ExhibitShell>
```

**rail 不能放进 root layout。** 因为 rail 内容随路由变化，而 root layout 拿不到 route params（除非上 client hook 读 pathname，那会把整个 shell 变成 client boundary 并拖垮首页 JS 预算）。正确做法是 rail 作为 **prop 由每个 page 传入**，`ExhibitShell` 是 server component，只有 scroll-spy 那一小块是 client island。

| | 首页 rail | 项目页 rail | /artifact rail |
|---|---|---|---|
| Wordmark | 堆叠衬线 `Xiangguo`/`Zhang`，上方 mono `XGZ` | 堆叠衬线项目英文名（两行折） | `XGZ` |
| rail-copy | 一句定位（≤2 行，muted） | 该项目的 zh gloss（≤20 字） | — |
| nav | 展品序列 01–06（= 站点地图） | **该项目的展品序列 01–0N** | — |
| 底部 | `← ` 无；改为 `INDEX` / `EN·中` / `SEARCH ⌘K` 三行 mono | `← ALL WORK` 单行 mono，其上一条发丝线 | `← BACK` |

- rail 底部承接被删掉的 site-header 三件事：command palette 入口、语言开关、联系入口。全部 mono uppercase 英文（UI fabric 规则）。
- rail nav 的右对齐 mono 数字（参考稿 `span { order: 2 }`）**保留**，这是该语法最有辨识度的细节。
- scroll-spy：`IntersectionObserver` 监听 `[data-exhibit]`，给当前项加 `aria-current="true"`；`rootMargin: "-45% 0px -45% 0px"`。JS 失效时 rail 仍是可用的锚点列表 —— **不能**用 JS 生成 rail。

## A.3 Rail 的响应式（参考稿在这里是错的，必须改）

参考稿 `@media (max-width:650px) { .rail nav { display: none } }` —— 手机上直接把导航删了。单项目 landing 可以，10 个项目的站不行（校招 recruiter 有相当比例在手机上打开）。

| 断点 | 行为 |
|---|---|
| ≥1180px | `position: fixed` 260px 墨蓝 rail，`main { margin-left: 260px }` |
| 980–1180px | rail 收窄到 208px；`rail-copy` 隐藏，wordmark 与 nav 保留 |
| <980px | rail 变**吸顶条**，48px 高：左 wordmark，右 `INDEX 03/06` 的 mono 读数 + `<details>` 触发的整屏墨蓝索引面板 |

`<details>/<summary>` 是刻意选择：**零 JS 的移动端导航**，无 JS 时依然可展开，且不需要图标（`INDEX` 是词，不是汉堡图标，符合"零 icon"约束）。`03/06` 的当前编号由 scroll-spy 更新，无 JS 时降级为静态 `INDEX`。

## A.4 URL / SEO / 重定向

1. `next.config.ts` `redirects()` 追加三条 `permanent: true`：`/ai`→`/`、`/engineering`→`/`、`/analytics`→`/`。不要重定向到 `/#anchor`（爬虫会归并到 `/`，那正是想要的效果，但写 fragment 只会让人误以为有语义）。
2. **新增 `src/app/sitemap.ts`**（现在只有 `robots.txt`，没有 sitemap）。列出 `/` + 10 条项目页 + `/artifact`，排除 analytics-tandem。这是"删了 3 个页面"之后必须补的对冲。
3. 三条 track thesis（`projects.ts` 里的现成文案）迁到首页展品 02/03 的 intro 段，保证 "AI 应用 / 数据工程 / 数据分析" 三组主题词不因删页而从首页正文消失。
4. 再生成三份产物：`generate:search-aliases`、`build:assistant-knowledge`、`check:links`。**这三条必须进 R5 的 DoD**，否则 command palette 会跳 404。
5. i18n 是客户端切换（`html[lang]` 翻转，单 URL），无 `/zh` 路由 —— 本轮不动，SEO 面上没有额外工作。

---

# B. 首页展陈脚本

## B.0 个人断言标题（hero）

要求：personal，非项目；两行；第二行 `<em>` 朱砂斜体；对标 "Know the frontier. / *Then forge past it.*" 的能量。

| # | 候选 | 支撑事实 | 我的评价 |
|---|---|---|---|
| **A** | `I don't cite benchmarks.` / *`I pay for them.`* | 全站数字来自自费实测（$35.68 账单、RTX 4090 小时数、GPU ledger jsonl） | **首选。** 独特、有攻击性、且字面为真。校招生里几乎没人能说这句 |
| **B** | `Anyone can call the model.` / *`I own the stack under it.`* | 双柱定位的直接表达（C++20 网关 / Kafka+Flink / k3s / Go 网关） | 最贴 JD 双池（Agent 65% 大模型 + Backend 44.7% C++），但句式偏"宣言" |
| **C** | `Build the agent.` / *`Then break it.`* | 10 类故障演练、蒸馏 −14.2pp、GRPO CI 含零 | 最短最上口，但"break it"在中文语境的雇主耳朵里可能读成炫技 |

zh 版**不是翻译**，独立成稿，且**不做巨号衬线**（见风险 5）。zh hero 用 `clamp(2.2rem, 4vw, 3.4rem)` 黑体两行，候选留 G4 定夺。

kicker（mono uppercase，双语共用）：`AI AGENTS / LLM SERVING / SYSTEMS UNDER THEM`

hero 下方 4 格 `gap:1px` stat 棋盘（数据来自 `public/case-studies/frontier-forge/release.json`，构建期读取，非硬编码）：
`99.05% task success` · `$35.68 measured spend` · `0 upstream 5xx @ 3× overload` · `10 failure classes drilled`

## B.1 展品序列

| № | 底色 | eyebrow（mono uppercase，全部为事实性技术参数） | 断言标题候选（择一） | 内容 |
|---|---|---|---|---|
| — | paper | `AI AGENTS / LLM SERVING / SYSTEMS UNDER THEM` | 见 B.0 | 94vh hero + 4 格 stat 棋盘 + 一行 scope-note |
| **01** | **ink** | `QWEN3.5-4B / RTX 4090 / $35.68 MEASURED / SHA-256 GATED` | ① `The whole chain, and the bill.`<br>② `Know the frontier. Then forge past it.`（参考稿原句，可作 FF 项目页专用）<br>③ `A 4B model and every receipt behind it.` | 旗舰 Frontier Forge 独占一屏。左：断言 + zh gloss + 三句叙述（含一条朱砂 `NEGATIVE RESULT` 发丝线 finding）；右：**内嵌 3 行 claim chain 迷你件**（点击展开原始数字 + 命令 + SHA-256），不是静态 SVG。CTA 单条：`OPEN THE EVIDENCE EXPLORER →` |
| **02** | paper | `LANGGRAPH / KAFKA + FLINK / ONNX INT8 / ON-DEVICE OCR` | ① `Four things you can run right now.`<br>② `Not screenshots. Instruments.`<br>③ `Open one. It runs in this tab.` | 4 个核心项目。**不是 2×2 卡片网格** —— 全宽编号行，每行：`0N` + 英文名（衬线 2rem）+ zh gloss 行 + 一条 mono 指标 + **一枚内联微型仪器**（纯 DOM/CSS：RG=13 节点点阵、Triage=4 类分布条、Privacy=遮罩前后色块、EOD=10 格故障棋盘）。发丝线分隔，hover 整行左移 7px + 转朱砂 |
| **03** | white | `C++20 / GO / KAFKA · FLINK / K3S / POSTGRES + PGVECTOR` | ① `The model is the easy part.`<br>② `Everything under the API call.`<br>③ `I write the layer nobody demos.` | **副柱展品（后端/系统）**。纯 CSS 的"栈深度图"：横轴 = 层（Gateway / Serving / Stream / Storage / Orchestration），每层标出触及它的项目 + 一个实测数字。三条 track thesis 在此落地。这一屏是 Backend pool（C++ 44.7% / 数据库 30.8% / Linux 28.6% / 并发 21.9%）的关键词着陆点 |
| **04** | **ink** | `5 RUNS THAT DID NOT WORK` | ① `Five experiments that failed, kept on the page.`<br>② `The null results are part of the result.`<br>③ `What I could not make work.` | **人设签名展品。** 一张跨项目负结果表：蒸馏 −14.2 pp / GRPO 两 seed +0.25 且 CI 含零 + seed2 触发 zero-variance guard / RG 严格全试次 30-of-44 残差 / Crossover Amazon 臂 null / 结构化输出 one-pass 0% task success。每行：结论 + n + 处置 + 收据锚点。**参考稿没有这个展品，这是本站独有的一屏**，也是全站最强的差异化 |
| **05** | paper | `3 SECONDARY / 2 ARCHIVED` | ① `The rest of the shelf.`<br>② `Smaller instruments.` | 次级 3（Crossover Study / RAG Quality Lab / Ask Portfolio）+ 归档 2（Margin Control Tower / Credit Policy Desk）。单一发丝线表格，mono 指标右对齐，视觉权重明显低于 02。归档两行进一步降饱和（`--muted` 标题） |
| **06** | **ink** | `HOW THIS SITE IS BUILT AND CHECKED` | ① `One offline claim chain.`（参考稿原句，可复用）<br>② `Every number on this site has a path.`<br>③ `Ask it anything. It only cites files.` | 收据 + 联系。左：`<dl>` 收据表（release.json SHA / EOD manifest / privacy evidence manifest / 构建日期 / Playwright 与 perf 预算门禁），mono，`word-break: break-all`；右：**Ask Portfolio 内联输入框**（不再只是右下角浮标）+ 联系方式（GitHub / Email / 微信 / 简历），全部 mono 单行链接 |

背景节奏：`paper → ink → paper → white → ink → paper → ink`。三种底色都出场，深浅交替 3 次，符合"全站 ≥2 个反白分区"的 round-1 结论并加码。

## B.2 分层结论

沿用 `projects.ts` 现有 tier，**不重排**。唯一值得讨论的是：按 JD 信号（Backend 1,141 岗 vs Agent 638 岗），Exactly-Once Drills 的市场承载量高于 Triage Router。但 tier 已定且 02 号展品四项并列无先后视觉，收益不足以动它 —— 改在**排序**上体现：02 内顺序为 `Release Guardian → Exactly-Once Drills → Triage Router → Privacy Preflight`（Agent 主柱开头，系统副柱紧随）。

---

# C. 五个优先项目页的展陈脚本

## C.0 通用「标准卷」模板（FF 页即参考实现，其余全部照抄）

```
rail(项目展品 01–0N + ← ALL WORK)
├ HERO  paper, min(680px,78vh), ≥1180px 双栏
│  左：eyebrow / 衬线断言 clamp(2.6rem,5.5vw,5.4rem) / zh gloss / 一段话 / 3 格 stat 棋盘
│  右：仪器冷启动面板 ← 这是"10 秒内能动手"的落点
├ 01 仪器全尺寸（承接 hero 右栏的同一实例，不是第二份）
├ 02–04 该项目的分析展品（DOM/CSS 图表）
├ 05 [可选 live 层槽位]
├ 06 ink 收据（claim chain / hashes / 复现命令）
└ 报告层：Architecture → Results & negatives → Limitations → Links
```

三条硬规则：
1. **hero 右栏与 01 是同一个 React 组件的两种尺寸**（`variant="compact" | "full"`），不是两份实现，否则状态会分叉。`<1180px` 时 hero 右栏不渲染，01 上移即为首个可交互块。
2. **所有 finding 去框**：`border-top` 发丝线 + mono uppercase 标签，禁止有色底块（D 节）。现站的 `.negative-finding { border-left: 3px solid var(--accent) }` 要改为 `border-top`。
3. **禁止外链 demo**。`projects.ts` 中 triage-router 的 GitHub Pages `href` 必须删除；`links[]` 只保留 GitHub 仓库与技术报告。

---

## C.1 Frontier Forge（旗舰，标准卷参考实现）

**首屏动作（10 秒，不读字）：** hero 右栏 = **Claim Chain 迷你件**。3 行断言（`99.05% task success` / `0 upstream 5xx @ 3×` / `distilled SFT −14.2 pp`），点任一行就地展开：原始数字 + n + 95% CI + 生成命令 + SHA-256。第一次点击发生在滚动之前。

| № | 底色 | eyebrow | 断言标题候选 | 数据源 | JS |
|---|---|---|---|---|---|
| 01 | ink | `29 KB RELEASE OBJECT / SHA-256 GATED / 4 DOMAINS` | ①`One offline claim chain.` ②`Every claim, with its receipt attached.` | `public/case-studies/frontier-forge/release.json` | **默认加载**（29 KB JSON + ~6 KB 组件） |
| 02 | paper | `WHAT ACTUALLY MOVED QUALITY` | ①`Distillation lost to free rule labels.` ②`The expensive rung was the wrong rung.` ③`Training ladder explorer` | 同上 `training.ladder` | 同上，纯 DOM 条形（照抄 `app.js` 的 `.bar-track/.bar`） |
| 03 | white | `4 QPS / RTX 4090 / CLIENT SIDE` | ①`Serving is a boundary, not a badge.`（参考稿原句） ②`Native MTP won only above 0.5 QPS.` | 同上 `serving.serving_at_4_qps` + `speculative_boundary` | 同上，segmented + `gap:1px` metric 棋盘 |
| 04 | ink | `SAME-BOX A10 / SUSTAINED OVERLOAD` | ①`Bounded rejection, with the failure history intact.` ②`3× sheds. 5× crashes. Both are on the page.` | `phase7_1_sustained_gateway_bench.json` + 现有 `forge/OverloadReplay.tsx` | **懒岛**：`next/dynamic` + IntersectionObserver，进视口前不下载 |
| 05 | paper | `LIVE LAYER` | ①`Wake the model.` ②`A CPU replica now, a GPU in 125 seconds.` | 运行时 API（同源） | **点击才加载**，见下 |
| 06 | ink | `HOW THIS WAS VERIFIED` | `One offline claim chain.` / `make reproduce-headline` | `release.json.provenance` + `exports` | 静态 |

**Live 层槽位契约（非承重，必须做成"缺席即一行小字"）：**
- 槽位在 DOM 中恒存，服务端读一个 `live-layer.json` 开关。关闭态渲染为：一条发丝线 + mono `LIVE LAYER — OFFLINE` + 一句话说明 + 指回 01。**不是空洞，不是 404，不是灰按钮。**
- 开启态：`WAKE THE CPU REPLICA`（即时，int4 GGUF / llama.cpp）与 `WAKE THE GPU (~125 s COLD START)`（k3s + KEDA scale-from-zero）两个按钮，冷启动进度条即弹性能力的现场演示。
- **live 结果永远不进入任何 benchmark 声明**，UI 上物理隔离在 05 号展品内，标签 `LIVE — NOT A BENCHMARK NUMBER`。这条纪律直接来自 RG 自己的 W3-02 finding。
- CSP `connect-src 'self'` ⇒ 必须走站内 `/api/*` 同源代理，不能直连推理服务域名。

**降级：** 无 JS 时，01–04 渲染为**服务端预渲染的静态表**（release.json 在构建期读取，SSR 出完整 `<table>`），交互只是增益。这是本站相对参考稿的一大优势 —— 参考稿是 `app.js` 全量客户端渲染，无 JS 时是空壳。**这条必须写进 no-js.spec。**

---

## C.2 Release Guardian

**首屏动作：** hero 右栏 = **13 节点 LangGraph trace 回放器**，一个 `▶ REPLAY` 按钮。按下后节点按录制时序依次点亮，工具调用与证据引用逐条流入右侧。**第 9 节点（human approval gate）暂停并出现两个按钮 `APPROVE` / `BLOCK`** —— 访客做的这个选择会分叉到两条已录制的后续轨迹。这是"能用"最有说服力的形态：recruiter 亲手当了一次审批人。

| № | 底色 | eyebrow | 断言标题候选 | 数据源 |
|---|---|---|---|---|
| 01 | ink | `13 NODES / 44 LABELED SCENARIOS / DETERMINISTIC STUB` | ①`Watch the agent decide. Then overrule it.` ②`A recorded run, node by node.` | `public/case-studies/release-guardian/replay/synthetic-scenarios.json`（**需上游扩展**，见风险 12） |
| 02 | paper | `ONE COMMAND / FASTAPI + POSTGRES/PGVECTOR + PHOENIX` | ①`Run the whole stack on your laptop.` ②`docker compose up. Nothing else.` | `release_guardian/docker-compose.yml` → 构建期抽出命令 | 
| 03 | white | `MCP SERVER / CLAUDE CODE · CURSOR` | ①`Plug the release-risk agent into your editor.` ②`One line. It shows up as a tool.` | 新增 `mcp/manifest.json`（上游） |
| 04 | paper | `8 GATES / 44 TRIALS` | ①`Eight gates. Seven aggregate passes and one strict residual.` ②`The 30-of-44 residual stays next to the pass.` | `public/case-studies/release-guardian/data/evaluation-live.csv` + `evaluation-stub.csv` |
| 05 | ink | `5 SELF-REPORTED COPY FAULTS` | ①`I audited my own claims and found five.` | `data/findings.csv` |

**02/03 的"能用"形态：** 各一个 `<pre><code>` + `COPY` 按钮（~20 行 JS，无依赖）。两块必须显示 **真实可粘贴** 的命令，且构建期从上游文件校验（命令改了站上跟着改）。**MCP 未发布前用现有 `ProjectLink.pending` 语义**渲染为 `MCP SERVER — PACKAGING IN PROGRESS`，绝不占位假命令。

**JS：** trace 回放器是 SSR 出静态节点列表 + 客户端 hydrate 播放控制。JSON 若 >120 KB，走 `dynamic()` 并在 hero 右栏放 `▶` 的静态态（点击才 fetch）—— hero 右栏出现 spinner 是失败。
**降级：** 无 JS = 13 节点的静态有序列表 + 每节点的工具调用与引用全文；审批分叉降级为两个并列的 `<details>`。

---

## C.3 Triage Router（字节纪律最关键的一页）

**问题：** `nlp-eval-lab/demo/live/tier_b2/model.int8.onnx` = **64 MB**，`vendor/` 另有 13 MB ORT。自动加载在国内网络下等于页面废掉。

**两级方案（这是本页的核心设计）：**

- **Tier 0 — 默认，零额外字节。** hero 右栏 = 一个**预填真实投诉文本的 textarea** + 6 个 curated 例句芯片（`data/curated_ids.json` + `samples.json`）。点任一例句 → **立刻**显示已录制的 label / confidence / top-3 logits，附 mono 标签 `RECORDED RUN`。10 秒内完成一次分类，0 字节下载。
- **Tier 1 — 显式点击。** 例句下方一条发丝线 + 按钮：
  `RUN THE MODEL IN THIS TAB — 64 MB int8 DistilBERT, downloads once`
  按下才拉 ORT + 权重，带真实进度条，存入 Cache Storage，完成后 textarea 转为自由输入 + `LIVE INFERENCE` 标签。20 秒超时或失败 → 自动退回 Tier 0 并显示一句诚实说明（不是报错弹窗）。

按钮上的 **64 MB 是字面写出来的**，且 CI 断言这个数字等于文件真实体积（见 E.3）。这既是尊重访客，也是本站"数字都有出处"人设的延伸。

| № | 底色 | eyebrow | 断言标题候选 | 数据源 |
|---|---|---|---|---|
| 01 | ink | `DISTILBERT INT8 / IN-BROWSER ONNX / 4 CLASSES` | ①`Classify a complaint. In this tab.` ②`No API key. No server. No network after the first load.` | `curated_ids.json` / `samples.json` / live.js 逻辑移植 |
| 02 | paper | `TIER A vs B2 vs C / COST · LATENCY PARETO` | ①`The best model was not the one I shipped.` ②`Three tiers on one cost-latency frontier.` | `demo/data/frontier.json` |
| 03 | white | `THRESHOLD GRID / PRECISION · RECALL · ESCALATION` | ①`Move the threshold. Watch who gets escalated.` ②`A threshold is a staffing decision.` | `demo/data/policies.json` —— **滑块查预计算网格，不跑模型，零字节** |
| 04 | paper | `2015 → 2026 / YEARLY DRIFT` | ①`The model aged out.` ②`Eleven years of drift, plotted.` | `demo/data/drift.json`，纯 CSS 柱状 |
| 05 | ink | `CASE STUDY / AGREEMENT REPORT` | ①`Where the labels disagreed.` | `case_study.json` + `live/agreement_report.json` |

**外链清除：** `projects.ts` triage-router 的 GitHub Pages demo href 删除（mandate #2）。技术报告与仓库链接保留。

---

## C.4 Privacy Preflight（改造量最小，重排为主）

已是"产品"，本轮工作 = 套 rail + 重排为展陈序列 + finding 去框 + 首屏动作前移。

**首屏动作：** hero 右栏 = 拖拽区 + **`USE A SAMPLE FILE` 按钮**（关键：不能只有拖拽区，recruiter 手边未必有文件）。点击后就地跑一次真实脱敏并显示前后对照。

| № | 底色 | eyebrow | 断言标题 |
|---|---|---|---|
| 01 | ink | `TESSERACT.JS + PDF.JS / NOTHING LEAVES THIS TAB` | `A black box drawn over text is not redaction.`（全站 2 处 "X is not Y" 配额之一，保留） |
| 02 | paper | `IMAGE / PDF / PLAIN TEXT` | ①`Three surfaces, one pass.` |
| 03 | white | `OCR BENCHMARK / CHI_SIM + ENG` | ①`How often the OCR misses the thing you needed hidden.` |
| 04 | ink | `NO UPLOAD / NO LOG / NO NETWORK CALL` | ①`Check the network tab.` |

**字节警告：** `public/case-studies/privacy-preflight` 34 MB + `public/generated/privacy-ocr` 16 MB。R4 必须审计其中哪些是路由加载、哪些是按需 —— tesseract 语言包（chi_sim ~15 MB）绝不能进初始加载。

---

## C.5 Exactly-Once Drills（Kafka 回放接线，backlog 落地）

**首屏动作：** hero 右栏 = **10 格故障类型棋盘**（`gap:1px`，每格 mono 缩写：`DUP` `ORD` `POISON` `RESTART` `OFFSET` `SCHEMA` `SMALLFILE` `RECON` `PARITY` `SLO`）。点任一格 → 下方即刻出现该演练的时间轴回放（注入点 / 检测 / 恢复 / snapshot diff = 0）。棋盘本身就是导航 + 断言（10 个格子，全部 pass）。

| № | 底色 | eyebrow | 断言标题候选 | 数据源 |
|---|---|---|---|---|
| 01 | ink | `10 FAILURE CLASSES / 0 SNAPSHOT DIFFS / 1,791 EVENTS·S⁻¹` | ①`Ten ways to break it. Zero snapshot diffs.` ②`I broke it ten times on purpose.` | `public/case-studies/exactly-once-drills/results/*.json` + `index.json` |
| 02 | paper | `KAFKA + FLINK / CDC DUAL PATH` | ①`Two paths into the same table.` ②`Path A and Path B, reconciled row by row.` | `showcase/media/phase-b1-path-a-b.svg`（仓内现成）+ `eo_reconciliation.json` |
| 03 | white | `OFFSET REPLAY / CHECKPOINT METRICS` | ①`Rewind the offsets. The table does not change.` | `offset_replay_drill.json` + `checkpoint_metrics.json`，复用 `p1/P1FailureReplay.tsx` 骨架 |
| 04 | paper | `BROKER SLO / PARITY` | ①`1,791 events per second, and a receipt for each.` | `broker_slo.json` + `broker_parity.json` |
| 05 | ink | `RUNBOOK / INCIDENT LOG` | ①`What I wrote down at 2 a.m.` | `runbook-incidents.md` |

**JS：** 全部数据 716 KB，**不可一次性加载**。构建期生成一份 `index.summary.json`（10 条摘要，<12 KB）SSR 渲染棋盘；点某格才 fetch 那一个 drill JSON。
**降级：** 无 JS = 10 个 `<details>`，每个内含该演练的静态结果表。

---

## C.6 轻处方（其余 5 页）

| 页 | 首屏动作 | 展品数 | 关键决定 |
|---|---|---|---|
| **Crossover Study**（次级） | hero 右栏 = 两条主曲线（Amazon null / ML-32M n\*=20）的 CSS 折线，可切臂 | 4 | **DuckDB-WASM SQL 工作台放这里**（对齐 Data eng JD：数仓 34% / DQ 29.4%），但**点击才加载 41 MB**，默认展品是纯 CSS 曲线。同时**砍掉 transformers.js MiniLM**（79 MB 权重，与论点无关）。⚠️ 一个 secondary 项目挂一个 41 MB 组件，性价比可疑 —— 备选是把工作台移到 EOD（数据更"仓"）或本轮不做。**这一项我认为是欠定的，需要用户拍板。** |
| **RAG Quality Lab**（次级） | hero 右栏 = manifest drift 对照（改一个 chunk 参数看召回变化），复用 `rag/RagManifestDriftLab.tsx` | 3 | 报告成分可高于产品成分；JD 里 RAG 占 30.4%，值得保留但不值得重投 |
| **Ask Portfolio**（次级） | **页面本身就是产品**：hero 右栏 = 对话框，3 个预设问题芯片一键发问 | 3 | 展品 02 讲机制（构建期知识库 / 检索 / 前置 guard / Upstash 限流），展品 03 展示"它只引用文件"的引用链。首页 06 号展品复用同一组件的 compact 变体 |
| **Margin Control Tower**（归档） | 无首屏交互要求 | 2 | 套 rail + 展陈壳，内容原样。**DuckDB 只在此页与 Credit 页按点加载** |
| **Credit Policy Desk**（归档） | 无 | 2 | 同上；保留 `A score is not a policy.`（配额第二处） |

---

# D. 语义色系统（accent / negative / danger / pass）

## D.1 问题陈述

参考稿：`--orange` 同时担任 accent 与 `finding.negative` 标签色，`--red #a64033` 担任 danger。Round 2 的 accent 是朱砂 `#9d2b26` —— 与 `#a64033` 色相相差不到 8°，饱和度接近。**照搬会让 negative 与 danger 在视觉上合并**，而这两者恰恰是本站叙事的两个不同支柱（"实验没成" vs "这个东西的边界在哪"）。

## D.2 决定：语义不再由色相承载，改由「色相 × 线重 × 标签词」三元组承载

```css
--accent:        #9d2b26;  /* 朱砂，全站唯一暖色相 */
--accent-on-ink: #d9705f;  /* 墨蓝底上的朱砂替身，仅 ≤14px mono 使用 */
--accent-display-on-ink: #c4564a; /* 墨蓝底上 ≥28px 衬线 em 使用 */
--ok:            #2f6b52;  /* 仅 pass/verified */
--ok-on-ink:     #6fae90;
/* 不再存在独立的 --red / --danger */
```

| 语义 | 色相 | 上边线 | mono 标签词 | 用在哪 |
|---|---|---|---|---|
| **accent（强调）** | 朱砂 | — | — | 衬线标题内 `<em>`、展品编号、rail hover、正文链接下划线、单一主 CTA 边框 |
| **negative result** | 朱砂 | `1px solid var(--accent)` | `NEGATIVE RESULT` | 跑砸的实验 |
| **limitation / danger** | **无色相**（`--ink`） | **`3px solid var(--ink)`** | `LIMITATION —` | 边界、已知缺陷、未解决项 |
| **pass / verified** | 绿 | `1px solid var(--ok)` | `PASS` / `VERIFIED` | 门禁通过、0 snapshot diffs |
| **neutral note** | 无 | `1px solid var(--hairline)` | `NOTE` | 一般说明 |

**为什么 danger 用"重线 + 无色"而不是第二种红：** 在这套叙事里 limitation 不是警报，是**诚实的边界声明**。用墨黑 3px 重线表达"这里是硬边界"，比用第二种红表达"这里危险"更贴语义，且完全绕开了朱砂/砖红撞色问题。同时满足：不引入新饱和色相、不用有色底块、色盲安全（语义由标签词兜底）。

**指标数字一律 `--ink`。** 朱砂不参与数字着色 —— 这是 round-1 已定的纪律，round 2 加强：唯一例外是 `finding` 的 mono 标签行。

## D.3 需要迁移/删除的现存 token

`globals.css` 里 round-0 遗留的图表调色板必须清理：

- **删除**：`--blue-soft` `--amber-soft` `--red-soft` `--green-soft` `--bs` `--as` `--rs` `--gs` `--ob` `--rb` —— 这些是**有色底块**的载体，与"去框"直接冲突。
- **删除**：`--red: var(--accent)` 这个别名（会诱导执行者把 accent 当 danger 用）。
- **收窄**：Okabe-Ito 分类色板 `--fig-1..6` / `--fig-3d/4d` 保留但**限定在 `.fig` 作用域内**，且仅当图表确需 ≥3 条分类序列（crossover 三臂、drift 多年份）。默认图表改用**墨色明度阶**：`ink 100% / 70% / 45% / 25% / hairline`。这与参考稿 `.bar { background: var(--ink-2) }` + `.active .bar { background: accent }` 的语法一致 —— **选中即上色，未选即墨阶**。
- **新增**：`--accent-on-ink` / `--ok-on-ink` / `--accent-display-on-ink`。

## D.4 需要人眼验证的对比度（Gate G1）

`#c4564a` on `#0f2236` 约 4.3:1 —— 小字号 mono 达不到 AA。因此拆成 display 用 `#c4564a`（≥28px，3:1 即达标）、小字 mono 用 `#d9705f`（约 5.6:1）。**这两个值是我按计算给的起点，必须在用户自己的显示器上过 G1 确认**（暖色在不同色域下偏移明显，尤其是 P3 屏上朱砂会显得更艳）。

---

# E. 执行分期

## E.1 阶段与门禁

| 阶段 | 内容 | 可并行？ | 出口门禁 |
|---|---|---|---|
| **R0 地基** | ① Playwright 选择器契约迁移（见 E.4）② `ExhibitShell` + rail 双态 + 移动 `<details>` 索引 ③ token 迁移（D.3 增删）④ 展品原语（`.exhibit/.section-head/.finding/.stat-grid/.dom-bar`）⑤ 删除 site-header、`.page-shell` 布局职能、`--*-soft` 底块层 | ①与②③可并行 | **G1 设备取色**：用户显示器上确认 paper/ink/white 三底、朱砂 on ink 两档、发丝线可见度 |
| **R1 首页** | B 节全序列；hero 标题 A/B/C 定稿；zh 叙事独立成稿 | 依赖 R0 | **G4-H** 首页中文朗读关；**G3-H** 首屏 10 秒录屏（1440×900 + 390×844） |
| **R2 旗舰卷** | frontier-forge 全页，作为**标准卷参考实现**；同时定稿 `variant=compact/full` 契约、SSR 静态降级模式、per-route 预算脚本 | 依赖 R0（不依赖 R1，可与 R1 并行） | **G2 数字审计**：页面每个数字回溯到 `release.json` 的 JSON path + SHA |
| **R3** | Release Guardian ‖ Triage Router | 二者互相并行，均依赖 R2 | G2 / G3 / G4（每页） |
| **R4** | Privacy Preflight ‖ Exactly-Once Drills | 同上 | G2 / G3 / G4 + **字节审计**（tesseract 语言包、EOD 分片加载） |
| **R5 收口** | 次级 3 + 归档 2 + `/[track]` 308 + `sitemap.ts` + 三份生成物再生成 + `check:links` | 依赖 R1（首页文案定稿后再生成 assistant knowledge） | **G5 双语分离关**（5 张失败截图作为 DON'T 集合，CI 化） |
| **R6 增值**（**非承重**） | ① FF live 层 ② RG 的 MCP server 打包 ③ crossover DuckDB 工作台（若 G-crossover 批准） | 三者互相并行，全部可无限期推迟 | **G6 live 层安全关** |

**并行的真实约束：** R0 的 `ExhibitShell` 与展品原语是所有下游的单点依赖，**必须由一个人一次做完**，不能拆。R2 之后 R3/R4 的四页彼此文件不重叠（各自 `src/components/<slug>/`），可四路并行。

## E.2 门禁定义（沿用 G1/G2/G4 模式，补两个）

- **G1 设备取色**（沿用）：截图集在用户显示器上过目。R0 出口。
- **G2 数字审计**（沿用）：每页出一份 `digits.md`，`数字 → 文件 → JSON path → SHA-256`；`verify:evidence` 扩展为对项目页做机器校验，人工抽查 10%。
- **G3 首屏产品关**（**新增**，对应 mandate #2）：每个优先页录一段 ≤10 秒无声屏录，桌面与手机各一，展示 recruiter **在不滚动的前提下完成一次动作**。用户只回答"这算产品还是算报告"。这个门禁是本轮唯一能防止 round-1 悲剧重演的机制。
- **G4 中文叙事朗读关**（沿用）：逐页朗读，不像跟同事说话就重写。
- **G5 双语分离关**（**新增**）：用户那 5 张失败截图整理成 DON'T 集合，`scripts/lint-copy.mjs` 扩展规则：单个文本节点内不得同时出现 CJK 与 ≥2 个连续拉丁词（技术术语白名单除外）；`glossZh` 必须独立成行且 ≤20 字；UI fabric 词表强制英文。
- **G6 live 层安全关**（沿用 round-1 §3.3）：固定 prompt 模板 / 网关限流 / 日预算熔断自动降级 / 输出长度硬上限 / 不记录访客输入 / live 数字与 benchmark 数字物理隔离。

## E.3 性能预算：从单页预算改为分级路由预算

现状 `scripts/verify-performance-budget.mjs` 只测 `/page`（JS 200 KB / route JS 200 KB / CSS 145 KB gzip）。结构重建后这个口径不够。

**新策略 —— 三件事：**

1. **首页收紧。** rail + 展品几乎零 JS，删掉卡片网格与 flourish 层后 CSS 应显著下降。目标：**JS ≤ 170 KB gzip，CSS ≤ 120 KB gzip**。首页变轻是本轮的一个可验证结论，不是可选项。
2. **扩展脚本到每条路由**，配一张预算表：
   - Tier A（`/`、归档页）：initial JS ≤ 170 KB
   - Tier B（报告型：RAG / Ask / analytics-tandem / artifact）：≤ 200 KB
   - Tier C（仪器型：FF / RG / Triage / EOD / Privacy / Crossover）：**initial** JS ≤ 260 KB
3. **重资产不计入 initial，但必须登记。** 新增 `heavy-assets.json`：
   ```
   { "triage-router": { "onnx-int8": 67108864, "ort-web": 13631488 },
     "crossover-study": { "duckdb-wasm": 42991616 }, ... }
   ```
   CI 断言三件事：(a) 文件真实体积 == 清单值；(b) 清单值 == UI 按钮上显示给访客的字节数；(c) 这些资产**不出现在任何路由的 initial chunk 里**。

第 (b) 条是这套设计里我最想保留的一处：**页面对访客承诺的"64 MB"由 CI 保证为真**。它把"数字都有出处"的人设从内容层延伸到了 UI 层，几乎零成本。

## E.4 让 274 条 Playwright 活着穿过结构重建

这是执行期最大的**工程**风险（不是设计风险）。现有断言大量绑定 CSS 类：`.identity-title h1`、`.core-project-grid .home-project-card`、`.flagship-stats`、`.method-notes li`、`.secondary-project-list .home-project-row` —— 这些类在 R0 全部消失。

**处方：**
1. **R0 第一件事**（在任何视觉改动之前）：新建 `tests/e2e/selectors.ts`，把所有结构选择器集中为常量，测试文件只引用常量。这是纯机械改造，当天可完成，且此时旧站还是绿的 —— **改造后必须先跑一次全绿再动 UI**。
2. 结构改动时只改 `selectors.ts` 一个文件的取值。内容断言（数字、文案）随各 R 阶段更新。
3. 新的稳定锚点用 `data-exhibit="01"` / `data-project-section` / role+text，**不用 CSS 类**。CSS 类从此只承担样式。
4. `no-js.spec.ts` 重写并**扩权**，新增三条职责：(a) 每个展品的静态内容存在；(b) 移动端 `<details>` 索引可展开；(c) **FF/EOD 的仪器有服务端预渲染的静态表**（C.1 的降级承诺被测试锁死）。
5. **禁止用 `test.skip` 作为落地手段。** 每个 R 阶段的出口条件是全套绿，不是"绿的那部分绿"。

---

# F. 风险登记

| # | 风险 | 后果 | 缓解 |
|---|---|---|---|
| **1** | **rail 与 App Router 布局嵌套** —— rail 内容随路由变，root layout 拿不到 params；若用 client hook 读 pathname，整个 shell 变 client boundary，首页 JS 预算立刻爆 | 首页 JS 超预算 / rail 内容错乱 | rail 作为 **prop 由 page 传入**（`<ExhibitShell rail={…}>`），shell 是 server component；只有 scroll-spy 是 client island。root layout 只留 providers |
| **2** | **ONNX 64 MB + ORT 13 MB 在国内网络** —— 且 CSP `connect-src 'self'` 要求同源，77 MB 进 `public/` 会撑爆 git 与 VPS release artifact | Triage 页在国内不可用；部署包体失控 | Tier 0/Tier 1 两级（C.3）；权重**不入 git**（LFS 或构建期拉取），VPS 上 `immutable` 长缓存；Cache Storage 持久化；20 s 超时退回 Tier 0；按钮上写死真实字节数并由 CI 校验 |
| **3** | **DuckDB-WASM 41 MB 已在 `public/`** —— 目前只服务两个归档页（Margin / Credit） | 41 MB 服务两个最低优先级页面，性价比倒挂 | R4 审计其是否路由加载；一律点击才加载；crossover 是否值得再挂一个 41 MB 组件 → **交用户决策**（C.6） |
| **4** | **Windows 上没有 Iowan Old Style** —— 回落 Baskerville（罕见）→ Georgia。Georgia x-height 更大、`letter-spacing: -.035em` 下在 `7.3rem` 处换行位与溢出行为完全不同。约七成中国 recruiter 是 Windows | 全站最高赌注的视觉元素在多数目标读者那里长得不一样，甚至溢出 | 断言标题**用显式 `<br>` 而非自动换行**；加 `text-wrap: balance` 兜底；Georgia 下按 7.3rem 实测截图。**若不接受 —— 自托管一个拉丁子集 display 衬线（20–35 KB woff2，仅首页 preload）。这会推翻 round-1 的"零新增字体字节"约束，属于欠定项，需要用户拍板。** 我个人倾向自托管：hero 是全站唯一不能失控的元素 |
| **5** | **巨号中文衬线在 Windows 上崩坏** —— Songti SC 仅 macOS；SimSun 在 7rem 处极丑，且 `clamp(3.1rem,7vw,7.3rem)` 的英文尺度对中文根本不适用（中文字面积大得多） | zh 版首页 hero 视觉崩坏 | **明确决定：巨号断言标题为英文专属**（它是 assertion，属 UI fabric 邻域）；zh hero 用 `clamp(2.2rem,4vw,3.4rem)` 黑体，独立成稿。**这是两个语言版本之间的有意结构性不对称，必须是显式决定而不是意外**，需 G4 确认 |
| **6** | **删 3 个 track 页导致 SEO 与站内检索断裂** —— `portfolio-search-aliases.generated.json` / `assistant-knowledge.generated.json` / command palette 都引用 track 页 | palette 跳 404；主题词从首页正文消失 | 308 重定向；新建 `sitemap.ts`（当前根本没有）；三条 track thesis 迁入首页 02/03 正文；R5 的 DoD 强制包含三份生成物再生成 + `check:links` |
| **7** | **MCP server 打包范围蔓延** —— 这是 `release_guardian` 仓库的工作（server + manifest + 发布），不是站点工作 | 站点重建被上游仓库阻塞数周 | 站点侧契约只有两样：一个可复制的安装命令块 + 一段录制的 tool-call transcript。未发布前用现有 `ProjectLink.pending` 语义渲染 `PACKAGING IN PROGRESS`，**绝不放假命令**。硬规则：站点重建任何阶段都不得阻塞于上游仓库 |
| **8** | **live 层安全与成本** —— prompt 注入、成本爆炸、滥用；且 live 数字可能污染 benchmark 声明 | 账单失控 / 人设崩塌（"这个人的数字不可信"） | G6 全套；日预算熔断自动降级回 Evidence Explorer；**槽位关闭时渲染为一行发丝线小字而非空洞**，页面在 live 缺席时读起来必须完整；live 结果物理隔离在 05 号展品并打 `NOT A BENCHMARK NUMBER` 标 |
| **9** | **274 条测试在重建期长期变红** —— 一旦红过两周，团队（和你自己）就不再信任这个门禁 | 质量基建事实性失效 | E.4 的选择器契约先行；每个 R 边界必须全绿；禁止 `test.skip` 落地 |
| **10** | **产品先行导致首屏正文减少** —— 影响 meta description 质量与 Ask Portfolio 的构建期知识抽取语料 | SEO 与站内助手同时退化 | 每个 hero 保留真实 `<h1>` + 一段散文（仪器在**右栏**，是并列不是替代）；`build-assistant-knowledge` 只读叙事层，该层不缩水 |
| **11** | **"全部留在站内"与单台 VPS 的字节现实冲突** —— privacy 50 MB + duckdb 41 MB + onnx 77 MB + 现有 17 MB generated ≈ 185 MB 静态资产 | VPS release artifact / 带宽 / 磁盘超限 | R5 后实测 `build:vps` 产物体积并对照 VPS 余量。**若超限，退路不是恢复外链 demo**（那违反 mandate #2），而是压缩录制层：减少 curated 例句、把 int8 DistilBERT 蒸馏为 6 层学生模型、或 MiniLM 级别量化 |
| **12** | **RG 的 13 节点 trace 数据目前不存在可回放形态** —— 站上只有 `replay/synthetic-scenarios.json`，需要上游导出带节点时序 + 工具调用 + 引用 + 审批分叉的轨迹 | C.2 的首屏动作做不出来 | R3 开工前先在 `release_guardian` 跑一次导出（确定性 stub 模式，零 API 成本）。**这是 R3 唯一的上游硬依赖，必须在 R2 期间并行完成**，否则 R3 会卡住 |

---

## 结尾：三处我认为欠定、需要你拍板的地方

1. **`/[track]` 是删还是重做成展品页**（A.1）。我按"删"给了完整方案，但如果你在意 track 级的 topical 落地页，这个决定要反过来 —— 反过来的代价是三页额外的展陈脚本工作量。
2. **display 衬线是否自托管**（风险 4）。推翻 round-1 的"零新增字体字节"约束换取 Windows 上的视觉确定性。我倾向做，但这是你定的约束，不该我推翻。
3. **crossover 是否值得挂 DuckDB-WASM 工作台**（C.6 / 风险 3）。一个 secondary 项目 + 41 MB 组件，我给不出干净的理由说它一定值 —— 备选是移到 EOD、或本轮不做。

其余部分我认为证据充分、可以直接执行。

**相关文件路径：**
- 参考稿：`/private/tmp/claude-501/-/0b9af4b4-589f-494b-9967-aae94141b7a4/scratchpad/design-final/index.html`、`.../assets/styles.css`、`.../assets/app.js`
- 需改写：`/Users/hsiangkuochang/portfolio-site/src/app/globals.css`、`/Users/hsiangkuochang/portfolio-site/src/app/layout.tsx`、`/Users/hsiangkuochang/portfolio-site/src/components/home/HomePage.tsx`、`/Users/hsiangkuochang/portfolio-site/src/components/ProjectPageView.tsx`、`/Users/hsiangkuochang/portfolio-site/src/components/ProjectProof.tsx`、`/Users/hsiangkuochang/portfolio-site/src/components/CaseStudyBlock.tsx`
- 需删除（作为页面）：`/Users/hsiangkuochang/portfolio-site/src/app/[track]/page.tsx`、`/Users/hsiangkuochang/portfolio-site/src/components/TrackPageView.tsx`
- 需新建：`/Users/hsiangkuochang/portfolio-site/src/app/sitemap.ts`、`/Users/hsiangkuochang/portfolio-site/tests/e2e/selectors.ts`、`/Users/hsiangkuochang/portfolio-site/heavy-assets.json`
- 需扩展：`/Users/hsiangkuochang/portfolio-site/scripts/verify-performance-budget.mjs`、`/Users/hsiangkuochang/portfolio-site/scripts/lint-copy.mjs`、`/Users/hsiangkuochang/portfolio-site/next.config.ts`（redirects）
- 上游硬依赖：`/Users/hsiangkuochang/release_guardian`（13 节点 trace 导出）
