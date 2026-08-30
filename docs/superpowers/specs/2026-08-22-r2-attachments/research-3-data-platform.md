调研完成。以下为最终报告。

---

# 方向 3 调研报告:数据平台/SQL 控制台类产品(2026-08 实测)

调研方式:浏览器实际操作 play.clickhouse.com、sql.clickhouse.com、shell.duckdb.org、play.grafana.org,实测 DuckDB-WASM 的 CDN 传输体积,其余(MotherDuck / Snowsight / Databricks / Evidence / Observable)取官方文档与公开 demo。映射目标:crossover-study(43.9M 行 Amazon 评论,Spark+Iceberg,null-hypothesis 研究)的 DuckDB-WASM 工作台 + 两个归档分析页。

---

## 1. play.clickhouse.com(老 play UI —— 本次最重要的标杆)

**(1) 核心交互回路。** 首屏总共 5 个元素:URL 栏、预填 `play` 的用户名、一个空 SQL 文本框、黄色 Run 按钮 + "(Cmd+Enter)" 灰字、右上角一行 `v26.8.1.1653, uptime 2 days` 加绿点。没有任何引导。输入查询按 Run,1 秒内结果出现。我实测跑了一条 github_events 聚合,得到的反馈行是:

> `✓ Logs Metrics | 10 rows in result, 0.16 sec. 3.17 GB RAM | Read 122.19 M rows, 987.47 MB (758.01 M/sec, 6.13 GB/sec)`

结果表:行号列、等宽字体、数字列右对齐且带黄色热度背景(数值越大越黄)、一个下载按钮。运行后查询被编码进页面标题/URL,链接即分享。

**(2) 为什么像真产品。** 三个机制:a) 顶栏的版本号 + uptime + 存活绿点——这是"一台真服务器在线"的最小证明;b) 执行读数是引擎真实 telemetry,"0.16 秒扫 1.2 亿行"是招聘者能转述给同事的一句话;c) 打开即是可运行状态,零 onboarding、零加载——页面本身不到 50KB。

**(3) 克制清单(最重要)。** 它**没有**:schema browser、图表、AI 助手、保存/历史面板、onboarding tour、任何 icon 装饰、任何营销语。结果只有一种形态:等宽表格。多查询也只是极简的 "Query A | +" 标签。一整个"数据平台"被压缩成:一个输入框、一个按钮、一行读数、一张表。

**(4) 可偷模式。**
- **一行 telemetry 读数**放在 Run 按钮右侧同一行:`10 rows · 0.42 s · scanned 43.9M rows · 812 MB`。纯 WASM 可得(DuckDB profiling),零服务器,零字节成本。
- **数字列热度背景**:结果表数值列按量级染色(朱砂淡阶即可,替代黄色)。~30 行 JS。
- **查询编码进 URL hash**:招聘者可以把"跑出结果的那个链接"直接发给面试官。零成本。
- **版本+状态铭牌**:右上角 mono 小字 `DuckDB v1.5.x (wasm-eh) · 单线程 · 引擎未加载/就绪`,对应它的 uptime 行。

---

## 2. sql.clickhouse.com(新 SQL Playground —— "10 秒出结果"的教科书)

**(1) 核心交互回路。** 首屏**预载了一条写好的查询**("Temperature by country and year"),用户唯一要做的动作是按 Cmd+Enter。我实测:`Query time: 2.36s · Rows read: 281,960,952`——第一次交互就摸到 2.8 亿行。左栏是 Tables/Queries 双 tab + 搜索框 + 按数据集分文件夹的策展查询(其中就有 **amazon** 文件夹,与 crossover-study 直接同题;noaa 文件夹下 38 条命名查询,如 "World's coldest countries"、"Most effective codec per column")。右下 Results/Charts 双 tab + 一个下载按钮。

**(2) 为什么像真产品。** a) 五个读数占位符**在未运行时就常驻显示** `Query time: -- / Rows read: -- / Bytes read: -- / Rows per second: -- / Bytes per second: --`——先承诺后兑现,这是"能力可见性"设计;b) 每条策展查询都有人类可读的命名,像同事留下的工作现场而不是教程;c) "Save as my query" + share 按钮 + GitHub issue 模板("Suggest query or dataset")——它有社区回路。

**(3) 克制清单。** 单编辑器、单结果区;Charts 藏在第二个 tab 不抢戏;无 dashboard、无 lineage、无 catalog 管理、无权限概念;商业化只有底部一条 Sign up 横幅;AI 入口只是顶部一条可关闭的横幅(引去独立站 AgentHouse llm.clickhouse.com),没有塞进编辑器。

