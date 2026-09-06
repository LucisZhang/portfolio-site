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

// Standalone literal route -- see src/app/ai/frontier-forge/page.tsx's
// comment for why this exists (route-budget regression: next/dynamic()
// inside the shared [track]/[project] catch-all did not actually
// code-split this page's chunk away from the other nine project routes).
export async function generateMetadata(): Promise<Metadata> {
  const project = getProject("ai", "privacy-preflight");
  return project ? projectMetadata(project) : {};
}

export default function PrivacyPreflightRoute() {
  const project = getProject("ai", "privacy-preflight");
  if (!project) notFound();
  return (
    // Task W3: RAIL-SCOPE.md's verdict for this page is "太空" (collapsed-
    // state hero has no right-column content to fill the freed width),
    // conditioned on content this task does not add ("需补内容 ... 否则本
    // 页保留固定 rail" -- widen the proof card into a multi-example strip,
    // full-width statgrid). W3's scope is the rail mechanic only, not new
    // hero content, so this page stays on the default `mode="fixed"`
    // rather than the task brief's naive forge/eod/triage/privacy list --
    // see task-W3-report.md for the full reasoning.
    <ExhibitShell repositoryEntry={<ProjectRepositoryEntry project={project} />} rail={privacyRail} railTools={<ProjectRailTools />}>
      <EvidenceScope project="privacy">
        <PrivacyPage project={project} />
      </EvidenceScope>
    </ExhibitShell>
  );
}
