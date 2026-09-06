"use client";

import { useMemo, useState } from "react";
import { Exhibit } from "@/components/exhibition/Exhibit";
import ScrollRegion from "@/components/ScrollRegion";
import { useI18n, type LocalizedString } from "@/lib/i18n";
import claimCommandsJson from "../../../public/case-studies/frontier-forge/claim-commands.json";
import manifestJson from "../../../public/case-studies/frontier-forge/manifest.json";
import releaseJson from "../../../public/case-studies/frontier-forge/release.json";
import { interval, points } from "./forgeFormat";

type Dimension = "training" | "inference" | "gateway" | "elasticity";
type ResultClass = "positive" | "negative" | "boundary";

type ReleaseData = {
  provenance: { source_manifest: string; source_manifest_sha256: string };
  training: {
    headline: {
      task_success: number;
      ci95: number[];
      paired_delta_vs_r1: { mean_task_success_delta: number; paired_rows: number; ci95: number[] };
    };
    ladder: Array<{ label: string; task_success: number; ci95: number[] }>;
    r4_seed_deltas: Array<{ mean_task_success_delta?: number; paired_rows: number; ci95?: number[] }>;
    backend_agreement: {
      mean_task_success_delta_unsloth_minus_trl: number;
      paired_rows: number;
      paired_delta_ci95: number[];
      config_path: string;
      config_hash: string;
    };
  };
  serving: {
    serving_at_4_qps: Array<{
      label: string;
      e2e_p95_s: number;
      requests: number;
      task_success_wilson95: number[];
      artifact_sha256: string;
    }>;
    speculative_boundary: { transition: string; points: Array<{ qps: number; verdict: string }> };
  };
  phase7_1: {
    gate: { sustained_overload_cells: Array<{ multiplier: number; gateway_requests: number; http_429_count: number; gateway_upstream_5xx_rate: number }> };
    highest_load: {
      bare_vllm_http_status_counts: Record<string, number>;
      gateway_http_status_counts: Record<string, number>;
      multiplier: number;
    };
  };
  phase7_2: {
    gateway_scaling: { before: { replicas: { ready_replicas: number } }; max_ready_replicas: number; scaled_down: { ready_replicas: number }; k6_counts: { http_429: number } };
    gpu_cold_start: { distribution_s: { p50: number; p95: number }; iterations_completed: number };
  };
};

type Claim = {
  id: string;
  dimension: Dimension;
  result: ResultClass;
  claim: LocalizedString;
  number: string;
  nCi?: string;
  command?: string;
  sha256?: string;
};

const release = releaseJson as ReleaseData;
const releaseAsset = manifestJson.assets.find((asset) => asset.path === "release.json");
const claimCommands = claimCommandsJson as Record<string, string>;

function percent(value: number, digits = 2) {
  return `${(value * 100).toFixed(digits)}%`;
}

