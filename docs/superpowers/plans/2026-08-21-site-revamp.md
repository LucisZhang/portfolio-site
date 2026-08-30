# xiangguozhang.com 整站改版实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按设计规格把个人网站与 GitHub 门面改版为"大模型系统工程师"叙事：编辑风视觉、旗舰分层、产品先行的项目页、去 AI 味双语文案、中英穿插 README。

**Architecture:** 六个阶段（P0–P5），依赖单向：GitHub 元数据（P0，独立）→ 站内 token 层（P1）→ 内容层（P2）→ 首页 IA（P3）→ 项目页模板与旗舰页（P4）→ 新页面与 README 推广（P5）。每阶段独立可验收，建议一个 phase 一个 session。

**Tech Stack:** Next.js 16 App Router（SSG）、TS 常量内容层（`{en,zh}`）、手写 globals.css token、React client 组件 demo、gh CLI。

**Spec:** `docs/superpowers/specs/2026-08-21-site-revamp-design.md`（下称 SPEC；所有最终文案、token 值、规则均以 SPEC 为准，本计划不重复长文本）。

## Global Constraints

- 首页 JS ≤200KB gzip、CSS ≤145KB gzip、Lighthouse ≥90（`verify:performance` 必须过）。
- 严格 CSP：禁外部脚本/字体/CDN；新增字体字节数 = 0（只用系统栈与现有自托管 Plex）。
- `src/lib/structural-copy.ts`、`*.generated.*`、`public/generated/`、`public/duckdb/` 是脚本产物，**禁止手改**，改源头脚本后再生成。
- 所有可见字符串必须 `{en, zh}` 双语齐动（`check:localization` 与 Playwright en/zh×4 视口矩阵会拦）。
- 涉及 `public/case-studies/` 数据的改动必须同步 manifest 哈希（`verify:evidence` 会拦）；**严禁编造数据**，一切数字以源仓库 JSON 为准。
- 文案一律使用 SPEC §5 的最终字符串，不得自行创作或"润色"；语言规则见 SPEC §4。
- 每完成一个任务 commit 一次（`feat(site): …` / `chore(gh): …`）；**不 push、不 deploy**——遵守仓库 STATE.md 的人工发布 gate。
- 本地仓库路径：站点 `/Users/hsiangkuochang/portfolio-site`；源仓库 `/Users/hsiangkuochang/{frontier-forge, crossover-study, exactly-once-drills, margin-control-tower}`。
- 人工 Gate G1–G5 定义见 SPEC §9；标注了 Gate 的任务完成后必须停下等用户确认，不得继续下一阶段。

---

## Phase P0 — GitHub 门面与仓库卫生（零站点风险，先行）

### Task P0.1: 仓库元数据补齐（About / topics / homepage）

**Files:** 无代码文件；gh CLI 操作。

- [ ] 对下列仓库执行（描述文本按 SPEC §1 的关键词映射写一句话，含 JD 英文词）：

```bash
gh repo edit LucisZhang/frontier-forge \
  --description "Post-train a 4B LLM to 99.05% task success, serve on vLLM behind a C++20 token-aware gateway, autoscale on k3s — every dollar measured (\$35.68 total)" \
  --homepage "https://xiangguozhang.com/ai/frontier-forge" \
  --add-topic llm --add-topic fine-tuning --add-topic vllm --add-topic inference --add-topic cpp --add-topic kubernetes
```

- [ ] 同样为 exactly-once-drills（kafka/flink/iceberg/cdc/exactly-once）、crossover-study（recommender-system/spark/iceberg/ab-testing）、triage-router（llm/routing/cost-optimization/evaluation）、rag-quality-lab（rag/evaluation/retrieval）、privacy-preflight-web（privacy/ocr/redaction/wasm）、margin-control-tower（duckdb/wasm/analytics）、credit-policy-desk（duckdb/risk/analytics）、release-guardian（langgraph/agents/llm/evaluation/human-in-the-loop——注意不用 release-engineering 作首要 topic，Agent 口径盘子是发布工程口径的 7.6 倍）补 About/topics/homepage（homepage 指向站点对应项目页，路径见 `src/lib/projects.ts` 的 slug；frontier-forge 与 crossover-study 的站点页在 P4/P5 上线，homepage 可先填仓库自身 Pages 或留待 P5 回填）。
- [ ] `gh repo edit LucisZhang/wloc-spoofer --visibility private`（Gate G5：执行前把本任务全部命令清单发给用户过目）。
- [ ] Verify：`gh repo view LucisZhang/frontier-forge --json description,repositoryTopics,homepageUrl` 逐仓抽查非空。

