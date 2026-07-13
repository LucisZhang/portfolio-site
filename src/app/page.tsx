"use client";

import { ArrowUpRight, CheckCircle2, FileText, Github, Linkedin, Mail } from "lucide-react";
import LocaleLink from "@/components/LocaleLink";
import { localize, LocalizedText, useI18n } from "@/lib/i18n";
import { featuredProjects, tracks } from "@/lib/projects";
import { siteIdentity } from "@/lib/site-config";

const status: Record<string, { en: string; zh: string }> = {
  "release-guardian": { en: "Live evaluation + demo", zh: "已评估运行 + 回放演示" },
  "p1-reliability-lab": { en: "Recorded recovery replay", zh: "已记录的故障恢复回放" },
  "rag-quality-lab": { en: "Data and test baseline", zh: "数据与测试基线已核实" },
  "privacy-preflight-mac": { en: "Local browser workflow", zh: "浏览器本地工作区" },
  "margin-control-tower": { en: "Synthetic margin demo", zh: "合成毛利演示" },
  "credit-policy-lab": { en: "Synthetic policy demo", zh: "合成策略演示" },
};

export default function Home() {
  const { locale, dict } = useI18n();
  return (
    <main>
      <section className="workspace-head page-shell">
        <div>
          <p className="eyebrow">{locale === "en" ? "Data analytics · Data engineering · Applied AI" : "数据分析 · 数据工程 · AI 应用"}</p>
          <h1>{locale === "en" ? siteIdentity.name : siteIdentity.chineseName}</h1>
          <p className="lede">{localize(siteIdentity.positioning, locale)}</p>
          <div className="identity-links" aria-label={locale === "en" ? "Contact and profiles" : "联系方式与主页"}>
            <a href={siteIdentity.profiles.github}><Github aria-hidden="true" /><span>GitHub</span><ArrowUpRight aria-hidden="true" /></a>
            <a href={siteIdentity.profiles.linkedin}><Linkedin aria-hidden="true" /><span>LinkedIn</span><ArrowUpRight aria-hidden="true" /></a>
            <a href={`mailto:${siteIdentity.profiles.email}`}><Mail aria-hidden="true" /><span>Email</span></a>
            {siteIdentity.resume.href ? <a href={siteIdentity.resume.href}><FileText aria-hidden="true" /><span>Resume</span></a> : <span className="identity-link-pending" title={locale === "en" ? siteIdentity.resume.todo : siteIdentity.resume.todoZh}><FileText aria-hidden="true" /><span>Resume</span><small>{locale === "en" ? "updating" : "更新中"}</small></span>}
          </div>
        </div>
        <div className="workspace-index" aria-label={locale === "en" ? "Portfolio index" : "作品集索引"}>
          <span><strong>06</strong>{locale === "en" ? "case studies" : "个案例"}</span>
          <span><strong>03</strong>{locale === "en" ? "disciplines" : "个方向"}</span>
          <span><CheckCircle2 aria-hidden="true" />{locale === "en" ? "results explained" : "结果有说明"}</span>
        </div>
      </section>

      <section className="discipline-strip" aria-label={locale === "en" ? "Disciplines" : "方向"}>
        <div className="page-shell">
          {tracks.map((track) => <LocaleLink href={`/${track.id}`} key={track.id}><strong><LocalizedText text={track.label} /></strong><span><LocalizedText text={track.thesis} /></span></LocaleLink>)}
        </div>
      </section>

      <section className="project-index page-shell">
        <div className="index-heading"><h2>{dict.navWork}</h2><p>{locale === "en" ? "Open any project to see what I built, how it works, and what the result does not prove." : "打开任意项目，查看我做了什么、如何运作，以及结果不能说明什么。"}</p></div>
        <div className="project-table">
          {featuredProjects.map((project, index) => (
            <LocaleLink key={project.slug} href={`/${project.track}/${project.slug}`}>
              <span className="project-number">{String(index + 1).padStart(2, "0")}</span>
              <span className="project-name"><strong>{localize(project.title, locale)}</strong><small>{localize(project.eyebrow, locale)}</small></span>
              <span className="project-summary">{localize(project.summary, locale)}</span>
              <span className="project-status"><CheckCircle2 aria-hidden="true" />{status[project.slug][locale]}</span>
              <ArrowUpRight aria-label={dict.inspectProject} />
            </LocaleLink>
          ))}
        </div>
      </section>
    </main>
  );
}
