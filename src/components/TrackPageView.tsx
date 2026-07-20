"use client";

import { ArrowLeft, ArrowUpRight } from "lucide-react";
import LocaleDocumentMetadata from "@/components/LocaleDocumentMetadata";
import LocaleLink from "@/components/LocaleLink";
import { localize, useI18n } from "@/lib/i18n";
import { getProjectsForTrack, getTrack, type TrackId } from "@/lib/projects";
import { siteIdentity } from "@/lib/site-config";

export default function TrackPageView({ trackId }: { trackId: TrackId }) {
  const { locale, dict } = useI18n();
  const track = getTrack(trackId)!;
  const projects = getProjectsForTrack(trackId);

  return (
    <main className="track-page page-shell">
      <LocaleDocumentMetadata
        title={{ en: `${track.label.en} | ${siteIdentity.name}`, zh: `${track.label.zh} | ${siteIdentity.chineseName}` }}
        description={track.thesis}
      />
      <LocaleLink href="/" className="back-link"><ArrowLeft aria-hidden="true" />{dict.backHome}</LocaleLink>
      <header><p className="eyebrow">{locale === "en" ? "Discipline" : "方向"}</p><h1>{localize(track.label, locale)}</h1><p className="lede">{localize(track.thesis, locale)}</p></header>
      <div className="track-projects">
        {projects.map((project) => <LocaleLink key={project.slug} href={`/${project.track}/${project.slug}`}><div><span>{localize(project.eyebrow, locale)}</span><h2>{localize(project.title, locale)}</h2><p>{localize(project.summary, locale)}</p><div className="metrics-chips">{localize(project.metrics, locale).split(" · ").map((metric) => <small key={metric}>{metric}</small>)}</div></div><ArrowUpRight aria-label={dict.inspectProject} /></LocaleLink>)}
      </div>
      {trackId === "engineering" ? <section className="related-engineering-evidence" aria-labelledby="related-engineering-title"><p className="eyebrow">{locale === "en" ? "Cross-discipline systems proof" : "跨方向系统证据"}</p><h2 id="related-engineering-title">{locale === "en" ? "Related engineering evidence" : "相关工程证据"}</h2><div><LocaleLink href="/ai/release-guardian"><strong>{locale === "en" ? "Release Guardian" : "发布守门人"}</strong><span>{locale === "en" ? "Go gateway, Spring audit service, SHA-256 hash chain, PostgreSQL/pgvector" : "Go 网关、Spring 审计服务、SHA-256 哈希链、PostgreSQL/pgvector"}</span><ArrowUpRight aria-hidden="true" /></LocaleLink><LocaleLink href="/ai/rag-quality-lab"><strong>{locale === "en" ? "RAG Quality Lab" : "RAG 质量实验室"}</strong><span>{locale === "en" ? "Hashed data manifests, 88.5 MB regenerable corpus" : "带哈希的数据清单、88.5 MB 可再生语料"}</span><ArrowUpRight aria-hidden="true" /></LocaleLink></div></section> : null}
    </main>
  );
}
