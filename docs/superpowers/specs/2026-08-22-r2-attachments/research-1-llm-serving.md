调研完成。以下是完整报告。

---

# LLM 模型/推理服务类产品标杆调研(方向 1,2026-08 实测)

**调研方法**:浏览器实机操作 chat.groq.com、huggingface.co 模型页、replicate.com 模型页、chat.webllm.ai;WebFetch 抓取 groq.com、ollama.com、fireworks.ai、together.ai、openrouter.ai、OpenAI/Anthropic 模型文档页;搜索补证 Groq console 与 llama.cpp 新 WebUI。

## 总体格局(先说结论)

2026 年 8 月的重要变化:**免登录真推理正在业界消失**。实测 chat.groq.com 输入即弹 Google 登录墙;HF Inference Widget 匿名基本不可用;Together/Fireworks 首页连 playground 入口都没有,全部导向注册;Replicate 点 Run 也要登录。**"访客 0 门槛打到一个真模型"这件事,今天没有一家大厂在做**——这对 frontier-forge 页面是结构性差异化机会,不是模仿题。

---

## 1. Groq(chat.groq.com 实测 + console 补证)

**(1) 核心回路**:进入即一个居中输入框(placeholder "Try it")+ 下方 **3 个预设问题 chip**("Why fast AI inference matters" 等)。10 秒内动作 = 点一个 chip。反馈 = 极快的 token 流本身;console playground 里每次生成结束后显示**耗时 + tokens/s 读数**(免费层实测量级 300–800 tok/s)。
**(2) 像真产品的机制**:速度不是"宣称"而是"被体验"——token 流快到肉眼可感,结束后的 tok/s 数字只是给体感盖章。另有 "Total Requests" 累计计数(真实使用量可见)。
**(3) 克制清单(最重要)**:无模型选择器、无温度/参数面板、无 benchmark 表、无营销图、无 icon 堆砌;首页导航仅 4 项;预设问题只有 3 个;页脚一行 "Powered by the Groq LPU" + 一行免责声明。整页元素数 < 10。**速度可视化甚至不用图表——流本身就是图表**。
**(4) 可偷**:
- **3 chip 上限**:frontier-forge 试用区预设投诉样例**只放 3 条**(如"物流破损/退款拖延/客服态度"各一条真实脱敏样本),点击即填入即发送。位置:项目页试用区首屏。无需额外服务端。<1KB。
- **完成后单行读数**:回答下方一行 mono 小字 `2.1s · 47 tok · 22 tok/s · CPU`。数据来自网关本来就有的计时。0 成本。
- **Total Requests 累计计数**:页脚一个真实数字"上线以来已处理 N 次分流",网关计数器,一个整数的持久化。

## 2. Replicate(实测,本方向最高价值标杆)

**(1) 核心回路**:模型页 = Playground 本身。首屏:模型名 + 一句话定位 + **`Warm` 状态徽章** + **`421M runs` 计数** + Playground/API/Examples/README 四个 tab。关键:**页面加载时输出区已经预填了一条完成的真实推理**——默认 prompt 是一个俏皮问题,输出下方带真实指标:`Generated in 1.7s · Input tokens 39 · Output tokens 140 · 92.80 tokens/s · TTFT 61ms`,还有 "Show logs / View full prediction / Tweak it"。10 秒内访客不用点任何东西就已经"看到了一次真运行"。
**(2) 像真产品的机制**:①**状态可见**(Warm/Cold 徽章把冷启动变成产品语言而非事故);②**证据先于交互**(预填真实输入输出+指标,Run 之前信任已建立);③输入表单由 schema 驱动,**Form/JSON/Node.js/Python/HTTP 五视图切换同一请求**——"你在网页上填的就是 API 本体";④定价翻译成人话("$0.25/M output tokens——**or 4,000,000 tokens for $1**")。
**(3) 克制清单**:无 benchmark 对比表、无竞品对比、无客户 logo、无教程视频;参数全部折叠成朴素表单行(每行=名称+类型+一句说明+默认值);README 放最后一个 tab。
**(4) 可偷**(全部高度适配 release.json 架构):
- **预填已完成推理**:Evidence Explorer 顶部,页面加载即显示一条来自 release.json 的真实分流记录(输入投诉原文 → JSON 输出 → 四项指标)。纯静态,~2KB,这是**整个改版最划算的一条**。
- **Warm/Cold 徽章**:试用区右上角 mono 标签:`CPU · 常驻` / `GPU · 冷 (唤醒约 30s)`。VPS 网关加一个 `/status`,轮询或 SSE,<1KB/次。
- **五视图切换**:试用表单旁给 `cURL / Python / 原始 JSON` 三个 tab,展示访客即将发出的真实请求——招聘者可以复制到自己终端打你的网关。纯前端。
- **人话定价**:规格表里写"单次分流成本 ≈ ¥0.000X(Modal 计费口径)"。

