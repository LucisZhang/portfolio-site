// Task D05: site-wide Chinese word-tier line breaking via the JSX runtime.
//
// tsconfig sets `jsxImportSource` to this directory, so JSX in src/ is
// created through `jsx` / `jsxs` below instead of react/jsx-runtime (the one
// exception is src/lib/zh-wrap.tsx, pinned to React's runtime by a file-level
// pragma so the two modules do not import each other in a cycle).
//
// Scope, deliberately narrow:
// - Only HOST elements (tag-name strings such as "p", "li", "dd", "td") are
//   touched. Components and the Fragment factory pass through unchanged.
// - Within a wrappable host, the children are walked: runs of adjacent
//   strings and numbers are joined ("共 " + 6 + " 次" -> "共 6 次", so number
//   and unit stay together) and, when they contain han characters, replaced by
//   <zh-seg> word units; Fragment children (<>...</> written inside the host)
//   are walked the same way; other elements are left alone -- they were
//   already created by their own jsx() call.
// - Under <pre>, <code>, form controls, SVG text, document metadata, or any
//   host carrying `data-zh-raw`, word units produced by already-created
//   children are stripped again (characters and structure preserved). This
//   covers literal subtrees. Children rendered later by a custom component
//   inside such a host are not visible here and must opt out at their leaf.
// - A component that returns a bare Fragment or string never passes through
//   a host jsx() call; those text exits call zhWrapNode explicitly
//   (Guardian's LocaleText, LocaleLink's children).
// Guarantees: en strings are untouched (no han, no change); server and client
// build the same tree from the same props; React owns every node it creates;
// copyable text is unchanged. Cross-engine segmentation parity is a separate
// gate (scripts/verify-zh-token-parity.mjs).
import { Fragment as ReactFragment, isValidElement, cloneElement, type ReactElement, type ReactNode } from "react";
import { jsx as reactJsx, jsxs as reactJsxs } from "react/jsx-runtime";
import { ZH_PHRASE_TAG, ZH_RUN_TAG, ZH_SEG_TAG, stripZhUnits, zhWrapText } from "../zh-wrap";

export type { JSX } from "react/jsx-runtime";
export const Fragment = ReactFragment;

const HAS_CJK = /[㐀-䶿一-鿿豈-﫿]/;
const SKIP_TAGS = new Set([
  "code", "pre", "kbd", "samp", "var", "textarea", "option", "optgroup", "select", "title", "script", "style",
  "noscript", "template", "text", "tspan", "textPath", "desc", "math", "ruby", "rt", "rp",
]);

type Props = { children?: ReactNode; "data-zh-raw"?: unknown } & Record<string, unknown>;
type FragmentElement = ReactElement<{ children?: ReactNode }>;

const isFragmentElement = (node: ReactNode): node is FragmentElement => isValidElement(node) && node.type === ReactFragment;

// Segmenting is deterministic per string; cache the produced nodes (React
// elements are immutable and may be reused across renders).
const cache = new Map<string, ReactNode>();
const CACHE_LIMIT = 4000;

function wrapString(text: string): ReactNode {
  const cached = cache.get(text);
  if (cached !== undefined) return cached;
  const wrapped = zhWrapText(text);
  if (cache.size >= CACHE_LIMIT) cache.clear();
  cache.set(text, wrapped);
  return wrapped;
}

function wrapHostChildren(children: ReactNode): ReactNode {
  if (typeof children === "string") return HAS_CJK.test(children) ? wrapString(children) : children;
  if (isFragmentElement(children)) {
    const inner = wrapHostChildren(children.props.children);
    return inner === children.props.children ? children : cloneElement(children, {}, inner);
  }
  if (!Array.isArray(children)) return children;
  const needsWork = children.some(
    (child) => (typeof child === "string" && HAS_CJK.test(child)) || typeof child === "number" || isFragmentElement(child) || Array.isArray(child),
  );
  if (!needsWork) return children;
  const out: ReactNode[] = [];
  let run: (string | number)[] = [];
  let changed = false;
  const flush = () => {
    if (!run.length) return;
    const joined = run.map(String).join("");
    if (HAS_CJK.test(joined)) {
      out.push(wrapString(joined));
      changed = true;
    } else {
      out.push(...run); // en runs keep their exact original children
    }
    run = [];
  };
  for (const child of children) {
    if (typeof child === "string" || typeof child === "number") {
      run.push(child);
      continue;
    }
    flush();
    if (Array.isArray(child)) {
      // A nested array is its own keyed list: walk it as a sub-list (runs do
      // not join across the list boundary; order and characters are kept).
      const inner = wrapHostChildren(child);
      if (inner !== child) changed = true;
      out.push(inner);
      continue;
    }
    if (isFragmentElement(child)) {
      const inner = wrapHostChildren(child.props.children);
      if (inner !== child.props.children) {
        out.push(cloneElement(child, {}, inner));
        changed = true;
        continue;
      }
    }
    out.push(child);
  }
  flush();
  return changed ? out : children;
}

function transform(type: unknown, props: Props): Props {
  if (typeof type !== "string" || type === ZH_RUN_TAG || type === ZH_SEG_TAG || type === ZH_PHRASE_TAG) return props;
  const children = props.children;
  if (children == null) return props;
  if (SKIP_TAGS.has(type) || props["data-zh-raw"] !== undefined) {
    const stripped = stripZhUnits(children);
    return stripped === children ? props : { ...props, children: stripped };
  }
  const wrapped = wrapHostChildren(children);
  return wrapped === children ? props : { ...props, children: wrapped };
}

type JsxFn = typeof reactJsx;

export const jsx: JsxFn = (type, props, key) => reactJsx(type, transform(type, props as Props) as never, key);
export const jsxs: JsxFn = (type, props, key) => reactJsxs(type, transform(type, props as Props) as never, key);
// Shared with jsx-dev-runtime.ts.
export const transformZhProps = transform;
