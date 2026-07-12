"use client";

import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { localize, LocalizedText, useI18n } from "@/lib/i18n";
import { featuredProjects, tracks } from "@/lib/projects";

const status: Record<string, { en: string; zh: string }> = {
  "release-guardian": { en: "Live eval audited", zh: "在线评估已审计" },
  "p1-reliability-lab": { en: "Local reproduction captured", zh: "本地复现已捕获" },
  "rag-quality-lab": { en: "C2 floor verified", zh: "C2 基线已核实" },
  "privacy-preflight-mac": { en: "Source + demo", zh: "源码 + 演示" },
  "analytics-tandem": { en: "Qualitative public proof", zh: "定性公开证据" },
};

export default function Home() {
  const { locale, dict } = useI18n();
  return (
    <main>
      <section className="workspace-head page-shell">
        <div>
          <p className="eyebrow">{dict.navWork}</p>
          <h1>{locale === "en" ? "Systems, evidence, boundaries." : "系统、证据、边界。"}</h1>
          <p className="lede">{locale === "en" ? "Five inspectable case studies across release engineering, data reliability, RAG evaluation, privacy tooling, and analytics." : "五个可检查案例，覆盖发布工程、数据可靠性、RAG 评估、隐私工具与数据分析。"}</p>
        </div>
        <div className="workspace-index" aria-label={locale === "en" ? "Portfolio index" : "作品集索引"}>
          <span><strong>05</strong>{locale === "en" ? "case studies" : "个案例"}</span>
          <span><strong>03</strong>{locale === "en" ? "disciplines" : "个方向"}</span>
          <span><CheckCircle2 aria-hidden="true" />{locale === "en" ? "claims scoped" : "声明有边界"}</span>
        </div>
      </section>

      <section className="discipline-strip" aria-label={locale === "en" ? "Disciplines" : "方向"}>
        <div className="page-shell">
          {tracks.map((track) => <Link href={`/${track.id}`} key={track.id}><strong><LocalizedText text={track.label} /></strong><span><LocalizedText text={track.thesis} /></span></Link>)}
        </div>
      </section>

      <section className="project-index page-shell">
        <div className="index-heading"><h2>{dict.navWork}</h2><p>{locale === "en" ? "Open a project to inspect its architecture, evidence source, provenance, and limits." : "打开项目，检查其架构、证据来源、沿革与限制。"}</p></div>
        <div className="project-table">
          {featuredProjects.map((project, index) => (
            <Link key={project.slug} href={`/${project.track}/${project.slug}`}>
              <span className="project-number">{String(index + 1).padStart(2, "0")}</span>
              <span className="project-name"><strong>{localize(project.title, locale)}</strong><small>{localize(project.eyebrow, locale)}</small></span>
              <span className="project-summary">{localize(project.summary, locale)}</span>
              <span className="project-status"><CheckCircle2 aria-hidden="true" />{status[project.slug][locale]}</span>
              <ArrowUpRight aria-label={dict.inspectProject} />
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
