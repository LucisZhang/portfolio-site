export type ArtifactSection = { id: string; label: string; level: number; offset?: number };

export function sectionSlug(value: string) {
  return value.toLowerCase().trim().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "section";
}

// Keep the existing Markdown viewer's shareable heading IDs, including duplicate
// headings. The prefix comes from text, never from raw HTML or an authored id.
export function sectionId(label: string, index: number) {
  return `${sectionSlug(label)}-${index + 1}`;
}

export function hasUsefulSections(text: string, sections: ArtifactSection[]) {
  return sections.length > 1 && (text.length >= 1200 || text.split("\n").length >= 40);
}

export function textSections(text: string): ArtifactSection[] {
  const lines = text.split(/(?<=\n)/);
  const sections: ArtifactSection[] = [];
  let offset = 0;
  let fence: string | undefined;
  lines.forEach((line, index) => {
    const raw = line.trimEnd();
    const fenced = /^\s*(`{3,}|~{3,})/.exec(raw);
    if (fenced) fence = fence?.[0] === fenced[1][0] ? undefined : fence ?? fenced[1];
    if (!fence && !fenced) {
      // Mermaid source may carry section comments; ordinary text keeps Markdown
      // ATX/setext headings without interpreting or rewriting any source bytes.
      const atx = /^\s*(?:%%\s*)?(#{1,6})\s+(.+?)(?:\s+#+)?\s*$/.exec(raw);
      const underline = lines[index + 1]?.trim();
      const setext = raw.trim() && underline && /^(?:={3,}|-{3,})$/.test(underline);
      const label = atx?.[2] ?? (setext ? raw.trim() : "");
      if (label) sections.push({ id: sectionId(label, sections.length), label, level: atx ? atx[1].length : underline?.[0] === "=" ? 1 : 2, offset });
    }
    offset += line.length;
  });
  return sections;
}
