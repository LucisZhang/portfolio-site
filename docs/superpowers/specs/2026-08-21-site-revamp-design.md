# xiangguozhang.com 整站改版设计规格（Design Spec）

日期：2026-08-21。作者：Claude（orchestrator），基于 JD 市场数据（7,196 岗）、全仓库审计、frontier-forge demo 设计提取、三项外部调研，以及 deep-reasoner 与 Codex 双通道独立策略的合成。

**配套实施计划**：`docs/superpowers/plans/2026-08-21-site-revamp.md`（执行者按 plan 走，本文件是唯一事实依据）。

---

## 0. 一页决策总览

| 决策 | 结论 |
|---|---|
| 叙事主轴 | **双支柱：主叙事 = AI 应用与 Agent 工程（带训练与推理深度），并列第二支柱 = 后端/系统工程（同一批项目讲两个池子，对冲字节集中度风险）**；frontier-forge 是深度证据、不是身份宣言；测量纪律/成本/负结果人设不变；数据分析从首页身份中退出 |
| 投递抬头规则（v2 学历数据） | 简历与站上自我称谓锁定"工程师/Engineering"，回避"算法工程师"：638 盘内算法名岗硕博门槛 56.4% vs 开发名岗 12.1%（4.7×，去字节后依然 37.7pp），抬头比方向更决定门槛 |
| 视觉方向 | frontier-forge demo 的编辑风**结构语法**（发丝线、明暗分区、零圆角、数字即主体），**不搬**其配色与巨型 hero |
| Accent | 朱砂红 `#9d2b26`（后备 `#8a3324`），红=强调与负结果标记；绿 `#2f6b52` 仅表 pass；指标数字一律墨色 |
| 旗舰 | Frontier Forge 独占首页一个反白分区；产品形态 = release.json 驱动的 Evidence Explorer + 过载回放，不做假 live 推理 |
| 项目分层 | 旗舰 1 / 核心 4（Release Guardian 以"Agent 编排"身份回归核心）/ 次级 3（含 Ask Portfolio）/ 归档 2 |
| 中文名策略 | 项目名保留英文原名，下一行中文说明（cn-gloss），全站禁止括号译名与硬译名 |
| README | 单文件中英穿插（英文段 + `>` 引用块中文），废除 README.zh-CN.md 双文件制 |
| 深色模式 | 不做（non-goal） |
| 仓库改名 | 一律不改名；README H1 对齐仓库名 |
| Agent 工件 | CLAUDE.md/AGENTS.md 留 root（工具配置）；PLAN/STATUS/UPGRADE_PLAN/EXPERIMENT_LOG 等迁入各仓 `docs/engineering-log/` |

---

## 1. 市场信号 → 内容策略

来源：《信息类岗位三级分类与关键词频率》2026-08-19，7,196 岗。

核心事实：**"大模型与 AI 工程"二级族 1,674 岗（23%）是唯一大盘**；数据工程全族 2.1%、数据分析 1.6%、DevOps/SRE 0.5%、推荐 1.4%。27.3% 岗位带"大模型"交叉标签。C++ 是全域第一共性词（各类 30–55%）。中文 JD 写"大模型"（1,957 次）远多于"LLM"（320 次）。

**AI 大类细分（细粒度重切，2026-08-21 修订——决定第一身份的关键事实）**：
- 大模型/多模态训练 730 岗：98% 带算法/研究身份词；v2 学历数据实测**硕博硬门槛 62.4%**（不是完全封闭——1/3 岗位明确本科可投，绝对可及量 227 仍列全场第 4）。不押身份，但不必回避投递。
- **Agent/RAG/AI 应用工程 638 岗：72% 纯开发岗名、校招全职占 79.5%——本科最可及的 A 级 AI 盘**。其中 24.8%（158 岗）同时要求微调/推理服务/GPU，"应用工程 + 底层深度"是这个池里被真实定价的稀缺组合。
- AI 平台/推理/MLOps 仅 96 岗（B 级）；"通用 AI 工程与研究" 210 岗是研究身份词最密的一档（23.3%），本科不押。
- **AI × 后端是最大交叉盘（660 岗，9.17%）**——C++ 网关与 Kafka 项目的主场。Agentic BI / ChatBI / NL2SQL 在 7,196 个岗位名中各出现 ≤1 次，2026 校招盘不可寻址，不作叙事对象。
- 词汇注意："编排/Workflow Orchestration" 仅 47 次命中，**不是招聘方检索词**——标题层用 "AI Agent / 工具调用"（754 次）、"RAG"（472 次），"编排"只进正文。
**学历门槛（v2 包 2026-08-21 新增，判定覆盖率 81.7%，每个判定有 JD 原句支撑）**：
- 本科可投率（/判定明确岗）：后端 92.9% > 数据分析 84.6% > 批处理/ETL 73.8% > **Agent/RAG/应用 71.4%** > 通用软件 69.0% > AI 平台 64.8% > 通用 ML 40.9% > **大模型训练 37.6%**。按本科可投**绝对量**排名：通用软件 410 > Agent 387 > 后端 273 > 训练 227。
- **抬头即门槛（本轮最重要发现）**：638 盘内算法名岗硕博门槛 56.4%（≈训练岗的 62.4%），开发名岗仅 12.1%。全盘同向（算法名 61.9% vs 开发名 19.3%）。分类器为正则近似，建议抽 100 个标题人工复核。
- **字节依赖恶化**：638 本科可投子集里字节占 **66.4%**；去字节后 Agent 盘可投率 49.1%，而后端（86.4%）与通用软件（67.8%）几乎不衰减——工程侧本科友好是行业属性，Agent 侧是字节的公司属性。**对冲 = 后端/系统工程升为并列第二支柱**。
- **工程侧切入 AI 路线获数据支持**："大模型"标签落在工程侧岗位时本科可投 79.5%（落在 AI 族仅 46.2%）；AI×后端交叉 367 岗、可投 83.3%，是全数据集最干净的池子。
- 谨慎项：18.3% 岗位学历未披露——所有可投率是上界；保守下界（/全部岗）排序不变但量缩水（Agent 60.7%、训练 31.1%）。
- 沿用风险：若字节 2027 缩招，Agent 主叙事权重应即时向后端/通用软件线倾斜。

