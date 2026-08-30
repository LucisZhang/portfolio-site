"use client";

import { Exhibit } from "@/components/exhibition/Exhibit";
import LocaleLink from "@/components/LocaleLink";
import { localize, useI18n } from "@/lib/i18n";
import { homepageProjects } from "@/lib/projects";

const secondary = homepageProjects.filter((project) => project.tier === "secondary");
const archive = homepageProjects.filter((project) => project.tier === "archive");

export default function ShelfExhibit() {
  const { locale } = useI18n();

  return (
    <Exhibit
      id="exhibit-05"
      num="05"
      eyebrow="3 SECONDARY / 2 ARCHIVED"
      bg="paper"
      title={
        locale === "en" ? (
          <>Not every project needs the front room.</>
        ) : (
          <>不是每个项目都要摆在正厅。</>
        )
      }
    >
      {/* A plain link list styled as a hairline table via CSS grid (spec
          §4 row 05), not an ARIA table: giving role="row" to the <a>
          itself would overwrite its native link role in the accessibility
          tree (axe/AT users could no longer find it as a link) — the
          visual table comes entirely from .home-shelf-table's grid CSS. */}
      <div className="home-shelf-table">
        {[...secondary, ...archive].map((project) => (
          <LocaleLink
            className="home-shelf-row"
            data-tier={project.tier}
            href={`/${project.track}/${project.slug}`}
            key={project.slug}
          >
            <span className="home-shelf-title">
              <strong>{localize(project.title, locale)}</strong>
              {/* Locale purity (task F5): the gloss line is zh-only, not a
                  second English narrative — must not render in en locale. */}
              {locale === "zh" ? <span className="cn-gloss">{project.glossZh}</span> : null}
            </span>
            <span className="home-shelf-metric">{localize(project.metrics, locale)}</span>
          </LocaleLink>
        ))}
      </div>
    </Exhibit>
  );
}
