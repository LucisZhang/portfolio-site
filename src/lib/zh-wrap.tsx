/** @jsxImportSource react */
// Task R8 (checklist A2) + Task D05: React layer over zh-phrase.ts.
//
// The pragma above pins this file to React's own JSX runtime. tsconfig routes
// every other file through src/lib/zh-jsx (the site-wide word tier), and that
// runtime imports this module -- so this file must not import it back. The
// markup produced here is explicit and never needs the runtime's help.
//
// Generated markup is three UNREGISTERED custom elements, not spans:
//   <zh-run class="zh-run">    one original text run (inline)
//   <zh-seg class="zh-seg">    one word unit (inline + nowrap)
//   <zh-phrase class="zh-phrase"> one clause / authored phrase (inline-block)
// A custom element name is a plain HTMLElement: it inherits every font and
// color property from its parent, carries no role, and -- unlike a span -- is
// never matched by the site's `.foo span` descendant selectors (which set
// mono/label sizes, padding or borders). One outer run keeps the word markers
// inside a single flex/grid item, while inline word markers preserve the exact
// name-from-content that assistive technology receives. The class names are
// test hooks.
//
// Two tiers, both pure functions with no hooks and no client JS of their own:
// - Word tier — zhWrapText / zhWrapNode: body prose, findings, labels.
// - Display tier — zhWrapDisplay / zhGroup / zhVerse: exhibit titles, hero
//   lines, glosses. Clauses become atomic <zh-phrase> groups that wrap
//   internally at word units only when a line cannot hold them; zhGroup fixes
//   an author's cadence for a long clause.
// Strings without han characters are returned UNCHANGED (en byte identity);
// runtimes without Intl.Segmenter fall back to the original. Copyable text is
// never altered.
import {
  Children,
  cloneElement,
  Fragment,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { hasCjk, zhClauseGroups, zhPhraseTokens, type ZhPhraseToken } from "./zh-phrase";

export const ZH_SEG_TAG = "zh-seg";
export const ZH_PHRASE_TAG = "zh-phrase";
export const ZH_RUN_TAG = "zh-run";

type ZhElementProps = React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- React 19 keeps JSX types in this namespace
  namespace React {
    // eslint-disable-next-line @typescript-eslint/no-namespace -- intrinsic element augmentation has no module form
    namespace JSX {
      interface IntrinsicElements {
        "zh-run": ZhElementProps;
        "zh-seg": ZhElementProps;
        "zh-phrase": ZhElementProps;
      }
    }
  }
}

// Inline text tags whose children are safe to (re)segment. Anything else
// (code, a, custom components...) is left untouched.
const WRAPPABLE_TAGS = new Set(["em", "strong", "b", "i", "span", "mark", "small"]);

type AnyElement = ReactElement<{ children?: ReactNode; "data-zh-raw"?: unknown }>;

export const isZhSeg = (node: ReactNode): node is AnyElement => isValidElement(node) && node.type === ZH_SEG_TAG;
export const isZhPhrase = (node: ReactNode): node is AnyElement => isValidElement(node) && node.type === ZH_PHRASE_TAG;
export const isZhRun = (node: ReactNode): node is AnyElement => isValidElement(node) && node.type === ZH_RUN_TAG;

function renderTokens(tokens: ZhPhraseToken[], keyPrefix = ""): ReactNode[] {
  return tokens.map((token, index) =>
    token.wrap ? (
      <zh-seg className="zh-seg" key={`${keyPrefix}${index}`}>
        {token.text}
      </zh-seg>
    ) : (
      token.text
    ),
  );
}

// Word tier: one string into word units. Non-CJK strings come back as-is.
export function zhWrapText(text: string): ReactNode {
  const tokens = zhPhraseTokens(text);
  if (!tokens) return text;
  // Return a one-item keyed list. The site JSX runtime can place several
  // independently coalesced text runs among element children; the nested list
  // keeps React's sibling-key contract without inventing keys from copy.
  return [
    <zh-run className="zh-run" key="run">
      {renderTokens(tokens)}
    </zh-run>,
  ];
}

// Display tier: one string into clause groups of word units.
export function zhDisplayText(text: string): ReactNode {
  const groups = zhClauseGroups(text);
  if (!groups) return text;
  return groups.map((group, index) => {
    if (!group.some((token) => token.wrap)) return group.map((token) => token.text).join("");
    return (
      <zh-phrase className="zh-phrase" key={index}>
        {renderTokens(group, `${index}-`)}
      </zh-phrase>
    );
  });
}

// Authored phrase group for display copy. One part = one atomic clause;
// several parts = one clause whose preferred internal breaks fall between the
// parts (each part stays atomic while it fits). Text is concatenated verbatim.
export function zhGroup(...parts: string[]): ReactNode {
  const render = (part: string, key: number) => {
    const tokens = zhPhraseTokens(part);
    return (
      <zh-phrase className="zh-phrase" key={key}>
        {tokens ? renderTokens(tokens) : part}
      </zh-phrase>
    );
  };
  if (parts.length === 1) return render(parts[0], 0);
  return <zh-phrase className="zh-phrase">{parts.map(render)}</zh-phrase>;
}

