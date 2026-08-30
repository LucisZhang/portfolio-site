# 方向 4 调研:流处理/可靠性/混沌工程类产品(2026-08 实查)

映射项目:**exactly-once-drills**(MySQL CDC 双路径 → Kafka → Flink → Iceberg,10 类故障注入,0 snapshot diff,1791 events/s;页面规划 = 故障棋盘 + 回放控制台)

---

## 1. Confluent Cloud — Stream Lineage / Consumer Lag

**(1) 核心交互回路**:进入即见"过去 10 分钟"的数据流动图——producer → topic → consumer 的节点图,**箭头粗细 = 相对消息流量**。10 秒内用户会 hover 一个节点(弹出吞吐量摘要)或点击一条边(展开 drilldown 面板)。反馈是即时的 inspect panel:点 topic 看 schema + 吞吐,点 consumer 看 lag。

**(2) 为什么像真产品**:a) **默认时间窗是"最近 10 分钟"**——数据是活的,不是截图;b) Point-in-Time Lineage 可以回拨到"过去 7 天内任意 1 小时窗口",时间是一等公民;c) 图的形态由真实流量决定(箭头粗细、24+ 同类节点自动折叠成 node group),不是手画的架构图。

**(3) 克制清单**:默认**不展示任何数字**——图上只有拓扑和相对粗细,吞吐/lag/offset 全部藏在 hover 和点击后的 inspect panel 里;不显示历史曲线(要看曲线得去另一个 Metrics 页);24 个以上同类节点强制折叠。教训的反面:一旦点开 inspect panel,tabs 逐渐堆料,信息层级开始失控——这正是站主批评的"要素太多"在企业产品里的样子。

**(4) 可偷模式**:
- **"箭头粗细 = 流量"的拓扑图**放页面首屏:MySQL → (双路径分叉) → Kafka → Flink → Iceberg 五节点一条线,双路径处 fan-out,线宽按 1791 events/s 的实测分路流量画。纯 SVG 静态,0 服务器,<10 KB。
- **hover 才出数字**:节点 hover 显示 mono 标签小卡(topic 名、offset、吞吐),默认图面上零数字。纯 CSS/JS,0 成本。
- **"最近 10 分钟"语义偷成"本次演练的 10 分钟"**:时间窗标注用 mono 字体写死演练的真实时间戳区间(如 `2026-07-14T09:32:00Z +600s`),暗示数据是录制的真流量而非编造。

---

## 2. Grafana — Incident 时间线 / IRM(+ k6 见 §5)

**(1) 核心交互回路**:incident 一旦 declare,系统**自动**把告警、Slack 消息、dashboard panel 快照、责任人操作按时间顺序钉到一条垂直时间线上;用户进来 10 秒内做的事是"沿时间线往下滚",系统的反馈是每个时间点上挂着的证据(panel 截图、日志片段)。

**(2) 为什么像真产品**:时间线是**自动捕获**的而非事后手写——"key events, actions, and observations" 按时序落位,还能一键把时间线转成 Post-Incident Review (PIR) 文档,pre-populate 全部事件。真实感来自"机器记录的时间戳 + 挂在时间点上的原始证据",而不是叙述。

**(3) 克制清单**:Incident 时间线本身**只有一列**——没有并排图表,没有仪表盘;dashboard panel 只在被人为引用时才以缩略图形式嵌入时间线。反面教训在 Grafana dashboard 本体:默认模板动辄 20+ panels 满屏曲线,没有叙事顺序,访客不知道先看哪张——这是"报告式展示"的极端形态,恰是站主要逃离的东西。

**(4) 可偷模式**:
- **单列事件时间线**作为回放控制台的骨架:每次故障演练 = 一条垂直时间线,条目形如 `T+00.0s INJECT kill -9 taskmanager` / `T+03.2s DETECT checkpoint N failed` / `T+11.5s RECOVER restore from chk-41` / `T+58.0s VERIFY snapshot diff = 0`。四个阶段用米纸底 + 朱砂/墨蓝发丝线区分。静态 NDJSON 驱动,0 服务器,每次演练 <5 KB。
- **"证据挂载"**:时间线关键条目右侧挂等宽字体的原始日志 3–5 行(截自真实 Flink/Kafka 日志),不放截图。纯静态。

