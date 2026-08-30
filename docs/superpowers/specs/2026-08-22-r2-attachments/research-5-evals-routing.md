# 方向 5 调研报告:评测/路由/成本决策类产品(2026-08 实查)

映射项目:**Triage Router**(三层级联策略工作台)+ **RAG Quality Lab**(manifest drift 对比)

---

## 1. OpenRouter — "路由就是产品"的生产级标杆

**(1) 核心回路**:进站 10 秒内看到 "The Unified Interface For Every Model" + 四个巨大的实时数字(200T+ 月 token、10M+ 用户、80+ providers、500+ 模型),然后点进 Models/Rankings 立刻能翻真实用量数据。每个模型行显示 token 用量("913M tokens")、分类排名("Programming #24")、价格、周环比涨跌。反馈是"你在看一个活的市场",不是文档。

**(2) 为什么像真产品**:
- **数据是排他性真实的**:Rankings 按"经 OpenRouter API 实际处理的 token 量"排名,页面明确写 "These rankings measure adoption, not quality",数据新鲜戳精确到日("through Aug 21, 2026"),方法论公开、CC BY 4.0 授权。诚实的口径本身就是产品可信度。
- **单模型页是运维仪表盘**:每个模型页有 Providers/Pricing/Performance/Uptime/Benchmarks/Apps/Activity 分区,P50 latency、throughput、过去 72h uptime 曲线(99.90% vs 99.96% 逐 provider 对比)、"哪些公开 App 给这个模型送流量最多"。
- **策略被压缩成一个后缀**:`model-slug:nitro`(按吞吐排序)、`:floor`(按价格排序),再往上才是 `sort: "price"`、`max_price`、`preferred_max_latency` p50/p99 分位阈值。**一个 token 长度的语法表达一整套路由策略**——这是对 Triage Router 最重要的启发。
- Benchmarks 页每个分数可点击,"Every score links to the configuration, costs, and telemetry"——分数不是孤立数字,是可追溯的记录。

**(3) 克制清单**:首页**没有** Pareto 散点图、没有雷达图、没有"智能评分";Rankings 明确拒绝声称衡量质量;图表把 top 10 以外全部折叠进 "Others";模型列表默认不展示 latency/throughput 列(点进详情页才有);Compare 页面用**预制的四个对比模板**(旗舰/最便宜/最擅长代码/推理)代替开放式配置器。它把"我有海量维度"克制成"你此刻只需要一个维度"。

**(4) 可偷模式**:
- **`:` 后缀语法**:Triage Router 策略工作台的当前策略用一行 mono 文本表达,如 `triage:cost-floor` / `triage:recall-first` / `triage:balanced`,拖滑块时这行文本实时变化并可复制(它同时就是 API 调用参数)。放在工作台标题栏右侧。零服务器,零字节增量。
- **诚实口径声明**:预计算网格旁一行小字"网格来自 N 条真实投诉工单的离线回放,非模拟数据"+ 数据日期戳。这是 OpenRouter "measure adoption, not quality" 的移植。零成本,信任增益极大。
- **分数可追溯**:网格中每个 cost/accuracy 数字可点开一条抽屉,显示该配置下的 3 条真实样例(哪条被 TF-IDF 拦下、哪条升到 Claude)。预计算 JSON 一并打包,~50-200KB,静态文件即可,无需服务器。

---

## 2. Artificial Analysis — cost-quality frontier 可视化的行业标准

**(1) 核心回路**:首屏即主图 "Intelligence Index vs Cost per Task" 散点,带 **Pareto line** 和"最优象限"标注。10 秒内用户已经在读一张有明确读法的决策图。

**(2) 为什么像真产品**:轴定义极其具体("Weighted average cost (USD) per Intelligence Index task",v4.1.1 版本号、9 个 eval 组成、95% 置信区间);**616 个模型只默认显示 29 个(约 5%)**,用户可 "Add model from specific provider" 自行加;点任意模型名跳专属详情页。它是"报告"体裁做到极致后长成了产品——靠版本化方法论 + 可自定义视图。