### Task P0.2: Pins 重排

- [ ] 用 GraphQL 置 pin（顺序即展示序）：frontier-forge, release-guardian, triage-router, exactly-once-drills, privacy-preflight-web, crossover-study。（rag-quality-lab 让位给 release-guardian——Agent 口径盘子大一个量级；RAG 关键词由 About/topics 层继续覆盖。）

```bash
# 先取各仓 node id
gh api graphql -f query='{ repository(owner:"LucisZhang", name:"frontier-forge"){ id } }'
# 依次取 6 个 id 后：
gh api graphql -f query='mutation($ids:[ID!]!){ replacePinnedItems(input:{ownerId:"<user-node-id>", itemIds:$ids}){ clientMutationId } }' -f ids='[...]'
# user node id: gh api graphql -f query='{ user(login:"LucisZhang"){ id } }'
```

- [ ] 若 replacePinnedItems 权限不足，回退方案：输出 6 个仓库清单让用户在 github.com/LucisZhang 手动 pin（2 分钟）。
- [ ] Verify：WebFetch/浏览器打开 profile 页确认 pin 顺序。

### Task P0.3: README H1 对齐仓库名（消灭两张皮）

**Files（各源仓库）:**
- Modify: `crossover-study/README.md`（H1 `Batch Recsys Lab` → `# crossover-study`，副标题行 `Crossover Study — when does personalization beat popularity?`）
- Modify: `exactly-once-drills/README.md` 与 `README.zh-CN.md`（H1 `Exactly Once Stream` → `# exactly-once-drills`）
- Modify: triage-router、credit-policy-desk 仓库 README H1 同理对齐（`gh api repos/LucisZhang/<repo>/contents/README.md` 或本地 clone 缺失时先 `gh repo clone`）。
- [ ] 每仓一个 commit：`docs: align README title with repo name`。
- [ ] Verify：`grep -m1 '^# ' README.md` 输出 = 仓库名。

### Task P0.4: 过程文档迁入 docs/engineering-log/

**Files（frontier-forge / crossover-study / exactly-once-drills 三仓）:**

- [ ] 每仓执行：`mkdir -p docs/engineering-log && git mv PLAN.md STATUS.md DECISIONS.md UPGRADE_PLAN*.md EXPERIMENT_LOG.md docs/engineering-log/ 2>/dev/null || true`（存在哪个移哪个；**CLAUDE.md、AGENTS.md 留在 root 不动**）。
- [ ] 检查仓内引用：`rg -l 'PLAN\.md|DECISIONS\.md|UPGRADE_PLAN|EXPERIMENT_LOG|STATUS\.md' --glob '!docs/engineering-log/**'`，把 README/CLAUDE.md/AGENTS.md 里的相对链接改为 `docs/engineering-log/...`。
- [ ] README 的 Links/文档索引小节加一行（中英穿插格式见 SPEC §6）：`Engineering decisions and phase logs live in [docs/engineering-log/](docs/engineering-log/).` + `> 工程决策与阶段日志在 docs/engineering-log/。`
- [ ] Verify：`ls *.md` 各仓 root 只剩 README/CLAUDE/AGENTS（+LICENSE 等常规文件）；`rg` 无断链。

### Task P0.5: 外链卫生（gpt-review 域名）

- [ ] `rg -l 'gpt-review' /Users/hsiangkuochang/exactly-once-drills /Users/hsiangkuochang/portfolio-site` 找到全部出现点。
- [ ] 替换为 `https://xiangguozhang.com/engineering/exactly-once-drills`（站内页已存在）。
- [ ] Verify：两仓 `rg 'gpt-review'` 零命中。

