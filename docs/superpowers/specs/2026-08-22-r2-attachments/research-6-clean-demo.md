调研数据齐了(Linear、Stripe docs、Vercel、ClickBench、DuckDB、Raycast、Arc/Dia、Family、Groq,均为 2026-08 实查;反面教材 AWS EC2 与 PostHog)。以下为最终报告。

---

# 方向 6 · 顶级产品页的"干净演示"设计模式(2026-08 实查)

调研方式:WebFetch 抓取 + 浏览器实际打开 docs.stripe.com/payments/quickstart 与 benchmark.clickhouse.com 逐屏核验(截图、accessibility tree、DOM 检查)。

## 一、逐标杆速写(四件事)

### 1. Linear(linear.app)
- **回路**:进站 10 秒 = 读一句话("The product development system for teams and agents")→ 看到产品本体截图(Inbox/Issues/Diffs,全灰阶)→ 唯一一种 CTA 样式("→" 文字箭头)。
- **像真产品的机制**:营销页里的每张图都是**真实 app UI + 真实数据**——真 issue 名、真代码 diff、真的 agent 对比图表(Cursor/Codex/No Agent 的 cycle time)。没有一张"示意插画"。
- **克制清单**:无 logo 墙、无 FAQ、无 pricing 预览、无信任徽章、无 newsletter、截图全部去色。彩色只留给极少数活动元素。
- **可偷**:① 全站图像灰阶化 + 朱砂只给"正在发生"的那一个元素(纯 CSS,0 字节成本);② 用 "→" mono 文字链替代一切按钮(契合无 icon 规则);③ demo 里的数据必须是真实 run 的产物,不用编造样例。

### 2. Stripe Docs Quickstart(浏览器实查,本方向核心标本)
- **回路**:进页 10 秒 = 页面顶部**只有两个下拉框**(Frontend: HTML/React;Backend: Ruby/Node/PHP/Python/Go/.NET/Java)→ 改任意一个,左侧分步 prose + 右侧代码面板(5 个文件 tab:server.rb / checkout.html / checkout.js / complete.html / complete.js)整页瞬时重构。**滚动阅读时右侧代码自动高亮对应行——滚动本身就是交互**。
- **像真产品的机制**:代码是完整可跑的(内嵌 test API key)、可整包 Download;"Preview" 折叠条里是真实渲染的 checkout 表单;选择状态写进 URL,可分享。
- **克制清单**:整页交互控件就是 2 个 combobox + 每块代码一个 copy 按钮。没有 run 按钮、没有内嵌 console、没有登录墙、代码面板除文件 tab 和 Download 外零 chrome。
- **可偷**:① 每个项目页顶部放两个 mono 下拉(如"模型: Qwen-7B / 场景: 工单路由"),切换即整段示例重构——纯前端字符串模板,0 服务器,几 KB;② prose-代码滚动同步(IntersectionObserver,纯前端);③ 每个 demo 旁给一条指向 VPS 真实 endpoint 的可复制 curl(服务器已有,边际成本 ≈0)。

### 3. Vercel(vercel.com)
- **回路**:一句话 hero("Agentic Infrastructure")+ 2 个 CTA;正文只有 3 个客户叙事段 + 1 个 "Recently shipped"。目前反而偏静态(无终端动画)。
- **像真产品的机制**:历史上最强的一招是 deploy 演示**终点是一个真的可点开的 URL**——演示的产出物是真工件。
- **克制清单**:首页无 pricing、无 docs 堆砌、无评价墙、无免费层话术,总共 4-5 节。
- **可偷**:每个动手演示必须以"可带走的真工件"收尾——一个真 URL、一条 curl、一个可下载 JSON trace。放在每台仪器右下角,mono 小字。

### 4. ClickBench(benchmark.clickhouse.com,浏览器实查)
- **回路**:进页 10 秒 = 顶部 pill 过滤器(Open source: Yes/No、Hardware: CPU/GPU、Tuned)→ 主表即时重排。**每行只有:系统名、run 日期、一根同色横条、一个数 "×1.82"**(相对最快者的倍数,基线 = ×1.00)。
- **像真产品的机制**:数据带日期戳(实查见 2026-08-15/2026-08-20 的 run)、首行就是 "Reproduce and Validate the Results" 链接、筛选状态进 URL 可分享、纯 HTML 无框架。42 条 query 的逐条热图矩阵放在主表**下方**——深度靠页面顺序披露,不靠控件。
- **克制清单**:零营销文案、零 logo、零绝对秒数干扰(主视图只有归一化倍数)、单色条形。反例内嵌:它的 100+ 系统 pill 墙本身就密——工具页可容忍,作品集不可。
- **可偷**:① benchmark 全部改成"×N 倍于基线"单指标 + 单色细条,基线行加重(静态 JSON,几十 KB);② 每个数字带 mono 日期戳;③ 每个数字旁一个 "reproduce →" 发丝线链接指向脚本。

