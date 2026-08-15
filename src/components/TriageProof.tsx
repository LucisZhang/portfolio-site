"use client";

import { useState } from "react";
import { Check, CircleAlert } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import ProjectProofSection from "./ProjectProofSection";

type TierId = "linear" | "distilbert" | "haiku" | "sonnet";

interface TierDrift {
  id: TierId;
  label: string;
  cost: { en: string; zh: string };
  values: [number, number, number, number];
  note: { en: string; zh: string };
}

// Values quoted from nlp-eval-lab results/runs.jsonl via EXPERIMENT_LOG.md
// (drift entries dated 2026-08-09 and 2026-08-12). Yearly TEST-DRIFT macro-F1.
const DRIFT_TIERS: TierDrift[] = [
  {
    id: "linear",
    label: "Tier A · TF-IDF + LogReg",
    cost: { en: "≈ free, CPU", zh: "≈ 零成本，CPU" },
    values: [0.758, 0.748, 0.730, 0.666],
    note: {
      en: "Falls 9.2 points by 2026-H1. Decomposition attributes 4.2 of those points to class mix alone — credit-report complaints collapsed from F1 0.887 to 0.215.",
      zh: "到 2026 上半年掉了 9.2 个百分点。分解显示其中 4.2 个百分点纯粹来自类别构成变化——征信类投诉的 F1 从 0.887 塌到 0.215。",
    },
  },
  {
    id: "distilbert",
    label: "Tier B2 · DistilBERT int8",
    cost: { en: "one fine-tune, then in-browser", zh: "一次微调，此后可在浏览器内运行" },
    values: [0.790, 0.774, 0.760, 0.726],
    note: {
      en: "Tracks the linear tier's fall — which is exactly what the pre-registered hypothesis said it would not do. Its drop splits between class-mix shift and within-class decay.",
      zh: "跟着线性层一起往下掉——而预先登记的假设恰恰说它不会这样。它的下跌一半来自类别构成变化，一半来自类内衰减。",
    },
  },
  {
    id: "haiku",
    label: "Tier C · Claude Haiku",
    cost: { en: "$1.315 / 1k complaints · p50 1.38 s", zh: "$1.315 / 千条投诉 · p50 1.38 秒" },
    values: [0.738, 0.740, 0.726, 0.728],
    note: {
      en: "Stays flat across four drift slices while the trained tiers fall. Zero-shot, no fitted vocabulary to go stale.",
      zh: "四个漂移切片上基本走平，而训练出来的层级在下跌。零样本，没有会过期的拟合词表。",
    },
  },
  {
    id: "sonnet",
    label: "Tier C · Claude Sonnet",
    cost: { en: "$3.659 / 1k complaints · p50 3.17 s", zh: "$3.659 / 千条投诉 · p50 3.17 秒" },
    values: [0.741, 0.738, 0.723, 0.782],
    note: {
      en: "Gains ground exactly where the others lose it: +0.054 F1 over Haiku on the 2026-H1 slice (95% CI +0.036 to +0.073, paired).",
      zh: "在其他层级失守的地方反而在涨：2026 上半年切片上比 Haiku 高 +0.054 F1（95% CI +0.036 ~ +0.073，配对比较）。",
    },
  },
];

const SLICES = ["2023", "2024", "2025", "2026-H1"];
const BAR_MIN = 0.6;
const BAR_MAX = 0.82;

