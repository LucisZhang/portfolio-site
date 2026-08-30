# 2026-08-22 · xiangguozhang.com Round-2 改版设计
## 展览馆骨架 × 仪器化产品

- **状态**:设计已经用户逐级确认(骨架/首页/项目页产品形态/分期/字体/live 层/SQL 工作台),本文为定稿 spec,待用户通读后进入执行计划。
- **上游文档**:round-1 spec `docs/superpowers/specs/2026-08-21-site-revamp-design.md`(其 §4 文案铁律、§5 文案 deck、claims 矩阵继续有效,本文不重复);round-1 计划 `plans/2026-08-21-site-revamp.md`。
- **附录**(本次调研与双通道蓝图原文,均在 `docs/superpowers/specs/2026-08-22-r2-attachments/`):
  - `blueprint-deep-reasoner.md` / `blueprint-codex.md` — 双通道独立蓝图(本文是二者合成,分歧裁决见 §12)
  - `research-0-inference-hosting.md` — 4B 模型托管行情(HF/Modal/阿里 FC 等,2026-08 实测)
  - `research-1-llm-serving.md` … `research-6-clean-demo.md` — 六方向产品标杆调研(Groq/Replicate/Temporal/LangGraph Studio/ClickHouse/Jepsen/Stripe/Linear 等,2026-08 实测)

---

## 0. 背景与 Round-1 教训

Round-1(P0–P5,已执行,22 commits 在 `codex/site-revamp-p1-20260821` 未发布)换了设计 token,但用户判定"几乎等于没调整"。复盘出两个根因:

1. **只搬了皮肤,没搬骨架。** `.page-shell { min(1180px) }` 把所有 token 关进居中报告框;顶部导航 + 2×2 卡片格的传统作品集 IA 原样保留。参考稿(frontier-forge demo 的用户微调版,Claude Design 项目《Demo 微调优化方案》)的冲击力来自 full-bleed 分区 + 固定 rail + 编号展区 + 巨衬线断言标题,与容器宽度无关的排版纪律。
2. **项目页仍是报告体。** 交互组件是"可点的图表",不是"能用的产品";且既有动手组件被用户批评"要素太多、很乱"。

Round-2 = 骨架推倒重建 + 每页一台"已经在运行的仪器"。

### 参考稿的微调增量(用户在 Claude Design 手改,已 diff 确认,全部吸收)

- **去盒子化**:finding 从"彩色底块 + 4px 左边线"改为发丝线顶边 + mono 大写标签;constraint/summary 卡从白底带框改为透明分栏(发丝线分隔);箭头字符删除。
- **Rail 更安静**:字标改衬线竖排双行;导航编号移右侧、灰色(hover 才亮);offline 盖戳删除。
- **分区节奏**:砍掉第三背景色(warning-zone);收尾展区改墨蓝反白,与开头呼应。
- 分数字号加大(3.1rem),标签降级为 mono 小字。

### 双语失败样本(用户上传的 5 张截图,G5 的 DON'T 集合)

丑设计/廉价感1-3/弱AI感 五张图批的全部是"中英逐串粘连机翻"层:产品名被翻译(Outlines→概述、Forge→伪造)、claim→索赔、mono 微标签同行贴中文、编号两语复读、窄栏中文裸断行。铁律:**UI 肌理(eyebrow/标签/单位/导航/状态词)只有英文;中文只进叙事层且独立成稿**(round-1 spec §4.0 的延伸,CI 化见 §9 G5)。

---

## 1. 目标与非目标

**目标**
1. 整站(首页 + 10 项目页 + /artifact)重建为展览馆语法,视觉达到参考稿的水准("标准卷")。
2. 六个优先项目页首屏是可用的仪器:招聘者 10 秒内不读字完成一次真实动作。
3. 外链 demo 全部清除(尤其 Triage Router 的 GitHub Pages),一切体验收进站内项目页;GitHub 仓库链接只留在每页末尾 SOURCE / RECEIPTS 展区。
4. 服务器侧补齐产品件:网关 status/SSE/限流/计数、免登录限量真推理(CPU+Modal)、HTTP MCP server。
5. 沿用并强化 round-1 的诚实纪律:数字皆有出处、负结果一等公民、CI 锁死页面承诺。

**非目标**
- 不做暗色模式;不改仓库名与项目英文名;不动 GitHub README(round-1 已完成穿插制);不做常驻 GPU;本轮不动简历 PDF 与多模态立项(backlog)。

---

## 2. 设计系统

### 2.1 骨架

- **删除** `.page-shell` 布局职能、顶部导航(site-header)、全站 footer。测宽下沉到元素级:叙述段 `max-width: 760px`,hero 文案 `850px`,finding `900px`。
- **Rail**:固定 260px,墨蓝(`--ink-invert`),`main { margin-left: 260px }`。由每个 page 以 prop 传入 server component `<ExhibitShell rail={…}>`;scroll-spy 是唯一 client island(IntersectionObserver,`rootMargin: -45% 0 -45% 0`,`aria-current`)。**rail 不进 RootLayout**(否则整壳变 client boundary)。Playwright 断言 `[data-exhibition-rail]` 恒为 1。
- Rail 内容双态:
  - 首页:mono `XGZ` 小字标 + 衬线竖排 `Xiangguo / Zhang` + 一句定位(muted)+ 展区目录 00–06 + 底部 `SEARCH ⌘K / ASK / EN·中 / RESUME`(mono,承接被删导航的职能)。
  - 项目页:衬线竖排项目英文名 + zh gloss 行(≤20 字,独立行)+ 该页展品目录 01–0N + `← ALL WORK`。
  - /artifact:精简 rail(`← BACK` + 文件/哈希)。
