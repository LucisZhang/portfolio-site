调研完成,以下为最终报告。

---

# 方向 2 调研报告:Agent 运维 / Trace / 安装类产品(2026-08 现状)

映射项目:**Release Guardian**(13 节点 LangGraph 发布风险评估 agent;页面规划 = 录制轨迹回放 + 审批节点访客亲手 APPROVE/BLOCK 分叉 + Docker 一键安装 + MCP server 三个只读工具)

---

## 一、逐产品分析

### 1. LangSmith(trace UI)

**核心交互回路**:打开一条 trace,左侧是 run tree(层级树:每行 = 一个 run,显示名称、状态点、耗时、token 数),右侧是选中 run 的 input/output 面板。10 秒内你能看清这次运行的"形状"——多少步、哪步慢、哪步红——然后点任意一行下钻。可切 waterfall 视图看时序。2026 年新增 Polly(内置 AI 助手,帮你"快速理解大 trace")和 LangSmith Engine(自动聚类生产失败)。

**为什么像真产品**:每个数字都是真的——真实延迟、真实 token、真实报错;每个元素都可点击下钻;最关键的是 **public trace share**:任意 trace 右上角 Share 一键生成公开链接,无账号者可只读浏览完整 trace。数据可被陌生人验证,这是 report 做不到的。

**克制清单**:
- run tree 默认**折叠子层级**,不全展开;
- 原始 JSON payload 藏在 tab 后面,首屏只给名称+耗时+状态三个字段;
- trace 视图里**不画图结构**——树就是唯一抽象,没有把 graph、时间轴、树三个视图堆在一起;
- 上了 Polly 这件事本身就是承认:全量细节人看不完,默认必须给摘要。

**可偷模式**:
1. "公开只读 trace"心智 → Release Guardian 页面直接内嵌一条**真实录制的 trace**,每行 = mono 节点名 + 状态 + 耗时 + token 数,行可展开看该节点的输入/输出摘录。纯静态 JSON(全量 100–300KB),无服务器。
2. 首屏只给三列(节点 / 耗时 / 结果),payload 藏在展开态——这是对"要素太多"的直接解药。

### 2. LangGraph Studio

**核心交互回路**:分屏——左侧 agent graph 可视化,右侧输入框。提交后,执行沿图**实时流转**:哪个节点在跑、调了什么工具、循环了几圈,以流式信息呈现。因为 LangGraph 每个节点都存 checkpoint,可以 rewind 到任意步、**编辑 state、fork 出新执行路径**(time travel)。

**为什么像真产品**:图不是插画,是随真实执行**点亮**的活物;状态不只可看还**可改**——interrupt、edit state、从任意 checkpoint fork。可操纵性 > 可视性。

**克制清单**:
- 图上只有节点和边,**不显示 prompt 内容、不显示 state 全文**——state 只在你选中某个 checkpoint 时展示;
- debug mode(每节点暂停)是 opt-in,默认一跑到底;
- 没有仪表盘、没有指标图表——IDE 只做"看见执行 + 干预执行"两件事。

**可偷模式**:
1. **图 + 回放联动**是 Release Guardian 页面的主结构:手绘 13 节点 SVG 图(发丝线、零圆角,~15KB),回放进行到哪个节点,图上该节点以墨蓝填充点亮;这是"13 节点 LangGraph"最诚实的证明方式。放页面首屏。无服务器。
2. 审批分叉 = **time travel fork 的展品化**:APPROVE/BLOCK 两条下游路径各预录一份 trace JSON(各 ~30KB),访客的选择决定加载哪份——把 Studio 的 fork 概念压缩成零后端 demo。

### 3. OpenAI Traces dashboard(Agents SDK)

**核心交互回路**:dashboard 里 Logs > Traces,按 workflow_name 分组的运行列表 → 点进去是 span 树。span 有**类型词汇表**:agent span / generation span / tool span / handoff / guardrail,每类语义分明。

**为什么像真产品**:tracing **默认开启**、零配置——observability 是 SDK 的固有属性而非附加件;typed span 让一眼扫过去就知道每步"是什么性质的事",不用读内容。

**克制清单**:
- span 类型就 5 种左右,**拒绝无限自定义的视觉分类**;
- 原始 payload 全部点击后才见;
- 列表页只按 workflow 分组 + 时间排序,没有花哨聚合。

