import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExhibitShell } from "@/components/exhibition/ExhibitShell";
import ProjectRailTools from "@/components/exhibition/ProjectRailTools";
import ForgePage from "@/components/forge/ForgePage";
import { forgeRail } from "@/components/forge/forgeRail";
import { getProject } from "@/lib/projects";
import { projectMetadata } from "@/lib/project-metadata";

// Standalone literal route (task: restore route performance budgets).
// Frontier Forge used to be one of four "standalone route composition"
// branches inside the shared src/app/[track]/[project]/page.tsx, reached
// via next/dynamic(). That dynamic() wrapping was believed to code-split
// each branch into its own lazily-loaded chunk (see that file's git
// history), but the built output showed otherwise: Next's client reference
// manifest mapped ForgePage.tsx, EodPage.tsx, TriagePage.tsx, and
// PrivacyPage.tsx to the SAME chunk id as the shared page module itself
// (verified directly against .next/server/app/[track]/[project]/
// page_client-reference-manifest.js -- all four "chunks" arrays terminated
// in the literal page-<hash>.js file). Because src/app/[track]/[project]/
// page.tsx is one compiled entry serving all ten project slugs
// (dynamicParams: false), that merge meant every OTHER project route --
// including ones with nothing to do with Forge/EOD/Triage/Privacy, like
// margin-control-tower -- paid for all four pages' component trees and
// their JSON fixtures (release.json, policies.compact.json, etc.) in its
// own "initial" JS.
//
// A literal static route at this exact URL takes routing precedence over
// the [track]/[project] dynamic segment (standard Next.js behavior), so
// this file is its own webpack entry with its own independent chunk --
// genuinely isolating Forge's cost the way next/dynamic was supposed to.
// Same pattern as src/app/artifact/page.tsx, which already did this and is
// the reason /artifact was never affected by this regression.
export async function generateMetadata(): Promise<Metadata> {
  const project = getProject("ai", "frontier-forge");
  return project ? projectMetadata(project) : {};
}

export default function FrontierForgeRoute() {
  const project = getProject("ai", "frontier-forge");
  if (!project) notFound();
  return (
    // Task W3 (RAIL-SCOPE.md verdict "充实" against the reference-demo
    // layout this page conforms to as of the vermilion-mapped first-screen
    // rebuild): auto-rail v3, entry-open/push/retract-on-content-intent.
    <ExhibitShell rail={forgeRail} railTools={<ProjectRailTools />} mode="auto">
      <ForgePage project={project} />
    </ExhibitShell>
  );
}
