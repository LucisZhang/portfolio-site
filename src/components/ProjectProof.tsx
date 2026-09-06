"use client";

import { ExternalLink } from "lucide-react";
import ArtifactLink from "@/components/ArtifactLink";
import CreditProof from "@/components/CreditProof";
import CrossoverProof from "@/components/CrossoverProof";
import LocaleLink from "@/components/LocaleLink";
import MarginProof from "@/components/MarginProof";
import ProjectProofSection from "@/components/ProjectProofSection";
import RagProof from "@/components/RagProof";
import { isArtifactPath } from "@/lib/artifacts";
import { LocalizedText, useI18n } from "@/lib/i18n";
import type { Project, ProjectId } from "@/lib/projects";

export {
  CreditProof,
  CrossoverProof,
  MarginProof,
  RagProof,
};

function AnalyticsMigrationProof() {
  const { locale, dict } = useI18n();
  return (
    <ProjectProofSection title={dict.evidence} className="tinted-section">
      <div className="analytics-migration"><p className="eyebrow">{locale === "en" ? "Legacy route migration" : "旧路由迁移"}</p><h3>{locale === "en" ? "Analytics Tandem has been split into two operable case studies" : "原 Analytics Tandem 已拆分为两个可独立运行的案例研究"}</h3><p>{locale === "en" ? "This compatibility page preserves the old URL. Choose the rebuilt decision workflow that matches your review." : "此兼容页面保留旧 URL。请选择符合评审方向的重建决策流程。"}</p><div><LocaleLink href="/analytics/margin-control-tower"><strong>Margin Control Tower</strong><span>{locale === "en" ? "Analytics engineering, governed margin diagnosis, scenario verification" : "分析工程、治理约束下的毛利诊断、情景验证"}</span></LocaleLink><LocaleLink href="/analytics/credit-policy-desk"><strong>{locale === "en" ? "Credit Policy Desk" : "分数不是策略。"}</strong><span>{locale === "en" ? "Risk calibration, expected loss, policy thresholds, monitoring" : "风险校准、预期损失、策略阈值、监控"}</span></LocaleLink></div></div>
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
    <ProjectProofSection title={dict.architecture} sectionId="how">
      <p className="project-role"><LocalizedText text={project.role} /></p>
      <ol className="architecture-flow">
        {project.architecture.map((step, index) => <li key={step.label.en}><span>{String(index + 1).padStart(2, "0")}</span><div><strong><LocalizedText text={step.label} /></strong><p><LocalizedText text={step.detail} /></p></div></li>)}
      </ol>
    </ProjectProofSection>
  );
}

function Results({ project }: { project: Project }) {
  const { locale } = useI18n();
  return (
    <ProjectProofSection title={locale === "en" ? "Results & negative findings" : "结果与负结果"} sectionId="results" className="project-results">
      <p className="project-outcome"><LocalizedText text={project.outcome} /></p>
      {project.fieldNotes?.length ? <ol className="result-findings">{project.fieldNotes.map((note) => <li className="negative-finding" key={note.en}><p><LocalizedText text={note} /></p></li>)}</ol> : null}
    </ProjectProofSection>
  );
}

function Limitations({ project }: { project: Project }) {
  const { dict, locale } = useI18n();
  return (
    <section className="notes-section" data-project-section="limitations">
      <h2>{locale === "en" ? "Limitations" : "局限与边界"}</h2>
      <div className="notes-grid">
      <div><h2>{dict.provenance}</h2><ul>{project.provenance.map((item) => <li key={item.en}><LocalizedText text={item} /></li>)}</ul></div>
      <div><h2>{dict.boundaries}</h2><ul>{project.boundaries.map((item) => <li key={item.en}><LocalizedText text={item} /></li>)}</ul></div>
      </div>
    </section>
  );
}

function ProjectLinks({ project }: { project: Project }) {
  const { dict } = useI18n();
  if (!project.links.length) return null;
  return (
    <ProjectProofSection title={dict.links} sectionId="links" className="project-links-section">
      <div className="link-list">
        {project.links.length ? project.links.map((link, index) => {
          if (!link.href) return (
            <span className="source-pending" key={`pending-${index}`} aria-disabled="true">
              <LocalizedText text={link.label} />
              {link.pending ? <small><LocalizedText text={link.pending} /></small> : null}
            </span>
          );
          const external = link.href.startsWith("http");
          const download = /\.zip(?:[?#]|$)/i.test(link.href);
          if (isArtifactPath(link.href)) return <ArtifactLink key={link.href} href={link.href}><LocalizedText text={link.label} /></ArtifactLink>;
          return (
            <a key={`${link.href}-${index}`} href={link.href} download={download || undefined} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}>
              <LocalizedText text={link.label} />
              {external ? <><ExternalLink aria-hidden="true" /><span className="sr-only">{dict.externalLink}</span></> : null}
            </a>
          );
        }) : <span className="muted">{dict.noPublicLink}</span>}
      </div>
    </ProjectProofSection>
  );
}

// "frontier-forge", "exactly-once-drills", "triage-router", and
// "privacy-preflight" are deliberately absent: tasks 2.2, 2.3, 3.1, and
// 3.2 gave them their own standalone route compositions
// (src/components/forge/ForgePage.tsx, src/components/eod/EodPage.tsx,
// src/components/triage/TriagePage.tsx, src/components/privacy/PrivacyPage.tsx,
// via src/app/[track]/[project]/page.tsx), so none of the four ever reaches
// ProjectProof. Task L1 gives "release-guardian" the same treatment
// (src/components/guardian/GuardianPage.tsx, via its own literal route
// src/app/ai/release-guardian/page.tsx) -- ReleaseGuardianProof.tsx and
// src/components/release/ReleaseChangeReplay.tsx are deleted, fully
// superseded, no remaining references.
const proofByProject: Partial<Record<ProjectId, () => React.JSX.Element>> = {
  "rag-quality-lab": RagProof,
  "margin-control-tower": MarginProof,
  "crossover-study": CrossoverProof,
  "credit-policy-desk": CreditProof,
  "analytics-tandem": AnalyticsMigrationProof,
};

export default function ProjectProof({ project }: { project: Project }) {
  const Proof = proofByProject[project.slug];
  if (!Proof) throw new Error(`No proof component is registered for routable project ${project.slug}`);
  // The interactive proof is the first thing after the intro: a visitor who
  // only reads one screen should get the running instrument, not the diagram.
  return <><div data-project-section="proof"><Proof /></div><Architecture project={project} /><Results project={project} /><Limitations project={project} /><ProjectLinks project={project} /></>;
}
