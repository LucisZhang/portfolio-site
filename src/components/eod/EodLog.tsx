"use client";

import { useMemo, useRef, useState } from "react";
import { InstrumentFrame } from "@/components/exhibition/InstrumentFrame";
import { useI18n } from "@/lib/i18n";
import {
  DEFAULT_LOG_ID,
  EOD_LOG_DISPLAY_ORDER,
  EOD_LOG_ORDER,
  formattedRecoverSeconds,
  highlightStations,
  liveTranscriptLines,
  logPosition,
  revealOffsetsFor,
  type LogEntryData,
  type TranscriptLine,
} from "./eodLogData";
import { eodReceiptsData, formattedEndToEndSeconds, formattedThroughput } from "./eodData";
import { loadGsap, type GsapModule } from "./gsapLoader";
import { buildReplaySegments } from "./replayTimeWarp";
import { useReducedMotion } from "./useReducedMotion";
import { zhGroup, zhWrapDisplay } from "@/lib/zh-wrap";

// Task F9: rebuild the Exactly-Once Drills first screen to the
// user-approved concept A, "值班日志 / Duty Logbook" — retiring the fault
// chessboard + pipeline-topology-diagram + throughput-curve + scrubber
// instrument (DrillBoard's interactive board, PipelineMap, ThroughputStrip,
// Scrubber) in favor of ten real log entries. Every entry is a native
// <details> whose dateline + one-line narrative sentence + transcript are
// server-rendered from src/data/generated/eod-log-summary.json (see
// eodLogData.ts) — no-JS gets the real content already inside the disclosure,
// zero fetches. Opening a closed entry (motion allowed) fetches that
// drill's real recorded file and re-derives the transcript via
// eodTimeline.ts's buildTimeline, then types it in at the real recorded
// pace via the existing lazy-GSAP time-warp machinery
// (gsapLoader.ts/replayTimeWarp.ts, reused verbatim from the retired
// Scrubber.tsx). prefers-reduced-motion never arms a replay — the native
// disclosure already reveals the complete real transcript instantly.
const HEADER_DATE = EOD_LOG_ORDER.find((e) => e.sameDay)?.startedAtIso.slice(0, 10) ?? EOD_LOG_ORDER[0].startedAtIso.slice(0, 10);

function headerDateDisplay(): string {
  const [y, m, d] = HEADER_DATE.split("-");
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  return `${Number(d)} ${months[Number(m) - 1]} ${y}`;
}

function phaseRange(): string {
  const numbers = EOD_LOG_ORDER.filter((e) => e.sameDay && e.phase && /^B\d+$/.test(e.phase))
    .map((e) => Number(e.phase!.slice(1)));
  if (numbers.length === 0) return "";
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);
  return min === max ? `B${min}` : `B${min}–B${max}`;
}

function dateline(entry: LogEntryData, open: boolean): string {
  const time = entry.sameDay ? entry.timeLabel : `${entry.dateLabel} ${entry.timeLabel}`;
  if (open) {
    const parts = [time, `PHASE ${entry.phase ?? "—"}`, entry.faultName, `RUN ${entry.runIdShort}`, `GIT ${entry.gitShaShort}`];
    return parts.join(" · ");
  }
  const middle = entry.seed !== null ? `SEED ${entry.seed}` : `PHASE ${entry.phase ?? "—"}`;
  return [time, middle, entry.faultName].join(" · ");
}