### Task P0.6: Profile README

**Files:**
- Create: 新仓 `LucisZhang/LucisZhang`，`README.md`。
- [ ] 内容三块（文本用 SPEC §5.1 定位句 + §5.2/5.3 数字）：定位句（en 一行 + `>` zh 引用块）；六行项目表（Project / One line / Number / Link，数据行纯英文，见 SPEC R5/R6）；`xiangguozhang.com · HsiangKuoChang@outlook.com`。禁止 stats 卡/streak/徽章墙。
- [ ] `gh repo create LucisZhang/LucisZhang --public` + push README（此仓例外可直接 push，Gate G5 清单内一并确认）。

**P0 验收**：G5 清单确认后执行完毕；profile 页目视检查：pin 序正确、无 Voice-in-Security、profile README 渲染正常。

---

## Phase P1 — 设计 Token 层（先于一切页面改动）

### Task P1.1: globals.css token 替换

**Files:**
- Modify: `portfolio-site/src/app/globals.css`（`:root` 区，文件头部）

- [ ] 按 SPEC §2.2 替换/新增 token（注意保留现有 Okabe-Ito 图表色板变量与缩写别名机制不动，只改品牌 token）。
- [ ] 全局排查旧绿 accent 的引用（`rg 'green|#2f765f|var\(--green' src/app/globals.css src/components`），改指向新语义：链接/强调 → `--accent`，pass 状态 → `--ok`。
- [ ] 圆角与阴影清零：`rg 'border-radius|box-shadow' src/app/globals.css` 逐个改为 `var(--radius)`/删除（图表 tooltip 等功能性阴影可保留，逐条判断并在 commit message 里列出保留项）。
- [ ] Verify：`npm run build && npm run verify:performance`（CSS ≤145KB gzip）；`npx playwright test`（现有断言若含旧色值需同步更新）。

### Task P1.2: 字体与标题尺度

**Files:**
- Modify: `portfolio-site/src/app/globals.css`（heading 规则）；`src/app/layout.tsx`（若 next/font 配置需删 Plex Sans 700）

- [ ] Display 标题栈按 SPEC §2.3（EN 系统衬线；zh ≥28px 宋体、<28px 黑体——用 `:lang(zh)` 或现有 lang class 机制实现，先 `rg 'lang'` 摸清现状再动）。
- [ ] h1 尺度 `clamp(2.4rem, 5vw, 4.2rem)`；mono eyebrow 类 `.eyebrow` 按 SPEC §2.3 规格建立（若已有类似类则改造之）。
- [ ] 删除 Plex Sans 700 weight 文件引用（`rg '700' src/app/layout.tsx src/app/globals.css` 确认无残留使用后删）。
- [ ] Verify：build + Playwright 视口矩阵；肉眼检查 zh 首页标题在 375px 视口不发虚（截图存 `docs/superpowers/plans/artifacts/`）。

### Task P1.3: 移除滚动渐显

**Files:**
- Modify: 搜 `rg -l 'IntersectionObserver|reveal|fade' portfolio-site/src`（含 `src/styles/flourishes/`）定位现有 reveal 机制。

- [ ] 删除滚动渐显逻辑与相关 CSS；保留并新建两类动效：hover 120–160ms、旗舰数字 count-up 组件（P3 使用，本任务先建 `src/components/CountUp.tsx`，`prefers-reduced-motion` 时直接渲染终值）。
- [ ] Verify：禁 JS 环境（Playwright `javaScriptEnabled: false`）下首页所有文本可见；动效项符合 SPEC §2.5。

**P1 验收 → Gate G1**：真机三端截图（Mac/Windows/手机）交用户定色；未确认前不进 P2。

---

## Phase P2 — 内容与语言层

### Task P2.1: 源仓库事实同步（先于站内文案）

