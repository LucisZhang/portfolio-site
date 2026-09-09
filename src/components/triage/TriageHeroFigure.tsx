"use client";

import { useI18n } from "@/lib/i18n";
import { DEFAULT_MISROUTE_INDEX, DEFAULT_THRESHOLD_INDEX, FrontierChart, matrix } from "./FrontierChart";
import { commaInt, macroF1 as fmtMacroF1 } from "./triageFormat";

// Hero right column, Option B (user ruling, task W2 / output/design-align-r4/
// triage-hero-b.html): the naked frontier curve ONLY -- hairline
// cost-accuracy curve + the single vermilion point, as a pure figure. No
// sliders, no strategy card, no terminal chrome above the fold; that
// interaction lives exclusively in the full instrument (exhibit 01,
// PolicyTerminal variant="full") below. This renders at the SAME default
// operating point PolicyTerminal opens on (same matrix, same default
// indices, imported from FrontierChart.tsx) so the figure is not a second,
// divergent read of the data -- it is the resting state of the same chart.
export function TriageHeroFigure() {
  const { locale } = useI18n();
  const row = matrix.rows[DEFAULT_MISROUTE_INDEX][DEFAULT_THRESHOLD_INDEX];
  const escalatedTickets = Math.round((row.escalatePct / 100) * 1000);

  return (
    <figure className="triage-hero-figure" data-hero-figure>
      <FrontierChart misroutePosition={DEFAULT_MISROUTE_INDEX} thresholdIndex={DEFAULT_THRESHOLD_INDEX} />
      <figcaption>
        {/* Mono/uppercase technical labels, unconditionally English -- same
            convention as this page's exhibit-eyebrow tags and stat labels
            (TriagePage.tsx's own comment on StatGrid: "English mono labels
            regardless of locale"). matrix.thresholds.length is read from the
            payload, never typed in. */}
        <span>Tier frontier &middot; {matrix.thresholds.length} thresholds</span>
        <span className="triage-hero-figure-point">
          &#9679; {row.threshold.toFixed(3)} &middot; macro-F1 {fmtMacroF1(row.macroF1)}
        </span>
      </figcaption>
      <p className="triage-hero-figure-fineprint">
        {locale === "en"
          ? `≈ ${commaInt(escalatedTickets)} of every 1,000 complaints/month reach a human reviewer at this setting.`
          : `按此设置，每月每 1,000 条工单约有 ${commaInt(escalatedTickets)} 条会转到人工复核。`}
      </p>
    </figure>
  );
}

export default TriageHeroFigure;
