"use client";

import { Exhibit } from "@/components/exhibition/Exhibit";
import { Finding } from "@/components/exhibition/Finding";
import { frontierProjectDetail } from "@/lib/frontier-project-detail";
import { useI18n } from "@/lib/i18n";
import releaseJson from "../../../public/case-studies/frontier-forge/release.json";
import { interval, percent, points, usd } from "./forgeFormat";

type Rung = {
  label: string;
  run_id: string;
  status: string;
  task_success: number;
  ci95: number[];
  gpu_hours: number;
  usd: number;
};

const ladder = releaseJson.training.ladder as Rung[];
const headline = releaseJson.training.headline;
const maxTaskSuccess = Math.max(...ladder.map((rung) => rung.task_success));
const r1Rung = ladder.find((rung) => rung.run_id === "r1_sft_rule_s0");

const statusLabel: Record<string, { en: string; zh: string }> = {
  complete: { en: "Complete", zh: "已完成" },
  "release-selected": { en: "Release-selected", zh: "入选发布" },
  "complete-negative": { en: "Complete — negative", zh: "已完成——负结果" },
  "partial-only": { en: "Partial only", zh: "仅部分完成" },
};

// DOM/CSS bar chart (spec §5's "DOM/CSS 图表" instruction): each bar's
// width is an inline style computed from the real task_success ratio, no
// charting library.
export function TrainingLadder() {
  const { locale } = useI18n();

  return (
    <Exhibit
      id="exhibit-03"
      num="03"
      eyebrow="1,450 → 20,000 RULE LABELS"
      bg="paper"
      title={locale === "en" ? <>Free labels moved<br /><em>the frontier.</em></> : <>免费标签，<em>推着边界往前走。</em></>}
      intro={locale === "en"
        ? headline.statement
        // Independent zh narrative (spec §2.6), not a translation of
        // headline.statement — but every number in it is computed from the
        // same release.json fields that statement string draws on, not
        // typed in literally (reviewer finding: zero-hardcoded-numbers).
        : r1Rung
          ? `把免费的规则标签从 1,450 条加到 20,000 条，冻结评测的任务成功率从 ${percent(r1Rung.task_success)} 升到 ${percent(headline.task_success)}：${points(headline.paired_delta_vs_r1.mean_task_success_delta)}，配对 95% CI ${interval(headline.paired_delta_vs_r1.ci95, "points")}，单一训练 seed（seed ${headline.training_seeds[0]}），实测 ${headline.gpu_hours.toFixed(3)} 个 RTX 4090 GPU 小时（${usd(headline.usd, 3)}）。`
          : headline.statement}
    >
      <ol className="forge-ladder">
        {ladder.map((rung) => (
          <li key={rung.run_id} data-status={rung.status} data-ladder-rung={rung.label}>
            <div className="forge-ladder-row">
              <span className="forge-ladder-label">{rung.label}</span>
              <span className="forge-ladder-status">{(statusLabel[rung.status] ?? { en: rung.status, zh: rung.status })[locale]}</span>
              <code className="forge-ladder-value">{percent(rung.task_success)}</code>
            </div>
            <div className="forge-ladder-bar-track">
              <div
                className="forge-ladder-bar-fill"
                data-release-selected={rung.status === "release-selected" ? "true" : undefined}
                style={{ width: `${maxTaskSuccess > 0 ? (rung.task_success / maxTaskSuccess) * 100 : 0}%` }}
              />
            </div>
            <p className="forge-ladder-ci">
              95% CI {interval(rung.ci95)} · {rung.gpu_hours.toFixed(2)} GPU-h · {usd(rung.usd)}
            </p>
          </li>
        ))}
      </ol>
      {/* Reuses src/lib/frontier-project-detail.ts's fieldNotes verbatim
          (previously-reviewed content, also rendered in ForgePage.tsx's
          "Results & negatives" report-layer section) instead of retyping
          the same numbers here — one source, two renderings. */}
      {frontierProjectDetail.fieldNotes?.map((note) => (
        <Finding kind="negative" key={note.en}>
          {locale === "en" ? note.en : note.zh}
        </Finding>
      ))}
    </Exhibit>
  );
}

export default TrainingLadder;
