"use client";

import { ArrowLeft } from "lucide-react";
import CaseStudyBlock from "@/components/CaseStudyBlock";
import LocaleDocumentMetadata from "@/components/LocaleDocumentMetadata";
import LocaleLink from "@/components/LocaleLink";
import ProjectProof from "@/components/ProjectProof";
import { useI18n } from "@/lib/i18n";
import type { Project } from "@/lib/projects";
import { siteIdentity } from "@/lib/site-config";

export default function ProjectPageView({ project }: { project: Project }) {
  const { dict } = useI18n();
  return (
    <main>
      <LocaleDocumentMetadata
        title={{ en: `${project.title.en} | ${siteIdentity.name}`, zh: `${project.title.zh} | ${siteIdentity.chineseName}` }}
        description={project.summary}
      />
      <div className="page-shell project-back"><LocaleLink href={`/${project.track}`} className="back-link"><ArrowLeft aria-hidden="true" />{dict.backToTrack}</LocaleLink></div>
      <CaseStudyBlock project={project} />
      <ProjectProof project={project} />
    </main>
  );
}
