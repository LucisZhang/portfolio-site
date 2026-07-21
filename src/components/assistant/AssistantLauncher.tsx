"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
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
  en: { open: "Ask about Xiangguo", close: "Close portfolio assistant", loading: "Loading assistant…" },
  zh: { open: "询问章向国", close: "关闭作品集助手", loading: "正在加载助手…" },
} as const;

export default function AssistantLauncher() {
  const { locale } = useI18n();
  const [open, setOpen] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const copy = labels[locale];
  const close = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => launcherRef.current?.focus());
  }, []);

  return (
    <aside className={styles.root} aria-label={copy.open}>
      {open ? (
        <AssistantWidget onClose={close} />
      ) : null}
      <button
        ref={launcherRef}
        type="button"
        className={styles.launcher}
        aria-expanded={open}
        aria-controls={open ? "portfolio-assistant-panel" : undefined}
        aria-label={open ? copy.close : copy.open}
        onClick={() => (open ? close() : setOpen(true))}
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
