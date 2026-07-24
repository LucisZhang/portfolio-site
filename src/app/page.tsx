"use client";

import { ArrowUpRight, CheckCircle2, Github, Linkedin, Mail } from "lucide-react";
import LucisOrbit from "@/components/LucisOrbit";
import LocaleLink from "@/components/LocaleLink";
import LocaleDocumentMetadata from "@/components/LocaleDocumentMetadata";
import PhoneContact from "@/components/PhoneContact";
import WeChatContact from "@/components/WeChatContact";
import { localize, LocalizedText, useI18n } from "@/lib/i18n";
import { featuredProjects, tracks } from "@/lib/projects";
import { siteIdentity, siteMetadata } from "@/lib/site-config";

const status: Record<string, { en: string; zh: string }> = {
  "release-guardian": { en: "Live evaluation + demo", zh: "已评估运行 + 回放演示" },
  "p1-reliability-lab": { en: "Recorded recovery replay", zh: "已记录的故障恢复回放" },
  "rag-quality-lab": { en: "Data and test baseline", zh: "数据与测试基线已核实" },
  "privacy-preflight-mac": { en: "Local browser workflow", zh: "浏览器本地工作区" },
  "margin-control-tower": { en: "Interactive decision workbench", zh: "交互式决策工作台" },
  "credit-policy-lab": { en: "Score-to-policy simulator", zh: "从评分到策略的模拟器" },
};

function MetricsChips({ value }: { value: string }) {
  return <span className="metrics-chips">{value.split(" · ").map((metric) => <small key={metric}>{metric}</small>)}</span>;
}

export default function Home() {
  const { locale, dict } = useI18n();
  return (
    <main>
      <LocaleDocumentMetadata title={siteMetadata.title} description={siteMetadata.description} />
      <section className="workspace-head page-shell">
        <div>
          <p className="eyebrow">{locale === "en" ? "AI applications · Data engineering · Data analytics" : "AI 应用 · 数据工程 · 数据分析"}</p>
          <div className="identity-title"><h1>{locale === "en" ? siteIdentity.name : siteIdentity.chineseName}</h1></div>
          <div className="identity-mark"><LucisOrbit /></div>
          <p className="lede">{localize(siteIdentity.positioning, locale)}</p>
          <p className="target-roles">{dict.targetRoles}</p>
          <div className="identity-links" id="contact" style={{ scrollMarginTop: 92 }} aria-label={locale === "en" ? "Contact and profiles" : "联系方式与主页"}>
            <a href={siteIdentity.profiles.github} target="_blank" rel="noreferrer noopener"><Github aria-hidden="true" /><span>GitHub</span><ArrowUpRight aria-hidden="true" /></a>
            {locale === "en" ? <a href={siteIdentity.profiles.linkedin} target="_blank" rel="noreferrer noopener"><Linkedin aria-hidden="true" /><span>LinkedIn</span><ArrowUpRight aria-hidden="true" /></a> : null}
            <PhoneContact />
            <a href={`mailto:${siteIdentity.profiles.email}`}><Mail aria-hidden="true" /><span>{locale === "en" ? "Email" : "邮箱"}</span></a>
            <WeChatContact />
          </div>
        </div>
        <div className="workspace-index" aria-label={locale === "en" ? "Portfolio index" : "作品集索引"}>
          <span><strong>06</strong>{locale === "en" ? "case studies" : "个案例"}</span>
          <span><strong>03</strong>{locale === "en" ? "disciplines" : "个方向"}</span>
          <span><CheckCircle2 aria-hidden="true" />{locale === "en" ? "6 interactive demos" : "6 个交互式演示"}</span>
        </div>
      </section>

      <section className="discipline-strip" aria-label={locale === "en" ? "Disciplines" : "方向"}>
        <div className="page-shell">
          {tracks.map((track) => <LocaleLink href={`/${track.id}`} key={track.id}><strong><LocalizedText text={track.label} /></strong><span><LocalizedText text={track.thesis} /></span></LocaleLink>)}
        </div>
      </section>

      <section className="project-index page-shell">
        <div className="index-heading"><h2>{dict.navWork}</h2><p>{locale === "en" ? "Open any project to see what I built, how it works, and how to verify it." : "打开任意项目，了解我做了什么、项目如何运作，以及如何验证结果。"}</p></div>
        <div className="project-table">
          {featuredProjects.map((project, index) => (
            <LocaleLink key={project.slug} href={`/${project.track}/${project.slug}`}>
              <span className="project-number">{String(index + 1).padStart(2, "0")}</span>
              <span className="project-name"><strong>{localize(project.title, locale)}</strong><small>{localize(project.eyebrow, locale)}</small></span>
              <span className="project-copy"><span className="project-summary">{localize(project.summary, locale)}</span><MetricsChips value={localize(project.metrics, locale)} /></span>
              <span className="project-status"><CheckCircle2 aria-hidden="true" />{status[project.slug][locale]}</span>
              <ArrowUpRight aria-label={dict.inspectProject} />
            </LocaleLink>
          ))}
        </div>
      </section>
    </main>
  );
}