**可偷模式**:
1. **步骤类型词汇表**:Release Guardian trace 每行加一个 mono 类型标签——`NODE` / `TOOL` / `LLM` / `GATE`(审批节点用 GATE)——四种类型四种排版处理,标签本身就是 icon,完美契合"无 icon"约束。零成本。
2. guardrail/gate 作为一等公民类型:审批节点在类型系统里就与众不同,不靠加粗加框强调。

### 4. Arize Phoenix

**核心交互回路**:`uvx arize-phoenix serve` 一行命令 → localhost:6006 打开 UI → 你的应用一跑,trace 就出现。产品页把这行命令当 hero 展示。

**为什么像真产品**:**一行命令到可用界面**;"Your traces stay in your environment"——本地运行、无 API key、无云账号,开发者 30 秒内在自己机器上验证了它是真的。

**克制清单**:
- 产品首页**不展示** UI 细节、不放操作演示、不放定价——只推那一行命令和开源身份(ELv2、10k+ star);
- 让"跑起来"代替"看介绍"。

**可偷模式**:
1. 安装区的 hero 就是**一行命令**:`docker run -p 8080:8080 ghcr.io/xxx/release-guardian`,大号 mono 字排版,下面用小字给出**运行成功后你会看到的第一行输出**。命令 + 预期输出 = 完整的信任回路。静态内容,零成本。
2. "数据不出你的机器"作为 Docker 安装的一句话卖点(评估的是你自己的 PR,不上传)。

### 5. Temporal Web UI —— 克制的天花板

**核心交互回路**:workflow 列表(状态色一目了然)→ 点进详情页:顶部摘要条(状态 badge、Start/Close Time、Duration、Run ID)→ Timeline 视图:**第一行 = 整个 workflow 的总跨度**,下面每行 = 一个 Activity 的持续时间条(Scheduled/Started/Completed 三个事件**聚合成一行**),Signal/Marker 是时间线上的点,绿 = 完成、红 = 失败,悬停出毫秒级 tooltip,重试显示重试图标和次数。

**为什么像真产品**:整个 UI 是 event sourcing 的**投影**——每个像素都从真实 event history 推导;Pending Activities 实时可见;Timeline / Compact / JSON 多视图共享同一份事实。

**克制清单**(官方博客明说的设计取舍,全是金子):
- **事件聚合**:3 个原始事件 → 1 行,拒绝把 event history 平铺给人看;
- **限制缩放级别**,原话"以免在时间海洋中迷失",并给 Fit 按钮一键复位;
- Timeline 是**可折叠手风琴**,折叠偏好按设备持久化;
- 过滤器支持"只看 Pending 和 Failed";
- 颜色**只编码结果**(绿/红),不编码类型、不编码优先级——一个视觉通道只干一件事。

**可偷模式**:
1. **首行总览**:trace 回放顶部第一行永远是"整次评估"的总跨度条(总耗时、总 token、最终判定),13 个节点行在其下。放 trace 区最上方,零成本。
2. **节点内部聚合**:节点内的 LLM 调用 + 工具调用默认折成一行,展开才见——13 行封顶,绝不出现 40 行。
3. **颜色纪律**:通过 = 墨蓝,BLOCK/失败 = 朱砂,其余一律墨色——朱砂只留给风险,和站点色板天然同构。

### 6. MCP 安装 UX(Anthropic .mcpb / claude mcp add / Cursor deeplink / Cline)

**核心交互回路**(四条流):
- **Claude Code**:`claude mcp add --transport http <name> <url>` 一行 → `claude mcp list` 显示 `✔ Connected` → 会话里首次调用弹权限确认,工具调用**带 server 名标签**输出。官方 quickstart 的编排是 add → verify → use → remove 四步,**每步都给出预期输出的原文**(连确认字符串 "Added HTTP MCP server..." 都印在文档里),还有一张状态字形表(✔/!/✘)。
- **.mcpb**(Desktop Extensions):下载 → 双击 → 点 Install,三步完;manifest.json 用 `user_config` 声明所需配置,宿主 app 自动渲染表单、安全存储。Anthropic 的论述:"安装摩擦让数千个 MCP server 对非技术用户基本不可及"。
- **Cursor**:网页上的 "Add to Cursor" 按钮 = `cursor://anysphere.cursor-deeplink/mcp/install?name=X&config=<base64>` deeplink → Cursor 弹确认框(显示名称和 URL)→ Add → 工具出现在聊天的 Available Tools 里。
- **Cline**:marketplace 点 Install 后,**由 agent 自己完成 clone/装依赖/build/写配置**,只向你要 API key。

