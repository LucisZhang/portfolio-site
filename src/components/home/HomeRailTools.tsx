"use client";

import CommandPaletteLauncher from "@/components/CommandPaletteLauncher";
import FooterContactLink from "@/components/FooterContactLink";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { featuredProjects, tracks } from "@/lib/projects";

// Spec §2.1 homepage rail: "底部 SEARCH ⌘K / ASK / EN·中 / RESUME" — the
// LegacyRailTools utilities (task 0.5's provisional top-right float,
// see exhibition.css's ".exhibit-rail-tools" comment) "re-homed properly
// into the rail footer" (task 1.2 brief). Rendered once via ExhibitShell's
// single-mount `railTools` slot — same reason as LegacyRailTools: search's
// global ⌘K listener must not double-fire. CSS repositions this single
// instance into the rail's footer row instead of LegacyRailTools' floating
// top-right corner via the `.home-rail-tools` modifier class (home.css).
//
// The public repository ships the first three tools only: the RESUME entry
// is omitted because the approved resume PDFs are owner-private and are
// served solely from the deployment host (see siteIdentity.resume). The
// footer row is a flex container with `gap`, so dropping the entry leaves
// no stray separator or trailing space.
export default function HomeRailTools() {
  function openAssistant() {
    window.dispatchEvent(new Event("portfolio:open-assistant"));
  }

  return (
    <div className="exhibit-rail-footer home-rail-tools">
      <CommandPaletteLauncher tracks={tracks} projects={featuredProjects} />
      <button type="button" className="home-rail-ask" onClick={openAssistant}>ASK</button>
      <LanguageSwitcher />
      <FooterContactLink />
    </div>
  );
}