- **展区**:full-bleed,`padding: clamp(54px,7vw,105px) clamp(34px,7vw,110px)`,底边发丝线。开场式固定:mono 编号 + 大写 mono eyebrow(事实性技术参数)+ 巨衬线断言标题(`clamp(2.3rem,4vw,4.4rem)`,首页 hero 另档)+ muted 引言。
- **Hero**:首页 94vh 单栏(参考稿原样);项目页 `min(680px, 78vh)` 双栏——左 eyebrow/断言/zh gloss/一段话/3 格 stat 棋盘,右**仪器 compact 态**。仪器 compact/full 是同一组件两个 variant,<1180px 时 hero 右栏不渲染、01 号展区(full 态)上移。
- 统计棋盘:容器 `background: var(--hairline); gap: 1px`,子格填底色。零圆角、零阴影、零渐变、零 icon、零 emoji、零外部 CDN。

### 2.2 Token 与色彩语义

```css
--paper: #f5f1e8;  --paper-alt: #eae3d5;  --paper-bright: #fffdf8;
--ink: #14202c;    --ink-invert: #0f2236; --muted: #5a6472;
--hairline: rgba(20,32,44,.16);
--accent: #9d2b26;            /* 朱砂,全站唯一暖色相(编辑层) */
--accent-on-ink: #d9705f;     /* 墨蓝底 ≤14px mono */
--accent-display-on-ink: #c4564a; /* 墨蓝底 ≥28px 衬线 em */
--ok: #2f6b52;  --ok-on-ink: #6fae90;
--danger: #a64033;            /* 仅产品状态层,见下 */
```

语义由「色相 × 线重 × 标签词」三元组承载,不靠色相独判:

| 语义 | 处理 | 用在哪 |
|---|---|---|
| accent 强调 | 朱砂;无线 | 标题 `<em>`、编号、rail hover、链接下划线、**正在发生的那一个元素**(Linear 纪律) |
| negative result | 发丝线顶边 + 朱砂 mono 标签 `NEGATIVE RESULT` | 跑砸的实验(编辑层) |
| limitation | **3px 墨黑顶线** + mono 标签 `LIMITATION` | 边界声明(不是警报,不用红) |
| pass / verified | 绿,仅 `PASS / VERIFIED / 0 DIFF` | 门禁通过 |
| danger(产品状态层) | `--danger` + 状态词 + 2px 顶线 | **仅**工作台实时失败态:`BLOCKED / UNSAFE TO EXPORT / FAILED`;永不进编辑层 |

- 指标数字一律 `--ink`;图表默认墨色明度阶(100/70/45/25%),选中才上朱砂;Okabe-Ito 分类板仅限 `.fig` 作用域且 ≥3 序列时。
- **删除** round-0 遗留:`--blue-soft/--amber-soft/--red-soft/--green-soft` 及全部有色底块 token、`--red: var(--accent)` 别名、`.negative-finding` 左边线样式。
- 墨蓝底上的朱砂两档与发丝线可见度过 **G1 真机关**(P3 屏偏艳,需人眼)。

### 2.3 字体(已决:自托管 display 衬线)

- 正文/mono 不变:IBM Plex Sans / IBM Plex Mono 自托管。
- **新增自托管拉丁子集 display 衬线**(~20–35KB woff2,仅首页与项目页 hero preload),锁死约七成 Windows 招聘者看到的巨号标题效果;候选字体在 G1 出对比图(倾向 Iowan/Baskerville 气质的开源近亲,如 Source Serif 4 Display / Bitter 的窄子集)。回落栈保留 `Iowan Old Style, Baskerville, Georgia`。
- **中文 hero 不做巨号衬线**(Songti SC 仅 macOS,SimSun 巨号崩坏):zh hero 用 `clamp(2.2rem,4vw,3.4rem)` 黑体,独立成稿。两语的这处结构性不对称是显式决定,G4 一并确认。
- 断言标题用显式 `<br>` 控行 + `text-wrap: balance` 兜底;Georgia 回落单独截图验收。

### 2.4 动效(GSAP,用户指定;"动效有职责才存在")

- 引入 GSAP core(~23KB gzip,计入预算;2025 年起全插件免费商用——执行前复核一次授权现状)。ScrollTrigger 仅在确需时加。
- **允许**:回放时间轴推进(EOD 演练、RG trace 逐节点点亮)、"唤醒 GPU"分阶段进度、数字 count-up、发丝线 draw-in、展区入场轻微位移。
- **禁止**:满屏 scroll-reveal、视差、弹跳、装饰性循环动画。`prefers-reduced-motion` 下全部动效降为瞬时状态切换,回放改为 stage 按钮切换。
- 落地流程:R1/R2 期间开 `feat/r2-motion-spike` 分支,只做两个样张(首页 hero 入场 + EOD 回放控制台),真机录屏过用户,认可后铺开;否决则仅保留 count-up 与 hover,分支即弃。

