// Task R9c (B5-c) [CLAUDE]: the shared sources-section renderer. References
// at the end of an answer render as a quiet typographic navigation index —
// each entry is a destination the reader would actually want to open (pinned
// GitHub line ranges for external project repos, this site's project pages
// for portfolio-site internals, label-only for the private profile), per
// output/r3-align/mocks/b5-c-reference-index.html. Used by the recorded
// conversation and live answers on /ai/ask-portfolio, and by the floating
// assistant widget (compact variant).
import type { AssistantCitation } from "@/lib/assistant-policy";
import { buildCitationIndex } from "@/lib/assistant-citation-index";
import { zhWrapText } from "@/lib/zh-wrap";
import LocaleLink from "@/components/LocaleLink";
import "./assistant-sources.css";

const HEADING = { en: "Go see for yourself", zh: "亲自去看" } as const;

export default function AssistantSourcesIndex({
  citations,
  locale,
  variant = "page",
}: {
  citations: readonly AssistantCitation[];
  locale: "en" | "zh";
  variant?: "page" | "compact";
}) {
  const entries = buildCitationIndex(citations);
  if (!entries.length) return null;
  return (
    <div className={variant === "compact" ? "ask-go ask-go-compact" : "ask-go"} data-testid="ask-go-index">
      <span className="ask-go-label">{HEADING[locale]}</span>
      <ul>
        {entries.map((entry) => {
          const title = (
            <>
              <span className="ask-go-n">{entry.refs.join(" ")}</span>
              {locale === "zh" ? zhWrapText(entry.title.zh) : entry.title.en}
            </>
          );
          return (
            <li key={entry.key}>
              {entry.kind === "private" ? (
                <span className="ask-go-dest">{title}</span>
              ) : entry.external ? (
                <a className="ask-go-dest" href={entry.href} target="_blank" rel="noopener noreferrer">
                  {title}
                  <span className="ask-go-arrow" aria-hidden="true">→</span>
                </a>
              ) : (
                <LocaleLink className="ask-go-dest" href={entry.href ?? "/"}>
                  {title}
                  <span className="ask-go-arrow" aria-hidden="true">→</span>
                </LocaleLink>
              )}
              <span className="ask-go-route">
                {entry.route[locale] ? entry.route[locale] : null}
                <span className={entry.route[locale] ? "ask-go-kind" : "ask-go-kind ask-go-kind-solo"}>
                  {entry.badge[locale]}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
