"use client";

import { useEffect, useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import { hasUsefulSections, textSections, type ArtifactSection } from "@/lib/artifact-sections";

export function ArtifactSections({ sections }: { sections: ArtifactSection[] }) {
  const { locale } = useI18n();
  useEffect(() => {
    let fragment = "";
    try { fragment = decodeURIComponent(window.location.hash.slice(1)); } catch { return; }
    if (sections.some((section) => section.id === fragment)) document.getElementById(fragment)?.scrollIntoView();
  }, [sections]);
  return (
    <aside className="artifact-section-index">
      <nav aria-label={locale === "en" ? "On this page" : "目录"}>
        <strong>{locale === "en" ? "On this page" : "目录"}</strong>
        <ol>{sections.map((section) => <li key={section.id} className={`level-${section.level}`}>
          <a href={`#${section.id}`} onClick={() => document.getElementById(section.id)?.focus({ preventScroll: true })}>{section.label}</a>
        </li>)}</ol>
      </nav>
    </aside>
  );
}

export function ArtifactText({ text }: { text: string }) {
  const sections = useMemo(() => textSections(text), [text]);
  const showSections = hasUsefulSections(text, sections);
  return (
    <div className="artifact-markdown-layout" data-has-sections={showSections}>
      {showSections ? <ArtifactSections sections={sections} /> : null}
      <pre className="artifact-raw-source" tabIndex={0}><code>
        {sections.length ? <>{text.slice(0, sections[0].offset)}{sections.map((section, index) =>
          <span key={section.id} id={section.id} tabIndex={-1}>{text.slice(section.offset, sections[index + 1]?.offset)}</span>,
        )}</> : text}
      </code></pre>
    </div>
  );
}