### 5. DuckDB(duckdb.org)
- **回路**:一句话 + "Get DuckDB" → 首屏即多语言 tab 的 SQL 代码窗 → "Live demo" 文字链跳 shell.duckdb.org(WASM,整个数据库跑在浏览器里,零服务器)。
- **像真产品的机制**:安装命令几乎就是 hero;产品本体可在浏览器直接用。
- **克制清单**:无 hero 大图、无动画、无 pricing、无 testimonial,六个形容词(Simple/Fast/Free/Portable…)平铺完设计立场。
- **可偷**:① 能 WASM 化的演示坚决 WASM 化(tokenizer、路由策略模拟、BM25 检索)= ¥0/月、离线可用、无冷启动;② "Live demo" 做成发丝线文字链,不做大按钮。

### 6. Raycast(raycast.com)
- **回路**:一句话("Your shortcut to everything")+ Download;下方一整块键盘可视化作为隐喻。
- **机制/克制**:产品自己的命令条被搬上网页;但全页 7-10 节,属中等克制,不是最严标杆。
- **可偷**:站点本身响应键盘——按 "/" 聚焦演示输入框,kbd 提示用 mono 方框字符(纯前端,契合"招聘者是工程师"的受众)。

### 7. Arc / The Browser Company + Dia(2025-26 公认干净新页)
- **Dia 回路**:一句话 hero("A browser you won't dread opening")+ 1 个 Download + 1 个视频链接,全页仅 5 节,**零 social proof**,价格流放到 /plans 子页。
- **Arc 的诚实设计**:页面顶部明示 "Arc receives Chromium updates only… download Dia instead"——公开维护状态本身成为产品感。
- **可偷**:① 每个项目挂 mono 状态标签(`active` / `maintained` / `archived`),放项目卡右上角,0 成本;② 次要信息一律流放子页,首页不做"以防万一"的展示。

### 8. Groq Chat / Perplexity 模式(实查截图证实)
- **回路**:**界面即首页**——整页就是一个输入框,placeholder 兼任营销文案("Why fast AI inference matters"),公司链接全部沉底。零 section。
- **可偷(全组最高价值)**:主支柱(AI Agent)的项目页首屏直接放一个真的 agent 输入框:一行 mono input + 3 条预设问题(点击即发)+ 流式回答。需要服务器(VPS 转发 Modal/API),用预设问题 + 限流控成本,单次调用 ≈几分钱,月预算 ≤¥20 可控。

## 二、横切结论

### (1) 内嵌 demo 的"最小完整要素集"
四件必需品:**一个输入**(一个框或一个选择器,首屏二选一,不并存)、**一个动作**(或零个——Stripe 证明滚动/选择本身可以就是动作)、**一个结果区**(空态即展示结果的形状/schema,载入时已预填一次完成的运行)、**一行状态**(mono 单行:延迟 · 日期 · 版本)。
**可以全删的**:仪器内部标题、icon、次要按钮、图例(单位并进表头)、实心边框(发丝线够了)、tooltip、清除/重置按钮(重跑即覆盖)、spinner 和进度条(状态行一句话代替)、默认展开的日志/console、超过一个维度的 tab 组。

### (2) "一次只让你做一件事"的机制
- **默认全选好**:首帧渲染时演示已经"跑完一次"(Stripe 进页代码已生成;绝不给空白仪器)。
- **单一主操作**:同屏只有一个元素在邀请点击(Dia 全页一个 Download)。
- **深度靠位置披露,不靠控件**:细节放主表下方(ClickBench 热图)、折叠条(Stripe Preview)、子页(Dia /plans)——而不是加 tab、加开关。
- **预设胜过自由输入**:可点击的整句预设问题,取代空白 textbox(Groq placeholder 兼营销)。
- **滚动即交互**:让阅读行为本身驱动演示(Stripe 滚动同步高亮)。