**必须出现在首页可见文本里的 JD 原词**（中文页）：大模型、微调 / SFT、vLLM、推理优化、模型部署、AI Agent、RAG、C++、分布式、消息队列、Kafka、高性能/低延迟。
**禁止作为卖点的词**（JD 中≈零命中或极小盘）：KEDA、exactly-once（标题层）、Airflow、LangGraph（可在正文出现，不进标题）、"数据分析师"。

项目 ↔ 关键词簇映射（决定层级）：

| 层级 | 项目 | 背书的 JD 词 |
|---|---|---|
| 旗舰 | Frontier Forge | 大模型、SFT、vLLM、推理优化、模型部署、C++、高性能、分布式、K8s——**作为"应用工程师的底层深度"讲，不作为训练岗身份宣言** |
| 核心 | Release Guardian | **AI Agent、工具调用、LangGraph、结构化输出、评测、human-in-the-loop**（Agent 口径盘子 638–1,092 岗，是原"发布工程"口径 84 岗的 7.6 倍） |
| 核心 | Triage Router | 大模型、成本优化、级联路由（Agent 工程叙述） |
| 核心 | Privacy Preflight | 安全×大模型交叉（151 岗）、OCR、浏览器端工程 |
| 核心 | Exactly-Once Drills | 消息队列、Kafka、Flink、分布式（AI×后端 660 岗交叉盘的后端证据） |
| 次级 | Crossover Study | 推荐系统、Spark、Iceberg、实验设计、A/B 严谨性 |
| 次级 | RAG Quality Lab | RAG、向量检索、评测 |
| 次级 | Ask Portfolio | RAG、检索、限流、大模型应用 |
| 归档 | Margin Control Tower / Credit Policy Desk | （市场盘子小，保留为广度与产品感证据） |

Agent 类三项目分工（避免同质复读）：Release Guardian＝**编排与可靠性**（图设计、护栏、HITL、评测门禁；叙事重心放在"Agent 系统的工程化与发布可靠性"，直接对齐 AI×后端 367 岗、本科可投 83.3% 的交叉池）；Triage Router＝**成本与路由**；Ask Portfolio＝**RAG 检索问答**（RAG 词汇归它，Release Guardian 不抢——其四路里仅一路是真混合检索）。

双支柱的落法（不需要新项目，只调呈现）：后端/系统工程证据用同一批项目讲——frontier-forge 的 C++ 网关与 vLLM 服务层、Release Guardian 的发布可靠性、Exactly-Once Drills 的消息队列与一致性。domain tag "消息队列与后端" 的卡片正文里保证出现 高性能/分布式/数据库 等后端 JD 词。

已知组合缺口（本次不解决，进 backlog）：多模态（大类第 5 词、42.5% 覆盖，零项目）；Go/Java 显性服务；MySQL/Redis 深度。

---

## 2. 设计系统规格

### 2.1 设计原则（从 frontier-forge demo 继承什么、丢弃什么）

继承（结构语法）：零圆角、零阴影；1px 发丝边框；`gap:1px` 透线网格 stat tiles；米纸/墨蓝交替分区（全站 ≥2 个反白分区制造明暗节奏）；mono 全大写 eyebrow；衬线 display 标题；数字是视觉主角。
丢弃（模板与撞脸风险）：赤陶橙 accent（撞 Anthropic）；01/02 大编号侧栏目录；固定 260px 侧栏；绿色呼吸状态灯；h1 7rem 巨字号；滚动渐显动画（现站已有的 IntersectionObserver reveal **一并移除**——它伤爬虫与弱网体验）。

