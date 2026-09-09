import { EvidenceScope } from "@/components/exhibition/EvidenceScope.server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExhibitShell } from "@/components/exhibition/ExhibitShell";
import ProjectRepositoryEntry from "@/components/exhibition/ProjectRepositoryEntry";
import ProjectRailTools from "@/components/exhibition/ProjectRailTools";
import AskPage from "@/components/ask/AskPage";
import { askRail } from "@/components/ask/askRail";
import { getProject } from "@/lib/projects";
import { projectMetadata } from "@/lib/project-metadata";

// Task L5 [CLAUDE]: standalone literal route for the user-approved
// dialogue-genre "Ask Portfolio" page (spec §6.7), matching src/app/
// projects/rag-quality-lab/page.tsx's shape exactly -- see that file's
// comment for why standalone routes exist at all (route-budget: a
// next/dynamic() branch inside the shared project catch-all doesn't
// actually code-split). This route was previously unreachable (routeEnabled: false
// in src/lib/projects.ts, per an earlier audit); this task enables it as a
// real page for the first time -- see task-L5-report.md for the
// route-enablement implications (homepage shelf link, search aliases,
// check:links) noted for the Codex 5.2 follow-up task.
export async function generateMetadata(): Promise<Metadata> {
  const project = getProject("ai", "ask-portfolio");
  return project ? projectMetadata(project) : {};
}

export default function AskPortfolioRoute() {
  const project = getProject("ai", "ask-portfolio");
  if (!project) notFound();
  return (
    <ExhibitShell repositoryEntry={<ProjectRepositoryEntry project={project} />} rail={askRail} railTools={<ProjectRailTools />} mode="auto">
      <EvidenceScope project="ask">
        <AskPage project={project} />
      </EvidenceScope>
    </ExhibitShell>
  );
}