**为什么像真产品**:安装的每一步都**可验证**——命令有预期回显、列表有状态字形、首次调用有带名标签的工具输出。用户从不处于"装没装上?"的悬置状态。

**克制清单**:
- quickstart 首个示例刻意选**无需鉴权**的 server(文档 MCP),把 OAuth、token、scope 全部推到后面章节;
- 一条命令起步,不上来就给配置矩阵;
- Cursor 确认框只显示两个字段:名称和 URL。

**可偷模式**(Release Guardian 安装区,放页面下半部):
1. **双入口、零 tab**:一行 `claude mcp add --transport http release-guardian https://mcp.xiangguozhang.com/mcp`(带复制)+ 一个纯文本 "ADD TO CURSOR" 链接(deeplink 内嵌 base64 config,**零服务器成本**)。MCP server 本体以 HTTP transport 跑在现有阿里云 VPS 上,三个只读工具,内存 ~50MB,边际成本 ¥0。
2. **预期输出即文案**:命令下方原样排出 `✔ release-guardian — Connected` 和首次调用时带 `release-guardian` 标签的工具输出截录——把"成功长什么样"提前给用户看。
3. **给出第一句 prompt**:安装命令旁直接给可复制的验证语句,如 "Use release-guardian to assess the release risk of this diff"。30 秒时间线:复制命令 5s → 终端粘贴回车 5s → 起 `claude` 粘 prompt 10s → 看到带标签的工具调用 10s。页面上就把这四步排成 4 行带秒数的清单。

### 7. Devin / Manus(session 回放)

**核心交互回路**:
- **Devin**:session 记录**全量时间线**——每条 shell 命令、每个文件 diff、每次浏览器操作;底部时间线可**拖动 scrub**,任意点可 "restore checkpoint" 回滚文件+记忆(blockdiff 快照,20GB 磁盘 ~200ms)。
- **Manus**:每个 session 生成 `manus.im/share/{id}?replay=1` 分享链接;访客打开即看步进式回放——左侧计划/对话流,右侧 "Manus's Computer" 屏幕(打开了哪些页、跑了什么搜索、写了什么文件)。**replay 链接本身成了 Manus 的增长引擎**——产出物自带工作过程证明。

**为什么像真产品**:回放不是录屏视频,是**真实状态序列**——Devin 能从任意点回滚继续,Manus 的每步都是真实会话数据。"能回到那个时刻"和"只能看那个时刻的录像"是产品与 PPT 的分界线。

**克制清单**:
- Devin 的时间线是**底部一条细带**,不是一墙日志;交互动词是 scrub(拖),不是 scroll(翻);
- Manus 给访客的是**策展过的回放**(计划 + 屏幕),不是 raw log dump;回放只读,干预要自己开新 session。

**可偷模式**:
1. **发丝线 scrubber**:trace 回放底部一条 1px 细线,13 个刻度 = 13 个节点,点击/拖动跳转,当前进度以墨蓝实段表示。纯前端,零成本。
2. **可寻址的时刻**:URL hash 编码步骤(`#gate`),可以把招聘者**直接链到审批分叉那一刻**——简历里贴的链接直达高潮。零成本。
3. 回放滚入视口后自动慢速播放(可暂停),Manus 式"打开链接就在动"。

---

## 二、三个重点问题的结论

### 轨迹回放的最佳呈现:图 + 行列表 + scrubber 三位一体,各司一职

调研结论是**不存在单一最佳视图,但存在最佳分工**:LangGraph Studio 证明"图"负责回答*结构在哪、现在到哪*(空间);Temporal 证明"聚合行列表"负责回答*每步花了多久、结果如何*(事实);Devin 证明"scrubber"负责*导航时间*(时间)。三者共享一个当前节点指针即可,谁也不重复谁。反例是把 waterfall、树、图、日志四种视图并排堆——那正是"要素太多"。对 13 节点的 Release Guardian:上图(SVG 点亮)、中列表(13 行封顶,行内聚合)、底 scrubber(一条发丝线),整个回放区一屏放下。

### 30 秒装进编辑器:一行命令 + 预期输出前置 + 首句 prompt

行业已收敛的公式 = **消灭选择(首选路径只有一条命令)+ 消灭悬置(每步预期输出印在页面上)+ 消灭空白页(给出第一句该说的话)**。Cursor deeplink 按钮是零成本加分项。托管 HTTP MCP(免 npx 下载等待)比 stdio 快 10 秒以上,VPS 现成,应选 HTTP。

### 审批/人在环的产品感:决策必须作用于具体对象,且系统可见地"在等"

