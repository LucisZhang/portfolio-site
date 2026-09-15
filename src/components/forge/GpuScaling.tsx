"use client";

import { Exhibit } from "@/components/exhibition/Exhibit";
import { EvidenceFileLink } from "@/components/exhibition/EvidenceFileLink";
import { Finding } from "@/components/exhibition/Finding";
import { StatGrid } from "@/components/exhibition/StatGrid";
import { useI18n } from "@/lib/i18n";
import evidence from "../../../public/case-studies/frontier-forge/gpu-scaling-evidence.json";
import { commaInt, seconds } from "./forgeFormat";

// Exhibit 06: Phase 7.3 time-sliced replicas + optional TP point, and Phase 8
// single-GPU/DDP/FSDP training. Every number is read from the field-level
// projection gpu-scaling-evidence.json (pinned to frontier-forge 34e857b and
// registered in docs/evidence/digits-forge.md); nothing is typed in here.
const replicas = evidence.phase7_3_replicas;
const tp = evidence.phase7_3_tp;
const training = evidence.phase8_distributed;

function replicaCell(qps: number) {
  const cell = replicas.two_vs_one.find((candidate) => candidate.qps === qps);
  if (!cell) throw new Error(`gpu-scaling-evidence.json is missing the two-vs-one replica cell at QPS ${qps}.`);
  return cell;
}
const [lowQps, highQps] = [4, 8].map(replicaCell);

function variant(config: string) {
  const found = training.variants.find((candidate) => candidate.config === config);
  if (!found) throw new Error(`gpu-scaling-evidence.json is missing the ${config} training variant.`);
  return found;
}
const single = variant("single_gpu_accumulation");
const ddp = variant("ddp");
const fsdp = variant("fsdp_full_shard");

function paired(comparison: string) {
  const found = training.paired_differences.find((candidate) => candidate.comparison === comparison);
  if (!found) throw new Error(`gpu-scaling-evidence.json is missing the ${comparison} paired difference.`);
  return found;
}
const ddpVsSingle = paired("B-A");
const fsdpVsSingle = paired("C-A");

const ratio = (value: number) => `${value.toFixed(3)}×`;
const signed = (value: number) => `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(2)}`;
const pp = (value: number) => `${signed(value)} pp`;
const ci = (bounds: number[]) => `[${bounds.map(signed).join(", ")}]`;
const peakBytes = (bytes: number[]) => Math.max(...bytes);
const gib = (bytes: number) => `${(bytes / 2 ** 30).toFixed(2)} GiB`;
const tokensPerSecond = (value: number) => value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const memoryReductionPercent = (1 - peakBytes(fsdp.peak_allocated_bytes_per_gpu) / peakBytes(ddp.peak_allocated_bytes_per_gpu)) * 100;
const maxTokensPerSecond = Math.max(...training.variants.map((candidate) => candidate.input_tokens_per_s));

const variantLabel: Record<string, { en: string; zh: string }> = {
  single_gpu_accumulation: { en: "Single GPU + accumulation", zh: "单卡 + 梯度累积" },
  ddp: { en: "DDP", zh: "DDP" },
  fsdp_full_shard: { en: "FSDP FULL_SHARD", zh: "FSDP FULL_SHARD" },
};

