"use client";

import { useI18n, type Locale } from "@/lib/i18n";

const options: { locale: Locale; label: string }[] = [
  { locale: "en", label: "EN" },
  { locale: "zh", label: "中" },
];

export default function LanguageSwitcher() {
  const { locale, setLocale, dict } = useI18n();

  return (
    <div aria-label={dict.language} className="language-switcher">
      {options.map((option) => (
        <button
          key={option.locale}
          type="button"
          onClick={() => setLocale(option.locale)}
          aria-pressed={locale === option.locale}
          className={locale === option.locale ? "active" : undefined}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
