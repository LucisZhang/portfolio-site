"use client";

import { useState } from "react";
import { Check, CircleAlert } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import ProjectProofSection from "./ProjectProofSection";

type StageId = "raw" | "gate" | "core";

interface WaterfallStage {
  id: StageId;
  label: { en: string; zh: string };
  rows: string;
  delta: { en: string; zh: string };
  detail: { en: string[]; zh: string[] };
}

// Counts quoted from batch-recsys-lab EXPERIMENT_LOG.md (2026-08-05 reconciliation
// waterfall) and data/MANIFEST.md. 43,886,944 − 2 − 477,968 − 43,550 = 43,365,424;
// 43,365,424 − 27,891,888 = 15,473,536.
const STAGES: WaterfallStage[] = [
  {
    id: "raw",
    label: { en: "Raw bronze", zh: "原始 bronze 层" },
    rows: "43,886,944",
    delta: { en: "landed as-is", zh: "原样落库" },
    detail: {
      en: [
        "43,886,944 reviews and 1,610,012 items land in schema-enforced Iceberg tables.",
        "Review text and image fields are projected out up front, and the projection is documented.",
        "Items pass through with zero quarantine loss; 316 of 1,610,012 prices are unparseable and ledgered.",
      ],
      zh: [
        "43,886,944 条评论与 1,610,012 件商品落入强制 schema 的 Iceberg 表。",
        "评论正文与图片字段在入口处即被剔除，且剔除有文档记录。",
        "商品全部通过，无隔离损失；1,610,012 个价格中有 316 个无法解析，已入台账。",
      ],
    },
  },
  {
    id: "gate",
    label: { en: "Contract gate", zh: "契约门禁" },
    rows: "43,365,424",
    delta: { en: "−521,520 rows, each counted", zh: "−521,520 行，每行有计数" },
    detail: {
      en: [
        "2 rating-domain violations rejected out of 43.9M — and after the gate, zero remain.",
        "477,968 exact duplicates and 43,550 superseded records dropped, both ledgered.",
        "Foreign-key check against the item table: 0 orphan rows out of 43,365,424.",
      ],
      zh: [
        "43.9M 行里拒掉 2 行评分越界记录——过闸之后一行不剩。",
        "剔除 477,968 条完全重复与 43,550 条被覆盖的记录，均有台账。",
        "对商品表做外键检查：43,365,424 行中孤儿行为 0。",
      ],
    },
  },
  {
    id: "core",
    label: { en: "Five-core", zh: "五核过滤" },
    rows: "15,473,536",
    delta: { en: "−27,891,888 to the modeling set", zh: "−27,891,888 行进入建模集" },
    detail: {
      en: [
        "Iterative filtering to users and items with at least five interactions converges in 16 rounds.",
        "18.3M users reduce to 1.64M; 1.61M items reduce to 368k.",
        "Nearly all reduction happens in rounds 0–7; the tail rounds shave fewer than 200 rows in total.",
      ],
      zh: [
        "迭代过滤到交互数不少于 5 的用户与商品，16 轮收敛。",
        "18.3M 用户缩减到 1.64M；1.61M 件商品缩减到 368k。",
        "几乎全部缩减发生在第 0–7 轮；后面的轮次总共只削掉不到 200 行。",
      ],
    },
  },
];

export default function CrossoverProof() {
  const { locale, dict } = useI18n();
  const [stageId, setStageId] = useState<StageId>("gate");
  const stage = STAGES.find((s) => s.id === stageId) ?? STAGES[0];
  const checks = locale === "en"
    ? ["Schema-enforced bronze tables", "Dedup and supersede ledger", "Frozen temporal splits", "Full-catalog ranking, no sampled negatives", "User-bootstrap confidence intervals", "A receipt behind every number"]
    : ["强制 schema 的 bronze 表", "去重与覆盖台账", "冻结的时间切分", "全目录排序，不做负采样", "用户自举置信区间", "每个数字背后都有凭据"];
  return (
    <ProjectProofSection title={dict.evidence} className="tinted-section">
      <figure className="figure" aria-labelledby="crossover-waterfall-title">
        <div className="fig-title"><p className="eyebrow">{locale === "en" ? "Reconciliation waterfall" : "对账瀑布"}</p><h3 id="crossover-waterfall-title">{locale === "en" ? "43.9M rows in, 15.5M rows out — click a stage to see where the rest went" : "进来 43.9M 行，出去 15.5M 行——点开每一级，看其余的行去了哪"}</h3></div>
        <div className="crossover-stage-tabs" role="tablist" aria-label={locale === "en" ? "Pipeline stage" : "管线阶段"}>
          {STAGES.map((s) => (
            <button key={s.id} role="tab" aria-selected={s.id === stageId} onClick={() => setStageId(s.id)}>
              <span>{locale === "en" ? s.label.en : s.label.zh}</span>
              <strong>{s.rows}</strong>
              <code>{locale === "en" ? s.delta.en : s.delta.zh}</code>
            </button>
          ))}
        </div>
        <ul className="crossover-stage-detail">
          {(locale === "en" ? stage.detail.en : stage.detail.zh).map((line) => <li key={line}>{line}</li>)}
        </ul>
        <figcaption className="fig-caption">
          <span className="fig-source">{locale === "en" ? "Source · the project's reconciliation waterfall and data manifest." : "来源 · 项目的对账瀑布与数据清单。"}</span>
        </figcaption>
      </figure>
      <div className="analytics-boundary"><CircleAlert aria-hidden="true" /><span>{locale === "en" ? "The lab was built to find the history depth where personalization starts beating popularity, and to route users accordingly. The measured answer on this data: that depth was never reached. The result stays published as measured." : "这个实验的目标是找到个性化开始赢过热门榜的历史深度，并据此路由用户。这份数据上的实测答案是：这个深度从未到达。结果按实测原样发布。"}</span></div>
      <div className="rag-floor">
        <div><span>{locale === "en" ? "Orphan rows in the foreign-key check" : "外键检查中的孤儿行"}</span><strong>0</strong></div>
        <div><span>{locale === "en" ? "Rounds for five-core convergence" : "五核过滤收敛轮数"}</span><strong>16</strong></div>
        <div><span>{locale === "en" ? "Items ranked per query, full catalog" : "每次查询参与排序的全目录商品数"}</span><strong>368,228</strong></div>
      </div>
      <div className="check-grid">{checks.map((item) => <span key={item}><Check aria-hidden="true" />{item}</span>)}</div>
    </ProjectProofSection>
  );
}