LangGraph 的 interrupt 给了动词表(approve/edit/reject/respond),Temporal 给了"pending 状态一等公民"的呈现,Devin/Claude Code 给了"行内权限确认"。合成:回放行进到 GATE 节点时**真正停下**——scrubber 停走、图上该节点朱砂描边、mono 小字 `AWAITING DECISION`,页面上此刻**唯二**可点的元素是 APPROVE / BLOCK 两个零圆角按钮;按钮上方展示决策对象(agent 产出的风险评估摘要,即 interrupt payload),让访客批的是"一份具体的风险报告"而不是抽象按钮;选择后所选路径逐节点点亮,**未选路径以淡墨虚线留在图上**(ghost path)——分叉感来自看得见的"另一条没走的路"。

---

## 三、若由一家顶级公司来做 Release Guardian 的产品页(~150 字)

页面加载完是一片安静的米纸,只有一张 13 节点的发丝线图谱和一行 mono 小字:一次真实的发布评估,47 秒。滚动即播:节点依次浸上墨蓝,右侧行列表同步吐出耗时与判定。到第 9 节点,一切停住——朱砂描出 GATE,`AWAITING DECISION`。此刻全页只有两个可点的词:APPROVE / BLOCK。你按下 BLOCK,下游路径亮起,未走的那条留成淡墨虚影。页尾只有一行命令和一句预期回显:`✔ release-guardian — Connected`。没有一个形容词在推销;整页只是让你亲手拦下了一次危险发布。

---

## 四、落地清单速览(按页面位置)

| 位置 | 设计 | 服务器 | 量级 |
|---|---|---|---|
| 首屏 | 13 节点 SVG 图 + 回放点亮 + 首行总览条(总耗时/token/判定) | 无 | SVG ~15KB |
| 回放区 | 聚合行列表(NODE/TOOL/LLM/GATE 类型标签,行可展开)+ 底部发丝线 scrubber + `#gate` 可寻址 | 无 | trace JSON ~100–300KB |
| GATE 分叉 | 停播 + interrupt payload 展示 + APPROVE/BLOCK,双分支预录 trace | 无 | 2×~30KB |
| 安装区 | `docker run` 一行 + `claude mcp add` 一行 + ADD TO CURSOR deeplink + 预期输出原文 + 首句 prompt + 4 步 30 秒清单 | HTTP MCP 跑在现有 VPS | 边际 ¥0,内存 ~50MB |

颜色纪律(Temporal 教的):朱砂只给风险(BLOCK/失败/GATE 描边),墨蓝给完成与进度,其余全墨色。

---

Sources:
- [Temporal: Let's visualize a workflow(Timeline View 设计博客)](https://temporal.io/blog/lets-visualize-a-workflow)
- [Temporal Web UI 文档](https://docs.temporal.io/web-ui)
- [Anthropic Engineering: Desktop Extensions (.mcpb)](https://www.anthropic.com/engineering/desktop-extensions)
- [Claude Code MCP quickstart](https://code.claude.com/docs/en/mcp-quickstart)
- [Cursor MCP 文档](https://cursor.com/docs/mcp)
- [Cline MCP Marketplace 发布博客](https://cline.bot/blog/introducing-the-mcp-marketplace-clines-new-app-store)
- [LangSmith Observability 产品页](https://www.langchain.com/langsmith/observability)
- [LangSmith 公开分享 trace 文档](https://docs.langchain.com/langsmith/share-trace)
- [LangSmith observability 概念文档](https://docs.langchain.com/langsmith/observability-concepts)
- [LangGraph Studio 发布博客](https://www.langchain.com/blog/langgraph-studio-the-first-agent-ide)
- [LangChain Human-in-the-loop 文档](https://docs.langchain.com/oss/python/langchain/human-in-the-loop)
- [OpenAI Agents SDK Tracing 文档](https://openai.github.io/openai-agents-python/tracing/)
- [OpenAI Agent Evals 指南](https://developers.openai.com/api/docs/guides/agent-evals)
- [Arize Phoenix 产品页](https://arize.com/phoenix/)
- [Arize Phoenix GitHub](https://github.com/arize-ai/phoenix)
- [Cognition: How Cognition Uses Devin(timeline/checkpoint/blockdiff)](https://cognition.com/blog/how-cognition-uses-devin-to-build-devin)
- [Manus Browser Operator 文档](https://manus.im/docs/features/browser-operator)
- [awesome-manus-replay(replay 链接格式)](https://github.com/agenaiguy/awesome-manus-replay)
