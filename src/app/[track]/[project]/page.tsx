import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProjectPageView from "@/components/ProjectPageView";
import { getProject, isTrackId, projects } from "@/lib/projects";

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((project) => ({ track: project.track, project: project.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ track: string; project: string }> }): Promise<Metadata> {
  const { track, project: slug } = await params;
  if (!isTrackId(track)) return {};
  const project = getProject(track, slug);
  return project ? {
    title: `${project.title.en} | Xiangguo Zhang`,
    description: project.summary.en,
    ...(project.slug === "analytics-tandem" ? { robots: { index: false, follow: true } } : {}),
  } : {};
}

export default async function ProjectPage({ params }: { params: Promise<{ track: string; project: string }> }) {
  const { track, project: slug } = await params;
  if (!isTrackId(track)) notFound();
  const project = getProject(track, slug);
  if (!project) notFound();
  return <ProjectPageView project={project} />;
}