### 2.2 Token（`src/app/globals.css` 的 `:root` 目标值）

```css
--paper: #f5f1e8;        /* 主底，暖米纸 */
--paper-alt: #eae3d5;    /* 次级分区底 */
--paper-bright: #fffdf8; /* 卡片内底 */
--ink: #14202c;          /* 正文与标题 */
--ink-invert: #0f2236;   /* 反白分区底（墨蓝） */
--ink-invert-fg: #f5f1e8;
--muted: #5a6472;
--accent: #9d2b26;       /* 朱砂红：强调词、链接、finding/负结果标记 */
--accent-hover: #c4564a;
--ok: #2f6b52;           /* 仅 pass/verified 语义 */
--hairline: rgba(20, 32, 44, .16);
--radius: 0;
```

红色使用纪律：accent 只用于 ① 标题内强调词（斜体）② 链接下划线/hover ③ 负结果与 finding 的左边框标记 ④ 关键 CTA 边框。**指标数字一律 `--ink`**，pass 状态用 `--ok` 圆点。这样"公开负结果"的人设直接成为视觉系统：访客扫一眼就能看到红标的"没成的实验"。

### 2.3 字体（零新增字节，CSP 禁外部字体）

- Display 标题（EN）：`"Iowan Old Style", Baskerville, Georgia, serif`（系统栈）。
- Display 标题（zh，仅 ≥28px）：`"Songti SC", "Noto Serif CJK SC", SimSun, serif`；**小于 28px 的中文一律黑体系**（`PingFang SC` 等系统栈），避免小字号宋体在 Windows 发虚。
- 正文：保留自托管 IBM Plex Sans（拉丁）+ 系统中文黑体。
- Mono：保留 Plex Mono；eyebrow 规格 `text-transform: uppercase; letter-spacing: .14em; font-size: .7rem`；所有指标数字用 mono。
- h1 尺度压缩：`clamp(2.4rem, 5vw, 4.2rem)`，行高 1.05。**每页最多一个超大衬线标题**。
- 可回收预算：display 不再用 Plex Sans 700，删除该 weight 的字体文件。

### 2.4 版式语法

- 分区 padding `clamp(48px, 7vw, 96px)`；正文测宽 `max-width: 72ch`。
- 卡片解剖：`1px solid var(--hairline)` 边框 + `--paper-bright` 底 + 内部 mono 指标行；hover 仅边框变 `--accent` + 底色微移，120–160ms。
- Stat tiles：`display:grid; gap:1px; background:var(--hairline)`，子项 `background:var(--paper-bright)`——透线网格即分隔线。
- 反白分区（`--ink-invert` 底）：全站两处——首页旗舰区 + 项目页的 Evidence/Proof 区可选用。
- 缩略图规范（首页核心卡）：真实产品截图，裁 16:10，外框 1px 发丝线，不加假浏览器 chrome，不加投影；单张 ≤60KB（AVIF/WebP + `loading="lazy"`）。

### 2.5 动效（全部尊重 `prefers-reduced-motion`）

允许：① hover/focus 过渡 120–160ms；② 旗舰区四个数字进入视口后 count-up 一次（400ms，仅此一处）；③ 图表状态切换过渡。
禁止：滚动渐显、视差、粒子、光标跟随、打字机、循环动画。

### 2.6 硬约束（不可违反）

首页 JS ≤200KB gzip、CSS ≤145KB gzip、Lighthouse ≥90（`verify:performance`）；严格 CSP 禁外部脚本/字体/CDN；Playwright en/zh × 4 视口矩阵必须全绿；`verify:evidence` 哈希门禁；`structural-copy.ts` 与 `*.generated.*` 只能经脚本再生成，禁止手改。

---

## 3. 信息架构

### 3.1 首页区块（自上而下）

1. **Hero**（桌面 ≤60vh；移动端压缩到两屏内可见旗舰标题）：
   - eyebrow：`AI AGENTS / LLM APPLICATIONS / MEASURED SYSTEMS`
   - 定位句（见 §5 文案 deck）
   - 证据行（mono）：`Qwen3.5-4B SFT 66.35% → 99.05% · 全程实测 $35.68 · GPTQ-int4 p95 0.963 s`
   - 方向行 + 联系方式行（GitHub/邮箱/简历/微信）
   - **删除**：07/03 计数器、三学科卡。
