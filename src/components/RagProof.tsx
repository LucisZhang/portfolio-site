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
  const pipeline = locale === "en" ? [
    ["01 · Lock", "Pin the EnterpriseRAG-Bench S1 source slice and license boundary."],
    ["02 · Adapt", "Normalize 5,189 Confluence and 6,120 Jira records into 11,309 documents."],
    ["03 · Manifest", "Write deterministic counts, hashes, adapter identity, and generation parameters."],
    ["04 · Map", "Bind 130 S1-answerable questions to the bounded evaluation scope."],
    ["05 · Preflight", "Validate the backend contract, corpus identity, and output destination before a run."],
    ["06 · Run or stop", "Invoke the retrieval runner only when every gate passes; C3 stopped without a metric."],
  ] : [
    ["01 · 锁定", "固定 EnterpriseRAG-Bench S1 源切片与许可证边界。"],
    ["02 · 适配", "将 5,189 条 Confluence 与 6,120 条 Jira 记录规范化为 11,309 份文档。"],
    ["03 · 清单", "写入确定性的数量、哈希、适配器身份与生成参数。"],
    ["04 · 映射", "将 130 个 S1 可回答问题绑定到有界评估范围。"],
    ["05 · 预检", "运行前校验后端契约、语料身份与输出位置。"],
    ["06 · 运行或停止", "仅在全部闸门通过后调用检索 runner；C3 未产生指标即停止。"],
  ];
  return (
    <ProjectProofSection title={dict.evidence} className="tinted-section">
      <div className="analytics-boundary"><CircleAlert aria-hidden="true" /><span>{locale === "en" ? "Why judge-free matters: hashed manifests catch corpus and claim drift before any quality claim ships." : "无需裁判模型的价值在于：带哈希的清单会在任何质量声明发布前捕获语料与声明漂移。"}</span></div>
      <section className="rag-c2-pipeline" aria-labelledby="rag-c2-pipeline-title">
        <div><p className="eyebrow">C2 · {locale === "en" ? "Tracked implementation" : "已跟踪实现"}</p><h3 id="rag-c2-pipeline-title">{locale === "en" ? "From licensed source slice to a gated evaluation run" : "从获许可源切片到受门控评估运行"}</h3><p>{locale === "en" ? "The public repository now contains the adapters, question set, manifest writer, runner seam, backend contract, and tests. The ~88 MB generated knowledge base is reproducible but intentionally excluded from Git." : "公开仓库现已包含适配器、问题集、清单写入器、runner 接口、后端契约与测试。约 88 MB 的生成知识库可复现，但有意不提交到 Git。"}</p></div>
        <ol>{pipeline.map(([label, detail]) => <li key={label}><strong>{label}</strong><span>{detail}</span></li>)}</ol>
      </section>
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
