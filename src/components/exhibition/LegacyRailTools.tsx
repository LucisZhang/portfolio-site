"use client";

import CommandPaletteLauncher from "@/components/CommandPaletteLauncher";
import FooterContactLink from "@/components/FooterContactLink";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import LocaleLink from "@/components/LocaleLink";
import { featuredProjects, tracks } from "@/lib/projects";

// Re-homes the interactive utilities that used to live in the deleted
// site-header (brand-mark home link, command palette / search trigger,
// language switcher) plus the deleted global footer's contact jump-link
// (task 0.5, spec §2.1). Passed into every legacy page's <ExhibitShell
// railTools={...}> so it mounts exactly once per route — see the
// ExhibitShell railTools comment for why this must not be duplicated the
// way the plain-anchor nav/footer lists are.
export default function LegacyRailTools() {
  return (
    <>
      <LocaleLink href="/" className="rail-home-link">Home</LocaleLink>
      <CommandPaletteLauncher tracks={tracks} projects={featuredProjects} />
      <LanguageSwitcher />
      <FooterContactLink />
    </>
  );
}
