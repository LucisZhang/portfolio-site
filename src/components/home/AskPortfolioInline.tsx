"use client";

import { useId, useState, type FormEvent } from "react";
import { getHomeQuestions } from "@/lib/ask-question-bank";
import { useI18n } from "@/lib/i18n";

// Spec §4: exhibit 02 gets "Ask Portfolio inline input + 3 preset
// questions"; exhibit 06 gets the same surface in a "compact variant" (no
// preset chips). Both hand off to the existing guardrailed assistant
// (AssistantLauncher/AssistantWidget) via the portfolio:open-assistant
// event rather than re-implementing the chat engine inline — this
// component is only the homepage's entry point into that one product.
//
// Task F13b: the preset chips are the home route's ("/") verified question
// bank entries (src/data/generated/ask-question-bank.json), the same source
// the floating assistant panel resolves its own route-aware presets from —
// one source of truth instead of a second hardcoded copy here.
function openAssistant(prompt?: string) {
  window.dispatchEvent(new CustomEvent("portfolio:open-assistant", { detail: prompt ? { prompt } : undefined }));
}

export default function AskPortfolioInline({ variant }: { variant: "chips" | "compact" }) {
  const { locale } = useI18n();
  const inputId = useId();
  const [value, setValue] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    openAssistant(value.trim() || undefined);
  }

  return (
    <form className="home-ask" data-ask-variant={variant} onSubmit={submit}>
      <label className="home-ask-label" htmlFor={inputId}>{locale === "en" ? "Ask Portfolio" : "询问作品集"}</label>
      <div className="home-ask-row">
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={locale === "en" ? "Ask anything on this page" : "问这页上的任何数字"}
        />
        <button type="submit">{locale === "en" ? "Ask" : "提问"}</button>
      </div>
      {variant === "chips" ? (
        <div className="home-ask-presets">
          {getHomeQuestions(locale).map((question) => (
            <button type="button" key={question} onClick={() => openAssistant(question)}>{question}</button>
          ))}
        </div>
      ) : null}
    </form>
  );
}