### 2.5 移动端(WeUI 交互范式,编辑风皮肤)

- 断点:≥1180 固定 rail;980–1180 rail 收窄 208px(藏 rail-copy);<980 变 56px 吸顶文字条 `XGZ / 03 OF 06 / INDEX`,INDEX 触发 `<details>` 文档流全宽墨蓝目录(零 JS 可用,无汉堡 icon)。
- WeUI 取交互骨架不取皮肤(招聘者多从微信内打开):底部 action sheet 用于棋盘格详情/模型加载确认;cell 列表用于移动端索引;触控目标 ≥44px。微信 X5/XWeb 内核纳入 Playwright 设备矩阵抽查(WASM/ONNX 可用性实测)。
- anchor `scroll-margin-top: 72px`;语言切换保持当前展区 hash。

### 2.6 双语铁律(承 round-1 §4,新增 CI)

- 中文独立成稿 + 朗读测试 + 独立审读(§4.0 不变);黑名单与格式规则(§4.1–4.4)不变。
- **G5 新增 CI 规则**(`scripts/lint-copy.mjs` 扩展):单个文本节点内不得同时出现 CJK 与 ≥2 个连续拉丁词(术语白名单除外);`glossZh` 必须独立行且 ≤20 字;UI fabric 词表(eyebrow/标签/单位/状态词)强制英文;禁止括号式译名。

---

## 3. 站点 IA

| 路由 | 处置 |
|---|---|
| `/` | 重写为展陈长卷(§4) |
| `/ai` `/engineering` `/analytics` | 页面死亡;`308 → /#agent-systems` `/#systems` `/#archive`(锚点让老链接落对应展区);track thesis 文案迁入首页 02/03 展区正文 |
| `/[track]/[project]` ×10 | URL 原样保留,页面全部重建为标准卷 |
| `/analytics/analytics-tandem` | `308 → /#archive`(现已 noindex,纯迁移壳) |
| `/artifact` | 保留,套精简 rail |

- 新增 `src/app/sitemap.ts`(现无 sitemap);保留既有 `/engineering/p1-reliability-lab`、`/analytics/credit-policy-lab` 重定向;killed routes 加 redirect regression tests。
- 收口阶段强制再生成:`generate:search-aliases`、`build:assistant-knowledge`、`check:links`(否则 command palette 跳 404)。
- i18n 维持客户端切换单 URL,不动。

---

## 4. 首页展陈脚本

背景节奏:纸 → 墨 → 纸 → 白 → 墨 → 纸 → 墨。

| № | 底色 | eyebrow | 内容 |
|---|---|---|---|
| 00 | 纸 | `AI AGENTS / LLM APPLICATIONS / MEASURED SYSTEMS` | 94vh hero:两行巨衬线断言(短名单见下)+ 中文独立叙事 + 4 格 stat 棋盘(构建期读 release.json:`99.05% task success · $35.68 measured spend · 0 upstream 5xx @ 3× · 10 failure classes drilled`)+ scope-note + 联系文字链 |
| 01 | 墨 | `QWEN3.5-4B / RTX 4090 / $35.68 MEASURED / SHA-256 GATED` | 旗舰 Frontier Forge:左断言+叙述+一条 NEGATIVE RESULT finding;右 claim chain 迷你件(3 行断言,点击就地展开数字+n·CI+命令+SHA)。CTA 单条 `OPEN THE RELEASE CONSOLE →` |
| 02 | 纸 | `13-NODE GRAPH / TOOL GUARDS / ONNX INT8 / ON-DEVICE OCR` | Agent 系统:Release Guardian 领衔(迷你 trace 条)+ Triage Router + Privacy Preflight 全宽编号行,每行一枚内联微仪器(纯 CSS:节点点阵/分布条/遮罩色块);Ask Portfolio 就地输入框 + 3 条预设问题 |
| 03 | 白 | `C++20 / GO / KAFKA · FLINK / K3S / POSTGRES` | 副柱(后端/系统):栈深度图(Gateway/Serving/Stream/Storage/Orchestration 各层标项目+实测数)+ EOD 十格故障棋盘迷你件;track thesis 落点 |
| 04 | 墨 | `5 RUNS THAT DID NOT WORK` | 签名展区:跨项目负结果表(蒸馏 −14.2pp / GRPO CI 含零 + zero-variance guard / RG 30-of-44 严格残差 / Crossover Amazon 臂 null / one-pass 0%),每行 结论+n+处置+收据锚点 |
| 05 | 纸 | `3 SECONDARY / 2 ARCHIVED` | 次级 3 + 归档 2,单发丝线表格,mono 指标右对齐;归档行 muted |
| 06 | 墨 | `HOW THIS SITE IS BUILT AND CHECKED` | 收据 `<dl>`(release.json SHA / EOD manifest / privacy manifest / 构建日期 / 门禁状态)+ Ask 输入框(compact 变体)+ 联系/简历/GitHub + 更新时间 |

Hero 断言短名单(G1 出真机 mockup 后由用户定,中文版另行独立创作):
1. `I build the whole path.` / *`Then show where it breaks.`*
2. `I don't cite benchmarks.` / *`I pay for them.`*
3. `Agents that act.` / *`Systems that answer for them.`*

