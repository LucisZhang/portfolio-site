"use client";

import { useState } from "react";
import { Exhibit } from "@/components/exhibition/Exhibit";
import { StatGrid } from "@/components/exhibition/StatGrid";
import { useI18n } from "@/lib/i18n";
import releaseJson from "../../../public/case-studies/frontier-forge/release.json";
import { percent, seconds, usd } from "./forgeFormat";

type ServingRun = {
  label: string;
  precision: string;
  requests: number;
  e2e_p50_s: number;
  e2e_p95_s: number;
  ttft_p50_s: number;
  output_tokens_per_s: number;
  task_success: number;
  vram_peak_mib: number;
  cost_per_1k_successful_tasks_usd: number;
};

type BoundaryPoint = {
  qps: number;
  verdict: "win" | "lose";
  p95_delta_s: number;
  baseline_p95_s: number;
  native_mtp_p95_s: number;
};

const runs = releaseJson.serving.serving_at_4_qps as ServingRun[];
const boundary = releaseJson.serving.speculative_boundary;
const points = boundary.points as BoundaryPoint[];
const maxAbsDelta = Math.max(...points.map((point) => Math.abs(point.p95_delta_s)));

export function ServingBoundary() {
  const { locale } = useI18n();
  const [index, setIndex] = useState(0);
  const run = runs[index];

  return (
    <Exhibit
      id="exhibit-04"
      num="04"
      eyebrow="0.25–4.00 QPS · NATIVE MTP"
      bg="white"
      title={locale === "en" ? <>Serving is a boundary,<br /><em>not a badge.</em></> : <>服务是一条边界，<em>不是一枚徽章。</em></>}
      intro={locale === "en"
        ? `At 4 QPS, three precisions were served and measured end to end. Native MTP's win/lose boundary: ${boundary.transition}.`
        : `4 QPS 下，三种精度端到端实测。native MTP 的胜负边界：${boundary.transition}。`}
    >
      <div className="forge-serving-segmented" role="group" aria-label={locale === "en" ? "Serving precision" : "服务精度"}>
        {runs.map((candidate, candidateIndex) => (
          <button
            type="button"
            key={candidate.precision}
            data-serving-precision={candidate.precision}
            aria-pressed={candidateIndex === index}
            onClick={() => setIndex(candidateIndex)}
          >
            {candidate.label}
          </button>
        ))}
      </div>
      <StatGrid
        items={[
          { value: seconds(run.e2e_p50_s), label: "E2E P50" },
          { value: seconds(run.e2e_p95_s), label: "E2E P95" },
          { value: seconds(run.ttft_p50_s), label: "TTFT P50" },
          { value: `${run.output_tokens_per_s.toFixed(1)}`, label: "OUTPUT TOK/S" },
          { value: percent(run.task_success, 0), label: "TASK SUCCESS" },
          { value: `${usd(run.cost_per_1k_successful_tasks_usd, 4)}`, label: "COST / 1K TASKS" },
          { value: `${Math.round(run.vram_peak_mib).toLocaleString("en-US")} MiB`, label: "VRAM PEAK" },
          { value: `n=${run.requests}`, label: "REQUESTS" },
        ]}
      />
      <div className="forge-boundary-bars" data-forge-boundary-bars>
        {points.map((point) => (
          <div className="forge-boundary-bar-row" key={point.qps} data-verdict={point.verdict}>
            <span className="forge-boundary-bar-qps">{point.qps} QPS</span>
            <span className="forge-boundary-bar-track">
              <span
                className="forge-boundary-bar-fill"
                style={{ width: `${maxAbsDelta > 0 ? (Math.abs(point.p95_delta_s) / maxAbsDelta) * 100 : 0}%` }}
              />
            </span>
            <span className="forge-boundary-bar-tag" data-verdict-tag={point.verdict}>
              {point.verdict.toUpperCase()}
            </span>
            <code className="forge-boundary-bar-value">{point.p95_delta_s >= 0 ? "+" : ""}{point.p95_delta_s.toFixed(3)}s p95</code>
          </div>
        ))}
      </div>
    </Exhibit>
  );
}

export default ServingBoundary;
