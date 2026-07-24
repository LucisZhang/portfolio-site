"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useI18n } from "@/lib/i18n";

const sessionKey = "lucis-orbit-seen-v5";
const entranceMs = 2500;

/* One solar system, rendered large (viewport-center overlay) and small (below the name).
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

type Phase =
  | { kind: "veil" } // SSR + first paint: opaque paper veil only, no flash of the homepage.
  | { kind: "flight"; tx: number; ty: number; s: number }
  | { kind: "done" };

export default function LucisOrbit() {
  const { locale } = useI18n();
  const emblemRef = useRef<HTMLSpanElement>(null);
  // Initial state matches SSR exactly: veil up, mark rendered, no system yet.
  const [phase, setPhase] = useState<Phase>({ kind: "veil" });

  useEffect(() => {
    const done = () => setPhase({ kind: "done" });
    try {
      if (window.sessionStorage.getItem(sessionKey)) { done(); return; }
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { done(); return; }
      window.sessionStorage.setItem(sessionKey, "1");
      const emblem = emblemRef.current;
      if (!emblem) { done(); return; }
      const rect = emblem.getBoundingClientRect();
      // Keep in sync with the overlay size in lucis-orbit.css (min(64vmin, 420px)).
      const overlaySize = Math.min(Math.min(window.innerWidth, window.innerHeight) * 0.64, 420);
      const frame = window.requestAnimationFrame(() => setPhase({
        kind: "flight",
        tx: rect.left + rect.width / 2 - window.innerWidth / 2,
        ty: rect.top + rect.height / 2 - window.innerHeight / 2,
        s: rect.width / overlaySize,
      }));
      const timer = window.setTimeout(done, entranceMs);
      return () => { window.cancelAnimationFrame(frame); window.clearTimeout(timer); };
    } catch { done(); }
  }, []);

  const flying = phase.kind === "flight";
  return (
    <>
      {/* No-JS fallback: without hydration the veil would stay opaque forever. The style
          inside <noscript> applies only when scripting is disabled (RAWTEXT otherwise). */}
      <noscript>
        <style>{".lucis-orbit-overlay{display:none!important}"}</style>
      </noscript>
      {phase.kind !== "done" ? (
        <div
          className={`lucis-orbit-overlay${flying ? " is-live" : ""}`}
          data-testid="lucis-orbit-overlay"
          data-phase={phase.kind}
          aria-hidden="true"
          style={flying ? { "--tx": `${phase.tx}px`, "--ty": `${phase.ty}px`, "--s": phase.s } as CSSProperties : undefined}
        >
          {flying ? (
            <div className="lucis-orbit-system">
              <SolarSystem labels={locale === "en"
                ? { sun: "Lucis", ai: "AI Applications", engineering: "Data Engineering", analytics: "Data Analytics" }
                : { sun: "Lucis", ai: "AI 应用", engineering: "数据工程", analytics: "数据分析" }} />
            </div>
          ) : null}
        </div>
      ) : null}
      <div
        className={`lucis-orbit${flying ? " is-entering" : ""}`}
        data-testid="lucis-orbit"
        data-entering={flying ? "true" : "false"}
        aria-label={locale === "en" ? "Lucis symbol: a small solar system whose three planets stand for AI applications, data engineering, and data analytics" : "Lucis 标记：一个小太阳系，三颗行星分别代表 AI 应用、数据工程与数据分析"}
        role="img"
      >
        <span className="lucis-orbit-emblem" ref={emblemRef} aria-hidden="true"><SolarSystem /></span>
        <span className="lucis-orbit-wordmark" aria-hidden="true">Lucis</span>
      </div>
    </>
  );
}