export default function TriageProof() {
  const { locale, dict } = useI18n();
  const [tierId, setTierId] = useState<TierId>("linear");
  const tier = DRIFT_TIERS.find((t) => t.id === tierId) ?? DRIFT_TIERS[0];
  const checks = locale === "en"
    ? ["Isotonic-calibrated baselines", "3-seed ModernBERT fine-tunes", "Explicit cost model", "Thresholds fit on calibration only", "Append-only results log", "In-browser int8 inference demo"]
    : ["等渗校准的基线", "三个 seed 的 ModernBERT 微调", "显式成本模型", "阈值只在校准集上拟合", "只增结果日志", "浏览器内 int8 推理演示"];
  return (
    <ProjectProofSection title={dict.evidence} className="tinted-section">
      <aside className="rag-historical-result" aria-labelledby="triage-frontier-title">
        <div className="panel-heading"><CircleAlert aria-hidden="true" /><div><strong id="triage-frontier-title">{locale === "en" ? "The frontier, before the router" : "路由之前的成本-质量前沿"}</strong><span>{locale === "en" ? "Held-out test macro-F1 · 95% bootstrap CIs in the results log" : "留出测试集 macro-F1 · 95% 自举置信区间见结果日志"}</span></div></div>
        <div className="rag-historical-metrics">
          <div><span>{locale === "en" ? "Linear baseline" : "线性基线"}</span><strong>0.7605</strong><small>{locale === "en" ? "TF-IDF + LogReg · ≈ free" : "TF-IDF + 逻辑回归 · ≈ 零成本"}</small></div>
          <div><span>{locale === "en" ? "Best fine-tune" : "最好的微调层"}</span><strong>0.7950</strong><small>{locale === "en" ? "DistilBERT int8 · runs in-browser" : "DistilBERT int8 · 可在浏览器内运行"}</small></div>
          <div><span>{locale === "en" ? "Router vs baseline" : "路由较基线"}</span><strong>+0.0370 · −$120.58/1k</strong><small>{locale === "en" ? "quality up, expected cost down" : "质量上升，预期成本下降"}</small></div>
        </div>
        <p className="rag-historical-scale"><strong>{locale === "en" ? "The point:" : "重点在于："}</strong> {locale === "en" ? "the LLM tiers are not the best classifiers here — they are the most drift-resistant ones. The router buys each complaint the cheapest tier that can handle it." : "在这个任务上，LLM 层并不是最准的分类器——而是最抗漂移的。路由为每条投诉买到能处理它的最便宜一层。"}</p>
      </aside>
      <section className="triage-drift" aria-labelledby="triage-drift-title">
        <div><p className="eyebrow">{locale === "en" ? "Eleven years of measured drift" : "十一年实测漂移"}</p><h3 id="triage-drift-title">{locale === "en" ? "Pick a tier, watch what 2026 does to it" : "选一个层级，看 2026 年对它做了什么"}</h3></div>
        <div className="triage-drift-tabs" role="tablist" aria-label={locale === "en" ? "Model tier" : "模型层级"}>
          {DRIFT_TIERS.map((t) => (
            <button key={t.id} role="tab" aria-selected={t.id === tierId} onClick={() => setTierId(t.id)}>
              <span>{t.label}</span>
              <code>{locale === "en" ? t.cost.en : t.cost.zh}</code>
            </button>
          ))}
        </div>
        <div className="triage-drift-bars">
          {tier.values.map((value, index) => {
            const width = Math.max(4, ((value - BAR_MIN) / (BAR_MAX - BAR_MIN)) * 100);
            return (
              <div key={SLICES[index]} className="triage-drift-row">
                <span>{SLICES[index]}</span>
                <div aria-hidden="true"><i style={{ width: `${width}%` }} /></div>
                <strong>{value.toFixed(3)}</strong>
              </div>
            );
          })}
        </div>
        <p className="triage-drift-note">{locale === "en" ? tier.note.en : tier.note.zh}</p>
      </section>
      <div className="analytics-boundary"><CircleAlert aria-hidden="true" /><span>{locale === "en" ? "The first explanation — new vocabulary the old models never saw — was tested and ruled out: out-of-vocabulary mass barely moved. The cliff is class mix, and the drilldown lives in the results log." : "第一个解释——旧模型没见过的新词——经过检验被排除了：词表外占比几乎没动。悬崖来自类别构成，细节都在结果日志里。"}</span></div>
      <div className="rag-floor">
        <div><span>{locale === "en" ? "Committed outputs byte-identical on full re-run" : "完整重跑后字节一致的已提交产物"}</span><strong>27 / 27</strong></div>
        <div><span>{locale === "en" ? "End-to-end reproduction on a 16 GB laptop" : "16 GB 笔记本上端到端复现用时"}</span><strong>12 h 53 m</strong></div>
        <div><span>{locale === "en" ? "Bootstrap resamples behind every interval" : "每个置信区间背后的自举重采样次数"}</span><strong>1,000</strong></div>
      </div>
      <div className="check-grid">{checks.map((item) => <span key={item}><Check aria-hidden="true" />{item}</span>)}</div>
    </ProjectProofSection>
  );
}