**Files:**
- `exactly-once-drills/`：跑 `node scripts/sync-results.mjs`（命令以该仓 Makefile/README 为准）重新生成 `dashboard/public/results/index.json`（纳入 B4 后 run）。
- `frontier-forge/`：检查 `demo/data/release.json` 是否含 Phase 7 字段；若无，按该仓 README 的 demo 重建流程（`uv sync --locked && make demo-build`）尝试再生成；**若生成物仍停在 Phase 5，停下报告用户**（数据管道在源仓库内，不得手编 JSON）——这是 Gate G3 的前置。
- [ ] Verify：EOD `index.json` 含 B3/B4 run 条目；frontier-forge release.json 含 phase7 键（或已上报阻塞）。

### Task P2.2: projects.ts 重写（名称/文案/层级/方向行）

**Files:**
- Modify: `portfolio-site/src/lib/projects.ts`
- Modify: `portfolio-site/src/lib/site-config.ts`（定位句、方向行、页脚）

- [ ] 每个项目对象：`title` 改英文原名（Exactly-Once Drills 等，**zh 字段同样放英文名**）；新增 `glossZh` 字段放 SPEC §4.4/§5 的 cn-gloss；`summary/description` 等字段逐条替换为 SPEC §5.3/§5.4/§5.6 的最终字符串。
- [ ] 新增 `tier` 字段：`flagship | core | secondary | archive`，取值按 SPEC §3.1；`featuredProjectOrder` 相应调整（frontier-forge 与 crossover-study 的完整对象本阶段先建骨架数据，页面在 P4/P5 挂）。
- [ ] Exactly-Once 条目数字更新：10 类故障、双路径、`1,791 events/s`、零差异（来源：源仓库 README，禁止沿用旧 5 类叙事）。
- [ ] Triage Router 措辞：所有 "in-browser inference" 改 "in-browser replay of measured runs" / "回放实测运行"（`rg -l 'in-browser inference|浏览器内推理' src/` 全局清）。
- [ ] Release Guardian 重定位（SPEC §5.3 措辞红线）：`tier` 设 core；eyebrow "AI application / release engineering" → "AI Agent / LLM systems"；"四路证据检索/four evidence retrievers" 全部改为 "四路并行证据采集/four parallel evidence collectors"（`rg -l 'evidence retriever|证据检索' src/`）；不得出现 "RAG" 自称。
- [ ] hero/方向行/方法论/页脚字符串按 SPEC §5.1/§5.5/§5.7 落位（方法论三句挂到现三学科卡的替换组件，组件本体 P3 改，字符串先进数据层）。
- [ ] Verify：`npm run check:localization && npm run verify:evidence && npm run build`；`rg '发布守门人|精确一次演练|毛利控制塔|投诉分流路由|隐私预检网页版|信贷策略工作台|RAG 质量实验室' src/` 零命中（旧硬译名清干净；归档项目名同样换 SPEC §5.6 格式）。

### Task P2.3: 语言黑名单进 CI

**Files:**
- Modify: `check:localization` 对应脚本（先 `rg 'check:localization' package.json` 定位脚本文件）
- Create: `portfolio-site/scripts/lint-copy.mjs`（若现脚本不宜扩展则新建并挂进 package.json）

- [ ] 实现三类检查，扫描范围 `src/lib/projects.ts`、`src/lib/site-config.ts`、`src/lib/i18n.ts` 及组件内联文案：
  1. 黑名单词（SPEC §4.2 两个列表，逐词精确匹配，白名单机制留注释可豁免）；
  2. 中英之间缺半角空格（正则 `[一-鿿][A-Za-z0-9]|[A-Za-z0-9][一-鿿]`，排除标点与代码段）；
  3. 括号译名模式 `（[^）]{2,8}演练|守门人|控制塔）` 类硬译残留。
- [ ] Verify：故意在 projects.ts 塞一个"赋能"跑脚本确认拦截，删除后全绿。

**P2 验收 → Gate G2**：产出"数字对照表"（站内每个指标 ↔ 源仓库文件:行），交用户核对；G4 中文通读可同时进行。

---

## Phase P3 — 首页信息架构

### Task P3.1: 首页重排