// Sugar for a fully authored display line: each entry is one clause, given as
// a string or as its sub-phrases.
export function zhVerse(lines: (string | string[])[]): ReactNode {
  return lines.map((line, index) => (
    <Fragment key={index}>{Array.isArray(line) ? zhGroup(...line) : zhGroup(line)}</Fragment>
  ));
}

const textOf = (node: ReactNode): string => {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement(node)) return textOf((node as AnyElement).props.children);
  return "";
};

// Joins runs of plain text and word units back into strings so a tier can be
// (re)applied. Numbers join too ("共 " + 6 + " 次" becomes one string, which is
// how the tokenizer keeps number and unit together). Authored <zh-phrase>
// groups and every other element are preserved in place.
export function coalesceText(children: ReactNode): ReactNode[] {
  const out: ReactNode[] = [];
  let run = "";
  let sawRun = false;
  const flush = () => {
    if (sawRun) out.push(run);
    run = "";
    sawRun = false;
  };
  for (const child of Children.toArray(children)) {
    if (typeof child === "string" || typeof child === "number") {
      run += String(child);
      sawRun = true;
    } else if (isZhSeg(child) || isZhRun(child)) {
      run += textOf(child);
      sawRun = true;
    } else {
      flush();
      out.push(child);
    }
  }
  flush();
  return out;
}

function walk(node: ReactNode, text: (value: string) => ReactNode): ReactNode {
  if (typeof node === "string") return text(node);
  if (Array.isArray(node) || isZhSeg(node) || isZhRun(node)) {
    return coalesceText(node).map((child, index) => {
      if (typeof child === "string") return <Fragment key={index}>{text(child)}</Fragment>;
      return <Fragment key={index}>{walk(child, text)}</Fragment>;
    });
  }
  if (isValidElement(node)) {
    if (isZhPhrase(node)) return node;
    const element = node as AnyElement;
    // An explicit literal boundary wins over a later explicit word/display
    // pass as well as over the global JSX runtime. This matters for helpers
    // such as LocaleText that apply zhWrapNode to an already-built branch:
    // the raw inline may otherwise be traversed a second time after its host
    // runtime correctly removed the generated markers.
    if (typeof element.type === "string" && element.props["data-zh-raw"] !== undefined) {
      return stripZhUnits(element);
    }
    const wrappable =
      element.type === Fragment ||
      (typeof element.type === "string" && WRAPPABLE_TAGS.has(element.type));
    if (wrappable && element.props.children != null) {
      return cloneElement(element, {}, walk(element.props.children, text));
    }
  }
  return node;
}

// Word tier over a small JSX tree (the exhibit-title pattern:
// <>zh text<br /><em>more zh text</em></>): segments every string leaf and
// keeps element structure (<em> accent, <br /> manual breaks) intact. Word
// units already present are absorbed and re-emitted, so applying it after the
// JSX runtime, or twice, yields the same tree.
export function zhWrapNode(node: ReactNode): ReactNode {
  return walk(node, zhWrapText);
}

// Display tier over a small JSX tree. The JSX runtime may already have
// word-tiered an inline branch (<em>不叫脱敏。</em>); those units are absorbed
// and promoted to clause groups, so every branch of a heading gets the
// display tier. Authored zhGroup() phrases are preserved as they are.
export function zhWrapDisplay(node: ReactNode): ReactNode {
  return walk(node, zhDisplayText);
}

// Removes generated markers (word units AND phrase groups) from an
// already-built subtree (used by the JSX runtime under <pre>/<code>/
// data-zh-raw hosts): characters and element structure are preserved exactly. Custom components are
// opaque here -- their output is created later and must opt out at the leaf.
export function stripZhUnits(node: ReactNode): ReactNode {
  if (typeof node === "string" || typeof node === "number" || node == null || typeof node === "boolean") return node;
  if (Array.isArray(node)) {
    let changed = false;
    const next = node.map((child) => {
      const stripped = stripZhUnits(child);
      if (stripped !== child) changed = true;
      return stripped;
    });
    return changed ? next : node;
  }
  // Both generated markers go: a word unit and a phrase group hold only
  // text (and nested groups), so their exact characters come back as a string.
  if (isZhRun(node) || isZhSeg(node) || isZhPhrase(node)) return textOf(node);
  if (isValidElement(node)) {
    const element = node as AnyElement;
    if (element.type !== Fragment && typeof element.type !== "string") return node;
    const children = element.props.children;
    if (children == null) return node;
    const stripped = stripZhUnits(children);
    if (stripped === children) return node;
    return cloneElement(element, {}, stripped);
  }
  return node;
}

export { hasCjk };