首页排序原则:tier 只是编辑权重,不渲染徽章;02 内顺序 Release Guardian → Triage → Privacy(Agent 主柱);03 由 EOD 承重(后端副柱)。

---

## 5. 仪器十诫(全站产品化铁律,来源见附录 research-6)

1. 首屏只许一个元素邀请点击。
2. 仪器载入即已完成一次演示;空状态禁止。
3. 输入只留一个维度,其余预选;预设 chip 上限 3。
4. 每次演示以可带走的真工件收尾:curl / URL / 下载。
5. 一台仪器只报一个数,其余归一化为 ×N。
6. 状态一行 mono 说完(延迟 · 日期 · 版本),不用 spinner;等待必须分阶段叙事。
7. 深度往页面下方与折叠区流放,不往控件里塞;tab 组 ≤1 维。
8. 朱砂只给正在发生的那一个元素。
9. 能让访客直接用,就不许放截图。
10. 每个数字旁给复现路径;页面向访客承诺的字节数由 CI 保证为真。

仪器内部:两级字号(大 mono 数值 + 小 mono 大写标签);叙述文字留在仪器外;发丝线代替一切边框;mono 日期戳代替可信度文案。

---

## 6. 项目页 spec

### 6.0 标准卷模板

```
rail(01–0N + ← ALL WORK)
├ HERO 双栏:左 断言/gloss/一段话/3 格棋盘;右 仪器 compact
├ 01 仪器 full(同一组件)
├ 02–04 分析展品(DOM/CSS 图表,数据源逐个登记)
├ 05 [live/增值槽位,非承重;缺席=一行发丝线小字,不是空洞]
├ 0N(墨)SOURCE / RECEIPTS:claim chain、哈希、复现命令、GitHub 链接
└ 报告层:Architecture → Results & negatives → Limitations
```

硬规则:仪器 compact/full 同组件;finding 全部去框;无 JS 时 01–04 有服务端预渲染静态表(no-js.spec 锁死);外链 demo 归零;每页每个数字登记 `数字 → 文件 → JSON path → SHA`(G2)。

### 6.1 Frontier Forge —「发布控制台」(标准卷参考实现)

**首屏(10 秒)**:一条已完成的真实推理躺在屏幕中央——投诉原文 → JSON 输出 → `2.1s · 47 tok · 22 tok/s · CPU`(取自 release.json 真实记录);右上角状态徽章 `CPU · LIVE / GPU · COLD (~30s)`(轮询 `/api/status`)。3 条真实投诉 chip;自由输入框在 chip 之后;旁挂 `cURL / Python / JSON` 三 tab 展示同一请求本体。

| № | 底色 | eyebrow | 内容与数据源 |
|---|---|---|---|
| 01 | 纸 | `LIVE TRIAGE / RATE-LIMITED / NO LOGIN` | 仪器 full:预填推理 + chips + 输入框 + 徽章 + 读数行 + cURL tab。免登录限量(见 §7) |
| 02 | 墨 | `RELEASE.JSON / CLAIM REGISTRY / SHA-256` | Evidence Explorer:可筛(train/inference/gateway/elasticity)claim 表,每行 assert+数字+n·CI+命令+hash;数据 `public/case-studies/frontier-forge/release.json`(29,330B,构建期 SSR) |
| 03 | 纸 | `1,450 → 20,000 RULE LABELS` | Training ladder(参考稿组件语法);标题候选 `Free labels moved the frontier.` |
| 04 | 白 | `0.25–4.00 QPS / NATIVE MTP` | Serving 边界:segmented + metric 棋盘 + win/lose 柱;标题 `Serving is a boundary, not a badge.`(保留) |
| 05 | 墨 | `SAME-BOX A10 / SUSTAINED OVERLOAD` | 过载对照(`phase7_1_sustained_gateway_bench.json`,懒岛);标题候选 `Reject the work before it becomes a crash.` |
| 06 | 纸 | `MODEL BOUNDARY` | ✓/✗ 能力矩阵(✗ ≥ ✓)+ **已知失败区**(2–3 条真实分错样例 + 一句归因)+ snapshot 一行制 `ff-qwen3.5-4b-… · release.json sha256:…` |
| 07 | 墨 | `HOW THIS WAS VERIFIED` | claim chain 收据 + `make reproduce-headline` + GitHub |

**唤醒 GPU 体验**:点击前徽章已写明冷启动预期;等待期 = SSE 分阶段叙事(`容器调度 → 拉取权重 2.3GB → 引擎预热 → 首 token`,每阶段真实耗时)+ 输出区以真实录制速度回放一条历史 GPU 推理(标 `REPLAY · 2026-08-15 RECORDED`),唤醒完成无缝切活推理;读数保留 `cold start 28.4s`。live 结果物理隔离在仪器内,标 `LIVE — NOT A BENCHMARK NUMBER`,永不进 claim 表。页脚真实累计计数 `N triage runs since launch`。

### 6.2 Release Guardian —「亲手拦一次危险发布」

