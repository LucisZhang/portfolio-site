"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

const sessionKey = "lucis-orbit-seen-v1";

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
    } catch { /* Keep the static symbol when session storage is unavailable. */ }
  }, []);

  return (
    <div
      className={`lucis-orbit${entering ? " is-entering" : ""}`}
      data-testid="lucis-orbit"
      aria-label={locale === "en" ? "Lucis Orbit: AI applications, data engineering, and data analytics" : "Lucis Orbit：AI 应用、数据工程与数据分析"}
      role="img"
    >
      <span className="lucis-orbit-core" aria-hidden="true">L</span>
      <span className="lucis-orbit-node node-ai" aria-hidden="true" />
      <span className="lucis-orbit-node node-engineering" aria-hidden="true" />
      <span className="lucis-orbit-node node-analytics" aria-hidden="true" />
    </div>
  );
}
