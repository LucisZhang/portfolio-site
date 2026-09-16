import type { Project } from "./projects";

type FrontierProjectDetail = Pick<Project, "role" | "outcome" | "architecture" | "fieldNotes" | "provenance" | "boundaries">;

export const frontierProjectDetail: FrontierProjectDetail = {
  role: {
    en: "I trained and evaluated the ladder, exported the selected checkpoint, served it with vLLM, wrote the C++20 gateway, exercised the k3s runtime, and ran the two-GPU single-GPU/DDP/FSDP training comparison.",
    zh: "训练与评测阶梯、入选 checkpoint 导出、vLLM 服务、C++20 网关、k3s 运行环境，以及双卡机器上的单卡、DDP 与 FSDP 训练对照，整条链都由我搭建并实测。",
  },
  outcome: {
    en: "Under 3× overload the gateway sheds load with 429s and zero upstream 5xx; bare vLLM crashed at 5×. Distillation lost 14.2 pp to free rule labels and GRPO's CI includes zero — both runs are kept on the page.",
    zh: "压到 3 倍过载，网关用 429 把多余请求挡在门外，上游零 5xx；裸 vLLM 顶到 5 倍直接崩。蒸馏比免费的规则标签还低 14.2 个点，GRPO 置信区间含零——这两次没做成的实验，原样留在页面上。",
  },
  architecture: [
    { label: { en: "Frozen input", zh: "冻结输入" }, detail: { en: "Hash-pinned CFPB splits feed rule labels and API distillation.", zh: "固定哈希的 CFPB 切分进入规则标签与 API 蒸馏。" } },
    { label: { en: "Training ladder", zh: "训练阶梯" }, detail: { en: "R0 → R1/R1b → R2 → R3 → R4, with paired confidence intervals.", zh: "R0 → R1/R1b → R2 → R3 → R4，每一阶都保留配对置信区间。" } },
    { label: { en: "Model exports", zh: "模型导出" }, detail: { en: "The selected R1b becomes BF16, GPTQ-int4, and MTP-preserved artifacts.", zh: "入选的 R1b 导出为 BF16、GPTQ-int4 与 MTP-preserved 产物。" } },
    { label: { en: "vLLM serving", zh: "vLLM 服务" }, detail: { en: "Client/server timing records the precision and native-MTP boundaries.", zh: "客户端与服务端计时共同记录精度与 native MTP 的适用边界。" } },
    { label: { en: "Bounded gateway", zh: "有界网关" }, detail: { en: "A C++20 token-aware admission layer protects the OpenAI-compatible JSON/SSE path.", zh: "C++20 token-aware 准入层保护 OpenAI-compatible JSON/SSE 通路。" } },
  ],
  fieldNotes: [
    {
      en: "Distillation lost 14.2 pp to free rule labels: 52.15% versus the smaller R1 run's 66.35%.",
      zh: "蒸馏输给了免费的规则标签 14.2 个百分点：52.15%，而更小的 R1 是 66.35%。",
    },
    {
      en: "GRPO's paired 95% confidence interval includes zero; one additional seed was stopped by the unchanged zero-reward-variance guard.",
      zh: "GRPO 的配对 95% 置信区间包含零；另一个 seed 被未改动的零奖励方差门禁提前终止。",
    },
  ],
  provenance: [
    { en: "The claim table is built from the copied Phase 7 release.json; the local manifest pins its exact SHA-256.", zh: "断言表由拷入站内的 Phase 7 release.json 构建，本地 manifest 固定其精确 SHA-256。" },
    { en: "The overload replay fetches the preserved Phase 7.1 sustained A10 receipt and does not call a model.", zh: "过载回放读取保留的 Phase 7.1 A10 持续压测收据，不调用模型。" },
  ],
  boundaries: [
    { en: "The lifted production block applies only to the measured single-node gateway overload contract; it does not establish multi-node or production-grade serving. Two-GPU evidence is limited to Phase 8's single-machine 2×RTX 4090 training comparison and one Phase 7.3 tensor-parallel measurement point.", zh: "解除的 production block 只适用于实测的单节点网关过载契约，不能证明多节点或生产级服务。双卡证据仅限 Phase 8 在单机 2×RTX 4090 上的训练对照，以及 Phase 7.3 的单个张量并行测点。" },
    { en: "Only CPU gateway replicas scaled 1→3→1. In Phase 7.2 the GPU deployment moved only between zero and one replica on one physical A10. Phase 7.3 later completed 10 cycles of 0→1→2→1→0 on one RTX 4090 through time-slicing; both replicas share one card, so this is neither hard isolation nor multi-GPU scaling.", zh: "只有 CPU 网关副本完成了 1→3→1；Phase 7.2 的 GPU deployment 只在一张物理 A10 上做了 0 与 1 副本切换。Phase 7.3 之后在一张 RTX 4090 上通过 time-slicing 完成了 10 轮 0→1→2→1→0：两个副本共用同一张卡，既不是硬隔离，也不是多卡扩展。" },
    { en: "The roughly 125-second GPU cold start is suited to batch and development workloads, not an interactive serving SLO.", zh: "约 125 秒的 GPU 冷启动适合批任务与开发负载，不是交互式服务 SLO。" },
  ],
};
