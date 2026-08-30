"use client";

import type { ReactNode } from "react";

// Task F6 (direction B, "the document is the interface"): the shared
// grammar for every mono text-link action row this instrument uses --
// dot-separated words, current selection styled with the vermilion
// underline, zero button/tab-bar chrome. PrivacyTextLab renders the full
// exhibit-01 line (SCAN / USE A SAMPLE FILE / TEXT / IMAGE / PDF / hint)
// with this; PrivacyPreflightLab reuses it for the shorter mode-switch line
// shown while the Image or PDF workspace is active (their own actionbars
// stay separate -- see privacy-page.css / globals.css restyle notes).
export type PrivacyWorkspace = "text" | "image" | "pdf";

export function ActionLineRow({
  items,
  ariaLabel,
  className,
}: {
  items: { key: string; node: ReactNode }[];
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <div className={`privacy-action-line${className ? ` ${className}` : ""}`} aria-label={ariaLabel}>
      {items.map((item, index) => (
        <span className="privacy-action-item" key={item.key}>
          {index > 0 ? (
            <span className="privacy-action-dot" aria-hidden="true">
              ·
            </span>
          ) : null}
          {item.node}
        </span>
      ))}
    </div>
  );
}

// UI fabric (spec: "the action-line verbs are UI fabric = English both
// locales") -- same convention already established by the pre-existing
// "USE A SAMPLE FILE" copy, which was English in both locale objects
// before this task too.
export const WORKSPACE_WORD: Record<PrivacyWorkspace, string> = {
  text: "TEXT",
  image: "IMAGE",
  pdf: "PDF",
};

// A single {key, node} entry wrapping all three mode words in one
// `role="tablist"` span (dots between them are `aria-hidden`, so they drop
// out of the accessibility tree and never count as non-tab tablist
// children). Returned as ONE item -- not three -- so it slots into an
// <ActionLineRow items={...}> list next to SCAN/USE A SAMPLE FILE/the hint
// without putting non-tab siblings inside the tablist itself (those words
// are commands, not panel switches, and a tablist's owned children must
// all be tabs).
export function workspaceLinkItems(
  workspace: PrivacyWorkspace,
  onSwitch: (next: PrivacyWorkspace) => void,
  ariaLabel: string,
) {
  const ids: PrivacyWorkspace[] = ["text", "image", "pdf"];
  return [
    {
      key: "workspace-tabs",
      node: (
        <span role="tablist" aria-label={ariaLabel} className="privacy-action-tablist">
          {ids.map((id, index) => (
            <span className="privacy-action-item" key={id}>
              {index > 0 ? (
                <span className="privacy-action-dot" aria-hidden="true">
                  ·
                </span>
              ) : null}
              <button
                type="button"
                role="tab"
                aria-selected={workspace === id}
                className={`privacy-action-link${workspace === id ? " current" : ""}`}
                onClick={() => onSwitch(id)}
              >
                {WORKSPACE_WORD[id]}
              </button>
            </span>
          ))}
        </span>
      ),
    },
  ];
}
