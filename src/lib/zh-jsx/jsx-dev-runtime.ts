// Development counterpart of jsx-runtime.ts (Next uses react/jsx-dev-runtime
// in `next dev`). Same host-only transform; only the entry point differs.
import { Fragment as ReactFragment } from "react";
import { jsxDEV as reactJsxDEV } from "react/jsx-dev-runtime";
import { transformZhProps } from "./jsx-runtime";

export type { JSX } from "react/jsx-dev-runtime";
export const Fragment = ReactFragment;

type JsxDevFn = typeof reactJsxDEV;

export const jsxDEV: JsxDevFn = (type, props, key, isStatic, source, self) =>
  reactJsxDEV(type, transformZhProps(type, props as never) as never, key, isStatic, source, self);
