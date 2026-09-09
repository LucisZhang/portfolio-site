import type { Metadata } from "next";
import type { Project } from "@/lib/projects";

// Shared <title>/<description> builder for every project route (the shared
// src/app/projects/[slug] catch-all and each standalone route beside it).
// Kept out
// of lib/projects.ts so that module stays framework-agnostic (no "next"
// import), matching the existing split between data and Next-specific glue.
export function projectMetadata(project: Project): Metadata {
  return {
    title: `${project.title.en} | Xiangguo Zhang`,
    description: project.summary.en,
  };
}