## 3. Hugging Face 模型页(Qwen3-4B-Instruct-2507 实测)

**(1) 核心回路**:左 = model card 正文;右栏才是"产品":`Downloads last month 3,271,514` **带 sparkline 折线**、参数徽章(`4B params · BF16 · Chat template`)、Inference Providers widget(输入框 + Examples 下拉 + Send + View Code Snippets + Compare providers)、Model tree(5708 adapters/1940 finetunes/290 quantizations)、外链 leaderboard 的 Eval Results(GPQA 62 / MMLU-Pro 69.6)。
**(2) 像真产品的机制**:右栏全是**活数据**——下载量、衍生模型数、Spaces 引用数,每个数字都是别人真实使用的痕迹;eval 分数链接到第三方 leaderboard 而非自报。
**(3) 克制清单**:右栏每个组件只给一个数字+一条线;widget 默认空态只有一句 placeholder;不展示负面讨论,但也**不写任何形容词**——右栏没有一句营销话。
**(4) 可偷**:
- **"活数据右栏"**:项目页侧栏(或规格表)全部用可验证数字:params/量化/上下文/训练 tokens/eval 分数,eval 分数**链接到 release.json 里可下载的原始评测输出**(对应 HF 链接外部 leaderboard 的诚实机制)。静态。
- **sparkline**:如果网关有按日请求数,页脚计数旁加一条 20×100px 的 SVG 折线,数据 <0.5KB。没有流量就不要放(空折线比没有更糟)。

## 4. OpenAI 模型页 + Playground / Anthropic 模型页(文档实测)

**(1) 核心回路**:纯查规格。OpenAI gpt-5.2 页顶部一句话定位("Previous frontier model for professional work with configurable reasoning effort"),往下:定价表、endpoint 支持矩阵(✓/✗)、context 400K/输出 128K/cutoff 列表、snapshot 仅一行 `gpt-5.2-2025-12-11`。Playground(登录后)= 左预设/上 Presets 工具栏/右参数滑块。
**(2) 像真产品的机制**:model card 的产品感来自**支持矩阵的✓/✗**——敢明确说"不支持什么"。Anthropic 的诚实机制更细:**Comparative latency 用词不用数**(Slower/Moderate/Fast/Fastest),**双 cutoff**(reliable knowledge cutoff ≠ training data cutoff),context 悬停换算成"≈555k words"。
**(3) 克制清单**:两家模型页**零 benchmark、零营销文案、零案例**;快照即 ID,一行完事。
**(4) 可偷**:
- **能力支持矩阵**:frontier-forge 规格区一张 ✓/✗ 表:结构化输出✓ / 多轮✗ / 英文✗ / 超长投诉(>2K tok)✗……**✗ 的行数应当不少于 ✓**。静态。
- **相对词 + 悬停换算**:延迟栏写 `CPU: 慢(~4 tok/s,一条结果约 8s)/ GPU: 快(~90 tok/s)`——词给判断,括号给证据。
- **snapshot 一行制**:`ff-qwen3.5-4b-20260815 · release.json sha256:a3f2…`,模型版本即证据版本。

## 5. Ollama(模型页 + 安装 UX)

