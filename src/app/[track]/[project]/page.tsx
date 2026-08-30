import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExhibitShell } from "@/components/exhibition/ExhibitShell";
import LegacyRailTools from "@/components/exhibition/LegacyRailTools";
import { legacyRail } from "@/components/exhibition/legacyRail";
import ProjectPageView from "@/components/ProjectPageView";
import { getProject, isTrackId, routableProjects } from "@/lib/projects";
import { projectMetadata } from "@/lib/project-metadata";

// This single file compiles to one shared route chunk for the remaining
// (legacy-shell) project slugs (dynamicParams: false).
//
// Route-budget regression fix: frontier-forge, exactly-once-drills,
// triage-router, and privacy-preflight used to be branches here,
// reached through next/dynamic() on the theory that dynamic() would
// code-split each one into its own chunk, loaded only for its own route
// (the comment this replaced cited a verify:performance check as
// "confirming" that for frontier-forge alone). It didn't hold once more
// branches were added: .next/server/app/[track]/[project]/
// page_client-reference-manifest.js showed ForgePage.tsx, EodPage.tsx,
// TriagePage.tsx, and PrivacyPage.tsx all resolving to the SAME chunk id
// as this page module itself, so their component trees and JSON fixtures
// (release.json, policies.compact.json, samples.curated.json, etc.) were
// all merged into the one shared bundle every project route requests --
// including margin-control-tower, credit-policy-desk, and the other
// legacy-shell routes that never render any of those four components.
//
// Those four now live at their own literal routes (src/app/ai/
// frontier-forge/page.tsx, src/app/engineering/exactly-once-drills/
// page.tsx, src/app/ai/triage-router/page.tsx, src/app/ai/
// privacy-preflight/page.tsx), which Next.js resolves in preference to
// this dynamic segment at the same URL and which each compile to their own
// independent webpack entry/chunk -- the same mechanism that already kept
// /artifact's ArtifactViewer (a plain static import there) out of every
// other route's bundle.
//
// Task L2 adds margin-control-tower to the same set: its own literal route
// (src/app/analytics/margin-control-tower/page.tsx) renders the rebuilt
// chart-led Evidence page (MarginPage.tsx) instead of the legacy
// ProjectPageView/ProjectProof/MarginProof workbench shell this catch-all
// still serves for every other still-legacy slug.
//
// Task L1 adds release-guardian to the same set for the same reason plus
// one more -- its rebuilt page reads two CSV eval ledgers via Node's fs in
// its own Server Component (src/app/ai/release-guardian/page.tsx), which
// only that page needs, not the other project routes sharing this file.
//
// Task L3 adds rag-quality-lab to the same set: its own literal route
// (src/app/ai/rag-quality-lab/page.tsx) renders the rebuilt diff/对照
// Drift Lab page (RagPage.tsx) instead of the legacy ProjectPageView/
// ProjectProof/RagProof workbench shell this catch-all still serves for
// every other still-legacy slug.
//
// Task L4 adds credit-policy-desk to the same set, for the same reason as
// Task L2's margin-control-tower entry above: its own literal route
// (src/app/analytics/credit-policy-desk/page.tsx) renders the rebuilt
// chart-led Evidence page (CreditPage.tsx) instead of the legacy
// ProjectPageView/ProjectProof/CreditProof workbench shell this catch-all
// still serves for every other still-legacy slug.
//
// Task L5 adds ask-portfolio to the same set: enabling its route
// (routeEnabled: true in src/lib/projects.ts, previously false/404) makes
// routableProjects include it for the first time, so without this entry
// `next build` generates a second, unreachable static page for
// /ai/ask-portfolio here (confirmed: pre-fix build output listed it under
// both this file's generateStaticParams AND its own literal
// src/app/ai/ask-portfolio/page.tsx). Its own literal route renders the
// user-approved dialogue-genre AskPage.tsx, not this legacy
// ProjectPageView/ProjectProof shell.
//
// Task L6 adds crossover-study to the same set: its own literal route
// (src/app/engineering/crossover-study/page.tsx) renders the rebuilt
// notebook/workbench genre (CrossoverPage.tsx: a cached-state SQL
// workbench, the two main NDCG@10 curves, and source & receipts) instead
// of the legacy ProjectPageView/ProjectProof/CrossoverProof shell this
// catch-all still serves for every other still-legacy slug (after this
// task, only analytics-tandem remains).
const STANDALONE_ROUTE_SLUGS = new Set(["frontier-forge", "exactly-once-drills", "triage-router", "privacy-preflight", "margin-control-tower", "release-guardian", "credit-policy-desk", "rag-quality-lab", "ask-portfolio", "crossover-study"]);

export const dynamicParams = false;

export function generateStaticParams() {
  return routableProjects
    .filter((project) => !STANDALONE_ROUTE_SLUGS.has(project.slug))
    .map((project) => ({ track: project.track, project: project.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ track: string; project: string }> }): Promise<Metadata> {
  const { track, project: slug } = await params;
  if (!isTrackId(track)) return {};
  const project = getProject(track, slug);
  if (!project) return {};
  return {
    ...projectMetadata(project),
    ...(project.slug === "analytics-tandem" ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ track: string; project: string }> }) {
  const { track, project: slug } = await params;
  if (!isTrackId(track)) notFound();
  const project = getProject(track, slug);
  if (!project || STANDALONE_ROUTE_SLUGS.has(project.slug)) notFound();

  return (
    <ExhibitShell rail={legacyRail} railTools={<LegacyRailTools />}>
      <ProjectPageView project={project} />
    </ExhibitShell>
  );
}
