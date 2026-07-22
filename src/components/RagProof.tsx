"use client";

import { Check, CircleAlert } from "lucide-react";
import dynamic from "next/dynamic";
import { useI18n } from "@/lib/i18n";
import ProjectProofSection from "./ProjectProofSection";

function RagLabLoading() {
  const { locale } = useI18n();
  return <div className="rag-lab-loading" aria-live="polite">{locale === "en" ? "Loading claim registry..." : "正在载入声明注册表……"}</div>;
}

const RagManifestDriftLab = dynamic(() => import("./rag/RagManifestDriftLab"), {
  loading: () => <RagLabLoading />,
});

export default function RagProof() {
  const { locale, dict } = useI18n();
  const checks = locale === "en" ? ["S1 corpus adapter", "S1-answerable question adapter", "Deterministic manifest", "Backend-aware verifier", "Retrieval contract layer", "Ruff and test suite"] : ["S1 语料适配器", "S1 可回答问题适配器", "确定性清单", "后端感知校验器", "检索契约层", "Ruff 与测试套件"];
  return (
    <ProjectProofSection title={dict.evidence} className="tinted-section">
      <div className="analytics-boundary"><CircleAlert aria-hidden="true" /><span>{locale === "en" ? "Why judge-free matters: hashed manifests catch corpus and claim drift before any quality claim ships." : "无需裁判模型的价值在于：带哈希的清单会在任何质量声明发布前捕获语料与声明漂移。"}</span></div>
      <RagManifestDriftLab />
      <div className="rag-floor">
        <div><span>{locale === "en" ? "Documents in the bounded S1 scope" : "S1 有界范围内文档"}</span><strong>11,309</strong></div>
        <div><span>{locale === "en" ? "S1-answerable questions" : "S1 可回答问题"}</span><strong>130</strong></div>
        <div><span>{locale === "en" ? "Passing tests" : "通过测试"}</span><strong>68</strong></div>
      </div>
      <div className="check-grid">{checks.map((item) => <span key={item}><Check aria-hidden="true" />{item}</span>)}</div>
      <aside className="rag-historical-result" aria-labelledby="rag-historical-title">
        <div className="panel-heading"><CircleAlert aria-hidden="true" /><div><strong id="rag-historical-title">{locale === "en" ? "Historical small-scale result" : "历史小规模结果"}</strong><span>{locale === "en" ? "Controlled 12-question corpus" : "受控的 12 问题语料"}</span></div></div>
        <div className="rag-historical-metrics">
          <div><span>{locale === "en" ? "Five-metric mean" : "五项指标均值"}</span><strong>0.8093 → 0.9438</strong><small>{locale === "en" ? "naive → hybrid/reranked · +16.6% relative" : "朴素检索 → 混合检索/重排 · 相对提升 16.6%"}</small></div>
          <div><span>{locale === "en" ? "Recall / hit" : "召回率 / 命中率"}</span><strong>0.9167 → 1.0</strong><small>{locale === "en" ? "historical controlled corpus" : "历史受控语料"}</small></div>
          <div><span>{locale === "en" ? "P95 latency" : "P95 延迟"}</span><strong>37.39 ms → 188.41 ms</strong><small>{locale === "en" ? "Pipeline A → Pipeline B" : "Pipeline A → Pipeline B"}</small></div>
        </div>
        <p className="rag-historical-scale"><strong>{locale === "en" ? "Historical indexing measurement:" : "历史索引测量："}</strong> 50,000 {locale === "en" ? "documents" : "份文档"} / 56,039 {locale === "en" ? "vectors" : "个向量"} · 691.17 s.</p>
      </aside>
    </ProjectProofSection>
  );
}
