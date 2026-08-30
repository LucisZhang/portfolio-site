"use client";

import CommandPaletteLauncher from "@/components/CommandPaletteLauncher";
import FooterContactLink from "@/components/FooterContactLink";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { featuredProjects, tracks } from "@/lib/projects";

// Task F14 (spec §2.1/§2.5): none of the 10 standalone project routes ever
// grew the SEARCH ⌘K / EN·中 / contact trio home's rail ships — a sitewide
// gap discovered mid task-suite-reconcile, then REVERTED there:
// `railTools={<LegacyRailTools />}` on all ten routes built and typechecked
// clean, but pushed "/"'s route-own bundle from 45,193 to 50,707 gzip bytes,
// over Ruling R11's hard, never-loosened 50,000 ceiling, via an apparent
// webpack shared-chunk shift (see task-suite-reconcile-report.md).
//
// This component deliberately mounts ONLY the three leaf client modules
// HomeRailTools already mounts (CommandPaletteLauncher, LanguageSwitcher,
// FooterContactLink) — not LegacyRailTools itself, whose only other piece
// is a `<LocaleLink href="/">Home</LocaleLink>` (pulling in next/link's
// client runtime + react-dom's createPortal for its pending-nav indicator,
// neither of which HomeRailTools' import graph otherwise touches). Every
// project rail already carries a way home via its own `rail.footer` entry
// ("← ALL WORK"), so re-adding a second Home link here would be a visual
// duplicate, not a fix, while dropping it also drops the one import that
// isn't already shared with home's own bundle. ASK/RESUME stay
// homepage-only (spec §2.1 scopes them to "/"), so this stays a plain
// three-item trio, not a copy of HomeRailTools.
//
// Locale-preserving behavior (spec §2.5, "must not lose the page/hash") is
// free: LanguageSwitcher's setLocale ultimately calls src/lib/i18n.ts's
// setStoredLocale, which rewrites only the `lang` query param via
// `window.history.replaceState(..., url.pathname + url.search + url.hash)`
// — the current path and hash always round-trip untouched, on every route,
// with no per-page wiring needed.
export default function ProjectRailTools() {
  return (
    <div className="exhibit-rail-footer project-rail-tools">
      <CommandPaletteLauncher tracks={tracks} projects={featuredProjects} />
      <LanguageSwitcher />
      <FooterContactLink />
    </div>
  );
}
