"use client";

import { useState } from "react";
import { useI18n, type LocalizedString } from "@/lib/i18n";

interface MediaCandidate {
  src: string;
  alt: LocalizedString;
  caption: LocalizedString;
}

export default function OptionalMedia({ candidates }: { candidates: MediaCandidate[] }) {
  const { locale, dict } = useI18n();
  const [failed, setFailed] = useState(() => new Set<string>());
  const available = candidates.filter((item) => !failed.has(item.src));

  function markFailed(src: string) {
    setFailed((current) => new Set(current).add(src));
  }

  if (!available.length) {
    return <p className="media-fallback">{dict.mediaUnavailable}</p>;
  }

  return (
    <div className="media-grid">
      {available.map((item) => (
        <figure key={item.src}>
          {/* The native element lets late-arriving public assets render without build-time coupling. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.src} alt={item.alt[locale]} onError={() => markFailed(item.src)} />
          <figcaption>{item.caption[locale]}</figcaption>
        </figure>
      ))}
    </div>
  );
}
