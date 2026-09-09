"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useI18n, type LocalizedString } from "@/lib/i18n";

// Shared wrapper for horizontal-overflow scrollers (wide evidence tables,
// request/SQL snippets). Chromium's focus heuristic puts an overflowing
// scroller in the tab order by itself; WebKit never does, which left every
// off-screen table column and the forge request text mouse-only in Safari
// (F-05 audit). This wrapper owns that gap: after hydration it measures real
// overflow and only then grants tabindex/role/aria-label, so a region that
// happens to fit (wide viewport, mobile card fallback) never becomes a
// redundant tab stop, and the accessible name always matches the active
// locale. Server output stays the plain wrapper element — static markup,
// layout and the no-JS page are byte-identical to the previous divs/pres.
export default function ScrollRegion({
  as: Tag = "div",
  label,
  className,
  children,
  ...rest
}: {
  as?: "div" | "pre" | "p";
  label: LocalizedString;
  className?: string;
  children: ReactNode;
} & Record<`data-${string}`, string | undefined>) {
  const { locale } = useI18n();
  const ref = useRef<HTMLElement | null>(null);
  const name = label[locale];

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const sync = () => {
      if (el.scrollWidth - el.clientWidth > 1) {
        el.tabIndex = 0;
        el.setAttribute("role", "region");
        el.setAttribute("aria-label", name);
      } else {
        el.removeAttribute("tabindex");
        el.removeAttribute("role");
        el.removeAttribute("aria-label");
      }
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    // The wrapper's own box can keep its size while the content inside it
    // changes width (claim-table filters, request-tab switches), so watch
    // the direct children too.
    for (const child of el.children) observer.observe(child);
    return () => observer.disconnect();
  }, [name, children]);

  return (
    <Tag ref={ref as never} className={className} data-scroll-region="" {...rest}>
      {children}
    </Tag>
  );
}
