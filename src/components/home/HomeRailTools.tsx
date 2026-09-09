"use client";

import CommandPaletteLauncher from "@/components/CommandPaletteLauncher";
import FooterContactLink from "@/components/FooterContactLink";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n";
import { navigationCopy } from "@/lib/navigation";

// Render the homepage utilities once through ExhibitShell's railTools slot;
// the command palette owns a global keyboard listener and must not mount
// twice. CSS places this single instance in the rail footer.
export default function HomeRailTools() {
  const { locale } = useI18n();

  function openAssistant() {
    window.dispatchEvent(new Event("portfolio:open-assistant"));
  }

  return (
    <div className="exhibit-rail-footer home-rail-tools">
      <CommandPaletteLauncher />
      <button type="button" className="home-rail-ask" onClick={openAssistant}>{navigationCopy.ask[locale]}</button>
      <LanguageSwitcher />
      <FooterContactLink />
    </div>
  );
}