**首屏**:13 节点发丝线 SVG 图(~15KB,手绘)+ 聚合行列表(13 行封顶,`NODE/TOOL/LLM/GATE` 四种 mono 类型标签,行展开见 I/O 摘录)+ 底部发丝线 scrubber(13 刻度),三者共享一个进度指针;首行恒为整次评估总览(总耗时/总 token/判定)。默认选中 destructive schema scenario,`▶ RUN RECORDED TRACE`,标注 `RECORDED / DETERMINISTIC STUB`。

- 回放至第 9 节点**真正停住**:GATE 朱砂描边、`AWAITING DECISION`、interrupt payload(风险评估摘要)展示,全页唯二可点 = `APPROVE / BLOCK`;选择后所选路径逐节点点亮,**未走路径淡墨虚线留图上**;两分支各为真导出 trace(~30KB×2)。`#gate` 可寻址。
- 展区序列:01 回放仪器 → 02 四路证据采集(`Evidence arrives from four different failures of memory.`;严守"并行证据采集"非 RAG 措辞)→ 03 确定性校验(`The model may retry. The rule does not move.`)→ 04 审批与审计(`Approval survives the process that asked for it.`;HashChain)→ 05 安装区 → 06 评测披露(`Aggregate pass does not erase 30 strict failures.`;44 scenarios / 132 runs,`llm_mode: stub` 原样标注)→ 07 SOURCE。
- **安装区**:`docker run …` 一行(大号 mono,下附运行成功后第一行输出)+ `claude mcp add --transport http release-guardian https://mcp.xiangguozhang.com/mcp` + 纯文本 `ADD TO CURSOR →` deeplink + 预期回显原文(`✔ release-guardian — Connected`)+ 第一句 prompt + 4 步 30 秒清单。数据不出访客机器(评估本地 diff)写为一句话卖点。
- 数据:`release_guardian/mockworld/data/scenarios/scenarios.json`(44)、`eval/results/latest.json`、`MANIFEST.json`;**上游缺口**(执行前置,见 §10):真实 stub 运行导出 `exhibits/recorded-stub-runs.json`(禁手写时序)、完整 Compose profile(现 `make up` 仅 Postgres+Phoenix,不得先宣传"一条命令")、MCP server 本体。MCP/Compose 未就绪时页面渲染 `PACKAGING IN PROGRESS`,绝不放假命令。

### 6.3 Triage Router —「行情终端」

**首屏(零重资产)**:cost-accuracy frontier 发丝线 + 一个朱砂点。拖 `MISROUTE COST ¥/单` 滑块(次滑块:置信度阈值;不再有第三个),最优点沿 frontier 滑动,下方策略卡整段重排:`「宁可错杀」— 34% 工单升人工复核级 · 月成本 ¥X` / `「省钱优先」— 91% 止步 TF-IDF · 漏检 Y%`;当前策略一行 mono 语法 `triage:cost-floor`(可复制,即 API 参数);等价人力换算一行小字。数据:`nlp-eval-lab/demo/data/frontier.json + policies.json`(构建期裁剪 compact payload,查预计算网格,不跑模型)。

- accuracy 带 bootstrap CI 须线;每个数字点开抽屉见 3 条真实样例(该配置下谁被拦、谁升级);口径声明一行:"网格来自 N 条真实工单离线回放,非模拟" + 日期戳;`cascade threshold, cf. RouteLLM (Ong et al., 2024)` 学术锚一行。
- **本地真推理为第二步**:`RUN THE MODEL IN THIS TAB — 82 MB`(int8 ONNX 67.6MB + tokenizer 0.7MB + ORT wasm 13.5MB;按钮字节数由 CI 对账);真实进度、Cache Storage 持久化、成功后 `CACHED ON THIS DEVICE`;推理标注 `LOCAL · 43ms · WASM`,与 `RECORDED · OFFLINE REPLAY` 的对照本身是展品;失败/超时 20s 退回 recorded 态,不弹错误。Tier A(19.3MB)不做浏览器加载——recorded 模式已覆盖其叙事。
- 后续展区:drift 2015–2026(`The model aged out.`)、frontier Pareto(`Accuracy and cost share the same axis.`)、case study/agreement、SOURCE。drift.json 中 pending 的 Tier B1 序列原样显示为未测量。
- `projects.ts` 删除 GitHub Pages demo 链接。

### 6.4 Privacy Preflight —(重排为主,克制化改造)

**首屏**:预填 synthetic 文本 + `SCAN` → 选实体 → `PREVIEW REDACTION`;`USE A SAMPLE FILE` 按钮必备(招聘者手边没文件);Image/PDF 是同一工作台的 tabs(唯一一维 tab)。现有 `Privacy*Lab` 组件复用,按十诫削减要素(内部标题/次按钮/图例全砍),换展陈 chrome。

- 展区:01 工作台(`Remove the data, then prove it is gone.`)→ 02 detect/review/destroy(`Detection proposes. The reviewer decides.`)→ 03 OCR 基准(`Perfect recall still produced two wrong boxes.`;19/19 hits · 2 FP)→ 04 fail-closed(`Export is earned by a second read.`;`UNSAFE TO EXPORT` 用产品状态层 danger)→ 05 边界(`Local does not mean infallible.`)→ SOURCE。
- 字节:tesseract 语言包(chi_sim ~15MB)与 PDF.js worker 仅在选择对应 tab/动作后加载;`public/case-studies/privacy-preflight`(34MB)+ `public/generated/privacy-ocr`(16MB)在 R3 做路由加载审计。