**(1) 核心回路**:`ollama run qwen3` 一行命令是整个产品的中心;模型页 = 简介 + 58 个变体的表格(每行:tag / 2.5GB / 256K context / 更新时间)+ CLI/cURL/Python/JS 四种可复制调用。真实数据:35M Downloads、更新时间戳。
**(2) 像真产品的机制**:**把"拥有模型"的动作压缩到一行命令**;变体表用磁盘体积(2.5GB)这种可触摸单位而非抽象参数。
**(3) 克制清单**:模型页无 benchmark 表、无图表、无截图;变体差异只用 4 个字段表达。
**(4) 可偷**:
- **一行命令区块**:项目页给 `curl -s https://api.xiangguozhang.com/v1/triage -d '{"text":"..."}'` 带复制按钮,下面标注"这是驱动上方试用区的同一个端点"。网关本来就有,0 增量。
- **变体表**:如果发布了 GGUF/AWQ 多个量化,一张四列表:量化 / 体积 / 显存 / 相对精度损失(用 release.json 里的实测数)。

## 6. WebLLM / llama.cpp 生态(chat.webllm.ai 实测 + tokenspeed)

**(1) 核心回路**:WebLLM Chat 进入即完整聊天 UI,首条消息触发模型下载,**下载/编译进度以分阶段文字流式显示在聊天气泡位置**(拉取参数分片 [i/n]、已下载 MB、百分比、耗时;然后 GPU shader 编译;然后才出 token),完成后每条回复带 prefill/decode 分开的 tok/s。llama.cpp 2025 年重写的 Svelte WebUI 同样极简:纯聊天 + IndexedDB 持久化。另一个小而美:**tokenspeed**(纯前端)——拖滑块选 tok/s,看同一段文本以该速度"流出来",让人**体感**5 与 800 tok/s 的区别,还能模拟 TTFT。
**(2) 像真产品的机制**:WebLLM 把最痛的等待(几百 MB 下载)**变成了叙事**——你始终知道它在第几步、还差多少;tokenspeed 证明"模拟流式回放"零成本也能给人真实体感。
**(3) 克制清单**:进度不用花哨动画,就是文字+百分比;tokenspeed 整页只有滑块+文本流+两个可选项。
**(4) 可偷 → 这就是"唤醒 GPU"的标准答案**,见下节。

## 7. 其余快评

- **Fireworks/Together**:首页全是企业叙事("TSMC of AI Factories"、Jensen Huang 背书),无公开试用;模型卡只有 价格/context/类型 三要素。反面教材:**它们的"产品感"藏在登录墙后,公开页面反而像 PPT**——站主要做的恰是把产品感放在墙外。
- **OpenRouter**:模型页含 Activity 区(该模型的真实 token 流量随时间曲线)+ providers 对比。"**平台自身的使用量曲线作为公开信任信号**"值得记住,但个人站流量小,慎用。

---

# 三个重点问题的综合答案

## A. "让访客试一个模型"的最佳形态

各家收敛出的共识排序:**预设任务 > 自由输入**。访客(招聘者)不知道该输什么,自由输入框是给他出题;Groq 给 3 个 chip,Replicate 直接预填,OpenAI Playground 有 Presets 工具栏。最佳组合拳(全部有实测标杆背书):
1. **加载即见一条已完成的真实推理**(Replicate)——0 交互就有证据;
2. **3 条真实投诉样例 chip**(Groq)——1 次点击就有第 2 条证据;
3. **自由输入框放在 chip 之后**,允许招聘者输入自己编的投诉刁难模型;
4. **token 流本身就是速度可视化**,不要额外做速度动画;结束后**一行** mono 读数:`时延 · tokens · tok/s · 当前算力(CPU/GPU)`(Groq console + Replicate 四指标,但压到一行);
5. 输入框旁给 **cURL tab**(Ollama/Replicate)证明"网页 == API"。
参数面板(温度/top_p)一律不放——所有克制型标杆都藏掉了它。

## B. "唤醒 GPU"的等待体验

Spinner 之所以廉价,是因为它隐瞒进度;标杆给出三层解法:
1. **状态前置**(Replicate `Warm` 徽章):在访客点击**之前**就用 mono 标签写明 `GPU 睡眠中 · 唤醒约 30s / CPU 常驻 · 即刻可用`,把选择权给访客("CPU 立即试"为默认,"叫醒 GPU"为一个显式按钮);
2. **阶段化叙事**(WebLLM):等待期显示真实阶段而非转圈——`容器调度 → 拉取权重 (2.3GB) → 引擎预热 → 首 token`,每阶段带实际耗时,由网关转发 Modal 事件为 SSE,几百字节;
3. **等待期回放**(tokenspeed 模式):GPU 唤醒的 30s 里,在输出区以**真实记录的速度**回放一条历史 GPU 推理,明确标注 `回放 · 2026-08-15 真实记录`,唤醒完成后无缝切到活推理。纯前端 + release.json trace,~5KB。
等待结束后读数里保留一行 `冷启动 28.4s`——不隐瞒冷启动本身,是这个页面最"系统工程师"的诚实。

