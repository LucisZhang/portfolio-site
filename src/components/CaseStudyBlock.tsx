"use client";

import { ExternalLink } from "lucide-react";
import ArtifactLink from "@/components/ArtifactLink";
import { isArtifactPath } from "@/lib/artifacts";
import { LocalizedText, useI18n } from "@/lib/i18n";
import type { Project } from "@/lib/projects";

export default function CaseStudyBlock({ project }: { project: Project }) {
  const { dict } = useI18n();
  const rows = [
    { label: dict.problem, value: project.problem },
    { label: dict.audience, value: project.audience },
    { label: dict.role, value: project.role },
    { label: dict.verifiedOutcome, value: project.outcome },
  ];

  return (
    <section className="case-intro page-shell" aria-labelledby="project-title">
      <div className="case-title">
        <p className="eyebrow"><LocalizedText text={project.eyebrow} /></p>
        <h1 id="project-title"><LocalizedText text={project.title} /></h1>
        <p className="lede"><LocalizedText text={project.summary} /></p>
        <div className="tag-list" aria-label={dict.stack}>
          {project.stack.map((item) => <span key={item}>{item}</span>)}
        </div>
      </div>

      <dl className="case-facts">
        {rows.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd><LocalizedText text={row.value} /></dd>
          </div>
        ))}
        <div>
          <dt>{dict.links}</dt>
          <dd className="link-list">
            {project.links.length ? project.links.map((link, index) => {
              if (!link.href) return (
                <span className="source-pending" key={`pending-${index}`} aria-disabled="true">
                  <LocalizedText text={link.label} />
                  {link.pending ? <small><LocalizedText text={link.pending} /></small> : null}
                </span>
              );
              const external = link.href.startsWith("http");
              if (isArtifactPath(link.href)) return (
                <ArtifactLink key={link.href} href={link.href}>
                  <LocalizedText text={link.label} />
                </ArtifactLink>
              );
              return (
                <a key={link.href} href={link.href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}>
                  <LocalizedText text={link.label} />
                  {external ? <><ExternalLink aria-hidden="true" /><span className="sr-only">{dict.externalLink}</span></> : null}
                </a>
              );
            }) : <span className="muted">{dict.noPublicLink}</span>}
          </dd>
        </div>
      </dl>
    </section>
  );
}
