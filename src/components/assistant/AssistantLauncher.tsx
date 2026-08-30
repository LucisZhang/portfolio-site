"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import styles from "./AssistantLauncher.module.css";

function AssistantLoading() {
  const { locale } = useI18n();
  return <div className={styles.loading} aria-live="polite">{labels[locale].loading}</div>;
}

const AssistantWidget = dynamic(() => import("./AssistantWidget"), {
  ssr: false,
  loading: () => <AssistantLoading />,
});

const labels = {
  en: { open: "Ask Portfolio", close: "Close portfolio assistant", loading: "Loading assistant…" },
  zh: { open: "询问作品集", close: "关闭作品集助手", loading: "正在加载助手…" },
} as const;

export default function AssistantLauncher() {
  const { locale } = useI18n();
  const [open, setOpen] = useState(false);
  // Homepage exhibit 02/06 embed an inline "Ask Portfolio" input (task 1.2,
  // spec §4 rows 02/06) that hands its question off to this same launcher +
  // widget rather than re-implementing the guardrailed chat engine inline.
  // `portfolio:open-assistant` may now carry `detail.prompt` to prefill —
  // never auto-send — the widget's input; a plain Event (the pre-existing
  // dispatch site in TierList/SecondaryRow) still works with no prefill.
  const [initialPrompt, setInitialPrompt] = useState<string | undefined>(undefined);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const copy = labels[locale];
  const close = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => launcherRef.current?.focus());
  }, []);
  const openPlain = useCallback(() => {
    setInitialPrompt(undefined);
    setOpen(true);
  }, []);

  useEffect(() => {
    const openAssistant = (event: Event) => {
      const prompt = event instanceof CustomEvent && typeof event.detail?.prompt === "string" ? event.detail.prompt : undefined;
      setInitialPrompt(prompt);
      setOpen(true);
    };
    window.addEventListener("portfolio:open-assistant", openAssistant);
    return () => window.removeEventListener("portfolio:open-assistant", openAssistant);
  }, []);

  return (
    <aside className={styles.root} aria-label={copy.open}>
      {open ? (
        <AssistantWidget onClose={close} initialPrompt={initialPrompt} />
      ) : null}
      <button
        ref={launcherRef}
        type="button"
        className={styles.launcher}
        aria-expanded={open}
        aria-controls={open ? "portfolio-assistant-panel" : undefined}
        aria-label={open ? copy.close : copy.open}
        onClick={() => (open ? close() : openPlain())}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
          {open ? (
            <path d="m7 7 10 10M17 7 7 17" />
          ) : (
            <path d="M6.7 18.2 4 20l.8-3.4A8 8 0 1 1 6.7 18.2ZM8 10h8M8 14h5" />
          )}
        </svg>
        <span>{open ? copy.close : copy.open}</span>
      </button>
    </aside>
  );
}