### 6.5 Exactly-Once Drills —「故障棋盘」

**首屏**:管线拓扑(MySQL →双路径分叉→ Kafka → Flink → Iceberg,箭头粗细=实测分路流量,图面零数字,hover 出 mono 小卡)+ 一行计数 `1,791 events/s · drill 07/10 · diff = 0`;其下 10×4 棋盘(行=故障 `DUP ORD POISON RESTART OFFSET SCHEMA SMALLFILE RECON PARITY SLO`,列=注入/检测/恢复/验证耗时+diff)。默认选中 broker-restart。

- 点格 → 单列事件时间线(`T+00.0s INJECT kill -9 taskmanager …`,关键条目挂真实日志 3–5 行)+ **一条**吞吐曲线(朱砂竖线=注入,墨蓝竖线=恢复)+ scrubber,三者联动(GSAP timeline);格子选中时拓扑图上受损组件朱砂高亮(blast radius);回放结束按钮变 `REPLAY`。
- 验证命题先行:`∀ drill ∈ 10 faults: iceberg_snapshot(path_A) ≡ iceberg_snapshot(path_B)`,其下 10 行 `PASS`(k6 threshold 语法);比对行数/字段数/耗时给全(Jepsen 具体性);每格原始 NDJSON 下载;页脚边界声明:"证明这 10 类故障可恢复,不证明不存在其他故障。"
- 数据(均已进站 `public/case-studies/exactly-once-drills/results/`):`eo_reconciliation.json`(5 Flink 类)、`broker_restart/duplicate_redelivery/ordering_miskey/offset_replay/poison_dlq_drill.json`(5 broker 类)、`broker_parity.json`、`broker_slo.json`、`schema_contract_drill.json`;拓扑 SVG `showcase/media/phase-b1-path-a-b.svg`。全量 716KB 不一次载:构建期生成 `index.summary.json`(<12KB)SSR 棋盘,点格才 fetch 单场演练。
- 展区标题候选:`Choose a failure. Watch the state return.` / `Two delivery paths must land on the same state.` / `Recovery has ten different failure shapes.` / `Exactly-once ends at reconciliation.`
- 可选彩蛋(R6):VPS SSE 按真实时间间隔推送预录事件流。

### 6.6 Crossover Study —「冷结果热引擎 SQL 工作台」

**首屏**:秒开即见预载查询(注释首行=研究问题)+ 完整结果表 + 读数行,标 `cached · build 2026-08-xx`;第一次 `RUN (Cmd+Enter)` 才拉引擎(按钮写实测传输量 `~7 MB`,brotli;非 41MB 原始体积),鼠标入区 idle prefetch;就绪打一行 `DuckDB v1.5.x (wasm) ready · 加载 4.8s`,标签翻 `live`,读数逐位跳出 `N rows · 0.9s · scanned 43,942,117 rows · in your browser`。

- 七要素封顶:预载查询 / 编辑器 / Run+快捷键 / 一行 telemetry(未跑时 `--` 常驻)/ 结果表(行号、右对齐、数值热度淡朱阶、≤20 行、单下载)/ 5–8 条命名策展查询(单列表,按研究叙事递进:数据规模 → 类目分布 → 交叉购买 → null 检验 → 反例)/ schema 铭牌(`<details>`)。明确不做:Charts tab、AI、保存历史、多标签页。
- **Iceberg 铭牌**(差异化武器):`table @ snapshot 7421… · committed 2026-06-30 · schema v3`(构建期读 metadata.json);查询编码进 URL hash 可分享;错误原样显示 DuckDB 报错。
- 数据分层声明入页:"工作台 = snapshot 的抽样+预聚合视图;全量 Spark 结果见下方分析展区"——**上游任务**:`batch-recsys-lab` 导出 hash-gated serving layer(抽样事实表+预聚合 Parquet,目标 50–200MB,以 VPS 字节审计定档);切片未就绪则工作台停留 cached 态(页面仍完整)。
- 其余展区:两条主曲线(Amazon null vs ML-32M n*=20)、shopper 轨迹回放、DQ/lineage(取现有 8 模块中与论点相关的 4 组)、SOURCE。79MB semantic search 不移植。
- 两个归档页(Margin/Credit)走 Evidence 形态(叙事+预计算图表+`<details>` 查看 SQL),与工作台形态不混页;DuckDB 仅点击后载。

### 6.7 轻处方

- **RAG Quality Lab**:首屏即 Manifest Drift Lab(改受控文档 → deterministic 对比 → `4/12 degradation`);对比区顶部四值判词 `IMPROVEMENT / REGRESSION / TRADEOFF / TIE`;指标列头 `↑12 ↓3` 微计数即过滤器;diff 是开关不是页面。3 展区。
- **Ask Portfolio**:页面即产品(输入框 + 3 预设问题 + 引用链展示 + 限流状态);失败时静态建议路由,不伪造回答。3 展区。
- **Margin / Credit(归档)**:各 4 展区封顶(工作台/决策边界/负结果/收据),`A score is not a policy.` 保留(全站 "X is not Y" 配额 2/2)。
- 全部项目挂 mono 状态标 `active / maintained / archived`。

---

