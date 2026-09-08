"use client";

import { useI18n } from "@/lib/i18n";

export default function RailLocalizedLabel({ en, zh }: { en: string; zh: string }) {
  const { locale } = useI18n();
  return <>{locale === "zh" ? zh : en}</>;
}
