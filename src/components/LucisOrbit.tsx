"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

const sessionKey = "lucis-orbit-seen-v2";

export default function LucisOrbit() {
  const { locale } = useI18n();
  const [entering, setEntering] = useState(false);

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(sessionKey)) return;
      window.sessionStorage.setItem(sessionKey, "1");
      const frame = window.requestAnimationFrame(() => setEntering(true));
      const timer = window.setTimeout(() => setEntering(false), 1100);
      return () => { window.cancelAnimationFrame(frame); window.clearTimeout(timer); };
    } catch { /* Keep the static mark when session storage is unavailable. */ }
  }, []);

  return (
    <div
      className={`lucis-orbit${entering ? " is-entering" : ""}`}
      data-testid="lucis-orbit"
      data-entering={entering ? "true" : "false"}
      aria-label={locale === "en" ? "Lucis mark: AI applications, data engineering, and data analytics signals converge into Lucis" : "Lucis 标记：AI 应用、数据工程与数据分析三路信号汇聚为 Lucis"}
      role="img"
    >
      <span className="lucis-orbit-signal signal-ai" aria-hidden="true" />
      <span className="lucis-orbit-signal signal-engineering" aria-hidden="true"><i /><i /><i /></span>
      <span className="lucis-orbit-signal signal-analytics" aria-hidden="true"><i /><i /><i /></span>
      <span className="lucis-orbit-line line-ai" aria-hidden="true" />
      <span className="lucis-orbit-line line-engineering" aria-hidden="true" />
      <span className="lucis-orbit-line line-analytics" aria-hidden="true" />
      <span className="lucis-orbit-word" aria-hidden="true">Lucis</span>
    </div>
  );
}