2. **旗舰区 Frontier Forge**（反白墨蓝分区，独占约一屏）：标题 + cn-gloss + 三句叙述（含一句红标负结果）+ 4 个 stat tiles + 1 张静态架构 SVG（≤40KB，复用仓内 mermaid 重绘）+ 三通路按钮 `Evidence Explorer / 技术报告 / Code`。
3. **核心项目**（4 卡带产品缩略图，2×2）：Release Guardian · Triage Router · Privacy Preflight · Exactly-Once Drills。卡片 = 缩略图 + 英文名 + cn-gloss + 两句正文 + 2–3 个 mono 指标徽章 + domain tag。
4. **次级项目**（一行一个，无缩略图）：Crossover Study · RAG Quality Lab · Ask Portfolio。
5. **方法论**（3 句短段，替代原三学科卡的"声音"，见 §5）。
6. **归档**（`<details>` 折叠或视觉降权列表）：Margin Control Tower · Credit Policy Desk，各一行。
7. **页脚**：联系 + `最近更新 YYYY-MM-DD`（构建期注入，"活站"信号）。

Domain tag 固定四值（仅标注、无筛选交互）：`大模型训练与推理` / `Agent 与 RAG` / `消息队列与后端` / `数据系统`。

### 3.2 项目详情页模板（反转：产品先行，报告殿后）

顺序：**① Hero**（英文名 + cn-gloss + 一句话 + 3 stat tiles）→ **② Proof 区**（可操作工作台 / 回放控制台 / Evidence Explorer，首屏下方第一块）→ **③ 怎么做的**（架构 + 关键取舍，原 What I built 内容并入）→ **④ 结果与负结果**（表格化 receipts，红标负结果）→ **⑤ Limitations**（诚实边界，原样保留）→ **⑥ Links**（GitHub / 技术报告 / 相关项目）。
原 Problem/Audience 两个小节**降级为 hero 下的一段普通文字**（各一句），不再是并列案头字段——四个并列小标题正是"报告感"的来源。

### 3.3 旗舰页 Frontier Forge 的产品形态（无常驻 GPU 的眼见为实）

1. **Evidence Explorer（主证据）**：构建期把仓库 `demo/data/release.json` 转为站内静态数据；渲染为可筛选断言表——每行一个 claim（如"3× 过载零上游 5xx"），展开显示原始数字、n、CI、生成命令、SHA-256。筛选维度：训练/推理/网关/弹性；标注 `正结果/负结果/边界`。这比 live demo 更贴人设，零后端、永不宕机。
2. **过载回放控制台**：复用 `P1FailureReplay.tsx` 骨架，数据换成 phase7_1 压测时序——可拖时间轴对比"网关 429 快拒（p95 1.9ms、零上游 5xx）"vs"裸 vLLM 5× 过载崩溃（651 传输错误）"。
3. **60–90s 无声录屏（兜底，可选）**：`preload="none"` + poster；素材需用户配合录制，没有就先不放。
4. 页面顶部一行诚实标注：*All numbers are recorded from on-demand GPU runs; commands and hashes included.* / 中文：*所有数字来自按需 GPU 实测记录，附命令与哈希。* 不提供假输入框。

**可选 Live 层（用户已确认愿意花钱，见 plan P6）**——两级混合，Evidence Explorer 仍是主证据：
- **L1 常驻 CPU 副本（~¥0–100/月）**：R1b 模型 int4 量化（GGUF），llama.cpp server 跑在现有 VPS（需确认 ≥4GB 内存余量），前置自研 C++ 网关做准入限流。页面标注"live 推理为 CPU 副本；GPU 实测数字见收据表"，两套数字严格分开，live 结果永不混入 benchmark 声明。
- **L2 按需 GPU 唤醒（月估 ¥30–150）**：复用 Phase 7.2 的 k3s + KEDA scale-from-zero——访客点"唤醒 GPU"，页面实时显示冷启动进度（实测 p50 ~125s），就绪后走真 vLLM，闲置 10 分钟自动缩零。用抢占式 A10，只在热时计费。这本身就是弹性能力的现场演示。
- **不做常驻 GPU**（包月 ¥4,000+ 服务日均个位数访客，性价比不成立；若校招高峰周需要，可用"工作日白天定时保温"折中，约 ¥770/月，随开随关）。
- 安全底线（Gate G6）：固定 prompt 模板（只接受任务输入，不接受自由指令）、网关限流 + 日预算熔断（超额自动降级回 Evidence Explorer）、输出长度硬上限、不记录访客输入。

前置条件（人工 gate）：frontier-forge 仓库 `demo/data/release.json` 目前停在 Phase 5（还写着"网关缺陷未修复"），**必须先在源仓库跑数据同步纳入 Phase 7 结果**，否则站上叙事自相矛盾。

### 3.4 其他项目页的产品形态

