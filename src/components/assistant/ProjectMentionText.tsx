import { Fragment } from "react";
import { findProjectMentions, projectIdentityHref } from "@/lib/project-identities";
import { zhWrapText } from "@/lib/zh-wrap";

/** Keep authored wording and citation markers intact; only names gain links. */
export default function ProjectMentionText({ text, locale }: { text: string; locale: "en" | "zh" }) {
  const prose = (value: string) => locale === "zh" ? zhWrapText(value) : value;
  const mentions = findProjectMentions(text);
  const last = mentions.at(-1);
  return <>{mentions.map((mention, index) => {
    const previous = mentions[index - 1];
    const cursor = previous ? previous.index + previous.text.length : 0;
    const prefix = text.slice(cursor, mention.index);
    return <Fragment key={mention.index}>
      {prose(prefix)}
      <a className="assistant-project-link" href={projectIdentityHref(mention.id, locale)}>{mention.text}</a>
    </Fragment>;
  })}{prose(text.slice(last ? last.index + last.text.length : 0))}</>;
}
