"use client";

import { useI18n } from "@/lib/i18n";
import { repositoryNewTabLabel, type Project } from "@/lib/projects";
import styles from "./ProjectRepositoryEntry.module.css";

/** One entry before the exhibits, including the legacy route; absent on non-project pages. */
export default function ProjectRepositoryEntry({ project }: { project: Pick<Project, "title" | "slug" | "repository"> }) {
  const { locale } = useI18n();
  const { repository } = project;

  return (
    <div className={styles.entry} data-project-repository={project.slug} data-repository-status={repository.status}>
      {repository.status === "public" ? (
        <a className={styles.link} href={repository.href} target="_blank" rel="noopener noreferrer">
          {repository.label[locale]}
          <span aria-hidden="true">↗</span>
          <span className="sr-only">{` — ${project.title[locale]} — ${repositoryNewTabLabel[locale]}`}</span>
        </a>
      ) : (
        <div className={styles.unavailable}>
          <strong>{repository.label[locale]}</strong>
          <p>{repository.reason[locale]}</p>
        </div>
      )}
    </div>
  );
}
