"use client";

import { type FormEvent, type KeyboardEvent as ReactKeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import type { AssistantCitation, AssistantMessage } from "@/lib/assistant-policy";
import styles from "./AssistantWidget.module.css";

const MAX_INPUT_CHARACTERS = 2_500;

const copy = {
  en: {
    eyebrow: "Evidence-grounded portfolio guide",
    title: "Ask about Xiangguo",
    intro: "Ask about Xiangguo Zhang's background, projects, strengths, working style, or fit for a role. The assistant retrieves from pinned GitHub evidence and verified candidate materials before answering.",
    placeholder: "Why is Xiangguo a strong Applied AI candidate?",
    send: "Send",
    sending: "Retrieving evidence and composing…",
    close: "Close",
    empty: "Ask one question about the candidate, a project, or role fit.",
    failed: "The portfolio assistant is unavailable right now. The project pages and public sources remain available.",
    disclosure: "Your question and the retrieved public/private evidence excerpts are sent through OpenRouter only to zero-data-retention endpoints. Do not enter credentials or private contact details. Upstash processes a pseudonymous rate-limit identifier.",
    prompts: ["Why should a team hire Xiangguo for an Applied AI role?", "How do his RAG and data-engineering projects reinforce each other?", "What is his working style?"],
    user: "You",
    assistant: "Portfolio guide",
    sources: "Evidence used",
  },
  zh: {
    eyebrow: "基于证据的作品集向导",
    title: "询问章向国",
    intro: "可以询问章向国的背景、项目、优势、工作方式，或与某个岗位的匹配度。助手会先从固定版本的 GitHub 证据与已核验候选人材料中检索，再组织回答。",
    placeholder: "为什么章向国适合 AI 应用岗位？",
    send: "发送",
    sending: "正在检索证据并组织回答…",
    close: "关闭",
    empty: "请询问候选人、具体项目或岗位匹配。",
    failed: "作品集助手暂时不可用，项目页面和公开来源仍可查看。",
    disclosure: "你的问题以及本次检索命中的公开/私有证据片段，会经 OpenRouter 仅发送到零数据保留端点。请勿输入凭据或私人联系方式；Upstash 只处理用于限流的假名化标识。",
    prompts: ["为什么团队应该在 AI 应用岗位上选择章向国？", "他的 RAG 与数据工程项目如何相互印证？", "他的工作方式有什么特点？"],
    user: "你",
    assistant: "作品集向导",
    sources: "本次使用的证据",
  },
} as const;

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
  const labels = copy[locale];
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
            <p>{message.content}</p>
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
        {busy ? <div className={styles.pending}>{labels.sending}</div> : null}
      </div>

      {messages.length === 0 ? (
        <div className={styles.prompts} aria-label={labels.title}>
          {labels.prompts.map((prompt) => (
            <button key={prompt} type="button" onClick={() => void send(prompt)} disabled={busy}>{prompt}</button>
          ))}
        </div>
      ) : null}

      <form className={styles.form} onSubmit={submit}>
        <label className="sr-only" htmlFor={`${headingId}-input`}>{labels.placeholder}</label>
        <textarea
          id={`${headingId}-input`}
          ref={inputRef}
          value={draft}
          maxLength={MAX_INPUT_CHARACTERS}
          rows={3}
          placeholder={labels.placeholder}
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
