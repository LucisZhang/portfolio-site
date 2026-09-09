"use client";

import { Exhibit } from "@/components/exhibition/Exhibit";
import { useI18n, type LocalizedString } from "@/lib/i18n";
import forgeReceipts from "@/data/generated/forge-receipts.json";
import releaseJson from "../../../public/case-studies/frontier-forge/release.json";
import { interval, percent, points } from "./forgeFormat";

const headline = releaseJson.training.headline;
const structured = releaseJson.serving.structured_output;
const boundaryTransition = releaseJson.serving.speculative_boundary.transition;
const boundaryLosePoint = releaseJson.serving.speculative_boundary.points.find((point) => point.verdict === "lose");
const distilled = releaseJson.training.ladder.find((rung) => rung.run_id === "r2_sft_distilled_s0");
const r1 = releaseJson.training.ladder.find((rung) => rung.run_id === "r1_sft_rule_s0");
const backendAgreement = releaseJson.training.backend_agreement;
const sustainedCells = releaseJson.phase7_1.gate.sustained_overload_cells;
const gatewayUpstream5xxAtWorstCell = Math.max(...sustainedCells.map((cell) => cell.gateway_upstream_5xx_rate));
const worstMultiplier = Math.max(...sustainedCells.map((cell) => cell.multiplier));

type Item = { ok: boolean; en: string; zh: string };

const items: Item[] = [
  {
    ok: true,
    en: `Reaches ${percent(headline.task_success)} task success on complaint routing (n=${headline.paired_delta_vs_r1.paired_rows.toLocaleString("en-US")} paired, 95% CI ${interval(headline.ci95)})`,
    zh: `投诉分诊任务成功率达 ${percent(headline.task_success)}（n=${headline.paired_delta_vs_r1.paired_rows.toLocaleString("en-US")} 配对，95% CI ${interval(headline.ci95)}）`,
  },
  {
    ok: true,
    en: "Holds schema-valid tool calls at 100% under both xgrammar and outlines constraints",
    zh: "在 xgrammar 与 outlines 两种约束解码后端下，工具调用格式合法率均为 100%",
  },
  {
    ok: true,
    en: `Gateway upstream 5xx stayed at ${percent(gatewayUpstream5xxAtWorstCell, 0)} through ${worstMultiplier}× sustained overload (bare vLLM did not)`,
    zh: `网关侧上游 5xx 在 ${worstMultiplier} 倍持续过载下始终为 ${percent(gatewayUpstream5xxAtWorstCell, 0)}（裸 vLLM 没有做到）`,
  },
  {
    ok: true,
    en: `Native MTP wins on p95 latency across ${(boundaryTransition.split("; ")[1] ?? boundaryTransition).replace(/ win$/, "")}`,
    zh: `native MTP 在 ${(boundaryTransition.split("; ")[1] ?? boundaryTransition).replace(/ win$/, "")} 区间内 p95 延迟更优`,
  },
  {
    ok: false,
    en: "Constrained decoding's simultaneous mode (no two-pass retry) has 0% task success under both xgrammar and outlines",
    zh: "约束解码的 simultaneous 模式（不做 two-pass 重试）在两种后端下任务成功率均为 0%",
  },
  {
    ok: false,
    en: distilled && r1 ? `API distillation lost ${points(r1.task_success - distilled.task_success).replace("+", "")} to the smaller free-label SFT run (${percent(distilled.task_success)} vs ${percent(r1.task_success)})` : "API distillation lost to the smaller free-label SFT run",
    zh: distilled && r1 ? `API 蒸馏输给了更小的免费规则标签 SFT ${points(r1.task_success - distilled.task_success).replace("+", "")}（${percent(distilled.task_success)} vs ${percent(r1.task_success)}）` : "API 蒸馏输给了更小的免费规则标签 SFT",
  },
  {
    ok: false,
    en: "GRPO's paired 95% CI includes zero across both completed seeds; a third seed aborted on a zero-reward-variance guard",
    zh: "GRPO 两个已完成 seed 的配对 95% CI 均含零；第三个 seed 被零奖励方差门禁提前终止",
  },
  {
    ok: false,
    en: boundaryLosePoint ? `Below 0.5 QPS, native MTP is slower, not faster (${boundaryLosePoint.qps} QPS: p95 ${boundaryLosePoint.p95_delta_s >= 0 ? "+" : ""}${boundaryLosePoint.p95_delta_s.toFixed(3)}s, lose)` : "Below 0.5 QPS, native MTP is slower, not faster",
    zh: boundaryLosePoint ? `低于 0.5 QPS 时，native MTP 反而更慢（${boundaryLosePoint.qps} QPS：p95 ${boundaryLosePoint.p95_delta_s >= 0 ? "+" : ""}${boundaryLosePoint.p95_delta_s.toFixed(3)}s，落败）` : "低于 0.5 QPS 时，native MTP 反而更慢",
  },
  {
    ok: false,
    en: `The alternative training backend (unsloth) failed the agreement gate against the default (trl): ${points(backendAgreement.mean_task_success_delta_unsloth_minus_trl)}, 95% CI ${interval(backendAgreement.paired_delta_ci95, "points")}`,
    zh: `替代训练后端（unsloth）没有通过对默认后端（trl）的一致性门禁：${points(backendAgreement.mean_task_success_delta_unsloth_minus_trl)}，95% CI ${interval(backendAgreement.paired_delta_ci95, "points")}`,
  },
];