function Highlighted({ text, id }: { text: string; id: string }) {
  const parts = highlightStations(text, id);
  return (
    <>
      {parts.map((part, i) =>
        part.hit ? (
          <mark className="eod-log-hit" key={i}>{part.text}</mark>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </>
  );
}

type ReplayState = "idle" | "armed" | "done";

function EodLogEntry({ entry, defaultOpen, ordinal, total }: { entry: LogEntryData; defaultOpen: boolean; ordinal: number; total: number }) {
  const { locale } = useI18n();
  const reducedMotion = useReducedMotion();
  const [open, setOpen] = useState(defaultOpen);
  const [replayState, setReplayState] = useState<ReplayState>("idle");
  const [clockMs, setClockMs] = useState(0);
  const [liveLines, setLiveLines] = useState<TranscriptLine[] | null>(null);
  const fetchedRef = useRef(false);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  const lines = liveLines ?? entry.transcript;
  const offsets = useMemo(() => revealOffsetsFor(lines), [lines]);

  const replaying = replayState === "armed";
  const activeIndex = replaying ? offsets.findIndex((o) => clockMs < o) : -1;

  async function runReplay() {
    setReplayState("armed");
    let currentLines = liveLines;
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      try {
        const response = await fetch(entry.file);
        if (response.ok) {
          const json: unknown = await response.json();
          currentLines = liveTranscriptLines(entry.id, json);
          setLiveLines(currentLines);
        }
      } catch {
        // Keep the static (generated-summary) transcript on a failed
        // fetch — the replay still runs against real, already-present
        // data, just without the richer live re-derivation.
      }
    }
    const finalLines = currentLines ?? entry.transcript;
    const finalOffsets = revealOffsetsFor(finalLines);
    const finalMax = finalOffsets.length > 0 ? Math.max(...finalOffsets, 1) : 1;
    const gsap: GsapModule = await loadGsap();
    const segments = buildReplaySegments(finalOffsets, 0, finalMax);
    const proxy = { t: 0 };
    const tl = gsap.timeline({
      paused: true,
      onUpdate: () => setClockMs(proxy.t),
      onComplete: () => setReplayState("done"),
    });
    for (const segment of segments) {
      tl.to(proxy, { t: segment.toT, duration: segment.durationMs / 1000, ease: "power1.inOut" }, segment.startMs / 1000);
    }
    timelineRef.current = tl;
    tl.play();
  }

  function handleToggle(event: React.SyntheticEvent<HTMLDetailsElement>) {
    const isOpen = event.currentTarget.open;
    setOpen(isOpen);
    if (!isOpen) {
      timelineRef.current?.kill();
      setReplayState("idle");
      setClockMs(0);
      return;
    }
    if (reducedMotion) return;
    void runReplay();
  }

  const showProgress = replaying && activeIndex !== -1;
  const sentence = showProgress ? entry.sentenceProgress : entry.sentence;
  const sentenceText = locale === "en" ? sentence.en : sentence.zh;

  return (
    <details
      className={`eod-log-entry${open ? " eod-log-entry-open" : " eod-log-entry-closed"}`}
      data-log-entry
      data-drill-id={entry.id}
      data-replay-state={replayState}
      open={open}
      onToggle={handleToggle}
    >
      <summary className="eod-log-summary" data-log-summary>
        <div className="eod-log-summary-main">
          {defaultOpen ? (
            <span className="eod-log-pinned" data-log-pinned>
              {locale === "en" ? "PINNED · FEATURED RUN" : "置顶 · 精选记录 · PINNED"}
            </span>
          ) : null}
          <span className="eod-log-dateline" data-log-dateline>{dateline(entry, open)}</span>
          <p className="eod-log-sentence" data-log-sentence>
            <Highlighted text={sentenceText} id={entry.id} />
          </p>
        </div>
        <div className="eod-log-margin" data-log-margin>
          {replaying ? (
            <>
              <span className="eod-log-replaying">{locale === "en" ? "REPLAY" : "重放中 · REPLAY"}</span>
              <span className="eod-log-clock">{`t+${(clockMs / 1000).toFixed(1)} s`}</span>
              <span className="eod-log-total">{`of ${formattedRecoverSeconds(entry.recoverMs)}`}</span>
            </>
          ) : (
            <>
              <span className="eod-log-seconds">{formattedRecoverSeconds(entry.recoverMs)}</span>
              <span className="eod-log-diff">{`DIFF ${entry.diff}`}</span>
            </>
          )}
        </div>
      </summary>
      <div className="eod-log-body">
        <ol className="eod-log-transcript" data-log-transcript>
          {lines.map((line, index) => {
            const done = !replaying || index < activeIndex || activeIndex === -1;
            const isActive = replaying && index === activeIndex;
            const pending = replaying && activeIndex !== -1 && index > activeIndex;
            let shown = line.text;
            if (isActive) {
              const prev = index > 0 ? offsets[index - 1] : 0;
              const span = Math.max(1, offsets[index] - prev);
              const progress = Math.min(1, Math.max(0, (clockMs - prev) / span));
              shown = line.text.slice(0, Math.max(1, Math.round(line.text.length * progress)));
            }
            return (
              <li
                key={index}
                className={`eod-log-line${line.ok ? " eod-log-line-ok" : ""}${pending ? " eod-log-line-pending" : ""}`}
                data-log-line
                data-pending={pending ? "true" : "false"}
                data-typing={isActive ? "true" : "false"}
              >
                <span className="eod-log-line-offset">{line.offsetLabel === "T+—" ? "" : line.offsetLabel}</span>
                <span className="eod-log-line-text">
                  <Highlighted text={done ? line.text : shown} id={entry.id} />
                  {isActive ? <span className="eod-log-caret" aria-hidden="true" /> : null}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
      <span className="sr-only">
        {locale === "en" ? `Entry ${ordinal} of ${total}` : `第 ${ordinal} 条 / 共 ${total} 条`}
      </span>
    </details>
  );
}

export function EodLog({ glossZh }: { glossZh: string }) {
  const { locale } = useI18n();

  return (
    <section id="exhibit-01" data-project-section="hero" data-exhibit="01" data-bg="paper" className="exhibit eod-log-section" aria-labelledby="project-title">
      <p className="exhibit-opening-row">
        <span className="exhibit-number" aria-hidden="true">01</span>
        <span className="exhibit-eyebrow" data-eod-duty-meta>{locale === "en"
          ? `DUTY LOG · ${HEADER_DATE} · PHASE ${phaseRange()} · LOCAL LAB`
          : `值班日志 · DUTY LOG · ${HEADER_DATE} · 阶段 ${phaseRange()} · 本地实验室`}</span>
      </p>

      <h1 id="project-title" className="exhibit-title eod-log-title">
        {locale === "en" ? (
          <>Ten failure classes hit the same pipeline. <em>Snapshot diff never leaves zero.</em></>
        ) : (
          zhWrapDisplay(<>{zhGroup("十类故障打进", "同一条流水线，")}<em>{zhGroup("快照差异", "始终为零。")}</em></>)
        )}
      </h1>
      {/* Locale purity (task F5): zh-only gloss line, matching the same
          pattern every other exhibit hero uses (ForgePage/TriagePage/
          PrivacyPage) — must not render in en locale. */}
      {locale === "zh" ? <p className="cn-gloss" lang="zh">{zhWrapDisplay(glossZh)}</p> : null}
      <p className="exhibit-intro eod-log-dek">
        {locale === "en"
          ? "A dual-path pipeline: MySQL through Kafka and Flink into Iceberg. Every line below is copied from the real run recorded on 2026-08-20 — it is a log, not a diagram. Open any entry to replay that recovery."
          : "从 MySQL 经 Kafka、Flink 写入 Iceberg 的双路径管道。下面每一行都摘自 2026-08-20 的实测运行记录——是日志，不是示意图。点开任何一条，重放那次恢复。"}
      </p>

      <div className="eod-log-statline" data-eod-log-statline>
        <span className="eod-log-stat"><span className="eod-log-stat-n">{eodReceiptsData.drillCount}</span><span className="eod-log-stat-l">FAILURE CLASSES</span></span>
        <span className="eod-log-stat"><span className="eod-log-stat-n">{eodReceiptsData.allDiffsZero ? "0" : "—"}</span><span className="eod-log-stat-l">SNAPSHOT DIFFS</span></span>
        <span className="eod-log-stat"><span className="eod-log-stat-n">{formattedThroughput()}</span><span className="eod-log-stat-l">EVENTS / S</span></span>
      </div>
      <p className="eod-log-honesty">
        {locale === "en"
          ? `Throughput is a measured end-to-end figure: ${formattedEndToEndSeconds()}s from the first MySQL write to zero Iceberg backlog, including the injected broker outage.`
          : `吞吐为端到端实测：从第一条 MySQL 写入到 Iceberg 积压归零共 ${formattedEndToEndSeconds()} 秒，其中包含被注入的 broker 中断。`}
      </p>

      <div className="eod-loghead" data-eod-loghead>
        {locale === "en"
          ? `DUTY LOG — ${headerDateDisplay()} · ${EOD_LOG_ORDER.length} ENTRIES · ALL PASSED`
          : `值班日志 · DUTY LOG — ${headerDateDisplay()} · 共 ${EOD_LOG_ORDER.length} 条 · 全部通过`}
      </div>

      <InstrumentFrame variant="full">
        <div className="eod-log" data-eod-log data-instrument-body>
          {EOD_LOG_DISPLAY_ORDER.map((entry) => (
            <EodLogEntry
              key={entry.id}
              entry={entry}
              defaultOpen={entry.id === DEFAULT_LOG_ID}
              ordinal={logPosition(entry.id) + 1}
              total={EOD_LOG_ORDER.length}
            />
          ))}
        </div>
      </InstrumentFrame>
    </section>
  );
}
