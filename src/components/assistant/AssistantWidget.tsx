"use client";

import { type FormEvent, type KeyboardEvent as ReactKeyboardEvent, useCallback, useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { getRouteQuestions } from "@/lib/ask-question-bank";
import { prefetchPresetAnswers } from "@/lib/ask-preset-answers";
import { useI18n } from "@/lib/i18n";
import { getTrack, projects } from "@/lib/projects";
import { useAssistantConversation } from "@/lib/use-assistant-conversation";
import { zhWrapText } from "@/lib/zh-wrap";
import AssistantRichAnswer from "./AssistantRichAnswer";
import AssistantSourcesIndex from "./AssistantSourcesIndex";
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
    retry: "Retry",
    disclosure: "Your question is sent only to a zero-data-retention external AI service. Do not enter credentials or private contact details.",
    user: "You",
    assistant: "Portfolio guide",
    presetLabel: "PRESET · authored answer · cited · no model call",
  },
  zh: {
    eyebrow: "AI 作品集向导",
    title: "询问作品集",
    intro: "可以询问章向国的背景、项目、优势、工作方式，或与某个岗位的匹配度等问题。",
    placeholder: "为什么章向国适合 AI 应用岗位？",
    send: "发送",
    sending: "正在思考",
    close: "关闭",
    empty: "请询问候选人、具体项目或岗位匹配。",
    failed: "作品集助手暂时不可用，项目页面和公开来源仍可查看。",
    retry: "重试",
    disclosure: "你的问题仅会发送到采用零数据保留策略的外部 AI 服务。请勿输入凭据或私人联系方式。",
    user: "你",
    assistant: "作品集向导",
    presetLabel: "预置回答 · 附引用 · 未调用模型",
  },
} as const;

function contextualCopy(pathname: string, locale: "en" | "zh", defaults: typeof copy.en | typeof copy.zh) {
  const segments = pathname.split("/").filter(Boolean);
  const prompts = getRouteQuestions(pathname, locale);
  const project = segments.length >= 2 ? projects.find((item) => item.track === segments[0] && item.slug === segments[1]) : undefined;
  if (project) {
    const title = project.title[locale];
    return { placeholder: locale === "en" ? `Ask how ${title} demonstrates Xiangguo's strengths…` : `询问${title}如何体现章向国的优势……`, prompts };
  }
  const track = segments.length === 1 ? getTrack(segments[0]) : undefined;
  if (track) {
    return { placeholder: locale === "en" ? `Ask about Xiangguo's ${track.label.en} work…` : `询问章向国的${track.label.zh}能力……`, prompts };
  }
  return { placeholder: defaults.placeholder, prompts };
}

// `initialPrompt` prefills (never auto-sends) the input: the homepage's
// inline "Ask Portfolio" surface (task 1.2, spec §4 rows 02/06) hands a
// question to this widget through AssistantLauncher rather than duplicating
// the guardrailed send path. AssistantLauncher only mounts this component
// while `open` is true, so a fresh mount per open is exactly the point —
// no effect is needed to react to a changed prop.
export default function AssistantWidget({ onClose, initialPrompt }: { onClose: () => void; initialPrompt?: string }) {
  const { locale } = useI18n();
  const pathname = usePathname();
  const labels = copy[locale];
  const context = contextualCopy(pathname, locale, labels);
  const headingId = useId();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const { messages, busy, send: sendMessage, sendPreset, retry } = useAssistantConversation({
    locale,
    pathname,
    promptSet: context.prompts,
    failedMessage: labels.failed,
  });
  const [draft, setDraft] = useState(initialPrompt ?? "");
  const [notice, setNotice] = useState("");
  const focusInput = useCallback(() => {
    if (window.matchMedia("(max-width: 640px)").matches) return;
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => focusInput(), [focusInput]);
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
      focusInput();
      return;
    }

    setDraft("");
    setNotice("");
    await sendMessage(content);
    requestAnimationFrame(focusInput);
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
            {/* Task R14: a preset click renders its AUTHORED preset answer —
                committed prose labeled truthfully as a preset (预置回答),
                never as retrieval output or model generation, with
                superscripts into the citation index below. */}
            {message.role === "assistant" && message.presetSegments ? (
              <>
                <p className={styles.presetTag}>{labels.presetLabel}</p>
                <p>
                  {message.presetSegments.map((segment, index) => (
                    <span key={segment.ref}>
                      {index > 0 ? " " : null}
                      <em>{locale === "zh" ? zhWrapText(segment.text) : segment.text}</em>
                      <sup>{segment.ref}</sup>
                    </span>
                  ))}
                </p>
              </>
            ) : message.role === "assistant"
              ? message.blocks
                ? <AssistantRichAnswer blocks={message.blocks} locale={locale} />
                : <p>{message.content}</p>
              : <p>{message.content}</p>}
            {message.role === "assistant" && message.sources?.length ? (
              <AssistantSourcesIndex citations={message.sources} locale={locale} variant="compact" />
            ) : null}
            {message.role === "assistant" && message.retryable ? (
              <button className={styles.retry} type="button" onClick={() => retry(message)} disabled={busy}>{labels.retry}</button>
            ) : null}
          </article>
        ))}
        {busy ? <div className={styles.pending}><span>{labels.sending}</span><i /><i /><i /></div> : null}
      </div>

      {messages.length === 0 ? (
        <div className={styles.prompts} aria-label={labels.title}>
          {context.prompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onMouseEnter={prefetchPresetAnswers}
              onFocus={prefetchPresetAnswers}
              onClick={() => {
                // Task R14: preset click -> authored preset answer, no
                // /api call; every bank preset carries a committed answer,
                // so the live path only serves typed questions.
                if (!sendPreset(prompt)) void send(prompt);
              }}
              disabled={busy}
            >
              {prompt}
            </button>
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
