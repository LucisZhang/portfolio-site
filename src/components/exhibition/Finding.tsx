import type { ReactNode } from "react";

export type FindingKind = "negative" | "limitation" | "note" | "pass";

// UI fabric stays English-only per spec §2.6; narrative body content is left
// to the caller (bilingual or not). Defaults are overridable via `label` for
// the rare case a page needs a more specific status word, but the semantic
// treatment (hairline vs 3px top line, hue) always follows `kind`.
const DEFAULT_LABELS: Record<FindingKind, string> = {
  negative: "NEGATIVE RESULT",
  limitation: "LIMITATION",
  note: "NOTE",
  pass: "PASS",
};

// Renders the hairline-top-border / 3px-ink-top-line + mono label treatment
// from spec §2.2's semantic table. No background fill, no left border, no
// icons — hue × line-weight × label word carry the meaning.
export function Finding({
  kind,
  label,
  children,
}: {
  kind: FindingKind;
  label?: string;
  children: ReactNode;
}) {
  return (
    <div className="exhibit-finding" data-finding={kind}>
      <p className="exhibit-finding-label">{label ?? DEFAULT_LABELS[kind]}</p>
      <div className="exhibit-finding-body">{children}</div>
    </div>
  );
}
