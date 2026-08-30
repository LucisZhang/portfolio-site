All research is done. Here's the final report in Chinese.

---

# 4B 微调模型「真推理」低成本部署调研(2026-08-22)

## 一、直接回答:HF 能不能免费/接近免费帮你跑?

**分三条说,别混在一起:**

1. **HF 免费 Inference API / Inference Providers:不行,明确不行。** 2025 年 7 月起旧版 serverless Inference API 改组为 Inference Providers,只服务各 provider 挑选的目录模型;`hf-inference` 自己只保留 CPU 推理(BERT/embedding 这类)。你随便上传的 Qwen3.5-4B 微调**不会被任何 provider 收录**,free tier 那 $0.10/月 credits 对你这个模型无处可花。([HF Inference Providers pricing 文档](https://huggingface.co/docs/inference-providers/en/pricing)、[hf-inference provider 文档](https://huggingface.co/docs/inference-providers/en/providers/hf-inference),2026-08-22 读取)
2. **HF Inference Endpoints(专用实例):能,但对你这个流量形态偏贵。** T4 $0.50/h、L4 $0.70–0.80/h,按分钟计费,支持 scale-to-zero(空闲 15 分钟后缩到 0;唤醒期间请求直接返回 502,需要自己在 VPS 侧做重试队列;冷启动时长官方只说"取决于模型大小",4B 实测口径一般 2–5 分钟)。坑在于**每次唤醒至少烧一个 15 分钟空闲窗**:30 请求/天若聚成 3–5 波,约 $13–32/月(¥95–230);若访客零散、每次都单独唤醒,理论上限可到 $100+/月,**会击穿你 ¥250 的天花板**。([Endpoints pricing](https://huggingface.co/docs/inference-endpoints/pricing)、[autoscaling 文档](https://huggingface.co/docs/inference-endpoints/en/autoscaling))
3. **变通方案 HF PRO + ZeroGPU Space:这是 HF 系里唯一"接近免费"的路。** $9/月固定(≈¥65),PRO 每天 40 分钟 GPU 配额(现在分配的是半张 RTX Pro 6000 Blackwell 48GB),你 30 请求/天 × ~20s ≈ 10 分钟/天,配额绰绰有余;Space 暴露 Gradio API,VPS 用 `gradio_client` + 你自己的 PRO token 调用即可。代价:仅限 Gradio SDK、Space 睡眠后首次唤醒 1–3 分钟、论坛有 PRO 配额经 API 计量出 bug 的历史帖、且 ZeroGPU 定位是 demo——给个人作品集当后端量级没问题,但没有 SLA,不适合宣称"生产级"。([ZeroGPU 文档](https://huggingface.co/docs/hub/en/spaces-zerogpu)、[HF pricing](https://huggingface.co/pricing)、[论坛 quota 问题帖](https://discuss.huggingface.co/t/incapable-to-use-zero-gpu-resource-via-hugging-face-pro-quota-with-gradio-api/132840))

**一句话:HF 免费档 = 不行;HF 花钱档 = 能但性价比一般;HF 最划算的姿势是 $9 PRO + ZeroGPU Space 曲线救国。**

## 二、对比表(30 req/day、~500 output tokens、4B int4)

| 平台 | 支持自定义 4B 微调? | 计费模式 | 本负载月成本(实测口径估算) | Scale-to-zero / 冷启动 | CN/HK VPS 可达性 | 运维负担 | 主要坑 |
|---|---|---|---|---|---|---|---|
| **Modal** | ✅(任意容器,vLLM/llama.cpp 均可) | 按秒:T4 $0.000164/s、L4 $0.000222/s + CPU/内存,**每月送 $30 credits** | **≈ ¥0**(实际用量约 $5–20,免费额度全覆盖) | ✅ 原生;有 GPU memory snapshot,小模型冷启动可压到 5–20s,不优化约 1–2 分钟 | modal.run 域名从 HK/海外 VPS 无障碍;大陆 VPS 一般可达但建议实测 | 低-中(写 Python 部署脚本,一次性) | credits 政策标注 "subject to change";冷启动优化要自己配 snapshot |
| **HF Inference Endpoints** | ✅ | 按分钟,T4 $0.50/h、L4 $0.70/h | ¥95–230(请求聚簇时);零散访问可爆到 ¥700+ | ✅ 空闲 15min 缩 0;唤醒 2–5min,期间返回 502 | huggingface.cloud 域名,大陆 VPS 大概率被墙,需 HK/海外 VPS | 低(全托管) | 每次唤醒必烧 15min 空闲窗;T4 无 bf16、GPTQ Marlin kernel 要 Ampere+,建议选 L4 或 GGUF |
| **HF PRO + ZeroGPU Space** | ✅(Gradio app 里自己加载) | $9/月 包 40 min GPU/天,超出 $1/10min | **≈ ¥65 固定** | Space 睡眠后唤醒 1–3min;醒着时按请求秒级挂 GPU | *.hf.space 大陆被墙,需 HK/海外 VPS | 低 | 仅 Gradio SDK;demo 定位无 SLA;API 计量偶有 bug |
| **RunPod Serverless** | ✅ | 按秒,flex worker 16GB $0.58/h、24GB(L4/A5000/3090)$0.69/h、4090 $1.10/h;网盘 $0.07/GB/月 | **≈ ¥25–60**(无免费额度) | ✅ min worker 0;FlashBoot 缓存命中时冷启动 <1–10s,未命中拉镜像 1–3min | api.runpod.ai 从 HK/海外 VPS 正常;大陆一般可达 | 中(打 Docker 镜像) | 低频用户 FlashBoot 缓存易失效,冷启动波动大;默认 idle timeout 5s 很省钱 |
| **Replicate(私有模型)** | ✅(Cog 打包) | 按秒 T4 $0.000225/s、L40S $0.000975/s;**私有模型 boot+idle+active 全计费** | ≈ ¥70–290 | ✅ deployments 可缩 0;冷启动 1–3min 且计费 | 海外 VPS 正常 | 中 | 私有模型连启动时间都收钱,是同类里最贵的姿势;2026 被 Cloudflare 收购,定价走向待观察 |
| **DeepInfra 自定义部署** | ✅ 但仅 dedicated | A100 $0.89/h 起,按分钟,无 scale-to-zero 档 | ≥ ¥4600(=24/7) | ❌ | 正常 | 低 | 直接出局;2026-07-14 刚涨价 16–32% |
| **SiliconFlow 硅基流动** | ❌ **不能托管外部训练的权重**:微调服务限自家列出的基座(文档列表为 Qwen2.5-7B/14B/32B/72B-Instruct,无 4B、不收外来 checkpoint);自定义部署=企业专属实例/BYOC,询价级 | token 计费(托管微调模型) | N/A | N/A | ✅ 大陆原生 | — | 想用它只能在它平台上重新微调一遍大一号的基座,偏离你的项目叙事 |
| **Novita AI(Deployments)** | ✅(自定义镜像) | 按秒计费,4090 $0.33/h 级;min replicas=0 即缩零不计费 | ≈ ¥25–60 | ✅;冷启动 1–3min(拉镜像) | ✅(PPIO 系,对 CN 友好) | 中 | 文档/生态比 RunPod 薄;细节价格需控制台确认 |
| **阿里云函数计算 FC 3.0 GPU** | ✅(自定义容器) | CU 计费:0.00011 元/CU(折后 0.000088,折扣期**恰好 2026-08-27 到期**);GPU 活跃 Tesla 2.1 CU/GB显存·s、Ada 1.7–1.95;缩到 0 **不计费** | **≈ ¥20–90**(8GB 显存规格、每请求含冷启动按 30–60s 计) | ✅ 原生;冷启动 30s–2min(有镜像加速);另有"闲置模式"(活跃价的 11.7–23%)但 24/7 挂着约 ¥900+/月,不建议 | ✅ 大陆最优 | 中(容器 + OSS/NAS 放权重) | 折扣到期后单价 +25%;闲置计费模式限杭州/上海整卡 |
| **腾讯云 HAI** | ✅(就是台 GPU 机) | 按量,关机不计费;促销如 V100 级 49 元/7 天 | 取决于开机时长;每天开 1h ≈ ¥30–60 | ⚠️ 无自动缩零,需 VPS 调 API 开/关机,开机 1–3min | ✅ 大陆原生 | 高(自己写开关机编排) | 是"便宜整机"不是 serverless;腾讯 SCF 的 GPU 函数未普遍开放 |
| **AutoDL** | ✅(你已在用) | 弹性部署:容器运行秒级计费,可设 GPU 型号+价格区间,自带 6006/6008 端口公网 service URL;4090 ~¥1.98–2.18/h | 每天累计跑 1h ≈ ¥60–65;由你控制副本数 | ⚠️ 无官方"按请求缩零",但可从 VPS 调弹性部署 API 把 replica 0↔1,DIY scale-to-zero;冷启动=调度+拉镜像+载模型,约 2–5min | ✅ 大陆原生 | 高 | 弹性部署 API 面向较重度用户(可能需余额/认证门槛,未完全核实);同型号空闲卡不保证随时有 |
| **VPS 本机 llama.cpp CPU int4** | ✅ | ¥0 增量 | **¥0** | 常驻,无冷启动 | 就在本机 | 低 | 4B Q4 权重 ~2.5GB、吃 3–4GB 内存;2–4 vCPU 共享型 VPS 估 **3–8 tok/s**,500 token 要 1–3 分钟(必须流式输出才可看);与 nginx 抢 CPU |

## 三、Top-2 推荐(都在 ¥100/月 以内)

**首选:Modal。** 这个负载几乎必然落在 $30/月免费 credits 内,**净成本 ≈ ¥0**;真 scale-to-zero;用 GPU memory snapshot 把 4B 冷启动压到 10–30 秒,本身就是一段能写进简历的 scale-from-zero 工程叙事(官方 blog 有 45s→5s、社区有 460s→70s 的公开案例可对标)。VPS 侧只需反代 modal.run 的 HTTPS endpoint。风险:免费额度政策可变;大陆 VPS 到 modal.run 的连通性建议先 curl 实测(HK/海外 VPS 无此问题)。

**次选(大陆 VPS/低延迟优先):阿里云函数计算 FC 3.0 GPU 按量模式。** 缩零不计费经官方文档确认,估算 ¥20–90/月,大陆链路最稳,ModelScope 还有"一键部署到 FC"的现成路径。冷启动 30s–2min 正好喂你的"唤醒中"进度条 UX。注意 CU 折扣价 2026-08-27 到期,按原价 0.00011 元/CU 重算也仍在 ¥100 上下。

**推荐组合拳(最优演示效果):** VPS 本机 llama.cpp CPU 常驻做"即时但慢"的兜底流式输出 + Modal/FC GPU 做"唤醒后快"的主力——前端展示从 CPU fallback 切换到 GPU 加速的过程,比单一后端更有故事性,且兜底路径成本为零。若想保留"模型就在 HF 上"的叙事,再加 $9 PRO ZeroGPU Space 作为第三入口也不超预算(Modal ¥0 + PRO ¥65 < ¥100)。

## 四、已验证 vs 推断

**已验证(2026-08-22 直接读取官方文档/页面):** HF Endpoints 各档价格与按分钟计费、15min 缩零、502 行为;Inference Providers 免费额度($0.10/$2.00)与 hf-inference 仅 CPU 化;ZeroGPU 配额(PRO 40min/天、$1/10min、RTX Pro 6000 Blackwell、仅 Gradio);Modal $30/月 credits 与 T4/L4/A10 秒价;RunPod serverless 档位价、$0.07/GB 网盘、默认 idle 5s;Replicate 秒价与私有模型全周期计费;阿里云 FC CU 单价、GPU 各系列 CU 系数、闲置 11.7–23%、缩零不计费、折扣期限;SiliconFlow 微调仅限其列出基座;Novita min-replicas=0 缩零;腾讯 HAI 关机不计费;AutoDL 弹性部署 API 形态。

**推断/估算(标注为工程估计):** 各平台"本负载月成本"一列(基于 10–20s/请求的 4B int4 GPU 推理耗时假设与冷启动频次假设);HF Endpoints 4B 冷启动 2–5min(官方未给数字,社区口径);VPS CPU 3–8 tok/s(由 Phi-4-mini 3.8B ~12 tok/s 桌面级、EPYC 8B Q4 ~14 tok/s 基准按共享 vCPU 内存带宽折减推得);大陆 VPS 到 modal.run/api.runpod.ai 的连通性;AutoDL 弹性部署准入门槛;Replicate 被 Cloudflare 收购后的定价走向。**行动前请先确认你 VPS 的机房位置**——若在大陆,HF 全家(hf.space / huggingface.cloud)从 VPS 也不可达,只剩 Modal/RunPod/Novita(需实测)与阿里/腾讯(必达)。

**主要来源:** [HF Endpoints pricing](https://huggingface.co/docs/inference-endpoints/pricing) · [HF autoscaling](https://huggingface.co/docs/inference-endpoints/en/autoscaling) · [HF Inference Providers pricing](https://huggingface.co/docs/inference-providers/en/pricing) · [hf-inference](https://huggingface.co/docs/inference-providers/en/providers/hf-inference) · [ZeroGPU](https://huggingface.co/docs/hub/en/spaces-zerogpu) · [HF pricing](https://huggingface.co/pricing) · [Modal pricing](https://modal.com/pricing) · [Modal GPU snapshots](https://modal.com/blog/gpu-mem-snapshots) · [vLLM 冷启动 6.5x 实测](https://logeshumapathi.com/blog/2026/05/17/vllm-serverless.html) · [RunPod pricing](https://www.runpod.io/pricing) · [RunPod serverless docs](https://docs.runpod.io/serverless/pricing) · [Replicate pricing](https://replicate.com/pricing) · [DeepInfra 2026-07 涨价](https://www.morphllm.com/deepinfra-pricing) · [SiliconFlow 微调文档](https://docs.siliconflow.cn/cn/userguide/guides/fine-tune) · [Novita deployments](https://novita.ai/docs/guides/llm-dedicated-endpoint) · [阿里云 FC 计费](https://help.aliyun.com/zh/functioncompute/fc-3-0/product-overview/billing-overview-1) · [魔搭部署到 FC](https://zhuanlan.zhihu.com/p/674956650) · [腾讯 HAI](https://cloud.tencent.com/product/hai) · [AutoDL 弹性部署 API](https://www.autodl.com/docs/esd_api_doc/) · [CPU 基准](https://www.promptquorum.com/local-llms/best-cpu-only-llm)
