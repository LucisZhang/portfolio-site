# 个人作品集网站 · 构建方案（Data / DE / AI 三轨）

> 本文档综合了三份 Deep Research（ChatGPT / Gemini / Grok）的结论，做过交叉验证与去重，并针对你的两个硬约束重写：**(1) 求职方向是数据分析 / 数据工程 / AI 应用三轨；(2) 用 Fable5 当 orchestrator、Codex 当 subagent 尽量全自动生成。** 可直接作为 driving spec 交给 agent 团队执行。

---

## 0. 一句话定位

**"我把原始数据变成自主行动。"**
数据工程（地基：抽取与结构化）→ 数据分析（翻译：洞察与决策）→ AI 应用（激活：自主执行）。
三轨不是三个孤立技能，而是一条完整数据链上的三段——这是把"多方向"从"不专注"扭转为"我能打通全链路"的关键叙事（Grok 明确警告：分站 = 不专注；三份都认同合成一个站）。

---

## 1. 核心策略（三份报告的收敛结论）

| 原则 | 说明 | 来源共识 |
|---|---|---|
| 作品集 = "proof of work"，不是装饰 | 招聘官看的是叙事深度、生产信号、业务影响、可现场检视 | 三份一致 |
| 为"前 20 秒扫读"优化 | 首页克制、可扫读；深度放到每个项目子页 | ChatGPT / Grok |
| 少而深 | 3–5 个深度叙事项目 >> 20 个浅项目 | Grok / ChatGPT |
| 过程即产品 | DE/AI 里，展示编排循环、错误处理、fallback，比展示最终输出更有说服力 | Gemini / Grok |
| 每个项目 = 迷你 case study | 业务问题 → 假设 → 权衡 → 指标 → "还能怎么做" | 三份一致 |

### 一个必须正视的张力：炫 vs. 全自动生成

三份在"炫的程度"上分歧很大：

- **Gemini**：极致 fancy——WebGPU、Three.js 3D 英雄物件、多人空间导航、中式高密度界面。
- **ChatGPT**：明确反对满屏动效单页站，主张克制、快、可扫读，一个招牌交互足矣。
- **Grok**：AI 让代码同质化，**判断力 + 可观测性**才是胜负手，别沉迷视觉炫技。

**本方案的裁决（偏 ChatGPT/Grok）**：
你的构建约束是 agent 全自动、不要人工干预。而 bespoke WebGL / 3D / 复杂 GSAP 动效恰恰是 coding agent 最容易翻车、最需要人肉救火的区域（Grok 自己也承认复杂/新颖架构需重度人工监督）。而且那类炫技证明的是"创意前端"能力——不是你的目标岗位。

**所以："设计新颖"落在分轨的交互式数据可视化组件上，而不是首页特效。** 这些组件（React Flow 管道、trace viewer、DuckDB-WASM 面板）既足够 fancy，又是文档充足的成熟模式，Codex 能稳定生成。**这是整个方案的支点。**

---

## 2. 信息架构（Comb-Shaped，梳状结构）

Gemini 的梳状模型很合适：横向脊柱 = 统一身份，纵向齿 = 各轨深度子路径。

```
/                      → 身份脊柱：定位 + 会动的流水线图（同时当导航）
/analytics             → 轨道门户：方法论概览 + 该轨项目卡片
/analytics/[project]   → 项目沙盒：可交互 dashboard / DuckDB-WASM 探索
/engineering
/engineering/[project] → React Flow 可交互管道 + 遥测面板
/ai
/ai/[project]          → 现场 demo + 暴露的 trace / 评估
```

**招牌交互（取代 3D，agent 可稳定生成）：命令面板 Cmd/Ctrl+K。**
用 `cmdk` 或 `kbar` 库，让招聘官敲 "Airflow DAG" / "RAG eval" 直接跳到对应项目。它一箭三雕：解决多轨导航、signal 技术受众的操作习惯、库成熟 agent 好写。这是 Gemini 提的、也是三条里最值得保留的"fancy"点。

**首页那张流水线图**同时是叙事和导航：三段（DE→Analytics→AI）用 React Flow 画成一条会流动的管道，点每段进入对应轨道门户。这解决了"三轨看起来散"的核心难题（Gemini 的视觉连续性主张）。

---

## 3. 技术栈选型（为什么这套最适合 agent 生成）

**推荐：Next.js (App Router) + MDX + Tailwind + shadcn/ui，部署 Vercel。**

理由（综合三份 + 你的约束）：
- AI 应用轨需要真实服务端行为（RAG/agent demo 的 API route），Next.js 原生支持。
- Next.js 有官方 `AGENTS.md` 约定、MCP 支持、AI-coding-agent 指南，是**训练数据里覆盖最充分的框架 → agent 幻觉最少**（ChatGPT 强调）。
- shadcn/ui + Tailwind = 组件可复制、类名固定，agent 生成 UI 时最不容易跑偏。

