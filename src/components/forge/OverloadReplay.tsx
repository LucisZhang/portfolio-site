"use client";

import { useEffect, useMemo, useState } from "react";
import { Exhibit } from "@/components/exhibition/Exhibit";
import ScrollRegion from "@/components/ScrollRegion";
import { useI18n } from "@/lib/i18n";
import manifestJson from "../../../public/case-studies/frontier-forge/manifest.json";
import releaseJson from "../../../public/case-studies/frontier-forge/release.json";

const RECEIPT_URL = "/case-studies/frontier-forge/phase7_1_sustained_gateway_bench.json";
const receiptAsset = manifestJson.assets.find((asset) => asset.path === "phase7_1_sustained_gateway_bench.json");
if (!receiptAsset) throw new Error("manifest.json is missing the phase7_1_sustained_gateway_bench.json asset entry.");
// Resolved into two plain module-scope constants (rather than referencing
// receiptAsset.* from inside the component below) because TypeScript's
// control-flow narrowing from the guard above does not carry into a nested
// function/closure.
const RECEIPT_BYTES = receiptAsset.bytes;
const RECEIPT_SHA256 = receiptAsset.sha256;

type SustainedCell = {
  multiplier: number;
  offered_qps: number;
  gateway_requests: number;
  direct_requests: number;
  http_429_count: number;
  gateway_upstream_5xx_rate: number;
  bare_vllm_upstream_5xx_rate: number;
  queue_saturated: boolean;
  pass: boolean;
};

const sustainedCells = releaseJson.phase7_1.gate.sustained_overload_cells as SustainedCell[];
const highestLoad = releaseJson.phase7_1.highest_load;

type RecordedSide = {
  arrival_duration_s: number;
  scheduled_arrivals: number;
  http_status_counts: Record<string, number>;
  client: { fast_reject: { p95_s: number | null } };
  gateway?: { queue_high_watermark_process: number } | null;
};

type Pair = {
  multiplier: number;
  offered_qps: number;
  direct: RecordedSide;
  gateway: RecordedSide;
};

type OverloadReceipt = {
  run_id: string;
  gate: { sustained_overload_cells: Array<{ multiplier: number; gateway_upstream_5xx_rate: number }> };
  metrics: { sustained_overload: { pairs: Pair[] } };
};