## 7. 服务器侧架构(全部经同源代理;CSP `connect-src 'self'` 不放宽)

```
浏览器 → https://xiangguozhang.com/api/* (nginx, VPS 阿里云新加坡 8.216.133.167)
  /api/triage        → 本机 llama.cpp CPU int4(常驻,流式;R1b GGUF)
  /api/triage/gpu    → Modal serverless vLLM(GPU memory snapshot,冷启动目标 10–30s)
  /api/wake          → SSE:唤醒分阶段事件转发
  /api/status        → CPU/GPU 冷热状态 + 队列
  /api/counter       → 累计分流次数(+可选按日 sparkline)
https://mcp.xiangguozhang.com/mcp → HTTP MCP server(常驻,~50MB RAM)
  tools v1(只读):assess_change / get_run / list_scenarios
```

- **安全与成本(G6 清单)**:固定 prompt 模板(仅投诉文本槽)、输入/输出长度硬上限、免登录限额 5 次/日/IP(token bucket)+ 全局 QPS 上限、日预算熔断自动降级为 recorded 回放、零访客输入日志、live 数字与 benchmark 物理隔离。Modal 用量落在 $30/月免费额度内(研究实测口径,附录 research-0);超额即熔断。月成本合计目标 ≈¥0–20,天花板 ¥100。
- MCP 默认 deterministic stub,零 API 成本;不含任何写操作/审批/部署工具。

---

## 8. 字节与性能预算

| 路由档 | initial JS 总量(gzip) | 路由自有 JS | 重资产 |
|---|---|---|---|
| 首页 / 归档页 | ≤170KB | ≤50KB | 禁止 |
| 报告型(RAG/Ask/artifact) | ≤200KB | ≤70KB | 禁止自动加载 |
| 仪器型(6 优先页) | ≤240KB(含 GSAP core) | ≤80KB | 仅显式点击后加载 |

- `verify-performance-budget.mjs` 从 homepage-only 扩为全路由矩阵。
- 新增 `heavy-assets.json` 登记表(onnx 67,575,183 / ort-wasm 13,479,978 / duckdb-eh.wasm 34.25MB(brotli 传输 ~6.2MB)/ tesseract chi_sim / GGUF …)。CI 三断言:(a) 清单值 == 文件真实体积;(b) 清单值 == UI 按钮向访客展示的字节数;(c) 重资产不出现在任何路由 initial chunk。
- 模型权重不入 git(构建期拉取或 LFS);VPS 上 `immutable` 长缓存 + brotli 预压缩。R5 末实测 `build:vps` 产物总量对照 VPS 余量(现静态资产合计约 185MB 量级);超限时压缩录制层,**不回退外链 demo**。

---

## 9. 测试与门禁

**Playwright 存活策略**:R0 第一件事 = 新建 `tests/e2e/selectors.ts` 集中全部结构选择器,测试只引常量,改造完先全绿再动 UI;新锚点用 `data-exhibit` / `data-project-section` / role+text,CSS 类只承担样式;禁止 `test.skip` 落地;每个 R 阶段出口全套绿。新增断言:全站 rail 恒 1;initial 请求无 ONNX/DuckDB/OCR worker;点击后只加载选中 runtime;每个优先页首屏视口内存在可操作 product control;`prefers-reduced-motion` 不自动播放回放;no-js 下每仪器有静态表、移动 `<details>` 索引可展开。

**人工 gate**

| Gate | 内容 | 时点 |
|---|---|---|
| G0 证据冻结 | source→public 清单+SHA+生成命令;修正已知出入(RG compose 不全、crossover 8 模块、Tier B1 pending) | R0 入口 |
| G1 真机取色+骨架 | 三底色/朱砂两档/发丝线/自托管衬线对比图/rail 四端截图 | R0 出口 |
| G2 数字审计 | 每页 `digits.md`:数字→文件→JSON path→SHA;`verify:evidence` 机器校验+人工抽查 | 每页 |
| G3 首屏产品关 | 每优先页 ≤10s 无声录屏(桌面+手机),用户只答"产品还是报告";motion spike 样张并入 | 每页 |
| G4 中文朗读关 | 逐页朗读;hero 中文定稿;两语 hero 不对称确认 | R5 |
| G5 双语分离关 | 5 张失败截图 → CI 规则(§2.6);人工抽查 | R5 |
| G6 live 安全关 | §7 清单逐项;账单告警配置 | R6 |
| G7 发布门 | typecheck → lint → verify:evidence → build → 全路由预算 → Playwright 矩阵 → Lighthouse → link/redirect 审计 → 三份生成物再生成 → VPS 产物体积 | 发布前 |

---

## 10. 分期 R0–R7

