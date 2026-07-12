"use client";

import { ArrowLeft, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { localize, useI18n } from "@/lib/i18n";
import { getProjectsForTrack, getTrack, type TrackId } from "@/lib/projects";

export default function TrackPageView({ trackId }: { trackId: TrackId }) {
  const { locale, dict } = useI18n();
  const track = getTrack(trackId)!;
  const projects = getProjectsForTrack(trackId);

  return (
    <main className="track-page page-shell">
      <Link href="/" className="back-link"><ArrowLeft aria-hidden="true" />{dict.backHome}</Link>
      <header><p className="eyebrow">{locale === "en" ? "Discipline" : "方向"}</p><h1>{localize(track.label, locale)}</h1><p className="lede">{localize(track.thesis, locale)}</p></header>
      <div className="track-projects">
        {projects.map((project) => <Link key={project.slug} href={`/${project.track}/${project.slug}`}><div><span>{localize(project.eyebrow, locale)}</span><h2>{localize(project.title, locale)}</h2><p>{localize(project.summary, locale)}</p></div><ArrowUpRight aria-label={dict.inspectProject} /></Link>)}
      </div>
    </main>
  );
}
