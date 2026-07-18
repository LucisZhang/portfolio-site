"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { localeHref, useI18n } from "@/lib/i18n";

export default function LocaleLink({ href, ...props }: ComponentProps<typeof Link>) {
  const { locale } = useI18n();
  const localizedHref = typeof href === "string" ? localeHref(href, locale) : href;
  return <Link href={localizedHref} {...props} />;
}
