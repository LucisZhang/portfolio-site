"use client";

import { localeHref, useI18n } from "@/lib/i18n";

export default function FooterContactLink() {
  const { locale } = useI18n();
  return (
    <a href={localeHref("/#contact", locale)}>
      {locale === "en" ? "Contact Xiangguo" : "联系章向国"}
    </a>
  );
}