export function GpuScaling() {
  const { locale } = useI18n();
  const en = locale === "en";

  return (
    <Exhibit
      id="exhibit-06"
      num="06"
      eyebrow="RTX 4090 · TIME-SLICING · TP · DDP / FSDP"
      bg="white"
      title={en ? <>Two replicas helped. TP=2 did not.<br /><em>FSDP traded speed for memory.</em></> : <>两个副本有用，TP=2 没有。<br /><em>FSDP 拿速度换显存。</em></>}
      intro={en
        ? `Phase 7.3 time-sliced one ${replicas.gpu} between vLLM replicas and added an optional two-GPU tensor-parallel point. Phase 8 trained the same full-parameter SFT three ways on one ${training.gpu_count}×${training.gpu} machine.`
        : `Phase 7.3 在一张 ${replicas.gpu} 上用 time-slicing 运行多个 vLLM 副本，并补测了一个双卡张量并行点；Phase 8 在一台 ${training.gpu_count}×${training.gpu} 机器上，把同一组全参 SFT 用三种方式各训练一遍。`}
    >
      <div className="forge-gpu" data-testid="forge-gpu-scaling">
        <section className="forge-gpu-block" data-forge-gpu-block="replicas" aria-labelledby="forge-gpu-replicas-title">
          <h3 id="forge-gpu-replicas-title" className="forge-gpu-heading">
            {en ? `Two replicas vs one · one ${replicas.gpu}` : `两个副本对比单副本 · 一张 ${replicas.gpu}`}
          </h3>
          <StatGrid
            items={[
              { value: `${ratio(lowQps.successful_throughput_ratio)} / ${ratio(highQps.successful_throughput_ratio)}`, label: en ? `SUCCESS THROUGHPUT · QPS ${lowQps.qps} / ${highQps.qps}` : `成功吞吐 · QPS ${lowQps.qps} / ${highQps.qps}` },
              { value: `${pp(lowQps.success_rate_delta_pp)} / ${pp(highQps.success_rate_delta_pp)}`, label: en ? `SUCCESS RATE · QPS ${lowQps.qps} / ${highQps.qps}` : `成功率 · QPS ${lowQps.qps} / ${highQps.qps}` },
              { value: `${ratio(lowQps.ttft_p95_ratio)} / ${ratio(highQps.ttft_p95_ratio)}`, label: en ? `TTFT P95 · QPS ${lowQps.qps} / ${highQps.qps}` : `首字延迟 p95 · QPS ${lowQps.qps} / ${highQps.qps}` },
              { value: seconds(replicas.scaling.one_to_two_ready_p50_s), label: en ? "1→2 READY P50" : "1→2 就绪 p50" },
            ]}
          />
          <p className="forge-gpu-copy">
            {en
              ? `Against one replica on the same seed-${replicas.seed} request plan (${replicas.cell_duration_s} s per cell, QPS ${replicas.qps.join("/")}), two time-sliced vLLM replicas raised successful-task throughput and cut TTFT p95 at QPS ${lowQps.qps} and ${highQps.qps}. QPS ${highQps.qps} still returned many HTTP 429s, and the ratios come from one descriptive run without repeat-trial intervals.`
              : `与单副本相比（同一份 seed ${replicas.seed} 请求计划，每格 ${replicas.cell_duration_s} 秒，QPS ${replicas.qps.join("/")}），两个以 time-slicing 共享 GPU 的 vLLM 副本在 QPS ${lowQps.qps} 和 ${highQps.qps} 下提高了成功任务吞吐，也压低了首字延迟 p95。QPS ${highQps.qps} 下仍有大量 HTTP 429；这些倍率只来自一次描述性运行，没有重复试验的区间估计。`}
          </p>
          <Finding kind="limitation">
            {en
              ? `Isolation cuts both ways. While a neighbor replica took ${replicas.isolation.attacker_qps} QPS directly, the observed replica's all-request end-to-end p95 rose only ${replicas.isolation.observer_e2e_p95_change_percent.toFixed(2)}% (${seconds(replicas.isolation.observer_e2e_p95_baseline_s, 3)} → ${seconds(replicas.isolation.observer_e2e_p95_disturbed_s, 3)}). Yet ${commaInt(replicas.isolation.attacker_timeouts_after_http_200)} of the attacker's ${commaInt(replicas.isolation.attacker_requests)} requests timed out after HTTP 200 headers arrived, and only ${commaInt(replicas.isolation.attacker_verified_successes)} passed task verification. Time-slicing gives no hard isolation.`
              : `隔离性要看两面。邻副本直接承受 ${replicas.isolation.attacker_qps} QPS 时，被观察副本的全请求端到端 p95 只上升 ${replicas.isolation.observer_e2e_p95_change_percent.toFixed(2)}%（${seconds(replicas.isolation.observer_e2e_p95_baseline_s, 3)} → ${seconds(replicas.isolation.observer_e2e_p95_disturbed_s, 3)}）；但攻击流的 ${commaInt(replicas.isolation.attacker_requests)} 个请求里，有 ${commaInt(replicas.isolation.attacker_timeouts_after_http_200)} 个在收到 HTTP 200 响应头之后超时，只有 ${commaInt(replicas.isolation.attacker_verified_successes)} 个通过任务验证。time-slicing 不提供硬隔离。`}
          </Finding>
          <Finding kind="pass" label="STAGED PASS">
            {en
              ? `The scaling gate passed in stages: ${replicas.scaling.cycles} cycles of ${replicas.scaling.sequence} (${replicas.scaling.transitions} transitions) came from an independent re-run, while the original attempt stays sealed as failed. With node, image, and model caches already in place, 1→2 reached Ready at p50 ${seconds(replicas.scaling.one_to_two_ready_p50_s)}.`
              : `扩缩门禁是分阶段通过的：${replicas.scaling.cycles} 轮 ${replicas.scaling.sequence}（共 ${replicas.scaling.transitions} 次转换）来自独立补跑，原始尝试仍以失败状态封存。在节点、镜像和模型缓存已就绪的条件下，1→2 扩容达到 Ready 的 p50 为 ${seconds(replicas.scaling.one_to_two_ready_p50_s)}。`}
          </Finding>
          <p className="forge-gpu-sources">
            <EvidenceFileLink source="frontier-forge:results/phase7_3_summary.md">{en ? "Phase 7.3 measured summary" : "Phase 7.3 实测摘要"}</EvidenceFileLink>
          </p>
        </section>

        <section className="forge-gpu-block" data-forge-gpu-block="tensor-parallel" aria-labelledby="forge-gpu-tp-title">
          <h3 id="forge-gpu-tp-title" className="forge-gpu-heading">
            {en ? "Tensor parallelism · one measured point" : "张量并行 · 只有一个测点"}
          </h3>
          <StatGrid
            items={[
              { value: ratio(tp.tp2_vs_tp1.successful_throughput_ratio), label: en ? "SUCCESS THROUGHPUT · TP=2 / TP=1" : "成功吞吐 · TP=2 / TP=1" },
              { value: ratio(tp.tp2_vs_tp1.ttft_p95_ratio), label: en ? "TTFT P95 · TP=2 / TP=1" : "首字延迟 p95 · TP=2 / TP=1" },
              { value: ratio(tp.tp2_vs_tp1.cost_per_1k_successful_tasks_ratio), label: en ? "COST PER 1K SUCCESSFUL TASKS" : "每千个成功任务的成本" },
              { value: `n=${tp.requests_per_cell}`, label: en ? "REQUESTS PER TP SETTING" : "每档请求数" },
            ]}
          />
          <Finding kind="negative">
            {en
              ? `On one ${tp.gpu_count}×${tp.gpu} machine at QPS ${tp.qps} for ${tp.duration_s} s, TP=2 was slower than TP=1 and cost more per successful task. One operating point is not a scalability result, which is why this page presents replicas, not tensor parallelism, as the measured scaling path.`
              : `在一台 ${tp.gpu_count}×${tp.gpu} 机器上以 QPS ${tp.qps} 跑 ${tp.duration_s} 秒，TP=2 比 TP=1 更慢，每个成功任务的成本也更高。单个测点构不成扩展性结论，所以本页把多副本而不是张量并行，作为实测过的扩展路径来呈现。`}
          </Finding>
          <p className="forge-gpu-sources">
            <EvidenceFileLink source="frontier-forge:results/phase7_3_tp_reviewed_report.md">{en ? "TP single-point report" : "TP 单测点报告"}</EvidenceFileLink>
          </p>
        </section>

        <section className="forge-gpu-block" data-forge-gpu-block="distributed-training" aria-labelledby="forge-gpu-training-title">
          <h3 id="forge-gpu-training-title" className="forge-gpu-heading">
            {en ? "Single GPU, DDP, FSDP · same training, three ways" : "单卡、DDP、FSDP · 同一组训练，三种跑法"}
          </h3>
          <p className="forge-gpu-copy">
            {en
              ? `Full-parameter SFT of ${training.model} (${commaInt(training.trainable_parameters)} parameters): ${commaInt(training.optimizer_steps)} steps on ${commaInt(training.train_rows)} training rows, scored on the same frozen ${commaInt(training.eval_rows)}-row evaluation.`
              : `${training.model} 全参 SFT（${commaInt(training.trainable_parameters)} 个参数）：在 ${commaInt(training.train_rows)} 条训练数据上跑 ${commaInt(training.optimizer_steps)} 步，用同一套冻结的 ${commaInt(training.eval_rows)} 条样本评测。`}
          </p>
          <ol className="forge-ladder forge-gpu-variants">
            {[single, ddp, fsdp].map((row) => (
              <li key={row.id} data-training-variant={row.config}>
                <div className="forge-ladder-row">
                  <span className="forge-ladder-label">{variantLabel[row.config][locale]}</span>
                  <span className="forge-ladder-status">
                    {row.scaling_efficiency_percent === null
                      ? (en ? "BASELINE" : "基线")
                      : `${en ? "SCALING EFF." : "扩展效率"} ${row.scaling_efficiency_percent.toFixed(2)}%`}
                  </span>
                  <code className="forge-ladder-value">{tokensPerSecond(row.input_tokens_per_s)} tok/s</code>
                </div>
                <div className="forge-ladder-bar-track">
                  <div className="forge-ladder-bar-fill" style={{ width: `${(row.input_tokens_per_s / maxTokensPerSecond) * 100}%` }} />
                </div>
                <p className="forge-ladder-ci">
                  {en ? "PEAK ALLOCATED / GPU" : "每卡峰值分配显存"} {gib(peakBytes(row.peak_allocated_bytes_per_gpu))} · hard-AND {row.hard_and_percent.toFixed(2)}% · n={commaInt(training.eval_rows)}
                </p>
              </li>
            ))}
          </ol>
          <StatGrid
            items={[
              { value: `−${memoryReductionPercent.toFixed(2)}%`, label: en ? "PEAK MEMORY / GPU · FSDP VS DDP" : "每卡峰值显存 · FSDP 对比 DDP" },
              { value: `${pp(ddpVsSingle.delta_pp)} ${ci(ddpVsSingle.ci95_pp)}`, label: en ? "DDP − SINGLE GPU · PAIRED 95% CI" : "DDP − 单卡 · 配对 95% CI" },
              { value: `${pp(fsdpVsSingle.delta_pp)} ${ci(fsdpVsSingle.ci95_pp)}`, label: en ? "FSDP − SINGLE GPU · PAIRED 95% CI" : "FSDP − 单卡 · 配对 95% CI" },
            ]}
          />
          <Finding kind="note">
            {en
              ? `Both paired 95% intervals include zero, so this evaluation detects no quality difference between the three setups. FSDP traded throughput for memory, which is consistent with its extra parameter gathers, but communication time was not profiled separately. The two GPUs connect over PCIe (${training.interconnect} topology) without NVLink.`
              : `两组配对 95% 区间都包含零：在这套评测上，三种配置之间看不出质量差异。FSDP 用吞吐换来了显存，这与它额外的参数 gather 一致，但通信耗时没有单独剖析。两张卡之间走 PCIe（${training.interconnect} 拓扑），没有 NVLink。`}
          </Finding>
          <p className="forge-gpu-sources">
            <EvidenceFileLink source="frontier-forge:results/phase8_distributed_report.md">{en ? "Phase 8 distributed report" : "Phase 8 分布式训练报告"}</EvidenceFileLink>
            <EvidenceFileLink source="frontier-forge:results/phase8/final-publication/supplement.md">{en ? "Measured supplement" : "实测补充材料"}</EvidenceFileLink>
          </p>
        </section>

      </div>
    </Exhibit>
  );
}

export default GpuScaling;