**(4) 可偷模式。**
- **首屏预载查询 + 光标就位**:crossover 工作台落地页不要空编辑器,直接放"研究问题 #1"的 SQL,注释里写清它验证什么假设。零成本,这是 10 秒回路的一半。
- **策展查询列表 = 叙事目录**:左侧(或编辑器上方)一列 5–8 条命名查询,按研究递进排序:`行数与时间范围 → 类目分布 → 交叉购买对 → null-hypothesis 检验 → 反例`。点击替换编辑器内容。纯静态 JSON,<5KB。
- **读数占位 "--" 常驻**:未运行也显示读数框架,暗示"这里会有引擎数据"。
- 不偷的:文件夹树(两层太重,单列表就够)、Charts tab(归档分析页已承担图表职能)。

---

## 3. shell.duckdb.org(DuckDB Web Shell)

**(1) 核心交互回路。** 打开即终端:`DuckDB Web Shell running... / DuckDB v1.5.2 (Variegata) / Enter ".help" for usage hints.`。顶栏仅 New / Share / Import / **Datasets** 四项。Datasets 下拉是 2026 年的亮点:NL Railway (**DuckLake**)、Star Trek (CSV)、Train Services (Parquet)、TPCH on DuckLake、NYC Taxi (Parquet)、NYC Bike Trips (Spatial)、**Iceberg (S3 Tables)**——点击即向终端注入该数据集的 ATTACH/查询命令并执行。Share 把会话命令编码成可分享链接。

**(2) 为什么像真产品。** 版本横幅 = 一个真实引擎刚刚在你浏览器里完成启动;终端隐喻本身是承诺——没有预设护栏,任何 SQL 都行。Datasets 一键脚本演示了"连远端 Parquet/Iceberg 只是一条命令"。

**(3) 克制清单。** 无 GUI 结果表(ASCII 表)、无图表、无 schema tree、无 AI、无账号。整个产品对"多要素"的回答是:一个提示符。

**(4) 可偷模式。**
- **启动横幅仪式**:引擎加载完成后在结果区上方打一行 mono 字 `DuckDB v1.5.2 (wasm) ready · 引擎加载 4.8s · 数据源:iceberg snapshot 7421…`。把加载本身变成第一个 telemetry。零成本。
- **Iceberg 一键挂载叙事**:官方 shell 都在用 "Iceberg (S3 Tables)" 当招牌 demo——crossover 的 Iceberg 血统应该显式出现在工作台铭牌里,而不是埋在 report 里。

---

## 4. MotherDuck(SQL 编辑体验的上限参照)

三栏:Object Explorer / notebook cells / Results 面板 + **Column Explorer**(每列直方图、NULL 占比、频率分布,零 SQL 自动生成)。招牌是 **Instant SQL**:键入即预览、无 Run 按钮——本地先 parse 执行给即时反馈,云端结果后台补齐,cell 头部有缓存指示。另有 AI FixIt(报错一键修复)。

**为什么像真产品**:反馈延迟低到"编辑器在和你对话"。**克制视角**:它其实是"要素偏多"的一端(notebook、AI、pivot、分享全都有)——对站主的教训是只提炼两点:a) 结果面板附一个**自动列画像**(每列 min/max/NULL%/直方图,DuckDB `SUMMARIZE` 一条命令就能生成),这比多做三个功能更有"平台味";b) 若做不了 Instant SQL,至少让预置查询的切换是即时的(预渲染结果,见第 8 节)。

---

## 5. Snowflake Snowsight / Databricks SQL Editor(必需要素 vs 企业噪音的分界线)

Snowsight worksheet 跑完一条查询**立即**显示:执行时长、结果行数、完成时间、**扫描数据量**、当前 role+warehouse;结果每列自动附 contextual stats(直方图);Query Profile 另开 tab;历史仅 25 条。Databricks 新 SQL editor:catalog/schema 下拉、多语句执行、results+viz、版本历史、Genie 助手、协作编辑。

**分界线结论**(两家取交集):
- **必需**(所有 SQL 控制台的公约数):编辑器 + Run/快捷键、结果表、**时长与扫描量读数**、schema 可查、结果下载。就这五样。
- **企业噪音**(招聘者场景全删):warehouse/role 选择器、权限与治理、alerts/scheduling、协作编辑、workspace 文件树、AI 助手、成本面板、query history 管理。
- 值得注意:两家都把"扫描量"当一等公民展示——它同时是性能证据和计费单位。作品集里它只需要承担前者。

---

## 6. Evidence.dev / Observable Framework(归档分析页的形态,不是工作台的形态)

