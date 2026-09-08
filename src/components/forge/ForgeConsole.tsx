"use client";

import { useState } from "react";
import { InstrumentFrame } from "@/components/exhibition/InstrumentFrame";
import { useI18n, type Locale } from "@/lib/i18n";
import releaseJson from "../../../public/case-studies/frontier-forge/release.json";
import { LiveSlot } from "./LiveSlot";
import { percent, seconds, shortHash } from "./forgeFormat";

type ServingRun = {
  label: string;
  run_id: string;
  precision: string;
  requests: number;
  e2e_p50_s: number;
  e2e_p95_s: number;
  ttft_p50_s: number;
  output_tokens_per_s: number;
  task_success: number;
  vram_peak_mib: number;
  cost_per_1k_successful_tasks_usd: number;
  artifact_sha256: string;
};

const runs = releaseJson.serving.serving_at_4_qps as ServingRun[];

// "RTX 4090" (the readout's hardware label) is real but cannot be read from
// release.json's serving_at_4_qps records themselves — they carry
// precision/artifact/timing fields, not a hardware string. It is
// independently confirmed by two other files this task's evidence set
// includes: release.json's own $.training.headline.statement ("...using
// 15.236 measured RTX 4090 GPU-hours...", read verbatim by
// TrainingLadder.tsx) and phase7_1_sustained_gateway_bench.json's
// $.disclosure.comparison_scope.archived_hardware field (= "RTX 4090",
// explicitly distinguishing these Phase 4/5 RTX 4090 serving runs from
// Phase 7.1's later NVIDIA A10 overload runs). That second file is 1.49MB
// and is deliberately NOT imported here (it would defeat the "no heavy
// asset in the initial load" budget this instrument must stay under — it
// only loads after an explicit click, in OverloadReplay.tsx) — so this
// constant documents the cross-file provenance instead of importing the
// file just to read one field. Registered in docs/evidence/digits-forge.md.
const SERVING_HARDWARE_LABEL = "RTX 4090";

// The instrument's honest starting point: spec §6.1 asks for "a COMPLETED
// real inference lying on screen". The frozen evidence set (public/
// case-studies/frontier-forge/*) does not ship per-request complaint text or
// a single-inference transcript — release.json records aggregate serving
// benchmarks only (20 requests per precision at 4 QPS). Rather than invent a
// complaint/response pair, this instrument shows the real recorded run for
// each precision and labels the missing per-request transcript honestly
// (see the "COMPLAINT TRANSCRIPT" note below) instead of fabricating one.
const defaultRunIndex = runs.findIndex((run) => run.label === "R1b BF16 + native MTP");

type RequestTab = "curl" | "python" | "json";

function requestBody(run: ServingRun, locale: Locale) {
  return {
    source: "/case-studies/frontier-forge/release.json",
    model: `frontier-forge/${run.precision}`,
    run_id: run.run_id,
    artifact_sha256: run.artifact_sha256,
    complaint_narrative: locale === "en"
      ? "NOT RECORDED — release.json ships aggregate serving metrics only, not per-request transcripts"
      : "未记录 — release.json 只保留聚合服务指标，不含逐请求文本",
  };
}

function requestSnippet(tab: RequestTab, run: ServingRun, locale: Locale) {
  const body = requestBody(run, locale);
  const json = JSON.stringify(body, null, 2);
  if (tab === "json") return json;
  if (tab === "curl") return `curl -s https://xiangguozhang.com/case-studies/frontier-forge/release.json | \
  jq '.serving.serving_at_4_qps[] | select(.run_id == "${run.run_id}")'`;
  return `import json\n\nwith open("release.json") as source:\n    archive = json.load(source)\n\nrun = next(item for item in archive["serving"]["serving_at_4_qps"]\n           if item["run_id"] == "${run.run_id}")\nprint(json.dumps(run, indent=2))`;
}

export function ForgeConsole({ variant }: { variant: "compact" | "full" }) {
  const { locale } = useI18n();
  const [runIndex, setRunIndex] = useState(defaultRunIndex >= 0 ? defaultRunIndex : 0);
  const [tab, setTab] = useState<RequestTab>("curl");
  const run = runs[runIndex];

  return (
    <InstrumentFrame variant={variant}>
      <div className="forge-console">
        <LiveSlot />
        <div className="forge-console-chips" role="tablist" aria-label={locale === "en" ? "Recorded serving run" : "已记录的服务运行"}>
          {runs.map((candidate, index) => (
            <button
              type="button"
              role="tab"
              key={candidate.run_id}
              data-forge-chip={candidate.precision}
              aria-selected={index === runIndex}
              onClick={() => setRunIndex(index)}
            >
              {candidate.label}
            </button>
          ))}
        </div>
        <div className="forge-console-readout" data-readout aria-live="polite">
          <strong>{seconds(run.e2e_p50_s)}</strong>
          <span className="forge-console-readout-detail">
            {run.output_tokens_per_s.toFixed(1)} tok/s · {run.requests} reqs · {percent(run.task_success, 0)} success · {SERVING_HARDWARE_LABEL}
          </span>
          <code className="forge-console-run-id" title={run.artifact_sha256}>
            {run.run_id} · sha256:{shortHash(run.artifact_sha256, 10)}
          </code>
        </div>
        <p className="forge-console-transcript-note">
          {locale === "en"
            ? "COMPLAINT TRANSCRIPT — NOT RECORDED. release.json ships aggregate serving metrics, not per-request text."
            : "投诉原文——未记录。release.json 只保留聚合服务指标，不含逐请求文本。"}
        </p>
        <div className="forge-console-tabs" role="tablist" aria-label={locale === "en" ? "Read archived evidence" : "读取归档证据"}>
          {(["curl", "python", "json"] as RequestTab[]).map((candidate) => (
            <button type="button" role="tab" key={candidate} aria-selected={tab === candidate} onClick={() => setTab(candidate)}>
              {candidate === "curl" ? "cURL" : candidate === "python" ? "Python" : "JSON"}
            </button>
          ))}
        </div>
        <pre className="forge-console-request" data-forge-request-tab={tab}>
          <code>{requestSnippet(tab, run, locale)}</code>
        </pre>
      </div>
    </InstrumentFrame>
  );
}

export default ForgeConsole;
