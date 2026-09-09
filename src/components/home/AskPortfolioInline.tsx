"use client";

import { useId, useState, type FormEvent } from "react";
import { useI18n, type Locale } from "@/lib/i18n";

// Spec §4: exhibit 02 gets "Ask Portfolio inline input + 3 preset
// questions"; exhibit 06 gets the same surface in a "compact variant" (no
// preset chips). Both hand off to the existing guardrailed assistant
// (AssistantLauncher/AssistantWidget) via the portfolio:open-assistant
// event rather than re-implementing the chat engine inline — this
// component is only the homepage's entry point into that one product.
//
// HomePage selects the bilingual home questions from the verified bank on the
// server. The full route-aware bank loads with the assistant when it is opened.
function openAssistant(prompt?: string) {
  window.dispatchEvent(new CustomEvent("portfolio:open-assistant", { detail: prompt ? { prompt } : undefined }));
}

type AskPortfolioInlineProps =
  | { variant: "chips"; questions: Record<Locale, string[]> }
  | { variant: "compact"; questions?: never };

export default function AskPortfolioInline({ variant, questions }: AskPortfolioInlineProps) {
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
          {questions[locale].map((question) => (
            <button type="button" key={question} onClick={() => openAssistant(question)}>{question}</button>
          ))}
        </div>
      ) : null}
    </form>
  );
}
