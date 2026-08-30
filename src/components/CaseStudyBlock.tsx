"use client";

import { LocalizedText, localize, useI18n } from "@/lib/i18n";
import type { Project } from "@/lib/projects";

function heroMetrics(project: Project, locale: "en" | "zh") {
  if (project.slug === "analytics-tandem") {
    return locale === "en"
      ? ["Legacy migration route", "2 successor case studies", "0 carried-over figures"]
      : ["旧版迁移路由", "2 个后继案例", "0 个沿用指标"];
  }
  const metrics = localize(project.metrics, locale).split(" · ").filter(Boolean);
  if (project.slug === "privacy-preflight" && metrics.length === 4) {
    return [metrics[0], `${metrics[1]} · ${metrics[2]}`, metrics[3]];
  }
  return metrics.slice(0, 3);
}

export default function CaseStudyBlock({ project }: { project: Project }) {
  const { locale, dict } = useI18n();
  const metrics = heroMetrics(project, locale);

  return (
    <section className="case-intro" data-project-section="hero" aria-labelledby="project-title">
      <div className="case-title">
        <p className="eyebrow"><LocalizedText text={project.eyebrow} /></p>
        <h1 id="project-title"><LocalizedText text={project.title} /></h1>
        <p className="cn-gloss">{project.glossZh}</p>
        {project.slug === "frontier-forge" ? <p className="forge-honesty-note">{locale === "en" ? "All numbers are recorded from on-demand GPU runs; commands and hashes included." : "所有数字来自按需 GPU 实测记录，附命令与哈希。"}</p> : null}
        <p className="lede"><LocalizedText text={project.summary} /></p>
        <div className="project-stat-grid" aria-label={dict.verifiedOutcome}>
          {metrics.map((metric) => <div key={metric}><span>{metric}</span></div>)}
        </div>
        {project.problem.en || project.audience.en ? <div className="project-context">
          <p><LocalizedText text={project.problem} /></p>
          <p><LocalizedText text={project.audience} /></p>
        </div> : null}
        <div className="tag-list" aria-label={dict.stack}>
          {project.stack.map((item) => <LocalizedText className="tag" key={item.en} text={item} />)}
        </div>
      </div>
    </section>
  );
}