**(3) 克制清单**:默认只画 5% 的模型——**克制的核心手段是默认集策展,而不是删功能**;每张图只回答一个问题(intelligence×cost、intelligence×speed、tokens per task 各自独立成图,绝不三维混一张);不做综合排名总分表压首屏。

**(4) 可偷模式**:
- **Pareto line + 最优象限标注**:Triage Router 的 cost-accuracy 图直接画出 frontier 发丝线,拖 misroute cost 滑块时 frontier 上的"当前最优点"沿线滑动并高亮——静态 Pareto 图变成动态决策图的最小改法。前端纯计算,零服务器。
- **置信区间**:预计算网格的 accuracy 值带 ±CI(bootstrap 一次离线算好写进 JSON),图上画细须线。诚实感 >> 精确感。增量 <10KB。
- **默认三选一,展开才见全网格**:默认只显示三个命名策略点(见 §6 业务映射),"查看完整 800 点网格"是折叠项。

---

## 3. Braintrust — eval 对比视图的工程标杆

**(1) 核心回路**:选两个 experiment → 表头出现 **Comparison grade:Improvement / Regression / Tradeoff / Tie** 四值判词 → 每行出现 score delta 列,绿=改进红=退步 → 点列头一键"只看 regressions"。

**(2) 为什么像真产品**:experiment 是 "immutable, comparable record"(不可变、可比较的记录);**Diff 是一个模式开关**而非另一个页面——开启后每个 test case 展开为逐 experiment 子行,支持三种 diff 方向(Base→Comparison / Comparison→Base / Expected→Output);能对"数 MB 的 JSON"做并排 diff;"Order by regressions" 把受影响最重的 case 顶到最上面。

**(3) 克制清单**:**Summary 布局默认隐藏所有单条 test case 行**——先给判词(四选一的 grade),要细节自己切到 List/Grid;diff 模式下主动禁用 Timeline/Thread 等花哨视图;最佳/最差只用单元格高亮,不用图表。**先给结论、按需下钻、diff 时砍掉一切无关视图**——这三条就是站主要的"克制"配方。

**(4) 可偷模式**(主要给 RAG Quality Lab manifest drift):
- **四值判词**:两个 manifest 对比的第一输出是一个 mono 大字标签 `IMPROVEMENT / REGRESSION / TRADEOFF / TIE`(朱砂/墨蓝二色即可),放对比区顶部。其下才是分项 delta。零服务器,预计算。
- **"只看退步的"过滤器**:drift 明细表列头可点,一键过滤到 regression 行,并默认按退步幅度排序。前端逻辑,零成本。
- **Diff 是开关不是页面**:同一张表,toggle 后每行裂成两个 manifest 的子行。避免"再做一个对比页"导致要素翻倍。

---

## 4. LangSmith / W&B Weave — 补充确认(同一范式)

LangSmith comparison view:红/绿高亮 regress/improve 的 run,**每个 feedback 列头显示"多少条变好/多少条变坏"的计数,且计数本身可点击变成过滤器**;>2 个 experiment 时一次只显示两个,用 header 切换基准(拒绝三列并排的诱惑);JSON 输出可开 diff 模式。W&B Weave:evals 聚合成 leaderboard,Playground 支持"拿生产 trace 回放测新模型"。Humanloop 已于 2025-09-08 关停(Anthropic acqui-hire),从调研对象移除。

**可偷**:drift 对比每个指标列头写 `↑12 ↓3` 微型计数,点击即过滤——比画柱状图省 90% 的墨水,信息一样多。

---

## 5. Hugging Face Leaderboard / Vellum — 一正一反两个教训

**HF Open LLM Leaderboard 已于 2025 归档**成静态快照(算力成本 + benchmark 饱和)。它活着时的交互遗产:一个大表 + 列开关 + 精度/官方来源过滤器 + 搜索。教训一:**纯表格 + 过滤器的"leaderboard 体裁"生命周期有限**,没有决策语义的数据陈列会自然死亡。

