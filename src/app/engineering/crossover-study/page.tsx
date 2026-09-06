import { EvidenceScope } from "@/components/exhibition/EvidenceScope.server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExhibitShell } from "@/components/exhibition/ExhibitShell";
import ProjectRepositoryEntry from "@/components/exhibition/ProjectRepositoryEntry";
import ProjectRailTools from "@/components/exhibition/ProjectRailTools";
import CrossoverPage from "@/components/crossover/CrossoverPage";
import { crossoverRail } from "@/components/crossover/crossoverRail";
import { getProject } from "@/lib/projects";
import { projectMetadata } from "@/lib/project-metadata";

// Task L6 [CLAUDE]: standalone literal route -- see src/app/ai/frontier-
// forge/page.tsx's comment for why this exists (route-budget regression:
// next/dynamic() inside the shared [track]/[project] catch-all did not
// actually code-split each page's chunk away from the other project
// routes). Matches src/app/analytics/credit-policy-desk/page.tsx's shape,
// with one difference (like release-guardian's own CSV reads): this
// Server Component reads iceberg-plate.json's raw text itself, the same
// reason release-guardian's page.tsx reads its CSV ledgers via Node's fs.
//
// The committed iceberg-plate.json's `snapshotId` is a real 64-bit
// Iceberg snapshot ID (884031112460958161) that exceeds
// Number.MAX_SAFE_INTEGER -- the normal JSON-module-import path
// (crossoverWorkbenchData.ts, used for every other field) parses it via
// JSON.parse, which silently rounds it to the nearest representable
// double. Reading the raw file text and regex-extracting the digit string
// here, before any JSON.parse touches it, is the only way to pass the
// exact committed value down to CrossoverPage/SqlWorkbench.
async function readIcebergSnapshotId(): Promise<string> {
  const filePath = path.join(process.cwd(), "public/case-studies/crossover-study/workbench/iceberg-plate.json");
  const raw = await readFile(filePath, "utf8");
  const match = raw.match(/"snapshotId"\s*:\s*(\d+)/);
  if (!match) throw new Error("iceberg-plate.json is missing a numeric snapshotId field");
  return match[1];
}

export async function generateMetadata(): Promise<Metadata> {
  const project = getProject("engineering", "crossover-study");
  return project ? projectMetadata(project) : {};
}

export default async function CrossoverStudyRoute() {
  const project = getProject("engineering", "crossover-study");
  if (!project) notFound();
  const icebergSnapshotId = await readIcebergSnapshotId();
  return (
    <ExhibitShell repositoryEntry={<ProjectRepositoryEntry project={project} />} rail={crossoverRail} railTools={<ProjectRailTools />} mode="auto">
      <EvidenceScope project="crossover">
        <CrossoverPage project={project} icebergSnapshotId={icebergSnapshotId} />
      </EvidenceScope>
    </ExhibitShell>
  );
}
