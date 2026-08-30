"use client";

import { ArrowLeft } from "lucide-react";
import CaseStudyBlock from "@/components/CaseStudyBlock";
import LocaleDocumentMetadata from "@/components/LocaleDocumentMetadata";
import LocaleLink from "@/components/LocaleLink";
import ProjectProof from "@/components/ProjectProof";
import { frontierProjectDetail } from "@/lib/frontier-project-detail";
import { useI18n } from "@/lib/i18n";
import type { Project } from "@/lib/projects";
import { siteIdentity } from "@/lib/site-config";
import styles from "./ProjectPageView.module.css";

export default function ProjectPageView({ project }: { project: Project }) {
  const { dict } = useI18n();
  const detailedProject = project.slug === "frontier-forge" ? { ...project, ...frontierProjectDetail } : project;
  return (
    <div className={styles.projectPage}>
      <LocaleDocumentMetadata
        title={{ en: `${project.title.en} | ${siteIdentity.name}`, zh: `${project.title.zh} | ${siteIdentity.chineseName}` }}
        description={project.summary}
      />
      <div className="project-back"><LocaleLink href={`/${project.track}`} className="back-link"><ArrowLeft aria-hidden="true" />{dict.backToTrack}</LocaleLink></div>
      <CaseStudyBlock project={detailedProject} />
      <ProjectProof project={detailedProject} />
    </div>
  );
}