**Files:**
- Modify: `portfolio-site/src/app/page.tsx`
- Create: `portfolio-site/src/components/home/FlagshipSection.tsx`、`TierList.tsx`、`MethodNotes.tsx`（命名可循现组件风格）
- Delete/Modify: 三学科卡组件、07/03 计数器组件（`rg 'case studies|disciplines|个案例' src/` 定位）

- [ ] 区块顺序与内容严格按 SPEC §3.1：Hero（60vh、含证据行 mono 与方向行）→ 旗舰反白区（stat tiles 用 P1.3 的 CountUp；架构 SVG 本阶段用占位框，P4 换真图）→ 核心 4 卡 2×2（缩略图规范 SPEC §2.4；截图素材：Release Guardian/Triage/Privacy/EOD 四页现有 demo 的真实截屏，存 `public/thumbs/`，≤60KB/张）→ 次级 3 行 → 方法论 → 归档折叠（仅 Margin + Credit 两行） → 页脚（构建期注入 `最近更新` 日期：`new Date()` 于构建时序列化，勿用客户端时间）。
- [ ] 旗舰区三通路按钮：`Evidence Explorer`（P4 前先锚到 GitHub README 结果表并标 `报告先行`）/ `技术报告`（GitHub README）/ `Code`。
- [ ] 移动端：hero 高度与间距压缩，Playwright 断言 375px 视口第二屏内出现 "Frontier Forge" 文本。
- [ ] Verify：`npm run build && npm run verify:performance && npx playwright test`；`check:localization`。

**P3 验收**：桌面+移动截图给用户（非阻塞 gate，异步反馈）。

---

## Phase P4 — 项目页模板反转 + 旗舰页

### Task P4.1: ProjectPageView 模板反转

**Files:**
- Modify: `portfolio-site/src/components/ProjectPageView.tsx`、`CaseStudyBlock` 相关组件

- [ ] 区块顺序按 SPEC §3.2（Proof 区提到首屏下第一块；Problem/Audience 合并为 hero 下一段）；Results 小节内的负结果条目加 `--accent` 左边框样式（类名如 `.negative-finding`）。
- [ ] 对现有 7 个项目页回归（Playwright 截图对比 en/zh）。
- [ ] Verify：全门禁 + 手查 privacy-preflight 页（工作台成为第一屏下内容）。

### Task P4.2: frontier-forge 站内页（旗舰交付物）

**Files:**
- Create: `portfolio-site/public/case-studies/frontier-forge/`（`release.json` 从源仓库拷入 + `manifest.json` 哈希，循 `verify:evidence` 现有约定）
- Create: `portfolio-site/src/components/forge/EvidenceExplorer.tsx`、`OverloadReplay.tsx`
- Modify: `src/lib/projects.ts`（补全对象）、`ProjectProof.tsx`（注册 slug → 组件）

- [ ] **前置检查 Gate G3**：确认 P2.1 中 release.json 已含 Phase 7；同时实测 JS 预算余量（`npm run verify:performance` 输出），**若余量 <60KB，Evidence Explorer 降级为纯静态表格（无筛选交互），先保门禁**。
- [ ] EvidenceExplorer：读构建期数据，渲染断言表（列：claim / 数字 / n·CI / 命令 / SHA-256 摘要；筛选维度与正负结果标记按 SPEC §3.3；红标负结果行）。
- [ ] OverloadReplay：复用 `P1FailureReplay.tsx` 骨架，数据源 `phase7_1_sustained_gateway_bench.json`（从源仓库拷入 case-studies 并进 manifest），时间轴对比网关 vs 裸 vLLM（429/5xx 曲线）。
- [ ] 页面文案：SPEC §5.2 + 顶部诚实标注行（SPEC §3.3 第 4 条）；架构 SVG 依据源仓库 README mermaid 重绘为手工 SVG（≤40KB，用站内色 token）。
- [ ] 首页旗舰区占位图/按钮切换为真资产。
- [ ] Verify：全门禁；`verify:evidence` 新哈希通过；页面 en/zh 截图。

### Task P4.3: Ask Portfolio 次级行

