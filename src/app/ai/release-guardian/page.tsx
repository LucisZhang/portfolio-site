import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExhibitShell } from "@/components/exhibition/ExhibitShell";
import ProjectRailTools from "@/components/exhibition/ProjectRailTools";
import GuardianPage from "@/components/guardian/GuardianPage";
import { guardianRail } from "@/components/guardian/guardianRail";
import { readGuardianEvaluationLedgers } from "@/components/guardian/guardianEval.server";
import { getProject } from "@/lib/projects";
import { projectMetadata } from "@/lib/project-metadata";

// Task L1: standalone literal route -- see src/app/ai/frontier-forge/
// page.tsx's comment for why this exists (route-budget regression: a
// next/dynamic() branch inside the shared [track]/[project] catch-all does
// not actually code-split its chunk away from the other project routes).
// This is also the one project route whose Server Component body does
// real work: the two eval ledgers (evaluation-live.csv / evaluation-
// stub.csv) are CSV, not JSON, so they can't be a plain bundler import the
// way recorded-stub-runs.json is inside guardianData.ts -- they are read
// with Node's fs here (a Server Component) and passed down as plain props
// to the "use client" GuardianPage, which needs useI18n() throughout.
export async function generateMetadata(): Promise<Metadata> {
  const project = getProject("ai", "release-guardian");
  return project ? projectMetadata(project) : {};
}

export default function ReleaseGuardianRoute() {
  const project = getProject("ai", "release-guardian");
  if (!project) notFound();
  const { live, stub } = readGuardianEvaluationLedgers();
  return (
    <ExhibitShell rail={guardianRail} railTools={<ProjectRailTools />} mode="auto">
      <GuardianPage project={project} evaluationLive={live} evaluationStub={stub} />
    </ExhibitShell>
  );
}