**Vellum 的 LLM Leaderboard 页**(其获客工具)实查结论:完全静态,多个分区表格,无过滤无滑块无散点,"comparisons require manual cross-referencing between tables"——它读起来是 reference document,不是产品。教训二:**这正是站主要逃离的形态**:数据真实但用户无事可做。反过来验证:Triage Router 首屏给用户一个"可拖的问题"而非"可读的表",方向正确。

---

## 6. 核心问题一:cost-quality 权衡怎么做成"可拖的决策界面"

综合 Unify(YC,三滑块 quality/cost/latency 直接是路由器配置界面)、RouteLLM(LMSYS,单一 threshold α:调高偏便宜、调低偏质量,0.5 起步)、Martian(savings calculator:输入用户数/token 量/权衡偏好 → 输出省多少钱;公司 2026 已转向 interpretability,产品形态仍是好参照)、Not Diamond(pay-as-you-go $0.05/M tokens routed,"10–100ms 出路由决策"):

**行业收敛出的答案是:滑块不是图表的过滤器,滑块是策略本身。**
- Unify 证明三个滑块就能表达完整路由策略——但对个人作品集,**一个滑块(misroute cost)+ 一个次滑块(置信度阈值)已是上限**,第三个就"很乱"。
- RouteLLM 证明单参数 α 有完整学术背书——Triage Router 页面可注一行 "cascade threshold, cf. RouteLLM (Ong et al., 2024)",学术锚点低成本提升可信度。
- 关键交互差异:静态 Pareto 图是"看别人算好的",可拖界面是"输入我的业务参数,看我的最优点移动"。**用户输入的是业务量纲(一次错误分流成本多少元),输出的是策略量纲(阈值)+ 财务量纲(月成本)**,三个量纲之间的实时联动就是"产品感"的来源。

## 7. 核心问题二:"换阈值 = 换雇人策略"的业务映射呈现

标杆里最接近的是 Martian 的 savings calculator(业务输入→美元输出)和 OpenRouter 的 `:nitro`/`:floor` 命名(把参数空间的两个极端**起了人话名字**)。可落地为:

- **给策略点起雇佣语义的名字**:滑块下方不显示 "threshold=0.72",而显示当前策略卡片:`「宁可错杀」— 34% 工单直达人工复核级,月成本 ¥X` / `「省钱优先」— 91% 工单止步于 TF-IDF,漏检率 Y%`。拖滑块时卡片文案整段切换(预计算网格里每个区间绑定一段文案)。这是把 RouteLLM 的 α 翻译成 HR 决策语言。放首屏滑块正下方,零服务器,文案 ~2KB。
- **等价人力换算行**:一行发丝线隔开的小字:"当前策略下 Claude 层月调用 ≈ ¥N,相当于 0.3 个客服专员工时"。一个乘法,零成本,但完成了工程参数到业务决策的最后一米。

## 8. 核心问题三:浏览器内真推理的先例 UX

有成熟先例,且 UX 范式已收敛(transformers.js v3 / whisper-web / WebLLM / Chrome Prompt API Playground):

- **范式一:显式的分级下载合同**。WebLLM 用 `initProgressCallback` 给出 progress(0-1)+ 人话状态文本 + 已耗时;下载后进 browser Cache API,**二次访问零下载**。whisper-web 同款。行业默认:先告知体积,用户点击才下载,进度条诚实,缓存声明明确。你的 82MB DistilBERT int8 方案完全在先例覆盖范围内(WebLLM 常规下载体量更大;100Mbps 下 82MB ≈ 10 秒内)。
- **范式二:推理时展示性能遥测**。WebLLM 显示 tokens/sec;Chrome Prompt API Playground(chrome.dev,Google 官方)整个界面只有:一个输入框、Prompt/Reset 两个按钮、session token 统计(已用/剩余/总量)、raw response 开关。**Google 自己给端侧 AI demo 定的调性就是极简**——这是站主克制美学的官方背书。
- **可偷模式**:(a) 加载按钮直接写体积和来源:`加载真实模型推理(82 MB,ONNX int8,下载后缓存于本机)`——mono 字体一行,不用 icon;(b) 加载后每次推理在结果旁标注 `本地推理 · 43ms · WebGPU`,与预计算网格模式的标注 `预计算 · 离线回放` 形成对照,**让"零字节模式"和"真推理模式"的边界本身成为展品**;(c) 参照 Chrome Playground,真推理区控件上限 = 一个输入框 + 一个按钮 + 一行遥测。全部静态托管(模型文件放 CDN/VPS,~82MB 一次性流量,阿里云新加坡带宽成本可忽略;或直接挂 HF Hub 免费)。