**Files:**
- Modify: `src/lib/projects.ts`（新增 secondary 条目，文案 SPEC §5.4）、首页 TierList。
- [ ] 行内"试一试"动作复用现有 launcher 打开逻辑；不新建页面。
- [ ] Verify：门禁 + 点击行为正常。

---

## Phase P5 — 新页面与 README 推广

### Task P5.1: Crossover Study 站内页

**Files:**
- Create: `portfolio-site/public/case-studies/crossover-study/`（从源仓库 `demo/data`/`results/runs.jsonl` 抽取两条主曲线 + 换血率图所需的最小 JSON，总量 ≤2MB，进 manifest）
- Create: `src/components/crossover/CrossoverExhibit.tsx`
- Modify: `projects.ts`、`ProjectProof.tsx`

- [ ] 文案基底：改写源仓库 `docs/site_copy_phase9.md`（已含 run_id 锚定），过 SPEC §4 规范；卡片文案用 SPEC §5.4。
- [ ] 展品三件：Amazon null 曲线、ML-32M n*=20 曲线、41.11% 换血机制图 + receipts 抽屉（run_id 可展开）。**不移植 MiniLM 语义检索**；页尾外链完整版 demo（GitHub Pages，源仓库需 `gh repo edit --enable-pages` 或输出手动步骤给用户）。
- [ ] Verify：全门禁；资产总量 `du -sh public/case-studies/crossover-study` ≤2MB。

### Task P5.2: README 中英穿插 — 试点 exactly-once-drills

**Files:**
- Modify: `exactly-once-drills/README.md`；Delete: `README.zh-CN.md`

- [ ] 按 SPEC §6 R1–R8 合并双文件：英文段落原样保留为主干，中文从 README.zh-CN.md 取材压缩为 `>` 引用块（≤英文 80%；修正已知直译腔："生产故事"→"工程实战与取舍"、"规模诚实声明"→"这套结果的适用边界"、incident 统一译"事故"以别于 event"事件"）。
- [ ] 标题全部改单行 `## English · 中文` 式；命令/表格数据/badges 保持纯英文；结果表下补 `<sub>` caption。
- [ ] 开头 30 行自查：一句话定位 + badges + 架构图 + Quickstart 命令齐备（该仓已有，重排即可）。
- [ ] Verify：GitHub 渲染预览（`gh markdown-preview` 或推分支后网页查看）；中英块一一相邻无漂移；commit：`docs: merge bilingual README into interleaved format`。

### Task P5.3: README 穿插推广 — frontier-forge 与 crossover-study

**Files:**
- Modify: `frontier-forge/README.md`（现纯英文：为叙事层段落**新写**中文引用块——tagline、Why、各 phase 结论、limitations；reference 层不动）
- Modify: `crossover-study/README.md`（同理；研究问题/null 结论/机制/Phase 9 段双语化）

- [ ] frontier-forge 开头补一行 zh tagline 引用块 + badges（CI 若有）+ 把埋在 ~190 行的 Quickstart 提到前 40 行。
- [ ] 口号 "Know your frontier. Then forge past it." 降级为副标题斜体或删除（格言配额外，SPEC §4.3）。
- [ ] 两仓 "honest/evidence/fail-closed" 词频自查 ≤3 次/仓（超出改写）。
- [ ] Verify：渲染预览；每个英文叙事段都有且只有一个中文引用块。

### Task P5.4: 收尾回填

- [ ] P0.1 中留空的 homepage 回填（frontier-forge → `/ai/frontier-forge`，crossover-study → 站内新页路径）。
- [ ] 站内所有 GitHub 链接抽查（`rg 'github.com/LucisZhang' src/ | sort -u`）无 404。
- [ ] 产出改版前后对比截图集存 `docs/superpowers/plans/artifacts/`，供用户发布决策（push/deploy 仍由用户执行）。

---

## Phase P6（可选）— 旗舰 Live 推理层

前提：P4 已完成；用户确认预算；SPEC §3.3 "可选 Live 层" 为设计依据。**Evidence Explorer 仍是主证据，live 层是加分项，任何一步受阻都不回退 P4 成果。**

