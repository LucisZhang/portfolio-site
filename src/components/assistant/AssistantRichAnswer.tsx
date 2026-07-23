import { Fragment, type ReactNode } from "react";
import {
  projectReference,
  type AssistantAnswerBlock,
  type AssistantAnswerSegment,
} from "@/lib/assistant-project-references";
import styles from "./AssistantWidget.module.css";

function Segment({ segment, locale }: { segment: AssistantAnswerSegment; locale: "en" | "zh" }) {
  let content: ReactNode;
  if (segment.type === "project") {
    const reference = projectReference(segment.projectId, locale);
    if (!reference) return null;
    content = <a href={reference.href}>{reference.label}</a>;
  } else {
    content = <Fragment>{segment.text}</Fragment>;
  }
  return segment.strong ? <strong>{content}</strong> : content;
}

function Segments({ block, locale }: { block: AssistantAnswerBlock; locale: "en" | "zh" }) {
  return <>{block.segments.map((segment, index) => <Segment key={`${segment.type}-${index}`} segment={segment} locale={locale} />)}</>;
}

export default function AssistantRichAnswer({ blocks, locale }: { blocks: readonly AssistantAnswerBlock[]; locale: "en" | "zh" }) {
  const rendered: ReactNode[] = [];
  let bullets: AssistantAnswerBlock[] = [];
  const flushBullets = () => {
    if (!bullets.length) return;
    const current = bullets;
    bullets = [];
    rendered.push(<ul key={`list-${rendered.length}`}>{current.map((block, index) => (
      <li key={`bullet-${index}`}><Segments block={block} locale={locale} /></li>
    ))}</ul>);
  };
  blocks.forEach((block) => {
    if (block.type === "bullet") {
      bullets.push(block);
      return;
    }
    flushBullets();
    rendered.push(block.type === "heading"
      ? <h3 key={`heading-${rendered.length}`}><Segments block={block} locale={locale} /></h3>
      : <p key={`paragraph-${rendered.length}`}><Segments block={block} locale={locale} /></p>);
  });
  flushBullets();
  return <div className={styles.richAnswer}>{rendered}</div>;
}
