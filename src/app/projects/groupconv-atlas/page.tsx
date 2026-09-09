import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EvidenceScope } from "@/components/exhibition/EvidenceScope.server";
import { ExhibitShell } from "@/components/exhibition/ExhibitShell";
import ProjectRepositoryEntry from "@/components/exhibition/ProjectRepositoryEntry";
import ProjectRailTools from "@/components/exhibition/ProjectRailTools";
import GroupConvPage from "@/components/groupconv/GroupConvPage";
import { groupconvRail } from "@/components/groupconv/groupconvRail";
import { getProject } from "@/lib/projects";
import { projectMetadata } from "@/lib/project-metadata";

// A literal route keeps the Atlas component tree and data out of legacy bundles.
export async function generateMetadata(): Promise<Metadata> {
  const project = getProject("ai", "groupconv-atlas");
  return project ? projectMetadata(project) : {};
}

export default function GroupConvAtlasRoute() {
  const project = getProject("ai", "groupconv-atlas");
  if (!project) notFound();
  return (
    <ExhibitShell repositoryEntry={<ProjectRepositoryEntry project={project} />} rail={groupconvRail} railTools={<ProjectRailTools />} mode="auto">
      <EvidenceScope project="groupconv">
        <GroupConvPage project={project} />
      </EvidenceScope>
    </ExhibitShell>
  );
}
