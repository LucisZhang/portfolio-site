"use client";

import { useI18n } from "@/lib/i18n";
import type { RailSpec } from "@/lib/navigation";

// Both translations are required by the shared rail contract. The server
// snapshot remains English; hydration follows the site's locale store.
export default function RailCopy({ copy }: { copy: NonNullable<RailSpec["copy"]> }) {
  const { locale } = useI18n();
  return <p className={`exhibit-rail-copy-${locale}`} lang={locale}>{copy[locale]}</p>;
}