const localizedTitle: LocalizedString = {
  en: "The model has a boundary. It is drawn here.",
  zh: "这个模型有边界，边界画在这里。",
};

export function BoundaryMatrix() {
  const { locale } = useI18n();
  const yesCount = items.filter((item) => item.ok).length;
  const noCount = items.length - yesCount;

  return (
    <Exhibit
      id="exhibit-06"
      num="06"
      eyebrow="MODEL BOUNDARY"
      bg="paper"
      title={locale === "en" ? <>{localizedTitle.en.split(". ")[0]}.<br /><em>{localizedTitle.en.split(". ")[1]}</em></> : <>模型有它的边界，<em>边界画在这里。</em></>}
      intro={locale === "en"
        ? `${yesCount} capabilities hold up under measurement; ${noCount} do not — the failing count is not hidden below the passing one.`
        : `${yesCount} 项能力经得起实测，${noCount} 项经不起；过与不过同等展示，没过的也摆在明处。`}
    >
      <ul className="forge-matrix">
        {items.map((item) => (
          <li key={item.en} data-capability={item.ok ? "yes" : "no"}>
            {/* De-box pass (task F2): was a ✓/✗ Unicode glyph — this file's
                own header declares "zero icon/emoji", and the site's
                semantic convention elsewhere is a colored mono WORD (PASS/
                FAIL/BLOCKED), never a symbol, so the yes/no read carries
                through color x label-word like every other status marker
                on the page. */}
            <span className="forge-matrix-mark" aria-hidden="true">{item.ok ? "YES" : "NO"}</span>
            <span>{locale === "en" ? item.en : item.zh}</span>
          </li>
        ))}
      </ul>
      <div className="forge-known-failures">
        <p className="exhibit-finding-label">{locale === "en" ? "KNOWN FAILURES" : "已知失败样例"}</p>
        <p className="forge-not-recorded">
          {locale === "en"
            ? "Per-sample misclassified complaints — NOT RECORDED. release.json ships aggregate task_success and paired confidence intervals only, not individual predictions."
            : "逐样本的分诊错误——未记录。release.json 只保留聚合任务成功率与配对置信区间，不含逐样本预测。"}
        </p>
        <p>
          {locale === "en"
            ? "The closest real, cited failure mode: neither constrained-decoding backend produced a usable first-pass answer without a second pass."
            : "最接近的真实、可引用的失败模式：两种约束解码后端都无法在不做第二遍的情况下给出可用的首轮答案。"}
        </p>
        <ul className="forge-known-failures-list">
          {structured.map((backend) => (
            <li key={backend.run_id}>
              <code>{backend.run_id}</code>
              {locale === "en"
                ? ` — ${backend.backend}: simultaneous task success ${percent(backend.simultaneous_task_success, 0)} (${backend.requests} requests); two-pass recovers to ${percent(backend.two_pass_task_success, 0)} at +${backend.latency_delta_p50_s.toFixed(2)}s p50 latency.`
                : ` — ${backend.backend}：simultaneous 任务成功率 ${percent(backend.simultaneous_task_success, 0)}（${backend.requests} 个请求）；two-pass 恢复到 ${percent(backend.two_pass_task_success, 0)}，p50 延迟多花 ${backend.latency_delta_p50_s.toFixed(2)}s。`}
            </li>
          ))}
        </ul>
      </div>
      {/* Task D-02: the "lifted production block" LIMITATION that used to
          close this exhibit is a deployment-scope boundary, not a model-
          suitability one, and it duplicated verbatim the first entry of the
          page's Limitations section (frontierProjectDetail.boundaries[0]).
          It now lives only there; this exhibit stays on what the model can
          and cannot do plus the evidence behind each verdict. */}
      <p className="forge-snapshot-line">
        <code>
          {forgeReceipts.snapshotId} · release.json sha256:{forgeReceipts.releaseJson.sha256.slice(0, 16)}…
        </code>
      </p>
    </Exhibit>
  );
}

export default BoundaryMatrix;
