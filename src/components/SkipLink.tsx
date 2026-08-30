"use client";

import { useI18n } from "@/lib/i18n";

// Fix (audit3 zh de-anglicization): was a hardcoded English literal in
// layout.tsx, rendered before LanguageProvider mounts, so it could not
// read locale. Moved inside LanguageProvider (same DOM position -- first
// element in <body>) so it can localize like everything else.
export default function SkipLink() {
  const { dict } = useI18n();
  return (
    <a href="#main-content" className="skip-link">
      {dict.skipToContent}
    </a>
  );
}