- Privacy Preflight：现状已达标（全功能本地工作台），仅按 §3.2 调序 + 文案过 §6 规范。
- Exactly-Once Drills：保留 Failure Replay Console，叙事升级为双路径 10 类故障（先在源仓库重跑 `scripts/sync-results.mjs` 更新 index.json）；新增 Kafka 路径的架构 SVG（仓内 `showcase/media/phase-b1-path-a-b.svg` 直接可用）。
- Triage Router：demo 措辞改为"**回放实测运行**（in-browser replay of measured runs）"，并链到真推理所在仓库。诚实高于关键词。
- Crossover Study（新页）：从 `crossover-study/docs/site_copy_phase9.md` 改写（勿从零写）；展品裁剪版 ≤2MB——两条主曲线（Amazon null / ML-32M n*=20）+ 换血率机制图 + receipts 抽屉；**砍掉 transformers.js MiniLM 语义检索**（权重是 79MB 的大头且与论点无关）；完整版外链 GitHub Pages。
- Ask Portfolio（新次级行 + 保留右下角入口）：把它的机制（构建期知识库、检索、前置 guard 模型、Redis 限流）写成一行卖点。

---

## 4. 语言与文风规格

### 4.0 成稿流程（先于一切规则）

**中文不是英文的译文。**两种语言各自从同一份事实清单独立成稿，禁止对照翻译——"上线测量"（production measurement 直译）这类不存在的中文搭配就是对照翻译的产物。每句中文过**朗读测试**：读出来不像你对同事说的话，就重写。Hero 级句子（定位句、旗舰第一句）保留 2–3 个候选，由用户终选（Gate G4）。中文终稿必须经过一轮独立审读（非撰写者本人）。

### 4.1 三条铁律

1. **数字压倒形容词**：删"高效/强大/全面/robust/seamless/comprehensive"，每个卖点必须落到数字、日期或成本。
2. **负结果入正文**：每个项目至少一条"没成的事"（蒸馏 −14.2pp、GRPO CI 含零、Redis 队列丢过消息这类），用 accent 红标记。
3. **中英混排规范**：中英文之间半角空格；术语保留英文不硬译（checkpoint、offset、exactly-once、prefix caching）；禁止"进行 optimize"式半吊子混用；大小写跟官方（GitHub、JavaScript）。

### 4.2 黑名单（进 CI，见 plan P2）

中文禁用：赋能、闭环、抓手、深耕、致力于、打造、旨在、助力、值得注意的是、综上所述、不仅是…更是…、让我们、强行展望（"未来将继续探索"）。
英文禁用：delve、seamless、robust、leverage、showcase、comprehensive、meticulous、pivotal、empower、cutting-edge、spearheaded、boasts、testament、"It's not just X, it's Y"、"Say goodbye to"。
结构禁用：等长三段式项目介绍；bullet 全部以"负责/实现/优化"开头；无 baseline 的"提升 X%"；标题冒号体（"性能优化：从理论到实践"）。

### 4.3 格言配额

"X is not Y" 开头句式全站**最多保留 2 处**：Privacy Preflight（"A black box drawn over text is not redaction."）与 Credit Policy Desk（"A score is not a policy."）。其余项目开头必须换形：数字先行（Exactly-Once）、设问（Crossover）、判断句（Triage）、事故现场（可选）。跨仓库 README 同理——"honest / evidence / fail-closed" 三词在单仓 README 中合计出现 ≤3 次。

### 4.4 中文项目名格式（cn-gloss）

模板：英文名单独一行（衬线/原样式），下一行 `.cn-gloss` 类中文说明，≤20 字，黑体、`--muted` 色。**禁止**：括号译名（"（精确一次演练）"）、书名号、硬译标题（发布守门人/毛利控制塔/投诉分流路由/精确一次演练 全部废除）。

---

## 5. 文案 Deck（最终字符串，执行者原样使用，不再创作）

> 双语字段按 `projects.ts` 的 `{en, zh}` 结构给出。en 面向国际读者与英文版，zh 遵循 §4。

### 5.1 Hero

- 定位句 en：`I build LLM agents and applications, fine-tune and serve the models myself, and publish the runs that didn't work.`
- 定位句 zh（用户已终选，G4 此项关闭）：`从 Agent 应用到微调、推理服务，这条链我自己跑通；跑砸的实验，原样公开。`
- 证据行（mono，双语共用）：`Qwen3.5-4B SFT 66.35% → 99.05% · end-to-end $35.68 · GPTQ-int4 p95 0.963 s`
- 方向行 en：`Open to: AI agent & LLM application engineering · backend & distributed systems · data engineering & analytics`
- 方向行 zh：`校招方向：AI Agent 与大模型应用工程 / 后端与分布式系统 / 数据工程与分析`
- （v2 修订依据：方向行是"我投什么岗"，训练与推理是能力深度不是投递方向——写进方向行会把自己送进 62.4% 硕博门槛的池子；训练深度已由定位句"模型自己微调、自己部署"与旗舰区承载。后端升到第二位 = 双支柱落地。）