---

## 3. Jepsen 报告(破坏性测试叙事化的祖师爷)

**(1) 核心交互回路**:读者进来先看到"系统名 + 版本 + 日期"的克制标题,10 秒内被引导到**结论摘要表**(Issue 编号 | 描述 | 触发所需事件 | 修复状态)。"交互"是阅读,但每个结论都链接到可下载的原始测试数据(zipped test run)。

**(2) 为什么像真产品**:a) **可量化的具体性**——"679,153 acknowledged writes out of 1,367,069 total" 这种数字无法伪造出报告感之外的真实感;b) **原始 artifact 可下载**,声称可被验证;c) 图不是装饰:"write loss over time" 时序散点图直接就是证据本身,不同节点各画一张暴露 split-brain;d) 诚实的边界声明:"we can prove the presence of bugs, but not their absence"——**承认局限反而增加可信度**。

**(3) 克制清单**:全站几乎零视觉设计——无 dashboard、无动画、无品牌色轰炸;每个 finding 只配"刚好证明该问题"的 1–2 张图;不展示所有通过的测试,只展示失败 + 一张汇总表;日志只引用关键 3 行(如 `"Detected orphaned stream 'jepsen-stream', will cleanup"`),不贴全量。

**(4) 可偷模式**:
- **故障棋盘 = Jepsen 汇总表的图形化**:10 类故障 × 结果状态的一张表格式棋盘(行 = 故障类型,列 = 注入/检测/恢复/验证四阶段耗时 + diff 结果),放页面第二屏。mono 数字,零圆角单元格,发丝线分隔。纯 HTML 表,0 服务器。
- **每格可点开 → 该次演练的回放时间线**(§2 的单列时间线),棋盘是索引、时间线是证据,两层结构直接复刻 Jepsen 的"表 → 图 → 原始数据"三级下钻。
- **原始数据可下载**:每次演练的事件日志 NDJSON + snapshot diff 输出文件放静态链接(每个 <100 KB),这是 Jepsen 式可信度的最低成本实现。
- **一句 Jepsen 式边界声明**放页脚:"10 类故障下 0 diff 证明这些故障可恢复,不证明不存在其他故障。"——这句话本身就是品味信号。

---

## 4. Gremlin / Chaos Mesh — 实验控制台

**(1) 核心交互回路**:Gremlin:选 Service → 点 **"Attack Service"** → 在 "Choose a Gremlin" 里选故障类型(Network → Latency 等)→ 右侧实时显示 **blast radius 图**(高亮将被波及的服务)→ 运行中随时可按右上角 **Halt 按钮** → 结束后 Activity Feed 立即出现该次 attack,可 **re-run**。Chaos Mesh:Web UI 设计实验(也支持 YAML/CRD),Workflow Controller 编排多实验,Dashboard 看状态与 archives。

**(2) 为什么像真产品**:a) **Halt 按钮永远在右上角**——危险操作 + 一键中止的存在本身就传达"这是真的在破坏东西";b) blast radius **在你按下按钮之前**就把后果画出来;c) Activity Feed + re-run:每次实验是可重复的一等对象,不是一次性演示。

**(3) 克制清单**:Gremlin 攻击配置页只显示当前这一种故障的参数,不铺全部 12 种 Gremlin;blast radius 图只高亮受影响服务,其余淡出;结果页留白给人手写 "Notes and Observations",**不假装机器能替你下结论**。Chaos Mesh 的反面教训:UI 功能全但层级平,fault 类型列表一字排开,首次进入无叙事引导。

