"use client";

import { localeHref, useI18n } from "@/lib/i18n";
import { navigationCopy } from "@/lib/navigation";

export default function FooterContactLink() {
  const { locale } = useI18n();
  return (
    <a href={localeHref("/#contact", locale)}>
      {navigationCopy.contact[locale]}
    </a>
  );
}
