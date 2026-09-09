import { EvidenceScope } from "@/components/exhibition/EvidenceScope.server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExhibitShell } from "@/components/exhibition/ExhibitShell";
import ProjectRepositoryEntry from "@/components/exhibition/ProjectRepositoryEntry";
import ProjectRailTools from "@/components/exhibition/ProjectRailTools";
import PrivacyPage from "@/components/privacy/PrivacyPage";
import { privacyRail } from "@/components/privacy/privacyRail";
import { getProject } from "@/lib/projects";
import { projectMetadata } from "@/lib/project-metadata";

// Standalone literal route -- see src/app/projects/frontier-forge/page.tsx's
// comment for why this exists (route-budget regression: next/dynamic()
// inside the shared project catch-all did not actually code-split this
// page's chunk away from the other nine project routes).
export async function generateMetadata(): Promise<Metadata> {
  const project = getProject("ai", "privacy-preflight");
  return project ? projectMetadata(project) : {};
}

export default function PrivacyPreflightRoute() {
  const project = getProject("ai", "privacy-preflight");
  if (!project) notFound();
  return (
    <ExhibitShell mode="auto" repositoryEntry={<ProjectRepositoryEntry project={project} />} rail={privacyRail} railTools={<ProjectRailTools />}>
      <EvidenceScope project="privacy">
        <PrivacyPage project={project} />
      </EvidenceScope>
    </ExhibitShell>
  );
}
