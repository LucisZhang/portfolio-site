"use client";

import Link, { useLinkStatus } from "next/link";
import type { ComponentProps } from "react";
import { createPortal } from "react-dom";
import { localeHref, useI18n } from "@/lib/i18n";
import { zhWrapNode } from "@/lib/zh-wrap";

function NavigationPending({ locale }: { locale: "en" | "zh" }) {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  const indicator = (
    <span
      className="locale-link-pending"
      role="status"
      aria-live="polite"
      data-testid="navigation-pending"
      style={{ position: "fixed", inset: "0 0 auto", zIndex: 120, display: "block", height: 3, background: "var(--accent)", pointerEvents: "none" }}
    >
      <span className="sr-only">{locale === "en" ? "Opening page" : "正在打开页面"}</span>
    </span>
  );
  // A card can establish its own clipping/opacity context. Portal the fixed
  // progress bar to <body> so it stays visible during the route transition.
  return typeof document === "undefined" ? null : createPortal(indicator, document.body);
}

export default function LocaleLink({ href, children, ...props }: ComponentProps<typeof Link>) {
  const { locale } = useI18n();
  const localizedHref = typeof href === "string" ? localeHref(href, locale) : href;
  return (
    <Link href={localizedHref} prefetch={false} {...props}>
      {/* next/link renders its <a> with React's own runtime, so zh link text
          is word-tiered here (Task D05; a no-op for en strings). */}
      {zhWrapNode(children)}
      <NavigationPending locale={locale} />
    </Link>
  );
}