### 5.2 旗舰区（Frontier Forge）

- 名称行：`Frontier Forge`；cn-gloss：`从 SFT 微调到 vLLM 上线，一条链自己跑通`
- en 正文：`Scaling free rule labels from 1,450 to 20,000 lifted a 4B model from 66.35% to 99.05% task success on complaint triage (n=2000, paired 95% CI), served with vLLM behind a C++20 token-aware gateway, scaled 1→3→1 on k3s. Total measured spend: $35.68. Under 3× overload the gateway sheds load with 429s and zero upstream 5xx; bare vLLM crashed at 5×. Distillation lost 14.2pp to free rule labels and GRPO's CI includes zero — both runs are kept on the page.`
- （G2 修正记录：66.35% 是 R1 规则 SFT（1,450 标签）的分数而非基座分数（基座 0.0%），en/zh 均不得写"base model/基座从 66.35%"。）
- zh 正文：`投诉分诊任务上，免费规则标签从 1,450 条加到 20,000 条，把 Qwen3.5-4B 的任务成功率从 66.35% 提到 99.05%（SFT，n=2000，配对 95% CI）。vLLM 部署，前面挡一层自己写的 C++20 网关：按 token 预算限流，k3s 上 1→3→1 自动伸缩。全程花了 $35.68，账单实测。压到 3 倍过载，网关用 429 把多余请求挡在门外，上游零 5xx；裸 vLLM 顶到 5 倍直接崩。蒸馏比免费的规则标签还低 14.2 个点，GRPO 置信区间含零——这两次没做成的实验，原样留在页面上。`
- Stat tiles（labels mono）：`99.05% TASK SUCCESS` / `+32.7 pp PAIRED GAIN` / `$35.68 TOTAL MEASURED SPEND` / `0 UPSTREAM 5XX @ 3× OVERLOAD`
- 三通路按钮：en `Evidence Explorer / Technical report / Code`；zh `证据浏览器 / 技术报告 / 代码`

### 5.3 核心卡

**Release Guardian**（cn-gloss：`按生产模式设计的 Agent 发布门禁：编排、校验、人工审批`）
- en：`A production-shaped LLM agent gate: 13-node LangGraph orchestration, four parallel evidence collectors, policy-guarded tools, deterministic validators with bounded retries, and a human approval that survives a process kill. 132 funded live runs, 8/8 aggregate gates (30/44 strict).`
- zh：`按生产模式设计的 LLM Agent 发布门禁：13 节点 LangGraph 编排，四路并行证据采集，工具层按节点白名单加调用预算，确定性校验挡在出口，人工审批断电也能恢复。132 次付费在线评测，8/8 聚合门禁全过（严格口径 30/44）。`
- 徽章：`132 live runs` / `8/8 gates · 30/44 strict` / `citation fidelity 100%`
- （G2 修正记录：claims 矩阵只授权 "Production-shaped"，zh 用"按生产模式设计"；30/44 必须随附任何聚合门禁声明，卡片层也不例外。）
- 措辞红线：说"四路并行证据采集"，不说"四路检索"（仅一路是真混合检索+重排）；不自称 RAG 系统；工具层是"策略守卫的工具层"，不是模型 function calling（这是仓库里有辩护的刻意设计，详情页可作为设计取舍讲）。eyebrow 从 "release engineering" 改为 `AI Agent / LLM systems`。"生产级/production" 表述在 G2 时对照 `portfolio-site-lanes/release-guardian/docs/release-guardian-claims.md` 的 DO-NOT-CLAIM 清单确认；若被禁用，改"按生产模式设计"。

**Privacy Preflight**（cn-gloss：`浏览器本地的敏感信息脱敏工作台`）
- en（保留现文案，微调结尾）：`A black box drawn over text is not redaction. This browser workbench detects sensitive content locally, destroys it, then re-opens the output to prove it is gone — or blocks the export. English and Simplified Chinese OCR included. Nothing leaves your browser.`
- zh：`在文字上盖个黑块不叫脱敏。这个工作台在浏览器本地找出敏感内容、彻底销毁，再把导出的文件重新读一遍，验证内容确实没了——验证不过，导出就被拦下。支持中英双语 OCR，全程不出浏览器。`
- 徽章：`96 worker tests` / `OCR 19/19 hits · 2 FP` / `local-only`