**(4) 可偷模式**:
- **故障棋盘的格子做成"可按的按钮"**:点一格 = 选择该故障演练,右侧立即显示该故障的 blast radius(在 §1 的拓扑图上朱砂高亮受影响组件),然后播放回放。全部预录,纯前端,0 服务器。
- **re-run 语义**:回放结束后按钮变成 mono 的 `REPLAY`,强调可重复性。
- **可选的真服务器版**(预算内):VPS 上放一个只读 API,`POST /drills/{id}/run` 返回预录事件流但以 SSE 按真实时间间隔推送——用户感到"它正在跑"。Node/Go 单进程,内存 <50 MB,月成本 ≈¥0(复用现有 VPS)。风险:比纯静态多一个故障点,建议静态回放为主、SSE 为彩蛋。

---

## 5. Grafana k6 — 负载报告页

**(1) 核心交互回路**:测试跑完进入 Test Result 页,首屏 **Performance Overview**:VU 数、response time、request rate 四条曲线叠在同一时间轴上,顶部一条 pass/fail 状态横幅。10 秒内用户看的是"曲线形态":response time 平坦 = 好,随 VU 上升而上翘 = 坏。下方 tabs(**Thresholds / Checks / HTTP / Logs / Metrics**)按需下钻。

**(2) 为什么像真产品**:a) 测试运行中曲线**live 更新**;b) pass/fail 由代码里声明的 thresholds 判定,不是形容词;c) Test comparison 支持跑与跑之间的 diff。

**(3) 克制清单**:首屏只有一组叠加曲线 + 一条状态横幅,几十个 HTTP 指标全部收进 tabs;"好/坏"的判断教育用户看**形态**而非读数。反面教训同 Grafana dashboard:一旦进入 Metrics tab 自由加图,页面立即退化成满屏图表。

**(4) 可偷模式**:
- **回放控制台的联动曲线**:时间轴 scrubber 下方放**一条**曲线——events/s 吞吐(1791 的实测序列),故障注入点用朱砂竖线标记,恢复点用墨蓝竖线;拖动 scrubber,时间线条目与曲线游标同步。这是"指标曲线联动"的最小实现:一条曲线,两根竖线,不再多。Canvas/SVG 纯前端,数据 <20 KB。
- **threshold 语义呈现 0 diff**:像 k6 的 threshold 行一样写 `snapshot_diff == 0 ......... PASS (10/10 drills)`,mono 字体,通过项一行带对号语义(文字,非 icon)。

---

## 6. Antithesis — bug 报告呈现

**(1) 核心交互回路**:每次测试自动生成 **Triage Report**(邮件送达),四段式:**Findings**(行动号召,最重要)→ **Environment** → **Utilization** → **Properties**(每条测试性质的 pass/fail)。发现 bug 后一键生成 **causality analysis**——一张"**bug 概率随时间变化**"的图,把哪个事件把系统推向 bug 可视化;配 time-traveling debugger 可回放到任意时刻。

**(2) 为什么像真产品**:a) **确定性 = 完美复现**("fully deterministic, so you can effortlessly reproduce every bug perfectly")——把"能重放"本身做成了核心卖点;b) 报告以 Findings(该做什么)开头而不是数据开头;c) Properties 是**用户自己声明的性质**逐条 pass/fail,验证结论有明确的命题结构。

**(3) 克制清单**:Triage Report 只有四节,Findings 永远第一;统计(Utilization)排最后;causality 图一张只讲一个 bug;不展示全部执行轨迹,只有点开才 time-travel。

**(4) 可偷模式**:
- **把"0 diff"写成 property 命题**:页面上方用一行 mono 陈述句定义验证命题——`∀ drill ∈ 10 faults: iceberg_snapshot(path_A) ≡ iceberg_snapshot(path_B)`,下面 10 行逐条 `PASS`。命题先行,数字在后。静态,0 成本。
- **确定性回放作为卖点写进文案**:一行说明"回放数据为演练当时的完整事件录制,非模拟"——Antithesis 的"perfect reproduction"话术移植。
- **Findings 式摘要**放故障棋盘上方:两三行结论(最慢恢复的故障、最接近失败的一次),替代任何"项目介绍"段落。

---

## 三个重点问题的直接回答

