"use client";

import { Exhibit } from "@/components/exhibition/Exhibit";
import LocaleLink from "@/components/LocaleLink";
import { localize, useI18n, type Locale } from "@/lib/i18n";
import type { Project, ProjectId } from "@/lib/projects";
import AskPortfolioInline from "./AskPortfolioInline";
import { zhGroup, zhWrapDisplay } from "@/lib/zh-wrap";

// Task F10 (box-grammar ruling): the row used to carry a decorative
// pure-CSS "micro-instrument" beside it (a 13-square dot grid, a 5-bar
// sparkline, a 2x2 filled checkerboard swatch — task 1.2 brief's "no JS,
// no SVG files" texture). F8 audit finding 3 flagged those as exactly the
// filled-block/grid-of-boxes pattern the controller's box-grammar ruling
// retires; removed here in favor of the row's own text carrying the row,
// as the approved mocks do with plain numbered nav items. This supersedes
// spec §4's 微仪器 (micro-instrument) mandate for this row per that ruling.
// The per-row hairline-top (.home-agent-row, home.css) already separates
// rows, so no replacement separator is needed.
const ROWS: { slug: ProjectId }[] = [
  { slug: "release-guardian" },
  { slug: "triage-router" },
  { slug: "privacy-preflight" },
];

export default function AgentSystemsExhibit({ projects, questions }: {
  projects: Pick<Project, "slug" | "track" | "title" | "glossZh" | "metrics">[];
  questions: Record<Locale, string[]>;
}) {
  const { locale } = useI18n();

  return (
    <Exhibit
      id="exhibit-02"
      num="02"
      eyebrow="13-NODE GRAPH / TOOL GUARDS / ONNX INT8 / ON-DEVICE OCR"
      bg="paper"
      title={
        locale === "en" ? (
          <>Agents that act.<br /><em>Systems built to be second-guessed.</em></>
        ) : (
          <>会动手的 Agent，<br /><em>{zhGroup("也留了能追问", "它的地方。")}</em></>
        )
      }
    >
      <ol className="home-agent-rows">
        {ROWS.map(({ slug }) => {
          const row = projects.find((candidate) => candidate.slug === slug);
          if (!row) return null;
          return (
            <li className="home-agent-row" key={slug}>
              <LocaleLink className="home-agent-row-link" href={`/${row.track}/${row.slug}`}>
                <span className="home-agent-row-head">
                  <strong>{localize(row.title, locale)}</strong>
                  {/* Locale purity (task F5): the gloss line is zh-only,
                      not a second English narrative — must not render in
                      en locale. */}
                  {locale === "zh" ? <span className="cn-gloss">{zhWrapDisplay(row.glossZh)}</span> : null}
                </span>
                <span className="project-summary">{localize(row.metrics, locale)}</span>
              </LocaleLink>
            </li>
          );
        })}
      </ol>
      <AskPortfolioInline variant="chips" questions={questions} />
    </Exhibit>
  );
}