## C. 模型能力边界的诚实展示

商业产品页的通用做法:OpenAI 的 ✓/✗ 支持矩阵、Anthropic 的相对延迟词 + 双 cutoff、HF 的外链第三方 eval。但**没有任何一家敢展示失败样例**——这是全行业的空白,也是个人作品集独有的特权:
1. ✓/✗ 能力矩阵,✗ 占半数以上;
2. eval 数字全部可点击下钻到 release.json 原始输出(HF 外链机制的自托管版);
3. **"已知失败"区**:从评测集里挑 2–3 条真实分错的投诉,并排展示 模型输出 vs 正确标签 + 一句归因("讽刺语气的表扬信会被分为投诉")——招聘者看到的不是完美模型,而是**知道自己模型哪里会断的工程师**。静态,~3KB,这可能是整个页面最反直觉却最高回报的组件。

---

# 若由一家顶级公司来做 frontier-forge 的产品页(150 字想象)

它不会做"项目介绍页",它会做一张**发布控制台(release console)**:URL 打开即一条刚完成的真实推理躺在屏幕中央,输入、JSON 输出、22 tok/s、CPU 徽章,全部可核验;下方一条发布轨迹——数据、训练、评测、部署,每个节点是一个指向 release.json 的哈希,而非一段自述。没有"项目亮点",没有架构图轮播;唯一的大字是模型 snapshot ID。试用不是功能,是页面的**呼吸**:你每停留十秒,它就用一次真实请求向你证明自己还活着。整页像 Stripe 的 API 文档嫁给了 Braun 的计算器:灰纸、墨字、一个会说真话的数字。

---

**落地成本核对**(全部在 ≤¥100/月 内):预填推理/失败区/能力矩阵/五视图 = 纯静态(release.json,几十 KB);单行读数/累计计数/cURL 端点 = 现有 C++ 网关免费送;`/status` + SSE 唤醒叙事 = VPS 上 <100 行代码;GPU 活推理 = Modal serverless 按秒计费 ≈¥0;唯一要新做的防线是匿名限额(如 5 次/日/IP,token bucket),这恰好也是 2026 年各家全部登录墙化之后,"免登录但限量"成为差异化的原因。

Sources: [Groq Chat](https://chat.groq.com) · [Groq console playground](https://console.groq.com/playground) · [DataCamp Groq LPU tutorial](https://www.datacamp.com/tutorial/groq-lpu-inference) · [Groq free tier 2026](https://toolfreebie.com/groq-fastest-free-ai-api/) · [HF Qwen3-4B-Instruct-2507](https://huggingface.co/Qwen/Qwen3-4B-Instruct-2507) · [Replicate meta-llama-3-8b-instruct](https://replicate.com/meta/meta-llama-3-8b-instruct) · [Ollama qwen3](https://ollama.com/library/qwen3) · [OpenAI gpt-5.2 model page](https://developers.openai.com/api/docs/models/gpt-5.2) · [Anthropic models overview](https://platform.claude.com/docs/en/about-claude/models/overview) · [OpenRouter qwen3-4b](https://openrouter.ai/qwen/qwen3-4b) · [WebLLM Chat](https://chat.webllm.ai) · [web-llm-chat repo](https://github.com/mlc-ai/web-llm-chat) · [llama.cpp llama-ui guide](https://github.com/ggml-org/llama.cpp/discussions/16938) · [tokenspeed](https://mikeveerman.github.io/tokenspeed/) · [PromptLayer OpenAI Playground guide](https://blog.promptlayer.com/openai-api-playground/) · [KodeKloud OpenAI Playground notes](https://notes.kodekloud.com/docs/Mastering-Generative-AI-with-OpenAI/Getting-Started-with-OpenAI/OpenAI-Playground/page) · [Fireworks AI](https://fireworks.ai) · [Together AI](https://www.together.ai)
