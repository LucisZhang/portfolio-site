"use client";

import { useEffect, useRef, useState } from "react";
import { InstrumentFrame } from "@/components/exhibition/InstrumentFrame";
import { useI18n } from "@/lib/i18n";
import {
  cardForThreshold,
  cards,
  DEFAULT_MISROUTE_INDEX,
  DEFAULT_THRESHOLD_INDEX,
  fillCardTokens,
  FrontierChart,
  matrix,
} from "./FrontierChart";
import { LocalInference } from "./LocalInference";
import { SampleDrawerTrigger } from "./SampleDrawer";
import { commaInt, grouped, macroF1 as fmtMacroF1, percent, strategySlug } from "./triageFormat";

// Task D-03: the instrument's four reading steps. English mono UI fabric
// with an independent zh line each -- same bilingual ternary convention as
// the slider labels below.
const STEP_LABELS = {
  control: { en: "CONTROL", zh: "控制" },
  reading: { en: "CURRENT READING", zh: "当前读数" },
  interpretation: { en: "INTERPRETATION", zh: "解读" },
  detail: { en: "DETAIL", zh: "明细" },
} as const;

function StepLabel({ step, locale }: { step: keyof typeof STEP_LABELS; locale: string }) {
  return <p className="triage-step-label">{locale === "en" ? STEP_LABELS[step].en : STEP_LABELS[step].zh}</p>;
}

