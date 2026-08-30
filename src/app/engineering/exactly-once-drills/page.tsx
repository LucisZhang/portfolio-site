import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExhibitShell } from "@/components/exhibition/ExhibitShell";
import ProjectRailTools from "@/components/exhibition/ProjectRailTools";
import EodPage from "@/components/eod/EodPage";
import { eodRail } from "@/components/eod/eodRail";
import { getProject } from "@/lib/projects";
import { projectMetadata } from "@/lib/project-metadata";

// Standalone literal route -- see src/app/ai/frontier-forge/page.tsx's
// comment for why this exists (route-budget regression: next/dynamic()
// inside the shared [track]/[project] catch-all did not actually
// code-split this page's chunk away from the other nine project routes).
export async function generateMetadata(): Promise<Metadata> {
  const project = getProject("engineering", "exactly-once-drills");
  return project ? projectMetadata(project) : {};
}

export default function ExactlyOnceDrillsRoute() {
  const project = getProject("engineering", "exactly-once-drills");
  if (!project) notFound();
  return (
    // Task W3 (RAIL-SCOPE.md verdict "充实" -- "几乎零改动，本页就是单栏
    // 满幅的范本"): auto-rail v3, entry-open/push/retract-on-content-intent.
    <ExhibitShell rail={eodRail} railTools={<ProjectRailTools />} mode="auto">
      <EodPage project={project} />
    </ExhibitShell>
  );
}
