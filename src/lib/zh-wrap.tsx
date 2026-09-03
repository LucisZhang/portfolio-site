// Task R8 (checklist A2): React layer over zh-phrase.ts. Renders each zh
// phrase chunk as an unbreakable inline-block span (`.zh-seg`, globals.css)
// so display-type Chinese wraps at phrase boundaries instead of between
// arbitrary han characters. Pure functions, no hooks and no client JS of
// their own — usable from RSC (Finding, StatGrid, Exhibit) and from the
// "use client" page components alike. Strings without han characters (all
// en-locale copy) are returned UNCHANGED, so en rendering stays
// byte-identical; runtimes without Intl.Segmenter also fall back to the
// unwrapped original (current behavior, never worse).
import {
  Children,
  cloneElement,
  Fragment,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { zhPhraseTokens } from "@/lib/zh-phrase";

// Inline text tags whose string children are safe to segment. Anything else
// (code, a, custom components…) is left untouched — content inside those is
// either preformatted or owned by another component.
const WRAPPABLE_TAGS = new Set(["em", "strong", "b", "i", "span", "mark", "small"]);

// Segments one string into phrase spans. Non-CJK strings come back as-is.
export function zhWrapText(text: string): ReactNode {
  const tokens = zhPhraseTokens(text);
  if (!tokens) return text;
  return tokens.map((token, index) =>
    token.wrap ? (
      <span className="zh-seg" key={index}>
        {token.text}
      </span>
    ) : (
      token.text
    ),
  );
}

// Walks a small JSX tree (the exhibit-title pattern:
// <>zh text<br /><em>more zh text</em></>) and segments every string leaf,
// keeping element structure — <em> accent color, <br /> manual breaks —
// intact. (Comments here stay ASCII-only: zh-glyph-corpus.mjs scans source
// bytes for the subset font's required glyphs.)
export function zhWrapNode(node: ReactNode): ReactNode {
  if (typeof node === "string") return zhWrapText(node);
  if (Array.isArray(node)) return Children.map(node, zhWrapNode);
  if (isValidElement(node)) {
    const element = node as ReactElement<{ children?: ReactNode }>;
    const wrappable =
      element.type === Fragment ||
      (typeof element.type === "string" && WRAPPABLE_TAGS.has(element.type));
    if (wrappable && element.props.children != null) {
      return cloneElement(element, {}, zhWrapNode(element.props.children));
    }
  }
  return node;
}
