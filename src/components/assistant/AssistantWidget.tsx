"use client";

import { Fragment, type FormEvent, type KeyboardEvent as ReactKeyboardEvent, type ReactNode, useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import type { AssistantCitation, AssistantMessage } from "@/lib/assistant-policy";
import { getTrack, projects } from "@/lib/projects";
import styles from "./AssistantWidget.module.css";

const MAX_INPUT_CHARACTERS = 2_500;

const copy = {
  en: {
    eyebrow: "AI portfolio guide",
    title: "Ask about Xiangguo",
    intro: "Ask about Xiangguo Zhang's background, projects, strengths, working style, or fit for a role.",
    placeholder: "Why is Xiangguo a strong Applied AI candidate?",
    send: "Send",
    sending: "Thinking",
    close: "Close",
    empty: "Ask one question about the candidate, a project, or role fit.",
    failed: "The portfolio assistant is unavailable right now. The project pages and public sources remain available.",
    disclosure: "Your question is sent only to a zero-data-retention external AI service. Do not enter credentials or private contact details.",
    prompts: ["Why should a team hire Xiangguo for an Applied AI role?", "How do his RAG and data-engineering projects reinforce each other?", "What is his working style?"],
    user: "You",
    assistant: "Portfolio guide",
    sources: "Related sources",
  },
  zh: {
    eyebrow: "AI 作品集向导",
    title: "询问章向国",
    intro: "可以询问章向国的背景、项目、优势、工作方式，或与某个岗位的匹配度等问题。",
    placeholder: "为什么章向国适合 AI 应用岗位？",
    send: "发送",
    sending: "正在思考",
    close: "关闭",
    empty: "请询问候选人、具体项目或岗位匹配。",
    failed: "作品集助手暂时不可用，项目页面和公开来源仍可查看。",
    disclosure: "你的问题仅会发送到采用零数据保留策略的外部 AI 服务。请勿输入凭据或私人联系方式。",
    prompts: ["为什么团队应该在 AI 应用岗位上选择章向国？", "他的 RAG 与数据工程项目如何相互印证？", "他的工作方式有什么特点？"],
    user: "你",
    assistant: "作品集向导",
    sources: "相关来源",
  },
} as const;

const projectDestinations = projects.filter((project) => !project.legacy).flatMap((project) => [
  { label: project.title.en, href: `/${project.track}/${project.slug}` },
  { label: project.title.zh, href: `/${project.track}/${project.slug}` },
]);

function contextualCopy(pathname: string, locale: "en" | "zh", defaults: typeof copy.en | typeof copy.zh) {
  const segments = pathname.split("/").filter(Boolean);
  const project = segments.length >= 2 ? projects.find((item) => item.track === segments[0] && item.slug === segments[1]) : undefined;
  if (project) {
    const title = project.title[locale];
    return locale === "en" ? {
      placeholder: `Ask how ${title} demonstrates Xiangguo's strengths…`,
      prompts: [
        `What problem does ${title} solve, and what did Xiangguo build?`,
        `Which technical decisions in ${title} best demonstrate his strengths?`,
        `How is ${title} relevant to a ${project.track === "ai" ? "Applied AI" : project.track === "engineering" ? "data engineering" : "data analytics"} role?`,
      ],
    } : {
      placeholder: `询问${title}如何体现章向国的优势……`,
      prompts: [
        `${title}解决了什么问题，章向国具体做了什么？`,
        `${title}中哪些技术决策最能体现章向国的优势？`,
        `${title}与${project.track === "ai" ? "AI 应用" : project.track === "engineering" ? "数据工程" : "数据分析"}岗位有什么关联？`,
      ],
    };
  }
  const track = segments.length === 1 ? getTrack(segments[0]) : undefined;
  if (track) {
    const names = projects.filter((item) => item.track === track.id && !item.legacy).map((item) => item.title[locale]);
    return locale === "en" ? {
      placeholder: `Ask about Xiangguo's ${track.label.en} work…`,
      prompts: [
        `Why is Xiangguo a strong candidate for ${track.label.en} roles?`,
        `Compare ${names.join(" and ")} as examples of his work.`,
        `What strengths recur across Xiangguo's ${track.label.en} projects?`,
      ],
    } : {
      placeholder: `询问章向国的${track.label.zh}能力……`,
      prompts: [
        `为什么章向国适合${track.label.zh}岗位？`,
        `请比较${names.join("与")}这几个项目。`,
        `章向国的${track.label.zh}项目体现了哪些共同优势？`,
      ],
    };
  }
  return { placeholder: defaults.placeholder, prompts: [...defaults.prompts] };
}

function renderProjectLinks(text: string, locale: "en" | "zh", keyPrefix: string): ReactNode[] {
  const labels = [...projectDestinations].sort((left, right) => right.label.length - left.label.length);
  const pattern = new RegExp(`(${labels.map(({ label }) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g");
  return text.split(pattern).filter(Boolean).map((part, index) => {
    const target = labels.find(({ label }) => label === part);
    return target
      ? <a key={`${keyPrefix}-project-${index}`} href={`${target.href}${locale === "zh" ? "?lang=zh" : ""}`}>{part}</a>
      : <Fragment key={`${keyPrefix}-text-${index}`}>{part}</Fragment>;
  });
}

function renderInline(text: string, locale: "en" | "zh", keyPrefix: string) {
  return text.split(/(\*\*[^*]+\*\*)/gu).filter(Boolean).map((part, index) => {
    const bold = part.startsWith("**") && part.endsWith("**");
    const content = bold ? part.slice(2, -2) : part;
    const rendered = renderProjectLinks(content, locale, `${keyPrefix}-${index}`);
    return bold ? <strong key={`${keyPrefix}-bold-${index}`}>{rendered}</strong> : <Fragment key={`${keyPrefix}-plain-${index}`}>{rendered}</Fragment>;
  });
}

function RichAnswer({ content, locale }: { content: string; locale: "en" | "zh" }) {
  const lines = content.replace(/\r/gu, "").split("\n");
  const blocks: ReactNode[] = [];
  let bullets: string[] = [];
  const flushBullets = () => {
    if (!bullets.length) return;
    const current = bullets;
    bullets = [];
    blocks.push(<ul key={`list-${blocks.length}`}>{current.map((line, index) => <li key={`${line}-${index}`}>{renderInline(line, locale, `list-${blocks.length}-${index}`)}</li>)}</ul>);
  };
  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    const bullet = line.match(/^[-*]\s+(.+)$/u);
    if (bullet) {
      bullets.push(bullet[1]);
      return;
    }
    flushBullets();
    if (!line) return;
    const heading = line.match(/^#{1,4}\s+(.+)$/u);
    blocks.push(heading
      ? <h3 key={`heading-${blocks.length}`}>{renderInline(heading[1], locale, `heading-${blocks.length}`)}</h3>
      : <p key={`paragraph-${blocks.length}`}>{renderInline(line, locale, `paragraph-${blocks.length}`)}</p>);
  });
  flushBullets();
  return <div className={styles.richAnswer}>{blocks}</div>;
}

interface DisplayMessage extends AssistantMessage {
  id: string;
  sources?: AssistantCitation[];
}

function replyFromUnknown(value: unknown) {
  if (typeof value !== "object" || value === null || !("reply" in value) || typeof value.reply !== "string") return null;
  const sources = "sources" in value && Array.isArray(value.sources)
    ? value.sources.filter((source): source is AssistantCitation => (
      typeof source === "object"
      && source !== null
      && "sourceId" in source
      && typeof source.sourceId === "string"
      && "kind" in source
      && (source.kind === "public-github" || source.kind === "private-profile")
      && "label" in source
      && typeof source.label === "object"
      && source.label !== null
      && "en" in source.label
      && typeof source.label.en === "string"
      && "zh" in source.label
      && typeof source.label.zh === "string"
      && (!("url" in source) || source.url === undefined
        || (typeof source.url === "string" && /^https:\/\/github\.com\/LucisZhang\/[A-Za-z0-9._-]+\/blob\/[a-f0-9]{40}\//.test(source.url)))
    ))
    : [];
  return { reply: value.reply, sources };
}

export default function AssistantWidget({ onClose }: { onClose: () => void }) {
  const { locale } = useI18n();
  const pathname = usePathname();
  const labels = copy[locale];
  const context = contextualCopy(pathname, locale, labels);
  const headingId = useId();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => inputRef.current?.focus(), []);
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function send(content: string) {
    const question = content.trim();
    if (!question) {
      setNotice(labels.empty);
      inputRef.current?.focus();
      return;
    }

    const userMessage: DisplayMessage = { id: crypto.randomUUID(), role: "user", content: question };
    const conversation = [...messages, userMessage].slice(-6);
    setMessages(conversation);
    setDraft("");
    setNotice("");
    setBusy(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          messages: conversation.map(({ role, content: messageContent }) => ({ role, content: messageContent })),
        }),
      });
      const payload: unknown = await response.json();
      const parsedReply = replyFromUnknown(payload);
      setMessages((current) => [...current, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: parsedReply?.reply ?? labels.failed,
        sources: parsedReply?.sources,
      }]);
    } catch {
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", content: labels.failed }]);
    } finally {
      setBusy(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!busy) void send(draft);
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      if (!busy) void send(draft);
    }
  }

  return (
    <section
      id="portfolio-assistant-panel"
      className={styles.panel}
      role="dialog"
      aria-modal="false"
      aria-labelledby={headingId}
      data-testid="assistant-widget"
    >
      <header className={styles.header}>
        <div>
          <p>{labels.eyebrow}</p>
          <h2 id={headingId}>{labels.title}</h2>
        </div>
        <button type="button" onClick={onClose} aria-label={labels.close}>{labels.close}</button>
      </header>

      <div className={styles.log} ref={logRef} role="log" aria-live="polite" aria-relevant="additions">
        <div className={styles.intro}>{labels.intro}</div>
        {messages.map((message) => (
          <article key={message.id} className={message.role === "user" ? styles.userMessage : styles.assistantMessage}>
            <strong>{message.role === "user" ? labels.user : labels.assistant}</strong>
            {message.role === "assistant" ? <RichAnswer content={message.content} locale={locale} /> : <p>{message.content}</p>}
            {message.role === "assistant" && message.sources?.length ? (
              <div className={styles.sources}>
                <span>{labels.sources}</span>
                <ul>
                  {message.sources.map((source) => (
                    <li key={source.sourceId}>
                      {source.url ? (
                        <a href={source.url} target="_blank" rel="noopener noreferrer">{source.label[locale]}</a>
                      ) : <span>{source.label[locale]}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </article>
        ))}
        {busy ? <div className={styles.pending}><span>{labels.sending}</span><i /><i /><i /></div> : null}
      </div>

      {messages.length === 0 ? (
        <div className={styles.prompts} aria-label={labels.title}>
          {context.prompts.map((prompt) => (
            <button key={prompt} type="button" onClick={() => void send(prompt)} disabled={busy}>{prompt}</button>
          ))}
        </div>
      ) : null}

      <form className={styles.form} onSubmit={submit}>
        <label className="sr-only" htmlFor={`${headingId}-input`}>{context.placeholder}</label>
        <textarea
          id={`${headingId}-input`}
          ref={inputRef}
          value={draft}
          maxLength={MAX_INPUT_CHARACTERS}
          rows={3}
          placeholder={context.placeholder}
          disabled={busy}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className={styles.formFooter}>
          <span aria-live="polite">{notice || `${draft.length} / ${MAX_INPUT_CHARACTERS}`}</span>
          <button type="submit" disabled={busy || !draft.trim()}>{busy ? labels.sending : labels.send}</button>
        </div>
      </form>
      <p className={styles.disclosure}>{labels.disclosure}</p>
    </section>
  );
}