**Evidence**(实测 evidence-demo.netlify.app):读者看到的是**成品报告**——KPI 卡片、趋势箭头、图表、下拉筛选,左侧多报告导航,静态构建秒开;**SQL 完全不暴露给读者**(只存在于 repo)。其 Universal SQL 架构把构建期数据快照成 Parquet,浏览器端 DuckDB-WASM 支撑 inputs 触发的重算——即"交互靠 WASM,但读者从不见引擎"。**Observable Framework** 相反:```sql 代码块连同结果表一起出现在页面上,data loaders 构建期快照成 Parquet,DuckDB 懒加载,inputs 与 SQL `${…}` 插值联动——代码即内容。

**克制清单**:Evidence 的读者页没有 Run 按钮、没有 schema、没有任何"平台"元素——叙事第一。**对站主的直接结论**:两个归档分析页走 Evidence 形态(预计算图表 + 叙事 + 可折叠的 "查看 SQL" `<details>`),工作台走 ClickHouse 形态;**两种形态不要混在同一页**,混合正是"要素太多很乱"的来源。

---

## 7. play.grafana.org

无登录直接进入一个**真实 Grafana Cloud 实例**;首页本身就是一个 Grafana dashboard(用产品自己当落地页);"Dashboard of the Month"(2026-08 是 Eurovision 2026)做策展入口;任何 panel 可 Edit/Inspect 看到背后的查询和数据,改动是临时的(viewer 临时编辑,不落盘),另有 sandbox 文件夹可匿名建 dashboard。**可偷模式**:a) "改了也不会坏"的沙箱承诺——工作台旁一行小字"随便改,刷新即复原";b) 用真实运行的东西当首屏,而不是它的截图。

---

## 8. 四个重点问题的答案

### A. "招聘者 10 秒内跑出结果"的最小完整形态

10 秒回路 = **秒开首屏(0-2s)→ 看见预载查询与既有结果(2-4s)→ 按一次 Cmd+Enter(5s)→ 读数跳动、结果刷新(≤10s)**。最小完整清单(七件,多一件都是熵):

1. 预载查询,注释首行写研究问题(sql.clickhouse.com 模式);
2. 编辑器,mono 字体,语法高亮可以只做关键字级;
3. Run 按钮 + "(Cmd+Enter)" 灰字;
4. 一行 telemetry:`N rows · X.XX s · scanned N rows · N MB`,未运行时显示 `--`;
5. 结果表:行号、右对齐数字、≤20 行、单一下载按钮;
6. 5–8 条命名的策展查询(单列表,按研究叙事排序,点击替换编辑器);
7. schema 铭牌:一张静态表(表名·列·类型·行数),`<details>` 收起,不做可折叠 tree。

明确不要:多标签页、Charts tab、AI、保存/历史、登录、第二个下载格式。

### B. 真实数据平台感的来源(细节清单)

- **引擎 telemetry**:elapsed / rows scanned / bytes scanned / 吞吐——四个标杆(ClickHouse×2、Snowsight、Databricks)全都把它放显要位置;DuckDB 端由 profiling/`EXPLAIN ANALYZE` 取真值,**绝不手写**。
- **版本铭牌**:`DuckDB v1.5.2 (wasm-eh) · 单线程 · 4GB 内存上限`——连约束都写出来反而更真。
- **数据规格铭牌**(构建期从 Iceberg metadata 生成,静态但真实):`43,942,xxx rows · N parquet files · N GB (zstd) · 2000–2023`。
- **Iceberg 专属真实感——这是 crossover 相对所有标杆的差异化武器**:一行 `table @ snapshot 7421083… · committed 2026-06-30 · schema v3`,数据直接取自 `metadata.json`。没有任何一个作品集会有 snapshot ID,而每个用过 Iceberg 的面试官都认得它。lineage 图则是企业噪音,不做。
- **错误也真实**:SQL 报错原样显示 DuckDB 错误文本,不包装成友好提示。

### C. DuckDB-WASM 41MB 点击加载的等待期设计

先修正数字(2026-08 实测 jsdelivr):`duckdb-eh.wasm` 原始 34.25MB(mvp 39.4MB),**brotli 压缩后实测传输 6.2MB**(v1.29.0 content-length 6,205,060)+ worker ~0.7MB。"41MB"是未压缩量级;VPS/nginx 或 CDN 配好 brotli 预压缩后,真实等待是 10Mbps 下 5–8 秒。设计:

1. **冷结果热引擎(核心手法)**:构建期把全部策展查询跑好,结果存静态 JSON(每条 ≤10KB)。页面秒开即显示默认查询的完整结果表和读数,右上标 `cached · build 2026-08-14`;用户第一次点 Run 才拉引擎,就绪后标签翻成 `live`,此后每次执行都是真算。等待从"白屏忍耐"变成"从回放升级为现场"。
2. **按钮诚实**:`启动引擎 · ~7 MB`,写真实传输量。
3. **进度 = 真字节**:fetch progress 显示 `3.1 / 6.2 MB`,完成后打 shell 式一行 `DuckDB v1.5.2 ready · 加载 4.8s`(shell.duckdb.org 的启动横幅仪式)。
4. **蓄意预取**:鼠标进入工作台区块即 idle prefetch wasm,多数人点 Run 时已就绪。
5. **引擎与数据分层**:Parquet 走 httpfs range request 按需拉列块,首条预载查询设计成只扫 1–2 列,保证"live 首查"也快。
6. **兜底**:WASM 不可用则停留在 cached 态并说明。

### D. 服务器端 SQL 还是纯 WASM

**主推纯 WASM,理由三条**:零边际成本(静态托管,招聘季并发无上限);零攻击面(没有可注入的后端,`SET enable_external_access=false` 之外无需任何防护);且"你的浏览器刚扫了 4 千万行"本身就是叙事高潮——服务器端反而稀释它。**数据量对策**:43.9M 行全量 Parquet 预计 3–8GB,浏览器全扫不现实(4GB 内存上限)。做**构建期 serving layer**:核心事实表抽样(如 1:20)+ 全量预聚合表,合计控制在 100–500MB,并在铭牌里写明 `工作台 = snapshot 7421… 的抽样+聚合视图;全量 Spark 结果见分析页`——声明分层本身就是数据工程能力展示。**服务器端的定位**:play.clickhouse.com 证明只读公开 SQL 端点可行(readonly 用户+资源限额),VPS 增量成本 ≈0,但换来 timeout/限流/监控的长期运维,对单人站不划算;若想秀后端,更好的形态是 Modal 起一个按需 serverless "全量对照" 按钮(点击后在云端对同一查询跑全量,把两个耗时读数并排显示,冷启动 2–5s,免费额度内)——第二期再做。

---

## 9. 若由一家顶级公司来做这个产品页(150 字想象)

页面打开不是介绍,是一台已经在运行的仪器:米纸底上一块墨蓝工作台,预载查询、结果表、`cached` 铭牌俱在,像上一位分析师刚离席。左缘一列八个问题,从"这批数据有多大"递进到"推荐系统在这里失效了吗",每点一个,SQL 与答案同步更换。按下 Run 的瞬间,cached 翻成 live,读数逐位跳出:`scanned 43,942,117 rows · 0.9s · in your browser`。右下角一行小字:`iceberg snapshot 7421083 · committed 2026-06-30`。没有图表,没有帮助,没有第二种颜色的按钮。它不解释自己是产品——它只是没有一处像网页。

---

### 关键事实速查(供落地引用)

| 事实 | 数值/来源 |
|---|---|
| ClickHouse play 执行读数格式 | `10 rows in result, 0.16 sec, 3.17 GB RAM / Read 122.19M rows, 987.47MB (758M/s)`(实测) |
| sql.clickhouse.com 首屏 | 预载查询,实测 `2.36s / 281,960,952 rows`;五读数占位 `--` 常驻 |
| sql.clickhouse.com 左栏 | 含 amazon 数据集策展查询文件夹(与 crossover 同题) |
| shell.duckdb.org | v1.5.2 (Variegata);Datasets 下拉含 Iceberg (S3 Tables)、DuckLake×2 |
| duckdb-eh.wasm | 34.25MB raw → **6.2MB brotli 实测**(jsdelivr);worker ~0.74MB |
| Snowsight 跑后即显 | 时长、行数、完成时间、扫描量、role/warehouse;每列自动直方图 |
| Evidence 读者页 | SQL 完全隐藏,纯叙事;交互过滤由浏览器端 DuckDB-WASM 承担 |
| Grafana Play | 无登录真实例;首页即 dashboard;编辑不落盘 |

Sources: [play.clickhouse.com](https://play.clickhouse.com)(实测)· [sql.clickhouse.com](https://sql.clickhouse.com)(实测)· [shell.duckdb.org](https://shell.duckdb.org)(实测)· [play.grafana.org](https://play.grafana.org)(实测)· [MotherDuck Quick Tour](https://motherduck.com/docs/getting-started/interfaces/motherduck-quick-tour/) · [MotherDuck Instant SQL/AI features](https://motherduck.com/blog/motherduck-ai-sql-fixit-inline-editing-features/) · [Snowsight worksheets docs](https://docs.snowflake.com/en/user-guide/ui-snowsight-query) · [Databricks SQL editor docs](https://docs.databricks.com/aws/en/sql/user/sql-editor/) · [Observable Framework SQL](https://observablehq.com/framework/sql) · [Evidence.dev](https://evidence.dev) · [Evidence demo](https://evidence-demo.netlify.app) · [DuckDB-Wasm overview](https://duckdb.org/docs/current/clients/wasm/overview.html) · [jsdelivr @duckdb/duckdb-wasm dist](https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm/dist/)(体积实测)· [Grafana Play sandbox 说明](https://restertest.substack.com/p/discover-grafana-play-a-hands-on) · [Grafana 匿名 dashboard 讨论](https://community.grafana.com/t/creating-a-new-dashboard-anonymously-on-play-grafana-org/117562)