export function PolicyTerminal({ variant }: { variant: "compact" | "full" }) {
  const { locale } = useI18n();
  const [misrouteIndex, setMisrouteIndex] = useState(DEFAULT_MISROUTE_INDEX);
  const [copiedSyntax, setCopiedSyntax] = useState(false);
  const copiedTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(copiedTimer.current), []);
  const [thresholdIndex, setThresholdIndex] = useState(DEFAULT_THRESHOLD_INDEX);

  const row = matrix.rows[misrouteIndex][thresholdIndex];
  const card = cardForThreshold(cards, row.threshold);
  const copy = locale === "en" ? card.copyEn : card.copyZh;
  const filled = fillCardTokens(copy, row);
  const slug = strategySlug(card.name);
  const escalatedTickets = Math.round((row.escalatePct / 100) * 1000);
  const misrouteRange = [matrix.misrouteCosts[0], matrix.misrouteCosts.at(-1)!];
  const thresholdRange = [matrix.thresholds[0], matrix.thresholds.at(-1)!];
  const misrouteScaleId = `triage-misroute-scale-${variant}`;
  const thresholdScaleId = `triage-threshold-scale-${variant}`;

  return (
    <InstrumentFrame variant={variant}>
      <div className="triage-terminal" data-triage-terminal data-variant={variant}>
        <div className="triage-step triage-step-control" data-step="control">
          <StepLabel step="control" locale={locale} />
          <FrontierChart misrouteIndex={misrouteIndex} thresholdIndex={thresholdIndex} />

          <div className="triage-slider-row">
            <label htmlFor={`triage-misroute-${variant}`}>
              <span className="triage-slider-label">{locale === "en" ? "MISROUTE COST SENSITIVITY (USD)" : "误分流成本敏感度（USD）"}</span>
              <span className="triage-slider-value" data-misroute-value>USD {grouped(row.misrouteCostUsd, 2)}</span>
            </label>
            <input
              id={`triage-misroute-${variant}`}
              type="range"
              data-misroute-slider
              min={0}
              max={matrix.misrouteCosts.length - 1}
              step={1}
              value={misrouteIndex}
              aria-describedby={misrouteScaleId}
              aria-valuetext={locale === "en"
                ? `USD ${grouped(row.misrouteCostUsd, 2)} misroute-cost sensitivity; recorded range USD ${grouped(misrouteRange[0], 2)} to USD ${grouped(misrouteRange[1], 2)}`
                : `误分流成本敏感度 USD ${grouped(row.misrouteCostUsd, 2)}；记录范围 USD ${grouped(misrouteRange[0], 2)} 至 USD ${grouped(misrouteRange[1], 2)}`}
              onChange={(event) => setMisrouteIndex(Number(event.target.value))}
            />
            <span className="triage-slider-scale" id={misrouteScaleId}>
              {locale === "en" ? "Recorded sensitivity range" : "记录敏感度范围"}: USD {grouped(misrouteRange[0], 2)} — USD {grouped(misrouteRange[1], 2)}
            </span>
          </div>

          <div className="triage-slider-row">
            <label htmlFor={`triage-threshold-${variant}`}>
              <span className="triage-slider-label">{locale === "en" ? "CONFIDENCE THRESHOLD" : "置信度阈值"}</span>
              <span className="triage-slider-value" data-threshold-value>{row.threshold.toFixed(3)}</span>
            </label>
            <input
              id={`triage-threshold-${variant}`}
              type="range"
              data-threshold-slider
              min={0}
              max={matrix.thresholds.length - 1}
              step={1}
              value={thresholdIndex}
              aria-describedby={thresholdScaleId}
              aria-valuetext={locale === "en"
                ? `Confidence threshold ${row.threshold.toFixed(3)}; recorded range ${thresholdRange[0].toFixed(3)} to ${thresholdRange[1].toFixed(3)}`
                : `置信度阈值 ${row.threshold.toFixed(3)}；记录范围 ${thresholdRange[0].toFixed(3)} 至 ${thresholdRange[1].toFixed(3)}`}
              onChange={(event) => setThresholdIndex(Number(event.target.value))}
            />
            <span className="triage-slider-scale" id={thresholdScaleId}>
              {locale === "en" ? "Recorded threshold range" : "记录阈值范围"}: {thresholdRange[0].toFixed(3)} — {thresholdRange[1].toFixed(3)}
            </span>
          </div>
        </div>

        <div className="triage-step triage-step-reading" data-step="reading">
          <StepLabel step="reading" locale={locale} />
          <div className="triage-readout-row" data-readout-row>
            <SampleDrawerTrigger label={locale === "en" ? "threshold" : "阈值"} value={row.threshold.toFixed(3)} threshold={row.threshold} />
            <SampleDrawerTrigger label={locale === "en" ? "escalate" : "升级率"} value={percent(row.escalatePct)} threshold={row.threshold} />
            <SampleDrawerTrigger label="macro-F1" value={`${fmtMacroF1(row.macroF1)} [${fmtMacroF1(row.ci[0])}, ${fmtMacroF1(row.ci[1])}]`} threshold={row.threshold} />
            <SampleDrawerTrigger label={locale === "en" ? "monthly cost (USD / 1k)" : "月成本（USD / 千条）"} value={`USD ${grouped(row.monthlyCostUsd)}`} threshold={row.threshold} />
          </div>
        </div>

        <div className="triage-step triage-step-interpretation" data-step="interpretation">
          <StepLabel step="interpretation" locale={locale} />
          <p className="triage-strategy-card" data-strategy-card data-strategy-name={slug}>{filled}</p>

          <p className="triage-headcount-line">
            {locale === "en"
              ? `≈ ${commaInt(escalatedTickets)} of every 1,000 complaints/month reach a human reviewer at this setting.`
              : `按此设置，每月每 1,000 条工单约有 ${commaInt(escalatedTickets)} 条会转到人工复核。`}
          </p>

          <p className="triage-syntax-line">
            <code data-syntax-line>{`triage:${slug}`}</code>
            <button
              type="button"
              data-copy-syntax
              onClick={() => {
                navigator.clipboard?.writeText(`triage:${slug}`).catch(() => {});
                // Task D05: the label is React-owned (the zh JSX runtime wraps
                // "复制" in word units), so it flips through state rather than
                // an imperative textContent write that would orphan those nodes.
                setCopiedSyntax(true);
                window.clearTimeout(copiedTimer.current);
                copiedTimer.current = window.setTimeout(() => setCopiedSyntax(false), 1200);
              }}
            >
              {copiedSyntax ? (locale === "en" ? "COPIED" : "已复制") : (locale === "en" ? "COPY" : "复制")}
            </button>
          </p>
        </div>

        {variant === "full" ? (
          <div className="triage-step triage-step-detail" data-step="detail">
            <StepLabel step="detail" locale={locale} />
            <p className="triage-academic-anchor" data-academic-anchor>
              cascade threshold, cf. RouteLLM (Ong et al., 2024)
            </p>
            {/* The three numbers quoted here (86,972 / 104,443 / 2026-08-12)
                are not fields inside this task's five registered compact
                payloads -- they are cross-file provenance, read from the
                nlp-eval-lab source repository (same convention as
                ForgeConsole.tsx's SERVING_HARDWARE_LABEL constant):
                  86,972  = nlp-eval-lab/demo/data/calibration.json
                            $.exhibits[0].n (slice="cal"),
                            the CAL-slice size the threshold sweep behind
                            policies.compact.json (task 3.0's
                            a_to_human__full_cal__... source) was fit on.
                  104,443 = the frozen TEST-IID slice size, corroborated in
                            calibration.json $.exhibits[2].n (slice=
                            "test_iid"), frontier.json, case_study.json, and
                            drift.json -- this is what per-threshold macro-F1
                            would need to be computed on the full sweep
                            instead of the 200-sample curated proxy this page
                            actually uses.
                  2026-08-12 = meta.json's headline_router.note ("Owner
                            decision 2026-08-12") and drift.json's own
                            generated_at date, both in the same evidence
                            generation batch as the grid.
                Registered in docs/evidence/digits-triage.md. */}
            <p className="triage-disclosure" data-disclosure lang={locale === "zh" ? "zh" : undefined}>
              {locale === "en"
                ? "Disclosure: the escalation/cost grid is built from real offline replay of 86,972 calibration-slice complaints, not simulation (dated 2026-08-12). Misroute-cost sensitivity and normalized monthly-cost projections use the recorded USD basis; no currency conversion is applied. Monthly cost is normalized per 1,000 complaints and is not a production invoice. Per-threshold macro-F1 and its confidence interval are computed on a 200-sample curated paired set, not the full 104,443-row TEST-IID sweep. Macro-F1 near 100% escalation reflects human-credit accounting, not router quality."
                : "口径声明：升级率与成本网格来自 86,972 条校准切片真实工单的离线回放，不是模拟结果（数据截至 2026-08-12）。误分流成本敏感度和归一化月成本推算均沿用记录中的 USD 口径，不做币种换算。月成本按每 1,000 条投诉归一化，不是真实账单。逐阈值的宏 F1 和置信区间只算在 200 条精选配对样本上，不是全量 104,443 条 TEST-IID 的扫描结果。升级率接近 100% 时宏 F1 趋近于 1，这是把人工判定记为正确的记账口径，不代表路由器本身判别力强。"}
            </p>
            <LocalInference />
          </div>
        ) : null}
      </div>
    </InstrumentFrame>
  );
}

export default PolicyTerminal;