### Task P6.1: L1 — VPS 上的常驻 CPU 副本

**Files:**
- 源仓库 `frontier-forge/`：导出 R1b 模型的 GGUF int4 量化版（llama.cpp `convert` + `quantize` 流程，模型在 HF `Luciss007/frontier-forge-r1b`）
- VPS（`ops/vps` 链路）：新增 llama.cpp server systemd 单元 + 自研 gateway 前置
- Modify: `portfolio-site/src/components/forge/`（新增 LiveTriage 输入组件）+ `src/app/api/`（代理路由，循 assistant API 现有模式：限流复用 Upstash）

- [ ] 先测可行性：VPS `free -h` 确认 ≥4GB 余量；本地 llama.cpp 跑量化模型实测 tok/s 与单请求延迟，**>10s 则放弃 L1 只做 L2**，记录数字报告用户。
- [ ] 部署：llama.cpp server 仅监听 localhost；前面挂 frontier-forge 的 C++ 网关（token 预算准入）；Next.js API route 做第二层限流（IP 级）+ 固定 prompt 模板（只填充投诉文本槽位，拒绝自由指令）+ 输出长度上限。
- [ ] 页面：输入框预填 3 条示例投诉；结果旁标注 `CPU replica · GPU-measured numbers in receipts` / `CPU 副本 · GPU 实测数字见收据表`；不可用时整块自动隐藏、回退 Evidence Explorer（健康检查）。
- [ ] Verify：并发 10 请求限流生效；拔掉后端页面无报错；`verify:performance` 门禁不破。

### Task P6.2: L2 — "唤醒 GPU" scale-from-zero 演示

**Files:**
- 复用 `frontier-forge/deploy/`（Phase 7.2 k3s + KEDA 清单）部署到用户的阿里云 A10 VM（抢占式实例；VM 当前状态需用户先在控制台确认）
- Modify: `portfolio-site/src/components/forge/GpuWakePanel.tsx`（新增）+ API route（触发/查询状态）

- [ ] 交互：按钮 `唤醒 GPU`（全站同时只允许一个唤醒会话，其余访客看当前会话直播）；进度条阶段化展示（节点就绪 → 镜像拉取 → vLLM 加载 → 就绪，实测冷启 p50 ~125s 作为预期轴）；就绪后开放 10 分钟真 vLLM 推理窗口，倒计时可见；闲置 10 分钟 KEDA 自动缩零。
- [ ] 成本护栏：日唤醒次数上限（建议 8 次）+ 月预算熔断（阈值用户定，Gate G6）；超限按钮置灰并显示"今日 GPU 预算已用完"（这句话本身就是成本纪律的展示）。
- [ ] Verify：完整唤醒-推理-缩零周期录一次时间线存档；断网/超时路径回退正常。

**P6 验收 → Gate G6**：安全评审清单（固定模板、双层限流、预算熔断值、降级路径、不落盘访客输入）逐项过；预算数额与保温策略由用户拍板。

---

## Self-review 记录

- Spec 覆盖检查：SPEC §1–§7 每节均有对应任务（§1→P2.2 层级字段；§2→P1；§3→P3/P4/P5.1；§4→P2.3；§5→P2.2/P3/P4；§6→P5.2/5.3；§7→P0）。§8 non-goals 无任务，符合预期。
- 占位符检查：P4.2 架构 SVG 与录屏为"占位→替换"两步而非 TBD；录屏在 SPEC §8 backlog，不在本计划。
- 一致性：`tier` 字段名、`glossZh` 字段名、`.negative-finding` 类名、`CountUp.tsx` 组件名全计划一致；EOD 数字统一用 1,791 events/s（源头 1,791.665，展示层保留整数 + 源仓库精确值）。
- 已知不确定点（执行者遇到即停并报告，不得猜）：① `check:localization` 脚本的实际文件名与扩展点；② replacePinnedItems 的 token 权限；③ frontier-forge demo 重建是否自动纳入 Phase 7 数据（G3）；④ Playwright 断言中旧色值/旧文案的具体位置。
