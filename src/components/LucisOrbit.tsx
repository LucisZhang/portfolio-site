"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useI18n } from "@/lib/i18n";

const sessionKey = "lucis-orbit-seen-v3";
const entranceMs = 2500;

/* One solar system, rendered large (viewport-center overlay) and small (beside the name).
   Sun at the core; three planets stand for AI applications, data engineering, data analytics.
   Readable labels are part of the hero scene only; the final mark stays small and unlabeled. */
function SolarSystem({ labels }: { labels?: { sun: string; ai: string; engineering: string; analytics: string } }) {
  return (
    <>
      <span className="lo-sun" />
      {labels ? <span className="lo-sun-tag">{labels.sun}</span> : null}
      <span className="lo-orbit lo-o1" />
      <span className="lo-orbit lo-o2" />
      <span className="lo-orbit lo-o3" />
      <span className="lo-planet lo-p1"><i />{labels ? <span className="lo-tag"><b>{labels.ai}</b></span> : null}</span>
      <span className="lo-planet lo-p2"><i />{labels ? <span className="lo-tag"><b>{labels.engineering}</b></span> : null}</span>
      <span className="lo-planet lo-p3"><i />{labels ? <span className="lo-tag"><b>{labels.analytics}</b></span> : null}</span>
    </>
  );
}

export default function LucisOrbit() {
  const { locale } = useI18n();
  const markRef = useRef<HTMLDivElement>(null);
  const [flight, setFlight] = useState<{ tx: number; ty: number; s: number } | null>(null);

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(sessionKey)) return;
      window.sessionStorage.setItem(sessionKey, "1");
      const mark = markRef.current;
      if (!mark) return;
      const rect = mark.getBoundingClientRect();
      // Keep in sync with the overlay size in lucis-orbit.css (min(64vmin, 420px)).
      const overlaySize = Math.min(Math.min(window.innerWidth, window.innerHeight) * 0.64, 420);
      const frame = window.requestAnimationFrame(() => setFlight({
        tx: rect.left + rect.width / 2 - window.innerWidth / 2,
        ty: rect.top + rect.height / 2 - window.innerHeight / 2,
        s: rect.width / overlaySize,
      }));
      const timer = window.setTimeout(() => setFlight(null), entranceMs);
      return () => { window.cancelAnimationFrame(frame); window.clearTimeout(timer); };
    } catch { /* Keep the static symbol when session storage is unavailable. */ }
  }, []);

  return (
    <>
      {flight ? (
        <div
          className="lucis-orbit-overlay"
          data-testid="lucis-orbit-overlay"
          aria-hidden="true"
          style={{ "--tx": `${flight.tx}px`, "--ty": `${flight.ty}px`, "--s": flight.s } as CSSProperties}
        >
          <div className="lucis-orbit-system">
          <SolarSystem labels={locale === "en"
            ? { sun: "Lucis", ai: "AI Applications", engineering: "Data Engineering", analytics: "Data Analytics" }
            : { sun: "Lucis", ai: "AI 应用", engineering: "数据工程", analytics: "数据分析" }} />
        </div>
        </div>
      ) : null}
      <div
        ref={markRef}
        className={`lucis-orbit${flight ? " is-entering" : ""}`}
        data-testid="lucis-orbit"
        data-entering={flight ? "true" : "false"}
        aria-label={locale === "en" ? "Lucis symbol: a small solar system whose three planets stand for AI applications, data engineering, and data analytics" : "Lucis 标记：一个小太阳系，三颗行星分别代表 AI 应用、数据工程与数据分析"}
        role="img"
      >
        <SolarSystem />
      </div>
    </>
  );
}
