"use client";

import CommandPaletteLauncher from "@/components/CommandPaletteLauncher";
import FooterContactLink from "@/components/FooterContactLink";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { featuredProjects, tracks } from "@/lib/projects";
import { useI18n } from "@/lib/i18n";
import { navigationCopy } from "@/lib/navigation";

// Mounted once per route so search owns one keyboard listener. The shared
// rail footer supplies the collection return link for each responsive layout.
export default function ProjectRailTools() {
  const { locale } = useI18n();
  return (
    <div className="exhibit-rail-footer project-rail-tools" role="group" aria-label={navigationCopy.projectTools[locale]}>
      <CommandPaletteLauncher tracks={tracks} projects={featuredProjects} />
      <LanguageSwitcher />
      <FooterContactLink />
    </div>
  );
}
