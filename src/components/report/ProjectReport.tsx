"use client";

import type { ReactNode } from "react";
import { useI18n, type LocalizedString } from "@/lib/i18n";
import type { Project } from "@/lib/projects";
import { zhWrapDisplay, zhWrapNode, zhWrapText } from "@/lib/zh-wrap";
import styles from "./ProjectReport.module.css";

export const REPORT_CONCEPTS = ["architecture", "results", "limitations"] as const;
export type ReportConcept = (typeof REPORT_CONCEPTS)[number];

const labels: Record<ReportConcept, LocalizedString> = {
  architecture: { en: "Architecture", zh: "架构" },
  results: { en: "Results", zh: "结果" },
  limitations: { en: "Limitations", zh: "局限与边界" },
};

export function reportAnchor(concept: ReportConcept) {
  return `report-${concept}`;
}

/** Plain fragment links work before hydration and preserve the current locale/query. */
export function ProjectReportContents() {
  const { locale } = useI18n();
  return (
    <nav className={styles.contents} aria-label={locale === "en" ? "Project report" : "项目报告"} data-report-contents>
      <div className={styles.contentsInner}>
        <p className={styles.contentsLabel}>{locale === "en" ? "Project report" : "项目报告"}</p>
        <ol>
          {REPORT_CONCEPTS.map((concept) => (
            <li key={concept}><a href={`#${reportAnchor(concept)}`}>{labels[concept][locale]}</a></li>
          ))}
        </ol>
      </div>
    </nav>
  );
}

/** A shared reading column, or an embedded heading for an existing instrument. */
export function ProjectReportSection({
  concept, children, title, layout = "reading", exhibit, hasNegatives = false,
}: {
  concept: ReportConcept;
  children: ReactNode;
  title?: ReactNode;
  layout?: "reading" | "instrument";
  exhibit?: { id: string; num: string };
  hasNegatives?: boolean;
}) {
  const { locale } = useI18n();
  const anchor = reportAnchor(concept);
  const labelId = `${anchor}-label`;
  const heading = concept === "results" && hasNegatives
    ? (locale === "en" ? "Results & negatives" : "结果与负结果")
    : labels[concept][locale];
  const headingContent = exhibit
    ? zhWrapDisplay(title ?? heading)
    : zhWrapNode(title ?? heading);
  return (
    <section
      id={exhibit?.id ?? `${anchor}-section`}
      className={`${styles.section} ${layout === "instrument" ? styles.instrument : ""}`}
      data-report-section={concept}
      data-project-section={concept === "architecture" ? "how" : concept}
      data-exhibit={exhibit?.num}
      data-bg={exhibit ? "paper" : undefined}
      aria-labelledby={title ? `${labelId} ${anchor}` : anchor}
    >
      <div className={styles.content}>
        {title ? <p id={labelId} className={styles.label}>{exhibit ? `${exhibit.num} / ` : ""}{labels[concept][locale]}</p> : null}
        <h2 id={anchor} className={styles.heading} tabIndex={-1} data-zh-display={exhibit ? "" : undefined}>
          {exhibit ? <span id={`${exhibit.id}-title`}>{headingContent}</span> : headingContent}
        </h2>
        {children}
      </div>
    </section>
  );
}

/** One numbered list and one boundary rule, following Frontier Forge's hierarchy. */
export function ProjectReportFindings({ items, kind }: { items: readonly LocalizedString[]; kind: "negative" | "limitation" }) {
  const { locale } = useI18n();
  if (!items.length) return null;
  return (
    <ol className={styles.findings} data-findings={kind} data-finding={kind} data-limitations={kind === "limitation" ? "" : undefined}>
      {items.map((item, index) => (
        <li key={item.en}>
          <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
          <p>{zhWrapText(item[locale])}</p>
        </li>
      ))}
    </ol>
  );
}

type ReportSource = Pick<Project, "role" | "architecture" | "outcome" | "fieldNotes" | "boundaries">;

/** Content stays with its project; this adapter only removes repeated report markup. */
export function ProjectReport({ project, sections = REPORT_CONCEPTS }: { project: ReportSource; sections?: readonly ReportConcept[] }) {
  const { locale } = useI18n();
  return (
    <>
      {sections.includes("architecture") && project.architecture.length ? (
        <ProjectReportSection concept="architecture">
          {project.role[locale] ? <p>{zhWrapText(project.role[locale])}</p> : null}
          <ol className={styles.architecture}>
            {project.architecture.map((step, index) => (
              <li key={step.label.en}>
                <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <div><strong>{zhWrapText(step.label[locale])}</strong><p>{zhWrapText(step.detail[locale])}</p></div>
              </li>
            ))}
          </ol>
        </ProjectReportSection>
      ) : null}
      {sections.includes("results") && (project.outcome[locale] || project.fieldNotes?.length) ? (
        <ProjectReportSection concept="results" hasNegatives={Boolean(project.fieldNotes?.length)}>
          {project.outcome[locale] ? <p className="project-outcome">{zhWrapText(project.outcome[locale])}</p> : null}
          <ProjectReportFindings items={project.fieldNotes ?? []} kind="negative" />
        </ProjectReportSection>
      ) : null}
      {sections.includes("limitations") && project.boundaries.length ? (
        <ProjectReportSection concept="limitations">
          <ProjectReportFindings items={project.boundaries} kind="limitation" />
        </ProjectReportSection>
      ) : null}
    </>
  );
}
