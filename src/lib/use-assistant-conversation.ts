"use client";

import { useState } from "react";
import type { AssistantCitation, AssistantMessage } from "@/lib/assistant-policy";
import { getPresetAnswer, isPresetPrompt, type PresetAnswerSegment } from "@/lib/ask-preset-answers";
import { validateAssistantAnswerBlocks, type AssistantAnswerBlock } from "@/lib/assistant-project-references";

// Task L5 [CLAUDE]: extracted out of AssistantWidget.tsx so the new full-page
// /ai/ask-portfolio conversation surface (AskConversation.tsx) can reuse the
// exact same ask/submit/citation machinery the floating panel uses instead
// of forking a second copy of this fetch-and-parse logic. Behavior is
// unchanged from the pre-extraction AssistantWidget: same request shape,
// same response parsing, same 6-message history window, same
// user-message-prefixing rule for bank-preset questions (tests/e2e/
// assistant.spec.ts's "assistant prompts follow the page context..." test
// asserts on that exact prefix and still passes against this module).
const HISTORY_LIMIT = 6;

export interface AssistantDisplayMessage extends AssistantMessage {
  id: string;
  question?: string;
  sources?: AssistantCitation[];
  blocks?: AssistantAnswerBlock[];
  retryable?: boolean;
  retryQuestion?: string;
  /** Task R14: set when this assistant turn is an AUTHORED preset answer
   * (committed prose with grounded citations, no model call) — renders
   * under the preset-answer ("预置回答") labeling, never as retrieval
   * output or model generation. */
  presetSegments?: PresetAnswerSegment[];
}

export interface AssistantRateLimitStatus {
  remainingMinute: number;
  remainingDay: number;
}

function replyFromUnknown(value: unknown, locale: "en" | "zh") {
  if (typeof value !== "object" || value === null || !("reply" in value) || typeof value.reply !== "string") return null;
  const blocks = "blocks" in value ? validateAssistantAnswerBlocks(value.blocks, locale) : null;
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
  const retryable = "retryable" in value && value.retryable === true;
  return { reply: value.reply, sources, ...(blocks ? { blocks } : {}), retryable };
}

// `promptSet` is the current route's resolved bank preset list (see
// src/lib/ask-question-bank.ts): a user message that is verbatim one of
// those presets gets the same "Portfolio question about Xiangguo Zhang on
// <pathname>: <question>" (or zh equivalent) prefix AssistantWidget always
// sent, so the model still receives page context for preset clicks without
// every caller re-implementing that string.
export function useAssistantConversation({
  locale,
  pathname,
  promptSet,
  failedMessage,
}: {
  locale: "en" | "zh";
  pathname: string;
  promptSet: readonly string[];
  failedMessage: string;
}) {
  const [messages, setMessages] = useState<AssistantDisplayMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [rateLimit, setRateLimit] = useState<AssistantRateLimitStatus | null>(null);

  async function requestConversation(conversation: AssistantDisplayMessage[], question: string) {
    setBusy(true);
    try {
      const submittedMessages = conversation.map(({ role, content: messageContent }) => ({
        role,
        content: role === "user" && promptSet.includes(messageContent)
          ? locale === "en"
            ? `Portfolio question about Xiangguo Zhang on ${pathname}: ${messageContent}`
            : `关于章向国在作品集页面 ${pathname} 的问题：${messageContent}`
          : messageContent,
      }));
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          pageContext: pathname,
          messages: submittedMessages,
        }),
      });
      const remainingMinute = response.headers.get("x-ratelimit-remaining-minute");
      const remainingDay = response.headers.get("x-ratelimit-remaining-day");
      if (remainingMinute !== null && remainingDay !== null) {
        setRateLimit({ remainingMinute: Number(remainingMinute), remainingDay: Number(remainingDay) });
      }
      const payload: unknown = await response.json();
      const parsedReply = replyFromUnknown(payload, locale);
      setMessages((current) => [...current, {
        id: crypto.randomUUID(),
        role: "assistant",
        question,
        content: parsedReply?.reply ?? failedMessage,
        sources: parsedReply?.sources,
        blocks: parsedReply?.blocks,
        retryable: parsedReply?.retryable,
        retryQuestion: parsedReply?.retryable ? question : undefined,
      }]);
    } catch {
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", question, content: failedMessage }]);
    } finally {
      setBusy(false);
    }
  }

  // Task R14 (owner ruling): a bank-preset click returns its AUTHORED
  // preset answer -- appended locally from the committed artifact, no
  // /api/assistant request, no model. Every bank preset has a committed
  // answer in both locales (the generator enforces it), so a false return
  // simply means the prompt is not a preset for this route; the caller
  // then uses the live path. The prompt-vs-preset decision is synchronous
  // (small routed bank); the answer content rides its own lazily-imported
  // chunk (see src/lib/ask-preset-answers.ts) and resolves locally.
  // Typed free-form questions must keep calling send() directly.
  function sendPreset(content: string): boolean {
    const question = content.trim();
    if (!question || busy || !isPresetPrompt(pathname, question, locale)) return false;
    const userMessage: AssistantDisplayMessage = { id: crypto.randomUUID(), role: "user", content: question };
    setMessages((current) => [...current, userMessage].slice(-HISTORY_LIMIT));
    void getPresetAnswer(pathname, question, locale).then((preset) => {
      if (!preset) throw new Error("preset answer missing");
      const assistantMessage: AssistantDisplayMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        question,
        content: preset.segments.map((segment) => segment.text).join(" "),
        sources: preset.citations,
        presetSegments: preset.segments,
      };
      setMessages((current) => [...current, assistantMessage].slice(-HISTORY_LIMIT));
    }).catch(() => {
      // The answer chunk failed to load (it is a same-origin static asset,
      // so this is an offline-grade failure). State it honestly -- never
      // fall through to a model call the user did not ask for.
      const failure: AssistantDisplayMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        question,
        content: failedMessage,
      };
      setMessages((current) => [...current, failure].slice(-HISTORY_LIMIT));
    });
    return true;
  }

  async function send(content: string) {
    const question = content.trim();
    if (!question) return false;
    const userMessage: AssistantDisplayMessage = { id: crypto.randomUUID(), role: "user", content: question };
    const conversation = [...messages, userMessage].slice(-HISTORY_LIMIT);
    setMessages(conversation);
    await requestConversation(conversation, question);
    return true;
  }

  function retry(message: AssistantDisplayMessage) {
    const question = message.retryQuestion;
    if (!question || busy) return;
    const conversation = messages.filter((candidate) => candidate.id !== message.id).slice(-HISTORY_LIMIT);
    setMessages(conversation);
    void requestConversation(conversation, question);
  }

  return { messages, setMessages, busy, rateLimit, send, sendPreset, retry };
}