---

## 9. 若由一家顶级公司来做这个产品页(150 字想象)

首屏没有标题没有介绍,就是一张已经在动的图:一条 cost-accuracy frontier 发丝线,一个朱砂点停在上面,旁边一行 mono 字:「误分流成本 ¥40/单 → 当前策略:仅 9% 工单升至 LLM,月成本 ¥217」。你拖动那个 ¥40,点沿着线走,文案逐字重排,像行情终端而不是网页。右上角一个不起眼的开关:「用真模型验证这条线(82MB)」。打开后,你粘贴一条真实投诉,看它在三层之间被拦截、放行、升级,每一跳标着毫秒和成本。整页只有这一个问题、一条线、一个点。所有别的——架构图、README、benchmark 表——都在一根发丝线下方的折叠区里。**产品即论点:路由策略是一个可以用手指感受的商业决策。**

---

### 附:关键来源
- [OpenRouter](https://openrouter.ai/) / [Models](https://openrouter.ai/models) / [Rankings](https://openrouter.ai/rankings) / [Benchmarks](https://openrouter.ai/benchmarks) / [Provider Routing docs](https://openrouter.ai/docs/features/provider-routing)(`:nitro`/`:floor` 语法)
- [Artificial Analysis](https://artificialanalysis.ai/) / [Models 页](https://artificialanalysis.ai/models)(616 模型默认显示 29 个;Pareto line;CI 区间)
- [Braintrust Compare Experiments docs](https://www.braintrust.dev/docs/evaluate/compare-experiments)(Comparison grade 四值判词、diff 模式、Order by regressions)
- [LangSmith compare-experiment-results docs](https://docs.langchain.com/langsmith/compare-experiment-results)(红绿高亮、列头计数即过滤器)
- [W&B Weave](https://wandb.ai/site/weave)(leaderboard 聚合、生产 trace 回放)
- [Vellum LLM Leaderboard](https://www.vellum.ai/llm-leaderboard)(静态反例);[Humanloop 关停(HN)](https://news.ycombinator.com/item?id=44592216)、[Anthropic acqui-hire 报道](https://www.siliconrepublic.com/business/ai-acqui-hiring-spree-continues-with-anthropic-snapping-up-humanloop-team)
- [HF Open LLM Leaderboard 归档 collection](https://huggingface.co/collections/OpenEvals/archived-open-llm-leaderboard-2024-2025)
- 路由决策界面:[Unify YC launch](https://www.ycombinator.com/launches/L4t-unify-the-best-llm-on-every-prompt)(三滑块)、[RouteLLM README](https://github.com/lm-sys/RouteLLM/blob/main/README.md)(threshold α)、[Martian](https://work.withmartian.com/)、[Not Diamond](https://www.notdiamond.ai/)
- 浏览器内推理:[Transformers.js v3 博客](https://www.huggingface.co/blog/transformersjs-v3)、[whisper-web](https://github.com/xenova/whisper-web)、[WebLLM(web.dev 教程)](https://web.dev/articles/ai-chatbot-webllm)、[Chrome Prompt API Playground](https://chrome.dev/web-ai-demos/prompt-api-playground/)、[Chrome Built-in AI docs](https://developer.chrome.com/docs/ai/built-in)(Chrome 150 起正式转正,2026 底)
