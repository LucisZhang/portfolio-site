"use client";

import { useState } from "react";
import { useI18n, type LocalizedString } from "@/lib/i18n";

interface MediaCandidate {
  src: string;
  alt: LocalizedString;
  caption: LocalizedString;
}

type MediaLayout = "default" | "release-staggered" | "privacy-comparison" | "p1-readable";

export default function OptionalMedia({ candidates, layout = "default" }: { candidates: MediaCandidate[]; layout?: MediaLayout }) {
  const { locale, dict } = useI18n();
  const [failed, setFailed] = useState(() => new Set<string>());
  const available = candidates.filter((item) => !failed.has(item.src));

  function markFailed(src: string) {
    setFailed((current) => new Set(current).add(src));
  }

  if (!available.length) {
    return <p className="media-fallback">{dict.mediaUnavailable}</p>;
  }

  const figure = (item: MediaCandidate, wide = false) => (
    <figure key={item.src} style={wide ? { gridColumn: "1 / -1" } : undefined}>
      {/* The native element lets late-arriving public assets render without build-time coupling. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.src} alt={item.alt[locale]} onError={() => markFailed(item.src)} style={wide ? { maxHeight: "none" } : undefined} />
      <figcaption>{item.caption[locale]}</figcaption>
    </figure>
  );

  if (layout === "release-staggered") {
    return <div className="media-grid"><div style={{ display: "grid", gap: 14 }}>{available.slice(0, 2).map((item) => figure(item))}</div>{available[2] ? <div style={{ alignSelf: "center" }}>{figure(available[2])}</div> : null}</div>;
  }

  if (layout === "privacy-comparison") {
    return <div className="media-grid">{figure(available[0])}<span className="media-spacer" aria-hidden="true" />{available.slice(1).map((item) => figure(item))}</div>;
  }

  return <div className="media-grid">{available.map((item, index) => figure(item, layout === "p1-readable" && index === 0))}</div>;
}
