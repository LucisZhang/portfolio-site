import type { RailSpec } from "@/components/exhibition/ExhibitShell";
import { getProject } from "@/lib/projects";

// Task L5 [CLAUDE]: Ask Portfolio rail (auto-rail v3, matching ragRail.ts /
// marginRail.ts / guardianRail.ts precedent exactly). Spec §6.7's 3-exhibit
// light prescription mapped onto the dialogue genre: 01 the conversation
// instrument itself, 02 how it answers (retrieval/guard/citation
// provenance), 03 source & report layer (light). No stamp: the project's
// tier in projects.ts is "secondary" (not "archive"), matching triageRail.ts
// / guardianRail.ts / ragRail.ts, which also carry no rail-stamp.
const askProject = getProject("ai", "ask-portfolio");

export const askRail: RailSpec = {
  wordmark: { lines: ["Ask", "Portfolio"] },
  copy: askProject ? { en: "Retrieval over this site's own repositories, cited by file and line.", zh: askProject.glossZh } : undefined,
  nav: [
    { id: "exhibit-01", num: "01", label: "The conversation" },
    { id: "exhibit-02", num: "02", label: "How it answers" },
    { id: "exhibit-03", num: "03", label: "Source & report" },
  ],
  footer: [{ label: "← ALL WORK", href: "/" }],
};

export default askRail;