**A. "注入→检测→恢复→验证"回放怎么呈现最有产品感?**
实查结论:**单列事件时间线为主轴(Grafana Incident)+ 一条联动吞吐曲线(k6)+ scrubber 拖动(Antithesis time-travel 的静态版)** 的三合一。时间轴是叙事,曲线是证据,scrubber 是"可操作感"的来源。关键机制:四阶段(INJECT/DETECT/RECOVER/VERIFY)必须是**机器时间戳**而非文案描述;拖动 scrubber 时曲线游标、时间线高亮、拓扑图上的受损节点三者同步——但同屏永远只有这三个元素。全部由预录 NDJSON 驱动,**不需要服务器**;SSE 实时推送版可作为 VPS 上的可选彩蛋。

**B. "0 diff"怎么可视化才可信?**
不可信的做法:一个大大的"0"或绿色徽章。可信的做法(Jepsen + Antithesis 合成):① 先陈述**命题**(两条路径的 Iceberg snapshot 逐字段相等);② 给出**过程数字**——比对了多少行、多少字段、耗时多少(Jepsen 的 679,153/1,367,069 式具体性);③ 展示 **diff 工具的原始输出**末尾几行(mono,truncate);④ 提供原始比对产物**下载链接**;⑤ 附一句边界声明(证明这 10 类故障可恢复,不证明无 bug)。可信度来自"可验证的链条",不来自视觉强调。

**C. 要素克制:Confluent/Grafana 的反面教训**
两家的通病是**把下钻能力当首屏内容**:Grafana 默认 dashboard 20+ panels 无阅读顺序,Confluent inspect panel 的 tabs 逐层堆料。而它们各自最好的部分恰恰最克制——Confluent 拓扑图上**零数字**(hover 才出),Grafana Incident **单列时间线**,k6 首屏**一组曲线一条横幅**。可提炼的铁律:**每屏一个主对象;数字藏进 hover;下钻代替并列;pass/fail 用命题+机器输出而非徽章;所有通过项折叠、只展开异常项**(exactly-once-drills 全部通过,所以反过来:全部折叠成棋盘一览,点击才展开单次)。

---

## 若由一家顶级公司来做这个产品页(150 字想象)

首屏没有标题党,只有一条正在流动的管线细线图和一行 mono 计数器:`1,791 events/s · drill 07/10 · diff = 0`。往下是 10×4 的故障棋盘,像元素周期表一样安静,每格只有故障名和恢复耗时。点任意一格,页面右侧滑出该次演练的时间线与一条吞吐曲线,scrubber 停在故障注入的那一毫秒,朱砂竖线切开曲线。没有"项目亮点",没有架构图海报;页脚一行小字:"以上为 2026-07-14 演练的完整事件录制,原始数据可下载。" 它不解释自己多厉害——它让你亲手把系统弄坏一次,再看着它回来,而 diff 始终是 0。

---

Sources:
- [Confluent Stream Lineage docs](https://docs.confluent.io/cloud/current/stream-governance/stream-lineage.html) · [Stream Lineage blog(UI 细节)](https://www.confluent.io/blog/visualize-apache-kafka-data-easily-with-stream-lineage/) · [Stream Lineage 课程](https://developer.confluent.io/courses/governing-data-streams/stream-lineage/)
- [Jepsen Analyses 索引](https://jepsen.io/analyses) · [Jepsen NATS 2.12.1 报告](https://jepsen.io/analyses/nats-2.12.1)
- [Grafana IRM incident timeline 文档](https://grafana.com/docs/grafana-cloud/alerting-and-irm/irm/manage-incidents/incident-timeline/) · [Grafana IRM 产品页](https://grafana.com/products/cloud/irm/)
- [Gremlin 实验教程(控制台流程)](https://www.gremlin.com/community/tutorials/how-to-run-a-chaos-experiment-on-a-service-using-gremlin) · [Gremlin Chaos Engineering](https://www.gremlin.com/chaos-engineering)
- [Chaos Mesh 文档](https://chaos-mesh.org/docs/)
- [Grafana Cloud k6 结果分析](https://grafana.com/docs/grafana-cloud/testing/k6/analyze-results/inspect-test-results/)
- [Antithesis 产品页](https://antithesis.com/product/) · [Antithesis Triage Report 文档](https://antithesis.com/docs/reports/triage/)
