"use client";

import CreditProof from "@/components/CreditProof";
import LocaleLink from "@/components/LocaleLink";
import MarginProof from "@/components/MarginProof";
import P1Proof from "@/components/P1Proof";
import PrivacyProof from "@/components/PrivacyProof";
import ProjectProofSection from "@/components/ProjectProofSection";
import RagProof from "@/components/RagProof";
import ReleaseGuardianProof from "@/components/ReleaseGuardianProof";
import { LocalizedText, useI18n } from "@/lib/i18n";
import type { Project, ProjectId } from "@/lib/projects";

export {
  CreditProof,
  MarginProof,
  P1Proof,
  PrivacyProof,
  RagProof,
  ReleaseGuardianProof,
};

function AnalyticsMigrationProof() {
  const { locale, dict } = useI18n();
  return (
    <ProjectProofSection title={dict.evidence} className="tinted-section">
      <div className="analytics-migration"><p className="eyebrow">{locale === "en" ? "Legacy route migration" : "旧路由迁移"}</p><h3>{locale === "en" ? "Analytics Tandem has been split into two operable case studies" : "原 Analytics Tandem 已拆分为两个可独立运行的案例研究"}</h3><p>{locale === "en" ? "This compatibility page preserves the old URL. Choose the rebuilt decision workflow that matches your review." : "此兼容页面保留旧 URL。请选择符合评审方向的重建决策流程。"}</p><div><LocaleLink href="/analytics/margin-control-tower"><strong>{locale === "en" ? "Margin Control Tower" : "毛利控制塔"}</strong><span>{locale === "en" ? "Analytics engineering, governed margin diagnosis, scenario verification" : "分析工程、治理约束下的毛利诊断、情景验证"}</span></LocaleLink><LocaleLink href="/analytics/credit-policy-lab"><strong>{locale === "en" ? "Credit Policy Lab" : "信贷策略实验室"}</strong><span>{locale === "en" ? "Risk calibration, expected loss, policy thresholds, monitoring" : "风险校准、预期损失、策略阈值、监控"}</span></LocaleLink></div></div>
      <div className="analytics-pair">
        <article><p>{locale === "en" ? "Business intelligence" : "商业智能"}</p><h3>{locale === "en" ? "E-commerce funnel, RFM, and segmentation" : "电商漏斗、RFM 与客户分群"}</h3><span>{locale === "en" ? "A public Tableau surface for inspecting customer movement and segment views. No funnel or segment figures are quoted here." : "通过公开 Tableau 界面检查客户流转与分群视图；本页不引用漏斗或分群数字。"}</span></article>
        <article><p>{locale === "en" ? "Model interaction" : "模型交互"}</p><h3>{locale === "en" ? "Bilingual risk exploration" : "双语风险探索"}</h3><span>{locale === "en" ? "A Streamlit demo for model switching, synthetic inputs, and a predict_proba-driven approve-or-block interaction. No validation metric is claimed." : "Streamlit 演示支持模型切换、合成输入，以及由 predict_proba 驱动的批准或拦截交互；不声明验证指标。"}</span></article>
      </div>
    </ProjectProofSection>
  );
}

function Architecture({ project }: { project: Project }) {
  const { dict } = useI18n();
  return (
    <ProjectProofSection title={dict.architecture}>
      <ol className="architecture-flow">
        {project.architecture.map((step, index) => <li key={step.label.en}><span>{String(index + 1).padStart(2, "0")}</span><div><strong><LocalizedText text={step.label} /></strong><p><LocalizedText text={step.detail} /></p></div></li>)}
      </ol>
    </ProjectProofSection>
  );
}

function Notes({ project }: { project: Project }) {
  const { dict } = useI18n();
  return (
    <section className="notes-section">
      <div className="page-shell notes-grid notes-grid-single">
        <div><h2>{dict.boundaries}</h2><ul>{project.boundaries.map((item) => <li key={item.en}><LocalizedText text={item} /></li>)}</ul></div>
      </div>
    </section>
  );
}

const proofByProject: Record<ProjectId, () => React.JSX.Element> = {
  "release-guardian": ReleaseGuardianProof,
  "p1-reliability-lab": P1Proof,
  "rag-quality-lab": RagProof,
  "privacy-preflight-mac": PrivacyProof,
  "margin-control-tower": MarginProof,
  "credit-policy-lab": CreditProof,
  "analytics-tandem": AnalyticsMigrationProof,
};

export default function ProjectProof({ project }: { project: Project }) {
  const Proof = proofByProject[project.slug];
  return <><Architecture project={project} /><Proof /><Notes project={project} /></>;
}