**唯一警惕（ChatGPT 提）**：Next.js 容易被过度 hydrate、过度 app 化。**纪律：内容页尽量静态（MDX），只有三个现场 demo 用 server route。**

> 备选：如果你希望站点更偏"内容为主、极少 JS"，Astro 也是 agent 友好选择（更简单的生成问题、更低 bundle）。但 AI demo 轨会更别扭。**除非你更熟 Astro，否则默认 Next.js。** 这是一个你可以拍板的开放点。

关键库清单（都验证过是成熟、文档足、agent 好生成的）：
- 管道 / ReAct 可视化：`reactflow`（DE 与 AI 两轨共用主力）
- 浏览器内分析：`@duckdb/duckdb-wasm` + `recharts` / `visx`
- AI trace 展示：`AgentPrism`（evilmartians，React 组件）或接 `Langfuse` / `LangSmith` 的 view-trace
- 现场 chat demo：Vercel `AI SDK`（原生），或 embed `Gradio` / `Hugging Face Spaces`
- 命令面板：`cmdk`

---

## 4. 分轨可视化组件规格（"设计新颖"落在这里）

### 轨 1 · 数据分析 —— "Observable Insights"

- **原生 dashboard，不用 iframe。** 用 Recharts/visx 在页内画图；或 Evidence.dev（Markdown+SQL 编译成静态站，signal "analytics as code / 版本化数据工作流"）。
- **杀手锏：DuckDB-WASM 浏览器内计算。** 让招聘官在页面里实时筛/聚合几百万行、零服务端延迟。既是硬核 signal（"能造高性能数据产品"），又是成熟可生成模式。
- **Scrollytelling**：一个旗舰 EDA，图表随滚动变化，和叙事文本对齐。
- 首屏四件套（分析页 above the fold）：业务问题 → 你的角色 → 关键图/dashboard → 结论建议。SQL/notebook/方法论放在下面。

### 轨 2 · 数据工程 —— "Pipeline Anatomy"（你最难可视化、但杠杆最高的轨）

- **React Flow 可交互管道**：可拖拽节点 = ETL 各阶段；动画边 = 数据流向；medallion 配色（Bronze 原始 / Silver 校验 / Gold 业务聚合）。
- **点节点 → 遥测面板**：吞吐量、consumer lag、partition health（可用回放/模拟数据）。证明你懂分布式系统的运行现实。
- **点边 → JSON schema**：展示数据契约（data contract）理解。
- **Impact-analysis 开关**（dbt lineage 风格）：高亮某上游节点退化时会波及的所有下游 dashboard，证明数据治理与韧性理解。
- 这是"把不可见工作变可见"的最高杠杆组件，且 React Flow 文档极全，Codex 能稳定产出。

### 轨 3 · AI 应用 —— "Exposed Brain"（三份都认为这是最大差异化）

- **现场可跑 demo**（RAG / agent / chatbot）——AI SDK 原生 或 HF Spaces embed。
- **暴露 trace（核心差异化）**：每次任务后提供 "View Trace"，展示 Thought → Tool → Action → Observation，加 latency（P50/P99）、token、成本。用 AgentPrism 或接 Langfuse/LangSmith。**光有能跑的 chatbot 已是零门槛；把内部推理和评估暴露出来才是 2026 的分水岭。**
- **ReAct 循环可视化**：用 React Flow 实时渲染 agent 内部循环。
- 加分：MCP 工具开关 demo——让招聘官在浏览器里开关模拟工具，看 agent 如何重新规划。
- 务必至少展示一项：公开 trace / eval dashboard / 失败分类 / before-after 改进对比。

> 复用点：**React Flow 同时服务 DE 管道 + AI 的 ReAct 循环**，DuckDB-WASM + 图表库服务分析轨。整套零 bespoke WebGL —— 与"全自动生成"完全兼容。

---

## 5. 项目分级包装（对应你"现状不一 / 源码不全"的实际情况）

按可展示程度分四级，**任何一级都不要写"coming soon"**，永远用你手上最强的已完成产物开场（ChatGPT）：

| 现状 | 处理方式 |
|---|---|
| 有现场 demo / 能跑 | 直接 embed，配 case-study 外壳 + trace/eval |
| 有 demo 但角度不对 | 重新包装叙事框架（业务问题 → 权衡 → 指标），demo 照用 |
| 源码不全 / 已丢失 | 出"重建页"：问题 + 架构图 + 截图 + 指标 + lessons learned |
| 涉及 NDA / 保密 | 明确标注保密，去名去 logo，只讲规模/你的角色/约束——透明本身就是专业信号 |
| 什么都没有但值得放 | 补一段 60–90 秒 walkthrough 视频 / GIF + 架构图，胜过空占位 |