### (3) 密集数据不乱的排版机制(映射到本站编辑风)
- **单指标归一化**:一台仪器只报一个数,其余化为 "×N";数字右对齐、mono、基线行加重(ClickBench)。
- **对齐产生秩序,不是盒子**:只用发丝线做行分隔,零单元格边框、零斑马纹、零圆角——密度感来自网格对齐。
- **仪器内只许两级字号**:大 mono 数值 + 小 mono 大写标签;叙述文字留在仪器外面。
- **色彩只指认状态**:全体灰阶/墨蓝,朱砂唯独给"正在变化的那一个元素"(Linear 的灰阶截图哲学)。
- **mono 日期戳替代可信度文案**:角落一枚 `2026-08-20` 比一段"我们持续更新"更有产品感。

### (4) 反面教材(实查计数)
- **AWS EC2 页**:8 项主导航 + 6 个页内 tab + 约 12 组卡片链接 + 40+ footer 链接 + 6-8 种互相打架的字体样式;一个"计算"产品页上**没有任何东西可以算**——全部是通往别处的门,没有一件仪器。乱的本质:每个元素都在导流,没有元素在演示。
- **PostHog 首页**:14 项导航 + **23 个产品卡**平铺 + 玩笑彩蛋(nav 里有 "Trash")。作为品牌反叛是自洽的,但认知负载极高——放在个人作品集上等于自杀:访客记不住 23 件事,只会记住"乱"。

## 三、仪器设计十诫(可直接入 spec)

1. **首屏只许一个元素邀请点击。** ——Dia:一句话 + 一个 Download,全页 5 节。
2. **仪器载入即已完成一次演示;空状态是被禁止的。** ——Stripe quickstart:进页时代码已按默认选项生成完毕。
3. **输入只留一个维度,其余一切预选。** ——Stripe:整页只有 Frontend/Backend 两个下拉,却驱动 5 个文件重构。
4. **每次演示以可带走的真工件收尾:URL、curl 或下载。** ——Vercel deploy 演示终点是真 URL;Stripe 给整包 Download example。
5. **一台仪器只报一个数,其余归一化为它的倍数。** ——ClickBench:全表只有 "×N.NN",基线 ×1.00。
6. **状态用一行 mono 说完(延迟·日期·版本),不用 spinner 不用进度条。** ——ClickBench 每条 run 自带日期戳。
7. **深度往页面下方和子页流放,不往控件里塞。** ——ClickBench 把 42-query 热图放主表之下;Dia 把价格逐出首页。
8. **朱砂只给正在发生的那一个元素,其余一律墨阶。** ——Linear:全站灰阶截图,彩色仅存于活动状态。
9. **能让访客直接用产品,就不许放产品的截图。** ——Groq/Perplexity 输入框即首页;DuckDB 用 WASM shell 把数据库放进浏览器。
10. **每个数字旁边给出复现它的路径;诚实是最高级的产品感。** ——ClickBench 把 "Reproduce and Validate" 置于首行;Arc 公开自己已停止功能开发。

## 四、150 字想象:顶级公司来做这个作品集产品页

首屏没有自我介绍,只有一台仪器:米纸底上一行 mono 输入框,预填一个招聘者会问的问题——"这个网关如何路由一次 7B 推理请求"。回车,回答流式吐出,右侧发丝线时序图同步点亮每一跳:gateway 判定、Modal 冷启动 380ms、tokens/s,全部真数、带今日日期戳。每个数字可点,跳到产生它的那一行代码。答案末尾一条可复制的 curl——招聘者十秒内拿走一次真实推理和一个真实 endpoint。往下滚,才是一张 ×N 归一化的 benchmark 细表和三行项目索引。没有头像,没有形容词,朱砂只出现在正在生成的那一个 token 上。整站在证明一件事:作者不是在描述系统,系统正在运行。

---

Sources:
- [Linear](https://linear.app) · [Stripe Docs Quickstart](https://docs.stripe.com/payments/quickstart)(浏览器实查) · [Vercel](https://vercel.com) · [ClickBench](https://benchmark.clickhouse.com)(浏览器实查) · [ClickHouse](https://clickhouse.com) · [DuckDB](https://duckdb.org) · [Raycast](https://www.raycast.com) · [Dia](https://www.diabrowser.com) · [Arc](https://arc.net) · [Family](https://family.co) · [PostHog](https://posthog.com) · [AWS EC2](https://aws.amazon.com/ec2/) · [Groq Chat](https://chat.groq.com)(截图实查)
- 检索背景:[Landing page examples 2026 (line25)](https://line25.com/articles/best-landing-page-design-examples-2026/) · [Minimalist landing pages (landdding)](https://landdding.com/blog/minimal-landing-page-design-examples) · [Zoho landing page examples](https://www.zoho.com/landingpage/bootcamp/landing-page-examples.html)