function buildClaims(): Claim[] {
  const headline = release.training.headline;
  const distilled = release.training.ladder.find((run) => run.label === "R2 distilled SFT");
  const r1 = release.training.ladder.find((run) => run.label === "R1 rule SFT (1,450)");
  const grpo = release.training.r4_seed_deltas.find((run) => run.mean_task_success_delta !== undefined && run.ci95);
  const backend = release.training.backend_agreement;
  const gptq = release.serving.serving_at_4_qps.find((run) => run.label === "R1b GPTQ-int4");
  const mtp = release.serving.serving_at_4_qps.find((run) => run.label === "R1b BF16 + native MTP");
  const threeX = release.phase7_1.gate.sustained_overload_cells.find((cell) => cell.multiplier === 3);
  const highest = release.phase7_1.highest_load;
  const scaling = release.phase7_2.gateway_scaling;
  const coldStart = release.phase7_2.gpu_cold_start;
  const releaseHash = releaseAsset?.sha256;

  return [
    {
      id: "training-headline",
      dimension: "training",
      result: "positive",
      claim: { en: "Free-label SFT reached the selected task-success result", zh: "免费规则标签的 SFT 达到最终入选结果" },
      number: percent(headline.task_success),
      nCi: `n=${headline.paired_delta_vs_r1.paired_rows.toLocaleString("en-US")} · 95% CI ${interval(headline.ci95)}`,
      command: claimCommands["task-success"],
      sha256: release.provenance.source_manifest_sha256,
    },
    {
      id: "training-distillation",
      dimension: "training",
      result: "negative",
      claim: { en: "API distillation lost to the smaller free-label SFT run", zh: "API 蒸馏输给了更小的免费规则标签 SFT" },
      number: distilled && r1 ? `${percent(distilled.task_success)} · ${points(distilled.task_success - r1.task_success)} vs R1` : "",
      nCi: distilled ? `95% CI ${interval(distilled.ci95)}` : undefined,
      command: claimCommands["distilled-sft-delta"],
      sha256: release.provenance.source_manifest_sha256,
    },
    {
      id: "training-grpo",
      dimension: "training",
      result: "negative",
      claim: { en: "GRPO's paired interval includes zero", zh: "GRPO 的配对置信区间包含零" },
      number: grpo?.mean_task_success_delta === undefined ? "" : points(grpo.mean_task_success_delta),
      nCi: grpo?.ci95 ? `n=${grpo.paired_rows.toLocaleString("en-US")} · 95% CI ${interval(grpo.ci95, "points")}` : undefined,
      sha256: release.provenance.source_manifest_sha256,
    },
    {
      id: "training-backend",
      dimension: "training",
      result: "negative",
      claim: { en: "The alternative training backend failed the agreement gate", zh: "替代训练后端没有通过一致性门禁" },
      number: points(backend.mean_task_success_delta_unsloth_minus_trl),
      nCi: `n=${backend.paired_rows.toLocaleString("en-US")} · paired 95% CI ${interval(backend.paired_delta_ci95, "points")}`,
      command: `config: ${backend.config_path}`,
      sha256: backend.config_hash,
    },
    {
      id: "inference-gptq",
      dimension: "inference",
      result: "positive",
      claim: { en: "GPTQ-int4 recorded the lowest 4 QPS p95", zh: "GPTQ-int4 录得最低的 4 QPS p95" },
      number: gptq ? `${gptq.e2e_p95_s.toFixed(3)} s p95` : "",
      nCi: gptq ? `n=${gptq.requests} · task-success Wilson 95% CI ${interval(gptq.task_success_wilson95)}` : undefined,
      sha256: gptq?.artifact_sha256,
    },
    {
      id: "inference-mtp-boundary",
      dimension: "inference",
      result: "boundary",
      claim: { en: "Native MTP has a measured win/lose boundary", zh: "native MTP 有明确测出的胜负边界" },
      number: release.serving.speculative_boundary.transition,
      sha256: mtp?.artifact_sha256,
    },
    {
      id: "gateway-three-x",
      dimension: "gateway",
      result: "positive",
      claim: { en: "At 3× overload the gateway rejected excess work with zero upstream 5xx", zh: "3 倍过载时，网关挡住多余请求且上游零 5xx" },
      number: threeX ? `${threeX.http_429_count} HTTP 429 · ${percent(threeX.gateway_upstream_5xx_rate)} upstream 5xx` : "",
      nCi: threeX ? `n=${threeX.gateway_requests.toLocaleString("en-US")} scheduled per side` : undefined,
      sha256: releaseHash,
    },
    {
      id: "gateway-five-x",
      dimension: "gateway",
      result: "negative",
      claim: { en: "Bare vLLM crashed in the matched 5× cell", zh: "裸 vLLM 在配对的 5 倍过载 cell 中崩溃" },
      number: `${highest.bare_vllm_http_status_counts.transport_error} transport errors · gateway ${highest.gateway_http_status_counts["429"]} HTTP 429`,
      nCi: `n=${Object.values(highest.bare_vllm_http_status_counts).reduce((sum, value) => sum + value, 0).toLocaleString("en-US")} scheduled per side`,
      command: claimCommands["sustained-overload"],
      sha256: releaseHash,
    },
    {
      id: "elasticity-gateway",
      dimension: "elasticity",
      result: "positive",
      claim: { en: "The CPU gateway scaled out and returned to one replica", zh: "CPU 网关完成扩容并回到单副本" },
      number: `${scaling.before.replicas.ready_replicas}→${scaling.max_ready_replicas}→${scaling.scaled_down.ready_replicas} replicas`,
      nCi: `n=${scaling.k6_counts.http_429.toLocaleString("en-US")} recorded HTTP 429`,
      sha256: releaseHash,
    },
    {
      id: "elasticity-cold-start",
      dimension: "elasticity",
      result: "boundary",
      claim: { en: "GPU cold start is a batch boundary, not an interactive SLO", zh: "GPU 冷启动适合批任务，不是交互式 SLO" },
      number: `p50 ${coldStart.distribution_s.p50.toFixed(1)} s · p95 ${coldStart.distribution_s.p95.toFixed(1)} s`,
      nCi: `n=${coldStart.iterations_completed}`,
      sha256: releaseHash,
    },
  ];
}