| 阶段 | 内容 | 并行性 | 出口 |
|---|---|---|---|
| R0 地基 | G0 证据冻结 ∥ selectors.ts 契约迁移 ∥ token 增删(§2.2)∥ ExhibitShell+rail 双态+移动索引 ∥ 删 page-shell/site-header ∥ 衬线子集自托管 | 证据冻结与前端地基并行;ExhibitShell 单人一次做完 | G1 |
| R1 首页 | §4 全序列;hero 短名单出真机 mockup | 与 R2 并行 | G2/G3/G4-hero |
| R2 旗舰+EOD | FF 页(标准卷参考实现,live 槽位关闭态)∥ EOD 页(数据最全,验证仪器原语)∥ `feat/r2-motion-spike` 两样张 | 页面间文件不重叠 | G2/G3+动效尺度确认 |
| R3 Triage ∥ Privacy | 行情终端 ∥ 工作台克制化改造+字节审计 | 互相并行 | G2/G3 |
| R4 Release Guardian | 页面(回放/分叉/安装区 pending 态);上游件(trace 导出/Compose/MCP)在 R2–R3 期间并行推进,站点任何阶段不阻塞于上游 | — | G2/G3 |
| R5 收口 | 次级 3+归档 2+crossover 页(cached 态工作台)∥ 308+sitemap+生成物再生成+check:links | — | G4/G5 |
| R6 增值(非承重) | live 层(CPU+Modal,G6)∥ MCP 上线换真命令 ∥ DuckDB live 引擎(serving layer 切片就绪后)∥ SSE 彩蛋 | 三线并行,可无限期推迟且不损 R5 成果 | G6 |
| R7 发布 | G7 全序列;`codex/site-revamp-r2-20260822` → 内部线;VPS 发布键在用户手里 | — | G7 |

**上游任务清单**(站外仓库,均可与站点工作并行):
- `release_guardian`:stub 运行导出 `exhibits/recorded-stub-runs.json`(含 GATE 双分支)、完整 Compose profile、HTTP MCP server v1。
- `batch-recsys-lab`:hash-gated serving layer Parquet 切片 + Iceberg metadata 提取 + 策展查询预计算。
- `nlp-eval-lab`:frontier/policies compact payload、策略卡文案网格、已知失败样例导出。
- `frontier-forge`:R1b GGUF int4 确认/导出、Modal 部署脚本(GPU snapshot)、网关 `/status`+SSE+计数+限流。

---

## 11. 风险登记(双通道合并,取严者)

| # | 风险 | 缓解 |
|---|---|---|
| 1 | rail 与 App Router 嵌套出双 rail / client boundary 扩散 | rail 由 page 传 prop;shell 为 server component;Playwright 断言 rail 恒 1 |
| 2 | ONNX 82MB 在国内网络 | 零字节 recorded 首屏;显式点击+真实字节+进度+Cache Storage;20s 超时回退;权重不入 git |
| 3 | DuckDB 载荷侵入非数据页 | dynamic import+点击门;网络断言首页/非 SQL 页零 DuckDB 请求;切片未就绪不发布 live 态 |
| 4 | Windows 衬线回落破坏 hero | 自托管子集(已决);Georgia 回落仍单独截图;显式 `<br>`+balance |
| 5 | 巨号中文衬线崩坏 | zh hero 黑体小档(已决,G4 确认) |
| 6 | 删 track 页伤 SEO/站内检索 | 308+锚点、sitemap.ts、thesis 迁正文、三份生成物再生成入 DoD |
| 7 | MCP/Compose 范围蔓延阻塞站点 | 站点只依赖"命令块+录制 transcript";未就绪渲染 PACKAGING IN PROGRESS;硬规则:站点不阻塞于上游 |
| 8 | live 层安全/成本/污染 benchmark | G6 清单;日预算熔断降级;LIVE—NOT A BENCHMARK 物理隔离;槽位关闭态完整 |
| 9 | 274 条测试长期红 | selectors.ts 先行;每阶段全绿;禁 test.skip |
| 10 | 数据复制后数字漂移 | source adapter 生成一切 public payload+SHA;组件禁止硬编码数字;G2 |
| 11 | 185MB 静态资产 vs VPS | R5 末实测;超限压缩录制层,不回退外链 |
| 12 | 动效变装饰 | §2.4 白名单+spike 分支先行+reduced-motion 降级+G3 并审 |
| 13 | 微信内核 WASM/ONNX 兼容 | X5/XWeb 实测入设备矩阵;不可用时停留 recorded/cached 态并说明 |
| 14 | 免登录推理被滥用 | 限额+熔断+固定模板+零日志;最坏情况自动整体降级为回放,页面依然完整 |

---

## 12. 已决记录与欠定项

**本轮已决**(2026-08-22,用户逐项确认):展览馆骨架整站化;track 页删除;首页 7 展区;产品化 v2(仪器十诫+逐项目形态);衬线自托管子集;DuckDB 工作台必做且按真产品形态;live 层 = CPU 兜底 + Modal 唤醒;RG = 回放+一键安装+MCP;GSAP+WeUI 范式经 spike 分支验证;免登录限量真推理。

**双通道分歧裁决**:首页按主题分组(Codex)+ 微仪器与负结果签名展区(DR);负结果标签用朱砂不引新色相(DR),danger 红仅产品状态层(Codex);track 重定向带锚点(Codex);Triage 字节按 Codex 实测(Tier A 19.3MB 不上浏览器);RG 首屏 = DR 的 APPROVE/BLOCK 分叉 × Codex 的真导出轨迹纪律。

**欠定项**(不阻塞开工,各有 gate):hero 断言三选一及中文稿(G4);朱砂 on-ink 两档与衬线候选(G1);动效尺度(spike→G3);serving layer 切片体积(VPS 审计定档);Modal 免费额度政策变动的替补(阿里 FC,附录 research-0)。