**Exactly-Once Drills**（cn-gloss：`消息队列与流处理的故障恢复验证`）
- en：`Ten ways to break the same pipeline: MySQL CDC on one path, Debezium → Avro contracts → Kafka on the other, both landing in Flink → Iceberg. After every induced failure, source state, table snapshots, and event IDs are reconciled — all ten recoveries came back with zero diffs, at 1,791 events/s sustained.`
- zh：`一条管道两路进：MySQL CDC 直连一路，Debezium → Avro 契约 → Kafka 一路，汇进 Flink → Iceberg——然后换十种方法把它弄断。每次弄断之后，核对源库状态、表快照、事件 ID 三方对不对得上：十种恢复全部零差异，压测吞吐 1,791 events/s。`
- 徽章：`10 failure classes` / `0 snapshot diffs` / `1,791 events/s`

**Triage Router**（cn-gloss：`大模型成本路由：三层级联按置信度分发`）
- en：`The expensive model was the wrong default: on held-out data Claude Sonnet 5 ties Haiku 4.5 at 2.8× the cost, and under a shared output budget it silently answers nothing on up to 2.5% of calls. A confidence cascade routes each complaint to the cheapest tier that can handle it, measured against 11 years of drift. The in-page demo replays those measured runs.`
- zh：`贵的模型不该是默认选项：留出集上 Claude Sonnet 5 和 Haiku 4.5 统计上打平，Sonnet 价格却是 Haiku 的 2.8 倍，共享输出预算时还会在最多 2.5% 的调用里悄悄交白卷。置信级联把每条投诉分给接得住的最便宜一档，拿跨 11 年的分布漂移数据实测过。页内 demo 回放的是这些实测记录。`
- 徽章：`+0.037 macro-F1` / `−$120.58 / 1k calls` / `drift 2015–2026`

### 5.4 次级行

**Crossover Study**（cn-gloss：`推荐系统个性化收益的对照研究，发布 null 结果`）
- en：`How much history does a user need before personalization beats popularity? On 43.9M Amazon reviews: never — the mechanism is 41% catalog churn, measured under pre-registered tests. On a low-churn corpus the crossover appears at n*=20. Spark + Iceberg, one 16GB laptop.`
- zh：`用户要攒多少历史，个性化才赢得过热门榜？4390 万条 Amazon 评论给的答案是：攒多少都不行——原因量出来了，是 41% 的目录换血率。所有检验预先注册。换到换血慢的数据集，交叉点出现在 n*=20。Spark + Iceberg，一台 16GB 的 Mac 跑完全程。`

**RAG Quality Lab**（cn-gloss：`RAG 回归评测基线：知识库一动就重测`）
- en（保留现有主线）：`A knowledge-base update that looked harmless degraded the strongest pipeline on 4 of 12 controlled questions. The regression suite caught it; the same evidence lifecycle now survives an 11,309-document corpus.`
- zh：`一次看着无害的知识库更新，让最强的 pipeline 在 12 道受控题里翻了 4 道。回归测试当场抓住；同一套证据流程，现在扛得住 11,309 份文档。`

**Ask Portfolio**（cn-gloss：`作品集 RAG 问答助手，站里任何数字都能问`）
- en：`The assistant in the corner is a project too: a knowledge base built from these repos at build time, keyword retrieval, a guard model in front, Redis rate limits behind. Ask it about any number on this site.`
- zh：`右下角那个助手本身也是个项目：构建的时候从这几个仓库生成知识库，回答前先过一道审查模型，身后还挂一层 Redis 限流。站里任何一个数字，都可以拿去问它。`

### 5.5 方法论三句（替代三学科卡）

- en：`Every number ships with its n, its interval, and the command that produced it.` / `Cost drives the calls: a $12.7 teacher dataset lost to free rule labels, and that receipt is public.` / `Failed runs stay in the record — in red, on the page.`
- zh：`每个数字都带着 n、置信区间和生成它的命令。` / `先算账再选方案：$12.7 的教师数据输给了免费规则标签，这笔账就摆在页面上。` / `跑砸的实验不删档——标成红色，留在原地。`

### 5.6 归档行（一行一个）

- Margin Control Tower — cn-gloss `浏览器里的毛利归因工作台（DuckDB-WASM）`；en 一句 `Weekly margin moves, decomposed in the browser on a hash-verified Olist aggregate — DuckDB-WASM, no server.`
- Credit Policy Desk — cn-gloss `从评分到信贷策略的模拟器（DuckDB-WASM）`；en 一句 `A score is not a policy. This desk walks the rest of the way: expected loss, thresholds, review capacity, and a recorded human decision.`

### 5.7 页脚

- en：`Applied LLM systems, measured end to end.` + `Last updated {build date}`
- zh：`大模型应用系统，从训练到上线，每一步都对得上账。` + `最近更新 {构建日期}`

---

## 6. README 中英穿插规范（全仓库统一）

规则 R1–R8（完整示例见 plan P5 任务内模板）：

