import { EvidenceScope } from "@/components/exhibition/EvidenceScope.server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExhibitShell } from "@/components/exhibition/ExhibitShell";
import ProjectRepositoryEntry from "@/components/exhibition/ProjectRepositoryEntry";
import ProjectRailTools from "@/components/exhibition/ProjectRailTools";
import RagPage from "@/components/ragdiff/RagPage";
import { ragRail } from "@/components/ragdiff/ragRail";
import { getProject } from "@/lib/projects";
import { projectMetadata } from "@/lib/project-metadata";

// Task L3 [CLAUDE]: standalone literal route -- see src/app/projects/
// frontier-forge/page.tsx's comment for why this exists (route-budget
// regression: a next/dynamic() branch inside the shared project catch-all
// does not actually code-split its chunk away from the other project
// routes). Matches src/app/projects/margin-control-tower/page.tsx's shape
// exactly:
// no server-side work of its own (unlike release-guardian's CSV reads) --
// RagPage.tsx's own ragData.ts statically imports and validates both
// source JSON files at build time.
export async function generateMetadata(): Promise<Metadata> {
  const project = getProject("ai", "rag-quality-lab");
  return project ? projectMetadata(project) : {};
}

export default function RagQualityLabRoute() {
  const project = getProject("ai", "rag-quality-lab");
  if (!project) notFound();
  return (
    <ExhibitShell repositoryEntry={<ProjectRepositoryEntry project={project} />} rail={ragRail} railTools={<ProjectRailTools />} mode="auto">
      <EvidenceScope project="rag">
        <RagPage project={project} />
      </EvidenceScope>
    </ExhibitShell>
  );
}
