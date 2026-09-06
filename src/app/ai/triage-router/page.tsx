import { EvidenceScope } from "@/components/exhibition/EvidenceScope.server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExhibitShell } from "@/components/exhibition/ExhibitShell";
import ProjectRepositoryEntry from "@/components/exhibition/ProjectRepositoryEntry";
import ProjectRailTools from "@/components/exhibition/ProjectRailTools";
import TriagePage from "@/components/triage/TriagePage";
import { triageRail } from "@/components/triage/triageRail";
import { getProject } from "@/lib/projects";
import { projectMetadata } from "@/lib/project-metadata";

// Standalone literal route -- see src/app/ai/frontier-forge/page.tsx's
// comment for why this exists (route-budget regression: next/dynamic()
// inside the shared [track]/[project] catch-all did not actually
// code-split this page's chunk away from the other nine project routes).
// This route is also where the "onnxruntime-web" string literal used to
// leak into every project route's initial JS: not the actual runtime
// (tierB2Engine.ts only ever `import type`s it), but TriagePage's own
// component tree and its policies.compact.json / samples.curated.json
// fixtures, merged in via the shared-chunk bug above.
export async function generateMetadata(): Promise<Metadata> {
  const project = getProject("ai", "triage-router");
  return project ? projectMetadata(project) : {};
}

export default function TriageRouterRoute() {
  const project = getProject("ai", "triage-router");
  if (!project) notFound();
  return (
    // Task W3 (RAIL-SCOPE.md verdict "尚可" -- auto-rail v3 adopted with the
    // hero-grid max-width cap in triage.css to keep the composition
    // steady across the retracted/pushed content-width swing.
    <ExhibitShell repositoryEntry={<ProjectRepositoryEntry project={project} />} rail={triageRail} railTools={<ProjectRailTools />} mode="auto">
      <EvidenceScope project="triage">
        <TriagePage project={project} />
      </EvidenceScope>
    </ExhibitShell>
  );
}
