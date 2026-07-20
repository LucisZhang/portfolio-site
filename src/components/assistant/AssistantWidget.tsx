"use client";

import { type FormEvent, type KeyboardEvent as ReactKeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import type { AssistantMessage } from "@/lib/assistant-policy";
import type { AssistantPublicCitation } from "@/lib/assistant-public-sources";
import styles from "./AssistantWidget.module.css";

const copy = {
  en: {
    eyebrow: "Pinned public evidence",
    title: "Ask about the p1 project",
    intro: "This pilot uses a reviewed, commit-pinned public GitHub snapshot of p1. The model selects audited fact IDs; the server writes the answer and citations.",
    placeholder: "What does the p1 reliability lab demonstrate?",
    send: "Send",
    sending: "Checking public evidence…",
    close: "Close",
    empty: "Write one short question that names the p1 reliability lab.",
    failed: "The public-source assistant is unavailable right now. The pinned sources remain available.",
    disclosure: "Your question and all three reviewed public GitHub excerpts are sent to OpenRouter and its downstream model provider. Do not enter confidential information. When configured, Upstash processes a pseudonymous rate-limit identifier.",
    prompts: ["What does the p1 reliability lab demonstrate, and what does it not prove?", "How did the p1 reliability lab test five failure classes?"],
    user: "You",
    assistant: "Public-source assistant",
    sources: "Pinned GitHub sources",
  },
  zh: {
    eyebrow: "固定版本公开证据",
    title: "询问 p1 项目",
    intro: "这是一次 p1 单项目试运行：模型只选择经审计的事实 ID，最终回答与引用由服务端生成，依据固定到具体提交的公开 GitHub 快照。",
    placeholder: "p1 可靠性实验室展示了什么？",
    send: "发送",
    sending: "正在核对公开证据…",
    close: "关闭",
    empty: "请输入一个明确写出 p1 可靠性实验室的简短问题。",
    failed: "公开来源助手暂时不可用，固定版本的来源仍可查看。",
    disclosure: "你的问题及全部三段经审阅的公开 GitHub 摘录会发送至 OpenRouter 及其下游模型提供方。请勿输入保密信息；配置后，Upstash 会处理用于限流的假名化标识。",
    prompts: ["p1 可靠性实验室展示了什么，又不能证明什么？", "p1 可靠性实验室如何测试五类故障？"],
    user: "你",
    assistant: "公开来源助手",
    sources: "固定版本的 GitHub 来源",
  },
} as const;

interface DisplayMessage extends AssistantMessage {
  id: string;
  sources?: AssistantPublicCitation[];
}

function replyFromUnknown(value: unknown) {
  if (typeof value !== "object" || value === null || !("reply" in value) || typeof value.reply !== "string") return null;
  const sources = "sources" in value && Array.isArray(value.sources)
    ? value.sources.filter((source): source is AssistantPublicCitation => (
      typeof source === "object"
      && source !== null
      && "sourceId" in source
      && typeof source.sourceId === "string"
      && "label" in source
      && typeof source.label === "object"
      && source.label !== null
      && "en" in source.label
      && typeof source.label.en === "string"
      && "zh" in source.label
      && typeof source.label.zh === "string"
      && "url" in source
      && typeof source.url === "string"
      && /^https:\/\/github\.com\/LucisZhang\/p1-reliability-lab\/blob\/[a-f0-9]{40}\//.test(source.url)
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
    const conversation = [...messages, userMessage];
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
          messages: [{ role: "user", content: question }],
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
                      <a href={source.url} target="_blank" rel="noopener noreferrer">{source.label[locale]}</a>
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
          maxLength={1_000}
          rows={3}
          placeholder={labels.placeholder}
          disabled={busy}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className={styles.formFooter}>
          <span aria-live="polite">{notice || `${draft.length} / 1000`}</span>
          <button type="submit" disabled={busy || !draft.trim()}>{busy ? labels.sending : labels.send}</button>
        </div>
      </form>
      <p className={styles.disclosure}>{labels.disclosure}</p>
    </section>
  );
}
