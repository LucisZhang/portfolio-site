"use client";

import { useI18n } from "@/lib/i18n";

export function LiveSlot() {
  const { locale } = useI18n();
  return (
    <p className="forge-live-slot" data-live-slot data-live-state="closed">
      {locale === "en" ? "RECORDED EVALUATION · OFFLINE REPLAY" : "历史评测 · 离线回放"}
    </p>
  );
}
