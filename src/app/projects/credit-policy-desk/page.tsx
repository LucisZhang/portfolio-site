import { EvidenceScope } from "@/components/exhibition/EvidenceScope.server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExhibitShell } from "@/components/exhibition/ExhibitShell";
import ProjectRepositoryEntry from "@/components/exhibition/ProjectRepositoryEntry";
import ProjectRailTools from "@/components/exhibition/ProjectRailTools";
import CreditPage from "@/components/credit/CreditPage";
import { creditRail } from "@/components/credit/creditRail";
import { getProject } from "@/lib/projects";
import { projectMetadata } from "@/lib/project-metadata";

// Standalone literal route -- see src/app/projects/frontier-forge/page.tsx's
// comment for why this exists (route-budget regression: next/dynamic()
// inside the shared project catch-all did not actually code-split each
// page's chunk away from the other project routes).
export async function generateMetadata(): Promise<Metadata> {
  const project = getProject("analytics", "credit-policy-desk");
  return project ? projectMetadata(project) : {};
}

export default function CreditPolicyDeskRoute() {
  const project = getProject("analytics", "credit-policy-desk");
  if (!project) notFound();
  return (
    <ExhibitShell repositoryEntry={<ProjectRepositoryEntry project={project} />} rail={creditRail} railTools={<ProjectRailTools />} mode="auto">
      <EvidenceScope project="credit">
        <CreditPage project={project} />
      </EvidenceScope>
    </ExhibitShell>
  );
}