- **R1 标题**：单行 `## Quickstart · 快速开始`；中文 ≤6 字；API/FAQ/License 不译。
- **R2 正文**：英文段为正常段落，中文紧跟其后放 `>` 引用块（灰字左竖线 = 沉浸式翻译观感）；每个英文段最多一个引用块。
- **R3 压缩翻译**：中文允许压缩与本地化补充，长度 ≤ 英文的 80%，不逐句直译。
- **R4 列表**：`- **English lead** — 中文跟注`；超长条目在同 bullet 内 `<br>` 接中文。
- **R5 表格**：数据行永不翻译；表头可 `Metric<br>指标`；表下 caption 用 `<sub>English · 中文</sub>`。
- **R6 纯英文**：命令、代码块及注释、API/配置键、badges、日志、benchmark 数据、License。
- **R7 纯中文**：仅中文读者相关内容（pip 镜像、AutoDL 说明）单独成引用块。
- **R8 范围与纪律**：只对叙事层（tagline/动机/取舍/结果解读/局限）双语；reference 层纯英文；改英文段必须同 commit 改中文块。

推广顺序：exactly-once-drills 试点（双语内容最全）→ frontier-forge（现纯英文，补 zh 层）→ crossover-study → 其余仓库随改随换。合并后删除 `README.zh-CN.md`（git 历史仍在）。

---

## 7. GitHub 元数据规格

- **Pins（顺序即优先级）**：frontier-forge → exactly-once-drills → privacy-preflight-web → triage-router → crossover-study → rag-quality-lab。Voice-in-Security 下架。
- **每仓必填**：About 一句话（含 JD 英文词）；topics（从 `llm, fine-tuning, vllm, inference, cpp, kafka, flink, iceberg, rag, agents, evaluation, spark, duckdb, privacy, ocr` 中选贴合项）；homepage 指向 xiangguozhang.com 对应项目页。
- **README H1 = 仓库名**（消灭 Batch Recsys Lab / Exactly Once Stream / Credit Policy Lab / Triage Router Lab 四处两张皮）；展示名可在副标题行写（如 `# crossover-study` + 副标题 `Crossover Study — when does personalization beat popularity?`）。
- **仓库不改名**（避免简历/外链断裂；GitHub 虽有 redirect，不赌）。
- **agent 工件**：`CLAUDE.md`、`AGENTS.md` 留 root（工具配置文件，2026 年的正常工程配置）；`PLAN.md`、`STATUS.md`、`DECISIONS.md`、`UPGRADE_PLAN*.md`、`EXPERIMENT_LOG.md` 等过程文档 `git mv` 到各仓 `docs/engineering-log/`，README 里给一行链接（"工程决策与阶段日志见 docs/engineering-log/"）——把过程痕迹从"泄漏"重构为"有纪律的工程日志"。
- **外链卫生**：所有 `*gpt-review*.vercel.app` 链接替换为 xiangguozhang.com 对应页或 `luciszhang.github.io/<repo>`；wloc-spoofer 转 private。
- **Profile README（LucisZhang/LucisZhang）极简三块**：定位句（与站点同文）→ 六行项目表（名 / 一句话 / 关键数字 / 链接）→ 站点+邮箱。禁止：stats 卡、streak、技能徽章墙、emoji 列表。

---

## 8. Non-goals 与 Backlog

**Non-goals（本次明确不做）**：深色模式；**常驻** GPU live demo（按需唤醒与 CPU 副本是可选 P6，见 §3.3）；仓库改名；博客/TIL 系统；多语言路由（/zh）；简历 PDF 重写（应随后单独做，素材可直接取 §5）。
**Backlog（下一个项目决策，另起会话）**：多模态小项目（市场最大缺口，与实习的 vision 背景互补校验后再定）；Go 或 Java 的一个显性服务组件；60–90s 旗舰录屏。

## 9. 人工 Gate（不可授权给执行 agent 的确认点）

1. **G1 定色**：P1 完成后，真机（Mac + Windows + 手机）截图确认朱砂红在米纸上的读感；若偏"喜庆/错误感"，退 `#8a3324`，不回退到橙。
2. **G2 事实核对**：P2 完成后，逐数字对照源仓库复核全站指标与措辞（尤其 Triage Router 的 replay 表述、Exactly-Once 的 10 类/双路径、旗舰的 Phase 7 口径）。
3. **G3 旗舰数据同步**：P4 开工前，frontier-forge 仓库 demo 数据必须已同步 Phase 7（否则 Evidence Explorer 与 README 口径冲突）。
4. **G4 中文终稿**：全部 zh 文案由用户通读一遍（真人感的最终裁判是真人）。
5. **G5 GitHub 发布**：pins/私有化/外链替换属半公开动作，执行前列清单给用户过目。
6. **G6 公网推理端点安全评审**（仅 P6）：上线前核对固定模板、限流阈值、日预算熔断值、超额降级路径；预算数额由用户拍板。