**GitHub 是作品集的一部分（ChatGPT，与 Gemini "绝不外链"相反——此处采信 ChatGPT）**：每个精选 repo 配强 README，profile README 指回网站。招聘官期待看到 repo；原生优先做 hero demo，但链去 repo 是正常且被期待的。

---

## 6. 驱动 Fable5 + Codex 的构建流程

Grok 的现状结论：**多 agent 自动生成"能用但非即插即用魔法"**，成在有明确 scope 的模块（脚手架、组件、测试、文档、并行子任务），败在模糊 prompt 导致 drift、幻觉集成、缺测试关卡。**把 agent 团队当成真正的开发团队来管：spec 先行、代码评审、CI 式关卡。**

### 6.1 放进仓库根目录的 `AGENTS.md`（可直接用）

```markdown
# AGENTS.md — Portfolio build rules

## Stack (do not deviate without approval)
- Next.js App Router + TypeScript, Tailwind, shadcn/ui, MDX for content.
- Content pages MUST be static (MDX). Only /api routes for the 3 live AI demos.
- Interactive viz libs: reactflow, @duckdb/duckdb-wasm, recharts, cmdk, AgentPrism.
- NO WebGL/Three.js/WebGPU. NO bespoke animation engines. One signature
  interaction only: Cmd+K command palette (cmdk).

## Architecture
- Routes: /, /[track], /[track]/[project]. track ∈ {analytics, engineering, ai}.
- Each project is an isolated MDX file + a page-local viz component.
- Reuse: PipelineGraph (reactflow) for DE + AI ReAct loop; DataExplorer
  (duckdb-wasm) for analytics.

## Quality gates (a task is NOT done until all pass)
- `tsc --noEmit` clean, `eslint` clean, `next build` succeeds.
- Every project page renders the standard case-study block (see below).
- Lighthouse performance >= 90 on homepage.

## Case-study block (mandatory top of every /[track]/[project])
problem · audience · your role · result(with metric) · stack · links(demo/repo/video)

## Workflow discipline
- Spec first: read the project brief before writing code. Ask if scope unclear;
  do not invent integrations or datasets.
- One project page per branch/worktree; parallelize across projects, not within.
- After each task: run the quality gates, then summarize diffs for review.
```

### 6.2 分工

- **Fable5 (orchestrator)**：读本文档 → 拆成任务（脚手架 → 共享组件 → 逐项目页 → 首页 → 命令面板 → 部署）→ 分派 Codex → 跑质量关卡 → 汇总待评审 diff。
- **Codex (subagent)**：执行有明确 spec 的模块。**agent 强在样板/组件/测试/文档；高层架构与最终判断留给你把关**（Grok）。
- **人工必查的关卡**（不要全自动跳过）：① 首页叙事与定位文案；② 每个项目的业务指标真实性；③ 三个现场 demo 的 API key / 成本 / fallback。

### 6.3 并行化建议

用 git worktree 让多个 `/[track]/[project]` 页并行生成（各自独立、互不干扰）；共享组件（PipelineGraph / DataExplorer / TraceViewer / CommandPalette）先串行做好、锁定接口，再并行灌项目。

---

## 7. 分阶段执行计划

1. **脚手架**：Next.js + Tailwind + shadcn/ui + MDX，定好路由与 track 标签。锁 `AGENTS.md`。
2. **共享组件**（串行、先锁接口）：PipelineGraph、DataExplorer(DuckDB-WASM)、TraceViewer、CommandPalette(Cmd+K)、CaseStudyBlock。
3. **首页**：定位文案 + 会流动的三段流水线图（复用 PipelineGraph）+ 顶部三项目 + 命令面板。**为前 20 秒扫读优化。**
4. **逐项目页**（并行 worktree）：每轨挑 1–2 个旗舰，套 case-study 模板 + 该轨招牌可视化组件。先上 **3–5 个精品，而非 10 个平庸**。
5. **分级包装**：按第 5 节处理没 demo / 丢源码 / 保密的项目。
6. **性能与过渡**：变量字体节制用，View Transitions API 做页面切换，滚动动效只服务定位不拖慢访问。
7. **上线 v1 → 看数据迭代**：先发精品版，观察招聘官点哪些页，持续打磨头部项目的摘要 / trace / 图表 / 指标。

---

## 8. 留给你拍板的三个开放点

1. **栈**：默认 Next.js（AI demo + agent 友好）。若你想要极少 JS 的内容站且更熟 Astro，可换。
2. **中式高密度界面**（Gemini 主推的"density as competence"）：本方案按**可选招牌 mode**处理（做一个"high-density mode"开关而非默认），避免默认态过载、也避免 agent 生成难度飙升。你若很想要，可提级为默认。
3. **炫的上限**：本方案刻意把 3D/WebGPU 砍掉以保全自动生成。若你愿意接受某个页面手工介入换取一个 3D 英雄组件，可单独开一个"人工特区"，不破坏其余全自动。
