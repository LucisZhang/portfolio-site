"use client";

import { useEffect } from "react";
import { useI18n, type LocalizedString } from "@/lib/i18n";

export default function LocaleDocumentMetadata({
  title,
  description,
}: {
  title: LocalizedString;
  description: LocalizedString;
}) {
  const { locale } = useI18n();
  const { en: titleEn, zh: titleZh } = title;
  const { en: descriptionEn, zh: descriptionZh } = description;

  useEffect(() => {
    const localizedTitle = locale === "zh" ? titleZh : titleEn;
    const localizedDescription = locale === "zh" ? descriptionZh : descriptionEn;
    const synchronize = () => {
      if (document.title !== localizedTitle) document.title = localizedTitle;

      for (const descriptionMeta of document.querySelectorAll<HTMLMetaElement>('meta[name="description"]')) {
        if (descriptionMeta.content !== localizedDescription) descriptionMeta.content = localizedDescription;
      }
    };

    synchronize();
    // Next.js can stream its static English metadata after client effects run. Keep the
    // browser metadata aligned without making the statically generated route request-aware.
    const observer = new MutationObserver(synchronize);
    observer.observe(document.head, { attributes: true, characterData: true, childList: true, subtree: true });
    return () => observer.disconnect();
  }, [descriptionEn, descriptionZh, locale, titleEn, titleZh]);

  return null;
}
