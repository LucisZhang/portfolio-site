import type { RailSpec } from "@/components/exhibition/ExhibitShell";
import { getProject } from "@/lib/projects";

// Task L6 [CLAUDE]: Crossover Study rail (auto-rail v3, matching ragRail.ts
// / triageRail.ts / guardianRail.ts precedent exactly). Three exhibits: 01
// the cached SQL workbench (the instrument itself), 02 the two main
// curves, 03 source & receipts. No stamp: the project's tier in
// projects.ts is "secondary" (not "archive"), so this rail follows the
// ragRail.ts precedent of carrying no rail-stamp at all rather than
// Margin/Credit's "ARCHIVED" tag, which is specific to their "archive"
// tier.
const crossoverProject = getProject("engineering", "crossover-study");

export const crossoverRail: RailSpec = {
  wordmark: { lines: ["Crossover", "Study"] },
  copy: crossoverProject ? { en: "Run the argument, query by query — cached, and honest about it.", zh: crossoverProject.glossZh } : undefined,
  nav: [
    { id: "exhibit-01", num: "01", label: "SQL workbench" },
    { id: "exhibit-02", num: "02", label: "The two curves" },
    { id: "exhibit-03", num: "03", label: "Source & receipts" },
  ],
  footer: [{ label: "← ALL WORK", href: "/" }],
};

export default crossoverRail;