// Spec §6.1 exhibit 05: "过载对照 ... 懒岛" — the 1.49 MB recorded receipt
// (phase7_1_sustained_gateway_bench.json) must load only after an explicit
// click (Ten Commandment #9 / task 2.2 network assertion). Everything
// visible before that click — the summary table below — is built from the
// already-small release.json gate summary that ships in the initial HTML,
// so JS-disabled visitors and the pre-click state both see real numbers,
// never an empty shell.
export function OverloadReplay() {
  const { locale } = useI18n();
  const [loadRequested, setLoadRequested] = useState(false);
  const [receipt, setReceipt] = useState<OverloadReceipt | null>(null);
  const [failed, setFailed] = useState(false);
  const [selectedMultiplier, setSelectedMultiplier] = useState(5);
  const [progress, setProgress] = useState(100);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!loadRequested) return;
    let active = true;
    fetch(RECEIPT_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`Overload receipt returned ${response.status}`);
        return response.json() as Promise<OverloadReceipt>;
      })
      .then((next) => {
        if (!active) return;
        setReceipt(next);
        setSelectedMultiplier(next.metrics.sustained_overload.pairs.at(-1)?.multiplier ?? 5);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [loadRequested]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 100) {
          setPlaying(false);
          return 100;
        }
        return Math.min(100, current + 2);
      });
    }, 80);
    return () => window.clearInterval(timer);
  }, [playing]);

  const pair = useMemo(() => receipt?.metrics.sustained_overload.pairs.find((item) => item.multiplier === selectedMultiplier), [receipt, selectedMultiplier]);
  const gateCell = receipt?.gate.sustained_overload_cells.find((item) => item.multiplier === selectedMultiplier);
  const replayHash = RECEIPT_SHA256;

  function chooseMultiplier(multiplier: number) {
    setSelectedMultiplier(multiplier);
    setProgress(100);
    setPlaying(false);
  }

  return (
    <Exhibit
      id="exhibit-05"
      num="05"
      eyebrow="SAME-BOX A10 · SUSTAINED OVERLOAD"
      bg="ink"
      title={locale === "en" ? <>Reject the work<br /><em>before it becomes a crash.</em></> : <>先挡住多余的请求，<em>而不是等它把服务压垮。</em></>}
      intro={locale === "en"
        ? "Fixed-seed Poisson arrivals, same-box NVIDIA A10, every cell ran at least 120 seconds; each cell's queue was verified saturated."
        : "固定 seed 的 Poisson 到达序列，同机 A10，每个 cell 至少持续 120 秒，且已验证队列在每格都达到饱和。"}
    >
      <ScrollRegion className="forge-overload-summary" label={{ en: "Overload summary table", zh: "过载摘要表" }}>
        <table>
          <thead>
            <tr>
              <th>{locale === "en" ? "Multiplier" : "倍数"}</th>
              <th>{locale === "en" ? "Offered QPS" : "到达 QPS"}</th>
              <th>{locale === "en" ? "Requests" : "请求数"}</th>
              <th>HTTP 429</th>
              <th>{locale === "en" ? "Gateway upstream 5xx" : "网关上游 5xx"}</th>
              <th>{locale === "en" ? "Bare vLLM upstream 5xx" : "裸 vLLM 上游 5xx"}</th>
              <th>{locale === "en" ? "Gate" : "门禁"}</th>
            </tr>
          </thead>
          <tbody>
            {sustainedCells.map((cell) => (
              <tr key={cell.multiplier} data-multiplier={cell.multiplier}>
                <td><code>{cell.multiplier}×</code></td>
                <td><code>{cell.offered_qps}</code></td>
                <td><code>{cell.gateway_requests.toLocaleString("en-US")}</code></td>
                <td><code>{cell.http_429_count.toLocaleString("en-US")}</code></td>
                <td><code>{(cell.gateway_upstream_5xx_rate * 100).toFixed(1)}%</code></td>
                <td><code>{(cell.bare_vllm_upstream_5xx_rate * 100).toFixed(1)}%</code></td>
                <td><code data-gate-pass={cell.pass}>{cell.pass ? "PASS" : "FAIL"}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="forge-overload-highest">
          {locale === "en"
            ? `At the highest recorded load (${highestLoad.multiplier}×, ${highestLoad.offered_qps} QPS): bare vLLM logged ${highestLoad.bare_vllm_http_status_counts.transport_error} transport errors while the gateway returned ${highestLoad.gateway_http_status_counts["429"]} bounded HTTP 429 rejects and zero upstream 5xx.`
            : `在记录到的最高负载下（${highestLoad.multiplier} 倍，${highestLoad.offered_qps} QPS）：裸 vLLM 记录到 ${highestLoad.bare_vllm_http_status_counts.transport_error} 次传输错误，网关则返回 ${highestLoad.gateway_http_status_counts["429"]} 次有界 HTTP 429 拒绝，上游零 5xx。`}
        </p>
      </ScrollRegion>

      {!loadRequested ? (
        <button type="button" className="forge-overload-load-button" data-forge-load-replay onClick={() => setLoadRequested(true)}>
          {locale === "en"
            ? `LOAD RECORDED REPLAY (${(RECEIPT_BYTES / 1_000_000).toFixed(2)} MB)`
            : `加载完整回放收据（${(RECEIPT_BYTES / 1_000_000).toFixed(2)} MB）`}
        </button>
      ) : failed ? (
        <div className="forge-replay-error">{locale === "en" ? "The recorded overload receipt could not load." : "过载回放收据加载失败。"}</div>
      ) : !receipt || !pair ? (
        <div className="forge-replay-loading" aria-live="polite">{locale === "en" ? "Loading recorded overload receipt…" : "正在加载过载回放收据……"}</div>
      ) : (
        <section className="forge-replay" data-testid="forge-overload-replay" data-state="ready" aria-labelledby="forge-replay-title">
          <header>
            <div>
              <p className="eyebrow">{locale === "en" ? "Overload Replay" : "过载回放"} · RECORDED</p>
              <h3 id="forge-replay-title">{locale === "en" ? "Gateway fast rejection vs bare vLLM" : "网关快速拒绝 vs 裸 vLLM"}</h3>
            </div>
          </header>
          <div className="forge-replay-tabs" role="tablist" aria-label={locale === "en" ? "Overload multiplier" : "过载倍数"}>
            {receipt.metrics.sustained_overload.pairs.map((item) => (
              <button type="button" role="tab" aria-selected={selectedMultiplier === item.multiplier} onClick={() => chooseMultiplier(item.multiplier)} key={item.multiplier}>
                {item.multiplier}×<small>{item.offered_qps} QPS</small>
              </button>
            ))}
          </div>
          <div className="forge-replay-timeline">
            <div className="forge-timeline-labels">
              <span>0 s</span>
              <strong>{Math.round((pair.gateway.arrival_duration_s * progress) / 100)} s</strong>
              <span>{Math.round(pair.gateway.arrival_duration_s)} s</span>
            </div>
            <input type="range" min="0" max="100" value={progress} aria-label={locale === "en" ? "Replay time" : "回放时间"} onChange={(event) => { setProgress(Number(event.target.value)); setPlaying(false); }} />
            <div className="forge-replay-controls">
              <button type="button" onClick={() => { if (progress >= 100) setProgress(0); setPlaying((current) => !current); }}>{playing ? (locale === "en" ? "Pause" : "暂停") : (locale === "en" ? "Play" : "播放")}</button>
              <button type="button" onClick={() => { setPlaying(false); setProgress(0); }}>{locale === "en" ? "Reset" : "重置"}</button>
            </div>
          </div>
          <p className="forge-replay-receipt-boundary">
            {locale === "en"
              ? "The receipt contains final aggregate counts, not per-request timestamps; the slider traverses the recorded arrival window without interpolating results."
              : "收据只含最终聚合计数，不含逐请求时间戳；滑杆仅经过实测到达窗口，不插值生成中途结果。"}
          </p>
          <div className="forge-replay-comparison">
            <article data-series="gateway">
              <p className="eyebrow">C++20 Gateway</p>
              <h4>{locale === "en" ? "Bounded admission" : "有界准入"}</h4>
              <dl>
                <div><dt>HTTP 200</dt><dd>{pair.gateway.http_status_counts["200"] ?? 0}</dd></div>
                <div><dt>HTTP 429</dt><dd data-count="gateway-429">{pair.gateway.http_status_counts["429"] ?? 0}</dd></div>
                <div><dt>{locale === "en" ? "Upstream 5xx" : "上游 5xx"}</dt><dd>{pair.gateway.http_status_counts["500"] ?? 0}</dd></div>
                <div><dt>{locale === "en" ? "429 p95" : "429 p95"}</dt><dd>{pair.gateway.client.fast_reject.p95_s === null ? "—" : `${(pair.gateway.client.fast_reject.p95_s * 1000).toFixed(1)} ms`}</dd></div>
              </dl>
              <p>{locale === "en"
                ? `Queue high-watermark ${pair.gateway.gateway?.queue_high_watermark_process ?? "—"}; recorded upstream 5xx rate ${((gateCell?.gateway_upstream_5xx_rate ?? 0) * 100).toFixed(1)}%.`
                : `队列高水位 ${pair.gateway.gateway?.queue_high_watermark_process ?? "—"}；记录的上游 5xx 率为 ${((gateCell?.gateway_upstream_5xx_rate ?? 0) * 100).toFixed(1)}%。`}</p>
            </article>
            <article data-series="bare-vllm" data-finding={(pair.direct.http_status_counts.transport_error ?? 0) > 0 ? "negative" : undefined}>
              <p className="eyebrow">Bare vLLM</p>
              <h4>{(pair.direct.http_status_counts.transport_error ?? 0) > 0 ? (locale === "en" ? "EngineCore crash recorded" : "记录到 EngineCore 崩溃") : (locale === "en" ? "No admission layer" : "无准入层")}</h4>
              <dl>
                <div><dt>HTTP 200</dt><dd>{pair.direct.http_status_counts["200"] ?? 0}</dd></div>
                <div><dt>HTTP 500</dt><dd>{pair.direct.http_status_counts["500"] ?? 0}</dd></div>
                <div><dt>{locale === "en" ? "Transport errors" : "传输错误"}</dt><dd data-count="bare-transport">{pair.direct.http_status_counts.transport_error ?? 0}</dd></div>
                <div><dt>{locale === "en" ? "Scheduled" : "计划请求"}</dt><dd>{pair.direct.scheduled_arrivals}</dd></div>
              </dl>
              <p>{locale === "en" ? "One observed crash is retained as a negative result; it is not a universal protection guarantee." : "这次崩溃作为负结果保留；一次记录不能证明网关总能保护上游。"}</p>
            </article>
          </div>
          <footer><code>{receipt.run_id}</code><code title={replayHash}>SHA-256 {replayHash?.slice(0, 12)}…</code></footer>
        </section>
      )}
    </Exhibit>
  );
}

export default OverloadReplay;
