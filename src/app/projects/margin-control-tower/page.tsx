import { EvidenceScope } from "@/components/exhibition/EvidenceScope.server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExhibitShell } from "@/components/exhibition/ExhibitShell";
import ProjectRepositoryEntry from "@/components/exhibition/ProjectRepositoryEntry";
import ProjectRailTools from "@/components/exhibition/ProjectRailTools";
import MarginPage from "@/components/margin/MarginPage";
import { marginRail } from "@/components/margin/marginRail";
import { getProject } from "@/lib/projects";
import { projectMetadata } from "@/lib/project-metadata";

// Standalone literal route -- see src/app/projects/frontier-forge/page.tsx's
// comment for why this exists (route-budget regression: next/dynamic()
// inside the shared project catch-all did not actually code-split each
// page's chunk away from the other project routes).
export async function generateMetadata(): Promise<Metadata> {
  const project = getProject("analytics", "margin-control-tower");
  return project ? projectMetadata(project) : {};
}

export default function MarginControlTowerRoute() {
  const project = getProject("analytics", "margin-control-tower");
  if (!project) notFound();
  return (
    <ExhibitShell repositoryEntry={<ProjectRepositoryEntry project={project} />} rail={marginRail} railTools={<ProjectRailTools />} mode="auto">
      <EvidenceScope project="margin">
        <MarginPage project={project} />
      </EvidenceScope>
    </ExhibitShell>
  );
}
