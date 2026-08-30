"use client";

import { useId, useState } from "react";
import { useI18n } from "@/lib/i18n";
import samplesJson from "../../../public/case-studies/triage-router/samples.curated.json";

type CuratedSample = {
  complaintId: number;
  confidence: number | null;
  correct: boolean;
  narrative: string;
  predicted: string;
  runId: string;
  truth: string;
};

const samples = samplesJson as { configs: { key: string; samples: CuratedSample[] }[] };
// Tier A (TF-IDF LogReg) is the only config with a real per-sample
// confidence score comparable to the MISROUTE COST instrument's confidence
// threshold -- the two Claude tiers in samples.curated.json (haiku, sonnet)
// carry `confidence: null` because those tiers were never calibrated the
// same way (see task-3.0-report.md). Every number below opening this
// drawer (threshold, escalatePct, macroF1, monthlyCostCny) is therefore
// explained against these three real Tier A samples: which of them the
// CURRENT threshold would stop at TF-IDF, and which it would escalate.
const tierALogreg = samples.configs.find((config) => config.key === "tier_a_logreg")?.samples ?? [];

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max).trim()}…` : text;
}

// A single number (threshold/escalatePct/macroF1/monthlyCostCny) that,
// clicked, opens a <details> drawer -- spec §6.3: "every displayed number
// opens a drawer with 3 real samples for that config". No box, no icon:
// the drawer is a <details>/<summary> pair (native disclosure widget, works
// without JavaScript) styled with the page's hairline grammar.
export function SampleDrawerTrigger({ label, value, threshold }: { label: string; value: string; threshold: number }) {
  const { locale } = useI18n();
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <details className="triage-drawer" data-drawer open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary data-drawer-summary>
        <span className="triage-drawer-label">{label}</span>
        <span className="triage-drawer-value">{value}</span>
      </summary>
      <div className="triage-drawer-body" id={id} data-drawer-body>
        <p className="triage-drawer-caption">
          {locale === "en"
            ? "Tier A — TF-IDF LogReg, 3 real complaints, evaluated against the current threshold:"
            : "Tier A — TF-IDF LogReg，3 条真实工单，按当前阈值判定："}
        </p>
        <ul className="triage-drawer-samples">
          {tierALogreg.map((sample) => {
            const confidence = sample.confidence ?? 0;
            const stops = confidence >= threshold;
            return (
              <li key={sample.complaintId} data-drawer-sample data-route={stops ? "stop" : "escalate"}>
                <span className="triage-drawer-route">
                  {stops
                    ? (locale === "en" ? "STOPS AT TF-IDF" : "止步 TF-IDF")
                    : (locale === "en" ? "ESCALATES" : "升级人工")}
                </span>
                <span className="triage-drawer-confidence">conf {confidence.toFixed(3)}</span>
                <span className={`triage-drawer-verdict ${sample.correct ? "" : "triage-drawer-verdict-wrong"}`}>
                  {sample.correct
                    ? (locale === "en" ? "correct" : "预测正确")
                    : (locale === "en" ? `predicted ${sample.predicted}, truth ${sample.truth}` : `预测 ${sample.predicted}，实际 ${sample.truth}`)}
                </span>
                <p className="triage-drawer-narrative">{truncate(sample.narrative, 160)}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </details>
  );
}