const filters: Array<{ id: "all" | Dimension; label: LocalizedString }> = [
  { id: "all", label: { en: "All claims", zh: "全部断言" } },
  { id: "training", label: { en: "Training", zh: "训练" } },
  { id: "inference", label: { en: "Inference", zh: "推理" } },
  { id: "gateway", label: { en: "Gateway", zh: "网关" } },
  { id: "elasticity", label: { en: "Elasticity", zh: "弹性" } },
];

const resultLabels: Record<ResultClass, LocalizedString> = {
  positive: { en: "Positive", zh: "正结果" },
  negative: { en: "Negative", zh: "负结果" },
  boundary: { en: "Boundary", zh: "边界" },
};

export function EvidenceExplorer() {
  const { locale } = useI18n();
  const [filter, setFilter] = useState<"all" | Dimension>("all");
  const claims = useMemo(() => buildClaims(), []);
  const visible = filter === "all" ? claims : claims.filter((claim) => claim.dimension === filter);

  return (
    <Exhibit
      id="exhibit-02"
      num="02"
      eyebrow="RELEASE.JSON / CLAIM REGISTRY / SHA-256"
      bg="ink"
      title={
        locale === "en" ? (
          <>Every number on this page<br /><em>opens the command that made it.</em></>
        ) : (
          <>页面上的每个数字，<em>都能点开看它的生成命令。</em></>
        )
      }
      intro={locale === "en"
        ? "Blank command cells mean the receipt recorded no shell command; config paths appear only where present."
        : "命令栏留空，表示收据没有记录 shell 命令；只有原数据中存在的配置路径才会显示。"}
    >
      <div className="forge-explorer" data-testid="forge-evidence-explorer">
        <div className="forge-filter-bar" role="group" aria-label={locale === "en" ? "Filter evidence claims" : "筛选证据断言"}>
          {filters.map((item) => (
            <button type="button" data-filter={item.id} aria-pressed={filter === item.id} onClick={() => setFilter(item.id)} key={item.id}>
              {item.label[locale]}
            </button>
          ))}
        </div>
        {/* Task F7: below 768px this horizontal-scroll table gives way to
            the .forge-claim-cards list (direction B's "number-first"
            grammar from the approved mock output/design-align/
            direction-mobile-table-b.html's dark section) -- toggled purely
            by CSS media query, so the shared `visible` filter state drives
            both renderings identically. */}
        <ScrollRegion className="forge-claim-table-scroll" label={{ en: "Claims and evidence table", zh: "断言与证据表" }}>
          <table>
            <thead>
              <tr>
                <th>{locale === "en" ? "Claim" : "断言"}</th>
                <th>{locale === "en" ? "Number" : "数字"}</th>
                <th>n · CI</th>
                <th>{locale === "en" ? "Generation command" : "生成命令"}</th>
                <th>SHA-256</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((claim) => (
                <tr
                  data-dimension={claim.dimension}
                  data-result={claim.result}
                  className={claim.result === "negative" ? "negative-finding" : undefined}
                  key={claim.id}
                >
                  <td>
                    <span className="forge-result-tag" data-result={claim.result}>{resultLabels[claim.result][locale]}</span>
                    <strong>{claim.claim[locale]}</strong>
                  </td>
                  <td><code>{claim.number}</code></td>
                  <td>{claim.nCi ? <code>{claim.nCi}</code> : null}</td>
                  <td>{claim.command ? <code>{claim.command}</code> : null}</td>
                  <td>{claim.sha256 ? <code title={claim.sha256}>{claim.sha256.slice(0, 12)}…</code> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollRegion>
        <ul className="forge-claim-cards" data-testid="forge-claim-cards">
          {visible.map((claim) => (
            <li
              data-dimension={claim.dimension}
              data-result={claim.result}
              key={claim.id}
            >
              <p className="forge-claim-card-number">
                <code>{claim.number}</code>
                <span className="forge-result-tag" data-result={claim.result}>{resultLabels[claim.result][locale]}</span>
              </p>
              <p className="forge-claim-card-caption">{claim.claim[locale]}</p>
              {claim.nCi ? <p className="forge-claim-card-meta"><code>{claim.nCi}</code></p> : null}
              {claim.command ? <p className="forge-claim-card-meta"><code>{claim.command}</code></p> : null}
              {claim.sha256 ? <p className="forge-claim-card-meta">SHA-256 <code title={claim.sha256}>{claim.sha256.slice(0, 12)}…</code></p> : null}
            </li>
          ))}
        </ul>
      </div>
    </Exhibit>
  );
}

export default EvidenceExplorer;
